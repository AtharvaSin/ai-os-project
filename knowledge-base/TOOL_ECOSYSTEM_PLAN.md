# AI OS Tool Ecosystem Plan

> **Purpose:** Reference architecture for the three-tier MCP and tool access system. Governs how new tools are added and where they live.
>
> **Last updated:** 2026-03-16 (Phase 1-3a complete. MCP Gateway live with all 22 tools. Telegram module deployed. Dashboard PWA deployed on Cloud Run.)

---

## Architecture: Three Tiers

### Tier 1 — Directory Connectors (Zero Infrastructure)
One-click OAuth via Claude.ai connector directory. No cost. No maintenance. Available in Claude.ai chat only.

| Tool | Status | Capabilities |
|------|--------|-------------|
| Gmail | Connected | Search, read, draft, send, threads |
| Google Calendar | Connected | List, create, update events, find free time |
| Google Drive | Connected | Search, read files (read-only) |
| Slack | Pending | Search messages, read channels |
| Canva | Pending | Create designs, access templates |
| GitHub | Check directory | Repos, PRs, issues |
| Notion | Deprioritized | Not needed — Cloud SQL is single source of truth. Dashboard replaces Notion workspace. See INTERFACE_STRATEGY.md §Rejected Alternatives. |

### Tier 2 — Unified MCP Gateway (ONE Cloud Run Service)
Single FastAPI container on Cloud Run. Scales to zero. All custom tool access. Accessible from Claude.ai (custom connector URL), Claude Code (MCP config), and Category B/C workflows (HTTP).

**Deployed at:** Cloud Run, asia-south1, project ai-operating-system-490208
**Service URL:** https://ai-os-gateway-1054489801008.asia-south1.run.app
**Service account:** ai-os-cloud-run
**Image:** ai-os-gateway:be26f7c (auto-deployed via Cloud Build)

| Module | Priority | Tool Calls | Status |
|--------|----------|-----------|--------|
| PostgreSQL | P0 | query_db, insert_record, update_record, get_schema, search_knowledge, log_pipeline_run | LIVE (6 tools) |
| Google Tasks | P1 | list_tasks, create_task, update_task, complete_task, sync_to_db | LIVE (5 tools) |
| Drive (write) | P1 | upload_file, create_doc, create_folder | LIVE (3 tools) |
| Calendar Sync | P1 | create_milestone_event, update_milestone_event, delete_milestone_event | LIVE (3 tools) |
| Telegram | P1 | send_telegram_message, send_telegram_template, send_telegram_inline_keyboard, edit_telegram_message, get_telegram_bot_info | LIVE (5 tools) |
| Bharatvarsh Admin | P2 | query_lore, get_character, search_timeline, forum_moderate | Not started |
| Lore Search | P2 | semantic_search_lore, get_lore_by_topic (pgvector) | Not started |
| WhatsApp | P3 | send_message, send_template, get_message_status | Not started |
| Content Tracker | P3 | log_post, get_calendar, update_status, get_metrics | Not started |

**Project structure:**
```
mcp-servers/ai-os-gateway/
├── app/
│   ├── main.py              ← FastAPI + MCP server
│   ├── config.py            ← Secrets, DB pool, OAuth
│   ├── mcp_registry.py      ← Tool registration system
│   ├── modules/             ← One file per tool
│   │   ├── postgres.py      ← LIVE (6 tools)
│   │   ├── google_tasks.py  ← LIVE (5 tools)
│   │   ├── drive_write.py   ← LIVE (3 tools)
│   │   ├── calendar_sync.py ← LIVE (3 tools)
│   │   ├── telegram.py      ← LIVE (5 tools)
│   │   ├── bharatvarsh.py   ← Not started
│   │   ├── whatsapp.py      ← Not started
│   │   └── content.py       ← Not started
│   └── auth/
│       ├── google_oauth.py  ← Shared Google OAuth (refresh token)
│       └── bearer.py        ← API key validation
├── Dockerfile
├── requirements.txt
└── cloudbuild.yaml
```

### Dashboard Service (Separate Cloud Run Service)
Next.js PWA on Cloud Run. Scales to zero. AI-powered command center with project views, Gantt, task board, and milestone management. Reads from Cloud SQL. See INTERFACE_STRATEGY.md for full specification.

**Deployed at:** Cloud Run, asia-south1, project ai-operating-system-490208
**Service URL:** https://ai-os-dashboard-sv4fbx5yna-el.a.run.app
**Service account:** ai-os-cloud-run (shared with MCP Gateway)
**Image:** ai-os-dashboard:latest (~78MB)
**Deployed:** 2026-03-15T09:57:23Z (manual deploy, no Cloud Build trigger)

**Project structure:**
```
dashboard/
├── src/
│   ├── app/                 ← Next.js App Router
│   │   ├── page.tsx         ← Command Center (home) — LIVE
│   │   ├── projects/        ← Project detail views — LIVE
│   │   ├── tasks/           ← Task board (Kanban) — LIVE
│   │   ├── gantt/           ← Interactive Gantt — LIVE
│   │   ├── auth/            ← Sign-in + error pages — LIVE
│   │   └── api/             ← API routes (Cloud SQL access) — LIVE
│   ├── components/          ← 16 React components
│   │   ├── layout/          ← Sidebar, MobileNav
│   │   ├── ProjectCard.tsx
│   │   ├── KanbanBoard.tsx  ← @hello-pangea/dnd drag-and-drop
│   │   ├── GanttChart.tsx   ← Custom CSS Grid
│   │   ├── QuickAddTask.tsx ← Quick add modal
│   │   └── ...              ← 11 more components
│   ├── lib/                 ← DB client (pg), auth (NextAuth), types, utils
│   └── middleware.ts        ← Auth gate (all routes)
├── public/
│   ├── manifest.json        ← PWA manifest
│   ├── sw.js                ← Service worker
│   ├── offline.html         ← Offline fallback
│   └── icons/               ← App icons (192px, 512px)
├── Dockerfile               ← Multi-stage (node:22-alpine, non-root)
├── cloudbuild.yaml           ← Ready (no trigger created)
├── next.config.js
├── tailwind.config.ts
└── package.json
```

**Not implemented (deferred to Phase 3b+):**
- Risk Dashboard page (/risks) — requires AI Risk Engine + FCM
- Gantt drag-to-reschedule (click-to-reschedule implemented instead)
- Push notifications via FCM — requires Firebase project setup
- Content Calendar, Pipeline Monitor, Knowledge Explorer, Analytics pages

### Tier 3 — Local STDIO MCP Servers (Claude Code Only)
NPM packages running as local subprocesses. Zero cloud cost.

| Tool | Package | Use Case |
|------|---------|----------|
| Evernote | @verygoodplugins/mcp-evernote | Pull learning notes, project docs into Claude Code |
| n8n | n8n native MCP | Design and trigger automation workflows |
| GitHub | Official GitHub MCP or gh CLI | Repo management during dev sessions |

---

## Decision Tree for Adding New Tools

1. Does a Claude.ai directory connector exist? → Use it. $0. 1 minute.
2. Is it only needed in Claude Code sessions? → Find a community STDIO MCP. $0. 10 minutes.
3. Is it needed from chat + workflows? → Add a module to the Gateway. $0 incremental. 2-4 hours.
4. Does it need heavy compute or persistent connections? → Separate Cloud Run service (rare).
5. Does it need a UI for browsing/interacting with data? → Add a page to the Dashboard. Varies. 1-5 days.

---

## Implementation Phases

| Phase | What | Effort | Status |
|-------|------|--------|--------|
| Phase 1 | Gateway scaffold + PostgreSQL module | 3-5 days | Complete |
| Phase 2 | Google Tasks + Drive Write + Calendar Sync + OAuth | 3-4 days | Complete |
| Phase 2b | Task notification service (daily overdue scan) | 2-3 days | Complete — deployed as Cloud Run + Scheduler |
| Phase 3a | Dashboard scaffold + PWA + auth + Command Center + Gantt + Task Board | 4-6 weeks | Complete — deployed to Cloud Run |
| Phase 3b | AI Risk Engine + push notifications + Risk Dashboard | 2-3 weeks | Not started |
| Phase 4 | Bharatvarsh Admin + Lore Search modules | 2-3 days | Not started |
| Phase 5 | Local STDIOs + WhatsApp + Content Tracker + Dashboard extended views | 2-4 weeks | Not started |

---

## Cost Model

| Component | Monthly Cost |
|-----------|-------------|
| Tier 1 (directory connectors) | $0 |
| Tier 2 (MCP Gateway, Cloud Run) | $0-7 |
| Tier 3 (local STDIO) | $0 |
| Dashboard (Cloud Run, scale-to-zero) | $3-8 |
| Telegram Bot (Cloud Run, scale-to-zero) | $2-3.50 |
| Firebase Cloud Messaging | $0 |
| Google Tasks / Calendar / Drive | $0 |
| **Total** | **$5-18.50/month** |

---

*Update this document when modules are added to the gateway, new connectors are activated, dashboard pages ship, or the deployment topology changes.*
