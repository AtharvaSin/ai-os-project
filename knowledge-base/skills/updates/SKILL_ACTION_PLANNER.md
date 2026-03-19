# Skill: Action Planner v2.0

> **Scope:** Goal-to-tasks decomposition with domain awareness, dedup logic, and write-back to the task and knowledge systems. Plans work by first understanding what's already in-flight, then proposing non-redundant next steps grounded in Life Graph health context.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary). Claude Code counterpart at `.claude/skills/action-planner/`.
>
> **Version:** 2.0 — Upgraded with dedup-before-create pattern, Life Graph awareness, knowledge persistence, and Telegram push.

---

## When to Use

Activate this workflow when the user needs to plan, prioritize, break down a goal, or figure out what to work on next.

**Trigger phrases:** "plan", "what should I work on", "help me prioritize", "action plan", "break this down", "next steps", "plan my week", "what's most important", "roadmap for", "how should I approach"

**Do NOT use for:** Simple one-off task creation (use `/create-task`). This skill is for multi-step planning and prioritization.

---

## Process

### Step 1: Understand Current State (Before Planning)

**Tool calls (ordered sequence):**

1. **`list_domains`** → Get all Life Graph domains with slugs (AIOSMCP)

2. **`get_domain_tasks`** → For the relevant domain(s), pull ALL active tasks (AIOSMCP)
   - This is the dedup reference set — every proposed task will be checked against this

3. **`get_domain_summary`** → Health scores to prioritize underserved domains (AIOSMCP)
   - Domains with health < 40 get priority weight boost
   - Domains with health > 80 may not need new tasks unless explicitly requested

4. **`search_knowledge`** → Recent decisions that constrain planning (AIOSMCP)
   - Query: decisions and insights from last 14 days
   - These may affect what tasks are appropriate (e.g., "decided to pause marketing until launch")

### Step 2: Generate the Plan

Based on the user's goal + current state, generate a prioritized action plan:

**Output format:**

```
## Action Plan — {Goal Summary}

### Current State
- **Relevant domain(s):** {domain names with health scores}
- **Active tasks in these domains:** {count}
- **Recent decisions that apply:** {if any}

### Proposed Actions

| # | Task | Domain | Priority | Rationale |
|---|------|--------|----------|-----------|
| 1 | {task title} | {domain} | urgent/high/med/low | {why this, why now} |
| 2 | ... | ... | ... | ... |

### Dedup Check
{If any proposed task is >80% similar to an existing active task:}
⚠️ Task #{N} "{title}" is similar to existing task "{existing_title}" ({domain}).
→ Skip, merge, or create anyway?

### Domain Impact
{Which domains will improve if this plan is executed}
{Which domains are being neglected by this plan}
```

### Step 3: User Approval

Present the plan and wait for approval. The user may:
- Approve all → proceed to Step 4
- Approve selectively → create only approved tasks
- Modify → adjust and re-present
- Reject → no tasks created

**Never auto-create tasks without explicit approval.**

### Step 4: Execute the Plan (On Approval)

For each approved task:

5. **Dedup final check** — Compare title + domain against active tasks from Step 1
   - If similarity > 80%: flag and ask for explicit confirmation
   - Similarity check: lowercase both titles, check word overlap ratio

6. **`create_task`** → Create via the `/create-task` skill flow (AIOSMCP)
   - Includes: title, domain_slug, priority, description, due_date if applicable

### Step 5: Persist the Plan

7. **`insert_record`** → Log the plan to `knowledge_entries` (AIOSMCP)
   - Params: `table: 'knowledge_entries'`, `entry_type: 'action-plan'`, `content: {plan_summary, tasks_created, domain_context}`

### Step 6: Optional Notification

8. **`send_telegram_message`** → Push plan summary to Telegram (AIOSMCP)
   - Offer: "Push this plan to Telegram for reference?"
   - Format: concise bullet list of tasks with priorities

### Step 7: Post-Execution

9. **`log_pipeline_run`** → Track execution (AIOSMCP)
   - Params: `slug: 'action-planner'`, `status: 'success'`, `metadata: {tasks_created, domains_affected}`

---

## Prioritization Logic

When the user asks "what should I work on" without a specific goal:

1. Query all active tasks across all domains
2. Score each task:
   - **Urgency multiplier:** overdue = 3x, due this week = 2x, due this month = 1.5x, no deadline = 1x
   - **Domain health weight:** domain health < 40 = 2x, < 60 = 1.5x, > 60 = 1x
   - **Priority base:** urgent = 4, high = 3, medium = 2, low = 1
   - **Final score:** priority_base × urgency_multiplier × domain_health_weight
3. Present top 5 by score with reasoning

---

## Quality Rules

- **Always check before creating.** The dedup-before-create pattern is mandatory. Never create a task without checking active tasks first.
- **Domain awareness is mandatory.** Every plan must reference Life Graph domains and health scores.
- **Plans are proposals, not commands.** Always present for approval. Never auto-execute.
- **Knowledge persistence is mandatory.** Every approved plan gets logged to `knowledge_entries`.
- **Relative dates → absolute.** Convert "by Friday" to "2026-03-20" before creating tasks.
- **Scope control.** If a plan grows beyond 10 tasks, suggest splitting into phases.

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `list_domains` | Life Graph (AIOSMCP) | Domain discovery |
| `get_domain_tasks` | Life Graph (AIOSMCP) | Active task lookup for dedup |
| `get_domain_summary` | Life Graph (AIOSMCP) | Health scores for prioritization |
| `search_knowledge` | PostgreSQL (AIOSMCP) | Recent decisions/constraints |
| `create_task` | Google Tasks (AIOSMCP) | Task creation (via /create-task) |
| `insert_record` | PostgreSQL (AIOSMCP) | Plan persistence to knowledge_entries |
| `send_telegram_message` | Telegram (AIOSMCP) | Optional notification push |
| `log_pipeline_run` | PostgreSQL (AIOSMCP) | Execution logging |

---

## Connectors Used

- **AIOSMCP** — Life Graph module (3 tools), PostgreSQL module (3 tools), Google Tasks module (1 tool), Telegram module (1 tool)
