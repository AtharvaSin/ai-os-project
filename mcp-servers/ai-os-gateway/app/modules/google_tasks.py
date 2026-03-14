"""Google Tasks integration for AI OS MCP Gateway.

Syncs tasks between Cloud SQL (source of truth) and Google Tasks
(notification delivery rail). Creates tasks in project-specific task lists
with priority prefixes and due date notifications.

Phase 2: Full implementation pending Google OAuth setup.
"""

from fastmcp import FastMCP

NOT_CONFIGURED_MSG = (
    "Google OAuth not configured. This module requires GOOGLE_CLIENT_ID, "
    "GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN environment variables. "
    "See Phase 2 setup instructions."
)


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register Google Tasks tools on the MCP server."""

    @mcp.tool(
        description="List tasks from the Cloud SQL database, optionally filtered by project. "
        "Returns tasks with their Google Tasks sync status. "
        "Task lists are organized per project: AI OS, AI&U, Bharatvarsh, Zealogics, Personal."
    )
    async def list_tasks(project_slug: str | None = None) -> str:
        return NOT_CONFIGURED_MSG

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
        return NOT_CONFIGURED_MSG

    @mcp.tool(
        description="Update an existing task in Cloud SQL and sync changes to Google Tasks. "
        "Updates title, due_date, description, priority, or status. "
        "If priority changes to urgent/high, the Google Task title prefix is updated."
    )
    async def update_task(task_id: str, fields: dict) -> str:
        return NOT_CONFIGURED_MSG

    @mcp.tool(
        description="Mark a task as completed in both Cloud SQL and Google Tasks. "
        "Sets status to 'done' and completed_at timestamp in the database, "
        "and marks the corresponding Google Task as completed."
    )
    async def complete_task(task_id: str) -> str:
        return NOT_CONFIGURED_MSG

    @mcp.tool(
        description="Sync Google Tasks state back to Cloud SQL. "
        "Checks each project's Google Task list for tasks completed externally "
        "(e.g., from the phone) and updates the database accordingly. "
        "Returns a summary of changes detected and applied."
    )
    async def sync_tasks_to_db() -> str:
        return NOT_CONFIGURED_MSG
