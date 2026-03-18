"""Capture MCP tools for the AI OS Gateway.

Provides 3 tools for personal knowledge capture:
- capture_entry: Store journal entries or quick captures
- list_journals: Retrieve recent journal entries
- search_journals: Full-text search across journal content

Journals are stored in a dedicated table (personal, reflective, monthly-distilled).
Quick entries flow into knowledge_entries with source_type='quick_capture' and are
immediately searchable via the existing embedding pipeline.
"""

from __future__ import annotations

import json
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from fastmcp import FastMCP


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
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, (dict, list)):
                return parsed
        except (json.JSONDecodeError, TypeError, ValueError):
            pass
        return value
    if isinstance(value, dict):
        return {k: _serialize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialize(v) for v in value]
    return value


def _row_to_dict(record) -> dict[str, Any]:
    """Convert an asyncpg Record to a JSON-safe dict."""
    return {k: _serialize(v) for k, v in dict(record).items()}


def _auto_title(content: str, max_len: int = 60) -> str:
    """Generate a short title from the first line/sentence of content."""
    first_line = content.split("\n")[0].strip()
    # Trim to sentence boundary or max_len
    if len(first_line) <= max_len:
        return first_line
    # Try to cut at last space before max_len
    cut = first_line[:max_len].rfind(" ")
    if cut > 20:
        return first_line[:cut] + "..."
    return first_line[:max_len] + "..."


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register all Capture tools on the given FastMCP instance."""

    @mcp.tool(description=(
        "Capture a journal entry or quick knowledge entry. "
        "type='journal': stores in journals table (personal, reflective). "
        "type='quick': stores in knowledge_entries with source_type='quick_capture' (immediately searchable). "
        "For journals, optionally include mood (text) and energy_level (1-5). "
        "For quick entries, optionally specify capture_type: idea, epiphany, memory_recall, observation. "
        "domain: optional life_domains slug to associate the entry with a domain. "
        "tags: optional list of tags. urgency: low/medium/high (quick only). "
        "linked_task_ids: optional list of task UUIDs to link (quick only)."
    ))
    async def capture_entry(
        type: str,
        content: str,
        mood: str | None = None,
        energy_level: int | None = None,
        capture_type: str | None = None,
        domain: str | None = None,
        tags: list[str] | None = None,
        urgency: str | None = None,
        linked_task_ids: list[str] | None = None,
    ) -> str:
        if type not in ("journal", "quick"):
            return json.dumps({"error": "type must be 'journal' or 'quick'"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                # Resolve domain slug to domain_id if provided
                domain_id = None
                if domain:
                    row = await conn.fetchrow(
                        "SELECT id FROM life_domains WHERE slug = $1", domain
                    )
                    if row:
                        domain_id = row["id"]

                if type == "journal":
                    # Validate energy_level range
                    if energy_level is not None and not (1 <= energy_level <= 5):
                        return json.dumps({"error": "energy_level must be between 1 and 5"})

                    record = await conn.fetchrow(
                        "INSERT INTO journals (content, mood, energy_level, domain_id, tags, metadata) "
                        "VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, word_count",
                        content,
                        mood,
                        energy_level,
                        domain_id,
                        tags or [],
                        json.dumps({"source_interface": "mcp"}),
                    )
                    result = _row_to_dict(record)
                    return json.dumps({
                        "type": "journal",
                        "id": result["id"],
                        "created_at": result["created_at"],
                        "word_count": result["word_count"],
                        "mood": mood,
                        "energy_level": energy_level,
                    })

                else:  # type == "quick"
                    # Validate capture_type
                    valid_capture_types = ("idea", "epiphany", "memory_recall", "observation")
                    resolved_capture_type = capture_type if capture_type in valid_capture_types else "observation"

                    title = _auto_title(content)
                    entry_tags = list(tags or []) + ["quick_capture"]
                    if resolved_capture_type != "observation":
                        entry_tags.append(resolved_capture_type)

                    metadata = {
                        "capture_type": resolved_capture_type,
                        "urgency": urgency or "low",
                        "linked_tasks": linked_task_ids or [],
                        "source_interface": "mcp",
                    }

                    record = await conn.fetchrow(
                        "INSERT INTO knowledge_entries "
                        "(title, content, domain, source_type, confidence_score, tags, metadata) "
                        "VALUES ($1, $2, $3, 'quick_capture', 0.5, $4, $5) "
                        "RETURNING id, title, created_at",
                        title,
                        content,
                        domain or "personal",
                        entry_tags,
                        json.dumps(metadata),
                    )
                    result = _row_to_dict(record)
                    return json.dumps({
                        "type": "quick",
                        "id": result["id"],
                        "title": result["title"],
                        "created_at": result["created_at"],
                        "capture_type": resolved_capture_type,
                    })

        except Exception as exc:
            return json.dumps({"error": f"Failed to capture entry: {exc}"})

    @mcp.tool(description=(
        "List recent journal entries. Returns entries with content preview, mood, energy, "
        "word count, and domain. Filter by days_back (default 7), mood, or limit (default 20). "
        "Use for 'what did I journal about this week?' queries."
    ))
    async def list_journals(
        days_back: int = 7,
        mood: str | None = None,
        limit: int = 20,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                conditions = ["j.created_at >= $1"]
                params: list[Any] = [
                    datetime.now(timezone.utc) - timedelta(days=days_back)
                ]
                idx = 2

                if mood:
                    conditions.append(f"j.mood = ${idx}")
                    params.append(mood)
                    idx += 1

                where = " AND ".join(conditions)
                params.append(min(limit, 50))  # Cap at 50

                sql = (
                    f"SELECT j.id, "
                    f"LEFT(j.content, 200) AS content_preview, "
                    f"j.mood, j.energy_level, j.word_count, j.tags, "
                    f"j.is_embedded, j.distilled_at, j.created_at, "
                    f"d.name AS domain_name, d.slug AS domain_slug "
                    f"FROM journals j "
                    f"LEFT JOIN life_domains d ON j.domain_id = d.id "
                    f"WHERE {where} "
                    f"ORDER BY j.created_at DESC "
                    f"LIMIT ${idx}"
                )

                rows = await conn.fetch(sql, *params)
                entries = [_row_to_dict(r) for r in rows]

                # Get aggregate stats
                stats = await conn.fetchrow(
                    "SELECT COUNT(*) AS total, "
                    "COUNT(*) FILTER (WHERE distilled_at IS NULL) AS undistilled "
                    "FROM journals WHERE created_at >= $1",
                    params[0],
                )

                return json.dumps({
                    "entries": entries,
                    "count": len(entries),
                    "total_in_period": stats["total"] if stats else 0,
                    "undistilled": stats["undistilled"] if stats else 0,
                    "days_back": days_back,
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to list journals: {exc}"})

    @mcp.tool(description=(
        "Full-text search across journal content. Uses PostgreSQL tsvector for relevance-ranked results. "
        "Returns matching entries with relevance score and highlighted snippet. "
        "query: search terms. days_back: how far back to search (default 90). limit: max results (default 10). "
        "For semantic/historical search of processed journals, use search_knowledge with source_type='journal_entry' instead."
    ))
    async def search_journals(
        query: str,
        days_back: int = 90,
        limit: int = 10,
    ) -> str:
        if not query or not query.strip():
            return json.dumps({"error": "query must not be empty"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)

                sql = """
                    SELECT j.id,
                        ts_headline('english', j.content, plainto_tsquery('english', $1),
                            'StartSel=**, StopSel=**, MaxWords=40, MinWords=20') AS snippet,
                        ts_rank(to_tsvector('english', j.content), plainto_tsquery('english', $1)) AS relevance,
                        j.mood, j.energy_level, j.word_count, j.created_at,
                        d.name AS domain_name, d.slug AS domain_slug
                    FROM journals j
                    LEFT JOIN life_domains d ON j.domain_id = d.id
                    WHERE to_tsvector('english', j.content) @@ plainto_tsquery('english', $1)
                        AND j.created_at >= $2
                    ORDER BY relevance DESC, j.created_at DESC
                    LIMIT $3
                """

                rows = await conn.fetch(sql, query, cutoff, min(limit, 50))
                results = [_row_to_dict(r) for r in rows]

                return json.dumps({
                    "query": query,
                    "results": results,
                    "count": len(results),
                    "days_searched": days_back,
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to search journals: {exc}"})
