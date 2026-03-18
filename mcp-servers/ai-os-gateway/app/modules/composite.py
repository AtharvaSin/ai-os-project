"""Composite MCP tools for the AI OS Gateway.

Provides 3 composite tools that combine multiple queries into single tool calls,
reducing round-trips for common multi-table lookups:

- get_task_full: Task + project + domain + annotations in one call
- get_domain_overview: Domain summary + tasks + objectives + automations
- get_contact_brief: Contact profile + relationships + upcoming dates
"""

from __future__ import annotations

import json
import uuid
from datetime import date, datetime, timedelta
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
    """Register all Composite tools on the given FastMCP instance."""

    @mcp.tool(description=(
        "Get a complete task view with project, domain, and annotations in a single call. "
        "Combines data from tasks, projects, life_domains, and task_annotations tables. "
        "task_id: UUID (full or partial — matches with LIKE if < 36 chars). "
        "Returns: {task: {id, title, status, priority, due_date, project_name, project_slug, "
        "domain_name, domain_slug, ...}, annotations: [{content, created_at}], annotation_count, _meta}. "
        "Example: get_task_full(task_id='678ea4e5-84a9-4a3f-88f7-9d4aac1adf68')"
    ))
    async def get_task_full(task_id: str) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                # Support partial UUID matching
                if len(task_id) < 36:
                    row = await conn.fetchrow(
                        "SELECT t.*, p.name AS project_name, p.slug AS project_slug, "
                        "d.name AS domain_name, d.slug AS domain_slug "
                        "FROM tasks t "
                        "JOIN projects p ON t.project_id = p.id "
                        "LEFT JOIN life_domains d ON t.domain_id = d.id "
                        "WHERE t.id::text LIKE $1 || '%'",
                        task_id,
                    )
                else:
                    row = await conn.fetchrow(
                        "SELECT t.*, p.name AS project_name, p.slug AS project_slug, "
                        "d.name AS domain_name, d.slug AS domain_slug "
                        "FROM tasks t "
                        "JOIN projects p ON t.project_id = p.id "
                        "LEFT JOIN life_domains d ON t.domain_id = d.id "
                        "WHERE t.id = $1::uuid",
                        task_id,
                    )
                if not row:
                    return json.dumps({"error": f"Task not found: {task_id}"})

                task = _row_to_dict(row)
                full_task_id = str(row["id"])

                # Fetch annotations
                annotations = await conn.fetch(
                    "SELECT content, created_at FROM task_annotations "
                    "WHERE task_id = $1::uuid ORDER BY created_at DESC LIMIT 20",
                    full_task_id,
                )

                return json.dumps({
                    "task": task,
                    "annotations": [_row_to_dict(a) for a in annotations],
                    "annotation_count": len(annotations),
                    "_meta": {
                        "related_tools": [
                            "update_task",
                            "complete_task",
                            "send_telegram_template",
                        ],
                    },
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to get task: {exc}"})

    @mcp.tool(description=(
        "Get a comprehensive domain overview combining summary stats, active tasks, objectives, and automations. "
        "Replaces calling get_domain_summary + get_domain_tasks + list of context items separately. "
        "domain_slug: the domain's unique slug. "
        "Returns: {domain: {name, slug, path, status}, summary: {total, active, completed, overdue, health_score}, "
        "tasks: [{id, title, status, priority, due_date}], objectives: [{title, status, progress_pct}], "
        "automations: [{title, status, description}], _meta}. "
        "Example: get_domain_overview(domain_slug='003_career_professional')"
    ))
    async def get_domain_overview(domain_slug: str) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                # Get domain info
                domain = await conn.fetchrow(
                    "SELECT id, name, slug, path::text, status::text, description, domain_number "
                    "FROM life_domains WHERE slug = $1",
                    domain_slug,
                )
                if not domain:
                    return json.dumps({"error": f"Domain '{domain_slug}' not found"})

                domain_id = domain["id"]
                domain_path = domain["path"]

                # Get summary stats (tasks under this domain and children)
                stats = await conn.fetchrow(
                    "SELECT "
                    "COUNT(*) FILTER (WHERE t.status NOT IN ('done','cancelled')) AS active, "
                    "COUNT(*) FILTER (WHERE t.status = 'done') AS completed, "
                    "COUNT(*) FILTER ("
                    "  WHERE t.due_date < CURRENT_DATE "
                    "  AND t.status NOT IN ('done','cancelled')"
                    ") AS overdue, "
                    "COUNT(*) AS total "
                    "FROM tasks t JOIN life_domains d ON t.domain_id = d.id "
                    "WHERE d.path <@ $1::ltree",
                    domain_path,
                )

                # Get health score
                health = await conn.fetchrow(
                    "SELECT health_score, velocity_7d, snapshot_date "
                    "FROM domain_health_snapshots WHERE domain_id = $1 "
                    "ORDER BY snapshot_date DESC LIMIT 1",
                    domain_id,
                )

                # Get active tasks (limit 20)
                tasks = await conn.fetch(
                    "SELECT t.id, t.title, t.status::text, t.priority::text, "
                    "t.due_date, t.assignee "
                    "FROM tasks t JOIN life_domains d ON t.domain_id = d.id "
                    "WHERE d.path <@ $1::ltree "
                    "AND t.status NOT IN ('done','cancelled') "
                    "ORDER BY t.priority DESC, t.due_date ASC NULLS LAST "
                    "LIMIT 20",
                    domain_path,
                )

                # Get objectives
                objectives = await conn.fetch(
                    "SELECT id, title, status::text, progress_pct, target_date, description "
                    "FROM domain_context_items "
                    "WHERE domain_id = $1 AND item_type = 'objective' "
                    "AND status != 'cancelled' "
                    "ORDER BY status ASC, target_date ASC NULLS LAST",
                    domain_id,
                )

                # Get automations
                automations = await conn.fetch(
                    "SELECT id, title, status::text, description "
                    "FROM domain_context_items "
                    "WHERE domain_id = $1 AND item_type = 'automation' "
                    "AND status = 'active'",
                    domain_id,
                )

                summary: dict[str, Any] = {
                    "total": stats["total"] if stats else 0,
                    "active": stats["active"] if stats else 0,
                    "completed": stats["completed"] if stats else 0,
                    "overdue": stats["overdue"] if stats else 0,
                }
                if health:
                    summary["health_score"] = (
                        float(health["health_score"])
                        if health["health_score"] is not None
                        else None
                    )
                    summary["velocity_7d"] = (
                        float(health["velocity_7d"])
                        if health["velocity_7d"] is not None
                        else None
                    )

                return json.dumps({
                    "domain": _row_to_dict(domain),
                    "summary": summary,
                    "tasks": [_row_to_dict(t) for t in tasks],
                    "task_count": len(tasks),
                    "objectives": [_row_to_dict(o) for o in objectives],
                    "automations": [_row_to_dict(a) for a in automations],
                    "_meta": {
                        "related_tools": [
                            "create_task",
                            "add_context_item",
                            "update_domain",
                        ],
                    },
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to get domain overview: {exc}"})

    @mcp.tool(description=(
        "Get a contact brief combining profile, upcoming dates, and relationships in one call. "
        "Replaces calling get_contact + get_upcoming_dates separately. "
        "Use name (fuzzy match) or id (exact UUID). "
        "Returns: {contact: {name, email, phone, company, ...}, relationships: [{related_name, type, strength}], "
        "important_dates: [{date_type, date_value, days_until}], upcoming_count, _meta}. "
        "Example: get_contact_brief(name='Rahul') or get_contact_brief(id='a1b2c3d4-...')"
    ))
    async def get_contact_brief(
        name: str | None = None,
        id: str | None = None,
    ) -> str:
        if not id and not name:
            return json.dumps({"error": "Provide either id or name"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                if id:
                    contact = await conn.fetchrow(
                        "SELECT * FROM contacts WHERE id = $1::uuid", id
                    )
                else:
                    contact = await conn.fetchrow(
                        "SELECT * FROM contacts "
                        "WHERE LOWER(name) LIKE $1 AND is_active = TRUE "
                        "ORDER BY name LIMIT 1",
                        f"%{name.lower()}%",
                    )

                if not contact:
                    return json.dumps({"error": "Contact not found"})

                contact_id = contact["id"]
                result = _row_to_dict(contact)

                # Get relationships with resolved names
                rels = await conn.fetch(
                    "SELECT cr.relationship_type::text, cr.strength, cr.description, "
                    "CASE WHEN cr.contact_id_a = $1 "
                    "  THEN c2.name ELSE c1.name END AS related_name, "
                    "CASE WHEN cr.contact_id_a = $1 "
                    "  THEN c2.company ELSE c1.company END AS related_company "
                    "FROM contact_relationships cr "
                    "JOIN contacts c1 ON cr.contact_id_a = c1.id "
                    "JOIN contacts c2 ON cr.contact_id_b = c2.id "
                    "WHERE cr.contact_id_a = $1 OR cr.contact_id_b = $1 "
                    "ORDER BY cr.strength DESC",
                    contact_id,
                )
                result["relationships"] = [_row_to_dict(r) for r in rels]

                # Get upcoming dates (next 30 days)
                today = date.today()

                dates = await conn.fetch(
                    "SELECT d.date_type::text, d.date_value, d.label, "
                    "d.year_known, d.reminder_days_before "
                    "FROM important_dates d "
                    "WHERE d.contact_id = $1 AND d.is_active = TRUE",
                    contact_id,
                )

                upcoming: list[dict[str, Any]] = []
                for d in dates:
                    dv = d["date_value"]
                    try:
                        next_occ = dv.replace(year=today.year)
                        if next_occ < today:
                            next_occ = dv.replace(year=today.year + 1)
                        days_until = (next_occ - today).days
                        entry = _row_to_dict(d)
                        entry["days_until"] = days_until
                        entry["next_occurrence"] = next_occ.isoformat()
                        if days_until <= 30:
                            upcoming.append(entry)
                    except (ValueError, AttributeError):
                        pass

                upcoming.sort(key=lambda x: x["days_until"])
                result["upcoming_dates"] = upcoming
                result["upcoming_count"] = len(upcoming)

                result["_meta"] = {
                    "related_tools": [
                        "update_contact",
                        "add_relationship",
                        "add_important_date",
                        "send_telegram_message",
                    ],
                }

                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Failed to get contact brief: {exc}"})
