---
name: bharatvarsh-content
description: "Lore-grounded Bharatvarsh marketing content per platform with visual direction. Use when user asks for novel marketing, lore reveal, character teaser, or Bharatvarsh social content."
---

# Skill: Bharatvarsh Content

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks to create marketing content, social media posts, promotional material, lore teasers, character reveals, or any public-facing content related to the Bharatvarsh novel and transmedia universe. Trigger phrases include: "Bharatvarsh post," "novel marketing," "lore reveal," "character teaser," "promote the book," "Bharatvarsh social," or any content creation request tied to the novel, website, or universe.

Do NOT use for novel writing (chapter drafting, plot development, dialogue) — that's creative world-building work, not marketing content. This skill is for promotional and engagement content.

---

## Process

### Step 1: Load Context
Always load both:
- **BHARATVARSH_BIBLE.md** — lore, characters, factions, tech, themes. All content must be lore-accurate.
- **BHARATVARSH_PLATFORM.md** — website features, purchase links, lead magnet funnel, current marketing status.

If CONTENT_CALENDAR.md exists in KB, check it to avoid duplicating recently published content and to identify gaps.
If MARKETING_PLAYBOOK.md exists in KB, load for brand voice and platform strategy.

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

### Step 3: Generate Platform-Specific Content

**For Twitter/X:**
- Thread format (3-5 tweets) or single tweet
- Hook in first tweet — no slow build-up
- End with CTA (link to book, website, or specific page)
- Hashtags: #Bharatvarsh #MahaBharatvarsh #AlternateHistory #IndianSciFi — use 2-3 max
- Character limit: 280 per tweet

**For Instagram:**
- Caption (150-300 words) with visual direction
- Visual direction note: describe the ideal image — style, mood, composition, text overlay
- Hashtags: 15-20 relevant tags in a separate block
- CTA in caption: "Link in bio" or "Comment your theory"

**For LinkedIn:**
- Professional angle — the craft, the technology, the creative process
- 150-250 words, first line is the hook
- No hashtag spam — 3-5 relevant tags max
- Author voice: thoughtful, ambitious, builder-storyteller

### Step 4: Ensure Lore Accuracy
Cross-check every piece of content against the Bible:
- Character names spelled correctly (Kahaan, Rudra, Pratap, Hana, Arshi)
- Faction names correct (Bharatsena, Akakpen, Tribhuj)
- World mechanics accurate (The Mesh, Bracecomm, Oxy Poles, Directorate)
- Timeline events consistent (1717 refusal, 1980s collapse, 20-10 event)
- Classified/Declassified status respected — don't reveal classified information in public content

### Step 5: Deliver with Visual Direction
For every piece of content, include:
- The text (ready to copy-paste)
- Platform label
- Visual direction (what the accompanying image should look like)
- Posting recommendation (best time/day if relevant)
- Suggest whether to use Canva connector to create the graphic

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

---

## Quality Rules

- Every post must be lore-accurate. One factual error breaks trust with engaged readers.
- Content should work standalone — someone seeing it for the first time should be intrigued without context.
- Purchase CTAs should be subtle except in dedicated CTA posts. Don't turn every post into a sales pitch.
- Visual direction must be specific enough to generate or commission the image. "Cool sci-fi image" is useless. "Dark cityscape with glowing Oxy Poles, Mesh surveillance grid visible as faint blue lines in the sky, Bharatsena patrol in foreground" is actionable.
- Vary content types across the week. Don't post 5 lore reveals in a row.

---

## Connectors Used

- **Knowledge base: BHARATVARSH_BIBLE.md** — lore accuracy (required)
- **Knowledge base: BHARATVARSH_PLATFORM.md** — website/marketing context (required)
- **Knowledge base: CONTENT_CALENDAR.md** — avoid duplicates, fill gaps (when available)
- **Knowledge base: MARKETING_PLAYBOOK.md** — brand voice and strategy (when available)
- **Canva connector** — offer to create graphics (when available)
