"""Telegram inline keyboard callback handler.

Processes callback_query updates from inline keyboards. Callback data
format: action:entity_id[:parameter]

Supported actions:
- done:<short_id> — Mark task complete
- snooze:<short_id>:<duration> — Snooze task (1d, 3d, mon)
- prio:<short_id>:<level> — Change priority
- undo:<short_id> — Undo completion (5-min window)
- dismiss:<notification_id> — Dismiss a notification
- cmd:<command> — Trigger a slash command
- prompt:<text> — Send text through AI handler (T3)
"""

from __future__ import annotations

import json
import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any

import asyncpg

from app.telegram.models import TelegramCallbackQuery
from app.telegram.webhook import telegram_api, send_message
from app.telegram.formatter import bold, code, escape_md
from app.telegram.router import handle_command, resolve_date, DAY_NAMES
from app import config

logger = logging.getLogger(__name__)


async def handle_callback(cb: TelegramCallbackQuery, pool: asyncpg.Pool) -> None:
    """Route a callback query to the appropriate handler."""
    data = cb.data or ""
    parts = data.split(":", 2)
    action = parts[0] if parts else ""
    entity_id = parts[1] if len(parts) > 1 else ""
    parameter = parts[2] if len(parts) > 2 else ""

    chat_id = cb.message.chat.id if cb.message else int(config.get_telegram_chat_id())
    message_id = cb.message.message_id if cb.message else None

    try:
        if action == "done":
            await _handle_done(cb.id, chat_id, message_id, entity_id, pool)
        elif action == "snooze":
            await _handle_snooze(cb.id, chat_id, message_id, entity_id, parameter, pool)
        elif action == "prio":
            await _handle_prio(cb.id, chat_id, message_id, entity_id, parameter, pool)
        elif action == "undo":
            await _handle_undo(cb.id, chat_id, message_id, entity_id, pool)
        elif action == "dismiss":
            await _handle_dismiss(cb.id, message_id)
        elif action == "cmd":
            await _handle_cmd(cb.id, chat_id, entity_id, pool)
        elif action == "prompt":
            # T3: route through AI handler
            text = ":".join(parts[1:]) if len(parts) > 1 else ""
            try:
                from app.telegram.ai_handler import handle_natural_language
                response = await handle_natural_language(text, str(chat_id), pool)
                await send_message(
                    chat_id=chat_id,
                    text=response.get("text", "Done."),
                    parse_mode=response.get("parse_mode"),
                    reply_markup=response.get("reply_markup"),
                )
            except ImportError:
                await send_message(chat_id=chat_id, text=text, parse_mode=None)
            await telegram_api("answerCallbackQuery", {"callback_query_id": cb.id})
        else:
            await telegram_api("answerCallbackQuery", {
                "callback_query_id": cb.id,
                "text": "Unknown action",
            })
    except Exception as exc:
        logger.exception("Callback error: %s", exc)
        await telegram_api("answerCallbackQuery", {
            "callback_query_id": cb.id,
            "text": f"Error: {str(exc)[:100]}",
            "show_alert": True,
        })


async def _handle_done(
    cb_id: str, chat_id: int, message_id: int | None, short_id: str, pool: asyncpg.Pool
) -> None:
    """Mark a task as complete from inline keyboard."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, title FROM tasks WHERE status != 'done' "
            "AND replace(id::text, '-', '') LIKE $1 || '%'",
            short_id,
        )

        if not rows:
            await telegram_api("answerCallbackQuery", {
                "callback_query_id": cb_id,
                "text": "Task not found or already done",
            })
            return

        task = rows[0]
        await conn.execute(
            "UPDATE tasks SET status = 'done'::task_status, completed_at = now() "
            "WHERE id = $1::uuid",
            task["id"],
        )

    # Edit the original message to show completion
    if message_id:
        text = f"✅ {bold('Completed')}: {bold(escape_md(task['title']))}"
        buttons = [[
            {"text": "↩️ Undo (5 min)", "callback_data": f"undo:{short_id}"},
        ]]
        await telegram_api("editMessageText", {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text,
            "parse_mode": "MarkdownV2",
            "reply_markup": {"inline_keyboard": buttons},
        })

    await telegram_api("answerCallbackQuery", {
        "callback_query_id": cb_id,
        "text": "Task completed!",
    })


async def _handle_snooze(
    cb_id: str, chat_id: int, message_id: int | None,
    short_id: str, duration: str, pool: asyncpg.Pool
) -> None:
    """Snooze a task by adjusting its due date."""
    today = date.today()

    if duration == "1d":
        new_due = today + timedelta(days=1)
    elif duration == "3d":
        new_due = today + timedelta(days=3)
    elif duration == "mon":
        # Next Monday
        days_ahead = 0 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        new_due = today + timedelta(days=days_ahead)
    else:
        new_due = resolve_date(duration) or today + timedelta(days=1)

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, title FROM tasks "
            "WHERE replace(id::text, '-', '') LIKE $1 || '%'",
            short_id,
        )

        if not rows:
            await telegram_api("answerCallbackQuery", {
                "callback_query_id": cb_id,
                "text": "Task not found",
            })
            return

        task = rows[0]
        await conn.execute(
            "UPDATE tasks SET due_date = $1::date WHERE id = $2::uuid",
            new_due, task["id"],
        )

    if message_id:
        text = (
            f"⏰ {bold('Snoozed')}: {bold(escape_md(task['title']))}\n"
            f"New due date: {escape_md(new_due.strftime('%b %d'))}"
        )
        await telegram_api("editMessageText", {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text,
            "parse_mode": "MarkdownV2",
        })

    await telegram_api("answerCallbackQuery", {
        "callback_query_id": cb_id,
        "text": f"Snoozed to {new_due.strftime('%b %d')}",
    })


async def _handle_prio(
    cb_id: str, chat_id: int, message_id: int | None,
    short_id: str, level: str, pool: asyncpg.Pool
) -> None:
    """Change task priority from inline keyboard."""
    if level not in ("urgent", "high", "medium", "low"):
        await telegram_api("answerCallbackQuery", {
            "callback_query_id": cb_id,
            "text": "Invalid priority level",
        })
        return

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, title FROM tasks "
            "WHERE replace(id::text, '-', '') LIKE $1 || '%'",
            short_id,
        )

        if not rows:
            await telegram_api("answerCallbackQuery", {
                "callback_query_id": cb_id,
                "text": "Task not found",
            })
            return

        task = rows[0]
        await conn.execute(
            "UPDATE tasks SET priority = $1::task_priority WHERE id = $2::uuid",
            level, task["id"],
        )

    await telegram_api("answerCallbackQuery", {
        "callback_query_id": cb_id,
        "text": f"Priority set to {level}",
    })


async def _handle_undo(
    cb_id: str, chat_id: int, message_id: int | None, short_id: str, pool: asyncpg.Pool
) -> None:
    """Undo task completion within 5-minute window."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, title, completed_at FROM tasks "
            "WHERE status = 'done' "
            "AND replace(id::text, '-', '') LIKE $1 || '%' "
            "AND completed_at > now() - interval '5 minutes'",
            short_id,
        )

        if not rows:
            await telegram_api("answerCallbackQuery", {
                "callback_query_id": cb_id,
                "text": "Undo window expired (5 min) or task not found",
                "show_alert": True,
            })
            return

        task = rows[0]
        await conn.execute(
            "UPDATE tasks SET status = 'todo'::task_status, completed_at = NULL "
            "WHERE id = $1::uuid",
            task["id"],
        )

    if message_id:
        text = (
            f"↩️ {bold('Undone')}: {bold(escape_md(task['title']))}\n"
            f"Status reset to todo"
        )
        buttons = [[
            {"text": "✅ Done", "callback_data": f"done:{short_id}"},
        ]]
        await telegram_api("editMessageText", {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text,
            "parse_mode": "MarkdownV2",
            "reply_markup": {"inline_keyboard": buttons},
        })

    await telegram_api("answerCallbackQuery", {
        "callback_query_id": cb_id,
        "text": "Task restored!",
    })


async def _handle_dismiss(cb_id: str, message_id: int | None) -> None:
    """Dismiss a notification by removing the keyboard."""
    if message_id:
        chat_id = int(config.get_telegram_chat_id())
        await telegram_api("editMessageReplyMarkup", {
            "chat_id": chat_id,
            "message_id": message_id,
            "reply_markup": {"inline_keyboard": []},
        })

    await telegram_api("answerCallbackQuery", {
        "callback_query_id": cb_id,
        "text": "Dismissed",
    })


async def _handle_cmd(cb_id: str, chat_id: int, command: str, pool: asyncpg.Pool) -> None:
    """Execute a slash command from inline keyboard."""
    response = await handle_command(f"/{command}", "", pool)

    await send_message(
        chat_id=chat_id,
        text=response.get("text", "Done."),
        parse_mode=response.get("parse_mode"),
        reply_markup=response.get("reply_markup"),
    )

    await telegram_api("answerCallbackQuery", {"callback_query_id": cb_id})
