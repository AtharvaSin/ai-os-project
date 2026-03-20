---
name: bharatvarsh
description: "Unified Bharatvarsh skill with three modes — content (marketing/social), writer (fiction/narrative), and lore check (validation). Use for ANY Bharatvarsh interaction: social posts, chapters, scenes, lore validation, character teasers."
---

# Skill: Bharatvarsh (Unified)

> **Scope:** This skill operates within the AI Operating System project only. It uses the Bharatvarsh MCP module on the AI OS Gateway and references project-specific knowledge base documents.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Version:** 3.0 — Unified skill replacing the old `bharatvarsh-content` skill. Three modes: content, writer, lore check.

---

## When to Use

Activate this workflow for ANY Bharatvarsh-related request. This is the single entry point for all Bharatvarsh interactions. Trigger phrases include: "Bharatvarsh post," "write a chapter," "lore check," "character teaser," "novel scene," "validate lore," "Bharatvarsh marketing," "fiction draft," "is this lore-accurate," or any request mentioning the Bharatvarsh universe.

For non-Bharatvarsh content (LinkedIn thought leadership, AI&U scripts, professional posts), use `/content-gen` or `/social-post` instead.

---

## Mode Detection

Determine the mode from the user's intent:

| Signal Words | Mode |
|--------------|------|
| post, campaign, social, marketing, caption, teaser, promote, reveal, CTA | **CONTENT MODE** |
| story, chapter, fiction, narrative, scene, dialogue, prose, vignette, script | **WRITER MODE** |
| check, verify, consistent, lore check, validate, canon, accurate | **LORE CHECK MODE** |

If ambiguous, ask the user: "Is this for marketing content, fiction writing, or lore validation?"

---

## Shared Foundation (All Modes)

Before entering any mode, load this shared context:

### Step 0: Load Lore Context

1. **`query_lore`** — Pull relevant lore context based on the topic, character, or entity the user mentions.
2. **`get_character`** — Load full character profiles for any characters referenced in the request.
3. **`get_writing_style`** — Retrieve voice and tone fragments for the Bharatvarsh universe.
4. **Load KB files** (always):
   - **BHARATVARSH_BIBLE.md** — world reference: politics, economy, surveillance, society, themes
   - **BHARATVARSH_CHARACTERS.md** — character profiles: identity, psychology, arc, visual keys, voice
   - **BHARATVARSH_VISUAL_GUIDE.md** — art direction: color palettes, character visual keys, uniforms, weapons
   - **BHARATVARSH_WRITING_GUIDE.md** — prose style, narrative conventions, thematic guidelines

---

## CONTENT MODE (Marketing / Social)

Use when creating marketing content, social media posts, promotional material, lore teasers, character reveals, or any public-facing content related to the Bharatvarsh novel and transmedia universe.

### Step 1: Check for Duplicates

- **`query_db`** — Check `campaign_posts` for recent posts to avoid repetition:
  ```sql
  SELECT platform, topic, angle, content_preview, created_at
  FROM campaign_posts
  WHERE topic ILIKE '%{keyword}%' OR angle ILIKE '%{keyword}%'
  ORDER BY created_at DESC LIMIT 10
  ```
- If a similar post was published in the last 7 days, pivot the angle or suggest an alternative.

### Step 2.5: Load Channel Knowledge

- **`search_knowledge`** — If a target platform is specified or implied, load the channel profile and strategy:
  ```
  search_knowledge(query="{platform} bharatvarsh channel profile", sub_domain="social-channels", limit=2)
  search_knowledge(query="{platform} bharatvarsh channel strategy", sub_domain="social-channels", limit=2)
  ```
- If a Bharatvarsh channel profile exists for the target platform, extract: content pillars, target audience, hashtag strategy, posting guidelines
- If a channel strategy exists, apply: content mix preferences, platform-specific voice guidance, growth-stage-appropriate tactics
- Use channel context to inform Step 3 (platform-specific content) — channel strategy overrides generic platform defaults
- **Fallback:** If no channel exists for the target platform, proceed with default behavior from Step 3. Suggest running `/channel-knowledge` to create one.

### Step 2: Determine Content Type

| Type | Purpose | Best Platform |
|------|---------|---------------|
| Lore Reveal | Surface interesting world details to create intrigue | Twitter/X, Instagram |
| Character Teaser | Spotlight a character with a compelling hook | Instagram, Twitter/X |
| World Contrast | Compare Bharatvarsh reality to our world — provoke thought | LinkedIn, Twitter/X |
| Quote Card | A striking line from the book or universe | Instagram |
| Behind-the-Scenes | Author perspective on writing, world-building, website tech | LinkedIn, Twitter/X |
| Community Prompt | A question or discussion starter | Forum, Twitter/X |
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

### Step 4: Validate Lore Accuracy

- **`check_lore_consistency`** — Pass the full draft text. Fix any flagged issues before proceeding.
- Cross-check character names (Kahaan, Rudra, Pratap, Hana, Arshi, Surya), faction names (Bharatsena, Akakpen, Tribhuj), world mechanics (The Mesh, Bracecomm, Oxy Poles, Directorate), and timeline events (1717 refusal, 1978 emergency, 20-10 event).

### Step 5: Persist and Deliver

- **`insert_record`** — Save to `campaign_posts` with platform, topic, angle, content, and visual direction.
- **`send_telegram_message`** — Optional: push a mobile review notification with the draft summary.
- Deliver with: the post text (copy-paste ready), platform label, visual direction (referencing VISUAL_GUIDE.md and Context B brand tokens), and posting recommendation.

### Content Voice

- **Atmospheric and immersive** — pull people into the world
- **Provocative questions** — "What would you sacrifice for the truth?" "Is peace worth freedom?"
- **Intelligence dossier tone** — for lore reveals, use classified/declassified framing
- **Never spoil** — tease, don't tell. Create questions, not answers.
- No generic book marketing language ("thrilling page-turner," "must-read")

### Brand & Purchase Links

- Brand context: **Context B** — obsidian background, mustard gold (#F1C232) accent, Bebas Neue display font
- Purchase links (use where appropriate):
  - Amazon India: amazon.in/dp/B0DKBV3XGS
  - Flipkart: flipkart.com (search "Bharatvarsh Atharva Singh")
  - Notion Press: notionpress.com/read/bharatvarsh
  - Website: welcometobharatvarsh.com

---

## WRITER MODE (Fiction / Narrative)

Use when drafting novel prose, comic scripts, vignettes, in-universe documents, dialogue workshops, or any fiction content set in the Bharatvarsh universe.

### Step 1: Determine Writing Format

| Format | Description |
|--------|-------------|
| Novel Prose | Full narrative prose — third-person limited, present tense preferred |
| Comic Script | Panel-by-panel descriptions with dialogue, action lines, visual notes |
| Vignette | Short standalone scene (500-1500 words) — atmospheric, self-contained |
| In-Universe Document | Directorate memos, Bharatsena briefings, intelligence dossiers, news bulletins |
| Dialogue Workshop | Character voice exploration — back-and-forth between two or more characters |

### Step 2: Apply Character Voice Rules

Each character has a distinct voice. Never flatten them into a generic narrator:

| Character | Voice Signature |
|-----------|-----------------|
| **Kahaan** | Formal military precision. Clipped sentences. Thinks in tactical terms. Suppresses emotion behind duty. Hindi-English code-switching under stress. |
| **Rudra** | Sparse, philosophical. Long silences between words. Speaks in observations, not commands. Ancient weight behind modern words. |
| **Surya** | Terse, practical. Telugu-inflected rhythm. Says the minimum. Humor is dry and rare. Action over words. |
| **Pratap** | Authoritarian eloquence. Sentences are decrees. Uses "we" when he means "I." Every word is calculated for effect. |
| **Hana** | Direct, morally clear. Short declarative sentences. Asks uncomfortable questions. No diplomatic padding. |

### Step 3: Apply Writing Rules

These rules are non-negotiable for all Bharatvarsh fiction:

1. **Ground technology in physicality.** Don't describe what tech does abstractly — describe what it feels like, sounds like, smells like. The Mesh hums. Bracecomms warm against the wrist. Oxy Poles taste metallic.
2. **Thread themes through action.** Freedom vs. security, truth vs. stability, duty vs. conscience — these emerge from what characters do, not from narration explaining them.
3. **Sensory specificity.** Every scene needs at least two non-visual senses. The heat of Hyderabad. The sterile cold of a Directorate facility. The sound of boots on glass floors.
4. **Questions over answers.** Scenes should leave the reader with more questions than they started with. Ambiguity is a feature.
5. **No generic sci-fi.** This world has specific aesthetics, specific technologies, specific cultural textures. Never fall back on standard sci-fi tropes. If it could appear in any generic future-world, rewrite it.

### Step 4: Validate and Persist

- **`check_lore_consistency`** — Validate the full draft against the lore database. Fix any issues.
- **`insert_record`** — Save to `knowledge_entries` with entry_type='narrative-draft', including title, characters involved, and setting.

### Step 5: Deliver

Output format for all fiction:

```
## Scene Header
- **Setting:** [Location, time of day, weather/atmosphere]
- **POV:** [Character whose perspective we follow]
- **Characters:** [All characters present]
- **Themes:** [Primary thematic threads in this scene]

---

[Prose content]

---

## Writer's Notes
- [Observations about what works, what to revisit]
- [Continuity notes for future scenes]
- [Questions for the author to consider]
```

---

## LORE CHECK MODE (Validation)

Use when the user wants to verify whether a piece of text, draft, or claim is consistent with established Bharatvarsh canon.

### Step 1: Run Consistency Check

- **`check_lore_consistency`** — Pass the full text to be validated. This returns flagged inconsistencies with severity levels.

### Step 2: Cross-Reference Flagged Entities

For each entity or claim flagged by the consistency check:

- **`search_lore`** — Search the lore database for the flagged entity to find canonical references.
- **`get_entity`** — Pull the full canonical record for direct comparison.
- **`get_timeline`** — If dates or events are flagged, verify against the canonical timeline.

### Step 3: Deliver Consistency Report

Output format:

```
## Lore Consistency Report

**Text analyzed:** [First 100 chars of input]...
**Entities checked:** [count]
**Issues found:** [count]

### Issues

| # | Text Says | Canon Says | Entity | Severity |
|---|-----------|------------|--------|----------|
| 1 | [what the draft claims] | [what canon actually states] | [entity name] | Critical / Warning / Minor |
| 2 | ... | ... | ... | ... |

### Verified Entities
The following references were confirmed accurate:
- [Entity 1] — matches canonical record
- [Entity 2] — matches canonical record

### Recommendation
[Summary: safe to publish / needs X fixes before publishing / major rework needed]
```

Severity guide:
- **Critical** — Contradicts established canon (wrong faction, wrong timeline, dead character alive). Must fix.
- **Warning** — Plausible but unverified, or conflicts with soft canon. Should verify.
- **Minor** — Stylistic inconsistency (name spelling, title format). Nice to fix.

---

## Post-Execution (All Modes)

After completing any mode:

- **`log_pipeline_run`** — Log the execution:
  - Content mode: `log_pipeline_run(slug='bharatvarsh-content', status='success')`
  - Writer mode: `log_pipeline_run(slug='bharatvarsh-writer', status='success')`
  - Lore check mode: `log_pipeline_run(slug='bharatvarsh-lore-check', status='success')`

---

## Quality Rules

- **Lore accuracy is non-negotiable.** Every draft must pass `check_lore_consistency` before delivery.
- **Never reveal Classified lore.** Content marked as Classified in the lore database must not appear in any public-facing output (content mode). Writer mode may reference it in drafts marked as internal.
- **No generic sci-fi.** Every piece of content or fiction must feel specifically Bharatvarsh — its culture, its technology, its moral complexity. If it could exist in any future-world, rewrite it.
- **Dedup content mode.** Always check `campaign_posts` before generating marketing content. Repeat angles within 7 days are not allowed.
- **Character voices are sacred.** In writer mode, never let two characters sound the same. Refer to the voice rules above.
- **Sensory grounding.** Fiction must engage at least two non-visual senses per scene.

---

## Connectors Used

**MCP Gateway (bharatvarsh module):**
- `query_lore` — browse lore context for ideas and grounding
- `get_character` — full character profile with visual keys and voice
- `get_writing_style` — voice and tone fragments
- `check_lore_consistency` — validate any text against canon
- `search_lore` — entity search and cross-reference
- `get_entity` — canonical entity details
- `get_timeline` — timeline events and dates

**MCP Gateway (postgres module):**
- `query_db` — check campaign_posts for dedup
- `insert_record` — save to campaign_posts or knowledge_entries

**MCP Gateway (telegram module):**
- `send_telegram_message` — optional mobile review push

**MCP Gateway (core):**
- `log_pipeline_run` — execution logging

**Knowledge Base Files:**
- `BHARATVARSH_BIBLE.md` — world reference (required)
- `BHARATVARSH_CHARACTERS.md` — character profiles (required)
- `BHARATVARSH_VISUAL_GUIDE.md` — art direction (required)
- `BHARATVARSH_WRITING_GUIDE.md` — prose and narrative conventions (required)
- `BHARATVARSH_PLATFORM.md` — website and marketing context (content mode)
- `CONTENT_CALENDAR.md` — avoid duplicates (content mode, when available)
- `MARKETING_PLAYBOOK.md` — brand voice (content mode, when available)
- `BRAND_IDENTITY.md` — Context B design tokens (content mode, when available)
- `SOCIAL_CHANNELS.md` — channel data architecture for `sub_domain='social-channels'` (content mode)
