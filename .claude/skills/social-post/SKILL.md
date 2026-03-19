---
name: social-post
description: "Platform-aware professional and AI&U social content with voice calibration. Use when user asks for a LinkedIn post, Twitter thread, social content, or professional thought leadership."
---

# Skill: Social Post

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks to create social media content for professional thought leadership, AI&U channel promotion, personal brand building, or any non-Bharatvarsh social content. Trigger phrases include: "social post about," "LinkedIn post," "Twitter thread," "write a post on," "promote this," "share this insight," or any request for social media content creation.

For Bharatvarsh-specific content, use /bharatvarsh instead (unified skill with content, writer, and lore check modes). This skill handles everything else: professional insights, AI&U promotion, industry commentary, personal brand content.

---

## Process

### Step 1: Determine Content Domain
Identify what the post is about:
- **Professional insight** — AI/Cloud/product leadership thought piece
- **AI&U promotion** — Channel content, video teasers, behind-the-scenes
- **Technical tutorial** — Bite-sized technical insight from a build or project
- **Industry commentary** — Response to a trend, news, or development
- **Personal milestone** — Achievement, transition, learning

### Step 2: Load Context
- For **professional content**: Reference OWNER_PROFILE.md for positioning and credibility anchors
- For **AI&U content**: Reference AI&U Knowledge Pack for voice, pillars, and brand guidelines
- For **technical content**: Reference relevant project context from WORK_PROJECTS.md
- For **trend commentary**: Use web search to verify the current state of the topic

### Step 3: Generate Platform-Specific Content

**LinkedIn (Professional Home Base):**
- 150-300 words. First line is everything — it's visible before "see more."
- Structure: Hook → Context → Insight → Practical takeaway → Soft CTA
- Voice: Consultant-builder-teacher. Direct, structured, implementation-minded.
- No hashtag spam. 3-5 relevant tags at the end.
- Use line breaks for scanability. No walls of text.
- Include a perspective or opinion — don't just report facts.

**Twitter/X (Reach Engine):**
- Single tweet (280 chars) or thread (3-7 tweets)
- Thread structure: Hook tweet → Supporting points → Punchline/CTA
- Thread rule: every tweet must stand alone AND build on the previous one
- Use @mentions sparingly and only when genuinely relevant
- Hashtags: 1-2 max, embedded naturally

**Instagram (Visual-First):**
- Caption: 100-200 words with visual direction
- For AI&U: use brand colors (Amber Orange, Signal Green, Signal Gold on clean white/dark backgrounds)
- Visual direction should specify: text overlay content, layout, color palette, mood
- Include a call to action in the caption

### Step 4: Tailor Voice by Domain

| Domain | Voice | Avoid |
|--------|-------|-------|
| Professional | Calm authority, implementation-minded, systems thinking | Humble-bragging, vague inspiration |
| AI&U | Practical clarity, curiosity-provoking, educator | Hype, clickbait, empty promises |
| Technical | Builder showing work, honest about trade-offs | Jargon without explanation |
| Industry | Grounded analysis, "what this means for practitioners" | Hot takes without substance |

### Step 5: Deliver with Metadata
For every post, include:
- Platform label
- The post text (ready to copy-paste)
- Visual direction if applicable
- Best posting time recommendation (IST for Indian audience, consider global for LinkedIn)
- Suggested follow-up engagement plan (reply to first 5 comments, share in relevant groups)

---

## Quality Rules

- First line must create a reason to read more. No "I've been thinking about..." openers.
- Every post needs a **takeaway** — something the reader can use, think about, or do differently.
- No performative vulnerability or manufactured authenticity. Be genuine.
- Don't over-post. Quality > quantity. One strong LinkedIn post beats five mediocre ones.
- For AI&U promotion: show value from the video, don't just announce it exists. "Here's what I learned building an AI workflow for X" > "New video is up! Check it out!"
- Cross-reference CONTENT_CALENDAR.md (when available) to maintain cadence and avoid topic repetition.

---

## Connectors Used

- **Knowledge base: OWNER_PROFILE.md** — professional voice and positioning
- **Knowledge base: AI&U Knowledge Pack** — channel voice and brand guidelines
- **Knowledge base: WORK_PROJECTS.md** — project context for technical posts
- **Knowledge base: CONTENT_CALENDAR.md** — track what's been posted (when available)
- **Web search** — verify trends and current state for commentary posts
