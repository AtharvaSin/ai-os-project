---
name: morning-brief
description: "Daily brief pulling Calendar, Gmail, project state, domain health, Zealogics focus, and momentum analysis. Use when user says good morning, brief me, what is on today, start my day, or opens a session with a greeting."
---

# Skill: Morning Brief

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Version:** v2 — 6-section brief aligned with automated Daily Brief Engine.

---

## When to Use

Activate this workflow when the user asks for a daily brief, morning overview, "what's on today," "brief me," "start my day," or any request for a start-of-day summary. Also activate if the user opens a new chat in this project with a simple greeting (good morning, hey, hi) and there is no other specific request — treat it as an implicit morning brief request.

Do NOT activate this skill in the middle of an ongoing working session. It is a session-opener, not a mid-session interrupt.

---

## Process

### Step 1: Pull Today's Schedule
Use `gcal_list_events` to fetch all events for today and tomorrow (Asia/Kolkata timezone). For each meeting:
- Show time, title, and attendees
- Show agenda/description snippet if available
- Cross-reference with active tasks — flag any task that appears related to a meeting

If the calendar is empty, state that in one line and move on. Don't pad.

### Step 2: Zealogics Focus
Query the tasks database for all active Zealogics tasks (domain 011):

```sql
SELECT t.title, t.priority, t.due_date, t.status, p.name AS project_name
FROM tasks t
JOIN projects p ON p.id = t.project_id
JOIN life_domains d ON d.id = t.domain_id
WHERE d.domain_number = 11
  AND t.status NOT IN ('done', 'cancelled')
ORDER BY CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
t.due_date ASC NULLS LAST
LIMIT 15
```

Group by urgency: overdue, due today, upcoming. Show priority icons.
If no Zealogics tasks exist, show "No active Zealogics tasks" in one line.

### Step 3: Scan Gmail for Priority Items
Use `gmail_search_messages` to search for unread messages from the last 24 hours.

Categorize into:
- **ACTION NEEDED** — Messages requiring a response, decision, or follow-up from the user. Include: sender, subject, one-line summary of what's needed.
- **FYI** — Important updates that don't need action but the user should know about. Keep to 3-4 max.

Skip entirely: newsletters, marketing emails, automated alerts, security notifications, promotional emails, subscription receipts.

If nothing is action-needed, say "Inbox is clear" and move on.

### Step 4: Domain Health
Query the Life Graph for domain-level health:

1. Call `get_domain_tree()` to get the full Life Graph hierarchy with active task/objective/automation counts.
2. For each numbered domain, call `get_domain_summary(domain_slug)` to get aggregate stats and latest health score.
3. Present each domain with:
   - Health indicator: green (70+), yellow (40-69), red (<40 or 3+ overdue tasks)
   - Score, active tasks, overdue count, days since last activity
4. Flag domains needing attention (health < 40 or stale > 7 days).

If Life Graph data is unavailable, skip this section silently.

### Step 5: 3-Day Momentum Analysis
Compute momentum from the last 3 days of activity:

1. Query tasks completed in last 3 days (total and per domain)
2. Query tasks created in last 3 days
3. Generate 3-4 lines of honest commentary:
   - Which domains are getting attention
   - Which domains are being neglected
   - Overall momentum trajectory (accelerating, steady, stalled)
   - Any concerns (e.g., "Career domain has 0 activity in 3 days despite 4 overdue tasks")

### Step 6: Suggested Focus
Compose 3 specific, actionable priorities for today based on everything above.

Rules:
- Be concrete: not "work on AI OS" but "apply migration 020 and test content_posts schema"
- Reference specific tasks, emails, meetings, or deadlines
- If Zealogics has urgent items, at least one suggestion should address them
- Ground these in actual project state, not generic productivity advice

### Step 7: Post-Execution Logging
After composing and delivering the brief, call:
`log_pipeline_run(slug: 'morning-brief', status: 'success')`

If any critical step failed (Calendar or Gmail connector unavailable), call instead:
`log_pipeline_run(slug: 'morning-brief', status: 'partial', metadata: {failed_steps: [...]})`

---

## Brief Structure (6 Sections)

Present as a single structured response:

**TODAY'S SCHEDULE**
[Calendar events with times, attendees, agenda snippets. Related tasks flagged. If empty: "No events scheduled."]

**ZEALOGICS FOCUS**
[All active domain-011 tasks grouped by urgency. Priority icons. If none: "No active Zealogics tasks."]

**PRIORITY INBOX**
[Action-needed emails: sender, subject, what's needed. FYI items compact. If nothing: "Inbox is clear."]

**DOMAIN HEALTH**
[Health scores per numbered domain. Indicator + score + active/overdue counts. Flag domains needing attention.]

**3-DAY MOMENTUM**
[3-4 lines of honest commentary on activity trends, domain focus, and momentum trajectory.]

**SUGGESTED FOCUS**
[3 specific, actionable priorities for today. At least one Zealogics item if relevant.]

---

## Adaptive Behavior

- **Overdue detection:** If any task is overdue, surface it prominently and include it in SUGGESTED FOCUS.
- **Time-of-day awareness:** If triggered in the afternoon/evening, adjust framing ("remaining today" / "for tomorrow").
- **Empty sections:** Silently omit any section that has no data. Never show empty headers.
- **Zealogics priority:** When Zealogics domain has urgent/high-priority tasks, ensure they appear in SUGGESTED FOCUS.

---

## Quality Rules

- The entire brief must be scannable in under 30 seconds. No section should exceed 8 lines.
- Ruthlessly filter emails. If in doubt, skip it.
- SUGGESTED FOCUS is the most important section. It should reflect real priorities grounded in project state.
- Never fabricate calendar events or emails. If a connector fails, say so briefly and continue.
- 3-DAY MOMENTUM should be honest — if nothing happened, say so.

---

## Connectors Used

- **MCP Gateway: `gcal_list_events`** — Step 1 (calendar with attendees/description)
- **MCP Gateway: `gmail_search_messages`** — Step 3 (inbox scan)
- **MCP Gateway: `search_knowledge`** — Knowledge layer queries for project context
- **MCP Gateway: `get_domain_tree`, `get_domain_summary`** — Step 4 (domain health)
- **MCP Gateway: `get_upcoming_dates`** — Birthdays and important dates (included in Schedule if relevant)
- **MCP Gateway: `query_db`** — Steps 2, 5 (Zealogics tasks, momentum queries)
- **MCP Gateway: `log_pipeline_run`** — Step 7 (post-execution logging)
- **Knowledge base: WORK_PROJECTS.md** — Fallback project context
