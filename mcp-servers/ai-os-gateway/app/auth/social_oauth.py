"""Social media OAuth token management for LinkedIn and Meta.

Handles token storage, retrieval, and refresh for social platform APIs.
Tokens are stored in the social_accounts table and cached in memory.
Refresh logic runs automatically when tokens are within 24h of expiry.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# In-memory cache: platform -> {access_token, expires_at, account_id, metadata}
_token_cache: dict[str, dict[str, Any]] = {}

# Token refresh buffer — refresh if expiring within this window
_REFRESH_BUFFER = timedelta(hours=24)


async def get_active_account(pool, platform: str) -> dict[str, Any] | None:
    """Get the active social account for a platform from the database.

    Args:
        pool: asyncpg connection pool.
        platform: 'linkedin', 'facebook', or 'instagram'.

    Returns:
        Account dict or None if not configured.
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, platform, account_name, account_id, access_token, "
            "refresh_token, token_expires_at, scopes, metadata "
            "FROM social_accounts "
            "WHERE platform = $1 AND is_active = TRUE "
            "ORDER BY updated_at DESC LIMIT 1",
            platform,
        )
    if not row:
        return None
    return dict(row)


async def get_access_token(pool, platform: str) -> str:
    """Get a valid access token for a platform, refreshing if needed.

    Args:
        pool: asyncpg connection pool.
        platform: 'linkedin', 'facebook', or 'instagram'.

    Returns:
        Valid access token string.

    Raises:
        RuntimeError: If no account configured or refresh fails.
    """
    # Check cache first
    cached = _token_cache.get(platform)
    if cached and cached.get("expires_at"):
        if datetime.now(tz=timezone.utc) < cached["expires_at"] - _REFRESH_BUFFER:
            return cached["access_token"]

    # Load from DB
    account = await get_active_account(pool, platform)
    if not account:
        raise RuntimeError(
            f"No active {platform} account configured. "
            f"Add credentials to the social_accounts table."
        )

    expires_at = account.get("token_expires_at")
    now = datetime.now(tz=timezone.utc)

    # Check if token needs refresh
    if expires_at and now >= expires_at - _REFRESH_BUFFER:
        refresh_token = account.get("refresh_token")
        if refresh_token:
            logger.info("Refreshing %s access token (expires %s)", platform, expires_at)
            new_token_data = await _refresh_token(platform, account)
            if new_token_data:
                # Update DB
                await _update_token_in_db(
                    pool,
                    account["id"],
                    new_token_data["access_token"],
                    new_token_data.get("refresh_token", refresh_token),
                    new_token_data.get("expires_at"),
                )
                _token_cache[platform] = {
                    "access_token": new_token_data["access_token"],
                    "expires_at": new_token_data.get("expires_at"),
                }
                return new_token_data["access_token"]
            else:
                logger.warning("Token refresh failed for %s, using existing token", platform)

    # Cache and return current token
    _token_cache[platform] = {
        "access_token": account["access_token"],
        "expires_at": expires_at,
    }
    return account["access_token"]


async def _refresh_token(
    platform: str, account: dict[str, Any]
) -> dict[str, Any] | None:
    """Refresh an OAuth token for the given platform.

    Returns:
        Dict with {access_token, refresh_token?, expires_at?} or None on failure.
    """
    try:
        if platform == "linkedin":
            return await _refresh_linkedin_token(account)
        elif platform in ("facebook", "instagram"):
            return await _refresh_meta_token(account)
        else:
            logger.warning("No refresh logic for platform: %s", platform)
            return None
    except Exception as exc:
        logger.error("Token refresh failed for %s: %s", platform, exc)
        return None


async def _refresh_linkedin_token(account: dict[str, Any]) -> dict[str, Any] | None:
    """Refresh LinkedIn OAuth 2.0 token using refresh_token grant.

    LinkedIn refresh tokens are valid for 365 days.
    Access tokens are valid for 60 days.
    """
    import os

    client_id = os.getenv("LINKEDIN_CLIENT_ID")
    client_secret = os.getenv("LINKEDIN_CLIENT_SECRET")
    if not client_id or not client_secret:
        logger.error("LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not set")
        return None

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "refresh_token",
                "refresh_token": account["refresh_token"],
                "client_id": client_id,
                "client_secret": client_secret,
            },
        )
        if resp.status_code != 200:
            logger.error("LinkedIn refresh failed: %s %s", resp.status_code, resp.text)
            return None

        data = resp.json()
        expires_in = data.get("expires_in", 5184000)  # default 60 days
        return {
            "access_token": data["access_token"],
            "refresh_token": data.get("refresh_token", account["refresh_token"]),
            "expires_at": datetime.now(tz=timezone.utc) + timedelta(seconds=expires_in),
        }


async def _refresh_meta_token(account: dict[str, Any]) -> dict[str, Any] | None:
    """Refresh Meta (Facebook/Instagram) long-lived token.

    Meta long-lived tokens last 60 days. Refreshing extends by another 60 days.
    No refresh_token grant — uses the token exchange endpoint.
    """
    import os

    app_id = os.getenv("META_APP_ID")
    app_secret = os.getenv("META_APP_SECRET")
    if not app_id or not app_secret:
        logger.error("META_APP_ID or META_APP_SECRET not set")
        return None

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": app_id,
                "client_secret": app_secret,
                "fb_exchange_token": account["access_token"],
            },
        )
        if resp.status_code != 200:
            logger.error("Meta refresh failed: %s %s", resp.status_code, resp.text)
            return None

        data = resp.json()
        expires_in = data.get("expires_in", 5184000)  # default 60 days
        return {
            "access_token": data["access_token"],
            "expires_at": datetime.now(tz=timezone.utc) + timedelta(seconds=expires_in),
        }


async def _update_token_in_db(
    pool,
    account_id: str,
    access_token: str,
    refresh_token: str | None,
    expires_at: datetime | None,
) -> None:
    """Update token values in social_accounts table."""
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE social_accounts "
            "SET access_token = $1, refresh_token = $2, token_expires_at = $3 "
            "WHERE id = $4::uuid",
            access_token,
            refresh_token,
            expires_at,
            str(account_id),
        )
    logger.info("Updated token in DB for account %s", account_id)


async def log_social_post(
    pool,
    platform: str,
    content_preview: str,
    content_type: str = "post",
    external_post_id: str | None = None,
    external_url: str | None = None,
    status: str = "published",
    campaign_post_id: str | None = None,
    error_message: str | None = None,
    metadata: dict | None = None,
) -> str:
    """Log a social media post attempt to the social_post_log table.

    Returns:
        UUID of the created log entry.
    """
    import uuid

    account = await get_active_account(pool, platform)
    account_uuid = account["id"] if account else None
    log_id = str(uuid.uuid4())

    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO social_post_log "
            "(id, account_id, platform, content_preview, content_type, "
            "external_post_id, external_url, status, campaign_post_id, "
            "error_message, metadata, published_at) "
            "VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::post_status, "
            "$9::uuid, $10, $11::jsonb, $12)",
            log_id,
            str(account_uuid) if account_uuid else None,
            platform,
            content_preview[:500] if content_preview else None,
            content_type,
            external_post_id,
            external_url,
            status,
            campaign_post_id,
            error_message,
            json.dumps(metadata or {}),
            datetime.now(tz=timezone.utc) if status == "published" else None,
        )
    return log_id


def clear_token_cache(platform: str | None = None) -> None:
    """Clear cached tokens. If platform is None, clears all."""
    if platform:
        _token_cache.pop(platform, None)
    else:
        _token_cache.clear()
