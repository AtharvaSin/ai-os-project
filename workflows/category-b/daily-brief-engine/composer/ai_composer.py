"""Generate context-specific suggested focus using Claude Haiku."""

from __future__ import annotations

import logging
from typing import Any

import anthropic

from collectors.tasks import TaskSnapshot
from collectors.gmail import GmailSnapshot
from collectors.calendar import CalendarSnapshot

logger = logging.getLogger(__name__)

HAIKU_MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 300
TIMEOUT = 10  # seconds


def _build_prompt(
    tasks: TaskSnapshot,
    gmail: GmailSnapshot,
    calendar: CalendarSnapshot,
) -> str:
    """Build the context prompt for Haiku."""
    overdue_summary = "None"
    if tasks.overdue:
        overdue_summary = "; ".join(
            f"{t.title} (due {t.due_date}, {t.priority})" for t in tasks.overdue[:5]
        )

    today_summary = "None"
    if tasks.today:
        today_summary = "; ".join(
            f"{t.title} ({t.priority})" for t in tasks.today[:5]
        )

    milestone_summary = "None"
    if tasks.upcoming_milestones:
        milestone_summary = "; ".join(
            f"{m.name} — {m.project_name} (due {m.due_date})"
            for m in tasks.upcoming_milestones[:3]
        )

    email_summary = "None"
    if gmail.available and gmail.action_items:
        email_summary = "; ".join(
            f"{e.subject} from {e.sender} ({e.action_hint})"
            for e in gmail.action_items[:5]
        )

    project_summary = "; ".join(
        f"{p.name}: {p.pct}% complete" for p in tasks.projects
    ) or "No projects tracked"

    calendar_summary = "None"
    if calendar.available and calendar.today_events:
        calendar_summary = "; ".join(
            f"{e.start_time} {e.summary}" for e in calendar.today_events[:5]
        )

    return f"""You are an AI executive assistant. Given the user's current state, suggest 3 specific priorities for today. Each suggestion should reference a concrete task, email, or deadline. Be actionable, not generic.

Tasks overdue: {overdue_summary}
Tasks today: {today_summary}
Upcoming milestones: {milestone_summary}
Action-needed emails: {email_summary}
Project progress: {project_summary}
Calendar today: {calendar_summary}

Return exactly 3 numbered suggestions, each 1-2 lines. Reference specific items. Do not use markdown formatting."""


def _rule_based_fallback(
    tasks: TaskSnapshot,
    gmail: GmailSnapshot,
) -> list[str]:
    """Generate rule-based suggestions when AI is unavailable."""
    suggestions: list[str] = []

    # Overdue first
    if tasks.overdue:
        t = tasks.overdue[0]
        suggestions.append(
            f"Clear overdue: {t.title} ({t.project_name}) — "
            f"was due {t.due_date.strftime('%b %d') if t.due_date else 'recently'}"
        )

    # Today's high-priority
    for t in tasks.today:
        if len(suggestions) >= 3:
            break
        if t.priority in ("critical", "urgent", "high"):
            suggestions.append(
                f"{t.title} ({t.project_name}) — {t.priority} priority, due today"
            )

    # Emails with deadlines
    if gmail.available:
        for e in gmail.action_items:
            if len(suggestions) >= 3:
                break
            suggestions.append(f'{e.action_hint}: "{e.subject}" from {e.sender}')

    # Fill remaining slots with today's tasks
    for t in tasks.today:
        if len(suggestions) >= 3:
            break
        suggestion = f"{t.title} ({t.project_name})"
        if suggestion not in [s for s in suggestions]:
            suggestions.append(suggestion)

    # If still not enough
    if not suggestions:
        suggestions.append("Review project progress and plan next milestones")

    return suggestions[:3]


def generate_suggestions(
    api_key: str,
    tasks: TaskSnapshot,
    gmail: GmailSnapshot,
    calendar: CalendarSnapshot,
) -> list[str]:
    """Generate AI-powered suggestions, with rule-based fallback."""
    if not api_key:
        logger.warning("No Anthropic API key — using rule-based suggestions")
        return _rule_based_fallback(tasks, gmail)

    try:
        client = anthropic.Anthropic(api_key=api_key, timeout=TIMEOUT)
        prompt = _build_prompt(tasks, gmail, calendar)

        response = client.messages.create(
            model=HAIKU_MODEL,
            max_tokens=MAX_TOKENS,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()

        # Parse numbered suggestions
        suggestions: list[str] = []
        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue
            # Remove leading numbers like "1.", "2.", "3."
            if len(line) > 2 and line[0].isdigit() and line[1] in (".", ")"):
                line = line[2:].strip()
            elif len(line) > 3 and line[:2].isdigit() and line[2] in (".", ")"):
                line = line[3:].strip()
            if line:
                suggestions.append(line)

        if suggestions:
            return suggestions[:3]

        logger.warning("Haiku returned empty suggestions — using fallback")
        return _rule_based_fallback(tasks, gmail)

    except Exception as exc:
        logger.warning("Haiku API failed: %s — using rule-based fallback", exc)
        return _rule_based_fallback(tasks, gmail)
