"""Platform adapters — bridge existing modules to the SocialPlatformBase interface.

Each adapter wraps an existing module (meta.py, x_twitter.py, linkedin.py)
and exposes it through the unified SocialPlatformBase interface.

Adding a new platform requires three steps:
    1. Create the API module (e.g. threads.py, youtube.py)
    2. Create an adapter class here implementing SocialPlatformBase
    3. Register it in init_social_registry()

The social_manager tools automatically pick it up — no other changes needed.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from .social_base import (
    PlatformCapabilities,
    SocialPlatformBase,
    SocialPost,
    SocialPostResult,
)
from .social_registry import SocialRegistry

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Facebook Adapter
# ---------------------------------------------------------------------------
class FacebookAdapter(SocialPlatformBase):
    """Adapter for Meta Facebook Page posting via meta.py."""

    def __init__(self, get_pool: Any) -> None:
        self._get_pool = get_pool

    @property
    def platform_name(self) -> str:
        return "facebook"

    @property
    def capabilities(self) -> PlatformCapabilities:
        return PlatformCapabilities(
            max_text_length=63206,
            supports_images=True,
            supports_video=True,
            supports_links=True,
            supports_threads=False,
            supports_stories=True,
            supports_reels=True,
            supports_carousels=False,
            supports_scheduling=True,
            supports_metrics=True,
            requires_media=False,
            supported_content_types=[
                "post", "image", "video", "story", "reel", "link",
            ],
        )

    async def post(self, post: SocialPost, pool: Any) -> SocialPostResult:
        from .meta import _post_to_facebook_impl

        try:
            result = await _post_to_facebook_impl(
                pool, post.content, post.link, post.campaign_post_id
            )
            data = json.loads(result)
            return SocialPostResult(
                success=data.get("posted", False),
                platform="facebook",
                post_id=data.get("post_id"),
                post_url=data.get("post_url"),
                error=data.get("error"),
                metadata=data.get("_meta", {}),
            )
        except Exception as exc:
            return SocialPostResult(
                success=False, platform="facebook", error=str(exc)
            )

    async def get_metrics(self, post_id: str, pool: Any) -> dict[str, Any]:
        from .meta import _get_meta_metrics_impl

        result = await _get_meta_metrics_impl(pool, post_id, "facebook")
        return json.loads(result)

    async def list_posts(self, limit: int, pool: Any) -> list[dict[str, Any]]:
        from .meta import _list_meta_posts_impl

        result = await _list_meta_posts_impl(pool, "facebook", limit)
        data = json.loads(result)
        return data.get("posts", [])


# ---------------------------------------------------------------------------
# Instagram Adapter
# ---------------------------------------------------------------------------
class InstagramAdapter(SocialPlatformBase):
    """Adapter for Meta Instagram posting via meta.py."""

    def __init__(self, get_pool: Any) -> None:
        self._get_pool = get_pool

    @property
    def platform_name(self) -> str:
        return "instagram"

    @property
    def capabilities(self) -> PlatformCapabilities:
        return PlatformCapabilities(
            max_text_length=2200,
            supports_images=True,
            supports_video=True,
            supports_links=False,
            supports_threads=False,
            supports_stories=True,
            supports_reels=True,
            supports_carousels=True,
            supports_scheduling=True,
            supports_metrics=True,
            requires_media=True,
            supported_content_types=[
                "image", "video", "carousel", "story", "reel",
            ],
        )

    async def post(self, post: SocialPost, pool: Any) -> SocialPostResult:
        from .meta import _post_to_instagram_impl

        try:
            result = await _post_to_instagram_impl(
                pool, post.content, post.media_url or "", post.campaign_post_id
            )
            data = json.loads(result)
            return SocialPostResult(
                success=data.get("posted", False),
                platform="instagram",
                post_id=data.get("post_id"),
                post_url=data.get("post_url"),
                error=data.get("error"),
                metadata=data.get("_meta", {}),
            )
        except Exception as exc:
            return SocialPostResult(
                success=False, platform="instagram", error=str(exc)
            )

    async def get_metrics(self, post_id: str, pool: Any) -> dict[str, Any]:
        from .meta import _get_meta_metrics_impl

        result = await _get_meta_metrics_impl(pool, post_id, "instagram")
        return json.loads(result)

    async def list_posts(self, limit: int, pool: Any) -> list[dict[str, Any]]:
        from .meta import _list_meta_posts_impl

        result = await _list_meta_posts_impl(pool, "instagram", limit)
        data = json.loads(result)
        return data.get("posts", [])


# ---------------------------------------------------------------------------
# Twitter/X Adapter
# ---------------------------------------------------------------------------
class TwitterAdapter(SocialPlatformBase):
    """Adapter for X/Twitter posting via x_twitter.py."""

    def __init__(self, get_pool: Any) -> None:
        self._get_pool = get_pool

    @property
    def platform_name(self) -> str:
        return "twitter"

    @property
    def capabilities(self) -> PlatformCapabilities:
        return PlatformCapabilities(
            max_text_length=280,
            supports_images=True,
            supports_video=True,
            supports_links=True,
            supports_threads=True,
            supports_stories=False,
            supports_reels=False,
            supports_carousels=False,
            supports_scheduling=False,
            supports_metrics=True,
            requires_media=False,
            supported_content_types=["post", "thread", "image"],
        )

    async def post(self, post: SocialPost, pool: Any) -> SocialPostResult:
        from .x_twitter import _post_tweet_impl

        try:
            result = await _post_tweet_impl(pool, post.content, post.reply_to)
            data = json.loads(result)
            return SocialPostResult(
                success="tweet_id" in data and "error" not in data,
                platform="twitter",
                post_id=data.get("tweet_id"),
                post_url=data.get("url"),
                error=data.get("error"),
                metadata=data.get("_meta", {}),
            )
        except Exception as exc:
            return SocialPostResult(
                success=False, platform="twitter", error=str(exc)
            )

    async def get_metrics(self, post_id: str, pool: Any) -> dict[str, Any]:
        return {
            "error": (
                "Use x_get_recent_tweets for metrics "
                "(bundled with tweet data)"
            )
        }

    async def list_posts(self, limit: int, pool: Any) -> list[dict[str, Any]]:
        from .x_twitter import _get_recent_tweets_impl

        result = await _get_recent_tweets_impl(limit)
        data = json.loads(result)
        return data.get("tweets", [])

    async def delete_post(self, post_id: str, pool: Any) -> bool:
        from .x_twitter import _delete_tweet_impl

        result = await _delete_tweet_impl(pool, post_id)
        data = json.loads(result)
        return data.get("deleted", False)


# ---------------------------------------------------------------------------
# LinkedIn Adapter
# ---------------------------------------------------------------------------
class LinkedInAdapter(SocialPlatformBase):
    """Adapter for LinkedIn posting via linkedin.py."""

    def __init__(self, get_pool: Any) -> None:
        self._get_pool = get_pool

    @property
    def platform_name(self) -> str:
        return "linkedin"

    @property
    def capabilities(self) -> PlatformCapabilities:
        return PlatformCapabilities(
            max_text_length=3000,
            supports_images=True,
            supports_video=True,
            supports_links=True,
            supports_threads=False,
            supports_stories=False,
            supports_reels=False,
            supports_carousels=True,
            supports_scheduling=True,
            supports_metrics=True,
            requires_media=False,
            supported_content_types=[
                "post", "article", "image", "video", "carousel",
            ],
        )

    async def post(self, post: SocialPost, pool: Any) -> SocialPostResult:
        from .linkedin import _post_to_linkedin_impl

        try:
            result = await _post_to_linkedin_impl(
                pool,
                post.content,
                post.visibility.upper(),
                post.media_url,
                post.media_title,
                post.campaign_post_id,
            )
            data = json.loads(result)
            return SocialPostResult(
                success=data.get("posted", False),
                platform="linkedin",
                post_id=data.get("post_id"),
                post_url=data.get("post_url"),
                error=data.get("error"),
                metadata=data.get("_meta", {}),
            )
        except Exception as exc:
            return SocialPostResult(
                success=False, platform="linkedin", error=str(exc)
            )

    async def get_metrics(self, post_id: str, pool: Any) -> dict[str, Any]:
        from .linkedin import _get_linkedin_metrics_impl

        result = await _get_linkedin_metrics_impl(pool, post_id)
        return json.loads(result)

    async def list_posts(self, limit: int, pool: Any) -> list[dict[str, Any]]:
        from .linkedin import _list_linkedin_posts_impl

        result = await _list_linkedin_posts_impl(pool, limit)
        data = json.loads(result)
        return data.get("posts", [])


# ---------------------------------------------------------------------------
# Stub Base — shared logic for platforms not yet implemented
# ---------------------------------------------------------------------------
class _StubAdapter(SocialPlatformBase):
    """Base class for stub adapters.  Subclasses only need to set
    _name, _caps, and _setup_hint.  All operations return a helpful
    "not yet configured" message."""

    _name: str
    _caps: PlatformCapabilities
    _setup_hint: str

    @property
    def platform_name(self) -> str:
        return self._name

    @property
    def capabilities(self) -> PlatformCapabilities:
        return self._caps

    async def post(self, post: SocialPost, pool: Any) -> SocialPostResult:
        return SocialPostResult(
            success=False, platform=self._name,
            error=f"{self._name.title()} integration not yet configured. {self._setup_hint}",
        )

    async def get_metrics(self, post_id: str, pool: Any) -> dict[str, Any]:
        return {"error": f"{self._name.title()} metrics not yet implemented"}

    async def list_posts(self, limit: int, pool: Any) -> list[dict[str, Any]]:
        return []


# ---------------------------------------------------------------------------
# Future Platform Stubs (ready for implementation)
# ---------------------------------------------------------------------------
class ThreadsAdapter(_StubAdapter):
    """Stub adapter for Meta Threads."""
    _name = "threads"
    _setup_hint = "Set up Threads API credentials first."
    _caps = PlatformCapabilities(
        max_text_length=500, supports_video=True, supports_threads=True,
        supports_carousels=True,
        supported_content_types=["post", "image", "video", "carousel", "thread"],
    )


class YouTubeAdapter(_StubAdapter):
    """Stub adapter for YouTube."""
    _name = "youtube"
    _setup_hint = "Set up YouTube Data API v3 credentials first."
    _caps = PlatformCapabilities(
        max_text_length=5000, supports_images=False, supports_video=True,
        supports_stories=True, supports_scheduling=True, requires_media=True,
        supported_content_types=["video", "short"],
    )


class BlueSkyAdapter(_StubAdapter):
    """Stub adapter for Bluesky (AT Protocol)."""
    _name = "bluesky"
    _setup_hint = "Set up AT Protocol credentials first."
    _caps = PlatformCapabilities(
        max_text_length=300, supports_video=True, supports_threads=True,
        supported_content_types=["post", "image", "thread"],
    )


class MastodonAdapter(_StubAdapter):
    """Stub adapter for Mastodon (ActivityPub)."""
    _name = "mastodon"
    _setup_hint = "Set MASTODON_INSTANCE_URL and MASTODON_ACCESS_TOKEN first."
    _caps = PlatformCapabilities(
        max_text_length=500, supports_video=True, supports_threads=True,
        supports_scheduling=True,
        supported_content_types=["post", "image", "video", "thread"],
    )


class TikTokAdapter(_StubAdapter):
    """Stub adapter for TikTok."""
    _name = "tiktok"
    _setup_hint = "Set up TikTok for Developers API credentials first."
    _caps = PlatformCapabilities(
        max_text_length=2200, supports_images=False, supports_video=True,
        supports_links=False, requires_media=True,
        supported_content_types=["video"],
    )


# ---------------------------------------------------------------------------
# Registry Initialization
# ---------------------------------------------------------------------------
def init_social_registry(get_pool: Any) -> None:
    """Initialize the social media platform registry with all adapters.

    Call this once during app startup (in main.py after module registration).

    Adding a new platform is as simple as:
        1. Create YourAdapter(SocialPlatformBase)
        2. Register it here with aliases
    """
    # Reset to avoid duplicate registrations on hot-reload
    SocialRegistry.reset()

    # Active platforms (backed by real API modules)
    SocialRegistry.register(
        FacebookAdapter(get_pool),
        aliases=["fb", "facebook_page", "meta_fb"],
    )
    SocialRegistry.register(
        InstagramAdapter(get_pool),
        aliases=["ig", "insta", "meta_ig"],
    )
    SocialRegistry.register(
        TwitterAdapter(get_pool),
        aliases=["x", "tw", "twitter_x"],
    )
    SocialRegistry.register(
        LinkedInAdapter(get_pool),
        aliases=["li", "linked_in"],
    )

    # Future platforms — registered as stubs so they show in list_platforms
    # but return helpful error messages when used
    SocialRegistry.register(
        ThreadsAdapter(),
        aliases=["meta_threads"],
    )
    SocialRegistry.register(
        YouTubeAdapter(),
        aliases=["yt"],
    )
    SocialRegistry.register(
        BlueSkyAdapter(),
        aliases=["bsky"],
    )
    SocialRegistry.register(
        MastodonAdapter(),
        aliases=["masto", "fediverse"],
    )
    SocialRegistry.register(
        TikTokAdapter(),
        aliases=["tt"],
    )

    platforms = SocialRegistry.list_platforms()
    logger.info(
        "Social registry initialized: %d platforms (%s)",
        len(platforms),
        ", ".join(p["platform"] for p in platforms),
    )
