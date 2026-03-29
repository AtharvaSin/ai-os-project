# OS Evolution Log

A running record of design decisions, architecture changes, brainstorming outcomes, and key artifacts produced across sessions.

---

## How to Use This Log
- After each significant session, add an entry with date, domain, decisions made, and artifacts produced
- Reference this log when starting new sessions to maintain continuity
- Mark items as [ACTIVE], [COMPLETED], [PARKED], or [SUPERSEDED]

---

## Log Entries

### Video Production System + State v21 (2026-03-27)

#### What Was Built
- **Unified Video Production System** (`video-production/`) — Single Remotion 4.0.438 workspace replacing fragmented `remotion_video/` and `aiu-youtube/remotion_aiu/`. 160 source files, zero TypeScript errors.
- **Common Component Library** — 18 brand-neutral components accepting BrandTokens interface: FilmGrain, Vignette, ScanLines, GlowPulse, NoiseTexture, MotionBlur, TypewriterText, TextPunch, WordReveal, CountUp, KaraokeSubtitle, SafeArea, AccentBar, LetterboxBars, ProgressBar, Watermark, StatCard, KenBurnsImage.
- **Project Migrations** — 88 project-specific compositions migrated (63 AI&U + 22 Bharatvarsh + 1 AI OS + 2 shared). AI&U uses 9 shim files in utils/ to redirect imports to common library without touching 60+ component files.
- **Brand Configuration** — 3 project YAML configs (Bharatvarsh/AI&U/AI OS) + template. Each defines colors, typography, art style, content pillars, formats, timing, CTA, notebook references, pipeline paths.
- **Workspace System** — One-at-a-time production with phase tracking (INITIATE → BRIEF → DESIGN → ASSETS → COMPOSE → RENDER → REVIEW). Component graduation mechanism promotes reusable components to common library.
- **Orchestrator Skill** — `video-production` skill with 10 auto-invoked sub-skills (brand-guidelines, remotion-best-practices, bharatvarsh-art-prompts, creative-writer, content-gen, infographic, notebooklm, etc.)
- **CLI Tools** — 4 executables (new-video, render, graduate, catalog). Root.tsx registers 28 compositions (442 lines).
- **Animation Style Taxonomy** — 87 animation styles cataloged across 10 categories in `knowledge-base/ANIMATION_STYLE_TAXONOMY.md`.

#### Key Decisions
- Single Remotion install over keeping two projects — reduces maintenance, enables shared component library
- BrandTokens interface as universal contract — components never hardcode colors/fonts, accept tokens prop instead
- AI&U shim strategy over rewriting 60+ files — pragmatic migration, zero risk of breaking existing components
- Open project system (not hardcoded to 3 projects) — any new project gets first-class support via project.yaml
- content-pipelines/bharatvarsh stays in place, referenced via paths — no disruption to existing post-renderer skill
- Conversational component suggestion (not rigid catalog UI) — design phase is a creative discussion, not a lookup

#### State After
- 35 skills (was 34), video-production added
- ~111 MCP tools (was 90 — gateway scan revealed additional tool registrations)
- 106 video components (18 common + 88 project-specific)
- Old directories deprecated with DEPRECATED.md files

---

### NotebookLM Integration + Daily Brief v2 + State v20 (2026-03-27)

#### What Was Built
- **NotebookLM CLI** — `notebooklm-py` v0.3.4 installed as Tier 3 local STDIO tool. 14 active notebooks (~700 curated sources) covering: animation/video, Claude workflows, business, Bharatvarsh, frontend, backend, Google Antigravity, AI integration, social media, Google Ads, AI training, aerospace, ADK.
- **NotebookLM Agent Skill** — Installed at `~/.claude/skills/notebooklm/SKILL.md`. Claude Code auto-discovers and can query notebooks via CLI. Activation: explicit `/notebooklm` or intent detection ("create a podcast about X", "summarize these URLs").
- **Notebook Awareness System** — Memory file `reference_notebooklm_catalog.md` maps 14 notebooks to AI OS project areas with proactive suggestion rules. CLAUDE.md Tier 3 and Tech Stack sections updated.
- **Daily Brief Engine v2** — 6-section brief format with Zealogics focus, domain health, and momentum analysis (commit 8714d68). Gmail filter improvements to block newsletters and marketing content (commit 311c1f1).

#### Key Decisions
- Chose `notebooklm-py` (Python CLI/SDK) over `notebooklm-mcp` (Node.js MCP wrapper) — better Windows support, actively maintained (570+ commits vs 21), feature breadth (content generation, not just Q&A), and more resilient RPC-based architecture vs DOM scraping.
- NotebookLM stays as Tier 3 (local STDIO) not Tier 2 (gateway module) — cookie auth expires every 1-2 hours, unsuitable for always-on cloud deployment.
- Claude.ai access to NotebookLM research via Drive bridge + DB sync approach (not direct integration).

#### State After
- 34 skills (was 33), NotebookLM added
- Tier 3 tools: NotebookLM (configured), Evernote (pending), n8n (pending)
- State version: v20

#### Next Steps
- [ ] Explore Drive bridge for Claude.ai access to NotebookLM research
- [ ] Consider `notebooklm.py` gateway module wrapper once Google publishes official API
- [ ] Periodic notebook-to-knowledge-DB sync skill

---

### AI&U Remotion Video Pipeline — Full Build (2026-03-23)

#### What Was Built
- **Remotion Project** — `aiu-youtube/remotion_aiu/` scaffolded from scratch. Remotion 4.x, React 19, TypeScript strict mode. Zero type errors across 34 source files.
- **Brand Context D (Dark Mode)** — New dark palette for video chrome: BG #0F1117, Card #1A1B23, pillar accents Amber #F59E0B / Green #10B981 / Indigo #6366F1. Separate from the existing light-mode design tokens in `assets/tokens/`.
- **6 Utility Modules** — constants.ts (full token system), types.ts (AIUVideoInput schema with 20+ interfaces), fonts.ts (@remotion/google-fonts loading), animations.ts (spring configs, slide/scale/slam presets), colors.ts (pillar color resolvers), audio.ts (volume ducking, SFX mapping), subtitles.ts (Whisper JSON → grouped display segments with SRT generation).
- **15 Atomic Components** — IntroSting, LowerThird, ChapterCard, SubtitleOverlay (word-level karaoke), EndScreen, PillarBadge, ProgressBar, Watermark, CalloutHighlight (SVG draw-on), TextPunch (slam-in), StatCard (Think School style), ComparisonChart, ProcessFlow (animated node chain), BRollDrop (Fireship-style flash), CodeBlock (line-by-line reveal). Each with isolated test composition.
- **6 Scene Compositions** — FacecamScene (OffthreadVideo + overlays), ScreenRecScene (zoom points + callouts + PIP), SplitScreenScene (40/60 split), DiagramScene (component router), FullScreenTextScene (4 variants: statement/question/rule/myth_bust), BRollScene (4 animation modes). Plus overlayRenderer.tsx helper for GraphicOverlay → component mapping.
- **3 Video Compositions** — AIULongForm (reads input.json, assembles IntroSting → Chapters → EndScreen with music ducking), AIUShort (vertical reframe 1080×1920 with hook text + CTA), AIUThumbnail (router to 3 templates).
- **3 Thumbnail Templates** — BigPromise (face + claim), BeforeAfter (split comparison), WorkflowDiagram (node diagram). All 1280×720 dark mode stills.
- **5 CLI Scripts** — transcribe.sh (Whisper wrapper), render.sh (long-form with preview mode), render-short.sh (per-marker or batch), render-thumbnail.sh (still render), package.sh (collect outputs + generate description.txt, chapters.txt, render_log.md).
- **Sample Content** — VID01 input.json with 3 chapters, 5 scenes, 20 subtitle segments, 1 shorts marker, thumbnail config.
- **16 Registered Compositions** — 1 hello-world + 15 component tests + 3 production (aiu-longform, aiu-short, aiu-thumbnail) in Root.tsx.

#### Key Decisions
- Dark mode Context D uses different pillar accent colors than the existing light-mode tokens (#F59E0B vs #DC8D52, #10B981 vs #48DD71, #6366F1 vs #5B6ABF) — optimized for video overlays against dark backgrounds
- OffthreadVideo used throughout (not Video) for render performance
- Subtitle grouping follows strict rules: max 5 words, break at >200ms pauses and punctuation
- Graphic overlays are routed via overlayRenderer.tsx which maps overlay type strings to React components
- AIULongForm calculates total duration from chapters at render time (not hardcoded)
- Thumbnail compositions use `remotion still` (single frame PNG) not video render

#### Render Tests Passed
- aiu-test (hello world) — 276.7 kB
- test-intro-sting — 245.6 kB
- test-stat-card — 127.6 kB
- test-code-block — 199.7 kB
- test-text-punch — 129.3 kB
- test-chapter-card — 166.6 kB
- test-process-flow — 155.7 kB
- VID01_thumbnail.png — rendered from sample input.json

#### State After
- `aiu-youtube/remotion_aiu/`: 34 TS/TSX files, 5 CLI scripts, 0 type errors
- Production workflow: transcribe → render → render:shorts → render:thumbnail → package

#### Next Steps
- [ ] Record 30-second test clip (facecam + screen recording) for end-to-end pipeline test
- [ ] Populate public/sfx/ with sound effect files (whoosh, pop, click, ding, bass-drop, slide, type)
- [ ] Add background music to public/music/
- [ ] Run full end-to-end: transcribe → render → package with real footage
- [ ] Add Context D section to knowledge-base/BRAND_IDENTITY.md
- [ ] Consider adding ChecklistCard component (referenced in spec but not yet built)

---

### Sprint 12 Follow-on — X/Twitter + Social Manager + Content Pipeline (2026-03-21)

#### What Was Built
- **X/Twitter Module** — x_twitter.py (4 tools: post_tweet, post_tweet_with_media, get_recent_tweets, get_tweet_metrics). OAuth 1.0a implementation. Registered in main.py.
- **Social Manager Module** — social_manager.py (6 tools: social_post universal dispatcher, social_cross_post, social_list_platforms, social_validate_content, social_list_accounts, social_account_health). Routing via SocialRegistry adapter pattern.
- **Social Adapter Layer** — social_adapters.py (adapter registry), social_base.py (SocialPost base class), social_registry.py (SocialRegistry). Platform-agnostic infrastructure allowing new platforms without touching social_manager.py.
- **Content Pipeline Dashboard Page** — dashboard/src/app/content-pipeline/ with 5 components (ContentPipelineView, ContentPostCard, ContentPostDetail, ImageUploadZone, PipelineSummary) and API routes.
- **Migration 020** — content_post_status enum, content_posts table (9-stage workflow: planned → prompt_ready → awaiting_image → image_uploaded → rendered → approved → scheduled → published), content_post_audit_log table. Total: 47 tables in codebase.
- **content-pipelines/bharatvarsh/** — Full content pipeline system at repo root (renamed from content-pipelines). render-post.js (Node.js renderer for platform-specific assets), templates/, prompts/ (arc1_post_prompts.json), assets/, calendar/, distributor/, monitor/, skills/. IMPLEMENTATION_PLAN.md. Seed 015 (content_pipeline data).
- **Refactor** — content-pipelines → content-pipelines/bharatvarsh across all references.

#### Key Decisions
- Social Manager sits as a universal dispatcher ABOVE platform modules — adding a new platform only requires implementing the adapter, not touching the dispatcher
- Content pipeline is draft-only: 'approved' gate is mandatory before any post reaches 'scheduled' or 'published'
- Migration 020 is written but NOT yet applied — run before using Content Pipeline dashboard page
- X/Twitter, LinkedIn, Meta all need credentials added to Secret Manager before live posting works

#### State After
- 90 tools / 17 modules / 47 tables in codebase / 31 skills
- Commits: 3503cf3, b0576b6, 7aba016, cc937ec, 5cf1e57

#### Next Steps
- [ ] Apply migration 020 + seed 015 to Cloud SQL
- [ ] Add X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET, X_BEARER_TOKEN to Secret Manager
- [ ] Configure LinkedIn/Meta OAuth credentials
- [ ] First Category C LangGraph workflow
- [ ] MCP Gateway auth gap — add request-origin validation for /mcp endpoint

---

### Sprint 12 — Creative Writing Plugin + Social Media (2026-03-20)

#### What Was Built
- **Creative Writer MCP Module** — 8 tools: create/get/list projects, update Truby steps, save/get writing outputs, create/update brainstorm sessions
- **Migration 019** — 4 tables (creative_projects, creative_project_steps, brainstorm_sessions, writing_outputs), 4 enum types
- **Cowork Plugin** — cowork-configuration/creative-writing-plugin/ with Truby framework context, brainstorm methods reference
- **Skill** — creative-writer with 4 modes (quick, project, brainstorm, critique), interactive-first design
- **Social Media Modules** — linkedin.py (4 tools), meta.py (4 tools), social_oauth.py, migration 018 (social_accounts, social_post_log)
- **New Skills** — bharatvarsh-art-prompts, channel-knowledge, post-to-social, creative-writer
- **Gateway Deployment** — All 80 tools / 15 modules live on Cloud Run (build b6493516)

#### Key Decisions
- Creative writing is universe-agnostic; universe='bharatvarsh' loads lore context
- Truby's 22 steps auto-populate for narrative project types (novel, comic_series, screenplay, anthology)
- writing_outputs is append-only (no updated_at) — versioning via parent_output_id chain
- Interactive-first: all modes gather information before generating output
- Source tagging in brainstorm: untagged = user, <AI> = suggestion, <hidden> = author-only

#### State After
- 80 tools / 15 modules / 45 tables / 29 skills / 3 Cowork plugins
- Commit: fdb1ce4

#### Next Steps
- [ ] Configure LinkedIn/Meta OAuth credentials for social publishing
- [ ] First Category C LangGraph workflow
- [ ] AI&U YouTube content production

### Life Graph Domain 011 + Google Tasks Alignment (2026-03-19)
- [x] Domain 011 (Zealogics Projects) confirmed with `domain_number = '011'` in Cloud SQL
- [x] Domain 009 (Zealogics Onboarding) confirmed archived — no active content
- [x] Gateway `google_tasks.py` docstrings updated: "001-010"/"001-009" → "001-011"
- [x] `reset_task_lists` executed: 11 lists deleted, 9 created (domains with content), 16 items synced (6 tasks + 8 objectives + 2 automations)
- [x] `sync_tasks_to_db` verified: 0 discrepancies between DB and Google Tasks
- [x] Task "Onboard and contribute to Inspection Services Scheduling Tool project" visible in 011 Zealogics Projects list
- [x] `life_domains` table: 14 rows (3 categories + 11 numbered domains)
- [x] KB updated: PROJECT_STATE v14, LIFE_GRAPH.md, WORK_PROJECTS.md, PROJECT_INSTRUCTIONS.md, CLAUDE.md
- **State:** v13 → v14. Domains: 10 → 11 (009 archived, 011 active). Google Tasks: fully aligned.

### Sprint 11b — ASR Visual Studio Cowork Plugin + Skills Cleanup (2026-03-19)
- [x] ASR Visual Studio Cowork plugin built: 18 files in cowork-configuration/asr-visual-studio/asr-visual-studio/
- [x] 3 plugin skills: create-image (HTML+Puppeteer, 12 platform presets), create-video (FFmpeg frame generation, 5 video types), create-social-pack (one brief → 5 platform assets)
- [x] 3 engine modules: renderer.js (brand tokens, HTML builder, Puppeteer, Sharp, Chrome auto-detection), video-renderer.js (frame generation, FFmpeg assembly), mcp-bridge.js (hybrid local/MCP routing)
- [x] /render command for one-line briefs with auto-detection of asset type, brand context, platform
- [x] renderer agent for parallel batch rendering in social pack workflows
- [x] Brand system with full token sets for A/B/C contexts (Google Fonts CDN, effects: grain, vignette, glow)
- [x] Hybrid MCP integration: simple templates → Gateway render_template, AI imagery → Gateway generate_image, complex/video → local
- [x] Test suite (scripts/test-suite.js): 7 tests covering all 3 brand contexts, social pack, 2 video types, routing validation
- [x] Setup verification (scripts/verify-setup.js): pre-flight checks for Chrome, FFmpeg, Node, engine, skills
- [x] OPERATOR_GUIDE.md with process recipes for Bharatvarsh marketing, AI&U episodes, AI OS sprint updates
- [x] .gitignore: only workflow code pushed (18 files). Generated assets, node_modules, render logs excluded.
- [x] plugins-asr-visual-studio/ synced as flat copy for plugin loading
- [x] Skills cleanup: 25 → 26 skills. content-gen (NEW), life-graph (NEW), bharatvarsh renamed from bharatvarsh-content, sync-from-repo removed
- [x] cowork-configuration/ directory added: asr-visual-studio, plugins-asr-visual-studio, asr-software-forge, plugins-asr-software-forge
- [ ] Standalone GitHub repo (github.com/AtharvaSin/asr-visual-studio) — pending push
- [ ] cowork-configuration/ untracked in git — pending commit

### Sprint 11 — Visual Content + Composite Queries + Gateway Improvements (2026-03-19)
- [x] composite.py module: 3 tools (get_task_full, get_domain_overview, get_contact_brief) — reduces multi-query round-trips
- [x] media_gen.py module: 5 tools (generate_image, edit_image, render_template, store_asset, list_assets) — brand-injected visual content via Google Gemini API
- [x] 6 branded HTML templates: banner_wide, og_image, social_post_landscape, social_post_square, story, youtube_thumbnail
- [x] Migration 016: media_assets table (brand_context, model tracking, Drive integration, domain FK)
- [x] Migration 017: default_project_id in life_domains metadata for phone task routing
- [x] Telegram /img command: image generation from mobile via @AsrAiOsbot
- [x] Gateway-wide module improvements: all 10 existing modules modified
- [x] Daily Brief Engine: cloudbuild, config, Drive delivery updates
- [x] Drive structure redesign: DRIVE_STRUCTURE_REDESIGN.docx + migration script
- [x] main.py: composite + media_gen modules registered (12 modules total)
- [ ] Gateway deploy pending: 64 tools across 12 modules in codebase, 56/10 deployed
- [ ] Migrations 016-017 pending application to Cloud SQL
- [ ] Commit pending for all changes

### Sprint 10-B — Bharatvarsh Knowledge Layer Enrichment (2026-03-18)
- [x] Migration 015: 5 new lore tables (lore_entities, lore_relationships, lore_timeline, lore_chapters, writing_fragments), 4 enums, 18 indexes, 3 triggers
- [x] Seed 013: 139 records (35 entities, 57 relationships, 20 timeline events, 27 writing fragments) from 960K chars of source material
- [x] bharatvarsh.py MCP module: 8 tools (query_lore, get_character, get_entity, search_lore, get_timeline, get_chapter, check_lore_consistency, get_writing_style)
- [x] Gateway updated: 48 → 56 tools, 9 → 10 modules
- [x] 6 knowledge base files written from source material:
  - BHARATVARSH_BIBLE.md (1,931 lines — comprehensive world reference, REPLACES old 152-line file)
  - BHARATVARSH_CHARACTERS.md (1,475 lines — 7 character bibles with visual keys, voice, psychology, arcs)
  - BHARATVARSH_LOCATIONS.md (777 lines — 3 zones, 12+ locations with architecture, atmosphere, security)
  - BHARATVARSH_VISUAL_GUIDE.md (572 lines — art direction, palettes, uniforms, weapons, insignia)
  - BHARATVARSH_WRITING_GUIDE.md (395 lines — narrative voice, dialogue conventions, terminology, themes)
  - BHARATVARSH_TIMELINE.md (298 lines — 1717-2026 chronology across 6 eras)
- [x] 3 Claude.ai skills: SKILL_BHARATVARSH_CONTENT.md (v2.0), SKILL_LORE_CHECK.md, SKILL_BHARATVARSH_WRITER.md
- [x] Updated Claude Code skill: bharatvarsh-content v2.0 (MCP lore validation + expanded KB)
- [x] Source text files stored in knowledge-base/bharatvarsh-source-text/ (19 files, 960K chars)
- [x] Documentation updated: DB_SCHEMA.md, TOOL_ECOSYSTEM_PLAN.md, CLAUDE.md, EVOLUTION_LOG.md
- [x] Migration 015 applied to Cloud SQL (38 tables live)
- [x] Seed 013 applied to Cloud SQL (35 entities, 57 relationships, 20 timeline, 27 fragments)
- [x] Gateway deployed to Cloud Run (revision ai-os-gateway-00037-ggg, 56 tools, 10 modules, healthy)
- [x] Cleaned up duplicate temp files (docs/temp/bharatvarsh_text/ removed)

### Sprint 10-A — Contact Intelligence Layer (2026-03-18)
- [x] Migration 014: Added google_contact_id, import_source, last_contacted_at, domain_slug to contacts table
- [x] Built idempotent CSV importer (scripts/import_google_contacts.py) — 891 Google Contacts imported
- [x] Built contacts.py MCP module (8 tools): search_contacts, get_contact, create_contact, update_contact, get_upcoming_dates, get_contact_network, add_relationship, add_important_date
- [x] Gateway updated: 40 → 48 tools, 8 → 9 modules
- [x] Created Life Graph Domain 010 — Career Network (155 contacts)
- [x] New skill: /contact-lookup
- [x] Enhanced skills: /morning-brief (birthdays), /weekly-review (network health), /draft-email (recipient lookup)
- [x] Gateway deployed to Cloud Run with contacts module

### Entry 016 — Personal Capture System (Sprint 9-B)
- **Date:** 2026-03-18
- **Domain:** Capture System / MCP Gateway / Telegram / Dashboard / Database / Skills
- **Status:** [COMPLETED]
- **Summary:** Built end-to-end Personal Capture System. New `capture.py` MCP module (3 tools: capture_entry, list_journals, search_journals). Migration 013 adds `journals` table (33 total tables). 2 new skills (capture-entry, entry-analysis). journal-monthly-distill Category B pipeline (Cloud Run, scheduled 28th monthly, Claude Haiku-powered distillation). 4 new Telegram capture commands (/j, /e, /ei, /em). Dashboard /capture page with inbox, journals, and stats tabs. CAPTURE_GUIDE.md in knowledge base.
- **Architecture Decisions:**
  - **Journals separate from knowledge_entries:** Raw journal entries stored in dedicated `journals` table to avoid polluting operational knowledge with personal reflections. Quick entries (observations, ideas, epiphanies) flow into `knowledge_entries` with `source_type='quick_capture'` for immediate searchability via embedding pipeline.
  - **Monthly distillation:** journal-monthly-distill pipeline runs on 28th of each month using Claude Haiku to extract actionable themes, recurring patterns, and domain insights from raw journals. Distilled output feeds back into knowledge_entries.
  - **Telegram capture commands:** 4 new shorthand commands (/j for journals, /e for quick entries, /ei for ideas, /em for memory recalls) enable mobile-first capture without opening Claude.ai or Dashboard.
  - **Dashboard capture page:** Three-tab design (inbox for unprocessed entries, journals for browsing, stats for capture analytics) provides visual triage interface.
- **Files Created:**
  - NEW: mcp-servers/ai-os-gateway/app/modules/capture.py (3 MCP tools)
  - NEW: database/migrations/013_capture_system.sql (journals table, enum additions, pipeline registration)
  - NEW: .claude/skills/capture-entry/SKILL.md
  - NEW: .claude/skills/entry-analysis/SKILL.md
  - NEW: workflows/category-b/journal-monthly-distill/ (Dockerfile, cloudbuild.yaml, main.py, requirements.txt)
  - NEW: dashboard/src/app/capture/page.tsx
  - NEW: dashboard/src/app/api/capture/inbox/route.ts
  - NEW: dashboard/src/app/api/capture/journals/route.ts
  - NEW: dashboard/src/app/api/capture/stats/route.ts
  - NEW: dashboard/src/components/CaptureContent.tsx
  - NEW: knowledge-base/CAPTURE_GUIDE.md
- **Files Modified:**
  - MODIFIED: mcp-servers/ai-os-gateway/app/main.py (capture module registration)
  - MODIFIED: mcp-servers/ai-os-gateway/app/telegram/router.py (4 capture command handlers, 9 total commands)
  - MODIFIED: knowledge-base/DB_SCHEMA.md (33 tables, migration 013 documentation)
- **Counts Updated:** Skills 22→24, MCP tools 37→40 (8 modules), tables 32→33, Dashboard pages 8→9, API routes 20→23, components 26→27, Telegram commands 5→9

### Entry 015 — Brand Consistency System (Sprint 9-A)
- **Date:** 2026-03-18
- **Domain:** Brand System / Skills / Knowledge Base / Drive
- **Status:** [COMPLETED]
- **Summary:** Built three-context brand identity system. Extracted design tokens from wibify.agency (Playwright MCP, dark mode) to establish Context A accent color. Created canonical BRAND_IDENTITY.md with all three context token tables. Built 3 new skills (brand-guidelines, infographic, ui-design-process). Generated matplotlib theme, 3 React infographic templates, 3 branded .docx templates. Drive folder structure created under AI OS/BRAND_TEMPLATES/.
- **Architecture Decisions:**
  - **Three brand contexts:** A (AI OS System — Wibify-inspired, Obsidian Aurora, DM Sans, accent #00D492), B (Bharatvarsh — dystopian-cinematic, Bebas Neue, mustard #F1C232), C (Portfolio — violet/coral, Inter). Contexts are mutually exclusive — no mixing.
  - **Wibify extraction → #00D492:** Electric emerald green extracted as the signature accent-primary. Wibify uses Geist font; DM Sans retained for Context A (similar geometric precision, broader weight range).
  - **Anti-slop enforcement:** ui-design-process skill embeds a mandatory pre-build process: context declaration → use case interrogation → aesthetic direction commit → anti-slop checklist → differentiation decision → build. No code until direction is written.
  - **JetBrains Mono universal:** The one font that appears in ALL three contexts — data, metrics, code, timestamps.
  - **Font Context Lock Table:** Strict mapping of which fonts belong to which context. Instrument Serif = A only, Bebas Neue = B only, Inter body = B+C, DM Sans = A only.
- **Files Created:**
  - NEW: knowledge-base/BRAND_IDENTITY.md (canonical, 532 lines)
  - NEW: .claude/skills/brand-guidelines/SKILL.md + references/TOKENS.md
  - NEW: .claude/skills/infographic/SKILL.md + assets/mpl-themes/ai_os_system.mplstyle + assets/react-templates/{MetricCard,ComparisonTable,ProcessFlow}.jsx
  - NEW: .claude/skills/ui-design-process/SKILL.md + references/ANTI_SLOP_CHECKLIST.md
  - NEW: docs/temp/brand guides/context_a_extracted.json (Wibify extraction data)
  - NEW: Drive: AI OS/BRAND_TEMPLATES/{context-a-ai-os, context-b-bharatvarsh, context-c-portfolio}/
  - GENERATED: /tmp/brand-templates/{ai_os_template, bharatvarsh_template, portfolio_template}.docx
- **Files Modified:**
  - MODIFIED: docs/temp/brand guides/SPEC_CONTEXT_A.md (all [EXTRACTED] placeholders filled)
  - MODIFIED: knowledge-base/INTERFACE_STRATEGY.md (Brand Identity System section, skills 19→22)
  - MODIFIED: knowledge-base/EVOLUTION_LOG.md (Entry 015)
- **Extraction Source:** wibify.agency dark mode via Playwright MCP browser automation
- **Skill Count:** 19 → 22 (brand-guidelines, infographic, ui-design-process)

### Entry 014 — Delimiter Redesign, Annotation Fix, delete_task & Domain Move
- **Date:** 2026-03-17
- **Domain:** MCP Gateway / Google Tasks / Category B Pipeline
- **Status:** [COMPLETED]
- **Summary:** Fixed broken annotation capture + added two missing task operations. (A) Annotation fix: Unicode em-dash delimiter mangled by Google Tasks API round-trip, redesigned to ASCII-only `--- YOUR NOTES BELOW ---` with two-tier extraction. (B) New `delete_task` tool: removes task from both DB and Google Tasks atomically. (C) Domain move: `update_task` now accepts `domain_slug` to move tasks between domains (delete from old Google Task list + create in new one, preserving user annotations). Tool count: 36 (was 34).
- **Changes:**
  - New delimiter: `--- YOUR NOTES BELOW ---` (ASCII-only, survives Google Tasks round-trip)
  - Two-tier extraction: exact match on `NOTES_DELIMITER`, fallback to `NOTES_MARKER = 'YOUR NOTES BELOW'`
  - `_has_delimiter()` helper for robust detection across old and new formats
  - `_build_notes_header()` rewritten: ASCII separators, legacy task handling
  - `migrate_notes_delimiter` tool: rebuilds system zone on all active Google Tasks with new format
  - `delete_task` tool: deletes task from DB + Google Tasks + annotations in one call
  - `update_task` enhanced: accepts `domain_slug` to move between domains (delete + recreate on Google Tasks)
  - `list_tasks` enhanced: includes `domain_number` in response
  - Debug logging for annotation sync observability
- **Files Modified:**
  - MODIFIED: mcp-servers/ai-os-gateway/app/modules/google_tasks.py (delimiter, extraction, delete_task, domain move, migration tool, logging)
  - MODIFIED: workflows/category-b/task-annotation-sync/main.py (same delimiter + extraction + notes builder changes)
  - MODIFIED: knowledge-base/EVOLUTION_LOG.md (entry 014)
  - MODIFIED: knowledge-base/TOOL_ECOSYSTEM_PLAN.md (9 Google Tasks tools)

### Entry 013 — Two-Way Google Tasks ↔ Cloud SQL Field-Level Sync
- **Date:** 2026-03-17
- **Domain:** MCP Gateway / Google Tasks / Category B Pipeline
- **Status:** [COMPLETED]
- **Summary:** Fixed incomplete Google Tasks ↔ Cloud SQL sync. Prior state: DB→Google worked (create/update/complete), but Google→DB was limited to completion detection and annotation capture with a metadata JSONB parsing bug. After fix: full two-way field-level sync with phone-created task discovery.
- **Fixes Applied:**
  1. **Metadata JSONB guard (Fix 1):** Applied `_parse_jsonb()` to `sync_tasks_to_db` — asyncpg returns JSONB as string without registered codec, causing `'str' has no .get()` errors.
  2. **Pipeline audit (Fix 2):** Pipeline already had `isinstance(meta, str)` guard. Expanded pipeline query to include title, priority, due_date, updated_at, domain_name for field merge.
  3. **Field-level merge (Fix 3):** `sync_tasks_to_db` now compares Google Task title (stripped of priority prefix) and due_date against DB values. Last-write-wins via `updated_at` timestamp comparison. After field changes, system zone in Google Task notes is rebuilt while preserving user zone.
  4. **Pipeline field sync (Fix 4):** Mirrored field-level merge logic into `task-annotation-sync` pipeline using pg8000 sync driver. Pipeline now handles completion sync, title/due_date merge, annotation capture, and discovery — all in one scheduled run.
  5. **Phone-created task discovery (Fix 5):** New Phase 2 in both `sync_tasks_to_db` and pipeline. Iterates all domain Google Task lists, finds tasks not in DB (by `google_task_id`), imports them with `metadata.source = "google_tasks"` tag, captures any user notes as annotations, and rebuilds system zone notes on the Google Task.
- **Merge Rules:** System zone (above delimiter) = DB wins. User zone (below delimiter) = Google wins. Fields (title, due_date) = last-write-wins. Discovery = phone tasks imported at medium priority.
- **Files Modified:**
  - MODIFIED: mcp-servers/ai-os-gateway/app/modules/google_tasks.py (sync_tasks_to_db rewritten: JSONB guard, field merge, discovery pass, notes reconciliation)
  - MODIFIED: workflows/category-b/task-annotation-sync/main.py (full rewrite: completion sync, field merge, discovery, logging, notes rebuild helpers)
  - MODIFIED: knowledge-base/EVOLUTION_LOG.md (entry 013)
  - MODIFIED: knowledge-base/TOOL_ECOSYSTEM_PLAN.md (Google Tasks module description updated)

### Entry 012 — Life Graph v2 Integration
- **Date:** 2026-03-17
- **Domain:** Life Graph / Database / MCP Gateway / Google Tasks / Skills / Dashboard / Pipelines
- **Status:** [COMPLETED]
- **Summary:** Transformed AI OS from project-centric to life-domain-aware system. Implemented Life Graph v2 hierarchy (3 categories: Private Affairs, Personal Projects, Work; 9 numbered domains 001-009) in PostgreSQL using hybrid adjacency list + ltree. Added 8 new MCP tools in life_graph.py module. Switched Google Tasks from project-based to domain-based task lists (9 lists for domains 001-009). Tasks, objectives, and automations all sync to domain Google Task lists. Updated 4 skills (morning-brief, weekly-review, session-resume, action-planner) with domain health sections. Created domain-health-scorer Category B pipeline (weekly Sunday 6 PM IST). Dashboard API routes for domain tree and detail views. Total: 34 MCP tools (was 26), 32 tables (was 29), 7 modules (was 6).
- **Architecture Decisions:**
  - **PostgreSQL ltree over Neo4j:** Life Graph is a shallow tree (3-4 levels, ~15 nodes). ltree handles hierarchical queries natively without new infrastructure. Neo4j formally retired from Reference Architecture.
  - **Hybrid adjacency list + ltree:** parent_id FK for simple inserts/moves, ltree path for fast descendant/ancestor queries. Trigger auto-computes path from parent_id.
  - **Three context types:** Tasks (in tasks table with domain_id FK), Objectives and Automations (in domain_context_items table). Tasks sync to Google Tasks; objectives/automations are DB-only but visible in domain Google Task lists.
  - **Domain-based Google Task lists:** Switched from project-based ("AI OS: Project Name") to domain-based ("001 Friends and Gatherings"). reset_task_lists tool does full cleanup + recreation.
  - **Health scoring formula:** task_completion_rate * 0.40 + objective_progress * 0.30 + recency_score * 0.20 + automation_coverage * 0.10. Weekly pipeline stores snapshots.
- **Files Created:**
  - NEW: database/migrations/011_life_domains.sql (ltree, 3 tables, 3 triggers, 3 functions)
  - NEW: database/migrations/012_domain_fk_additions.sql (domain_id on tasks + projects)
  - NEW: database/seeds/012_seed_life_graph_v2.sql (12 domains, 12 context items, project links)
  - NEW: mcp-servers/ai-os-gateway/app/modules/life_graph.py (8 tools)
  - NEW: workflows/category-b/domain-health-scorer/ (main.py, Dockerfile, cloudbuild.yaml, requirements.txt)
  - NEW: knowledge-base/LIFE_GRAPH.md
  - NEW: dashboard/src/app/api/domains/route.ts
  - NEW: dashboard/src/app/api/domains/[slug]/route.ts
- **Files Modified:**
  - MODIFIED: mcp-servers/ai-os-gateway/app/modules/google_tasks.py (domain-based lists, reset_task_lists tool, domain_slug params)
  - MODIFIED: mcp-servers/ai-os-gateway/app/modules/postgres.py (3 new tables in ALLOWED_TABLES)
  - MODIFIED: mcp-servers/ai-os-gateway/app/main.py (life_graph module registration)
  - MODIFIED: dashboard/src/lib/types.ts (Life Graph TypeScript types)
  - MODIFIED: .claude/skills/morning-brief/SKILL.md (Domain Health section)
  - MODIFIED: .claude/skills/weekly-review/SKILL.md (Life Domain Review section)
  - MODIFIED: .claude/skills/session-resume/SKILL.md (domain context recovery)
  - MODIFIED: .claude/skills/action-planner/SKILL.md (domain-aware task creation)
- **Deployed:**
  - MCP Gateway: revision ai-os-gateway-00020-ws5 (34 tools, 7 modules)
  - Domain Health Scorer: domain-health-scorer-00001-rl5 (Cloud Scheduler: Sunday 6 PM IST)
- **Testing:** 32/32 tests passed (23 feature tests + 9 regression tests)

### Entry 011 — Two-Way Task Annotation Sync
- **Date:** 2026-03-17
- **Domain:** Task Layer / MCP Gateway / Google Tasks / Database / Pipelines
- **Status:** [BUILT — pending deployment]
- **Summary:** Made Google Tasks notes genuinely two-way by splitting the field into a system zone (task brief, written by Gateway) and a user zone (execution annotations, written by user on mobile). System zone shows priority tag, project name, due date, task ID short, and truncated brief above a delimiter line. User types notes below the delimiter on their phone. `sync_tasks_to_db` and a new standalone Category B pipeline (`task-annotation-sync`, every 15 min) capture user annotations into a new `task_annotations` table with SHA-256 content-hash deduplication. New `get_task_annotations` MCP tool returns Item 1 (brief) + Item 2 (annotations) together. Gateway tool count: 25 → 26. Table count: 28 → 29.
- **Architecture Decisions:**
  - **Dual-item separation:** Item 1 (task brief) lives in `tasks.description` — never truncated, never overwritten by sync. Item 2 (annotations) lives in `task_annotations` — append-only, timestamped, content-hash deduped. The two items never conflate.
  - **Delimiter protocol:** A Unicode delimiter line (`── ✏️ YOUR NOTES BELOW ─────────────────────────`) separates system zone from user zone in Google Tasks notes. Gateway writes above; user writes below.
  - **Content-hash deduplication:** `SHA-256(user_zone)` stored in `content_hash` column with unique index on `(task_id, content_hash)`. Editing text creates a new annotation row (different hash) — correct audit-trail behavior.
  - **User zone preservation:** `update_task` fetches existing Google Task notes before rebuilding system zone, re-appends user zone below delimiter. Mobile annotations survive Gateway updates.
  - **Standalone pipeline for scheduled capture:** `task-annotation-sync` (Category B, Cloud Run, every 15 min) mirrors the Gateway's annotation capture logic using pg8000 + Google API. Ensures annotations are captured even when user doesn't trigger `sync_tasks_to_db` manually.
- **Files Created/Modified:**
  - NEW: database/migrations/010_task_annotations.sql (task_annotations table + 3 indexes)
  - NEW: database/seeds/011_seed_task_annotation_sync.sql (pipeline registration)
  - NEW: workflows/category-b/task-annotation-sync/main.py (~170 lines)
  - NEW: workflows/category-b/task-annotation-sync/Dockerfile
  - NEW: workflows/category-b/task-annotation-sync/requirements.txt
  - NEW: workflows/category-b/task-annotation-sync/cloudbuild.yaml
  - MODIFIED: mcp-servers/ai-os-gateway/app/modules/google_tasks.py (notes protocol, annotation capture, get_task_annotations tool)
  - MODIFIED: mcp-servers/ai-os-gateway/app/modules/postgres.py (task_annotations in ALLOWED_TABLES)
  - MODIFIED: knowledge-base/TOOL_ECOSYSTEM_PLAN.md (tool count 25 → 26, Google Tasks 5 → 6 tools)
  - MODIFIED: knowledge-base/EVOLUTION_LOG.md (Entry 011)
- **Known Limitations:**
  - Legacy tasks (created before this feature) have no delimiter — annotations won't be captured
  - Deleted delimiter: annotations lost until next `update_task` re-injects it
  - Completed tasks excluded from sync (by design)
- **Next Steps:**
  - [x] Applied migration 010 via cloud-sql-proxy
  - [x] Applied seed 011 via cloud-sql-proxy
  - [x] Deployed MCP Gateway to Cloud Run (revision 00020)
  - [ ] Deploy task-annotation-sync to Cloud Run (still pending)
  - [ ] Create Cloud Scheduler job (still pending)
  - [ ] Verify: create_task → check notes on phone → type annotation → sync → get_task_annotations

### Entry 010 — Drive Knowledge Distill Skill + Drive Read Module
- **Date:** 2026-03-17
- **Domain:** Knowledge Layer / MCP Gateway / Skills
- **Status:** [COMPLETED]
- **Summary:** Built drive_read MCP module (3 tools: list_drive_files, read_drive_file, get_drive_changes_summary) enabling direct Drive file discovery and reading from Claude.ai/Claude Code. Created /drive-knowledge-distill skill for monthly human-in-the-loop knowledge curation — discovers Drive changes, classifies content, proposes knowledge entries with approve/edit/reject/merge/split options, and commits approved entries. Skill has 3 access modes (direct Drive read, pipeline DB entries, manual paste). Gateway tool count: 22 → 25.
- **Architecture Decisions:**
  - **Drive Read as separate module from Drive Write:** Read-only operations (listing, reading, change summary) are distinct from write operations (upload, create). Separate modules follow single-responsibility principle.
  - **Three access modes for resilience:** Mode A (direct Drive read via MCP) preferred when tools are available. Mode B (pipeline DB entries) uses existing scanner data. Mode C (manual paste) as fallback. Skill degrades gracefully.
  - **Human-in-the-loop gate:** No knowledge entries committed without explicit user approval. Proposals support approve/edit/reject/merge/split/batch operations.
  - **Cross-reference with knowledge_entries:** get_drive_changes_summary compares Drive file modifiedTime against knowledge_entries.updated_at to classify files as new/modified/ingested.
  - **Granularity by document length:** Docs > 2000 words split by H2/H3 headers with overview entry. Docs < 2000 words get single entry. Matches drive-knowledge-scanner chunking approach.
  - **Cross-project separation:** Documents spanning multiple projects get separate knowledge entries per project with relevant content only.
- **Files Created/Modified:**
  - NEW: mcp-servers/ai-os-gateway/app/modules/drive_read.py (~280 lines, 3 MCP tools)
  - NEW: .claude/skills/drive-knowledge-distill/SKILL.md (~200 lines)
  - NEW: database/seeds/010_seed_drive_knowledge_distill.sql (skill + pipeline registration)
  - MODIFIED: mcp-servers/ai-os-gateway/app/main.py (import, registration, health check)
  - MODIFIED: knowledge-base/TOOL_ECOSYSTEM_PLAN.md (Drive Read module, 25 tools)
  - MODIFIED: knowledge-base/EVOLUTION_LOG.md (Entry 010)
- **Next Steps:**
  - [ ] Deploy updated MCP Gateway to Cloud Run (adds 3 Drive Read tools)
  - [ ] Apply seed 010 to Cloud SQL (registers skill + pipeline)
  - [ ] Test drive_read tools via MCP (list, read, changes summary)
  - [ ] Run first /drive-knowledge-distill cycle in Claude.ai
  - [ ] Phase 3b: AI Risk Engine + push notifications

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
