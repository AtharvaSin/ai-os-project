"""Social Media Platform Registry — plug-and-play platform management.

Central registry that handles:
    - Platform discovery and listing
    - Alias resolution (e.g. 'ig' -> 'instagram', 'tw' -> 'twitter')
    - Capability queries (which platforms support video? threads?)
    - Unified posting (route to the correct platform adapter)
    - Cross-platform posting (fan out to multiple platforms at once)
    - Pre-flight content validation

Usage:
    from app.modules.social_registry import SocialRegistry
    SocialRegistry.register(MyAdapter(), aliases=['alias1'])
    result = await SocialRegistry.post(some_post, pool)
"""

from __future__ import annotations

import logging
from typing import Any

from .social_base import (
    PlatformCapabilities,
    SocialPlatformBase,
    SocialPost,
    SocialPostResult,
)

logger = logging.getLogger(__name__)


class SocialRegistry:
    """Central registry for all social media platform adapters.

    Class-level state is intentional — there is one registry per process,
    initialised once at startup via ``init_social_registry()``.
    """

    _platforms: dict[str, SocialPlatformBase] = {}
    _aliases: dict[str, str] = {}

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------
    @classmethod
    def register(
        cls,
        platform: SocialPlatformBase,
        aliases: list[str] | None = None,
    ) -> None:
        """Register a platform adapter.

        Args:
            platform: Adapter instance implementing SocialPlatformBase.
            aliases: Optional shorthand names (e.g. 'fb', 'ig', 'tw').
        """
        name = platform.platform_name.lower()
        cls._platforms[name] = platform
        if aliases:
            for alias in aliases:
                cls._aliases[alias.lower()] = name
        logger.info(
            "Registered social platform: %s (aliases: %s)", name, aliases or []
        )

    # ------------------------------------------------------------------
    # Lookup
    # ------------------------------------------------------------------
    @classmethod
    def get(cls, platform: str) -> SocialPlatformBase | None:
        """Get a platform adapter by canonical name or alias."""
        key = platform.lower()
        if key in cls._platforms:
            return cls._platforms[key]
        resolved = cls._aliases.get(key)
        if resolved:
            return cls._platforms.get(resolved)
        return None

    @classmethod
    def resolve(cls, name: str) -> str:
        """Resolve an alias to its canonical platform name.

        Returns the input unchanged if it is already canonical or unknown.
        """
        key = name.lower()
        if key in cls._platforms:
            return key
        return cls._aliases.get(key, key)

    # ------------------------------------------------------------------
    # Discovery
    # ------------------------------------------------------------------
    @classmethod
    def list_platforms(cls) -> list[dict[str, Any]]:
        """List all registered platforms with their full capability matrix."""
        result: list[dict[str, Any]] = []
        for name, platform in cls._platforms.items():
            caps = platform.capabilities
            result.append(
                {
                    "platform": name,
                    "max_text_length": caps.max_text_length,
                    "supports_images": caps.supports_images,
                    "supports_video": caps.supports_video,
                    "supports_links": caps.supports_links,
                    "supports_threads": caps.supports_threads,
                    "supports_stories": caps.supports_stories,
                    "supports_reels": caps.supports_reels,
                    "supports_carousels": caps.supports_carousels,
                    "supports_scheduling": caps.supports_scheduling,
                    "supports_metrics": caps.supports_metrics,
                    "requires_media": caps.requires_media,
                    "content_types": caps.supported_content_types,
                }
            )
        return result

    @classmethod
    def platforms_supporting(cls, capability: str) -> list[str]:
        """Find platforms whose ``PlatformCapabilities`` has *capability* set to True.

        Args:
            capability: Attribute name on PlatformCapabilities
                        (e.g. 'supports_video', 'supports_threads').

        Returns:
            List of canonical platform names that have the capability.
        """
        result: list[str] = []
        for name, platform in cls._platforms.items():
            caps = platform.capabilities
            if hasattr(caps, capability) and getattr(caps, capability):
                result.append(name)
        return result

    # ------------------------------------------------------------------
    # Posting
    # ------------------------------------------------------------------
    @classmethod
    async def post(cls, post: SocialPost, pool: Any) -> SocialPostResult:
        """Route a post to the correct platform adapter.

        Validates content first; returns a failure result if validation
        fails or the platform is unknown.
        """
        platform = cls.get(post.platform)
        if not platform:
            return SocialPostResult(
                success=False,
                platform=post.platform,
                error=(
                    f"Unknown platform: {post.platform}. "
                    f"Available: {list(cls._platforms.keys())}"
                ),
            )

        issues = await platform.validate_content(post)
        if issues:
            return SocialPostResult(
                success=False,
                platform=post.platform,
                error=f"Validation failed: {'; '.join(issues)}",
            )

        return await platform.post(post, pool)

    @classmethod
    async def cross_post(
        cls,
        post: SocialPost,
        platforms: list[str],
        pool: Any,
    ) -> list[SocialPostResult]:
        """Fan out a post to multiple platforms.

        Automatically truncates content per platform's max_text_length.

        Args:
            post: Template post (platform field is ignored).
            platforms: List of canonical platform names to target.
            pool: asyncpg connection pool.

        Returns:
            List of SocialPostResult — one per target platform.
        """
        results: list[SocialPostResult] = []

        for platform_name in platforms:
            platform_post = SocialPost(
                content=post.content,
                platform=platform_name,
                content_type=post.content_type,
                media_url=post.media_url,
                media_title=post.media_title,
                link=post.link,
                visibility=post.visibility,
                campaign_post_id=post.campaign_post_id,
                metadata=post.metadata.copy(),
            )

            # Auto-truncate for platform limits
            adapter = cls.get(platform_name)
            if adapter:
                max_len = adapter.capabilities.max_text_length
                if len(platform_post.content) > max_len:
                    platform_post.content = (
                        platform_post.content[: max_len - 3] + "..."
                    )

            result = await cls.post(platform_post, pool)
            results.append(result)

        return results

    # ------------------------------------------------------------------
    # Reset (useful for testing)
    # ------------------------------------------------------------------
    @classmethod
    def reset(cls) -> None:
        """Clear all registered platforms and aliases."""
        cls._platforms.clear()
        cls._aliases.clear()
