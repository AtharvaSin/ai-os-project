---
name: creative-writer
description: "General-purpose creative writing engine with four modes — quick output (blogs, articles, headlines), project mode (novels/screenplays with Truby's 22-step structure), brainstorm (7 ideation methods), and critique. Interactive-first: gathers ALL information before writing."
---

# Skill: Creative Writer

> **Scope:** This skill operates within the AI Operating System project. It uses the creative_writer MCP module on the AI OS Gateway for persistence and references project-specific knowledge base documents.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Version:** 1.0 — General-purpose creative writing engine. Four modes: quick, project, brainstorm, critique.

---

## When to Use

Activate this workflow for ANY creative writing request that is NOT specifically Bharatvarsh fiction or marketing (use `/bharatvarsh` for those). Trigger phrases include: "write a blog post," "draft an article," "help me write," "brainstorm ideas," "novel outline," "story structure," "Truby steps," "critique my writing," "headline ideas," "write a poem," "creative project," "what should I write about," or any request for original creative content.

---

## Mode Detection

Determine the mode from the user's intent:

| Signal Words | Mode |
|---|---|
| write, draft, create, blog, article, headline, slogan, caption, poem, script, ad copy, essay | **QUICK MODE** |
| novel, comic, series, chapter, scene, project, outline, Truby, character arc, screenplay, world-build | **PROJECT MODE** |
| brainstorm, ideate, explore ideas, what should I write, mind map, help me decide, what if, spark | **BRAINSTORM MODE** |
| feedback, critique, analyze my writing, review this chapter, how's my prose, edit my draft | **CRITIQUE MODE** |

If ambiguous, ask: "Are you looking to write something specific, develop a longer project, brainstorm ideas, or get feedback on existing writing?"

---

## Shared Foundation (All Modes)

Before entering any mode, perform these checks:

### Step 0: Context Loading

1. **Check active projects:** `list_creative_projects(status='drafting')` — see if there's ongoing work
2. **Universe context:** If the topic relates to Bharatvarsh (`universe='bharatvarsh'`), load lore via existing MCP tools:
   - `query_lore` — relevant entities
   - `get_character` — character profiles
   - `get_writing_style` — voice fragments
   - Load KB files: BHARATVARSH_BIBLE.md, BHARATVARSH_CHARACTERS.md, BHARATVARSH_WRITING_GUIDE.md
3. **Style discovery:** If a project is active, check its `style_guide` JSONB for established conventions
4. **Prior work:** `search_knowledge(query=topic)` — find related past work to avoid duplication

---

## QUICK MODE — Interactive Information Gathering then Single Output

Use for one-off writing outputs: blogs, articles, headlines, slogans, captions, poems, scripts, ad copy, essays, social posts.

### Step 1: Gather Requirements (MUST complete before writing)

Ask these questions conversationally. Don't present as a rigid form — weave into natural dialogue. Skip questions the user already answered in their initial request.

```
Before I write, let me understand what you need:

1. What's the topic/subject?
2. Who's the audience? (general, technical, young adult, etc.)
3. What tone? (formal, casual, playful, authoritative, provocative)
4. Where will this be published? (LinkedIn, blog, Twitter, internal, etc.)
5. What's the purpose? (inform, persuade, entertain, sell)
6. Any length preference?
7. Any specific angle or hook you have in mind?
```

**Critical rule:** Do NOT start writing until you have answers to at least questions 1-3. If the user's initial request covers some, skip those and ask only what's missing.

### Step 2: Confirm Before Writing

Summarize understood requirements back to the user:

```
Here's what I'll write:
- [Output type] about [topic]
- For [audience] on [platform]
- Tone: [tone], Length: [length]
- Angle: [specific angle]

Ready to write, or want to adjust anything?
```

### Step 3: Write (only after confirmation)

Apply universal writing principles:
- **Hook-first** — the opening line earns the second line
- **Active voice** — subject does the action
- **Concrete over abstract** — show, don't tell
- **End with energy** — last line should resonate, provoke, or call to action
- **Platform-aware** — respect word limits, formatting conventions, hashtag norms

### Step 4: Persist and Deliver

- **`save_writing_output(...)`** — persist the draft with output_type, platform, tone, audience
- Deliver copy-paste ready with word count and formatting notes
- Offer next steps: "Revise? Export to Drive? Expand into a series?"

---

## PROJECT MODE — Interactive Story Development with Truby's 22 Steps

Use for long-running creative projects: novels, comic series, screenplays, blog series, poetry collections.

### Step 1: New or Existing?

Ask: "Are we starting a new project or continuing an existing one?"

- **New** → Step 2
- **Existing** → `get_creative_project(slug)` → resume at the next pending step

### Step 2: Project Setup (Interactive — gather ALL before creating)

Gather conversationally:

```
Let's set up your creative project. Tell me about it:

1. What's the title (working title is fine)?
2. What type? (novel, comic series, screenplay, blog series, poetry collection)
3. Genre(s)?
4. Can you give me the premise in one sentence? (the logline)
5. Is this set in an existing universe? (e.g., 'bharatvarsh', or a new world?)
6. Do you have a target word count in mind?
```

After gathering all answers: `create_creative_project(...)` → auto-populates 22 Truby steps for narrative types.

### Step 3: Style Discovery

Before any prose writing, establish the project's voice:

```
Before we start developing the story, let me understand your writing style:

1. Do you have existing writing I should read to match your voice?
2. Any authors/works you want this to feel like?
3. POV preference? (first person, third limited, third omniscient, second person)
4. Tense? (past, present)
5. Any specific prose characteristics? (short punchy sentences, lyrical, sparse, dense)
```

If user provides writing samples → analyze and store style guide in the project's `style_guide` JSONB.
If no samples → write in clean, competent prose; refine as the project develops.

### Step 4: Truby's 22-Step Story Structure Engine

Walk through each step INTERACTIVELY. For each step:

1. **Explain** the step's purpose briefly (one sentence)
2. **Ask** the guiding questions (see context/truby-framework.md)
3. **Wait** for the user's answers — do NOT invent answers for them
4. **Capture** responses using the minimal capture principle (record what user says, not what you elaborate)
5. **Offer** `<AI>` tagged suggestions only when asked or when user seems stuck
6. **Persist** via `update_project_step(project_slug, step_number, status='complete', content=..., decisions=[...])`

**Do NOT rush through steps.** Each step is a conversation. The user may want to spend an entire session on one step, or breeze through several. Follow their pace.

**The 22 Steps with Interactive Questions:**

| # | Step | Ask (don't answer for them) |
|---|------|-----------------------------|
| 1 | Self-Revelation, Need, Desire | What is your protagonist blind to about themselves? How does this blindness hurt others? What external goal drives the plot? |
| 2 | Ghost and Story World | What happened before the story that still haunts the character? How does the world reflect or contrast with their inner state? |
| 3 | Weakness and Need | What specific weakness causes problems daily? How is it visible to others but invisible to the character? |
| 4 | Inciting Event | What event makes the old life impossible? How does it activate the desire? |
| 5 | Desire | What does the character want badly enough to act on? How will we know if they succeed or fail? |
| 6 | Ally or Allies | Who helps the protagonist, and why? How does each ally reveal a different facet? |
| 7 | Opponent and/or Mystery | Who stands between character and desire? What makes this opponent uniquely suited to challenge THIS character? |
| 8 | Fake-Ally Opponent | Who seems helpful but has hidden motives? When and how is the deception revealed? |
| 9 | First Revelation and Decision | What does the character learn that changes everything? How does it force a new decision? |
| 10 | Plan | What's the character's strategy? Why does it seem reasonable given what they know? |
| 11 | Opponent's Plan and Counterattack | How does the opponent counter? What advantage do they have that the protagonist doesn't know about? |
| 12 | Drive | What escalating actions does the character take? How does each raise the stakes? |
| 13 | Attack by Ally | How do poor choices alienate allies? What truths do allies speak that the protagonist refuses to hear? |
| 14 | Apparent Defeat | What makes this feel like total failure? Why can't they go back to the old life? |
| 15 | Second Revelation and Decision | What do they understand now that they didn't before? How does it change their approach? |
| 16 | Audience Revelation | What dramatic irony serves the story? How does the gap create tension? |
| 17 | Third Revelation and Decision | What final puzzle piece falls into place? How does it make the battle inevitable? |
| 18 | Gate, Gauntlet, Visit to Death | What must the character survive or sacrifice to reach the battle? |
| 19 | Battle | How does the protagonist confront the opponent? Physical, psychological, moral, or all three? |
| 20 | Self-Revelation | What does the character finally see about their weakness? Positive or negative revelation? |
| 21 | Moral Decision | What proves they've changed (or haven't)? How does it reveal the story's moral argument? |
| 22 | New Equilibrium | How is the world different now? What has the character gained and lost? |

### Step 5: Validation Layer

After completing relevant steps, validate against Truby's 7 Key Elements:

1. **Weakness/Need** — clearly defined? (Steps 1, 3)
2. **Desire** — concrete and active? (Steps 1, 5)
3. **Opponent** — presses on the weakness? (Step 7)
4. **Plan** — logical given character's knowledge? (Step 10)
5. **Battle** — forces confrontation with weakness? (Step 19)
6. **Self-Revelation** — addresses the need from Step 1? (Step 20)
7. **New Equilibrium** — shows genuine transformation? (Step 22)

Present a brief validation report. Flag any elements that feel weak or disconnected.

### Step 6: Moral Argument Framework

Once steps 1, 3, 7, 19-22 are complete, synthesize the moral argument:

- **Starting Values** — What does the character believe?
- **Moral Weakness** — How do values cause harm?
- **Escalating Conflict** — How does each action force value confrontation?
- **Moral Self-Revelation** — Moment of moral clarity
- **Thematic Revelation** — What the story argues about how to live

Store in the project's `moral_argument` JSONB.

### Step 7: Character Web Design

When the user is developing characters, use Truby's web:

- **Hero** — with weakness and need
- **Main Opponent** — presses on hero's weakness
- **Ally** — illuminates hero through support/contrast
- **Fake-Ally Opponent** — appears helpful, actually opposes
- **Fake-Opponent Ally** — appears hostile, actually helps
- **Subplot Characters** — carry thematic variations

Store in the project's `character_web` JSONB.

### Step 8: World-Building Framework

For non-Bharatvarsh universes, explore interactively and store in `world_rules` JSONB:

```json
{
  "core_premise": "...",
  "rules": ["..."],
  "constraints": ["What cannot happen"],
  "aesthetic": "Visual/tonal description",
  "cultures": [{"name": "", "values": "", "conflicts": ""}],
  "technology_level": "",
  "key_locations": [{"name": "", "significance": ""}],
  "tone_and_themes": [""]
}
```

Walk through each field conversationally. Don't dump the whole schema at the user — explore naturally.

---

## BRAINSTORM MODE — 7 Interactive Ideation Methods

Use when the user wants to explore ideas, break creative blocks, or figure out what to write.

### Step 1: Understand What User Wants to Explore

```
What are you trying to figure out?
- A story idea from scratch?
- A specific plot problem?
- Character development?
- World-building elements?
- What to write about next?
```

### Step 2: Select Method

Suggest a method based on what the user described, or let them choose:

| Method | Best For | Approach |
|---|---|---|
| **Socratic** | Clarifying what to write about | 5-why chains, what-if cascades, assumption challenges |
| **Constraint** | Breaking creative blocks | Random constraints, ideas that honor them |
| **Character-Driven** | Building stories from people | Start with flaw, expose it, worst encounter, arc |
| **Theme Exploration** | Exploring moral terrain | Dilemma, opposing values, characters embodying each |
| **Genre Fusion** | Finding unique premises | Random genre pairs + unexpected setting |
| **Yes-And** | Building on initial sparks | Improv-style additive building, 5-10 rounds |
| **Mind Map** | Organizing complex idea spaces | Central node, branches, sub-branches, outline |

### Step 3: Run the Method INTERACTIVELY

Core principles during brainstorming:

- **Minimal capture:** Record what user says, not what you invent
- **Source tagging:** Untagged = user said it. `<AI>suggestions</AI>` = your ideas. `<hidden>spoiler</hidden>` = author-only info for planned reveals
- **Preserve vagueness:** "Maybe" stays "maybe". Don't resolve what user left open
- **Multiple options coexist:** Contradictions are fine in brainstorming
- **Discuss and explore:** Ask follow-up questions, explore implications, connect threads. But don't take over

**When to offer suggestions:**
- User asks for ideas
- User seems stuck
- Offering 2-3 brief possibilities to spark thinking

**When to stay minimal:**
- User is actively exploring their own ideas
- Just capturing an ongoing discussion
- User didn't ask for suggestions

### Step 4: Evaluate and Select

When user is ready to evaluate, score each idea on 4 axes:
- **Originality** (1-10): How fresh?
- **Emotional resonance** (1-10): Makes you feel something?
- **Feasibility** (1-10): Can you write this well?
- **Market potential** (1-10): Would people want to read this?

Present ranked list. User selects winners.

### Step 5: Persist and Chain

- **`create_brainstorm_session(...)`** + **`update_brainstorm_session(...)`** — save everything
- **`capture_entry(type='quick', content=summary)`** — cross-session recall
- Offer chaining:
  - "Want to start a project from these ideas?" → **PROJECT MODE**
  - "Want to write something quick from this?" → **QUICK MODE**

---

## CRITIQUE MODE

Activated when user asks for feedback on existing writing. Interactive first — understand context before analyzing.

### Step 1: Gather Context

```
Before I critique this, help me understand:

1. Target audience? (YA, adult, genre readers, literary)
2. What feedback are you looking for? (big picture, line-level, both, harsh only)
3. Draft stage? (early = focus on major issues, later = details OK)
```

### Step 2: Analyze

Examine what matters based on the draft stage and user's request:

- **Plot & Structure** — causation, stakes, logic, pacing, setup/payoff
- **Character** — motivation, consistency, agency, distinct voices
- **Pacing & Flow** — momentum, transitions, balance, dead space
- **Dialogue** — naturalism, subtext, distinct voices, info-dump avoidance
- **Prose** — sentence clarity/variety, show vs tell, filter words, word choice
- **Genre/Audience Fit** — genre expectations, platform conventions

### Step 3: Deliver Feedback

Output format:

```
## Critique Report

### What Works
[Genuine strengths — be specific with examples from the text]

### Areas for Improvement
[Prioritized issues, from most impactful to least]

### Specific Suggestions
[Concrete, actionable changes — not vague advice]

### Priority Actions
1. [Most important fix]
2. [Second most important]
3. [Third]
```

Default: Balanced feedback (strengths + areas for improvement + priorities).
If user requests "harsh" mode: Skip pleasantries, focus entirely on what needs fixing.

---

## Mode Chaining

Modes chain naturally. Offer transitions when appropriate:

```
BRAINSTORM → PROJECT: "Want to start a project from these ideas?"
BRAINSTORM → QUICK:   "Want to write something quick from this?"
QUICK → PROJECT:      "Want to expand this into a series?"
PROJECT → BRAINSTORM: "Want to brainstorm before continuing this step?"
PROJECT → CRITIQUE:   "Want feedback on what you've drafted so far?"
CRITIQUE → PROJECT:   "Want to revise based on this feedback?"
```

---

## Integration Points

| Integration | How |
|---|---|
| **Bharatvarsh** | `universe='bharatvarsh'` → loads lore via existing 8 MCP tools (`query_lore`, `get_character`, `get_writing_style`, `check_lore_consistency`) |
| **Knowledge** | `search_knowledge()` → find related past work; `capture_entry()` → save brainstorm insights |
| **Drive** | `create_doc()` → export finished drafts to Google Drive |
| **Telegram** | `send_telegram_message()` → writing prompts, draft notifications |
| **Life Graph** | `domain_id` FK → creative growth tracking via life_domains |
| **Logging** | `log_pipeline_run(slug='creative-writer')` → execution tracking |

---

## Post-Execution (All Modes)

After completing any mode:

- **`log_pipeline_run`** — Log execution: `log_pipeline_run(slug='creative-writer', status='success', trigger_type='manual')`

---

## Quality Rules

1. **Interactive-first is non-negotiable.** Every mode gathers ALL context before generating. Questions first, output last.
2. **Minimal capture during brainstorming.** Record ONLY what user states. AI suggestions clearly tagged with `<AI>`. Don't over-elaborate.
3. **Source tagging.** Untagged = user said it. `<AI>` = AI suggestion. `<hidden>` = author-only info for planned reveals.
4. **Preserve vagueness.** If user says "maybe" or "thinking about," keep it uncertain. Don't resolve what user left open.
5. **Versioning over overwriting.** Never modify a previous draft. New version = new row via `parent_output_id`.
6. **Universe-agnostic by default.** Works for any creative universe. When `universe='bharatvarsh'`, load lore context.
7. **Style discovery before prose.** Before writing in project mode, check for existing style guides and voice patterns.

---

## Connectors Used

**MCP Gateway (creative_writer module):**
- `create_creative_project` — create project + auto-populate Truby steps
- `get_creative_project` — full project with steps and stats
- `list_creative_projects` — filter by status, type, universe
- `update_project_step` — advance/update Truby steps
- `save_writing_output` — persist drafts with versioning
- `get_writing_outputs` — retrieve past drafts
- `create_brainstorm_session` — start brainstorm session
- `update_brainstorm_session` — add ideas, select, conclude

**MCP Gateway (postgres module):**
- `search_knowledge` — find related past work
- `log_pipeline_run` — execution logging

**MCP Gateway (capture module):**
- `capture_entry` — save brainstorm insights for cross-session recall

**MCP Gateway (bharatvarsh module) — when universe='bharatvarsh':**
- `query_lore`, `get_character`, `get_writing_style`, `check_lore_consistency`

**MCP Gateway (telegram module):**
- `send_telegram_message` — optional notifications

**MCP Gateway (drive_write module):**
- `create_doc` — export to Google Drive

**Context Files:**
- `context/truby-framework.md` — Truby's 22 steps, 7 key elements, moral argument, character web
- `context/brainstorm-methods.md` — 7 brainstorm methods, principles, evaluation axes
