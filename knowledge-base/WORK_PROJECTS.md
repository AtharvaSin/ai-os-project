# Active Projects & Career Reference

> **Purpose:** Operational state file. Tells Claude what you're working on RIGHT NOW and where deep context lives. Updated after any session where project status shifts.
>
> **Last updated:** 2026-03-14 (tool ecosystem architecture designed, three-tier MCP model finalized)

---

## Active Focus Projects

### 1. AI Operating System
- **Status:** Phase 1 build — Category A complete. Data layer live. Tool ecosystem designed. Infrastructure ready. Next: build MCP Gateway.
- **Current phase:** Sprint 3 — Claude Code integrated, GCP provisioned, 21-table database deployed, three-tier tool ecosystem architecture finalized. Next: implement MCP Gateway (PostgreSQL module first), then first Category B workflow.
- **Next milestone:** Deploy AI OS MCP Gateway on Cloud Run (PostgreSQL module), then add Google Tasks + Drive Write modules
- **Pending decisions:** MCP Gateway implementation timing (depends on interface/code structure decisions), Birthday Wishes workflow priority
- **What's been built:**
  - Category A: 15 skills, 3 connectors (Gmail, Calendar, Drive), 20+ KB documents
  - Claude Code: Project directory with CLAUDE.md, 15 migrated SKILL.md skills, mirrored KB
  - GCP: Project ai-operating-system-490208 with 13 APIs, 3 service accounts, Artifact Registry, Secret Manager
  - Database: ai_os DB on Cloud SQL (shared Bharatvarsh instance), 21 tables across 4 domains, pgvector enabled
  - Architecture: Three-tier tool ecosystem — Tier 1 directory connectors / Tier 2 unified MCP Gateway / Tier 3 local STDIO MCPs
- **Context:** GCP_INFRA_CONFIG.md (KB), DB_SCHEMA.md (KB), TOOL_ECOSYSTEM_PLAN.md (KB), EVOLUTION_LOG.md (KB)
- **Tech stack:** Claude.ai + Claude Code, Cloud SQL PostgreSQL + pgvector, GCP (Cloud Run, Functions, Scheduler), FastAPI, LangGraph (future), Docker

### 2. AI&U YouTube Channel
- **Status:** Pre-launch — content system designed, brand defined, no videos published yet
- **Current phase:** Building first 10-video foundation library. Production pipeline being established.
- **Next milestone:** First video scripted, recorded, and published
- **Context:** AI&U Knowledge Pack — 3 files in KB (01_Foundation, 02_Content_System, 03_Brand_Production)

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
- **When active:** Move to Active Focus Projects. Update with role scope, engagements, stakeholders.

---

## Career Reference Index

| Phase | Role & Company | Key Domains | Proof Points | Deep Context |
|-------|---------------|-------------|--------------|--------------|
| 2025 | Practice Lead — AI & Cloud, People Tech Group | Oil & Gas, Aerospace, Electronics, GovTech, Airlines, Automotive | $3M pipeline, 11-member team, IntelligenceIQ suite, Vision AI, RAG, agentic workflows | Professional Experience Context Pack |
| 2022–2025 | Management Consultant, Accenture Strategy | Oil & Gas, Utilities, Airports, Capital Projects | Digital Twin (25% delivery improvement), operating model, procurement strategy | Professional Experience Context Pack |
| 2016–2020 | Planning Engineer, Larsen & Toubro | Urban Infrastructure | Micro-tunnelling lead, productivity improvements, field leadership | Professional Experience Context Pack |
| 2020–2022 | MBA — IIM Mumbai | Supply Chain & Operations | MADALA Scholar, Head of Design & Communications | Master Profile |
| 2012–2016 | B.Tech — NIT Durgapur | Civil Engineering | Top 1% entrance exam | Master Profile |

---

## Personal Projects (Background / Paused)

| Project | What it is | Status |
|---------|-----------|--------|
| Pulse | AI social media manager | Paused |
| Zephyr | AI life operating system | Paused — concepts feeding into AI OS |
| Luminary | AI YouTube channel manager | Paused — concepts feeding into AI&U |
