---
name: social-post-creator
description: "One-shot social media post creation pipeline. Interactively collects a structured brief (idea, objective, platform, campaign, brand context, art style direction), generates platform-specific post copy, produces a ready-to-use art prompt package when visual content is needed, saves a versioned draft, creates a Google Task for human approval, and optionally publishes. Covers LinkedIn, X/Twitter, Facebook, Instagram. Use whenever the user wants to create, draft, or publish a social post — or says 'post about X', 'create a tweet', 'make a LinkedIn post', 'push to socials', 'create content for [campaign]'."
---

# Skill: Social Post Creator (v2)

> **Scope:** Operates within the AI Operating System project. Uses MCP Gateway tools (social publishing, DB, lore, image gen, tasks, Telegram). Integrates with the Bharatvarsh Content Pipeline repo for art prompts, template selection, and calendar management.
>
> **Type:** Workflow skill — interactive-first, one-shot execution after brief is collected.

---

## Interface Notes

This skill runs across three interfaces. Behavior adapts accordingly:

| Interface | Key Behaviors |
|-----------|--------------|
| **Claude.ai** | Ask for info via text. Accept file uploads (reference images, draft text, brand assets). Use MCP tools for all context loading and saving. |
| **Claude Code** | Same MCP tools + can read pipeline JSON files directly from `content-pipelines/bharatvarsh/prompts/`. Can update `calendar/content_calendar.csv`. |
| **Claude Cowork** | Same as Claude.ai. Plugin context provides brand and lore knowledge. |

---

## When to Use

Trigger on any request to create, draft, write, or publish social content. Examples:
- "Create a post about X"
- "Draft a tweet for the Mesh launch"
- "LinkedIn post on AI&U episode 3"
- "Instagram caption + visual for Kahaan"
- "Post to all platforms about [topic]"
- "One-shot: post about [X] to [platform]"
- "Push this idea to socials"

**Do NOT use for:**
- Fiction writing or novel chapters → use `/bharatvarsh` (Writer Mode) or `/creative-writer`
- Publishing already-written content → use `/post-to-social`
- Professional/non-Bharatvarsh content only → `/social-post` handles that

---

## Process

### Step 0: Structured Brief Intake

**Always begin with this.** Present the following intake form in a single message. Do not ask questions piecemeal.

```
To create your social post, I need a quick brief. Fill in what you know — I'll infer the rest.

**1. Post Idea / Concept**
What's the core message? (topic, quote, scene, question, announcement — anything)

**2. Objective**
Pick one:
  [ ] Awareness — reach new readers/followers
  [ ] Engagement — spark comments, shares, discussion
  [ ] Conversion — drive to website / subscribe / buy
  [ ] Community — speak to existing fans
  [ ] Announcement — something new is live

**3. Platform(s)**
  [ ] LinkedIn   [ ] X/Twitter (single tweet or thread?)   [ ] Facebook   [ ] Instagram   [ ] All

**4. Campaign**
Is this part of a campaign?
  [ ] Arc 1: Welcome to the Mesh (Bharatvarsh)
  [ ] AI&U (YouTube channel)
  [ ] Professional / thought leadership
  [ ] Standalone / new campaign: ____________

**5. Brand Context**
  [ ] A — AI OS / Professional (emerald, authoritative)
  [ ] B — Bharatvarsh (mustard-obsidian, mythic-dystopian)
  [ ] C — Personal (authentic, reflective)

**6. Art Direction**
Does this post need a visual?
  [ ] Yes — Character portrait (who? _______)
  [ ] Yes — Environment / city establishing shot (which location? _______)
  [ ] Yes — Technology close-up (Mesh / Oxy Pole / Bracecomm)
  [ ] Yes — Quote card / atmospheric background
  [ ] Yes — Behind the scenes / process
  [ ] No visual needed

**7. Anything else?**
Tone, specific lore details, CTA, urgency (publish now / schedule / draft only), or attach reference images/files here.
```

If the user's original message already contains enough information, skip or abbreviate — extract what's there and ask only for genuinely missing critical fields. Never ask more than once.

---

### Step 1: Pipeline Context Load

Load context based on the brief before generating any content.

**Always:**
- Check recent posts on the target platform to avoid repetition:
  ```
  query_db(sql: 'SELECT content_preview, published_at FROM campaign_posts WHERE platform = $1 AND status IN (''published'', ''scheduled'', ''draft'') ORDER BY created_at DESC LIMIT 5', params: [platform])
  ```
- If a campaign is identified, fetch its details:
  ```
  query_db(sql: 'SELECT * FROM campaigns WHERE slug ILIKE $1 LIMIT 1', params: ['%keyword%'])
  ```

**If Brand Context = B (Bharatvarsh):**
- Call `search_lore(query: '<topic keywords>')` — ground the post in canon lore
- Call `get_writing_style(fragment_type: 'description', limit: 3)` — load voice reference
- If character-specific: note which character and their classified status (Arshi = silhouette only; others declared)

**If Art Direction is specified:**
- Identify the visual target: character name, location name, or technology name
- This feeds directly into Step 3 (Art Prompt Generation)

**If multi-platform:**
- Research once, adapt per platform in Step 2

---

### Step 2: Generate Post Copy

Write platform-specific content following these constraints:

#### LinkedIn
- **Length:** 800–1800 characters
- **Structure:** Scroll-stopping hook → context/story → insight/value → CTA
- **Style:** Professional but conversational, first-person. Max 3–5 hashtags at the end. Max 2 emojis.
- **Voice A:** Clear, grounded, references real tools/projects. No buzzword soup.
- **Voice B:** Announce a mystery. Treat followers as initiates receiving a briefing.
- **Hook must NOT start with:** "I'm excited to share...", "Thrilled to announce...", "In today's fast-paced..."

#### X / Twitter — Single Tweet
- **Length:** Max 280 characters
- **Style:** Punchy, opinionated, quotable. 1–2 hashtags max.

#### X / Twitter — Thread
- **Length:** 3–10 tweets, each ≤ 280 characters
- **Structure:** Tweet 1 = standalone hook. Middle = substance. Last = CTA or summary.
- **Numbering:** "1/" at start of each tweet.
- **Storage:** Keep as array of strings, not concatenated.

#### Facebook
- **Length:** 300–1000 characters
- **Style:** Community-oriented, conversational, questions invite engagement.

#### Instagram
- **Length:** Up to 2200 characters. First 125 characters must hook before "more" truncation.
- **Hashtags:** Up to 15, placed at end or in first comment.
- **Requirement:** Image is mandatory. If no art direction was provided, flag this and request it.

**Voice calibration:**
- Brand B (Bharatvarsh): Mythic, evocative, surveillance-era official tone. Never give away classified information. Reference Bhoomi's voice: clinical, bureaucratic, ominous.
- Brand A (AI OS / Professional): Insight-driven, grounded in real experience, concrete examples over abstractions.
- Brand C (Personal): Authentic, reflective, draws from lived experience.

---

### Step 3: Art Prompt Generation (Conditional)

**Run this step only if art direction was specified in the brief.**

Generate a complete, ready-to-use art prompt package for OpenArt (SDXL/Flux) or Google Flow (Imagen/Veo).

#### 3a. Select Style Anchor

Based on art type:
| Art Type | Style Anchor |
|----------|-------------|
| Character portrait | Anchor A — CINEMATIC PORTRAIT |
| Environment / city shot | Anchor B — ENVIRONMENT/LANDSCAPE |
| Technology close-up | Anchor C — TECHNOLOGY CLOSE-UP |
| Quote card / text overlay | Anchor D — ATMOSPHERIC BACKGROUND |
| Action / faction confrontation | Anchor E — ACTION/DYNAMIC |

**Style contract (all anchors):** Jim Lee modern American comic book art style — dense hatching and cross-hatching for depth, heavy blacks balanced with sharp white highlights, bold ink outlines with varying line weight, textured surfaces with grit (pen-and-ink feel, NOT smooth digital).

#### 3b. Load Character DNA (if character-specific)

For character portraits, apply the character's Visual DNA verbatim:

| Character | Classified? | Key Visual Markers |
|-----------|-------------|-------------------|
| Kahaan | No | Navy + gold tactical lens, sharp angular features, NAVY uniform |
| Rudra | No | Grey Trident insignia, Devanagari tattoos, weathered military build |
| General Pratap | No | Navy + gold epaulettes, age 60s, commanding presence |
| Hana | No | Tactical navy + powder blue, sniper rifle signature |
| Surya | No | Dark gray + cyan GUHYAKAS tech armor, nameplate visible |
| Arshi | **YES — CLASSIFIED** | **Silhouette or shadow ONLY. No identifiable features.** |

For locations: reference Indrapur HQ (command center, brutalist), Lakshmanpur (industrial metropolis, surveillance towers), Oxy Pole Boulevard (street-level, oxygen stations), or Mesh Surveillance Zone (abstract, floating nodes).

#### 3c. Assemble Prompt Package

Structure:
```
ART PROMPT PACKAGE — [Post ID or title]

▸ STYLE ANCHOR: [A/B/C/D/E — name]
▸ MODEL ROUTING:
  - Primary: [Seedream 4.5 if character faces | Nano Banana if environments/landscapes/tech]
  - Parameters: [Steps, guidance, reference strength]

▸ POSITIVE PROMPT:
[Jim Lee style contract] + [Character DNA / environment description] + [lighting] + [mood] + [composition notes]

▸ NEGATIVE PROMPT:
[anime, cartoon, smooth digital art, 3D render, watercolor, photorealistic...] + [target-specific exclusions]

▸ REFERENCE IMAGES:
  - Style ref: [art_style folder reference]
  - Subject ref: [character reference path if applicable]
  - Role: [style_reference / subject_reference]

▸ ASPECT RATIOS:
  - Instagram: 4:5 (portrait) or 1:1 (square)
  - Twitter/X: 16:9
  - Facebook/LinkedIn: 1.91:1

▸ QUALITY CHECKLIST (verify before approving):
  □ Character face matches reference sheet (if portrait)
  □ Signature element present (tactical lens / Trident / epaulettes / etc.)
  □ Obsidian/navy/mustard color palette maintained
  □ No classified elements exposed
  □ No "AI-generated" smooth look
  □ Correct aspect ratio for channel
  □ No anatomical errors
  □ Lore-accurate (no spoilers)
```

---

### Step 4: Present Complete Draft

Present everything together for one-shot review:

```
📝 SOCIAL POST DRAFT — [Platform]
Campaign: [name or "standalone"]
Type: [post / thread / caption]
Tone: [tone used]
Brand Context: [A / B / C]

---
[Post copy here]
---

Character count: [X] / [platform max]
```

If art direction was provided, follow immediately with:
```
🎨 ART PROMPT PACKAGE
[Full art prompt package from Step 3]
```

If multi-platform, present each platform under its own header.

**Ask:** "Ready to save this as a draft, or want adjustments to the copy or art direction?"

---

### Step 5: Save Draft + Create Approval Task

Once the user approves (or says "save", "looks good", "ship it", "draft it"):

#### 5a. Save as Writing Output
```
save_writing_output(
  title: '<descriptive title>',
  content: '<full post text>',
  output_type: 'social_post',
  platform: '<linkedin|twitter|facebook|instagram>',
  project_slug: '<bharatvarsh|null>',
  tone: '<tone used>',
  audience: '<audience description>',
  tags: ['social', '<platform>', '<campaign-name-slug>'],
  metadata: {
    campaign_id: '<uuid or null>',
    content_type: '<post|thread|caption>',
    character_count: <int>,
    brand_context: '<A|B|C>',
    art_prompt_included: <true|false>
  }
)
```

#### 5b. Create Campaign Post Record (draft status)
```
insert_record(
  table: 'campaign_posts',
  data: {
    campaign_id: '<campaign uuid>',
    platform: '<platform>',
    content_preview: '<first 200 chars>',
    content_type: '<post|thread|caption>',
    status: 'draft',
    metadata: {
      writing_output_id: '<uuid from 5a>',
      tone: '<tone>',
      brand_context: '<A|B|C>',
      full_content: '<complete post text>',
      art_prompt: '<art prompt text if generated | null>'
    }
  }
)
```

#### 5c. Create Google Task for Approval
```
google_tasks_create(
  title: 'Review & approve: [Platform] post — [brief topic description]',
  notes: '[first 200 chars of post]\n\nCampaign: [name]\nPost ID: [campaign_post_id]\nArt needed: [yes/no]\nDraft saved: [writing_output_id]',
  due_date: '<tomorrow ISO date or user-specified>',
  list: 'Content Pipeline'
)
```

After saving, confirm:
```
✅ Draft saved + task created
  → Writing output: [title] (v[version])
  → Campaign post: [campaign name] — [platform] — draft
  → Post ID: [campaign_post_uuid]
  → Google Task: "Review & approve: [platform] post" — due [date]
```

#### 5d. Calendar Sync (Claude Code only)
If running in a Claude Code session, offer: "Add this post to `content_calendar.csv`?"

If yes, append a new row to `content-pipelines/bharatvarsh/calendar/content_calendar.csv` using the calendar schema (post_id, campaign, content_pillar, topic, channels, status=`approved`, scheduled_date, caption_text, etc.).

---

### Step 6: Publish or Schedule (Optional)

After saving, ask: **"Want me to publish now, keep as draft, or schedule it?"**

**If publish:**

| Platform | MCP Tool | Key Parameters |
|----------|----------|----------------|
| LinkedIn | `post_to_linkedin` | `content`, `visibility: 'PUBLIC'`, `campaign_post_id` |
| X — Single | `x_post_tweet` | `text` |
| X — Thread | `x_post_thread` | `tweets` (string array) |
| Facebook | `post_to_facebook` | `message`, `campaign_post_id` |
| Instagram | `post_to_instagram` | `caption`, `image_url`, `campaign_post_id` |

After publishing, update the record:
```
update_record(
  table: 'campaign_posts',
  id: '<campaign_post_id>',
  data: { status: 'published', published_at: '<ISO timestamp>', external_post_id: '<platform post id>' }
)
```

Confirm:
```
🚀 Published!
  → [Platform]: [post URL or ID]
  → Campaign post status: published
```

**If schedule:** Update `campaign_posts` with `scheduled_at` and `status: 'scheduled'`. Note: automated scheduled publishing requires the Category B content pipeline — the Google Task created in Step 5c will prompt manual publishing at the scheduled time.

**If draft only:** No further action.

---

### Step 7: Telegram Notification (Optional)

After draft save or publish, offer: **"Push summary to Telegram?"**

If yes:
```
send_telegram_message(
  message: '📱 Social Post [Draft/Published]\nPlatform: [platform]\nCampaign: [name]\nPreview: [first 100 chars]...\nStatus: [status]\nID: [campaign_post_id]\nArt needed: [yes/no]'
)
```

---

### Step 8: Log Pipeline Run

After all steps complete:
```
log_pipeline_run(
  slug: 'social-post-creator',
  status: 'success',
  metadata: {
    platform: '<platform>',
    campaign_id: '<uuid or null>',
    campaign_post_id: '<uuid>',
    writing_output_id: '<uuid>',
    content_type: '<post|thread|caption>',
    brand_context: '<A|B|C>',
    published: <true|false>,
    character_count: <int>,
    art_prompt_generated: <true|false>
  }
)
```

On failure: log `status: 'error'` with reason.

---

## Multi-Platform Mode

When user says "post to all" or "cross-post":
1. Generate a master version first
2. Adapt per platform (respect each platform's constraints from Step 2)
3. Present all drafts + single art prompt (if applicable) together
4. Save each as a separate `writing_output` and `campaign_post` under the same `campaign_id`
5. Create one Google Task covering all platforms

---

## Quick Mode

If the user provides complete ready-to-post text and says "post this to [platform]":
- Skip Steps 0–2
- Go to Step 4 → confirm → Step 5 → Step 6
- Still create `writing_output` and `campaign_post` records

---

## Quality Rules

- Every post must pass: "Would I actually stop scrolling for this?" If it reads like generic AI content — rewrite.
- LinkedIn hooks must not start with "I'm excited to share...", "Thrilled to announce...", or any hype opener.
- Twitter threads: hook tweet must stand alone and compel a click.
- Bharatvarsh posts: always `search_lore` before including canon details. Never contradict established lore.
- Instagram posts without image art direction should be blocked — flag it, don't proceed without visual plan.
- Character art: Arshi is CLASSIFIED — silhouette/shadow only, no face, no identifiable features. No exceptions.
- Art prompts: include Jim Lee style contract verbatim. Never use smooth digital art or anime styles.
- Threads: store as arrays, never concatenated strings.
- Character counts must be validated before presenting any draft.
- If post references specific statistics or claims: flag for user verification.

---

## Connectors Used

**MCP Gateway — Social Publishing:**
- `post_to_linkedin`, `x_post_tweet`, `x_post_thread`, `post_to_facebook`, `post_to_instagram`

**MCP Gateway — Data:**
- `save_writing_output`, `insert_record`, `update_record`, `query_db`

**MCP Gateway — Lore & Voice:**
- `search_lore`, `get_writing_style`

**MCP Gateway — Media:**
- `generate_image`

**MCP Gateway — Tasks & Notifications:**
- `google_tasks_create`, `send_telegram_message`, `log_pipeline_run`

**Knowledge Base (claude.ai context):**
- `BHARATVARSH_BIBLE.md` — Canon lore
- `BRAND_IDENTITY.md` — Brand system
- `BHARATVARSH_CHARACTERS.md` — Character profiles
- `CONTENT_CALENDAR.md` — Active campaign context
- `MARKETING_PLAYBOOK.md` — Campaign strategy
