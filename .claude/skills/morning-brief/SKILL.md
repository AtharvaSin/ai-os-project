---
name: morning-brief
description: "Daily brief pulling Calendar, Gmail, project state, and carry-forward items. Use when user says good morning, brief me, what is on today, start my day, or opens a session with a greeting."
---

# Skill: Morning Brief

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks for a daily brief, morning overview, "what's on today," "brief me," "start my day," or any request for a start-of-day summary. Also activate if the user opens a new chat in this project with a simple greeting (good morning, hey, hi) and there is no other specific request — treat it as an implicit morning brief request.

Do NOT activate this skill in the middle of an ongoing working session. It is a session-opener, not a mid-session interrupt.

---

## Process

### Step 1: Pull Today's Calendar
Use the Google Calendar connector to fetch all events for today and tomorrow (Asia/Kolkata timezone). Present today's schedule with times. Flag anything tomorrow that requires preparation today (meetings needing a document, deadlines, calls with external parties).

If the calendar is empty, state that in one line and move on. Don't pad.

### Step 2: Scan Gmail for Priority Items
Use the Gmail connector to search for unread messages from the last 24 hours.

Categorize into:
- **ACTION NEEDED** — Messages requiring a response, decision, or follow-up from the user. Include: sender, subject, one-line summary of what's needed.
- **FYI** — Important updates that don't need action but the user should know about. Keep to 3-4 max.

Skip entirely: newsletters, marketing emails, automated alerts, security notifications, promotional emails, subscription receipts. Do not list these.

If nothing is action-needed, say "Inbox is clear" and move on.

### Step 3: Query Knowledge Layer (RAG-Grounded)
Before composing the project pulse, query the AI OS knowledge layer via MCP tools for richer, up-to-date context:

**A. Project Status** — For each active project, call:
`search_knowledge(query="weekly status update", domain="project", sub_domain="{project_slug}", limit=1)`
Use the most recent weekly summary to ground the project status section. This provides auto-generated summaries of tasks completed, blockers, and velocity for the past week.

**B. Personal Events** — Call:
`search_knowledge(query="upcoming events this week", domain="personal", limit=5)`
Include any personal events (birthdays, anniversaries, trips) found in the knowledge layer in the brief.

**C. System Updates** — Call:
`search_knowledge(query="infrastructure changes deployment", domain="system", limit=3)`
If recent system changes (deployments, migrations, infra updates) are found, mention them briefly as context.

If `search_knowledge` returns no results for any domain, fall back to the static KB approach below.

### Step 3b: Life Domain Health Check
Query the Life Graph for domain-level status using MCP tools:

1. Call `get_domain_tree()` to get the full Life Graph hierarchy with active task/objective/automation counts.
2. For each top-level category (private_affairs, personal_projects, work), call `get_domain_summary(domain_slug)` to get aggregate stats (total tasks, active, overdue, objectives, automations).
3. Identify:
   - Domains with overdue tasks
   - Domains with no recent activity (no task updates in 7+ days)
   - Objectives nearing their target_date
4. If `get_domain_tree` fails or returns empty (Life Graph not yet deployed), skip this section silently.

### Step 3c: Birthdays & Important Dates
Query the Contacts module for upcoming birthdays and important dates:

1. Call `get_upcoming_dates(days_ahead=7)` to get birthdays, anniversaries, and custom dates in the next 7 days.
2. If any dates are returned:
   - Dates where `is_today=true` → mark as **ACTION NEEDED** with the contact's name and phone number
   - Dates within 1-2 days → mark as **UPCOMING** with a heads-up
   - Dates 3-7 days out → list briefly
3. If `get_upcoming_dates` fails or returns empty, skip this section silently.

### Step 3d: Check Active Project State (Fallback)
Reference **WORK_PROJECTS.md** from this project's knowledge base. For each active focus project (AI Operating System, AI&U, Bharatvarsh), pull:
- Current status (one line)
- This week's focus or next milestone

Flag any milestone that's due this week or any pending decision that's been sitting unresolved.

**Merge knowledge layer results with static KB:** If the knowledge layer returned weekly summaries, use those as the primary source and supplement with WORK_PROJECTS.md only for information not covered. If no knowledge layer results, use WORK_PROJECTS.md as before.

### Step 4: Check for Carry-Forward Items
Use the past chats search tool to find recent sessions in this project (last 2-3 conversations). Look for:
- Explicit action items or "next steps" that were identified
- Unfinished tasks or deferred decisions
- Anything the user said they'd do but may not have completed

If nothing surfaces, skip this section silently.

### Step 5: Compose the Brief

Present as a single structured response:

**TODAY'S SCHEDULE**
[Calendar events with times, chronological. If empty: "No events scheduled."]

**PRIORITY INBOX**
[Action-needed emails: sender → subject → what's needed]
[FYI items as compact list. If nothing: "Inbox is clear."]

**PROJECT PULSE**
[One line per active project: Project Name → status → this week's focus]

**BIRTHDAYS & DATES**
[Today's dates marked ACTION NEEDED with name + phone. Upcoming dates for next 7 days. Only show if dates exist.]

**DOMAIN HEALTH**
[Show 3 category summaries with their numbered domains. For each domain: status emoji (green=healthy, yellow=stale 3-7d, red=stale 7d+ or overdue), domain number + name, task/objective counts. Flag any domain needing attention. Only show if Life Graph data is available.]

**CARRY-FORWARD**
[Unfinished items from recent sessions. Only show if items exist.]

**SUGGESTED FOCUS**
[2-3 specific, actionable priorities for today based on everything above. Be concrete — not "work on AI OS" but "write the /deep-research skill and test it with a real research query." Ground these in actual project state, deadlines, and pending items.]

---

## Quality Rules

- The entire brief must be scannable in under 30 seconds. No section should exceed 8 lines.
- Ruthlessly filter emails. If in doubt, skip it.
- SUGGESTED FOCUS is the most important section. It should reflect real priorities grounded in project state, not generic productivity advice.
- Be time-aware: if the user triggers this in the afternoon or evening, adjust framing ("remaining today" / "for tomorrow" rather than "this morning").
- Never fabricate calendar events or emails. If a connector fails or returns nothing, say so briefly and continue with the sections that work.
- Use the user's project context (WORK_PROJECTS.md, Evolution Log) to make suggestions that are grounded in actual work, not abstract recommendations.

---

## Connectors Used

- **Google Calendar** — required for Step 1
- **Gmail** — required for Step 2
- **MCP Gateway: search_knowledge** — used for Step 3 (knowledge layer queries, semantic search)
- **MCP Gateway: get_domain_tree, get_domain_summary** — used for Step 3b (Life Graph domain health)
- **MCP Gateway: get_upcoming_dates** — used for Step 3c (birthdays and important dates)
- **Past chats search** — used for Step 4 (carry-forward items)
- **Knowledge base: WORK_PROJECTS.md** — fallback for Step 3c (project pulse)
- **Knowledge base: OS_EVOLUTION_LOG.md** — referenced for recent decisions context
