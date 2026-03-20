# Social Channels — Data Architecture & Reference

## Overview

Social media channel knowledge is stored in the `knowledge_entries` table using `sub_domain='social-channels'`. Each channel consists of **two knowledge entries**: a **Channel Profile** (identity card) and a **Channel Strategy** (playbook). No new tables or migrations are needed.

Channels are managed via the `/channel-knowledge` skill (CREATE, OVERVIEW, UPDATE modes). Downstream skills (`/social-post`, `/content-gen`, `/bharatvarsh`, `/post-to-social`) automatically load channel context when generating or publishing content.

---

## Entry Types

### Channel Profile (`entry_type: "channel-profile"`)

The identity card — who the channel is, what it's for, current state.

| Column | Value |
|--------|-------|
| `title` | `"{Platform}: {Channel Name} — Channel Profile"` |
| `content` | Purpose, audience, content pillars, launch context |
| `domain` | `'project'` |
| `sub_domain` | `'social-channels'` |
| `source_type` | `'reference'` |
| `tags` | `['social-channel', '{platform}', 'channel-profile', '{project-slug}']` |

**Metadata schema:**
```json
{
  "entry_type": "channel-profile",
  "platform": "instagram | linkedin | twitter | facebook | youtube",
  "channel_name": "Bharatvarsh Instagram",
  "channel_handle": "@bharatvarsh_official",
  "channel_url": "https://instagram.com/bharatvarsh_official",
  "purpose": "Visual storytelling for Bharatvarsh novel marketing",
  "target_audience": "18-35 Indian sci-fi readers, bookstagrammers",
  "associated_projects": ["bharatvarsh"],
  "content_pillars": ["lore-reveals", "character-art", "quote-cards"],
  "status": "active | paused | planned | archived",
  "launch_date": "2026-03-20",
  "metrics": {
    "followers": 0,
    "engagement_rate": null,
    "posts_published": 0,
    "last_post_date": null,
    "last_metrics_update": "2026-03-20"
  },
  "created_at": "2026-03-20"
}
```

### Channel Strategy (`entry_type: "channel-strategy"`)

The platform-specific playbook — how to win on this platform for this purpose.

| Column | Value |
|--------|-------|
| `title` | `"{Platform}: {Channel Name} — Strategy & Playbook"` |
| `content` | Content mix, posting frequency, growth tactics, voice/tone, hashtags, engagement approach, KPIs |
| `domain` | `'project'` |
| `sub_domain` | `'social-channels'` |
| `source_type` | `'research_session'` |
| `tags` | `['social-channel', '{platform}', 'channel-strategy', '{project-slug}']` |

**Metadata schema:**
```json
{
  "entry_type": "channel-strategy",
  "platform": "instagram",
  "channel_name": "Bharatvarsh Instagram",
  "last_researched": "2026-03-20",
  "research_source": "perplexity"
}
```

---

## Query Patterns

### List all channels
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
       metadata->'metrics'->>'last_metrics_update' as metrics_updated
FROM knowledge_entries
WHERE sub_domain = 'social-channels'
  AND metadata->>'entry_type' = 'channel-profile'
ORDER BY metadata->>'platform'
```

### Find a specific channel
```
search_knowledge(query="{platform} {channel_name}", sub_domain="social-channels", limit=2)
```

### Find all channels for a project
```sql
SELECT title, metadata->>'platform' as platform, metadata->>'status' as status
FROM knowledge_entries
WHERE sub_domain = 'social-channels'
  AND metadata->>'entry_type' = 'channel-profile'
  AND tags @> ARRAY['{project-slug}']
```

### Get channel strategy
```sql
SELECT content, metadata->>'last_researched' as researched
FROM knowledge_entries
WHERE sub_domain = 'social-channels'
  AND metadata->>'entry_type' = 'channel-strategy'
  AND metadata->>'platform' = '{platform}'
  AND tags @> ARRAY['{project-slug}']
ORDER BY created_at DESC LIMIT 1
```

### Update channel metrics
```
update_record(table="knowledge_entries", id="{profile-entry-id}", data={
  metadata: {
    ...existing_metadata,
    metrics: {
      followers: 150,
      engagement_rate: 4.2,
      posts_published: 12,
      last_post_date: "2026-03-18",
      last_metrics_update: "2026-03-20"
    }
  }
})
```

---

## Freshness Policy

| Data | Refresh Cadence | Method |
|------|-----------------|--------|
| Metrics (followers, engagement) | User-provided or monthly review | `/channel-knowledge` UPDATE mode |
| Strategy & playbook | Quarterly or on major algorithm change | `/channel-knowledge` UPDATE → Strategy Refresh |
| Channel profile (purpose, audience) | Rarely — only when channel direction changes | `/channel-knowledge` UPDATE mode |

---

## Integration Points

### Downstream Skills

These skills load channel knowledge before generating content:

| Skill | What It Loads | How |
|-------|---------------|-----|
| `/social-post` | Channel profile + strategy for the target platform | `search_knowledge(query="{platform} channel profile", sub_domain="social-channels")` |
| `/content-gen` | Channel context for the target platform | `search_knowledge(query="{platform} channel", sub_domain="social-channels")` |
| `/bharatvarsh` | Channel strategy in Content Mode | `search_knowledge(query="{platform} bharatvarsh channel", sub_domain="social-channels")` |
| `/post-to-social` | Channel profile for format specs + handle | `search_knowledge(query="{platform} channel profile", sub_domain="social-channels")` |

All downstream integrations fall back gracefully — if no channel exists for the target platform, they proceed with default behavior.

### Channel → Content → Publish Flow

```
/channel-knowledge CREATE  →  Channel profile + strategy stored
/social-post or /content-gen  →  Loads channel context → generates tailored content
/post-to-social  →  Loads channel profile → publishes with correct handle/format
/channel-knowledge UPDATE  →  Metrics updated after post performance data
```

---

## Project Slugs

Use these slugs in tags and `associated_projects`:

| Project | Slug |
|---------|------|
| Bharatvarsh novel & transmedia | `bharatvarsh` |
| AI&U YouTube channel | `ai-and-u` |
| Professional brand (Atharva Singh) | `professional-brand` |
| AI Operating System | `ai-os` |

---

## Status Values

| Status | Meaning |
|--------|---------|
| `active` | Channel is live and accepting content |
| `planned` | Channel registered but not yet launched |
| `paused` | Temporarily inactive (e.g., seasonal break) |
| `archived` | Permanently retired — kept for historical reference |
