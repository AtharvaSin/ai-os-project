"""Fetch today's and tomorrow's Google Calendar events."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

logger = logging.getLogger(__name__)

IST = timezone(timedelta(hours=5, minutes=30))


@dataclass
class CalendarEvent:
    summary: str
    start_time: str  # formatted "HH:MM" or "All day"
    end_time: str
    location: str | None
    is_all_day: bool
    description: str | None = None  # event agenda / notes
    attendees: list[str] = field(default_factory=list)  # attendee names/emails


@dataclass
class CalendarSnapshot:
    today_events: list[CalendarEvent] = field(default_factory=list)
    tomorrow_events: list[CalendarEvent] = field(default_factory=list)
    available: bool = True


def _parse_event(event: dict) -> CalendarEvent:
    """Parse a Google Calendar event into a CalendarEvent."""
    start = event.get("start", {})
    end = event.get("end", {})

    is_all_day = "date" in start and "dateTime" not in start

    if is_all_day:
        start_time = "All day"
        end_time = ""
    else:
        start_dt = datetime.fromisoformat(start.get("dateTime", ""))
        end_dt = datetime.fromisoformat(end.get("dateTime", ""))
        start_time = start_dt.astimezone(IST).strftime("%H:%M")
        end_time = end_dt.astimezone(IST).strftime("%H:%M")

    # Extract description (agenda) — first 300 chars
    raw_desc = event.get("description", "") or ""
    description = raw_desc.strip()[:300] if raw_desc.strip() else None

    # Extract attendees (display name or email)
    attendees: list[str] = []
    for att in event.get("attendees", []):
        if att.get("self"):
            continue  # skip the calendar owner
        name = att.get("displayName") or att.get("email", "")
        if name:
            attendees.append(name)

    return CalendarEvent(
        summary=event.get("summary", "(No title)"),
        start_time=start_time,
        end_time=end_time,
        location=event.get("location"),
        is_all_day=is_all_day,
        description=description,
        attendees=attendees,
    )


def collect(calendar_service: Any) -> CalendarSnapshot:
    """Fetch today's and tomorrow's calendar events."""
    snapshot = CalendarSnapshot()

    try:
        now = datetime.now(IST)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_end = (today_start + timedelta(days=2))

        time_min = today_start.isoformat()
        time_max = tomorrow_end.isoformat()

        results = (
            calendar_service.events()
            .list(
                calendarId="primary",
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy="startTime",
                maxResults=20,
            )
            .execute()
        )

        events = results.get("items", [])
        today_date = now.date()
        tomorrow_date = today_date + timedelta(days=1)

        for event in events:
            parsed = _parse_event(event)

            # Determine which day this event belongs to
            start = event.get("start", {})
            if "date" in start:
                event_date_str = start["date"]
                from datetime import date as date_type
                event_date = date_type.fromisoformat(event_date_str)
            elif "dateTime" in start:
                event_dt = datetime.fromisoformat(start["dateTime"]).astimezone(IST)
                event_date = event_dt.date()
            else:
                continue

            if event_date == today_date:
                snapshot.today_events.append(parsed)
            elif event_date == tomorrow_date:
                snapshot.tomorrow_events.append(parsed)

    except Exception as exc:
        logger.error("Calendar collector error: %s", exc)
        snapshot.available = False

    return snapshot
