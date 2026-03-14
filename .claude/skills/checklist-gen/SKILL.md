# Skill: Checklist Generator

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks to create a checklist, QA list, launch checklist, deployment checklist, review checklist, or any step-by-step verification guide. Trigger phrases include: "create a checklist," "QA checklist for," "what do I need to check before," "pre-launch checklist," "deployment steps," "review checklist," or any request for a structured verification list.

---

## Process

### Step 1: Understand the Checklist Purpose
Determine:
- **What** is being checked? (a deployment, a launch, a review, a process, a quality gate)
- **When** is it used? (before action, during action, after action)
- **What's the risk of missing an item?** (helps prioritize critical vs nice-to-have items)

### Step 2: Pull Context
- If it's a **deployment checklist**, reference the Reference Architecture and BHARATVARSH_PLATFORM.md for infrastructure context
- If it's a **content launch checklist**, reference the AI&U Knowledge Pack or BHARATVARSH_BIBLE.md
- If it's a **project milestone checklist**, reference WORK_PROJECTS.md

### Step 3: Generate the Checklist
Structure every checklist with:

**Categories** — Group related items under clear headers. Never present a flat list of 20+ items.

**Priority markers:**
- 🔴 **Critical** — Blocking. Cannot proceed without this.
- 🟡 **Important** — Should be done. Skipping creates risk.
- 🟢 **Nice to have** — Do if time permits.

**Each item format:**
- [ ] Clear, actionable statement (verb + object)
- Context note if needed (one line max)

### Step 4: Deliver in Appropriate Format

**For quick operational checklists (< 20 items):**
Present directly in chat as a structured markdown list.

**For comprehensive checklists (20+ items or reusable):**
Produce as an interactive React artifact with:
- Checkbox toggling
- Category collapsing
- Progress counter ("12 of 18 completed")
- "Copy as markdown" button for export

---

## Checklist Templates by Common Use Case

### Deployment Checklist Pattern
- Pre-deployment: tests passing, environment variables set, secrets configured, backup taken
- Deployment: build, push, deploy, health check, canary verification
- Post-deployment: smoke test, monitoring check, rollback plan confirmed

### Content Launch Checklist Pattern
- Content: final proofread, brand voice check, links verified, CTAs working
- Platform: SEO metadata, thumbnail, scheduling, cross-platform links
- Distribution: social posts queued, email notification drafted, community seeded

### Sprint Review Checklist Pattern
- Deliverables: all items verified against sprint goals
- Documentation: Evolution Log updated, KB docs updated, decisions logged
- Next sprint: priorities identified, blockers flagged, dependencies mapped

---

## Quality Rules

- Every item must be a verifiable action, not a vague reminder. "Check the database" is bad. "Verify all migrations ran successfully via psql or Cloud SQL console" is good.
- Critical items should never exceed 30% of the total list. If they do, the process has too many failure points — suggest simplifying the process itself.
- Include a "post-completion" section for follow-up actions (monitoring, notifications, cleanup).
- The checklist should be usable by someone other than the creator — no assumed context.

---

## Connectors Used

- **Knowledge base** — domain-specific docs depending on checklist type
- **Artifacts** — React interactive checklist for comprehensive lists
