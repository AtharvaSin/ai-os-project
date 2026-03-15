# Reference: MCP Gateway Tool Inventory

## Context

The AI OS Unified MCP Gateway is a single FastAPI + FastMCP service on Cloud Run that exposes 17 tools across 4 modules. This reference catalogs every tool, its module, purpose, and interface. All tools are live and operational.

## Decision / Content

### Service Details
- **Service URL:** https://ai-os-gateway-1054489801008.asia-south1.run.app
- **Framework:** FastAPI + FastMCP 3.1.1 (stateless HTTP mode)
- **MCP endpoint:** /mcp
- **Auth:** Bearer token (optional -- validates if present, passes through if absent)
- **Image:** ai-os-gateway:be26f7c (~107MB)

### Module 1: PostgreSQL (6 tools) -- `app/modules/postgres.py`

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| query_db | Execute SELECT queries against Cloud SQL | sql (string), params (optional) |
| insert_record | Insert a row into any table | table (string), data (object) |
| update_record | Update rows matching conditions | table (string), data (object), where (object) |
| get_schema | Return table schema (columns, types, constraints) | table (string, optional -- all tables if omitted) |
| search_knowledge | Semantic search over knowledge_entries via pgvector | query (string), domain (optional), limit (optional) |
| log_pipeline_run | Log a pipeline execution with duration and cost | pipeline_slug, status, duration_ms, tokens_used, cost_estimate |

### Module 2: Google Tasks (5 tools) -- `app/modules/google_tasks.py`

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| list_tasks | List tasks from a Google Tasks list | task_list (string, optional) |
| create_task | Create a new Google Task with due date | title, due_date, notes, task_list |
| update_task | Update an existing Google Task | task_id, task_list, title, due_date, notes |
| complete_task | Mark a Google Task as completed | task_id, task_list |
| sync_to_db | Sync Google Tasks state back to Cloud SQL | task_list (optional) |

### Module 3: Drive Write (3 tools) -- `app/modules/drive_write.py`

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| upload_file | Upload a file to Google Drive | file_content, file_name, folder_id, mime_type |
| create_doc | Create a Google Doc with content | title, content, folder_id |
| create_folder | Create a folder in Google Drive | name, parent_folder_id |

### Module 4: Calendar Sync (3 tools) -- `app/modules/calendar_sync.py`

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| create_milestone_event | Create a Calendar event for a milestone due date | milestone_id, title, due_date, description |
| update_milestone_event | Update an existing milestone Calendar event | event_id, title, due_date, description |
| delete_milestone_event | Delete a milestone Calendar event | event_id |

### Planned Modules (Not Started)
- **Bharatvarsh Admin** (P2): query_lore, get_character, search_timeline, forum_moderate
- **Lore Search** (P2): semantic_search_lore, get_lore_by_topic (pgvector)
- **WhatsApp** (P3): send_message, send_template, get_message_status
- **Content Tracker** (P3): log_post, get_calendar, update_status, get_metrics

### Authentication
Google OAuth is implemented via a Desktop client ID with a refresh token flow. The `google_oauth.py` module handles token refresh. Three Google secrets are stored in Secret Manager: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN.

## Consequences

- 17 tools cover database access, task management, file storage, and calendar sync
- All tools are accessible from Claude.ai, Claude Code, and Category B/C workflows via the same HTTP endpoint
- Adding new tools requires only a new module file and a redeploy

## Related

- Decision: Unified MCP Gateway (why one gateway instead of separate servers)
- Reference: GCP Infrastructure (deployment templates and secrets)
- Reference: Database Schema Overview (the schema that PostgreSQL tools read/write)
- Reference: Tool Ecosystem Decision Tree (framework for adding new tools)
