"""Journal Monthly Distillation Pipeline — Category B.

Runs on the 28th of each month (0 3 28 * *) via Cloud Scheduler.
Queries unprocessed journal entries, sends to Claude Haiku for theme
extraction, creates distilled knowledge_entries, marks originals as processed.

Entry point: main(request)
Deployment: Cloud Run, python312, asia-south1
"""

import json
import os
import uuid
from datetime import datetime, timezone

import anthropic
import functions_framework
import pg8000

BATCH_SIZE = 100
MODEL = "claude-haiku-4-5-20251001"
GCP_PROJECT = "ai-operating-system-490208"
PIPELINE_SLUG = "journal-monthly-distill"

SYSTEM_PROMPT = """You are analysing a month of personal journal entries. Extract:
1. Recurring themes (what keeps coming up?)
2. Mood/energy patterns (day-of-week or context correlations?)
3. Unresolved tensions or blockers mentioned repeatedly
4. Key decisions or realisations captured
5. Action items mentioned but not yet tracked

Output ONLY valid JSON:
{
  "themes": [{"title": "...", "evidence": "...", "frequency": N}],
  "patterns": [{"pattern": "...", "correlation": "..."}],
  "tensions": [{"tension": "...", "first_mentioned": "date", "still_active": true}],
  "decisions": [{"decision": "...", "context": "..."}],
  "missed_actions": [{"action": "...", "from_date": "date", "priority": "low|medium|high"}]
}"""


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


def fetch_undistilled_journals(cursor):
    """Query journal entries that have not been distilled yet.

    Returns a list of dicts with id, content, mood, energy_level,
    created_at, and domain_name.
    """
    cursor.execute(
        """
        SELECT j.id, j.content, j.mood, j.energy_level, j.created_at,
               d.name AS domain_name
        FROM journals j
        LEFT JOIN life_domains d ON j.domain_id = d.id
        WHERE j.distilled_at IS NULL
        ORDER BY j.created_at ASC
        LIMIT %s
        """,
        (BATCH_SIZE,),
    )
    rows = cursor.fetchall()
    if not rows:
        return []

    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in rows]


def format_journals_for_analysis(journals):
    """Format journal entries into a readable text block for Claude."""
    parts = []
    for j in journals:
        date_str = (
            j["created_at"].strftime("%Y-%m-%d %H:%M")
            if hasattr(j["created_at"], "strftime")
            else str(j["created_at"])
        )
        meta = f"[{date_str}]"
        if j.get("mood"):
            meta += f" mood={j['mood']}"
        if j.get("energy_level"):
            meta += f" energy={j['energy_level']}"
        if j.get("domain_name"):
            meta += f" domain={j['domain_name']}"
        parts.append(f"{meta}\n{j['content']}")
    return "\n\n---\n\n".join(parts)


def analyse_with_haiku(journals_text, api_key):
    """Send journal text to Claude Haiku for theme extraction.

    Returns (analysis_dict, input_tokens, output_tokens).
    """
    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    "Here are the journal entries to analyse:\n\n"
                    f"{journals_text}"
                ),
            }
        ],
    )
    response_text = message.content[0].text
    tokens_in = message.usage.input_tokens
    tokens_out = message.usage.output_tokens

    # Parse JSON from response
    analysis = json.loads(response_text)
    return analysis, tokens_in, tokens_out


def create_distilled_entries(cursor, analysis, month_tag):
    """Create knowledge_entries from the distilled analysis.

    Inserts themes, active tensions, and decisions as separate entries.
    Returns list of created entry IDs.
    """
    entry_ids = []

    for theme in analysis.get("themes", []):
        entry_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO knowledge_entries
                (id, title, content, domain, source_type, confidence_score,
                 tags, metadata)
            VALUES (%s, %s, %s, %s, 'journal_entry', 0.7, %s, %s)
            """,
            (
                entry_id,
                f"Journal Theme: {theme['title']}",
                (
                    "Recurring theme from journal analysis.\n\n"
                    f"Evidence: {theme.get('evidence', 'N/A')}\n"
                    f"Frequency: {theme.get('frequency', 'N/A')} mentions"
                ),
                "personal",
                ["journal_distill", "monthly", month_tag],
                json.dumps({
                    "source": "journal-monthly-distill",
                    "month": month_tag,
                    "type": "theme",
                }),
            ),
        )
        entry_ids.append(entry_id)

    for tension in analysis.get("tensions", []):
        if not tension.get("still_active", False):
            continue
        entry_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO knowledge_entries
                (id, title, content, domain, source_type, confidence_score,
                 tags, metadata)
            VALUES (%s, %s, %s, %s, 'journal_entry', 0.6, %s, %s)
            """,
            (
                entry_id,
                f"Unresolved Tension: {tension['tension'][:80]}",
                (
                    "Unresolved tension identified from journal analysis.\n\n"
                    f"Tension: {tension['tension']}\n"
                    f"First mentioned: {tension.get('first_mentioned', 'N/A')}"
                ),
                "personal",
                ["journal_distill", "monthly", month_tag, "tension"],
                json.dumps({
                    "source": "journal-monthly-distill",
                    "month": month_tag,
                    "type": "tension",
                }),
            ),
        )
        entry_ids.append(entry_id)

    for decision in analysis.get("decisions", []):
        entry_id = str(uuid.uuid4())
        cursor.execute(
            """
            INSERT INTO knowledge_entries
                (id, title, content, domain, source_type, confidence_score,
                 tags, metadata)
            VALUES (%s, %s, %s, %s, 'journal_entry', 0.8, %s, %s)
            """,
            (
                entry_id,
                f"Journal Decision: {decision['decision'][:80]}",
                (
                    "Key decision captured from journal analysis.\n\n"
                    f"Decision: {decision['decision']}\n"
                    f"Context: {decision.get('context', 'N/A')}"
                ),
                "personal",
                ["journal_distill", "monthly", month_tag, "decision"],
                json.dumps({
                    "source": "journal-monthly-distill",
                    "month": month_tag,
                    "type": "decision",
                }),
            ),
        )
        entry_ids.append(entry_id)

    return entry_ids


def mark_journals_distilled(cursor, journal_ids):
    """Set distilled_at = NOW() on processed journal rows."""
    for jid in journal_ids:
        cursor.execute(
            "UPDATE journals SET distilled_at = NOW() WHERE id = %s",
            (str(jid),),
        )


def log_pipeline_run(cursor, start_time, status, summary, error_msg=None):
    """Log to pipeline_runs table if the pipeline exists."""
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
        # Pipeline may not be registered yet — fail gracefully
        pass


@functions_framework.http
def main(request):
    """Entry point for the journal monthly distillation pipeline.

    Finds undistilled journal entries, sends them to Claude Haiku for
    analysis, creates knowledge_entries from extracted themes/tensions/
    decisions, and marks the journals as distilled.
    """
    start_time = datetime.now(timezone.utc)
    now = datetime.now(timezone.utc)
    month_tag = now.strftime("%Y-%m")

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # 1. Fetch journals that need distillation
        journals = fetch_undistilled_journals(cursor)

        if not journals:
            log_pipeline_run(
                cursor, start_time, "success", "No undistilled journals found"
            )
            conn.commit()
            cursor.close()
            conn.close()
            return (
                json.dumps({
                    "status": "success",
                    "message": "No journals to process",
                    "processed": 0,
                }),
                200,
                {"Content-Type": "application/json"},
            )

        # 2. Format journals for Claude analysis
        journals_text = format_journals_for_analysis(journals)

        # 3. Call Claude Haiku for theme extraction
        api_key = get_secret("ANTHROPIC_API_KEY")
        analysis, tokens_in, tokens_out = analyse_with_haiku(
            journals_text, api_key
        )

        # 4. Calculate cost — Haiku: $1/MTok input, $5/MTok output
        cost_usd = (tokens_in * 1.0 / 1_000_000) + (
            tokens_out * 5.0 / 1_000_000
        )

        # 5. Create distilled knowledge_entries
        entry_ids = create_distilled_entries(cursor, analysis, month_tag)

        # 6. Mark source journals as distilled
        journal_ids = [j["id"] for j in journals]
        mark_journals_distilled(cursor, journal_ids)

        # 7. Log pipeline run
        summary = (
            f"Journals: {len(journals)}, "
            f"Distilled entries: {len(entry_ids)}, "
            f"Themes: {len(analysis.get('themes', []))}, "
            f"Tensions: {len(analysis.get('tensions', []))}, "
            f"Decisions: {len(analysis.get('decisions', []))}, "
            f"Missed actions: {len(analysis.get('missed_actions', []))}, "
            f"Cost: ${cost_usd:.4f}"
        )
        log_pipeline_run(cursor, start_time, "success", summary)

        conn.commit()
        cursor.close()
        conn.close()

        return (
            json.dumps({
                "status": "success",
                "journals_processed": len(journals),
                "entries_created": len(entry_ids),
                "analysis_summary": {
                    "themes": len(analysis.get("themes", [])),
                    "patterns": len(analysis.get("patterns", [])),
                    "tensions": len(analysis.get("tensions", [])),
                    "decisions": len(analysis.get("decisions", [])),
                    "missed_actions": len(analysis.get("missed_actions", [])),
                },
                "cost_usd": round(cost_usd, 6),
            }),
            200,
            {"Content-Type": "application/json"},
        )

    except Exception as e:
        error_msg = str(e)

        # Attempt to log the failure
        try:
            conn_err = get_connection()
            cursor_err = conn_err.cursor()
            log_pipeline_run(
                cursor_err, start_time, "failed", None, error_msg
            )
            conn_err.commit()
            cursor_err.close()
            conn_err.close()
        except Exception:
            pass  # Best-effort error logging

        return (
            json.dumps({"status": "error", "error": error_msg}),
            500,
            {"Content-Type": "application/json"},
        )
