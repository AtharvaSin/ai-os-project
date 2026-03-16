# Knowledge Layer V2 — Implementation Plan

> **Version:** 2.0 | **Created:** 2026-03-15 | **Owner:** Atharva Singh
> **Status:** PLANNING | **Target Completion:** 2026-04-05
> **Vision Document:** `knowledge-base/AI_OS_Knowledge_Layer_V2_Revised.docx`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Assessment](#current-state-assessment)
3. [Architecture Overview](#architecture-overview)
4. [Sprint Plan](#sprint-plan)
   - [Sprint 5A: RAG Primitives + Infrastructure](#sprint-5a-rag-primitives--infrastructure)
   - [Sprint 5B: Embedding Pipeline + Drive Scanner + Seed](#sprint-5b-embedding-pipeline--drive-scanner--seed)
   - [Sprint 5C: Weekly Summary Pipeline + Skill Updates](#sprint-5c-weekly-summary-pipeline--skill-updates)
   - [Sprint 5D: Auto-Connection Discovery + Cleanup](#sprint-5d-auto-connection-discovery--cleanup)
5. [Dependency Map](#dependency-map)
6. [Risk Register](#risk-register)
7. [Progress Tracker](#progress-tracker)
8. [Supporting Documents Index](#supporting-documents-index)

---

## Executive Summary

The Knowledge Layer V2 transforms the AI OS from a structured operational tracker into an **intelligent semantic knowledge system**. It introduces two pathways:

1. **Weekly Batch Summarisation** — Postgres operational data (tasks, milestones, pipeline runs) is summarised weekly into natural-language knowledge entries with embeddings.
2. **Drive Knowledge Scanner** — Google Drive's `AI OS/Knowledge/` folder tree is scanned daily for new/modified docs, chunked, and ingested into the knowledge base.

**Key design principles:**
- Operational data stays in structured tables (real-time SQL queries)
- Knowledge entries are curated or systematically summarised (high signal, low noise)
- Drive is the manual knowledge input surface (phone, desktop, any browser)
- Claude produces knowledge docs; pipelines ingest them
- Expert-in-the-loop: AI tracks + summarises, human decides what's worth preserving

**Scope:** 4 sprints (5A–5D), 11–15 working days, 3 new DB migrations, 3 new pipelines, 3 skill updates, 1 shared Python library.

**Not in scope:** Real-time session capture, event-driven triggers, separate goals/preferences tables (per V2 design decisions).

---

## Current State Assessment

| Component | Status | Details | Reference |
|-----------|--------|---------|-----------|
| **knowledge_entries table** | LIVE (0 rows) | Schema deployed via migration 004. Full-text GIN index ready. | `database/migrations/004_knowledge.sql` |
| **knowledge_embeddings table** | LIVE (0 rows) | vector(1536), HNSW index (m=16, ef_construction=64). No embedding generation code. | `knowledge-base/DB_SCHEMA.md` |
| **knowledge_connections table** | LIVE (0 rows) | Typed edges, unique constraints, no self-connections. | `knowledge-base/DB_SCHEMA.md` |
| **skill_registry** | LIVE (15 rows) | All 15 skills registered with versioning. | `database/seeds/004_seed_knowledge.sql` |
| **search_knowledge MCP tool** | LIVE | BM25 full-text search only. No semantic/vector search. | `mcp-servers/ai-os-gateway/app/modules/postgres.py` |
| **pgvector extension** | LIVE (v0.8.1) | Installed. HNSW index configured. No queries use it yet. | Cloud SQL `ai_os` database |
| **match_knowledge() function** | PLANNED | Defined in DB_SCHEMA.md. Not created. | `knowledge-base/DB_SCHEMA.md:607-621` |
| **traverse_knowledge() function** | PLANNED | Defined in DB_SCHEMA.md. Not created. | `knowledge-base/DB_SCHEMA.md:623-637` |
| **Embedding generation** | NOT STARTED | No code, no OpenAI API key in Secret Manager. | — |
| **Drive scanner pipeline** | NOT STARTED | Drive read connector exists (Tier 1). Write module exists. No scanner logic. | `mcp-servers/ai-os-gateway/app/modules/drive_write.py` |
| **Weekly summary pipeline** | NOT STARTED | Task notification service pattern exists as reference. | `workflows/category-b/task-notification/` |
| **MCP Connector (Claude.ai)** | BLOCKED | Custom connector not yet linked in Claude.ai UI. | `knowledge-base/PROJECT_STATE.md:134` |
| **Cloud Functions Gen 2** | BLOCKED | Buildpack failure. Workaround: deploy as Cloud Run services. | `knowledge-base/PROJECT_STATE.md:147` |

### Gap Analysis

```
WHAT V2 NEEDS                    WHAT EXISTS TODAY                 GAP
─────────────────────────────────────────────────────────────────────
match_knowledge() SQL function   DB schema + pgvector extension    Migration 006 needed
traverse_knowledge() SQL func    knowledge_connections table       Migration 006 needed
Extended source_type enum        5 values                          7 new values needed
knowledge_domain enum            domain is TEXT column             Enum + ALTER needed
sub_domain column                Not present                       Migration 006 needed
drive_file_id on entries         Not present                       Migration 006 needed
project_id FK on entries         Not present                       Migration 006 needed
knowledge_ingestion_jobs table   Does not exist                    Migration 007 needed
knowledge_snapshots table        Does not exist                    Migration 007 needed
drive_scan_state table           Does not exist                    Migration 007 needed
Embedding generation pipeline    No code                           Sprint 5B build
Drive Knowledge Scanner          No code                           Sprint 5B build
Weekly Summary pipeline          No code                           Sprint 5C build
ai_os_knowledge.py library       No code                           Sprint 5C build
Semantic search_knowledge        BM25 full-text only               Sprint 5B upgrade
Drive Knowledge/ folder tree     No folders in Drive               Sprint 5B setup
80-100+ knowledge entries        0 entries                         Sprint 5B seed
OPENAI_API_KEY secret            Not in Secret Manager             Sprint 5A setup
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        KNOWLEDGE SOURCES                            │
├─────────────────────────┬───────────────────────────────────────────┤
│  Postgres Operational   │         Google Drive                      │
│  Tables (auto-tracked)  │    Knowledge/ Folder (manual curation)    │
│                         │                                           │
│  tasks, milestones,     │  System/, Projects/AI-OS/,                │
│  pipeline_runs,         │  Projects/Bharatvarsh/, Projects/AI-and-U/│
│  pipeline_logs,         │  Projects/Zealogics/, Personal/           │
│  artifacts,             │                                           │
│  skill_evolution_log    │  Formats: Google Docs, .md, .txt, .pdf    │
└────────────┬────────────┴────────────────────┬──────────────────────┘
             │                                  │
             ▼                                  ▼
┌────────────────────────┐     ┌────────────────────────────────────┐
│ Weekly Summary Pipeline│     │     Drive Knowledge Scanner        │
│ (Sunday 22:00 IST)     │     │     (Daily 06:00 IST)              │
│                        │     │                                    │
│ Reads past week's ops  │     │ Scans for new/modified files       │
│ Claude Haiku generates │     │ Chunks by headers/paragraphs       │
│ natural language        │     │ Domain from folder path            │
│ summaries               │     │ Deduplication via drive_file_id    │
└────────────┬────────────┘     └───────────────────┬────────────────┘
             │                                       │
             ▼                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    knowledge_entries (PostgreSQL)                  │
│                                                                    │
│  id | title | content | domain | sub_domain | source_type |        │
│  project_id | drive_file_id | tags | confidence | metadata         │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              Embedding Generation Pipeline (every 5 min)          │
│                                                                    │
│  Finds entries without embeddings → calls OpenAI                   │
│  text-embedding-3-small → upserts knowledge_embeddings             │
└──────────────────────────┬─────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│           CONSUMERS (read knowledge via match_knowledge())        │
│                                                                    │
│  Claude.ai Skills:  /morning-brief, /session-resume,               │
│                     /bharatvarsh-content, /weekly-review            │
│                                                                    │
│  Background Jobs:   Birthday Wishes, Weekly Summary (self-refs)    │
│                                                                    │
│  Dashboard PWA:     Knowledge Stats, Ingestion History (Phase 4)   │
│                                                                    │
│  MCP Gateway:       Upgraded search_knowledge tool                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Sprint Plan

### Sprint 5A: RAG Primitives + Infrastructure
> **Duration:** 2–3 days | **Status:** `NOT_STARTED`
> **Blueprint:** [`SPRINT_5A_SPEC.md`](./SPRINT_5A_SPEC.md)

**Objective:** Create RAG database functions, extend enums, store API key. Exit state: Claude can query live data, RAG functions exist.

| # | Task | Type | Est. | Status | Notes |
|---|------|------|------|--------|-------|
| 5A-1 | Write migration 006 SQL (enums, columns, match_knowledge, traverse_knowledge) | DB | 3h | `TODO` | See [`MIGRATION_006_SPEC.md`](./MIGRATION_006_SPEC.md) |
| 5A-2 | Test migration 006 locally via cloud-sql-proxy | DB | 1h | `TODO` | Connect, apply, verify functions work |
| 5A-3 | Apply migration 006 to Cloud SQL | DB | 30m | `TODO` | Via cloud-sql-proxy |
| 5A-4 | Store OPENAI_API_KEY in GCP Secret Manager | Infra | 15m | `TODO` | `gcloud secrets create OPENAI_API_KEY ...` |
| 5A-5 | Grant Secret Manager access to service accounts | Infra | 15m | `TODO` | ai-os-cloud-run, ai-os-cloud-functions |
| 5A-6 | Complete Claude.ai MCP connector linkage | Config | 15m | `TODO` | BLOCKED: manual step in Claude.ai UI |
| 5A-7 | Update DB_SCHEMA.md with migration 006 changes | Docs | 30m | `TODO` | Run /update-project-state after |

**Exit Criteria:**
- [ ] `match_knowledge()` returns results on test data
- [ ] `traverse_knowledge()` walks test connections
- [ ] OPENAI_API_KEY accessible from Cloud Run
- [ ] Extended source_type enum has all 12 values
- [ ] knowledge_domain enum created and applied
- [ ] sub_domain, project_id, drive_file_id columns on knowledge_entries

---

### Sprint 5B: Embedding Pipeline + Drive Scanner + Seed
> **Duration:** 4–5 days | **Status:** `NOT_STARTED`
> **Blueprint:** [`SPRINT_5B_SPEC.md`](./SPRINT_5B_SPEC.md)

**Objective:** Build embedding generation pipeline, Drive scanner, apply migration 007, create Drive folder structure, seed 80–100+ initial entries. Exit state: semantic search works, Drive scanner operational.

| # | Task | Type | Est. | Status | Notes |
|---|------|------|------|--------|-------|
| 5B-1 | Write migration 007 SQL (ingestion_jobs, snapshots, drive_scan_state) | DB | 2h | `TODO` | See [`MIGRATION_007_SPEC.md`](./MIGRATION_007_SPEC.md) |
| 5B-2 | Apply migration 007 to Cloud SQL | DB | 30m | `TODO` | — |
| 5B-3 | Build embedding generation Cloud Run service | Code | 4h | `TODO` | See [`PIPELINE_SPECS.md §1`](./PIPELINE_SPECS.md#1-embedding-generation-pipeline) |
| 5B-4 | Create Cloud Scheduler trigger (every 5 min) | Infra | 30m | `TODO` | Or use Cloud Run Jobs with cron |
| 5B-5 | Deploy embedding service to Cloud Run | Deploy | 1h | `TODO` | Dockerfile + cloudbuild.yaml |
| 5B-6 | Build Drive Knowledge Scanner Cloud Run service | Code | 6h | `TODO` | See [`PIPELINE_SPECS.md §2`](./PIPELINE_SPECS.md#2-drive-knowledge-scanner) |
| 5B-7 | Create Cloud Scheduler trigger (daily 06:00 IST) | Infra | 30m | `TODO` | — |
| 5B-8 | Deploy Drive scanner to Cloud Run | Deploy | 1h | `TODO` | — |
| 5B-9 | Create Drive Knowledge/ folder structure (7 folders) | Setup | 30m | `TODO` | Via MCP Gateway create_drive_folder |
| 5B-10 | Produce System domain seed docs (25–30 entries) | Content | 3h | `TODO` | See [`KNOWLEDGE_SEED_PLAN.md §1`](./KNOWLEDGE_SEED_PLAN.md#1-system-domain-25-30-entries) |
| 5B-11 | Produce Project domain seed docs (23–38 entries) | Content | 3h | `TODO` | See [`KNOWLEDGE_SEED_PLAN.md §2`](./KNOWLEDGE_SEED_PLAN.md#2-project-domain-23-38-entries) |
| 5B-12 | Produce Personal domain seed docs (10–12 entries) | Content | 2h | `TODO` | See [`KNOWLEDGE_SEED_PLAN.md §3`](./KNOWLEDGE_SEED_PLAN.md#3-personal-domain-10-12-entries) |
| 5B-13 | Upload seed docs to Drive Knowledge/ folders | Setup | 1h | `TODO` | Via MCP or manual upload |
| 5B-14 | Run Drive scanner manually to ingest seed docs | Test | 30m | `TODO` | Trigger HTTP endpoint |
| 5B-15 | Verify embeddings generated for all entries | Test | 30m | `TODO` | Query knowledge_embeddings count |
| 5B-16 | Upgrade search_knowledge MCP tool to use match_knowledge() | Code | 2h | `TODO` | See [`SKILL_UPDATE_SPEC.md §1`](./SKILL_UPDATE_SPEC.md#1-upgrade-search_knowledge-mcp-tool) |
| 5B-17 | Seed 40–60 initial knowledge_connections | Data | 2h | `TODO` | See [`KNOWLEDGE_SEED_PLAN.md §4`](./KNOWLEDGE_SEED_PLAN.md#4-initial-connections-40-60-edges) |
| 5B-18 | Update TOOL_ECOSYSTEM_PLAN.md and DB_SCHEMA.md | Docs | 1h | `TODO` | — |

**Exit Criteria:**
- [ ] 80–100+ knowledge_entries with embeddings
- [ ] Semantic search via match_knowledge() returns relevant results
- [ ] Drive scanner runs daily (06:00 IST) and ingests new files
- [ ] Embedding pipeline runs every 5 minutes
- [ ] 40–60 knowledge_connections seeded
- [ ] search_knowledge MCP tool uses vector similarity

---

### Sprint 5C: Weekly Summary Pipeline + Skill Updates
> **Duration:** 3–4 days | **Status:** `NOT_STARTED`
> **Blueprint:** [`SPRINT_5C_SPEC.md`](./SPRINT_5C_SPEC.md)

**Objective:** Build weekly operational summary pipeline, shared knowledge library, update Claude skills to be RAG-grounded. Exit state: weekly summaries auto-generate, skills use knowledge layer.

| # | Task | Type | Est. | Status | Notes |
|---|------|------|------|--------|-------|
| 5C-1 | Build Weekly Operational Summary Cloud Run service | Code | 5h | `TODO` | See [`PIPELINE_SPECS.md §3`](./PIPELINE_SPECS.md#3-weekly-operational-summary) |
| 5C-2 | Create Cloud Scheduler trigger (Sunday 22:00 IST) | Infra | 30m | `TODO` | — |
| 5C-3 | Deploy weekly summary service to Cloud Run | Deploy | 1h | `TODO` | — |
| 5C-4 | Build ai_os_knowledge.py shared Python library | Code | 3h | `TODO` | See [`PIPELINE_SPECS.md §4`](./PIPELINE_SPECS.md#4-shared-knowledge-library) |
| 5C-5 | Update /morning-brief skill for RAG grounding | Skill | 2h | `TODO` | See [`SKILL_UPDATE_SPEC.md §2`](./SKILL_UPDATE_SPEC.md#2-morning-brief-rag-grounding) |
| 5C-6 | Update /weekly-review skill for knowledge stats | Skill | 2h | `TODO` | See [`SKILL_UPDATE_SPEC.md §3`](./SKILL_UPDATE_SPEC.md#3-weekly-review-knowledge-stats) |
| 5C-7 | Update /session-resume skill for knowledge check | Skill | 1h | `TODO` | See [`SKILL_UPDATE_SPEC.md §4`](./SKILL_UPDATE_SPEC.md#4-session-resume-knowledge-check) |
| 5C-8 | Enhance Birthday Wishes pipeline with knowledge retrieval | Code | 2h | `TODO` | — |
| 5C-9 | Run first manual weekly summary | Test | 30m | `TODO` | Trigger, verify entries created |
| 5C-10 | Verify skills use knowledge data in responses | Test | 1h | `TODO` | End-to-end test of each skill |

**Exit Criteria:**
- [ ] Weekly summary pipeline creates project_update entries every Sunday
- [ ] /morning-brief cites weekly summaries and personal events
- [ ] /weekly-review includes knowledge layer health stats
- [ ] /session-resume checks knowledge_entries before past chat search
- [ ] ai_os_knowledge.py importable by all Category B/C services
- [ ] Birthday Wishes uses relationship knowledge for personalisation

---

### Sprint 5D: Auto-Connection Discovery + Cleanup
> **Duration:** 2–3 days | **Status:** `NOT_STARTED`
> **Blueprint:** [`SPRINT_5D_SPEC.md`](./SPRINT_5D_SPEC.md)

**Objective:** Build automatic cross-domain connection discovery, clean stale docs, generate first snapshots. Exit state: self-growing knowledge graph, clean codebase, state doc v5.

| # | Task | Type | Est. | Status | Notes |
|---|------|------|------|--------|-------|
| 5D-1 | Build weekly auto-connection discovery Cloud Run service | Code | 4h | `TODO` | See [`PIPELINE_SPECS.md §5`](./PIPELINE_SPECS.md#5-auto-connection-discovery) |
| 5D-2 | Create Cloud Scheduler trigger (Sunday 23:00 IST, after summary) | Infra | 30m | `TODO` | — |
| 5D-3 | Deploy auto-connection service to Cloud Run | Deploy | 1h | `TODO` | — |
| 5D-4 | Add connection approval flow to /weekly-review | Skill | 2h | `TODO` | See [`SKILL_UPDATE_SPEC.md §5`](./SKILL_UPDATE_SPEC.md#5-connection-approval-in-weekly-review) |
| 5D-5 | Generate first knowledge_snapshots | Data | 1h | `TODO` | Run snapshot generation manually |
| 5D-6 | Clean up stale docs and references | Cleanup | 2h | `TODO` | Fix Supabase refs, update README |
| 5D-7 | Update PROJECT_STATE.md to v5 | Docs | 1h | `TODO` | Run /update-project-state |
| 5D-8 | Update EVOLUTION_LOG.md with Knowledge Layer V2 | Docs | 30m | `TODO` | — |
| 5D-9 | Update skill_registry DB rows (3 new skills) | Data | 30m | `TODO` | — |

**Exit Criteria:**
- [ ] Auto-connection pipeline proposes cross-domain edges weekly
- [ ] /weekly-review shows proposed connections for approval
- [ ] knowledge_snapshots has first weekly entry per domain
- [ ] 150+ knowledge_entries total
- [ ] PROJECT_STATE.md at v5 reflecting knowledge layer
- [ ] No stale Supabase or V1 references in codebase

---

## Dependency Map

```
Sprint 5A (2-3d)
├── 5A-1: Migration 006 ──────────────┐
├── 5A-4: OPENAI_API_KEY ──────────┐  │
├── 5A-5: IAM grants ─────────────┐│  │
│                                   ││  │
Sprint 5B (4-5d)                    ││  │
├── 5B-1: Migration 007 ◄──────────┘│  │
├── 5B-3: Embedding pipeline ◄──────┘──┘
├── 5B-6: Drive scanner ◄── 5B-1, 5B-9 (Drive folders)
├── 5B-10–12: Seed docs (parallel, no deps)
├── 5B-14: Ingest seed ◄── 5B-6, 5B-10–13
├── 5B-15: Verify embeddings ◄── 5B-3, 5B-14
├── 5B-16: Upgrade search_knowledge ◄── 5A-1 (match_knowledge exists)
│
Sprint 5C (3-4d)
├── 5C-1: Weekly summary ◄── 5B-3 (embedding pipeline must exist)
├── 5C-4: Shared library ◄── 5A-1 (match_knowledge available)
├── 5C-5–7: Skill updates ◄── 5B-16 (semantic search works)
├── 5C-8: Birthday enrichment ◄── 5C-4
│
Sprint 5D (2-3d)
├── 5D-1: Auto-connections ◄── 5B-15 (embeddings exist)
├── 5D-4: Approval flow ◄── 5D-1
├── 5D-5: Snapshots ◄── 5B-1 (knowledge_snapshots table)
```

---

## Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | OpenAI API key costs spike from embedding generation | Low | Medium | Batch embeddings, text-embedding-3-small ($0.02/1M tokens), monitor via pipeline_runs cost_estimate. Estimated 80-100 entries = ~$0.001. |
| R2 | Cloud Functions Gen 2 buildpack still broken | Known | Low | Already mitigated: deploy all pipelines as Cloud Run services with Dockerfile. |
| R3 | Claude.ai MCP connector remains unlinked | Medium | High | Skills can still query via Claude Code. Manual step needed. Block: 5A-6. |
| R4 | Drive API quota limits on daily scanning | Low | Low | AI OS Knowledge folder will have <500 files. Google Drive API quota: 12,000 requests/day. |
| R5 | Embedding model change (text-embedding-3-small → newer) | Low | Medium | Store model_used per embedding. Re-embed pipeline can be triggered manually. |
| R6 | Weekly summary produces low-quality entries | Medium | Medium | Use Claude Haiku with structured prompts. Review first 2-3 summaries manually. Adjust prompts. |
| R7 | Drive scanner re-ingests unchanged files | Low | Low | Deduplication via drive_file_id + last_modified in metadata. drive_scan_state table tracks scan timestamps. |

---

## Progress Tracker

### Overall Progress

| Sprint | Status | Started | Completed | Tasks Done | Tasks Total |
|--------|--------|---------|-----------|------------|-------------|
| 5A | `NOT_STARTED` | — | — | 0 | 7 |
| 5B | `NOT_STARTED` | — | — | 0 | 18 |
| 5C | `NOT_STARTED` | — | — | 0 | 10 |
| 5D | `NOT_STARTED` | — | — | 0 | 9 |
| **Total** | — | — | — | **0** | **44** |

### Metrics (Updated Weekly)

| Metric | Target | Current |
|--------|--------|---------|
| knowledge_entries rows | 150+ | 0 |
| knowledge_embeddings rows | 150+ | 0 |
| knowledge_connections rows | 60+ | 0 |
| Pipelines deployed | 4 | 0 |
| Skills RAG-grounded | 4 | 0 |
| Migrations applied | 007 | 005 |
| Secrets in Secret Manager | 9 (+ OPENAI_API_KEY) | 8 |

### Change Log

| Date | Sprint | Change | Author |
|------|--------|--------|--------|
| 2026-03-15 | — | Initial implementation plan created from V2 vision doc | Atharva/Claude |

---

## Supporting Documents Index

| Document | Purpose | Sprint Ref |
|----------|---------|------------|
| [`MIGRATION_006_SPEC.md`](./MIGRATION_006_SPEC.md) | Full SQL specification for migration 006: enums, columns, match_knowledge(), traverse_knowledge() | 5A |
| [`MIGRATION_007_SPEC.md`](./MIGRATION_007_SPEC.md) | Full SQL specification for migration 007: ingestion_jobs, snapshots, drive_scan_state | 5B |
| [`PIPELINE_SPECS.md`](./PIPELINE_SPECS.md) | Architecture + pseudocode for all 5 pipelines: embedding gen, Drive scanner, weekly summary, shared library, auto-connections | 5B–5D |
| [`SKILL_UPDATE_SPEC.md`](./SKILL_UPDATE_SPEC.md) | Detailed specs for search_knowledge upgrade + 4 skill updates + connection approval | 5B–5D |
| [`KNOWLEDGE_SEED_PLAN.md`](./KNOWLEDGE_SEED_PLAN.md) | Content plan for 80–100+ initial knowledge entries across 3 domains | 5B |
| [`COST_ESTIMATE.md`](./COST_ESTIMATE.md) | Detailed cost breakdown for all new infrastructure, API calls, and ongoing monthly costs | All |
| [`DRIVE_FOLDER_TAXONOMY.md`](./DRIVE_FOLDER_TAXONOMY.md) | Drive Knowledge/ folder structure, domain mapping rules, naming conventions | 5B |

### External References

| Document | Location | Purpose |
|----------|----------|---------|
| V2 Vision Document | `knowledge-base/AI_OS_Knowledge_Layer_V2_Revised.docx` | Original vision and design decisions |
| Current DB Schema | `knowledge-base/DB_SCHEMA.md` | Live schema reference (migration 004 state) |
| Tool Ecosystem Plan | `knowledge-base/TOOL_ECOSYSTEM_PLAN.md` | Architecture tiers and decision tree |
| Project State | `knowledge-base/PROJECT_STATE.md` | Authoritative deployment state (v4.1) |
| GCP Config | `knowledge-base/GCP_INFRA_CONFIG.md` | Infrastructure details |
| Interface Strategy | `knowledge-base/INTERFACE_STRATEGY.md` | Dashboard and interface design |
| Evolution Log | `knowledge-base/EVOLUTION_LOG.md` | Sprint history |
| Task Notification (reference pattern) | `workflows/category-b/task-notification/` | Cloud Run service pattern to follow |
| MCP Gateway modules | `mcp-servers/ai-os-gateway/app/modules/` | Existing tool implementations |

---

*This plan is a living document. Update the Progress Tracker section after each work session. Add entries to the Change Log for any plan modifications.*
