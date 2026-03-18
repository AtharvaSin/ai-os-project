"""Contacts MCP tools for the AI OS Gateway.

Provides 8 tools for managing personal contacts:
- search_contacts: Full-text + tag + type search
- get_contact: Full profile with relationships + dates
- create_contact: Add contact with domain linkage
- update_contact: Update fields for progressive enrichment
- get_upcoming_dates: Birthdays/anniversaries in next N days
- get_contact_network: Contacts grouped by org/tag/domain/type
- add_relationship: Bidirectional link between contacts
- add_important_date: Birthday, anniversary, custom date
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


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register all Contacts tools on the given FastMCP instance."""

    @mcp.tool(description=(
        "Search contacts by name, company, tags, or contact type. "
        "Uses PostgreSQL full-text search for name/company/notes queries. "
        "Filter by tags (array overlap), contact_type ('professional', 'personal', 'both'), "
        "or domain_slug (Life Graph domain). Returns up to `limit` results (default 20). "
        "contact_type: 'professional'|'personal'|'both'. "
        "Example: search_contacts(query='Accenture', tags=['hr'], limit=10). "
        "Returns: {results: [{id, name, email, phone, company, title, contact_type, tags, location, ...}], count, total, _meta}."
    ))
    async def search_contacts(
        query: str | None = None,
        tags: list[str] | None = None,
        contact_type: str | None = None,
        domain_slug: str | None = None,
        limit: int = 20,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                conditions = ["c.is_active = TRUE"]
                params: list[Any] = []
                idx = 1

                if query:
                    conditions.append(
                        f"to_tsvector('english', coalesce(c.name,'') || ' ' || "
                        f"coalesce(c.company,'') || ' ' || coalesce(c.notes,'')) "
                        f"@@ plainto_tsquery('english', ${idx})"
                    )
                    params.append(query)
                    idx += 1

                if tags:
                    conditions.append(f"c.tags && ${idx}::text[]")
                    params.append(tags)
                    idx += 1

                if contact_type:
                    conditions.append(f"c.contact_type = ${idx}::contact_type")
                    params.append(contact_type)
                    idx += 1

                if domain_slug:
                    conditions.append(f"c.domain_slug = ${idx}")
                    params.append(domain_slug)
                    idx += 1

                where = " AND ".join(conditions)
                params.append(min(limit, 100))

                sql = (
                    f"SELECT c.id, c.name, c.email, c.phone, c.company, c.title, "
                    f"c.contact_type::text, c.tags, c.location, c.domain_slug, "
                    f"c.last_contacted_at, c.import_source "
                    f"FROM contacts c WHERE {where} "
                    f"ORDER BY c.name ASC LIMIT ${idx}"
                )

                rows = await conn.fetch(sql, *params)
                results = [_row_to_dict(r) for r in rows]

                # Get total matching count
                count_sql = f"SELECT COUNT(*) FROM contacts c WHERE {where}"
                count_row = await conn.fetchrow(count_sql, *params[:-1])
                total = count_row[0] if count_row else 0

                return json.dumps({
                    "results": results,
                    "count": len(results),
                    "total": total,
                    "_meta": {"related_tools": ["get_contact", "get_contact_network"]},
                })
        except Exception as exc:
            return json.dumps({"error": f"Search failed: {exc}"})

    @mcp.tool(description=(
        "Get a full contact profile by ID or name. Returns the contact with all fields, "
        "plus related relationships and important dates (joined). "
        "Use id (UUID) for exact lookup or name (text) for fuzzy name match. "
        "Fuzzy match uses case-insensitive LIKE on name. "
        "Example: get_contact(name='Rahul') or get_contact(id='a1b2c3d4-...'). "
        "Returns: {id, name, email, phone, company, ..., relationships: [{contact_a_name, contact_b_name, relationship_type, strength}], important_dates: [{date_type, date_value, label}], _meta}."
    ))
    async def get_contact(
        id: str | None = None,
        name: str | None = None,
    ) -> str:
        if not id and not name:
            return json.dumps({"error": "Provide either id or name"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                # Find the contact
                if id:
                    contact = await conn.fetchrow(
                        "SELECT * FROM contacts WHERE id = $1::uuid", id
                    )
                else:
                    # Fuzzy name match — case-insensitive LIKE
                    contact = await conn.fetchrow(
                        "SELECT * FROM contacts WHERE LOWER(name) LIKE $1 AND is_active = TRUE "
                        "ORDER BY name LIMIT 1",
                        f"%{name.lower()}%",
                    )

                if not contact:
                    return json.dumps({"error": f"Contact not found"})

                result = _row_to_dict(contact)
                contact_id = contact["id"]

                # Get relationships
                rels = await conn.fetch(
                    "SELECT cr.*, "
                    "c1.name AS contact_a_name, c2.name AS contact_b_name "
                    "FROM contact_relationships cr "
                    "JOIN contacts c1 ON cr.contact_id_a = c1.id "
                    "JOIN contacts c2 ON cr.contact_id_b = c2.id "
                    "WHERE cr.contact_id_a = $1 OR cr.contact_id_b = $1",
                    contact_id,
                )
                result["relationships"] = [_row_to_dict(r) for r in rels]

                # Get important dates
                dates = await conn.fetch(
                    "SELECT * FROM important_dates WHERE contact_id = $1 AND is_active = TRUE",
                    contact_id,
                )
                result["important_dates"] = [_row_to_dict(d) for d in dates]

                result["_meta"] = {"related_tools": ["update_contact", "add_relationship", "add_important_date", "get_upcoming_dates"]}
                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Get contact failed: {exc}"})

    @mcp.tool(description=(
        "Create a new contact. Required: name. Optional: email, phone, company, title, "
        "contact_type ('professional'|'personal'|'both'), tags (string array), notes, "
        "linkedin_url, twitter_handle, location, domain_slug (Life Graph domain). "
        "Returns the created contact. "
        "Example: create_contact(name='Jane Doe', company='Accenture', contact_type='professional', tags=['engineering', 'cloud'], location='Mumbai'). "
        "Returns: {id, name, email, phone, company, title, contact_type, tags, ..., _meta}."
    ))
    async def create_contact(
        name: str,
        email: str | None = None,
        phone: str | None = None,
        company: str | None = None,
        title: str | None = None,
        contact_type: str = "both",
        tags: list[str] | None = None,
        notes: str | None = None,
        linkedin_url: str | None = None,
        twitter_handle: str | None = None,
        location: str | None = None,
        domain_slug: str | None = None,
    ) -> str:
        valid_types = ("professional", "personal", "both")
        if contact_type not in valid_types:
            return json.dumps({"error": f"contact_type must be one of: {', '.join(valid_types)}"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                record = await conn.fetchrow(
                    "INSERT INTO contacts "
                    "(name, email, phone, company, title, contact_type, tags, "
                    " notes, linkedin_url, twitter_handle, location, "
                    " import_source, domain_slug) "
                    "VALUES ($1, $2, $3, $4, $5, $6::contact_type, $7, $8, $9, $10, $11, "
                    " 'manual', $12) "
                    "RETURNING *",
                    name, email, phone, company, title, contact_type,
                    tags or [], notes, linkedin_url, twitter_handle,
                    location, domain_slug,
                )
                result = _row_to_dict(record)
                result["_meta"] = {"action": "created", "related_tools": ["add_relationship", "add_important_date", "search_contacts"]}
                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Create contact failed: {exc}"})

    @mcp.tool(description=(
        "Update an existing contact by UUID. Provide the fields to update. "
        "Supports progressive enrichment — only specified fields are changed. "
        "contact_type: 'professional'|'personal'|'both'. last_contacted_at: ISO 8601 timestamp (e.g., '2026-03-18T10:00:00Z'). "
        "Returns the updated contact. "
        "Example: update_contact(id='a1b2c3d4-...', company='Google', title='Senior PM', last_contacted_at='2026-03-18T10:00:00Z'). "
        "Returns: {id, name, email, ..., (all updated fields), _meta}."
    ))
    async def update_contact(
        id: str,
        name: str | None = None,
        email: str | None = None,
        phone: str | None = None,
        company: str | None = None,
        title: str | None = None,
        contact_type: str | None = None,
        tags: list[str] | None = None,
        notes: str | None = None,
        linkedin_url: str | None = None,
        twitter_handle: str | None = None,
        location: str | None = None,
        domain_slug: str | None = None,
        last_contacted_at: str | None = None,
    ) -> str:
        # Build SET clause dynamically from provided fields
        updates: dict[str, Any] = {}
        if name is not None:
            updates["name"] = name
        if email is not None:
            updates["email"] = email
        if phone is not None:
            updates["phone"] = phone
        if company is not None:
            updates["company"] = company
        if title is not None:
            updates["title"] = title
        if contact_type is not None:
            updates["contact_type"] = contact_type
        if tags is not None:
            updates["tags"] = tags
        if notes is not None:
            updates["notes"] = notes
        if linkedin_url is not None:
            updates["linkedin_url"] = linkedin_url
        if twitter_handle is not None:
            updates["twitter_handle"] = twitter_handle
        if location is not None:
            updates["location"] = location
        if domain_slug is not None:
            updates["domain_slug"] = domain_slug
        if last_contacted_at is not None:
            updates["last_contacted_at"] = last_contacted_at

        if not updates:
            return json.dumps({"error": "No fields provided for update"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                set_parts = []
                params: list[Any] = []
                idx = 1
                for col, val in updates.items():
                    if col == "contact_type":
                        set_parts.append(f"{col} = ${idx}::contact_type")
                    elif col == "tags":
                        set_parts.append(f"{col} = ${idx}::text[]")
                    elif col == "last_contacted_at":
                        set_parts.append(f"{col} = ${idx}::timestamptz")
                    else:
                        set_parts.append(f"{col} = ${idx}")
                    params.append(val)
                    idx += 1

                params.append(id)
                sql = (
                    f"UPDATE contacts SET {', '.join(set_parts)} "
                    f"WHERE id = ${idx}::uuid RETURNING *"
                )

                record = await conn.fetchrow(sql, *params)
                if not record:
                    return json.dumps({"error": f"Contact '{id}' not found"})
                result = _row_to_dict(record)
                result["_meta"] = {"action": "updated", "related_tools": ["get_contact", "search_contacts"]}
                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Update contact failed: {exc}"})

    @mcp.tool(description=(
        "Get upcoming birthdays, anniversaries, and other important dates within the next N days. "
        "days_ahead: number of days to look ahead (default 7). "
        "Includes the contact name, date, type, and days until. "
        "Useful for morning briefs and reminder workflows. "
        "date_type values in results: 'birthday'|'anniversary'|'work_anniversary'|'custom'. "
        "Example: get_upcoming_dates(days_ahead=30). "
        "Returns: {dates: [{date_type, date_value, contact_name, contact_phone, days_until, is_today, ...}], count, days_ahead, today, _meta}."
    ))
    async def get_upcoming_dates(
        days_ahead: int = 7,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                # Use date arithmetic to find upcoming dates regardless of year
                # Compare month/day of the date with today through today+N
                today = date.today()
                end_date = today + timedelta(days=days_ahead)

                # Handle year-wrap (e.g., Dec 28 looking 7 days ahead crosses into Jan)
                rows = await conn.fetch(
                    """
                    SELECT
                        d.id, d.date_type::text, d.date_value, d.year_known,
                        d.label, d.reminder_days_before,
                        c.id AS contact_id, c.name AS contact_name,
                        c.phone AS contact_phone, c.email AS contact_email,
                        -- Calculate next occurrence
                        CASE
                            WHEN make_date(
                                EXTRACT(YEAR FROM CURRENT_DATE)::int,
                                EXTRACT(MONTH FROM d.date_value)::int,
                                EXTRACT(DAY FROM d.date_value)::int
                            ) >= CURRENT_DATE
                            THEN make_date(
                                EXTRACT(YEAR FROM CURRENT_DATE)::int,
                                EXTRACT(MONTH FROM d.date_value)::int,
                                EXTRACT(DAY FROM d.date_value)::int
                            )
                            ELSE make_date(
                                EXTRACT(YEAR FROM CURRENT_DATE)::int + 1,
                                EXTRACT(MONTH FROM d.date_value)::int,
                                EXTRACT(DAY FROM d.date_value)::int
                            )
                        END AS next_occurrence
                    FROM important_dates d
                    JOIN contacts c ON d.contact_id = c.id
                    WHERE d.is_active = TRUE AND c.is_active = TRUE
                    HAVING
                        CASE
                            WHEN make_date(
                                EXTRACT(YEAR FROM CURRENT_DATE)::int,
                                EXTRACT(MONTH FROM d.date_value)::int,
                                EXTRACT(DAY FROM d.date_value)::int
                            ) >= CURRENT_DATE
                            THEN make_date(
                                EXTRACT(YEAR FROM CURRENT_DATE)::int,
                                EXTRACT(MONTH FROM d.date_value)::int,
                                EXTRACT(DAY FROM d.date_value)::int
                            )
                            ELSE make_date(
                                EXTRACT(YEAR FROM CURRENT_DATE)::int + 1,
                                EXTRACT(MONTH FROM d.date_value)::int,
                                EXTRACT(DAY FROM d.date_value)::int
                            )
                        END <= $1
                    ORDER BY next_occurrence ASC
                    """,
                    end_date,
                )

                results = []
                for r in rows:
                    entry = _row_to_dict(r)
                    next_occ = r["next_occurrence"]
                    entry["days_until"] = (next_occ - today).days
                    entry["is_today"] = entry["days_until"] == 0
                    results.append(entry)

                return json.dumps({
                    "dates": results,
                    "count": len(results),
                    "days_ahead": days_ahead,
                    "today": today.isoformat(),
                    "_meta": {"related_tools": ["get_contact", "send_telegram_message"]},
                })
        except Exception as exc:
            return json.dumps({"error": f"Get upcoming dates failed: {exc}"})

    @mcp.tool(description=(
        "Get contact network grouped by a dimension. "
        "group_by: 'company' | 'tag' | 'domain' | 'type' | 'location'. "
        "Returns groups with counts and sample contacts. "
        "Useful for network health checks and 'who do I know at X?' queries. "
        "Example: get_contact_network(group_by='company'). "
        "Returns: {group_by, groups: [{group_key, count, members?}], group_count, total_contacts, _meta}."
    ))
    async def get_contact_network(
        group_by: str = "domain",
    ) -> str:
        valid_groups = ("company", "tag", "domain", "type", "location")
        if group_by not in valid_groups:
            return json.dumps({"error": f"group_by must be one of: {', '.join(valid_groups)}"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                if group_by == "company":
                    rows = await conn.fetch(
                        "SELECT company AS group_key, COUNT(*) AS count, "
                        "array_agg(name ORDER BY name) AS members "
                        "FROM contacts WHERE is_active = TRUE AND company IS NOT NULL "
                        "GROUP BY company ORDER BY count DESC LIMIT 50"
                    )
                elif group_by == "tag":
                    rows = await conn.fetch(
                        "SELECT unnest(tags) AS group_key, COUNT(*) AS count "
                        "FROM contacts WHERE is_active = TRUE AND array_length(tags, 1) > 0 "
                        "GROUP BY group_key ORDER BY count DESC LIMIT 50"
                    )
                elif group_by == "domain":
                    rows = await conn.fetch(
                        "SELECT COALESCE(domain_slug, '(unassigned)') AS group_key, "
                        "COUNT(*) AS count "
                        "FROM contacts WHERE is_active = TRUE "
                        "GROUP BY domain_slug ORDER BY count DESC"
                    )
                elif group_by == "type":
                    rows = await conn.fetch(
                        "SELECT contact_type::text AS group_key, COUNT(*) AS count "
                        "FROM contacts WHERE is_active = TRUE "
                        "GROUP BY contact_type ORDER BY count DESC"
                    )
                elif group_by == "location":
                    rows = await conn.fetch(
                        "SELECT COALESCE(location, '(unknown)') AS group_key, "
                        "COUNT(*) AS count "
                        "FROM contacts WHERE is_active = TRUE "
                        "GROUP BY location ORDER BY count DESC LIMIT 30"
                    )

                # Get total
                total = await conn.fetchrow(
                    "SELECT COUNT(*) FROM contacts WHERE is_active = TRUE"
                )

                results = [_row_to_dict(r) for r in rows]
                return json.dumps({
                    "group_by": group_by,
                    "groups": results,
                    "group_count": len(results),
                    "total_contacts": total[0] if total else 0,
                    "_meta": {"related_tools": ["search_contacts", "get_contact"]},
                })
        except Exception as exc:
            return json.dumps({"error": f"Get contact network failed: {exc}"})

    @mcp.tool(description=(
        "Add a bidirectional relationship between two contacts. "
        "contact_id_a, contact_id_b: UUIDs of the two contacts. "
        "relationship_type: 'colleague'|'mentor'|'mentee'|'friend'|'family'|"
        "'client'|'collaborator'|'investor'|'advisor'|'acquaintance'. "
        "Optional: description (text), strength (1-5, default 3). "
        "Example: add_relationship(contact_id_a='a1b2...', contact_id_b='c3d4...', relationship_type='colleague', strength=4, description='Worked together at Accenture'). "
        "Returns: {id, contact_id_a, contact_id_b, relationship_type, description, strength, ..., _meta}."
    ))
    async def add_relationship(
        contact_id_a: str,
        contact_id_b: str,
        relationship_type: str,
        description: str | None = None,
        strength: int = 3,
    ) -> str:
        valid_types = (
            "colleague", "mentor", "mentee", "friend", "family",
            "client", "collaborator", "investor", "advisor", "acquaintance",
        )
        if relationship_type not in valid_types:
            return json.dumps({"error": f"relationship_type must be one of: {', '.join(valid_types)}"})
        if not (1 <= strength <= 5):
            return json.dumps({"error": "strength must be between 1 and 5"})
        if contact_id_a == contact_id_b:
            return json.dumps({"error": "Cannot create self-relationship"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                record = await conn.fetchrow(
                    "INSERT INTO contact_relationships "
                    "(contact_id_a, contact_id_b, relationship_type, description, strength) "
                    "VALUES ($1::uuid, $2::uuid, $3::relationship_type, $4, $5) "
                    "ON CONFLICT (contact_id_a, contact_id_b, relationship_type) DO UPDATE "
                    "SET description = EXCLUDED.description, strength = EXCLUDED.strength "
                    "RETURNING *",
                    contact_id_a, contact_id_b, relationship_type,
                    description, strength,
                )
                result = _row_to_dict(record)
                result["_meta"] = {"action": "created", "related_tools": ["get_contact"]}
                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Add relationship failed: {exc}"})

    @mcp.tool(description=(
        "Add an important date (birthday, anniversary, etc.) for a contact. "
        "contact_id: UUID. date_type: 'birthday'|'anniversary'|'work_anniversary'|'custom'. "
        "date_value: ISO date string (YYYY-MM-DD). year_known: whether the year is real (default true). "
        "Optional: label (custom label), reminder_days_before (default 1). "
        "Example: add_important_date(contact_id='a1b2...', date_type='birthday', date_value='1995-06-15', year_known=True, reminder_days_before=3). "
        "Returns: {id, contact_id, date_type, date_value, year_known, label, reminder_days_before, ..., _meta}."
    ))
    async def add_important_date(
        contact_id: str,
        date_type: str,
        date_value: str,
        year_known: bool = True,
        label: str | None = None,
        reminder_days_before: int = 1,
    ) -> str:
        valid_types = ("birthday", "anniversary", "work_anniversary", "custom")
        if date_type not in valid_types:
            return json.dumps({"error": f"date_type must be one of: {', '.join(valid_types)}"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                record = await conn.fetchrow(
                    "INSERT INTO important_dates "
                    "(contact_id, date_type, date_value, year_known, label, reminder_days_before) "
                    "VALUES ($1::uuid, $2::date_type, $3::date, $4, $5, $6) "
                    "RETURNING *",
                    contact_id, date_type, date_value,
                    year_known, label, reminder_days_before,
                )
                result = _row_to_dict(record)
                result["_meta"] = {"action": "created", "related_tools": ["get_upcoming_dates", "get_contact"]}
                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Add important date failed: {exc}"})
