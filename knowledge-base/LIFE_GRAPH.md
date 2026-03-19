# Life Graph — Domain Organization System

> **Version:** 2.0
> **Last Updated:** 2026-03-19
> **Status:** Active

---

## Overview

The Life Graph organizes all life domains into a queryable hierarchy stored in PostgreSQL with ltree (hybrid adjacency list). It replaces the old project-centric model with a life-domain-aware system where every task, objective, and automation is tagged with the life area it advances.

## Domain Hierarchy

```
Life Graph
├── Private Affairs
│   ├── 001 — Friends and Gatherings
│   ├── 002 — Health
│   ├── 003 — Wife and Family
│   └── 005 — Miscellaneous Tasks
├── Personal Projects
│   ├── 004 — Novel Promotion
│   └── 006 — Managing AI OS
└── Work
    ├── 007 — Networking
    ├── 008 — Admin
    ├── 010 — Career Network
    └── 011 — Zealogics Projects
```

## Context Types

Three types of items exist within each domain:

| Type | Description | Storage | Sync |
|------|-------------|---------|------|
| **Tasks** | Discrete, completable work items | `tasks` table (domain_id FK) | Google Tasks |
| **Objectives** | Overarching, long-term goals | `domain_context_items` (type=objective) | DB only |
| **Automations** | Workflows to reduce manual effort | `domain_context_items` (type=automation) | DB only |

The relationship is directional: you complete **Tasks** to achieve **Objectives**. You build **Automations** to accelerate Task completion.

## Domain Details

### Private Affairs

| # | Domain | Objectives | Automations | Key Items |
|---|--------|-----------|-------------|-----------|
| 001 | Friends and Gatherings | — | Birthday reminders + auto-messages | Social connections, meetups |
| 002 | Health | Start going to gym | — | Physical fitness, wellness |
| 003 | Wife and Family | Srisailam trip | — | Family relationships, events |
| 005 | Miscellaneous Tasks | — | — | Ad-hoc errands (car servicing, etc.) |

### Personal Projects

| # | Domain | Objectives | Automations | Key Items |
|---|--------|-----------|-------------|-----------|
| 004 | Novel Promotion | Content pipeline, forum content, promotional pipelines | — | Bharatvarsh marketing |
| 006 | Managing AI OS | ChatGPT version, content automation | — | AI OS development + infrastructure |

### Work

| # | Domain | Objectives | Automations | Key Items |
|---|--------|-----------|-------------|-----------|
| 007 | Networking | Growing LinkedIn presence | — | Professional brand building |
| 008 | Admin | Expense tracking | Yearly triggers (IT return, insurance, car) | Financial administration |
| 010 | Career Network | — | — | Professional network, HR contacts, recruiters |
| 011 | Zealogics Projects | — | — | TPM delivery, client projects, stakeholder mgmt |

## Database Architecture

### Schema: Hybrid Adjacency List + ltree

```sql
-- Three new tables:
life_domains          -- Hierarchical tree (ltree + parent_id FK)
domain_context_items  -- Objectives and Automations per domain
domain_health_snapshots -- Weekly health scores per domain

-- Two modified tables:
tasks.domain_id       -- FK to life_domains (nullable)
projects.domain_id    -- FK to life_domains (nullable)

-- New extension:
ltree                 -- Hierarchical path queries
```

### Query Patterns

```sql
-- All tasks under Work (recursive, includes networking, admin, zealogics projects)
SELECT * FROM tasks t
JOIN life_domains d ON t.domain_id = d.id
WHERE d.path <@ 'work';

-- Domain breadcrumb
SELECT * FROM get_domain_breadcrumb('health');
-- Returns: Private Affairs → Health

-- Domain summary (aggregate stats)
SELECT get_domain_summary('private_affairs');
-- Returns: JSON with task counts, objective counts, etc.
```

## MCP Tools (8 tools in life_graph.py module)

| Tool | Purpose | Key Parameters |
|------|---------|---------------|
| `list_domains` | List all domains with hierarchy | parent_slug?, status?, include_children? |
| `get_domain_tree` | Full hierarchy as nested JSON | root_slug? |
| `get_domain_tasks` | Tasks under domain (recursive) | domain_slug, status?, priority? |
| `get_domain_summary` | Aggregate stats for domain subtree | domain_slug |
| `create_domain` | Add new domain to tree | name, slug, parent_slug?, domain_number? |
| `update_domain` | Modify domain properties | domain_slug, name?, status?, priority_weight? |
| `add_context_item` | Add objective or automation | domain_slug, item_type, title |
| `complete_context_item` | Mark objective/automation done | item_id |

Additionally, `create_task` and `list_tasks` now accept optional `domain_slug` parameter.

## Health Scoring

Weekly computation by domain-health-scorer pipeline (Sunday 6 PM IST):

```
health_score = task_completion_rate × 0.40
             + objective_progress × 0.30
             + recency_score × 0.20
             + automation_coverage × 0.10
```

Recency decay: 0-3d = 1.0, 4-7d = 0.75, 8-14d = 0.50, 15-30d = 0.25, 30d+ = 0.10

## Skill Integration

| Skill | Integration |
|-------|-----------|
| /morning-brief | DOMAIN HEALTH section showing all 11 domains with status indicators |
| /weekly-review | LIFE DOMAIN REVIEW table with per-domain stats and rebalancing alerts |
| /session-resume | Domain context recovery using get_domain_tree and get_domain_tasks |
| /action-planner | Domain-aware task creation with domain_slug tagging |

## Adding New Domains

Use `create_domain` MCP tool. Domain numbers continue from 012+. Current range: 001-011 (009 archived). Suggested future domains:
- 012 — Learning & Skill Development
- 013 — Creative Practice (AI&U, digital art)
- 014 — Financial Planning & Investments

## Design Decision: PostgreSQL over Neo4j

The original Reference Architecture specified Neo4j AuraDB for the Life Graph. This was retired in favor of PostgreSQL ltree because:
1. The Life Graph is a simple tree (3-4 levels, ~15 nodes), not a complex graph
2. ltree handles hierarchical queries natively without new infrastructure
3. Zero additional cost (runs on existing Cloud SQL)
4. No data duplication or sync problems between databases
