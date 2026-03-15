---
name: weekly-review
description: "End-of-week retrospective from past chats, Calendar, Gmail, and project state. Use when user asks for weekly review, week summary, retrospective, or plan next week."
---

# Skill: Weekly Review

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks for a weekly summary, retrospective, "how did this week go," "weekly review," "week in review," "plan next week," or any end-of-week reflection and planning request. Also activate on Friday/Saturday/Sunday if the user asks for a broad planning or review session.

---

## Process

### Step 1: Gather the Week's Data

**A. Recent Sessions**
Use past chats search to find all substantive sessions in this project from the current week. For each, extract:
- What was worked on
- Key decisions made
- Artifacts produced
- Action items stated

**B. Evolution Log**
Read OS_EVOLUTION_LOG.md for any entries added this week. Note:
- Completed items (newly checked off)
- New decisions logged
- Status changes

**C. Calendar Review**
Use Google Calendar to pull all events from the past 7 days. Identify:
- Meetings attended
- Time spent in meetings vs available for deep work
- Any events that were cancelled or rescheduled

**D. Gmail Snapshot**
Search Gmail for sent messages from the past 7 days. This shows:
- What communications were handled
- Outstanding threads that need follow-up
- Commitments made via email

**E. Project State**
Reference WORK_PROJECTS.md for each active project's current milestone and status.

### Step 2: Analyze the Week

For each active project, assess:
- **Progress** — Did the needle move? What specifically was accomplished?
- **Blockers** — What slowed things down? Is the blocker still active?
- **Drift** — Did the week's actual work match the planned priorities? If not, why?

### Step 2b: Query Knowledge Layer Health
Query knowledge layer statistics via MCP tools to include in the review:

**A. Domain Stats** — Call `query_db` with:
```sql
SELECT domain::text, COUNT(*) as entries,
       COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week
FROM knowledge_entries
GROUP BY domain
```

**B. Embedding Coverage** — Call `query_db` with:
```sql
SELECT
    (SELECT COUNT(*) FROM knowledge_entries) as total_entries,
    (SELECT COUNT(*) FROM knowledge_embeddings) as embedded,
    (SELECT COUNT(*) FROM knowledge_connections) as connections
```

**C. Recent Ingestion Jobs** — Call `query_db` with:
```sql
SELECT job_type::text, status::text, entries_created, started_at
FROM knowledge_ingestion_jobs
WHERE started_at >= NOW() - INTERVAL '7 days'
ORDER BY started_at DESC
```

**D. Proposed Knowledge Connections** — Call `query_db` with:
```sql
SELECT kc.id,
       ke_s.title as source_title, ke_s.domain::text as source_domain,
       ke_t.title as target_title, ke_t.domain::text as target_domain,
       kc.relationship_type::text, kc.strength, kc.context
FROM knowledge_connections kc
JOIN knowledge_entries ke_s ON ke_s.id = kc.source_entry_id
JOIN knowledge_entries ke_t ON ke_t.id = kc.target_entry_id
WHERE (kc.metadata->>'auto_proposed')::boolean = true
AND (kc.metadata->>'approved')::boolean = false
ORDER BY kc.strength DESC
LIMIT 10
```

If these queries fail or return empty (knowledge layer not yet active), skip these sections silently.

### Step 3: Compose the Review

**WEEK IN REVIEW: [Date Range]**

**ACCOMPLISHMENTS**
[Concrete things completed this week. Be specific — "wrote 5 skills and uploaded to KB" not "made progress on AI OS."]

**PROJECTS UPDATE**

| Project | Status Change | Key Progress | Blockers |
|---------|--------------|--------------|----------|
| AI OS | ... | ... | ... |
| AI&U | ... | ... | ... |
| Bharatvarsh | ... | ... | ... |

**COMMUNICATIONS**
[Important emails sent/received, decisions communicated, threads needing follow-up]

**KNOWLEDGE LAYER HEALTH**
[Only show if knowledge layer data is available from Step 2b]
- Total entries per domain + weekly delta (new entries this week)
- Embedding coverage percentage (embedded / total entries)
- Connection count and growth
- Ingestion job success/failure rates this week
- Recommendation: flag domains that need more content (e.g., "Personal domain has only 10 entries — consider adding journal or goal docs")

**PROPOSED KNOWLEDGE CONNECTIONS**
[Only show if unapproved auto-discovered connections exist from Step 2b-D]
Present each proposed connection as:
- **{source_title}** ({source_domain}) → *{relationship_type}* → **{target_title}** ({target_domain}) — Similarity: {strength}

Ask the user to approve, reject, or modify each connection. For approved connections, call `query_db` to update:
```sql
UPDATE knowledge_connections SET metadata = metadata || '{"approved": true}' WHERE id = '{connection_id}'
```
For rejected connections, call `query_db` to delete:
```sql
DELETE FROM knowledge_connections WHERE id = '{connection_id}'
```

**OPEN ITEMS**
[Action items from sessions that weren't completed. Decisions still pending.]

**NEXT WEEK PRIORITIES**
[3-5 specific priorities for next week, grounded in project state and open items. Ordered by importance. Include estimated effort.]

**KB MAINTENANCE**
[Flag any knowledge base documents that are stale or need updating based on this week's work]

### Step 4: Offer Downstream Actions
After presenting the review, offer:
- "Want me to update WORK_PROJECTS.md with any status changes?"
- "Should I create Calendar events for next week's priorities?"
- "Should I draft the Evolution Log entry for this week?"

---

## Output Format

Present directly in chat as a structured response. The review should be scannable in 2 minutes.

If the week was particularly productive (multiple decisions, many artifacts), offer to produce a summary docx for the record.

---

## Quality Rules

- Accomplishments must be concrete, not vague. Count things: "3 skills built," "2 KB docs created," "$0 spent on API calls."
- Next Week Priorities should never exceed 5 items. If there are more, force prioritization.
- Always check for stale KB documents — if WORK_PROJECTS.md says "next milestone: X" and X was completed this week, flag the update.
- The review should feel like a team standup, not a corporate report. Direct, honest, no padding.
- If the week was low-productivity, say so plainly and identify why. Don't manufacture accomplishments.

---

## Connectors Used

- **Past chats search** — find sessions from the current week (required)
- **Google Calendar** — review the week's events
- **Gmail** — review sent communications and pending threads
- **MCP Gateway: query_db** — used for Step 2b (knowledge layer health stats, proposed connections)
- **MCP Gateway: search_knowledge** — optional, for semantic queries against knowledge layer
- **Knowledge base: WORK_PROJECTS.md** — current project state
- **Knowledge base: OS_EVOLUTION_LOG.md** — recent entries and decisions
