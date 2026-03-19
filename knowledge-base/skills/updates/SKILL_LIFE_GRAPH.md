# Skill: Life Graph

> **Scope:** First-class management of the Life Graph — 12 domains, health scores, context items, task associations, and milestone synchronization with Google Calendar. This skill is the single orchestrator for all 9 Life Graph + Calendar Sync MCP tools.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary). Claude Code can invoke via MCP tools directly.
>
> **Version:** 1.0 — New skill closing the largest tool coverage gap (9 tools).

---

## When to Use

Activate this workflow when the user asks about life domains, health scores, context tracking, milestone management, or any interaction with the Life Graph system.

**Trigger phrases:** "life graph", "domains", "how am I doing", "domain health", "add context to", "life areas", "what domains", "domain summary", "update life graph", "complete {item}", "milestone", "domain deep dive", "domain overview", "track this in life graph", "which domains need attention"

**Also activate when:** Another skill needs Life Graph context (e.g., `/morning-brief` calling `get_domain_summary`, `/action-planner` checking domain health). In those cases, the calling skill invokes the relevant tools directly — this skill handles standalone Life Graph interactions.

---

## Sub-Commands

This skill detects the user's intent and routes to the appropriate sub-command.

### OVERVIEW — "How am I doing?" / "Show my life graph"

**Tool calls (ordered sequence):**

1. **`list_domains`** → Get all domains with slugs (AIOSMCP)
2. **`get_domain_summary`** → Health scores for each domain (AIOSMCP)
3. **`get_domain_tree`** → Full tree structure with sub-items (AIOSMCP)

**Output format:**

```
## Life Graph Overview — {date}

| Domain | Health | Trend | Active Items |
|--------|--------|-------|--------------|
| {name} | {score}/100 | {↑↓→} | {count} |
| ... | ... | ... | ... |

### Attention Needed
{Any domain with health < 50 — flagged with context on why}

### Thriving
{Any domain with health > 80 — brief note}
```

### DOMAIN DEEP-DIVE — "Tell me about {domain}" / "How's my {domain}?"

**Tool calls (ordered sequence):**

1. **`get_domain_summary`** → Specific domain health + metadata (AIOSMCP)
2. **`get_domain_tasks`** → All tasks in this domain (AIOSMCP)
3. **`get_domain_tree`** → Sub-items and context items (AIOSMCP)

**Output format:**

```
## {Domain Name} — Deep Dive

**Health:** {score}/100 | **Trend:** {direction} | **Last Updated:** {date}

### Active Tasks ({count})
{Priority-ordered task list with status indicators}

### Context Items
{Recent observations, notes, and tracking items}

### Sub-Domains
{Tree view of child items if any}

### Recommendation
{AI-generated suggestion based on health score, task backlog, and context}
```

### ADD CONTEXT — "Add context to {domain}" / "Note that..."

**Tool calls:**

1. **`add_context_item`** → Write the observation/note to the domain (AIOSMCP)
   - Params: `domain_slug`, `content`, `item_type` (observation | note | milestone | metric)

**Auto-classification logic:**
- Contains a number or measurement → `item_type: 'metric'`
- Contains a date or deadline → `item_type: 'milestone'`
- Contains "noticed", "observed", "realized" → `item_type: 'observation'`
- Default → `item_type: 'note'`

**Output:** Confirmation with item ID, type, and domain. Brief updated context count.

### COMPLETE ITEM — "Complete {item}" / "Mark {item} done"

**Tool calls (ordered sequence):**

1. **`complete_context_item`** → Mark the context item as done (AIOSMCP)
2. **`get_domain_summary`** → Show updated health score (AIOSMCP)

**Output:** Completion confirmation with before/after health score if it changed.

### MILESTONE SYNC — "Sync milestones" / "Push milestone to calendar"

**Tool calls (ordered sequence):**

1. **`query_db`** → Get milestones from domain_context_items where item_type='milestone' (AIOSMCP)
   ```sql
   SELECT * FROM domain_context_items
   WHERE item_type = 'milestone' AND status = 'active'
   ORDER BY created_at DESC
   ```
2. For each unsynchronized milestone:
   - **`create_milestone_event`** → Create calendar event (AIOSMCP)
   - OR **`update_milestone_event`** → Update if already synced but changed (AIOSMCP)
   - OR **`delete_milestone_event`** → Remove if milestone was cancelled (AIOSMCP)
3. **`gcal_create_event`** → Create corresponding Google Calendar event (Google Calendar MCP)

**Output:** Sync summary showing created/updated/deleted calendar events with links.

---

## Cross-Skill Integration

The Life Graph is referenced by multiple other skills:

| Skill | How it uses Life Graph |
|-------|----------------------|
| `/morning-brief` | Calls `get_domain_summary` for daily pulse |
| `/weekly-review` | Calls `get_domain_summary` for weekly deltas |
| `/action-planner` | Calls `get_domain_tasks` + `get_domain_summary` to avoid duplicates and prioritize |
| `/create-task` | Associates tasks with domain slugs |

When these skills need Life Graph data, they call the tools directly. This skill handles **standalone** Life Graph management.

---

## Quality Rules

- **Domain slugs are canonical.** Always use `list_domains` to verify slug names before writing. Never guess a slug.
- **Health scores are read-only from this skill's perspective.** Health is computed by the `domain-health-scorer` pipeline. This skill reads scores, it does not set them.
- **Context items should be specific.** Reject vague entries like "things are good." Prompt for specifics: what changed, what metric, what observation.
- **Milestone dates must be absolute.** Convert relative dates ("next Thursday") to ISO 8601 before writing.
- **Calendar sync is opt-in.** Don't auto-sync milestones to calendar without user confirmation.

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `list_domains` | Life Graph | Overview, domain listing |
| `get_domain_tree` | Life Graph | Overview, deep-dive |
| `get_domain_tasks` | Life Graph | Deep-dive, task listing |
| `get_domain_summary` | Life Graph | All sub-commands — health context |
| `add_context_item` | Life Graph | Adding context/observations |
| `complete_context_item` | Life Graph | Completing items |
| `create_milestone_event` | Calendar Sync | Milestone → Calendar |
| `update_milestone_event` | Calendar Sync | Updating synced milestones |
| `delete_milestone_event` | Calendar Sync | Removing cancelled milestones |
| `query_db` | PostgreSQL | Milestone queries, custom lookups |
| `gcal_create_event` | Google Calendar MCP | Calendar event creation |

---

## Connectors Used

- **AIOSMCP** — Life Graph module (6 tools), Calendar Sync module (3 tools), PostgreSQL module (required)
- **Google Calendar** — For milestone sync (required for MILESTONE SYNC sub-command)
