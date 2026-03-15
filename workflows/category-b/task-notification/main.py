"""Task Notification Cloud Function — Category B Pipeline.

Runs daily at 06:00 IST via Cloud Scheduler. Queries overdue and upcoming
tasks from Cloud SQL, creates/updates Google Tasks for phone notifications,
and logs the pipeline run.

Entry point: main(request)
Deployment: Cloud Functions Gen 2, python312, asia-south1
Service account: ai-os-cloud-functions@ai-operating-system-490208.iam.gserviceaccount.com
"""

import os
import uuid
from datetime import datetime, timezone

import functions_framework
import pg8000
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


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
    """Build Google Tasks API service."""
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


def ensure_task_list(service, list_name):
    """Get or create a Google Task list by name. Returns list ID."""
    results = service.tasklists().list().execute()
    for tl in results.get("items", []):
        if tl["title"] == list_name:
            return tl["id"]
    # Create it
    new_list = service.tasklists().insert(body={"title": list_name}).execute()
    return new_list["id"]


# Project slug -> Google Task list name mapping
PROJECT_LIST_MAP = {
    "ai-os": "AI OS",
    "ai-and-u": "AI&U",
    "bharatvarsh": "Bharatvarsh",
    "zealogics": "Zealogics",
}


def get_priority_prefix(priority):
    """Return title prefix for high/urgent priorities."""
    if priority == "urgent":
        return "[URGENT] "
    if priority == "high":
        return "[HIGH] "
    return ""


@functions_framework.http
def main(request):
    """Entry point for the task notification Cloud Function."""
    start_time = datetime.now(timezone.utc)
    errors = []
    overdue_count = 0
    upcoming_count = 0
    tasks_synced = 0

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Query overdue tasks
        cursor.execute("""
            SELECT t.id, t.title, t.priority, t.due_date, t.google_task_id,
                   t.google_task_list, p.name as project_name, p.slug as project_slug
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            WHERE t.due_date < CURRENT_DATE
            AND t.status NOT IN ('done', 'cancelled')
            ORDER BY t.priority DESC, t.due_date ASC
        """)
        overdue_tasks = cursor.fetchall()
        overdue_columns = [desc[0] for desc in cursor.description]
        overdue_tasks = [dict(zip(overdue_columns, row)) for row in overdue_tasks]
        overdue_count = len(overdue_tasks)

        # Query upcoming tasks (due today, not yet synced)
        cursor.execute("""
            SELECT t.id, t.title, t.priority, t.due_date, t.google_task_id,
                   t.google_task_list, p.name as project_name, p.slug as project_slug
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            WHERE t.due_date = CURRENT_DATE
            AND t.status NOT IN ('done', 'cancelled')
            AND t.google_task_id IS NULL
        """)
        upcoming_tasks = cursor.fetchall()
        upcoming_columns = [desc[0] for desc in cursor.description]
        upcoming_tasks = [dict(zip(upcoming_columns, row)) for row in upcoming_tasks]
        upcoming_count = len(upcoming_tasks)

        # Get Google Tasks service
        tasks_service = get_tasks_service()

        if tasks_service:
            # Process overdue tasks
            for task in overdue_tasks:
                try:
                    list_name = PROJECT_LIST_MAP.get(
                        task["project_slug"], "Personal"
                    )
                    list_id = ensure_task_list(tasks_service, list_name)
                    prefix = "[OVERDUE] "
                    title = (
                        f"{prefix}"
                        f"{get_priority_prefix(task['priority'])}"
                        f"{task['title']}"
                    )

                    if task["google_task_id"]:
                        # Update existing Google Task
                        try:
                            existing = (
                                tasks_service.tasks()
                                .get(
                                    tasklist=list_id,
                                    task=task["google_task_id"],
                                )
                                .execute()
                            )
                            if not existing.get("title", "").startswith(
                                "[OVERDUE]"
                            ):
                                tasks_service.tasks().patch(
                                    tasklist=list_id,
                                    task=task["google_task_id"],
                                    body={"title": title},
                                ).execute()
                        except Exception:
                            pass  # Task may have been deleted in Google
                    else:
                        # Create new Google Task
                        due_str = (
                            task["due_date"].strftime("%Y-%m-%dT00:00:00.000Z")
                            if task["due_date"]
                            else None
                        )
                        body = {
                            "title": title,
                            "notes": (
                                f"Project: {task['project_name']}\n"
                                f"Priority: {task['priority']}"
                            ),
                        }
                        if due_str:
                            body["due"] = due_str
                        result = (
                            tasks_service.tasks()
                            .insert(tasklist=list_id, body=body)
                            .execute()
                        )
                        # Update DB with Google Task ID
                        cursor.execute(
                            "UPDATE tasks SET google_task_id = %s, "
                            "google_task_list = %s, last_synced_at = NOW() "
                            "WHERE id = %s",
                            (result["id"], list_name, str(task["id"])),
                        )
                        conn.commit()

                    tasks_synced += 1
                except Exception as e:
                    errors.append(f"Overdue task {task['id']}: {str(e)}")

            # Process upcoming tasks
            for task in upcoming_tasks:
                try:
                    list_name = PROJECT_LIST_MAP.get(
                        task["project_slug"], "Personal"
                    )
                    list_id = ensure_task_list(tasks_service, list_name)
                    title = (
                        f"{get_priority_prefix(task['priority'])}"
                        f"{task['title']}"
                    )
                    due_str = (
                        task["due_date"].strftime("%Y-%m-%dT00:00:00.000Z")
                        if task["due_date"]
                        else None
                    )

                    body = {
                        "title": title,
                        "notes": (
                            f"Project: {task['project_name']}\n"
                            f"Priority: {task['priority']}"
                        ),
                    }
                    if due_str:
                        body["due"] = due_str

                    result = (
                        tasks_service.tasks()
                        .insert(tasklist=list_id, body=body)
                        .execute()
                    )
                    cursor.execute(
                        "UPDATE tasks SET google_task_id = %s, "
                        "google_task_list = %s, last_synced_at = NOW() "
                        "WHERE id = %s",
                        (result["id"], list_name, str(task["id"])),
                    )
                    conn.commit()
                    tasks_synced += 1
                except Exception as e:
                    errors.append(f"Upcoming task {task['id']}: {str(e)}")

        # Log pipeline run
        try:
            duration_ms = int(
                (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            )
            run_id = str(uuid.uuid4())
            status = "success" if not errors else "failed"
            summary = (
                f"Overdue: {overdue_count}, "
                f"Upcoming: {upcoming_count}, "
                f"Synced: {tasks_synced}"
            )
            error_msg = "; ".join(errors) if errors else None

            cursor.execute(
                "SELECT id FROM pipelines WHERE slug = %s",
                ("task-notification-daily",),
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
        except Exception as e:
            errors.append(f"Pipeline logging: {str(e)}")

        cursor.close()
        conn.close()

    except Exception as e:
        return {
            "error": str(e),
            "overdue_count": overdue_count,
            "upcoming_count": upcoming_count,
        }, 500

    return {
        "status": "success" if not errors else "partial_failure",
        "overdue_count": overdue_count,
        "upcoming_count": upcoming_count,
        "tasks_synced": tasks_synced,
        "errors": errors,
    }
