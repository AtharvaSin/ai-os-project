---
description: Master orchestrator for the Software Forge workflow. Two modes — BUILD (greenfield, Specify → Setup → Build → Review) and CONTRIBUTE (existing repos, Onboard → Branch → Implement → Test → PR). Usage — /asr-software-forge:forge [project description or repo URL]. Examples — /asr-software-forge:forge A SaaS dashboard for tracking invoices — /asr-software-forge:forge https://dev.azure.com/zealogics/portal/_git/dashboard Fix the auth timeout bug
---

# Forge — Master Orchestrator

Two modes of operation, automatically detected from input:

**BUILD mode** — Greenfield. You describe a product, the forge specifies, scaffolds, and reviews it.
**CONTRIBUTE mode** — Existing repo. You provide a repo URL/name and a task, the forge onboards, branches, implements, tests, and creates a PR.

## Parse Input

Extract from $ARGUMENTS:
1. **Mode detection:**
   - If input contains a git URL (github.com, dev.azure.com, gitlab.com, bitbucket.org) → **CONTRIBUTE mode**
   - If input references an existing forge-project with `project_type: "contribution"` → **CONTRIBUTE mode (resume)**
   - If input describes a new product/idea → **BUILD mode**
   - If ambiguous, ask: "Are you building something new or working on an existing repo?"
2. **For BUILD mode:** product idea, key features, constraints, target users
3. **For CONTRIBUTE mode:** repo URL/name, task description, ticket ID (if mentioned)

## Execution Flow — BUILD Mode (Greenfield)

### Phase 1: Specify
Invoke the `specify-project` skill with the parsed input.

Wait for spec completion. The following files must exist before proceeding:
- `forge-projects/{slug}/specs/prd.md`
- `forge-projects/{slug}/specs/architecture.md`
- `forge-projects/{slug}/specs/design-direction.md`

At the end of Phase 1, present a summary to the user:
```
SPEC COMPLETE: {project name}
Stack: {from architecture.md}
Pages: {count from page inventory}
P0 Requirements: {count}
Design: {archetype} with {differentiation}

Ready to proceed to Setup + Build? (Y to continue, or provide feedback to refine specs)
```

Wait for user confirmation before proceeding. The user may want to adjust specs.

### Phase 2: Setup
Invoke the `setup-project` skill.

This creates the project directory at:
```
C:\Users\ASR\OneDrive\Desktop\Zealogics Work\Projects\implementations\{slug}\
```

Wait for setup completion. The project directory must exist with:
- CLAUDE.md
- .env.example
- .gitignore
- Initial git commit

### Phase 3: Build
Invoke the `scaffold-app` skill, which reads the forge specs and builds the application.

This is the longest phase. The skill handles:
1. Dependency installation
2. Design system setup (tokens → Tailwind → CSS variables)
3. Data layer (schema, migrations, seeds)
4. API layer (routes, validation, auth)
5. UI layer (components, pages, responsive layout)
6. Infrastructure (Dockerfile, docker-compose)
7. Build verification

### Phase 4: Review
Invoke the `review-project` skill for the quality gate.

Present the verdict to the user:

**If SHIP:**
```
FORGE COMPLETE: {project name}

Quality Report: SHIP
Build: PASSING
Design: {archetype} ALIGNED
Anti-Slop: {score}/10
Requirements: {coverage}

The project is at: {code_path}
Specs are at: forge-projects/{slug}/

Next steps:
1. Set up a git remote: git remote add origin {your-repo-url}
2. Push: git push -u origin main
3. Run /asr-software-forge:deploy when ready to ship to production
```

**If FIX REQUIRED:**
```
REVIEW FLAGGED {count} ISSUES

Blocking:
{numbered list}

I can fix these now. Proceed? (Y to fix, or address manually)
```

If the user says yes, fix the blocking issues and re-run the review.

## Execution Flow — CONTRIBUTE Mode (Existing Repos)

When a repo URL or existing contribution project is detected:

### Phase A: Onboard
Invoke the `contribute-repo` skill starting at Phase A.

Clone the repo (or navigate to existing clone), analyze the codebase, detect conventions, and produce a codebase brief.

Present the brief to the user:
```
REPO ONBOARDED: {repo name}
Stack: {detected stack}
Conventions: {key conventions detected}
Branching: {branching strategy}
Build: {build command}
Test: {test command}

What do you want to work on?
```

If the user already provided a task in the arguments, proceed to Phase B.

### Phase B: Branch & Plan
Create a working branch following the repo's naming convention. Analyze the task and produce a change plan.

Present the plan:
```
CHANGE PLAN: {branch name}
Files to modify: {count}
Files to create: {count}
Approach: {brief summary}

Proceed with implementation? (Y to start, or refine the plan)
```

Wait for user confirmation.

### Phase C: Implement
Make the changes following the repo's existing patterns. Commit progressively with messages matching the repo's convention.

### Phase D: Test & Verify
Run existing test suite, linting, and build. Generate a manual testing checklist for the user.

```
IMPLEMENTATION COMPLETE: {branch name}

Tests: {PASSING / FAILING}
Lint: {CLEAN / {n} issues}
Build: {PASSING / FAILING}

Manual testing checklist ready. Review it, then confirm to create PR.
```

### Phase E: Pull Request
Create the PR with a comprehensive description, testing checklist, and screenshots guidance.

```
PR CREATED: {url}
Branch: {branch} → {target}
Status: Ready for review

Share with the team. I can help address review feedback — just paste the comments.
```

### Handling Review Feedback
When the user returns with review comments:
1. Load the existing PR context from forge-projects/
2. Address each comment
3. Push updates
4. Help respond to reviewer comments

## Workflow State Tracking

The forge orchestrator tracks state via `forge-projects/{slug}/manifest.json`:

```json
{
  "name": "Project Name",
  "slug": "project-slug",
  "one_liner": "What it does",
  "phase": "specified | setup-complete | built | reviewed | shipped",
  "created_at": "ISO date",
  "updated_at": "ISO date",
  "code_path": "absolute path to project",
  "git_remote": null,
  "specs": {
    "prd": true,
    "architecture": true,
    "design_direction": true,
    "competitive_scan": false
  },
  "build": {
    "status": "passing | failing",
    "pages_built": 0,
    "api_endpoints": 0
  },
  "review": {
    "verdict": "ship | fix-required",
    "anti_slop_score": "0/10",
    "design_compliance": "aligned | drifted | violated"
  },
  "stack": {
    "frontend": "",
    "backend": "",
    "database": "",
    "deployment": ""
  }
}
```

## Resuming a Forge Session

If the user runs `/forge` without arguments:
1. List all existing forge projects from `forge-projects/*/manifest.json`
2. Show their current phase and status
3. Ask which project to resume (or start a new one)

If the user runs `/forge {slug}` where the slug already exists:
1. Load the manifest
2. Resume from the current phase
3. Skip completed phases unless the user asks to redo them

## Quick Modes

If the user wants to skip phases:

- "Just build it" → Skip Phase 1 (specify), infer from description, go straight to Setup + Build
- "I have a PRD" → Skip Step 3 of Phase 1, use provided PRD, still do design direction
- "I have the code, just review it" → Skip to Phase 4 (review)

Always honor the user's urgency, but note in the build report what was skipped.

## Error Recovery

If any phase fails:
1. Save current state to manifest.json
2. Report what happened and what's needed to recover
3. The user can fix manually and resume, or ask Claude to fix

Never lose state. The manifest is the single source of truth for where the project stands.
