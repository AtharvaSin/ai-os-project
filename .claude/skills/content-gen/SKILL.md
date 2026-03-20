---
name: content-gen
description: "Non-Bharatvarsh content pipeline: LinkedIn posts, blog drafts, thought leadership, AI&U scripts. Use for any content that is NOT Bharatvarsh-specific."
---

# Skill: Content Gen

> **Scope:** This skill operates within the AI Operating System project only. It uses the AI OS MCP Gateway tools and references project-specific knowledge base documents.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks to create content that is NOT related to the Bharatvarsh universe. This includes LinkedIn posts, blog drafts, thought leadership articles, AI&U YouTube scripts, professional commentary, or any written content for Atharva Singh's personal brand.

Trigger phrases include:
- "Write a LinkedIn post about..."
- "Draft a blog on..."
- "AI&U script for..."
- "Create content about..."
- "Write a thread on..."
- "Help me write about..."
- Any content creation request that is not Bharatvarsh-specific

**Routing rule:** If the content is about Bharatvarsh (the novel, the universe, the website, the characters), redirect to `/bharatvarsh` (content mode) instead. This skill handles everything else.

---

## Process

### Step 1: Load Context

1. **`search_knowledge`** — Search for recent decisions, projects, or experiences related to the content topic. This grounds the content in real work rather than generic advice.
2. **`list_drive_files`** — Check for existing content, templates, or drafts in Google Drive that might be relevant or reusable.
3. Load KB files based on content type:
   - Professional content: **OWNER_PROFILE.md** (positioning, credibility), **WORK_PROJECTS.md** (project context)
   - AI&U content: **AI&U Knowledge Pack** (channel voice, pillars, brand guidelines)
   - Brand-sensitive content: **BRAND_IDENTITY.md** (Context A for professional, Context C for personal)

### Step 1.5: Load Channel Knowledge

- **`search_knowledge`** — Search for the channel profile and strategy for the target platform:
  ```
  search_knowledge(query="{platform} channel profile", sub_domain="social-channels", limit=2)
  search_knowledge(query="{platform} channel strategy", sub_domain="social-channels", limit=2)
  ```
- If a channel profile exists, extract: content pillars, target audience, posting guidelines, channel handle
- If a channel strategy exists, apply: content mix preferences, voice/tone for this platform, hashtag strategy, algorithm-aware tips
- Use channel context to inform Step 3 (platform format) and Step 4 (brand voice) — channel-specific voice overrides generic platform guidance
- **Fallback:** If no channel exists for the target platform, proceed with default behavior. Suggest running `/channel-knowledge` to set one up.

### Step 2: Check for Duplicates

- **`query_db`** — Check `campaign_posts` for recently published content on the same topic:
  ```sql
  SELECT platform, topic, angle, content_preview, created_at
  FROM campaign_posts
  WHERE platform = '{target_platform}'
  ORDER BY created_at DESC LIMIT 10
  ```
- Review the last 10 posts for the target platform. If a similar topic or angle was used in the last 14 days, pivot the angle or inform the user.

### Step 3: Determine Platform and Format

| Platform | Format | Length | Key Rules |
|----------|--------|--------|-----------|
| **LinkedIn** | Single post | 150-300 words | Hook-first. Professional but human. 3-5 tags max. Line breaks for scanability. First line visible before "see more" — make it count. |
| **Twitter/X** | Single tweet or thread | 280 chars / 3-7 tweets | Every tweet stands alone AND builds on the previous. 1-2 hashtags max, embedded naturally. Hook tweet is everything. |
| **Blog** | Long-form article | 800-2000 words | Clear structure with headers. Educational tone. Include code snippets or concrete examples where relevant. SEO-aware title. |
| **YouTube (AI&U)** | Conversational script | 1500-3000 words | Written for speaking, not reading. Short sentences. Natural pauses marked. B-roll suggestions in brackets. Hook in first 30 seconds. |

### Step 4: Apply Brand Voice

**General voice principles:**
- First-person. Practitioner sharing learnings, not guru dispensing wisdom.
- Structure: **Hook** → **Insight** → **Evidence** → **Takeaway**
- Show the work. Reference real projects, real decisions, real trade-offs.
- Opinions are encouraged. Fence-sitting is not content.

**Brand context selection:**
- Professional content (LinkedIn, blog, industry commentary) → **Context A** (AI OS System: dark electric, DM Sans, accent #00D492)
- Personal/casual content (personal stories, behind-the-scenes) → **Context C** (Portfolio: violet/coral, Inter)
- AI&U content → AI&U brand guidelines from the Knowledge Pack (Amber Orange, Signal Green, Signal Gold)

**Voice calibration by domain:**

| Domain | Voice | Avoid |
|--------|-------|-------|
| AI/Cloud/Product leadership | Calm authority, implementation-minded, systems thinking | Humble-bragging, vague inspiration, buzzword salads |
| AI&U channel | Practical clarity, curiosity-provoking, educator energy | Hype, clickbait, empty promises, "you won't believe" |
| Technical builds | Builder showing work, honest about trade-offs, specific | Jargon without explanation, over-simplification |
| Industry commentary | Grounded analysis, "what this means for practitioners" | Hot takes without substance, rage-bait |
| Career/personal | Reflective honesty, lessons-forward, specific stories | Performative vulnerability, manufactured authenticity |

### Step 5: Generate Content

Write the content following the platform format and voice rules above. For every piece:

- **Hook:** The first line must create a reason to keep reading. No "I've been thinking about..." openers. No questions that the reader can answer with "no." Start with a bold claim, a surprising fact, a counterintuitive observation, or a concrete story.
- **Substance:** Every post needs a takeaway — something the reader can use, think about, or do differently. No empty observations.
- **CTA:** End with a soft call to action. LinkedIn: ask a question or invite disagreement. Twitter: invite quote-tweets or replies. Blog: suggest a next step. YouTube: subscribe + specific follow-up video.

### Step 6: Persist and Deliver

1. **`insert_record`** — Save to `campaign_posts` table:
   - `platform` — target platform
   - `topic` — content topic
   - `angle` — the specific angle or hook
   - `content` — full draft text
   - `status` — 'draft'

2. **`send_telegram_message`** — Optional: push a mobile review notification with a summary of the draft and platform.

3. **`log_pipeline_run`** — Log the execution:
   ```
   log_pipeline_run(slug='content-gen', status='success')
   ```

4. Deliver to the user with:
   - Platform label
   - The post text (ready to copy-paste)
   - Visual direction if applicable (Instagram, YouTube thumbnails)
   - Best posting time recommendation (IST for Indian audience, consider global reach for LinkedIn)
   - Suggested follow-up engagement plan (reply to first comments, share in relevant groups)

---

## YouTube (AI&U) Script Format

When generating an AI&U script, use this structure:

```
## Video Title: [Title]
**Duration:** [estimated minutes]
**Pillar:** [which AI&U content pillar this falls under]

### Hook (0:00 - 0:30)
[Opening lines — must grab attention in 5 seconds]

### Context (0:30 - 2:00)
[Why this matters. What problem are we solving.]

### Core Content (2:00 - {end-2min})
[Main teaching/demonstration/walkthrough]
[B-roll: description of screen recording or visual needed]

### Key Takeaway ({end-2min} - {end-1min})
[Single memorable insight the viewer walks away with]

### CTA ({end-1min} - end)
[Subscribe, comment prompt, next video teaser]
```

---

## Quality Rules

- **Authenticity over polish.** Real experiences and honest observations beat perfectly crafted corporate messaging. If the user hasn't actually done the thing, don't pretend they have.
- **Grounded in real experience.** Every post should reference a real project, decision, or learning. Use `search_knowledge` to find grounding material. No generic advice.
- **No repetition.** The `campaign_posts` dedup check is mandatory. Same topic within 14 days requires a fresh angle.
- **Platform-native writing.** LinkedIn posts should not read like tweets. YouTube scripts should not read like blog posts. Respect each platform's conventions.
- **Persist all drafts.** Every generated piece of content must be saved to `campaign_posts` for dedup tracking and future reference, even if the user decides not to publish.
- **First line is everything.** The hook determines whether anyone reads the rest. Spend disproportionate effort on the opening.
- **No hashtag spam.** LinkedIn: 3-5 tags. Twitter: 1-2. Blog: none in body, use meta tags. YouTube: tags in metadata, not script.

---

## Connectors Used

**MCP Gateway (postgres module):**
- `query_db` — check campaign_posts for dedup
- `insert_record` — save drafts to campaign_posts

**MCP Gateway (core):**
- `search_knowledge` — find grounding material from recent work and decisions
- `list_drive_files` — check for existing templates and content in Drive
- `log_pipeline_run` — execution logging

**MCP Gateway (telegram module):**
- `send_telegram_message` — optional mobile review notification

**Knowledge Base Files:**
- `OWNER_PROFILE.md` — professional positioning and credibility anchors
- `WORK_PROJECTS.md` — project context for technical content
- `BRAND_IDENTITY.md` — Context A and Context C design tokens
- `CONTENT_CALENDAR.md` — cadence tracking and topic gaps (when available)
- `AI&U Knowledge Pack` — channel voice, pillars, and guidelines (for YouTube content)
- `SOCIAL_CHANNELS.md` — channel data architecture and query patterns for `sub_domain='social-channels'`
