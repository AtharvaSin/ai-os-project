"""LinkedIn MCP tools for AI OS Gateway.

4 tools for posting content, retrieving post metrics, listing posts,
and getting profile info. Uses LinkedIn Community Management API v2.

Follows the register_tools(mcp, get_pool) pattern from telegram.py.

Exposes _impl functions for use by the social_adapters layer:
    _post_to_linkedin_impl(pool, content, visibility, media_url, media_title, campaign_post_id) -> str
    _get_linkedin_metrics_impl(pool, post_id) -> str
    _list_linkedin_posts_impl(pool, limit) -> str
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from fastmcp import FastMCP

logger = logging.getLogger(__name__)

# LinkedIn API base URLs
_API_BASE = "https://api.linkedin.com"
_API_VERSION = "202401"


# ---------------------------------------------------------------------------
# Shared helpers (module-level so adapters can use them)
# ---------------------------------------------------------------------------

async def _linkedin_request(
    method: str,
    path: str,
    access_token: str,
    json_body: dict | None = None,
    params: dict | None = None,
) -> dict[str, Any]:
    """Make an authenticated LinkedIn API request.

    Args:
        method: HTTP method (GET, POST, DELETE).
        path: API path (e.g. '/rest/posts').
        access_token: Valid OAuth 2.0 bearer token.
        json_body: Request body for POST/PUT.
        params: Query parameters for GET.

    Returns:
        Parsed JSON response dict.
    """
    headers = {
        "Authorization": f"Bearer {access_token}",
        "LinkedIn-Version": _API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
    }
    if json_body:
        headers["Content-Type"] = "application/json"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.request(
            method,
            f"{_API_BASE}{path}",
            headers=headers,
            json=json_body,
            params=params,
        )
        if resp.status_code == 201:
            # POST success — extract post URN from header
            post_id = resp.headers.get("x-restli-id", "")
            return {"created": True, "post_id": post_id}
        if resp.status_code == 204:
            return {"success": True}
        return resp.json()


async def _get_token(pool: Any) -> str:
    """Get a valid LinkedIn access token."""
    from app.auth.social_oauth import get_access_token
    return await get_access_token(pool, "linkedin")


async def _get_person_urn(pool: Any) -> str:
    """Get the LinkedIn person URN for the authenticated user."""
    from app.auth.social_oauth import get_active_account
    account = await get_active_account(pool, "linkedin")
    if account and account.get("account_id"):
        return f"urn:li:person:{account['account_id']}"
    # Fallback: call userinfo endpoint
    token = await _get_token(pool)
    data = await _linkedin_request("GET", "/v2/userinfo", token)
    person_id = data.get("sub", "")
    return f"urn:li:person:{person_id}"


# ---------------------------------------------------------------------------
# Implementation functions (called by both MCP tools and social adapters)
# ---------------------------------------------------------------------------

async def _post_to_linkedin_impl(
    pool: Any,
    content: str,
    visibility: str = "PUBLIC",
    media_url: str | None = None,
    media_title: str | None = None,
    campaign_post_id: str | None = None,
) -> str:
    """Post content to LinkedIn as the authenticated user.

    Args:
        pool: asyncpg connection pool.
        content: The post text (up to 3000 characters).
        visibility: 'PUBLIC' or 'CONNECTIONS'.
        media_url: Optional URL to an image or article to attach.
        media_title: Optional title for the attached media.
        campaign_post_id: Optional UUID to link to a campaign_posts record.

    Returns:
        JSON string with {posted, post_id, post_url, timestamp, _meta} or {error}.
    """
    try:
        token = await _get_token(pool)
        person_urn = await _get_person_urn(pool)

        post_body: dict[str, Any] = {
            "author": person_urn,
            "commentary": content[:3000],
            "visibility": visibility,
            "distribution": {
                "feedDistribution": "MAIN_FEED",
                "targetEntities": [],
                "thirdPartyDistributionChannels": [],
            },
            "lifecycleState": "PUBLISHED",
        }

        if media_url:
            post_body["content"] = {
                "article": {
                    "source": media_url,
                    "title": media_title or "",
                    "description": "",
                }
            }

        result = await _linkedin_request("POST", "/rest/posts", token, json_body=post_body)

        post_id = result.get("post_id", "")
        post_url = f"https://www.linkedin.com/feed/update/{post_id}/" if post_id else ""

        from app.auth.social_oauth import log_social_post
        await log_social_post(
            pool,
            platform="linkedin",
            content_preview=content,
            content_type="article" if media_url else "post",
            external_post_id=post_id,
            external_url=post_url,
            status="published" if result.get("created") else "failed",
            campaign_post_id=campaign_post_id,
            error_message=result.get("message") if not result.get("created") else None,
            metadata={"visibility": visibility, "media_url": media_url},
        )

        if campaign_post_id and result.get("created"):
            async with pool.acquire() as conn:
                await conn.execute(
                    "UPDATE campaign_posts SET status = 'published', "
                    "external_post_id = $1, published_at = $2 "
                    "WHERE id = $3::uuid",
                    post_id,
                    datetime.now(tz=timezone.utc),
                    campaign_post_id,
                )

        return json.dumps({
            "posted": result.get("created", False),
            "post_id": post_id,
            "post_url": post_url,
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "_meta": {
                "action": "posted",
                "related_tools": ["get_linkedin_metrics", "list_linkedin_posts"],
            },
        })
    except Exception as exc:
        try:
            from app.auth.social_oauth import log_social_post
            await log_social_post(
                pool, platform="linkedin", content_preview=content,
                status="failed", error_message=str(exc),
                campaign_post_id=campaign_post_id,
            )
        except Exception:
            pass
        return json.dumps({"error": f"Failed to post to LinkedIn: {exc}"})


async def _get_linkedin_metrics_impl(pool: Any, post_id: str) -> str:
    """Get engagement metrics for a LinkedIn post.

    Args:
        pool: asyncpg connection pool.
        post_id: The post URN (e.g. 'urn:li:share:12345').

    Returns:
        JSON string with {post_id, likes, comments, shares, impressions, _meta} or {error}.
    """
    try:
        token = await _get_token(pool)

        encoded_urn = post_id.replace(":", "%3A")
        actions = await _linkedin_request(
            "GET",
            f"/v2/socialActions/{encoded_urn}",
            token,
        )

        likes = actions.get("likesSummary", {}).get("totalLikes", 0)
        comments = actions.get("commentsSummary", {}).get("totalFirstLevelComments", 0)

        stats_params = {"q": "organizationalEntity", "shares[0]": post_id}
        try:
            stats = await _linkedin_request(
                "GET", "/v2/organizationalEntityShareStatistics", token, params=stats_params
            )
            elements = stats.get("elements", [{}])
            total_stats = elements[0].get("totalShareStatistics", {}) if elements else {}
            impressions = total_stats.get("impressionCount", 0)
            shares = total_stats.get("shareCount", 0)
        except Exception:
            impressions = 0
            shares = 0

        return json.dumps({
            "post_id": post_id,
            "likes": likes,
            "comments": comments,
            "shares": shares,
            "impressions": impressions,
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "_meta": {"related_tools": ["list_linkedin_posts", "post_to_linkedin"]},
        })
    except Exception as exc:
        return json.dumps({"error": f"Failed to get LinkedIn metrics: {exc}"})


async def _list_linkedin_posts_impl(pool: Any, limit: int = 10) -> str:
    """List recent LinkedIn posts by the authenticated user.

    Args:
        pool: asyncpg connection pool.
        limit: Number of posts to return (max 50).

    Returns:
        JSON string with {posts, total, author, _meta} or {error}.
    """
    try:
        token = await _get_token(pool)
        person_urn = await _get_person_urn(pool)

        count = min(limit, 50)
        result = await _linkedin_request(
            "GET",
            "/rest/posts",
            token,
            params={
                "author": person_urn,
                "q": "author",
                "count": count,
                "sortBy": "LAST_MODIFIED",
            },
        )

        posts = []
        for element in result.get("elements", []):
            post_id = element.get("id", "")
            commentary = element.get("commentary", "")
            posts.append({
                "post_id": post_id,
                "content_preview": commentary[:200],
                "visibility": element.get("visibility", ""),
                "created_at": element.get("createdAt", ""),
                "lifecycle_state": element.get("lifecycleState", ""),
            })

        return json.dumps({
            "posts": posts,
            "total": len(posts),
            "author": person_urn,
            "_meta": {
                "related_tools": ["get_linkedin_metrics", "post_to_linkedin"],
            },
        })
    except Exception as exc:
        return json.dumps({"error": f"Failed to list LinkedIn posts: {exc}"})


# ---------------------------------------------------------------------------
# MCP tool registration (delegates to _impl functions)
# ---------------------------------------------------------------------------

def register_tools(mcp: FastMCP, get_pool: Any) -> None:
    """Register LinkedIn tools on the MCP server."""

    @mcp.tool(
        description="Post content to LinkedIn as the authenticated user. "
        "content: The post text (up to 3000 characters). "
        "visibility: 'PUBLIC' (default) or 'CONNECTIONS'. "
        "media_url: Optional URL to an image or article to attach. "
        "media_title: Optional title for the attached media. "
        "campaign_post_id: Optional UUID to link this post to a campaign_posts record. "
        "Example: post_to_linkedin(content='Excited to share our latest AI OS update!', visibility='PUBLIC'). "
        "Returns: {posted: bool, post_id: string, post_url: string, timestamp: string, _meta}."
    )
    async def post_to_linkedin(
        content: str,
        visibility: str = "PUBLIC",
        media_url: str | None = None,
        media_title: str | None = None,
        campaign_post_id: str | None = None,
    ) -> str:
        pool = get_pool()
        return await _post_to_linkedin_impl(pool, content, visibility, media_url, media_title, campaign_post_id)

    @mcp.tool(
        description="Get engagement metrics for a LinkedIn post. "
        "post_id: The post URN (e.g. 'urn:li:share:12345' or 'urn:li:ugcPost:12345'). "
        "Example: get_linkedin_metrics(post_id='urn:li:share:7170000000000000000'). "
        "Returns: {post_id: string, likes: int, comments: int, shares: int, impressions: int, _meta}."
    )
    async def get_linkedin_metrics(post_id: str) -> str:
        pool = get_pool()
        return await _get_linkedin_metrics_impl(pool, post_id)

    @mcp.tool(
        description="List recent LinkedIn posts by the authenticated user. "
        "limit: Number of posts to return (default 10, max 50). "
        "Example: list_linkedin_posts(limit=5). "
        "Returns: {posts: [{post_id, content_preview, visibility, created_at, likes, comments}], total: int, _meta}."
    )
    async def list_linkedin_posts(limit: int = 10) -> str:
        pool = get_pool()
        return await _list_linkedin_posts_impl(pool, limit)

    @mcp.tool(
        description="Get the authenticated LinkedIn user's profile info. "
        "Returns name, headline, vanity name, and profile picture URL. "
        "No parameters needed. "
        "Example: get_linkedin_profile(). "
        "Returns: {name: string, headline: string, vanity_name: string, profile_url: string, _meta}."
    )
    async def get_linkedin_profile() -> str:
        pool = get_pool()
        try:
            token = await _get_token(pool)

            userinfo = await _linkedin_request("GET", "/v2/userinfo", token)

            name = userinfo.get("name", "")
            given = userinfo.get("given_name", "")
            family = userinfo.get("family_name", "")
            picture = userinfo.get("picture", "")
            sub = userinfo.get("sub", "")

            vanity_name = userinfo.get("vanityName", "")

            return json.dumps({
                "name": name or f"{given} {family}".strip(),
                "given_name": given,
                "family_name": family,
                "picture_url": picture,
                "person_id": sub,
                "person_urn": f"urn:li:person:{sub}",
                "profile_url": f"https://www.linkedin.com/in/{vanity_name}" if vanity_name else "",
                "_meta": {"related_tools": ["post_to_linkedin", "list_linkedin_posts"]},
            })
        except Exception as exc:
            return json.dumps({"error": f"Failed to get LinkedIn profile: {exc}"})
