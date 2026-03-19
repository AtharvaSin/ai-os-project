# Skill: Bharatvarsh (Unified)

> **Scope:** Unified skill for all Bharatvarsh creative and marketing work — social content, fiction writing, and lore consistency checking. Replaces the separate `bharatvarsh-content` and `bharatvarsh-writer` skills with a single, mode-switched orchestrator that always grounds output in the canonical lore database.
>
> **Type:** Creative + Marketing workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary). Claude Code counterpart at `.claude/skills/bharatvarsh-content/`.
>
> **Version:** 3.0 — Merged skill with three modes. Wires 7 previously uncovered MCP lore tools.
>
> **Replaces:** `SKILL_BHARATVARSH_CONTENT.md` (v2.0), `SKILL_BHARATVARSH_WRITER.md` (v1.0), `SKILL_LORE_CHECK.md`

---

## When to Use

Activate this workflow for ANY interaction involving the Bharatvarsh universe — whether marketing, creative writing, or lore validation.

**Trigger phrases:** "bharatvarsh", "lore", "write bharatvarsh", "bharatvarsh content", "bharatvarsh post", "bharatvarsh story", "write a chapter", "character teaser", "lore reveal", "lore check", "is this lore-accurate", "write a scene", "bharatvarsh campaign", any reference to the Bharatvarsh universe, characters, factions, or worldbuilding.

---

## Mode Detection

Detect the mode from the user's request. If ambiguous, ask: "Content mode (marketing), Writer mode (fiction), or Lore Check?"

| Keywords | Mode |
|----------|------|
| "post", "campaign", "social", "marketing", "caption", "teaser", "promote", "LinkedIn", "Instagram", "Twitter" | **CONTENT** |
| "story", "chapter", "fiction", "narrative", "write about", "scene", "dialogue", "vignette", "comic script" | **WRITER** |
| "check", "verify", "consistent", "lore check", "validate", "is this accurate" | **LORE CHECK** |

---

## Shared Foundation (All Modes — MANDATORY)

Before generating ANY output, load this context:

### Tool Calls

1. **`query_lore`** → Relevant lore context for the topic/characters/faction (AIOSMCP)
2. **`get_character`** → Full character profile if ANY character is referenced (AIOSMCP)
   - Pull: identity, psychology, visual_keys, voice patterns, arc
3. **`get_writing_style`** → Voice and tone parameters (AIOSMCP)
   - For content mode: `fragment_type='marketing'` if available, else `'description'`
   - For writer mode: match fragment_type to scene type (dialogue, action, description, internal_monologue)

### Knowledge Base Files

| File | Purpose | Required |
|------|---------|----------|
| `BHARATVARSH_BIBLE.md` | World mechanics, politics, society, themes | Always |
| `BHARATVARSH_CHARACTERS.md` | Character profiles, psychology, arc, voice | Always |
| `BHARATVARSH_WRITING_GUIDE.md` | Narrative voice, dialogue conventions, terminology | Writer mode |
| `BHARATVARSH_VISUAL_GUIDE.md` | Visual descriptions, weapons, uniforms, palettes | Content + Writer |
| `BHARATVARSH_LOCATIONS.md` | Setting details, atmosphere, architecture | Writer mode (scenes) |
| `BHARATVARSH_TIMELINE.md` | Chronological accuracy | When referencing events |
| `BHARATVARSH_PLATFORM.md` | Website features, purchase links, lead magnet | Content mode |
| `MARKETING_PLAYBOOK.md` | Brand voice, audience segments, platform strategies | Content mode |
| `CONTENT_CALENDAR.md` | Avoid duplicates, identify gaps | Content mode |
| `BRAND_IDENTITY.md` | Context B design tokens (mustard, Bebas Neue, obsidian) | Content mode visuals |

---

## CONTENT MODE (Marketing / Social)

### Additional Tool Calls

4. **`query_db`** → Check `campaign_posts` table for recent posts (AIOSMCP)
   ```sql
   SELECT platform, topic, angle, created_at FROM campaign_posts
   ORDER BY created_at DESC LIMIT 10
   ```
   - Avoid topic/angle repetition with the last 10 posts

5. **Generate content** following brand playbook + lore constraints

6. **`check_lore_consistency`** → Validate the draft against lore DB (AIOSMCP)
   - Fix any flagged issues before presenting to user

7. **`insert_record`** → Save to `campaign_posts` table (AIOSMCP)
   - Params: table, platform, topic, angle, content, status: 'draft'

8. **`send_telegram_message`** → Push draft for mobile review (AIOSMCP)
   - Optional — offer: "Push to Telegram for mobile review?"

### Content Types

| Type | Best Platform | Key Constraint |
|------|---------------|----------------|
| Lore Reveal | Twitter/X, Instagram | Don't reveal Classified lore |
| Character Teaser | Instagram, Twitter/X | Must match character visual_keys exactly |
| World Contrast | LinkedIn, Twitter/X | Real-world parallel must be thought-provoking |
| Quote Card | Instagram | Must be an actual line from the book or canon |
| Behind-the-Scenes | LinkedIn, Twitter/X | Author voice — thoughtful, ambitious |
| Character Dossier | Instagram carousel | Intelligence file format, faction-accurate |
| Tech Spotlight | Twitter/X, Instagram | Grounded physics — no magic |
| Purchase CTA | All platforms | Subtle except dedicated CTA posts |
| Website Feature | Twitter/X, LinkedIn | Highlight Bhoomi AI, lore archive, timeline |

### Platform Rules

- **Twitter/X:** 280 chars per tweet. Thread = 3-5 tweets. Hook first. 2-3 hashtags max. End with CTA.
- **Instagram:** 150-300 word caption. Visual direction note referencing VISUAL_GUIDE. 15-20 hashtags in separate block.
- **LinkedIn:** Professional angle. 150-250 words. First line is hook. 3-5 tags. Author voice.

### Content Voice

- Atmospheric and immersive — pull people into the world
- Provocative questions — "What would you sacrifice for the truth?"
- Intelligence dossier tone for lore reveals
- Never spoil — tease, don't tell. Create questions, not answers.
- Never use: "thrilling page-turner", "must-read", generic book marketing language

---

## WRITER MODE (Fiction / Narrative)

### Writing Modes

| Mode | When | Voice |
|------|------|-------|
| Novel Prose | Chapter drafts, scene extensions | Third-person limited, rotating POV. Precise, atmospheric. |
| Comic Script | Graphic novel panels | Panel descriptions + dialogue. Visual-first. |
| Vignette | Standalone character moments | Intimate, single-emotion. Can be first-person. |
| In-Universe Document | Intel reports, military orders, Mesh logs | Formal, institutional, classified framing. |
| Dialogue Workshop | Testing character voices | Pure dialogue, minimal stage direction. |

### Narrative Voice (from WRITING_GUIDE)

- **Action:** Short, declarative. Staccato rhythm. Verbs carry weight. No adverbs.
- **Introspection:** Longer, nested sentences. Metaphor-heavy.
- **World-building:** Medium sentences. Precise imagery. Show, don't explain.
- **Dialogue:** Character-specific voice (see Character Voice Rules below).

### Character Voice Rules

- **Kahaan:** Formal military speech, occasional vulnerability. Strategic framing.
- **Rudra:** Sparse, philosophical, proverb-like. Calm authority. Silence between statements.
- **Surya:** Terse. Hyderabad Telugu inflections. Minimal words, maximum meaning.
- **Pratap:** Authoritarian, paternal. Speaks in doctrine and certainty.
- **Hana:** Direct, morally clear. Challenges without hostility. Practical.

### Writing Rules

1. Ground technology in physicality — neural fatigue, tinnitus, transient paralysis
2. Thread at least one core theme per scene (safety vs. freedom, power vs. service, man vs. machine)
3. Sensory specificity — not "a weapon" but "twin Mag-Holster pistols hovering at palm-height"
4. Questions over answers — provoke, don't explain
5. Use ONLY canonical terminology from the Writing Guide lexicon

### Post-Writing Validation

4. **`check_lore_consistency`** → Validate every proper noun, timeline ref, power system detail (AIOSMCP)
5. **IF inconsistencies found** → Flag them and offer corrections before finalizing
6. **`insert_record`** → Save to `knowledge_entries` as `type: 'narrative-draft'` (AIOSMCP)

### Writer Output Format

```
## [Scene/Chapter Title]

**Setting:** [Location, time period]
**POV:** [Character name]
**Characters Present:** [List]
**Themes:** [Core themes explored]

---

[The prose]

---

### Writer's Notes
- [Assumptions made]
- [Connections to broader plot]
- [Suggested follow-up scenes]
- [Lore validation: PASS / {issues found}]
```

---

## LORE CHECK MODE

### Tool Calls

4. **`check_lore_consistency`** → Run provided text against full lore DB (AIOSMCP)
5. **`search_lore`** → Cross-reference any flagged entities (AIOSMCP)
6. **`get_entity`** → Pull canonical details for comparison (AIOSMCP)

### Output Format

```
## Lore Consistency Report

**Text analyzed:** {first 100 chars}...
**Entities found:** {count}
**Status:** {CONSISTENT / {N} ISSUES FOUND}

### Issues
| # | Text Says | Canon Says | Entity | Severity |
|---|-----------|------------|--------|----------|
| 1 | {quoted text} | {correct version} | {entity name} | Critical/Warning |

### Verified ✓
{List of entities that checked out correctly}

### Recommendations
{Suggested corrections for each issue}
```

---

## Post-Execution (All Modes)

**`log_pipeline_run`** → Track execution (AIOSMCP)
- Params: `slug: 'bharatvarsh-{mode}'`, `status: 'success'`, `metadata: {mode, characters_referenced, lore_check_result}`

---

## Quality Rules

- **Lore accuracy is non-negotiable.** Every draft runs through `check_lore_consistency` before delivery. Zero tolerance for canon errors.
- **Never reveal Classified lore** in marketing content. Check classification status via `search_lore`.
- **Brand consistency.** All visual direction follows Context B from BRAND_IDENTITY.md (mustard, obsidian, Bebas Neue).
- **No generic sci-fi.** No "laser beams", "force fields", "warp drives". This is grounded speculative fiction.
- **Dedup content.** Content mode checks `campaign_posts` to avoid repeating topics/angles.
- **Voice fidelity.** Characters must sound like themselves — always reference `get_writing_style` fragments.

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `query_lore` | Bharatvarsh (AIOSMCP) | All modes — lore context loading |
| `get_character` | Bharatvarsh (AIOSMCP) | All modes — character profiles |
| `get_writing_style` | Bharatvarsh (AIOSMCP) | All modes — voice calibration |
| `check_lore_consistency` | Bharatvarsh (AIOSMCP) | All modes — validation |
| `search_lore` | Bharatvarsh (AIOSMCP) | Lore check, content research |
| `get_entity` | Bharatvarsh (AIOSMCP) | Lore check — canonical details |
| `get_timeline` | Bharatvarsh (AIOSMCP) | When referencing historical events |
| `query_db` | PostgreSQL (AIOSMCP) | Content mode — dedup check |
| `insert_record` | PostgreSQL (AIOSMCP) | Content + Writer — persist output |
| `send_telegram_message` | Telegram (AIOSMCP) | Content mode — mobile review push |
| `log_pipeline_run` | PostgreSQL (AIOSMCP) | All modes — execution logging |

---

## Connectors Used

- **AIOSMCP** — Bharatvarsh module (7 tools), PostgreSQL module (3 tools), Telegram module (1 tool)
- **Knowledge Base** — 10 Bharatvarsh-related KB files (see Shared Foundation section)

---

## Purchase Links

- **Amazon India:** Search "MahaBharatvarsh Atharva Singh"
- **Flipkart:** Search "MahaBharatvarsh"
- **Notion Press:** Search "MahaBharatvarsh"
- **Website:** welcometobharatvarsh.com
