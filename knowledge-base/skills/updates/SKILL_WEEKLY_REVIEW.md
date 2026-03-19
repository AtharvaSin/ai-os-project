# Skill: Weekly Review v2.0

> **Scope:** End-of-week retrospective that pulls Calendar, Gmail, pipeline health, Life Graph deltas, journal entries, task metrics, knowledge decisions, conversation themes, and Drive activity into a single structured review with AI-generated recommendations for next week.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary).
>
> **Version:** 2.0 — Upgraded from external-activity-only to full system-state-aware review with pipeline stats, Life Graph deltas, journal captures, and write-back.

---

## When to Use

Activate this workflow at the end of the week or when the user asks for a retrospective.

**Trigger phrases:** "weekly review", "week in review", "summarize my week", "what happened this week", "retrospective", "plan next week", "week summary", "wrap up the week"

**Suggested cadence:** Friday afternoon or Sunday evening. If the user hasn't run a review by Saturday, suggest it proactively.

---

## Process

### Step 1: Gather Data (ordered sequence)

Execute all tool calls. If any fail, continue with the rest — partial reviews are valuable.

1. **`gcal_list_events`** → All events this week (Google Calendar MCP)
   - Params: timeMin = Monday 00:00 IST, timeMax = Sunday 23:59 IST
   - Count: meetings attended, types of events

2. **`gmail_search_messages`** → Sent + received volume, key threads (Gmail MCP)
   - Query: `after:{monday_date} before:{sunday_date}`
   - Metrics: emails sent, emails received, top threads by volume

3. **`query_db`** → Pipeline runs this week (AIOSMCP)
   ```sql
   SELECT slug, status, COUNT(*) as runs,
          COUNT(*) FILTER (WHERE status = 'success') as successes,
          COUNT(*) FILTER (WHERE status = 'failed') as failures
   FROM pipeline_runs
   WHERE created_at >= '{monday_date}'
   GROUP BY slug, status
   ORDER BY runs DESC
   ```

4. **`query_db`** → Task metrics this week (AIOSMCP)
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE created_at >= '{monday_date}') as tasks_created,
     COUNT(*) FILTER (WHERE completed_at >= '{monday_date}') as tasks_completed,
     COUNT(*) FILTER (WHERE status = 'pending' OR status = 'in_progress') as tasks_active
   FROM tasks
   ```

5. **`get_domain_summary`** → Life Graph health per domain (AIOSMCP)
   - Compare against last week's review (from `knowledge_entries` where `entry_type = 'weekly-review'`)
   - Calculate deltas: ↑ improved, ↓ declined, → stable

6. **`list_journals`** → All journal captures this week (AIOSMCP)
   - Count: total captures, by type (thought, task, decision, observation)
   - Flag: any unprocessed entries → suggest `/entry-analysis`

7. **`search_knowledge`** → Decisions logged this week (AIOSMCP)
   - Query: knowledge entries from this week
   - Surface: key decisions, insights, research findings

8. **Recent conversations** → Key conversation themes (Claude native `recent_chats`)
   - Cluster by topic: what workstreams dominated this week

9. **`list_drive_files`** → Files modified this week (AIOSMCP / Google Drive)
   - Or use Drive connector to search for recently modified files

### Step 2: Compose the Review

**Output format:**

```
## Week in Review — {Monday date} to {Sunday date}

### By the Numbers
| Metric | Count |
|--------|-------|
| Meetings attended | {count} |
| Emails sent | {count} |
| Emails received | {count} |
| Tasks created | {count} |
| Tasks completed | {count} |
| Completion ratio | {completed/created}% |
| Journal entries | {count} ({unprocessed} unprocessed) |

### Life Graph Deltas
| Domain | This Week | Last Week | Trend |
|--------|-----------|-----------|-------|
| {name} | {score}/100 | {prev_score}/100 | {↑↓→ +/-N} |

{Highlight: domains that improved most, domains that declined most}

### Pipeline Health
| Pipeline | Runs | Success | Failed |
|----------|------|---------|--------|
| {slug} | {count} | {count} | {count} |

{Flag any pipeline with >0 failures — investigate?}

### Decisions Made
{From knowledge_entries, bulleted list with dates}
{If none: "No formal decisions recorded this week."}

### Journal Captures
{Summary of entries by type}
{If unprocessed entries exist: "⚠️ {N} unprocessed entries — run /entry-analysis to triage"}

### Key Conversations
{Thematic clusters from recent_chats}
{Primary workstreams this week}

### Drive Activity
{Files created or modified, grouped by folder/project}

### Recommended Focus for Next Week
{AI-generated priorities based on:
 - Stalled or declining Life Graph domains
 - Overdue or high-priority tasks
 - Unprocessed journal entries
 - Failed pipeline runs
 - Upcoming calendar commitments
 - Open threads from conversations}

1. {Priority 1 — domain + rationale}
2. {Priority 2}
3. {Priority 3}
```

### Step 3: Persist the Review

10. **`insert_record`** → Save review to knowledge_entries (AIOSMCP)
    - Params: `table: 'knowledge_entries'`, `entry_type: 'weekly-review'`, `content: {structured_summary}`
    - This becomes the baseline for next week's delta comparison

### Step 4: KB Maintenance Check

11. Trigger `/kb-sync` audit logic:
    - Check if any KB files are potentially stale
    - Flag any files that should have been updated based on this week's activity

### Step 5: Post-Execution

12. **`log_pipeline_run`** → Record execution (AIOSMCP)
    - Params: `slug: 'weekly-review'`, `status: 'success'`, `metadata: {week_date_range, sections_populated}`

---

## Quality Rules

- **Comprehensive but scannable.** Every section should be readable in under 10 seconds. Use tables over prose.
- **Delta-driven.** The review's value is in showing change, not static state. Always compare to last week.
- **Actionable recommendations.** "Recommended Focus" section must be concrete — not "keep working on things" but "Domain X dropped 15 points — schedule 2 focus blocks."
- **Persist the review.** The write-back to `knowledge_entries` is mandatory — it creates the baseline for next week.
- **Don't skip KB maintenance.** The review is the natural checkpoint for sync health.
- **Pipeline logging.** Always log execution via `log_pipeline_run`.

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `gcal_list_events` | Google Calendar MCP | Weekly event count |
| `gmail_search_messages` | Gmail MCP | Email volume metrics |
| `query_db` | PostgreSQL (AIOSMCP) | Pipeline runs, task metrics |
| `get_domain_summary` | Life Graph (AIOSMCP) | Health scores + deltas |
| `list_journals` | Capture (AIOSMCP) | Journal entry metrics |
| `search_knowledge` | PostgreSQL (AIOSMCP) | Decisions logged this week |
| `list_drive_files` | Drive Read (AIOSMCP) | Drive activity |
| `insert_record` | PostgreSQL (AIOSMCP) | Persist review to knowledge_entries |
| `log_pipeline_run` | PostgreSQL (AIOSMCP) | Execution logging |

---

## Connectors Used

- **Google Calendar** — Weekly events (required)
- **Gmail** — Email metrics (required)
- **AIOSMCP** — PostgreSQL (3 tools), Life Graph (1 tool), Capture (1 tool), Drive Read (1 tool)
- **Claude native** — `recent_chats` for conversation themes
