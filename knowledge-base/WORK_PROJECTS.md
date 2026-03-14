# Active Projects & Career Reference

> **Purpose:** Operational state file. Tells Claude what you're working on RIGHT NOW and where deep context lives. Updated after any session where project status shifts.
>
> **Last updated:** 2026-03-15 (MCP Gateway deployed, Phase 1 complete, CI/CD active)

---

## Active Focus Projects

### 1. AI Operating System
- **Status:** Phase 1 complete, Phase 2 stubs deployed. MCP Gateway live on Cloud Run with 17 tools (6 PostgreSQL tools operational, 11 Google sync stubs). CI/CD pipeline active via Cloud Build. Migration 005 applied. Next: Google OAuth setup, Phase 2 full implementation, then Dashboard PWA.
- **Current phase:** Sprint 4 — MCP Gateway deployed and verified on Cloud Run. PostgreSQL module fully operational. Google Tasks, Drive Write, Calendar Sync modules stubbed (pending Google OAuth credentials). Task Notification Cloud Function built (pending deployment). CI/CD auto-deploys on push to main. Next: set up Google OAuth, implement full Phase 2 modules, deploy Task Notification function + Cloud Scheduler trigger.
- **Next milestone:** Set up Google OAuth credentials, implement full Google Tasks + Drive Write + Calendar Sync modules (replace stubs), deploy Task Notification Cloud Function with Cloud Scheduler
- **Pending decisions:** Google OAuth credential setup, Dashboard design system finalization, Birthday Wishes workflow priority, FCM project setup timing
- **What's been built:**
  - Category A: 15 skills, 3 connectors (Gmail, Calendar, Drive), 20+ KB documents
  - Claude Code: Project directory with CLAUDE.md, 15 migrated SKILL.md skills, mirrored KB
  - GCP: Project ai-operating-system-490208 with 13 APIs, 3 service accounts, Artifact Registry, Secret Manager
  - Database: ai_os DB on Cloud SQL (shared Bharatvarsh instance), 21 tables across 4 domains, pgvector enabled, Migration 005 applied (Google sync columns)
  - MCP Gateway: Deployed on Cloud Run (ai-os-gateway, asia-south1, scale-to-zero). FastAPI + FastMCP 3.1.1. 17 tools registered. PostgreSQL module live (6 tools). Google Tasks/Drive Write/Calendar Sync stubs (11 tools). Bearer token auth.
  - CI/CD: Cloud Build trigger `deploy-mcp-gateway` auto-deploys on push to main. Artifact Registry images (v0.1.0-v0.1.2+).
  - Task Notification: Cloud Function built at workflows/category-b/task-notification/ (pending deployment)
  - Architecture: Three-tier tool ecosystem — Tier 1 directory connectors / Tier 2 unified MCP Gateway / Tier 3 local STDIO MCPs
  - Interface Strategy: Option C decided — Google Tasks/Calendar/Drive as notification rails, Next.js PWA as intelligence layer, Cloud SQL as single source of truth
- **Context:** GCP_INFRA_CONFIG.md (KB), DB_SCHEMA.md (KB), TOOL_ECOSYSTEM_PLAN.md (KB), INTERFACE_STRATEGY.md (KB), EVOLUTION_LOG.md (KB)
- **Tech stack:** Claude.ai + Claude Code, Cloud SQL PostgreSQL + pgvector, GCP (Cloud Run, Functions, Scheduler, Cloud Build), FastAPI, FastMCP, Next.js (Phase 3), Firebase Cloud Messaging (Phase 3), LangGraph (future), Docker

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
