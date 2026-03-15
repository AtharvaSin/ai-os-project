# Active Projects & Career Reference

> **Purpose:** Operational state file. Tells Claude what you're working on RIGHT NOW and where deep context lives. Updated after any session where project status shifts.
>
> **Last updated:** 2026-03-15 (State v4: Dashboard PWA deployed to Cloud Run. All 17 MCP tools live. 8 secrets. Next: Cloud Build trigger for dashboard, Task Notification function, Phase 3b.)
> **Authoritative state:** See `knowledge-base/PROJECT_STATE.md` for verified filesystem-scanned state.

---

## Active Focus Projects

### 1. AI Operating System
- **Status:** Phase 3a complete and deployed. MCP Gateway live with all 17 tools. Dashboard PWA live on Cloud Run. Database seeded with 28 tasks. Google OAuth configured for both Gateway (Desktop client) and Dashboard (Web Application client). 8 secrets in Secret Manager. 16 GCP APIs enabled. CI/CD auto-deploys Gateway; Dashboard requires manual deploy.
- **Current phase:** Sprint 5 — Post-deployment stabilization. Dashboard PWA is live at https://ai-os-dashboard-sv4fbx5yna-el.a.run.app. All 17 MCP tools operational on Gateway. Task Notification function built (pending deployment). Cloud Build trigger for dashboard not yet created. Claude.ai MCP connector pending completion.
- **Next milestone:** Create Cloud Build trigger for dashboard auto-deploy, deploy Task Notification Cloud Function + Cloud Scheduler, complete Claude.ai MCP connector, begin Phase 3b (AI Risk Engine + push notifications).
- **Pending decisions:** Firebase project setup timing (needed for FCM push notifications), Risk Dashboard design, Cloud Build trigger configuration for dashboard
- **What's been built:**
  - Category A: 18 skills, 3 connectors (Gmail, Calendar, Drive), 27+ KB files
  - Claude Code: Project directory with CLAUDE.md, 18 SKILL.md skills, mirrored KB
  - GCP: Project ai-operating-system-490208 with 16 APIs, 3 service accounts, Artifact Registry, Secret Manager (8 secrets)
  - Database: ai_os DB on Cloud SQL (shared Bharatvarsh instance), 21 tables across 4 domains, pgvector enabled, Migrations 001-005 applied, 28 tasks seeded
  - MCP Gateway: LIVE on Cloud Run (ai-os-gateway, asia-south1, scale-to-zero). FastAPI + FastMCP 3.1.1. 17 tools ALL operational. PostgreSQL (6 tools), Google Tasks (5 tools), Drive Write (3 tools), Calendar Sync (3 tools). Image: be26f7c. Bearer token auth.
  - Google OAuth: Desktop client for Gateway (refresh token). Web Application client for Dashboard (DASHBOARD_OAUTH_SECRET). Consent screen configured.
  - Dashboard PWA: LIVE on Cloud Run (ai-os-dashboard, asia-south1, scale-to-zero). Next.js 14 + TypeScript + Tailwind CSS. 6 pages (Command Center, Project Detail, Task Board, Gantt Timeline, Sign-in, Error). 7 API routes. 16 components (Kanban with drag-and-drop, custom CSS Grid Gantt, QuickAdd modal). NextAuth.js Google OAuth. Obsidian Aurora design system. PWA with service worker + offline fallback. Multi-stage Dockerfile.
  - CI/CD: Cloud Build trigger `deploy-mcp-gateway` auto-deploys on push to main. Dashboard deployed manually (cloudbuild.yaml ready, no trigger).
  - Task Notification: Cloud Function built at workflows/category-b/task-notification/ (pending deployment)
  - Seeds: 28 tasks (AI OS 12, AI&U 8, Bharatvarsh 8), all milestone due dates set
  - Scripts: google_oauth_setup.py (OAuth token flow), migration_005_google_sync.sql (applied)
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
