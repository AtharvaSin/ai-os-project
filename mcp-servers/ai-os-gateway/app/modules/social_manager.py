"""Social Manager — unified cross-platform social media tools.

Provides 6 MCP tools:
    social_post            — Universal post dispatcher (routes to any registered platform)
    social_cross_post      — Post to multiple platforms at once
    social_list_platforms   — List all registered platforms and their capabilities
    social_validate_content — Check content against platform rules before posting
    social_list_accounts    — List all connected social accounts from DB
    social_account_health   — Check token health and expiry for all accounts

These tools sit on top of the platform-specific modules (linkedin.py, meta.py,
x_twitter.py, etc.) and delegate to them via the SocialRegistry.  Adding a
new platform does NOT require touching this file.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from fastmcp import FastMCP

from .social_base import SocialPost
from .social_registry import SocialRegistry

logger = logging.getLogger(__name__)


def register_tools(mcp: FastMCP, get_pool: Any) -> None:
    """Register unified social media management tools on the MCP server."""

    # ------------------------------------------------------------------
    # Tool 1: Universal Post Dispatcher
    # ------------------------------------------------------------------
    @mcp.tool(
        description=(
            "Universal social media post dispatcher. Routes content to any "
            "registered platform (linkedin, facebook, instagram, twitter, "
            "threads, youtube, bluesky, etc.). Validates content against "
            "platform rules before posting. "
            "platform: canonical name or alias (e.g. 'linkedin', 'fb', 'ig', "
            "'x', 'tw'). "
            "content: post text. "
            "content_type: 'post'|'article'|'image'|'video'|'thread'|"
            "'story'|'reel'|'carousel'. "
            "visibility: 'public'|'connections' (LinkedIn only). "
            "Returns: {success, platform, post_id, post_url, error, _meta}."
        )
    )
    async def social_post(
        platform: str,
        content: str,
        content_type: str = "post",
        media_url: str | None = None,
        media_title: str | None = None,
        link: str | None = None,
        visibility: str = "public",
        campaign_post_id: str | None = None,
    ) -> str:
        pool = get_pool()
        post = SocialPost(
            content=content,
            platform=SocialRegistry.resolve(platform),
            content_type=content_type,
            media_url=media_url,
            media_title=media_title,
            link=link,
            visibility=visibility,
            campaign_post_id=campaign_post_id,
        )
        result = await SocialRegistry.post(post, pool)
        return json.dumps(
            {
                "success": result.success,
                "platform": result.platform,
                "post_id": result.post_id,
                "post_url": result.post_url,
                "error": result.error,
                "_meta": {"routed_via": "social_manager", **result.metadata},
            }
        )

    # ------------------------------------------------------------------
    # Tool 2: Cross-Platform Post
    # ------------------------------------------------------------------
    @mcp.tool(
        description=(
            "Post content to multiple social media platforms at once. "
            "Automatically adapts content (truncates, etc.) per platform "
            "constraints. "
            "platforms: comma-separated list (e.g. 'facebook,instagram,"
            "twitter,linkedin'). "
            "Returns: {results: [{success, platform, post_id, post_url, "
            "error}], summary}."
        )
    )
    async def social_cross_post(
        platforms: str,
        content: str,
        content_type: str = "post",
        media_url: str | None = None,
        media_title: str | None = None,
        link: str | None = None,
        campaign_post_id: str | None = None,
    ) -> str:
        pool = get_pool()
        platform_list = [
            SocialRegistry.resolve(p.strip())
            for p in platforms.split(",")
            if p.strip()
        ]

        post = SocialPost(
            content=content,
            platform="",  # set per-platform by cross_post
            content_type=content_type,
            media_url=media_url,
            media_title=media_title,
            link=link,
            campaign_post_id=campaign_post_id,
        )

        results = await SocialRegistry.cross_post(post, platform_list, pool)

        succeeded = sum(1 for r in results if r.success)
        failed = len(results) - succeeded

        return json.dumps(
            {
                "results": [
                    {
                        "success": r.success,
                        "platform": r.platform,
                        "post_id": r.post_id,
                        "post_url": r.post_url,
                        "error": r.error,
                    }
                    for r in results
                ],
                "summary": {
                    "total": len(results),
                    "succeeded": succeeded,
                    "failed": failed,
                    "platforms_posted": [
                        r.platform for r in results if r.success
                    ],
                },
                "_meta": {"tool": "social_cross_post"},
            }
        )

    # ------------------------------------------------------------------
    # Tool 3: List Platforms
    # ------------------------------------------------------------------
    @mcp.tool(
        description=(
            "List all registered social media platforms and their capabilities. "
            "Shows what each platform supports (images, video, threads, "
            "stories, max length, etc.). Use this to understand what's "
            "available before posting. "
            "Returns: {platforms: [{platform, max_text_length, supports_*}], "
            "total}."
        )
    )
    async def social_list_platforms() -> str:
        platforms = SocialRegistry.list_platforms()
        return json.dumps(
            {
                "platforms": platforms,
                "total": len(platforms),
                "_meta": {"tool": "social_list_platforms"},
            }
        )

    # ------------------------------------------------------------------
    # Tool 4: Validate Content
    # ------------------------------------------------------------------
    @mcp.tool(
        description=(
            "Validate content against a platform's rules before posting. "
            "Checks text length, media requirements, content type support, "
            "etc. "
            "Returns: {valid, platform, issues, suggestions}."
        )
    )
    async def social_validate_content(
        platform: str,
        content: str,
        content_type: str = "post",
        media_url: str | None = None,
    ) -> str:
        resolved = SocialRegistry.resolve(platform)
        adapter = SocialRegistry.get(resolved)
        if not adapter:
            available = ", ".join(
                p["platform"] for p in SocialRegistry.list_platforms()
            )
            return json.dumps(
                {
                    "valid": False,
                    "platform": platform,
                    "issues": [f"Unknown platform: {platform}"],
                    "suggestions": [f"Available platforms: {available}"],
                }
            )

        post = SocialPost(
            content=content,
            platform=resolved,
            content_type=content_type,
            media_url=media_url,
        )
        issues = await adapter.validate_content(post)

        suggestions: list[str] = []
        caps = adapter.capabilities
        if len(content) > caps.max_text_length:
            suggestions.append(
                f"Shorten content to {caps.max_text_length} chars "
                f"(currently {len(content)})"
            )
        if caps.requires_media and not media_url:
            suggestions.append(
                f"Add media_url — {resolved} requires an image or video"
            )

        return json.dumps(
            {
                "valid": len(issues) == 0,
                "platform": resolved,
                "content_length": len(content),
                "max_length": caps.max_text_length,
                "issues": issues,
                "suggestions": suggestions,
                "_meta": {"tool": "social_validate_content"},
            }
        )

    # ------------------------------------------------------------------
    # Tool 5: List Accounts
    # ------------------------------------------------------------------
    @mcp.tool(
        description=(
            "List all connected social media accounts from the database. "
            "Shows platform, account name, active status, token expiry, "
            "and scopes. "
            "Returns: {accounts: [{platform, account_name, account_id, "
            "is_active, token_expires_at, scopes}], total}."
        )
    )
    async def social_list_accounts() -> str:
        pool = get_pool()
        if not pool:
            return json.dumps({"error": "Database not available"})

        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, platform, account_name, account_id, is_active, "
                "token_expires_at, scopes, metadata, created_at, updated_at "
                "FROM social_accounts ORDER BY platform"
            )

        now = datetime.now(timezone.utc)
        accounts: list[dict[str, Any]] = []
        for row in rows:
            expires = row["token_expires_at"]
            if not expires:
                token_status = "no_expiry"
            elif expires < now:
                token_status = "expired"
            elif (expires - now).days < 7:
                token_status = "expiring_soon"
            else:
                token_status = "valid"

            accounts.append(
                {
                    "id": str(row["id"]),
                    "platform": row["platform"],
                    "account_name": row["account_name"],
                    "account_id": row["account_id"],
                    "is_active": row["is_active"],
                    "token_expires_at": (
                        row["token_expires_at"].isoformat()
                        if row["token_expires_at"]
                        else None
                    ),
                    "token_status": token_status,
                    "scopes": row["scopes"],
                    "metadata": (
                        row["metadata"] if row["metadata"] else {}
                    ),
                    "updated_at": (
                        row["updated_at"].isoformat()
                        if row["updated_at"]
                        else None
                    ),
                }
            )

        return json.dumps(
            {
                "accounts": accounts,
                "total": len(accounts),
                "_meta": {"tool": "social_list_accounts"},
            }
        )

    # ------------------------------------------------------------------
    # Tool 6: Account Health
    # ------------------------------------------------------------------
    @mcp.tool(
        description=(
            "Check health of all social media account tokens. "
            "Reports which tokens are valid, expiring soon, or expired. "
            "Also checks if each platform's required secrets are configured. "
            "Returns: {accounts: [{platform, status, days_until_expiry}], "
            "warnings, healthy_count, total}."
        )
    )
    async def social_account_health() -> str:
        pool = get_pool()
        if not pool:
            return json.dumps({"error": "Database not available"})

        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT platform, account_name, account_id, is_active, "
                "token_expires_at, updated_at "
                "FROM social_accounts ORDER BY platform"
            )

        now = datetime.now(timezone.utc)
        accounts: list[dict[str, Any]] = []
        warnings: list[str] = []
        healthy = 0

        for row in rows:
            expires = row["token_expires_at"]
            if not expires:
                status = "permanent"
                days_left: int | None = None
                healthy += 1
            elif expires < now:
                status = "expired"
                days_left = -(now - expires).days
                warnings.append(
                    f"{row['platform']}/{row['account_name']} token expired "
                    f"{abs(days_left)} days ago"
                )
            elif (expires - now).days < 7:
                status = "expiring_soon"
                days_left = (expires - now).days
                warnings.append(
                    f"{row['platform']}/{row['account_name']} token expires "
                    f"in {days_left} days"
                )
                healthy += 1
            else:
                status = "healthy"
                days_left = (expires - now).days
                healthy += 1

            accounts.append(
                {
                    "platform": row["platform"],
                    "account_name": row["account_name"],
                    "is_active": row["is_active"],
                    "token_status": status,
                    "days_until_expiry": days_left,
                    "last_updated": (
                        row["updated_at"].isoformat()
                        if row["updated_at"]
                        else None
                    ),
                }
            )

        # Detect registered platforms without active DB accounts
        registered = [p["platform"] for p in SocialRegistry.list_platforms()]
        db_platforms = [r["platform"] for r in rows if r["is_active"]]
        unlinked = [p for p in registered if p not in db_platforms]
        if unlinked:
            warnings.append(
                f"Registered but no active DB account: {', '.join(unlinked)}"
            )

        return json.dumps(
            {
                "accounts": accounts,
                "warnings": warnings,
                "healthy_count": healthy,
                "total": len(accounts),
                "registered_platforms": registered,
                "_meta": {"tool": "social_account_health"},
            }
        )
