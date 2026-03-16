"""Create a Google Tasks notification with the brief summary and Drive link."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from collectors.tasks import TaskSnapshot
from collectors.gmail import GmailSnapshot

logger = logging.getLogger(__name__)

IST = timezone(timedelta(hours=5, minutes=30))
TASK_LIST_NAME = "AI OS: Daily Brief"


def _get_or_create_task_list(tasks_service: Any) -> str:
    """Find or create the 'AI OS: Daily Brief' task list, return its ID."""
    result = tasks_service.tasklists().list(maxResults=100).execute()
    for tl in result.get("items", []):
        if tl["title"] == TASK_LIST_NAME:
            return tl["id"]

    # Create it
    new_list = tasks_service.tasklists().insert(
        body={"title": TASK_LIST_NAME}
    ).execute()
    logger.info("Created task list: %s", TASK_LIST_NAME)
    return new_list["id"]


def deliver(
    tasks_service: Any,
    task_snapshot: TaskSnapshot,
    gmail_snapshot: GmailSnapshot,
    drive_url: str,
    suggestions: list[str],
) -> str | None:
    """Create a Google Tasks entry for the daily brief. Returns task ID or None."""
    try:
        now = datetime.now(IST)
        task_list_id = _get_or_create_task_list(tasks_service)

        # Build title
        title = f"Daily Brief \u2014 {now.strftime('%a, %d %b')}"

        # Build description
        stats_parts = []
        if task_snapshot.overdue:
            stats_parts.append(f"{len(task_snapshot.overdue)} overdue")
        if task_snapshot.today:
            stats_parts.append(f"{len(task_snapshot.today)} due today")
        if gmail_snapshot.available and gmail_snapshot.action_items:
            stats_parts.append(f"{len(gmail_snapshot.action_items)} emails need action")
        stats_line = " | ".join(stats_parts) if stats_parts else "All clear today"

        top_priority = suggestions[0] if suggestions else "Check full brief for details"

        notes = f"{stats_line}\n\nTop priority: {top_priority}\n\n\U0001f4c4 Full brief: {drive_url}"

        # Due date in RFC 3339 (required by Tasks API)
        due_date = now.strftime("%Y-%m-%dT00:00:00.000Z")

        task_body = {
            "title": title,
            "notes": notes,
            "due": due_date,
        }

        created = tasks_service.tasks().insert(
            tasklist=task_list_id,
            body=task_body,
        ).execute()

        task_id = created.get("id")
        logger.info("Created Google Task: %s (id=%s)", title, task_id)
        return task_id

    except Exception as exc:
        logger.error("Google Tasks delivery failed: %s", exc)
        return None
