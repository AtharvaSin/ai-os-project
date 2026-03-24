"""Render the final brief from all collected data into scannable plain text.

6 sections:
  1. TODAY'S SCHEDULE — meetings with agenda, attendees, related tasks
  2. ZEALOGICS FOCUS — dedicated section for domain 011 tasks
  3. PRIORITY INBOX — action emails + FYI
  4. DOMAIN HEALTH — health scores, flags domains needing attention
  5. 3-DAY MOMENTUM — AI-generated commentary on activity trends
  6. SUGGESTED FOCUS — AI-prioritized top 3 actions
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from collectors.tasks import TaskSnapshot
from collectors.knowledge import KnowledgeSnapshot
from collectors.gmail import GmailSnapshot
from collectors.calendar import CalendarSnapshot
from collectors.domains import DomainsSnapshot

IST = timezone(timedelta(hours=5, minutes=30))

PRIORITY_ICONS = {
    "critical": "\U0001f534",  # red circle
    "urgent": "\U0001f534",
    "high": "\U0001f7e0",      # orange circle
    "medium": "\U0001f7e1",    # yellow circle
    "low": "\U0001f7e2",       # green circle
}


def _format_schedule(cal: CalendarSnapshot, tasks: TaskSnapshot) -> str:
    """Build the TODAY'S SCHEDULE section with agenda + related tasks."""
    lines: list[str] = []

    if not cal.available:
        lines.append("  (Calendar unavailable)")
        return "\n".join(lines)

    if not cal.today_events:
        lines.append("  No events scheduled today.")
    else:
        # Build a quick lookup of task titles for cross-referencing
        all_task_titles = [t.title.lower() for t in tasks.today + tasks.overdue + tasks.zealogics_tasks]

        for ev in cal.today_events[:8]:
            # Time + summary
            if ev.is_all_day:
                lines.append(f"  All day  \u2014 {ev.summary}")
            else:
                lines.append(f"  {ev.start_time}-{ev.end_time}  \u2014 {ev.summary}")

            # Attendees (compact)
            if ev.attendees:
                att_str = ", ".join(ev.attendees[:4])
                if len(ev.attendees) > 4:
                    att_str += f" +{len(ev.attendees) - 4}"
                lines.append(f"    With: {att_str}")

            # Agenda snippet
            if ev.description:
                desc_preview = ev.description.replace("\n", " ").strip()[:120]
                lines.append(f"    Agenda: {desc_preview}")

            # Cross-reference: find tasks related to this meeting
            meeting_words = set(ev.summary.lower().split())
            related = []
            for t in tasks.today + tasks.overdue:
                task_words = set(t.title.lower().split())
                if len(meeting_words & task_words) >= 2:
                    related.append(t.title)
            if related:
                lines.append(f"    Related task: {related[0]}")

    if cal.tomorrow_events:
        lines.append("")
        lines.append(f"  Tomorrow: {len(cal.tomorrow_events)} event(s)")

    return "\n".join(lines)


def _format_zealogics(tasks: TaskSnapshot) -> str:
    """Build the ZEALOGICS FOCUS section."""
    lines: list[str] = []

    if not tasks.zealogics_tasks:
        lines.append("  No active Zealogics tasks.")
        return "\n".join(lines)

    # Group by urgency
    overdue_zl = [t for t in tasks.zealogics_tasks if t.due_date and t.due_date < datetime.now(IST).date()]
    today_zl = [t for t in tasks.zealogics_tasks if t.due_date and t.due_date == datetime.now(IST).date()]
    rest_zl = [t for t in tasks.zealogics_tasks if t not in overdue_zl and t not in today_zl]

    if overdue_zl:
        lines.append(f"  \U0001f534 Overdue ({len(overdue_zl)}):")
        for t in overdue_zl[:3]:
            due = f" \u2014 due {t.due_date.strftime('%b %d')}" if t.due_date else ""
            lines.append(f"    {PRIORITY_ICONS.get(t.priority, '\U0001f7e1')} {t.title}{due}")

    if today_zl:
        if lines:
            lines.append("")
        lines.append(f"  \U0001f7e1 Due Today ({len(today_zl)}):")
        for t in today_zl[:3]:
            lines.append(f"    {PRIORITY_ICONS.get(t.priority, '\U0001f7e1')} {t.title}")

    if rest_zl:
        if lines:
            lines.append("")
        # Show high-priority upcoming first
        high_rest = [t for t in rest_zl if t.priority in ("urgent", "high")]
        other_rest = [t for t in rest_zl if t.priority not in ("urgent", "high")]

        display = high_rest[:3] + other_rest[:2]
        lines.append(f"  Upcoming ({len(rest_zl)}):")
        for t in display:
            icon = PRIORITY_ICONS.get(t.priority, "\U0001f7e1")
            due = f" \u2014 due {t.due_date.strftime('%b %d')}" if t.due_date else ""
            lines.append(f"    {icon} {t.title}{due}")

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


def _format_domain_health(domains: DomainsSnapshot) -> str:
    """Build the DOMAIN HEALTH section."""
    lines: list[str] = []

    if not domains.available or not domains.health:
        lines.append("  (Domain health data unavailable)")
        return "\n".join(lines)

    for dh in domains.health:
        # Health indicator
        if dh.health_score is not None:
            if dh.health_score >= 70:
                indicator = "\U0001f7e2"  # green
            elif dh.health_score >= 40:
                indicator = "\U0001f7e1"  # yellow
            else:
                indicator = "\U0001f534"  # red
            score_str = f"{dh.health_score:.0f}/100"
        else:
            indicator = "\u26aa"  # grey — no score yet
            score_str = "no score"

        # Compact line: icon name score | active tasks | overdue
        parts = [f"{indicator} {dh.name}: {score_str}"]
        if dh.active_tasks > 0:
            parts.append(f"{dh.active_tasks} active")
        if dh.overdue_tasks > 0:
            parts.append(f"\U0001f534 {dh.overdue_tasks} overdue")
        if dh.days_since_activity is not None and dh.days_since_activity > 7:
            parts.append(f"stale {dh.days_since_activity}d")

        lines.append(f"  {' | '.join(parts)}")

    # Flag domains needing attention
    if domains.domains_needing_attention:
        lines.append("")
        lines.append(f"  \u26a0\ufe0f Needs attention: {', '.join(domains.domains_needing_attention)}")

    return "\n".join(lines)


def _format_momentum(momentum_commentary: str) -> str:
    """Build the 3-DAY MOMENTUM section from AI-generated commentary."""
    if not momentum_commentary:
        return "  (Momentum analysis unavailable)"
    lines: list[str] = []
    for line in momentum_commentary.strip().split("\n"):
        lines.append(f"  {line.strip()}")
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
    domains: DomainsSnapshot,
    suggestions: list[str],
    momentum_commentary: str = "",
    drive_url: str | None = None,
) -> str:
    """Compose the full daily brief as plain text — 6 sections."""
    now = datetime.now(IST)
    date_str = now.strftime("%a, %d %b %Y")
    time_str = now.strftime("%H:%M IST")

    inbox_count = len(gmail.action_items) + len(gmail.fyi_items)
    inbox_label = f"({inbox_count} item(s) need attention)" if inbox_count > 0 else "(inbox clear)"
    zealogics_label = f"({len(tasks.zealogics_tasks)} task(s))" if tasks.zealogics_tasks else "(no tasks)"

    sections = []

    # Header
    sections.append(
        f"\u2554{'=' * 46}\u2557\n"
        f"\u2551  DAILY BRIEF \u2014 {date_str:<30}\u2551\n"
        f"\u255a{'=' * 46}\u255d"
    )

    # Quick stats bar
    stats = []
    if tasks.overdue:
        stats.append(f"\U0001f534 {len(tasks.overdue)} overdue")
    stats.append(f"\U0001f4cb {len(tasks.today)} due today")
    if gmail.available and gmail.action_items:
        stats.append(f"\U0001f4ec {len(gmail.action_items)} emails")
    stats.append(f"\U0001f4c5 {len(calendar.today_events)} meetings")
    sections.append(" | ".join(stats))

    # 1. TODAY'S SCHEDULE
    sections.append(
        f"\U0001f4c5 TODAY'S SCHEDULE\n"
        f"{'=' * 20}\n"
        f"{_format_schedule(calendar, tasks)}"
    )

    # 2. ZEALOGICS FOCUS
    sections.append(
        f"\U0001f3e2 ZEALOGICS FOCUS {zealogics_label}\n"
        f"{'=' * 20}\n"
        f"{_format_zealogics(tasks)}"
    )

    # 3. PRIORITY INBOX
    sections.append(
        f"\U0001f4ec PRIORITY INBOX {inbox_label}\n"
        f"{'=' * 20}\n"
        f"{_format_inbox(gmail)}"
    )

    # 4. DOMAIN HEALTH
    sections.append(
        f"\U0001f3af DOMAIN HEALTH\n"
        f"{'=' * 20}\n"
        f"{_format_domain_health(domains)}"
    )

    # 5. 3-DAY MOMENTUM
    sections.append(
        f"\U0001f4c8 3-DAY MOMENTUM\n"
        f"{'=' * 20}\n"
        f"{_format_momentum(momentum_commentary)}"
    )

    # 6. SUGGESTED FOCUS
    if suggestions:
        sections.append(
            f"\U0001f3af SUGGESTED FOCUS (Today's Top 3)\n"
            f"{'=' * 20}\n"
            f"{_format_suggestions(suggestions)}"
        )

    # Footer
    footer_parts = [f"Generated at {time_str}"]
    if drive_url:
        footer_parts.append(f"View in Drive: {drive_url}")
    sections.append(f"{'=' * 20}\n" + " | ".join(footer_parts))

    return "\n\n".join(sections)
