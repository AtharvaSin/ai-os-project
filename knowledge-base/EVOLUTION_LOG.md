# OS Evolution Log

A running record of design decisions, architecture changes, brainstorming outcomes, and key artifacts produced across sessions.

---

## How to Use This Log
- After each significant session, add an entry with date, domain, decisions made, and artifacts produced
- Reference this log when starting new sessions to maintain continuity
- Mark items as [ACTIVE], [COMPLETED], [PARKED], or [SUPERSEDED]

---

## Log Entries

### Entry 006 — MCP Gateway Build + Cloud Run Deployment + CI/CD
- **Date:** 2026-03-15
- **Domain:** Infrastructure / Tool Layer / MCP / CI/CD
- **Status:** [ACTIVE]
- **Summary:** Built and deployed the complete MCP Gateway (Phase 1 + Phase 2 stubs + Phase 2b). FastAPI + FastMCP server on Cloud Run with 17 MCP tools registered. PostgreSQL module fully operational with 6 tools. Google Tasks, Drive Write, Calendar Sync modules stubbed with full tool descriptions. Task Notification Cloud Function built. CI/CD pipeline established via Cloud Build with auto-deploy on push.
- **Architecture Decisions:**
  - **FastMCP 3.1.1 on FastAPI:** FastMCP mounted as sub-app on FastAPI with lifespan chaining for DB pool + MCP session management. Stateless HTTP mode for Cloud Run compatibility.
  - **Auth model:** Bearer token auth optional — validates if present, passes through if absent. Allows Claude.ai connectors (no auth headers) and Claude Code (Bearer token) to both connect.
  - **asyncpg with ssl=False:** Cloud SQL Auth Proxy handles TLS, so asyncpg must not attempt SSL negotiation. Fixed connection failures.
  - **MCP path mounting:** FastMCP sub-app mounted at root with `path="/mcp"` to avoid Starlette's 307 redirect from `/mcp` to `/mcp/` which Claude.ai's httpx client doesn't follow for POST requests.
  - **Cloud Build CI/CD:** Trigger `deploy-mcp-gateway` fires on push to main when files in `mcp-servers/ai-os-gateway/**` change. Builds Docker image (SHA + latest tags), pushes to Artifact Registry, deploys to Cloud Run.
  - **Task Notification placed in workflows/category-b/:** Cloud Function code lives at `workflows/category-b/task-notification/` matching the project's existing directory structure.
  - **Pipeline seeded:** `task-notification-daily` pipeline added to the pipelines table for log_pipeline_run tool.
- **Infrastructure Changes:**
  - Migration 005 applied: 6 new columns (google_task_id, google_task_list, last_synced_at on tasks; google_calendar_event_id on milestones; drive_file_id, drive_url on artifacts)
  - Secret created: MCP_GATEWAY_API_KEY in Secret Manager
  - IAM: ai-os-cicd service account granted secretmanager.secretAccessor role
  - Cloud Run service deployed: ai-os-gateway (asia-south1, scale-to-zero, 512Mi)
  - Cloud Build trigger created: deploy-mcp-gateway (auto-deploy on push)
  - Artifact Registry: ai-os-gateway image (v0.1.0, v0.1.1, v0.1.2, latest)
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
  - Cloud Run: healthy, DB connected, 17 tools available, query_db returns live data
  - CI/CD: 2 successful builds, auto-trigger on push working
  - Claude.ai connector: added as custom integration (connection in progress)
- **Next Steps:**
  - [ ] Complete Claude.ai custom connector connection
  - [ ] Connect Claude Code via MCP config
  - [ ] Set up Google OAuth credentials for Phase 2 (Tasks, Drive, Calendar)
  - [ ] Implement full Google Tasks module (replace stubs)
  - [ ] Implement full Drive Write module (replace stubs)
  - [ ] Implement full Calendar Sync module (replace stubs)
  - [ ] Deploy Task Notification Cloud Function + Cloud Scheduler trigger
  - [ ] Start daily /morning-brief ritual

---

### Entry 005 — Interface Layer Strategy Decision
- **Date:** 2026-03-14
- **Domain:** Architecture / Interface Layer / Dashboard / Mobile
- **Status:** [ACTIVE]
- **Summary:** Evaluated three interface strategies for the AI OS Layer 1 (Interface): Option A (Full Third-Party with Notion + Google), Option B (Full Custom with Next.js + React Native), Option C (Hybrid: Google Rails + Custom Intelligence Layer). After weighted analysis across 7 criteria (time to value, cost, power, control, AI integration depth, mobile experience, maintenance burden), Option C was selected. Created INTERFACE_STRATEGY.md as canonical reference. Updated TOOL_ECOSYSTEM_PLAN.md with dashboard service and revised phases.
- **Architecture Decisions:**
  - **Interface strategy: Option C — Google Rails + Custom Intelligence Layer.** Google Tasks, Calendar, and Drive serve as notification rails (delivery channels to the phone). Cloud SQL remains the single source of truth. A custom Next.js PWA serves as the AI intelligence layer (dashboards, analytics, risk surfacing).
  - **Google tools are downstream consumers, NOT data stores.** Task created in Claude → written to Cloud SQL → synced to Google Tasks. Never the reverse. Google Tasks is a notification surface, not canonical state.
  - **Notion deprioritized.** Creates data bifurcation (two sources of truth). Two-way sync is fragile (3 req/sec rate limits). $10/month for a middleman. Dashboard replaces Notion's workspace role.
  - **Dashboard is a separate Cloud Run service** (ai-os-dashboard) alongside the MCP Gateway (ai-os-gateway). Two services, not one — independent scaling, independent deployment, cleaner separation.
  - **PWA over native mobile.** One codebase (Next.js), installable on home screen, push notifications via FCM, no app store, no Apple Developer account ($99/yr saved). iOS 16.4+ required for push — acceptable since Google Tasks covers critical deadline notifications on all platforms.
  - **AI Risk Engine:** Daily Cloud Function computes overdue scores, velocity trends, milestone slip risk, dependency chain risk, stale project warnings. Results pushed via FCM to dashboard PWA.
  - **Schema additions planned:** google_task_id, drive_file_id, drive_url columns on existing tables. New tables: risk_alerts, notifications, user_preferences.
  - **Design system locked:** Dark theme (obsidian palette), Instrument Serif + DM Sans + JetBrains Mono, color-coded accents (gold/teal/purple/red), card-based layouts. Consistent with Claude artifact visual conventions.
  - **Implementation phases updated:**
    - Phase 2 (Now → 6 weeks): Google Tasks + Drive Write + Calendar Sync MCP modules + Task notification Cloud Function
    - Phase 3a (6-12 weeks): Dashboard scaffold + PWA + auth + Command Center + Gantt + Task Board
    - Phase 3b (8-14 weeks): AI Risk Engine + push notifications + Risk Dashboard
    - Phase 4-5 (3-6 months): Content Calendar, Pipeline Monitor, Knowledge Explorer, Analytics
- **KB Changes Made:**
  - INTERFACE_STRATEGY.md — NEW: Canonical reference for interface layer design, component architecture, data flow patterns, schema additions, deployment topology, design system, implementation phases, cost model
  - TOOL_ECOSYSTEM_PLAN.md — UPDATED: Dashboard service added, Notion marked as deprioritized, Calendar Sync module added (P1), implementation phases revised, cost model updated ($3-15/month), decision tree extended (step 5: dashboard pages)
  - WORK_PROJECTS.md — UPDATED: AI OS status reflects interface strategy decision, next milestone updated, tech stack includes Next.js and FCM, context includes INTERFACE_STRATEGY.md
  - EVOLUTION_LOG.md — UPDATED: Entry 005 added
  - Project Instructions — AMENDMENT DRAFTED: KB catalogue updated, interface routing rules updated, W4 workstream updated
- **Artifacts Produced:**
  - Interactive strategy report (React artifact) — 6-tab analysis with requirements decomposition, option comparison, weighted matrix, architecture diagrams, implementation roadmap, and cost model
  - INTERFACE_STRATEGY.md — Full specification document
  - Updated KB files (TOOL_ECOSYSTEM_PLAN.md, WORK_PROJECTS.md, EVOLUTION_LOG.md)
  - Project Instructions amendment (draft for manual application)
- **Next Steps:**
  - [ ] Upload INTERFACE_STRATEGY.md to project KB
  - [ ] Replace TOOL_ECOSYSTEM_PLAN.md, WORK_PROJECTS.md, EVOLUTION_LOG.md in project KB
  - [ ] Apply Project Instructions amendment (manual — see draft)
  - [ ] Mirror INTERFACE_STRATEGY.md to Claude Code knowledge-base directory
  - [ ] Build MCP Gateway scaffold + PostgreSQL module (Claude Code, Phase 1, 3-5 days)
  - [ ] Add Google Tasks + Drive Write + Calendar Sync modules (Claude Code, Phase 2, 3-4 days)
  - [ ] Build Task Notification Cloud Function (Claude Code, Phase 2b, 2-3 days)
  - [ ] Set up Firebase project + FCM for push notifications (before Phase 3)
  - [ ] Build Dashboard scaffold + PWA + auth (Claude Code, Phase 3a, 3-4 days)

---

### Entry 004 — Tool Ecosystem Architecture Design
- **Date:** 2026-03-14
- **Domain:** Architecture / Tool Layer / MCP
- **Status:** [ACTIVE]
- **Summary:** Designed the three-tier tool ecosystem architecture for MCP and application access. Analyzed 4 initial tools (Google Tasks, Google Drive, Google Calendar, Evernote) plus future tools (Slack, Notion, Canva, n8n, WhatsApp, Bharatvarsh admin). Created TOOL_ECOSYSTEM_PLAN.md as canonical reference. Architecture minimizes GCP services to ONE Cloud Run service (Unified MCP Gateway) plus free directory connectors and local STDIO servers.
- **Architecture Decisions:**
  - **Three-tier tool access model:**
    - Tier 1 — Directory Connectors: Zero infrastructure. One-click OAuth. Gmail, Calendar, Drive connected. Slack, Notion, Canva, GitHub pending.
    - Tier 2 — Unified MCP Gateway: ONE FastAPI container on Cloud Run. All custom tool modules inside one service. Scales to zero ($0-7/month). Accessible from Claude.ai (custom connector URL), Claude Code (MCP config), and Category B/C workflows (HTTP).
    - Tier 3 — Local STDIO MCP Servers: NPM packages as local subprocesses in Claude Code. Evernote, n8n, GitHub. Zero cloud cost.
  - **Modular gateway design:** Each tool = one Python module in the gateway. Shared DB pool, OAuth tokens, Secret Manager. Adding a tool = adding a module + redeploying. Not a new service.
  - **Gateway modules planned (by priority):** P0: PostgreSQL. P1: Google Tasks, Drive (write). P2: Bharatvarsh Admin, Lore Search. P3: WhatsApp, Content Tracker.
  - **Decision tree for new tools:** (1) Directory connector exists? Use it. (2) Claude Code only? Community STDIO MCP. (3) Multi-interface needed? Gateway module. (4) Heavy compute? Separate service (rare).
  - **Cost model:** Total ecosystem = $0-7/month. One Cloud Run service + shared DB + free connectors + free local MCPs.
  - **Google Tasks vision:** Real-time execution tracker. Tasks sync to ai_os DB. Background text + resolution suggestions. Productivity metrics from task completion data.
  - **Evernote vision:** Evolve from static notes repository to real-time project documentation manager. Accessed via local STDIO MCP in Claude Code sessions.
- **KB Changes Made:**
  - TOOL_ECOSYSTEM_PLAN.md — NEW: Three-tier architecture, gateway module inventory, decision tree, implementation phases, cost model
  - WORK_PROJECTS.md — Updated: AI OS status reflects tool ecosystem design, adds TOOL_ECOSYSTEM_PLAN.md as context
  - EVOLUTION_LOG_ENTRY_003.md — Consolidated: All 3 fragmented log files merged into one with Entry 004 added
  - Project Instructions — Updated: KB catalogue includes TOOL_ECOSYSTEM_PLAN.md, architecture section references three-tier model
- **Artifacts Produced:**
  - AI_OS_Tool_Ecosystem_Plan.docx — Full vision document with architecture diagrams, module inventory, implementation plan
  - Three-tier architecture SVG diagram (inline in chat)
  - TOOL_ECOSYSTEM_PLAN.md — Condensed KB reference version
- **Next Steps:**
  - [x] ~~Build MCP Gateway scaffold + PostgreSQL module~~ → Remains priority, now part of Interface Strategy Phase 1-2
  - [x] ~~Add Google Tasks + Drive Write modules~~ → Elevated to Phase 2 of Interface Strategy
  - [ ] Add Bharatvarsh Admin + Lore Search modules (Claude Code, Phase 4, 2-3 days)
  - [ ] Install Evernote + n8n local STDIO MCPs (Claude Code, Phase 5, 1-2 days)
  - [ ] Connect Slack, Canva directory connectors when available
  - [ ] Build Birthday Wishes Cloud Function (first Category B pipeline)
  - [ ] Start daily /morning-brief ritual
  - [ ] Establish /weekly-review cadence

---

### Entry 003 — GCP Infrastructure + Data Layer Build
- **Date:** 2026-03-14
- **Domain:** Architecture / Data Layer / Infrastructure
- **Status:** [ACTIVE]
- **Summary:** Provisioned dedicated GCP project for AI OS. Configured all infrastructure: 13 APIs, 3 service accounts, Artifact Registry, cross-project Cloud SQL access. Created ai_os database on shared Bharatvarsh Cloud SQL instance with pgvector. Applied all 4 migrations — 21 tables across 4 schema domains. Generated DB_SCHEMA.md as canonical schema reference.
- **Architecture Decisions:**
  - **Data layer: Cloud SQL PostgreSQL (shared instance with Bharatvarsh).** New database 'ai_os' on existing bharatvarsh-db instance (us-central1). pgvector 0.8.1 for embeddings, pg_trgm for full-text search, moddatetime for timestamps. Relational CTEs for graph queries on knowledge_connections table. No Supabase — standard SQL, provider-agnostic. GCS for file storage. Supabase migration path preserved via pg_dump/restore. Neo4j deferred to Phase 4+.
  - **GCP project: ai-operating-system-490208** in asia-south1 (Mumbai). Separate project from Bharatvarsh for clean IAM boundaries. Cross-project Cloud SQL access via cloudsql.client role.
  - **Three service accounts:** ai-os-cloud-run (Category C), ai-os-cloud-functions (Category B), ai-os-cicd (Cloud Build). All with cross-project DB access.
  - **Artifact Registry:** ai-os-images repo in asia-south1 for Docker images.
  - **Secrets:** AI_OS_DB_PASSWORD and AI_OS_DB_INSTANCE in Secret Manager. OPENAI_API_KEY to be added for embeddings.
  - **Cross-region latency accepted:** DB in us-central1, services in asia-south1. ~200-280ms latency acceptable because AI API calls (2-10s) dominate.
  - **Connection patterns:** Cloud Run via Auth Proxy sidecar, Cloud Functions via cloud-sql-python-connector, local dev via cloud-sql-proxy CLI.
- **Schema Deployed (21 tables across 4 domains):**
  - Migration 001 — Project Management (applied ✓): projects, project_phases, milestones, tasks, artifacts, project_tags. Seeded: 3 projects, 8 phases, 8 milestones, 12 tags.
  - Migration 002 — Contacts & Reference (applied ✓): contacts, contact_relationships, important_dates, audiences, audience_members. Seeded: 10 contacts, 12 important dates, 4 relationships, 3 audiences, 15 audience memberships.
  - Migration 003 — Pipeline Tracking (applied ✓): pipelines, pipeline_runs, pipeline_logs, campaigns, campaign_posts. Seeded: 5 pipeline definitions.
  - Migration 004 — Knowledge & Intelligence (applied ✓): knowledge_entries, knowledge_embeddings (vector(1536)), knowledge_connections, skill_registry, skill_evolution_log. Seeded: 15 skills registered. Postgres functions: match_knowledge(), traverse_knowledge().
- **KB Changes Made:**
  - GCP_INFRA_CONFIG.md — NEW: Canonical reference for all GCP project config, service accounts, database access, secrets, deployment patterns
  - DB_SCHEMA.md — NEW: Auto-generated schema reference (21 tables, indexes, functions, triggers, FK relationships, enum types)

---

### Entry 002 — AI Orchestration Layer Design + Category A Build
- **Date:** 2026-03-14
- **Domain:** Architecture / Interface Layer / All
- **Status:** [ACTIVE]
- **Summary:** Designed full AI Orchestration layer as three service categories. Started Category A implementation within this project as the central hub. Connected Gmail, Calendar, Drive connectors. Created new KB documents. Updated Owner Profile with career change.
- **Architecture Decisions:**
  - Three orchestration categories: A (Claude chat interface — this project), B (Cloud Functions + Scheduler), C (LangGraph + Cloud Run)
  - This project is THE central hub — no separate project needed
  - Claude.ai as primary surface, Claude Code for execution, Cowork for autonomous tasks
  - 5 workstreams: Research, Context & Planning, Content & Comms, System Admin, Creative
  - Skills-first approach: encode workflows as KB documents, migrate to SKILL.md format in Sprint 3
  - Directory connectors first (Gmail, Calendar, Drive done), custom MCPs in Sprint 3-4
  - LangGraph only for Category C (conditional/agentic workflows); Category B uses plain Python + Cloud Functions
  - Career update: Left PTG. Joining Zealogics as Technical Project Manager.
- **Connectors Activated:** Gmail ✓, Google Calendar ✓, Google Drive ✓
- **Skills Created:** Sprint 1 (5 skills) + Sprint 2 (10 skills) = 15 total. All 5 workstreams covered.
- **KB Documents Created:** OWNER_PROFILE.md, WORK_PROJECTS.md, BHARATVARSH_PLATFORM.md, AI&U Knowledge Pack (3 files), Profile Context Pack (4 files), CONTENT_CALENDAR.md, MARKETING_PLAYBOOK.md

---

### Entry 001 — Project Initialization
- **Date:** 2026-03-13
- **Domain:** Meta / All
- **Status:** [SUPERSEDED by Entry 002]
- **Summary:** Established the Claude Desktop project as the Interface Layer of the AI Operating System. Created foundational knowledge base documents: Owner Profile, Bharatvarsh Bible, and this Evolution Log.

---

*Add new entries above the oldest entry, newest first.*
