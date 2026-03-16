"""Collect contextual intelligence from the knowledge layer via semantic search."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

import pg8000

logger = logging.getLogger(__name__)

# Embedding model config
EMBEDDING_MODEL = "text-embedding-3-small"
SIMILARITY_THRESHOLD = 0.3


@dataclass
class KnowledgeItem:
    title: str
    content_snippet: str
    domain: str
    similarity: float


@dataclass
class KnowledgeSnapshot:
    project_updates: list[KnowledgeItem] = field(default_factory=list)
    pending_decisions: list[KnowledgeItem] = field(default_factory=list)
    recent_changes: list[KnowledgeItem] = field(default_factory=list)
    available: bool = True


def _generate_embedding(text: str) -> list[float] | None:
    """Generate embedding using OpenAI text-embedding-3-small."""
    try:
        import openai

        client = openai.OpenAI()
        response = client.embeddings.create(model=EMBEDDING_MODEL, input=text)
        return response.data[0].embedding
    except Exception as exc:
        logger.warning("Embedding generation failed: %s", exc)
        return None


def _search(
    conn: pg8000.Connection,
    query: str,
    domain: str | None = None,
    limit: int = 3,
) -> list[KnowledgeItem]:
    """Semantic search against knowledge_entries + knowledge_embeddings."""
    embedding = _generate_embedding(query)
    if embedding is None:
        return []

    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    cursor = conn.cursor()

    try:
        domain_filter = ""
        params: list[Any] = [embedding_str, SIMILARITY_THRESHOLD, limit]
        if domain:
            domain_filter = "AND ke.domain = %s"
            params = [embedding_str, SIMILARITY_THRESHOLD, domain, limit]

        sql = f"""
            SELECT
                ke.title,
                LEFT(ke.content, 200) AS content_snippet,
                COALESCE(ke.domain::text, 'general') AS domain,
                1 - (kemb.embedding <=> %s::vector) AS similarity
            FROM knowledge_embeddings kemb
            JOIN knowledge_entries ke ON ke.id = kemb.entry_id
            WHERE 1 - (kemb.embedding <=> %s::vector) > %s
            {domain_filter}
            ORDER BY similarity DESC
            LIMIT %s
        """

        if domain:
            cursor.execute(sql, (embedding_str, embedding_str, SIMILARITY_THRESHOLD, domain, limit))
        else:
            cursor.execute(sql, (embedding_str, embedding_str, SIMILARITY_THRESHOLD, limit))

        cols = [desc[0] for desc in cursor.description]
        results = []
        for row in cursor.fetchall():
            d = dict(zip(cols, row))
            results.append(
                KnowledgeItem(
                    title=d["title"],
                    content_snippet=d["content_snippet"],
                    domain=d["domain"],
                    similarity=float(d["similarity"]),
                )
            )
        return results
    except Exception as exc:
        logger.warning("Knowledge search failed for '%s': %s", query, exc)
        return []


def collect(conn: pg8000.Connection) -> KnowledgeSnapshot:
    """Collect knowledge context for the daily brief."""
    snapshot = KnowledgeSnapshot()

    try:
        # Check if knowledge layer has data
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM knowledge_embeddings")
        count = cursor.fetchone()[0]
        if count == 0:
            snapshot.available = False
            logger.info("Knowledge layer empty — skipping semantic search")
            return snapshot

        snapshot.project_updates = _search(
            conn, "weekly status update project progress", domain="project", limit=3
        )
        snapshot.pending_decisions = _search(
            conn, "important decisions pending unresolved", domain="project", limit=2
        )
        snapshot.recent_changes = _search(
            conn, "system changes deployment infrastructure", domain="system", limit=2
        )
    except Exception as exc:
        logger.error("Knowledge collector error: %s", exc)
        snapshot.available = False

    return snapshot
