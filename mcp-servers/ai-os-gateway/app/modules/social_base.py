"""Social Media Platform Base — abstract interface for all platform implementations.

Defines the standard contract that every social media platform adapter must
implement.  New platforms (Threads, YouTube, TikTok, Bluesky, Mastodon, etc.)
only need to subclass SocialPlatformBase and fill in the abstract methods.

Dataclasses:
    SocialPost           — unified post representation across platforms
    SocialPostResult     — unified result from a posting attempt
    PlatformCapabilities — declarative feature matrix for a platform

ABC:
    SocialPlatformBase   — abstract base with post / get_metrics / list_posts
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SocialPost:
    """Unified post representation across all platforms.

    Attributes:
        content: The text body of the post.
        platform: Canonical platform name (e.g. 'facebook', 'twitter').
        content_type: One of post, article, image, video, carousel, story,
                      thread, reel, short.
        media_url: Public URL to an image or video asset.
        media_title: Optional title for the attached media.
        link: Optional URL to include as a link preview.
        visibility: Audience scope — 'public' or 'connections' (LinkedIn).
        reply_to: Platform-specific ID to reply to (e.g. tweet_id).
        campaign_post_id: Optional UUID linking to campaign_posts table.
        metadata: Arbitrary extra data for platform-specific fields.
    """

    content: str
    platform: str
    content_type: str = "post"
    media_url: str | None = None
    media_title: str | None = None
    link: str | None = None
    visibility: str = "public"
    reply_to: str | None = None
    campaign_post_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class SocialPostResult:
    """Unified result from posting to any platform.

    Attributes:
        success: Whether the post was published successfully.
        platform: Canonical platform name.
        post_id: Platform-specific post identifier.
        post_url: Public URL of the published post.
        error: Error message if the post failed.
        metadata: Extra context returned by the platform adapter.
    """

    success: bool
    platform: str
    post_id: str | None = None
    post_url: str | None = None
    error: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class PlatformCapabilities:
    """Declarative feature matrix describing what a platform supports.

    Used by the registry for capability queries (e.g. "which platforms
    support video?") and by the validation layer to reject incompatible
    content before hitting the API.

    Attributes:
        max_text_length: Hard character limit for the text body.
        supports_images: Platform accepts image attachments.
        supports_video: Platform accepts video attachments.
        supports_links: Platform renders link previews.
        supports_threads: Platform supports multi-part threads.
        supports_stories: Platform has ephemeral stories.
        supports_reels: Platform supports short-form video (reels).
        supports_carousels: Platform supports multi-image carousels.
        supports_scheduling: Platform API supports scheduled publishing.
        supports_metrics: Platform exposes engagement metrics.
        requires_media: A media attachment is mandatory (e.g. Instagram).
        supported_content_types: List of valid content_type values.
    """

    max_text_length: int
    supports_images: bool = True
    supports_video: bool = False
    supports_links: bool = True
    supports_threads: bool = False
    supports_stories: bool = False
    supports_reels: bool = False
    supports_carousels: bool = False
    supports_scheduling: bool = False
    supports_metrics: bool = True
    requires_media: bool = False
    supported_content_types: list[str] = field(
        default_factory=lambda: ["post"]
    )


class SocialPlatformBase(ABC):
    """Abstract base class for all social media platform implementations.

    Subclasses must implement:
        platform_name  — canonical lowercase name (e.g. 'twitter')
        capabilities   — PlatformCapabilities instance
        post           — publish a SocialPost
        get_metrics    — retrieve engagement stats for a post
        list_posts     — list recent posts on the platform

    Optional overrides:
        delete_post      — delete a post (raises NotImplementedError by default)
        validate_content — pre-flight content checks (has a sensible default)
    """

    @property
    @abstractmethod
    def platform_name(self) -> str:
        """Canonical lowercase name (e.g. 'facebook', 'twitter')."""
        ...

    @property
    @abstractmethod
    def capabilities(self) -> PlatformCapabilities:
        """Declare what this platform supports."""
        ...

    @abstractmethod
    async def post(self, post: SocialPost, pool: Any) -> SocialPostResult:
        """Publish content to this platform.

        Args:
            post: Unified post object.
            pool: asyncpg connection pool.

        Returns:
            SocialPostResult with success/failure details.
        """
        ...

    @abstractmethod
    async def get_metrics(self, post_id: str, pool: Any) -> dict[str, Any]:
        """Retrieve engagement metrics for a published post.

        Args:
            post_id: Platform-specific post identifier.
            pool: asyncpg connection pool.

        Returns:
            Dict with platform-specific metric keys.
        """
        ...

    @abstractmethod
    async def list_posts(self, limit: int, pool: Any) -> list[dict[str, Any]]:
        """List recent posts on this platform.

        Args:
            limit: Maximum number of posts to return.
            pool: asyncpg connection pool.

        Returns:
            List of post dicts.
        """
        ...

    async def delete_post(self, post_id: str, pool: Any) -> bool:
        """Delete a post by ID.  Not all platforms support this.

        Args:
            post_id: Platform-specific post identifier.
            pool: asyncpg connection pool.

        Returns:
            True if deleted successfully.

        Raises:
            NotImplementedError: If the platform does not support deletion.
        """
        raise NotImplementedError(
            f"{self.platform_name} does not support post deletion"
        )

    async def validate_content(self, post: SocialPost) -> list[str]:
        """Validate content against platform constraints before posting.

        Args:
            post: The SocialPost to validate.

        Returns:
            List of human-readable issue strings.  Empty list means valid.
        """
        issues: list[str] = []
        caps = self.capabilities

        if len(post.content) > caps.max_text_length:
            issues.append(
                f"Content exceeds {self.platform_name} max length "
                f"({caps.max_text_length} chars, got {len(post.content)})"
            )
        if caps.requires_media and not post.media_url:
            issues.append(
                f"{self.platform_name} requires a media_url (image or video)"
            )
        if post.content_type not in caps.supported_content_types:
            issues.append(
                f"{self.platform_name} does not support content_type "
                f"'{post.content_type}'. Supported: "
                f"{', '.join(caps.supported_content_types)}"
            )
        return issues
