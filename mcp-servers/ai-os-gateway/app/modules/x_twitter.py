"""X (Twitter) MCP tools for AI OS Gateway.

4 tools for posting tweets, posting with media, listing recent tweets,
and retrieving tweet metrics for the @bharatvarshHQ account.
Uses X API v2 with OAuth 1.0a authentication.

Follows the register_tools(mcp, get_pool) pattern.

Exposes _impl functions for use by the social_adapters layer:
    _post_tweet_impl(pool, text, reply_to_tweet_id) -> str
    _get_recent_tweets_impl(count) -> str
    _delete_tweet_impl(pool, tweet_id) -> str
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import os
import time
import urllib.parse
import uuid as uuid_mod
from datetime import datetime, timezone
from typing import Any

import httpx
from fastmcp import FastMCP

logger = logging.getLogger(__name__)

# X API v2 base
_X_API_V2 = "https://api.x.com/2"


# ---------------------------------------------------------------------------
# OAuth 1.0a signature helpers (module-level)
# ---------------------------------------------------------------------------

def _generate_oauth_signature(
    method: str,
    url: str,
    params: dict[str, str],
    consumer_secret: str,
    token_secret: str,
) -> str:
    """Generate OAuth 1.0a HMAC-SHA1 signature.

    Args:
        method: HTTP method (GET, POST).
        url: Full URL without query params.
        params: All OAuth + request params (sorted).
        consumer_secret: API Key Secret.
        token_secret: Access Token Secret.

    Returns:
        Base64-encoded signature string.
    """
    sorted_params = "&".join(
        f"{urllib.parse.quote(k, safe='')}={urllib.parse.quote(v, safe='')}"
        for k, v in sorted(params.items())
    )

    base_string = (
        f"{method.upper()}&"
        f"{urllib.parse.quote(url, safe='')}&"
        f"{urllib.parse.quote(sorted_params, safe='')}"
    )

    signing_key = (
        f"{urllib.parse.quote(consumer_secret, safe='')}&"
        f"{urllib.parse.quote(token_secret, safe='')}"
    )

    hashed = hmac.new(
        signing_key.encode("utf-8"),
        base_string.encode("utf-8"),
        hashlib.sha1,
    )
    return base64.b64encode(hashed.digest()).decode("utf-8")


def _build_oauth_header(
    method: str,
    url: str,
    consumer_key: str,
    consumer_secret: str,
    access_token: str,
    token_secret: str,
    extra_params: dict[str, str] | None = None,
) -> str:
    """Build the OAuth 1.0a Authorization header value.

    Args:
        method: HTTP method.
        url: Full URL (without query string).
        consumer_key: API Key.
        consumer_secret: API Key Secret.
        access_token: Access Token.
        token_secret: Access Token Secret.
        extra_params: Additional params to include in signature base.

    Returns:
        Authorization header value string.
    """
    oauth_params = {
        "oauth_consumer_key": consumer_key,
        "oauth_nonce": uuid_mod.uuid4().hex,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": access_token,
        "oauth_version": "1.0",
    }

    all_params = {**oauth_params}
    if extra_params:
        all_params.update(extra_params)

    signature = _generate_oauth_signature(
        method, url, all_params, consumer_secret, token_secret
    )
    oauth_params["oauth_signature"] = signature

    header_parts = ", ".join(
        f'{urllib.parse.quote(k, safe="")}="{urllib.parse.quote(v, safe="")}"'
        for k, v in sorted(oauth_params.items())
    )
    return f"OAuth {header_parts}"


# ---------------------------------------------------------------------------
# Shared helpers (module-level so adapters can use them)
# ---------------------------------------------------------------------------

def _get_x_credentials() -> dict[str, str]:
    """Load X API credentials from environment.

    Returns:
        Dict with consumer_key, consumer_secret, access_token, token_secret, bearer_token.

    Raises:
        RuntimeError: If required credentials are missing.
    """
    consumer_key = os.environ.get("X_API_KEY", "")
    consumer_secret = os.environ.get("X_API_SECRET", "")
    access_token = os.environ.get("X_ACCESS_TOKEN", "")
    token_secret = os.environ.get("X_ACCESS_TOKEN_SECRET", "")
    bearer_token = os.environ.get("X_BEARER_TOKEN", "")

    if not all([consumer_key, consumer_secret, access_token, token_secret]):
        raise RuntimeError(
            "X API credentials not configured. "
            "Set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET."
        )

    return {
        "consumer_key": consumer_key,
        "consumer_secret": consumer_secret,
        "access_token": access_token,
        "token_secret": token_secret,
        "bearer_token": bearer_token,
    }


async def _x_request_oauth1(
    method: str,
    url: str,
    json_body: dict | None = None,
    params: dict | None = None,
) -> dict[str, Any]:
    """Make an OAuth 1.0a authenticated request to X API.

    Args:
        method: HTTP method.
        url: Full API URL.
        json_body: JSON body for POST requests.
        params: Query parameters for GET requests.

    Returns:
        Parsed JSON response dict.
    """
    creds = _get_x_credentials()

    extra_params = {}
    if params:
        extra_params = {k: str(v) for k, v in params.items()}

    auth_header = _build_oauth_header(
        method=method,
        url=url,
        consumer_key=creds["consumer_key"],
        consumer_secret=creds["consumer_secret"],
        access_token=creds["access_token"],
        token_secret=creds["token_secret"],
        extra_params=extra_params if method == "GET" else None,
    )

    headers = {
        "Authorization": auth_header,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        if method == "GET":
            resp = await client.get(url, headers=headers, params=params)
        elif method == "DELETE":
            resp = await client.delete(url, headers=headers)
        else:
            resp = await client.post(url, headers=headers, json=json_body)

        if resp.status_code >= 400:
            logger.error("X API error %d: %s", resp.status_code, resp.text)

        return resp.json()


async def _x_request_bearer(
    url: str, params: dict | None = None
) -> dict[str, Any]:
    """Make a Bearer token authenticated request (read-only).

    Args:
        url: Full API URL.
        params: Query parameters.

    Returns:
        Parsed JSON response dict.
    """
    creds = _get_x_credentials()
    headers = {"Authorization": f"Bearer {creds['bearer_token']}"}

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers=headers, params=params)
        return resp.json()


async def _log_post(
    pool: Any,
    content: str,
    post_id: str | None,
    url: str | None,
    status: str,
    error: str | None,
    metadata: dict | None,
) -> str:
    """Log a tweet to social_post_log."""
    from app.auth.social_oauth import log_social_post
    return await log_social_post(
        pool, "x_twitter", content, "post",
        external_post_id=post_id,
        external_url=url,
        status=status,
        error_message=error,
        metadata=metadata,
    )


# ---------------------------------------------------------------------------
# Implementation functions (called by both MCP tools and social adapters)
# ---------------------------------------------------------------------------

async def _post_tweet_impl(
    pool: Any,
    text: str,
    reply_to_tweet_id: str | None = None,
) -> str:
    """Post a text tweet to X.

    Args:
        pool: asyncpg connection pool.
        text: Tweet text (max 280 characters).
        reply_to_tweet_id: Optional tweet ID to reply to.

    Returns:
        JSON string with {tweet_id, text, url, _meta} or {error}.
    """
    if len(text) > 280:
        return json.dumps({"error": "Tweet exceeds 280 characters", "length": len(text)})

    body: dict[str, Any] = {"text": text}
    if reply_to_tweet_id:
        body["reply"] = {"in_reply_to_tweet_id": reply_to_tweet_id}

    result = await _x_request_oauth1("POST", f"{_X_API_V2}/tweets", json_body=body)

    if "data" in result:
        tweet_data = result["data"]
        tweet_id = tweet_data["id"]
        tweet_url = f"https://x.com/bharatvarshHQ/status/{tweet_id}"

        await _log_post(pool, text, tweet_id, tweet_url, "published", None, result)

        return json.dumps({
            "tweet_id": tweet_id,
            "text": tweet_data.get("text", text),
            "url": tweet_url,
            "_meta": {"posted_at": datetime.now(tz=timezone.utc).isoformat()},
        })
    else:
        error_msg = json.dumps(result.get("errors", result))
        await _log_post(pool, text, None, None, "failed", error_msg, result)
        return json.dumps({"error": "Failed to post tweet", "details": result})


async def _get_recent_tweets_impl(count: int = 10) -> str:
    """Get recent tweets from @bharatvarshHQ.

    Args:
        count: Number of tweets to return (5-100).

    Returns:
        JSON string with {tweets, count, _meta} or {error}.
    """
    user_result = await _x_request_bearer(
        f"{_X_API_V2}/users/by/username/bharatvarshHQ"
    )

    if "data" not in user_result:
        return json.dumps({"error": "Could not find @bharatvarshHQ", "details": user_result})

    user_id = user_result["data"]["id"]

    params = {
        "max_results": min(max(count, 5), 100),
        "tweet.fields": "created_at,public_metrics,text",
    }
    result = await _x_request_bearer(
        f"{_X_API_V2}/users/{user_id}/tweets", params=params
    )

    if "data" not in result:
        return json.dumps({"tweets": [], "count": 0, "_meta": {"user_id": user_id}})

    tweets = []
    for t in result["data"]:
        tweets.append({
            "id": t["id"],
            "text": t["text"],
            "created_at": t.get("created_at"),
            "metrics": t.get("public_metrics", {}),
        })

    return json.dumps({
        "tweets": tweets,
        "count": len(tweets),
        "_meta": {"user_id": user_id, "username": "bharatvarshHQ"},
    })


async def _delete_tweet_impl(pool: Any, tweet_id: str) -> str:
    """Delete a tweet by ID.

    Args:
        pool: asyncpg connection pool (unused, kept for interface consistency).
        tweet_id: The tweet ID to delete.

    Returns:
        JSON string with {deleted, tweet_id, _meta}.
    """
    result = await _x_request_oauth1("DELETE", f"{_X_API_V2}/tweets/{tweet_id}")

    if result.get("data", {}).get("deleted"):
        return json.dumps({
            "deleted": True,
            "tweet_id": tweet_id,
            "_meta": {"deleted_at": datetime.now(tz=timezone.utc).isoformat()},
        })
    else:
        return json.dumps({"deleted": False, "tweet_id": tweet_id, "details": result})


# ---------------------------------------------------------------------------
# MCP tool registration (delegates to _impl functions)
# ---------------------------------------------------------------------------

def register_tools(mcp: FastMCP, get_pool: Any) -> None:
    """Register X (Twitter) tools on the MCP server."""

    @mcp.tool(
        description=(
            "Post a text tweet to X (Twitter) as @bharatvarshHQ. "
            "Provide the tweet text (max 280 characters). "
            "Optionally provide reply_to_tweet_id to reply to an existing tweet. "
            "Returns: {tweet_id, text, url, _meta}."
        )
    )
    async def x_post_tweet(text: str, reply_to_tweet_id: str | None = None) -> str:
        """Post a text tweet to X."""
        pool = get_pool()
        return await _post_tweet_impl(pool, text, reply_to_tweet_id)

    @mcp.tool(
        description=(
            "Post a thread of tweets to X (Twitter) as @bharatvarshHQ. "
            "Provide a list of tweet texts. Each tweet must be max 280 characters. "
            "Tweets are posted sequentially, each replying to the previous. "
            "Returns: {thread_id, tweets: [{tweet_id, text, url}], count, _meta}."
        )
    )
    async def x_post_thread(tweets: list[str]) -> str:
        """Post a thread of tweets."""
        pool = get_pool()

        if not tweets:
            return json.dumps({"error": "No tweets provided"})

        for i, t in enumerate(tweets):
            if len(t) > 280:
                return json.dumps({"error": f"Tweet {i+1} exceeds 280 chars", "length": len(t)})

        posted: list[dict] = []
        reply_to: str | None = None

        for i, tweet_text in enumerate(tweets):
            body: dict[str, Any] = {"text": tweet_text}
            if reply_to:
                body["reply"] = {"in_reply_to_tweet_id": reply_to}

            result = await _x_request_oauth1("POST", f"{_X_API_V2}/tweets", json_body=body)

            if "data" in result:
                tweet_id = result["data"]["id"]
                tweet_url = f"https://x.com/bharatvarshHQ/status/{tweet_id}"
                posted.append({"tweet_id": tweet_id, "text": tweet_text, "url": tweet_url})
                reply_to = tweet_id

                await _log_post(pool, tweet_text, tweet_id, tweet_url, "published", None,
                                {"thread_index": i, "thread_size": len(tweets)})
            else:
                error_msg = json.dumps(result.get("errors", result))
                await _log_post(pool, tweet_text, None, None, "failed", error_msg, result)
                return json.dumps({
                    "error": f"Thread failed at tweet {i+1}",
                    "posted_so_far": posted,
                    "details": result,
                })

        return json.dumps({
            "thread_id": posted[0]["tweet_id"] if posted else None,
            "tweets": posted,
            "count": len(posted),
            "_meta": {"posted_at": datetime.now(tz=timezone.utc).isoformat()},
        })

    @mcp.tool(
        description=(
            "Get recent tweets from @bharatvarshHQ on X (Twitter). "
            "Returns the latest tweets (default 10, max 100). "
            "Returns: {tweets: [{id, text, created_at, metrics}], count, _meta}."
        )
    )
    async def x_get_recent_tweets(count: int = 10) -> str:
        """Get recent tweets from the account."""
        return await _get_recent_tweets_impl(count)

    @mcp.tool(
        description=(
            "Delete a tweet by ID from @bharatvarshHQ on X (Twitter). "
            "Provide the tweet_id to delete. "
            "Returns: {deleted: bool, tweet_id, _meta}."
        )
    )
    async def x_delete_tweet(tweet_id: str) -> str:
        """Delete a tweet by ID."""
        return await _delete_tweet_impl(None, tweet_id)
