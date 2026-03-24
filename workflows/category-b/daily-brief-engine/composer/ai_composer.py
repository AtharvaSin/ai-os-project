"""Generate context-specific suggestions and momentum commentary using Claude Haiku."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

import anthropic

from collectors.tasks import TaskSnapshot
from collectors.gmail import GmailSnapshot
from collectors.calendar import CalendarSnapshot
from collectors.domains import DomainsSnapshot

logger = logging.getLogger(__name__)

HAIKU_MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 600
TIMEOUT = 15  # seconds


@dataclass
class AIComposerOutput:
    suggestions: list[str] = field(default_factory=list)
    momentum_commentary: str = ""


def _build_prompt(
    tasks: TaskSnapshot,
    gmail: GmailSnapshot,
    calendar: CalendarSnapshot,
    domains: DomainsSnapshot,
) -> str:
    """Build the context prompt for Haiku — covers both suggestions and momentum."""
    overdue_summary = "None"
    if tasks.overdue:
        overdue_summary = "; ".join(
            f"{t.title} (due {t.due_date}, {t.priority}, domain: {t.domain_name or 'unassigned'})"
            for t in tasks.overdue[:5]
        )

    today_summary = "None"
    if tasks.today:
        today_summary = "; ".join(
            f"{t.title} ({t.priority}, domain: {t.domain_name or 'unassigned'})"
            for t in tasks.today[:5]
        )

    zealogics_summary = "None"
    if tasks.zealogics_tasks:
        zealogics_summary = "; ".join(
            f"{t.title} ({t.priority}, due {t.due_date})"
            for t in tasks.zealogics_tasks[:5]
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

    calendar_summary = "None"
    if calendar.available and calendar.today_events:
        calendar_summary = "; ".join(
            f"{e.start_time} {e.summary}" + (f" (attendees: {', '.join(e.attendees[:3])})" if e.attendees else "")
            for e in calendar.today_events[:5]
        )

    # Domain health summary
    domain_health_summary = "No data"
    if domains.available and domains.health:
        domain_lines = []
        for dh in domains.health:
            score = f"{dh.health_score:.0f}/100" if dh.health_score is not None else "no score"
            domain_lines.append(
                f"{dh.name}: {score}, {dh.active_tasks} active, {dh.overdue_tasks} overdue, "
                f"last activity {dh.days_since_activity}d ago" if dh.days_since_activity is not None
                else f"{dh.name}: {score}, {dh.active_tasks} active, {dh.overdue_tasks} overdue"
            )
        domain_health_summary = "; ".join(domain_lines)

    # 3-day activity summary
    activity_summary = "No data"
    if domains.available and domains.activity:
        active_domains = [a for a in domains.activity if a.completed_3d > 0 or a.created_3d > 0]
        if active_domains:
            activity_summary = "; ".join(
                f"{a.name}: {a.completed_3d} completed, {a.created_3d} created"
                for a in active_domains
            )
        else:
            activity_summary = "No task activity in any domain in the last 3 days"

    attention_domains = ", ".join(domains.domains_needing_attention) if domains.domains_needing_attention else "None"

    return f"""You are an AI executive assistant for a Technical Project Manager. Given the user's current state, produce TWO outputs.

OUTPUT 1 — MOMENTUM COMMENTARY (3-4 lines):
Analyze the last 3 days of activity across life domains. Comment on which domains are getting attention, which are being neglected, and the overall momentum trajectory. Be specific and honest — reference domain names and numbers. Keep it concise and useful.

OUTPUT 2 — SUGGESTED FOCUS (3 items):
Suggest 3 specific priorities for today. Each suggestion should reference a concrete task, email, meeting, or deadline. Be actionable, not generic.

=== CONTEXT ===
Tasks overdue: {overdue_summary}
Tasks today: {today_summary}
Zealogics tasks: {zealogics_summary}
Upcoming milestones: {milestone_summary}
Action-needed emails: {email_summary}
Calendar today: {calendar_summary}
Domain health: {domain_health_summary}
3-day activity: {activity_summary}
Domains needing attention: {attention_domains}
Tasks completed last 3 days: {tasks.recent_completions}
Open tasks total: {tasks.open_count}

=== FORMAT ===
MOMENTUM:
(3-4 lines of commentary)

FOCUS:
1. (suggestion)
2. (suggestion)
3. (suggestion)

Do not use markdown formatting. Do not use bold or headers."""


def _parse_response(text: str) -> AIComposerOutput:
    """Parse the Haiku response into momentum + suggestions."""
    output = AIComposerOutput()

    # Split by MOMENTUM: and FOCUS: markers
    momentum_start = text.find("MOMENTUM:")
    focus_start = text.find("FOCUS:")

    if momentum_start >= 0 and focus_start > momentum_start:
        momentum_text = text[momentum_start + len("MOMENTUM:"):focus_start].strip()
        output.momentum_commentary = momentum_text
    elif momentum_start >= 0:
        momentum_text = text[momentum_start + len("MOMENTUM:"):].strip()
        output.momentum_commentary = momentum_text

    if focus_start >= 0:
        focus_text = text[focus_start + len("FOCUS:"):].strip()
        for line in focus_text.split("\n"):
            line = line.strip()
            if not line:
                continue
            # Remove leading numbers like "1.", "2.", "3."
            if len(line) > 2 and line[0].isdigit() and line[1] in (".", ")"):
                line = line[2:].strip()
            elif len(line) > 3 and line[:2].isdigit() and line[2] in (".", ")"):
                line = line[3:].strip()
            if line:
                output.suggestions.append(line)

    # Fallback: if no markers found, try to parse as numbered list
    if not output.suggestions:
        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue
            if len(line) > 2 and line[0].isdigit() and line[1] in (".", ")"):
                output.suggestions.append(line[2:].strip())
            elif len(line) > 3 and line[:2].isdigit() and line[2] in (".", ")"):
                output.suggestions.append(line[3:].strip())

    output.suggestions = output.suggestions[:3]
    return output


def _rule_based_fallback(
    tasks: TaskSnapshot,
    gmail: GmailSnapshot,
    domains: DomainsSnapshot,
) -> AIComposerOutput:
    """Generate rule-based output when AI is unavailable."""
    output = AIComposerOutput()

    # Momentum — simple rule-based
    momentum_lines = []
    if tasks.recent_completions > 0:
        momentum_lines.append(f"{tasks.recent_completions} tasks completed in the last 3 days.")
    else:
        momentum_lines.append("No tasks completed in the last 3 days — momentum is stalled.")

    if domains.domains_needing_attention:
        momentum_lines.append(
            f"Domains needing attention: {', '.join(domains.domains_needing_attention)}."
        )

    active_domains = [a for a in domains.activity if a.completed_3d > 0]
    if active_domains:
        names = [a.name for a in active_domains[:3]]
        momentum_lines.append(f"Active domains: {', '.join(names)}.")

    output.momentum_commentary = "\n".join(momentum_lines)

    # Suggestions — same priority logic
    suggestions: list[str] = []

    if tasks.overdue:
        t = tasks.overdue[0]
        suggestions.append(
            f"Clear overdue: {t.title} ({t.project_name}) — "
            f"was due {t.due_date.strftime('%b %d') if t.due_date else 'recently'}"
        )

    for t in tasks.today:
        if len(suggestions) >= 3:
            break
        if t.priority in ("critical", "urgent", "high"):
            suggestions.append(
                f"{t.title} ({t.project_name}) — {t.priority} priority, due today"
            )

    if gmail.available:
        for e in gmail.action_items:
            if len(suggestions) >= 3:
                break
            suggestions.append(f'{e.action_hint}: "{e.subject}" from {e.sender}')

    for t in tasks.zealogics_tasks:
        if len(suggestions) >= 3:
            break
        due_str = f" — due {t.due_date.strftime('%b %d')}" if t.due_date else ""
        suggestion = f"[Zealogics] {t.title}{due_str}"
        if suggestion not in suggestions:
            suggestions.append(suggestion)

    for t in tasks.today:
        if len(suggestions) >= 3:
            break
        suggestion = f"{t.title} ({t.project_name})"
        if suggestion not in suggestions:
            suggestions.append(suggestion)

    if not suggestions:
        suggestions.append("Review project progress and plan next milestones")

    output.suggestions = suggestions[:3]
    return output


def generate_brief_intelligence(
    api_key: str,
    tasks: TaskSnapshot,
    gmail: GmailSnapshot,
    calendar: CalendarSnapshot,
    domains: DomainsSnapshot,
) -> AIComposerOutput:
    """Generate AI-powered suggestions + momentum commentary, with rule-based fallback."""
    if not api_key:
        logger.warning("No Anthropic API key — using rule-based output")
        return _rule_based_fallback(tasks, gmail, domains)

    try:
        client = anthropic.Anthropic(api_key=api_key, timeout=TIMEOUT)
        prompt = _build_prompt(tasks, gmail, calendar, domains)

        response = client.messages.create(
            model=HAIKU_MODEL,
            max_tokens=MAX_TOKENS,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text.strip()
        output = _parse_response(text)

        if not output.suggestions:
            logger.warning("Haiku returned no suggestions — using fallback for suggestions only")
            fallback = _rule_based_fallback(tasks, gmail, domains)
            output.suggestions = fallback.suggestions

        if not output.momentum_commentary:
            logger.warning("Haiku returned no momentum — using fallback for momentum only")
            fallback = _rule_based_fallback(tasks, gmail, domains)
            output.momentum_commentary = fallback.momentum_commentary

        return output

    except Exception as exc:
        logger.warning("Haiku API failed: %s — using rule-based fallback", exc)
        return _rule_based_fallback(tasks, gmail, domains)


# Backwards-compatible wrapper
def generate_suggestions(
    api_key: str,
    tasks: TaskSnapshot,
    gmail: GmailSnapshot,
    calendar: CalendarSnapshot,
    domains: DomainsSnapshot | None = None,
) -> list[str]:
    """Legacy wrapper — returns just suggestions."""
    if domains is None:
        from collectors.domains import DomainsSnapshot as DS
        domains = DS(available=False)
    return generate_brief_intelligence(api_key, tasks, gmail, calendar, domains).suggestions
