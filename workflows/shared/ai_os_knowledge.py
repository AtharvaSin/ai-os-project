"""Shared knowledge layer client for AI OS pipelines and services.

Provides semantic search (via match_knowledge() SQL function), graph traversal,
and convenience methods for common queries. Designed for use by Category B/C
services and the MCP gateway.

Requires an asyncpg connection pool.

Usage::

    import asyncpg
    from workflows.shared.ai_os_knowledge import KnowledgeClient

    pool = await asyncpg.create_pool(dsn="...")
    knowledge = KnowledgeClient(pool)

    results = await knowledge.semantic_search(
        "architecture decisions about data layer",
        domain="system",
    )
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

logger = logging.getLogger(__name__)


def _serialize(value: Any) -> Any:
    """Convert asyncpg-native types to JSON-safe Python types."""
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, dict):
        return {k: _serialize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialize(v) for v in value]
    return value


def _row_to_dict(record) -> dict[str, Any]:
    """Convert an asyncpg Record to a JSON-safe dict."""
    return {k: _serialize(v) for k, v in dict(record).items()}


class KnowledgeClient:
    """Client for AI OS knowledge layer operations.

    Provides semantic search (via match_knowledge() SQL function),
    graph traversal, and convenience methods for common queries.
    Requires an asyncpg connection pool.
    """

    def __init__(self, db_pool) -> None:
        self.db = db_pool
        self._openai_api_key: str | None = os.environ.get("OPENAI_API_KEY")

    async def semantic_search(
        self,
        query: str,
        domain: str | None = None,
        sub_domain: str | None = None,
        project_id: str | None = None,
        threshold: float = 0.7,
        limit: int = 10,
    ) -> list[dict]:
        """Semantic search via match_knowledge().

        Generates an embedding for the query text, then calls the
        ``match_knowledge()`` SQL function to find similar entries.

        Args:
            query: Natural language search query.
            domain: Filter by knowledge domain (system, project, personal).
            sub_domain: Filter by sub-domain (e.g. 'bharatvarsh', 'ai-os').
            project_id: Filter by project UUID.
            threshold: Minimum cosine similarity score (0.0-1.0).
            limit: Maximum number of results.

        Returns:
            List of dicts, each representing a matched knowledge entry with
            similarity score. Empty list if embedding generation fails.
        """
        embedding = await self._generate_embedding(query)
        if not embedding:
            return []

        async with self.db.acquire() as conn:
            results = await conn.fetch(
                "SELECT * FROM match_knowledge($1, $2, $3, $4::knowledge_domain, $5, $6)",
                embedding,
                threshold,
                limit,
                domain,
                sub_domain,
                project_id,
            )

        return [_row_to_dict(r) for r in results]

    async def traverse(
        self,
        entry_id: str,
        max_depth: int = 2,
        relationship_types: list[str] | None = None,
    ) -> list[dict]:
        """Graph traversal via traverse_knowledge().

        Args:
            entry_id: UUID of the starting knowledge entry.
            max_depth: Maximum traversal depth.
            relationship_types: Optional list of relationship types to follow.

        Returns:
            List of dicts representing connected entries with relationship metadata.
        """
        async with self.db.acquire() as conn:
            results = await conn.fetch(
                "SELECT * FROM traverse_knowledge($1, $2, $3)",
                entry_id,
                max_depth,
                relationship_types,
            )

        return [_row_to_dict(r) for r in results]

    async def get_latest_summary(
        self,
        project_slug: str | None = None,
        domain: str = "project",
    ) -> dict | None:
        """Get the most recent weekly summary for a project.

        Args:
            project_slug: Filter by project sub_domain slug.
            domain: Knowledge domain to search in.

        Returns:
            Dict with id, title, content, created_at or None if not found.
        """
        query = """
            SELECT id, title, content, created_at
            FROM knowledge_entries
            WHERE source_type = 'project_update'
            AND domain = $1::knowledge_domain
        """
        params: list[Any] = [domain]
        if project_slug:
            query += " AND sub_domain = $2"
            params.append(project_slug)
        query += " ORDER BY created_at DESC LIMIT 1"

        async with self.db.acquire() as conn:
            row = await conn.fetchrow(query, *params)

        return _row_to_dict(row) if row else None

    async def get_domain_stats(self, domain: str) -> dict | None:
        """Get latest snapshot stats for a domain.

        Args:
            domain: Knowledge domain (system, project, personal).

        Returns:
            Dict with snapshot stats or None if no snapshot exists.
        """
        async with self.db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT * FROM knowledge_snapshots
                WHERE domain = $1::knowledge_domain
                ORDER BY snapshot_date DESC LIMIT 1
                """,
                domain,
            )

        return _row_to_dict(row) if row else None

    async def get_personal_context(self, contact_name: str) -> list[dict]:
        """Get knowledge entries relevant to a contact.

        Useful for personalised messages (birthday wishes, follow-ups, etc.).

        Args:
            contact_name: Name of the person to search for.

        Returns:
            List of relevant knowledge entries from the personal domain.
        """
        return await self.semantic_search(
            query=f"relationship with {contact_name}",
            domain="personal",
            threshold=0.6,
            limit=5,
        )

    async def _generate_embedding(self, text: str) -> list[float] | None:
        """Generate embedding for a query string using OpenAI text-embedding-3-small.

        Returns:
            List of floats representing the embedding vector, or None on failure.
        """
        try:
            from openai import OpenAI

            api_key = self._openai_api_key or os.environ.get("OPENAI_API_KEY")
            if not api_key:
                logger.warning("OPENAI_API_KEY not configured — cannot generate embedding")
                return None

            client = OpenAI(api_key=api_key)
            response = client.embeddings.create(
                input=[text],
                model="text-embedding-3-small",
            )
            return response.data[0].embedding
        except Exception as e:
            logger.warning(f"Embedding generation failed: {e}")
            return None
