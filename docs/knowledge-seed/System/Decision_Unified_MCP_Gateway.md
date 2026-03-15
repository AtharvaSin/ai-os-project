# Architecture Decision: Unified MCP Gateway

## Context

The AI Operating System needed tool access from multiple interfaces: Claude.ai (chat), Claude Code (terminal), and Category B/C workflows (HTTP). The tools included database operations, Google Tasks sync, Drive file management, Calendar event creation, and future modules (Bharatvarsh admin, WhatsApp, content tracking).

Two approaches were considered: (1) deploy separate MCP servers per tool domain (one for Postgres, one for Google Tasks, etc.), or (2) build a single unified gateway with modular tool registration. The decision needed to balance operational simplicity, cost, and development velocity.

## Decision / Content

**Build ONE unified MCP Gateway** as a single FastAPI + FastMCP service on Cloud Run, with each tool domain implemented as a separate Python module.

### Architecture
- **Framework:** FastAPI with FastMCP 3.1.1 mounted as sub-app
- **Deployment:** Cloud Run, asia-south1, scale-to-zero (min-instances=0)
- **Auth:** Bearer token (optional -- validates if present, passes through if absent)
- **Database:** asyncpg connection pool via Cloud SQL Auth Proxy sidecar

### Module Structure
Each tool domain is a single Python file in `app/modules/`:
- `postgres.py` -- 6 tools: query_db, insert_record, update_record, get_schema, search_knowledge, log_pipeline_run
- `google_tasks.py` -- 5 tools: list_tasks, create_task, update_task, complete_task, sync_to_db
- `drive_write.py` -- 3 tools: upload_file, create_doc, create_folder
- `calendar_sync.py` -- 3 tools: create_milestone_event, update_milestone_event, delete_milestone_event

**Total: 17 tools live across 4 modules.**

### Adding New Tools
Adding a tool means: (1) create or extend a module file, (2) register tools via `mcp_registry.py`, (3) redeploy. No new infrastructure. No new service accounts. No new secrets (unless the new module needs its own credentials).

### Multi-Interface Access
- **Claude.ai:** Custom connector URL pointing to the Cloud Run service
- **Claude Code:** MCP config in settings pointing to the same URL with Bearer token
- **Category B/C workflows:** Standard HTTP calls to tool endpoints

## Consequences

- **Enables:** Single deployment for all tool access. $0-7/month total cost. Adding tools is a code change, not an infrastructure change. All interfaces share the same tool inventory.
- **Constrains:** All tools share the same Cloud Run instance resources (512Mi memory, 1 CPU). A bug in one module could affect others. Cold start applies to all tools equally.
- **Changes:** The CI/CD trigger auto-deploys on push to `mcp-servers/ai-os-gateway/**` on the main branch. Tool additions trigger a full service redeploy.
- **Future:** If a module needs heavy compute or persistent connections (e.g., real-time WhatsApp), it would be the first candidate for extraction to a separate Cloud Run service.

## Related

- Decision: Three-Category Architecture (the gateway bridges all three categories)
- Decision: Scale-to-Zero Cloud Run (the gateway uses this pattern)
- Reference: MCP Gateway Tool Inventory (full list of 17 tools)
- Reference: Tool Ecosystem Decision Tree (decision framework for where new tools live)
