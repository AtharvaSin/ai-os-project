# AI Operating System — Claude Code Context

## Project Overview
This is Atharva Singh's AI-enabled Personal Operating System. This directory is the execution layer — where code gets written, workflows get built, infrastructure gets deployed, and the OS grows.

The OS operates across TWO interfaces:
- **Claude.ai project** — The thinking interface. Brainstorming, research, planning, content, emails, artifacts. Has connectors (Gmail, Calendar, Drive), past chats search, and interactive artifacts.
- **Claude Code (this)** — The execution interface. Writing code, deploying infrastructure, multi-file edits, git, MCP servers, testing. Has terminal access, sub-agents, hooks, and local MCP.

If a task in this CLI session shifts to brainstorming, content drafting, email composition, or connector-dependent work (Gmail search, Calendar checks), suggest switching to Claude.ai: *"This would be better in Claude.ai where you have Gmail/Calendar connectors and artifact rendering. Switch to the web interface."*

## Owner
Atharva Singh — AI & Cloud Product Leader, incoming TPM at Zealogics Inc.
Based in Hyderabad, India. Full profile in `knowledge-base/OWNER_PROFILE.md`.

## Architecture (Three Categories)
- **Category A** — Claude.ai chat project + Claude Code CLI (primary interface, 60-70% of work). Skills and knowledge base.
- **Category B** — Cloud Functions (Gen 2) + Cloud Scheduler. Rigid scheduled pipelines. Plain Python + Anthropic API.
- **Category C** — LangGraph on FastAPI + Cloud Run. Conditional logic, multi-step agents, human-in-the-loop.

## Tech Stack
- **Cloud:** GCP (Cloud Run, Cloud Functions, Cloud Build, Vertex AI, Cloud Scheduler, Pub/Sub)
- **Backend:** FastAPI, Python 3.12
- **Orchestration:** LangGraph (Category C only)
- **Database:** Supabase (PostgreSQL + pgvector), Neo4j AuraDB (deferred)
- **Frontend:** Next.js, React, Tailwind (Bharatvarsh website already live)
- **AI Models:** Claude Sonnet 4.6 (default), Opus 4.6 (complex reasoning), Haiku 4.5 (classification)
- **MCP:** Gmail, Calendar, Drive (connected in Claude.ai). Supabase, Bharatvarsh Lore (to build as custom MCP).

## Directory Structure
```
ai-os-project/
├── CLAUDE.md                 ← You're reading this
├── knowledge-base/           ← Mirror of Claude.ai project KB docs
│   ├── OWNER_PROFILE.md
│   ├── WORK_PROJECTS.md
│   ├── OS_EVOLUTION_LOG.md
│   ├── BHARATVARSH_BIBLE.md
│   ├── BHARATVARSH_PLATFORM.md
│   ├── CONTENT_CALENDAR.md
│   ├── MARKETING_PLAYBOOK.md
│   ├── Architectures.pdf
│   ├── Life_Graphpng.png
│   ├── profile-context-pack/    ← 4 career/profile deep-context files
│   ├── aiu-knowledge-pack/      ← 3 AI&U channel strategy files
│   └── bharatvarsh-website-docs/ ← 4 website architecture files
├── .claude/skills/           ← 15 skills (Claude Code auto-discovers)
│   ├── morning-brief/
│   ├── deep-research/
│   ├── draft-email/
│   ├── session-resume/
│   ├── action-planner/
│   ├── build-prd/
│   ├── decision-memo/
│   ├── checklist-gen/
│   ├── weekly-review/
│   ├── bharatvarsh-content/
│   ├── social-post/
│   ├── workflow-designer/
│   ├── tech-eval/
│   ├── competitive-intel/
│   └── visual-artifact/
├── scripts/                  ← Shared utility scripts
├── workflows/                ← Category B & C workflow code
│   ├── category-b/           ← Cloud Functions (scheduled)
│   └── category-c/           ← LangGraph + FastAPI (agentic)
├── mcp-servers/              ← Custom MCP server builds
│   ├── supabase-mcp/
│   └── bharatvarsh-lore-mcp/
├── infra/                    ← GCP infrastructure (Terraform, Dockerfiles)
└── docs/                     ← Architecture docs, guides, decisions
```

## Interface Routing for Claude Code

### Tasks to handle HERE (Claude Code):
- Writing Python scripts, FastAPI endpoints, LangGraph graphs
- Creating/editing multiple files across the project
- GCP deployment (Cloud Run, Cloud Functions, Docker builds)
- Git operations (commit, push, branch, PR)
- MCP server development and testing
- Database schema creation and migration scripts
- Running and debugging scripts
- Infrastructure configuration (Terraform, Dockerfiles, cloudbuild.yaml)
- Installing packages, managing dependencies

### Tasks to redirect to Claude.ai:
- Morning briefs, weekly reviews (need Gmail + Calendar connectors)
- Email drafting (needs Gmail connector + message compose tool)
- Research with web search (Claude.ai has built-in web search)
- Content brainstorming and iterative refinement
- Interactive visual artifacts (React/HTML rendered inline)
- Any task requiring past chats search across project history
- Bharatvarsh marketing content review and iteration

## Active Projects
1. **AI Operating System** — Phase 1. Building Category A interface + first Category B workflow.
2. **AI&U YouTube** — Pre-launch. Content system designed. First 10-video library in progress.
3. **Bharatvarsh** — Published. Website live at welcometobharatvarsh.com. Marketing phase.

## Coding Standards
- Python: 3.12+, type hints, docstrings, f-strings. Use `ruff` for linting.
- TypeScript: strict mode. Next.js App Router patterns.
- All functions: clear input/output contracts. No magic values.
- Error handling: explicit try/catch, structured logging, graceful degradation.
- Secrets: never hardcode. Use `.env` locally, GCP Secret Manager in production.
- Docker: multi-stage builds, non-root user, minimal images.

## Model Routing
When calling the Anthropic API in code:
- `claude-sonnet-4-6` — Default. All standard workflows. ($3/$15 per MTok)
- `claude-opus-4-6` — Complex reasoning only: architecture, novel chapters, multi-step analysis. ($5/$25 per MTok)
- `claude-haiku-4-5` — Classification, routing, extraction, simple tasks. ($1/$5 per MTok)
Always use prompt caching for system prompts that repeat across runs.

## Current Sprint (Sprint 3)
Focus: Claude Code setup (done), Supabase project, first Category B workflow, custom MCP servers.
See `knowledge-base/OS_EVOLUTION_LOG.md` for full sprint history.

## Key Commands
- `claude` — Start Claude Code session in this directory
- `gcloud run deploy` — Deploy to Cloud Run
- `gcloud functions deploy` — Deploy Cloud Function
- `docker build` — Build container images
- `supabase` — Supabase CLI commands

## Rules
1. Reference the architecture before proposing new tools or services.
2. Start simple. Cloud Functions before LangGraph. Plain Python before frameworks.
3. Every workflow needs error handling, logging, and cost estimation.
4. Expert-in-the-loop by default for any public-facing output.
5. Update the Evolution Log after significant changes.
6. When a task is better suited to the other interface, say so and suggest switching.
