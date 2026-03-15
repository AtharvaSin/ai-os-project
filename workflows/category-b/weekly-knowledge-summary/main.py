"""Weekly Knowledge Summary — Category B Pipeline.

Runs every Sunday at 22:00 IST via Cloud Scheduler. Queries the past week's
operational data (tasks, milestones, pipeline_runs) from Cloud SQL, generates
natural-language summaries per active project using Claude Haiku, and inserts
them as knowledge_entries with 'supersedes' temporal chains.

Entry point: main(request)
Deployment: Cloud Run, python312, asia-south1
Service account: ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com
"""

import json
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone

import anthropic
import functions_framework
import pg8000

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Secret resolution — env var first, Secret Manager fallback
# ---------------------------------------------------------------------------
GCP_PROJECT = "ai-operating-system-490208"


def _get_secret(env_key: str, sm_name: str) -> str:
    """Return env var value or fall back to GCP Secret Manager."""
    value = os.getenv(env_key)
    if value:
        return value
    try:
        from google.cloud import secretmanager

        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{GCP_PROJECT}/secrets/{sm_name}/versions/latest"
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    except Exception as exc:
        logger.error("Failed to retrieve secret %s: %s", sm_name, exc)
        raise


def _db_password() -> str:
    return _get_secret("DB_PASSWORD", "AI_OS_DB_PASSWORD")


def _anthropic_api_key() -> str:
    return _get_secret("ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY")


# ---------------------------------------------------------------------------
# Database connection — dual mode (Cloud Run socket / local TCP)
# ---------------------------------------------------------------------------
DB_INSTANCE = "bharatvarsh-website:us-central1:bharatvarsh-db"


def get_connection():
    """Connect via Auth Proxy Unix socket (Cloud Run) or TCP localhost."""
    instance = os.getenv("DB_INSTANCE", DB_INSTANCE)
    unix_sock = f"/cloudsql/{instance}/.s.PGSQL.5432"

    if os.path.exists(f"/cloudsql/{instance}"):
        return pg8000.connect(
            user=os.getenv("DB_USER", "ai_os_admin"),
            password=_db_password(),
            database=os.getenv("DB_NAME", "ai_os"),
            unix_sock=unix_sock,
        )
    return pg8000.connect(
        user=os.getenv("DB_USER", "ai_os_admin"),
        password=_db_password(),
        database=os.getenv("DB_NAME", "ai_os"),
        host="127.0.0.1",
        port=5432,
    )


# ---------------------------------------------------------------------------
# Claude Haiku summary generation
# ---------------------------------------------------------------------------
SUMMARY_PROMPT = """You are summarising the past week of activity for the project "{project_name}".

Data:
{json_data}

Write a ~300-word summary covering:
1. **Accomplishments** — Tasks completed, milestones hit
2. **Blockers** — Overdue tasks, at-risk milestones
3. **Velocity** — Tasks created vs completed ratio
4. **Upcoming Priorities** — What needs attention next week

Be factual, specific, and concise. Reference actual task/milestone names.
Do not speculate about things not in the data.
Format as clean prose paragraphs, not bullet points."""


def generate_summary(project_name: str, data: dict) -> str:
    """Call Claude Haiku to produce a weekly summary for one project."""
    client = anthropic.Anthropic(api_key=_anthropic_api_key())
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": SUMMARY_PROMPT.format(
                    project_name=project_name,
                    json_data=json.dumps(data, indent=2, default=str),
                ),
            }
        ],
    )
    return message.content[0].text


# ---------------------------------------------------------------------------
# Data gathering helpers
# ---------------------------------------------------------------------------


def get_active_projects(cursor):
    """Return list of active projects as dicts."""
    cursor.execute(
        "SELECT id, name, slug FROM projects WHERE status = 'active'"
    )
    cols = [desc[0] for desc in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def get_weekly_project_data(cursor, project_id: str, week_start: str) -> dict:
    """Gather past week's operational data for a single project."""
    cursor.execute(
        "SELECT COUNT(*) FROM tasks WHERE project_id = %s AND created_at >= %s",
        (str(project_id), week_start),
    )
    tasks_created = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM tasks "
        "WHERE project_id = %s AND status = 'done' AND completed_at >= %s",
        (str(project_id), week_start),
    )
    tasks_completed = cursor.fetchone()[0]

    cursor.execute(
        "SELECT COUNT(*) FROM tasks "
        "WHERE project_id = %s AND status NOT IN ('done', 'cancelled') "
        "AND due_date < CURRENT_DATE",
        (str(project_id),),
    )
    tasks_overdue = cursor.fetchone()[0]

    cursor.execute(
        "SELECT name FROM milestones "
        "WHERE project_id = %s AND status = 'completed' AND completed_at >= %s",
        (str(project_id), week_start),
    )
    milestones_completed = [row[0] for row in cursor.fetchall()]

    cursor.execute(
        "SELECT name, due_date FROM milestones "
        "WHERE project_id = %s AND status IN ('pending', 'in_progress') "
        "AND due_date <= CURRENT_DATE + INTERVAL '7 days'",
        (str(project_id),),
    )
    milestones_at_risk = [
        {"name": row[0], "due": str(row[1])} for row in cursor.fetchall()
    ]

    return {
        "tasks_created": tasks_created,
        "tasks_completed": tasks_completed,
        "tasks_overdue": tasks_overdue,
        "milestones_completed": milestones_completed,
        "milestones_at_risk": milestones_at_risk,
    }


# ---------------------------------------------------------------------------
# Knowledge entry insertion
# ---------------------------------------------------------------------------


def insert_knowledge_entry(
    cursor,
    title: str,
    content: str,
    domain: str,
    sub_domain: str,
    source_type: str,
    tags: list[str],
) -> str:
    """Insert a knowledge_entry and return its id."""
    entry_id = str(uuid.uuid4())
    cursor.execute(
        """INSERT INTO knowledge_entries
           (id, title, content, domain, sub_domain, source_type, tags, metadata)
           VALUES (%s, %s, %s, %s::knowledge_domain, %s, %s, %s, %s)""",
        (
            entry_id,
            title,
            content,
            domain,
            sub_domain,
            source_type,
            tags,
            json.dumps({"generated_by": "weekly-knowledge-summary"}),
        ),
    )
    return entry_id


def create_supersedes_chain(
    cursor, new_entry_id: str, domain: str, sub_domain: str
):
    """Link this week's summary to the previous week's via 'supersedes'."""
    cursor.execute(
        """SELECT id FROM knowledge_entries
           WHERE domain = %s::knowledge_domain
           AND source_type = 'project_update'
           AND sub_domain = %s
           AND id != %s
           ORDER BY created_at DESC
           LIMIT 1""",
        (domain, sub_domain, new_entry_id),
    )
    previous = cursor.fetchone()
    if previous:
        conn_id = str(uuid.uuid4())
        cursor.execute(
            """INSERT INTO knowledge_connections
               (id, source_entry_id, target_entry_id, relationship_type, context)
               VALUES (%s, %s, %s, 'supersedes', 'Weekly summary temporal chain')
               ON CONFLICT DO NOTHING""",
            (conn_id, new_entry_id, str(previous[0])),
        )
        logger.info(
            "Created supersedes link %s -> %s", new_entry_id, previous[0]
        )


# ---------------------------------------------------------------------------
# Pipeline logging
# ---------------------------------------------------------------------------


def log_ingestion_job(cursor, job_type: str, entries_created: int, tokens: int):
    """Log run to knowledge_ingestion_jobs."""
    job_id = str(uuid.uuid4())
    cursor.execute(
        """INSERT INTO knowledge_ingestion_jobs
           (id, job_type, status, entries_created, embeddings_generated,
            tokens_used, cost_estimate_usd)
           VALUES (%s, %s, 'completed', %s, 0, %s, %s)""",
        (
            job_id,
            job_type,
            entries_created,
            tokens,
            round(tokens * 0.001 / 1000, 6),  # Haiku input pricing approx
        ),
    )


def log_pipeline_run(
    cursor,
    start_time: datetime,
    status: str,
    summary: str,
    error_message: str | None,
):
    """Log to pipeline_runs if pipeline row exists."""
    cursor.execute(
        "SELECT id FROM pipelines WHERE slug = %s",
        ("weekly-knowledge-summary",),
    )
    pipeline_row = cursor.fetchone()
    if not pipeline_row:
        logger.warning("No pipeline row for weekly-knowledge-summary")
        return

    duration_ms = int(
        (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
    )
    run_id = str(uuid.uuid4())
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
            error_message,
        ),
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


@functions_framework.http
def main(request):
    """HTTP entry point for the weekly knowledge summary pipeline."""
    start_time = datetime.now(timezone.utc)
    errors: list[str] = []
    entries_created = 0
    total_tokens = 0

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Determine week range
        week_end = datetime.now(timezone.utc)
        week_start = (week_end - timedelta(days=7)).isoformat()
        week_label = (week_end - timedelta(days=7)).strftime("%b %d")

        logger.info("Generating weekly summaries for week of %s", week_label)

        # Get active projects
        projects = get_active_projects(cursor)
        if not projects:
            logger.warning("No active projects found")
            return {"status": "no_projects", "entries_created": 0}, 200

        # Generate summary for each project
        for project in projects:
            try:
                data = get_weekly_project_data(
                    cursor, project["id"], week_start
                )

                # Skip projects with zero activity
                if (
                    data["tasks_created"] == 0
                    and data["tasks_completed"] == 0
                    and not data["milestones_completed"]
                ):
                    logger.info(
                        "Skipping %s — no activity this week",
                        project["name"],
                    )
                    continue

                summary_text = generate_summary(project["name"], data)

                title = (
                    f"Weekly Update: {project['name']} "
                    f"-- Week of {week_label}"
                )
                entry_id = insert_knowledge_entry(
                    cursor,
                    title=title,
                    content=summary_text,
                    domain="project",
                    sub_domain=project["slug"],
                    source_type="project_update",
                    tags=["weekly_summary", project["slug"]],
                )
                conn.commit()

                # Temporal chain
                create_supersedes_chain(
                    cursor, entry_id, "project", project["slug"]
                )
                conn.commit()

                entries_created += 1
                # Rough token estimate: prompt + response
                total_tokens += 1500
                logger.info(
                    "Created weekly entry for %s: %s",
                    project["name"],
                    entry_id,
                )

            except Exception as exc:
                errors.append(f"Project {project['name']}: {exc}")
                logger.error(
                    "Error processing project %s: %s", project["name"], exc
                )
                conn.rollback()

        # System summary — check for pipeline_runs this week
        try:
            cursor.execute(
                "SELECT COUNT(*) FROM pipeline_runs WHERE started_at >= %s",
                (week_start,),
            )
            pipeline_run_count = cursor.fetchone()[0]

            if pipeline_run_count > 0:
                system_data = {"pipeline_runs_this_week": pipeline_run_count}
                system_summary = generate_summary("AI OS System", system_data)

                sys_title = (
                    f"Weekly Update: System Infrastructure "
                    f"-- Week of {week_label}"
                )
                sys_entry_id = insert_knowledge_entry(
                    cursor,
                    title=sys_title,
                    content=system_summary,
                    domain="system",
                    sub_domain="infrastructure",
                    source_type="project_update",
                    tags=["weekly_summary", "system"],
                )
                conn.commit()

                create_supersedes_chain(
                    cursor, sys_entry_id, "system", "infrastructure"
                )
                conn.commit()

                entries_created += 1
                total_tokens += 1500
                logger.info("Created system infrastructure summary")

        except Exception as exc:
            errors.append(f"System summary: {exc}")
            logger.error("Error generating system summary: %s", exc)
            conn.rollback()

        # Log ingestion job
        try:
            log_ingestion_job(
                cursor, "weekly_summary", entries_created, total_tokens
            )
            conn.commit()
        except Exception as exc:
            errors.append(f"Ingestion job logging: {exc}")
            logger.error("Error logging ingestion job: %s", exc)
            conn.rollback()

        # Log pipeline run
        try:
            status = "success" if not errors else "failed"
            output_summary = (
                f"Entries created: {entries_created}, "
                f"Projects processed: {len(projects)}, "
                f"Tokens used: ~{total_tokens}"
            )
            error_msg = "; ".join(errors) if errors else None
            log_pipeline_run(
                cursor, start_time, status, output_summary, error_msg
            )
            conn.commit()
        except Exception as exc:
            errors.append(f"Pipeline run logging: {exc}")
            logger.error("Error logging pipeline run: %s", exc)
            conn.rollback()

        cursor.close()

    except Exception as exc:
        logger.error("Fatal error: %s", exc)
        return {
            "error": str(exc),
            "entries_created": entries_created,
        }, 500

    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass

    return {
        "status": "success" if not errors else "partial_failure",
        "entries_created": entries_created,
        "total_tokens": total_tokens,
        "errors": errors,
    }
