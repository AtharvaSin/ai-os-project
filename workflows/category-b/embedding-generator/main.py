"""Embedding Generation Pipeline — Category B Pipeline.

Runs once a week (Sunday 02:00 IST) via Cloud Scheduler. Finds knowledge_entries
rows without corresponding knowledge_embeddings, generates embeddings via OpenAI
text-embedding-3-small, and inserts them.

Entry point: main(request)
Deployment: Cloud Run, python312, asia-south1
Service account: ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com
"""

import json
import os
import uuid
from datetime import datetime, timezone

import functions_framework
import pg8000
from openai import OpenAI

BATCH_SIZE = 50
MODEL = "text-embedding-3-small"
# OpenAI pricing: $0.02 per 1M tokens for text-embedding-3-small
COST_PER_TOKEN = 0.02 / 1_000_000
GCP_PROJECT = "ai-operating-system-490208"
PIPELINE_SLUG = "embedding-generator"


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


def fetch_entries_without_embeddings(cursor):
    """Query knowledge_entries that have no corresponding knowledge_embeddings row.

    Returns a list of dicts with id, title, content.
    """
    cursor.execute(
        """
        SELECT ke.id, ke.title, ke.content
        FROM knowledge_entries ke
        LEFT JOIN knowledge_embeddings kv ON kv.entry_id = ke.id
        WHERE kv.id IS NULL
        ORDER BY ke.created_at ASC
        LIMIT %s
        """,
        (BATCH_SIZE,),
    )
    rows = cursor.fetchall()
    if not rows:
        return []

    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in rows]


def generate_embeddings(texts: list[str], api_key: str) -> tuple[list[list[float]], int]:
    """Call OpenAI embeddings API for a batch of texts.

    Returns (list_of_embedding_vectors, total_tokens_used).
    """
    client = OpenAI(api_key=api_key)
    response = client.embeddings.create(input=texts, model=MODEL)

    embeddings = [item.embedding for item in response.data]
    tokens_used = response.usage.total_tokens
    return embeddings, tokens_used


def insert_embeddings(cursor, entries, embeddings):
    """Insert embedding vectors into knowledge_embeddings table.

    Uses pgvector string format for the vector column.
    """
    for entry, embedding in zip(entries, embeddings):
        # Convert list to pgvector string format: '[0.1, 0.2, ...]'
        vector_str = "[" + ", ".join(str(v) for v in embedding) + "]"
        cursor.execute(
            """
            INSERT INTO knowledge_embeddings (entry_id, embedding, model_used)
            VALUES (%s, %s, %s)
            ON CONFLICT (entry_id) DO UPDATE SET
                embedding = EXCLUDED.embedding,
                model_used = EXCLUDED.model_used
            """,
            (str(entry["id"]), vector_str, MODEL),
        )


def log_ingestion_job(cursor, entries_count, tokens_used, cost_usd, status, error_msg=None):
    """Log the embedding batch to knowledge_ingestion_jobs table."""
    job_id = str(uuid.uuid4())
    metadata = json.dumps({
        "model": MODEL,
        "batch_size": entries_count,
        "tokens_used": tokens_used,
        "cost_usd": round(cost_usd, 6),
    })
    cursor.execute(
        """
        INSERT INTO knowledge_ingestion_jobs
            (id, job_type, status, entries_created, embeddings_generated,
             tokens_used, cost_estimate_usd, metadata)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            job_id,
            "embedding_batch",
            status,
            0,
            entries_count,
            tokens_used,
            round(cost_usd, 6),
            metadata,
        ),
    )
    return job_id


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
    """Entry point for the embedding generation Cloud Function.

    Finds knowledge_entries without embeddings, generates them via OpenAI,
    inserts into knowledge_embeddings, and logs the pipeline run.
    """
    start_time = datetime.now(timezone.utc)
    processed = 0
    tokens_used = 0
    cost_usd = 0.0

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # 1. Fetch entries that need embeddings
        entries = fetch_entries_without_embeddings(cursor)

        if not entries:
            # Nothing to process — log and return early
            log_pipeline_run(
                cursor, start_time, "success", "No entries need embeddings"
            )
            conn.commit()
            cursor.close()
            conn.close()
            return (
                json.dumps({
                    "status": "success",
                    "processed": 0,
                    "tokens_used": 0,
                    "cost_usd": 0.0,
                    "message": "No entries need embeddings",
                }),
                200,
                {"Content-Type": "application/json"},
            )

        # 2. Prepare texts: title + "\n\n" + content
        texts = [
            f"{entry['title']}\n\n{entry['content']}" for entry in entries
        ]

        # 3. Call OpenAI embeddings API (batch)
        openai_api_key = get_secret("OPENAI_API_KEY")
        embeddings, tokens_used = generate_embeddings(texts, openai_api_key)

        # 4. Insert embeddings into knowledge_embeddings
        insert_embeddings(cursor, entries, embeddings)
        processed = len(entries)

        # 5. Calculate cost
        cost_usd = tokens_used * COST_PER_TOKEN

        # 6. Log to knowledge_ingestion_jobs
        log_ingestion_job(
            cursor,
            entries_count=processed,
            tokens_used=tokens_used,
            cost_usd=cost_usd,
            status="success",
        )

        # 7. Log pipeline run
        summary = (
            f"Processed: {processed}, "
            f"Tokens: {tokens_used}, "
            f"Cost: ${cost_usd:.6f}"
        )
        log_pipeline_run(cursor, start_time, "success", summary)

        conn.commit()
        cursor.close()
        conn.close()

        return (
            json.dumps({
                "status": "success",
                "processed": processed,
                "tokens_used": tokens_used,
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
            log_ingestion_job(
                cursor_err,
                entries_count=processed,
                tokens_used=tokens_used,
                cost_usd=cost_usd,
                status="failed",
                error_msg=error_msg,
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
                "processed": processed,
                "tokens_used": tokens_used,
                "cost_usd": round(cost_usd, 6),
            }),
            500,
            {"Content-Type": "application/json"},
        )
