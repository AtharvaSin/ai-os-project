# OS Evolution Log

A running record of design decisions, architecture changes, brainstorming outcomes, and key artifacts produced across sessions.

---

## How to Use This Log
- After each significant session, add an entry with date, domain, decisions made, and artifacts produced
- Reference this log when starting new sessions to maintain continuity
- Mark items as [ACTIVE], [COMPLETED], [PARKED], or [SUPERSEDED]

---

## Log Entries

### Entry 009 — Telegram Bot Deployed (Pocket Command Channel)
- **Date:** 2026-03-16
- **Domain:** Interface Layer / Notifications / Telegram / MCP Gateway / Database
- **Status:** [COMPLETED]
- **Summary:** Built and deployed the Telegram Bot feature as the AI OS pocket command channel. 15 new files, 4 modified. @AsrAiOsbot provides 5 slash commands (/brief, /add, /done, /status, /log), 3 scheduled notifications (morning brief, overdue alerts, weekly digest), and AI triage with conversation memory via Claude Haiku. 5 new MCP Gateway tools (send_telegram_message, send_telegram_template, send_telegram_inline_keyboard, edit_telegram_message, get_telegram_bot_info) bring gateway total to 22. 3 new database tables (bot_conversations, notification_log, bot_inbox) bring total to 27. Migration 008 applied with short_id() function and pipelines.notify_telegram column. 3 Cloud Scheduler jobs created. Estimated cost: ~$2-3.50/month.
- **Architecture Decisions:**
  - **Telegram over WhatsApp:** Free Bot API, no business verification, instant setup, rich inline keyboards, webhook support. WhatsApp deferred.
  - **Separate Cloud Run service:** telegram-notifications runs independently from MCP Gateway. Webhook + cron endpoints. Scale-to-zero.
  - **AI triage with Claude Haiku:** Free-form messages classified by intent (task, status, note, question). Conversation memory in bot_conversations table for context continuity.
  - **short_id() for human-readable refs:** 8-char alphanumeric IDs for Telegram-friendly references instead of UUIDs.
- **Files Created/Modified (15 new, 4 modified):**
  - Cloud Run service: workflows/category-b/telegram-notifications/ (main.py, handlers/, Dockerfile, cloudbuild.yaml, requirements.txt, etc.)
  - MCP Gateway: telegram.py module (5 tools)
  - Migration: database/migrations/008_telegram_tables.sql
  - Seed: database/seeds/008_seed_telegram_pipeline.sql
- **Infrastructure Changes:**
  - 3 new secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET
  - Cloud Run service: telegram-notifications (asia-south1, scale-to-zero)
  - 3 Cloud Scheduler jobs: telegram-morning-brief (6:30 AM IST), telegram-overdue-alerts (9:00 AM IST), telegram-weekly-digest (Sunday 7 PM IST)
  - MCP Gateway redeployed with Telegram module (17 -> 22 tools)
- **KB Changes Made:**
  - TOOL_ECOSYSTEM_PLAN.md — Telegram module added, tool count 17 -> 22
  - GCP_INFRA_CONFIG.md — 3 new secrets, telegram-notifications service, 3 scheduler jobs
  - DB_SCHEMA.md — 3 new tables (27 total), short_id() function, pipelines.notify_telegram
  - INTERFACE_STRATEGY.md — Telegram added as notification channel / pocket command interface
  - EVOLUTION_LOG.md — Entry 009 added
- **Next Steps:**
  - [ ] Deploy Knowledge Layer V2 (migrations 006-007, 4 pipelines)
  - [ ] Phase 3b: AI Risk Engine + push notifications
  - [ ] Complete Claude.ai MCP connector

### Entry 008 — Knowledge Layer V2 Complete Build (Sprint 5A-5D)
- **Date:** 2026-03-15
- **Domain:** Knowledge Layer / Pipelines / MCP Gateway / Skills / Database
- **Status:** [BUILT — pending deployment]
- **Summary:** Complete Knowledge Layer V2 build across 4 sprints (5A-5D). 69 files (7 modified + 62 new, 6,050 lines). 2 database migrations (006-007), 4 pipeline services (embedding-generator, drive-knowledge-scanner, weekly-knowledge-summary, knowledge-auto-connector), MCP Gateway semantic search upgrade, shared knowledge library, 3 skills RAG-grounded, 38 seed documents across 3 domains, 3 utility scripts, deployment guide. All code built in parallel using 7 specialized agents.
- **Architecture Decisions:**
  - **Two-pathway ingestion:** Weekly batch summarisation (Postgres ops data → Claude Haiku → knowledge entries) + Drive Knowledge Scanner (Google Drive → chunk → knowledge entries). Operational data stays structured; knowledge entries are curated or systematically summarised.
  - **pgvector for semantic search:** Leveraged existing pgvector extension rather than adding a separate vector database. match_knowledge() SQL function enables cosine similarity search alongside structured queries.
  - **Expert-in-the-loop for connections:** Auto-connector proposes edges with metadata.approved=false. Human approves via /weekly-review skill. Prevents noisy knowledge graph.
  - **Cloud Run for all pipelines:** Cloud Functions Gen 2 buildpack still broken. All 4 new pipelines use Cloud Run + Cloud Scheduler (same pattern as task-notification).
  - **text-embedding-3-small:** Cheapest OpenAI embedding model ($0.02/1M tokens). 100 entries ≈ $0.001. Monthly cost ≈ $0.45 for all 4 pipelines.
  - **pg8000 for pipelines, asyncpg for gateway:** Pipelines use pg8000 (sync, simple, matches task-notification pattern). MCP Gateway uses asyncpg (async, matches FastAPI pattern). Shared library uses asyncpg.
- **Files Created (69 total):**
  - Migrations: database/migrations/006_knowledge_functions.sql, 007_knowledge_ingestion.sql
  - Seeds: database/seeds/006_seed_knowledge_pipelines.sql
  - Pipelines (4 services × 4 files): embedding-generator, drive-knowledge-scanner, weekly-knowledge-summary, knowledge-auto-connector
  - Shared library: workflows/shared/__init__.py, ai_os_knowledge.py
  - MCP Gateway: postgres.py (search_knowledge upgrade), config.py (OPENAI_API_KEY), requirements.txt, cloudbuild.yaml
  - Skills: morning-brief, weekly-review, session-resume (RAG-grounded)
  - Seed docs: 38 files in docs/knowledge-seed/ (System 15, Bharatvarsh 7, AI&U 5, AI-OS 3, Zealogics 1, Personal 7)
  - Scripts: deploy_knowledge_layer_v2.sh, seed_knowledge_connections.py, generate_knowledge_snapshots.py
- **KB Changes Made:**
  - PROJECT_STATE.md — Updated to v5
  - WORK_PROJECTS.md — Updated: Knowledge Layer V2 status
  - CLAUDE.md — Updated: directory structure, current sprint, database info, secrets
  - EVOLUTION_LOG.md — Entry 008 added
  - DB_SCHEMA.md — Updated with migrations 006-007 info
- **Next Steps:**
  - [ ] Store OPENAI_API_KEY + ANTHROPIC_API_KEY in Secret Manager
  - [ ] Apply migrations 006-007 to Cloud SQL
  - [ ] Deploy 4 pipeline services to Cloud Run
  - [ ] Create 4 Cloud Scheduler triggers
  - [ ] Redeploy MCP Gateway with semantic search
  - [ ] Create Drive Knowledge/ folders (7)
  - [ ] Upload 38 seed docs to Drive
  - [ ] Trigger Drive scanner, verify embeddings
  - [ ] Complete Claude.ai MCP connector
  - [ ] Phase 3b: AI Risk Engine + push notifications

### Entry 007 — Dashboard PWA Build + Deploy (Phase 3a) + Task Seed Data
- **Date:** 2026-03-15
- **Domain:** Interface Layer / Dashboard / PWA / Database / Deployment
- **Status:** [COMPLETED]
- **Summary:** Built and deployed the AI OS Dashboard PWA (Phase 3a). Next.js 14 + TypeScript + Tailwind CSS with Obsidian Aurora design system. 56 source files: 6 pages (Command Center, Project Detail, Task Board, Gantt Timeline, Sign-in, Error), 7 API routes (projects, tasks, milestones, gantt, auth), 16 React components (ProjectCard, KanbanBoard with drag-and-drop, GanttChart with milestone reschedule, PhaseAccordion, QuickAddTask modal, responsive Sidebar + MobileNav). Auth via NextAuth.js with Google OAuth, single-email gate. Database via pg + Cloud SQL Auth Proxy sidecar. PWA with manifest, service worker, offline fallback, PNG icons. Seeded 28 tasks across 3 projects. Locally tested then deployed to Cloud Run.
- **Architecture Decisions:**
  - **Custom Gantt over frappe-gantt:** Built CSS Grid Gantt chart for better React integration and Obsidian Aurora theme consistency. Supports click-to-reschedule milestones.
  - **Server components by default:** Command Center and Project Detail are server components querying Cloud SQL directly. Task Board and Gantt are client components for interactivity.
  - **@hello-pangea/dnd for Kanban:** Maintained fork of react-beautiful-dnd for drag-and-drop task status changes.
  - **No ORM:** Raw SQL via pg npm package with typed query helpers, matching the MCP Gateway's direct-SQL approach.
  - **CSP disabled in dev:** Next.js HMR requires eval/inline scripts and data URI fonts. CSP headers applied only in production builds.
  - **Desktop OAuth for local dev:** Existing MCP Gateway Desktop client reused for local testing. Web Application client created for Cloud Run production.
  - **Manual deploy first:** Dashboard deployed manually via Cloud Build submit (not automated trigger). Trigger creation deferred.
- **Files Created (56 source files, ~3,200 lines):**
  - Config: package.json, tsconfig.json, next.config.js, tailwind.config.ts, postcss.config.js, Dockerfile, cloudbuild.yaml, .env.example, .dockerignore, .gcloudignore
  - Pages: page.tsx (home), projects/[slug]/page.tsx, tasks/page.tsx, gantt/page.tsx, auth/signin/page.tsx, auth/error/page.tsx
  - API routes: projects/route.ts, projects/[slug]/route.ts, tasks/route.ts, tasks/[id]/route.ts, gantt/route.ts, milestones/[id]/route.ts, auth/[...nextauth]/route.ts
  - Components: 16 components including layout (Sidebar, MobileNav)
  - Lib: auth.ts, db.ts, types.ts, utils.ts, middleware.ts
  - PWA: manifest.json, sw.js, offline.html, icon-192.png, icon-512.png, icon-192.svg, icon-512.svg
  - Seed: database/seeds/005_seed_tasks.sql (28 tasks, milestone due date updates)
- **Secrets Created:**
  - NEXTAUTH_SECRET in Secret Manager (generated via openssl rand -base64 32)
  - DASHBOARD_OAUTH_SECRET in Secret Manager (Web Application OAuth client secret for Cloud Run)
- **Data Seeded:**
  - 28 tasks: AI OS (12), AI&U (8), Bharatvarsh (8)
  - Distribution: todo (15), in_progress (6), blocked (1), done (6)
  - Priority: urgent (3), high (11), medium (9), low (5)
  - All 8 milestones updated with due dates
- **Deployment:**
  - Dashboard image built and pushed to Artifact Registry (~78MB, sha256:b690e1a5...)
  - Deployed to Cloud Run: ai-os-dashboard, asia-south1, scale-to-zero (512Mi)
  - URL: https://ai-os-dashboard-sv4fbx5yna-el.a.run.app
  - Deployed manually by aiwithasr@gmail.com at 2026-03-15T09:57:23Z
  - No Cloud Build trigger created (manual deploy only)
- **KB Changes Made (this session):**
  - PROJECT_STATE.md — Updated to v4: Dashboard LIVE, Gateway all 17 tools live, 8 secrets
  - WORK_PROJECTS.md — Updated: Sprint 5, Dashboard deployed, all modules live
  - EVOLUTION_LOG.md — Updated: Entry 007 reflects deployment, Entry 006 marked [COMPLETED]
  - TOOL_ECOSYSTEM_PLAN.md — Updated: Phase 3a complete, Dashboard deployed, Google modules live
  - GCP_INFRA_CONFIG.md — Updated: Dashboard image live, 8 secrets, dashboard service deployed
  - CLAUDE.md — Updated: Directory structure, tech stack, secrets, current sprint, active projects
- **Next Steps:**
  - [ ] Create Cloud Build trigger for dashboard auto-deploy
  - [ ] Deploy Task Notification Cloud Function + Cloud Scheduler
  - [ ] Complete Claude.ai MCP connector
  - [ ] Phase 3b: AI Risk Engine + push notifications

### Entry 006 — MCP Gateway Build + Cloud Run Deployment + CI/CD + Google OAuth
- **Date:** 2026-03-15
- **Domain:** Infrastructure / Tool Layer / MCP / CI/CD / OAuth
- **Status:** [COMPLETED]
- **Summary:** Built and deployed the complete MCP Gateway (Phase 1 + Phase 2). FastAPI + FastMCP server on Cloud Run with 17 MCP tools — all operational. PostgreSQL module with 6 tools. Google Tasks (5 tools), Drive Write (3 tools), Calendar Sync (3 tools) — fully implemented with Google OAuth credentials. Google OAuth configured: consent screen, Desktop client, refresh token obtained, 3 Google secrets stored. Task Notification Cloud Function built. CI/CD pipeline established via Cloud Build with auto-deploy on push. Gateway redeployed with OAuth at 2026-03-14T21:58:09Z (image: be26f7c).
- **Architecture Decisions:**
  - **FastMCP 3.1.1 on FastAPI:** FastMCP mounted as sub-app on FastAPI with lifespan chaining for DB pool + MCP session management. Stateless HTTP mode for Cloud Run compatibility.
  - **Auth model:** Bearer token auth optional — validates if present, passes through if absent. Allows Claude.ai connectors (no auth headers) and Claude Code (Bearer token) to both connect.
  - **asyncpg with ssl=False:** Cloud SQL Auth Proxy handles TLS, so asyncpg must not attempt SSL negotiation. Fixed connection failures.
  - **MCP path mounting:** FastMCP sub-app mounted at root with `path="/mcp"` to avoid Starlette's 307 redirect from `/mcp` to `/mcp/` which Claude.ai's httpx client doesn't follow for POST requests.
  - **Cloud Build CI/CD:** Trigger `deploy-mcp-gateway` fires on push to main when files in `mcp-servers/ai-os-gateway/**` change. Builds Docker image (SHA + latest tags), pushes to Artifact Registry, deploys to Cloud Run.
  - **Google OAuth implementation:** Desktop client ID for server-side refresh token flow. google_oauth.py handles token refresh. Secrets stored in Secret Manager (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN). Cloud Run SA granted secretmanager.secretAccessor.
  - **Task Notification placed in workflows/category-b/:** Cloud Function code lives at `workflows/category-b/task-notification/` matching the project's existing directory structure.
- **Infrastructure Changes:**
  - Migration 005 applied: 6 new columns (google_task_id, google_task_list, last_synced_at on tasks; google_calendar_event_id on milestones; drive_file_id, drive_url on artifacts)
  - Secrets created: MCP_GATEWAY_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
  - IAM: ai-os-cicd service account granted secretmanager.secretAccessor role
  - Cloud Run service deployed: ai-os-gateway (asia-south1, scale-to-zero, 512Mi)
  - Cloud Build trigger created: deploy-mcp-gateway (auto-deploy on push)
  - Artifact Registry: ai-os-gateway image (multiple versions, latest: be26f7c)
- **Files Created (27 files, ~2,800 lines):**
  - MCP Gateway: main.py, config.py, bearer.py, google_oauth.py, postgres.py, google_tasks.py, drive_write.py, calendar_sync.py, Dockerfile, cloudbuild.yaml, requirements.txt, .env.example, tests/test_postgres.py
  - Cloud Function: workflows/category-b/task-notification/main.py + requirements.txt
  - Migration: database/migrations/005_google_sync_columns.sql
  - KB docs: GCP_INFRA_CONFIG.md, INTERFACE_STRATEGY.md added
- **Bugs Fixed During Build:**
  - asyncpg ssl=False required for cloud-sql-proxy connections
  - FastMCP 3.1.1 API changes (stateless_http moved from constructor to http_app())
  - FastMCP lifespan chaining (session_manager.run() replaced by mcp_app.router.lifespan_context)
  - bytes serialization for PostgreSQL char type in asyncpg
  - 307 redirect on /mcp path (mount at root with path="/mcp")
  - OAuth discovery endpoints removed (returning 200 confused Claude.ai into thinking OAuth required)
- **Deployment Verified:**
  - Cloud Run: healthy, DB connected, all 17 tools available, query_db returns live data
  - CI/CD: multiple successful builds, auto-trigger on push working
  - Gateway redeployed with OAuth modules at 2026-03-14T21:58:09Z (image: be26f7c)

---

### Entry 005 — Interface Layer Strategy Decision
- **Date:** 2026-03-14
- **Domain:** Architecture / Interface Layer / Dashboard / Mobile
- **Status:** [COMPLETED]
- **Summary:** Evaluated three interface strategies for the AI OS Layer 1 (Interface): Option A (Full Third-Party with Notion + Google), Option B (Full Custom with Next.js + React Native), Option C (Hybrid: Google Rails + Custom Intelligence Layer). After weighted analysis across 7 criteria (time to value, cost, power, control, AI integration depth, mobile experience, maintenance burden), Option C was selected. Created INTERFACE_STRATEGY.md as canonical reference. Updated TOOL_ECOSYSTEM_PLAN.md with dashboard service and revised phases.
- **Architecture Decisions:**
  - **Interface strategy: Option C — Google Rails + Custom Intelligence Layer.** Google Tasks, Calendar, and Drive serve as notification rails (delivery channels to the phone). Cloud SQL remains the single source of truth. A custom Next.js PWA serves as the AI intelligence layer (dashboards, analytics, risk surfacing).
  - **Google tools are downstream consumers, NOT data stores.** Task created in Claude → written to Cloud SQL → synced to Google Tasks. Never the reverse. Google Tasks is a notification surface, not canonical state.
  - **Notion deprioritized.** Creates data bifurcation (two sources of truth). Two-way sync is fragile (3 req/sec rate limits). $10/month for a middleman. Dashboard replaces Notion's workspace role.
  - **Dashboard is a separate Cloud Run service** (ai-os-dashboard) alongside the MCP Gateway (ai-os-gateway). Two services, not one — independent scaling, independent deployment, cleaner separation.
  - **PWA over native mobile.** One codebase (Next.js), installable on home screen, push notifications via FCM, no app store, no Apple Developer account ($99/yr saved). iOS 16.4+ required for push — acceptable since Google Tasks covers critical deadline notifications on all platforms.
  - **AI Risk Engine:** Daily Cloud Function computes overdue scores, velocity trends, milestone slip risk, dependency chain risk, stale project warnings. Results pushed via FCM to dashboard PWA.
  - **Design system locked:** Dark theme (obsidian palette), Instrument Serif + DM Sans + JetBrains Mono, color-coded accents (gold/teal/purple/red), card-based layouts.
- **KB Changes Made:**
  - INTERFACE_STRATEGY.md — NEW: Canonical reference for interface layer design
  - TOOL_ECOSYSTEM_PLAN.md — UPDATED: Dashboard service added, phases revised
  - WORK_PROJECTS.md — UPDATED: AI OS status reflects interface strategy decision
  - EVOLUTION_LOG.md — UPDATED: Entry 005 added

---

### Entry 004 — Tool Ecosystem Architecture Design
- **Date:** 2026-03-14
- **Domain:** Architecture / Tool Layer / MCP
- **Status:** [COMPLETED]
- **Summary:** Designed the three-tier tool ecosystem architecture for MCP and application access. Analyzed 4 initial tools (Google Tasks, Google Drive, Google Calendar, Evernote) plus future tools. Created TOOL_ECOSYSTEM_PLAN.md as canonical reference. Architecture minimizes GCP services to ONE Cloud Run service (Unified MCP Gateway) plus free directory connectors and local STDIO servers.
- **Architecture Decisions:**
  - **Three-tier tool access model:** Tier 1 (Directory Connectors), Tier 2 (Unified MCP Gateway), Tier 3 (Local STDIO MCP Servers)
  - **Modular gateway design:** Each tool = one Python module in the gateway. Adding a tool = adding a module + redeploying.
  - **Decision tree for new tools:** (1) Connector? (2) STDIO? (3) Gateway module? (4) Separate service?
  - **Cost model:** Total ecosystem = $0-7/month for gateway + $3-8/month for dashboard.

---

### Entry 003 — GCP Infrastructure + Data Layer Build
- **Date:** 2026-03-14
- **Domain:** Architecture / Data Layer / Infrastructure
- **Status:** [COMPLETED]
- **Summary:** Provisioned dedicated GCP project for AI OS. Configured all infrastructure: 13 APIs, 3 service accounts, Artifact Registry, cross-project Cloud SQL access. Created ai_os database on shared Bharatvarsh Cloud SQL instance with pgvector. Applied all 4 migrations — 21 tables across 4 schema domains. Generated DB_SCHEMA.md as canonical schema reference.
- **Architecture Decisions:**
  - **Data layer: Cloud SQL PostgreSQL (shared instance with Bharatvarsh).** New database 'ai_os' on existing bharatvarsh-db instance (us-central1). pgvector 0.8.1 for embeddings.
  - **GCP project: ai-operating-system-490208** in asia-south1 (Mumbai). Separate from Bharatvarsh for clean IAM.
  - **Three service accounts:** ai-os-cloud-run, ai-os-cloud-functions, ai-os-cicd.
  - **Cross-region latency accepted:** DB in us-central1, services in asia-south1. ~200-280ms acceptable.
- **Schema Deployed:** 21 tables across 4 domains (Project Mgmt 6, Contacts 5, Pipeline 5, Knowledge 5)

---

### Entry 002 — AI Orchestration Layer Design + Category A Build
- **Date:** 2026-03-14
- **Domain:** Architecture / Interface Layer / All
- **Status:** [COMPLETED]
- **Summary:** Designed full AI Orchestration layer as three service categories. Started Category A implementation within this project as the central hub. Connected Gmail, Calendar, Drive connectors. Created new KB documents. Updated Owner Profile with career change.
- **Architecture Decisions:**
  - Three orchestration categories: A (Claude chat interface), B (Cloud Functions + Scheduler), C (LangGraph + Cloud Run)
  - This project is THE central hub — no separate project needed
  - Skills-first approach: encode workflows as KB documents, migrate to SKILL.md format
  - Directory connectors first, custom MCPs later
- **Connectors Activated:** Gmail, Google Calendar, Google Drive
- **Skills Created:** 15 total (Sprint 1 + Sprint 2)

---

### Entry 001 — Project Initialization
- **Date:** 2026-03-13
- **Domain:** Meta / All
- **Status:** [SUPERSEDED by Entry 002]
- **Summary:** Established the Claude Desktop project as the Interface Layer of the AI Operating System. Created foundational knowledge base documents.

---

*Add new entries above the oldest entry, newest first.*
