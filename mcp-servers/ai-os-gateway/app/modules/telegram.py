"""Telegram MCP tools for AI OS Gateway.

5 tools for sending messages, templates, inline keyboards,
editing messages, and getting bot info. Callable from Claude.ai
and Claude Code via MCP protocol.

Follows the register_tools(mcp, get_pool) pattern from google_tasks.py.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from fastmcp import FastMCP


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register Telegram tools on the MCP server."""

    async def _send(
        text: str,
        parse_mode: str | None = "MarkdownV2",
        reply_markup: dict | None = None,
    ) -> dict[str, Any]:
        """Internal helper to send a Telegram message and log it."""
        from app.telegram.webhook import send_message
        from app import config

        chat_id = int(config.get_telegram_chat_id())
        result = await send_message(
            chat_id=chat_id,
            text=text,
            parse_mode=parse_mode,
            reply_markup=reply_markup,
        )
        return result

    async def _log_notification(
        pool,
        notification_type: str,
        message_preview: str,
        telegram_message_id: int | None = None,
        metadata: dict | None = None,
    ) -> None:
        """Log a notification to the notification_log table."""
        from app import config

        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO notification_log "
                "(id, channel, notification_type, recipient, message_preview, "
                "telegram_message_id, metadata) "
                "VALUES ($1::uuid, 'telegram', $2, $3, $4, $5, $6::jsonb)",
                str(uuid.uuid4()),
                notification_type,
                config.get_telegram_chat_id(),
                message_preview[:200] if message_preview else None,
                telegram_message_id,
                json.dumps(metadata or {}),
            )

    @mcp.tool(
        description="Send a text message to the AI OS Telegram bot. "
        "parse_mode: 'MarkdownV2'|'HTML'|None (plain text). Default: MarkdownV2. "
        "Note: MarkdownV2 requires escaping special chars: _ * [ ] ( ) ~ ` > # + - = | { } . ! "
        "Max message length: 4096 characters (Telegram limit). "
        "Messages are logged to the notification_log table. "
        "Example: send_telegram_message(text='Task completed: Review PR', parse_mode='HTML'). "
        "Returns: {sent: bool, message_id: int, preview: string, timestamp: string, _meta}."
    )
    async def send_telegram_message(
        text: str,
        parse_mode: str | None = None,
        reply_markup_json: str | None = None,
    ) -> str:
        pool = get_pool()
        try:
            reply_markup = json.loads(reply_markup_json) if reply_markup_json else None
            result = await _send(text, parse_mode=parse_mode, reply_markup=reply_markup)

            msg_id = result.get("result", {}).get("message_id")
            await _log_notification(
                pool, "mcp_message", text[:200], telegram_message_id=msg_id
            )

            return json.dumps({
                "sent": result.get("ok", False),
                "message_id": msg_id,
                "preview": text[:100],
                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
                "_meta": {"action": "sent", "related_tools": ["edit_telegram_message", "get_telegram_bot_info"]},
            })
        except Exception as exc:
            return json.dumps({"error": f"Failed to send message: {exc}"})

    @mcp.tool(
        description="Send a pre-formatted notification using a template. "
        "template_name: 'task_created'|'task_completed'|'milestone_approaching'|'pipeline_result'|'custom'. "
        "Template variables — task_created: {title, project, priority}. task_completed: {title}. "
        "milestone_approaching: {name, project, days_until}. pipeline_result: {pipeline, status, summary}. "
        "custom: {text}. data: JSON string of template variables. "
        "Example: send_telegram_template(template_name='task_created', data='{\"title\": \"Deploy v2\", \"project\": \"AI OS\", \"priority\": \"high\"}'). "
        "Returns: {sent: bool, message_id: int, template: string, preview: string, _meta}."
    )
    async def send_telegram_template(
        template_name: str,
        data: str,
    ) -> str:
        pool = get_pool()
        try:
            from app.telegram.formatter import escape_md, bold, code

            template_data = json.loads(data)
            text = ""

            if template_name == "task_created":
                title = escape_md(template_data.get("title", ""))
                project = escape_md(template_data.get("project", ""))
                priority = escape_md(template_data.get("priority", "medium"))
                text = (
                    f"📋 {bold('New Task')}\n\n"
                    f"{bold(title)}\n"
                    f"Project: {project}\n"
                    f"Priority: {priority}"
                )

            elif template_name == "task_completed":
                title = escape_md(template_data.get("title", ""))
                text = f"✅ {bold('Completed')}: {title}"

            elif template_name == "milestone_approaching":
                name = escape_md(template_data.get("name", ""))
                project = escape_md(template_data.get("project", ""))
                days = template_data.get("days_until", "?")
                text = (
                    f"🎯 {bold('Milestone Approaching')}\n\n"
                    f"{bold(name)} \\({project}\\)\n"
                    f"Due in {escape_md(str(days))} days"
                )

            elif template_name == "pipeline_result":
                pipeline = escape_md(template_data.get("pipeline", ""))
                status = template_data.get("status", "unknown")
                icon = "✅" if status == "success" else "❌"
                summary = escape_md(template_data.get("summary", ""))
                text = (
                    f"{icon} {bold('Pipeline Result')}\n\n"
                    f"{bold(pipeline)}: {escape_md(status)}\n"
                    f"{summary}"
                )

            elif template_name == "custom":
                text = template_data.get("text", "")

            else:
                return json.dumps({"error": f"Unknown template: {template_name}"})

            result = await _send(text, parse_mode="MarkdownV2")
            msg_id = result.get("result", {}).get("message_id")

            await _log_notification(
                pool, f"template:{template_name}", text[:200],
                telegram_message_id=msg_id,
                metadata=template_data,
            )

            return json.dumps({
                "sent": result.get("ok", False),
                "message_id": msg_id,
                "template": template_name,
                "preview": text[:100],
                "_meta": {"action": "sent", "related_tools": ["edit_telegram_message"]},
            })
        except Exception as exc:
            return json.dumps({"error": f"Failed to send template: {exc}"})

    @mcp.tool(
        description="Send a message with an inline keyboard (interactive buttons). "
        "buttons_json: JSON string of button rows — [[{\"text\": \"Label\", \"callback_data\": \"action:id\"}]]. "
        "Each inner array is one row. Max 8 buttons per row, 100 total. "
        "Example: send_telegram_inline_keyboard(text='Choose action:', buttons_json='[[{\"text\": \"Approve\", \"callback_data\": \"approve:123\"}, {\"text\": \"Reject\", \"callback_data\": \"reject:123\"}]]'). "
        "Returns: {sent: bool, message_id: int, button_count: int, _meta}."
    )
    async def send_telegram_inline_keyboard(
        text: str,
        buttons_json: str,
    ) -> str:
        try:
            buttons = json.loads(buttons_json)
            reply_markup = {"inline_keyboard": buttons}
            result = await _send(text, parse_mode=None, reply_markup=reply_markup)

            return json.dumps({
                "sent": result.get("ok", False),
                "message_id": result.get("result", {}).get("message_id"),
                "button_count": sum(len(row) for row in buttons),
                "_meta": {"action": "sent", "related_tools": ["edit_telegram_message"]},
            })
        except Exception as exc:
            return json.dumps({"error": f"Failed to send keyboard: {exc}"})

    @mcp.tool(
        description="Edit an existing Telegram message by message_id. "
        "Provide text to update message content, or reply_markup_json to update buttons. "
        "At least one of text or reply_markup_json must be provided. "
        "Note: Messages can only be edited within ~48 hours of sending. "
        "Example: edit_telegram_message(message_id=12345, text='Updated: Task approved'). "
        "Returns: {edited: bool, message_id: int, updated_field: string, _meta}."
    )
    async def edit_telegram_message(
        message_id: int,
        text: str | None = None,
        reply_markup_json: str | None = None,
    ) -> str:
        try:
            from app.telegram.webhook import telegram_api
            from app import config

            chat_id = int(config.get_telegram_chat_id())
            payload: dict[str, Any] = {
                "chat_id": chat_id,
                "message_id": message_id,
            }

            if text:
                payload["text"] = text
                result = await telegram_api("editMessageText", payload)
            elif reply_markup_json:
                payload["reply_markup"] = json.loads(reply_markup_json)
                result = await telegram_api("editMessageReplyMarkup", payload)
            else:
                return json.dumps({"error": "Provide text or reply_markup_json"})

            return json.dumps({
                "edited": result.get("ok", False),
                "message_id": message_id,
                "updated_field": "text" if text else "reply_markup",
                "_meta": {"action": "edited"},
            })
        except Exception as exc:
            return json.dumps({"error": f"Failed to edit message: {exc}"})

    @mcp.tool(
        description="Get Telegram bot info and webhook status. Returns bot username, webhook URL, "
        "pending update count, and last error details. No parameters needed. "
        "Example: get_telegram_bot_info(). "
        "Returns: {bot: {id, username, ...}, webhook: {url, pending_update_count, last_error_date, last_error_message}, _meta}."
    )
    async def get_telegram_bot_info() -> str:
        try:
            from app.telegram.webhook import telegram_api

            me = await telegram_api("getMe")
            wh = await telegram_api("getWebhookInfo")

            return json.dumps({
                "bot": me.get("result", {}),
                "webhook": {
                    "url": wh.get("result", {}).get("url", ""),
                    "pending_update_count": wh.get("result", {}).get("pending_update_count", 0),
                    "last_error_date": wh.get("result", {}).get("last_error_date"),
                    "last_error_message": wh.get("result", {}).get("last_error_message"),
                },
                "_meta": {"related_tools": ["send_telegram_message"]},
            })
        except Exception as exc:
            return json.dumps({"error": f"Failed to get bot info: {exc}"})
