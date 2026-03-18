---
name: draft-email
description: "Email drafting with tone variants and Gmail thread context. Use when user asks to draft, write, compose, or review an email or formal message."
---

# Skill: Draft Email

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks to draft, write, compose, or review an email or formal message. Trigger phrases include: "draft an email," "write a reply," "compose a message to," "help me respond to," "email about," or any request involving written professional or personal communication.

Also activate when the user shares an email thread (via Gmail or copy-paste) and asks for help responding.

---

## Process

### Step 1: Gather Context
Determine what's needed:
- **Who** is the recipient? (name, role, relationship — colleague, client, vendor, personal)
- **What** is the purpose? (request, follow-up, update, introduction, negotiation, decline, thank you)
- **What tone?** If not specified, infer from the relationship and purpose.
- **Is there a thread?** If the user references a previous email, search Gmail for the thread to understand the conversation history.

If the user provides enough context upfront, don't ask unnecessary clarifying questions — proceed directly.

### Step 2: Pull Relevant Context
- **Recipient lookup**: If the user names a recipient, call `search_contacts(query="recipient name")` or `get_contact(name="recipient name")` to pull their profile — company, title, tags, contact_type, last_contacted_at, and notes. Use this to:
  - Adapt tone based on contact_type (professional → Direct/Diplomatic, personal → Warm)
  - Add context ("last contacted 3 weeks ago — consider a warm re-engagement opener")
  - Pre-fill subject line with relevant company/project context
  - If the contact has no email in the database, flag it
- If the email relates to a **professional engagement**, reference WORK_PROJECTS.md for project context and the Career Reference Index for relevant experience.
- If the user references a **previous email or thread**, use Gmail search to find and read it for continuity.
- If the email is **introducing yourself or your work**, reference OWNER_PROFILE.md for positioning and credentials.

### Step 3: Generate Variants
Produce **2-3 tone variants** using the message compose tool when available:

- **Direct** — Concise, clear, action-oriented. Good for internal teams, follow-ups, and requests where you have leverage.
- **Diplomatic** — Measured, respectful, carefully worded. Good for senior stakeholders, sensitive topics, negotiations, and cross-cultural communication.
- **Warm** — Personable, relationship-forward, conversational. Good for networking, introductions, thank-yous, and ongoing relationships.

For each variant, include a subject line.

If the situation clearly calls for only one tone (e.g., a quick internal follow-up), produce just one version rather than forcing unnecessary variants.

### Step 4: Review Assist (if requested)
If the user asks to review an email they've already written:
- Check for clarity, tone, and completeness
- Flag anything that could be misread or is ambiguous
- Suggest specific edits (not vague "make it more professional")
- Note if anything important is missing given the context

---

## Output Format

Use the message compose tool to present email drafts with:
- Subject line
- Body text
- Variant label (Direct / Diplomatic / Warm)

If the message compose tool is not available, present as clearly formatted text with the subject line marked.

After presenting drafts, ask: "Want me to refine any of these, or send via Gmail?"

---

## Tone Calibration by Recipient Type

| Recipient | Default Tone | Key Considerations |
|-----------|-------------|-------------------|
| Client / customer | Diplomatic | Professional, value-focused, no jargon overload |
| Senior leader / exec | Diplomatic | Concise, bottom-line-first, respect their time |
| Peer / colleague | Direct | Clear, efficient, assumes shared context |
| Vendor / service provider | Direct | Specific, actionable, clear expectations |
| Networking / new contact | Warm | Personal, genuine interest, light ask |
| Friend / personal | Warm | Conversational, authentic, no corporate speak |
| Recruiter / hiring manager | Diplomatic + Warm | Professional but personable, confident not arrogant |

---

## Quality Rules

- Subject lines should be specific and scannable. Not "Follow up" but "Follow up: AI OS architecture review — next steps."
- First sentence should state the purpose. Don't bury the ask.
- Keep emails as short as the situation allows. Most professional emails should be under 150 words.
- Never use filler phrases: "I hope this email finds you well," "Just wanted to circle back," "Per my last email."
- For complex emails with multiple asks, use numbered items — not buried in paragraphs.
- Match the user's natural voice. Reference the Owner Profile for communication style — Atharva's tone is direct, structured, and visually-minded. The email should sound like him, not like a template.
- If the email involves a decision or commitment, flag it: "Note: this email commits you to X. Want to confirm?"

---

## Connectors Used

- **Gmail** — search for thread context, read previous messages, send drafts
- **Message compose tool** — present email variants in the native message widget
- **Knowledge base: OWNER_PROFILE.md** — for voice/positioning when representing the user
- **MCP Gateway: search_contacts, get_contact** — recipient lookup for context, tone, and history
- **Knowledge base: WORK_PROJECTS.md** — for project context in professional emails
