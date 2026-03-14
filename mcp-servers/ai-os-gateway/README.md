# AI OS MCP Gateway

Unified MCP server exposing all custom tool access through ONE FastAPI Cloud Run service.

## Architecture
- Single FastAPI container on Cloud Run (asia-south1)
- Scales to zero (~$0 idle, $3-7/month with moderate use)
- Streamable HTTP transport for MCP
- Modular: each tool = one Python file in `app/modules/`

## Modules (by priority)

| Module | Priority | Status | Tool Calls |
|--------|----------|--------|-----------|
| PostgreSQL | P0 | Not started | query_db, insert_record, update_record, get_schema, search_knowledge |
| Google Tasks | P1 | Not started | list_tasks, create_task, update_task, complete_task, sync_to_db |
| Drive (write) | P1 | Not started | upload_file, create_doc, create_folder |
| Bharatvarsh Admin | P2 | Not started | query_lore, get_character, search_timeline |
| Lore Search | P2 | Not started | semantic_search_lore (pgvector) |
| WhatsApp | P3 | Not started | send_message, send_template |
| Content Tracker | P3 | Not started | log_post, get_calendar, update_status |

## Adding a new module
1. Create `app/modules/new_tool.py`
2. Define tool schemas and handler functions
3. Register tools with the MCP registry
4. Redeploy: `gcloud run deploy ai-os-gateway --source .`

## Shared infrastructure
- DB connection pool: Cloud SQL via Auth Proxy sidecar
- OAuth tokens: Shared Google OAuth for Tasks + Drive
- Secrets: GCP Secret Manager
- Auth: Bearer token for Claude connections, IAM for workflow calls

## Deployment
```bash
gcloud run deploy ai-os-gateway \
  --source . \
  --region asia-south1 \
  --service-account ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com \
  --set-secrets='AI_OS_DB_PASSWORD=AI_OS_DB_PASSWORD:latest' \
  --add-cloudsql-instances=bharatvarsh-website:us-central1:bharatvarsh-db
```
