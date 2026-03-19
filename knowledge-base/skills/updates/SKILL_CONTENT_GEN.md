# Skill: Content Gen

> **Scope:** Generic content generation for non-Bharatvarsh content — LinkedIn posts, blog drafts, thought leadership, AI&U YouTube scripts, and professional social content. Checks existing content to avoid repetition, applies brand voice, and persists drafts to the campaign system.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary).
>
> **Version:** 1.0 — New skill activating the content pipeline for professional and AI&U content.

---

## When to Use

Activate this workflow when the user wants to create content that is NOT Bharatvarsh-specific. For Bharatvarsh content, use `/bharatvarsh` instead.

**Trigger phrases:** "write a post", "content for", "draft a blog", "LinkedIn post", "thought leadership", "social post", "content calendar", "YouTube script", "AI&U content", "write about {topic}", "create content", "Twitter thread about"

**Routing rule:** If the content is about Bharatvarsh, the novel, or any fictional universe → redirect to `/bharatvarsh` (content mode). This skill handles: professional/career content, AI/tech content, AI&U brand content, personal brand content.

---

## Process

### Step 1: Research & Context

**Tool calls:**

1. **`search_knowledge`** → Recent decisions, work, and insights related to the topic (AIOSMCP)
   - Ground content in real experience, not generic advice

2. **`list_drive_files`** → Check Google Drive for existing content or templates (AIOSMCP)
   - Look for: previous drafts, reference documents, data

3. **`query_db`** → Check `campaign_posts` table for recent posts to avoid repetition (AIOSMCP)
   ```sql
   SELECT platform, topic, angle, created_at
   FROM campaign_posts
   WHERE platform = '{target_platform}'
   ORDER BY created_at DESC
   LIMIT 10
   ```
   - If a similar topic was posted recently, suggest a different angle

### Step 2: Determine Platform & Format

| Platform | Format | Tone | Length |
|----------|--------|------|--------|
| **LinkedIn** | Single post | Professional, insightful, personal-but-authoritative | 150-300 words |
| **Twitter/X** | Single tweet or thread (3-7 tweets) | Punchy, direct, value-first | 280 chars/tweet |
| **Blog** | Long-form article | Detailed, well-structured, educational | 800-2000 words |
| **YouTube (AI&U)** | Script with sections | Conversational, engaging, educational | 1500-3000 words |
| **Newsletter** | Email-style | Personal, curated, actionable | 500-1000 words |

### Step 3: Apply Brand Voice

Load `BRAND_IDENTITY.md` and apply the appropriate context:

- **Professional/Career content** → Context A (AI OS) voice: precise, systems-thinking, builder perspective
- **AI&U content** → Context A voice + educational warmth: making complex AI accessible
- **Personal brand** → Context C (Portfolio) voice: thoughtful, ambitious, human

**Voice calibration:**
- First-person: "I" not "we" (this is personal content)
- Perspective: practitioner sharing learnings, not guru dispensing wisdom
- Structure: hook → insight → evidence → takeaway
- Avoid: buzzwords, generic "AI will change everything", humble-bragging, engagement-bait questions

### Step 4: Generate Content

5. Produce the content with:
   - A strong opening hook (first line must stop the scroll)
   - Substance grounded in real experience (from knowledge entries or projects)
   - Concrete examples over abstract claims
   - A clear takeaway or call-to-action appropriate to the platform

### Step 5: Dedup Check

6. Compare the draft's core topic and angle against recent posts from Step 1
   - If too similar to a recent post: "This angle overlaps with your {date} post about {topic}. Want me to find a fresh angle?"

### Step 6: Persist & Notify

7. **`insert_record`** → Save to `campaign_posts` table (AIOSMCP)
   - Params: `table: 'campaign_posts'`, `platform`, `topic`, `angle`, `content`, `status: 'draft'`

8. **`send_telegram_message`** → Push draft for mobile review (AIOSMCP)
   - Offer: "Push to Telegram for mobile review?"
   - Format: platform label + first 200 chars + "Review in Claude.ai for full draft"

9. **`log_pipeline_run`** → Track execution (AIOSMCP)
   - Params: `slug: 'content-gen'`, `status: 'success'`, `metadata: {platform, topic}`

### Output Format

```
## Content Draft — {Platform}

**Topic:** {topic}
**Angle:** {what makes this take unique}
**Target audience:** {who this is for}

---

{The content — ready to copy-paste}

---

**Visual direction:** {If applicable — what image/graphic should accompany this}
**Posting recommendation:** {Best day/time for this platform}
**Hashtags:** {Platform-appropriate tags}

**Status:** Draft — saved to campaign system
```

---

## Content Calendar Integration

When the user asks about the content calendar:

1. **`query_db`** → Pull recent and upcoming content (AIOSMCP)
   ```sql
   SELECT platform, topic, angle, status, created_at, scheduled_for
   FROM campaign_posts
   ORDER BY COALESCE(scheduled_for, created_at) DESC
   LIMIT 20
   ```
2. Present as a visual calendar or table
3. Identify gaps — platforms or topics that haven't been covered recently
4. Suggest content to fill gaps

---

## Quality Rules

- **Authenticity over polish.** Content should feel like Atharva's real voice, not a content agency.
- **Grounded in experience.** Pull from knowledge entries, project work, and real decisions — not generic advice.
- **No repetition.** Always check `campaign_posts` before generating. Same topic needs a genuinely different angle.
- **Platform-native.** Don't write a LinkedIn post and reformat it for Twitter. Each platform gets natively written content.
- **Dedup is mandatory.** The campaign_posts check in Step 1 cannot be skipped.
- **Persist all drafts.** Every generated piece goes to `campaign_posts`, even if not immediately published.

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `search_knowledge` | PostgreSQL (AIOSMCP) | Topic research, grounding |
| `list_drive_files` | Drive Read (AIOSMCP) | Existing content/templates |
| `query_db` | PostgreSQL (AIOSMCP) | Dedup check, calendar view |
| `insert_record` | PostgreSQL (AIOSMCP) | Save draft to campaign_posts |
| `send_telegram_message` | Telegram (AIOSMCP) | Mobile review push |
| `log_pipeline_run` | PostgreSQL (AIOSMCP) | Execution logging |

---

## Connectors Used

- **AIOSMCP** — PostgreSQL module (3 tools), Drive Read module (1 tool), Telegram module (1 tool)
- **Knowledge Base** — BRAND_IDENTITY.md for voice/brand tokens
