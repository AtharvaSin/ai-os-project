# Active Projects & Career Reference

> **Purpose:** Operational state file. Tells Claude what you're working on RIGHT NOW and where deep context lives. Updated after any session where project status shifts.
>
> **Last updated:** 2026-03-16 (State v6: Knowledge Layer V2 deployed. Telegram Bot deployed — @AsrAiOsbot with 5 commands, AI triage, 3 scheduled notifications. 8 Cloud Run services, 27 tables, 22 MCP tools, 13 secrets.)
> **Authoritative state:** See `knowledge-base/PROJECT_STATE.md` for verified filesystem-scanned state.

---

## Active Focus Projects

### 1. AI Operating System
- **Status:** Knowledge Layer V2 deployed. Telegram Bot deployed. MCP Gateway live with 22 tools (5 modules). Dashboard PWA live. 8 Cloud Run services. 8 Cloud Scheduler jobs. 27 tables. 13 secrets. All infrastructure operational.
- **Current phase:** Sprint 6 — Telegram Bot deployed, Knowledge seeding pending. All code deployed. Pending: seed knowledge base (Drive folders + 38 docs), complete Claude.ai MCP connector.
- **Next milestone:** Seed knowledge base (80-100+ entries via Drive scanner), connect Claude.ai MCP connector. Then Phase 3b (AI Risk Engine + push notifications).
- **Pending decisions:** Firebase project setup timing (Phase 3b), Knowledge Layer monitoring/alerting strategy, Drive folder creation method (MCP vs manual), Telegram bot Phase T4 features prioritization
- **What's been built:**
  - Category A: 18 skills, 3 connectors (Gmail, Calendar, Drive), 27+ KB files
  - Claude Code: Project directory with CLAUDE.md, 18 SKILL.md skills, mirrored KB
  - GCP: Project ai-operating-system-490208 with 16 APIs, 3 service accounts, Artifact Registry, Secret Manager (13 secrets)
  - Database: ai_os DB on Cloud SQL (shared Bharatvarsh instance), 27 tables across 5 domains, pgvector enabled, Migrations 001-008 all applied, 28 tasks seeded
  - MCP Gateway: LIVE on Cloud Run (ai-os-gateway, asia-south1, scale-to-zero). FastAPI + FastMCP. 22 tools ALL operational. PostgreSQL (6), Google Tasks (5), Drive Write (3), Calendar Sync (3), Telegram (5). Telegram webhook subsystem (8 files). Bearer token auth.
  - Google OAuth: Desktop client for Gateway (refresh token). Web Application client for Dashboard (DASHBOARD_OAUTH_SECRET). Consent screen configured.
  - Dashboard PWA: LIVE on Cloud Run (ai-os-dashboard, asia-south1, scale-to-zero). Next.js 14 + TypeScript + Tailwind CSS. 6 pages. 7 API routes. 16 components. NextAuth.js Google OAuth. Obsidian Aurora design system. PWA with service worker + offline fallback.
  - CI/CD: Cloud Build triggers: deploy-mcp-gateway (auto) + deploy-ai-os-dashboard (auto). 8 Cloud Scheduler jobs.
  - Task Notification: LIVE on Cloud Run + Cloud Scheduler (daily 06:00 IST)
  - Knowledge Layer V2: DEPLOYED. 4 pipeline services LIVE on Cloud Run (embedding-generator, drive-knowledge-scanner, weekly-knowledge-summary, knowledge-auto-connector). Shared library (ai_os_knowledge.py). 38 seed documents ready. 5 Cloud Scheduler triggers. 3 skills RAG-grounded (morning-brief, weekly-review, session-resume).
  - Telegram Bot: DEPLOYED. @AsrAiOsbot with webhook on MCP Gateway. 5 slash commands (/brief, /add, /done, /status, /log). AI triage via Claude Haiku. Conversation memory with thread management. telegram-notifications Cloud Run service with 3 scheduled notifications (morning brief, overdue alerts, weekly digest). Inline keyboard callbacks.
  - Seeds: 28 tasks (AI OS 12, AI&U 8, Bharatvarsh 8), all milestone due dates set
  - Scripts: google_oauth_setup.py, deploy_knowledge_layer_v2.sh, seed_knowledge_connections.py, generate_knowledge_snapshots.py
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
