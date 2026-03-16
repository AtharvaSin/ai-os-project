"""Task Annotation Sync — Category B Pipeline.

Runs every 15 minutes via Cloud Scheduler. Scans active tasks with Google Task
IDs, extracts user-written annotations from the notes user zone (below the
delimiter), and inserts them into the task_annotations table with content-hash
deduplication.

Entry point: main(request)
Deployment: Cloud Run, python3.12, asia-south1
Service account: ai-os-cloud-functions@ai-operating-system-490208.iam.gserviceaccount.com
"""

import hashlib
import json
import os
import uuid
from datetime import datetime, timezone

import functions_framework
import pg8000
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


# Must be byte-for-byte identical to gateway constant
NOTES_DELIMITER = '── ✏️ YOUR NOTES BELOW ─────────────────────────'


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


def extract_user_zone(notes: str) -> str:
    """Extract everything below the delimiter. Returns '' if no delimiter."""
    if NOTES_DELIMITER in notes:
        return notes.split(NOTES_DELIMITER, 1)[1].lstrip('\n')
    return ''


@functions_framework.http
def main(request):
    """Entry point for the Task Annotation Sync Cloud Run service."""
    start_time = datetime.now(timezone.utc)
    errors = []
    annotations_captured = 0
    tasks_checked = 0

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Get active tasks with Google Task IDs
        cursor.execute("""
            SELECT t.id, t.metadata
            FROM tasks t
            WHERE t.metadata->>'google_task_id' IS NOT NULL
              AND t.status NOT IN ('done', 'cancelled')
        """)
        rows = cursor.fetchall()
        cols = [desc[0] for desc in cursor.description]
        tasks = [dict(zip(cols, r)) for r in rows]
        tasks_checked = len(tasks)

        # Get Google Tasks service
        service = get_tasks_service()
        if not service:
            return {
                "error": "Google OAuth not configured",
                "tasks_checked": 0,
            }, 500

        for task in tasks:
            meta = task["metadata"]
            if isinstance(meta, str):
                meta = json.loads(meta)

            google_task_id = meta.get("google_task_id")
            google_list_id = meta.get("google_task_list_id")

            if not google_task_id or not google_list_id:
                continue

            try:
                gtask = (
                    service.tasks()
                    .get(tasklist=google_list_id, task=google_task_id)
                    .execute()
                )

                user_zone = extract_user_zone(gtask.get("notes", ""))
                if not user_zone.strip():
                    continue

                content_hash = hashlib.sha256(user_zone.encode()).hexdigest()
                task_id = str(task["id"])

                cursor.execute(
                    "INSERT INTO task_annotations "
                    "(id, task_id, content, source, content_hash, metadata) "
                    "VALUES (%s, %s, %s, 'google_tasks', %s, %s) "
                    "ON CONFLICT (task_id, content_hash) DO NOTHING",
                    (
                        str(uuid.uuid4()),
                        task_id,
                        user_zone,
                        content_hash,
                        json.dumps({"word_count": len(user_zone.split())}),
                    ),
                )
                conn.commit()

                if cursor.rowcount > 0:
                    annotations_captured += 1

            except Exception as e:
                errors.append(f"Task {task['id']}: {str(e)}")

        # Log pipeline run
        duration_ms = int(
            (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        )
        run_id = str(uuid.uuid4())
        status = "success" if not errors else "failed"
        summary = (
            f"Checked: {tasks_checked}, "
            f"Captured: {annotations_captured}"
        )
        error_msg = "; ".join(errors) if errors else None

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
        return {
            "error": str(e),
            "tasks_checked": tasks_checked,
            "annotations_captured": annotations_captured,
        }, 500

    return {
        "status": "success" if not errors else "partial_failure",
        "tasks_checked": tasks_checked,
        "annotations_captured": annotations_captured,
        "errors": errors,
        "duration_ms": int(
            (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        ),
    }
