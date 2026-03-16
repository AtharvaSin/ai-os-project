"""Telegram MarkdownV2 formatting utilities.

All outbound messages to Telegram must use MarkdownV2 parse mode.
Special characters must be escaped or messages will fail to send.
"""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any


# Characters that must be escaped in MarkdownV2 (outside of code blocks)
_MD_SPECIAL = re.compile(r"([_*\[\]()~`>#+\-=|{}.!\\])")


def escape_md(text: str) -> str:
    """Escape all MarkdownV2 special characters."""
    return _MD_SPECIAL.sub(r"\\\1", str(text))


def bold(text: str) -> str:
    """Wrap text in bold (already-escaped text only)."""
    return f"*{text}*"


def italic(text: str) -> str:
    """Wrap text in italic (already-escaped text only)."""
    return f"_{text}_"


def code(text: str) -> str:
    """Wrap text in inline code (no escaping needed inside backticks)."""
    return f"`{text}`"


def code_block(text: str, lang: str = "") -> str:
    """Wrap text in a code block."""
    return f"```{lang}\n{text}\n```"


def build_inline_keyboard(
    buttons: list[list[dict[str, str]]],
) -> dict[str, Any]:
    """Build reply_markup dict for inline keyboard.

    Args:
        buttons: 2D array of button dicts with 'text' and 'callback_data' or 'url' keys.
                 Each inner list is one row of buttons.

    Returns:
        Dict suitable for reply_markup parameter in Telegram API.
    """
    return {
        "inline_keyboard": [
            [
                {k: v for k, v in btn.items() if v is not None}
                for btn in row
            ]
            for row in buttons
        ]
    }


def split_message(text: str, max_len: int = 4096) -> list[str]:
    """Split a long message at line boundaries to fit Telegram's limit."""
    if len(text) <= max_len:
        return [text]

    parts: list[str] = []
    current = ""

    for line in text.split("\n"):
        if len(current) + len(line) + 1 > max_len:
            if current:
                parts.append(current)
            current = line[:max_len]  # Truncate single lines that exceed limit
        else:
            current = f"{current}\n{line}" if current else line

    if current:
        parts.append(current)

    return parts


def format_task(task: dict[str, Any]) -> str:
    """Format a task row for Telegram display."""
    sid = str(task.get("id", ""))[:8]
    title = escape_md(task.get("title", "Untitled"))
    priority = task.get("priority", "medium")
    status = task.get("status", "todo")
    due = task.get("due_date")

    priority_icon = {"urgent": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(
        priority, "⚪"
    )
    status_icon = {"done": "✅", "in_progress": "🔧", "blocked": "🚫", "todo": "📋"}.get(
        status, "📋"
    )

    due_str = ""
    if due:
        if isinstance(due, (date, datetime)):
            due_str = f" \\| due {escape_md(due.strftime('%b %d'))}"
        else:
            due_str = f" \\| due {escape_md(str(due)[:10])}"

    return f"{priority_icon} {status_icon} {code(sid)} {bold(title)}{due_str}"


def format_project_status(project: dict[str, Any]) -> str:
    """Format a project summary for Telegram display."""
    name = escape_md(project.get("name", "Unknown"))
    total = project.get("total_tasks", 0)
    done = project.get("done_tasks", 0)
    overdue = project.get("overdue_tasks", 0)
    blocked = project.get("blocked_tasks", 0)

    lines = [bold(name)]
    lines.append(f"  Tasks: {escape_md(str(done))}/{escape_md(str(total))} done")
    if overdue:
        lines.append(f"  ⚠️ {escape_md(str(overdue))} overdue")
    if blocked:
        lines.append(f"  🚫 {escape_md(str(blocked))} blocked")

    return "\n".join(lines)
