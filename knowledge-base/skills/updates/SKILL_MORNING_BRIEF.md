# Skill: Morning Brief v2.0

> **Scope:** Daily orchestration skill that pulls Calendar, Gmail, Life Graph health, contact-derived dates, active tasks, and knowledge context into a single comprehensive brief. This is the most-used ritual skill in the AI Operating System.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary). The `daily-brief-engine` Category B service generates an automated version, but this skill is the interactive, on-demand version with richer context.
>
> **Version:** 2.0 — Upgraded from Calendar+Gmail only to full OS-aware brief with Life Graph, contacts, knowledge, and pipeline logging.

---

## When to Use

Activate this workflow when the user starts their day or requests a status overview.

**Trigger phrases:** "morning brief", "start my day", "what's on today", "brief me", "good morning", "daily brief", "what do I have today", any session-opening greeting that implies wanting a day overview.

**Automatic suggestion:** If the user opens a session between 6:00 AM and 11:00 AM IST and hasn't received a brief today, proactively offer: "Good morning! Want me to run your daily brief?"

---

## Process

### Step 1: Gather Data (ordered sequence)

Execute these tool calls in order. If any tool fails, continue with the rest — partial briefs are better than no brief.

1. **`gcal_list_events`** → Today's calendar events (Google Calendar MCP)
   - Params: timeMin = today 00:00 IST, timeMax = today 23:59 IST
   - Flag any scheduling conflicts (overlapping events)

2. **`gmail_search_messages`** → Unread/flagged emails since last session (Gmail MCP)
   - Query: `is:unread OR is:starred after:{yesterday_date}`
   - Summarize: unread count, flagged threads, any that require action

3. **`get_domain_summary`** → Health score for each Life Graph domain (AIOSMCP)
   - Flag any domain with health score below 40 as "Needs Attention"
   - Note any domain that dropped significantly since yesterday

4. **`get_upcoming_dates`** → Birthdays and anniversaries within 7 days (AIOSMCP)
   - From the 891-contact database
   - Highlight today's dates prominently, upcoming dates as a lookahead

5. **`search_knowledge`** → Recent decisions and context items from last 48 hours (AIOSMCP)
   - Query: knowledge entries created/modified in last 48hrs
   - Surface anything relevant to today's calendar or active tasks

6. **`query_db`** → Top 5 active tasks by priority (AIOSMCP)
   ```sql
   SELECT title, domain_slug, priority, due_date, status
   FROM tasks
   WHERE status IN ('pending', 'in_progress')
   ORDER BY
     CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
     due_date ASC NULLS LAST
   LIMIT 5
   ```

### Step 2: Compose the Brief

**Output format:**

```
## Today — {Day, Date Month Year}

### Calendar
{Event list with times. Conflicts flagged with ⚠️}
{If no events: "Clear calendar today."}

### Inbox Highlights
{Unread count} unread | {Starred count} flagged
{Top 3 threads requiring action — sender, subject, brief context}
{If inbox zero: "Inbox clear ✓"}

### Life Graph Pulse
| Domain | Health | Status |
|--------|--------|--------|
| {name} | {score}/100 | {OK / Needs Attention / Critical} |

{Any domain below 40 gets a one-line explanation of why}

### Upcoming Dates
{Contacts with birthdays/anniversaries this week}
{Today's dates highlighted: "🎂 TODAY: {name} — {occasion}"}
{If none: "No upcoming dates this week."}

### Active Priorities
1. {Task title} — {domain} | {priority} | Due: {date or "no deadline"}
2. ...
{Max 5 tasks}

### Context from Recent Sessions
{Any decisions, insights, or carry-forward items from last 48 hours}
{If none: "No recent knowledge entries."}
```

### Step 3: Post-Execution

7. **`log_pipeline_run`** → Record execution (AIOSMCP)
   - Params: `slug: 'morning-brief'`, `status: 'success'`, `metadata: {date, sections_populated}`

---

## Adaptive Behavior

- **Meeting-heavy day:** If >4 events, add a "Prep needed" note for any meeting without clear context in the calendar description.
- **Overdue tasks:** If any task has `due_date < today`, flag it prominently at the top of Active Priorities with "OVERDUE" marker.
- **Birthday today:** If a contact has a birthday today, suggest: "Want me to draft a birthday message?"
- **Red domains:** If any Life Graph domain is below 30, add a "Domain Alert" callout suggesting the user address it today.

---

## Quality Rules

- **Speed matters.** The brief should generate in one pass. Don't ask clarifying questions — just produce the brief.
- **Graceful degradation.** If Calendar or Gmail connectors fail, produce the brief with available data and note what's missing.
- **No stale data.** Always query live — never cache or assume from previous sessions.
- **Timezone awareness.** All times in IST (Asia/Kolkata). Events should show IST times.
- **Concise.** Each section should be scannable in 5 seconds. No prose paragraphs — use tables, bullets, and short lines.
- **Pipeline logging is mandatory.** Always call `log_pipeline_run` at the end, even if the brief was partial.

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `gcal_list_events` | Google Calendar MCP | Today's events |
| `gmail_search_messages` | Gmail MCP | Unread/flagged emails |
| `get_domain_summary` | Life Graph (AIOSMCP) | Domain health scores |
| `get_upcoming_dates` | Contacts (AIOSMCP) | Birthdays/anniversaries |
| `search_knowledge` | PostgreSQL (AIOSMCP) | Recent decisions/context |
| `query_db` | PostgreSQL (AIOSMCP) | Active tasks query |
| `log_pipeline_run` | PostgreSQL (AIOSMCP) | Execution logging |

---

## Connectors Used

- **Google Calendar** — Today's events (required)
- **Gmail** — Inbox status (required)
- **AIOSMCP** — Life Graph, Contacts, PostgreSQL modules (required for full brief, graceful fallback without)
