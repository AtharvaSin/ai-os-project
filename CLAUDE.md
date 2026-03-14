# AI Operating System — Claude Code Context

## Project Overview
This is Atharva Singh's AI-enabled Personal Operating System. This directory is the execution layer — where code gets written, workflows get built, infrastructure gets deployed, and the OS grows.

The primary interface is a Claude.ai project (Category A) with 15 skills, 3 connectors (Gmail, Calendar, Drive), and a rich knowledge base. This Claude Code workspace handles what can't happen inside chat: terminal operations, multi-file code generation, git management, deployment, and MCP server development.

## Owner
Atharva Singh — AI & Cloud Product Leader, incoming TPM at Zealogics Inc.
Based in Hyderabad, India. Full profile in `knowledge-base/OWNER_PROFILE.md`.

## Architecture (Three Categories)
- **Category A** — Claude.ai chat project (primary interface, 60-70% of work). Skills and knowledge base.
- **Category B** — Cloud Functions (Gen 2) + Cloud Scheduler. Rigid scheduled pipelines. Plain Python + Anthropic API.
- **Category C** — LangGraph on FastAPI + Cloud Run. Conditional logic, multi-step agents, human-in-the-loop.

## Tool Ecosystem (Three-Tier Model)
- **Tier 1 — Directory Connectors:** Gmail, Calendar, Drive (connected). Slack, Notion, Canva, GitHub (pending). Zero infrastructure. One-click OAuth via Claude.ai.
- **Tier 2 — Unified MCP Gateway:** ONE FastAPI Cloud Run service (`mcp-servers/ai-os-gateway/`) with modular tool modules. PostgreSQL, Google Tasks, Drive write, Bharatvarsh admin, WhatsApp, content tracker. Scales to zero. $0-7/month.
- **Tier 3 — Local STDIO MCP:** Evernote, n8n, GitHub via npm packages in Claude Code. Zero cloud cost.
See `knowledge-base/TOOL_ECOSYSTEM_PLAN.md` for full architecture, module inventory, decision tree for adding new tools, and implementation phases.

## Tech Stack
- **Cloud:** GCP (project: ai-operating-system-490208, region: asia-south1)
- **Backend:** FastAPI, Python 3.12
- **Orchestration:** LangGraph (Category C only)
- **Database:** Cloud SQL PostgreSQL (pgvector) on shared bharatvarsh-db instance (bharatvarsh-website:us-central1:bharatvarsh-db). Database: ai_os. User: ai_os_admin. 21 tables, 4 schema domains.
- **Frontend:** Next.js, React, Tailwind (Bharatvarsh website already live)
- **AI Models:** Claude Sonnet 4.6 (default), Opus 4.6 (complex reasoning), Haiku 4.5 (classification)
- **MCP:** Gmail, Calendar, Drive (Tier 1 connectors). AI OS Gateway with PostgreSQL, Google Tasks, Drive write, Bharatvarsh modules (Tier 2, to build). Evernote, n8n (Tier 3 local STDIO, to configure).

## GCP Infrastructure (Provisioned)
- **Project:** ai-operating-system-490208 (asia-south1)
- **APIs:** 13 enabled (Cloud Run, Functions, Scheduler, Secret Manager, Artifact Registry, Cloud Build, etc.)
- **Service Accounts:** ai-os-cloud-run (Cat C), ai-os-cloud-functions (Cat B), ai-os-cicd (CI/CD). All with cross-project cloudsql.client role.
- **Artifact Registry:** asia-south1-docker.pkg.dev/ai-operating-system-490208/ai-os-images
- **Secrets:** AI_OS_DB_PASSWORD, AI_OS_DB_INSTANCE in Secret Manager
- See `knowledge-base/GCP_INFRA_CONFIG.md` for full config.

## Directory Structure
```
ai-os-project/
├── CLAUDE.md                 ← You're reading this
├── README.md
├── .env.example
├── .gitignore
├── knowledge-base/           ← Mirror of Claude.ai project KB docs
│   ├── OWNER_PROFILE.md
│   ├── WORK_PROJECTS.md
│   ├── EVOLUTION_LOG.md
│   ├── TOOL_ECOSYSTEM_PLAN.md
│   ├── GCP_INFRA_CONFIG.md
│   ├── DB_SCHEMA.md
│   ├── BHARATVARSH_BIBLE.md
│   ├── BHARATVARSH_PLATFORM.md
│   ├── CONTENT_CALENDAR.md
│   ├── MARKETING_PLAYBOOK.md
│   ├── profile-context-pack/
│   ├── aiu-knowledge-pack/
│   └── bharatvarsh-website-docs/
├── .claude/skills/           ← Claude Code auto-discovered skills (15 skills)
├── workflows/
│   ├── category-b/           ← Cloud Functions (scheduled)
│   └── category-c/           ← LangGraph + FastAPI (agentic)
├── mcp-servers/
│   └── ai-os-gateway/        ← Unified MCP Gateway (all custom tool modules)
│       ├── app/
│       │   ├── main.py
│       │   ├── config.py
│       │   ├── mcp_registry.py
│       │   ├── modules/      ← One file per tool (postgres.py, google_tasks.py, etc.)
│       │   └── auth/
│       ├── Dockerfile
│       ├── requirements.txt
│       └── cloudbuild.yaml
├── infra/
├── scripts/
└── docs/
```

## Active Projects
1. **AI Operating System** — Phase 1. Data layer live (21 tables). Tool ecosystem designed. GCP provisioned. Next: MCP Gateway build.
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

## Current Sprint
Focus: MCP Gateway build (PostgreSQL module first), then Google Tasks + Drive Write modules, then first Category B workflow (Birthday Wishes).
See `knowledge-base/EVOLUTION_LOG.md` for full sprint history.

## Key Commands
- `claude` — Start Claude Code session in this directory
- `gcloud run deploy` — Deploy to Cloud Run
- `gcloud functions deploy` — Deploy Cloud Function
- `docker build` — Build container images

## Interface Routing
Handle in Claude Code: code writing, multi-file edits, GCP deployment, git operations, MCP server development, database scripts, testing/debugging.
Redirect to Claude.ai: brainstorming, research, planning, content drafting, email composition, connector-dependent work (Gmail/Calendar/Drive), interactive artifacts, past chats search.

## Rules
1. Reference the architecture before proposing new tools or services.
2. Start simple. Cloud Functions before LangGraph. Plain Python before frameworks.
3. Every workflow needs error handling, logging, and cost estimation.
4. Expert-in-the-loop by default for any public-facing output.
5. Update the Evolution Log after significant changes.
6. Tool additions must follow the decision tree in TOOL_ECOSYSTEM_PLAN.md: connector first → local STDIO if dev-only → gateway module if multi-interface → separate service only if heavy compute.
