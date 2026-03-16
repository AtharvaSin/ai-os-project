"""Telegram command router — parses and handles /slash commands.

5 commands in T1: /brief, /add, /done, /status, /log
Each handler receives (args: str, pool: asyncpg.Pool) and returns
a dict with 'text' and optional 'reply_markup' and 'parse_mode' keys.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import date, datetime, timedelta
from typing import Any

import asyncpg

from app.telegram.formatter import (
    bold,
    code,
    escape_md,
    format_project_status,
    format_task,
    build_inline_keyboard,
)

# --- Project aliases (corrected UUIDs from seeds/001) ---

PROJECT_ALIASES: dict[str, tuple[str | None, str]] = {
    "aios": ("a1000000-0000-0000-0000-000000000001", "AI Operating System"),
    "os": ("a1000000-0000-0000-0000-000000000001", "AI Operating System"),
    "aiu": ("a1000000-0000-0000-0000-000000000002", "AI&U"),
    "youtube": ("a1000000-0000-0000-0000-000000000002", "AI&U"),
    "bv": ("a1000000-0000-0000-0000-000000000003", "Bharatvarsh"),
    "novel": ("a1000000-0000-0000-0000-000000000003", "Bharatvarsh"),
    "zeal": (None, "Zealogics"),
    "personal": (None, "Personal"),
}

# Reverse lookup: UUID → (alias, name)
UUID_TO_PROJECT: dict[str, str] = {
    "a1000000-0000-0000-0000-000000000001": "AI Operating System",
    "a1000000-0000-0000-0000-000000000002": "AI&U",
    "a1000000-0000-0000-0000-000000000003": "Bharatvarsh",
}

# Priority aliases
PRIORITY_ALIASES: dict[str, str] = {
    "urgent": "urgent",
    "u": "urgent",
    "high": "high",
    "h": "high",
    "medium": "medium",
    "m": "medium",
    "low": "low",
    "l": "low",
}

# Day name → weekday number (Monday=0)
DAY_NAMES: dict[str, int] = {
    "monday": 0, "mon": 0,
    "tuesday": 1, "tue": 1,
    "wednesday": 2, "wed": 2,
    "thursday": 3, "thu": 3,
    "friday": 4, "fri": 4,
    "saturday": 5, "sat": 5,
    "sunday": 6, "sun": 6,
}

# Month abbreviation → number
MONTH_MAP: dict[str, int] = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4,
    "may": 5, "jun": 6, "jul": 7, "aug": 8,
    "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}


def parse_command(text: str) -> tuple[str | None, str]:
    """Parse a Telegram message into (command, args).

    Returns (None, text) if not a command.
    """
    if not text or not text.startswith("/"):
        return None, text

    # Handle /command@botname format
    parts = text.split(None, 1)
    cmd = parts[0].lower().split("@")[0]  # Remove @botname suffix
    args = parts[1] if len(parts) > 1 else ""
    return cmd, args.strip()


def resolve_date(text: str) -> date | None:
    """Resolve a date string to a date object.

    Supports: today, tomorrow, day names (mon, tuesday),
    short dates (mar20, apr5), ISO format (2026-03-20).
    """
    text = text.lower().strip()
    today = date.today()

    if text == "today":
        return today
    if text == "tomorrow":
        return today + timedelta(days=1)

    # Day name → next occurrence
    if text in DAY_NAMES:
        target = DAY_NAMES[text]
        current = today.weekday()
        days_ahead = target - current
        if days_ahead <= 0:
            days_ahead += 7
        return today + timedelta(days=days_ahead)

    # Short date: mar20, apr5
    match = re.match(r"([a-z]{3})(\d{1,2})$", text)
    if match:
        month = MONTH_MAP.get(match.group(1))
        if month:
            day = int(match.group(2))
            year = today.year
            result = date(year, month, day)
            if result < today:
                result = date(year + 1, month, day)
            return result

    # ISO format: 2026-03-20
    try:
        return date.fromisoformat(text)
    except ValueError:
        pass

    return None


def parse_add_args(args: str) -> dict[str, Any]:
    """Parse /add arguments into task creation parameters.

    Modifiers: @project, p:priority, due:date
    Everything else is the task title.

    Examples:
        "Fix login bug @aios p:high due:tomorrow"
        "Record intro video @aiu due:mar25"
    """
    project_id: str | None = None
    project_name: str | None = None
    priority = "medium"
    due_date: date | None = None
    title_parts: list[str] = []

    tokens = args.split()

    for token in tokens:
        lower = token.lower()

        # @project modifier
        if lower.startswith("@"):
            alias = lower[1:]
            if alias in PROJECT_ALIASES:
                project_id, project_name = PROJECT_ALIASES[alias]
            else:
                title_parts.append(token)
            continue

        # p:priority modifier
        if lower.startswith("p:"):
            prio_value = lower[2:]
            priority = PRIORITY_ALIASES.get(prio_value, "medium")
            continue

        # due:date modifier
        if lower.startswith("due:"):
            date_value = lower[4:]
            due_date = resolve_date(date_value)
            continue

        title_parts.append(token)

    return {
        "title": " ".join(title_parts),
        "project_id": project_id,
        "project_name": project_name,
        "priority": priority,
        "due_date": due_date,
    }


# --- Command handlers ---


async def handle_brief(args: str, pool: asyncpg.Pool) -> dict[str, Any]:
    """Handle /brief — daily briefing with task summary.

    T1: SQL-only formatting. TODO: Upgrade to Claude Haiku composition in T3.
    """
    async with pool.acquire() as conn:
        # Today's tasks
        today_tasks = await conn.fetch(
            "SELECT t.id, t.title, t.priority, t.status, t.due_date, p.name as project_name "
            "FROM tasks t JOIN projects p ON t.project_id = p.id "
            "WHERE t.due_date = CURRENT_DATE AND t.status != 'done' "
            "ORDER BY t.priority DESC"
        )

        # Overdue tasks
        overdue_tasks = await conn.fetch(
            "SELECT t.id, t.title, t.priority, t.status, t.due_date, p.name as project_name "
            "FROM tasks t JOIN projects p ON t.project_id = p.id "
            "WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('done', 'cancelled') "
            "ORDER BY t.due_date ASC"
        )

        # Upcoming milestones (next 7 days)
        milestones = await conn.fetch(
            "SELECT m.name, m.due_date, p.name as project_name "
            "FROM milestones m JOIN projects p ON m.project_id = p.id "
            "WHERE m.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 "
            "AND m.status != 'completed' "
            "ORDER BY m.due_date ASC"
        )

        lines = [bold(escape_md("📋 Daily Brief"))]
        lines.append("")

        # Overdue section
        if overdue_tasks:
            lines.append(bold(escape_md(f"⚠️ Overdue ({len(overdue_tasks)})")))
            for t in overdue_tasks[:5]:
                lines.append(format_task(dict(t)))
            if len(overdue_tasks) > 5:
                lines.append(escape_md(f"  ...and {len(overdue_tasks) - 5} more"))
            lines.append("")

        # Today section
        if today_tasks:
            lines.append(bold(escape_md(f"📅 Today ({len(today_tasks)})")))
            for t in today_tasks[:8]:
                lines.append(format_task(dict(t)))
            lines.append("")
        else:
            lines.append(escape_md("📅 No tasks due today"))
            lines.append("")

        # Milestones section
        if milestones:
            lines.append(bold(escape_md("🎯 Upcoming Milestones")))
            for m in milestones[:3]:
                due = m["due_date"]
                due_str = due.strftime("%b %d") if due else "TBD"
                lines.append(
                    f"  {escape_md('•')} {bold(escape_md(m['name']))} "
                    f"\\({escape_md(m['project_name'])}\\) \\- {escape_md(due_str)}"
                )
            lines.append("")

        # Quick stats
        stats = await conn.fetchrow(
            "SELECT "
            "COUNT(*) FILTER (WHERE status NOT IN ('done', 'cancelled')) as open_tasks, "
            "COUNT(*) FILTER (WHERE status = 'done' AND completed_at >= CURRENT_DATE - 7) as done_this_week "
            "FROM tasks"
        )
        if stats:
            lines.append(
                escape_md(f"📊 {stats['open_tasks']} open tasks | "
                          f"{stats['done_this_week']} completed this week")
            )

    buttons = [
        [
            {"text": "📋 Status", "callback_data": "cmd:status"},
            {"text": "➕ Add task", "callback_data": "prompt:Add a task"},
        ]
    ]

    return {
        "text": "\n".join(lines),
        "parse_mode": "MarkdownV2",
        "reply_markup": build_inline_keyboard(buttons),
    }


async def handle_add(args: str, pool: asyncpg.Pool) -> dict[str, Any]:
    """Handle /add — create a task with modifiers."""
    if not args.strip():
        return {
            "text": escape_md(
                "Usage: /add Task title @project p:priority due:date\n\n"
                "Examples:\n"
                "  /add Fix login bug @aios p:high due:tomorrow\n"
                "  /add Record intro @aiu due:mar25\n"
                "  /add Review PR @bv p:urgent due:today"
            ),
            "parse_mode": "MarkdownV2",
        }

    parsed = parse_add_args(args)

    if not parsed["title"]:
        return {"text": escape_md("Please provide a task title.")}

    async with pool.acquire() as conn:
        # Resolve project
        project_id = parsed["project_id"]
        project_name = parsed["project_name"]

        if not project_id:
            # Default to AI OS project
            project_id = "a1000000-0000-0000-0000-000000000001"
            project_name = "AI Operating System"

        task_id = str(uuid.uuid4())
        short = task_id[:8]

        await conn.execute(
            "INSERT INTO tasks (id, project_id, title, status, priority, due_date, metadata) "
            "VALUES ($1::uuid, $2::uuid, $3, 'todo'::task_status, $4::task_priority, $5::date, '{}'::jsonb)",
            task_id,
            project_id,
            parsed["title"],
            parsed["priority"],
            parsed["due_date"],
        )

        # Best-effort Google Tasks sync
        google_synced = False
        try:
            from app.auth.google_oauth import get_service, run_google_api

            service = get_service("tasks", "v1")
            if service:
                # Find or create task list
                project_row = await conn.fetchrow(
                    "SELECT name, metadata FROM projects WHERE id = $1::uuid", project_id
                )
                if project_row:
                    meta = project_row["metadata"] or {}
                    list_id = meta.get("google_task_list_id")

                    if not list_id:
                        list_name = f"AI OS: {project_row['name']}"
                        result = await run_google_api(
                            service.tasklists().insert(body={"title": list_name}).execute
                        )
                        list_id = result["id"]
                        meta["google_task_list_id"] = list_id
                        await conn.execute(
                            "UPDATE projects SET metadata = $1::jsonb WHERE id = $2::uuid",
                            json.dumps(meta), project_id,
                        )

                    if list_id:
                        prefix = {"urgent": "[URGENT] ", "high": "[HIGH] "}.get(
                            parsed["priority"], ""
                        )
                        body: dict[str, Any] = {
                            "title": f"{prefix}{parsed['title']}",
                            "status": "needsAction",
                        }
                        if parsed["due_date"]:
                            body["due"] = f"{parsed['due_date'].isoformat()}T00:00:00.000Z"

                        gt_result = await run_google_api(
                            service.tasks().insert(tasklist=list_id, body=body).execute
                        )
                        task_meta = {
                            "google_task_id": gt_result["id"],
                            "google_task_list_id": list_id,
                        }
                        await conn.execute(
                            "UPDATE tasks SET metadata = $1::jsonb WHERE id = $2::uuid",
                            json.dumps(task_meta), task_id,
                        )
                        google_synced = True
        except Exception:
            pass  # Google Tasks sync is best-effort

    # Build response
    due_str = parsed["due_date"].strftime("%b %d") if parsed["due_date"] else "none"
    sync_icon = "✅" if google_synced else "📱"

    text = (
        f"✅ Task created \\({code(short)}\\)\n\n"
        f"{bold(escape_md(parsed['title']))}\n"
        f"Project: {escape_md(project_name or 'AI OS')}\n"
        f"Priority: {escape_md(parsed['priority'])}\n"
        f"Due: {escape_md(due_str)}\n"
        f"Google Tasks: {escape_md(sync_icon)}"
    )

    buttons = [
        [
            {"text": "✅ Done", "callback_data": f"done:{short}"},
            {"text": "📋 Brief", "callback_data": "cmd:brief"},
        ]
    ]

    return {
        "text": text,
        "parse_mode": "MarkdownV2",
        "reply_markup": build_inline_keyboard(buttons),
    }


async def handle_done(args: str, pool: asyncpg.Pool) -> dict[str, Any]:
    """Handle /done <short_id> — mark a task as complete."""
    short_id = args.strip().lower()

    if not short_id:
        return {
            "text": escape_md("Usage: /done <short_id>\n\nExample: /done 4a2f3b1c"),
            "parse_mode": "MarkdownV2",
        }

    async with pool.acquire() as conn:
        # Match by first 8 chars of UUID (hex, no hyphens)
        rows = await conn.fetch(
            "SELECT id, title, project_id, metadata "
            "FROM tasks WHERE status != 'done' "
            "AND replace(id::text, '-', '') LIKE $1 || '%'",
            short_id,
        )

        if not rows:
            return {"text": escape_md(f"No active task found matching '{short_id}'")}

        if len(rows) > 1:
            # Disambiguation
            lines = [escape_md(f"Multiple tasks match '{short_id}':")]
            for r in rows[:5]:
                sid = str(r["id"])[:8]
                lines.append(f"  {code(sid)} {escape_md(r['title'])}")
            lines.append(escape_md("\nUse a longer ID to disambiguate."))
            return {"text": "\n".join(lines), "parse_mode": "MarkdownV2"}

        task = rows[0]
        task_id = str(task["id"])
        full_short = task_id[:8]

        # Mark complete in DB
        await conn.execute(
            "UPDATE tasks SET status = 'done'::task_status, completed_at = now() "
            "WHERE id = $1::uuid",
            task["id"],
        )

        # Best-effort Google Tasks sync
        google_synced = False
        try:
            meta = task["metadata"] or {}
            google_task_id = meta.get("google_task_id")
            google_list_id = meta.get("google_task_list_id")

            if google_task_id and google_list_id:
                from app.auth.google_oauth import get_service, run_google_api

                service = get_service("tasks", "v1")
                if service:
                    gtask = await run_google_api(
                        service.tasks().get(
                            tasklist=google_list_id, task=google_task_id
                        ).execute
                    )
                    gtask["status"] = "completed"
                    await run_google_api(
                        service.tasks().update(
                            tasklist=google_list_id, task=google_task_id, body=gtask
                        ).execute
                    )
                    google_synced = True
        except Exception:
            pass

    sync_icon = "✅" if google_synced else "📱"
    text = (
        f"✅ Completed: {bold(escape_md(task['title']))}\n"
        f"ID: {code(full_short)} {escape_md(sync_icon)}"
    )

    buttons = [
        [
            {"text": "↩️ Undo (5 min)", "callback_data": f"undo:{full_short}"},
            {"text": "📋 Brief", "callback_data": "cmd:brief"},
        ]
    ]

    return {
        "text": text,
        "parse_mode": "MarkdownV2",
        "reply_markup": build_inline_keyboard(buttons),
    }


async def handle_status(args: str, pool: asyncpg.Pool) -> dict[str, Any]:
    """Handle /status — project health snapshot."""
    async with pool.acquire() as conn:
        projects = await conn.fetch(
            "SELECT p.id, p.name, p.slug, "
            "COUNT(t.id) as total_tasks, "
            "COUNT(t.id) FILTER (WHERE t.status = 'done') as done_tasks, "
            "COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('done', 'cancelled')) as overdue_tasks, "
            "COUNT(t.id) FILTER (WHERE t.status = 'blocked') as blocked_tasks "
            "FROM projects p LEFT JOIN tasks t ON t.project_id = p.id "
            "GROUP BY p.id, p.name, p.slug "
            "ORDER BY p.created_at"
        )

        lines = [bold(escape_md("📊 Project Status"))]
        lines.append("")

        for p in projects:
            lines.append(format_project_status(dict(p)))
            lines.append("")

        # Global summary
        totals = await conn.fetchrow(
            "SELECT "
            "COUNT(*) FILTER (WHERE status NOT IN ('done', 'cancelled')) as open, "
            "COUNT(*) FILTER (WHERE status = 'done') as done, "
            "COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('done', 'cancelled')) as overdue "
            "FROM tasks"
        )
        if totals:
            lines.append(
                escape_md(f"Total: {totals['open']} open, {totals['done']} done, "
                          f"{totals['overdue']} overdue")
            )

    return {"text": "\n".join(lines), "parse_mode": "MarkdownV2"}


async def handle_log(args: str, pool: asyncpg.Pool) -> dict[str, Any]:
    """Handle /log — capture a quick thought to knowledge_entries.

    Uses source_type='journal_entry', source='telegram', domain='personal'.
    Auto-detects sub_domain from keywords.
    """
    if not args.strip():
        return {
            "text": escape_md(
                "Usage: /log Your thought or decision here\n\n"
                "Examples:\n"
                "  /log decided: use Telegram for mobile notifications\n"
                "  /log idea: weekly knowledge graph visualization\n"
                "  /log learned: pgvector needs 1536 dimensions for ada-002"
            ),
            "parse_mode": "MarkdownV2",
        }

    text_content = args.strip()

    # Auto-detect sub_domain from keywords
    lower = text_content.lower()
    if any(kw in lower for kw in ["decide", "decided", "decision"]):
        sub_domain = "decisions"
    elif any(kw in lower for kw in ["idea", "brainstorm", "thought"]):
        sub_domain = "ideas"
    elif any(kw in lower for kw in ["learn", "learned", "til", "insight"]):
        sub_domain = "learnings"
    elif any(kw in lower for kw in ["todo", "remember", "note"]):
        sub_domain = "notes"
    else:
        sub_domain = "journal"

    # Generate a short title from first ~50 chars
    title = text_content[:50].strip()
    if len(text_content) > 50:
        title = title.rsplit(" ", 1)[0] + "..."

    async with pool.acquire() as conn:
        entry_id = str(uuid.uuid4())
        short = entry_id[:8]

        await conn.execute(
            "INSERT INTO knowledge_entries "
            "(id, title, content, source_type, source, domain, sub_domain, metadata) "
            "VALUES ($1::uuid, $2, $3, 'journal_entry'::source_type, 'telegram', "
            "'personal', $4, $5::jsonb)",
            entry_id,
            title,
            text_content,
            sub_domain,
            json.dumps({"logged_via": "telegram", "timestamp": datetime.utcnow().isoformat()}),
        )

    text = (
        f"📝 Logged \\({code(short)}\\)\n\n"
        f"{bold(escape_md(sub_domain))}: {escape_md(text_content[:200])}"
    )

    return {"text": text, "parse_mode": "MarkdownV2"}


# --- Command dispatch ---

COMMANDS: dict[str, Any] = {
    "/brief": handle_brief,
    "/add": handle_add,
    "/done": handle_done,
    "/status": handle_status,
    "/log": handle_log,
}


async def handle_command(command: str, args: str, pool: asyncpg.Pool) -> dict[str, Any]:
    """Dispatch a command to its handler."""
    handler = COMMANDS.get(command)
    if handler:
        try:
            return await handler(args, pool)
        except Exception as exc:
            return {
                "text": escape_md(f"Error: {str(exc)[:200]}"),
                "parse_mode": "MarkdownV2",
            }

    return {
        "text": escape_md(
            "Unknown command. Available commands:\n"
            "/brief — Daily briefing\n"
            "/add — Create a task\n"
            "/done — Complete a task\n"
            "/status — Project health\n"
            "/log — Capture a thought"
        ),
        "parse_mode": "MarkdownV2",
    }
