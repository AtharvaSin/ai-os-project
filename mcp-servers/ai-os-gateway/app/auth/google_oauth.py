"""Google OAuth credential management for AI OS MCP Gateway.

Phase 2 will implement full OAuth token management with auto-refresh.
Currently returns None — modules check this and return 'not configured'.
"""

import os
from typing import Any


def load_credentials() -> Any | None:
    """Load Google OAuth credentials from environment.

    Returns google.auth.credentials.Credentials if configured,
    None otherwise.
    """
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN")

    if not all([client_id, client_secret, refresh_token]):
        return None

    try:
        from google.oauth2.credentials import Credentials

        creds = Credentials(
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
        return creds
    except Exception:
        return None
