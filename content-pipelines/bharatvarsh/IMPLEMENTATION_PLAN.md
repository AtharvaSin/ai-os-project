# Bharatvarsh Content Operations Platform — Implementation Plan

> **Owner:** Atharva Singh
> **Created:** 2026-03-20
> **Status:** Phase 1 in progress
> **Architecture Reference:** `bharatvarsh-content-pipeline/plan-first-draft/BHARATVARSH_CONTENT_OPS_SYSTEM.md`

---

## Overview

The Bharatvarsh Content Operations Platform (BCOP) is a 6-layer content factory that automates promotional content creation, rendering, distribution, and monitoring for MahaBharatvarsh across Instagram, Twitter/X, and Facebook. It lives as `content-ops/` inside the existing AI OS project.

**Three core principles:** lore-canonical consistency, brand-locked design (Context B tokens everywhere), human-in-the-loop quality gates.

**Two key plugins:** asr-visual-studio (Layer 4 rendering) and asr-software-forge (scaffolding complex code).

---

## Phase 1: Foundation (~6-8 hours)

**Goal:** Create all directory structure, data schemas, brand exports, prompt data files, starter templates, and the art prompting skill. No runtime code yet — this is the data layer everything else builds on.

### Task 1: Directory Structure
Create the full `content-ops/` tree with all subdirectories and placeholder files.

**Files created:**
- `content-ops/README.md`
- `content-ops/calendar/` (with `archive/`)
- `content-ops/templates/instagram/`, `twitter/`, `facebook/`, `shared/`
- `content-ops/assets/references/` + `.gitkeep` files
- `content-ops/rendered/` + `.gitkeep`
- `content-ops/prompts/`
- `content-ops/distributor/channel_adapters/`
- `content-ops/monitor/dashboard/`, `reports/`
- `content-ops/skills/`

### Task 2: Content Calendar CSV + JSON Schema
- Header-only CSV with all 25 fields from the architecture doc
- 3-5 sample rows with realistic test data (mix of content pillars and formats)
- JSON Schema document with all enum constraints for validation

### Task 3: Brand Token Exports
- `brand-tokens.js` — All Context B hex values as JS constants
- `atmospheric-effects.css` — Film grain, vignette, surveillance grid, animations
- `fonts.css` — Google Fonts imports for Bebas Neue, Inter, Crimson Pro, JetBrains Mono, Noto Sans Devanagari

### Task 4: Prompt Data Files
Extract from SKILL_BHARATVARSH_ART_PROMPTS.md into machine-readable JSON:
- `style_anchors.json` — 5 anchors with full prompt text
- `character_dna.json` — 5 characters with Visual DNA
- `environment_templates.json` — 4 locations
- `negative_prompts.json` — Base + model-specific + target-specific

### Task 5: Starter HTML Templates (3)
Self-contained HTML files for Puppeteer rendering via asr-visual-studio:
- `BHV-T-QUOTE-IG.html` — Quote card (1080×1080, Instagram)
- `BHV-T-CHAR-IG.html` — Character teaser (1080×1350, Instagram 4:5)
- `BHV-T-LORE-TW.html` — Lore reveal card (1200×675, Twitter 16:9)

Each uses inline CSS with Context B tokens, atmospheric effects, brand fonts. Accepts URL parameters or data attributes for slot content.

### Task 6: Install Prompting Skill
- Copy to `content-ops/skills/SKILL_BHARATVARSH_ART_PROMPTS.md`
- Create `.claude/skills/bharatvarsh-art-prompts/SKILL.md` with Claude Code frontmatter

### Task 7: README
System overview, 6-layer summary, weekly workflow, file structure, status.

**Phase 1 Deliverable:** A complete data foundation. All JSON files can be consumed by downstream code. Templates can be rendered by asr-visual-studio. The skill is registered for Claude Code.

---

## Phase 2: Asset Pipeline (~4-6 hours)

**Goal:** Generate canonical reference images and test the full asset-to-rendered-post pipeline using asr-visual-studio.

### Task 2.1: Reference Image Generation
Using the prompting skill, generate:
- Character reference sheets for 4 declassified characters (Kahaan, Rudra, Pratap, Hana)
- Location references for 3 key settings (Indrapur HQ, Lakshmanpur, Oxy Pole Boulevard)
- Style guide collage establishing the visual tone

**Tools:** OpenArt (SDXL/Flux), Google Flow (Imagen). Manual operation with prompt refinement.

**Output:** `content-ops/assets/references/` populated with canonical images + `metadata.json` per image.

### Task 2.2: First Asset Batch
Generate 5-10 assets for sample calendar posts. Test across content pillars: one quote card, one character teaser, one lore reveal, one world contrast, one CTA.

**Output:** `content-ops/assets/{post_id}/` with prompt.txt, final.png, metadata.json per post.

### Task 2.3: Rendering Pipeline Integration
Wire the templates to asr-visual-studio:
- Create a `render-post.js` script that takes a post_id, reads the calendar row, selects the template, fills slots with asset + text data, calls asr-visual-studio's renderer
- Test: asset + template → rendered multi-channel output
- Validate brand consistency across Instagram, Twitter, Facebook variants

**Output:** `content-ops/rendered/{post_id}/` with `instagram_feed.png`, `twitter.png`, `facebook.png`.

### Task 2.4: Template Expansion
Based on Phase 2.3 results, build remaining templates:
- `BHV-T-WORLD-IG.html` — World contrast (split image)
- `BHV-T-CTA-IG.html` — Gateway CTA
- `BHV-T-BTS-IG.html` — Behind the scenes
- `BHV-T-REEL-IG.html` — Video reel overlay
- Facebook variants of all templates
- Twitter variants of remaining templates

**Phase 2 Deliverable:** Working asset-to-post pipeline. Given a calendar row and assets, the system produces channel-ready rendered posts.

---

## Phase 3: Distribution Infrastructure (~6-8 hours)

**Goal:** Build the automated distribution pipeline that publishes rendered posts to Instagram, Twitter/X, and Facebook on schedule.

### Task 3.1: API Credential Setup
- Meta Graph API: Create Facebook App, configure Instagram Business integration, generate long-lived page access token
- Twitter API v2: Apply for elevated access if needed, set up OAuth 2.0, configure media upload permissions
- Store all credentials in GCP Secret Manager (new secrets: `INSTAGRAM_ACCESS_TOKEN`, `TWITTER_OAUTH_TOKEN`, `FACEBOOK_PAGE_TOKEN`)

### Task 3.2: Channel Adapter Scripts
Build Python adapters following existing AI OS patterns:
- `content-ops/distributor/channel_adapters/instagram.py` — Meta Graph API (upload media → create container → publish)
- `content-ops/distributor/channel_adapters/twitter.py` — Twitter API v2 (upload media → create tweet, thread support)
- `content-ops/distributor/channel_adapters/facebook.py` — Meta Graph API (upload media → create post)

Each adapter: type-hinted, async, structured error handling, rate limit awareness.

### Task 3.3: Distribution Orchestrator
`content-ops/distributor/distribute.py`:
- Reads content_calendar.csv
- Filters: `status == 'approved' AND scheduled_datetime <= now()`
- For each row: call appropriate channel adapter(s)
- Update calendar: `status → 'published'`, populate `published_url`
- Log to AI OS database via MCP `log_pipeline_run`
- Telegram notification on success/failure

### Task 3.4: Approval Workflow
Add the `approved` status to the pipeline:
- Calendar rows go `rendered → approved → published`
- Batch approval script: shows rendered previews, takes approval input
- `auto_publish` field support for low-risk posts

### Task 3.5: Deployment Decision
Two options (decide based on posting frequency):

**Option A: Claude Schedules (simpler, lower volume)**
- Claude Schedule task runs every 15 min
- Reads calendar, posts due items, updates statuses
- Zero infrastructure cost
- Best if posting 1-2 times/day

**Option B: Cloud Run + Cloud Scheduler (production, higher volume)**
- Deploy as `workflows/category-b/content-distributor/` on Cloud Run
- Cloud Scheduler triggers every 15 min
- Scales independently, proper logging
- Best if posting 3+ times/day or if system needs to be fully autonomous

### Task 3.6: End-to-End Test
- Create 2 test posts with rendered assets
- Run manual distribution trigger
- Verify: correct formatting on each platform, calendar status updated, pipeline logged

**Phase 3 Deliverable:** Approved, rendered posts auto-publish to all channels on schedule. Human approves on Sunday, pipeline handles the rest.

---

## Phase 4: Monitoring & Feedback (~4-6 hours)

**Goal:** Build performance tracking, a visual dashboard, and an AI-guided strategy feedback loop.

### Task 4.1: Metrics Collection Pipeline
`content-ops/monitor/fetch_metrics.py`:
- Daily cron job (Cloud Scheduler or Claude Schedule)
- Fetches from each platform API: impressions, reach, engagement, likes, comments, shares, saves, clicks
- Writes metrics back to content_calendar.csv performance columns
- Optionally writes to `post_performance` DB table for historical analysis

### Task 4.2: Performance Dashboard
Two options (decide based on scope):

**Option A: AI OS Dashboard PWA Page**
- Add `/content-performance` route to existing Next.js dashboard
- Charts: post performance over time, pillar effectiveness, channel comparison
- Reuse existing dashboard auth, layout, components
- Best for integrated experience

**Option B: Local Standalone Dashboard**
- Simple React app in `content-ops/monitor/dashboard/`
- Reads from CSV directly
- No auth needed (local only)
- Best for quick iteration

### Task 4.3: AI Strategy Feedback Loop
Extend the `/weekly-review` skill or create a new `/content-review` skill:
- Reads performance data for the past 2 weeks
- Analyzes: which pillars perform best, which hooks get traction, optimal posting times, channel effectiveness
- Generates recommendations for next cycle's content mix
- Human reviews and adjusts calendar

### Task 4.4: Telegram Integration
Wire performance alerts to existing Telegram bot:
- Post published → notification with preview
- Daily performance summary → top/worst performer
- Milestone alerts → "Post X reached 1000 impressions"

**Phase 4 Deliverable:** Full feedback loop. Posts go out, performance data comes back, AI recommends adjustments, human calibrates the next cycle.

---

## Phase 5: Steady State (~2-3 hours/week)

Once all phases are built:

| Day | Time | Activity | Automation |
|-----|------|----------|------------|
| Sunday | 60 min | Brainstorm topics → update calendar → generate prompts → generate assets → render posts → batch approve | Skill-assisted |
| Mon-Wed | 15 min/day | Engagement: reply to comments, DMs, reshare | Manual |
| Thursday | 15 min | Quick analytics check, note adjustments | Dashboard |
| Daily | 0 min | Distribution pipeline posts on schedule, metrics fetcher collects data | Fully automated |

**Total weekly investment:** ~2.5 hours manual + fully automated distribution and metrics.

---

## Dependencies & Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Meta Graph API approval delay | Blocks Instagram/Facebook distribution | Start API application in Phase 1, not Phase 3 |
| Twitter API rate limits (free tier) | Max 17 tweets/15 min | Stagger posting times, consider Basic tier ($100/mo) |
| AI art consistency across posts | Visual brand dilution | Reference sheets + IP-Adapter + seed anchoring (Phase 2) |
| Character reference drift over time | Inconsistent character look | Lock reference sheets as canonical, version them |
| asr-visual-studio template rendering issues | Blocked rendering pipeline | Test templates early with sample data in Phase 1 |

---

## Integration Points with Existing AI OS

| Component | Integration |
|-----------|-------------|
| Database | `campaign_posts` + `campaigns` tables for persistence |
| MCP Gateway | `log_pipeline_run`, `insert_record`, `update_record` |
| Dashboard PWA | Performance monitoring page (Phase 4) |
| Telegram Bot | Post notifications, performance alerts |
| Skills | Art prompting skill, extended weekly review |
| Cloud Scheduler | Distribution and metrics collection crons |
| Google Drive | Asset backup via `drive_write` MCP module |

---

*This plan is the roadmap. Update it as phases complete and the system evolves.*
