---
name: contact-lookup
description: "Search and retrieve contact information from the AI OS contact database. Use when user asks 'Who is [name]?', 'Find contacts at [company]', 'Who do I know at [org]?', or any contact/people lookup query."
---

# Skill: Contact Lookup

> **Scope:** This skill operates within the AI Operating System project only. It uses the Contacts MCP module on the AI OS Gateway.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks about a person in their network, searches for contacts, or needs contact information. Trigger phrases include:
- "Who is [name]?"
- "Find contacts at [company]"
- "Who do I know at [organization]?"
- "What's [name]'s number/email?"
- "Show me my [tag] contacts" (e.g., "show me my HR contacts")
- "Who are my contacts in [domain]?" (e.g., "career network", "friends")
- Any request to look up, find, or search for a person

---

## Process

### Step 1: Determine Search Strategy

Based on the user's query, choose the right MCP tool:

- **Name lookup** → `search_contacts(query="name")` or `get_contact(name="name")`
- **Company search** → `search_contacts(query="company name")`
- **Tag filter** → `search_contacts(tags=["hr"])` or `search_contacts(tags=["friend"])`
- **Domain filter** → `search_contacts(domain_slug="career_network")`
- **Combined** → `search_contacts(query="...", tags=[...], contact_type="...")`

For specific "Who is X?" queries, use `get_contact(name="X")` which returns the full profile with relationships and important dates.

### Step 2: Present Results

**For single-contact lookups** (get_contact), present a rich profile:

**[Contact Name]**
- Phone: [phone]
- Email: [email or "—"]
- Company: [company or "—"]
- Title: [title or "—"]
- Type: [contact_type]
- Tags: [tags as comma-separated]
- Location: [location or "—"]
- Domain: [domain_slug or "unassigned"]
- Last contacted: [last_contacted_at or "unknown"]

If the contact has relationships, show:
**Relationships:** [name] → [relationship_type] → [other contact name]

If the contact has important dates, show:
**Dates:** [date_type]: [date_value] (e.g., Birthday: May 24)

If metadata contains extra phones or emails, include those.

**For multi-contact searches**, present as a compact table:

| Name | Phone | Company | Tags | Domain |
|------|-------|---------|------|--------|
| ... | ... | ... | ... | ... |

Show count: "Found X contacts matching '[query]'" (total Y in database)

### Step 3: Offer Follow-Up Actions

After presenting results, offer relevant actions:
- "Want me to update any of these contacts?"
- "Should I add a relationship between any of them?"
- If a contact has no email: "Want me to search Gmail for their email address?"
- If searching by company with few results: "Want me to search Gmail for more contacts at [company]?"

---

## Network Overview

If the user asks for a broad network view ("show me my network", "contact stats", "who do I know?"), use `get_contact_network`:

- `get_contact_network(group_by="domain")` — contacts by Life Graph domain
- `get_contact_network(group_by="tag")` — contacts by tag (HR, friend, family, etc.)
- `get_contact_network(group_by="company")` — contacts by organization
- `get_contact_network(group_by="type")` — professional vs personal vs both

Present as a summary with counts.

---

## Quality Rules

- Phone numbers should be displayed as-is from the database (already normalized to E.164).
- If a contact has tags like "service_provider", frame them accordingly — "Abdul Rouf — Driver, Charminar area" not just a raw data dump.
- For contacts with context embedded in names (e.g., "Aarushi Sinha IIM Mumbai"), the tags already capture this — use the tags to add context.
- Never expose the google_contact_id or internal UUIDs to the user unless they specifically ask.
- If search returns 0 results, suggest alternative searches: "No contacts found for 'X'. Try searching by company, tag, or a partial name."
- Respect PII: don't log contact details in any external system. Keep all data within the MCP boundary.

---

## Connectors Used

- **MCP Gateway: search_contacts** — full-text + filtered search
- **MCP Gateway: get_contact** — full profile with relationships + dates
- **MCP Gateway: get_contact_network** — grouped network view
- **MCP Gateway: update_contact** — for enrichment follow-ups
- **MCP Gateway: add_relationship** — for adding relationship links
