# AI OS Tool Ecosystem Plan

> **Purpose:** Reference architecture for the three-tier MCP and tool access system. Governs how new tools are added and where they live.
>
> **Last updated:** 2026-03-15 (Phase 1 complete, Phase 2 stubs deployed, MCP Gateway live on Cloud Run)

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
**Service account:** ai-os-cloud-run

| Module | Priority | Tool Calls | Status |
|--------|----------|-----------|--------|
| PostgreSQL | P0 | query_db, insert_record, update_record, get_schema, search_knowledge, log_pipeline_run | Deployed (6 tools live) |
| Google Tasks | P1 | list_tasks, create_task, update_task, complete_task, sync_to_db | Stubs deployed (5 tools, pending OAuth) |
| Drive (write) | P1 | upload_file, create_doc, create_folder | Stubs deployed (3 tools, pending OAuth) |
| Calendar Sync | P1 | create_milestone_event, update_milestone_event, delete_milestone_event | Not started |
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
│   │   ├── postgres.py
│   │   ├── google_tasks.py
│   │   ├── drive_write.py
│   │   ├── calendar_sync.py
│   │   ├── bharatvarsh.py
│   │   ├── whatsapp.py
│   │   └── content.py
│   └── auth/
│       ├── google_oauth.py  ← Shared Google OAuth
│       └── bearer.py        ← API key validation
├── Dockerfile
├── requirements.txt
└── cloudbuild.yaml
```

### Dashboard Service (Separate Cloud Run Service)
Next.js PWA on Cloud Run. Scales to zero. AI-powered command center with project views, Gantt, risk dashboards, and push notifications. Reads from Cloud SQL. See INTERFACE_STRATEGY.md for full specification.

**Deployed at:** Cloud Run, asia-south1, project ai-operating-system-490208
**Service account:** ai-os-cloud-run (shared with MCP Gateway)

**Project structure:**
```
dashboard/
├── src/
│   ├── app/                 ← Next.js App Router
│   │   ├── page.tsx         ← Command Center (home)
│   │   ├── projects/        ← Project detail views
│   │   ├── tasks/           ← Task board
│   │   ├── gantt/           ← Interactive Gantt
│   │   ├── risks/           ← Risk dashboard
│   │   └── api/             ← API routes (Cloud SQL access)
│   ├── components/          ← Shared UI components
│   ├── lib/                 ← DB client, auth, FCM
│   └── styles/              ← Tailwind config + design tokens
├── public/
│   ├── manifest.json        ← PWA manifest
│   ├── sw.js                ← Service worker
│   └── icons/               ← App icons
├── Dockerfile
├── next.config.js
└── package.json
```

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
| Phase 2 | Google Tasks + Drive Write + Calendar Sync modules | 3-4 days | Stubs deployed, pending OAuth |
| Phase 2b | Task notification Cloud Function (daily overdue scan) | 2-3 days | Not started |
| Phase 3a | Dashboard scaffold + PWA + auth + Command Center + Gantt | 4-6 weeks | Not started |
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
| Firebase Cloud Messaging | $0 |
| Google Tasks / Calendar / Drive | $0 |
| **Total** | **$3-15/month** |

---

*Update this document when modules are added to the gateway, new connectors are activated, dashboard pages ship, or the deployment topology changes.*
