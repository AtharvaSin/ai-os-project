---
name: entry-analysis
description: "Analyse unprocessed quick entries and propose system-wide actions. Use when user says 'analyse entries', 'process entries', 'review captures', or 'triage inbox'."
---

# Skill: Entry Analysis

> **Scope:** This skill operates within the AI Operating System project only. It reads from knowledge_entries and proposes changes via MCP tools.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered. Expert-in-the-loop: all proposed changes require human approval.

---

## When to Use

Activate when the user says:
- "analyse entries" / "analyze entries"
- "process entries"
- "review captures"
- "triage inbox"
- "what did I capture recently?"

Do NOT auto-run this skill. It is always on-demand.

---

## Process

### Step 1: Gather Unprocessed Quick Entries

Query for recent quick entries that haven't been analysed:

```sql
SELECT * FROM knowledge_entries
WHERE source_type = 'quick_capture'
AND (metadata->>'analysed_at') IS NULL
ORDER BY created_at DESC;
```

Use MCP tool: `query_db` with this SQL.

If no unprocessed entries exist, inform the user: "No unprocessed captures found. All entries have been triaged."

### Step 2: Gather Current System State

Pull context needed for cross-referencing:

**A. Active tasks:**
```sql
SELECT id, title, status, priority, domain_id FROM tasks
WHERE status IN ('todo', 'in_progress') ORDER BY priority DESC LIMIT 30;
```

**B. Active objectives:**
```sql
SELECT ci.id, ci.title, ci.status, ci.progress_pct, d.name AS domain_name
FROM domain_context_items ci
JOIN life_domains d ON ci.domain_id = d.id
WHERE ci.status = 'active' AND ci.item_type = 'objective';
```

**C. Recent knowledge for cross-referencing:**
Use `search_knowledge` with the content of each entry to find related existing knowledge.

### Step 3: Analyse Each Entry

For each unprocessed entry, determine the best action. Consider:

| Action | When |
|---|---|
| **CREATE new task** | Entry describes work that should be tracked |
| **MODIFY existing task** | Entry adds context to or changes an existing task |
| **UPDATE objective** | Entry reports progress or changes an objective |
| **NEW knowledge entry** | Entry contains durable insight worth preserving beyond quick_capture |
| **CREATE connection** | Entry relates to existing knowledge (use knowledge_connections) |
| **SUPERSEDE/CONTRADICT** | Entry invalidates or updates existing knowledge |
| **NO ACTION** | Entry is noted but requires no system change |

### Step 4: Present Structured Review

Format all proposals clearly:

```
## Capture Analysis — [N] entries reviewed

### NEW TASKS
1. **[Entry excerpt]** → Create task: "[proposed title]"
   - Project: [project_slug] | Priority: [high/medium/low] | Domain: [domain]

### TASK MODIFICATIONS
2. **[Entry excerpt]** → Update task [task_id]: [change description]

### OBJECTIVE UPDATES
3. **[Entry excerpt]** → Update objective "[title]": [change]

### NEW KNOWLEDGE
4. **[Entry excerpt]** → Preserve as knowledge entry in domain "[domain]"

### NEW CONNECTIONS
5. **[Entry excerpt]** → Connect to "[related entry title]" (relationship: [type])

### NO ACTION NEEDED
6. **[Entry excerpt]** — Noted, no system change required.
```

### Step 5: Get Human Approval

Ask: "Which proposals should I apply? Reply with numbers (e.g., '1, 3, 5') or 'all' / 'none'."

Wait for user response before proceeding. Do NOT auto-apply anything.

### Step 6: Apply Approved Changes

For each approved proposal:
- **New task:** Call `create_task` MCP tool
- **Task modification:** Call `update_task` MCP tool
- **Objective update:** Call `update_record` MCP tool on domain_context_items
- **New knowledge:** Call `insert_record` MCP tool on knowledge_entries
- **New connection:** Call `insert_record` MCP tool on knowledge_connections

### Step 7: Mark Entries as Processed

For each analysed entry (whether action was taken or not), update its metadata:

```sql
UPDATE knowledge_entries
SET metadata = metadata || '{"analysed_at": "<now>", "analysis_actions": [<actions>]}'
WHERE id = '<entry_id>';
```

Use `update_record` MCP tool for each entry.

### Step 8: Summary

Report: "Applied [N] changes from [M] entries. [K] entries marked as no-action."

---

## Quality Rules

- Never auto-create tasks or modify objectives without human approval
- Prefer linking to existing tasks over creating duplicates
- Use semantic search to find related knowledge before proposing "NEW knowledge"
- Keep proposed task titles concise and actionable
- When uncertain about the right action, propose NO ACTION and explain why
- If an entry contradicts existing knowledge, flag it prominently

---

## Connectors Used

- **MCP Gateway: query_db** — Read unprocessed entries and system state
- **MCP Gateway: search_knowledge** — Find related existing knowledge
- **MCP Gateway: create_task** — Create new tasks from entries
- **MCP Gateway: update_task** — Modify existing tasks
- **MCP Gateway: insert_record** — Create knowledge entries and connections
- **MCP Gateway: update_record** — Mark entries as processed, update objectives
