# AI Operating System — Claude Code Context

## Project Overview
This is Atharva Singh's AI-enabled Personal Operating System. This directory is the execution layer — where code gets written, workflows get built, infrastructure gets deployed, and the OS grows.

The primary interface is a Claude.ai project (Category A) with 24 skills, 3 connectors (Gmail, Calendar, Drive), and a rich knowledge base. This Claude Code workspace handles what can't happen inside chat: terminal operations, multi-file code generation, git management, deployment, and MCP server development.

**Current State:** See `knowledge-base/PROJECT_STATE.md` for the authoritative, filesystem-verified project state snapshot. Run `/update-project-state` to refresh it.

## Owner
Atharva Singh — AI & Cloud Product Leader, incoming TPM at Zealogics Inc.
Based in Hyderabad, India. Full profile in `knowledge-base/OWNER_PROFILE.md`.

## Architecture (Three Categories)
- **Category A** — Claude.ai chat project (primary interface, 60-70% of work). Skills and knowledge base.
- **Category B** — Cloud Functions (Gen 2) + Cloud Scheduler. Rigid scheduled pipelines. Plain Python + Anthropic API.
- **Category C** — LangGraph on FastAPI + Cloud Run. Conditional logic, multi-step agents, human-in-the-loop.

## Tool Ecosystem (Three-Tier Model)
- **Tier 1 — Directory Connectors:** Gmail, Calendar, Drive (connected). Slack, Notion, Canva, GitHub (pending). Zero infrastructure. One-click OAuth via Claude.ai.
- **Tier 2 — Unified MCP Gateway:** ONE FastAPI Cloud Run service (`mcp-servers/ai-os-gateway/`) with 40 tools (8 modules). PostgreSQL (6), Google Tasks (9), Drive Write (3), Drive Read (3), Calendar Sync (3), Telegram (5), Life Graph (8), Capture (3). Telegram bot webhook also hosted on Gateway. Scales to zero. $0-7/month. Dashboard PWA (`dashboard/`) on separate Cloud Run service.
- **Tier 3 — Local STDIO MCP:** Evernote, n8n, GitHub via npm packages in Claude Code. Zero cloud cost.
See `knowledge-base/TOOL_ECOSYSTEM_PLAN.md` for full architecture, module inventory, decision tree for adding new tools, and implementation phases.

## Tech Stack
- **Cloud:** GCP (project: ai-operating-system-490208, region: asia-south1)
- **Backend:** FastAPI, Python 3.12
- **Orchestration:** LangGraph (Category C only)
- **Database:** Cloud SQL PostgreSQL (pgvector, ltree) on shared bharatvarsh-db instance (bharatvarsh-website:us-central1:bharatvarsh-db). Database: ai_os. User: ai_os_admin. 33 tables live across 8 schema domains. Migrations 001-013 all applied.
- **Frontend:** Next.js 14, React 18, Tailwind CSS, NextAuth.js, @hello-pangea/dnd (Dashboard PWA live on Cloud Run). Bharatvarsh website also live.
- **AI Models:** Claude Sonnet 4.6 (default), Opus 4.6 (complex reasoning), Haiku 4.5 (classification)
- **MCP:** Gmail, Calendar, Drive (Tier 1 connectors). AI OS Gateway deployed on Cloud Run with 40 tools (8 modules): PostgreSQL (6), Google Tasks (9), Drive Write (3), Drive Read (3), Calendar Sync (3), Telegram (5), Life Graph (8), Capture (3): capture_entry, list_journals, search_journals. Telegram bot @AsrAiOsbot webhook on Gateway with capture commands (/j, /e, /ei, /em). Evernote, n8n (Tier 3 local STDIO, to configure).

## GCP Infrastructure (Provisioned)
- **Project:** ai-operating-system-490208 (asia-south1)
- **APIs:** 16 enabled (Cloud Run, Functions, Scheduler, Secret Manager, Artifact Registry, Cloud Build, Google Tasks, Drive, Calendar, etc.)
- **Service Accounts:** ai-os-cloud-run (Cat C), ai-os-cloud-functions (Cat B), ai-os-cicd (CI/CD). All with cross-project cloudsql.client role.
- **Artifact Registry:** asia-south1-docker.pkg.dev/ai-operating-system-490208/ai-os-images
- **Secrets:** 13 in Secret Manager (AI_OS_DB_PASSWORD, AI_OS_DB_INSTANCE, MCP_GATEWAY_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, NEXTAUTH_SECRET, DASHBOARD_OAUTH_SECRET, OPENAI_API_KEY, ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET).
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
│   ├── INTERFACE_STRATEGY.md
│   ├── BHARATVARSH_BIBLE.md
│   ├── BHARATVARSH_PLATFORM.md
│   ├── CONTENT_CALENDAR.md
│   ├── MARKETING_PLAYBOOK.md
│   ├── LIFE_GRAPH.md
│   ├── BRAND_IDENTITY.md
│   ├── profile-context-pack/
│   ├── aiu-knowledge-pack/
│   └── bharatvarsh-website-docs/
├── .claude/skills/           ← Claude Code auto-discovered skills (24 skills)
├── dashboard/                ← Dashboard PWA (Next.js 14, LIVE on Cloud Run)
│   ├── src/
│   │   ├── app/              ← Pages + API routes (9 pages, 23 API routes)
│   │   ├── components/       ← 27 React components
│   │   ├── lib/              ← DB client, auth, types, utils
│   │   └── middleware.ts     ← Auth gate
│   ├── public/               ← PWA manifest, service worker, icons
│   ├── Dockerfile
│   ├── cloudbuild.yaml
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
├── workflows/
│   ├── category-b/           ← Cloud Run services (scheduled via Cloud Scheduler)
│   │   ├── task-notification/ ← Daily overdue scan (LIVE on Cloud Run)
│   │   ├── telegram-notifications/ ← Telegram bot notifications (LIVE on Cloud Run)
│   │   ├── embedding-generator/ ← Knowledge embedding pipeline (LIVE on Cloud Run)
│   │   ├── drive-knowledge-scanner/ ← Drive folder scanner (LIVE on Cloud Run)
│   │   ├── weekly-knowledge-summary/ ← Weekly project summaries (LIVE on Cloud Run)
│   │   ├── knowledge-auto-connector/ ← Auto connection discovery (LIVE on Cloud Run)
│   │   ├── risk-engine/       ← AI Risk Engine (BUILT, pending deploy)
│   │   ├── daily-brief-engine/ ← Automated daily brief (BUILT, pending deploy)
│   │   ├── task-annotation-sync/ ← Two-way task annotation sync (BUILT, pending deploy)
│   │   ├── domain-health-scorer/ ← Domain health scoring (LIVE on Cloud Run)
│   │   └── journal-monthly-distill/ ← Journal distillation via Haiku (LIVE on Cloud Run)
│   ├── shared/               ← Shared Python libraries
│   │   └── ai_os_knowledge.py ← KnowledgeClient for semantic search + graph traversal
│   └── category-c/           ← LangGraph + FastAPI (agentic)
├── mcp-servers/
│   └── ai-os-gateway/        ← Unified MCP Gateway (40 tools, 8 modules)
│       ├── app/
│       │   ├── main.py
│       │   ├── config.py
│       │   ├── modules/      ← postgres.py, google_tasks.py, drive_write.py, drive_read.py, calendar_sync.py, telegram.py, life_graph.py, capture.py
│       │   ├── telegram/     ← Bot webhook, commands, AI triage, thread memory
│       │   └── auth/         ← google_oauth.py, bearer.py
│       ├── Dockerfile
│       ├── requirements.txt
│       └── cloudbuild.yaml
├── database/
│   ├── migrations/           ← 001-013 all applied
│   └── seeds/                ← 001-008 applied, 009-011 built (pending apply)
├── scripts/
│   ├── google_oauth_setup.py ← OAuth token flow helper
│   ├── deploy_knowledge_layer_v2.sh ← Step-by-step deployment guide
│   ├── seed_knowledge_connections.py ← Seed initial knowledge connections
│   ├── generate_knowledge_snapshots.py ← Generate domain-level snapshots
│   └── seed_knowledge_drive.py ← Seed knowledge from Drive
├── infra/
└── docs/
```

## Active Projects
1. **AI Operating System** — Personal Capture System built. 33 tables, 40 MCP tools (8 modules), domain-based Google Task lists (9 domains), Dashboard PWA (9 pages), Telegram Bot (9 commands incl. capture), Knowledge Layer V2 deployed, domain-health-scorer pipeline deployed, journal-monthly-distill pipeline built.
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
Sprint 9-B — Personal Capture System deployed. 33 tables, 40 MCP tools (8 modules), capture module (capture_entry, list_journals, search_journals), journals table, 2 new skills (capture-entry, entry-analysis), journal-monthly-distill pipeline (LIVE, scheduled 28th monthly), Telegram capture commands (/j, /e, /ei, /em), Dashboard /capture page with inbox + journals + stats tabs. All live on Cloud Run.

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
