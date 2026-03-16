"""Google Tasks integration for AI OS MCP Gateway.

Syncs tasks between Cloud SQL (source of truth) and Google Tasks
(notification delivery rail). Creates tasks in project-specific task lists
with priority prefixes and due date notifications.

Task list naming: "AI OS: {project_name}" (one per project).
Task list IDs stored in projects.metadata->>'google_task_list_id'.
Google Task IDs stored in tasks.metadata->>'google_task_id'.
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

NOTES_DELIMITER = '── ✏️ YOUR NOTES BELOW ─────────────────────────'


def _build_notes_header(
    task_id: str,
    project_name: str,
    priority: str,
    due_date: str | None,
    description: str | None = None,
    existing_notes: str | None = None,
) -> str:
    """Build system zone for Google Tasks notes field.

    Includes priority tag, project, due date, task ID short,
    and a 120-char mirror of the task brief.
    """
    lines = [
        f'[{priority.upper()}] {project_name}',
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


def _serialize(value: Any) -> Any:
    """Convert DB-native types to JSON-safe Python types."""
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
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


def _rfc3339_date(d: str | None) -> str | None:
    """Convert a date string to RFC 3339 for Google Tasks API (date only, midnight UTC)."""
    if not d:
        return None
    return f"{d}T00:00:00.000Z"


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register Google Tasks tools on the MCP server."""

    def _get_tasks_service():
        from app.auth.google_oauth import get_service
        return get_service("tasks", "v1")

    async def _ensure_task_list(conn, project_id: str, service) -> str | None:
        """Get or create a Google Task list for a project. Returns list ID."""
        from app.auth.google_oauth import run_google_api

        # Check if project already has a task list ID
        project = await conn.fetchrow(
            "SELECT name, metadata FROM projects WHERE id = $1::uuid", project_id
        )
        if not project:
            return None

        metadata = project["metadata"] or {}
        existing_list_id = metadata.get("google_task_list_id")

        if existing_list_id:
            # Verify it still exists
            try:
                await run_google_api(
                    service.tasklists().get(tasklist=existing_list_id).execute
                )
                return existing_list_id
            except Exception:
                pass  # List was deleted, create a new one

        # Create a new task list
        list_name = f"AI OS: {project['name']}"
        result = await run_google_api(
            service.tasklists().insert(body={"title": list_name}).execute
        )
        list_id = result["id"]

        # Store the list ID in project metadata
        metadata["google_task_list_id"] = list_id
        await conn.execute(
            "UPDATE projects SET metadata = $1::jsonb WHERE id = $2::uuid",
            json.dumps(metadata), project_id,
        )
        return list_id

    @mcp.tool(
        description="List tasks from the Cloud SQL database, optionally filtered by project. "
        "Returns tasks with their Google Tasks sync status. "
        "Task lists are organized per project: AI OS, AI&U, Bharatvarsh, Zealogics, Personal."
    )
    async def list_tasks(project_slug: str | None = None) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                if project_slug:
                    project = await conn.fetchrow(
                        "SELECT id FROM projects WHERE slug = $1", project_slug
                    )
                    if not project:
                        return json.dumps({"error": f"Project '{project_slug}' not found"})
                    rows = await conn.fetch(
                        "SELECT t.*, p.slug AS project_slug, p.name AS project_name "
                        "FROM tasks t JOIN projects p ON t.project_id = p.id "
                        "WHERE t.project_id = $1::uuid "
                        "ORDER BY t.priority DESC, t.due_date ASC NULLS LAST",
                        project["id"],
                    )
                else:
                    rows = await conn.fetch(
                        "SELECT t.*, p.slug AS project_slug, p.name AS project_name "
                        "FROM tasks t JOIN projects p ON t.project_id = p.id "
                        "ORDER BY t.priority DESC, t.due_date ASC NULLS LAST"
                    )

                tasks = []
                for r in rows:
                    task = _row_to_dict(r)
                    meta = task.get("metadata") or {}
                    task["google_synced"] = bool(meta.get("google_task_id"))
                    tasks.append(task)

                return json.dumps({"tasks": tasks, "count": len(tasks)})
        except Exception as exc:
            return json.dumps({"error": f"Failed to list tasks: {exc}"})

    @mcp.tool(
        description="Create a new task in Cloud SQL and sync to Google Tasks. "
        "The task appears in the project's Google Task list with a due date notification. "
        "Priority is shown as a title prefix: [URGENT], [HIGH] for high/urgent tasks. "
        "Google Tasks sends a push notification on the due date."
    )
    async def create_task(
        title: str,
        due_date: str | None = None,
        project_slug: str | None = None,
        priority: str = "medium",
        description: str | None = None,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                # Resolve project
                if project_slug:
                    project = await conn.fetchrow(
                        "SELECT id, name FROM projects WHERE slug = $1", project_slug
                    )
                    if not project:
                        return json.dumps({"error": f"Project '{project_slug}' not found"})
                    project_id = str(project["id"])
                    project_name = project["name"]
                else:
                    # Default to first project
                    project = await conn.fetchrow(
                        "SELECT id, name FROM projects ORDER BY created_at LIMIT 1"
                    )
                    if not project:
                        return json.dumps({"error": "No projects found in database"})
                    project_id = str(project["id"])
                    project_name = project["name"]

                # Insert task into Cloud SQL
                task_id = str(uuid.uuid4())
                metadata: dict[str, Any] = {}

                record = await conn.fetchrow(
                    "INSERT INTO tasks (id, project_id, title, description, status, "
                    "priority, due_date, metadata) "
                    "VALUES ($1::uuid, $2::uuid, $3, $4, 'todo'::task_status, "
                    "$5::task_priority, $6::date, $7::jsonb) RETURNING *",
                    task_id, project_id, title, description,
                    priority, due_date, json.dumps(metadata),
                )

                # Sync to Google Tasks
                service = _get_tasks_service()
                google_task_id = None

                if service:
                    try:
                        from app.auth.google_oauth import run_google_api

                        list_id = await _ensure_task_list(conn, project_id, service)
                        if list_id:
                            google_body: dict[str, Any] = {
                                "title": _prefixed_title(title, priority),
                                "notes": _build_notes_header(
                                    task_id=task_id,
                                    project_name=project_name,
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

                            # Update metadata with Google Task ID
                            metadata["google_task_id"] = google_task_id
                            metadata["google_task_list_id"] = list_id
                            await conn.execute(
                                "UPDATE tasks SET metadata = $1::jsonb WHERE id = $2::uuid",
                                json.dumps(metadata), task_id,
                            )
                    except Exception as e:
                        # Task created in DB but Google sync failed — not fatal
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
                # Get current task (JOIN project for name — needed for notes header)
                task = await conn.fetchrow(
                    "SELECT t.*, p.name AS project_name FROM tasks t "
                    "JOIN projects p ON t.project_id = p.id "
                    "WHERE t.id = $1::uuid", task_id
                )
                if not task:
                    return json.dumps({"error": f"Task '{task_id}' not found"})

                # Build UPDATE query
                columns = list(fields.keys())
                values = list(fields.values())
                set_clause = ", ".join(f"{col} = ${i+1}" for i, col in enumerate(columns))
                sql = f"UPDATE tasks SET {set_clause} WHERE id = ${len(columns)+1}::uuid RETURNING *"

                record = await conn.fetchrow(sql, *values, task_id)
                task_dict = _row_to_dict(record)

                # Sync to Google Tasks
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

                        # Fetch current Google task (need existing notes to preserve user zone)
                        gtask = await run_google_api(
                            service.tasks().get(
                                tasklist=google_list_id, task=google_task_id
                            ).execute
                        )

                        # Handle description: rebuild system zone, preserve user zone
                        if "description" in fields:
                            google_update["notes"] = _build_notes_header(
                                task_id=task_id,
                                project_name=task_dict.get("project_name", ""),
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
        "Checks each project's Google Task list for tasks completed externally "
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
                # Get all tasks that have a Google Task ID
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

                        # ── Annotation capture (Item 2) ──
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
