"""Google Drive write integration for AI OS MCP Gateway.

Uploads Claude-generated documents to organized Drive folders and logs
artifact metadata in Cloud SQL. Canonical Drive structure:
  AI OS/Artifacts/{Daily-Briefs,Architecture,Instructions,Brand-Templates,Reports}/
  AI OS/Weekly-Reviews/
Knowledge/ is scanner-input only — never write artifacts there.
"""

from __future__ import annotations

import base64
import io
import json
import logging
import mimetypes
import time
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from fastmcp import FastMCP

logger = logging.getLogger(__name__)

NOT_CONFIGURED_MSG = json.dumps({
    "error": "Google OAuth not configured",
    "detail": "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.",
})

# Canonical artifact subfolder names — matches the immutable Drive schema.
# Keys are the subfolder param values accepted by upload_file / create_doc.
ARTIFACT_SUBFOLDERS = {
    "Daily-Briefs", "Architecture", "Instructions",
    "Brand-Templates", "Reports",
    # Brand-Templates children
    "Brand-Templates/context-a-ai-os",
    "Brand-Templates/context-b-bharatvarsh",
    "Brand-Templates/context-c-portfolio",
    # Top-level (under AI OS/ directly, not Artifacts/)
    "Weekly-Reviews",
}

# Legacy aliases → canonical subfolder (backwards compat for existing callers)
_SUBFOLDER_ALIASES: dict[str, str] = {
    "PRDs": "Architecture",
    "Implementation Plans": "Architecture",
    "Decision Memos": "Architecture",
    "Session Artifacts": "Architecture",
    "Scripts": "Architecture",
    "Thumbnails": "Brand-Templates",
    "Research": "Reports",
    "Marketing": "Reports",
    "Lore Docs": "Architecture",
    "Content": "Reports",
    "Project Docs": "Architecture",
    "Deliverables": "Reports",
}

ROOT_FOLDER_NAME = "AI OS"

# Explicit MIME map — mimetypes.guess_type() is unreliable in minimal Docker images
_MIME_MAP: dict[str, str] = {
    # Microsoft Office
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".ppt": "application/vnd.ms-powerpoint",
    # Documents
    ".pdf": "application/pdf",
    ".csv": "text/csv",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".json": "application/json",
    ".yaml": "text/yaml",
    ".yml": "text/yaml",
    # Images
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    # Video / Audio
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    # Archives
    ".zip": "application/zip",
    ".gz": "application/gzip",
}


def _guess_mime_type(filename: str, fallback: str = "application/octet-stream") -> str:
    """Return MIME type for *filename* using the explicit map, with stdlib fallback."""
    dot = filename.rfind(".")
    if dot != -1:
        ext = filename[dot:].lower()
        if ext in _MIME_MAP:
            return _MIME_MAP[ext]
    # Fall back to stdlib (works on most systems for common types)
    guessed = mimetypes.guess_type(filename)[0]
    return guessed or fallback


def _serialize(value: Any) -> Any:
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, dict):
        return {k: _serialize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialize(v) for v in value]
    return value


def _row_to_dict(record) -> dict[str, Any]:
    return {k: _serialize(v) for k, v in dict(record).items()}


def _get_drive_service():
    """Get authenticated Google Drive API service."""
    from app.auth.google_oauth import get_service
    return get_service("drive", "v3")


# --- Folder ID cache (avoids 2-3 Google API calls per upload) ---
_folder_cache: dict[str, tuple[str, float]] = {}
_FOLDER_CACHE_TTL = 600  # 10 minutes


def _get_cached_folder(key: str) -> str | None:
    """Return cached folder ID if still valid, else None."""
    entry = _folder_cache.get(key)
    if entry:
        folder_id, ts = entry
        if time.monotonic() - ts < _FOLDER_CACHE_TTL:
            return folder_id
        del _folder_cache[key]
    return None


def _set_cached_folder(key: str, folder_id: str) -> None:
    _folder_cache[key] = (folder_id, time.monotonic())


async def _find_or_create_folder(
    service, name: str, parent_id: str | None = None
) -> str:
    """Find a folder by name under parent, or create it. Returns folder ID."""
    cache_key = f"{parent_id or 'root'}:{name}"
    cached = _get_cached_folder(cache_key)
    if cached:
        logger.debug("Folder cache hit: %s -> %s", cache_key, cached)
        return cached

    from app.auth.google_oauth import run_google_api

    query = f"name = '{name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    if parent_id:
        query += f" and '{parent_id}' in parents"

    result = await run_google_api(
        service.files().list(
            q=query, spaces="drive", fields="files(id, name)", pageSize=1
        ).execute
    )
    files = result.get("files", [])

    if files:
        folder_id = files[0]["id"]
        _set_cached_folder(cache_key, folder_id)
        return folder_id

    # Create the folder
    body: dict[str, Any] = {
        "name": name,
        "mimeType": "application/vnd.google-apps.folder",
    }
    if parent_id:
        body["parents"] = [parent_id]

    folder = await run_google_api(
        service.files().create(body=body, fields="id").execute
    )
    folder_id = folder["id"]
    _set_cached_folder(cache_key, folder_id)
    return folder_id


async def _resolve_artifact_folder(
    service, subfolder: str | None = None
) -> str:
    """Navigate to AI OS/Artifacts/{subfolder} and return the target folder ID.

    All artifacts go under AI OS/Artifacts/. The subfolder param selects
    the leaf directory. Legacy subfolder names are aliased to canonical names.
    """
    canonical = _SUBFOLDER_ALIASES.get(subfolder, subfolder) if subfolder else None
    if canonical and canonical not in ARTIFACT_SUBFOLDERS:
        logger.warning(
            "Unknown subfolder '%s' (resolved: '%s') — rejecting to prevent ad-hoc folders. "
            "Valid: %s. Legacy aliases: %s",
            subfolder, canonical,
            sorted(ARTIFACT_SUBFOLDERS), sorted(_SUBFOLDER_ALIASES),
        )
        raise ValueError(
            f"Unknown subfolder '{subfolder}'. "
            f"Valid subfolders: {sorted(ARTIFACT_SUBFOLDERS)}. "
            f"Legacy aliases accepted: {sorted(_SUBFOLDER_ALIASES)}."
        )
    path_key = f"artifact:{canonical or ''}"
    cached = _get_cached_folder(path_key)
    if cached:
        logger.debug("Path cache hit: %s -> %s", path_key, cached)
        return cached

    root_id = await _find_or_create_folder(service, ROOT_FOLDER_NAME)

    # Weekly-Reviews lives directly under AI OS/, not under Artifacts/
    if canonical == "Weekly-Reviews":
        folder_id = await _find_or_create_folder(service, "Weekly-Reviews", root_id)
    elif canonical:
        artifacts_id = await _find_or_create_folder(service, "Artifacts", root_id)
        # Handle nested paths like "Brand-Templates/context-a-ai-os"
        parts = [p.strip() for p in canonical.split("/") if p.strip()]
        folder_id = artifacts_id
        for part in parts:
            folder_id = await _find_or_create_folder(service, part, folder_id)
    else:
        folder_id = await _find_or_create_folder(service, "Artifacts", root_id)

    _set_cached_folder(path_key, folder_id)
    return folder_id


# File extension → artifact_type mapping
_EXT_TYPE_MAP = {
    "md": "document", "txt": "document", "pdf": "document",
    "docx": "document", "doc": "document",
    "py": "code", "ts": "code", "js": "code",
    "json": "config", "yaml": "config", "yml": "config",
    "png": "media", "jpg": "media", "jpeg": "media",
    "gif": "media", "webp": "media", "svg": "design",
    "xlsx": "document", "xls": "document",
    "pptx": "document", "ppt": "document",
    "csv": "document",
}


async def upload_file_bytes(
    file_bytes: bytes,
    filename: str,
    project_slug: str,
    get_pool,
    mime_type: str | None = None,
    subfolder: str | None = None,
) -> dict[str, Any]:
    """Core upload logic — uploads bytes to Drive and logs artifact in DB.

    Used by both the MCP tool (text/base64) and the HTTP multipart endpoint.
    Returns a dict with the artifact record + drive metadata.
    Raises ValueError for validation errors, RuntimeError for upload errors.
    """
    t_start = time.monotonic()
    resolved_mime = mime_type or _guess_mime_type(filename)

    service = _get_drive_service()
    if not service:
        raise RuntimeError("Google OAuth not configured")

    from app.auth.google_oauth import run_google_api
    from googleapiclient.http import MediaIoBaseUpload

    pool = get_pool()
    async with pool.acquire() as conn:
        project = await conn.fetchrow(
            "SELECT id, name FROM projects WHERE slug = $1", project_slug
        )
        if not project:
            raise ValueError(f"Project '{project_slug}' not found")

        t_folder = time.monotonic()
        folder_id = await _resolve_artifact_folder(service, subfolder)
        logger.info(
            "upload %s: folder resolved in %.1fms",
            filename, (time.monotonic() - t_folder) * 1000,
        )

        t_upload = time.monotonic()
        media = MediaIoBaseUpload(
            io.BytesIO(file_bytes),
            mimetype=resolved_mime,
            resumable=len(file_bytes) > 256 * 1024,
        )
        file_metadata: dict[str, Any] = {
            "name": filename,
            "parents": [folder_id],
        }
        uploaded = await run_google_api(
            service.files().create(
                body=file_metadata,
                media_body=media,
                fields="id, name, webViewLink, mimeType, size",
            ).execute
        )
        logger.info(
            "upload %s: Drive upload (%d bytes) in %.1fms",
            filename, len(file_bytes), (time.monotonic() - t_upload) * 1000,
        )

        drive_url = uploaded.get("webViewLink", "")
        drive_file_id = uploaded["id"]

        artifact_id = str(uuid.uuid4())
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        artifact_type = _EXT_TYPE_MAP.get(ext, "other")

        record = await conn.fetchrow(
            "INSERT INTO artifacts (id, project_id, name, artifact_type, "
            "file_path, url, description, metadata) "
            "VALUES ($1::uuid, $2::uuid, $3, $4::artifact_type, "
            "$5, $6, $7, $8::jsonb) RETURNING *",
            artifact_id, str(project["id"]), filename, artifact_type,
            f"drive://{drive_file_id}", drive_url,
            f"Uploaded to Drive/{project['name']}/{subfolder or ''}",
            json.dumps({"drive_file_id": drive_file_id, "drive_folder_id": folder_id}),
        )

        result = _row_to_dict(record)
        result["drive_url"] = drive_url
        result["drive_file_id"] = drive_file_id
        result["_meta"] = {"action": "uploaded", "related_tools": ["list_drive_files", "read_drive_file"]}

        logger.info(
            "upload %s: total %.1fms",
            filename, (time.monotonic() - t_start) * 1000,
        )
        return result


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register Google Drive write tools on the MCP server."""

    @mcp.tool(
        description="Upload a file to Google Drive under AI OS/Artifacts/{subfolder}. "
        "Supports two modes:\n"
        "1. TEXT FILES (preferred): Pass file_content as a string. Best for Markdown, code, "
        "JSON, YAML, CSV, plain text. No size limit concerns.\n"
        "2. SMALL BINARY FILES (<50 KB): Pass base64_content as a base64-encoded string. "
        "Suitable for small images, icons, or tiny PDFs.\n"
        "For LARGE BINARY FILES (>50 KB — DOCX, PDF, XLSX, PPTX, images, ZIP): "
        "Claude Code should use the HTTP endpoint instead: "
        "curl -X POST https://ai-os-gateway-1054489801008.asia-south1.run.app/api/upload "
        "-H 'Authorization: Bearer $MCP_GATEWAY_API_KEY' "
        "-F 'file=@myfile.docx' -F 'project_slug=...' -F 'subfolder=...'. "
        "mime_type is auto-detected from filename if omitted. "
        "All artifacts go to AI OS/Artifacts/. The subfolder param selects the leaf: "
        "'Architecture', 'Daily-Briefs', 'Instructions', 'Reports', "
        "'Brand-Templates/context-a-ai-os'. Legacy names (PRDs, Scripts) are auto-aliased. "
        "project_slug is used for DB artifact logging only, not folder routing. "
        "Logs the artifact in Cloud SQL with drive_file_id and drive_url. "
        "Returns: {id, project_id, name, artifact_type, drive_url, drive_file_id, _meta}. "
        "Example: upload_file(filename='architecture.md', project_slug='ai-operating-system', "
        "file_content='# Architecture...', subfolder='Architecture')"
    )
    async def upload_file(
        filename: str,
        project_slug: str,
        file_content: str | None = None,
        base64_content: str | None = None,
        mime_type: str | None = None,
        subfolder: str | None = None,
    ) -> str:
        if not file_content and not base64_content:
            return json.dumps({
                "error": "Provide file_content (text string) or base64_content (base64 for small binaries <50KB). "
                "For large binary files, use POST /api/upload with multipart form data from Claude Code."
            })

        if base64_content:
            try:
                file_bytes = base64.b64decode(base64_content)
            except Exception as exc:
                return json.dumps({"error": f"Invalid base64_content: {exc}"})
            resolved_mime = mime_type or _guess_mime_type(filename)
        else:
            file_bytes = file_content.encode("utf-8")
            resolved_mime = mime_type or _guess_mime_type(filename, fallback="text/plain")

        try:
            result = await upload_file_bytes(
                file_bytes=file_bytes,
                filename=filename,
                project_slug=project_slug,
                get_pool=get_pool,
                mime_type=resolved_mime,
                subfolder=subfolder,
            )
            return json.dumps(result)
        except (ValueError, RuntimeError) as exc:
            return json.dumps({"error": str(exc)})
        except Exception as exc:
            return json.dumps({"error": f"Upload failed: {exc}"})

    @mcp.tool(
        description="Create a Google Doc under AI OS/Artifacts/{subfolder}. "
        "Converts content to Google Doc format for collaborative editing. "
        "Logs the artifact in Cloud SQL. Returns the Drive URL. "
        "The content is uploaded as text/plain and converted to Google Doc format for collaborative editing. "
        "All artifacts go to AI OS/Artifacts/. subfolder selects the leaf: "
        "'Architecture', 'Daily-Briefs', 'Instructions', 'Reports'. Legacy names auto-aliased. "
        "project_slug is used for DB artifact logging only, not folder routing. "
        "Returns: {id, project_id, name, artifact_type, file_path, url, description, metadata, drive_url, drive_file_id, _meta}. "
        "Example: create_doc(title='Sprint 11 PRD', content='# Sprint 11...', project_slug='ai-operating-system', subfolder='Architecture')"
    )
    async def create_doc(
        title: str,
        content: str,
        project_slug: str,
        subfolder: str | None = None,
    ) -> str:
        service = _get_drive_service()
        if not service:
            return NOT_CONFIGURED_MSG

        pool = get_pool()
        try:
            from app.auth.google_oauth import run_google_api
            from googleapiclient.http import MediaIoBaseUpload

            async with pool.acquire() as conn:
                # Verify project
                project = await conn.fetchrow(
                    "SELECT id, name FROM projects WHERE slug = $1", project_slug
                )
                if not project:
                    return json.dumps({"error": f"Project '{project_slug}' not found"})

                # Resolve folder
                folder_id = await _resolve_artifact_folder(service, subfolder)

                # Create Google Doc by uploading text/plain with conversion
                media = MediaIoBaseUpload(
                    io.BytesIO(content.encode("utf-8")),
                    mimetype="text/plain",
                    resumable=False,
                )
                doc_metadata: dict[str, Any] = {
                    "name": title,
                    "parents": [folder_id],
                    "mimeType": "application/vnd.google-apps.document",
                }
                doc = await run_google_api(
                    service.files().create(
                        body=doc_metadata,
                        media_body=media,
                        fields="id, name, webViewLink",
                    ).execute
                )

                drive_url = doc.get("webViewLink", "")
                drive_file_id = doc["id"]

                # Log artifact
                artifact_id = str(uuid.uuid4())
                record = await conn.fetchrow(
                    "INSERT INTO artifacts (id, project_id, name, artifact_type, "
                    "file_path, url, description, metadata) "
                    "VALUES ($1::uuid, $2::uuid, $3, 'document'::artifact_type, "
                    "$4, $5, $6, $7::jsonb) RETURNING *",
                    artifact_id, str(project["id"]), title,
                    f"drive://{drive_file_id}", drive_url,
                    f"Google Doc in Drive/{project['name']}/{subfolder or ''}",
                    json.dumps({"drive_file_id": drive_file_id, "format": "google_doc"}),
                )

                result = _row_to_dict(record)
                result["drive_url"] = drive_url
                result["drive_file_id"] = drive_file_id
                result["_meta"] = {"action": "created", "related_tools": ["read_drive_file", "list_drive_files"]}

                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Doc creation failed: {exc}"})

    @mcp.tool(
        description="Create a new folder in Google Drive. "
        "Can be nested under an existing parent path. "
        "Returns the folder ID and URL. "
        "parent_path: slash-delimited path (e.g., 'AI OS/Bharatvarsh/Marketing'). Creates intermediate folders if missing. "
        "Returns: {folder_id, name, url}. "
        "Example: create_drive_folder(name='Thumbnails', parent_path='AI OS/AI&U')"
    )
    async def create_drive_folder(
        name: str,
        parent_path: str | None = None,
    ) -> str:
        service = _get_drive_service()
        if not service:
            return NOT_CONFIGURED_MSG

        try:
            from app.auth.google_oauth import run_google_api

            parent_id = None
            if parent_path:
                # Navigate the path: "AI OS/Bharatvarsh/Marketing"
                parts = [p.strip() for p in parent_path.split("/") if p.strip()]
                for part in parts:
                    parent_id = await _find_or_create_folder(service, part, parent_id)

            folder_id = await _find_or_create_folder(service, name, parent_id)

            # Get folder URL
            folder = await run_google_api(
                service.files().get(
                    fileId=folder_id, fields="id, name, webViewLink"
                ).execute
            )

            return json.dumps({
                "folder_id": folder["id"],
                "name": folder.get("name", name),
                "url": folder.get("webViewLink", ""),
            })
        except Exception as exc:
            return json.dumps({"error": f"Folder creation failed: {exc}"})
