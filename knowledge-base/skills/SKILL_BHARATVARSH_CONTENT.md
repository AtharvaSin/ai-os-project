# Skill: Bharatvarsh Content v2.0

> **Scope:** This skill operates within the AI Operating System project. It references project-specific knowledge base documents, MCP tools, and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary). Claude Code counterpart at `.claude/skills/bharatvarsh-content/`.
>
> **Version:** 2.0 — Expanded with character/visual KB files and MCP lore validation tools.

---

## When to Use

Activate this workflow when the user asks to create marketing content, social media posts, promotional material, lore teasers, character reveals, or any public-facing content related to the Bharatvarsh novel and transmedia universe.

**Trigger phrases:** "Bharatvarsh post," "novel marketing," "lore reveal," "character teaser," "promote the book," "Bharatvarsh social," "write a tweet about Bharatvarsh," or any content creation request tied to the novel, website, or universe.

**Do NOT use for:** Novel writing (chapter drafting, plot development, dialogue) — use the `bharatvarsh-writer` skill instead. This skill is for promotional and engagement content only.

---

## Process

### Step 1: Load Context (MANDATORY)

Always load these knowledge base files:

| File | Purpose | Required |
|------|---------|----------|
| `BHARATVARSH_BIBLE.md` | World reference — politics, economy, surveillance, society, themes | Yes |
| `BHARATVARSH_CHARACTERS.md` | Character profiles — identity, psychology, arc, visual keys, voice | Yes |
| `BHARATVARSH_VISUAL_GUIDE.md` | Art direction — color palettes, character visual keys, uniforms, weapons | Yes |
| `BHARATVARSH_PLATFORM.md` | Website features, purchase links, lead magnet funnel | Yes |
| `MARKETING_PLAYBOOK.md` | Brand voice, audience segments, platform strategies | If available |
| `CONTENT_CALENDAR.md` | Avoid duplicates, identify gaps | If available |
| `BRAND_IDENTITY.md` | Context B design tokens (mustard, Bebas Neue, obsidian) | For visual direction |

### Step 2: Determine Content Type

| Type | Purpose | Best Platform |
|------|---------|---------------|
| Lore Reveal | Surface interesting world details to create intrigue | Twitter/X, Instagram |
| Character Teaser | Spotlight a character with a compelling hook | Instagram, Twitter/X |
| World Contrast | Compare Bharatvarsh reality to our world — provoke thought | LinkedIn, Twitter/X |
| Quote Card | A striking line from the book or universe | Instagram |
| Behind-the-Scenes | Author perspective on writing, world-building, website tech | LinkedIn, Twitter/X |
| Community Prompt | A question or discussion starter for the forum | Forum, Twitter/X |
| Purchase CTA | Direct drive to buy the book | All platforms |
| Website Feature | Highlight Bhoomi AI, lore archive, timeline, forum | Twitter/X, LinkedIn |
| Character Dossier | In-universe intelligence file format | Instagram carousel, Twitter thread |
| Tech Spotlight | Spotlight a Bharatvarsh technology (Mesh, Bracecomm, etc.) | Twitter/X, Instagram |

### Step 3: Validate Lore Accuracy (NEW in v2.0)

Before finalizing any content, use the MCP lore tools:

1. **`check_lore_consistency`** — Pass the draft content text. This tool validates all entity names, faction references, and technology mentions against the canonical lore database. Fix any flagged issues.
2. **`get_character`** — If the content features a specific character, pull their full profile to verify accuracy of visual descriptions, dialogue voice, and arc details.
3. **`search_lore`** — If referencing any entity, verify it exists and the details match.

### Step 4: Generate Platform-Specific Content

**For Twitter/X:**
- Thread format (3-5 tweets) or single tweet
- Hook in first tweet — no slow build-up
- End with CTA (link to book, website, or specific page)
- Hashtags: #Bharatvarsh #MahaBharatvarsh #AlternateHistory #IndianSciFi — use 2-3 max
- Character limit: 280 per tweet

**For Instagram:**
- Caption (150-300 words) with visual direction
- Visual direction note: describe the ideal image — style, mood, composition, text overlay
- Reference BHARATVARSH_VISUAL_GUIDE.md for exact color palettes and character visual keys
- Hashtags: 15-20 relevant tags in a separate block
- CTA in caption: "Link in bio" or "Comment your theory"

**For LinkedIn:**
- Professional angle — the craft, the technology, the creative process
- 150-250 words, first line is the hook
- No hashtag spam — 3-5 relevant tags max
- Author voice: thoughtful, ambitious, builder-storyteller

### Step 5: Apply Brand Identity

All visual direction must follow Context B from BRAND_IDENTITY.md:
- **Colors:** Obsidian backgrounds, mustard gold (#F1C232) for interactive/accent, powder blue for technical
- **Typography:** Bebas Neue (display), Inter (body), Crimson Pro (lore narrative)
- **Atmospheric effects:** Film grain, vignette, surveillance-grid overlays
- **Tone:** Dark, cinematic, dystopian — never cheerful or bright

### Step 6: Deliver with Visual Direction

For every piece of content, include:
- The text (ready to copy-paste)
- Platform label
- Visual direction (what the accompanying image should look like — specific enough to generate)
- Posting recommendation (best time/day if relevant)
- Context B brand token callouts (accent color, font, effect)

---

## Content Voice for Bharatvarsh

The marketing voice should feel like:
- **Atmospheric and immersive** — pull people into the world
- **Provocative questions** — "What would you sacrifice for the truth?" "Is peace worth freedom?"
- **Intelligence dossier tone** — for lore reveals, use classified/declassified framing
- **Never spoil** — tease, don't tell. Create questions, not answers.

Avoid:
- Generic book marketing language ("thrilling page-turner," "must-read")
- Over-explaining the plot
- Breaking the fourth wall in lore-focused posts (stay in-universe)
- Revealing content marked as **Classified** in the lore database

---

## Quality Rules

- Every post must be lore-accurate. Use `check_lore_consistency` MCP tool on every draft.
- Content should work standalone — someone seeing it for the first time should be intrigued without context.
- Purchase CTAs should be subtle except in dedicated CTA posts.
- Visual direction must reference specific character visual keys from BHARATVARSH_VISUAL_GUIDE.md.
- Vary content types across the week. Don't post 5 lore reveals in a row.
- Respect Classified/Declassified status from the lore database.

---

## Purchase Links

- **Amazon India:** Search "MahaBharatvarsh Atharva Singh"
- **Flipkart:** Search "MahaBharatvarsh"
- **Notion Press:** Search "MahaBharatvarsh"
- **Website:** welcometobharatvarsh.com

---

## MCP Tools Used

| Tool | When |
|------|------|
| `check_lore_consistency` | Validate every draft before finalizing |
| `get_character` | When featuring a specific character |
| `search_lore` | When referencing any lore entity |
| `query_lore` | When browsing for content ideas |
| `get_timeline` | When creating timeline-based content |

---

## Knowledge Base Files Used

- `BHARATVARSH_BIBLE.md` — lore accuracy (required)
- `BHARATVARSH_CHARACTERS.md` — character accuracy (required)
- `BHARATVARSH_VISUAL_GUIDE.md` — visual direction (required)
- `BHARATVARSH_PLATFORM.md` — website/marketing context (required)
- `MARKETING_PLAYBOOK.md` — brand voice and strategy (when available)
- `CONTENT_CALENDAR.md` — avoid duplicates, fill gaps (when available)
- `BRAND_IDENTITY.md` — Context B design tokens (when producing visuals)
