"""AI triage handler for natural language Telegram messages.

Routes non-command messages through Claude Haiku for intelligent responses.
Builds DB context, maintains conversation memory, handles escalation to
Claude.ai, and generates follow-up suggestions.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import uuid
from datetime import date, datetime
from typing import Any

import asyncpg

from app.telegram.formatter import bold, code, escape_md, build_inline_keyboard
from app.telegram.thread_manager import (
    get_or_create_thread,
    append_message,
    get_thread_context,
    detect_topic,
)
from app import config

logger = logging.getLogger(__name__)


TRIAGE_SYSTEM_PROMPT = """You are AI OS Assistant — a concise, helpful bot for Atharva's AI Operating System.
You're accessed via Telegram, so keep responses short and mobile-friendly.

Today is {today}.

Active projects:
{projects}

Rules:
1. Be concise — 2-5 sentences max unless asked for detail
2. Use Telegram MarkdownV2 formatting (escape special chars with backslash)
3. Reference tasks by their 8-char short ID when possible
4. If the request is too complex for a quick chat response, set "escalate": true in your JSON
5. Suggest 1-2 follow-up actions the user might want

Respond with a JSON object:
{{
  "response": "Your message text (MarkdownV2 formatted)",
  "escalate": false,
  "follow_ups": ["Suggested action 1", "Suggested action 2"]
}}

If you cannot answer confidently or the request needs multi-step work, escalate.
For escalation, still provide a brief response explaining what you'll hand off."""


async def handle_natural_language(
    message_text: str, chat_id: str, pool: asyncpg.Pool
) -> dict[str, Any]:
    """Main handler for non-command Telegram messages.

    Flow:
    1. Get or create conversation thread
    2. Append user message
    3. Build DB context
    4. Call Claude Haiku
    5. Parse response, handle escalation
    6. Append assistant message
    7. Auto-detect topic (async, non-blocking)
    8. Return formatted response with follow-up keyboard
    """
    # Handle thread commands
    if message_text.lower().startswith("/thread"):
        return await _handle_thread_command(message_text, pool)

    # Get or create thread
    thread_id, is_new = await get_or_create_thread(message_text, pool)

    # Append user message
    await append_message(thread_id, "user", message_text, pool)

    # Build context
    system_prompt = await _build_system_prompt(pool)
    db_context = await _build_db_context(message_text, pool)
    thread_messages = await get_thread_context(thread_id, pool)

    # Build Claude messages
    messages: list[dict[str, str]] = []

    # Add DB context as first user message if relevant
    if db_context:
        messages.append({
            "role": "user",
            "content": f"[DB Context for this request]\n{db_context}",
        })
        messages.append({
            "role": "assistant",
            "content": "I have the relevant context. Let me help with your request.",
        })

    # Add thread history
    messages.extend(thread_messages)

    # Ensure last message is user role (it should be from thread history)
    if not messages or messages[-1]["role"] != "user":
        messages.append({"role": "user", "content": message_text})

    # Call Claude Haiku
    try:
        raw_response = await asyncio.to_thread(
            _call_haiku_sync, system_prompt, messages
        )
    except Exception as exc:
        logger.exception("Haiku call failed: %s", exc)
        return {
            "text": escape_md(f"AI temporarily unavailable. Use /commands instead.\n\nError: {str(exc)[:100]}"),
            "parse_mode": "MarkdownV2",
        }

    # Parse JSON response
    response_text, follow_ups, escalate = _parse_haiku_response(raw_response)

    # Check for escalation (JSON flag or heuristic)
    if escalate or _detect_escalation(raw_response):
        await _park_in_inbox(message_text, thread_id, db_context, pool)
        response_text += "\n\n📌 _Parked for detailed follow\\-up in Claude\\.ai_"

    # Append assistant message
    await append_message(thread_id, "assistant", response_text, pool)

    # Auto-detect topic (fire and forget)
    asyncio.create_task(detect_topic(thread_id, pool))

    # Build response with follow-up keyboard
    result: dict[str, Any] = {
        "text": response_text,
        "parse_mode": "MarkdownV2",
    }

    if follow_ups:
        keyboard = _build_followup_keyboard(follow_ups)
        if keyboard:
            result["reply_markup"] = keyboard

    return result


async def _build_system_prompt(pool: asyncpg.Pool) -> str:
    """Build the system prompt with current date and project info."""
    today = date.today().isoformat()

    async with pool.acquire() as conn:
        projects = await conn.fetch(
            "SELECT name, slug, status, "
            "COUNT(t.id) FILTER (WHERE t.status NOT IN ('done', 'cancelled')) as open_tasks "
            "FROM projects p LEFT JOIN tasks t ON t.project_id = p.id "
            "GROUP BY p.id, p.name, p.slug, p.status "
            "ORDER BY p.created_at"
        )

    project_lines = []
    for p in projects:
        project_lines.append(
            f"- {p['name']} ({p['slug']}): {p['open_tasks']} open tasks"
        )

    return TRIAGE_SYSTEM_PROMPT.format(
        today=today,
        projects="\n".join(project_lines) or "No projects found",
    )


async def _build_db_context(message_text: str, pool: asyncpg.Pool) -> str:
    """Build relevant DB context based on message keywords.

    Always includes project summary. Conditionally includes:
    - Tasks if message mentions tasks, todo, work
    - Blocked items if message mentions blocked, stuck
    - Overdue items if message mentions overdue, late, behind
    - Milestones if message mentions milestone, deadline
    - Short ID lookup if message contains an 8-char hex pattern
    """
    lower = message_text.lower()
    context_parts: list[str] = []

    async with pool.acquire() as conn:
        # Always: project summary
        projects = await conn.fetch(
            "SELECT p.name, "
            "COUNT(t.id) FILTER (WHERE t.status NOT IN ('done', 'cancelled')) as open, "
            "COUNT(t.id) FILTER (WHERE t.status = 'done') as done, "
            "COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('done', 'cancelled')) as overdue "
            "FROM projects p LEFT JOIN tasks t ON t.project_id = p.id "
            "GROUP BY p.name ORDER BY p.created_at"
        )
        lines = ["Projects:"]
        for p in projects:
            lines.append(f"  {p['name']}: {p['open']} open, {p['done']} done, {p['overdue']} overdue")
        context_parts.append("\n".join(lines))

        # Conditional: tasks
        if any(kw in lower for kw in ["task", "todo", "work", "doing", "next", "priority"]):
            tasks = await conn.fetch(
                "SELECT t.id, t.title, t.priority, t.status, t.due_date, p.name as project "
                "FROM tasks t JOIN projects p ON t.project_id = p.id "
                "WHERE t.status NOT IN ('done', 'cancelled') "
                "ORDER BY t.priority DESC, t.due_date ASC NULLS LAST LIMIT 10"
            )
            if tasks:
                lines = ["Open tasks (top 10):"]
                for t in tasks:
                    sid = str(t["id"])[:8]
                    due = t["due_date"]
                    due_str = due.strftime("%b %d") if isinstance(due, (date, datetime)) else "no due date"
                    lines.append(f"  [{sid}] {t['title']} ({t['priority']}, {t['status']}, due {due_str}) — {t['project']}")
                context_parts.append("\n".join(lines))

        # Conditional: blocked
        if any(kw in lower for kw in ["block", "stuck", "waiting", "depend"]):
            blocked = await conn.fetch(
                "SELECT t.id, t.title, p.name as project "
                "FROM tasks t JOIN projects p ON t.project_id = p.id "
                "WHERE t.status = 'blocked' LIMIT 5"
            )
            if blocked:
                lines = ["Blocked tasks:"]
                for t in blocked:
                    sid = str(t["id"])[:8]
                    lines.append(f"  [{sid}] {t['title']} — {t['project']}")
                context_parts.append("\n".join(lines))

        # Conditional: overdue
        if any(kw in lower for kw in ["overdue", "late", "behind", "missed", "past due"]):
            overdue = await conn.fetch(
                "SELECT t.id, t.title, t.due_date, p.name as project "
                "FROM tasks t JOIN projects p ON t.project_id = p.id "
                "WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('done', 'cancelled') "
                "ORDER BY t.due_date ASC LIMIT 10"
            )
            if overdue:
                lines = ["Overdue tasks:"]
                for t in overdue:
                    sid = str(t["id"])[:8]
                    due = t["due_date"]
                    due_str = due.strftime("%b %d") if isinstance(due, (date, datetime)) else "?"
                    lines.append(f"  [{sid}] {t['title']} (due {due_str}) — {t['project']}")
                context_parts.append("\n".join(lines))

        # Conditional: milestones
        if any(kw in lower for kw in ["milestone", "deadline", "goal", "target"]):
            milestones = await conn.fetch(
                "SELECT m.name, m.due_date, m.status, p.name as project "
                "FROM milestones m JOIN projects p ON m.project_id = p.id "
                "WHERE m.status != 'completed' ORDER BY m.due_date ASC LIMIT 5"
            )
            if milestones:
                lines = ["Upcoming milestones:"]
                for m in milestones:
                    due = m["due_date"]
                    due_str = due.strftime("%b %d") if isinstance(due, (date, datetime)) else "TBD"
                    lines.append(f"  {m['name']} ({m['project']}) — due {due_str}, {m['status']}")
                context_parts.append("\n".join(lines))

        # Conditional: short ID lookup
        hex_match = re.search(r"\b([0-9a-f]{4,8})\b", lower)
        if hex_match:
            short_id = hex_match.group(1)
            task = await conn.fetchrow(
                "SELECT t.id, t.title, t.priority, t.status, t.due_date, t.description, "
                "p.name as project "
                "FROM tasks t JOIN projects p ON t.project_id = p.id "
                "WHERE replace(t.id::text, '-', '') LIKE $1 || '%' LIMIT 1",
                short_id,
            )
            if task:
                sid = str(task["id"])[:8]
                due = task["due_date"]
                due_str = due.strftime("%b %d") if isinstance(due, (date, datetime)) else "no due date"
                context_parts.append(
                    f"Task [{sid}]: {task['title']}\n"
                    f"  Project: {task['project']}, Priority: {task['priority']}, "
                    f"Status: {task['status']}, Due: {due_str}\n"
                    f"  Description: {task['description'] or 'none'}"
                )

    return "\n\n".join(context_parts)


def _call_haiku_sync(system_prompt: str, messages: list[dict[str, str]]) -> str:
    """Synchronous Claude Haiku call (run via asyncio.to_thread)."""
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1000,
        system=system_prompt,
        messages=messages,
    )
    return response.content[0].text


def _parse_haiku_response(raw: str) -> tuple[str, list[str], bool]:
    """Parse Claude Haiku's JSON response.

    Returns:
        (response_text, follow_ups, escalate)
    """
    try:
        # Try to extract JSON from response
        json_match = re.search(r"\{[\s\S]*\}", raw)
        if json_match:
            data = json.loads(json_match.group())
            response_text = data.get("response", raw)
            follow_ups = data.get("follow_ups", [])
            escalate = data.get("escalate", False)
            return response_text, follow_ups, escalate
    except (json.JSONDecodeError, AttributeError):
        pass

    # Fallback: use raw text
    return escape_md(raw), [], False


def _detect_escalation(response_text: str) -> bool:
    """Heuristic backup for detecting complex requests."""
    if len(response_text) > 2000:
        return True
    if response_text.count("```") > 6:  # >3 code blocks
        return True

    deferral_phrases = [
        "let me look into that in more detail",
        "this requires deeper analysis",
        "i'll need to investigate",
        "this is better handled in",
        "complex request",
    ]
    lower = response_text.lower()
    return any(phrase in lower for phrase in deferral_phrases)


async def _park_in_inbox(
    message_text: str, thread_id: str, context: str, pool: asyncpg.Pool
) -> None:
    """Park a complex request in bot_inbox for Claude.ai follow-up."""
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO bot_inbox (id, source, message_text, thread_id, context, status) "
            "VALUES ($1::uuid, 'telegram', $2, $3::uuid, $4::jsonb, 'pending')",
            str(uuid.uuid4()),
            message_text,
            thread_id,
            json.dumps({"db_context": context[:5000], "timestamp": datetime.utcnow().isoformat()}),
        )


def _build_followup_keyboard(follow_ups: list[str]) -> dict | None:
    """Convert follow-up suggestions to inline keyboard buttons."""
    if not follow_ups:
        return None

    buttons: list[list[dict[str, str]]] = []
    for fu in follow_ups[:3]:  # Max 3 follow-ups
        label = fu[:40]  # Truncate button label
        buttons.append([
            {"text": label, "callback_data": f"prompt:{label}"},
        ])

    return build_inline_keyboard(buttons)


async def _handle_thread_command(text: str, pool: asyncpg.Pool) -> dict[str, Any]:
    """Handle /thread subcommands: list, close, resume."""
    parts = text.split(None, 2)
    subcmd = parts[1].lower() if len(parts) > 1 else "list"

    if subcmd == "list":
        async with pool.acquire() as conn:
            threads = await conn.fetch(
                "SELECT id, topic, status, last_active_at, "
                "jsonb_array_length(messages) as msg_count "
                "FROM bot_conversations "
                "ORDER BY last_active_at DESC LIMIT 10"
            )

        if not threads:
            return {"text": escape_md("No conversation threads found."), "parse_mode": "MarkdownV2"}

        lines = [bold(escape_md("🗂 Recent Threads"))]
        for t in threads:
            sid = str(t["id"])[:8]
            topic = t["topic"] or "untitled"
            status_icon = {"active": "🟢", "resolved": "⚪", "parked": "📌"}.get(t["status"], "❓")
            lines.append(
                f"{status_icon} {code(sid)} {escape_md(topic)} "
                f"\\({escape_md(str(t['msg_count']))} msgs\\)"
            )

        return {"text": "\n".join(lines), "parse_mode": "MarkdownV2"}

    elif subcmd == "close":
        async with pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE bot_conversations SET status = 'resolved', resolved_at = now() "
                "WHERE status = 'active'"
            )
            count = int(result.split()[-1]) if result else 0

        return {"text": escape_md(f"Closed {count} active thread(s)."), "parse_mode": "MarkdownV2"}

    elif subcmd == "resume":
        short_id = parts[2].strip() if len(parts) > 2 else ""
        if not short_id:
            return {"text": escape_md("Usage: /thread resume <short_id>"), "parse_mode": "MarkdownV2"}

        from app.telegram.thread_manager import resume_thread
        thread_id = await resume_thread(short_id, pool)

        if thread_id:
            return {
                "text": f"🔄 Resumed thread {code(short_id)}",
                "parse_mode": "MarkdownV2",
            }
        return {"text": escape_md(f"No resolved thread found matching '{short_id}'"), "parse_mode": "MarkdownV2"}

    return {"text": escape_md("Usage: /thread [list|close|resume <id>]"), "parse_mode": "MarkdownV2"}
