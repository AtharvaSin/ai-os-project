# Skill: Bharatvarsh Writer

> **Scope:** Writes creative prose in the Bharatvarsh universe — novel chapters, comic scripts, short stories, scene drafts, character vignettes, and in-universe documents. Matches Atharva Singh's narrative voice using the Writing Guide and character voice profiles.
>
> **Type:** Creative workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary). Can also be invoked from Claude Code.
>
> **Dependencies:** Knowledge base files (WRITING_GUIDE, CHARACTERS, BIBLE, LOCATIONS, VISUAL_GUIDE), MCP Gateway lore tools.

---

## When to Use

**Trigger phrases:** "write a chapter," "write a scene," "Bharatvarsh scene," "write dialogue for [character]," "draft a comic script," "write a vignette," "in-universe document," "write as Atharva," "creative prose for Bharatvarsh," "novel writing."

**Do NOT use for:** Marketing content, social media posts, promotional material — use the `bharatvarsh-content` skill instead.

---

## Process

### Step 1: Load Context (MANDATORY)

Always load these knowledge base files before writing:

| File | Purpose | Required |
|------|---------|----------|
| `BHARATVARSH_WRITING_GUIDE.md` | Narrative voice, dialogue conventions, terminology, tone, prose rhythm | Yes — always |
| `BHARATVARSH_CHARACTERS.md` | Character profiles, psychology, arc, voice patterns | Yes — always |
| `BHARATVARSH_BIBLE.md` | World mechanics, politics, society, themes | Yes — always |
| `BHARATVARSH_LOCATIONS.md` | Setting details, atmosphere, architecture | When writing scenes |
| `BHARATVARSH_VISUAL_GUIDE.md` | Visual descriptions, weapons, uniforms, colors | When writing descriptions |
| `BHARATVARSH_TIMELINE.md` | Chronological accuracy | When referencing events |

### Step 2: Query MCP for Specifics

Before writing, pull relevant details from the lore database:

1. **`get_character`** — For every character appearing in the scene. Pull their full profile including visual_keys, voice patterns, and psychology.
2. **`get_entity`** — For any faction, location, or technology featured. Get canonical details.
3. **`get_writing_style`** — Pull writing fragments matching the scene type:
   - `fragment_type='dialogue'` + `character_slug` for character voice calibration
   - `fragment_type='description'` for environment/setting passages
   - `fragment_type='action'` for combat or physical scenes
   - `fragment_type='internal_monologue'` for psychological passages
   - `fragment_type='world_detail'` for exposition
4. **`get_timeline`** — If the scene references historical events, verify dates and details.

### Step 3: Identify Writing Mode

| Mode | When | Voice |
|------|------|-------|
| **Novel Prose** | Chapter drafts, scene extensions, sequel writing | Third-person limited, rotating POV. Precise, atmospheric, tension-laden. |
| **Comic Script** | Graphic novel panels, visual sequences | Panel descriptions with dialogue. Terse, visual-first, action beats. |
| **Vignette** | Standalone character moments, flash fiction | Intimate, focused, single-emotion. Can be first-person. |
| **In-Universe Document** | Intelligence reports, military orders, Mesh logs | Formal, institutional, classified framing. Cold precision. |
| **Dialogue Workshop** | Testing character voices, conversation drafts | Pure dialogue with minimal stage direction. Voice accuracy priority. |

### Step 4: Apply Narrative Voice

Follow the BHARATVARSH_WRITING_GUIDE.md rules exactly:

**Prose Rhythm:**
- **Action:** Short, declarative sentences. Staccato rhythm. Verbs carry the weight. No adverbs.
- **Introspection:** Longer, nested sentences. Metaphor-heavy. Interior monologue markers.
- **World-building:** Medium sentences. Precise imagery. "Show the world, let readers question it."
- **Dialogue:** Character-specific voice. See dialogue conventions in CHARACTERS.md.

**Character Voice Rules:**
- **Kahaan:** Formal military speech with occasional vulnerability. Calculating, ambitious. Uses strategic framing.
- **Rudra:** Sparse, philosophical, proverb-like. Calm authority. Silence between statements.
- **Surya:** Terse. Hyderabad Telugu inflections ("ekkada," "namaste ram"). Minimal words, maximum meaning.
- **Pratap:** Authoritarian, paternal. Speaks in doctrine and certainty.
- **Hana:** Direct, morally clear. Challenges without hostility. Practical.

**Terminology:** Use ONLY canonical terms from the Writing Guide lexicon. No generic sci-fi language.

### Step 5: Write the Content

Write the prose following all loaded context. Key rules:

1. **Ground technology in physicality** — Neural fatigue, tinnitus, transient paralysis. Real consequences, not magic.
2. **Thematic threading** — Every scene should touch at least one core theme (safety vs. freedom, power vs. service, man vs. machine).
3. **Sensory specificity** — Not "a weapon" but "twin Mag-Holster pistols hovering at palm-height, blue light pooling in the gap between metal and skin."
4. **Questions over answers** — The prose should provoke, not explain.
5. **Visual metaphors** — HUD reflections (man-machine boundary), medals (hierarchy), scars (resistance narrative), over-coat (institutional trappings).

### Step 6: Validate Before Delivery

Run the `lore-check` skill process:

1. **`check_lore_consistency`** on the full draft — catch any non-canon terms or errors.
2. Verify character voices match their established patterns.
3. Check timeline consistency.
4. Ensure no Classified information is revealed inappropriately.

### Step 7: Deliver

Structure the output as:

```
## [Scene/Chapter Title]

**Setting:** [Location, time period]
**POV:** [Character name]
**Characters Present:** [List]
**Themes:** [Which core themes this scene explores]

---

[The prose]

---

### Writer's Notes
- [Any assumptions made]
- [Connections to broader plot]
- [Suggested follow-up scenes]
```

---

## Quality Standards

- **Lore accuracy:** Zero tolerance for canon errors. Every name, rank, technology, and event must match the database.
- **Voice consistency:** Characters must sound like themselves. Reference CHARACTERS.md voice sections and writing fragments from MCP.
- **Thematic depth:** Surface-level action without thematic resonance is insufficient. Every scene must carry meaning.
- **Prose quality:** Match the standard set in the Writing Guide sample passages. Precise, atmospheric, intellectually provocative.
- **No generic sci-fi:** No "laser beams," "force fields," "warp drives." This is grounded speculative fiction.

---

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `get_character` | Character profiles for scenes |
| `get_entity` | Location/faction/tech details |
| `get_writing_style` | Voice calibration fragments |
| `get_timeline` | Historical accuracy |
| `check_lore_consistency` | Post-draft validation |
| `search_lore` | Finding related entities |

## Knowledge Base Files Used

- `BHARATVARSH_WRITING_GUIDE.md` — narrative voice and style (required)
- `BHARATVARSH_CHARACTERS.md` — character profiles and voice (required)
- `BHARATVARSH_BIBLE.md` — world mechanics (required)
- `BHARATVARSH_LOCATIONS.md` — setting details (for scenes)
- `BHARATVARSH_VISUAL_GUIDE.md` — visual descriptions (for descriptions)
- `BHARATVARSH_TIMELINE.md` — chronological accuracy (for events)
