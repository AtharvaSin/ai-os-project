---
name: action-planner
description: "Goal-to-tasks decomposition with automation candidate flagging. Use when user needs to plan, break down, prioritize, create a roadmap, or generate next steps."
---

# Skill: Action Planner

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user needs to plan next steps, break down a goal into tasks, create a roadmap, prioritize work, or generate structured inputs for downstream execution. Trigger phrases include: "plan this out," "break this down," "what should I do next," "create an action plan," "help me prioritize," "roadmap for," "next steps for," or any request to convert a goal or idea into executable tasks.

Also activate when a working session has produced decisions or ideas that need to be converted into a concrete plan before closing.

---

## Process

### Step 1: Understand the Planning Scope
Determine:
- **What** is being planned? (a project phase, a weekly sprint, a single deliverable, a life domain goal)
- **Timeframe?** (today, this week, this month, this quarter)
- **Which domain?** Map to the active focus projects in WORK_PROJECTS.md — AI OS, AI&U, Bharatvarsh, Zealogics, or cross-domain.

If the scope is clear from context, proceed without asking.

### Step 2: Dedup — Fetch Active Tasks for Relevant Domains
Before planning forward, prevent duplicate task creation:
- Call `get_domain_tasks(domain_slug)` for each domain identified in Step 1.
- Store the returned task list as the **dedup reference set** — every active (non-completed) task across relevant domains.
- This set is used in Step 4 to compare proposed tasks against existing ones before creation.
- If the domain has many active tasks already (>15), note this — the user may need triage more than new planning.

### Step 3: Gather Current State
Before planning forward, establish where things stand:
- Pull the relevant project's **current status and next milestone** from WORK_PROJECTS.md
- Check **Evolution Log** for recent decisions or pending items in this domain
- Check **Google Calendar** for any time constraints, deadlines, or upcoming commitments that affect the plan
- Search **past chats** for any commitments or action items from recent sessions
- Call `get_domain_tree()` to understand the current Life Graph domain distribution. Identify which domain(s) the planned work maps to (e.g., 'managing_ai_os', 'networking', 'health'). This ensures tasks are tagged with the correct life domain when created.
- Call `get_domain_summary(domain_slug)` for each relevant domain to get health scores, task counts, and recent activity. Use health scores in Step 4 for weighted prioritization.

### Step 4: Break Down into Tasks (with Weighted Prioritization)
Decompose the goal into discrete, executable tasks. For each task:

| Field | What to Include |
|-------|----------------|
| **Task** | Clear, specific action (verb + object). "Write the /deep-research skill" not "work on skills." |
| **Owner** | Who does this — Atharva, Claude, or automated system? |
| **Effort** | Estimated time: 30 min / 1-2 hrs / half day / full day |
| **Depends on** | What must be done first, if anything |
| **Priority** | P0 (must do), P1 (should do), P2 (nice to have) |
| **Category** | If relevant, note if this is a Category A (Claude chat), B (scheduled automation), or C (agentic system) task |
| **Life Domain** | Map to the appropriate Life Graph domain slug (e.g., 'managing_ai_os', 'health', 'networking'). When creating tasks via MCP, always include domain_slug parameter |

**Dedup check:** Before finalizing each proposed task, compare its title and domain against the dedup reference set from Step 2. If word overlap with any existing task title exceeds ~80% in the same domain, flag it clearly:
> ⚠️ Task #{N} "{proposed title}" is similar to existing task "{existing title}" (ID: {id}). Skip, merge, or create anyway?

Present all flagged duplicates together so the user can resolve them in one pass.

**Weighted prioritization scoring** — When the user asks "what should I work on" or "help me prioritize" without specifying a concrete goal, score each existing + proposed task using this formula:

```
Score = priority_base x urgency_multiplier x domain_health_weight
```

| Factor | Values |
|--------|--------|
| **priority_base** | urgent = 4, high = 3, medium = 2, low = 1 |
| **urgency_multiplier** | overdue = 3x, due this week = 2x, due this month = 1.5x, no deadline = 1x |
| **domain_health_weight** | health < 40 = 2x, health 40-59 = 1.5x, health >= 60 = 1x |

Present the **Top 5 by score** with a brief reasoning line for each explaining why it ranks high (e.g., "Overdue P1 in a low-health domain"). Include the raw score for transparency.

### Step 5: Identify Automation Candidates
Scan the task list for anything that could become a repeatable workflow:
- Tasks that will recur → flag as potential **Category B scheduled workflow**
- Tasks involving multi-step reasoning or tool use → flag as potential **Category C agentic workflow**
- Tasks that are one-time but complex → flag for **Claude Code** execution

This is how the AI OS grows — every planning session is an opportunity to spot patterns worth automating.

### Step 6: Sequence and Present

Present the plan in one of these formats based on scope:

**For a day plan (today's priorities):**
Present as a numbered priority list with time estimates. Keep to 5-7 items max. Include a total time estimate and flag if it exceeds available hours.

**For a week plan:**
Present as a structured table or grouped by day. Include milestones and check-in points.

**For a project phase plan:**
Produce as a downloadable document (markdown or docx) with:
1. **Goal Statement** — What "done" looks like
2. **Task Breakdown** — Full table with all fields above
3. **Critical Path** — Which tasks are blocking others
4. **Automation Candidates** — Tasks flagged for Category B/C
5. **Review Checkpoints** — When to assess progress and adjust
6. **Risks** — What could delay or derail the plan

### Step 7: Connect to Downstream Systems
After presenting the plan:
- Ask if any tasks should be added as **Calendar events** (offer to create them)
- Ask if the plan should be logged in the **Evolution Log**
- Flag any items that should update **WORK_PROJECTS.md** (e.g., "next milestone" has changed)
- If automation candidates were identified, ask if the user wants to design any as workflows in a follow-up session

### Step 8: Persist the Plan
After the user approves the plan (or the key tasks within it):
- Call `insert_record(table: 'knowledge_entries', entry_type: 'action-plan', content: {plan_summary, tasks_created, domain_context, timeframe, date})` to persist the plan in the knowledge graph. This makes it discoverable by future sessions and other skills (e.g., `/deep-research` can find past plans on the same topic).

### Step 9: Telegram Notification (Optional)
Offer: **"Push this plan to Telegram for quick reference?"**
If the user agrees, call `send_telegram_message` with a concise bullet list:
```
📋 Action Plan: {plan title}
• {task 1} — {owner} — {priority}
• {task 2} — {owner} — {priority}
...
⏱️ Total: {estimated hours}h | Domains: {domain list}
```
Keep the message under 4096 characters (Telegram limit). For large plans, send only the top 5-7 items.

### Step 10: Log Pipeline Run
After all steps complete, call:
```
log_pipeline_run(
  slug: 'action-planner',
  status: 'success',
  metadata: {
    tasks_created: <count>,
    tasks_deduplicated: <count of skipped duplicates>,
    domains_affected: [<domain slugs>],
    timeframe: '<day|week|month|quarter>',
    automation_candidates: <count>
  }
)
```
If any step fails, log with `status: 'error'` and include the failure reason in metadata.

---

## Output Format

For quick plans (< 10 tasks): Present directly in chat as a structured response.

For comprehensive plans (10+ tasks): Produce as a downloadable artifact — markdown for internal reference, docx for shareable deliverables.

Always end with: "Want me to create Calendar events for any of these, log this plan in the Evolution Log, or push a summary to Telegram?"

---

## Quality Rules

- Every task must pass the "could someone execute this without asking a follow-up question?" test. If not, it's too vague — break it down further.
- Time estimates should be realistic, not optimistic. Factor in context-switching, setup time, and iteration.
- Don't create plans with 20+ tasks for a single week. If the scope is that large, break into phases and plan the first phase in detail.
- P0 items should never exceed what can realistically be done in the timeframe. If they do, force a prioritization conversation.
- Always check the calendar before suggesting a day plan — don't propose 6 hours of deep work on a day with 4 hours of meetings.
- The plan should feel empowering, not overwhelming. If the user's reaction would be "this is too much," the plan needs simplification.
- Never create a task that already exists. The dedup check in Step 2/4 is mandatory, not optional.
- When scoring tasks for prioritization, show your work — the user should understand why one task ranks above another.

---

## Connectors Used

- **Google Calendar** — check for time constraints and offer to create events
- **Past chats search** — find commitments from recent sessions
- **Knowledge base: WORK_PROJECTS.md** — current project state and milestones
- **Knowledge base: EVOLUTION_LOG.md** — recent decisions and pending items
- **Knowledge base: Reference Architecture** — for AI OS technical planning context
- **MCP Gateway: get_domain_tree** — Life Graph domain context for domain-aware task creation
- **MCP Gateway: get_domain_tasks** — fetch active tasks per domain for dedup checking
- **MCP Gateway: get_domain_summary** — domain health scores for weighted prioritization
- **MCP Gateway: create_task** — task creation with domain_slug parameter for Life Graph tagging
- **MCP Gateway: insert_record** — persist approved plans as knowledge_entries for cross-session discovery
- **MCP Gateway: send_telegram_message** — push plan summary to Telegram for quick mobile reference
- **MCP Gateway: log_pipeline_run** — record skill execution for observability and analytics
