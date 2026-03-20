---
name: channel-knowledge
description: "Social media channel management — create, overview, and update channel profiles and strategies. Use when user asks to set up a channel, list channels, update channel metrics, or manage social media presence."
---

# Skill: Channel Knowledge

> **Scope:** This skill operates within the AI Operating System project only. It uses the AI OS MCP Gateway tools and Perplexity for platform research.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user wants to manage social media channel knowledge — creating new channel profiles, viewing channel inventory, or updating channel metrics and strategy. Trigger phrases include: "set up a channel," "create an Instagram for," "new LinkedIn channel," "channel overview," "how many channels," "channel status," "update channel metrics," "refresh strategy," or any request about managing social media presence.

This skill manages channel **identity and strategy** — the knowledge layer. For generating posts, use `/social-post`, `/content-gen`, or `/bharatvarsh`. For publishing posts, use `/post-to-social`.

---

## Mode Detection

| Signal Words | Mode |
|--------------|------|
| create, set up, new channel, register, launch, add a channel | **CREATE** |
| overview, list, status, how many, inventory, dashboard, all channels | **OVERVIEW** |
| update, refresh, change status, new metrics, pause, archive, strategy refresh | **UPDATE** |

If ambiguous, ask the user: "Do you want to create a new channel, see an overview of existing channels, or update one?"

---

## CREATE Mode

Use when the user wants to register a new social media channel with a tailored strategy.

### Step 1: Collect Inputs

Gather these from the user's message or ask interactively:

| Input | Required | Example |
|-------|----------|---------|
| Platform | Yes | Instagram, LinkedIn, Twitter/X, Facebook, YouTube |
| Channel name | Yes | "Bharatvarsh Instagram", "Atharva Singh LinkedIn" |
| Channel handle | If known | @bharatvarsh_official |
| Channel URL | If known | https://instagram.com/bharatvarsh_official |
| Purpose | Yes | "Visual storytelling for Bharatvarsh novel marketing" |
| Target audience | Yes | "18-35 Indian sci-fi readers, bookstagrammers" |
| Associated project(s) | Yes | bharatvarsh, ai-and-u, professional-brand |
| Content pillars | Yes (3-5) | lore-reveals, character-art, quote-cards, behind-the-scenes |

If the user provides all inputs in a single message, proceed directly. If not, ask for missing required fields before continuing.

If the user requests multiple platforms at once (e.g., "Set up LinkedIn and Twitter for my professional brand"), process each platform sequentially — 2 entries per platform.

### Step 2: Check for Duplicates

**`query_db`** — Check if a channel profile already exists for this platform + project:

```sql
SELECT id, title, metadata->>'channel_handle' as handle, metadata->>'status' as status
FROM knowledge_entries
WHERE sub_domain = 'social-channels'
  AND metadata->>'entry_type' = 'channel-profile'
  AND metadata->>'platform' = '{platform}'
  AND tags @> ARRAY['{project-slug}']
```

If a profile exists:
- If status is `active` — inform the user and ask if they want to update it instead (switch to UPDATE mode).
- If status is `archived` — offer to create a fresh one or reactivate.

### Step 3: Research Platform

**`mcp__perplexity__deep_research`** — Research the platform with a purpose-tailored query:

```
Best practices for running a {platform} account focused on {purpose} targeting {audience} in 2026.
Cover: current algorithm priorities, best content formats, optimal posting frequency,
growth strategies for new accounts, engagement tactics, analytics KPIs to track,
common mistakes to avoid, and tools/features unique to {platform}.
```

Save the research output for Step 5.

### Step 4: Generate Channel Profile Entry

**`insert_record`** — Insert into `knowledge_entries`:

| Column | Value |
|--------|-------|
| `title` | `"{Platform}: {Channel Name} — Channel Profile"` |
| `content` | Structured markdown with: purpose statement, target audience description, content pillars with brief explanations, launch context, associated project(s) |
| `domain` | `'project'` |
| `sub_domain` | `'social-channels'` |
| `source_type` | `'reference'` |
| `tags` | `['social-channel', '{platform}', 'channel-profile', '{project-slug}']` |
| `metadata` | See schema below |

**Profile metadata JSONB:**
```json
{
  "entry_type": "channel-profile",
  "platform": "{platform}",
  "channel_name": "{channel_name}",
  "channel_handle": "{handle_or_null}",
  "channel_url": "{url_or_null}",
  "purpose": "{purpose}",
  "target_audience": "{audience}",
  "associated_projects": ["{project-slug}"],
  "content_pillars": ["{pillar1}", "{pillar2}", "{pillar3}"],
  "status": "active",
  "launch_date": "{today}",
  "metrics": {
    "followers": 0,
    "engagement_rate": null,
    "posts_published": 0,
    "last_post_date": null,
    "last_metrics_update": "{today}"
  },
  "created_at": "{today}"
}
```

### Step 5: Generate Channel Strategy Entry

Synthesize the Perplexity research (Step 3) with the user's purpose and audience into a tailored strategy.

**`insert_record`** — Insert into `knowledge_entries`:

| Column | Value |
|--------|-------|
| `title` | `"{Platform}: {Channel Name} — Strategy & Playbook"` |
| `content` | Structured markdown strategy doc (see template below) |
| `domain` | `'project'` |
| `sub_domain` | `'social-channels'` |
| `source_type` | `'research_session'` |
| `tags` | `['social-channel', '{platform}', 'channel-strategy', '{project-slug}']` |
| `metadata` | `{"entry_type": "channel-strategy", "platform": "{platform}", "channel_name": "{channel_name}", "last_researched": "{today}", "research_source": "perplexity"}` |

**Strategy content template:**
```markdown
# {Platform} Strategy: {Channel Name}

## Content Mix
- {Format 1}: {frequency} — {description}
- {Format 2}: {frequency} — {description}
- {Format 3}: {frequency} — {description}

## Posting Schedule
- Frequency: {X posts per week}
- Best times: {platform-specific optimal times for target audience}
- Consistency rule: {minimum cadence to maintain algorithm favor}

## Growth Tactics (First 90 Days)
1. {Tactic 1}
2. {Tactic 2}
3. {Tactic 3}

## Voice & Tone
- {Platform-specific voice guidance tailored to purpose}

## Hashtag Strategy
- Primary: {3-5 core hashtags}
- Secondary: {5-10 rotating hashtags}
- Avoid: {hashtag anti-patterns}

## Engagement Playbook
- {How to respond to comments}
- {Community building tactics}
- {Collaboration/cross-promotion approach}

## KPIs to Track
| Metric | 30-Day Target | 90-Day Target |
|--------|---------------|---------------|
| Followers | {target} | {target} |
| Engagement Rate | {target}% | {target}% |
| {Platform-specific metric} | {target} | {target} |

## Platform-Specific Tips
- {Algorithm insight 1}
- {Algorithm insight 2}
- {Feature to leverage}

## Common Mistakes to Avoid
- {Mistake 1}
- {Mistake 2}
```

### Step 6: Log and Report

1. **`log_pipeline_run`** — `log_pipeline_run(slug='channel-knowledge', status='success')`

2. **Deliver to user:**
   - Confirmation: channel profile + strategy created
   - Summary of key strategy points
   - Channel handle and URL (if provided)
   - How downstream skills will use this: "When you run `/social-post` or `/content-gen` for {platform}, it will now load this channel's strategy automatically."

---

## OVERVIEW Mode

Use when the user wants to see their channel inventory.

### Step 1: Query Channel Inventory

**`query_db`** — Pull all channel profiles:

```sql
SELECT title,
       metadata->>'platform' as platform,
       metadata->>'channel_name' as name,
       metadata->>'channel_handle' as handle,
       metadata->>'status' as status,
       metadata->'metrics'->>'followers' as followers,
       metadata->'metrics'->>'engagement_rate' as engagement,
       metadata->'metrics'->>'posts_published' as posts,
       metadata->'metrics'->>'last_post_date' as last_post,
       metadata->'metrics'->>'last_metrics_update' as metrics_updated,
       metadata->>'associated_projects' as projects
FROM knowledge_entries
WHERE sub_domain = 'social-channels'
  AND metadata->>'entry_type' = 'channel-profile'
ORDER BY metadata->>'platform'
```

### Step 2: Format Dashboard

Present as a formatted table:

```
## Channel Overview

| Platform | Channel | Handle | Status | Followers | Engagement | Posts | Last Post | Project |
|----------|---------|--------|--------|-----------|------------|-------|-----------|---------|
| Instagram | Bharatvarsh IG | @bharatvarsh_official | active | 150 | 4.2% | 12 | 2026-03-15 | bharatvarsh |
| LinkedIn | Atharva Singh | /in/atharvasingh24 | active | 500+ | 3.1% | 8 | 2026-03-18 | professional |
```

### Step 3: Flag Issues

Highlight any:
- **Stale metrics** — `last_metrics_update` older than 30 days
- **Inactive channels** — status `active` but `last_post_date` older than 14 days
- **Unstarted channels** — status `planned` with no launch date
- **Zero-post channels** — `posts_published` is 0 for active channels

### Step 4: Deliver

Report the dashboard table plus any flagged issues with recommended actions.

---

## UPDATE Mode

Use when the user wants to change a channel's metrics, status, or strategy.

### Step 1: Find the Channel

**`search_knowledge`** — `search_knowledge(query="{platform} {channel_name} channel profile", sub_domain="social-channels", limit=2)`

If no match found, list available channels and ask the user to clarify.

### Step 2: Determine Update Type

| User Intent | Sub-mode |
|-------------|----------|
| "Update metrics: 500 followers, 3.2% engagement" | **Metrics Update** |
| "Pause the Instagram channel" / "Archive LinkedIn" | **Status Change** |
| "Refresh the YouTube strategy" | **Strategy Refresh** |

### Sub-mode: Metrics Update

1. Read the current profile entry
2. **`update_record`** — Update the metadata.metrics object:
   ```
   update_record(table="knowledge_entries", id="{profile-entry-id}", data={
     metadata: {
       ...existing_metadata,
       metrics: {
         followers: {new_value},
         engagement_rate: {new_value},
         posts_published: {new_value},
         last_post_date: {new_value_or_existing},
         last_metrics_update: "{today}"
       }
     }
   })
   ```
3. Report updated metrics vs. previous values

### Sub-mode: Status Change

Valid statuses: `active`, `paused`, `planned`, `archived`

1. **`update_record`** — Update metadata.status
2. If archiving, ask for confirmation first
3. Report status change

### Sub-mode: Strategy Refresh

1. **`mcp__perplexity__deep_research`** — Re-research the platform (same query as CREATE Step 3)
2. **`insert_record`** — Create a new strategy entry (new knowledge_entry)
3. Note in the old strategy entry that it has been superseded (update its tags to include `superseded`)
4. Report key changes from old to new strategy

### Step 3: Log

**`log_pipeline_run`** — `log_pipeline_run(slug='channel-knowledge', status='success')`

---

## Quality Rules

- **One profile per platform per project.** Never create duplicate channel profiles. Always check for existing entries first.
- **Research-backed strategies.** CREATE mode must use Perplexity deep research. Do not generate strategies from general knowledge alone.
- **Structured metadata.** All metadata fields must follow the schema. Do not add ad-hoc fields.
- **Graceful for new users.** If no channels exist yet (OVERVIEW returns empty), say so clearly and suggest using CREATE mode.
- **Metrics are user-provided.** This skill does not scrape social media. Metrics come from the user or from `/post-to-social` logging.
- **Downstream integration.** After creating a channel, remind the user that `/social-post`, `/content-gen`, `/bharatvarsh`, and `/post-to-social` will automatically load the channel context.

---

## Connectors Used

**MCP Gateway (postgres module):**
- `query_db` — list channels, check duplicates, find channels by project
- `insert_record` — create channel profile and strategy entries
- `update_record` — update metrics, status, or strategy

**MCP Gateway (core):**
- `search_knowledge` — find specific channels by name or platform
- `log_pipeline_run` — execution logging

**Perplexity:**
- `mcp__perplexity__deep_research` — platform-specific strategy research for CREATE and strategy refresh

**Knowledge Base Files:**
- `SOCIAL_CHANNELS.md` — channel data architecture and query reference
- `BRAND_IDENTITY.md` — brand context for channel voice alignment
- `OWNER_PROFILE.md` — professional positioning (for professional channels)
