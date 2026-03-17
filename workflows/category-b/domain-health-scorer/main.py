"""Domain Health Scorer — Category B Pipeline.

Runs weekly (Sunday 18:00 IST) via Cloud Scheduler. Computes health scores
for every active numbered life domain and upserts snapshots into
domain_health_snapshots. Logs the pipeline run to pipeline_runs.

Entry point: FastAPI app (uvicorn main:app)
Deployment: Cloud Run, python3.12, asia-south1
Service account: ai-os-cloud-functions@ai-operating-system-490208.iam.gserviceaccount.com
"""

from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import date, datetime, timedelta, timezone

import asyncpg
from fastapi import FastAPI
from google.cloud.sql.connector import Connector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PIPELINE_SLUG = "domain-health-scorer"

app = FastAPI(title="Domain Health Scorer", version="1.0.0")

# ---------------------------------------------------------------------------
# Database connection
# ---------------------------------------------------------------------------

_connector: Connector | None = None


async def _get_asyncpg_conn(connector: Connector) -> asyncpg.Connection:
    """Create an asyncpg connection via the Cloud SQL Python Connector."""
    instance = os.getenv(
        "INSTANCE_CONNECTION_NAME",
        "bharatvarsh-website:us-central1:bharatvarsh-db",
    )

    async def _connect():  # type: ignore[return]
        return await connector.connect_async(
            instance,
            "asyncpg",
            user=os.getenv("DB_USER", "ai_os_admin"),
            password=os.getenv("DB_PASSWORD", ""),
            db=os.getenv("DB_NAME", "ai_os"),
        )

    return await _connect()


async def get_pool() -> asyncpg.Pool:
    """Return a connection pool backed by the Cloud SQL connector.

    Falls back to a direct TCP connection for local development with
    cloud-sql-proxy running on localhost:5432.
    """
    global _connector  # noqa: PLW0603

    # Local dev: cloud-sql-proxy exposes TCP on localhost
    if not os.getenv("K_SERVICE"):
        return await asyncpg.create_pool(
            user=os.getenv("DB_USER", "ai_os_admin"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "ai_os"),
            host="127.0.0.1",
            port=5432,
            min_size=1,
            max_size=2,
        )

    # Cloud Run: use Cloud SQL Python Connector
    _connector = Connector()
    instance = os.getenv(
        "INSTANCE_CONNECTION_NAME",
        "bharatvarsh-website:us-central1:bharatvarsh-db",
    )

    async def _connect(conn_str: str | None = None):  # noqa: ARG001
        return await _connector.connect_async(
            instance,
            "asyncpg",
            user=os.getenv("DB_USER", "ai_os_admin"),
            password=os.getenv("DB_PASSWORD", ""),
            db=os.getenv("DB_NAME", "ai_os"),
        )

    return await asyncpg.create_pool(
        host="127.0.0.1",  # ignored — connector overrides
        connect=_connect,
        min_size=1,
        max_size=2,
    )


# ---------------------------------------------------------------------------
# Recency decay helper
# ---------------------------------------------------------------------------


def recency_score(days_since_activity: int) -> float:
    """Return a 0.0-1.0 recency score based on days since last activity.

    Decay thresholds:
        0-3 days  -> 1.00
        4-7 days  -> 0.75
        8-14 days -> 0.50
        15-30 days -> 0.25
        30+ days  -> 0.10
    """
    if days_since_activity <= 3:
        return 1.0
    if days_since_activity <= 7:
        return 0.75
    if days_since_activity <= 14:
        return 0.50
    if days_since_activity <= 30:
        return 0.25
    return 0.10


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict:
    """Liveness / readiness probe."""
    return {"service": "domain-health-scorer", "status": "healthy"}


# ---------------------------------------------------------------------------
# Main computation endpoint
# ---------------------------------------------------------------------------


@app.post("/cron/compute-health")
async def compute_health() -> dict:
    """Compute weekly health scores for all active numbered domains.

    For each domain where domain_number IS NOT NULL and status = 'active':
      1. Gather task stats (total, completed, overdue, done in 7d, last activity).
      2. Gather objective stats (count, avg progress_pct).
      3. Count active automations.
      4. Compute health_score using the weighted formula.
      5. Upsert into domain_health_snapshots.
      6. Log the pipeline run to pipeline_runs.
    """
    start_time = datetime.now(timezone.utc)
    results: list[dict] = []
    errors: list[str] = []

    pool: asyncpg.Pool | None = None
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            # ------------------------------------------------------------------
            # 1. Fetch all active numbered domains
            # ------------------------------------------------------------------
            domains = await conn.fetch(
                """
                SELECT id, slug, name, domain_number
                FROM life_domains
                WHERE domain_number IS NOT NULL
                  AND status = 'active'
                ORDER BY domain_number
                """
            )

            today = date.today()

            for domain in domains:
                try:
                    did = domain["id"]

                    # ----------------------------------------------------------
                    # 2. Task stats
                    # ----------------------------------------------------------
                    task_stats = await conn.fetchrow(
                        """
                        SELECT
                            COUNT(*)::int AS total,
                            COUNT(*) FILTER (
                                WHERE status = 'done'
                            )::int AS completed,
                            COUNT(*) FILTER (
                                WHERE due_date < CURRENT_DATE
                                  AND status NOT IN ('done', 'cancelled')
                            )::int AS overdue,
                            COUNT(*) FILTER (
                                WHERE status = 'done'
                                  AND completed_at >= NOW() - INTERVAL '7 days'
                            )::int AS done_7d,
                            MAX(GREATEST(
                                updated_at,
                                COALESCE(completed_at, '1970-01-01'::timestamptz)
                            )) AS last_activity
                        FROM tasks
                        WHERE domain_id = $1
                        """,
                        did,
                    )

                    total = task_stats["total"] or 0
                    completed = task_stats["completed"] or 0
                    overdue = task_stats["overdue"] or 0
                    done_7d = task_stats["done_7d"] or 0
                    last_activity = task_stats["last_activity"]

                    # ----------------------------------------------------------
                    # 3. Objective stats
                    # ----------------------------------------------------------
                    obj_stats = await conn.fetchrow(
                        """
                        SELECT
                            COUNT(*)::int AS total,
                            COALESCE(AVG(progress_pct), 0) AS avg_progress
                        FROM domain_context_items
                        WHERE domain_id = $1
                          AND item_type = 'objective'
                        """,
                        did,
                    )

                    obj_total = obj_stats["total"] or 0
                    obj_avg_progress = float(obj_stats["avg_progress"] or 0)

                    # ----------------------------------------------------------
                    # 4. Active automations
                    # ----------------------------------------------------------
                    auto_count = await conn.fetchval(
                        """
                        SELECT COUNT(*)::int
                        FROM domain_context_items
                        WHERE domain_id = $1
                          AND item_type = 'automation'
                          AND status = 'active'
                        """,
                        did,
                    )
                    auto_count = auto_count or 0

                    # ----------------------------------------------------------
                    # 5. Compute health score
                    # ----------------------------------------------------------
                    task_completion_rate = completed / max(total, 1)
                    objective_progress = obj_avg_progress / 100.0

                    if last_activity is not None:
                        days_since = (today - last_activity.date()).days
                    else:
                        days_since = 999

                    recency = recency_score(days_since)
                    automation_coverage = 1.0 if auto_count > 0 else 0.0

                    health = round(
                        task_completion_rate * 0.40
                        + objective_progress * 0.30
                        + recency * 0.20
                        + automation_coverage * 0.10,
                        2,
                    )
                    velocity = round(done_7d / 7.0, 2)

                    # ----------------------------------------------------------
                    # 6. Upsert snapshot
                    # ----------------------------------------------------------
                    await conn.execute(
                        """
                        INSERT INTO domain_health_snapshots
                            (domain_id, snapshot_date, tasks_total, tasks_completed,
                             tasks_overdue, objectives_total, objectives_progress,
                             automations_active, health_score, velocity_7d,
                             days_since_activity)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT (domain_id, snapshot_date) DO UPDATE SET
                            tasks_total = EXCLUDED.tasks_total,
                            tasks_completed = EXCLUDED.tasks_completed,
                            tasks_overdue = EXCLUDED.tasks_overdue,
                            objectives_total = EXCLUDED.objectives_total,
                            objectives_progress = EXCLUDED.objectives_progress,
                            automations_active = EXCLUDED.automations_active,
                            health_score = EXCLUDED.health_score,
                            velocity_7d = EXCLUDED.velocity_7d,
                            days_since_activity = EXCLUDED.days_since_activity
                        """,
                        did,
                        today,
                        total,
                        completed,
                        overdue,
                        obj_total,
                        obj_avg_progress,
                        auto_count,
                        health,
                        velocity,
                        days_since,
                    )

                    results.append(
                        {
                            "domain": domain["name"],
                            "domain_number": domain["domain_number"],
                            "health_score": health,
                            "tasks_total": total,
                            "tasks_completed": completed,
                            "tasks_overdue": overdue,
                            "velocity_7d": velocity,
                            "days_since_activity": days_since,
                        }
                    )

                    logger.info(
                        "Scored domain %s (%s): health=%.2f velocity=%.2f",
                        domain["name"],
                        domain["domain_number"],
                        health,
                        velocity,
                    )

                except Exception as exc:
                    error_msg = (
                        f"Domain {domain['name']} "
                        f"({domain['domain_number']}): {exc}"
                    )
                    logger.error(error_msg)
                    errors.append(error_msg)

            # ------------------------------------------------------------------
            # 7. Log pipeline run
            # ------------------------------------------------------------------
            try:
                duration_ms = int(
                    (datetime.now(timezone.utc) - start_time).total_seconds()
                    * 1000
                )
                run_status = "success" if not errors else "failed"
                summary = json.dumps(
                    {
                        "domains_scored": len(results),
                        "errors": len(errors),
                        "results": results,
                    }
                )
                error_text = "; ".join(errors) if errors else None

                pipeline_id = await conn.fetchval(
                    "SELECT id FROM pipelines WHERE slug = $1",
                    PIPELINE_SLUG,
                )
                if pipeline_id:
                    await conn.execute(
                        """
                        INSERT INTO pipeline_runs
                            (id, pipeline_id, status, trigger_type, triggered_by,
                             started_at, completed_at, duration_ms,
                             output_summary, error_message)
                        VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9)
                        """,
                        uuid.uuid4(),
                        pipeline_id,
                        run_status,
                        "scheduled",
                        "cloud-scheduler",
                        start_time,
                        duration_ms,
                        summary,
                        error_text,
                    )
                else:
                    logger.warning(
                        "Pipeline '%s' not registered — skipping run log.",
                        PIPELINE_SLUG,
                    )
            except Exception as exc:
                logger.error("Failed to log pipeline run: %s", exc)

    except Exception as exc:
        logger.exception("Fatal error in compute_health")
        return {
            "status": "error",
            "error": str(exc),
            "domains_scored": len(results),
            "results": results,
        }
    finally:
        if pool:
            await pool.close()
        if _connector:
            await _connector.close_async()

    return {
        "status": "success" if not errors else "partial_failure",
        "domains_scored": len(results),
        "errors": errors,
        "duration_ms": int(
            (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        ),
        "results": results,
    }
