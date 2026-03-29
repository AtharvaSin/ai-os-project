"""Drive Knowledge Scanner — Category B Pipeline.

Runs daily at 06:00 IST via Cloud Scheduler. Scans the AI OS/Knowledge/
Google Drive folder tree for new or modified files, reads content, chunks
by markdown headers and paragraphs, classifies domain from folder path,
and inserts as knowledge_entries.

Entry point: main(request)
Deployment: Cloud Run, python312, asia-south1
Service account: ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com
"""

import hashlib
import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone

import functions_framework
import pg8000
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GCP_PROJECT = "ai-operating-system-490208"
PIPELINE_SLUG = "drive-knowledge-scanner"

# Folder path -> domain/sub_domain mapping
FOLDER_DOMAIN_MAP = {
    "AI OS/Knowledge/System/": {
        "domain": "system",
        "sub_domain": None,
        "project_slug": None,
    },
    "AI OS/Knowledge/Projects/AI-OS/": {
        "domain": "project",
        "sub_domain": "ai-os",
        "project_slug": "ai-os",
    },
    "AI OS/Knowledge/Projects/Bharatvarsh/": {
        "domain": "project",
        "sub_domain": "bharatvarsh",
        "project_slug": "bharatvarsh",
    },
    "AI OS/Knowledge/Projects/AI-and-U/": {
        "domain": "project",
        "sub_domain": "ai-and-u",
        "project_slug": "ai-and-u",
    },
    "AI OS/Knowledge/Projects/Zealogics/": {
        "domain": "project",
        "sub_domain": "zealogics",
        "project_slug": None,
    },
    "AI OS/Knowledge/Personal/": {
        "domain": "personal",
        "sub_domain": None,
        "project_slug": None,
    },
}

# MIME types for Google Docs native export
GOOGLE_DOC_MIME = "application/vnd.google-apps.document"
GOOGLE_FOLDER_MIME = "application/vnd.google-apps.folder"

# File types we can read directly
READABLE_MIME_TYPES = {
    "text/plain",
    "text/markdown",
    "text/x-markdown",
    "application/octet-stream",  # .md files sometimes appear as this
}

# File types we skip (with warning)
SKIP_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.google-apps.spreadsheet",
    "application/vnd.google-apps.presentation",
    "image/png",
    "image/jpeg",
}


# ---------------------------------------------------------------------------
# Secret loading
# ---------------------------------------------------------------------------


def get_secret(name: str) -> str:
    """Load a secret from env vars first, then fall back to Secret Manager."""
    value = os.getenv(name)
    if value:
        return value

    try:
        from google.cloud import secretmanager

        client = secretmanager.SecretManagerServiceClient()
        secret_path = f"projects/{GCP_PROJECT}/secrets/{name}/versions/latest"
        response = client.access_secret_version(request={"name": secret_path})
        return response.payload.data.decode("UTF-8")
    except Exception as e:
        raise RuntimeError(f"Could not load secret '{name}': {e}") from e


# ---------------------------------------------------------------------------
# Database connection
# ---------------------------------------------------------------------------


def get_connection():
    """Connect to Cloud SQL via Auth Proxy sidecar Unix socket (Cloud Run)
    or TCP localhost (local dev with cloud-sql-proxy)."""
    instance = os.getenv(
        "DB_INSTANCE", "bharatvarsh-website:us-central1:bharatvarsh-db"
    )
    unix_sock = f"/cloudsql/{instance}/.s.PGSQL.5432"
    db_password = get_secret("AI_OS_DB_PASSWORD")

    # Detect Cloud Run environment
    if os.getenv("K_SERVICE"):
        return pg8000.connect(
            user=os.getenv("DB_USER", "ai_os_admin"),
            password=db_password,
            database=os.getenv("DB_NAME", "ai_os"),
            unix_sock=unix_sock,
        )

    # Fallback to TCP localhost (local dev with cloud-sql-proxy)
    return pg8000.connect(
        user=os.getenv("DB_USER", "ai_os_admin"),
        password=db_password,
        database=os.getenv("DB_NAME", "ai_os"),
        host="127.0.0.1",
        port=5432,
    )


# ---------------------------------------------------------------------------
# Google Drive API
# ---------------------------------------------------------------------------


def get_drive_service():
    """Build Google Drive API v3 service from OAuth credentials."""
    client_id = get_secret("GOOGLE_CLIENT_ID")
    client_secret = get_secret("GOOGLE_CLIENT_SECRET")
    refresh_token = get_secret("GOOGLE_REFRESH_TOKEN")

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        client_id=client_id,
        client_secret=client_secret,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=["https://www.googleapis.com/auth/drive"],
    )
    return build("drive", "v3", credentials=creds)


def resolve_folder_id(drive_service, folder_path: str) -> str | None:
    """Navigate a slash-delimited path from root to find the Drive folder ID.

    Example: "AI OS/Knowledge/System/" navigates AI OS -> Knowledge -> System.
    Returns the final folder's Drive ID, or None if any segment is missing.
    """
    segments = [s for s in folder_path.strip("/").split("/") if s]
    parent_id = "root"

    for segment in segments:
        query = (
            f"name='{segment}' and '{parent_id}' in parents "
            f"and mimeType='{GOOGLE_FOLDER_MIME}' and trashed=false"
        )
        results = (
            drive_service.files()
            .list(q=query, fields="files(id, name)", pageSize=10)
            .execute()
        )
        files = results.get("files", [])
        if not files:
            logger.warning(
                "Folder segment '%s' not found under parent %s (path: %s)",
                segment,
                parent_id,
                folder_path,
            )
            return None
        parent_id = files[0]["id"]

    return parent_id


def list_modified_files(
    drive_service, folder_id: str, since: datetime | None
) -> list[dict]:
    """List files in a Drive folder modified since a given timestamp.

    Args:
        drive_service: Google Drive API service object.
        folder_id: The Drive folder ID to scan.
        since: Only return files modified after this time. If None, return all.

    Returns:
        List of file metadata dicts with id, name, mimeType, modifiedTime.
    """
    query = f"'{folder_id}' in parents and trashed=false"
    if since:
        since_str = since.strftime("%Y-%m-%dT%H:%M:%S")
        query += f" and modifiedTime > '{since_str}'"

    all_files = []
    page_token = None

    while True:
        results = (
            drive_service.files()
            .list(
                q=query,
                fields="nextPageToken, files(id, name, mimeType, modifiedTime)",
                pageSize=100,
                pageToken=page_token,
            )
            .execute()
        )
        all_files.extend(results.get("files", []))
        page_token = results.get("nextPageToken")
        if not page_token:
            break

    return all_files


def read_file_content(drive_service, file_id: str, mime_type: str) -> str | None:
    """Read file content from Google Drive.

    Google Docs are exported as text/plain. Markdown and text files are
    downloaded directly. PDFs and other binary formats are skipped.

    Returns:
        File content as string, or None if the format is unsupported.
    """
    if mime_type == GOOGLE_DOC_MIME:
        content = (
            drive_service.files()
            .export(fileId=file_id, mimeType="text/plain")
            .execute()
        )
        if isinstance(content, bytes):
            return content.decode("utf-8", errors="replace")
        return content

    if mime_type in READABLE_MIME_TYPES:
        content = drive_service.files().get_media(fileId=file_id).execute()
        if isinstance(content, bytes):
            return content.decode("utf-8", errors="replace")
        return content

    # Check file extension for .md and .txt that may have generic mime types
    return None


# ---------------------------------------------------------------------------
# Content chunking
# ---------------------------------------------------------------------------


def chunk_content(text: str, filename: str) -> list[dict]:
    """Split content into knowledge-entry-sized chunks.

    Strategy:
    1. Try splitting by markdown headers (##, ###) first.
    2. If no headers, split by paragraphs with 600-word max chunks.
    3. Chunks below 30 words are discarded.

    Returns:
        List of dicts with title, content, chunk_index.
    """
    chunks = []

    # Strip the file extension from filename for cleaner titles
    base_name = re.sub(r"\.(md|txt|gdoc)$", "", filename, flags=re.IGNORECASE)

    # Try splitting by markdown headers
    sections = re.split(r"\n(?=#{1,3}\s)", text)

    if len(sections) > 1:
        for i, section in enumerate(sections):
            header_match = re.match(r"^(#{1,3})\s+(.+)", section)
            if header_match:
                header = header_match.group(2).strip()
                body = section[header_match.end() :].strip()
            else:
                header = f"Section {i + 1}"
                body = section.strip()

            if len(body.split()) >= 30:
                chunks.append(
                    {
                        "title": f"{base_name} -- {header}",
                        "content": body,
                        "chunk_index": i,
                    }
                )
    else:
        # No headers -- split by double newlines (paragraphs)
        paragraphs = text.split("\n\n")
        current_chunk = []
        current_words = 0
        chunk_idx = 0

        for para in paragraphs:
            para_stripped = para.strip()
            if not para_stripped:
                continue
            words = len(para_stripped.split())
            if current_words + words > 600 and current_chunk:
                chunk_text = "\n\n".join(current_chunk)
                if len(chunk_text.split()) >= 30:
                    chunks.append(
                        {
                            "title": f"{base_name} -- Part {chunk_idx + 1}",
                            "content": chunk_text,
                            "chunk_index": chunk_idx,
                        }
                    )
                current_chunk = [para_stripped]
                current_words = words
                chunk_idx += 1
            else:
                current_chunk.append(para_stripped)
                current_words += words

        # Flush remaining paragraphs
        if current_chunk:
            chunk_text = "\n\n".join(current_chunk)
            if len(chunk_text.split()) >= 30:
                chunks.append(
                    {
                        "title": f"{base_name} -- Part {chunk_idx + 1}",
                        "content": chunk_text,
                        "chunk_index": chunk_idx,
                    }
                )

    # If the entire file was too small but >= 30 words, keep as single chunk
    if not chunks and len(text.split()) >= 30:
        chunks.append(
            {
                "title": base_name,
                "content": text.strip(),
                "chunk_index": 0,
            }
        )

    return chunks


# ---------------------------------------------------------------------------
# Source type classification
# ---------------------------------------------------------------------------


def classify_source_type(domain_info: dict, filename: str) -> str:
    """Determine source_type from domain and filename keywords.

    Returns a valid source_type enum value.
    """
    domain = domain_info["domain"]
    filename_lower = filename.lower()

    if domain == "personal":
        if "journal" in filename_lower or "diary" in filename_lower:
            return "journal_entry"
        if "goal" in filename_lower:
            return "goal"
        if "trip" in filename_lower or "travel" in filename_lower:
            return "event_record"
        if "preference" in filename_lower:
            return "preference"
        return "manual"

    if domain == "system":
        if "decision" in filename_lower:
            return "decision"
        if "lesson" in filename_lower or "retro" in filename_lower:
            return "lesson_learned"
        return "reference"

    if domain == "project":
        return "reference"

    return "manual"


# ---------------------------------------------------------------------------
# Tag extraction
# ---------------------------------------------------------------------------


def extract_tags(filename: str) -> list[str]:
    """Extract tags from filename by splitting on separators.

    Converts "AI_OS_Knowledge_Layer_V2.md" -> ["ai-os", "knowledge", "layer", "v2"]
    Filters out very short tokens (< 2 chars).
    """
    base_name = re.sub(r"\.(md|txt|gdoc|docx|pdf)$", "", filename, flags=re.IGNORECASE)
    # Split on underscores, hyphens, spaces, and camelCase boundaries
    tokens = re.split(r"[_\-\s]+", base_name)
    tags = []
    for token in tokens:
        cleaned = token.strip().lower()
        if len(cleaned) >= 2:
            tags.append(cleaned)
    return tags


# ---------------------------------------------------------------------------
# Project ID resolution
# ---------------------------------------------------------------------------


def resolve_project_id(cursor, project_slug: str | None) -> str | None:
    """Look up the project UUID by slug. Returns None if slug is None or not found."""
    if not project_slug:
        return None

    cursor.execute(
        "SELECT id FROM projects WHERE slug = %s",
        (project_slug,),
    )
    row = cursor.fetchone()
    return str(row[0]) if row else None


# ---------------------------------------------------------------------------
# File ingestion
# ---------------------------------------------------------------------------


def _compute_content_hash(title: str, content: str) -> str:
    """Compute SHA-256 hash matching the embedding model input format."""
    text = f"{title}\n\n{content}"
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def ingest_file(
    cursor,
    file_id: str,
    file_name: str,
    content: str,
    modified_time: str,
    domain_info: dict,
    project_id: str | None,
) -> dict:
    """Ingest a Drive file into knowledge_entries with content-hash deduplication.

    Instead of blindly deleting all existing chunks and re-inserting:
      1. Chunk the new content and compute content_hash for each chunk.
      2. Load existing entries for this drive_file_id with their content_hash.
      3. Match new chunks to existing entries by (drive_file_id, chunk_index).
      4. Skip unchanged chunks (same hash) — preserving their embeddings.
      5. Update changed chunks in-place (preserving UUID, triggering re-embed).
      6. Insert brand-new chunks.
      7. Delete orphaned entries (old chunks beyond the new chunk count).

    Returns:
        Dict with counts: {inserted, updated, skipped, deleted}.
    """
    # Chunk the new content
    chunks = chunk_content(content, file_name)
    if not chunks:
        logger.info("File '%s' produced no valid chunks (too short)", file_name)
        # Still delete any old entries for this file
        cursor.execute(
            "DELETE FROM knowledge_entries WHERE drive_file_id = %s",
            (file_id,),
        )
        return {"inserted": 0, "updated": 0, "skipped": 0, "deleted": 0}

    source_type = classify_source_type(domain_info, file_name)
    tags = extract_tags(file_name)

    # Compute hashes for all new chunks
    for chunk in chunks:
        chunk["content_hash"] = _compute_content_hash(chunk["title"], chunk["content"])

    # Load existing entries for this file, keyed by chunk_index
    cursor.execute(
        """
        SELECT id, metadata, content_hash
        FROM knowledge_entries
        WHERE drive_file_id = %s
        ORDER BY (metadata->>'chunk_index')::int ASC
        """,
        (file_id,),
    )
    existing_rows = cursor.fetchall()
    existing_by_index: dict[int, dict] = {}
    for row in existing_rows:
        cols = [desc[0] for desc in cursor.description]
        entry = dict(zip(cols, row))
        meta = entry.get("metadata")
        if isinstance(meta, str):
            meta = json.loads(meta)
        idx = meta.get("chunk_index") if meta else None
        if idx is not None:
            existing_by_index[int(idx)] = entry

    inserted = 0
    updated = 0
    skipped = 0

    for chunk in chunks:
        idx = chunk["chunk_index"]
        new_hash = chunk["content_hash"]
        existing = existing_by_index.pop(idx, None)

        metadata_json = json.dumps(
            {
                "drive_file_id": file_id,
                "chunk_index": idx,
                "original_filename": file_name,
                "last_modified": modified_time,
            }
        )

        if existing and existing.get("content_hash") == new_hash:
            # Content unchanged — skip (preserves existing embedding)
            skipped += 1
            continue

        if existing:
            # Content changed — update in-place (same UUID, triggers re-embed
            # because updated_at will advance past embedding's updated_at)
            cursor.execute(
                """
                UPDATE knowledge_entries
                SET title = %s, content = %s, content_hash = %s,
                    domain = %s, sub_domain = %s, source_type = %s,
                    project_id = %s, tags = %s, metadata = %s,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (
                    chunk["title"],
                    chunk["content"],
                    new_hash,
                    domain_info["domain"],
                    domain_info.get("sub_domain"),
                    source_type,
                    project_id,
                    tags,
                    metadata_json,
                    str(existing["id"]),
                ),
            )
            updated += 1
        else:
            # New chunk — insert
            entry_id = str(uuid.uuid4())
            cursor.execute(
                """
                INSERT INTO knowledge_entries
                    (id, title, content, content_hash, domain, sub_domain,
                     source_type, project_id, drive_file_id, tags, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    entry_id,
                    chunk["title"],
                    chunk["content"],
                    new_hash,
                    domain_info["domain"],
                    domain_info.get("sub_domain"),
                    source_type,
                    project_id,
                    file_id,
                    tags,
                    metadata_json,
                ),
            )
            inserted += 1

    # Delete orphaned entries (old chunks that no longer exist in the file)
    deleted = 0
    for orphan in existing_by_index.values():
        cursor.execute(
            "DELETE FROM knowledge_entries WHERE id = %s",
            (str(orphan["id"]),),
        )
        deleted += 1

    return {"inserted": inserted, "updated": updated, "skipped": skipped, "deleted": deleted}


# ---------------------------------------------------------------------------
# Scan state management
# ---------------------------------------------------------------------------


def get_scan_states(cursor) -> list[dict]:
    """Read all folder scan states from drive_scan_state table.

    Returns list of dicts with id, folder_path, drive_folder_id, last_scanned_at,
    files_processed.
    """
    cursor.execute(
        """
        SELECT id, folder_path, drive_folder_id, last_scanned_at, files_processed
        FROM drive_scan_state
        ORDER BY folder_path
        """
    )
    rows = cursor.fetchall()
    if not rows:
        return []

    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in rows]


def update_scan_state(
    cursor,
    state_id: str,
    drive_folder_id: str | None,
    files_processed: int,
    last_file_count: int,
):
    """Update drive_scan_state after scanning a folder."""
    cursor.execute(
        """
        UPDATE drive_scan_state
        SET last_scanned_at = NOW(),
            drive_folder_id = %s,
            files_processed = files_processed + %s,
            last_file_count = %s
        WHERE id = %s
        """,
        (
            drive_folder_id,
            files_processed,
            last_file_count,
            str(state_id),
        ),
    )


# ---------------------------------------------------------------------------
# Ingestion job logging
# ---------------------------------------------------------------------------


def log_ingestion_job(
    cursor,
    entries_created: int,
    entries_updated: int,
    entries_failed: int,
    status: str,
    source_description: str | None = None,
    error_log: str | None = None,
):
    """Log the scan run to knowledge_ingestion_jobs table."""
    job_id = str(uuid.uuid4())
    metadata = json.dumps(
        {
            "entries_created": entries_created,
            "entries_updated": entries_updated,
            "entries_failed": entries_failed,
        }
    )
    cursor.execute(
        """
        INSERT INTO knowledge_ingestion_jobs
            (id, job_type, status, source_description,
             entries_created, entries_updated, entries_failed,
             completed_at, error_log, metadata)
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s)
        """,
        (
            job_id,
            "drive_scan",
            status,
            source_description,
            entries_created,
            entries_updated,
            entries_failed,
            error_log,
            metadata,
        ),
    )
    return job_id


# ---------------------------------------------------------------------------
# Pipeline run logging
# ---------------------------------------------------------------------------


def log_pipeline_run(cursor, start_time, status, summary, error_msg=None):
    """Log to pipeline_runs table if the pipeline is registered."""
    try:
        duration_ms = int(
            (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        )
        run_id = str(uuid.uuid4())

        cursor.execute(
            "SELECT id FROM pipelines WHERE slug = %s",
            (PIPELINE_SLUG,),
        )
        pipeline_row = cursor.fetchone()

        if pipeline_row:
            cursor.execute(
                """INSERT INTO pipeline_runs
                   (id, pipeline_id, status, trigger_type, triggered_by,
                    started_at, completed_at, duration_ms,
                    output_summary, error_message)
                   VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s)""",
                (
                    run_id,
                    str(pipeline_row[0]),
                    status,
                    "scheduled",
                    "cloud-scheduler",
                    start_time.isoformat(),
                    duration_ms,
                    summary,
                    error_msg,
                ),
            )
    except Exception:
        # Pipeline may not be registered yet -- fail gracefully
        pass


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


@functions_framework.http
def main(request):
    """Entry point for the Drive Knowledge Scanner pipeline.

    Scans configured Google Drive folders for new/modified files, reads and
    chunks their content, and inserts into knowledge_entries.
    """
    start_time = datetime.now(timezone.utc)
    total_files_scanned = 0
    total_entries_created = 0
    total_entries_failed = 0
    folders_scanned = 0
    errors = []

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Build Google Drive service
        drive_service = get_drive_service()

        # Read scan states for all tracked folders
        scan_states = get_scan_states(cursor)

        if not scan_states:
            logger.warning("No folder paths found in drive_scan_state table")
            return (
                json.dumps({
                    "status": "success",
                    "message": "No folders configured for scanning",
                }),
                200,
                {"Content-Type": "application/json"},
            )

        for state in scan_states:
            folder_path = state["folder_path"]

            # Skip the root "AI OS/Knowledge/" entry -- subfolders cover everything
            if folder_path == "AI OS/Knowledge/":
                continue

            # Look up domain mapping
            domain_info = FOLDER_DOMAIN_MAP.get(folder_path)
            if not domain_info:
                logger.warning(
                    "No domain mapping for folder path: %s", folder_path
                )
                continue

            try:
                # Resolve Drive folder ID (use cached value or navigate fresh)
                folder_id = state.get("drive_folder_id")
                if not folder_id:
                    folder_id = resolve_folder_id(drive_service, folder_path)
                    if not folder_id:
                        logger.warning(
                            "Could not resolve folder: %s", folder_path
                        )
                        errors.append(
                            f"Folder not found: {folder_path}"
                        )
                        continue

                # List files modified since last scan
                last_scanned = state.get("last_scanned_at")
                modified_files = list_modified_files(
                    drive_service, folder_id, last_scanned
                )

                logger.info(
                    "Folder '%s': found %d modified files",
                    folder_path,
                    len(modified_files),
                )

                # Resolve project_id for this domain
                project_id = resolve_project_id(
                    cursor, domain_info.get("project_slug")
                )

                folder_entries_created = 0
                folder_files_processed = 0

                for file_info in modified_files:
                    file_id = file_info["id"]
                    file_name = file_info["name"]
                    mime_type = file_info["mimeType"]
                    modified_time = file_info.get("modifiedTime", "")

                    # Skip unsupported formats
                    if mime_type in SKIP_MIME_TYPES:
                        logger.info(
                            "Skipping unsupported format: %s (%s)",
                            file_name,
                            mime_type,
                        )
                        continue

                    # Skip folders (subfolder scanning is handled per-path)
                    if mime_type == GOOGLE_FOLDER_MIME:
                        continue

                    try:
                        # Read file content
                        content = read_file_content(
                            drive_service, file_id, mime_type
                        )

                        if content is None:
                            # Try reading as plain text for unknown types
                            # (some .md files have non-standard mime types)
                            try:
                                raw = (
                                    drive_service.files()
                                    .get_media(fileId=file_id)
                                    .execute()
                                )
                                if isinstance(raw, bytes):
                                    content = raw.decode(
                                        "utf-8", errors="replace"
                                    )
                                else:
                                    content = raw
                            except Exception:
                                logger.warning(
                                    "Cannot read file: %s (mime: %s)",
                                    file_name,
                                    mime_type,
                                )
                                continue

                        if not content or not content.strip():
                            logger.info(
                                "Empty file skipped: %s", file_name
                            )
                            continue

                        # Ingest the file (chunk + diff + upsert)
                        result = ingest_file(
                            cursor=cursor,
                            file_id=file_id,
                            file_name=file_name,
                            content=content,
                            modified_time=modified_time,
                            domain_info=domain_info,
                            project_id=project_id,
                        )

                        folder_entries_created += result["inserted"]
                        folder_files_processed += 1
                        total_files_scanned += 1

                        logger.info(
                            "Ingested '%s': %d new, %d updated, %d skipped, %d deleted",
                            file_name,
                            result["inserted"],
                            result["updated"],
                            result["skipped"],
                            result["deleted"],
                        )

                    except Exception as e:
                        total_entries_failed += 1
                        error_msg = f"File '{file_name}' ({file_id}): {e}"
                        errors.append(error_msg)
                        logger.error("File ingestion error: %s", error_msg)

                # Update scan state for this folder
                update_scan_state(
                    cursor=cursor,
                    state_id=state["id"],
                    drive_folder_id=folder_id,
                    files_processed=folder_files_processed,
                    last_file_count=len(modified_files),
                )

                total_entries_created += folder_entries_created
                folders_scanned += 1
                conn.commit()

            except Exception as e:
                error_msg = f"Folder '{folder_path}': {e}"
                errors.append(error_msg)
                logger.error("Folder scan error: %s", error_msg)

        # Log ingestion job
        job_status = "success" if not errors else "failed"
        source_desc = f"Drive scan: {folders_scanned} folders, {total_files_scanned} files"
        error_log_text = "; ".join(errors) if errors else None

        log_ingestion_job(
            cursor=cursor,
            entries_created=total_entries_created,
            entries_updated=0,
            entries_failed=total_entries_failed,
            status=job_status,
            source_description=source_desc,
            error_log=error_log_text,
        )

        # Log pipeline run
        summary = (
            f"Folders: {folders_scanned}, "
            f"Files: {total_files_scanned}, "
            f"Entries created: {total_entries_created}, "
            f"Errors: {len(errors)}"
        )
        log_pipeline_run(
            cursor, start_time, job_status, summary,
            error_log_text,
        )

        conn.commit()
        cursor.close()
        conn.close()

        return (
            json.dumps({
                "status": "success" if not errors else "partial_failure",
                "folders_scanned": folders_scanned,
                "files_processed": total_files_scanned,
                "entries_created": total_entries_created,
                "entries_failed": total_entries_failed,
                "errors": errors,
            }),
            200,
            {"Content-Type": "application/json"},
        )

    except Exception as e:
        error_msg = str(e)
        logger.error("Pipeline fatal error: %s", error_msg)

        # Attempt to log the failure
        try:
            conn_err = get_connection()
            cursor_err = conn_err.cursor()
            log_ingestion_job(
                cursor=cursor_err,
                entries_created=total_entries_created,
                entries_updated=0,
                entries_failed=total_entries_failed,
                status="failed",
                source_description="Drive scan (fatal error)",
                error_log=error_msg,
            )
            log_pipeline_run(
                cursor_err, start_time, "failed", None, error_msg
            )
            conn_err.commit()
            cursor_err.close()
            conn_err.close()
        except Exception:
            pass  # Best-effort error logging

        return (
            json.dumps({
                "status": "error",
                "error": error_msg,
                "folders_scanned": folders_scanned,
                "files_processed": total_files_scanned,
                "entries_created": total_entries_created,
                "entries_failed": total_entries_failed,
            }),
            500,
            {"Content-Type": "application/json"},
        )
