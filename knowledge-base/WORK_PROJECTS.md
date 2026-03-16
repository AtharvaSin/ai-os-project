# Active Projects & Career Reference

> **Purpose:** Operational state file. Tells Claude what you're working on RIGHT NOW and where deep context lives. Updated after any session where project status shifts.
>
> **Last updated:** 2026-03-17 (State v7: Drive Read module + Task Annotation Sync + Risk Engine + Daily Brief Engine + Dashboard expansion. 26 MCP tools. 19 skills. Dashboard: 8 pages, 12 API routes, 22 components. 3 new Category B services built.)
> **Authoritative state:** See `knowledge-base/PROJECT_STATE.md` for verified filesystem-scanned state.

---

## Active Focus Projects

### 1. AI Operating System
- **Status:** Phase 3b in progress. MCP Gateway 26 tools (6 modules). Dashboard 8 pages, 12 API routes, 22 components. 3 new Category B services built (risk-engine, daily-brief-engine, task-annotation-sync). 19 skills. 8 Cloud Run services live. 27 tables live, 2 pending migrations (009-010). 13 secrets. All core infrastructure operational.
- **Current phase:** Sprint 7 — Phase 3b (Risk Engine + Dashboard expansion + Daily Brief + Task Annotations). Code built, pending commit + deploy + migration apply.
- **Next milestone:** Commit all uncommitted code (30+ files), apply migrations 009-010, deploy 3 new services, seed knowledge base. Then push notifications (FCM).
- **Pending decisions:** Firebase project setup timing, deployment order for 3 new services, knowledge seeding method (manual vs automated), daily brief delivery channels configuration
- **What's been built:**
  - Category A: 19 skills, 3 connectors (Gmail, Calendar, Drive), 27+ KB files
  - Claude Code: Project directory with CLAUDE.md, 19 SKILL.md skills, mirrored KB
  - GCP: Project ai-operating-system-490208 with 16 APIs, 3 service accounts, Artifact Registry, Secret Manager (13 secrets)
  - Database: ai_os DB on Cloud SQL (shared Bharatvarsh instance), 27 tables across 5 domains, pgvector enabled, Migrations 001-008 all applied, 28 tasks seeded
  - MCP Gateway: LIVE on Cloud Run (ai-os-gateway, asia-south1, scale-to-zero). FastAPI + FastMCP. 26 tools (22 live, 4 pending deploy). 6 modules: PostgreSQL (6), Google Tasks (6), Drive Write (3), Drive Read (3), Calendar Sync (3), Telegram (5). Telegram webhook subsystem (8 files). Bearer token auth.
  - Google OAuth: Desktop client for Gateway (refresh token). Web Application client for Dashboard (DASHBOARD_OAUTH_SECRET). Consent screen configured.
  - Dashboard PWA: LIVE on Cloud Run (ai-os-dashboard, asia-south1, scale-to-zero). Next.js 14 + TypeScript + Tailwind CSS. 8 pages (6 live + 2 built). 12 API routes (7 live + 5 built). 22 components (16 live + 6 built). NextAuth.js Google OAuth. Obsidian Aurora design system. PWA with service worker + offline fallback. New: Risk Dashboard, Pipeline Monitor, Knowledge Health card.
  - CI/CD: Cloud Build triggers: deploy-mcp-gateway (auto) + deploy-ai-os-dashboard (auto). 8 Cloud Scheduler jobs.
  - Task Notification: LIVE on Cloud Run + Cloud Scheduler (daily 06:00 IST)
  - Knowledge Layer V2: DEPLOYED. 4 pipeline services LIVE on Cloud Run (embedding-generator, drive-knowledge-scanner, weekly-knowledge-summary, knowledge-auto-connector). Shared library (ai_os_knowledge.py). 38 seed documents ready. 5 Cloud Scheduler triggers. 3 skills RAG-grounded (morning-brief, weekly-review, session-resume).
  - Telegram Bot: DEPLOYED. @AsrAiOsbot with webhook on MCP Gateway. 5 slash commands (/brief, /add, /done, /status, /log). AI triage via Claude Haiku. Conversation memory with thread management. telegram-notifications Cloud Run service with 3 scheduled notifications (morning brief, overdue alerts, weekly digest). Inline keyboard callbacks.
  - Risk Engine: BUILT. AI Risk Engine (580 lines) computes overdue scores, velocity trends, milestone slip, dependency chains, stale warnings. Writes to risk_alerts table. Cloud Run service with Dockerfile + cloudbuild.yaml.
  - Daily Brief Engine: BUILT. Automated daily brief (14 files) with collectors (calendar, gmail, knowledge, tasks), AI composer (Claude Haiku), and multi-channel delivery (Telegram, Drive, Google Tasks).
  - Task Annotation Sync: BUILT. Two-way Google Tasks notes sync (212 lines). Captures user annotations from mobile every 15 min. SHA-256 content-hash deduplication.
  - Drive Read Module: BUILT. 3 MCP tools (list_drive_files, read_drive_file, get_drive_changes_summary). 438 lines.
  - Seeds: 28 tasks (AI OS 12, AI&U 8, Bharatvarsh 8), all milestone due dates set
  - Scripts: google_oauth_setup.py, deploy_knowledge_layer_v2.sh, seed_knowledge_connections.py, generate_knowledge_snapshots.py, seed_knowledge_drive.py
  - Architecture: Three-tier tool ecosystem — Tier 1 directory connectors / Tier 2 unified MCP Gateway / Tier 3 local STDIO MCPs
  - Interface Strategy: Option C decided — Google Tasks/Calendar/Drive as notification rails, Next.js PWA as intelligence layer, Cloud SQL as single source of truth
- **Context:** PROJECT_STATE.md (KB — authoritative state), GCP_INFRA_CONFIG.md (KB), DB_SCHEMA.md (KB), TOOL_ECOSYSTEM_PLAN.md (KB), INTERFACE_STRATEGY.md (KB), EVOLUTION_LOG.md (KB)
- **Tech stack:** Claude.ai + Claude Code, Cloud SQL PostgreSQL + pgvector, GCP (Cloud Run, Functions, Scheduler, Cloud Build), FastAPI, FastMCP, Next.js 14, NextAuth.js, Tailwind CSS, @hello-pangea/dnd, Docker, Firebase Cloud Messaging (Phase 3b)

### 2. AI&U YouTube Channel
- **Status:** Pre-launch — content system designed, brand defined, no videos published yet
- **Current phase:** Building first 10-video foundation library. Production pipeline being established.
- **Next milestone:** First video scripted, recorded, and published
- **Pending decisions:** Recording setup finalization, first video topic selection, thumbnail template creation
- **Context:** AI&U Knowledge Pack — 3 files in KB (01_Foundation, 02_Content_System, 03_Brand_Production)
- **Pillars:** (1) AI for Common Person, (2) Using AI Tools, (3) Building AI Workflows

### 3. Bharatvarsh Novel & Transmedia
- **Status:** Published + live website. Marketing and community-building phase.
- **Current phase:** Growing readership, transmedia development (website lore, forum, Bhoomi AI). Sequel in early development.
- **Next milestone:** Content marketing cadence established
- **Context:** BHARATVARSH_BIBLE.md (KB — lore), BHARATVARSH_PLATFORM.md (KB — website/tech/marketing)
- **Live at:** welcometobharatvarsh.com | Amazon | Flipkart | Notion Press

---

## Incoming

### Zealogics — Technical Project Manager
- **Status:** Joining (start date TBD)
- **Company:** Zealogics Inc — global technology company (HQ: New Jersey). IT consulting, engineering, systems implementation.
- **Domains:** Semiconductor, Automotive, Finance, Healthcare, Telecom, Retail, Manufacturing, Energy
- **When active:** Move to Active Focus Projects. Update with role scope, engagements, stakeholders.

---

## Career Reference Index

> Claude: use this to pull relevant experience when context is needed. Deep details are in the Profile Context Pack files.

| Phase | Role & Company | Key Domains | Proof Points | Deep Context |
|-------|---------------|-------------|--------------|--------------|
| 2025 | Practice Lead — AI & Cloud, People Tech Group | Oil & Gas, Aerospace, Electronics, GovTech, Airlines, Automotive | $3M pipeline, 11-member team, 5-day problem-to-demo cycle, IntelligenceIQ suite, Vision AI, RAG, agentic workflows | Professional Experience Context Pack |
| 2022–2025 | Management Consultant, Accenture Strategy | Oil & Gas, Utilities, Airports, Capital Projects | Digital Twin (25% delivery improvement), €450M operating model, procurement strategy (~12% savings) | Professional Experience Context Pack |
| 2016–2020 | Planning Engineer, Larsen & Toubro | Urban Infrastructure | Micro-tunnelling lead, productivity improvements, ERP piloting, field team leadership | Professional Experience Context Pack |
| 2020–2022 | MBA — IIM Mumbai | Supply Chain & Operations | MADALA Scholar, Head of Design & Communications | Master Profile |
| 2012–2016 | B.Tech — NIT Durgapur | Civil Engineering | Top 1% entrance exam, national sports | Master Profile |

---

## Personal Projects (Background / Paused)

| Project | What it is | Status |
|---------|-----------|--------|
| Pulse | AI social media manager (GPT-4 + Claude, FastAPI, React, Azure) | Paused |
| Zephyr | AI life operating system (NLP tasks, journaling, Google integrations) | Paused — concepts feeding into AI OS |
| Luminary | AI YouTube channel manager (scripting, thumbnails, SEO) | Paused — concepts feeding into AI&U |
| Gamers Anonymous | YouTube gaming channel (cinematic essays + Shorts) | Low priority |
