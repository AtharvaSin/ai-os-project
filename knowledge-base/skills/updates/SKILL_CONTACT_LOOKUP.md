# Skill: Contact Lookup

> **Scope:** Surfaces contact information from the 891-contact database with enrichment from Gmail threads, Calendar events, and upcoming dates. Acts as a pre-flight step for `/draft-email` and meeting prep workflows.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary).
>
> **Version:** 1.0 — New skill unlocking 8 contact tools and the full contact database.

---

## When to Use

Activate this workflow when the user wants to look up a person, prepare for a meeting with someone, or get context before reaching out to a contact.

**Trigger phrases:** "look up {name}", "who is {name}", "contact info for", "find contact", "what do I know about {name}", "tell me about {name}", "who do I know at {company}", "contacts at {company}", "find people at {org}", "prep for meeting with {name}"

**Also activate when:** The user is about to draft an email or prepare for a meeting and mentions a person's name — offer to pull up their contact profile first.

---

## Process

### Step 1: Search the Contact Database

**Tool call:**

1. **`search_contacts`** → Search contacts by name, email, or company (AIOSMCP)
   - Params: `query` (the search term from user)
   - This searches across name, email, company, and notes fields

If `search_contacts` returns no results, try a broader query:

2. **`query_db`** → Fallback fuzzy search (AIOSMCP)
   ```sql
   SELECT id, name, email, phone, company, role, tags, notes, source
   FROM contacts
   WHERE name ILIKE '%{query}%'
      OR email ILIKE '%{query}%'
      OR company ILIKE '%{query}%'
      OR notes ILIKE '%{query}%'
   LIMIT 10
   ```

If multiple matches found, present the list and ask which contact:
> "Found {N} contacts matching '{query}'. Which one?"

### Step 2: Enrich with Upcoming Dates

3. **`get_upcoming_dates`** → Check for birthdays/anniversaries for this contact (AIOSMCP)
   - If a date is within 7 days, highlight it prominently

### Step 3: Enrich with Communication History

4. **`gmail_search_messages`** → Last 5 email threads with this contact (Gmail MCP)
   - Query: `from:{email} OR to:{email}` with limit 5
   - Extract: subject, date, brief snippet

5. **`gcal_list_events`** → Recent and upcoming meetings with this contact (Google Calendar MCP)
   - Search for events containing the contact's name or email
   - Show: last 2 past meetings + next 2 upcoming

### Step 4: Get Relationship Context

6. **`get_contact_brief`** → Relationship summary if available (AIOSMCP)
   - Pulls relationship notes, interaction history summary, and context

7. **`get_contact_network`** → Related contacts (same company, shared tags) (AIOSMCP)
   - Shows who else you know at the same organization

### Step 5: Present the Profile

**Output format:**

```
## {Full Name}

**Email:** {email}
**Phone:** {phone or "—"}
**Company:** {company} | **Role:** {role or "—"}
**Tags:** {tags}
**Source:** {how this contact entered the system}

### Relationship Notes
{Notes from contacts database — interaction history, context, how you know them}

### Upcoming Dates
{Birthday, anniversary if within 30 days. "🎂 Birthday in {N} days!" if close}
{If none: "No upcoming dates on file."}

### Recent Email Activity
| Date | Subject | Direction |
|------|---------|-----------|
| {date} | {subject} | Sent / Received |
{Last 5 threads. If none: "No recent email history."}

### Meeting History
**Last meeting:** {date — subject}
**Next meeting:** {date — subject}
{If none: "No meetings on record."}

### Network
{Other contacts at the same company or with shared tags}
{If none: "No related contacts found."}
```

### Step 6: Offer Next Actions

After presenting the profile, offer contextual next steps:

- **If meeting is upcoming:** "Want me to help prep for this meeting?"
- **If birthday is close:** "Want me to draft a birthday message?"
- **Always offer:** "Draft an email?" → chains to `/draft-email` with contact context pre-loaded
- **Always offer:** "Schedule a meeting?" → chains to calendar tools

---

## Company Lookup Mode

If the user asks "who do I know at {company}":

1. **`search_contacts`** → Search by company name (AIOSMCP)
2. Present a contact list:

```
## Contacts at {Company}

| Name | Role | Email | Last Contact |
|------|------|-------|-------------|
| {name} | {role} | {email} | {last email date or "—"} |

{Count} contacts found. Select one for full profile.
```

---

## Quality Rules

- **Privacy-conscious.** When displaying contact info in shared contexts, offer to mask email/phone.
- **No stale enrichment.** Gmail and Calendar queries always pull live data.
- **Handle missing data gracefully.** Many contacts may have only name + email. Don't show empty sections — skip them.
- **Fuzzy matching.** If exact match fails, try partial matches and present options.
- **Speed.** For a simple "who is X" query, the basic profile (Steps 1-2) should return immediately. Email/Calendar enrichment can be optional.

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `search_contacts` | Contacts (AIOSMCP) | Primary search |
| `get_contact_brief` | Contacts (AIOSMCP) | Relationship context |
| `get_contact_network` | Contacts (AIOSMCP) | Related contacts |
| `get_upcoming_dates` | Contacts (AIOSMCP) | Birthday/anniversary check |
| `query_db` | PostgreSQL (AIOSMCP) | Fallback fuzzy search |
| `gmail_search_messages` | Gmail MCP | Email history |
| `gcal_list_events` | Google Calendar MCP | Meeting history |

---

## Connectors Used

- **AIOSMCP** — Contacts module (3 tools), PostgreSQL module (1 tool)
- **Gmail** — Email thread history (enrichment)
- **Google Calendar** — Meeting history (enrichment)
