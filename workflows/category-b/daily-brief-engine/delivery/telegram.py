"""Send a condensed brief via Telegram as a secondary notification channel."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from collectors.tasks import TaskSnapshot
from collectors.gmail import GmailSnapshot
from collectors.calendar import CalendarSnapshot
from collectors.domains import DomainsSnapshot

logger = logging.getLogger(__name__)

IST = timezone(timedelta(hours=5, minutes=30))
TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"


def _build_condensed_message(
    task_snapshot: TaskSnapshot,
    gmail_snapshot: GmailSnapshot,
    calendar_snapshot: CalendarSnapshot,
    domains_snapshot: DomainsSnapshot,
    suggestions: list[str],
    momentum_commentary: str,
    drive_url: str,
) -> str:
    """Build a condensed Telegram message (~20 lines max)."""
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
    if calendar_snapshot.available and calendar_snapshot.today_events:
        stats.append(f"\U0001f4c5 {len(calendar_snapshot.today_events)} meetings")
    lines.append(" | ".join(stats) if stats else "\u2705 All clear today")
    lines.append("")

    # Zealogics tasks count
    if task_snapshot.zealogics_tasks:
        zl_overdue = sum(1 for t in task_snapshot.zealogics_tasks
                         if t.due_date and t.due_date < now.date())
        zl_line = f"\U0001f3e2 Zealogics: {len(task_snapshot.zealogics_tasks)} active"
        if zl_overdue:
            zl_line += f" ({zl_overdue} overdue)"
        lines.append(zl_line)
        lines.append("")

    # Domain health flags
    if domains_snapshot.available and domains_snapshot.domains_needing_attention:
        lines.append(f"\u26a0\ufe0f Needs focus: {', '.join(domains_snapshot.domains_needing_attention[:3])}")
        lines.append("")

    # Momentum one-liner (first line of commentary)
    if momentum_commentary:
        first_line = momentum_commentary.strip().split("\n")[0]
        if len(first_line) > 100:
            first_line = first_line[:97] + "..."
        lines.append(f"\U0001f4c8 {first_line}")
        lines.append("")

    # Top 3 priorities
    if suggestions:
        lines.append("\U0001f3af Today's Focus:")
        for i, s in enumerate(suggestions[:3], 1):
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
    calendar_snapshot: CalendarSnapshot,
    domains_snapshot: DomainsSnapshot,
    suggestions: list[str],
    momentum_commentary: str,
    drive_url: str,
) -> bool:
    """Send condensed brief via Telegram. Returns True on success."""
    if not bot_token or not chat_id:
        logger.warning("Telegram credentials missing — skipping delivery")
        return False

    try:
        message = _build_condensed_message(
            task_snapshot, gmail_snapshot, calendar_snapshot,
            domains_snapshot, suggestions, momentum_commentary, drive_url,
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
