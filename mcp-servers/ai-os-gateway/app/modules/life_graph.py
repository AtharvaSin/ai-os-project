"""Life Graph MCP tools for the AI OS Gateway.

Provides 8 tools for querying and managing the Life Graph domain hierarchy.
Uses PostgreSQL ltree for fast hierarchical queries (ancestor/descendant).
Domains are organized as: Category → Numbered Domain (→ optional sub-domain).

Context types: Tasks (in tasks table), Objectives and Automations (in domain_context_items).
"""

from __future__ import annotations

import json
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
        # JSONB columns sometimes arrive as raw JSON strings — decode them
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


def _build_tree(rows: list[dict]) -> list[dict]:
    """Build nested tree from flat sorted rows using path depth."""
    nodes_by_id = {}
    roots = []

    for row in rows:
        node = dict(row)
        node["children"] = []
        nodes_by_id[node["id"]] = node

    for row in rows:
        node = nodes_by_id[row["id"]]
        parent_id = row.get("parent_id")
        if parent_id and parent_id in nodes_by_id:
            nodes_by_id[parent_id]["children"].append(node)
        else:
            roots.append(node)

    return roots


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register all Life Graph tools on the given FastMCP instance."""

    @mcp.tool(description=(
        "List life domains, optionally filtered by parent and status. "
        "Returns domain hierarchy with paths. Use parent_slug to scope to a subtree. "
        "status filters: 'active', 'dormant', 'archived'. "
        "include_children=True returns all descendants recursively."
    ))
    async def list_domains(
        parent_slug: str | None = None,
        status: str | None = None,
        include_children: bool = True,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                conditions = []
                params: list[Any] = []
                idx = 1

                if parent_slug:
                    if include_children:
                        conditions.append(
                            f"d.path <@ (SELECT path FROM life_domains WHERE slug = ${idx})"
                        )
                    else:
                        conditions.append(
                            f"d.parent_id = (SELECT id FROM life_domains WHERE slug = ${idx})"
                        )
                    params.append(parent_slug)
                    idx += 1

                if status:
                    conditions.append(f"d.status = ${idx}::domain_status")
                    params.append(status)
                    idx += 1

                where = "WHERE " + " AND ".join(conditions) if conditions else ""
                sql = (
                    f"SELECT d.*, "
                    f"(SELECT slug FROM life_domains p WHERE p.id = d.parent_id) AS parent_slug "
                    f"FROM life_domains d {where} "
                    f"ORDER BY d.path, d.sort_order"
                )

                rows = await conn.fetch(sql, *params)
                domains = [_row_to_dict(r) for r in rows]
                # Convert path from ltree to string
                for d in domains:
                    if d.get("path"):
                        d["path"] = str(d["path"])

                return json.dumps({"domains": domains, "count": len(domains)})
        except Exception as exc:
            return json.dumps({"error": f"Failed to list domains: {exc}"})

    @mcp.tool(description=(
        "Get the Life Graph hierarchy as a nested JSON tree. "
        "Includes active task/objective/automation counts per domain. "
        "If root_slug provided, returns subtree from that root."
    ))
    async def get_domain_tree(root_slug: str | None = None) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                if root_slug:
                    sql = """
                        SELECT d.*,
                            (SELECT slug FROM life_domains p WHERE p.id = d.parent_id) AS parent_slug,
                            (SELECT COUNT(*) FROM tasks t
                             WHERE t.domain_id = d.id AND t.status NOT IN ('done','cancelled'))::int AS active_tasks,
                            (SELECT COUNT(*) FROM domain_context_items ci
                             WHERE ci.domain_id = d.id AND ci.item_type = 'objective'
                             AND ci.status = 'active')::int AS active_objectives,
                            (SELECT COUNT(*) FROM domain_context_items ci
                             WHERE ci.domain_id = d.id AND ci.item_type = 'automation'
                             AND ci.status = 'active')::int AS active_automations
                        FROM life_domains d
                        WHERE d.path <@ (SELECT path FROM life_domains WHERE slug = $1)
                        ORDER BY d.path, d.sort_order
                    """
                    rows = await conn.fetch(sql, root_slug)
                else:
                    sql = """
                        SELECT d.*,
                            (SELECT slug FROM life_domains p WHERE p.id = d.parent_id) AS parent_slug,
                            (SELECT COUNT(*) FROM tasks t
                             WHERE t.domain_id = d.id AND t.status NOT IN ('done','cancelled'))::int AS active_tasks,
                            (SELECT COUNT(*) FROM domain_context_items ci
                             WHERE ci.domain_id = d.id AND ci.item_type = 'objective'
                             AND ci.status = 'active')::int AS active_objectives,
                            (SELECT COUNT(*) FROM domain_context_items ci
                             WHERE ci.domain_id = d.id AND ci.item_type = 'automation'
                             AND ci.status = 'active')::int AS active_automations
                        FROM life_domains d
                        ORDER BY d.path, d.sort_order
                    """
                    rows = await conn.fetch(sql)

                flat = [_row_to_dict(r) for r in rows]
                for d in flat:
                    if d.get("path"):
                        d["path"] = str(d["path"])

                tree = _build_tree(flat)
                return json.dumps({"tree": tree})
        except Exception as exc:
            return json.dumps({"error": f"Failed to get domain tree: {exc}"})

    @mcp.tool(description=(
        "Get all tasks under a domain, recursively including sub-domains. "
        "Uses ltree for fast hierarchical query. Returns tasks with domain names. "
        "Filter by status: todo, in_progress, blocked, done, cancelled. "
        "Filter by priority: low, medium, high, urgent."
    ))
    async def get_domain_tasks(
        domain_slug: str,
        status: str | None = None,
        priority: str | None = None,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                # Verify domain exists
                domain = await conn.fetchrow(
                    "SELECT path FROM life_domains WHERE slug = $1", domain_slug
                )
                if not domain:
                    return json.dumps({"error": f"Domain '{domain_slug}' not found"})

                conditions = [
                    "d.path <@ $1"
                ]
                params: list[Any] = [domain["path"]]
                idx = 2

                if status:
                    conditions.append(f"t.status = ${idx}::task_status")
                    params.append(status)
                    idx += 1

                if priority:
                    conditions.append(f"t.priority = ${idx}::task_priority")
                    params.append(priority)
                    idx += 1

                where = " AND ".join(conditions)
                sql = (
                    f"SELECT t.id, t.title, t.description, t.status::text, "
                    f"t.priority::text, t.due_date, t.assignee, t.completed_at, "
                    f"t.metadata, d.name AS domain_name, d.slug AS domain_slug, "
                    f"d.domain_number, p.name AS project_name, p.slug AS project_slug "
                    f"FROM tasks t "
                    f"JOIN life_domains d ON t.domain_id = d.id "
                    f"JOIN projects p ON t.project_id = p.id "
                    f"WHERE {where} "
                    f"ORDER BY t.priority DESC, t.due_date ASC NULLS LAST"
                )

                rows = await conn.fetch(sql, *params)
                tasks = [_row_to_dict(r) for r in rows]

                return json.dumps({
                    "domain": domain_slug,
                    "tasks": tasks,
                    "count": len(tasks),
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to get domain tasks: {exc}"})

    @mcp.tool(description=(
        "Get aggregate stats for a domain and all its children. "
        "Returns: total/active/completed/overdue tasks, objective count + avg progress, "
        "automation count, and latest health score if available."
    ))
    async def get_domain_summary(domain_slug: str) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                # Use the SQL utility function
                result = await conn.fetchval(
                    "SELECT get_domain_summary($1)", domain_slug
                )

                # Get latest health snapshot if available
                health = await conn.fetchrow(
                    "SELECT s.health_score, s.velocity_7d, s.days_since_activity, "
                    "s.snapshot_date "
                    "FROM domain_health_snapshots s "
                    "JOIN life_domains d ON s.domain_id = d.id "
                    "WHERE d.slug = $1 "
                    "ORDER BY s.snapshot_date DESC LIMIT 1",
                    domain_slug,
                )

                summary = json.loads(result) if isinstance(result, str) else result
                if health:
                    summary["latest_health"] = _row_to_dict(health)

                return json.dumps(summary)
        except Exception as exc:
            return json.dumps({"error": f"Failed to get domain summary: {exc}"})

    @mcp.tool(description=(
        "Create a new life domain in the hierarchy. "
        "The ltree path is auto-computed from parent_slug via database trigger. "
        "Slug must be unique and contain only lowercase letters, numbers, underscores."
    ))
    async def create_domain(
        name: str,
        slug: str,
        parent_slug: str | None = None,
        domain_number: str | None = None,
        description: str | None = None,
        status: str = "active",
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                parent_id = None
                if parent_slug:
                    parent = await conn.fetchrow(
                        "SELECT id FROM life_domains WHERE slug = $1", parent_slug
                    )
                    if not parent:
                        return json.dumps({"error": f"Parent domain '{parent_slug}' not found"})
                    parent_id = parent["id"]

                # Auto-compute sort_order
                sort_order = await conn.fetchval(
                    "SELECT COALESCE(MAX(sort_order), 0) + 1 FROM life_domains WHERE parent_id IS NOT DISTINCT FROM $1",
                    parent_id,
                )

                record = await conn.fetchrow(
                    "INSERT INTO life_domains (parent_id, slug, name, domain_number, "
                    "description, status, sort_order) "
                    "VALUES ($1, $2, $3, $4, $5, $6::domain_status, $7) RETURNING *",
                    parent_id, slug, name, domain_number,
                    description, status, sort_order,
                )

                result = _row_to_dict(record)
                if result.get("path"):
                    result["path"] = str(result["path"])

                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Failed to create domain: {exc}"})

    @mcp.tool(description=(
        "Update domain properties: name, status, priority_weight, description, "
        "color_code, icon. Status can be 'active', 'dormant', or 'archived'."
    ))
    async def update_domain(
        domain_slug: str,
        name: str | None = None,
        status: str | None = None,
        priority_weight: float | None = None,
        description: str | None = None,
        color_code: str | None = None,
        icon: str | None = None,
    ) -> str:
        pool = get_pool()
        try:
            updates: dict[str, Any] = {}
            if name is not None:
                updates["name"] = name
            if status is not None:
                updates["status"] = status
            if priority_weight is not None:
                updates["priority_weight"] = priority_weight
            if description is not None:
                updates["description"] = description
            if color_code is not None:
                updates["color_code"] = color_code
            if icon is not None:
                updates["icon"] = icon

            if not updates:
                return json.dumps({"error": "No fields to update"})

            async with pool.acquire() as conn:
                # Build dynamic UPDATE
                set_parts = []
                params: list[Any] = []
                idx = 1
                for col, val in updates.items():
                    if col == "status":
                        set_parts.append(f"{col} = ${idx}::domain_status")
                    else:
                        set_parts.append(f"{col} = ${idx}")
                    params.append(val)
                    idx += 1

                params.append(domain_slug)
                sql = (
                    f"UPDATE life_domains SET {', '.join(set_parts)} "
                    f"WHERE slug = ${idx} RETURNING *"
                )

                record = await conn.fetchrow(sql, *params)
                if not record:
                    return json.dumps({"error": f"Domain '{domain_slug}' not found"})

                result = _row_to_dict(record)
                if result.get("path"):
                    result["path"] = str(result["path"])

                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Failed to update domain: {exc}"})

    @mcp.tool(description=(
        "Add an objective or automation to a domain. "
        "item_type must be 'objective' or 'automation'. "
        "For automations, use description to include trigger/schedule info."
    ))
    async def add_context_item(
        domain_slug: str,
        item_type: str,
        title: str,
        description: str | None = None,
        priority: str = "medium",
        target_date: str | None = None,
    ) -> str:
        if item_type not in ("objective", "automation"):
            return json.dumps({"error": f"item_type must be 'objective' or 'automation', got '{item_type}'"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                domain = await conn.fetchrow(
                    "SELECT id FROM life_domains WHERE slug = $1", domain_slug
                )
                if not domain:
                    return json.dumps({"error": f"Domain '{domain_slug}' not found"})

                record = await conn.fetchrow(
                    "INSERT INTO domain_context_items "
                    "(domain_id, item_type, title, description, priority, target_date) "
                    "VALUES ($1, $2::context_item_type, $3, $4, $5::task_priority, $6::date) "
                    "RETURNING *",
                    domain["id"], item_type, title, description, priority, target_date,
                )

                return json.dumps(_row_to_dict(record))
        except Exception as exc:
            return json.dumps({"error": f"Failed to add context item: {exc}"})

    @mcp.tool(description=(
        "Mark an objective or automation as completed. "
        "Sets completed_at timestamp and status to 'completed'."
    ))
    async def complete_context_item(item_id: str) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                record = await conn.fetchrow(
                    "UPDATE domain_context_items SET status = 'completed', "
                    "completed_at = NOW(), progress_pct = 100 "
                    "WHERE id = $1::uuid RETURNING *",
                    item_id,
                )
                if not record:
                    return json.dumps({"error": f"Context item '{item_id}' not found"})

                return json.dumps(_row_to_dict(record))
        except Exception as exc:
            return json.dumps({"error": f"Failed to complete context item: {exc}"})
