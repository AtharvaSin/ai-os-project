"""Google Drive read integration for AI OS MCP Gateway.

Enables Claude.ai and Claude Code to discover and read files from Google
Drive without leaving the conversation. Supports folder browsing, file
content reading, and change summaries cross-referenced with the knowledge
layer.

Drive folder hierarchy scanned:
  AI OS/Knowledge/System/
  AI OS/Knowledge/Projects/{AI-OS,Bharatvarsh,AI-and-U,Zealogics}/
  AI OS/Knowledge/Personal/
"""

from __future__ import annotations

import json
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from fastmcp import FastMCP

NOT_CONFIGURED_MSG = json.dumps({
    "error": "Google OAuth not configured",
    "detail": "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.",
})

# MIME type constants
GOOGLE_DOC_MIME = "application/vnd.google-apps.document"
GOOGLE_SHEET_MIME = "application/vnd.google-apps.spreadsheet"
GOOGLE_FOLDER_MIME = "application/vnd.google-apps.folder"

# MIME types we can read directly
READABLE_MIME_TYPES = {
    "text/plain",
    "text/markdown",
    "text/x-markdown",
    "text/csv",
    "application/octet-stream",  # .md files sometimes appear as this
}

# MIME types we return metadata only (no content extraction)
METADATA_ONLY_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.google-apps.presentation",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/svg+xml",
    "video/mp4",
    "audio/mpeg",
}

# Drive file_type filter -> MIME query fragments
FILE_TYPE_QUERIES = {
    "document": (
        f"(mimeType='{GOOGLE_DOC_MIME}' or mimeType='text/plain' "
        f"or mimeType='text/markdown' or mimeType='text/x-markdown' "
        f"or mimeType='application/octet-stream')"
    ),
    "spreadsheet": f"mimeType='{GOOGLE_SHEET_MIME}'",
    "text": (
        "(mimeType='text/plain' or mimeType='text/markdown' "
        "or mimeType='text/x-markdown')"
    ),
    "pdf": "mimeType='application/pdf'",
    "image": (
        "(mimeType='image/png' or mimeType='image/jpeg' "
        "or mimeType='image/gif' or mimeType='image/svg+xml')"
    ),
}


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
    """Register Google Drive read tools on the MCP server."""

    def _get_drive_service():
        from app.auth.google_oauth import get_service
        return get_service("drive", "v3")

    async def _resolve_folder_path(service, path: str) -> str | None:
        """Navigate a slash-delimited path to find the Drive folder ID.

        Read-only: returns None if any segment is missing (does NOT create).
        Example: "AI OS/Knowledge/System" -> folder ID or None.
        """
        from app.auth.google_oauth import run_google_api

        segments = [s for s in path.strip("/").split("/") if s]
        parent_id = "root"

        for segment in segments:
            query = (
                f"name='{segment}' and '{parent_id}' in parents "
                f"and mimeType='{GOOGLE_FOLDER_MIME}' and trashed=false"
            )
            result = await run_google_api(
                service.files().list(
                    q=query, spaces="drive", fields="files(id, name)", pageSize=1
                ).execute
            )
            files = result.get("files", [])
            if not files:
                return None
            parent_id = files[0]["id"]

        return parent_id

    @mcp.tool(
        description="List files in a Google Drive folder. "
        "Resolves folder_path (slash-delimited, e.g. 'AI OS/Knowledge/System') "
        "to a Drive folder ID. Optionally filter by modification date and file type. "
        "Returns JSON array of file metadata: name, id, mimeType, modifiedTime, size, webViewLink. "
        "file_type: 'document'|'spreadsheet'|'text'|'pdf'|'image'. "
        "Returns: {folder_path, file_count, files: [{id, name, mimeType, modifiedTime, size, webViewLink}], _meta}. "
        "Example: list_drive_files(folder_path='AI OS/Knowledge/System', file_type='document', modified_since='2026-03-01')"
    )
    async def list_drive_files(
        folder_path: str,
        modified_since: str | None = None,
        file_type: str | None = None,
    ) -> str:
        service = _get_drive_service()
        if not service:
            return NOT_CONFIGURED_MSG

        try:
            from app.auth.google_oauth import run_google_api

            # Resolve folder path to Drive ID
            folder_id = await _resolve_folder_path(service, folder_path)
            if not folder_id:
                return json.dumps({
                    "error": f"Folder not found: {folder_path}",
                    "detail": "Check that the folder path exists in Google Drive.",
                })

            # Build query
            query = f"'{folder_id}' in parents and trashed=false"

            # Exclude folders from results
            query += f" and mimeType!='{GOOGLE_FOLDER_MIME}'"

            # Optional modification filter
            if modified_since:
                query += f" and modifiedTime > '{modified_since}'"

            # Optional file type filter
            if file_type and file_type in FILE_TYPE_QUERIES:
                query += f" and {FILE_TYPE_QUERIES[file_type]}"

            # Paginated listing
            all_files: list[dict] = []
            page_token = None
            fields = "nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink)"

            while True:
                result = await run_google_api(
                    service.files().list(
                        q=query,
                        fields=fields,
                        pageSize=100,
                        orderBy="modifiedTime desc",
                        pageToken=page_token,
                    ).execute
                )
                all_files.extend(result.get("files", []))
                page_token = result.get("nextPageToken")
                if not page_token:
                    break

            return json.dumps({
                "folder_path": folder_path,
                "file_count": len(all_files),
                "files": all_files,
                "_meta": {"related_tools": ["read_drive_file", "get_drive_changes_summary"]},
            })

        except Exception as exc:
            return json.dumps({"error": f"Failed to list files: {exc}"})

    @mcp.tool(
        description="Read the content of a Google Drive file by its file ID. "
        "Google Docs are exported as plain text. Google Sheets are exported as CSV. "
        "Markdown and text files are downloaded directly. "
        "PDFs, images, and other binary formats return metadata only (name, type, size, link). "
        "Content is truncated at max_chars (default 50000) with a truncation notice. "
        "Returns: {name, mimeType, modifiedTime, charCount, truncated, content} or {name, mimeType, ..., content: null, note} for binary files. "
        "Example: read_drive_file(file_id='1aBcDeFgHiJkLmNoPqRsT', max_chars=20000)"
    )
    async def read_drive_file(
        file_id: str,
        max_chars: int = 50000,
    ) -> str:
        service = _get_drive_service()
        if not service:
            return NOT_CONFIGURED_MSG

        try:
            from app.auth.google_oauth import run_google_api

            # Get file metadata first
            file_meta = await run_google_api(
                service.files().get(
                    fileId=file_id,
                    fields="id, name, mimeType, modifiedTime, size, webViewLink",
                ).execute
            )

            name = file_meta.get("name", "unknown")
            mime_type = file_meta.get("mimeType", "")
            modified_time = file_meta.get("modifiedTime", "")
            size = file_meta.get("size", "0")
            web_link = file_meta.get("webViewLink", "")

            # Metadata-only types (binary files)
            if mime_type in METADATA_ONLY_TYPES:
                return json.dumps({
                    "name": name,
                    "mimeType": mime_type,
                    "modifiedTime": modified_time,
                    "size": size,
                    "webViewLink": web_link,
                    "content": None,
                    "note": "Binary file — content not extractable. Use webViewLink to view.",
                })

            # Read content based on MIME type
            content = None

            if mime_type == GOOGLE_DOC_MIME:
                # Export Google Doc as plain text
                raw = await run_google_api(
                    service.files().export(
                        fileId=file_id, mimeType="text/plain"
                    ).execute
                )
                content = raw.decode("utf-8", errors="replace") if isinstance(raw, bytes) else raw

            elif mime_type == GOOGLE_SHEET_MIME:
                # Export Google Sheet as CSV
                raw = await run_google_api(
                    service.files().export(
                        fileId=file_id, mimeType="text/csv"
                    ).execute
                )
                content = raw.decode("utf-8", errors="replace") if isinstance(raw, bytes) else raw

            elif mime_type in READABLE_MIME_TYPES:
                # Download text/markdown directly
                raw = await run_google_api(
                    service.files().get_media(fileId=file_id).execute
                )
                content = raw.decode("utf-8", errors="replace") if isinstance(raw, bytes) else raw

            else:
                # Try downloading as raw bytes for unknown text types
                try:
                    raw = await run_google_api(
                        service.files().get_media(fileId=file_id).execute
                    )
                    content = raw.decode("utf-8", errors="replace") if isinstance(raw, bytes) else raw
                except Exception:
                    return json.dumps({
                        "name": name,
                        "mimeType": mime_type,
                        "modifiedTime": modified_time,
                        "size": size,
                        "webViewLink": web_link,
                        "content": None,
                        "note": f"Unsupported MIME type: {mime_type}. Use webViewLink to view.",
                    })

            # Truncate if needed
            truncated = False
            char_count = len(content) if content else 0
            if content and len(content) > max_chars:
                content = content[:max_chars] + f"\n\n[TRUNCATED at {max_chars} chars]"
                truncated = True

            return json.dumps({
                "name": name,
                "mimeType": mime_type,
                "modifiedTime": modified_time,
                "charCount": char_count,
                "truncated": truncated,
                "content": content,
            })

        except Exception as exc:
            return json.dumps({"error": f"Failed to read file: {exc}"})

    @mcp.tool(
        description="Get a summary of Google Drive changes across all tracked Knowledge folders. "
        "Cross-references with knowledge_entries to classify each file as 'new' (no matching entry), "
        "'modified' (entry exists but file has newer modifiedTime), or 'ingested' (up-to-date). "
        "Uses the drive_scan_state table for tracked folder paths. "
        "Returns a grouped summary by folder path. "
        "Status values: 'new' (no matching knowledge entry), 'modified' (entry exists but Drive file is newer), 'ingested' (up-to-date). "
        "Returns: {days_back, cutoff, totals: {new, modified, ingested, folders_scanned}, folders: {path: [{file_name, file_id, mimeType, modified, status}]}, _meta}. "
        "Example: get_drive_changes_summary(days_back=7)"
    )
    async def get_drive_changes_summary(
        days_back: int = 30,
    ) -> str:
        service = _get_drive_service()
        if not service:
            return NOT_CONFIGURED_MSG

        pool = get_pool()
        try:
            from app.auth.google_oauth import run_google_api

            async with pool.acquire() as conn:
                # Read all tracked folder paths from drive_scan_state
                scan_states = await conn.fetch(
                    "SELECT folder_path, drive_folder_id, last_scanned_at "
                    "FROM drive_scan_state ORDER BY folder_path"
                )

                if not scan_states:
                    return json.dumps({
                        "error": "No folders configured in drive_scan_state table",
                        "detail": "Seed the drive_scan_state table with folder paths first.",
                    })

                cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
                cutoff_str = cutoff.strftime("%Y-%m-%dT%H:%M:%S")

                summary: dict[str, list[dict]] = {}
                totals = {"new": 0, "modified": 0, "ingested": 0, "folders_scanned": 0}

                for state in scan_states:
                    folder_path = state["folder_path"]

                    # Skip the root "AI OS/Knowledge/" entry
                    if folder_path == "AI OS/Knowledge/":
                        continue

                    # Resolve folder ID (use cached or navigate fresh)
                    folder_id = state["drive_folder_id"]
                    if not folder_id:
                        folder_id = await _resolve_folder_path(service, folder_path)
                        if not folder_id:
                            summary[folder_path] = [{
                                "error": f"Folder not found in Drive: {folder_path}"
                            }]
                            continue

                    # List files modified in the last N days
                    query = (
                        f"'{folder_id}' in parents and trashed=false "
                        f"and mimeType!='{GOOGLE_FOLDER_MIME}' "
                        f"and modifiedTime > '{cutoff_str}'"
                    )

                    all_files: list[dict] = []
                    page_token = None

                    while True:
                        result = await run_google_api(
                            service.files().list(
                                q=query,
                                fields="nextPageToken, files(id, name, mimeType, modifiedTime)",
                                pageSize=100,
                                pageToken=page_token,
                            ).execute
                        )
                        all_files.extend(result.get("files", []))
                        page_token = result.get("nextPageToken")
                        if not page_token:
                            break

                    # Cross-reference with knowledge_entries
                    folder_files: list[dict] = []

                    for f in all_files:
                        file_id = f["id"]
                        file_modified = f.get("modifiedTime", "")

                        # Check if this file has been ingested
                        entry = await conn.fetchrow(
                            "SELECT id, updated_at, metadata FROM knowledge_entries "
                            "WHERE drive_file_id = $1 LIMIT 1",
                            file_id,
                        )

                        if not entry:
                            status = "new"
                            totals["new"] += 1
                        else:
                            # Compare modification times
                            entry_updated = entry["updated_at"]
                            try:
                                file_dt = datetime.fromisoformat(
                                    file_modified.replace("Z", "+00:00")
                                )
                                if entry_updated and file_dt > entry_updated:
                                    status = "modified"
                                    totals["modified"] += 1
                                else:
                                    status = "ingested"
                                    totals["ingested"] += 1
                            except (ValueError, TypeError):
                                status = "modified"
                                totals["modified"] += 1

                        folder_files.append({
                            "file_name": f["name"],
                            "file_id": file_id,
                            "mimeType": f.get("mimeType", ""),
                            "modified": file_modified,
                            "status": status,
                        })

                    summary[folder_path] = folder_files
                    totals["folders_scanned"] += 1

                return json.dumps({
                    "days_back": days_back,
                    "cutoff": cutoff_str,
                    "totals": totals,
                    "folders": summary,
                    "_meta": {"related_tools": ["read_drive_file", "list_drive_files"], "action_hint": "Use read_drive_file on 'new' or 'modified' files to ingest updates."},
                })

        except Exception as exc:
            return json.dumps({"error": f"Failed to get changes summary: {exc}"})
