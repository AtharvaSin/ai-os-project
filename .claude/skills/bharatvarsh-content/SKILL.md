---
name: bharatvarsh-content
description: "Lore-grounded Bharatvarsh marketing content per platform with visual direction and MCP lore validation. Use when user asks for novel marketing, lore reveal, character teaser, or Bharatvarsh social content."
---

# Skill: Bharatvarsh Content v2.0

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents, MCP lore tools, and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Version:** 2.0 — Now loads expanded KB files (CHARACTERS, VISUAL_GUIDE) and validates via MCP lore tools.

---

## When to Use

Activate this workflow when the user asks to create marketing content, social media posts, promotional material, lore teasers, character reveals, or any public-facing content related to the Bharatvarsh novel and transmedia universe. Trigger phrases include: "Bharatvarsh post," "novel marketing," "lore reveal," "character teaser," "promote the book," "Bharatvarsh social," or any content creation request tied to the novel, website, or universe.

Do NOT use for novel writing (chapter drafting, plot development, dialogue) — use the `bharatvarsh-writer` skill instead.

---

## Process

### Step 1: Load Context
Always load these knowledge-base files:
- **BHARATVARSH_BIBLE.md** — world reference: politics, economy, surveillance, society, themes
- **BHARATVARSH_CHARACTERS.md** — character profiles: identity, psychology, arc, visual keys, voice
- **BHARATVARSH_VISUAL_GUIDE.md** — art direction: color palettes, character visual keys, uniforms, weapons
- **BHARATVARSH_PLATFORM.md** — website features, purchase links, lead magnet funnel

If available, also load:
- **CONTENT_CALENDAR.md** — avoid duplicating recently published content and identify gaps
- **MARKETING_PLAYBOOK.md** — brand voice and platform strategy
- **BRAND_IDENTITY.md** — Context B design tokens for visual direction

### Step 2: Determine Content Type
Identify what's being created:

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
| Tech Spotlight | Spotlight a Bharatvarsh technology | Twitter/X, Instagram |

### Step 3: Generate Platform-Specific Content

**For Twitter/X:**
- Thread format (3-5 tweets) or single tweet
- Hook in first tweet — no slow build-up
- End with CTA (link to book, website, or specific page)
- Hashtags: #Bharatvarsh #MahaBharatvarsh #AlternateHistory #IndianSciFi — use 2-3 max
- Character limit: 280 per tweet

**For Instagram:**
- Caption (150-300 words) with visual direction
- Visual direction note: describe the ideal image referencing BHARATVARSH_VISUAL_GUIDE.md
- Hashtags: 15-20 relevant tags in a separate block
- CTA in caption: "Link in bio" or "Comment your theory"

**For LinkedIn:**
- Professional angle — the craft, the technology, the creative process
- 150-250 words, first line is the hook
- No hashtag spam — 3-5 relevant tags max
- Author voice: thoughtful, ambitious, builder-storyteller

### Step 4: Validate Lore Accuracy (NEW in v2.0)
Use MCP lore tools to validate every draft:
1. **`check_lore_consistency`** — Pass the full draft text. Fix any flagged issues.
2. **`get_character`** — If featuring a character, verify visual details and voice.
3. **`search_lore`** — If referencing any entity, verify it exists and details match.

Also cross-check against KB files:
- Character names spelled correctly (Kahaan, Rudra, Pratap, Hana, Arshi)
- Faction names correct (Bharatsena, Akakpen, Tribhuj)
- World mechanics accurate (The Mesh, Bracecomm, Oxy Poles, Directorate)
- Timeline events consistent (1717 refusal, 1978 emergency, 20-10 event)
- Classified/Declassified status respected — don't reveal classified information

### Step 5: Deliver with Visual Direction
For every piece of content, include:
- The text (ready to copy-paste)
- Platform label
- Visual direction (specific enough to generate — reference VISUAL_GUIDE.md character keys and color palettes)
- Context B brand tokens: obsidian background, mustard gold (#F1C232) accent, Bebas Neue display font
- Posting recommendation (best time/day if relevant)

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
- Revealing content marked as Classified in the lore database

---

## Quality Rules

- Every post must be lore-accurate. Use `check_lore_consistency` MCP tool on every draft.
- Content should work standalone — someone seeing it for the first time should be intrigued without context.
- Purchase CTAs should be subtle except in dedicated CTA posts.
- Visual direction must reference specific character visual keys from BHARATVARSH_VISUAL_GUIDE.md.
- Vary content types across the week. Don't post 5 lore reveals in a row.

---

## Tools & Connectors Used

**MCP Tools (bharatvarsh module):**
- `check_lore_consistency` — validate every draft
- `get_character` — character profile verification
- `search_lore` — entity verification
- `query_lore` — browse for content ideas
- `get_timeline` — timeline-based content

**Knowledge Base Files:**
- `BHARATVARSH_BIBLE.md` — lore accuracy (required)
- `BHARATVARSH_CHARACTERS.md` — character accuracy (required)
- `BHARATVARSH_VISUAL_GUIDE.md` — visual direction (required)
- `BHARATVARSH_PLATFORM.md` — website/marketing context (required)
- `CONTENT_CALENDAR.md` — avoid duplicates (when available)
- `MARKETING_PLAYBOOK.md` — brand voice (when available)
- `BRAND_IDENTITY.md` — Context B design tokens (when available)
