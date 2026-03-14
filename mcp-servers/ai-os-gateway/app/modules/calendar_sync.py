"""Google Calendar sync for AI OS MCP Gateway.

Syncs milestone due dates to a dedicated "AI OS Milestones" calendar.
Creates all-day events with reminders (1 day before + day-of) and
color-codes by project. Stores google_calendar_event_id in milestones table.

Phase 2: Full implementation pending Google OAuth setup.
"""

from fastmcp import FastMCP

NOT_CONFIGURED_MSG = (
    "Google OAuth not configured. This module requires GOOGLE_CLIENT_ID, "
    "GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN environment variables. "
    "See Phase 2 setup instructions."
)


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register Calendar sync tools on the MCP server."""

    @mcp.tool(
        description="Create a Google Calendar event for a milestone. "
        "Fetches milestone and project from Cloud SQL, creates an all-day event "
        "on the 'AI OS Milestones' calendar with format '[PROJECT] Milestone: {name}'. "
        "Sets reminders: 1 day before (email) and day-of (popup). "
        "Stores the event ID in milestones.google_calendar_event_id."
    )
    async def create_milestone_event(milestone_id: str) -> str:
        return NOT_CONFIGURED_MSG

    @mcp.tool(
        description="Update an existing Google Calendar event for a milestone. "
        "Patches the event title, date, or description when the milestone changes. "
        "Only updates if google_calendar_event_id exists in the database."
    )
    async def update_milestone_event(milestone_id: str) -> str:
        return NOT_CONFIGURED_MSG

    @mcp.tool(
        description="Delete a Google Calendar event for a milestone. "
        "Removes the calendar event and clears google_calendar_event_id "
        "from the milestones table."
    )
    async def delete_milestone_event(milestone_id: str) -> str:
        return NOT_CONFIGURED_MSG
