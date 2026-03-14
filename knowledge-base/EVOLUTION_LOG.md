# OS Evolution Log

A running record of design decisions, architecture changes, brainstorming outcomes, and key artifacts produced across sessions.

---

## How to Use This Log
- After each significant session, add an entry with date, domain, decisions made, and artifacts produced
- Reference this log when starting new sessions to maintain continuity
- Mark items as [ACTIVE], [COMPLETED], [PARKED], or [SUPERSEDED]

---

## Log Entries

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
  - [ ] Build MCP Gateway scaffold + PostgreSQL module (Claude Code, Phase 1, 3-5 days)
  - [ ] Add Google Tasks + Drive Write modules (Claude Code, Phase 2, 2-3 days)
  - [ ] Add Bharatvarsh Admin + Lore Search modules (Claude Code, Phase 3, 2-3 days)
  - [ ] Install Evernote + n8n local STDIO MCPs (Claude Code, Phase 4, 1-2 days)
  - [ ] Connect Slack, Notion, Canva directory connectors when available
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
