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

### Step 3: Check Active Project State
Reference **WORK_PROJECTS.md** from this project's knowledge base. For each active focus project (AI Operating System, AI&U, Bharatvarsh), pull:
- Current status (one line)
- This week's focus or next milestone

Flag any milestone that's due this week or any pending decision that's been sitting unresolved.

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
- **Past chats search** — used for Step 4 (carry-forward items)
- **Knowledge base: WORK_PROJECTS.md** — required for Step 3 (project pulse)
- **Knowledge base: OS_EVOLUTION_LOG.md** — referenced for recent decisions context
