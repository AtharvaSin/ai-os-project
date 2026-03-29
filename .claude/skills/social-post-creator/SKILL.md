---
name: social-post-creator
description: "One-shot social media post creation for Claude Code sessions. Collects a structured brief (idea, objective, platform, campaign, brand context, art style), generates platform-specific post copy, builds a full art prompt package from the Bharatvarsh content pipeline JSON files, saves draft via MCP, creates a Google Task for approval, and optionally updates the content calendar CSV. Use when: 'create a post', 'draft a tweet', 'LinkedIn post about X', 'post to socials', 'post for Bharatvarsh campaign', or any social content creation request."
---

# Skill: Social Post Creator — Claude Code / Cowork Edition

> **Interface:** Claude Code (CLI and desktop) + Claude Cowork
>
> **Scope:** Reads pipeline data files directly from the local repo. Uses MCP Gateway for saving, publishing, and notifications. Same pipeline logic as the canonical `SKILL_CREATE_SOCIAL_MEDIA_POST.md` in `content-pipelines/bharatvarsh/skills/`.

---

## When to Use

Any request to create, draft, or post social media content:
- "Create a post about X" / "Draft a tweet" / "LinkedIn post on Y"
- "Bharatvarsh social post for Arc 1"
- "Post to all platforms about [topic]"
- "One-shot: post about [X] to [platform]"

**Route elsewhere if:**
- Publishing already-written content → use `/post-to-social`
- Professional/non-Bharatvarsh only → use `/social-post`
- Fiction/narrative → use `/bharatvarsh` or `/creative-writer`

---

## Pipeline Data Files (read these for context)

```
content-pipelines/bharatvarsh/prompts/character_dna.json          ← character visual DNA
content-pipelines/bharatvarsh/prompts/style_anchors.json           ← 5 Jim Lee style anchors
content-pipelines/bharatvarsh/prompts/environment_templates.json   ← 4 location templates
content-pipelines/bharatvarsh/prompts/negative_prompts.json        ← base + model-specific negatives
content-pipelines/bharatvarsh/prompts/arc1_post_prompts.json       ← 30 campaign prompts (Arc 1)
content-pipelines/bharatvarsh/templates/template-registry.json     ← 5 HTML templates per channel
content-pipelines/bharatvarsh/calendar/content_calendar.csv        ← master post calendar
content-pipelines/bharatvarsh/calendar/post_style_overrides.json   ← per-post visual overrides
```

Read the relevant files before generating content. Do not hallucinate character details — always load from `character_dna.json`.

---

## Process

### Step 0: Structured Brief Intake

Present this intake form once. Do not ask questions piecemeal.

```
To create your social post, fill in what you know — I'll infer the rest:

1. POST IDEA / CONCEPT
   What's the core message? (topic, quote, scene, question, announcement)

2. OBJECTIVE
   [ ] Awareness  [ ] Engagement  [ ] Conversion  [ ] Community  [ ] Announcement

3. PLATFORM(S)
   [ ] LinkedIn   [ ] X/Twitter (tweet or thread?)   [ ] Facebook   [ ] Instagram   [ ] All

4. CAMPAIGN
   [ ] Arc 1: Welcome to the Mesh   [ ] AI&U   [ ] Professional   [ ] Standalone: _______

5. BRAND CONTEXT
   [ ] A — AI OS / Professional (emerald, authoritative)
   [ ] B — Bharatvarsh (mustard-obsidian, mythic-dystopian)
   [ ] C — Personal (authentic, reflective)

6. ART DIRECTION
   [ ] Character portrait — who? _______
   [ ] Environment / city shot — which location? _______
   [ ] Technology close-up (Mesh / Oxy Pole / Bracecomm)
   [ ] Quote card / atmospheric background
   [ ] Behind the scenes
   [ ] No visual needed

7. ANYTHING ELSE?
   Tone, specific lore details, CTA, urgency (publish now / schedule / draft only)
```

If the user's message already provides enough info, extract and proceed without repeating questions.

---

### Step 1: Load Context from Local Files

**For Brand B (Bharatvarsh):**
1. Read `character_dna.json` if character is named in brief
2. Call `search_lore(query: '<topic keywords>')` via MCP
3. Call `get_writing_style(fragment_type: 'description', limit: 3)` via MCP
4. Check `arc1_post_prompts.json` — if a matching post already exists, reference its structure

**For dedup check:**
```
query_db(sql: 'SELECT content_preview, published_at FROM campaign_posts WHERE platform = $1 ORDER BY created_at DESC LIMIT 5', params: [platform])
```

**For calendar check:** Read `content_calendar.csv` and scan for posts with same topic/character — flag if a post is already planned.

---

### Step 2: Generate Post Copy

Platform rules (apply strictly):

**LinkedIn:** 800–1800 chars. Hook → story → insight → CTA. Max 5 hashtags. No "I'm excited to share..." openers.

**X/Twitter — Tweet:** ≤ 280 chars. Punchy, quotable. 1–2 hashtags.

**X/Twitter — Thread:** 3–10 tweets, each ≤ 280 chars. Tweet 1 must stand alone as a hook. Store as string array.

**Facebook:** 300–1000 chars. Community-oriented, invites discussion.

**Instagram:** Caption ≤ 2200 chars, first 125 chars must hook. Up to 15 hashtags. Image mandatory — block if no art direction.

**Voice:**
- Brand B: Bhoomi register — clinical, official, ominous. Reference lore accurately. Never break spoiler rules (Surya not linked to 2010 military event, Arshi never identified).
- Brand A: Grounded thought leadership, concrete examples, no buzzwords.
- Brand C: Authentic, reflective.

---

### Step 3: Generate Art Prompt Package (if art direction provided)

Read from local files:
- Load relevant character entry from `character_dna.json`
- Load matching style anchor from `style_anchors.json`
- Load location from `environment_templates.json` if location-based
- Load negative prompts from `negative_prompts.json` (base + model-specific)

Assemble the prompt package:

```
ART PROMPT PACKAGE

▸ STYLE ANCHOR: [A/B/C/D/E — name]
▸ MODEL ROUTING:
  - Seedream 4.5 → character faces / portraits
  - Nano Banana → environments, tech, atmospheres, landscapes
  - Parameters: [guidance + steps from style anchor JSON]

▸ POSITIVE PROMPT:
Jim Lee modern American comic book art style, dense hatching and cross-hatching for depth,
heavy blacks balanced with sharp white highlights, bold ink outlines with varying line weight,
textured surfaces with grit, pen-and-ink feel — NOT smooth digital.
+ [Character DNA verbatim if character-specific]
+ [Environment description if location-based]
+ [Lighting + mood keywords]
+ [Composition: full body / close-up portrait / wide establishing shot]

▸ NEGATIVE PROMPT: [from negative_prompts.json — base + target-specific]

▸ REFERENCE IMAGES:
  - Style: content-pipelines/bharatvarsh/assets/art_style/ [select 1-2 Jim Lee refs]
  - Subject: content-pipelines/bharatvarsh/assets/references/[character] [if portrait]

▸ ASPECT RATIOS:
  - Instagram: 4:5 portrait or 1:1 square
  - X/Twitter: 16:9
  - Facebook / LinkedIn: 1.91:1

▸ QUALITY CHECKLIST:
  □ Character face matches reference (if portrait)
  □ Signature element present (see character_dna.json)
  □ Obsidian/navy/mustard palette
  □ No classified elements (Arshi = shadow only, NO exceptions)
  □ No smooth/AI look
  □ Correct aspect ratio
  □ Lore-accurate, no spoilers
```

---

### Step 4: Present Complete Draft

```
📝 DRAFT — [Platform]
Campaign: [name]  |  Type: [post/thread/caption]  |  Brand: [A/B/C]

---
[Post copy]
---
Character count: [X] / [max]
```

Followed immediately by art prompt if generated:
```
🎨 ART PROMPT PACKAGE
[Package from Step 3]
```

Ask: "Ready to save? Any adjustments?"

---

### Step 5: Save Draft + Create Approval Task

Once approved:

**5a. Save writing output:**
```
save_writing_output(title, content, output_type: 'social_post', platform, project_slug, tone, audience, tags, metadata)
```

**5b. Create campaign post (draft):**
```
insert_record(table: 'campaign_posts', data: { campaign_id, platform, content_preview, content_type, status: 'draft', metadata: { writing_output_id, full_content, art_prompt } })
```

**5c. Create Google Task:**
```
google_tasks_create(
  title: 'Review & approve: [Platform] — [brief description]',
  notes: '[first 200 chars of post]\n\nPost ID: [id]\nArt needed: [yes/no]',
  due_date: '<tomorrow>',
  list: 'Content Pipeline'
)
```

**5d. Update content calendar (optional — Claude Code only):**
Ask: "Add to content_calendar.csv?"
If yes, append a new row to `content-pipelines/bharatvarsh/calendar/content_calendar.csv`:
- Generate a post_id: `BHV-YYYYMMDD-NNN` format
- status: `approved`
- Fill in: campaign, content_pillar, topic, channels, caption_text, scheduled_date (if known)
- Leave performance fields blank

Confirm:
```
✅ Saved
  → Writing output: [title]
  → Campaign post: [id] — draft
  → Google Task created: [title]
  → Calendar: [added / skipped]
```

---

### Step 6: Publish or Schedule (Optional)

Ask: "Publish now, schedule, or keep as draft?"

| Platform | MCP Tool |
|----------|----------|
| LinkedIn | `post_to_linkedin` |
| X tweet | `x_post_tweet` |
| X thread | `x_post_thread` |
| Facebook | `post_to_facebook` |
| Instagram | `post_to_instagram` (requires image_url) |

After publishing: `update_record(campaign_posts, status: 'published', published_at, external_post_id)`

---

### Step 7: Telegram Notification (Optional)

```
send_telegram_message('📱 Social Post [Draft/Published]\nPlatform: [p]\nCampaign: [c]\nPreview: [100 chars]...')
```

---

### Step 8: Log Pipeline Run

```
log_pipeline_run(slug: 'social-post-creator', status: 'success', metadata: { platform, campaign_id, campaign_post_id, writing_output_id, brand_context, published, art_prompt_generated })
```

---

## Quality Rules

- Rewrite any draft that reads like generic AI content.
- LinkedIn hooks must not start with hype phrases.
- Bharatvarsh: always load from `character_dna.json`, never hallucinate visual details.
- Arshi: shadow/silhouette ONLY. Never generate a face prompt for her.
- Instagram without art direction: block and request it.
- Character counts validated before presenting any draft.
- Threads stored as string arrays, never concatenated.
