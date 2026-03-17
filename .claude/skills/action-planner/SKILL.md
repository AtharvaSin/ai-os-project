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

### Step 2: Gather Current State
Before planning forward, establish where things stand:
- Pull the relevant project's **current status and next milestone** from WORK_PROJECTS.md
- Check **Evolution Log** for recent decisions or pending items in this domain
- Check **Google Calendar** for any time constraints, deadlines, or upcoming commitments that affect the plan
- Search **past chats** for any commitments or action items from recent sessions
- Call `get_domain_tree()` to understand the current Life Graph domain distribution. Identify which domain(s) the planned work maps to (e.g., 'managing_ai_os', 'networking', 'health'). This ensures tasks are tagged with the correct life domain when created.

### Step 3: Break Down into Tasks
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

### Step 4: Identify Automation Candidates
Scan the task list for anything that could become a repeatable workflow:
- Tasks that will recur → flag as potential **Category B scheduled workflow**
- Tasks involving multi-step reasoning or tool use → flag as potential **Category C agentic workflow**
- Tasks that are one-time but complex → flag for **Claude Code** execution

This is how the AI OS grows — every planning session is an opportunity to spot patterns worth automating.

### Step 5: Sequence and Present

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

### Step 6: Connect to Downstream Systems
After presenting the plan:
- Ask if any tasks should be added as **Calendar events** (offer to create them)
- Ask if the plan should be logged in the **Evolution Log**
- Flag any items that should update **WORK_PROJECTS.md** (e.g., "next milestone" has changed)
- If automation candidates were identified, ask if the user wants to design any as workflows in a follow-up session

---

## Output Format

For quick plans (< 10 tasks): Present directly in chat as a structured response.

For comprehensive plans (10+ tasks): Produce as a downloadable artifact — markdown for internal reference, docx for shareable deliverables.

Always end with: "Want me to create Calendar events for any of these, or log this plan in the Evolution Log?"

---

## Quality Rules

- Every task must pass the "could someone execute this without asking a follow-up question?" test. If not, it's too vague — break it down further.
- Time estimates should be realistic, not optimistic. Factor in context-switching, setup time, and iteration.
- Don't create plans with 20+ tasks for a single week. If the scope is that large, break into phases and plan the first phase in detail.
- P0 items should never exceed what can realistically be done in the timeframe. If they do, force a prioritization conversation.
- Always check the calendar before suggesting a day plan — don't propose 6 hours of deep work on a day with 4 hours of meetings.
- The plan should feel empowering, not overwhelming. If the user's reaction would be "this is too much," the plan needs simplification.

---

## Connectors Used

- **Google Calendar** — check for time constraints and offer to create events
- **Past chats search** — find commitments from recent sessions
- **Knowledge base: WORK_PROJECTS.md** — current project state and milestones
- **Knowledge base: OS_EVOLUTION_LOG.md** — recent decisions and pending items
- **Knowledge base: Reference Architecture** — for AI OS technical planning context
- **MCP Gateway: get_domain_tree** — Life Graph domain context for domain-aware task creation
- **MCP Gateway: create_task** — task creation with domain_slug parameter for Life Graph tagging
