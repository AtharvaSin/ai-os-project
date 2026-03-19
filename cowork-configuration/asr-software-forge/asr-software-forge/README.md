# ASR Software Forge v2 — Claude Cowork Plugin

Two-mode software development system. **BUILD** bespoke applications from scratch with anti-slop design, or **CONTRIBUTE** to existing team repositories with proper branching, testing, and PRs.

## What Makes This Different

**For greenfield builds:** Most AI code generators produce generic output. The Forge enforces a thinking-before-building process — PRD, architecture decision, and UI design direction are committed before any code is written. An anti-slop checklist catches generic AI patterns and demands intentional design.

**For contributions:** Most AI tools ignore the existing codebase's conventions. The Forge ADAPTS — it detects the repo's code style, commit conventions, branching strategy, and testing approach, then works within those patterns. It produces clean PRs, not AI-flavored diffs.

## Two Modes

### BUILD Mode (Greenfield)
```
Phase 1: SPECIFY → Phase 2: SETUP → Phase 3: BUILD → Phase 4: REVIEW
   ↓                   ↓                 ↓                ↓
PRD + Design       Project init +    Scaffold +       Code + Design
Direction +        Git + Manifest    Frontend +        Quality Gate
Architecture                         Backend
```

### CONTRIBUTE Mode (Existing Repos)
```
Phase A: ONBOARD → Phase B: BRANCH & PLAN → Phase C: IMPLEMENT → Phase D: TEST → Phase E: PR
   ↓                    ↓                       ↓                   ↓              ↓
Clone + Analyze     Create branch +         Code changes       Run tests +     Create PR +
Detect conventions  Change plan             Match patterns     Lint + Build    Description
Codebase brief                                                 Checklist       Review help
```

Future phases (not yet built):
- Phase 0: DISCOVER — Deep research + competitive analysis + tech evaluation
- Phase 5: SHIP — Multi-cloud deployment configuration
- Phase 6: ITERATE — Contextual refinement with spec recall

## Skills

| Skill | Mode | Trigger | Output |
|-------|------|---------|--------|
| `specify-project` | BUILD | "spec this", "new project", "I want to build..." | PRD + architecture + design direction |
| `setup-project` | BUILD | "set up the project", "initialize" | Project directory + git + manifest |
| `scaffold-app` | BUILD | "build it", "scaffold", "create the app" | Complete deployable codebase |
| `review-project` | BUILD | "review", "quality check", "is it ready?" | Quality + design report |
| `contribute-repo` | CONTRIBUTE | "clone this repo", "work on", "contribute to", "create a PR" | Codebase brief → changes → tested PR |
| `refine-repo` | BOTH | "improve", "refactor", "fix" | Modified codebase + change report |
| `deploy-app` | BUILD | "deploy", "ship it" | Dockerfile + CI config + deployment docs |

## Commands

| Command | Usage |
|---------|-------|
| `/asr-software-forge:forge` | Smart orchestrator — detects BUILD vs CONTRIBUTE from input |
| `/asr-software-forge:build` | Quick-build from a one-line description |
| `/asr-software-forge:contribute` | Quick-start contribution to an existing repo |
| `/asr-software-forge:refine` | Refine an existing codebase |

## Agents

| Agent | Role |
|-------|------|
| `frontend-builder` | Builds UI with anti-slop design process, brand tokens, differentiation |
| `backend-builder` | Builds API + data layer with validation and structured error handling |
| `code-reviewer` | Build, lint, types, security, patterns |
| `design-reviewer` | Anti-slop audit, token compliance, differentiation verification |

## Project Structure

```
ai-os-project/
├── forge-projects/                    ← All project metadata (tracked here)
│   ├── {greenfield-project}/          ← project_type: "greenfield"
│   │   ├── manifest.json
│   │   └── specs/
│   │       ├── prd.md
│   │       ├── architecture.md
│   │       └── design-direction.md
│   └── {team-repo}/                   ← project_type: "contribution"
│       ├── manifest.json
│       ├── codebase-brief.md
│       └── prs/
│           └── feature-metrics/
│               ├── change-plan.md
│               └── test-checklist.md
│
└── cowork-configuration/
    └── asr-software-forge/            ← Plugin files (this directory)

C:\Users\ASR\...\implementations\
├── {greenfield-project}/              ← Your code (your repo)
│   ├── src/
│   ├── CLAUDE.md
│   └── Dockerfile
└── {team-repo}/                       ← Cloned code (team's repo, your branch)
    ├── src/
    └── ...
```

Key principles:
- **Thinking happens in ai-os-project. Code lives outside.**
- **Greenfield projects get your conventions. Contributions follow the team's conventions.**

## Stack Flexibility (BUILD Mode)

The Forge evaluates project requirements and selects the right stack:

| Layer | Options |
|-------|---------|
| Frontend | Next.js, Astro, SvelteKit, React+Vite, Tauri |
| Backend | FastAPI, Next.js API Routes, Hono |
| Database | PostgreSQL, SQLite, MongoDB, Supabase |
| Auth | NextAuth, Clerk, Supabase Auth, Custom JWT |
| Deploy | Vercel, Cloud Run, AWS, Azure, Railway, Fly.io, Cloudflare |
| CI/CD | GitHub Actions, Azure DevOps, GitLab CI, Cloud Build |

## Repo Host Support (CONTRIBUTE Mode)

| Host | Clone | PR Creation | Supported |
|------|-------|-------------|-----------|
| GitHub | `git clone` | `gh pr create` | Full |
| Azure DevOps | `git clone` | `az repos pr create` | Full |
| GitLab | `git clone` | `glab mr create` | Full |
| Bitbucket | `git clone` | Web UI | Clone + branch |

## Quality Gates

### BUILD Mode
- Build passes, TypeScript strict, no `any` types
- No hardcoded secrets, structured error handling
- Anti-slop checklist: 0 violations
- Differentiation decision visibly implemented
- All tokens applied, specified fonts rendering
- README, CLAUDE.md, .env.example complete

### CONTRIBUTE Mode
- All existing tests pass
- No new lint violations
- Build passes
- No debug code in PR
- PR description is reviewer-friendly
- Commits match repo's convention
- Changes stay in scope (no drive-by refactors)
