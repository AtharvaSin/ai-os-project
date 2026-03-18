"""Save the composed brief as a Google Doc in the Daily Briefs folder."""

from __future__ import annotations

import io
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from googleapiclient.http import MediaIoBaseUpload

logger = logging.getLogger(__name__)

IST = timezone(timedelta(hours=5, minutes=30))


def _find_or_create_folder(
    drive_service: Any,
    folder_path: str,
) -> str:
    """Navigate/create folder hierarchy and return the leaf folder ID.

    folder_path: "AI OS/Artifacts/Daily-Briefs"
    """
    parts = [p.strip() for p in folder_path.split("/") if p.strip()]
    parent_id = "root"

    for part in parts:
        query = (
            f"name='{part}' "
            f"and mimeType='application/vnd.google-apps.folder' "
            f"and '{parent_id}' in parents "
            f"and trashed=false"
        )
        results = drive_service.files().list(
            q=query, fields="files(id, name)", pageSize=1
        ).execute()
        files = results.get("files", [])

        if files:
            parent_id = files[0]["id"]
        else:
            # Create folder
            metadata = {
                "name": part,
                "mimeType": "application/vnd.google-apps.folder",
                "parents": [parent_id],
            }
            folder = drive_service.files().create(
                body=metadata, fields="id"
            ).execute()
            parent_id = folder["id"]
            logger.info("Created Drive folder: %s (id=%s)", part, parent_id)

    return parent_id


def _log_artifact(conn: Any, drive_file_id: str, drive_url: str, doc_name: str) -> None:
    """Log the brief as an artifact in the database (best-effort)."""
    try:
        cursor = conn.cursor()
        # Get AI OS project ID
        cursor.execute("SELECT id FROM projects WHERE slug = 'ai-os'")
        row = cursor.fetchone()
        if not row:
            return
        project_id = row[0]

        cursor.execute(
            """
            INSERT INTO artifacts (project_id, name, artifact_type, url, description, drive_file_id, drive_url)
            VALUES (%s, %s, 'document', %s, 'Auto-generated daily intelligence brief', %s, %s)
            """,
            (str(project_id), doc_name, drive_url, drive_file_id, drive_url),
        )
        conn.commit()
    except Exception as exc:
        logger.warning("Failed to log artifact: %s", exc)


def deliver(
    drive_service: Any,
    brief_text: str,
    folder_path: str,
    db_conn: Any | None = None,
) -> tuple[str, str]:
    """Save brief to Google Drive and return (drive_url, file_id).

    Raises on failure so caller can handle gracefully.
    """
    now = datetime.now(IST)
    doc_name = f"Daily Brief \u2014 {now.strftime('%a, %d %b %Y')}"

    # Find or create folder hierarchy
    folder_id = _find_or_create_folder(drive_service, folder_path)

    # Upload as plain text → auto-convert to Google Doc
    media = MediaIoBaseUpload(
        io.BytesIO(brief_text.encode("utf-8")),
        mimetype="text/plain",
        resumable=False,
    )
    file_metadata = {
        "name": doc_name,
        "parents": [folder_id],
        "mimeType": "application/vnd.google-apps.document",
    }

    created_file = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id,webViewLink",
    ).execute()

    file_id = created_file["id"]
    drive_url = created_file.get("webViewLink", "")

    logger.info("Brief saved to Drive: %s (%s)", doc_name, drive_url)

    # Log artifact (best-effort)
    if db_conn:
        _log_artifact(db_conn, file_id, drive_url, doc_name)

    return drive_url, file_id
