"""Meta (Facebook + Instagram) MCP tools for AI OS Gateway.

4 tools for posting to Facebook Pages, Instagram Business accounts,
retrieving post metrics, and listing recent posts.  Uses Meta Graph API v19.0.

Also exposes _impl functions for the social_adapters layer:
    _post_to_facebook_impl, _post_to_instagram_impl,
    _get_meta_metrics_impl, _list_meta_posts_impl
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from fastmcp import FastMCP

logger = logging.getLogger(__name__)

# Meta Graph API base
_GRAPH_API = "https://graph.facebook.com/v19.0"


async def _meta_request(
    method: str,
    path: str,
    access_token: str,
    data: dict | None = None,
    params: dict | None = None,
) -> dict[str, Any]:
    """Make an authenticated Meta Graph API request.

    Args:
        method: HTTP method.
        path: API path (e.g. '/{page-id}/feed').
        access_token: Page access token.
        data: Form data for POST.
        params: Query parameters for GET.

    Returns:
        Parsed JSON response dict.
    """
    if params is None:
        params = {}
    params["access_token"] = access_token

    async with httpx.AsyncClient(timeout=30) as client:
        if method == "GET":
            resp = await client.get(f"{_GRAPH_API}{path}", params=params)
        else:
            resp = await client.post(f"{_GRAPH_API}{path}", data={**(data or {}), **params})
        return resp.json()


async def _get_facebook_token(pool: Any) -> tuple[str, str]:
    """Get Facebook Page access token and page ID.

    Returns:
        Tuple of (access_token, page_id).
    """
    from app.auth.social_oauth import get_access_token, get_active_account
    token = await get_access_token(pool, "facebook")
    account = await get_active_account(pool, "facebook")
    page_id = account["account_id"] if account else ""
    return token, page_id


async def _get_instagram_token(pool: Any) -> tuple[str, str]:
    """Get Instagram access token and IG user ID.

    Returns:
        Tuple of (access_token, ig_user_id).
    """
    from app.auth.social_oauth import get_access_token, get_active_account
    token = await get_access_token(pool, "instagram")
    account = await get_active_account(pool, "instagram")
    if account and account.get("metadata"):
        meta = account["metadata"] if isinstance(account["metadata"], dict) else json.loads(account["metadata"])
        ig_user_id = meta.get("ig_user_id", account.get("account_id", ""))
    else:
        ig_user_id = account["account_id"] if account else ""
    return token, ig_user_id


async def _post_to_facebook_impl(
    pool: Any,
    message: str,
    link: str | None = None,
    campaign_post_id: str | None = None,
) -> str:
    """Post content to a Facebook Page.  Returns JSON string."""
    try:
        token, page_id = await _get_facebook_token(pool)
        if not page_id:
            return json.dumps({"error": "No Facebook Page ID configured in social_accounts.account_id"})

        post_data: dict[str, str] = {"message": message}
        if link:
            post_data["link"] = link

        result = await _meta_request("POST", f"/{page_id}/feed", token, data=post_data)

        post_id = result.get("id", "")
        posted = bool(post_id)
        post_url = f"https://www.facebook.com/{post_id}" if post_id else ""
        error_msg = result.get("error", {}).get("message") if not posted else None

        # Log to social_post_log
        from app.auth.social_oauth import log_social_post
        await log_social_post(
            pool,
            platform="facebook",
            content_preview=message,
            content_type="post",
            external_post_id=post_id,
            external_url=post_url,
            status="published" if posted else "failed",
            campaign_post_id=campaign_post_id,
            error_message=error_msg,
            metadata={"link": link, "page_id": page_id},
        )

        # Update campaign_posts if linked
        if campaign_post_id and posted:
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
            "posted": posted,
            "post_id": post_id,
            "post_url": post_url,
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "_meta": {
                "action": "posted",
                "platform": "facebook",
                "related_tools": ["get_meta_metrics", "list_meta_posts"],
            },
        })
    except Exception as exc:
        try:
            from app.auth.social_oauth import log_social_post
            await log_social_post(
                pool, platform="facebook", content_preview=message,
                status="failed", error_message=str(exc),
                campaign_post_id=campaign_post_id,
            )
        except Exception:
            pass
        return json.dumps({"error": f"Failed to post to Facebook: {exc}"})


async def _post_to_instagram_impl(
    pool: Any,
    caption: str,
    image_url: str,
    campaign_post_id: str | None = None,
) -> str:
    """Post an image to Instagram Business account.  Returns JSON string."""
    try:
        token, ig_user_id = await _get_instagram_token(pool)
        if not ig_user_id:
            return json.dumps({"error": "No Instagram user ID configured in social_accounts"})

        # Step 1: Create media container
        container_result = await _meta_request(
            "POST",
            f"/{ig_user_id}/media",
            token,
            data={
                "image_url": image_url,
                "caption": caption[:2200],
            },
        )

        creation_id = container_result.get("id")
        if not creation_id:
            error = container_result.get("error", {}).get("message", "Unknown error")
            from app.auth.social_oauth import log_social_post
            await log_social_post(
                pool, platform="instagram", content_preview=caption,
                status="failed", error_message=f"Container creation failed: {error}",
                campaign_post_id=campaign_post_id,
            )
            return json.dumps({"error": f"Instagram container creation failed: {error}"})

        # Step 2: Publish the container
        publish_result = await _meta_request(
            "POST",
            f"/{ig_user_id}/media_publish",
            token,
            data={"creation_id": creation_id},
        )

        post_id = publish_result.get("id", "")
        posted = bool(post_id)
        error_msg = publish_result.get("error", {}).get("message") if not posted else None

        from app.auth.social_oauth import log_social_post
        await log_social_post(
            pool,
            platform="instagram",
            content_preview=caption,
            content_type="image",
            external_post_id=post_id,
            status="published" if posted else "failed",
            campaign_post_id=campaign_post_id,
            error_message=error_msg,
            metadata={"image_url": image_url, "container_id": creation_id},
        )

        if campaign_post_id and posted:
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
            "posted": posted,
            "post_id": post_id,
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "_meta": {
                "action": "posted",
                "platform": "instagram",
                "related_tools": ["get_meta_metrics", "list_meta_posts"],
            },
        })
    except Exception as exc:
        try:
            from app.auth.social_oauth import log_social_post
            await log_social_post(
                pool, platform="instagram", content_preview=caption,
                status="failed", error_message=str(exc),
                campaign_post_id=campaign_post_id,
            )
        except Exception:
            pass
        return json.dumps({"error": f"Failed to post to Instagram: {exc}"})


async def _get_meta_metrics_impl(
    pool: Any,
    post_id: str,
    platform: str = "facebook",
) -> str:
    """Get engagement metrics for a Facebook or Instagram post.  Returns JSON string."""
    try:
        if platform == "instagram":
            token, _ = await _get_instagram_token(pool)
            result = await _meta_request(
                "GET",
                f"/{post_id}/insights",
                token,
                params={"metric": "impressions,reach,likes,comments,shares,saved"},
            )
            metrics: dict[str, int] = {}
            for entry in result.get("data", []):
                name = entry.get("name", "")
                values = entry.get("values", [{}])
                metrics[name] = values[0].get("value", 0) if values else 0

            return json.dumps({
                "post_id": post_id,
                "platform": "instagram",
                "likes": metrics.get("likes", 0),
                "comments": metrics.get("comments", 0),
                "shares": metrics.get("shares", 0),
                "saved": metrics.get("saved", 0),
                "reach": metrics.get("reach", 0),
                "impressions": metrics.get("impressions", 0),
                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
                "_meta": {"related_tools": ["list_meta_posts"]},
            })
        else:
            token, _ = await _get_facebook_token(pool)
            result = await _meta_request(
                "GET",
                f"/{post_id}",
                token,
                params={
                    "fields": "likes.summary(true),comments.summary(true),"
                    "shares,insights.metric(post_impressions,post_engaged_users)",
                },
            )

            likes = result.get("likes", {}).get("summary", {}).get("total_count", 0)
            comments = result.get("comments", {}).get("summary", {}).get("total_count", 0)
            shares = result.get("shares", {}).get("count", 0)

            impressions = 0
            reach = 0
            for insight in result.get("insights", {}).get("data", []):
                if insight.get("name") == "post_impressions":
                    impressions = insight.get("values", [{}])[0].get("value", 0)
                elif insight.get("name") == "post_engaged_users":
                    reach = insight.get("values", [{}])[0].get("value", 0)

            return json.dumps({
                "post_id": post_id,
                "platform": "facebook",
                "likes": likes,
                "comments": comments,
                "shares": shares,
                "reach": reach,
                "impressions": impressions,
                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
                "_meta": {"related_tools": ["list_meta_posts", "post_to_facebook"]},
            })
    except Exception as exc:
        return json.dumps({"error": f"Failed to get {platform} metrics: {exc}"})


async def _list_meta_posts_impl(
    pool: Any,
    platform: str = "facebook",
    limit: int = 10,
) -> str:
    """List recent posts from Facebook Page or Instagram account.  Returns JSON string."""
    try:
        count = min(limit, 100)

        if platform == "instagram":
            token, ig_user_id = await _get_instagram_token(pool)
            if not ig_user_id:
                return json.dumps({"error": "No Instagram user ID configured"})

            result = await _meta_request(
                "GET",
                f"/{ig_user_id}/media",
                token,
                params={
                    "fields": "id,caption,media_type,media_url,thumbnail_url,"
                    "timestamp,like_count,comments_count,permalink",
                    "limit": count,
                },
            )

            posts = []
            for item in result.get("data", []):
                posts.append({
                    "post_id": item.get("id", ""),
                    "caption": (item.get("caption") or "")[:200],
                    "media_type": item.get("media_type", ""),
                    "permalink": item.get("permalink", ""),
                    "created_time": item.get("timestamp", ""),
                    "likes": item.get("like_count", 0),
                    "comments": item.get("comments_count", 0),
                })

            return json.dumps({
                "posts": posts,
                "total": len(posts),
                "platform": "instagram",
                "_meta": {"related_tools": ["get_meta_metrics", "post_to_instagram"]},
            })
        else:
            token, page_id = await _get_facebook_token(pool)
            if not page_id:
                return json.dumps({"error": "No Facebook Page ID configured"})

            result = await _meta_request(
                "GET",
                f"/{page_id}/posts",
                token,
                params={
                    "fields": "id,message,created_time,type,permalink_url,"
                    "likes.summary(true),comments.summary(true),shares",
                    "limit": count,
                },
            )

            posts = []
            for item in result.get("data", []):
                posts.append({
                    "post_id": item.get("id", ""),
                    "message": (item.get("message") or "")[:200],
                    "type": item.get("type", ""),
                    "permalink": item.get("permalink_url", ""),
                    "created_time": item.get("created_time", ""),
                    "likes": item.get("likes", {}).get("summary", {}).get("total_count", 0),
                    "comments": item.get("comments", {}).get("summary", {}).get("total_count", 0),
                    "shares": item.get("shares", {}).get("count", 0),
                })

            return json.dumps({
                "posts": posts,
                "total": len(posts),
                "platform": "facebook",
                "_meta": {"related_tools": ["get_meta_metrics", "post_to_facebook"]},
            })
    except Exception as exc:
        return json.dumps({"error": f"Failed to list {platform} posts: {exc}"})


def register_tools(mcp: FastMCP, get_pool: Any) -> None:
    """Register Meta (Facebook + Instagram) tools on the MCP server."""

    @mcp.tool(
        description="Post content to a Facebook Page. "
        "message: The post text. "
        "link: Optional URL to attach as a link preview. "
        "campaign_post_id: Optional UUID to link to a campaign_posts record. "
        "Example: post_to_facebook(message='Check out our latest update!', link='https://example.com'). "
        "Returns: {posted: bool, post_id: string, post_url: string, timestamp: string, _meta}."
    )
    async def post_to_facebook(
        message: str,
        link: str | None = None,
        campaign_post_id: str | None = None,
    ) -> str:
        pool = get_pool()
        return await _post_to_facebook_impl(pool, message, link, campaign_post_id)

    @mcp.tool(
        description="Post content to Instagram Business account. "
        "Supports image posts (image_url required) and carousel posts. "
        "Instagram does not support text-only posts — an image_url is required. "
        "caption: The post caption (up to 2200 characters, 30 hashtags max). "
        "image_url: Public URL to the image (JPEG or PNG, must be publicly accessible). "
        "campaign_post_id: Optional UUID to link to a campaign_posts record. "
        "Example: post_to_instagram(caption='Loving the new AI tools!', image_url='https://example.com/img.jpg'). "
        "Returns: {posted: bool, post_id: string, timestamp: string, _meta}."
    )
    async def post_to_instagram(
        caption: str,
        image_url: str,
        campaign_post_id: str | None = None,
    ) -> str:
        pool = get_pool()
        return await _post_to_instagram_impl(pool, caption, image_url, campaign_post_id)

    @mcp.tool(
        description="Get engagement metrics for a Facebook or Instagram post. "
        "post_id: The platform post ID (e.g. '123456789_987654321' for Facebook, '17890000000000000' for Instagram). "
        "platform: 'facebook' or 'instagram'. Default: 'facebook'. "
        "Example: get_meta_metrics(post_id='123456789_987654321', platform='facebook'). "
        "Returns: {post_id, platform, likes, comments, shares, reach, impressions, _meta}."
    )
    async def get_meta_metrics(
        post_id: str,
        platform: str = "facebook",
    ) -> str:
        pool = get_pool()
        return await _get_meta_metrics_impl(pool, post_id, platform)

    @mcp.tool(
        description="List recent posts from a Facebook Page or Instagram Business account. "
        "platform: 'facebook' or 'instagram'. Default: 'facebook'. "
        "limit: Number of posts to return (default 10, max 100). "
        "Example: list_meta_posts(platform='instagram', limit=5). "
        "Returns: {posts: [{post_id, message/caption, created_time, type}], total: int, _meta}."
    )
    async def list_meta_posts(
        platform: str = "facebook",
        limit: int = 10,
    ) -> str:
        pool = get_pool()
        return await _list_meta_posts_impl(pool, platform, limit)
