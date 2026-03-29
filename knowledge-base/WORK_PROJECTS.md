# Active Projects & Career Reference

> **Purpose:** Operational state file. Tells Claude what you're working on RIGHT NOW and where deep context lives. Updated after any session where project status shifts.
>
> **Last updated:** 2026-03-27 (State v21: ~111 MCP tools (17 functional modules). 35 skills. 3 Cowork plugins. 47 tables (migration 020 applied). 891 contacts. NotebookLM Tier 3 (14 notebooks, ~700 sources). Video Production System: unified Remotion 4.0.438, 18 common components, 88 project compositions, BrandTokens, 4 CLI tools. Dashboard: 8+ pages, 38 components, 35 API routes. Content pipeline: 13 posts in DB.)
> **Authoritative state:** See `knowledge-base/PROJECT_STATE.md` for verified filesystem-scanned state.

---

## Active Focus Projects

### 1. AI Operating System
- **Status:** Active. Sprint 12 + content strategy + video production. 47 tables (migration 020 applied), ~111 MCP tools (17 functional modules), 13 Cloud Run services, domain-based Google Task lists, 35 skills, 3 Cowork plugins. 13 secrets. NotebookLM (Tier 3, 14 notebooks, ~700 sources). Daily Brief Engine v2. Dashboard: 8+ pages, 38 components, 35 API routes. Content pipeline: 13 posts in DB. **Video Production System: unified Remotion 4.0.438, 18 common components, 88 project compositions, BrandTokens interface, 4 CLI tools.**
- **Current phase:** Content Strategy v2 + Video Production System operational. 4-layer funnel strategy with 3-axis taxonomy. 13 posts in DB. Video production system built with 106 total components (18 common + 88 project-specific).
- **Next milestone:** Complete AI&U Video 2 remaining sections. Seed 015. Add X/Twitter + LinkedIn/Meta credentials. First Category C LangGraph workflow.
- **Pending decisions:** LinkedIn/Meta OAuth credential setup, Firebase project setup timing, Life Graph dashboard visualization approach, first LangGraph workflow selection
- **What's been built:**
  - Category A: 29 skills, 3 connectors (Gmail, Calendar, Drive), 28+ KB files
  - Claude Code: Project directory with CLAUDE.md, 29 SKILL.md skills, mirrored KB
  - GCP: Project ai-operating-system-490208 with 16 APIs, 3 service accounts, Artifact Registry, Secret Manager (13 secrets)
  - Life Graph v2: COMPLETE. ltree extension + 3 new tables (life_domains 14 rows — 3 categories + 11 numbered domains, domain_context_items 12 rows, domain_health_snapshots). 8 MCP tools (life_graph.py module). Domain-based Google Task lists (11 lists, 001-011). Domain 009 archived, 011 Zealogics Projects active. domain-health-scorer pipeline (Cloud Run + weekly scheduler). 4 skills updated with domain health sections. LIFE_GRAPH.md in knowledge base.
  - Database: ai_os DB on Cloud SQL (shared Bharatvarsh instance), 45 tables in codebase across 11 domains, pgvector + ltree enabled, Migrations 001-019 written, Seeds 001-013 all applied, 28 tasks seeded
  - MCP Gateway: LIVE on Cloud Run (ai-os-gateway, asia-south1, scale-to-zero). FastAPI + FastMCP. 80 tools (15 modules), all deployed. Modules: PostgreSQL (6), Google Tasks (9), Drive Write (3), Drive Read (3), Calendar Sync (3), Telegram (5), Life Graph (8), Capture (3), Contacts (8), Bharatvarsh (8), Composite (3), Media Gen (5), Creative Writer (8), LinkedIn (4), Meta (4). 6 branded HTML templates for media_gen. Telegram webhook subsystem (8 files). Bearer token auth. Latest build: b6493516.
  - Google OAuth: Desktop client for Gateway (refresh token). Web Application client for Dashboard (DASHBOARD_OAUTH_SECRET). Consent screen configured.
  - Dashboard PWA: LIVE on Cloud Run (ai-os-dashboard, asia-south1, scale-to-zero). Next.js 14 + TypeScript + Tailwind CSS. 7 pages. 33 API routes. 38 components. NextAuth.js Google OAuth. Obsidian Aurora design system. PWA with service worker + offline fallback. Pages: Command Center (with Life Graph, Knowledge Health, Mindly-style radial mind map), Task Board (Kanban), Gantt, Risks, Pipelines, Capture, Content Pipeline. 10 content-pipeline components (ContentPipelineView, ContentPostCard, ContentPostDetail, ContentBriefPanel, ChannelPromptPanel, ImageUploadZone, ImageDirectionPanel, RenderPreviewPanel, PostingKitPanel, PipelineSummary).
  - CI/CD: Cloud Build triggers: deploy-mcp-gateway (auto) + deploy-ai-os-dashboard (auto). 9 Cloud Scheduler jobs.
  - Task Notification: LIVE on Cloud Run + Cloud Scheduler (daily 06:00 IST)
  - Knowledge Layer V2: DEPLOYED. 4 pipeline services LIVE on Cloud Run (embedding-generator, drive-knowledge-scanner, weekly-knowledge-summary, knowledge-auto-connector). Shared library (ai_os_knowledge.py). 38 seed documents ready. 5 Cloud Scheduler triggers. 3 skills RAG-grounded (morning-brief, weekly-review, session-resume).
  - Telegram Bot: DEPLOYED. @AsrAiOsbot with webhook on MCP Gateway. 9 slash commands (/brief, /add, /done, /status, /log, /j, /e, /ei, /em). AI triage via Claude Haiku. Conversation memory with thread management. telegram-notifications Cloud Run service with 3 scheduled notifications (morning brief, overdue alerts, weekly digest). Inline keyboard callbacks.
  - Risk Engine: LIVE on Cloud Run. Daily 06:30 IST. 5 risk types → risk_alerts table + Telegram for high/critical.
  - Daily Brief Engine: LIVE on Cloud Run. Daily 06:15 IST. Collectors → AI Composer → multi-channel delivery.
  - Task Annotation Sync: LIVE on Cloud Run. Every 15 min. Google Tasks user notes → task_annotations table. SHA-256 dedup.
  - Drive Read Module: LIVE. 3 MCP tools (list_drive_files, read_drive_file, get_drive_changes_summary) deployed in gateway.
  - Seeds: 28 tasks (AI OS 12, AI&U 8, Bharatvarsh 8), all milestone due dates set
  - Scripts: google_oauth_setup.py, deploy_knowledge_layer_v2.sh, seed_knowledge_connections.py, generate_knowledge_snapshots.py, seed_knowledge_drive.py
  - Architecture: Three-tier tool ecosystem — Tier 1 directory connectors / Tier 2 unified MCP Gateway / Tier 3 local STDIO MCPs
  - Brand Identity System: BRAND_IDENTITY.md (3-context design system). Contexts: A (AI OS, accent #00D492, DM Sans), B (Bharatvarsh, mustard #F1C232, Bebas Neue), C (Portfolio, violet #8b5cf6, Inter). 3 skills: brand-guidelines, infographic, ui-design-process. Assets: matplotlib theme, 3 React templates, 3 .docx Drive templates. Drive: AI OS/BRAND_TEMPLATES/.
  - Personal Capture System: COMPLETE. journals table (migration 013), capture MCP module (3 tools: capture_entry, list_journals, search_journals), 2 skills (capture-entry, entry-analysis), Telegram capture commands (/j, /e, /ei, /em), Dashboard /capture page with inbox + journals + stats tabs, journal-monthly-distill pipeline (Cloud Run + monthly scheduler), CAPTURE_GUIDE.md in knowledge base.
  - Contact Intelligence Layer: DEPLOYED. contacts.py MCP module (8 tools), migration 014 (contact columns), 891 Google Contacts imported via CSV, Life Graph Domain 010 Career Network (155 contacts), contact-lookup skill, 3 skills enhanced (morning-brief, weekly-review, draft-email). Gateway redeployed (56 tools, 10 modules after bharatvarsh deploy).
  - Bharatvarsh Lore Layer: DEPLOYED. bharatvarsh.py MCP module (8 tools), migration 015 (5 lore tables), seed 013 (139 records), 6 KB files (BIBLE 1931 lines, CHARACTERS 1475, LOCATIONS 777, VISUAL_GUIDE 572, WRITING_GUIDE 395, TIMELINE 298), 3 Claude.ai skills, bharatvarsh-content v2.0, source text archive (19 files, 960K chars). Gateway revision 00037-ggg (image lore-v1).
  - Visual Content + Composite Queries (Sprint 11 — DEPLOYED): composite.py module (3 composite query tools reducing round-trips), media_gen.py module (5 tools for brand-injected image generation via Google Gemini, template rendering via Playwright, asset management). Migration 016 (media_assets table). Migration 017 (domain default_project_id). 6 branded HTML templates (banner, og_image, social posts, story, thumbnail). Telegram /img command. Gateway-wide module improvements. Drive structure redesign.
  - Creative Writing Plugin + Social Media (Sprint 12 — DEPLOYED): creative_writer.py module (8 tools: create/get/list projects, update Truby steps, save/get writing outputs, create/update brainstorm sessions). linkedin.py module (4 tools). meta.py module (4 tools). social_oauth.py. Migration 018 (social_accounts, social_post_log). Migration 019 (creative_projects, creative_project_steps, brainstorm_sessions, writing_outputs, 4 enum types). Cowork creative-writing-plugin with Truby framework context and brainstorm methods reference. creative-writer skill (4 modes: quick, project, brainstorm, critique). New skills: bharatvarsh-art-prompts, channel-knowledge, post-to-social. Build b6493516 deployed. Commit fdb1ce4.
  - Interface Strategy: Option C decided — Google Tasks/Calendar/Drive as notification rails, Next.js PWA as intelligence layer, Cloud SQL as single source of truth
  - ASR Visual Studio Cowork Plugin (v13 — BUILT): Programmatic visual content generation via Cowork. 18 files in cowork-configuration/asr-visual-studio/. 3 skills (create-image with 12 platform presets, create-video with 5 video types, create-social-pack for multi-platform batch). 3 engine modules (renderer.js, video-renderer.js, mcp-bridge.js). Hybrid local+MCP rendering. Chrome auto-detection. /render command. OPERATOR_GUIDE.md. Test suite (7 tests). Git strategy: workflow code only, generated assets gitignored. Standalone repo: github.com/AtharvaSin/asr-visual-studio.
  - Cowork Plugins (3 total): asr-visual-studio (visual content), asr-software-forge (development), creative-writing-plugin (Truby-based writing). All in cowork-configuration/.
  - Video Production System (`video-production/`): OPERATIONAL. Unified Remotion 4.0.438 workspace replacing fragmented remotion_video/ and aiu-youtube/remotion_aiu/. 18 brand-neutral common components (FilmGrain, Vignette, ScanLines, GlowPulse, NoiseTexture, MotionBlur, TypewriterText, TextPunch, WordReveal, CountUp, KaraokeSubtitle, SafeArea, AccentBar, LetterboxBars, ProgressBar, Watermark, StatCard, KenBurnsImage). 88 project-specific compositions (63 AI&U + 22 Bharatvarsh + 1 AI OS). BrandTokens interface (universal brand contract). 3 project YAML configs (Bharatvarsh/AI&U/AI OS) + template. Workspace system (one-at-a-time, 7-phase workflow). video-production orchestrator skill (10 auto-invoked sub-skills). 4 CLI tools (new-video, render, graduate, catalog). 28 compositions in Root.tsx. 160 source files, zero TypeScript errors. Old dirs deprecated.
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
