"""Knowledge Auto-Connector — Category B Pipeline.

Runs every Sunday at 23:00 IST via Cloud Scheduler (1 hour after the weekly
summary pipeline). Computes cross-domain cosine similarity for entries created
in the past 7 days and proposes knowledge_connections for pairs with
similarity > 0.8. Uses Claude Haiku to classify relationship types.

Entry point: main(request)
Deployment: Cloud Run, python312, asia-south1
Service account: ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com
"""

import json
import logging
import os
import uuid
from datetime import datetime, timezone

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


def _openai_api_key() -> str:
    return _get_secret("OPENAI_API_KEY", "OPENAI_API_KEY")


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
# Relationship classification via Claude Haiku
# ---------------------------------------------------------------------------
CLASSIFY_PROMPT = """Given two knowledge entries, classify their relationship.

Entry A (domain: {domain_a}):
Title: {title_a}
Content (first 200 words): {content_a}

Entry B (domain: {domain_b}):
Title: {title_b}
Content (first 200 words): {content_b}

Classify the relationship from A to B as one of:
- relates_to: General topical connection
- derived_from: A is derived from or builds on B
- expands: A expands or elaborates on B
- depends_on: A depends on knowledge in B

Respond with ONLY the relationship type, no explanation."""

VALID_RELATIONSHIP_TYPES = {"relates_to", "derived_from", "expands", "depends_on"}


def classify_relationship(
    domain_a: str,
    title_a: str,
    content_a: str,
    domain_b: str,
    title_b: str,
    content_b: str,
) -> str:
    """Call Claude Haiku to classify the relationship between two entries."""
    client = anthropic.Anthropic(api_key=_anthropic_api_key())
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=32,
        messages=[
            {
                "role": "user",
                "content": CLASSIFY_PROMPT.format(
                    domain_a=domain_a,
                    title_a=title_a,
                    content_a=content_a[:800],
                    domain_b=domain_b,
                    title_b=title_b,
                    content_b=content_b[:800],
                ),
            }
        ],
    )
    result = message.content[0].text.strip().lower()
    # Validate — default to relates_to if model returns unexpected value
    if result not in VALID_RELATIONSHIP_TYPES:
        logger.warning(
            "Unexpected classification '%s', defaulting to relates_to", result
        )
        return "relates_to"
    return result


# ---------------------------------------------------------------------------
# Core pipeline logic
# ---------------------------------------------------------------------------


def get_recent_entries_with_embeddings(cursor) -> list[dict]:
    """Get entries created in the past 7 days that have embeddings."""
    cursor.execute(
        """SELECT ke.id, ke.title, ke.domain::text, ke.sub_domain,
                  LEFT(ke.content, 800) AS content_preview,
                  kv.embedding
           FROM knowledge_entries ke
           JOIN knowledge_embeddings kv ON kv.entry_id = ke.id
           WHERE ke.created_at >= NOW() - INTERVAL '7 days'"""
    )
    cols = [desc[0] for desc in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def find_cross_domain_similar(
    cursor, entry_id: str, embedding_str: str, domain: str
) -> list[dict]:
    """Find top-5 similar entries in OTHER domains with similarity > 0.8.

    The embedding is passed as a string representation for pgvector
    (e.g., '[0.1, 0.2, ...]') to work with pg8000.
    """
    cursor.execute(
        """SELECT ke.id, ke.title, ke.domain::text, ke.sub_domain,
                  LEFT(ke.content, 800) AS content_preview,
                  (1 - (kv.embedding <=> %s::vector(1536)))::float AS similarity
           FROM knowledge_entries ke
           JOIN knowledge_embeddings kv ON kv.entry_id = ke.id
           WHERE ke.id != %s
           AND ke.domain != %s::knowledge_domain
           AND (1 - (kv.embedding <=> %s::vector(1536))) > 0.8
           ORDER BY similarity DESC
           LIMIT 5""",
        (embedding_str, str(entry_id), domain, embedding_str),
    )
    cols = [desc[0] for desc in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def connection_exists(cursor, source_id: str, target_id: str) -> bool:
    """Check if a connection already exists between two entries."""
    cursor.execute(
        """SELECT 1 FROM knowledge_connections
           WHERE (source_entry_id = %s AND target_entry_id = %s)
              OR (source_entry_id = %s AND target_entry_id = %s)
           LIMIT 1""",
        (str(source_id), str(target_id), str(target_id), str(source_id)),
    )
    return cursor.fetchone() is not None


def insert_proposed_connection(
    cursor,
    source_id: str,
    target_id: str,
    relationship_type: str,
    similarity: float,
    title_a: str,
    title_b: str,
):
    """Insert a proposed auto-discovered connection."""
    conn_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    metadata = json.dumps(
        {
            "auto_proposed": True,
            "approved": False,
            "proposed_at": now_iso,
            "similarity_score": round(similarity, 4),
        }
    )
    context = f"Auto-discovered: {title_a} <-> {title_b}"

    cursor.execute(
        """INSERT INTO knowledge_connections
           (id, source_entry_id, target_entry_id, relationship_type,
            strength, context, metadata)
           VALUES (%s, %s, %s, %s::relationship_type_kb, %s, %s, %s)
           ON CONFLICT DO NOTHING""",
        (
            conn_id,
            str(source_id),
            str(target_id),
            relationship_type,
            similarity,
            context,
            metadata,
        ),
    )


# ---------------------------------------------------------------------------
# Pipeline logging
# ---------------------------------------------------------------------------


def log_ingestion_job(cursor, connections_proposed: int, tokens_used: int):
    """Log run to knowledge_ingestion_jobs."""
    job_id = str(uuid.uuid4())
    cursor.execute(
        """INSERT INTO knowledge_ingestion_jobs
           (id, job_type, status, entries_created, embeddings_generated,
            tokens_used, cost_estimate_usd)
           VALUES (%s, 'auto_connection', 'completed', %s, 0, %s, %s)""",
        (
            job_id,
            connections_proposed,
            tokens_used,
            round(tokens_used * 0.001 / 1000, 6),
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
        ("knowledge-auto-connector",),
    )
    pipeline_row = cursor.fetchone()
    if not pipeline_row:
        logger.warning("No pipeline row for knowledge-auto-connector")
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
# Embedding serialization helper
# ---------------------------------------------------------------------------


def embedding_to_pgvector_str(embedding) -> str:
    """Convert a Python list or pg8000 result to pgvector string format.

    pg8000 may return the embedding as a string already (from the vector
    column), or it may be a Python list. This normalises both to the
    '[0.1, 0.2, ...]' format required by pgvector casts.
    """
    if isinstance(embedding, str):
        return embedding
    if isinstance(embedding, (list, tuple)):
        return "[" + ",".join(str(float(v)) for v in embedding) + "]"
    # Fallback: try str() and hope for the best
    return str(embedding)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


@functions_framework.http
def main(request):
    """HTTP entry point for the knowledge auto-connector pipeline."""
    start_time = datetime.now(timezone.utc)
    errors: list[str] = []
    connections_proposed = 0
    pairs_evaluated = 0
    total_tokens = 0

    entries_scanned = 0
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # 1. Get recent entries with embeddings
        recent_entries = get_recent_entries_with_embeddings(cursor)
        entries_scanned = len(recent_entries)
        logger.info(
            "Found %d recent entries with embeddings", len(recent_entries)
        )

        if not recent_entries:
            return {
                "status": "no_entries",
                "message": "No entries with embeddings in the past 7 days",
                "connections_proposed": 0,
            }, 200

        # 2. For each entry, find cross-domain similar entries
        for entry in recent_entries:
            try:
                embedding_str = embedding_to_pgvector_str(entry["embedding"])

                candidates = find_cross_domain_similar(
                    cursor,
                    entry["id"],
                    embedding_str,
                    entry["domain"],
                )

                if not candidates:
                    continue

                # 3. Filter out existing connections
                for candidate in candidates:
                    try:
                        if connection_exists(
                            cursor, entry["id"], candidate["id"]
                        ):
                            continue

                        pairs_evaluated += 1

                        # 4. Classify relationship via Claude Haiku
                        relationship = classify_relationship(
                            domain_a=entry["domain"],
                            title_a=entry["title"],
                            content_a=entry.get("content_preview", ""),
                            domain_b=candidate["domain"],
                            title_b=candidate["title"],
                            content_b=candidate.get("content_preview", ""),
                        )
                        total_tokens += 500  # Rough estimate per call

                        # 5. Insert proposed connection
                        insert_proposed_connection(
                            cursor,
                            source_id=entry["id"],
                            target_id=candidate["id"],
                            relationship_type=relationship,
                            similarity=candidate["similarity"],
                            title_a=entry["title"],
                            title_b=candidate["title"],
                        )
                        conn.commit()
                        connections_proposed += 1

                        logger.info(
                            "Proposed: %s -[%s]-> %s (sim=%.3f)",
                            entry["title"],
                            relationship,
                            candidate["title"],
                            candidate["similarity"],
                        )

                    except Exception as exc:
                        errors.append(
                            f"Pair ({entry['id']}, {candidate['id']}): {exc}"
                        )
                        logger.error(
                            "Error processing pair: %s", exc
                        )
                        conn.rollback()

            except Exception as exc:
                errors.append(f"Entry {entry['id']}: {exc}")
                logger.error(
                    "Error finding similar for entry %s: %s",
                    entry["id"],
                    exc,
                )
                conn.rollback()

        # 6. Log ingestion job
        try:
            log_ingestion_job(cursor, connections_proposed, total_tokens)
            conn.commit()
        except Exception as exc:
            errors.append(f"Ingestion job logging: {exc}")
            logger.error("Error logging ingestion job: %s", exc)
            conn.rollback()

        # 7. Log pipeline run
        try:
            status = "success" if not errors else "failed"
            output_summary = (
                f"Entries scanned: {len(recent_entries)}, "
                f"Pairs evaluated: {pairs_evaluated}, "
                f"Connections proposed: {connections_proposed}, "
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
            "connections_proposed": connections_proposed,
        }, 500

    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass

    return {
        "status": "success" if not errors else "partial_failure",
        "entries_scanned": entries_scanned,
        "pairs_evaluated": pairs_evaluated,
        "connections_proposed": connections_proposed,
        "total_tokens": total_tokens,
        "errors": errors,
    }
