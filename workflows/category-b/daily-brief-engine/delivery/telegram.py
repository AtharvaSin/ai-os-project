"""Send a condensed brief via Telegram as a secondary notification channel."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from collectors.tasks import TaskSnapshot
from collectors.gmail import GmailSnapshot

logger = logging.getLogger(__name__)

IST = timezone(timedelta(hours=5, minutes=30))
TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


def _build_condensed_message(
    task_snapshot: TaskSnapshot,
    gmail_snapshot: GmailSnapshot,
    suggestions: list[str],
    drive_url: str,
) -> str:
    """Build a condensed Telegram message (~15 lines max)."""
    now = datetime.now(IST)
    lines: list[str] = []

    lines.append(f"\U0001f4cb Daily Brief \u2014 {now.strftime('%a, %d %b %Y')}")
    lines.append("")

    # Stats line
    stats = []
    if task_snapshot.overdue:
        stats.append(f"\U0001f534 {len(task_snapshot.overdue)} overdue")
    if task_snapshot.today:
        stats.append(f"\U0001f7e1 {len(task_snapshot.today)} due today")
    if gmail_snapshot.available and gmail_snapshot.action_items:
        stats.append(f"\U0001f4ec {len(gmail_snapshot.action_items)} emails")
    lines.append(" | ".join(stats) if stats else "\u2705 All clear today")
    lines.append("")

    # Top 3 priorities
    if suggestions:
        lines.append("\U0001f3af Today's Focus:")
        for i, s in enumerate(suggestions[:3], 1):
            # Truncate to 80 chars for Telegram readability
            s_short = s[:80] + "..." if len(s) > 80 else s
            lines.append(f"  {i}. {s_short}")
        lines.append("")

    # Drive link
    if drive_url:
        lines.append(f"\U0001f4c4 Full brief: {drive_url}")

    return "\n".join(lines)


def deliver(
    bot_token: str,
    chat_id: str,
    task_snapshot: TaskSnapshot,
    gmail_snapshot: GmailSnapshot,
    suggestions: list[str],
    drive_url: str,
) -> bool:
    """Send condensed brief via Telegram. Returns True on success."""
    if not bot_token or not chat_id:
        logger.warning("Telegram credentials missing — skipping delivery")
        return False

    try:
        message = _build_condensed_message(
            task_snapshot, gmail_snapshot, suggestions, drive_url
        )

        url = TELEGRAM_API.format(token=bot_token)
        payload = {
            "chat_id": chat_id,
            "text": message,
            "disable_web_page_preview": True,
        }

        response = httpx.post(url, json=payload, timeout=10)
        response.raise_for_status()

        logger.info("Telegram brief sent to chat %s", chat_id)
        return True

    except Exception as exc:
        logger.error("Telegram delivery failed: %s", exc)
        return False
