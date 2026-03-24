"""Daily Brief Engine — FastAPI service that composes a morning intelligence brief.

Aggregates tasks, knowledge, Gmail, calendar, and domain health data into a
formatted brief, saves to Google Drive, and pushes notifications via Google
Tasks and Telegram.

v2 — 6-section brief: Schedule, Zealogics Focus, Priority Inbox,
      Domain Health, 3-Day Momentum, Suggested Focus.
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, Request

import config
from collectors import tasks as task_collector
from collectors import knowledge as knowledge_collector
from collectors import gmail as gmail_collector
from collectors import calendar as calendar_collector
from collectors import domains as domain_collector
from composer import formatter, ai_composer
from delivery import drive as drive_delivery
from delivery import google_tasks as tasks_delivery
from delivery import telegram as telegram_delivery

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

IST = timezone(timedelta(hours=5, minutes=30))

app = FastAPI(title="Daily Brief Engine", version="2.0.0")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health() -> dict:
    """Liveness / readiness probe."""
    status = {"service": "daily-brief-engine", "status": "healthy", "version": "2.0.0"}
    try:
        conn = await asyncio.to_thread(config.get_db_connection)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        conn.close()
        status["db"] = "connected"
    except Exception as exc:
        status["db"] = f"error: {exc}"
        status["status"] = "degraded"
    return status


# ---------------------------------------------------------------------------
# Main brief generation endpoint
# ---------------------------------------------------------------------------
@app.post("/cron/daily-brief")
async def generate_daily_brief(request: Request) -> dict:
    """Generate and deliver the daily intelligence brief."""
    run_id = str(uuid.uuid4())
    start_time = datetime.now(timezone.utc)
    errors: list[str] = []

    logger.info("Starting daily brief generation v2 (run_id=%s)", run_id)

    # ------------------------------------------------------------------
    # 1. COLLECT — run all 5 collectors in parallel
    # ------------------------------------------------------------------
    conn = None
    try:
        conn = await asyncio.to_thread(config.get_db_connection)
    except Exception as exc:
        logger.error("DB connection failed: %s", exc)
        return {"status": "error", "error": f"DB connection failed: {exc}"}

    # Build Google services (may fail individually)
    gmail_service = None
    calendar_service = None
    drive_service = None
    tasks_service = None

    try:
        gmail_service = await asyncio.to_thread(config.get_gmail_service)
    except Exception as exc:
        errors.append(f"Gmail service init failed: {exc}")
        logger.warning("Gmail service unavailable: %s", exc)

    try:
        calendar_service = await asyncio.to_thread(config.get_calendar_service)
    except Exception as exc:
        errors.append(f"Calendar service init failed: {exc}")
        logger.warning("Calendar service unavailable: %s", exc)

    try:
        drive_service = await asyncio.to_thread(config.get_drive_service)
    except Exception as exc:
        errors.append(f"Drive service init failed: {exc}")
        logger.warning("Drive service unavailable: %s", exc)

    try:
        tasks_service = await asyncio.to_thread(config.get_tasks_service)
    except Exception as exc:
        errors.append(f"Tasks service init failed: {exc}")
        logger.warning("Tasks service unavailable: %s", exc)

    # Run collectors in parallel
    async def collect_tasks():
        try:
            return await asyncio.to_thread(task_collector.collect, conn)
        except Exception as exc:
            errors.append(f"Task collector: {exc}")
            logger.error("Task collector failed: %s", exc)
            return task_collector.TaskSnapshot()

    async def collect_knowledge():
        try:
            kb_conn = await asyncio.to_thread(config.get_db_connection)
            result = await asyncio.to_thread(knowledge_collector.collect, kb_conn)
            kb_conn.close()
            return result
        except Exception as exc:
            errors.append(f"Knowledge collector: {exc}")
            logger.error("Knowledge collector failed: %s", exc)
            return knowledge_collector.KnowledgeSnapshot(available=False)

    async def collect_gmail():
        if not gmail_service:
            return gmail_collector.GmailSnapshot(available=False)
        try:
            return await asyncio.to_thread(gmail_collector.collect, gmail_service)
        except Exception as exc:
            errors.append(f"Gmail collector: {exc}")
            logger.error("Gmail collector failed: %s", exc)
            return gmail_collector.GmailSnapshot(available=False)

    async def collect_calendar():
        if not calendar_service:
            return calendar_collector.CalendarSnapshot(available=False)
        try:
            return await asyncio.to_thread(calendar_collector.collect, calendar_service)
        except Exception as exc:
            errors.append(f"Calendar collector: {exc}")
            logger.error("Calendar collector failed: %s", exc)
            return calendar_collector.CalendarSnapshot(available=False)

    async def collect_domains():
        try:
            dom_conn = await asyncio.to_thread(config.get_db_connection)
            result = await asyncio.to_thread(domain_collector.collect, dom_conn)
            dom_conn.close()
            return result
        except Exception as exc:
            errors.append(f"Domain collector: {exc}")
            logger.error("Domain collector failed: %s", exc)
            return domain_collector.DomainsSnapshot(available=False)

    task_data, knowledge_data, gmail_data, calendar_data, domain_data = await asyncio.gather(
        collect_tasks(),
        collect_knowledge(),
        collect_gmail(),
        collect_calendar(),
        collect_domains(),
    )

    logger.info(
        "Collection complete — tasks(overdue=%d, today=%d, zealogics=%d), "
        "gmail(actions=%d), calendar(events=%d), domains(count=%d)",
        len(task_data.overdue),
        len(task_data.today),
        len(task_data.zealogics_tasks),
        len(gmail_data.action_items),
        len(calendar_data.today_events),
        domain_data.total_active_domains,
    )

    # ------------------------------------------------------------------
    # 2. COMPOSE — generate AI suggestions + momentum + format brief
    # ------------------------------------------------------------------
    api_key = config.get_anthropic_api_key()
    ai_output = await asyncio.to_thread(
        ai_composer.generate_brief_intelligence,
        api_key,
        task_data,
        gmail_data,
        calendar_data,
        domain_data,
    )

    suggestions = ai_output.suggestions
    momentum_commentary = ai_output.momentum_commentary

    # Compose brief (without drive_url first — we'll update after upload)
    brief_text = formatter.compose_brief(
        tasks=task_data,
        knowledge=knowledge_data,
        gmail=gmail_data,
        calendar=calendar_data,
        domains=domain_data,
        suggestions=suggestions,
        momentum_commentary=momentum_commentary,
        drive_url=None,
    )

    logger.info("Brief composed (%d chars, %d lines)", len(brief_text), brief_text.count("\n") + 1)

    # ------------------------------------------------------------------
    # 3. DELIVER — save to Drive, push notifications
    # ------------------------------------------------------------------
    drive_url = ""
    drive_file_id = ""

    # 3a. Google Drive
    if drive_service:
        try:
            drive_url, drive_file_id = await asyncio.to_thread(
                drive_delivery.deliver,
                drive_service,
                brief_text,
                config.BRIEF_DRIVE_FOLDER,
                conn,
            )
            # Re-compose with Drive URL in footer
            brief_text = formatter.compose_brief(
                tasks=task_data,
                knowledge=knowledge_data,
                gmail=gmail_data,
                calendar=calendar_data,
                domains=domain_data,
                suggestions=suggestions,
                momentum_commentary=momentum_commentary,
                drive_url=drive_url,
            )
            # Update Drive doc with the URL-containing version
            try:
                import io
                from googleapiclient.http import MediaIoBaseUpload
                media = MediaIoBaseUpload(
                    io.BytesIO(brief_text.encode("utf-8")),
                    mimetype="text/plain",
                    resumable=False,
                )
                await asyncio.to_thread(
                    lambda: drive_service.files().update(
                        fileId=drive_file_id,
                        media_body=media,
                    ).execute()
                )
            except Exception:
                pass  # Non-critical — brief already saved without self-link
        except Exception as exc:
            errors.append(f"Drive delivery: {exc}")
            logger.error("Drive delivery failed: %s", exc)

    # 3b. Google Tasks notification
    google_task_id = None
    if tasks_service and drive_url:
        google_task_id = await asyncio.to_thread(
            tasks_delivery.deliver,
            tasks_service,
            task_data,
            gmail_data,
            drive_url,
            suggestions,
        )

    # 3c. Telegram (optional)
    telegram_sent = False
    if config.TELEGRAM_BRIEF_ENABLED:
        tg_config = config.get_telegram_config()
        telegram_sent = await asyncio.to_thread(
            telegram_delivery.deliver,
            tg_config["bot_token"],
            tg_config["chat_id"],
            task_data,
            gmail_data,
            calendar_data,
            domain_data,
            suggestions,
            momentum_commentary,
            drive_url,
        )

    # ------------------------------------------------------------------
    # 4. LOG — pipeline run + notification log
    # ------------------------------------------------------------------
    # Reset connection state — collectors may have left aborted transactions
    try:
        conn.rollback()
    except Exception:
        pass

    duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
    # DB enum: running | success | failed | cancelled
    status = "success" if not errors else "failed"

    output_summary = {
        "overdue_tasks": len(task_data.overdue),
        "today_tasks": len(task_data.today),
        "zealogics_tasks": len(task_data.zealogics_tasks),
        "gmail_actions": len(gmail_data.action_items),
        "calendar_events": len(calendar_data.today_events),
        "active_domains": domain_data.total_active_domains,
        "domains_needing_attention": domain_data.domains_needing_attention,
        "knowledge_available": knowledge_data.available,
        "suggestions_count": len(suggestions),
        "has_momentum": bool(momentum_commentary),
        "drive_url": drive_url,
        "google_task_id": google_task_id,
        "telegram_sent": telegram_sent,
        "errors": errors,
    }

    # Log pipeline run (best-effort)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM pipelines WHERE slug = %s", (config.PIPELINE_SLUG,)
        )
        pipeline_row = cursor.fetchone()
        if pipeline_row:
            cursor.execute(
                """
                INSERT INTO pipeline_runs
                    (id, pipeline_id, status, trigger_type, started_at, completed_at,
                     duration_ms, output_summary, error_message)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    run_id,
                    str(pipeline_row[0]),
                    status,
                    "scheduled",
                    start_time.isoformat(),
                    datetime.now(timezone.utc).isoformat(),
                    duration_ms,
                    json.dumps(output_summary),
                    "; ".join(errors) if errors else None,
                ),
            )
            conn.commit()
    except Exception as exc:
        logger.warning("Pipeline run logging failed: %s", exc)

    # Log notification (best-effort) — one row per channel
    try:
        cursor = conn.cursor()
        now_utc = datetime.now(timezone.utc).isoformat()
        brief_title = f"Daily Brief — {datetime.now(IST).strftime('%a, %d %b %Y')}"
        meta = json.dumps({"run_id": run_id, "drive_url": drive_url})

        if drive_url or google_task_id:
            cursor.execute(
                """
                INSERT INTO notification_log
                    (notification_type, channel, recipient, message_preview, delivered_at, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                ("daily_brief", "push", "atharva", brief_title, now_utc, meta),
            )
        if telegram_sent:
            cursor.execute(
                """
                INSERT INTO notification_log
                    (notification_type, channel, recipient, message_preview, delivered_at, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                ("daily_brief", "telegram", "atharva", brief_title, now_utc, meta),
            )
        conn.commit()
    except Exception as exc:
        logger.warning("Notification logging failed: %s", exc)

    # Close DB connection
    try:
        conn.close()
    except Exception:
        pass

    logger.info(
        "Daily brief v2 complete — status=%s, duration=%dms, drive=%s",
        status, duration_ms, drive_url,
    )

    return {
        "status": status,
        "run_id": run_id,
        "duration_ms": duration_ms,
        "summary": output_summary,
    }


# ---------------------------------------------------------------------------
# Root redirect
# ---------------------------------------------------------------------------
@app.get("/")
async def root() -> dict:
    return {"service": "daily-brief-engine", "version": "2.0.0"}
