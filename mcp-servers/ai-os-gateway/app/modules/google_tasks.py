"""Google Tasks integration for AI OS MCP Gateway.

Syncs tasks, objectives, and automations between Cloud SQL (source of truth)
and Google Tasks (notification delivery rail). Creates items in domain-specific
task lists organized by Life Graph domains (001-009).

Task list naming: "{domain_number} {domain_name}" (one per numbered domain).
Task list IDs stored in life_domains.metadata->>'google_task_list_id'.
Google Task IDs stored in tasks.metadata->>'google_task_id' and
domain_context_items.metadata->>'google_task_id'.
"""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from fastmcp import FastMCP

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

NOTES_DELIMITER = '── ✏️ YOUR NOTES BELOW ─────────────────────────'


def _build_notes_header(
    task_id: str,
    domain_name: str,
    priority: str,
    due_date: str | None,
    description: str | None = None,
    existing_notes: str | None = None,
) -> str:
    """Build system zone for Google Tasks notes field."""
    lines = [
        f'[{priority.upper()}] {domain_name}',
        f'Due: {due_date or "not set"}  |  ID: {task_id[:8]}',
    ]
    if description and description.strip():
        brief = description.strip()[:120]
        if len(description.strip()) > 120:
            brief += '...'
        lines.append('─' * 44)
        lines.append(f'📋 {brief}')
    lines.append('─' * 44)
    lines.append(NOTES_DELIMITER)
    header = '\n'.join(lines)
    user_zone = _extract_user_zone(existing_notes or '')
    return f'{header}\n{user_zone}' if user_zone.strip() else header


def _extract_user_zone(notes: str) -> str:
    """Extract everything below the delimiter. Returns '' if no delimiter."""
    if NOTES_DELIMITER in notes:
        return notes.split(NOTES_DELIMITER, 1)[1].lstrip('\n')
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
        "Task lists are organized per life domain (001-009). "
        "Use domain_slug to filter by life domain (recursively includes sub-domains)."
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
                        "d.name AS domain_name, d.slug AS domain_slug "
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
                        "d.name AS domain_name, d.slug AS domain_slug "
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
                        "d.name AS domain_name, d.slug AS domain_slug "
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

                return json.dumps({"tasks": tasks, "count": len(tasks)})
        except Exception as exc:
            return json.dumps({"error": f"Failed to list tasks: {exc}"})

    @mcp.tool(
        description="Create a new task in Cloud SQL and sync to Google Tasks. "
        "The task appears in the domain's Google Task list with a due date notification. "
        "Priority is shown as a title prefix: [URGENT], [HIGH] for high/urgent tasks. "
        "domain_slug is required to place the task in the correct domain task list."
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
                    "SELECT id, name, domain_number FROM life_domains WHERE slug = $1",
                    domain_slug,
                )
                if not domain:
                    return json.dumps({"error": f"Domain '{domain_slug}' not found"})
                domain_id = str(domain["id"])
                domain_name = domain["name"]

                # Resolve project
                if project_slug:
                    project = await conn.fetchrow(
                        "SELECT id, name FROM projects WHERE slug = $1", project_slug
                    )
                    if not project:
                        return json.dumps({"error": f"Project '{project_slug}' not found"})
                    project_id = str(project["id"])
                else:
                    # Default to first project
                    project = await conn.fetchrow(
                        "SELECT id, name FROM projects ORDER BY created_at LIMIT 1"
                    )
                    if not project:
                        return json.dumps({"error": "No projects found in database"})
                    project_id = str(project["id"])

                # Insert task into Cloud SQL
                task_id = str(uuid.uuid4())
                metadata: dict[str, Any] = {}

                record = await conn.fetchrow(
                    "INSERT INTO tasks (id, project_id, domain_id, title, description, status, "
                    "priority, due_date, metadata) "
                    "VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, 'todo'::task_status, "
                    "$6::task_priority, $7::date, $8::jsonb) RETURNING *",
                    task_id, project_id, domain_id, title, description,
                    priority, due_date, json.dumps(metadata),
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

                return json.dumps(task_dict)
        except Exception as exc:
            return json.dumps({"error": f"Failed to create task: {exc}"})

    @mcp.tool(
        description="Update an existing task in Cloud SQL and sync changes to Google Tasks. "
        "Updates title, due_date, description, priority, or status. "
        "If priority changes to urgent/high, the Google Task title prefix is updated."
    )
    async def update_task(task_id: str, fields: dict) -> str:
        pool = get_pool()
        allowed_fields = {"title", "description", "status", "priority", "due_date", "assignee"}
        invalid = set(fields.keys()) - allowed_fields
        if invalid:
            return json.dumps({"error": f"Invalid fields: {', '.join(invalid)}. Allowed: {', '.join(allowed_fields)}"})

        try:
            async with pool.acquire() as conn:
                task = await conn.fetchrow(
                    "SELECT t.*, d.name AS domain_name FROM tasks t "
                    "LEFT JOIN life_domains d ON t.domain_id = d.id "
                    "WHERE t.id = $1::uuid", task_id
                )
                if not task:
                    return json.dumps({"error": f"Task '{task_id}' not found"})

                columns = list(fields.keys())
                values = list(fields.values())
                set_clause = ", ".join(f"{col} = ${i+1}" for i, col in enumerate(columns))
                sql = f"UPDATE tasks SET {set_clause} WHERE id = ${len(columns)+1}::uuid RETURNING *"

                record = await conn.fetchrow(sql, *values, task_id)
                task_dict = _row_to_dict(record)

                metadata = task_dict.get("metadata") or {}
                google_task_id = metadata.get("google_task_id")
                google_list_id = metadata.get("google_task_list_id")
                service = _get_tasks_service()

                if service and google_task_id and google_list_id:
                    try:
                        from app.auth.google_oauth import run_google_api

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

                return json.dumps(task_dict)
        except Exception as exc:
            return json.dumps({"error": f"Failed to update task: {exc}"})

    @mcp.tool(
        description="Mark a task as completed in both Cloud SQL and Google Tasks. "
        "Sets status to 'done' and completed_at timestamp in the database, "
        "and marks the corresponding Google Task as completed."
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

                task_dict = _row_to_dict(record)
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

                return json.dumps(task_dict)
        except Exception as exc:
            return json.dumps({"error": f"Failed to complete task: {exc}"})

    @mcp.tool(
        description="Sync Google Tasks state back to Cloud SQL. "
        "Checks each domain's Google Task list for tasks completed externally "
        "(e.g., from the phone) and updates the database accordingly. "
        "Returns a summary of changes detected and applied."
    )
    async def sync_tasks_to_db() -> str:
        service = _get_tasks_service()
        if not service:
            return NOT_CONFIGURED_MSG

        pool = get_pool()
        try:
            from app.auth.google_oauth import run_google_api

            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    "SELECT id, status, metadata FROM tasks "
                    "WHERE metadata->>'google_task_id' IS NOT NULL "
                    "AND status != 'done'::task_status"
                )

                synced = 0
                errors = 0
                changes: list[dict[str, str]] = []

                for row in rows:
                    meta = row["metadata"] or {}
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

                        if gtask.get("status") == "completed":
                            await conn.execute(
                                "UPDATE tasks SET status = 'done'::task_status, "
                                "completed_at = now() WHERE id = $1::uuid",
                                row["id"],
                            )
                            changes.append({
                                "task_id": str(row["id"]),
                                "change": "marked_completed",
                            })
                            synced += 1

                        # Annotation capture
                        user_zone = _extract_user_zone(gtask.get('notes', ''))
                        if user_zone.strip():
                            content_hash = hashlib.sha256(user_zone.encode()).hexdigest()
                            inserted = await conn.fetchval(
                                "INSERT INTO task_annotations "
                                "(task_id, content, source, content_hash, metadata) "
                                "VALUES ($1::uuid, $2, 'google_tasks', $3, $4::jsonb) "
                                "ON CONFLICT (task_id, content_hash) DO NOTHING "
                                "RETURNING id",
                                row['id'], user_zone, content_hash,
                                json.dumps({'word_count': len(user_zone.split())}),
                            )
                            if inserted:
                                changes.append({
                                    'task_id': str(row['id']),
                                    'change': 'annotation_captured',
                                    'preview': user_zone[:80],
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
        "timestamped annotations (Item 2), newest first."
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
                })
        except Exception as exc:
            return json.dumps({'error': f'Failed: {exc}'})

    @mcp.tool(
        description="Reset Google Tasks: delete ALL existing task lists, then create "
        "domain-based lists (one per numbered life domain 001-009). Syncs all DB tasks, "
        "objectives, and automations to the appropriate domain list. "
        "WARNING: This deletes all existing Google Task lists and items. Use with caution."
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
