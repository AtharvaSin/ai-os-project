# Skill: KB Sync

> **Scope:** This skill operates within the AI Operating System project only. It manages synchronization between this Claude.ai project's knowledge base and the GitHub repository at github.com/AtharvaSin/ai-os-project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai only. For the Claude Code counterpart, see `/update-project-state` (scans filesystem, writes PROJECT_STATE.md) and `/sync-from-repo` (reads PROJECT_STATE.md, updates KB).

---

## When to Use

Activate this workflow when the user says "sync KB," "sync knowledge base," "push KB changes," "pull latest," "what's out of sync," "kb audit," "update project files," "sync to Claude Code," or "sync from Claude Code."

Also activate at the **end of any session** that modified or proposed changes to knowledge base documents — this includes new Evolution Log entries, updated project statuses, new skills, schema changes, or architecture decisions.

Also activate when the /weekly-review skill runs, as the KB MAINTENANCE section of that review.

---

## Architecture

**Single source of truth:** GitHub repo `AtharvaSin/ai-os-project`, branch `main`.

**Two sync mechanisms exist:**

| Mechanism | Direction | Where it runs |
|-----------|-----------|---------------|
| Claude.ai GitHub integration | GitHub → Claude.ai project KB | Claude.ai project settings → Sync now |
| Git push from Claude Code or terminal | Local edits → GitHub | `git commit && git push` |

**The sync loop between Claude Code and Claude.ai:**

```
Claude Code session:
  /update-project-state → scans filesystem → writes PROJECT_STATE.md
  → edits KB files → git commit → git push → GitHub updated

Claude.ai session:
  /kb-sync (this skill) → tells user to click Sync now
  → reads refreshed KB from GitHub
  → OR: drafts KB edits → user pushes to repo → clicks Sync now
```

**What Claude sees in this project:** Only the content loaded at last GitHub sync. Claude cannot detect whether the repo has newer commits. Staleness must be inferred from context.

**Relationship to existing skills:**
- `/update-project-state` (Claude Code) — Scans the actual filesystem and git history, writes `PROJECT_STATE.md`. This is the authoritative state generator.
- `/sync-from-repo` (Claude Code KB doc at `knowledge-base/SYNC_FROM_REPO.md`) — Reads `PROJECT_STATE.md` from the connected GitHub repo and reconciles this project's KB against it.
- `/kb-sync` (this skill) — The operational wrapper that handles all three sync directions and the session-close push workflow.

---

## Process

### Step 1: Determine the Situation

| Situation | Trigger | Action |
|-----------|---------|--------|
| **This session produced KB edits** | Session wrapping up, decisions made | Step 2A (Push) |
| **Repo was updated externally** | User says "I pushed changes" or "Claude Code session done" | Step 2B (Pull) |
| **Periodic health check** | User says "kb audit" or during /weekly-review | Step 2C (Audit) |

---

### Step 2A: Push — Get This Session's Edits into the Repo

**1. Identify every KB file that needs updating.**

Scan the session for changes across these files:

| Change type | Target files |
|-------------|-------------|
| Architecture decisions | EVOLUTION_LOG.md, INTERFACE_STRATEGY.md, TOOL_ECOSYSTEM_PLAN.md |
| Project status shifts | WORK_PROJECTS.md, PROJECT_STATE.md |
| New or updated skills | knowledge-base/skills/SKILL_*.md + .claude/skills/{name}/SKILL.md |
| Schema changes | DB_SCHEMA.md |
| Infrastructure changes | GCP_INFRA_CONFIG.md |
| Content plans | CONTENT_CALENDAR.md |
| Profile updates | OWNER_PROFILE.md |
| Project instructions changed | PROJECT_INSTRUCTIONS.md in repo (manual sync) |

**2. Generate the complete updated content.**

For each file, show a brief summary of what changed, then produce the full file content in a code block with the repo path:

```
File: knowledge-base/EVOLUTION_LOG.md
Changes: +Entry 007 (decision on X, Y built)
```

Then the complete file ready to replace.

**3. Provide the commit workflow:**

```bash
cd ~/ai-os-project
git pull origin main

# For each file, replace with the content above
# Example:
# Replace knowledge-base/EVOLUTION_LOG.md
# Replace knowledge-base/TOOL_ECOSYSTEM_PLAN.md

git add -A
git commit -m "KB sync: [one-line summary]"
git push origin main
```

**4. Remind to refresh Claude.ai:**

> Go to this project's settings → Knowledge → GitHub source → click **Sync now**. Updated content will be available in your next chat in this project.

**5. If the user is in Claude Code:** Offer to write the files directly. The user then only needs `git add -A && git commit -m "KB sync: ..." && git push origin main`, followed by Sync now in Claude.ai.

---

### Step 2B: Pull — Refresh This Project from Repo Updates

**1. Tell the user to sync:**

> Your repo has newer content. Go to project settings → Knowledge → GitHub source → click **Sync now**.

**2. If new files were added to the repo:**

> New files won't appear unless they're selected in the GitHub integration. Go to **Configure files** and select any new files (e.g., a new skill in `knowledge-base/skills/` or the new `PROJECT_STATE.md`).

**3. After sync, verify** by asking about specific content that should have changed:

> "Let me check — does the Evolution Log now show Entry 006 about the MCP Gateway build?"

**4. If the repo version is significantly ahead** (e.g., multiple Claude Code sessions happened):

> Run the /sync-from-repo skill logic: read `PROJECT_STATE.md` from the now-synced KB, compare against what other KB docs claim, and flag any documents that are stale relative to the state snapshot.

---

### Step 2C: Audit — Full Sync Health Check

**1. Enumerate all expected files.**

The canonical file inventory (from repo `knowledge-base/` as of 2026-03-15):

**Core System (8 files):**
OWNER_PROFILE.md, EVOLUTION_LOG.md, WORK_PROJECTS.md, PROJECT_STATE.md, DB_SCHEMA.md, GCP_INFRA_CONFIG.md, TOOL_ECOSYSTEM_PLAN.md, INTERFACE_STRATEGY.md

**Novel & Creative (4 files):**
BHARATVARSH_BIBLE.md, BHARATVARSH_PLATFORM.md, CONTENT_CALENDAR.md, MARKETING_PLAYBOOK.md

**Skills (17+ files):**
All SKILL_*.md in skills/ subdirectory, plus SYNC_FROM_REPO.md. Currently: morning-brief, deep-research, draft-email, session-resume, action-planner, build-prd, decision-memo, checklist-gen, weekly-review, bharatvarsh-content, social-post, workflow-designer, tech-eval, competitive-intel, visual-artifact, kb-sync.

**Profile Context Pack (4 files):**
profile-context-pack/00 through 03.

**AI&U Knowledge Pack (3 files):**
aiu-knowledge-pack/01 through 03.

**Bharatvarsh Website Docs (4 files):**
bharatvarsh-website-docs/ (architectural_overview, gcp_deployment_guide, services_and_configuration, user_experience_and_goals).

**Assets (3 files):**
Architectures.pdf, Life_Graphpng.png, tool-ecosystem-blueprint.jsx.

**NOT synced via GitHub (manual):**
Project Instructions ↔ PROJECT_INSTRUCTIONS.md in repo root.
CLAUDE.md ↔ Claude Code reads from repo root.

**2. Check each file's presence** in the current project KB using project_knowledge_search.

**3. Assess staleness using PROJECT_STATE.md.**

If loaded, read its Quick Reference table, Drift Report, Change Log, and Next Actions. Cross-reference against other KB docs. Flag discrepancies.

**4. Produce the audit report:**

```
KB SYNC AUDIT — [date]
State version: [from PROJECT_STATE.md]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ PRESENT & LIKELY CURRENT ([count]):
  [files confirmed in project KB]

⚠ POTENTIALLY STALE:
  [files where PROJECT_STATE.md or session history
   suggests updates haven't been pulled]
  → Action: click Sync now, or push updates first

✗ MISSING FROM PROJECT KB:
  [files in repo but not loaded here]
  → Action: Configure files in GitHub integration

📋 MANUAL SYNC:
  • Project Instructions ↔ PROJECT_INSTRUCTIONS.md
  • CLAUDE.md — check if sprint focus is stale

DRIFT ALERTS (from PROJECT_STATE.md):
  [any drift items from the state snapshot]
```

**5. Offer fixes:** Generate updated content for stale docs, provide push workflow.

---

## Sync Frequency

| Trigger | Direction | When |
|---------|-----------|------|
| Session produced KB edits | Push | End of session |
| Claude Code session completed | Pull | Start of next Claude.ai session |
| Weekly review | Full Audit | During /weekly-review |
| Major architecture decision | Push | Immediately |
| New skill created | Push + Configure files | After file committed |
| Before morning brief | Quick pull check | If last sync >24 hours ago |

---

## Output Format

**Push:** Complete file content in code blocks with repo paths. Brief diff summary before each. Commit command at end.

**Pull:** Short instruction to click Sync now. Verification question afterward.

**Audit:** Structured report, then actionable next steps.

All outputs concise. This is operational, not a report.

---

## Quality Rules

- **Always pull before push.** First line of every push workflow: `git pull origin main`.
- **Generate complete files, not patches.** User replaces entire file.
- **Show what changed before full content.** 3-line summary for verification.
- **Commit messages:** `KB sync: [brief description]`.
- **Flag Project Instructions drift** after sessions changing architecture, connectors, skills, or workstreams.
- **New files need explicit selection** in GitHub integration's Configure files.
- **Binary files can't be generated here.** Flag for manual handling.
- **PROJECT_STATE.md is authority on what's real.** Generated from filesystem scans — trust it over other KB docs if they conflict.
- **Update file inventory** in Audit section when new files are added.
- **Suggest proactively.** If user mentions a Claude Code session just ended, offer pull sync.

---

## Connectors Used

- **Knowledge base: All KB documents** — read current state, detect staleness (required)
- **Knowledge base: PROJECT_STATE.md** — authoritative state from filesystem scan
- **Knowledge base: EVOLUTION_LOG.md** — identify recent changes (required)
- **Knowledge base: WORK_PROJECTS.md** — check project status consistency
- **Past chats search** — find recent sessions that produced KB changes
- **GitHub integration** — source of truth, synced into project knowledge
