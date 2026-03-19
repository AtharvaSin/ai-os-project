---
name: life-graph
description: "Life Graph domain management — overview, deep-dive, add context, complete items, milestone sync. Use when user asks about domains, health scores, life areas, or 'how am I doing'."
---

# Skill: Life Graph

> **Scope:** This skill operates within the AI Operating System project only. It uses the Life Graph MCP module and Calendar Sync module on the AI OS Gateway.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks about their Life Graph, life domains, health scores, progress across life areas, or wants to manage domain context and milestones. Trigger phrases include:

- "How am I doing?"
- "Show my life graph"
- "Tell me about my career" / "How's my health domain?"
- "Add a note to [domain]"
- "Complete [item]"
- "Sync milestones to calendar"
- "What domains need attention?"
- "Life overview"
- "Domain health"
- Any reference to specific domain slugs (e.g., "career_growth", "health_fitness", "creative_projects")

For journal capture, use `/capture-entry` instead. For task management, use the task tools directly. This skill is specifically for the Life Graph domain structure, health scoring, context items, and milestone sync.

---

## Sub-Command Detection

Determine the sub-command from the user's intent:

| Intent | Sub-Command |
|--------|-------------|
| "How am I doing?", "show life graph", "life overview", "domain health" | **OVERVIEW** |
| "Tell me about {domain}", "deep dive into {domain}", "{domain} status" | **DOMAIN DEEP-DIVE** |
| "Add context to {domain}", "note that...", "add observation", "log metric" | **ADD CONTEXT** |
| "Complete {item}", "mark {item} done", "finish {item}" | **COMPLETE ITEM** |
| "Sync milestones", "push milestones to calendar", "calendar sync" | **MILESTONE SYNC** |

If the intent is ambiguous, default to OVERVIEW and ask the user if they want to drill into a specific domain.

---

## OVERVIEW

Use when the user wants a high-level view of all life domains.

### Step 1: Load All Domains

- **`list_domains`** — Retrieve all domains with their slugs, names, and metadata.

### Step 2: Get Health Scores

- **`get_domain_summary`** — For each domain, retrieve the current health score, trend, active item count, and last updated timestamp. If the gateway supports batch retrieval, call once; otherwise iterate over domains.

### Step 3: Get Tree Structure

- **`get_domain_tree`** — Retrieve the full hierarchical tree to understand sub-domains and nesting.

### Step 4: Deliver

Present a summary table:

```
## Life Graph Overview

| Domain | Health | Trend | Active Items | Last Updated |
|--------|--------|-------|-------------|--------------|
| Career Growth | 72/100 | +5 | 4 | 2 days ago |
| Health & Fitness | 45/100 | -3 | 2 | 5 days ago |
| ... | ... | ... | ... | ... |

### Attention Needed
- **Health & Fitness** (45/100) — Below 50 threshold. Consider adding context or reviewing active items.
- **[domain]** ([score]) — [reason for flag]

### Recommendation
[1-2 sentence suggestion based on lowest-scoring or declining domains]
```

Flag any domain scoring below 40 with a warning. Flag any domain with a negative trend over the last 2 readings.

---

## DOMAIN DEEP-DIVE

Use when the user asks about a specific domain.

### Step 1: Identify Domain

Parse the domain slug from the user's message. If the user uses a natural name (e.g., "career", "health"), map it to the canonical slug by calling **`list_domains`** first and matching.

### Step 2: Load Domain Data

- **`get_domain_summary`** — Health score, trend, description, active items for the specific domain.
- **`get_domain_tasks`** — All tasks associated with this domain, with status and priority.
- **`get_domain_tree`** — Sub-items, context items, and hierarchical structure for this domain.

### Step 3: Deliver

```
## {Domain Name}

**Health Score:** {score}/100 ({trend})
**Description:** {description}
**Active Items:** {count}

### Priority Tasks
| Task | Priority | Status | Due |
|------|----------|--------|-----|
| ... | ... | ... | ... |

### Context Items
| Item | Type | Added | Status |
|------|------|-------|--------|
| ... | note/metric/observation/milestone | ... | active/completed |

### AI Recommendation
Based on the current health score and active items:
- [Specific, actionable recommendation]
- [Second recommendation if applicable]
```

Order tasks by priority (urgent > high > medium > low), then by due date.

---

## ADD CONTEXT

Use when the user wants to add a note, observation, metric, or milestone to a domain.

### Step 1: Parse Input

Extract from the user's message:
- **Domain** — which domain this context belongs to (verify slug via `list_domains` if needed)
- **Content** — the actual note, observation, or metric
- **Type** — auto-classify based on content:

| Signal | Type |
|--------|------|
| Contains a number, measurement, percentage, or unit (e.g., "ran 5km", "weight 72kg", "score 85%") | `metric` |
| Contains a date, deadline, or target date (e.g., "by March 30", "deadline April 15") | `milestone` |
| Contains "noticed", "observed", "seems like", "pattern" | `observation` |
| Default (anything else) | `note` |

If the type is ambiguous, default to `note` — the user can correct it.

### Step 2: Write Context Item

- **`add_context_item`** — Write the context item to the domain with the classified type and content.

### Step 3: Confirm

```
Added to **{Domain Name}**:
- **Type:** {type}
- **Content:** {content}
- **Added:** {timestamp}
```

If the item is a milestone, ask: "Want me to sync this milestone to your calendar?"

---

## COMPLETE ITEM

Use when the user wants to mark a context item or milestone as completed.

### Step 1: Identify Item

Parse the item name or description from the user's message. If ambiguous, list active items in the likely domain and ask the user to confirm.

### Step 2: Complete

- **`complete_context_item`** — Mark the item as completed.

### Step 3: Show Updated State

- **`get_domain_summary`** — Retrieve the updated domain summary to show the impact.

```
Completed: **{item description}**

**{Domain Name}** updated:
- Health Score: {score}/100
- Remaining Active Items: {count}
```

---

## MILESTONE SYNC

Use when the user wants to push active milestones to Google Calendar.

### Step 1: Retrieve Active Milestones

- **`query_db`** — Get all active milestones:
  ```sql
  SELECT id, domain_slug, content, target_date, status
  FROM context_items
  WHERE item_type = 'milestone' AND status = 'active'
  ORDER BY target_date ASC
  ```

### Step 2: Sync to Calendar

For each milestone:

- Check if a calendar event already exists (by matching title pattern or stored event_id).
- If **new milestone**: **`create_milestone_event`** to create the tracking record, then **`gcal_create_event`** to create the actual calendar event.
- If **existing but date changed**: **`update_milestone_event`** to update the tracking record, then **`gcal_update_event`** to update the calendar.
- If **milestone completed or deleted**: **`delete_milestone_event`** to clean up the tracking record.

### Step 3: Report

```
## Milestone Sync Report

| Milestone | Domain | Date | Action |
|-----------|--------|------|--------|
| ... | ... | ... | Created / Updated / Deleted |

**Total:** {count} milestones synced to Google Calendar.
```

---

## Quality Rules

- **Domain slugs are canonical.** Always verify slugs via `list_domains` before using them. Never guess or fabricate a slug.
- **Health scores are read-only.** They are computed by the `domain-health-scorer` pipeline. Never attempt to set or override a health score directly.
- **Context items should be specific.** "Things are going okay" is not useful. "Completed 3 of 5 interview prep sessions this week" is useful. Guide the user toward specificity if their input is vague.
- **Milestone dates must be absolute.** If the user says "next Friday" or "in two weeks," convert to an absolute date (YYYY-MM-DD) before storing. Use the current date from context to compute.
- **Calendar sync is opt-in.** Never automatically push milestones to calendar. Always confirm with the user first.
- **Privacy first.** Domain health data is personal. Never log domain details to external systems. Keep all data within the MCP boundary.

---

## Connectors Used

**MCP Gateway (life_graph module):**
- `list_domains` — retrieve all domains with slugs
- `get_domain_tree` — hierarchical domain structure
- `get_domain_tasks` — tasks within a domain
- `get_domain_summary` — health score, trend, active items
- `add_context_item` — write a note, metric, observation, or milestone
- `complete_context_item` — mark a context item as completed

**MCP Gateway (calendar_sync module):**
- `create_milestone_event` — create milestone tracking record
- `update_milestone_event` — update milestone tracking record
- `delete_milestone_event` — remove milestone tracking record

**MCP Gateway (postgres module):**
- `query_db` — retrieve active milestones for sync

**Google Calendar Connector:**
- `gcal_create_event` — create calendar event for milestone
- `gcal_update_event` — update calendar event for milestone
