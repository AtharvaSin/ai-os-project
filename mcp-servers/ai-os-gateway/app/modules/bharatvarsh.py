"""Bharatvarsh Lore MCP tools for the AI OS Gateway.

Provides 8 tools for querying the Bharatvarsh worldbuilding database:
- query_lore: Flexible entity search with filtering by type, faction, disclosure, tags
- get_character: Full character profile with relationships
- get_entity: Any lore entity by slug with optional relationships
- search_lore: Full-text relevance-ranked search across all entities
- get_timeline: Chronological timeline events with era/year filtering
- get_chapter: Novel chapter metadata with linked characters and locations
- check_lore_consistency: Validate content text against the lore database
- get_writing_style: Retrieve exemplary prose fragments for voice matching
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import date, datetime
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


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register all Bharatvarsh lore tools on the given FastMCP instance."""

    # ── 1. query_lore ──────────────────────────────────────────────────

    @mcp.tool(description=(
        "Query Bharatvarsh lore entities with flexible filtering. "
        "entity_type: filter by type (character/faction/location/technology/concept/creature/event). "
        "faction: filter by faction name. "
        "disclosure: filter by classification (classified/declassified/redacted/public). "
        "search: text search in name, summary, and full_description. "
        "tags: filter by tags (entities must have ALL specified tags). "
        "limit: max results (default 20). "
        "Returns entities with id, type, name, slug, tagline, summary, disclosure, faction, tags."
    ))
    async def query_lore(
        entity_type: str | None = None,
        faction: str | None = None,
        disclosure: str | None = None,
        search: str | None = None,
        tags: list[str] | None = None,
        limit: int = 20,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                conditions: list[str] = ["is_active = true"]
                params: list[Any] = []
                idx = 1

                if entity_type:
                    conditions.append(f"entity_type = ${idx}::lore_entity_type")
                    params.append(entity_type)
                    idx += 1

                if faction:
                    conditions.append(f"faction ILIKE ${idx}")
                    params.append(f"%{faction}%")
                    idx += 1

                if disclosure:
                    conditions.append(f"disclosure = ${idx}::lore_disclosure")
                    params.append(disclosure)
                    idx += 1

                if search:
                    conditions.append(
                        f"to_tsvector('english', coalesce(name,'') || ' ' || "
                        f"coalesce(summary,'') || ' ' || coalesce(full_description,'')) "
                        f"@@ plainto_tsquery('english', ${idx})"
                    )
                    params.append(search)
                    idx += 1

                if tags:
                    conditions.append(f"tags @> ${idx}")
                    params.append(tags)
                    idx += 1

                where = " AND ".join(conditions)
                safe_limit = min(limit, 50)
                params.append(safe_limit)

                sql = (
                    f"SELECT id, entity_type, name, name_devanagari, slug, tagline, "
                    f"summary, disclosure, faction, tags, sort_order "
                    f"FROM lore_entities "
                    f"WHERE {where} "
                    f"ORDER BY sort_order ASC, name ASC "
                    f"LIMIT ${idx}"
                )

                rows = await conn.fetch(sql, *params)
                entities = [_row_to_dict(r) for r in rows]

                return json.dumps({
                    "entities": entities,
                    "count": len(entities),
                    "filters": {
                        "entity_type": entity_type,
                        "faction": faction,
                        "disclosure": disclosure,
                        "search": search,
                        "tags": tags,
                    },
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to query lore: {exc}"})

    # ── 2. get_character ───────────────────────────────────────────────

    @mcp.tool(description=(
        "Get a full Bharatvarsh character profile including all relationships. "
        "slug: the character's slug (e.g., 'kahaan-arshad', 'rudra-rathore'). "
        "Returns complete character data with visual_keys, metadata, and all relationships to other entities."
    ))
    async def get_character(slug: str) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                entity = await conn.fetchrow(
                    "SELECT id, entity_type, name, name_devanagari, slug, tagline, "
                    "summary, full_description, disclosure, faction, tags, "
                    "visual_keys, metadata, sort_order, created_at, updated_at "
                    "FROM lore_entities "
                    "WHERE slug = $1 AND entity_type = 'character' AND is_active = true",
                    slug,
                )

                if not entity:
                    return json.dumps({"error": f"Character not found: {slug}"})

                character = _row_to_dict(entity)
                entity_id = entity["id"]

                # Fetch all relationships (as source or target)
                rel_sql = """
                    SELECT r.id, r.relationship, r.description, r.strength, r.is_spoiler, r.metadata,
                        CASE WHEN r.source_entity_id = $1 THEN 'outgoing' ELSE 'incoming' END AS direction,
                        CASE WHEN r.source_entity_id = $1 THEN te.name ELSE se.name END AS related_entity,
                        CASE WHEN r.source_entity_id = $1 THEN te.slug ELSE se.slug END AS related_slug,
                        CASE WHEN r.source_entity_id = $1 THEN te.entity_type ELSE se.entity_type END AS related_type
                    FROM lore_relationships r
                    JOIN lore_entities se ON r.source_entity_id = se.id
                    JOIN lore_entities te ON r.target_entity_id = te.id
                    WHERE r.source_entity_id = $1 OR r.target_entity_id = $1
                    ORDER BY r.strength DESC NULLS LAST
                """
                rel_rows = await conn.fetch(rel_sql, entity_id)
                relationships = [_row_to_dict(r) for r in rel_rows]

                character["relationships"] = relationships
                return json.dumps(character)
        except Exception as exc:
            return json.dumps({"error": f"Failed to get character: {exc}"})

    # ── 3. get_entity ──────────────────────────────────────────────────

    @mcp.tool(description=(
        "Get any Bharatvarsh lore entity by slug with its relationships. "
        "Works for characters, factions, locations, technology, concepts. "
        "slug: the entity's unique slug. "
        "include_relationships: whether to fetch relationships (default true). "
        "Returns full entity data with optional relationship graph."
    ))
    async def get_entity(slug: str, include_relationships: bool = True) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                entity = await conn.fetchrow(
                    "SELECT id, entity_type, name, name_devanagari, slug, tagline, "
                    "summary, full_description, disclosure, faction, tags, "
                    "visual_keys, metadata, sort_order, created_at, updated_at "
                    "FROM lore_entities "
                    "WHERE slug = $1 AND is_active = true",
                    slug,
                )

                if not entity:
                    return json.dumps({"error": f"Entity not found: {slug}"})

                result = _row_to_dict(entity)

                if include_relationships:
                    entity_id = entity["id"]
                    rel_sql = """
                        SELECT r.id, r.relationship, r.description, r.strength,
                            r.is_spoiler, r.metadata,
                            CASE WHEN r.source_entity_id = $1 THEN 'outgoing' ELSE 'incoming' END AS direction,
                            CASE WHEN r.source_entity_id = $1 THEN te.name ELSE se.name END AS related_entity,
                            CASE WHEN r.source_entity_id = $1 THEN te.slug ELSE se.slug END AS related_slug,
                            CASE WHEN r.source_entity_id = $1 THEN te.entity_type ELSE se.entity_type END AS related_type
                        FROM lore_relationships r
                        JOIN lore_entities se ON r.source_entity_id = se.id
                        JOIN lore_entities te ON r.target_entity_id = te.id
                        WHERE r.source_entity_id = $1 OR r.target_entity_id = $1
                        ORDER BY r.strength DESC NULLS LAST
                    """
                    rel_rows = await conn.fetch(rel_sql, entity_id)
                    result["relationships"] = [_row_to_dict(r) for r in rel_rows]

                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Failed to get entity: {exc}"})

    # ── 4. search_lore ─────────────────────────────────────────────────

    @mcp.tool(description=(
        "Full-text search across all Bharatvarsh lore entities. "
        "Uses PostgreSQL tsvector for relevance-ranked results across name, summary, and full_description. "
        "query: search terms. limit: max results (default 10). "
        "Returns matching entities with relevance score and highlighted snippet."
    ))
    async def search_lore(query: str, limit: int = 10) -> str:
        if not query or not query.strip():
            return json.dumps({"error": "query must not be empty"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                safe_limit = min(limit, 50)

                sql = """
                    SELECT e.id, e.entity_type, e.name, e.slug, e.tagline, e.disclosure, e.faction, e.tags,
                        ts_headline('english',
                            coalesce(e.name,'') || ' — ' || coalesce(e.summary,''),
                            plainto_tsquery('english', $1),
                            'StartSel=**, StopSel=**, MaxWords=40, MinWords=20'
                        ) AS snippet,
                        ts_rank(
                            to_tsvector('english',
                                coalesce(e.name,'') || ' ' || coalesce(e.summary,'') || ' ' || coalesce(e.full_description,'')
                            ),
                            plainto_tsquery('english', $1)
                        ) AS relevance
                    FROM lore_entities e
                    WHERE e.is_active = true
                        AND to_tsvector('english',
                            coalesce(e.name,'') || ' ' || coalesce(e.summary,'') || ' ' || coalesce(e.full_description,'')
                        ) @@ plainto_tsquery('english', $1)
                    ORDER BY relevance DESC, e.sort_order ASC
                    LIMIT $2
                """

                rows = await conn.fetch(sql, query, safe_limit)
                results = [_row_to_dict(r) for r in rows]

                return json.dumps({
                    "query": query,
                    "results": results,
                    "count": len(results),
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to search lore: {exc}"})

    # ── 5. get_timeline ────────────────────────────────────────────────

    @mcp.tool(description=(
        "Get Bharatvarsh timeline events. "
        "era: filter by era name. "
        "year_from/year_to: filter by year range. "
        "limit: max results (default 50). "
        "Returns chronological events with year, era, title, description, significance."
    ))
    async def get_timeline(
        era: str | None = None,
        year_from: int | None = None,
        year_to: int | None = None,
        limit: int = 50,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                conditions: list[str] = []
                params: list[Any] = []
                idx = 1

                if era:
                    conditions.append(f"era ILIKE ${idx}")
                    params.append(f"%{era}%")
                    idx += 1

                if year_from is not None:
                    conditions.append(f"year >= ${idx}")
                    params.append(year_from)
                    idx += 1

                if year_to is not None:
                    conditions.append(f"year <= ${idx}")
                    params.append(year_to)
                    idx += 1

                where = (" WHERE " + " AND ".join(conditions)) if conditions else ""
                safe_limit = min(limit, 50)
                params.append(safe_limit)

                sql = (
                    f"SELECT id, year, date_label, era, title, description, "
                    f"significance, entities_involved, disclosure, sort_order, "
                    f"tags, metadata, created_at "
                    f"FROM lore_timeline"
                    f"{where} "
                    f"ORDER BY sort_order ASC, year ASC "
                    f"LIMIT ${idx}"
                )

                rows = await conn.fetch(sql, *params)
                events = [_row_to_dict(r) for r in rows]

                return json.dumps({
                    "events": events,
                    "count": len(events),
                    "filters": {
                        "era": era,
                        "year_from": year_from,
                        "year_to": year_to,
                    },
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to get timeline: {exc}"})

    # ── 6. get_chapter ─────────────────────────────────────────────────

    @mcp.tool(description=(
        "Get novel chapter metadata with linked character and location names. "
        "chapter_number: the chapter number. "
        "novel: novel name (default 'MahaBharatvarsh'). "
        "Returns chapter summary, POV character, locations, characters, plot threads, mood."
    ))
    async def get_chapter(chapter_number: int, novel: str = "MahaBharatvarsh") -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                chapter = await conn.fetchrow(
                    "SELECT c.id, c.novel, c.chapter_number, c.title, c.summary, "
                    "c.pov_character, c.location_ids, c.character_ids, "
                    "c.plot_threads, c.word_count, c.mood, c.tags, c.metadata, "
                    "c.created_at, c.updated_at, "
                    "pov.name AS pov_character_name, pov.slug AS pov_character_slug "
                    "FROM lore_chapters c "
                    "LEFT JOIN lore_entities pov ON c.pov_character = pov.id "
                    "WHERE c.chapter_number = $1 AND c.novel = $2",
                    chapter_number, novel,
                )

                if not chapter:
                    return json.dumps({
                        "error": f"Chapter {chapter_number} not found in {novel}"
                    })

                result = _row_to_dict(chapter)

                # Resolve character_ids to names
                char_ids = chapter["character_ids"]
                if char_ids:
                    char_rows = await conn.fetch(
                        "SELECT id, name, slug, entity_type "
                        "FROM lore_entities WHERE id = ANY($1::uuid[])",
                        char_ids,
                    )
                    result["characters"] = [_row_to_dict(r) for r in char_rows]

                # Resolve location_ids to names
                loc_ids = chapter["location_ids"]
                if loc_ids:
                    loc_rows = await conn.fetch(
                        "SELECT id, name, slug, entity_type "
                        "FROM lore_entities WHERE id = ANY($1::uuid[])",
                        loc_ids,
                    )
                    result["locations"] = [_row_to_dict(r) for r in loc_rows]

                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Failed to get chapter: {exc}"})

    # ── 7. check_lore_consistency ──────────────────────────────────────

    @mcp.tool(description=(
        "Check a piece of content text for lore consistency against the Bharatvarsh database. "
        "Extracts entity names and key terms from the text, then validates them against the lore DB. "
        "content: the text to check. "
        "Returns a report of found entities, potential issues (unknown terms, mismatched facts), and suggestions. "
        "Use this before publishing any Bharatvarsh content to ensure lore accuracy."
    ))
    async def check_lore_consistency(content: str) -> str:
        if not content or not content.strip():
            return json.dumps({"error": "content must not be empty"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                # Fetch all active entity names and slugs
                entity_rows = await conn.fetch(
                    "SELECT id, name, name_devanagari, slug, entity_type, "
                    "faction, disclosure, tagline "
                    "FROM lore_entities WHERE is_active = true "
                    "ORDER BY length(name) DESC"
                )

                content_lower = content.lower()
                found_entities: list[dict[str, Any]] = []
                found_names: set[str] = set()

                for row in entity_rows:
                    name = row["name"]
                    name_dev = row["name_devanagari"]

                    # Check if entity name appears in content (case-insensitive, word boundary)
                    pattern = re.compile(
                        r'\b' + re.escape(name) + r'\b', re.IGNORECASE
                    )
                    if pattern.search(content):
                        found_names.add(name.lower())
                        entity_dict = _row_to_dict(row)
                        entity_dict["mentions"] = len(pattern.findall(content))
                        found_entities.append(entity_dict)
                        continue

                    # Also check Devanagari name
                    if name_dev and name_dev in content:
                        found_names.add(name.lower())
                        entity_dict = _row_to_dict(row)
                        entity_dict["mentions"] = content.count(name_dev)
                        entity_dict["matched_via"] = "devanagari"
                        found_entities.append(entity_dict)

                # Detect capitalized terms that look like proper nouns but aren't in DB
                # Match words that start with uppercase (2+ chars), not at sentence start
                proper_noun_pattern = re.compile(
                    r'(?<=[.!?]\s|^)(\w+)|(?<=\s)([A-Z][a-z]{2,})'
                )
                potential_terms: set[str] = set()
                for match in re.finditer(r'(?<=\s)[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})*', content):
                    term = match.group()
                    # Skip common English words
                    common_words = {
                        "The", "This", "That", "These", "Those", "What", "Where",
                        "When", "Who", "How", "Which", "There", "Here", "They",
                        "Their", "Then", "Than", "With", "From", "Into", "After",
                        "Before", "Between", "Under", "Over", "Through", "During",
                        "About", "Against", "Along", "Among", "Around", "Behind",
                        "Below", "Beyond", "But", "For", "And", "Not", "Yet",
                        "Also", "Just", "Only", "Still", "Even", "Because",
                        "However", "Although", "While", "Since", "Until", "Once",
                        "Chapter", "Part", "Section", "Volume",
                    }
                    if term not in common_words and term.lower() not in found_names:
                        potential_terms.add(term)

                # Build warnings
                warnings: list[str] = []

                # Check for classified entities being referenced in public content
                for ent in found_entities:
                    if ent.get("disclosure") == "classified":
                        warnings.append(
                            f"Entity '{ent['name']}' has disclosure='classified' — "
                            f"verify this content's classification level."
                        )
                    if ent.get("disclosure") == "redacted":
                        warnings.append(
                            f"Entity '{ent['name']}' is marked 'redacted' — "
                            f"details may be restricted."
                        )

                return json.dumps({
                    "found_entities": found_entities,
                    "found_count": len(found_entities),
                    "unknown_potential_terms": sorted(potential_terms),
                    "unknown_count": len(potential_terms),
                    "warnings": warnings,
                    "content_length": len(content),
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to check lore consistency: {exc}"})

    # ── 8. get_writing_style ───────────────────────────────────────────

    @mcp.tool(description=(
        "Get writing style fragments for voice matching in Bharatvarsh creative writing. "
        "fragment_type: filter by type (dialogue/description/action/internal_monologue/world_detail). "
        "character_slug: get fragments for a specific character. "
        "limit: max fragments (default 10). "
        "Returns exemplary prose passages with style notes for voice replication."
    ))
    async def get_writing_style(
        fragment_type: str | None = None,
        character_slug: str | None = None,
        limit: int = 10,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                conditions: list[str] = []
                params: list[Any] = []
                idx = 1

                if fragment_type:
                    conditions.append(f"wf.fragment_type = ${idx}::writing_fragment_type")
                    params.append(fragment_type)
                    idx += 1

                if character_slug:
                    # Resolve slug to entity id
                    char_row = await conn.fetchrow(
                        "SELECT id FROM lore_entities "
                        "WHERE slug = $1 AND entity_type = 'character' AND is_active = true",
                        character_slug,
                    )
                    if not char_row:
                        return json.dumps({"error": f"Character not found: {character_slug}"})
                    conditions.append(f"wf.character_id = ${idx}")
                    params.append(char_row["id"])
                    idx += 1

                where = (" WHERE " + " AND ".join(conditions)) if conditions else ""
                safe_limit = min(limit, 50)
                params.append(safe_limit)

                sql = (
                    f"SELECT wf.id, wf.fragment_type, wf.content, wf.style_notes, "
                    f"wf.tags, wf.metadata, wf.created_at, "
                    f"ch.name AS character_name, ch.slug AS character_slug, "
                    f"lc.chapter_number, lc.title AS chapter_title "
                    f"FROM writing_fragments wf "
                    f"LEFT JOIN lore_entities ch ON wf.character_id = ch.id "
                    f"LEFT JOIN lore_chapters lc ON wf.chapter_id = lc.id"
                    f"{where} "
                    f"ORDER BY wf.created_at DESC "
                    f"LIMIT ${idx}"
                )

                rows = await conn.fetch(sql, *params)
                fragments = [_row_to_dict(r) for r in rows]

                return json.dumps({
                    "fragments": fragments,
                    "count": len(fragments),
                    "filters": {
                        "fragment_type": fragment_type,
                        "character_slug": character_slug,
                    },
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to get writing style: {exc}"})
