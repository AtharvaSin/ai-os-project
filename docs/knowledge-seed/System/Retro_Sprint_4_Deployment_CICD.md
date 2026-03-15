# Sprint Retrospective: Sprint 4 -- MCP Gateway Deployment and CI/CD

## Context

Sprint 4 (Entry 006, 2026-03-15) focused on building and deploying the complete MCP Gateway with all 17 tools, establishing CI/CD via Cloud Build, implementing Google OAuth for workspace integrations, and deploying the Task Notification service. This was the sprint that made the tool layer operational.

## Decision / Content

### What Was Delivered
- **MCP Gateway deployed:** FastAPI + FastMCP on Cloud Run with 17 live tools
  - PostgreSQL module: 6 tools (query_db, insert_record, update_record, get_schema, search_knowledge, log_pipeline_run)
  - Google Tasks module: 5 tools (list_tasks, create_task, update_task, complete_task, sync_to_db)
  - Drive Write module: 3 tools (upload_file, create_doc, create_folder)
  - Calendar Sync module: 3 tools (create_milestone_event, update_milestone_event, delete_milestone_event)
- **Google OAuth implemented:** Desktop client ID, refresh token flow, 3 secrets stored
- **CI/CD established:** Cloud Build trigger auto-deploys on push to main when gateway files change
- **Task Notification service:** Built and deployed as Cloud Run service with Cloud Scheduler trigger at 06:00 IST
- **Migration 005 applied:** 6 new columns for Google sync (google_task_id, google_task_list, last_synced_at, google_calendar_event_id, drive_file_id, drive_url)

### Bugs Fixed During Build
1. **asyncpg ssl=False:** Cloud SQL Auth Proxy handles TLS, so asyncpg must not attempt SSL negotiation
2. **FastMCP 3.1.1 API changes:** stateless_http moved from constructor to http_app() method
3. **FastMCP lifespan chaining:** session_manager.run() replaced by mcp_app.router.lifespan_context
4. **bytes serialization:** PostgreSQL char type returned bytes in asyncpg, needed explicit decoding
5. **307 redirect on /mcp path:** Starlette's trailing-slash redirect broke Claude.ai's httpx POST; fixed by mounting at root with path="/mcp"
6. **OAuth discovery endpoints:** Returning 200 from /.well-known confused Claude.ai into thinking OAuth was required; removed these endpoints

### What Went Well
- **All 17 tools live in one sprint:** Gateway went from zero to fully operational
- **CI/CD working immediately:** Multiple successful auto-triggered builds validated the pipeline
- **Auth model flexibility:** Optional Bearer token allows both Claude.ai (no auth headers) and Claude Code (Bearer token) to connect

### What Could Be Improved
- **Cloud Functions Gen 2 buildpack broken:** Original plan was to deploy Task Notification as a Cloud Function. The buildpack creator exits immediately (confirmed across all functions, all regions). Pivoted to Cloud Run as workaround.
- **Too many bugs during deploy:** 6 bugs in one deployment sprint suggests more local testing is needed before pushing to Cloud Run.

### Key Metrics
- Tools deployed: 17
- Modules: 4
- Files created: 27 (~2,800 lines)
- Bugs fixed: 6
- Secrets created: 4 (MCP_GATEWAY_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)
- CI/CD triggers: 1 (deploy-mcp-gateway)

## Consequences

- The MCP Gateway became the operational backbone of the tool ecosystem
- CI/CD pipeline enables confident iterative improvements without manual deployment
- Cloud Functions Gen 2 buildpack issue forced all "Category B" workloads to Cloud Run as well
- Dashboard Cloud Build trigger still needed as a follow-up

## Related

- Decision: Unified MCP Gateway (this sprint implemented the decision)
- Lesson: Cloud Functions Gen 2 Buildpack Bug (discovered during this sprint)
- Lesson: Cloud Build IAM Permissions (resolved during this sprint)
- Retro: Sprint 3a -- Dashboard Build (concurrent sprint)
- Reference: MCP Gateway Tool Inventory (output of this sprint)
