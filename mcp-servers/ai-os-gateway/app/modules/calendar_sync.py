"""Google Calendar sync for AI OS MCP Gateway.

Syncs milestone due dates to a dedicated "AI OS Milestones" calendar.
Creates all-day events with reminders (1 day before + day-of) and
color-codes by project. Stores google_calendar_event_id in milestones table.

Calendar: "AI OS Milestones" (auto-created if missing).
Event format: "[PROJECT] Milestone: {name}"
Color coding by project via colorId (Calendar API uses 1-11).
"""

from __future__ import annotations

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

# Google Calendar colorId mapping per project (1-11 are valid)
PROJECT_COLORS = {
    "ai-operating-system": "9",   # Blueberry
    "ai-and-u": "5",              # Banana
    "bharatvarsh": "11",          # Tomato
    "zealogics": "2",             # Sage
}


def _serialize(value: Any) -> Any:
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


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register Calendar sync tools on the MCP server."""

    def _get_calendar_service():
        from app.auth.google_oauth import get_service
        return get_service("calendar", "v3")

    _calendar_id_cache: dict[str, str] = {}

    async def _get_milestones_calendar_id(service) -> str:
        """Find or create the 'AI OS Milestones' calendar. Returns calendar ID."""
        from app.auth.google_oauth import run_google_api

        if "milestones" in _calendar_id_cache:
            return _calendar_id_cache["milestones"]

        # Search existing calendars
        calendar_list = await run_google_api(
            service.calendarList().list().execute
        )
        for cal in calendar_list.get("items", []):
            if cal.get("summary") == "AI OS Milestones":
                _calendar_id_cache["milestones"] = cal["id"]
                return cal["id"]

        # Create a new calendar
        new_cal = await run_google_api(
            service.calendars().insert(body={
                "summary": "AI OS Milestones",
                "description": "Project milestones synced from AI OS database",
                "timeZone": "Asia/Kolkata",
            }).execute
        )
        _calendar_id_cache["milestones"] = new_cal["id"]
        return new_cal["id"]

    async def _get_milestone_with_project(conn, milestone_id: str):
        """Fetch milestone with project info."""
        return await conn.fetchrow(
            "SELECT m.*, p.slug AS project_slug, p.name AS project_name "
            "FROM milestones m JOIN projects p ON m.project_id = p.id "
            "WHERE m.id = $1::uuid",
            milestone_id,
        )

    def _build_event_body(milestone, project_slug: str, project_name: str) -> dict[str, Any]:
        """Build a Google Calendar event body from a milestone record."""
        due = milestone["due_date"]
        if not due:
            raise ValueError("Milestone has no due_date — cannot create calendar event")

        due_str = due.isoformat() if isinstance(due, date) else str(due)
        # All-day event: uses 'date' not 'dateTime'
        # End date is exclusive in Calendar API, so same-day = date to date+1
        from datetime import timedelta
        end_date = (due if isinstance(due, date) else date.fromisoformat(str(due))) + timedelta(days=1)

        color_id = PROJECT_COLORS.get(project_slug, "1")
        status_label = str(milestone["status"]).replace("_", " ").title()

        return {
            "summary": f"[{project_name}] Milestone: {milestone['name']}",
            "description": (
                f"Status: {status_label}\n"
                f"Project: {project_name}\n"
                f"{milestone['description'] or ''}\n\n"
                f"Managed by AI OS MCP Gateway"
            ),
            "start": {"date": due_str},
            "end": {"date": end_date.isoformat()},
            "colorId": color_id,
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 1440},   # 1 day before
                    {"method": "popup", "minutes": 0},       # Day of
                ],
            },
            "transparency": "transparent",  # Don't block the calendar
        }

    @mcp.tool(
        description="Create a Google Calendar event for a milestone. "
        "Fetches milestone and project from Cloud SQL, creates an all-day event "
        "on the 'AI OS Milestones' calendar with format '[PROJECT] Milestone: {name}'. "
        "Sets reminders: 1 day before (email) and day-of (popup). "
        "Stores the event ID in milestones.google_calendar_event_id. "
        "Milestone must have a due_date set. Fails if event already exists. "
        "Example: create_milestone_event(milestone_id='a1b2c3d4-...'). "
        "Returns: {milestone_id, milestone_name, event_id, event_url, calendar, date, _meta}."
    )
    async def create_milestone_event(milestone_id: str) -> str:
        service = _get_calendar_service()
        if not service:
            return NOT_CONFIGURED_MSG

        pool = get_pool()
        try:
            from app.auth.google_oauth import run_google_api

            async with pool.acquire() as conn:
                milestone = await _get_milestone_with_project(conn, milestone_id)
                if not milestone:
                    return json.dumps({"error": f"Milestone '{milestone_id}' not found"})

                if milestone.get("google_calendar_event_id"):
                    return json.dumps({
                        "error": "Milestone already has a calendar event",
                        "event_id": milestone["google_calendar_event_id"],
                    })

                event_body = _build_event_body(
                    milestone, milestone["project_slug"], milestone["project_name"]
                )

                calendar_id = await _get_milestones_calendar_id(service)
                event = await run_google_api(
                    service.events().insert(
                        calendarId=calendar_id, body=event_body
                    ).execute
                )

                # Store event ID in milestones table
                await conn.execute(
                    "UPDATE milestones SET google_calendar_event_id = $1 "
                    "WHERE id = $2::uuid",
                    event["id"], milestone_id,
                )

                return json.dumps({
                    "milestone_id": str(milestone["id"]),
                    "milestone_name": milestone["name"],
                    "event_id": event["id"],
                    "event_url": event.get("htmlLink", ""),
                    "calendar": "AI OS Milestones",
                    "date": str(milestone["due_date"]),
                    "_meta": {"action": "created", "related_tools": ["update_milestone_event", "send_telegram_template"]},
                })
        except ValueError as ve:
            return json.dumps({"error": str(ve)})
        except Exception as exc:
            return json.dumps({"error": f"Failed to create calendar event: {exc}"})

    @mcp.tool(
        description="Update an existing Google Calendar event for a milestone. "
        "Patches the event title, date, or description when the milestone changes. "
        "Only updates if google_calendar_event_id exists in the database. "
        "Syncs title (from milestone name), date (from due_date), and description. "
        "Creates no event if none exists — use create_milestone_event first. "
        "Example: update_milestone_event(milestone_id='a1b2c3d4-...'). "
        "Returns: {milestone_id, milestone_name, event_id, event_url, updated: bool, _meta}."
    )
    async def update_milestone_event(milestone_id: str) -> str:
        service = _get_calendar_service()
        if not service:
            return NOT_CONFIGURED_MSG

        pool = get_pool()
        try:
            from app.auth.google_oauth import run_google_api

            async with pool.acquire() as conn:
                milestone = await _get_milestone_with_project(conn, milestone_id)
                if not milestone:
                    return json.dumps({"error": f"Milestone '{milestone_id}' not found"})

                event_id = milestone.get("google_calendar_event_id")
                if not event_id:
                    return json.dumps({
                        "error": "Milestone has no linked calendar event",
                        "hint": "Use create_milestone_event first",
                    })

                event_body = _build_event_body(
                    milestone, milestone["project_slug"], milestone["project_name"]
                )

                calendar_id = await _get_milestones_calendar_id(service)
                updated = await run_google_api(
                    service.events().update(
                        calendarId=calendar_id, eventId=event_id, body=event_body
                    ).execute
                )

                return json.dumps({
                    "milestone_id": str(milestone["id"]),
                    "milestone_name": milestone["name"],
                    "event_id": updated["id"],
                    "event_url": updated.get("htmlLink", ""),
                    "updated": True,
                    "_meta": {"action": "updated", "related_tools": ["delete_milestone_event"]},
                })
        except ValueError as ve:
            return json.dumps({"error": str(ve)})
        except Exception as exc:
            return json.dumps({"error": f"Failed to update calendar event: {exc}"})

    @mcp.tool(
        description="Delete a Google Calendar event for a milestone. "
        "WARNING: Permanently removes the calendar event. "
        "Clears google_calendar_event_id from the milestones table. "
        "Safe if the calendar event was already deleted externally. "
        "Example: delete_milestone_event(milestone_id='a1b2c3d4-...'). "
        "Returns: {milestone_id, milestone_name, project_name, due_date, deleted: bool, _meta}."
    )
    async def delete_milestone_event(milestone_id: str) -> str:
        service = _get_calendar_service()
        if not service:
            return NOT_CONFIGURED_MSG

        pool = get_pool()
        try:
            from app.auth.google_oauth import run_google_api

            async with pool.acquire() as conn:
                milestone = await conn.fetchrow(
                    "SELECT m.id, m.name, m.due_date, m.google_calendar_event_id, p.name AS project_name "
                    "FROM milestones m JOIN projects p ON m.project_id = p.id "
                    "WHERE m.id = $1::uuid",
                    milestone_id,
                )
                if not milestone:
                    return json.dumps({"error": f"Milestone '{milestone_id}' not found"})

                event_id = milestone.get("google_calendar_event_id")
                if not event_id:
                    return json.dumps({"error": "Milestone has no linked calendar event"})

                calendar_id = await _get_milestones_calendar_id(service)

                try:
                    await run_google_api(
                        service.events().delete(
                            calendarId=calendar_id, eventId=event_id
                        ).execute
                    )
                except Exception:
                    pass  # Event may already be deleted

                # Clear the event ID
                await conn.execute(
                    "UPDATE milestones SET google_calendar_event_id = NULL "
                    "WHERE id = $1::uuid",
                    milestone_id,
                )

                return json.dumps({
                    "milestone_id": str(milestone["id"]),
                    "milestone_name": milestone["name"],
                    "project_name": milestone["project_name"],
                    "due_date": str(milestone["due_date"]) if milestone["due_date"] else None,
                    "deleted": True,
                    "_meta": {"action": "deleted", "related_tools": ["create_milestone_event", "list_tasks"]},
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to delete calendar event: {exc}"})
