# Skill: Draft Email v2.0

> **Scope:** Email drafting with tone variants, Gmail thread context, and contact enrichment. Now auto-pulls recipient context from the contact database before drafting, and optionally logs communications to the knowledge base.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary).
>
> **Version:** 2.0 — Minor upgrade adding contact enrichment pre-flight and communication logging.

---

## When to Use

Activate this workflow when the user asks to draft, write, compose, or review an email or formal message.

**Trigger phrases:** "draft email", "write an email", "compose email", "email to {name}", "reply to", "follow up with", "draft a message to", "email about"

---

## Process

### Step 0: Contact Enrichment (NEW in v2.0)

Before drafting, pull context about the recipient:

1. **`search_contacts`** → Look up recipient in the contact database (AIOSMCP)
   - Search by name or email address
   - Pull: role, company, relationship notes, tags

2. **`get_upcoming_dates`** → Check for upcoming dates for this contact (AIOSMCP)
   - If birthday is within 3 days, suggest mentioning it
   - If anniversary or important date is close, flag it

3. **`gmail_search_messages`** → Last 3 email threads with this recipient (Gmail MCP)
   - Query: `from:{email} OR to:{email}`
   - Context: what have you been discussing? What was the last exchange?

This context is injected into the drafting step to produce a more personalized, context-aware email.

### Step 1: Understand the Email

Determine from user input:
- **Recipient:** Who is this to?
- **Purpose:** What's the goal? (request, follow-up, introduction, thank you, update, cold outreach)
- **Tone:** Professional, warm, formal, casual, urgent
- **Thread context:** Is this a reply or new conversation?

If replying to an existing thread:

4. **`gmail_read_thread`** → Read the full thread for context (Gmail MCP)

### Step 2: Draft the Email

Using all context gathered (contact profile, recent threads, upcoming dates, user's intent):

**Draft structure:**
- **Subject line:** Clear, specific, action-oriented
- **Opening:** Context-appropriate (relationship-aware, not generic "I hope this email finds you well")
- **Body:** Purpose + key points + supporting detail
- **Close:** Clear next step / CTA
- **Signature:** Appropriate to formality level

**Tone variants:** Produce 2 tone variants by default:
1. **Professional:** Balanced, clear, slightly formal
2. **Warm:** Personal, friendly, relationship-forward

Let the user choose or request a third variant.

### Step 3: Special Cases

**Birthday proximity (from contact enrichment):**
- If birthday is within 3 days and the email purpose allows, suggest adding a brief mention:
  > "I noticed {name}'s birthday is {in 2 days / today}. Want me to add a brief mention?"

**Cold outreach:**
- If no prior email history exists, adjust tone to introductory
- Reference any shared connections from `get_contact_network` if available

**Follow-up:**
- If this is a follow-up on a prior email, reference the original thread clearly
- Suggest appropriate follow-up timing

### Step 4: Create Draft

5. **`gmail_create_draft`** → Save as draft in Gmail (Gmail MCP)
   - Offer: "Save as Gmail draft?" → creates draft ready to send

### Step 5: Communication Log (NEW in v2.0)

6. **`insert_record`** → Optionally log the communication (AIOSMCP)
   - Offer: "Log this communication to the knowledge base?"
   - If yes: `table: 'knowledge_entries'`, `entry_type: 'communication-log'`, `content: {recipient, subject, key_points, date}`
   - This makes the communication searchable by other skills and visible in weekly reviews

### Output Format

```
## Email Draft — {Subject}

**To:** {recipient name} ({email})
**Context:** {relationship notes from contact DB, last email date}

---

### Variant 1: Professional
**Subject:** {subject line}

{email body}

---

### Variant 2: Warm
**Subject:** {subject line}

{email body}

---

{If birthday: "💡 {name}'s birthday is {date}. Mention it?"}

**Actions:** Save as Gmail draft? | Log communication? | Adjust tone?
```

---

## Quality Rules

- **Contact enrichment is mandatory.** Always look up the recipient before drafting. Even if not found, the attempt informs the tone.
- **No generic openings.** "I hope this email finds you well" is banned. Use context-specific openings based on the relationship.
- **Two tone variants by default.** Give the user a choice.
- **Respect thread context.** If replying, the draft must clearly connect to the prior conversation.
- **Communication logging is optional.** Always offer, never auto-log without consent.
- **PII handling.** Contact details from the DB should not be included in the email body unless the user explicitly requests it.

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `search_contacts` | Contacts (AIOSMCP) | Recipient lookup |
| `get_upcoming_dates` | Contacts (AIOSMCP) | Birthday/date check |
| `gmail_search_messages` | Gmail MCP | Recent thread history |
| `gmail_read_thread` | Gmail MCP | Full thread context (replies) |
| `gmail_create_draft` | Gmail MCP | Save draft |
| `insert_record` | PostgreSQL (AIOSMCP) | Communication logging |

---

## Connectors Used

- **Gmail** — Thread search, thread reading, draft creation (required)
- **AIOSMCP** — Contacts module (2 tools), PostgreSQL module (1 tool)
