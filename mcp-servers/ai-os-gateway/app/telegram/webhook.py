"""Telegram webhook endpoint — receives updates, routes to command/AI handlers.

Mounted as a FastAPI APIRouter on the MCP Gateway. All routes are
under /telegram/* and must be included BEFORE the catch-all MCP mount.

Async response pattern: Return 200 to Telegram immediately, process the
command via asyncio.create_task(), send the response via a separate
sendMessage API call. This prevents webhook timeout on cold starts.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app import config
from app.telegram.models import TelegramUpdate
from app.telegram.router import handle_command, parse_command
from app.telegram.formatter import escape_md, split_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telegram", tags=["telegram"])

# Shared httpx client for Telegram API calls
_http_client: httpx.AsyncClient | None = None


def _get_http_client() -> httpx.AsyncClient:
    """Get or create the shared httpx client."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=30.0)
    return _http_client


async def telegram_api(method: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    """Call a Telegram Bot API method.

    Args:
        method: API method name (e.g., 'sendMessage', 'setWebhook')
        payload: Request body as dict

    Returns:
        Telegram API response as dict
    """
    token = config.get_telegram_bot_token()
    url = f"https://api.telegram.org/bot{token}/{method}"
    client = _get_http_client()

    response = await client.post(url, json=payload or {})
    result = response.json()

    if not result.get("ok"):
        logger.error("Telegram API error: %s %s → %s", method, payload, result)

    return result


async def send_message(
    chat_id: int | str,
    text: str,
    parse_mode: str | None = "MarkdownV2",
    reply_markup: dict | None = None,
) -> dict[str, Any]:
    """Send a message to a Telegram chat with automatic fallback.

    If MarkdownV2 fails (escape issues), retries without parse_mode.
    Long messages are automatically split.
    """
    parts = split_message(text)
    last_result: dict[str, Any] = {}

    for i, part in enumerate(parts):
        payload: dict[str, Any] = {"chat_id": chat_id, "text": part}
        if parse_mode:
            payload["parse_mode"] = parse_mode
        # Only attach keyboard to the last message part
        if reply_markup and i == len(parts) - 1:
            payload["reply_markup"] = reply_markup

        result = await telegram_api("sendMessage", payload)

        # Fallback: retry without parse_mode if MarkdownV2 fails
        if not result.get("ok") and parse_mode:
            payload.pop("parse_mode", None)
            # Strip markdown formatting for plain text
            payload["text"] = part.replace("\\", "")
            result = await telegram_api("sendMessage", payload)

        last_result = result

    return last_result


async def _process_update(update: TelegramUpdate) -> None:
    """Process a Telegram update (runs as background task)."""
    try:
        chat_id = config.get_telegram_chat_id()
        pool = config.get_db_pool()

        # Handle callback queries (inline keyboard presses)
        if update.callback_query:
            cb = update.callback_query
            if cb.message and str(cb.message.chat.id) != chat_id:
                return

            # Import callback handler (T2 — lazy import)
            try:
                from app.telegram.callback_handler import handle_callback
                await handle_callback(cb, pool)
            except ImportError:
                # T1: callbacks not yet implemented, acknowledge silently
                await telegram_api("answerCallbackQuery", {
                    "callback_query_id": cb.id,
                    "text": "Coming soon!",
                })
            return

        # Handle messages
        if not update.message or not update.message.text:
            return

        msg = update.message

        # Security: only respond to authorized chat
        if str(msg.chat.id) != chat_id:
            return

        text = msg.text
        command, args = parse_command(text)

        if command:
            # Slash command → route to command handler
            response = await handle_command(command, args, pool)
        else:
            # Non-command text → placeholder (AI triage in T3)
            try:
                from app.telegram.ai_handler import handle_natural_language
                response = await handle_natural_language(text, str(msg.chat.id), pool)
            except ImportError:
                response = {
                    "text": escape_md(
                        "Use a /command to interact:\n\n"
                        "/brief — Daily briefing\n"
                        "/add — Create a task\n"
                        "/done — Complete a task\n"
                        "/status — Project health\n"
                        "/log — Capture a thought\n"
                        "/j — Journal entry\n"
                        "/e — Quick capture\n"
                        "/ei — Capture idea\n"
                        "/em — Capture memory"
                    ),
                    "parse_mode": "MarkdownV2",
                }

        # Send response
        await send_message(
            chat_id=msg.chat.id,
            text=response.get("text", "Done."),
            parse_mode=response.get("parse_mode"),
            reply_markup=response.get("reply_markup"),
        )

    except Exception as exc:
        logger.exception("Error processing Telegram update: %s", exc)
        # Try to send error message
        try:
            chat_id = config.get_telegram_chat_id()
            await send_message(
                chat_id=int(chat_id),
                text=f"Error: {str(exc)[:200]}",
                parse_mode=None,
            )
        except Exception:
            pass


@router.post("/webhook")
async def webhook(request: Request) -> JSONResponse:
    """Receive Telegram webhook updates.

    Validates the secret token header, parses the update,
    and processes it asynchronously to avoid timeout.
    """
    # Validate webhook secret
    secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    expected = config.get_telegram_webhook_secret()
    if secret != expected:
        # Return 200 to prevent Telegram from retrying
        return JSONResponse({"ok": True})

    try:
        body = await request.json()
        update = TelegramUpdate.model_validate(body)
    except Exception as exc:
        logger.warning("Invalid Telegram update: %s", exc)
        return JSONResponse({"ok": True})

    # Process asynchronously — return 200 immediately
    asyncio.create_task(_process_update(update))

    return JSONResponse({"ok": True})


@router.get("/set-webhook")
async def set_webhook(request: Request) -> dict[str, Any]:
    """Register the webhook URL with Telegram.

    Call this once after deployment to set the webhook.
    Uses the Gateway's own URL derived from the request.
    """
    # Build webhook URL from the current request
    # Cloud Run terminates TLS at the load balancer, so request.base_url is HTTP.
    # Force HTTPS for the Telegram API.
    base_url = str(request.base_url).rstrip("/").replace("http://", "https://")
    webhook_url = f"{base_url}/telegram/webhook"

    secret = config.get_telegram_webhook_secret()

    result = await telegram_api("setWebhook", {
        "url": webhook_url,
        "secret_token": secret,
        "allowed_updates": ["message", "callback_query", "inline_query"],
        "drop_pending_updates": True,
    })

    return {
        "webhook_url": webhook_url,
        "telegram_response": result,
    }


@router.get("/register-commands")
async def register_commands() -> dict[str, Any]:
    """Register bot commands with Telegram for the command menu."""
    commands = [
        {"command": "brief", "description": "Daily briefing — tasks, milestones, stats"},
        {"command": "add", "description": "Create a task: /add title @project p:priority due:date"},
        {"command": "done", "description": "Complete a task: /done <short_id>"},
        {"command": "status", "description": "Project health snapshot"},
        {"command": "log", "description": "Capture a thought to knowledge base"},
        {"command": "j", "description": "Journal entry: /j content mood=X energy=N"},
        {"command": "e", "description": "Quick capture: /e observation or thought"},
        {"command": "ei", "description": "Capture idea: /ei your idea here"},
        {"command": "em", "description": "Capture memory: /em recall or reference"},
    ]

    result = await telegram_api("setMyCommands", {"commands": commands})
    return {"commands_registered": len(commands), "telegram_response": result}


@router.get("/info")
async def bot_info() -> dict[str, Any]:
    """Get bot information and webhook status."""
    me = await telegram_api("getMe")
    webhook_info = await telegram_api("getWebhookInfo")

    return {
        "bot": me.get("result", {}),
        "webhook": webhook_info.get("result", {}),
    }
