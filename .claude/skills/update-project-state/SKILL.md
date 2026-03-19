---
name: update-project-state
description: "Scan codebase and infrastructure to generate an authoritative PROJECT_STATE.md snapshot. Use when user says update state, sync state, what's built, project status, state check, or before starting a new work session."
---

# Skill: Update Project State

> **Scope:** This skill operates within the AI Operating System project only. It scans the actual filesystem, git history, and optionally live deployments to produce a single authoritative state snapshot.
>
> **Type:** Execution skill — Claude Code scans, computes, and writes files when triggered.
>
> **Runtime:** Claude Code only (requires filesystem access, git, optional gcloud).

---

## When to Use

Activate this skill when:
- The user explicitly asks to update, sync, or check project state
- The user says "what's built," "what's the current state," "project status," or "state check"
- Before a major planning or weekly-review session (run proactively if state file is >7 days old)
- After completing a significant build session (new module deployed, migration applied, etc.)
- The user asks "what changed" or "what's different since last time"

Do NOT activate mid-task when the user is actively building something — wait until the work is done.

---

## Process

### Step 1: Scan the Actual Codebase

Use filesystem tools (Glob, Read, ls) to verify what physically exists. Check each area:

**A. Skills & Commands**
- Count directories in `.claude/skills/` — each directory = one skill
- Check `.claude/commands/` for any custom commands

**B. MCP Gateway**
- Check `mcp-servers/ai-os-gateway/app/modules/` — list all .py files
- For each module, read the first 50 lines to determine if it's a full implementation or a stub (look for `raise NotImplementedError`, `# TODO`, `# STUB`, or placeholder return values)
- Check `mcp-servers/ai-os-gateway/Dockerfile` exists
- Check `mcp-servers/ai-os-gateway/cloudbuild.yaml` exists

**C. Database**
- List files in `database/migrations/` — count applied migrations
- Check `knowledge-base/DB_SCHEMA.md` for table count

**D. Cloud Functions (Category B)**
- Check `workflows/category-b/` — list subdirectories
- For each, check if main.py exists and if it looks complete

**E. LangGraph Workflows (Category C)**
- Check `workflows/category-c/` — list contents
- Determine if any actual workflow code exists (vs README-only)

**F. Dashboard**
- Check if `dashboard/` directory exists and has code

**G. Knowledge Base**
- List all files in `knowledge-base/` — count documents
- Note any subdirectories and their contents

**H. Infrastructure Files**
- Check for Dockerfile, cloudbuild.yaml, deployment configs
- Check `.env.example` exists

**I. Life Graph & Google Tasks Alignment**
- Query `life_domains` table via MCP (`query_db`) to get current domain count, numbers, statuses
- Check all active numbered domains have `google_task_list_id` in metadata (via `query_db`)
- Verify domain numbers are sequential and no gaps exist in active domains
- Flag any active domain without a `domain_number` (drift: domain exists but invisible in Google Tasks)
- Flag any domain with `domain_number` but no `google_task_list_id` in metadata (drift: domain numbered but not synced)
- Check `google_tasks.py` docstrings match current domain range (e.g., "001-011" not stale "001-010")
- If misalignment is detected, flag it in the Drift Report and recommend running `reset_task_lists` + `sync_tasks_to_db`

### Step 2: Check Git State

Run these git commands to understand recent activity:
- `git log --oneline -20` — recent commits
- `git log --since="7 days ago" --oneline` — this week's work
- `git diff --stat HEAD~5` — recent file changes (if fewer than 5 commits, adjust)

### Step 3: Cross-Reference Documented State

Read these knowledge-base files:
- `knowledge-base/EVOLUTION_LOG.md` — latest entry's "Next Steps" checklist
- `knowledge-base/WORK_PROJECTS.md` — "What's been built" section
- `knowledge-base/TOOL_ECOSYSTEM_PLAN.md` — planned modules and phases
- `knowledge-base/INTERFACE_STRATEGY.md` — planned phases (if exists)

For each "Next Steps" item in the Evolution Log:
- Check if filesystem evidence shows it's been done
- Mark as: DONE (evidence found), IN PROGRESS (partial evidence), NOT STARTED (no evidence), BLOCKED (evidence of blocker)

### Step 4: Detect Drift

Compare what's documented vs what actually exists:
- Items claimed as "built" in WORK_PROJECTS.md but missing from filesystem = **OVERCLAIMED**
- Items in filesystem but not documented = **UNDOCUMENTED**
- Status descriptions that don't match reality = **STALE**

### Step 5: Compute State Categories

Classify everything into exactly these categories:

1. **LIVE** — Code exists AND is deployed/working (verified or high confidence)
2. **BUILT** — Code exists but NOT deployed yet
3. **STUB** — Code exists but is placeholder/incomplete
4. **IN PROGRESS** — Partially built, needs more work
5. **PLANNED** — Documented in architecture/plans but no code
6. **BLOCKED** — Can't proceed without an external action (credential setup, approval, etc.)

### Step 6: Generate PROJECT_STATE.md

Write to `knowledge-base/PROJECT_STATE.md` using the exact template in the Output Format section below. This file is the single source of truth for "what's real right now."

### Step 7: Update WORK_PROJECTS.md

Update the AI Operating System section in `knowledge-base/WORK_PROJECTS.md`:
- Update the `Status:` line to reflect current reality
- Update the `Current phase:` line
- Update the `Next milestone:` line
- Update the `What's been built:` section
- Update the `Pending decisions:` list
- Update the `Last updated:` timestamp in the file header

### Step 8: Update Knowledge Base Files

Scan all knowledge-base/*.md files for stale counts or references that conflict with the newly computed state. Common drift targets:
- **TOOL_ECOSYSTEM_PLAN.md** — Module inventory table, tool counts, module status, "Last updated" line
- **GCP_INFRA_CONFIG.md** — Cloud Run services table, service counts, scheduler jobs, "Last updated" line
- **INTERFACE_STRATEGY.md** — Skills count, dashboard spec, component counts
- **DB_SCHEMA.md** — Table count, migration count (only update the "Last updated" / overview section, not individual table schemas)
- **EVOLUTION_LOG.md** — Add a new entry for the current sprint/build if significant changes occurred
- **CAPTURE_GUIDE.md**, **LIFE_GRAPH.md**, **BRAND_IDENTITY.md** — Check for stale cross-references
- **LIFE_GRAPH.md** — Domain count, domain hierarchy, skill integration section (domain count in /morning-brief), "Adding New Domains" section (next available domain number), archived domain status

Update these files directly with the corrected counts and references.

**Life Graph & Google Tasks reconciliation:**
After updating KB files, compare the Life Graph domain state (from Step 1.I scan) against what the KB files claim. Common drift:
- KB says "10 domains" but DB has 11 → update all domain count references
- KB domain hierarchy doesn't include new domains → update hierarchy diagram
- google_tasks.py docstrings say "001-010" but DB has 011 → update docstrings
- PROJECT_INSTRUCTIONS.md notification rails section says "10 lists" → update to match DB

### Step 9: Update CLAUDE.md Files

Check the root `CLAUDE.md` (project-level, at repo root) for any sections that reference project state — tool counts, module counts, table counts, skills count, dashboard pages/routes/components, Telegram commands, Cloud Run services, sprint info, directory structure comments. Update these directly to match the newly verified state.

Also check `C:\Users\ASR\CLAUDE.md` (the parent directory CLAUDE.md used by the RAKBANK project) — this file should NOT be modified as it belongs to a different project.

### Step 10: Update PROJECT_INSTRUCTIONS.md

Update `PROJECT_INSTRUCTIONS.md` at the repo root with all state changes. This file is the Claude.ai project's primary context document and must reflect the latest verified state. Update these sections:
- **Knowledge Base — Source of Truth** — Version numbers, entry counts, file descriptions
- **Architecture & Orchestration** — Tool counts, service counts, pipeline lists
- **Technology Stack** — Layer descriptions with current counts
- **Tool Ecosystem** — Module inventory, tool counts per module
- **Dashboard Service** — Page count, API route count, component count
- **Telegram Integration** — Command count and list
- **MCP Connector Usage** — Total tool count, add new module sections if needed
- **Current Build State** — Sprint info, phase completion status
- **Current Priorities** — Update based on what's now complete vs still pending
- **Active Focus Projects** — Summary line with current counts
- **Knowledge Base Contents** — Skills count, new KB docs
- **Session Protocol** — Phase check reference, state version
- Any section-specific counts (e.g., "40 tools via AIOSMCP connector")

### Step 11: Report to User

Present a concise summary:
- What changed since last state update
- Any drift detected (overclaimed, undocumented, stale)
- Files updated (list each file and what was changed)
- Current blockers
- Suggested next actions (top 3)

---

## Output Format

### PROJECT_STATE.md Template

```markdown
# Project State — AI Operating System

> **Auto-generated by /update-project-state**
> **Last updated:** YYYY-MM-DD
> **Last git commit:** [short hash] [commit message]
> **State version:** [increment each time]

---

## Quick Reference

| Area | Status | Details |
|------|--------|---------|
| Skills & Connectors | [count] skills, [count] connectors | All operational |
| MCP Gateway | [LIVE/DOWN] | [X] tools ([Y] live, [Z] stubs) |
| Database | [LIVE/DOWN] | [X] tables, [Y] migrations |
| Cloud Functions | [DEPLOYED/BUILT/PLANNED] | [details] |
| Dashboard PWA | [LIVE/PLANNED/NOT STARTED] | [details] |
| CI/CD | [ACTIVE/INACTIVE] | [details] |

---

## LIVE (Deployed & Working)

### Category A: Claude Interface
- [x] [count] skills in .claude/skills/ — [list names]
- [x] Gmail connector — connected
- [x] Google Calendar connector — connected
- [x] Google Drive connector — connected (read-only)

### Tier 2: MCP Gateway (Cloud Run)
- Service: [service name], [region]
- Image: [registry path]:[version]
- **Live modules:**
  - [x] [module name] — [tool count] tools ([list tool names])
- **Stub modules (deployed but non-functional):**
  - [ ] [module name] — [tool count] stubs (blocked on: [reason])

### Database (Cloud SQL)
- Instance: [instance name]
- Database: [db name]
- Tables: [count] across [count] domains
- Migrations applied: [list migration numbers]
- Extensions: [list]

### Infrastructure
- GCP Project: [project ID] ([region])
- Service Accounts: [count] ([list names])
- Secrets: [count] in Secret Manager
- Artifact Registry: [registry path]
- CI/CD: [trigger name] — [status]

---

## BUILT (Code Exists, Not Deployed)

- [ ] [item] — Location: [path]. Ready to deploy: [yes/no]. Blocking: [reason if any]

---

## IN PROGRESS (Partially Built)

- [ ] [item] — What exists: [description]. What's missing: [description]

---

## PLANNED (Architecture Defined, No Code)

### Phase [X]: [Name] (Estimated: [timeframe])
- [ ] [item] — Defined in: [KB doc]. Dependencies: [list]

### Phase [Y]: [Name] (Estimated: [timeframe])
- [ ] [item] — Defined in: [KB doc]. Dependencies: [list]

---

## BLOCKED (Waiting on External Action)

| Item | Blocked On | Owner | Impact |
|------|-----------|-------|--------|
| [item] | [what's needed] | [who needs to do it] | [what can't proceed without this] |

---

## Drift Report

### Overclaimed (Documented as built, but not found)
- [item] — Claimed in [file], not found at [expected path]

### Undocumented (Found in codebase, not in docs)
- [item] — Found at [path], not mentioned in [relevant KB doc]

### Stale References
- [file]:[line range] — Says "[old text]", should say "[new text]"

---

## Next Actions (Priority Order)

1. **[Action]** — [Why now]. [Estimated effort]. [Unblocks: what]
2. **[Action]** — [Why now]. [Estimated effort]. [Unblocks: what]
3. **[Action]** — [Why now]. [Estimated effort]. [Unblocks: what]

---

## Change Log

| Date | State Version | Changes |
|------|--------------|---------|
| YYYY-MM-DD | vN | [what changed] |
```

---

## Quality Rules

- **Never fabricate state.** If you can't verify something (e.g., can't reach gcloud), mark it as UNKNOWN with a note, don't guess.
- **Filesystem is truth.** If the file exists, it's built. If it doesn't, it's not. Documentation claims don't override filesystem reality.
- **Be specific.** "PostgreSQL module live with 6 tools (query_db, insert_record, update_record, get_schema, search_knowledge, log_pipeline_run)" not "PostgreSQL module live."
- **Stub detection matters.** A module with `raise NotImplementedError` is a STUB, not BUILT. Read the code to verify.
- **Preserve the change log.** When updating PROJECT_STATE.md, append to the change log at the bottom — don't replace previous entries.
- **Keep it scannable.** The entire file should be digestible in 2 minutes. Use tables and checklists, not paragraphs.
- **Date everything.** Always use YYYY-MM-DD format. Convert relative dates to absolute.
- **Flag blockers clearly.** A blocked item should say WHO needs to do WHAT. "Blocked on OAuth" is useless. "Blocked on: Atharva needs to create Google OAuth credentials in GCP Console and configure consent screen" is useful.
- **Don't update CLAUDE.md automatically.** CLAUDE.md files are manually maintained. Flag staleness but don't edit them without user approval.
- **Idempotent.** Running this skill twice in a row should produce the same output (assuming no changes in between).

---

## Connectors Used

- **Filesystem (Glob, Read, ls)** — required for codebase scanning
- **Git (Bash)** — required for commit history and recent changes
- **Knowledge base files** — required for cross-referencing documented state
- **MCP tools (query_db)** — required for Life Graph domain verification, Google Tasks alignment check, and live DB state
- **MCP tools (reset_task_lists, sync_tasks_to_db)** — only if misalignment detected and user approves corrective action
- **gcloud CLI (Bash, optional)** — for verifying deployment status. If gcloud is not available or not authenticated, skip deployment verification and mark deployment status as UNVERIFIED

---

## Integration with Other Skills

This skill's output (`PROJECT_STATE.md`) is consumed by:
- **`/morning-brief`** — Uses Quick Reference table for PROJECT PULSE section
- **`/session-resume`** — Uses full state for context recovery
- **`/weekly-review`** — Uses change log and drift report for retrospective
- **`/action-planner`** — Uses BLOCKED and PLANNED sections for task decomposition

**Sync loop between Claude Code and Claude.ai:**

```
Claude Code                          Claude.ai
    │                                    │
    ├─ /update-project-state             │
    │   ├─ Scans filesystem              │
    │   ├─ Checks git history            │
    │   ├─ Detects drift                 │
    │   └─ Writes PROJECT_STATE.md       │
    │        │                           │
    │        └──── git commit + push ────┤
    │                                    │
    │                              /kb-sync
    │                       (SKILL_KB_SYNC.md)
    │                        ├─ Pull: refreshes Claude.ai KB from repo
    │                        ├─ Push: gets session edits into the repo
    │                        └─ Audit: full KB health check
    │                                    │
    └──── next Claude Code session ──────┘
```

After running `/update-project-state`, suggest the user run `/kb-sync` in Claude.ai to consume the updated `PROJECT_STATE.md` and reconcile all KB documents against the latest repo state.
