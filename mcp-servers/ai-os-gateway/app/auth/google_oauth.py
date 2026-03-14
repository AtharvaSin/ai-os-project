"""Google OAuth credential management for AI OS MCP Gateway.

Loads OAuth credentials from environment variables (set via Secret Manager
on Cloud Run, .env locally). Provides cached Google API service objects
with automatic token refresh.
"""

from __future__ import annotations

import asyncio
import logging
import os
import threading
from typing import Any

logger = logging.getLogger(__name__)

_credentials: Any | None = None
_services: dict[str, Any] = {}
_lock = threading.Lock()


def load_credentials() -> Any | None:
    """Load Google OAuth credentials from environment.

    Returns google.oauth2.credentials.Credentials if configured,
    None otherwise. Credentials auto-refresh on expiry.
    """
    global _credentials

    if _credentials is not None:
        return _credentials

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN")

    if not all([client_id, client_secret, refresh_token]):
        return None

    try:
        from google.oauth2.credentials import Credentials

        _credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            client_id=client_id,
            client_secret=client_secret,
            token_uri="https://oauth2.googleapis.com/token",
            scopes=[
                "https://www.googleapis.com/auth/tasks",
                "https://www.googleapis.com/auth/drive",
                "https://www.googleapis.com/auth/calendar",
            ],
        )
        logger.info("Google OAuth credentials loaded successfully")
        return _credentials
    except Exception as e:
        logger.error("Failed to load Google OAuth credentials: %s", e)
        return None


def get_service(api: str, version: str) -> Any | None:
    """Get a cached Google API service object.

    Args:
        api: API name (e.g., 'tasks', 'drive', 'calendar')
        version: API version (e.g., 'v1', 'v3')

    Returns:
        googleapiclient.discovery.Resource or None if not configured.
    """
    cache_key = f"{api}_{version}"

    with _lock:
        if cache_key in _services:
            return _services[cache_key]

    creds = load_credentials()
    if creds is None:
        return None

    try:
        from googleapiclient.discovery import build

        service = build(api, version, credentials=creds)
        with _lock:
            _services[cache_key] = service
        logger.info("Built Google API service: %s %s", api, version)
        return service
    except Exception as e:
        logger.error("Failed to build Google API service %s %s: %s", api, version, e)
        return None


async def run_google_api(func, *args, **kwargs) -> Any:
    """Run a synchronous Google API call in a thread pool.

    Google's API client library is synchronous. This wrapper lets
    async MCP tool functions call it without blocking the event loop.
    """
    return await asyncio.to_thread(func, *args, **kwargs)
