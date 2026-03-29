# Content Strategy v2 — Session Log

> **Purpose:** Captures the design decisions, artifacts created, and migration plan from the Content Strategy v2 session (2026-03-22). Reference this when resuming content pipeline work, generating new posts, or completing the dashboard taxonomy migration.
>
> **Created:** 2026-03-22
> **Session scope:** Content calendar redesign, 4-layer funnel strategy creation, DB migration update, dashboard taxonomy handoff

---

## What Was Done

### 1. Content Strategy Redesign
Translated Atharva's handwritten+typed PDF into a structured, machine-readable strategy document (`knowledge-base/CONTENT_STRATEGY.md`, ~350 lines). This is now the **permanent seed** governing all future Bharatvarsh content post generation.

**The 4-Layer Content Funnel:**

| Layer | Name | Values | Purpose |
|-------|------|--------|---------|
| 1 | Knowledge Base | Bharatvarsh Bible, Characters, Locations, Timeline, Visual Guide, Writing Guide | Lore foundation — never exposed directly |
| 2 | Story Angles | `bharatsena` (state), `akakpen` (tribal/wild), `tribhuj` (resistance) | Perspective lens — whose eyes the audience sees through |
| 3 | Distillation Filters | `living_without_religion`, `med_mil_progress`, `novel_intro` | Thematic lens — what theme gets amplified |
| 4 | Content Channels | `declassified_report`, `graffiti_photo`, `news_article` | Output format — how the content looks |

Every post is a unique combination: one story angle × one distillation filter × one content channel. This creates a 3×3×3 = 27 combination matrix ensuring variety across the campaign.

### 2. Content Calendar Overhaul
- Archived old 30-row calendar → `content-pipelines/bharatvarsh/calendar/archive/content_calendar_v1.csv`
- Archived stale KB file → `knowledge-base/archive/CONTENT_CALENDAR_v1.md`
- Created new `content-pipelines/bharatvarsh/calendar/content_calendar.csv` with 29-column schema including `story_angle`, `distillation_filter`, `content_channel`
- Designed 5 inaugural posts demonstrating full funnel range:
  - **ARC1-001** (Apr 6): bharatsena × living_without_religion × declassified_report — Temple Repurposing Directive
  - **ARC1-002** (Apr 9): akakpen × med_mil_progress × graffiti_photo — Drone-Jammer Valley
  - **ARC1-003** (Apr 12): bharatsena × med_mil_progress × news_article — 1717 Divergence BVN-24x7
  - **ARC1-004** (Apr 15): tribhuj × novel_intro × graffiti_photo — Grey Trident graffiti
  - **ARC1-005** (Apr 18): bharatsena × living_without_religion × news_article — Basement Meditation Permits

### 3. Database Migration Update
Updated `database/migrations/020_content_pipeline.sql` to add 3 new columns to `content_posts`:
- `story_angle VARCHAR(50)` — Layer 2 taxonomy
- `distillation_filter VARCHAR(50)` — Layer 3 taxonomy
- `content_channel VARCHAR(50)` — Layer 4 taxonomy

Plus 3 new partial indexes and detailed COMMENT ON COLUMN annotations. The existing `content_pillar` column is kept for backward compatibility — it stores the `story_angle` value.

**Status:** Migration 020 NOT YET APPLIED to live DB. Seed 015 (content_posts data) also pending.

### 4. Dashboard Taxonomy Migration (Partial)
Created handoff prompt (`content-pipelines/bharatvarsh/DASHBOARD_UPDATE_PROMPT.md`) for another session. Files already updated by that session:
- `dashboard/src/app/api/content-pipeline/route.ts` — 3-axis summary queries, POST upsert
- `dashboard/src/components/content-pipeline/ContentPipelineView.tsx` — 3 new filter dropdowns
- `dashboard/src/components/content-pipeline/ContentPostCard.tsx` — 3 taxonomy badges

**Still pending:**
- `dashboard/src/lib/types.ts` — Add story_angle, distillation_filter, content_channel to ContentPost interface
- `dashboard/src/lib/utils.ts` — Add filterLabel/channelLabel/filterColor/channelColor functions
- `dashboard/src/components/content-pipeline/ContentPostDetail.tsx` — Replace Pillar section with Taxonomy section
- `content-pipelines/bharatvarsh/sync_calendar_to_db.py` — CSV-to-PostgreSQL sync script (NEW)

### 5. Project State Update (v17 → v18)
Ran full codebase scan and corrected drift:
- Dashboard: 9 pages → **7 pages**, 31 components → **38 components**, 25+ API routes → **33 API routes**
- Updated: PROJECT_STATE.md, WORK_PROJECTS.md, CLAUDE.md, TOOL_ECOSYSTEM_PLAN.md, INTERFACE_STRATEGY.md, GCP_INFRA_CONFIG.md

---

## Key Design Decisions

1. **Backward compatibility over breaking change:** Kept `content_pillar` column (populated with `story_angle` value) rather than dropping it. No existing UI or API breaks.
2. **Jim Lee art direction as constant:** All visual content uses dense linework, heavy blacks, cross-hatching, cinematic framing — baked into CONTENT_STRATEGY.md.
3. **Spoiler safety as hard constraint:** Posts must never reveal KACHA programme, Pratap's orchestration, Kahaan's final choice, or power transfer. Classified as safe/minor_spoiler/major_spoiler.
4. **welcometobharatvarsh.com always in content:** Every post includes the website URL as CTA.
5. **Human-in-loop maintained:** Pipeline remains draft-only. No auto-publishing. `approved` status gate before `scheduled` or `published`.

---

## Files Created or Modified

| File | Action | Notes |
|------|--------|-------|
| `knowledge-base/CONTENT_STRATEGY.md` | CREATED | Permanent strategy seed (~350 lines) |
| `content-pipelines/bharatvarsh/calendar/content_calendar.csv` | CREATED | 5 posts, 29-column schema |
| `content-pipelines/bharatvarsh/DASHBOARD_UPDATE_PROMPT.md` | CREATED | Cross-session handoff prompt |
| `content-pipelines/bharatvarsh/calendar/archive/content_calendar_v1.csv` | ARCHIVED | Old 30-row calendar |
| `knowledge-base/archive/CONTENT_CALENDAR_v1.md` | ARCHIVED | Stale KB file |
| `database/migrations/020_content_pipeline.sql` | MODIFIED | +3 columns, +3 indexes, +comments |
| `knowledge-base/PROJECT_STATE.md` | MODIFIED | v17 → v18 |
| `knowledge-base/WORK_PROJECTS.md` | MODIFIED | Updated counts + strategy description |
| `CLAUDE.md` | MODIFIED | Corrected dashboard counts, updated sprint |
| `knowledge-base/TOOL_ECOSYSTEM_PLAN.md` | MODIFIED | Updated header to v18 |
| `knowledge-base/INTERFACE_STRATEGY.md` | MODIFIED | Updated header to v18 |
| `knowledge-base/GCP_INFRA_CONFIG.md` | MODIFIED | Corrected dashboard row |

---

## Next Steps (for future sessions)

1. **Apply migration 020 + seed 015** to live Cloud SQL database
2. **Complete dashboard taxonomy migration** — types.ts, utils.ts, ContentPostDetail.tsx
3. **Build sync_calendar_to_db.py** — CSV → content_posts table sync script
4. **Generate more posts** — Use CONTENT_STRATEGY.md as the seed, expand beyond 5 posts
5. **Add social API credentials** — X/Twitter, LinkedIn, Meta OAuth to Secret Manager
6. **Test end-to-end pipeline** — CSV → DB → Dashboard → Social posting
