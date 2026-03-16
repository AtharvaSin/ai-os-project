"""Render the final brief from all collected data into scannable plain text."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from collectors.tasks import TaskSnapshot
from collectors.knowledge import KnowledgeSnapshot
from collectors.gmail import GmailSnapshot
from collectors.calendar import CalendarSnapshot

IST = timezone(timedelta(hours=5, minutes=30))

PRIORITY_ICONS = {
    "critical": "\U0001f534",  # red circle
    "urgent": "\U0001f534",
    "high": "\U0001f7e0",      # orange circle
    "medium": "\U0001f7e1",    # yellow circle
    "low": "\U0001f7e2",       # green circle
}


def _format_schedule(cal: CalendarSnapshot) -> str:
    """Build the TODAY'S SCHEDULE section."""
    lines: list[str] = []

    if not cal.available:
        lines.append("  (Calendar unavailable)")
        return "\n".join(lines)

    if not cal.today_events:
        lines.append("  No events scheduled today.")
    else:
        for ev in cal.today_events[:6]:
            if ev.is_all_day:
                lines.append(f"  All day  \u2014 {ev.summary}")
            else:
                lines.append(f"  {ev.start_time} \u2014 {ev.summary}")

    if cal.tomorrow_events:
        lines.append("")
        lines.append(f"  Tomorrow: {len(cal.tomorrow_events)} event(s)")

    return "\n".join(lines)


def _format_inbox(gmail: GmailSnapshot) -> str:
    """Build the PRIORITY INBOX section."""
    lines: list[str] = []

    if not gmail.available:
        lines.append("  (Gmail unavailable)")
        return "\n".join(lines)

    total = len(gmail.action_items) + len(gmail.fyi_items)
    if total == 0:
        lines.append("  Inbox clear \u2014 no actionable items.")
        return "\n".join(lines)

    idx = 1
    for item in gmail.action_items:
        # Extract just the email from sender
        sender_short = item.sender
        if "<" in sender_short:
            sender_short = sender_short.split("<")[-1].rstrip(">")
        lines.append(f'  {idx}. [ACTION] {sender_short} \u2014 "{item.subject}"')
        lines.append(f"     \u2192 {item.action_hint}")
        idx += 1

    for item in gmail.fyi_items:
        sender_short = item.sender
        if "<" in sender_short:
            sender_short = sender_short.split("<")[-1].rstrip(">")
        lines.append(f'  {idx}. [FYI] {sender_short} \u2014 "{item.subject}"')
        lines.append(f"     \u2192 {item.action_hint}")
        idx += 1

    return "\n".join(lines)


def _format_task_pulse(tasks: TaskSnapshot) -> str:
    """Build the TASK PULSE section."""
    lines: list[str] = []

    if tasks.overdue:
        lines.append(f"  Overdue ({len(tasks.overdue)}):")
        for t in tasks.overdue[:4]:
            icon = PRIORITY_ICONS.get(t.priority, "\U0001f7e1")
            project_tag = f" ({t.project_name})" if t.project_name else ""
            due = f" \u2014 due {t.due_date.strftime('%b %d')}" if t.due_date else ""
            lines.append(f"    {icon} {t.title}{project_tag}{due}")

    if tasks.today:
        if lines:
            lines.append("")
        lines.append(f"  Today ({len(tasks.today)}):")
        for t in tasks.today[:4]:
            icon = PRIORITY_ICONS.get(t.priority, "\U0001f7e1")
            project_tag = f" ({t.project_name})" if t.project_name else ""
            lines.append(f"    {icon} {t.title}{project_tag}")

    # Upcoming summary
    parts = []
    if tasks.upcoming_count > 0:
        parts.append(f"{tasks.upcoming_count} task(s)")
    if tasks.upcoming_milestones:
        parts.append(f"{len(tasks.upcoming_milestones)} milestone(s) approaching")
    if parts:
        if lines:
            lines.append("")
        lines.append(f"  Upcoming (7 days): {', '.join(parts)}")

    if not lines:
        lines.append("  No tasks due. You're clear!")

    return "\n".join(lines)


def _format_goals(tasks: TaskSnapshot) -> str:
    """Build the GOALS & PROGRESS section."""
    lines: list[str] = []

    if not tasks.projects:
        lines.append("  No active projects.")
        return "\n".join(lines)

    for proj in tasks.projects:
        pct = proj.pct
        desc = proj.description or proj.status
        # Truncate description to first sentence
        if desc and "." in desc:
            desc = desc.split(".")[0]
        if len(desc) > 60:
            desc = desc[:57] + "..."
        lines.append(f"  {proj.name}: {pct}% \u2014 {desc}")

    return "\n".join(lines)


def _format_suggestions(suggestions: list[str]) -> str:
    """Build the SUGGESTED FOCUS section."""
    lines: list[str] = []
    for i, s in enumerate(suggestions[:3], 1):
        lines.append(f"  {i}. {s}")
    return "\n".join(lines)


def compose_brief(
    tasks: TaskSnapshot,
    knowledge: KnowledgeSnapshot,
    gmail: GmailSnapshot,
    calendar: CalendarSnapshot,
    suggestions: list[str],
    drive_url: str | None = None,
) -> str:
    """Compose the full daily brief as plain text."""
    now = datetime.now(IST)
    date_str = now.strftime("%a, %d %b %Y")
    time_str = now.strftime("%H:%M IST")

    inbox_count = len(gmail.action_items) + len(gmail.fyi_items)
    inbox_label = f"({inbox_count} item(s) need attention)" if inbox_count > 0 else "(inbox clear)"

    sections = []

    # Header
    sections.append(
        f"\u2554{'=' * 46}\u2557\n"
        f"\u2551  DAILY BRIEF \u2014 {date_str:<30}\u2551\n"
        f"\u255a{'=' * 46}\u255d"
    )

    # Schedule
    sections.append(
        f"\U0001f4c5 TODAY'S SCHEDULE\n"
        f"{'=' * 20}\n"
        f"{_format_schedule(calendar)}"
    )

    # Priority Inbox
    sections.append(
        f"\U0001f4ec PRIORITY INBOX {inbox_label}\n"
        f"{'=' * 20}\n"
        f"{_format_inbox(gmail)}"
    )

    # Task Pulse
    sections.append(
        f"\U0001f4cb TASK PULSE\n"
        f"{'=' * 20}\n"
        f"{_format_task_pulse(tasks)}"
    )

    # Goals & Progress
    sections.append(
        f"\U0001f4ca GOALS & PROGRESS\n"
        f"{'=' * 20}\n"
        f"{_format_goals(tasks)}"
    )

    # Suggested Focus
    if suggestions:
        sections.append(
            f"\U0001f3af SUGGESTED FOCUS (Today's Top 3)\n"
            f"{'=' * 20}\n"
            f"{_format_suggestions(suggestions)}"
        )

    # Knowledge context (optional — only if available and has results)
    if knowledge.available and (knowledge.project_updates or knowledge.recent_changes):
        kb_lines = []
        for item in (knowledge.project_updates + knowledge.recent_changes)[:3]:
            kb_lines.append(f"  \u2022 {item.title}: {item.content_snippet[:100]}...")
        if kb_lines:
            sections.append(
                f"\U0001f9e0 KNOWLEDGE CONTEXT\n"
                f"{'=' * 20}\n"
                + "\n".join(kb_lines)
            )

    # Footer
    footer_parts = [f"Generated at {time_str}"]
    if drive_url:
        footer_parts.append(f"View in Drive: {drive_url}")
    sections.append(f"{'=' * 20}\n" + " | ".join(footer_parts))

    return "\n\n".join(sections)
