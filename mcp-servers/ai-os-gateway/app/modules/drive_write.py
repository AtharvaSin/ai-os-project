"""Google Drive write integration for AI OS MCP Gateway.

Uploads Claude-generated documents to organized Drive folders and logs
artifact metadata in Cloud SQL. Drive folder hierarchy:
  AI OS/AI Operating System/{PRDs,Architecture,Decision Memos,Session Artifacts}/
  AI OS/AI&U/{Scripts,Thumbnails,Research}/
  AI OS/Bharatvarsh/{Marketing,Lore Docs,Content}/
  AI OS/Zealogics/{Project Docs,Deliverables}/
"""

from __future__ import annotations

import base64
import io
import json
import mimetypes
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from fastmcp import FastMCP

NOT_CONFIGURED_MSG = json.dumps({
    "error": "Google OAuth not configured",
    "detail": "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.",
})

# Maps project slug to expected Drive subfolder names
PROJECT_FOLDERS = {
    "ai-operating-system": "AI Operating System",
    "ai-and-u": "AI&U",
    "bharatvarsh": "Bharatvarsh",
    "zealogics": "Zealogics",
}

ROOT_FOLDER_NAME = "AI OS"


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


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register Google Drive write tools on the MCP server."""

    def _get_drive_service():
        from app.auth.google_oauth import get_service
        return get_service("drive", "v3")

    async def _find_or_create_folder(
        service, name: str, parent_id: str | None = None
    ) -> str:
        """Find a folder by name under parent, or create it. Returns folder ID."""
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
            return files[0]["id"]

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
        return folder["id"]

    async def _resolve_project_folder(
        service, project_slug: str, subfolder: str | None = None
    ) -> str:
        """Navigate the folder hierarchy and return the target folder ID."""
        # Root: "AI OS"
        root_id = await _find_or_create_folder(service, ROOT_FOLDER_NAME)

        # Project folder
        project_name = PROJECT_FOLDERS.get(project_slug, project_slug)
        project_id = await _find_or_create_folder(service, project_name, root_id)

        # Optional subfolder
        if subfolder:
            return await _find_or_create_folder(service, subfolder, project_id)

        return project_id

    @mcp.tool(
        description="Upload a file to Google Drive in the correct project folder. "
        "Supports both text and binary files. For text, pass file_content (string). "
        "For binary (images, PDFs, DOCX, etc.), pass base64_content (base64-encoded string). "
        "Provide exactly one of file_content or base64_content. "
        "mime_type is auto-detected from filename if omitted. "
        "Resolves the target folder from project_slug and optional subfolder "
        "(e.g., 'PRDs', 'Architecture', 'Scripts'). "
        "Logs the artifact in Cloud SQL with drive_file_id and drive_url. "
        "Returns the artifact record with the Drive URL for sharing."
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
                "error": "Provide either file_content (text) or base64_content (binary)."
            })

        # Resolve file bytes and MIME type
        if base64_content:
            try:
                file_bytes = base64.b64decode(base64_content)
            except Exception as exc:
                return json.dumps({"error": f"Invalid base64_content: {exc}"})
            resolved_mime = (
                mime_type
                or mimetypes.guess_type(filename)[0]
                or "application/octet-stream"
            )
        else:
            file_bytes = file_content.encode("utf-8")
            resolved_mime = (
                mime_type
                or mimetypes.guess_type(filename)[0]
                or "text/plain"
            )

        service = _get_drive_service()
        if not service:
            return NOT_CONFIGURED_MSG

        pool = get_pool()
        try:
            from app.auth.google_oauth import run_google_api
            from googleapiclient.http import MediaIoBaseUpload

            async with pool.acquire() as conn:
                # Verify project exists
                project = await conn.fetchrow(
                    "SELECT id, name FROM projects WHERE slug = $1", project_slug
                )
                if not project:
                    return json.dumps({"error": f"Project '{project_slug}' not found"})

                # Resolve Drive folder
                folder_id = await _resolve_project_folder(service, project_slug, subfolder)

                # Upload the file
                media = MediaIoBaseUpload(
                    io.BytesIO(file_bytes),
                    mimetype=resolved_mime,
                    resumable=len(file_bytes) > 5 * 1024 * 1024,
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

                drive_url = uploaded.get("webViewLink", "")
                drive_file_id = uploaded["id"]

                # Log artifact in Cloud SQL
                artifact_id = str(uuid.uuid4())
                # Determine artifact type from file extension
                ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
                type_map = {
                    "md": "document", "txt": "document", "pdf": "document",
                    "py": "code", "ts": "code", "js": "code",
                    "json": "config", "yaml": "config", "yml": "config",
                    "png": "media", "jpg": "media", "svg": "design",
                }
                artifact_type = type_map.get(ext, "other")

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

                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Upload failed: {exc}"})

    @mcp.tool(
        description="Create a Google Doc in the project's Drive folder. "
        "Converts content to Google Doc format for collaborative editing. "
        "Logs the artifact in Cloud SQL. Returns the Drive URL."
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
                folder_id = await _resolve_project_folder(service, project_slug, subfolder)

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

                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Doc creation failed: {exc}"})

    @mcp.tool(
        description="Create a new folder in Google Drive. "
        "Can be nested under an existing parent path. "
        "Returns the folder ID and URL."
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
