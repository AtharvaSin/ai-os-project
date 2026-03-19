"""Google Tasks integration for AI OS MCP Gateway.

Syncs tasks, objectives, and automations between Cloud SQL (source of truth)
and Google Tasks (notification delivery rail). Creates items in domain-specific
task lists organized by Life Graph domains (001-011).

Task list naming: "{domain_number} {domain_name}" (one per numbered domain).
Task list IDs stored in life_domains.metadata->>'google_task_list_id'.
Google Task IDs stored in tasks.metadata->>'google_task_id' and
domain_context_items.metadata->>'google_task_id'.
"""

from __future__ import annotations

import hashlib
import json
import logging
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from fastmcp import FastMCP

logger = logging.getLogger("google_tasks")

NOT_CONFIGURED_MSG = json.dumps({
    "error": "Google OAuth not configured",
    "detail": "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.",
})

PRIORITY_PREFIXES = {
    "urgent": "[URGENT] ",
    "high": "[HIGH] ",
}

CONTEXT_ITEM_PREFIXES = {
    "objective": "[OBJ] ",
    "automation": "[AUTO] ",
}

NOTES_DELIMITER = '--- YOUR NOTES BELOW ---'
NOTES_MARKER = 'YOUR NOTES BELOW'

# Legacy delimiter — kept for migration detection only
_OLD_DELIMITER = '── ✏️ YOUR NOTES BELOW ─────────────────────────'


def _build_notes_header(
    task_id: str,
    domain_name: str,
    priority: str,
    due_date: str | None,
    description: str | None = None,
    existing_notes: str | None = None,
) -> str:
    """Build system zone for Google Tasks notes field.

    Uses ASCII-only formatting to survive Google Tasks API round-trips.
    Preserves user zone from existing notes (below delimiter).
    Handles legacy tasks that have no delimiter by treating entire notes as user content.
    """
    lines = [
        f'[{priority.upper()}] {domain_name}',
        f'Due: {due_date or "not set"}  |  ID: {task_id[:8]}',
    ]
    if description and description.strip():
        brief = description.strip()[:120]
        if len(description.strip()) > 120:
            brief += '...'
        lines.append('')
        lines.append(brief)
    lines.append('')
    lines.append(NOTES_DELIMITER)

    header = '\n'.join(lines)

    # Preserve existing user zone
    user_zone = _extract_user_zone(existing_notes or '')

    # Legacy handling: if no delimiter found but notes exist,
    # treat entire existing notes as user content
    if not user_zone.strip() and existing_notes and existing_notes.strip():
        if not _has_delimiter(existing_notes):
            user_zone = existing_notes.strip()

    if user_zone.strip():
        return f'{header}\n{user_zone}'
    return header


def _has_delimiter(notes: str) -> bool:
    """Check if notes contain any form of the delimiter (current or legacy)."""
    if not notes:
        return False
    return NOTES_DELIMITER in notes or NOTES_MARKER in notes


def _extract_user_zone(notes: str) -> str:
    """Extract user-written content below the notes delimiter.

    Uses a two-tier matching strategy:
    1. Exact match on NOTES_DELIMITER (fast path)
    2. Fuzzy match on NOTES_MARKER text (handles Google Tasks normalization)

    Returns empty string if no delimiter/marker found.
    """
    if not notes:
        return ''

    # Tier 1: Exact delimiter match
    if NOTES_DELIMITER in notes:
        return notes.split(NOTES_DELIMITER, 1)[1].lstrip('\n')

    # Tier 2: Fuzzy match — find the marker text regardless of surrounding chars
    if NOTES_MARKER in notes:
        idx = notes.index(NOTES_MARKER) + len(NOTES_MARKER)
        rest = notes[idx:]
        # Skip past remaining characters on the delimiter line
        newline_pos = rest.find('\n')
        if newline_pos != -1:
            return rest[newline_pos + 1:].lstrip('\n')
        return ''

    return ''


def _parse_jsonb(value: Any) -> Any:
    """Ensure a JSONB value is a Python dict/list, not a raw JSON string.

    asyncpg may return JSONB columns as str when no custom codec is
    registered on the connection pool.  This helper normalises them.
    """
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value
    return value


def _serialize(value: Any) -> Any:
    """Convert DB-native types to JSON-safe Python types."""
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
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
    return {k: _serialize(v) for k, v in dict(record).items()}


def _prefixed_title(title: str, priority: str) -> str:
    """Add priority prefix to task title for Google Tasks display."""
    prefix = PRIORITY_PREFIXES.get(priority, "")
    return f"{prefix}{title}"


def _context_item_title(title: str, item_type: str) -> str:
    """Add context item type prefix for Google Tasks display."""
    prefix = CONTEXT_ITEM_PREFIXES.get(item_type, "")
    return f"{prefix}{title}"


def _rfc3339_date(d: str | None) -> str | None:
    """Convert a date string to RFC 3339 for Google Tasks API."""
    if not d:
        return None
    return f"{d}T00:00:00.000Z"


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register Google Tasks tools on the MCP server."""

    def _get_tasks_service():
        from app.auth.google_oauth import get_service
        return get_service("tasks", "v1")

    async def _ensure_domain_task_list(conn, domain_id: str, service) -> str | None:
        """Get or create a Google Task list for a life domain. Returns list ID."""
        from app.auth.google_oauth import run_google_api

        domain = await conn.fetchrow(
            "SELECT name, domain_number, metadata FROM life_domains WHERE id = $1::uuid",
            domain_id,
        )
        if not domain:
            return None

        metadata = _parse_jsonb(domain["metadata"]) or {}
        existing_list_id = metadata.get("google_task_list_id")

        if existing_list_id:
            try:
                await run_google_api(
                    service.tasklists().get(tasklist=existing_list_id).execute
                )
                return existing_list_id
            except Exception:
                pass  # List was deleted, create a new one

        # Create a new task list named by domain
        num = domain["domain_number"] or "000"
        list_name = f"{num} {domain['name']}"
        result = await run_google_api(
            service.tasklists().insert(body={"title": list_name}).execute
        )
        list_id = result["id"]

        # Store the list ID in domain metadata
        metadata["google_task_list_id"] = list_id
        await conn.execute(
            "UPDATE life_domains SET metadata = $1::jsonb WHERE id = $2::uuid",
            json.dumps(metadata), domain_id,
        )
        return list_id

    @mcp.tool(
        description="List tasks from the Cloud SQL database, optionally filtered by project or life domain. "
        "Returns tasks with their Google Tasks sync status. "
        "Task lists are organized per life domain (001-011). "
        "Use domain_slug to filter by life domain (recursively includes sub-domains). "
        "Returns: {tasks: [{id, title, status, priority, due_date, project_name, domain_name, google_synced, ...}], count, _meta}. "
        "Example: list_tasks(project_slug='ai-operating-system') or list_tasks(domain_slug='003_career_professional')"
    )
    async def list_tasks(
        project_slug: str | None = None,
        domain_slug: str | None = None,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                if domain_slug:
                    rows = await conn.fetch(
                        "SELECT t.*, p.slug AS project_slug, p.name AS project_name, "
                        "d.name AS domain_name, d.slug AS domain_slug, d.domain_number "
                        "FROM tasks t "
                        "JOIN projects p ON t.project_id = p.id "
                        "LEFT JOIN life_domains d ON t.domain_id = d.id "
                        "WHERE d.path <@ (SELECT path FROM life_domains WHERE slug = $1) "
                        "ORDER BY t.priority DESC, t.due_date ASC NULLS LAST",
                        domain_slug,
                    )
                elif project_slug:
                    project = await conn.fetchrow(
                        "SELECT id FROM projects WHERE slug = $1", project_slug
                    )
                    if not project:
                        return json.dumps({"error": f"Project '{project_slug}' not found"})
                    rows = await conn.fetch(
                        "SELECT t.*, p.slug AS project_slug, p.name AS project_name, "
                        "d.name AS domain_name, d.slug AS domain_slug, d.domain_number "
                        "FROM tasks t "
                        "JOIN projects p ON t.project_id = p.id "
                        "LEFT JOIN life_domains d ON t.domain_id = d.id "
                        "WHERE t.project_id = $1::uuid "
                        "ORDER BY t.priority DESC, t.due_date ASC NULLS LAST",
                        project["id"],
                    )
                else:
                    rows = await conn.fetch(
                        "SELECT t.*, p.slug AS project_slug, p.name AS project_name, "
                        "d.name AS domain_name, d.slug AS domain_slug, d.domain_number "
                        "FROM tasks t "
                        "JOIN projects p ON t.project_id = p.id "
                        "LEFT JOIN life_domains d ON t.domain_id = d.id "
                        "ORDER BY t.priority DESC, t.due_date ASC NULLS LAST"
                    )

                tasks = []
                for r in rows:
                    task = _row_to_dict(r)
                    meta = task.get("metadata") or {}
                    if isinstance(meta, str):
                        meta = json.loads(meta)
                    task["google_synced"] = bool(meta.get("google_task_id"))
                    tasks.append(task)

                return json.dumps({
                    "tasks": tasks,
                    "count": len(tasks),
                    "_meta": {"related_tools": ["get_task_annotations", "update_task", "complete_task"]},
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to list tasks: {exc}"})

    @mcp.tool(
        description="Create a new task in Cloud SQL and sync to Google Tasks. "
        "The task appears in the domain's Google Task list with a due date notification. "
        "Priority is shown as a title prefix: [URGENT], [HIGH] for high/urgent tasks. "
        "domain_slug is required to place the task in the correct domain task list. "
        "priority: 'low'|'medium'|'high'|'urgent'. "
        "Returns: {id, title, status, priority, due_date, google_task_id, google_synced, ..., _meta}. "
        "Example: create_task(title='Review Q2 metrics', domain_slug='003_career_professional', project_slug='ai-operating-system', priority='high', due_date='2026-03-25')"
    )
    async def create_task(
        title: str,
        domain_slug: str,
        due_date: str | None = None,
        project_slug: str | None = None,
        priority: str = "medium",
        description: str | None = None,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                # Resolve domain
                domain = await conn.fetchrow(
                    "SELECT id, name, domain_number, metadata FROM life_domains WHERE slug = $1",
                    domain_slug,
                )
                if not domain:
                    return json.dumps({"error": f"Domain '{domain_slug}' not found"})
                domain_id = str(domain["id"])
                domain_name = domain["name"]

                # Resolve project — use domain's default_project_id when no slug given
                if project_slug:
                    project = await conn.fetchrow(
                        "SELECT id, name FROM projects WHERE slug = $1", project_slug
                    )
                    if not project:
                        return json.dumps({"error": f"Project '{project_slug}' not found"})
                    project_id = str(project["id"])
                else:
                    dmeta = _parse_jsonb(domain["metadata"]) or {}
                    default_pid = dmeta.get("default_project_id")
                    if default_pid:
                        project_id = default_pid
                    else:
                        # Fallback: project linked to domain, then 'personal'
                        project = await conn.fetchrow(
                            "SELECT id FROM projects WHERE domain_id = $1::uuid",
                            domain["id"],
                        )
                        if not project:
                            project = await conn.fetchrow(
                                "SELECT id FROM projects WHERE slug = 'personal'"
                            )
                        if not project:
                            return json.dumps({"error": "No projects found in database"})
                        project_id = str(project["id"])

                # Insert task into Cloud SQL
                task_id = str(uuid.uuid4())
                metadata: dict[str, Any] = {}

                parsed_due = date.fromisoformat(due_date) if due_date else None
                record = await conn.fetchrow(
                    "INSERT INTO tasks (id, project_id, domain_id, title, description, status, "
                    "priority, due_date, metadata) "
                    "VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, 'todo'::task_status, "
                    "$6::task_priority, $7::date, $8::jsonb) RETURNING *",
                    task_id, project_id, domain_id, title, description,
                    priority, parsed_due, json.dumps(metadata),
                )

                # Sync to Google Tasks (domain-based list)
                service = _get_tasks_service()
                google_task_id = None

                if service:
                    try:
                        from app.auth.google_oauth import run_google_api

                        list_id = await _ensure_domain_task_list(conn, domain_id, service)
                        if list_id:
                            google_body: dict[str, Any] = {
                                "title": _prefixed_title(title, priority),
                                "notes": _build_notes_header(
                                    task_id=task_id,
                                    domain_name=domain_name,
                                    priority=priority,
                                    due_date=due_date,
                                    description=description,
                                ),
                                "status": "needsAction",
                            }
                            if due_date:
                                google_body["due"] = _rfc3339_date(due_date)

                            result = await run_google_api(
                                service.tasks().insert(
                                    tasklist=list_id, body=google_body
                                ).execute
                            )
                            google_task_id = result["id"]

                            metadata["google_task_id"] = google_task_id
                            metadata["google_task_list_id"] = list_id
                            await conn.execute(
                                "UPDATE tasks SET metadata = $1::jsonb WHERE id = $2::uuid",
                                json.dumps(metadata), task_id,
                            )
                    except Exception as e:
                        metadata["google_sync_error"] = str(e)
                        await conn.execute(
                            "UPDATE tasks SET metadata = $1::jsonb WHERE id = $2::uuid",
                            json.dumps(metadata), task_id,
                        )

                task_dict = _row_to_dict(record)
                task_dict["google_task_id"] = google_task_id
                task_dict["google_synced"] = google_task_id is not None
                task_dict["_meta"] = {"action": "created", "related_tools": ["send_telegram_template", "get_task_annotations"]}

                return json.dumps(task_dict)
        except Exception as exc:
            return json.dumps({"error": f"Failed to create task: {exc}"})

    @mcp.tool(
        description="Update an existing task in Cloud SQL and sync changes to Google Tasks. "
        "Updates title, due_date, description, priority, status, or domain_slug. "
        "If priority changes to urgent/high, the Google Task title prefix is updated. "
        "If domain_slug is provided, the task is moved to the new domain's Google Task list "
        "(delete from old list + create in new list, preserving all data and user annotations). "
        "status: 'todo'|'in_progress'|'blocked'|'done'|'cancelled'. priority: 'low'|'medium'|'high'|'urgent'. "
        "Returns: {id, title, status, priority, due_date, google_synced, ..., _meta} or {error: string}. "
        "Example: update_task(task_id='678ea4e5-...', fields={'status': 'in_progress', 'priority': 'urgent'})"
    )
    async def update_task(task_id: str, fields: dict) -> str:
        pool = get_pool()
        allowed_fields = {"title", "description", "status", "priority", "due_date", "assignee", "domain_slug"}
        invalid = set(fields.keys()) - allowed_fields
        if invalid:
            return json.dumps({"error": f"Invalid fields: {', '.join(invalid)}. Allowed: {', '.join(allowed_fields)}"})

        # Separate domain_slug from regular DB column updates
        new_domain_slug = fields.pop("domain_slug", None)

        try:
            from app.auth.google_oauth import run_google_api

            async with pool.acquire() as conn:
                task = await conn.fetchrow(
                    "SELECT t.*, d.name AS domain_name FROM tasks t "
                    "LEFT JOIN life_domains d ON t.domain_id = d.id "
                    "WHERE t.id = $1::uuid", task_id
                )
                if not task:
                    return json.dumps({"error": f"Task '{task_id}' not found"})

                # Apply regular field updates
                if fields:
                    columns = list(fields.keys())
                    values = list(fields.values())
                    set_clause = ", ".join(f"{col} = ${i+1}" for i, col in enumerate(columns))
                    sql = f"UPDATE tasks SET {set_clause} WHERE id = ${len(columns)+1}::uuid RETURNING *"
                    record = await conn.fetchrow(sql, *values, task_id)
                else:
                    record = task

                task_dict = _row_to_dict(record)
                metadata = task_dict.get("metadata") or {}
                google_task_id = metadata.get("google_task_id")
                google_list_id = metadata.get("google_task_list_id")
                service = _get_tasks_service()

                # Sync regular field changes to Google Tasks
                if service and google_task_id and google_list_id and fields:
                    try:
                        google_update: dict[str, Any] = {}
                        new_title = fields.get("title", task_dict["title"])
                        new_priority = fields.get("priority", task_dict["priority"])
                        google_update["title"] = _prefixed_title(new_title, new_priority)

                        if "due_date" in fields:
                            google_update["due"] = _rfc3339_date(fields["due_date"])

                        gtask = await run_google_api(
                            service.tasks().get(
                                tasklist=google_list_id, task=google_task_id
                            ).execute
                        )

                        if "description" in fields:
                            domain_name = task.get("domain_name") or "Unknown"
                            google_update["notes"] = _build_notes_header(
                                task_id=task_id,
                                domain_name=domain_name,
                                priority=new_priority,
                                due_date=fields.get("due_date", str(task_dict.get("due_date") or "")),
                                description=fields["description"],
                                existing_notes=gtask.get("notes", ""),
                            )

                        gtask.update(google_update)
                        await run_google_api(
                            service.tasks().update(
                                tasklist=google_list_id, task=google_task_id, body=gtask
                            ).execute
                        )
                        task_dict["google_synced"] = True
                    except Exception as e:
                        task_dict["google_sync_error"] = str(e)

                # Handle domain move
                if new_domain_slug:
                    new_domain = await conn.fetchrow(
                        "SELECT id, name, metadata FROM life_domains WHERE slug = $1",
                        new_domain_slug,
                    )
                    if not new_domain:
                        return json.dumps({"error": f"Domain '{new_domain_slug}' not found"})

                    new_domain_id = new_domain["id"]
                    new_domain_meta = _parse_jsonb(new_domain["metadata"]) or {}
                    new_list_id = new_domain_meta.get("google_task_list_id")

                    # Update domain_id in DB
                    await conn.execute(
                        "UPDATE tasks SET domain_id = $1::uuid, updated_at = NOW() "
                        "WHERE id = $2::uuid",
                        new_domain_id, task_id,
                    )
                    task_dict["domain_id"] = str(new_domain_id)
                    task_dict["domain_moved"] = new_domain_slug

                    # Move on Google Tasks: delete old, create new
                    if service and new_list_id:
                        try:
                            # Read existing Google Task to preserve user zone
                            existing_notes = ""
                            if google_task_id and google_list_id:
                                try:
                                    old_gtask = await run_google_api(
                                        service.tasks().get(
                                            tasklist=google_list_id, task=google_task_id
                                        ).execute
                                    )
                                    existing_notes = old_gtask.get("notes", "")
                                except Exception:
                                    pass

                                # Delete from old list
                                try:
                                    await run_google_api(
                                        service.tasks().delete(
                                            tasklist=google_list_id, task=google_task_id
                                        ).execute
                                    )
                                except Exception:
                                    pass

                            # Re-read updated task for current field values
                            updated_row = await conn.fetchrow(
                                "SELECT * FROM tasks WHERE id = $1::uuid", task_id
                            )
                            updated = _row_to_dict(updated_row)

                            # Create in new list
                            new_body: dict[str, Any] = {
                                "title": _prefixed_title(
                                    updated["title"], updated["priority"]
                                ),
                                "notes": _build_notes_header(
                                    task_id=task_id,
                                    domain_name=new_domain["name"],
                                    priority=updated["priority"],
                                    due_date=str(updated["due_date"]) if updated.get("due_date") else None,
                                    description=updated.get("description"),
                                    existing_notes=existing_notes,
                                ),
                                "status": "completed" if updated.get("status") == "done" else "needsAction",
                            }
                            if updated.get("due_date"):
                                new_body["due"] = _rfc3339_date(str(updated["due_date"]))

                            new_gtask = await run_google_api(
                                service.tasks().insert(
                                    tasklist=new_list_id, body=new_body
                                ).execute
                            )

                            # Update metadata with new Google Task IDs
                            new_metadata = {
                                **metadata,
                                "google_task_id": new_gtask["id"],
                                "google_task_list_id": new_list_id,
                            }
                            await conn.execute(
                                "UPDATE tasks SET metadata = $1::jsonb WHERE id = $2::uuid",
                                json.dumps(new_metadata), task_id,
                            )
                            task_dict["google_synced"] = True
                            task_dict["metadata"] = new_metadata
                        except Exception as e:
                            task_dict["google_sync_error"] = str(e)

                return json.dumps(task_dict)
        except Exception as exc:
            return json.dumps({"error": f"Failed to update task: {exc}"})

    @mcp.tool(
        description="Mark a task as completed in both Cloud SQL and Google Tasks. "
        "Sets status to 'done' and completed_at timestamp in the database, "
        "and marks the corresponding Google Task as completed. "
        "Returns: {id, title, status, project_name, domain_name, completed_at, google_synced, ..., _meta}. "
        "Example: complete_task(task_id='678ea4e5-84a9-4a3f-88f7-9d4aac1adf68')"
    )
    async def complete_task(task_id: str) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                record = await conn.fetchrow(
                    "UPDATE tasks SET status = 'done'::task_status, "
                    "completed_at = now() WHERE id = $1::uuid RETURNING *",
                    task_id,
                )
                if not record:
                    return json.dumps({"error": f"Task '{task_id}' not found"})

                # Fetch full task context with project and domain names
                enriched = await conn.fetchrow(
                    "SELECT t.*, p.name AS project_name, d.name AS domain_name "
                    "FROM tasks t "
                    "JOIN projects p ON t.project_id = p.id "
                    "LEFT JOIN life_domains d ON t.domain_id = d.id "
                    "WHERE t.id = $1::uuid", task_id,
                )
                task_dict = _row_to_dict(enriched) if enriched else _row_to_dict(record)
                metadata = task_dict.get("metadata") or {}
                google_task_id = metadata.get("google_task_id")
                google_list_id = metadata.get("google_task_list_id")
                service = _get_tasks_service()

                if service and google_task_id and google_list_id:
                    try:
                        from app.auth.google_oauth import run_google_api

                        gtask = await run_google_api(
                            service.tasks().get(
                                tasklist=google_list_id, task=google_task_id
                            ).execute
                        )
                        gtask["status"] = "completed"
                        await run_google_api(
                            service.tasks().update(
                                tasklist=google_list_id, task=google_task_id, body=gtask
                            ).execute
                        )
                        task_dict["google_synced"] = True
                    except Exception as e:
                        task_dict["google_sync_error"] = str(e)

                task_dict["_meta"] = {"action": "completed", "related_tools": ["send_telegram_template", "get_task_annotations"]}
                return json.dumps(task_dict)
        except Exception as exc:
            return json.dumps({"error": f"Failed to complete task: {exc}"})

    @mcp.tool(
        description="Permanently delete a task from both Cloud SQL and Google Tasks. "
        "Removes the task row, deletes it from the Google Task list on the phone, "
        "and cleans up related annotations. "
        "WARNING: This permanently removes the task from both Cloud SQL and Google Tasks. This action is irreversible. "
        "Returns: {deleted, task_id, title, project_name, domain, google_deleted, _meta}. "
        "Example: delete_task(task_id='678ea4e5-84a9-4a3f-88f7-9d4aac1adf68')"
    )
    async def delete_task(task_id: str) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT t.id, t.title, t.metadata, "
                    "p.name AS project_name, d.name AS domain_name "
                    "FROM tasks t "
                    "JOIN projects p ON t.project_id = p.id "
                    "LEFT JOIN life_domains d ON t.domain_id = d.id "
                    "WHERE t.id = $1::uuid",
                    task_id,
                )
                if not row:
                    return json.dumps({"error": f"Task '{task_id}' not found"})

                meta = _parse_jsonb(row["metadata"]) or {}
                google_task_id = meta.get("google_task_id")
                google_list_id = meta.get("google_task_list_id")

                # Delete from Google Tasks if synced
                google_deleted = False
                service = _get_tasks_service()
                if service and google_task_id and google_list_id:
                    try:
                        from app.auth.google_oauth import run_google_api

                        await run_google_api(
                            service.tasks().delete(
                                tasklist=google_list_id, task=google_task_id
                            ).execute
                        )
                        google_deleted = True
                    except Exception as e:
                        logger.warning(
                            "Could not delete Google Task %s: %s",
                            google_task_id, e,
                        )

                # Delete annotations then task from DB
                await conn.execute(
                    "DELETE FROM task_annotations WHERE task_id = $1::uuid",
                    task_id,
                )
                await conn.execute(
                    "DELETE FROM tasks WHERE id = $1::uuid", task_id
                )

                return json.dumps({
                    "deleted": True,
                    "task_id": task_id,
                    "title": row["title"],
                    "project_name": row.get("project_name"),
                    "domain": row.get("domain_name"),
                    "google_deleted": google_deleted,
                    "_meta": {"action": "deleted", "related_tools": ["list_tasks", "sync_tasks_to_db"]},
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to delete task: {exc}"})

    @mcp.tool(
        description="Sync Google Tasks state back to Cloud SQL. "
        "Performs three passes: (1) field-level merge for existing tasks — "
        "completion, title, due date, and annotations; (2) discovery of "
        "tasks created directly in Google Tasks (phone) and import to DB; "
        "(3) notes reconciliation to rebuild system zone after changes. "
        "Returns: {synced, errors, changes[], total_checked}. "
        "Example: sync_tasks_to_db() — no parameters needed, syncs all domain lists."
    )
    async def sync_tasks_to_db() -> str:
        service = _get_tasks_service()
        if not service:
            return NOT_CONFIGURED_MSG

        pool = get_pool()
        try:
            from app.auth.google_oauth import run_google_api

            async with pool.acquire() as conn:
                synced = 0
                errors = 0
                changes: list[dict[str, Any]] = []

                # ── Phase 1: Field-level merge for existing DB tasks ──
                rows = await conn.fetch(
                    "SELECT t.id, t.title, t.description, t.status::text, "
                    "t.priority::text, t.due_date, t.updated_at, t.metadata, "
                    "d.name AS domain_name "
                    "FROM tasks t "
                    "LEFT JOIN life_domains d ON t.domain_id = d.id "
                    "WHERE t.metadata->>'google_task_id' IS NOT NULL "
                    "AND t.status != 'done'::task_status"
                )

                for row in rows:
                    meta = _parse_jsonb(row["metadata"]) or {}
                    google_task_id = meta.get("google_task_id")
                    google_list_id = meta.get("google_task_list_id")

                    if not google_task_id or not google_list_id:
                        continue

                    try:
                        gtask = await run_google_api(
                            service.tasks().get(
                                tasklist=google_list_id, task=google_task_id
                            ).execute
                        )

                        # 1. COMPLETION SYNC
                        if gtask.get("status") == "completed":
                            await conn.execute(
                                "UPDATE tasks SET status = 'done'::task_status, "
                                "completed_at = now(), updated_at = now() "
                                "WHERE id = $1::uuid",
                                row["id"],
                            )
                            changes.append({
                                "task_id": str(row["id"]),
                                "change": "marked_completed",
                            })
                            synced += 1
                            continue

                        # Timestamp comparison for field merge
                        google_updated_str = gtask.get("updated", "")
                        google_updated = None
                        if google_updated_str:
                            google_updated = datetime.fromisoformat(
                                google_updated_str.replace("Z", "+00:00")
                            )
                        db_updated = row["updated_at"]
                        if db_updated and not db_updated.tzinfo:
                            db_updated = db_updated.replace(tzinfo=timezone.utc)

                        field_changes: dict[str, Any] = {}
                        needs_notes_rebuild = False

                        # 2. TITLE SYNC
                        google_title = gtask.get("title", "")
                        for prefix in ["[URGENT] ", "[HIGH] "]:
                            if google_title.startswith(prefix):
                                google_title = google_title[len(prefix):]
                                break
                        if (google_title and google_title != row["title"]
                                and google_updated and db_updated
                                and google_updated > db_updated):
                            field_changes["title"] = google_title
                            needs_notes_rebuild = True

                        # 3. DUE DATE SYNC
                        google_due = gtask.get("due")
                        google_due_date = None
                        if google_due:
                            google_due_date = datetime.fromisoformat(
                                google_due.replace("Z", "+00:00")
                            ).date()
                        if (google_due_date != row["due_date"]
                                and google_updated and db_updated
                                and google_updated > db_updated):
                            field_changes["due_date"] = google_due_date
                            needs_notes_rebuild = True

                        # Apply field changes to DB
                        if field_changes:
                            set_parts = []
                            values: list[Any] = []
                            for i, (col, val) in enumerate(field_changes.items(), 1):
                                set_parts.append(f"{col} = ${i}")
                                values.append(val)
                            values.append(row["id"])
                            await conn.execute(
                                f"UPDATE tasks SET {', '.join(set_parts)}, "
                                f"updated_at = NOW() WHERE id = ${len(values)}::uuid",
                                *values,
                            )
                            for col, val in field_changes.items():
                                changes.append({
                                    "task_id": str(row["id"]),
                                    "change": f"{col}_updated_from_google",
                                    "new_value": str(val),
                                })
                            synced += 1

                        # 5. NOTES RECONCILIATION after field changes
                        if needs_notes_rebuild:
                            domain_name = row.get("domain_name") or "Unknown"
                            new_title = field_changes.get("title", row["title"])
                            new_due = field_changes.get("due_date", row["due_date"])
                            new_notes = _build_notes_header(
                                task_id=str(row["id"]),
                                domain_name=domain_name,
                                priority=row["priority"],
                                due_date=str(new_due) if new_due else None,
                                description=row["description"],
                                existing_notes=gtask.get("notes", ""),
                            )
                            # Update Google Task title if it changed
                            patch_body: dict[str, Any] = {"notes": new_notes}
                            if "title" in field_changes:
                                patch_body["title"] = _prefixed_title(
                                    field_changes["title"], row["priority"]
                                )
                            await run_google_api(
                                service.tasks().patch(
                                    tasklist=google_list_id,
                                    task=google_task_id,
                                    body=patch_body,
                                ).execute
                            )

                        # 4. ANNOTATION SYNC
                        raw_notes = gtask.get("notes", "")
                        logger.info(
                            "Sync task %s (%s): notes_len=%d, "
                            "delimiter_found=%s, marker_found=%s",
                            str(row["id"])[:8], row["title"][:30],
                            len(raw_notes),
                            NOTES_DELIMITER in raw_notes,
                            NOTES_MARKER in raw_notes,
                        )
                        user_zone = _extract_user_zone(raw_notes)
                        if user_zone.strip():
                            logger.info(
                                "Sync task %s: user_zone found (%d chars)",
                                str(row["id"])[:8], len(user_zone),
                            )
                            content_hash = hashlib.sha256(
                                user_zone.encode()
                            ).hexdigest()
                            inserted = await conn.fetchval(
                                "INSERT INTO task_annotations "
                                "(task_id, content, source, content_hash, metadata) "
                                "VALUES ($1::uuid, $2, 'google_tasks', $3, $4::jsonb) "
                                "ON CONFLICT (task_id, content_hash) DO NOTHING "
                                "RETURNING id",
                                row["id"], user_zone, content_hash,
                                json.dumps({"word_count": len(user_zone.split())}),
                            )
                            if inserted:
                                changes.append({
                                    "task_id": str(row["id"]),
                                    "change": "annotation_captured",
                                    "preview": user_zone[:80],
                                })
                                synced += 1
                    except Exception:
                        errors += 1

                # ── Phase 2: Discover phone-created tasks ──
                # Query ALL active numbered domains (not just those with a list)
                # so we can create missing task lists for domains like 010
                domains = await conn.fetch(
                    "SELECT id, slug, name, metadata FROM life_domains "
                    "WHERE domain_number IS NOT NULL "
                    "AND status = 'active'"
                )

                known_ids_rows = await conn.fetch(
                    "SELECT metadata->>'google_task_id' AS gid FROM tasks "
                    "WHERE metadata->>'google_task_id' IS NOT NULL"
                )
                known_google_ids = {r["gid"] for r in known_ids_rows}

                for domain in domains:
                    dmeta = _parse_jsonb(domain["metadata"]) or {}
                    google_list_id = dmeta.get("google_task_list_id")

                    # Create task list for domains that don't have one yet (e.g. 010)
                    if not google_list_id:
                        try:
                            google_list_id = await _ensure_domain_task_list(
                                conn, str(domain["id"]), service
                            )
                        except Exception:
                            logger.warning(
                                "Failed to create task list for domain %s",
                                domain["slug"],
                            )
                        if not google_list_id:
                            continue

                    try:
                        result = await run_google_api(
                            service.tasks().list(
                                tasklist=google_list_id,
                                maxResults=100,
                                showCompleted=True,
                                showHidden=True,
                            ).execute
                        )
                        google_tasks_list = result.get("items", [])
                    except Exception:
                        errors += 1
                        continue

                    for gt in google_tasks_list:
                        gt_id = gt.get("id")
                        if not gt_id or gt_id in known_google_ids:
                            continue

                        # Skip objectives/automations (they have type prefixes)
                        gt_title = gt.get("title", "")
                        if gt_title.startswith(("[OBJ] ", "[AUTO] ")):
                            continue

                        try:
                            domain_id = domain["id"]
                            domain_slug = domain["slug"]

                            # Resolve project: default_project_id → domain FK → 'personal'
                            default_pid = dmeta.get("default_project_id")
                            if default_pid:
                                project_id = default_pid
                            else:
                                project_row = await conn.fetchrow(
                                    "SELECT id FROM projects WHERE domain_id = $1::uuid",
                                    domain_id,
                                )
                                if not project_row:
                                    project_row = await conn.fetchrow(
                                        "SELECT id FROM projects WHERE slug = 'personal'"
                                    )
                                if not project_row:
                                    continue
                                project_id = str(project_row["id"])

                            # Parse Google Task fields
                            clean_title = gt_title
                            for prefix in ["[URGENT] ", "[HIGH] ", "[MEDIUM] ", "[LOW] "]:
                                if clean_title.startswith(prefix):
                                    clean_title = clean_title[len(prefix):]
                                    break

                            google_due = gt.get("due")
                            due_date_val = None
                            if google_due:
                                due_date_val = datetime.fromisoformat(
                                    google_due.replace("Z", "+00:00")
                                ).date()

                            is_completed = gt.get("status") == "completed"

                            google_notes = gt.get("notes", "")
                            user_notes = (
                                _extract_user_zone(google_notes)
                                if _has_delimiter(google_notes)
                                else google_notes
                            )

                            # INSERT into tasks
                            new_task_id = str(uuid.uuid4())
                            await conn.execute(
                                "INSERT INTO tasks "
                                "(id, title, project_id, domain_id, status, priority, "
                                "due_date, description, metadata, assignee) "
                                "VALUES ($1::uuid, $2, $3::uuid, $4::uuid, $5, "
                                "'medium'::task_priority, $6, $7, $8::jsonb, 'atharva')",
                                new_task_id,
                                clean_title or "Untitled",
                                project_id,
                                domain_id,
                                "done" if is_completed else "todo",
                                due_date_val,
                                None,
                                json.dumps({
                                    "google_task_id": gt_id,
                                    "google_task_list_id": google_list_id,
                                    "source": "google_tasks",
                                }),
                            )
                            known_google_ids.add(gt_id)

                            # Capture annotation if present
                            if user_notes and user_notes.strip():
                                content_hash = hashlib.sha256(
                                    user_notes.encode()
                                ).hexdigest()
                                await conn.execute(
                                    "INSERT INTO task_annotations "
                                    "(id, task_id, content, content_hash, source, metadata) "
                                    "VALUES ($1::uuid, $2::uuid, $3, $4, 'google_tasks', "
                                    "$5::jsonb) "
                                    "ON CONFLICT (task_id, content_hash) DO NOTHING",
                                    str(uuid.uuid4()),
                                    new_task_id,
                                    user_notes,
                                    content_hash,
                                    json.dumps({
                                        "word_count": len(user_notes.split()),
                                        "imported": True,
                                    }),
                                )

                            # Rebuild Google Task notes with system zone
                            new_notes = _build_notes_header(
                                task_id=new_task_id,
                                domain_name=domain["name"],
                                priority="medium",
                                due_date=str(due_date_val) if due_date_val else None,
                                description=None,
                                existing_notes=google_notes,
                            )
                            await run_google_api(
                                service.tasks().patch(
                                    tasklist=google_list_id,
                                    task=gt_id,
                                    body={"notes": new_notes},
                                ).execute
                            )

                            changes.append({
                                "task_id": new_task_id,
                                "change": "imported_from_google",
                                "title": clean_title,
                                "domain": domain_slug,
                            })
                            synced += 1
                        except Exception:
                            errors += 1

                return json.dumps({
                    "synced": synced,
                    "errors": errors,
                    "changes": changes,
                    "total_checked": len(rows),
                })
        except Exception as exc:
            return json.dumps({"error": f"Sync failed: {exc}"})

    @mcp.tool(
        description="Retrieve execution annotations captured from Google Tasks notes "
        "for a specific task. Returns the task brief (Item 1) alongside "
        "timestamped annotations (Item 2), newest first. "
        "Returns: {task_id, task_title, item_1_brief, item_2_annotations[], annotation_count, _meta}. "
        "Example: get_task_annotations(task_id='678ea4e5-84a9-4a3f-88f7-9d4aac1adf68')"
    )
    async def get_task_annotations(task_id: str, limit: int = 20) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                task = await conn.fetchrow(
                    'SELECT title, description FROM tasks WHERE id = $1::uuid',
                    task_id,
                )
                rows = await conn.fetch(
                    'SELECT id, content, source, captured_at, content_hash, metadata '
                    'FROM task_annotations WHERE task_id = $1::uuid '
                    'ORDER BY captured_at DESC LIMIT $2',
                    task_id, limit,
                )
                return json.dumps({
                    'task_id': task_id,
                    'task_title': task['title'] if task else None,
                    'item_1_brief': task['description'] if task else None,
                    'item_2_annotations': [_row_to_dict(r) for r in rows],
                    'annotation_count': len(rows),
                    '_meta': {'related_tools': ['update_task', 'complete_task']},
                })
        except Exception as exc:
            return json.dumps({'error': f'Failed: {exc}'})

    @mcp.tool(
        description="Reset Google Tasks: delete ALL existing task lists, then create "
        "domain-based lists (one per numbered life domain 001-011). Syncs all DB tasks, "
        "objectives, and automations to the appropriate domain list. "
        "WARNING: Destructive operation — deletes ALL existing task lists and recreates them. "
        "Returns: {lists_deleted, lists_created, tasks_synced, objectives_synced, automations_synced, errors[]}. "
        "Example: reset_task_lists() — no parameters."
    )
    async def reset_task_lists() -> str:
        service = _get_tasks_service()
        if not service:
            return NOT_CONFIGURED_MSG

        pool = get_pool()
        try:
            from app.auth.google_oauth import run_google_api

            async with pool.acquire() as conn:
                results: dict[str, Any] = {
                    "lists_deleted": 0,
                    "lists_created": 0,
                    "tasks_synced": 0,
                    "objectives_synced": 0,
                    "automations_synced": 0,
                    "errors": [],
                }

                # ── Step 1: Delete ALL existing Google Task lists ──
                try:
                    all_lists = await run_google_api(
                        service.tasklists().list(maxResults=100).execute
                    )
                    for tl in all_lists.get("items", []):
                        list_id = tl["id"]
                        # Don't delete the default list (title is usually the user's email)
                        # Actually, delete everything — the user explicitly asked to remove all
                        try:
                            await run_google_api(
                                service.tasklists().delete(tasklist=list_id).execute
                            )
                            results["lists_deleted"] += 1
                        except Exception as e:
                            # Default list can't be deleted — clear its tasks instead
                            try:
                                existing = await run_google_api(
                                    service.tasks().list(tasklist=list_id, maxResults=100).execute
                                )
                                for item in existing.get("items", []):
                                    await run_google_api(
                                        service.tasks().delete(
                                            tasklist=list_id, task=item["id"]
                                        ).execute
                                    )
                            except Exception:
                                pass
                            results["errors"].append(f"Could not delete list '{tl.get('title')}': {e}")
                except Exception as e:
                    results["errors"].append(f"Failed to list/delete task lists: {e}")

                # Clear old google metadata from DB
                await conn.execute(
                    "UPDATE tasks SET metadata = metadata - 'google_task_id' - 'google_task_list_id'"
                )
                await conn.execute(
                    "UPDATE projects SET metadata = metadata - 'google_task_list_id'"
                )
                await conn.execute(
                    "UPDATE life_domains SET metadata = metadata - 'google_task_list_id'"
                )
                await conn.execute(
                    "UPDATE domain_context_items SET metadata = metadata - 'google_task_id' - 'google_task_list_id'"
                )

                # ── Step 2: Create domain-based lists and sync content ──
                domains = await conn.fetch(
                    "SELECT id, slug, name, domain_number FROM life_domains "
                    "WHERE domain_number IS NOT NULL AND status = 'active' "
                    "ORDER BY domain_number"
                )

                for domain in domains:
                    did = domain["id"]
                    dslug = domain["slug"]
                    dname = domain["name"]
                    dnum = domain["domain_number"]

                    # Check if this domain has any content
                    task_count = await conn.fetchval(
                        "SELECT COUNT(*) FROM tasks WHERE domain_id = $1 AND status NOT IN ('done','cancelled')",
                        did,
                    )
                    context_count = await conn.fetchval(
                        "SELECT COUNT(*) FROM domain_context_items WHERE domain_id = $1 AND status = 'active'",
                        did,
                    )

                    if task_count == 0 and context_count == 0:
                        continue  # Skip empty domains

                    # Create list
                    list_name = f"{dnum} {dname}"
                    try:
                        new_list = await run_google_api(
                            service.tasklists().insert(body={"title": list_name}).execute
                        )
                        list_id = new_list["id"]
                        results["lists_created"] += 1

                        # Store list ID in domain metadata
                        meta = domain.get("metadata") or {}
                        if isinstance(meta, str):
                            meta = json.loads(meta)
                        meta["google_task_list_id"] = list_id
                        await conn.execute(
                            "UPDATE life_domains SET metadata = $1::jsonb WHERE id = $2::uuid",
                            json.dumps(meta), did,
                        )
                    except Exception as e:
                        results["errors"].append(f"Failed to create list for {dslug}: {e}")
                        continue

                    # ── Sync tasks to this domain's list ──
                    tasks = await conn.fetch(
                        "SELECT id, title, description, priority::text, due_date, metadata "
                        "FROM tasks WHERE domain_id = $1 AND status NOT IN ('done','cancelled') "
                        "ORDER BY priority DESC, due_date ASC NULLS LAST",
                        did,
                    )
                    for t in tasks:
                        try:
                            tid = str(t["id"])
                            body: dict[str, Any] = {
                                "title": _prefixed_title(t["title"], t["priority"]),
                                "notes": _build_notes_header(
                                    task_id=tid,
                                    domain_name=dname,
                                    priority=t["priority"],
                                    due_date=str(t["due_date"]) if t["due_date"] else None,
                                    description=t["description"],
                                ),
                                "status": "needsAction",
                            }
                            if t["due_date"]:
                                body["due"] = _rfc3339_date(str(t["due_date"]))

                            gt = await run_google_api(
                                service.tasks().insert(tasklist=list_id, body=body).execute
                            )

                            tmeta = t["metadata"] or {}
                            if isinstance(tmeta, str):
                                tmeta = json.loads(tmeta)
                            tmeta["google_task_id"] = gt["id"]
                            tmeta["google_task_list_id"] = list_id
                            await conn.execute(
                                "UPDATE tasks SET metadata = $1::jsonb WHERE id = $2::uuid",
                                json.dumps(tmeta), tid,
                            )
                            results["tasks_synced"] += 1
                        except Exception as e:
                            results["errors"].append(f"Failed to sync task '{t['title'][:30]}': {e}")

                    # ── Sync objectives to this domain's list ──
                    objectives = await conn.fetch(
                        "SELECT id, title, description, target_date, progress_pct, metadata "
                        "FROM domain_context_items "
                        "WHERE domain_id = $1 AND item_type = 'objective' AND status = 'active' "
                        "ORDER BY target_date ASC NULLS LAST",
                        did,
                    )
                    for obj in objectives:
                        try:
                            oid = str(obj["id"])
                            progress = obj["progress_pct"] or 0
                            notes_lines = [f"Objective | {dname}", f"Progress: {progress}%"]
                            if obj["description"]:
                                notes_lines.append(obj["description"][:200])
                            body = {
                                "title": _context_item_title(obj["title"], "objective"),
                                "notes": "\n".join(notes_lines),
                                "status": "needsAction",
                            }
                            if obj["target_date"]:
                                body["due"] = _rfc3339_date(str(obj["target_date"]))

                            gt = await run_google_api(
                                service.tasks().insert(tasklist=list_id, body=body).execute
                            )

                            ometa = obj["metadata"] or {}
                            if isinstance(ometa, str):
                                ometa = json.loads(ometa)
                            ometa["google_task_id"] = gt["id"]
                            ometa["google_task_list_id"] = list_id
                            await conn.execute(
                                "UPDATE domain_context_items SET metadata = $1::jsonb WHERE id = $2::uuid",
                                json.dumps(ometa), oid,
                            )
                            results["objectives_synced"] += 1
                        except Exception as e:
                            results["errors"].append(f"Failed to sync objective '{obj['title'][:30]}': {e}")

                    # ── Sync automations to this domain's list ──
                    automations = await conn.fetch(
                        "SELECT id, title, description, metadata "
                        "FROM domain_context_items "
                        "WHERE domain_id = $1 AND item_type = 'automation' AND status = 'active' "
                        "ORDER BY title",
                        did,
                    )
                    for auto in automations:
                        try:
                            aid = str(auto["id"])
                            notes_lines = [f"Automation | {dname}"]
                            if auto["description"]:
                                notes_lines.append(auto["description"][:200])
                            body = {
                                "title": _context_item_title(auto["title"], "automation"),
                                "notes": "\n".join(notes_lines),
                                "status": "needsAction",
                            }

                            gt = await run_google_api(
                                service.tasks().insert(tasklist=list_id, body=body).execute
                            )

                            ameta = auto["metadata"] or {}
                            if isinstance(ameta, str):
                                ameta = json.loads(ameta)
                            ameta["google_task_id"] = gt["id"]
                            ameta["google_task_list_id"] = list_id
                            await conn.execute(
                                "UPDATE domain_context_items SET metadata = $1::jsonb WHERE id = $2::uuid",
                                json.dumps(ameta), aid,
                            )
                            results["automations_synced"] += 1
                        except Exception as e:
                            results["errors"].append(f"Failed to sync automation '{auto['title'][:30]}': {e}")

                return json.dumps(results)
        except Exception as exc:
            return json.dumps({"error": f"Reset failed: {exc}"})

    @mcp.tool(
        description="Migrate all Google Tasks notes from old Unicode delimiter to new ASCII "
        "delimiter. Rebuilds the system zone of every synced task using the new "
        "'--- YOUR NOTES BELOW ---' format while preserving user-written annotations. "
        "One-time migration tool — safe to run multiple times. "
        "WARNING: One-time migration operation. Only run once to update legacy Unicode delimiters to ASCII. "
        "Returns: {migrated, already_new, no_notes, errors, total}."
    )
    async def migrate_notes_delimiter() -> str:
        service = _get_tasks_service()
        if not service:
            return NOT_CONFIGURED_MSG

        pool = get_pool()
        try:
            from app.auth.google_oauth import run_google_api

            async with pool.acquire() as conn:
                migrated = 0
                already_new = 0
                no_notes = 0
                err = 0

                rows = await conn.fetch(
                    "SELECT t.id, t.title, t.description, t.priority::text, "
                    "t.due_date, t.metadata, d.name AS domain_name "
                    "FROM tasks t "
                    "LEFT JOIN life_domains d ON t.domain_id = d.id "
                    "WHERE t.metadata->>'google_task_id' IS NOT NULL "
                    "AND t.status != 'done'::task_status"
                )

                for row in rows:
                    meta = _parse_jsonb(row["metadata"]) or {}
                    gtid = meta.get("google_task_id")
                    glid = meta.get("google_task_list_id")
                    if not gtid or not glid:
                        continue

                    try:
                        gtask = await run_google_api(
                            service.tasks().get(
                                tasklist=glid, task=gtid
                            ).execute
                        )
                        notes = gtask.get("notes", "")

                        if not notes:
                            no_notes += 1
                            continue

                        # Already has new delimiter — skip
                        if NOTES_DELIMITER in notes:
                            already_new += 1
                            continue

                        # Rebuild with new delimiter, preserving user zone
                        domain_name = row.get("domain_name") or "Unknown"
                        new_notes = _build_notes_header(
                            task_id=str(row["id"]),
                            domain_name=domain_name,
                            priority=row["priority"],
                            due_date=str(row["due_date"]) if row["due_date"] else None,
                            description=row["description"],
                            existing_notes=notes,
                        )

                        await run_google_api(
                            service.tasks().patch(
                                tasklist=glid,
                                task=gtid,
                                body={"notes": new_notes},
                            ).execute
                        )
                        migrated += 1
                        logger.info(
                            "Migrated delimiter: %s (%s)",
                            str(row["id"])[:8], row["title"][:30],
                        )
                    except Exception as e:
                        err += 1
                        logger.error("Migration error %s: %s", str(row["id"])[:8], e)

                return json.dumps({
                    "migrated": migrated,
                    "already_new": already_new,
                    "no_notes": no_notes,
                    "errors": err,
                    "total": len(rows),
                })
        except Exception as exc:
            return json.dumps({"error": f"Migration failed: {exc}"})
