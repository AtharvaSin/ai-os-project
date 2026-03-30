# Bharatvarsh Content Operations Platform

The Bharatvarsh Content Operations Platform (BCOP) is a local-first content pipeline that automates the creation, rendering, scheduling, distribution, and performance monitoring of promotional content for the MahaBharatvarsh novel across Instagram, Twitter/X, and Facebook. It is built on three principles: lore-canonical consistency, brand-locked design (Context B tokens), and human-in-the-loop quality gates.

## Architecture (6 Layers)

1. **Strategy & Planning** — Content calendar CSV drives everything. Each row is one post across all channels. Brand guidelines and lore validation enforce consistency from the start.
2. **Prompt Engineering** — The `bharatvarsh-art-prompts` skill generates model-aligned prompts with character Visual DNA, style anchors, environment templates, and negative prompt libraries.
3. **Asset Generation** — AI image/video generation via OpenArt (SDXL/Flux) and Google Flow (Imagen/Veo). Human iterates until quality gate passes. Reference sheets enforce character consistency.
4. **Post Rendering** — asr-visual-studio plugin composites final assets with channel-specific HTML templates and brand tokens into platform-ready posts.
5. **Distribution** — Automated pipelines push approved posts to Instagram, Twitter/X, and Facebook on schedule via platform APIs.
6. **Monitoring & Feedback** — Performance dashboard tracks engagement. AI analyzes what works and recommends adjustments for the next content cycle.

## Weekly Workflow (Steady State)

| Day | Time | Activity |
|-----|------|----------|
| Sunday | 60 min | Brainstorm topics, update calendar, generate prompts, create assets, render posts, batch approve |
| Mon-Wed | 15 min/day | Engagement: reply to comments, reshare |
| Thursday | 15 min | Quick analytics check, note adjustments |
| Daily (automated) | 0 min | Distribution pipeline posts on schedule, metrics fetcher collects data |

Total: ~2.5 hours/week manual effort.

## File Structure

```
content-pipelines/bharatvarsh/
├── README.md                           ← You're reading this
├── IMPLEMENTATION_PLAN.md              ← Full 4-phase build plan
├── calendar/
│   ├── content_calendar.csv            ← Master calendar (one row per post)
│   ├── schema.json                     ← JSON Schema for CSV validation
│   └── archive/                        ← Past calendars by quarter
├── templates/
│   ├── instagram/
│   │   ├── BHV-T-QUOTE-IG.html        ← Quote card (1080×1080)
│   │   └── BHV-T-CHAR-IG.html         ← Character teaser (1080×1350)
│   ├── twitter/
│   │   └── BHV-T-LORE-TW.html         ← Lore reveal card (1200×675)
│   ├── facebook/                       ← (Phase 2)
│   └── shared/
│       ├── brand-tokens.js             ← Context B hex values as JS constants
│       ├── atmospheric-effects.css     ← Film grain, vignette, animations
│       └── fonts.css                   ← Google Fonts imports
├── assets/
│   ├── references/                     ← Canonical character/location reference images
│   └── {post_id}/                      ← Per-post asset folders
├── rendered/
│   └── {post_id}/                      ← Per-post rendered channel variants
├── prompts/
│   ├── style_anchors.json              ← 5 pre-validated style anchor strings
│   ├── character_dna.json              ← 5 characters with Visual DNA
│   ├── environment_templates.json      ← 4 key location descriptions
│   └── negative_prompts.json           ← Base + model + target negatives
├── distributor/                        ← (Phase 3)
│   ├── channel_adapters/
│   └── config.json
├── monitor/                            ← (Phase 4)
│   ├── dashboard/
│   └── reports/
└── skills/
    └── SKILL_BHARATVARSH_ART_PROMPTS.md ← Full prompting skill reference
```

## Key References

| Document | Location |
|----------|----------|
| System Architecture | `bharatvarsh-content-pipeline/plan-first-draft/BHARATVARSH_CONTENT_OPS_SYSTEM.md` |
| AI Art Prompting Skill | `content-pipelines/bharatvarsh/skills/SKILL_BHARATVARSH_ART_PROMPTS.md` |
| Brand Identity (Context B) | `knowledge-base/BRAND_IDENTITY.md` |
| Lore Canon | `knowledge-base/BHARATVARSH_BIBLE.md` |
| Marketing Strategy | `knowledge-base/MARKETING_PLAYBOOK.md` |
| Implementation Plan | `content-pipelines/bharatvarsh/IMPLEMENTATION_PLAN.md` |

## Current Status

**Phase 1: Foundation — COMPLETE**
- Directory structure created
- Content calendar CSV with sample data + JSON Schema validation
- Brand token exports (JS constants, CSS atmospheric effects, font imports)
- Prompt data files (style anchors, character DNA, environments, negatives)
- 3 starter HTML templates (quote card, character teaser, lore reveal)
- AI art prompting skill installed in Claude Code
- README and implementation plan

**Phase 2: Asset Pipeline — PENDING**
**Phase 3: Distribution — PENDING**
**Phase 4: Monitoring — PENDING**
