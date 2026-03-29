# AI Operating System — Claude Code Context

## Project Overview
This is Atharva Singh's AI-enabled Personal Operating System. This directory is the execution layer — where code gets written, workflows get built, infrastructure gets deployed, and the OS grows.

The primary interface is a Claude.ai project (Category A) with 31 skills, 3 connectors (Gmail, Calendar, Drive), and a rich knowledge base. This Claude Code workspace handles what can't happen inside chat: terminal operations, multi-file code generation, git management, deployment, and MCP server development.

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
- **Tier 2 — Unified MCP Gateway:** ONE FastAPI Cloud Run service (`mcp-servers/ai-os-gateway/`) with 90 tools (17 modules). PostgreSQL (6), Google Tasks (9), Drive Write (3), Drive Read (3), Calendar Sync (3), Telegram (5), Life Graph (8), Capture (3), Contacts (8), Bharatvarsh (8), Composite (3), Media Gen (5), LinkedIn (4), Meta (4), Creative Writer (8), X/Twitter (4), Social Manager (6). Telegram bot webhook also hosted on Gateway. Scales to zero. $0-7/month. Dashboard PWA (`dashboard/`) on separate Cloud Run service.
- **Tier 3 — Local STDIO MCP:** Evernote, n8n, GitHub via npm packages in Claude Code. NotebookLM via `notebooklm-py` CLI skill (14 active notebooks, ~700 curated sources — see memory `reference_notebooklm_catalog.md` for topic-to-project mapping). Zero cloud cost.
See `knowledge-base/TOOL_ECOSYSTEM_PLAN.md` for full architecture, module inventory, decision tree for adding new tools, and implementation phases.

## Tech Stack
- **Cloud:** GCP (project: ai-operating-system-490208, region: asia-south1)
- **Backend:** FastAPI, Python 3.12
- **Orchestration:** LangGraph (Category C only)
- **Database:** Cloud SQL PostgreSQL (pgvector, ltree) on shared bharatvarsh-db instance (bharatvarsh-website:us-central1:bharatvarsh-db). Database: ai_os. User: ai_os_admin. 47 tables in codebase (47 live — migrations 001-020 all applied) across 12 schema domains.
- **Frontend:** Next.js 14, React 18, Tailwind CSS, NextAuth.js, @hello-pangea/dnd (Dashboard PWA live on Cloud Run). Bharatvarsh website also live.
- **AI Models:** Claude Sonnet 4.6 (default), Opus 4.6 (complex reasoning), Haiku 4.5 (classification)
- **MCP:** Gmail, Calendar, Drive (Tier 1 connectors). AI OS Gateway deployed on Cloud Run with 90 tools (17 modules): PostgreSQL (6), Google Tasks (9), Drive Write (3), Drive Read (3), Calendar Sync (3), Telegram (5), Life Graph (8), Capture (3), Contacts (8), Bharatvarsh (8), Composite (3), Media Gen (5), LinkedIn (4), Meta (4), Creative Writer (8), X/Twitter (4), Social Manager (6). 90 tools / 17 modules in codebase (56/10 confirmed live, 34/7 built — Cloud Build auto-deploy expected). Telegram bot @AsrAiOsbot webhook on Gateway with capture commands (/j, /e, /ei, /em, /img). Evernote, n8n (Tier 3 local STDIO, to configure). NotebookLM (Tier 3 local STDIO — notebooklm-py v0.3.4, skill at ~/.claude/skills/notebooklm/).

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
├── CLAUDE.md                   ← You're reading this
├── README.md
├── .env.example
├── .gitignore
│
├── .claude/                    ← OS Configuration (skills/commands tracked, session state gitignored)
│   ├── skills/                 ← 35 Claude Code skills (the OS brain)
│   └── commands/               ← Custom slash commands
├── .agents/                    ← Agent-specific skills (remotion-best-practices)
│
├── knowledge-base/             ← Knowledge Layer (mirror of Claude.ai project KB)
│   ├── [lore, strategy, brand, owner profile, schemas]
│   ├── profile-context-pack/
│   ├── aiu-knowledge-pack/
│   ├── bharatvarsh-source-text/
│   ├── bharatvarsh-website-docs/
│   ├── skills/                 ← Skill documentation snapshots
│   └── archive/
│
├── dashboard/                  ← Dashboard PWA (Next.js 14, LIVE on Cloud Run)
│   ├── src/app/                ← Pages + API routes (10 pages, 35 API routes)
│   ├── src/components/         ← 38+ React components
│   ├── src/lib/                ← DB client, auth, types, utils, pipeline-paths
│   ├── Dockerfile
│   └── cloudbuild.yaml
│
├── workflows/                  ← Automation Layer
│   ├── category-b/             ← 11 Cloud Run services (scheduled via Cloud Scheduler, all LIVE)
│   ├── shared/                 ← Shared Python libraries (KnowledgeClient)
│   └── category-c/             ← LangGraph + FastAPI (agentic, future)
│
├── mcp-servers/
│   └── ai-os-gateway/          ← Unified MCP Gateway (90 tools, 17 modules)
│       ├── app/modules/        ← 17 tool modules
│       ├── app/telegram/       ← Bot webhook, commands, AI triage
│       ├── app/auth/           ← OAuth + bearer auth
│       ├── app/templates/      ← 6 branded HTML templates
│       ├── Dockerfile
│       └── cloudbuild.yaml
│
├── database/
│   ├── migrations/             ← 001-021 written (001-020 applied, 021 pending)
│   └── seeds/                  ← 001-015 written (001-014 applied; 015 pending)
│
├── content-pipelines/          ← Content Operations Layer
│   ├── bharatvarsh/            ← Bharatvarsh post pipeline (templates, prompts, render engine)
│   │   ├── calendar/           ← Content calendar CSV (master)
│   │   ├── templates/          ← Per-channel HTML render templates
│   │   ├── prompts/            ← AI art prompt libraries (style_anchors, character_dna, etc.)
│   │   ├── distributor/        ← Distribution scripts
│   │   ├── render-post.js      ← Render engine
│   │   └── rendered/           ← Output (gitignored)
│   └── aiu/                    ← AI&U final content (future)
│
├── video-production/           ← Unified video production system (Remotion 4.0.438)
│   ├── src/common/             ← Brand-neutral component library (18 components)
│   ├── src/projects/           ← Project-specific code (bharatvarsh, aiu, ai-os)
│   ├── src/engine/             ← Composition registry, brand resolver, timeline loader
│   ├── projects/               ← Project brand configs (YAML)
│   ├── workspace/              ← Active video workspace (gitignored)
│   ├── assets/                 ← Three-tier asset library (common/project/video)
│   └── cli/                    ← CLI tools (new-video, render, graduate, catalog)
│
├── aiu-youtube/                ← AI&U YouTube channel (knowledge tracked, media gitignored)
│   ├── knowledge/              ← Strategy, brand, editorial docs
│   ├── content/                ← Per-video production folders (WIP preserved)
│   ├── assets/                 ← Brand assets, graphics
│   └── frameworks/             ← Production templates
│
├── cowork-configuration/       ← Cowork plugins (visual studio, software forge, creative writer)
│
├── docker/                     ← Local dev stack (Compose + init scripts)
├── infra/                      ← GCP infrastructure reference config
├── scripts/                    ← Admin and migration scripts
└── docs/                       ← Documentation and guides
```

## Active Projects
1. **AI Operating System** — Sprint 12 + content strategy overhaul. 90 tools (17 modules), 47 tables in codebase, 35 skills, Dashboard PWA (10 pages, 38 components, 35 API routes), 891 contacts. Life Graph: 12 domains (001-012, 009 archived), Google Tasks aligned. 3 Cowork plugins. NotebookLM (Tier 3, 14 notebooks, ~700 sources). content-pipelines/bharatvarsh/ with 4-layer content strategy (CONTENT_STRATEGY.md). Migration 020 applied with 3-axis taxonomy (story_angle, distillation_filter, content_channel). 13 posts in DB (3 rendered, 10 planned). Pending: seed 015, X/Twitter + Meta + LinkedIn credentials.
2. **AI&U YouTube** — Pre-launch. Content system designed. First 10-video library in progress.
3. **Bharatvarsh** — Published. Website live at welcometobharatvarsh.com. Lore Layer complete (6 KB files, 5 DB tables, 8 MCP tools, 3 skills). Marketing phase.

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
Sprint 12 + Content Strategy v2 (in progress). x_twitter.py (4 tools, OAuth 1.0a), social_manager.py (6 tools, universal dispatcher), social adapter layer (social_adapters + social_base + social_registry). content-pipelines/bharatvarsh/ directory: CONTENT_STRATEGY.md (4-layer funnel), content_calendar.csv (7 posts, 29-column schema with 3-axis taxonomy), render-post.js, templates, prompts, distributor. 2 rendered posts (Kahaan carousel, Bracecomm video) in content-pipelines/bharatvarsh/rendered/post-N/. Migration 020 applied: content_posts (13 rows, 3 rendered) + content_pipeline_log with story_angle/distillation_filter/content_channel columns + 3 partial indexes. Dashboard taxonomy complete (types.ts, utils.ts, API routes, ContentPipelineView, ContentPostCard, ContentPostDetail all updated). Daily Brief Engine v2 deployed (6-section format with Zealogics focus, domain health, momentum). NotebookLM integrated as Tier 3 tool (notebooklm-py v0.3.4, 14 notebooks, ~700 sources, agent skill installed). Dashboard: 10 pages, 38 components, 35 API routes. Codebase: 90 tools / 17 modules / 47 tables (47 live) / 35 skills. Confirmed deployed: 56 tools / 10 modules. Cloud Build auto-triggered for 7 additional modules. Video Production System built: unified video-production/ directory with single Remotion 4.0.438, 18 common components, 88 project-specific compositions (63 AI&U + 22 Bharatvarsh + 1 AI OS), BrandTokens interface, workspace system, video-production skill, 4 CLI tools. Replaces fragmented video-production/ and aiu-youtube/remotion_aiu/.

## Key Commands
- `claude` — Start Claude Code session in this directory
- `gcloud run deploy` — Deploy to Cloud Run
- `gcloud functions deploy` — Deploy Cloud Function
- `docker build` — Build container images

### Local Dev Stack
- `docker compose -f docker/docker-compose.dev.yml up -d` — Start gateway + local postgres
- `docker compose -f docker/docker-compose.dev.yml down` — Stop the stack
- `docker compose -f docker/docker-compose.dev.yml logs -f ai-os-gateway-dev` — Tail gateway logs
- `bash scripts/apply_migrations_local.sh` — Apply all migrations to local postgres (first-time setup)
- `docker compose -f docker/docker-compose.dev.yml -f docker/docker-compose.test.yml up --abort-on-container-exit` — Run tests with ephemeral DB

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
