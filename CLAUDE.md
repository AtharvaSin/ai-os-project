# AI Operating System — Claude Code Context

## Project Overview
This is Atharva Singh's AI-enabled Personal Operating System. This directory is the execution layer — where code gets written, workflows get built, infrastructure gets deployed, and the OS grows.

The primary interface is a Claude.ai project (Category A) with 18 skills, 3 connectors (Gmail, Calendar, Drive), and a rich knowledge base. This Claude Code workspace handles what can't happen inside chat: terminal operations, multi-file code generation, git management, deployment, and MCP server development.

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
- **Tier 2 — Unified MCP Gateway:** ONE FastAPI Cloud Run service (`mcp-servers/ai-os-gateway/`) with 17 tools (all live). PostgreSQL (6), Google Tasks (5), Drive Write (3), Calendar Sync (3). Scales to zero. $0-7/month. Dashboard PWA (`dashboard/`) on separate Cloud Run service.
- **Tier 3 — Local STDIO MCP:** Evernote, n8n, GitHub via npm packages in Claude Code. Zero cloud cost.
See `knowledge-base/TOOL_ECOSYSTEM_PLAN.md` for full architecture, module inventory, decision tree for adding new tools, and implementation phases.

## Tech Stack
- **Cloud:** GCP (project: ai-operating-system-490208, region: asia-south1)
- **Backend:** FastAPI, Python 3.12
- **Orchestration:** LangGraph (Category C only)
- **Database:** Cloud SQL PostgreSQL (pgvector) on shared bharatvarsh-db instance (bharatvarsh-website:us-central1:bharatvarsh-db). Database: ai_os. User: ai_os_admin. 21 tables live (24 after migration 007), 4 schema domains. Migrations 001-005 applied; 006-007 built (pending apply).
- **Frontend:** Next.js 14, React 18, Tailwind CSS, NextAuth.js, @hello-pangea/dnd (Dashboard PWA live on Cloud Run). Bharatvarsh website also live.
- **AI Models:** Claude Sonnet 4.6 (default), Opus 4.6 (complex reasoning), Haiku 4.5 (classification)
- **MCP:** Gmail, Calendar, Drive (Tier 1 connectors). AI OS Gateway deployed on Cloud Run with all 17 tools live: PostgreSQL (6, search_knowledge upgraded to semantic/hybrid/fulltext — pending redeploy), Google Tasks (5), Drive Write (3), Calendar Sync (3). Evernote, n8n (Tier 3 local STDIO, to configure).

## GCP Infrastructure (Provisioned)
- **Project:** ai-operating-system-490208 (asia-south1)
- **APIs:** 16 enabled (Cloud Run, Functions, Scheduler, Secret Manager, Artifact Registry, Cloud Build, Google Tasks, Drive, Calendar, etc.)
- **Service Accounts:** ai-os-cloud-run (Cat C), ai-os-cloud-functions (Cat B), ai-os-cicd (CI/CD). All with cross-project cloudsql.client role.
- **Artifact Registry:** asia-south1-docker.pkg.dev/ai-operating-system-490208/ai-os-images
- **Secrets:** 8 in Secret Manager (AI_OS_DB_PASSWORD, AI_OS_DB_INSTANCE, MCP_GATEWAY_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, NEXTAUTH_SECRET, DASHBOARD_OAUTH_SECRET). Need +2 for Knowledge Layer V2: OPENAI_API_KEY, ANTHROPIC_API_KEY.
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
│   ├── profile-context-pack/
│   ├── aiu-knowledge-pack/
│   └── bharatvarsh-website-docs/
├── .claude/skills/           ← Claude Code auto-discovered skills (18 skills)
├── dashboard/                ← Dashboard PWA (Next.js 14, LIVE on Cloud Run)
│   ├── src/
│   │   ├── app/              ← Pages + API routes (6 pages, 7 API routes)
│   │   ├── components/       ← 16 React components
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
│   │   ├── embedding-generator/ ← Knowledge embedding pipeline (BUILT, pending deploy)
│   │   ├── drive-knowledge-scanner/ ← Drive folder scanner (BUILT, pending deploy)
│   │   ├── weekly-knowledge-summary/ ← Weekly project summaries (BUILT, pending deploy)
│   │   └── knowledge-auto-connector/ ← Auto connection discovery (BUILT, pending deploy)
│   ├── shared/               ← Shared Python libraries
│   │   └── ai_os_knowledge.py ← KnowledgeClient for semantic search + graph traversal
│   └── category-c/           ← LangGraph + FastAPI (agentic)
├── mcp-servers/
│   └── ai-os-gateway/        ← Unified MCP Gateway (17 tools, ALL LIVE)
│       ├── app/
│       │   ├── main.py
│       │   ├── config.py
│       │   ├── mcp_registry.py
│       │   ├── modules/      ← postgres.py, google_tasks.py, drive_write.py, calendar_sync.py
│       │   └── auth/         ← google_oauth.py, bearer.py
│       ├── Dockerfile
│       ├── requirements.txt
│       └── cloudbuild.yaml
├── database/
│   ├── migrations/           ← 001-005 (applied), 006-007 (built, pending apply)
│   └── seeds/                ← 001-005 (applied), 006 (built, pending apply)
├── scripts/
│   ├── google_oauth_setup.py ← OAuth token flow helper
│   ├── deploy_knowledge_layer_v2.sh ← Step-by-step deployment guide
│   ├── seed_knowledge_connections.py ← Seed initial knowledge connections
│   └── generate_knowledge_snapshots.py ← Generate domain-level snapshots
├── infra/
└── docs/
```

## Active Projects
1. **AI Operating System** — Knowledge Layer V2 code complete (69 files). Phase 3a deployed. 4 new pipelines built (pending deploy). MCP Gateway semantic search upgraded (pending redeploy). 38 seed docs ready. 3 skills RAG-grounded. Next: deploy Knowledge Layer V2, then Phase 3b (AI Risk Engine).
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
Focus: Deploy Knowledge Layer V2. All code built (69 files): 2 DB migrations, 4 pipeline services, MCP gateway semantic search, shared library, 38 seed docs, 3 utility scripts. Deployment steps: (1) store OPENAI_API_KEY + ANTHROPIC_API_KEY in Secret Manager, (2) apply migrations 006-007, (3) deploy 4 Cloud Run services + create 4 Cloud Scheduler triggers, (4) redeploy MCP Gateway, (5) create Drive Knowledge/ folders + upload seed docs, (6) verify embeddings. Use `scripts/deploy_knowledge_layer_v2.sh` for guided deployment. After Knowledge Layer: Phase 3b (AI Risk Engine + push notifications). See `knowledge-base/PROJECT_STATE.md` for verified state (v5).

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
