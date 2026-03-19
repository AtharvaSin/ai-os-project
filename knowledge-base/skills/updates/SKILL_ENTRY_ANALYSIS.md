# Skill: Entry Analysis

> **Scope:** Triages unprocessed journal entries captured via `/capture-entry` or Telegram bot. Classifies each entry, extracts tasks and decisions, persists findings to the knowledge base, and marks entries as processed. Turns raw captures into actionable system state.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary).
>
> **Version:** 1.0 — New skill closing the journal processing gap.

---

## When to Use

Activate this workflow when the user wants to process accumulated journal entries, triage their capture inbox, or extract actionable items from past entries.

**Trigger phrases:** "process entries", "triage journals", "analyze captures", "what have I captured", "unprocessed entries", "review my entries", "entry inbox", "journal triage", "process my notes"

**Also suggest proactively when:** During `/morning-brief` or `/weekly-review`, if unprocessed entries are detected, suggest: "You have {N} unprocessed journal entries. Want me to triage them?"

---

## Process

### Step 1: Pull Unprocessed Entries

**Tool calls:**

1. **`list_journals`** → Pull all journal entries (AIOSMCP)
   - Filter for unprocessed entries (entries without `processed_at` or with `status = 'unprocessed'`)

2. **`search_journals`** → Narrow by date range if the user specified one (AIOSMCP)
   - E.g., "process this week's entries" → filter to current week

If no unprocessed entries found:
> "No unprocessed entries found. All caught up! ✓"

### Step 2: Classify Each Entry

For each unprocessed entry, apply AI classification:

| Signal | Classification | Action |
|--------|---------------|--------|
| Action verb + target ("need to", "should", "must", "going to") | **Task** | → Create via `/create-task` |
| Decision language ("decided", "going with", "choosing", "settled on", "will use") | **Decision** | → Log to `knowledge_entries` |
| Insight, learning, or useful information ("learned", "found out", "key insight", "important to note") | **Knowledge** | → Log to `knowledge_entries` |
| Emotional, reflective, or personal ("feeling", "realized", "grateful", "frustrated") | **Reflection** | → Keep in journals, mark processed |
| Too vague, single word, or unintelligible | **Noise** | → Mark processed, no action |

### Step 3: Process by Classification

**For TASK entries:**

3. Present the task extraction:
   > "Entry: '{original text}' → Extracted task: '{task title}'"
4. On user approval: invoke `/create-task` with extracted title, suggested domain, and priority
5. **`update_record`** → Mark journal entry as processed (AIOSMCP)
   - Set `status = 'processed'`, `processed_action = 'task_created'`, `processed_at = NOW()`

**For DECISION entries:**

3. **`insert_record`** → Log to `knowledge_entries` (AIOSMCP)
   - Params: `table: 'knowledge_entries'`, `entry_type: 'decision'`, `content: {original text + context}`
4. **`update_record`** → Mark journal entry as processed (AIOSMCP)
   - Set `status = 'processed'`, `processed_action = 'decision_logged'`

**For KNOWLEDGE entries:**

3. **`insert_record`** → Log to `knowledge_entries` (AIOSMCP)
   - Params: `table: 'knowledge_entries'`, `entry_type: 'insight'`, `content: {original text + context}`
4. **`update_record`** → Mark journal entry as processed (AIOSMCP)
   - Set `status = 'processed'`, `processed_action = 'insight_logged'`

**For REFLECTION entries:**

3. **`update_record`** → Mark as processed without extraction (AIOSMCP)
   - Set `status = 'processed'`, `processed_action = 'kept_as_reflection'`

**For NOISE entries:**

3. **`update_record`** → Mark as processed (AIOSMCP)
   - Set `status = 'processed'`, `processed_action = 'dismissed'`

### Step 4: Present Triage Summary

**Output format:**

```
## Entry Triage — {count} entries processed

### Extracted Actions
**Tasks created:** {count}
{Bulleted list: task title → domain}

**Decisions logged:** {count}
{Bulleted list: decision summary}

**Knowledge captured:** {count}
{Bulleted list: insight summary}

### Kept As-Is
**Reflections:** {count} — kept in journal
**Dismissed:** {count} — marked as noise

### Entries Needing Review
{Any entries where classification was uncertain — presented for manual decision}
```

### Step 5: Post-Execution

6. **`log_pipeline_run`** → Record execution (AIOSMCP)
   - Params: `slug: 'entry-analysis'`, `status: 'success'`, `metadata: {total_processed, tasks_created, decisions_logged, insights_captured, reflections_kept, noise_dismissed}`

---

## Batch Approval Mode

For efficiency with many entries, offer batch approval:

> "I've classified {N} entries. Here's the breakdown:
> - {X} tasks to create
> - {Y} decisions to log
> - {Z} insights to capture
> - {W} reflections to keep
> - {V} noise to dismiss
>
> Approve all, or review individually?"

If "approve all" → process all in sequence.
If "review individually" → present each entry with classification for confirmation.

---

## Quality Rules

- **Never auto-process without review.** Always present the classification summary before executing actions. Batch approval is OK, silent processing is not.
- **Preserve original text.** When logging decisions or insights, include the original journal entry text — don't rewrite it.
- **Domain suggestion.** When creating tasks from entries, suggest the most relevant Life Graph domain.
- **Uncertain classifications.** If confidence is low, put the entry in "Needs Review" rather than misclassifying.
- **Idempotency.** Check `processed_at` before processing — never double-process an entry.

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `list_journals` | Capture (AIOSMCP) | Pull unprocessed entries |
| `search_journals` | Capture (AIOSMCP) | Date-filtered entry search |
| `insert_record` | PostgreSQL (AIOSMCP) | Decision/insight → knowledge_entries |
| `update_record` | PostgreSQL (AIOSMCP) | Mark entries as processed |
| `log_pipeline_run` | PostgreSQL (AIOSMCP) | Execution logging |

---

## Connectors Used

- **AIOSMCP** — Capture module (2 tools), PostgreSQL module (3 tools)
