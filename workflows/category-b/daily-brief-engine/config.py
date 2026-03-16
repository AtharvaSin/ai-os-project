"""Centralized configuration for the Daily Brief Engine.

Handles: DB connection, Google OAuth, API service builders, secrets, constants.
"""

from __future__ import annotations

import logging
import os
import threading
from typing import Any

import pg8000
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
BRIEF_DRIVE_FOLDER = os.getenv(
    "BRIEF_DRIVE_FOLDER", "AI OS/AI Operating System/Daily Briefs"
)
TELEGRAM_BRIEF_ENABLED = os.getenv("TELEGRAM_BRIEF_ENABLED", "false").lower() == "true"
PIPELINE_SLUG = "daily-brief-engine"

# No explicit scopes — let the refresh token use its originally-authorized scopes.
# Passing scopes here causes invalid_scope if the token wasn't minted with them.
GOOGLE_SCOPES: list[str] = []

# ---------------------------------------------------------------------------
# Secret loading (env var first, then GCP Secret Manager on Cloud Run)
# ---------------------------------------------------------------------------
_secret_cache: dict[str, str] = {}


def _is_cloud_run() -> bool:
    return os.getenv("K_SERVICE") is not None


def get_secret(name: str) -> str:
    """Return secret value from env or GCP Secret Manager."""
    if name in _secret_cache:
        return _secret_cache[name]
    value = os.getenv(name, "")
    if value:
        _secret_cache[name] = value
        return value
    if _is_cloud_run():
        try:
            from google.cloud import secretmanager

            client = secretmanager.SecretManagerServiceClient()
            resp = client.access_secret_version(
                request={
                    "name": f"projects/ai-operating-system-490208/secrets/{name}/versions/latest"
                }
            )
            value = resp.payload.data.decode("utf-8")
            _secret_cache[name] = value
            return value
        except Exception as exc:
            logger.warning("Failed to load secret %s: %s", name, exc)
    return ""


# ---------------------------------------------------------------------------
# Database connection (pg8000 — synchronous)
# ---------------------------------------------------------------------------
def get_db_connection() -> pg8000.Connection:
    """Return a new pg8000 connection to Cloud SQL."""
    db_instance = os.getenv("DB_INSTANCE", "bharatvarsh-website:us-central1:bharatvarsh-db")
    db_user = os.getenv("DB_USER", "ai_os_admin")
    db_name = os.getenv("DB_NAME", "ai_os")
    db_password = get_secret("AI_OS_DB_PASSWORD") or get_secret("DB_PASSWORD")

    if _is_cloud_run():
        unix_sock = f"/cloudsql/{db_instance}/.s.PGSQL.5432"
        return pg8000.connect(
            user=db_user,
            password=db_password,
            database=db_name,
            unix_sock=unix_sock,
        )
    else:
        return pg8000.connect(
            user=db_user,
            password=db_password,
            database=db_name,
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "5432")),
        )


# ---------------------------------------------------------------------------
# Google OAuth (cached, thread-safe)
# ---------------------------------------------------------------------------
_credentials: Credentials | None = None
_services: dict[str, Any] = {}
_lock = threading.Lock()


def _get_credentials() -> Credentials:
    global _credentials
    if _credentials and _credentials.valid:
        return _credentials

    kwargs = {
        "token": None,
        "refresh_token": get_secret("GOOGLE_REFRESH_TOKEN"),
        "client_id": get_secret("GOOGLE_CLIENT_ID"),
        "client_secret": get_secret("GOOGLE_CLIENT_SECRET"),
        "token_uri": "https://oauth2.googleapis.com/token",
    }
    if GOOGLE_SCOPES:
        kwargs["scopes"] = GOOGLE_SCOPES
    _credentials = Credentials(**kwargs)
    _credentials.refresh(Request())
    return _credentials


def get_google_service(api: str, version: str) -> Any:
    """Return a cached Google API service client."""
    cache_key = f"{api}:{version}"
    with _lock:
        if cache_key in _services:
            return _services[cache_key]
    creds = _get_credentials()
    service = build(api, version, credentials=creds, cache_discovery=False)
    with _lock:
        _services[cache_key] = service
    return service


def get_gmail_service() -> Any:
    return get_google_service("gmail", "v1")


def get_drive_service() -> Any:
    return get_google_service("drive", "v3")


def get_calendar_service() -> Any:
    return get_google_service("calendar", "v3")


def get_tasks_service() -> Any:
    return get_google_service("tasks", "v1")


# ---------------------------------------------------------------------------
# Anthropic
# ---------------------------------------------------------------------------
def get_anthropic_api_key() -> str:
    return get_secret("ANTHROPIC_API_KEY")


# ---------------------------------------------------------------------------
# Telegram
# ---------------------------------------------------------------------------
def get_telegram_config() -> dict[str, str]:
    return {
        "bot_token": get_secret("TELEGRAM_BOT_TOKEN"),
        "chat_id": get_secret("TELEGRAM_CHAT_ID"),
    }
