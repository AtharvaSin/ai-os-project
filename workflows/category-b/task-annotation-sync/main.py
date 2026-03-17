"""Task Annotation Sync — Category B Pipeline.

Runs every 15 minutes via Cloud Scheduler. Performs full two-way sync between
Google Tasks and Cloud SQL:
  1. Completion sync: Google completed → DB done
  2. Field-level merge: title, due_date (last-write-wins via updated_at)
  3. Annotation capture: user notes below delimiter → task_annotations table
  4. Discovery: phone-created tasks imported into DB
  5. Notes reconciliation: rebuild system zone after field changes

Entry point: main(request)
Deployment: Cloud Run, python3.12, asia-south1
Service account: ai-os-cloud-functions@ai-operating-system-490208.iam.gserviceaccount.com
"""

import hashlib
import json
import logging
import os
import uuid
from datetime import datetime, timezone

import functions_framework
import pg8000
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("task-annotation-sync")

# Must be byte-for-byte identical to gateway constant
NOTES_DELIMITER = '--- YOUR NOTES BELOW ---'
NOTES_MARKER = 'YOUR NOTES BELOW'

PRIORITY_PREFIXES = {
    "urgent": "[URGENT] ",
    "high": "[HIGH] ",
}


def get_connection():
    """Connect to Cloud SQL via Auth Proxy sidecar Unix socket (Cloud Run)
    or TCP localhost (local dev with cloud-sql-proxy)."""
    instance = os.getenv(
        "DB_INSTANCE", "bharatvarsh-website:us-central1:bharatvarsh-db"
    )
    unix_sock = f"/cloudsql/{instance}/.s.PGSQL.5432"

    # Try Unix socket first (Cloud Run with Auth Proxy sidecar)
    if os.path.exists(f"/cloudsql/{instance}"):
        return pg8000.connect(
            user=os.getenv("DB_USER", "ai_os_admin"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "ai_os"),
            unix_sock=unix_sock,
        )
    # Fallback to TCP localhost (local dev with cloud-sql-proxy)
    return pg8000.connect(
        user=os.getenv("DB_USER", "ai_os_admin"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "ai_os"),
        host="127.0.0.1",
        port=5432,
    )


def get_tasks_service():
    """Build Google Tasks API service via OAuth refresh token."""
    refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN")
    if not refresh_token:
        return None

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        client_id=os.getenv("GOOGLE_CLIENT_ID", ""),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET", ""),
        token_uri="https://oauth2.googleapis.com/token",
    )
    return build("tasks", "v1", credentials=creds)


def _has_delimiter(notes: str) -> bool:
    """Check if notes contain any form of the delimiter (current or legacy)."""
    if not notes:
        return False
    return NOTES_DELIMITER in notes or NOTES_MARKER in notes


def extract_user_zone(notes: str) -> str:
    """Extract user-written content below the notes delimiter.

    Two-tier matching: exact delimiter first, then fuzzy marker match.
    """
    if not notes:
        return ''

    # Tier 1: Exact delimiter match
    if NOTES_DELIMITER in notes:
        return notes.split(NOTES_DELIMITER, 1)[1].lstrip('\n')

    # Tier 2: Fuzzy match on marker text
    if NOTES_MARKER in notes:
        idx = notes.index(NOTES_MARKER) + len(NOTES_MARKER)
        rest = notes[idx:]
        newline_pos = rest.find('\n')
        if newline_pos != -1:
            return rest[newline_pos + 1:].lstrip('\n')
        return ''

    return ''


def build_notes_header(
    task_id: str,
    domain_name: str,
    priority: str,
    due_date: str | None,
    description: str | None = None,
    existing_notes: str | None = None,
) -> str:
    """Build system zone for Google Tasks notes field.

    ASCII-only formatting. Preserves user zone. Handles legacy tasks.
    """
    lines = [
        f'[{priority.upper()}] {domain_name}',
        f'Due: {due_date or "not set"}  |  ID: {task_id[:8]}',
    ]
    if description and description.strip():
        brief = description.strip()[:120]
        if len(description.strip()) > 120:
            brief += '...'
        lines.append('')
        lines.append(brief)
    lines.append('')
    lines.append(NOTES_DELIMITER)

    header = '\n'.join(lines)

    # Preserve existing user zone
    user_zone = extract_user_zone(existing_notes or '')

    # Legacy handling: if no delimiter found but notes exist,
    # treat entire existing notes as user content
    if not user_zone.strip() and existing_notes and existing_notes.strip():
        if not _has_delimiter(existing_notes):
            user_zone = existing_notes.strip()

    if user_zone.strip():
        return f'{header}\n{user_zone}'
    return header


def _prefixed_title(title: str, priority: str) -> str:
    """Add priority prefix to task title for Google Tasks display."""
    prefix = PRIORITY_PREFIXES.get(priority, "")
    return f"{prefix}{title}"


def _parse_jsonb(value):
    """Ensure a JSONB value from pg8000 is a Python dict."""
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value
    return value


def _rows_to_dicts(cursor):
    """Convert pg8000 cursor results to list of dicts."""
    cols = [desc[0] for desc in cursor.description]
    return [dict(zip(cols, r)) for r in cursor.fetchall()]


@functions_framework.http
def main(request):
    """Entry point for the Task Annotation Sync Cloud Run service."""
    start_time = datetime.now(timezone.utc)
    errors = []
    annotations_captured = 0
    completions_synced = 0
    fields_updated = 0
    tasks_imported = 0
    tasks_checked = 0

    try:
        conn = get_connection()
        cursor = conn.cursor()

        service = get_tasks_service()
        if not service:
            return {
                "error": "Google OAuth not configured",
                "tasks_checked": 0,
            }, 500

        # ── Phase 1: Field-level merge for existing DB tasks ──
        cursor.execute("""
            SELECT t.id, t.title, t.description, t.status::text AS status,
                   t.priority::text AS priority, t.due_date, t.updated_at,
                   t.metadata, d.name AS domain_name
            FROM tasks t
            LEFT JOIN life_domains d ON t.domain_id = d.id
            WHERE t.metadata->>'google_task_id' IS NOT NULL
              AND t.status NOT IN ('done', 'cancelled')
        """)
        tasks = _rows_to_dicts(cursor)
        tasks_checked = len(tasks)
        logger.info("Phase 1: checking %d existing tasks", tasks_checked)

        for task in tasks:
            meta = _parse_jsonb(task["metadata"]) or {}
            google_task_id = meta.get("google_task_id")
            google_list_id = meta.get("google_task_list_id")

            if not google_task_id or not google_list_id:
                logger.info("Task %s: missing google IDs, skipping", task["id"])
                continue

            try:
                gtask = (
                    service.tasks()
                    .get(tasklist=google_list_id, task=google_task_id)
                    .execute()
                )

                # 1. COMPLETION SYNC
                if gtask.get("status") == "completed":
                    cursor.execute(
                        "UPDATE tasks SET status = 'done'::task_status, "
                        "completed_at = NOW(), updated_at = NOW() "
                        "WHERE id = %s::uuid",
                        (str(task["id"]),),
                    )
                    conn.commit()
                    completions_synced += 1
                    logger.info("Task %s: marked completed from Google", task["id"])
                    continue

                # Timestamp comparison for field merge
                google_updated_str = gtask.get("updated", "")
                google_updated = None
                if google_updated_str:
                    google_updated = datetime.fromisoformat(
                        google_updated_str.replace("Z", "+00:00")
                    )
                db_updated = task.get("updated_at")
                if db_updated and isinstance(db_updated, datetime):
                    if not db_updated.tzinfo:
                        db_updated = db_updated.replace(tzinfo=timezone.utc)

                field_updates = {}
                needs_notes_rebuild = False

                # 2. TITLE SYNC
                google_title = gtask.get("title", "")
                for prefix in ["[URGENT] ", "[HIGH] "]:
                    if google_title.startswith(prefix):
                        google_title = google_title[len(prefix):]
                        break
                if (google_title and google_title != task.get("title")
                        and google_updated and db_updated
                        and google_updated > db_updated):
                    field_updates["title"] = google_title
                    needs_notes_rebuild = True

                # 3. DUE DATE SYNC
                google_due = gtask.get("due")
                google_due_date = None
                if google_due:
                    google_due_date = datetime.fromisoformat(
                        google_due.replace("Z", "+00:00")
                    ).date()
                db_due_date = task.get("due_date")
                if (google_due_date != db_due_date
                        and google_updated and db_updated
                        and google_updated > db_updated):
                    field_updates["due_date"] = google_due_date
                    needs_notes_rebuild = True

                # Apply field changes to DB
                if field_updates:
                    set_parts = []
                    values = []
                    for col, val in field_updates.items():
                        set_parts.append(f"{col} = %s")
                        values.append(val)
                    values.append(str(task["id"]))
                    cursor.execute(
                        f"UPDATE tasks SET {', '.join(set_parts)}, "
                        f"updated_at = NOW() WHERE id = %s::uuid",
                        tuple(values),
                    )
                    conn.commit()
                    fields_updated += 1
                    logger.info(
                        "Task %s: fields updated from Google: %s",
                        task["id"], list(field_updates.keys()),
                    )

                    # Notes reconciliation
                    domain_name = task.get("domain_name") or "Unknown"
                    new_due = field_updates.get(
                        "due_date", task.get("due_date")
                    )
                    new_notes = build_notes_header(
                        task_id=str(task["id"]),
                        domain_name=domain_name,
                        priority=task.get("priority", "medium"),
                        due_date=str(new_due) if new_due else None,
                        description=task.get("description"),
                        existing_notes=gtask.get("notes", ""),
                    )
                    patch_body = {"notes": new_notes}
                    if "title" in field_updates:
                        patch_body["title"] = _prefixed_title(
                            field_updates["title"],
                            task.get("priority", "medium"),
                        )
                    service.tasks().patch(
                        tasklist=google_list_id,
                        task=google_task_id,
                        body=patch_body,
                    ).execute()

                # 4. ANNOTATION CAPTURE
                raw_notes = gtask.get("notes", "")
                logger.info(
                    "Task %s (%s): notes_len=%d, delimiter=%s, marker=%s",
                    str(task["id"])[:8], str(task.get("title", ""))[:30],
                    len(raw_notes),
                    NOTES_DELIMITER in raw_notes,
                    NOTES_MARKER in raw_notes,
                )
                user_zone = extract_user_zone(raw_notes)
                if user_zone.strip():
                    logger.info(
                        "Task %s: user_zone found (%d chars)",
                        str(task["id"])[:8], len(user_zone),
                    )
                    content_hash = hashlib.sha256(
                        user_zone.encode()
                    ).hexdigest()
                    task_id_str = str(task["id"])

                    cursor.execute(
                        "INSERT INTO task_annotations "
                        "(id, task_id, content, source, content_hash, metadata) "
                        "VALUES (%s, %s, %s, 'google_tasks', %s, %s) "
                        "ON CONFLICT (task_id, content_hash) DO NOTHING",
                        (
                            str(uuid.uuid4()),
                            task_id_str,
                            user_zone,
                            content_hash,
                            json.dumps({"word_count": len(user_zone.split())}),
                        ),
                    )
                    conn.commit()
                    if cursor.rowcount > 0:
                        annotations_captured += 1
                        logger.info(
                            "Task %s: annotation captured (%d words)",
                            task["id"], len(user_zone.split()),
                        )

            except Exception as e:
                errors.append(f"Task {task['id']}: {str(e)}")
                logger.error("Task %s error: %s", task["id"], e)

        # ── Phase 2: Discover phone-created tasks ──
        logger.info("Phase 2: discovering phone-created tasks")

        cursor.execute("""
            SELECT id, slug, name, metadata FROM life_domains
            WHERE metadata->>'google_task_list_id' IS NOT NULL
              AND status = 'active'
        """)
        domains = _rows_to_dicts(cursor)

        # Collect all known google_task_ids
        cursor.execute(
            "SELECT metadata->>'google_task_id' AS gid FROM tasks "
            "WHERE metadata->>'google_task_id' IS NOT NULL"
        )
        known_google_ids = {r[0] for r in cursor.fetchall()}

        for domain in domains:
            dmeta = _parse_jsonb(domain["metadata"]) or {}
            google_list_id = dmeta.get("google_task_list_id")
            if not google_list_id:
                continue

            try:
                result = service.tasks().list(
                    tasklist=google_list_id,
                    maxResults=100,
                    showCompleted=True,
                    showHidden=True,
                ).execute()
                google_tasks_list = result.get("items", [])
            except Exception as e:
                errors.append(f"List {google_list_id}: {str(e)}")
                logger.error("List %s error: %s", google_list_id, e)
                continue

            for gt in google_tasks_list:
                gt_id = gt.get("id")
                if not gt_id or gt_id in known_google_ids:
                    continue

                # Skip objectives/automations
                gt_title = gt.get("title", "")
                if gt_title.startswith(("[OBJ] ", "[AUTO] ")):
                    continue

                try:
                    domain_id = domain["id"]
                    domain_slug = domain["slug"]

                    # Resolve project from domain
                    cursor.execute(
                        "SELECT id FROM projects WHERE domain_id = %s::uuid",
                        (str(domain_id),),
                    )
                    project_row = cursor.fetchone()
                    if not project_row:
                        cursor.execute(
                            "SELECT id FROM projects ORDER BY created_at LIMIT 1"
                        )
                        project_row = cursor.fetchone()
                    if not project_row:
                        continue
                    project_id = project_row[0]

                    # Parse fields
                    clean_title = gt_title
                    for prefix in ["[URGENT] ", "[HIGH] ", "[MEDIUM] ", "[LOW] "]:
                        if clean_title.startswith(prefix):
                            clean_title = clean_title[len(prefix):]
                            break

                    google_due = gt.get("due")
                    due_date_val = None
                    if google_due:
                        due_date_val = datetime.fromisoformat(
                            google_due.replace("Z", "+00:00")
                        ).date()

                    is_completed = gt.get("status") == "completed"

                    google_notes = gt.get("notes", "")
                    user_notes = (
                        extract_user_zone(google_notes)
                        if _has_delimiter(google_notes)
                        else google_notes
                    )

                    # INSERT into tasks
                    new_task_id = str(uuid.uuid4())
                    cursor.execute(
                        "INSERT INTO tasks "
                        "(id, title, project_id, domain_id, status, priority, "
                        "due_date, description, metadata, assignee) "
                        "VALUES (%s::uuid, %s, %s::uuid, %s::uuid, %s, "
                        "'medium'::task_priority, %s, %s, %s::jsonb, 'atharva')",
                        (
                            new_task_id,
                            clean_title or "Untitled",
                            str(project_id),
                            str(domain_id),
                            "done" if is_completed else "todo",
                            due_date_val,
                            None,
                            json.dumps({
                                "google_task_id": gt_id,
                                "google_task_list_id": google_list_id,
                                "source": "google_tasks",
                            }),
                        ),
                    )
                    conn.commit()
                    known_google_ids.add(gt_id)

                    # Capture annotation if present
                    if user_notes and user_notes.strip():
                        content_hash = hashlib.sha256(
                            user_notes.encode()
                        ).hexdigest()
                        cursor.execute(
                            "INSERT INTO task_annotations "
                            "(id, task_id, content, content_hash, source, metadata) "
                            "VALUES (%s, %s, %s, %s, 'google_tasks', %s) "
                            "ON CONFLICT (task_id, content_hash) DO NOTHING",
                            (
                                str(uuid.uuid4()),
                                new_task_id,
                                user_notes,
                                content_hash,
                                json.dumps({
                                    "word_count": len(user_notes.split()),
                                    "imported": True,
                                }),
                            ),
                        )
                        conn.commit()

                    # Rebuild Google Task notes with system zone
                    new_notes = build_notes_header(
                        task_id=new_task_id,
                        domain_name=domain["name"],
                        priority="medium",
                        due_date=str(due_date_val) if due_date_val else None,
                        description=None,
                        existing_notes=google_notes,
                    )
                    service.tasks().patch(
                        tasklist=google_list_id,
                        task=gt_id,
                        body={"notes": new_notes},
                    ).execute()

                    tasks_imported += 1
                    logger.info(
                        "Imported '%s' from Google Tasks into %s domain",
                        clean_title, domain_slug,
                    )

                except Exception as e:
                    errors.append(f"Import {gt_title[:30]}: {str(e)}")
                    logger.error("Import error for '%s': %s", gt_title[:30], e)

        # ── Log pipeline run ──
        duration_ms = int(
            (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        )
        run_id = str(uuid.uuid4())
        status = "success" if not errors else "partial_failure"
        summary = (
            f"Checked: {tasks_checked}, "
            f"Completions: {completions_synced}, "
            f"Fields: {fields_updated}, "
            f"Annotations: {annotations_captured}, "
            f"Imported: {tasks_imported}"
        )
        error_msg = "; ".join(errors) if errors else None
        logger.info("Pipeline complete: %s", summary)

        cursor.execute(
            "SELECT id FROM pipelines WHERE slug = %s",
            ("task-annotation-sync",),
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
            conn.commit()

        cursor.close()
        conn.close()

    except Exception as e:
        logger.exception("Pipeline failed: %s", e)
        return {
            "error": str(e),
            "tasks_checked": tasks_checked,
            "annotations_captured": annotations_captured,
        }, 500

    return {
        "status": status,
        "tasks_checked": tasks_checked,
        "completions_synced": completions_synced,
        "fields_updated": fields_updated,
        "annotations_captured": annotations_captured,
        "tasks_imported": tasks_imported,
        "errors": errors,
        "duration_ms": duration_ms,
    }
