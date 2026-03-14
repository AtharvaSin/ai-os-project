import { useState, useEffect, useCallback } from "react";

const PHASES = [
  {
    id: "phase0",
    name: "Phase 0 — Pre-flight",
    subtitle: "Environment setup & schema migration",
    effort: "1-2 hours",
    status: "not_started",
    description: "Get your local dev environment ready and apply the schema additions that Phase 2 modules will need. This removes blockers before the real coding begins.",
    steps: [
      {
        id: "0.1",
        title: "Start cloud-sql-proxy for local dev",
        detail: "Run: cloud-sql-proxy bharatvarsh-website:us-central1:bharatvarsh-db --port=5432\nThis gives you localhost:5432 access to the ai_os database. Keep it running in a background terminal.",
        status: "not_started",
        interface: "Terminal",
        output: "Proxy running on localhost:5432"
      },
      {
        id: "0.2",
        title: "Apply Phase 2 schema migrations",
        detail: "Run the SQL from INTERFACE_STRATEGY.md §Schema Additions Required (Phase 2):\n\nALTER TABLE tasks ADD COLUMN google_task_id TEXT;\nALTER TABLE tasks ADD COLUMN google_task_list TEXT;\nALTER TABLE tasks ADD COLUMN last_synced_at TIMESTAMPTZ;\nALTER TABLE milestones ADD COLUMN google_calendar_event_id TEXT;\nALTER TABLE artifacts ADD COLUMN drive_file_id TEXT;\nALTER TABLE artifacts ADD COLUMN drive_url TEXT;\n\nThese columns are needed by the Google sync modules in Phase 2. Adding them now means the PostgreSQL module can expose them from day one.",
        status: "not_started",
        interface: "Claude Code",
        output: "6 columns added to 3 tables"
      },
      {
        id: "0.3",
        title: "Create MCP Gateway API key secret",
        detail: "Generate a secure API key and store it in Secret Manager:\n\ngcloud secrets create MCP_GATEWAY_API_KEY --replication-policy=automatic --project=ai-operating-system-490208\necho -n 'your-generated-key' | gcloud secrets versions add MCP_GATEWAY_API_KEY --data-file=- --project=ai-operating-system-490208\n\nThis key authenticates requests from Claude.ai and Claude Code to the gateway.",
        status: "not_started",
        interface: "Terminal / GCP Console",
        output: "Secret MCP_GATEWAY_API_KEY in Secret Manager"
      },
      {
        id: "0.4",
        title: "Create project directory structure",
        detail: "In your ai-os-project/ root:\n\nmkdir -p mcp-servers/ai-os-gateway/app/modules\nmkdir -p mcp-servers/ai-os-gateway/app/auth\nmkdir -p cloud-functions/task-notification\n\nThis matches the structure in TOOL_ECOSYSTEM_PLAN.md exactly.",
        status: "not_started",
        interface: "Claude Code",
        output: "Directory tree created"
      }
    ]
  },
  {
    id: "phase1",
    name: "Phase 1 — Gateway scaffold + PostgreSQL module",
    subtitle: "The foundation everything else plugs into",
    effort: "3-5 days",
    status: "not_started",
    description: "Build the FastAPI MCP server skeleton and the first module (PostgreSQL). By the end, both Claude surfaces can query your 21-table database through tool calls. This is THE critical path — every subsequent module is just adding a file to this scaffold.",
    steps: [
      {
        id: "1.1",
        title: "Build config.py — secrets, DB pool, env management",
        detail: "Single file handling:\n• Secret Manager integration (AI_OS_DB_PASSWORD, MCP_GATEWAY_API_KEY)\n• asyncpg connection pool to Cloud SQL (via Unix socket in Cloud Run, TCP localhost in dev)\n• Environment detection (local vs Cloud Run)\n• Google OAuth config placeholder (for Phase 2 modules)\n\nKey design: Use asyncpg (not SQLAlchemy) — lighter, async-native, perfect for tool call handlers. Pool size 1-5 (low traffic).\n\nEstimate: ~80 lines of Python.",
        status: "not_started",
        interface: "Claude Code",
        output: "app/config.py"
      },
      {
        id: "1.2",
        title: "Build mcp_registry.py — tool registration pattern",
        detail: "The module loader pattern:\n• Each module exposes a register(registry) function\n• Registry collects tool definitions (name, description, input schema, handler)\n• main.py calls register() on all modules at startup\n• MCP protocol handler routes incoming tool calls to the right handler\n\nThis is the plug-in architecture — adding a new module = adding one import + one register() call.\n\nEstimate: ~50 lines of Python.",
        status: "not_started",
        interface: "Claude Code",
        output: "app/mcp_registry.py"
      },
      {
        id: "1.3",
        title: "Build auth/bearer.py — API key validation middleware",
        detail: "FastAPI dependency that validates the Bearer token against the MCP_GATEWAY_API_KEY secret.\n• Extract Authorization header\n• Compare against stored key\n• Return 401 on mismatch\n\nEstimate: ~30 lines of Python.",
        status: "not_started",
        interface: "Claude Code",
        output: "app/auth/bearer.py"
      },
      {
        id: "1.4",
        title: "Build main.py — FastAPI + MCP server entrypoint",
        detail: "The main server file:\n• FastAPI app with /health, /mcp (SSE endpoint for MCP protocol)\n• Startup: init DB pool, load secrets, register all modules\n• Shutdown: close DB pool\n• MCP protocol handler (tool listing, tool execution)\n• CORS config for Claude.ai connector\n\nMCP protocol: Use the mcp Python SDK (pip install mcp) or implement the SSE-based JSON-RPC protocol directly. The SDK is cleaner.\n\nEstimate: ~100 lines of Python.",
        status: "not_started",
        interface: "Claude Code",
        output: "app/main.py"
      },
      {
        id: "1.5",
        title: "Build modules/postgres.py — database access tools",
        detail: "The first and most important module. 6 tool calls:\n\n1. query_db(sql, params) — Execute read-only SELECT queries. Returns rows as JSON. Safety: read-only connection or explicit SELECT-only check.\n\n2. insert_record(table, data) — Insert a row. Auto-generates UUID for id. Returns the created record. Validates table name against allow-list.\n\n3. update_record(table, id, data) — Update fields on an existing record. Returns updated record.\n\n4. get_schema(table?) — Returns table structure (columns, types, constraints). If no table specified, returns overview of all tables. This is what Claude reads to understand the DB.\n\n5. search_knowledge(query, domain?, limit?) — Semantic search over knowledge_entries using pgvector. Calls the planned match_knowledge() function (or inline cosine similarity query). Requires embeddings to be populated.\n\n6. log_pipeline_run(pipeline_slug, status, trigger_type, ...) — Insert a pipeline_runs record + pipeline_logs entries. Used by Category B/C workflows to self-report.\n\nEstimate: ~200 lines of Python.",
        status: "not_started",
        interface: "Claude Code",
        output: "app/modules/postgres.py"
      },
      {
        id: "1.6",
        title: "Build Dockerfile + requirements.txt",
        detail: "Dockerfile:\n• Python 3.12-slim base\n• Install requirements\n• Copy app/\n• CMD: uvicorn app.main:app --host 0.0.0.0 --port 8080\n\nrequirements.txt:\nfastapi, uvicorn[standard], asyncpg, google-cloud-secret-manager, mcp (or httpx-sse if hand-rolling MCP), pydantic\n\nEstimate: ~25 lines total.",
        status: "not_started",
        interface: "Claude Code",
        output: "Dockerfile + requirements.txt"
      },
      {
        id: "1.7",
        title: "Local testing — verify all 6 PostgreSQL tools work",
        detail: "Run locally:\nuvicorn app.main:app --reload --port 8080\n\nTest each tool call via curl or a simple Python test script:\n• get_schema() — should return all 21 tables\n• query_db('SELECT * FROM projects') — should return 3 projects\n• insert_record('tasks', {title: 'Test task', project_id: '...', status: 'todo'}) — should create a task\n• update_record('tasks', id, {status: 'done'}) — should update\n• log_pipeline_run('birthday-wishes', 'success', 'manual') — should create run record\n\nFix all issues before deploying.",
        status: "not_started",
        interface: "Claude Code",
        output: "All 6 tool calls passing locally"
      },
      {
        id: "1.8",
        title: "Build & push Docker image to Artifact Registry",
        detail: "docker build -t asia-south1-docker.pkg.dev/ai-operating-system-490208/ai-os-images/ai-os-gateway:v0.1.0 .\ndocker push asia-south1-docker.pkg.dev/ai-operating-system-490208/ai-os-images/ai-os-gateway:v0.1.0\n\nIf building on ARM Mac, add --platform linux/amd64.",
        status: "not_started",
        interface: "Claude Code / Terminal",
        output: "Image in Artifact Registry"
      },
      {
        id: "1.9",
        title: "Deploy to Cloud Run",
        detail: "Use the exact template from GCP_INFRA_CONFIG.md §7:\n\ngcloud run deploy ai-os-gateway \\\n  --image=asia-south1-docker.pkg.dev/ai-operating-system-490208/ai-os-images/ai-os-gateway:v0.1.0 \\\n  --region=asia-south1 \\\n  --service-account=ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com \\\n  --add-cloudsql-instances=bharatvarsh-website:us-central1:bharatvarsh-db \\\n  --set-secrets=DB_PASSWORD=AI_OS_DB_PASSWORD:latest,API_KEY=MCP_GATEWAY_API_KEY:latest \\\n  --min-instances=0 \\\n  --no-allow-unauthenticated\n\nNote the Cloud SQL Auth Proxy sidecar added automatically by --add-cloudsql-instances.",
        status: "not_started",
        interface: "Terminal",
        output: "Gateway live at Cloud Run URL"
      },
      {
        id: "1.10",
        title: "Verify Cloud Run deployment — hit /health and test tool calls",
        detail: "1. Get the service URL: gcloud run services describe ai-os-gateway --region=asia-south1 --format='value(status.url)'\n2. Test health: curl -H 'Authorization: Bearer YOUR_KEY' https://GATEWAY_URL/health\n3. Test MCP tool call: Send a tools/call request to the /mcp endpoint with get_schema\n4. Verify DB access: query_db should return data from Cloud SQL\n\nIf 500 errors, check Cloud Logging for the service.",
        status: "not_started",
        interface: "Terminal",
        output: "Gateway responding with live DB data"
      },
      {
        id: "1.11",
        title: "Connect Claude.ai to the MCP Gateway",
        detail: "In Claude.ai project settings, add a custom MCP connector:\n• Server URL: https://GATEWAY_URL/mcp (the SSE endpoint)\n• Authentication: Bearer token (your MCP_GATEWAY_API_KEY)\n• Available tools should auto-populate: query_db, insert_record, update_record, get_schema, search_knowledge, log_pipeline_run\n\nTest: Ask Claude in this project to 'list all projects in the database' — it should call query_db and return results.",
        status: "not_started",
        interface: "Claude.ai settings",
        output: "Claude.ai can call PostgreSQL tools"
      },
      {
        id: "1.12",
        title: "Connect Claude Code to the MCP Gateway",
        detail: "Add to .claude/settings.json (or mcp_servers in CLAUDE.md config):\n{\n  \"mcpServers\": {\n    \"ai-os-gateway\": {\n      \"type\": \"sse\",\n      \"url\": \"https://GATEWAY_URL/mcp\",\n      \"headers\": {\n        \"Authorization\": \"Bearer YOUR_KEY\"\n      }\n    }\n  }\n}\n\nTest: In Claude Code, ask to query the database.",
        status: "not_started",
        interface: "Claude Code",
        output: "Claude Code can call PostgreSQL tools"
      }
    ]
  },
  {
    id: "phase2",
    name: "Phase 2 — Google sync modules",
    subtitle: "Tasks, Drive, Calendar → phone notifications",
    effort: "3-4 days",
    status: "not_started",
    description: "Three new module files added to the existing gateway. When done, creating a task in Claude sends a push notification to your phone, generated documents appear in Drive, and milestone deadlines appear on your Calendar.",
    steps: [
      {
        id: "2.1",
        title: "Set up Google OAuth for server-side API access",
        detail: "The gateway needs a Google service account or OAuth credentials to call Tasks API, Drive API, and Calendar API on your behalf.\n\nOption A (simpler): Create a Google Cloud OAuth 2.0 client (web application type), do the initial OAuth flow to get refresh tokens for your account, store them in Secret Manager.\n\nOption B (service account): Use the existing ai-os-cloud-run service account with domain-wide delegation (only works with Workspace).\n\nFor a personal Google account, Option A is the path. Build auth/google_oauth.py to handle token refresh.\n\nEstimate: ~60 lines.",
        status: "not_started",
        interface: "GCP Console + Claude Code",
        output: "app/auth/google_oauth.py + GOOGLE_OAUTH_REFRESH_TOKEN secret"
      },
      {
        id: "2.2",
        title: "Build modules/google_tasks.py",
        detail: "5 tool calls:\n\n1. list_tasks(project_slug?) — List tasks from Google Tasks, optionally filtered by task list (one list per project per INTERFACE_STRATEGY.md). Returns task title, status, due date.\n\n2. create_task(title, due_date?, project_slug?, priority?, description?) — Creates task in Cloud SQL first, then creates matching Google Task in the right list. Stores google_task_id back in Cloud SQL. Priority maps to title prefix: [URGENT], [HIGH].\n\n3. update_task(task_id, fields) — Updates Cloud SQL task, then syncs changes to Google Tasks.\n\n4. complete_task(task_id) — Sets tasks.status='done' + tasks.completed_at=now() in Cloud SQL, marks Google Task as complete.\n\n5. sync_to_db() — Pulls current state from Google Tasks and reconciles with Cloud SQL. Handles tasks completed on mobile.\n\nGoogle Task list structure (from INTERFACE_STRATEGY.md):\n• AI OS — for operating system build tasks\n• AI&U — YouTube channel tasks\n• Bharatvarsh — novel and transmedia\n• Zealogics — professional work\n• Personal — non-project tasks\n\nAuto-create these lists on first run if they don't exist.\n\nEstimate: ~180 lines.",
        status: "not_started",
        interface: "Claude Code",
        output: "app/modules/google_tasks.py"
      },
      {
        id: "2.3",
        title: "Build modules/drive_write.py",
        detail: "3 tool calls:\n\n1. upload_file(file_content, filename, project_slug, subfolder?) — Uploads a file to Google Drive in the correct folder (structure from INTERFACE_STRATEGY.md §Google Drive). Writes artifact metadata to Cloud SQL artifacts table (drive_file_id, drive_url). Returns Drive URL.\n\n2. create_doc(title, content, project_slug, subfolder?) — Creates a Google Doc (not just file upload — actual Google Doc format). Useful for docs that need collaborative editing later.\n\n3. create_folder(name, parent_path?) — Creates a Drive folder. Used during initial setup to build the folder structure.\n\nFolder structure (create on first deploy):\nAI OS/\n├── AI Operating System/ (PRDs/, Architecture/, Decision Memos/, Session Artifacts/)\n├── AI&U/ (Scripts/, Thumbnails/, Research/)\n├── Bharatvarsh/ (Marketing/, Lore Docs/, Content/)\n└── Zealogics/ (Project Docs/, Deliverables/)\n\nEstimate: ~130 lines.",
        status: "not_started",
        interface: "Claude Code",
        output: "app/modules/drive_write.py"
      },
      {
        id: "2.4",
        title: "Build modules/calendar_sync.py",
        detail: "3 tool calls:\n\n1. create_milestone_event(milestone_id) — Reads milestone from Cloud SQL, creates Calendar event on 'AI OS Milestones' calendar. Title format: '[PROJECT] Milestone: {name}'. Reminders: 1 day before (email) + day-of (popup). Stores google_calendar_event_id back in milestones table.\n\n2. update_milestone_event(milestone_id) — Syncs updated due_date or name to existing Calendar event.\n\n3. delete_milestone_event(milestone_id) — Removes Calendar event when milestone is deleted or completed.\n\nAuto-create 'AI OS Milestones' calendar on first run if it doesn't exist. Color-code events by project.\n\nEstimate: ~100 lines.",
        status: "not_started",
        interface: "Claude Code",
        output: "app/modules/calendar_sync.py"
      },
      {
        id: "2.5",
        title: "Register new modules in main.py",
        detail: "Add imports and register() calls for google_tasks, drive_write, and calendar_sync in main.py. Also add the Google OAuth setup to the startup sequence in config.py.\n\nThis is why the module pattern matters — 3 new imports, 3 register() calls, done.",
        status: "not_started",
        interface: "Claude Code",
        output: "Updated main.py + config.py"
      },
      {
        id: "2.6",
        title: "Local testing — test all Google sync tools",
        detail: "Test each module against your real Google account (via localhost with cloud-sql-proxy):\n\n• create_task('Test from gateway', due_date='2026-03-20', project_slug='ai-os') → check Google Tasks app on phone\n• complete_task(task_id) → verify it's marked complete in both Cloud SQL and Google Tasks\n• upload_file(some_content, 'test.md', 'ai-os', 'Session Artifacts') → check Drive folder\n• create_milestone_event(milestone_id) → check Calendar\n\nCritical: verify the phone actually receives the Google Tasks push notification.",
        status: "not_started",
        interface: "Claude Code + Phone",
        output: "Google sync working locally, phone notifications confirmed"
      },
      {
        id: "2.7",
        title: "Rebuild Docker image + redeploy to Cloud Run",
        detail: "Tag as v0.2.0:\ndocker build -t asia-south1-docker.pkg.dev/ai-operating-system-490208/ai-os-images/ai-os-gateway:v0.2.0 .\ndocker push ...\ngcloud run deploy ai-os-gateway --image=...v0.2.0 --set-secrets=...,GOOGLE_OAUTH_REFRESH_TOKEN=GOOGLE_OAUTH_REFRESH_TOKEN:latest\n\nAdd the new secret to the deploy command.",
        status: "not_started",
        interface: "Claude Code / Terminal",
        output: "Gateway v0.2.0 deployed with Google modules"
      },
      {
        id: "2.8",
        title: "End-to-end test: Claude.ai → phone notification",
        detail: "The golden test from INTERFACE_STRATEGY.md exit criteria:\n\n1. In Claude.ai (this project): 'Create a task: Review MCP Gateway Phase 1 code, due March 20, high priority, AI OS project'\n2. Claude calls create_task via MCP Gateway\n3. Check: Cloud SQL tasks table has new row with google_task_id populated\n4. Check: Google Tasks app on phone shows the task with [HIGH] prefix\n5. Check: Phone receives push notification on due date\n\nAlso test: 'Generate a quick summary document and save it to Drive' → verify Drive file appears.",
        status: "not_started",
        interface: "Claude.ai + Phone",
        output: "Full pipeline working: Claude → DB → Google → Phone"
      }
    ]
  },
  {
    id: "phase2b",
    name: "Phase 2b — Task notification Cloud Function",
    subtitle: "First Category B pipeline — daily overdue scan",
    effort: "2-3 days",
    status: "not_started",
    description: "A Cloud Function that runs daily via Cloud Scheduler. Queries overdue tasks from Cloud SQL, creates or updates Google Tasks with urgency indicators. This is your first fully autonomous background service — no human trigger needed.",
    steps: [
      {
        id: "2b.1",
        title: "Build cloud-functions/task-notification/main.py",
        detail: "Logic:\n1. Connect to Cloud SQL (via cloud-sql-python-connector)\n2. Query: SELECT tasks with due_date < NOW() AND status NOT IN ('done', 'cancelled')\n3. Group by project\n4. For each overdue task:\n   a. If no google_task_id → create Google Task with [OVERDUE] prefix\n   b. If existing google_task_id → update title to add [OVERDUE] prefix if not already there\n5. Log results to pipeline_runs table (self-report via direct DB insert, not MCP)\n6. Return summary\n\nAlso query: tasks due within next 24 hours → ensure they have Google Tasks created.\n\nEstimate: ~120 lines.",
        status: "not_started",
        interface: "Claude Code",
        output: "cloud-functions/task-notification/main.py + requirements.txt"
      },
      {
        id: "2b.2",
        title: "Deploy Cloud Function",
        detail: "Use the template from GCP_INFRA_CONFIG.md §7:\n\ngcloud functions deploy task-notification-daily \\\n  --gen2 \\\n  --runtime=python312 \\\n  --region=asia-south1 \\\n  --source=./cloud-functions/task-notification \\\n  --entry-point=main \\\n  --trigger-http \\\n  --service-account=ai-os-cloud-functions@ai-operating-system-490208.iam.gserviceaccount.com \\\n  --set-secrets=DB_PASSWORD=AI_OS_DB_PASSWORD:latest,DB_INSTANCE=AI_OS_DB_INSTANCE:latest,GOOGLE_OAUTH_REFRESH_TOKEN=GOOGLE_OAUTH_REFRESH_TOKEN:latest",
        status: "not_started",
        interface: "Terminal",
        output: "Cloud Function deployed"
      },
      {
        id: "2b.3",
        title: "Create Cloud Scheduler trigger",
        detail: "gcloud scheduler jobs create http task-notification-daily \\\n  --schedule='0 6 * * *' \\\n  --time-zone='Asia/Kolkata' \\\n  --uri=CLOUD_FUNCTION_URL \\\n  --oidc-service-account-email=ai-os-cloud-functions@ai-operating-system-490208.iam.gserviceaccount.com \\\n  --location=asia-south1\n\nRuns daily at 06:00 IST. The OIDC token authenticates the Scheduler → Function call.",
        status: "not_started",
        interface: "Terminal",
        output: "Scheduler job running daily at 6 AM IST"
      },
      {
        id: "2b.4",
        title: "Register pipeline in Cloud SQL",
        detail: "INSERT INTO pipelines (name, slug, category, description, schedule, entrypoint, is_active)\nVALUES ('Task Notification Daily', 'task-notification-daily', 'B', 'Daily overdue task scan and Google Tasks sync', '0 6 * * *', 'cloud-functions/task-notification', true);\n\nThis lets the gateway's log_pipeline_run tool track execution history.",
        status: "not_started",
        interface: "Claude Code",
        output: "Pipeline registered in DB"
      },
      {
        id: "2b.5",
        title: "Test: trigger manually and verify results",
        detail: "1. Create some tasks in Cloud SQL with past due dates\n2. Manually trigger the Cloud Function: curl -H 'Authorization: bearer TOKEN' FUNCTION_URL\n3. Check: Google Tasks app shows overdue tasks with [OVERDUE] prefix\n4. Check: pipeline_runs table has a new entry with status 'success'\n5. Check: pipeline_logs has detailed execution log entries\n\nLet it run overnight and verify the 6 AM trigger works.",
        status: "not_started",
        interface: "Terminal + Phone",
        output: "Autonomous daily notifications working"
      }
    ]
  },
  {
    id: "phase_sync",
    name: "Phase S — Sync KB + update all docs",
    subtitle: "Bring everything up to date across both surfaces",
    effort: "1-2 hours",
    status: "not_started",
    description: "After the tool layer is built, update all knowledge base documents to reflect the new reality. This is how both Claude surfaces stay aware of what exists and how to use it.",
    steps: [
      {
        id: "s.1",
        title: "Update TOOL_ECOSYSTEM_PLAN.md",
        detail: "Change module statuses from 'Not started' to 'Live' for PostgreSQL, Google Tasks, Drive Write, Calendar Sync. Update implementation phases table with completion dates. Add the actual Cloud Run URL and version tag.",
        status: "not_started",
        interface: "Claude.ai (draft) → KB upload",
        output: "Updated TOOL_ECOSYSTEM_PLAN.md"
      },
      {
        id: "s.2",
        title: "Update GCP_INFRA_CONFIG.md",
        detail: "Change ai-os-gateway status from 'Not built' to 'Deployed'. Add actual image tag and service URL. Add MCP_GATEWAY_API_KEY and GOOGLE_OAUTH_REFRESH_TOKEN to secrets table. Add Cloud Scheduler job to a new section.",
        status: "not_started",
        interface: "Claude.ai (draft) → KB upload",
        output: "Updated GCP_INFRA_CONFIG.md"
      },
      {
        id: "s.3",
        title: "Update DB_SCHEMA.md",
        detail: "Regenerate the schema doc to include the new columns (google_task_id, google_task_list, last_synced_at, google_calendar_event_id, drive_file_id, drive_url). Update the Overview table with new column counts.",
        status: "not_started",
        interface: "Claude Code (auto-generate) → KB upload",
        output: "Updated DB_SCHEMA.md"
      },
      {
        id: "s.4",
        title: "Update WORK_PROJECTS.md",
        detail: "AI OS status: Phase 1-2 complete. MCP Gateway deployed. Google sync live. Next milestone: Dashboard PWA (Phase 3). Move pending decisions that are resolved.",
        status: "not_started",
        interface: "Claude.ai (draft) → KB upload",
        output: "Updated WORK_PROJECTS.md"
      },
      {
        id: "s.5",
        title: "Draft Evolution Log entry 006",
        detail: "Document all architecture decisions made during implementation, actual files created, deployment details, any deviations from the plan, and next steps.",
        status: "not_started",
        interface: "Claude.ai",
        output: "Evolution Log Entry 006"
      },
      {
        id: "s.6",
        title: "Mirror updated KB to Claude Code knowledge-base/",
        detail: "Copy the updated .md files to the ai-os-project/knowledge-base/ directory so Claude Code has the same context as Claude.ai.",
        status: "not_started",
        interface: "Claude Code",
        output: "Both surfaces synchronized"
      }
    ]
  }
];

const STATUS_CONFIG = {
  not_started: { label: "Not started", color: "var(--color-text-tertiary)", bg: "var(--color-background-tertiary)", icon: "○" },
  in_progress: { label: "In progress", color: "#E8B931", bg: "rgba(232,185,49,0.12)", icon: "◐" },
  blocked: { label: "Blocked", color: "#FF6B6B", bg: "rgba(255,107,107,0.12)", icon: "✕" },
  done: { label: "Done", color: "#4ECDC4", bg: "rgba(78,205,196,0.12)", icon: "●" },
  skipped: { label: "Skipped", color: "var(--color-text-tertiary)", bg: "var(--color-background-tertiary)", icon: "—" }
};

const STORAGE_KEY = "tool-ecosystem-blueprint-v1";

export default function ToolEcosystemBlueprint() {
  const [phases, setPhases] = useState(PHASES);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [notes, setNotes] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const stateRes = await window.storage.get(STORAGE_KEY);
        if (stateRes?.value) {
          const saved = JSON.parse(stateRes.value);
          if (saved.phases) setPhases(saved.phases);
          if (saved.notes) setNotes(saved.notes);
          if (saved.expandedPhase !== undefined) setExpandedPhase(saved.expandedPhase);
        }
      } catch (e) {
        console.log("No saved state, starting fresh");
      }
      setLoaded(true);
    }
    load();
  }, []);

  const save = useCallback(async (newPhases, newNotes, newExpanded) => {
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify({
        phases: newPhases,
        notes: newNotes,
        expandedPhase: newExpanded
      }));
    } catch (e) {
      console.error("Save failed:", e);
    }
  }, []);

  const updateStepStatus = (phaseIdx, stepIdx, newStatus) => {
    const updated = phases.map((p, pi) => {
      if (pi !== phaseIdx) return p;
      const newSteps = p.steps.map((s, si) => si === stepIdx ? { ...s, status: newStatus } : s);
      const allDone = newSteps.every(s => s.status === "done" || s.status === "skipped");
      const anyInProgress = newSteps.some(s => s.status === "in_progress");
      const anyDone = newSteps.some(s => s.status === "done");
      let phaseStatus = "not_started";
      if (allDone) phaseStatus = "done";
      else if (anyInProgress || anyDone) phaseStatus = "in_progress";
      return { ...p, steps: newSteps, status: phaseStatus };
    });
    setPhases(updated);
    save(updated, notes, expandedPhase);
  };

  const updateNote = (stepId, value) => {
    const updated = { ...notes, [stepId]: value };
    setNotes(updated);
    save(phases, updated, expandedPhase);
  };

  const togglePhase = (idx) => {
    const next = expandedPhase === idx ? null : idx;
    setExpandedPhase(next);
    save(phases, notes, next);
  };

  const getPhaseProgress = (phase) => {
    const total = phase.steps.length;
    const done = phase.steps.filter(s => s.status === "done" || s.status === "skipped").length;
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  const getOverallProgress = () => {
    const allSteps = phases.flatMap(p => p.steps);
    const done = allSteps.filter(s => s.status === "done" || s.status === "skipped").length;
    return { done, total: allSteps.length, pct: allSteps.length > 0 ? Math.round((done / allSteps.length) * 100) : 0 };
  };

  const resetAll = async () => {
    if (confirm("Reset all progress? This cannot be undone.")) {
      setPhases(PHASES);
      setNotes({});
      setExpandedPhase(null);
      try { await window.storage.delete(STORAGE_KEY); } catch(e) {}
    }
  };

  if (!loaded) {
    return <div style={{ padding: "2rem", color: "var(--color-text-secondary)" }}>Loading saved progress...</div>;
  }

  const overall = getOverallProgress();

  return (
    <div style={{ padding: "0.5rem 0", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, margin: "0 0 4px", color: "var(--color-text-primary)" }}>
          Tool ecosystem — implementation blueprint
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
          MCP Gateway + Google Sync + Task Notifications · Progress persists across sessions
        </p>
      </div>

      {/* Overall progress */}
      <div style={{
        background: "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-md)",
        padding: "1rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "16px"
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Overall progress</span>
            <span style={{ fontSize: "13px", fontWeight: 500 }}>{overall.done}/{overall.total} steps · {overall.pct}%</span>
          </div>
          <div style={{ height: "6px", background: "var(--color-background-tertiary)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${overall.pct}%`,
              background: overall.pct === 100 ? "#4ECDC4" : "#7B68EE",
              borderRadius: "3px",
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>
        <button onClick={resetAll} style={{
          fontSize: "11px",
          padding: "4px 10px",
          color: "var(--color-text-tertiary)",
          cursor: "pointer",
          background: "transparent",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)"
        }}>Reset</button>
      </div>

      {/* File inventory summary */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "8px",
        marginBottom: "1.5rem"
      }}>
        {[
          { label: "Python files", value: "~12" },
          { label: "Total lines", value: "~2,000" },
          { label: "Cloud services", value: "2" },
          { label: "Monthly cost", value: "$0-7" }
        ].map(m => (
          <div key={m.label} style={{
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)",
            padding: "0.75rem"
          }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>{m.label}</div>
            <div style={{ fontSize: "18px", fontWeight: 500 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Phases */}
      {phases.map((phase, phaseIdx) => {
        const prog = getPhaseProgress(phase);
        const isExpanded = expandedPhase === phaseIdx;
        const sc = STATUS_CONFIG[phase.status];

        return (
          <div key={phase.id} style={{
            marginBottom: "12px",
            border: `0.5px solid ${isExpanded ? "var(--color-border-secondary)" : "var(--color-border-tertiary)"}`,
            borderRadius: "var(--border-radius-lg)",
            overflow: "hidden",
            transition: "border-color 0.2s"
          }}>
            {/* Phase header */}
            <div
              onClick={() => togglePhase(phaseIdx)}
              style={{
                padding: "1rem 1.25rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: isExpanded ? "var(--color-background-secondary)" : "transparent",
                transition: "background 0.15s"
              }}
            >
              <span style={{
                fontSize: "14px",
                color: sc.color,
                width: "18px",
                textAlign: "center",
                flexShrink: 0
              }}>{sc.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "15px", fontWeight: 500 }}>{phase.name}</span>
                  <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{phase.effort}</span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>{phase.subtitle}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{prog.done}/{prog.total}</span>
                <div style={{ width: "60px", height: "4px", background: "var(--color-background-tertiary)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${prog.pct}%`,
                    background: prog.pct === 100 ? "#4ECDC4" : "#7B68EE",
                    borderRadius: "2px",
                    transition: "width 0.3s"
                  }} />
                </div>
                <span style={{
                  fontSize: "14px",
                  color: "var(--color-text-tertiary)",
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  flexShrink: 0
                }}>▸</span>
              </div>
            </div>

            {/* Phase content */}
            {isExpanded && (
              <div style={{ padding: "0 1.25rem 1.25rem" }}>
                <p style={{
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                  margin: "0 0 1rem",
                  paddingLeft: "30px"
                }}>{phase.description}</p>

                {/* Steps */}
                {phase.steps.map((step, stepIdx) => {
                  const stepSc = STATUS_CONFIG[step.status];
                  return (
                    <div key={step.id} style={{
                      padding: "12px 12px 12px 30px",
                      borderTop: stepIdx === 0 ? "0.5px solid var(--color-border-tertiary)" : "none",
                      borderBottom: "0.5px solid var(--color-border-tertiary)"
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        {/* Status selector */}
                        <select
                          value={step.status}
                          onChange={e => updateStepStatus(phaseIdx, stepIdx, e.target.value)}
                          style={{
                            fontSize: "11px",
                            padding: "3px 6px",
                            borderRadius: "var(--border-radius-md)",
                            background: stepSc.bg,
                            color: stepSc.color,
                            border: "none",
                            cursor: "pointer",
                            flexShrink: 0,
                            marginTop: "2px",
                            fontWeight: 500,
                            minWidth: "90px"
                          }}
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.icon} {v.label}</option>
                          ))}
                        </select>

                        <div style={{ flex: 1 }}>
                          {/* Step header */}
                          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: "11px",
                              fontFamily: "var(--font-mono)",
                              color: "var(--color-text-tertiary)"
                            }}>{step.id}</span>
                            <span style={{
                              fontSize: "14px",
                              fontWeight: 500,
                              textDecoration: step.status === "done" ? "line-through" : "none",
                              opacity: step.status === "done" || step.status === "skipped" ? 0.6 : 1
                            }}>{step.title}</span>
                          </div>

                          {/* Meta badges */}
                          <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: "10px",
                              fontFamily: "var(--font-mono)",
                              padding: "2px 8px",
                              borderRadius: "var(--border-radius-md)",
                              background: "var(--color-background-info)",
                              color: "var(--color-text-info)"
                            }}>{step.interface}</span>
                            <span style={{
                              fontSize: "10px",
                              fontFamily: "var(--font-mono)",
                              padding: "2px 8px",
                              borderRadius: "var(--border-radius-md)",
                              background: "var(--color-background-success)",
                              color: "var(--color-text-success)"
                            }}>→ {step.output}</span>
                          </div>

                          {/* Detail */}
                          <pre style={{
                            fontSize: "12px",
                            lineHeight: 1.6,
                            color: "var(--color-text-secondary)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            margin: "0 0 8px",
                            fontFamily: "var(--font-sans)"
                          }}>{step.detail}</pre>

                          {/* Notes */}
                          <textarea
                            placeholder="Add session notes, blockers, decisions..."
                            value={notes[step.id] || ""}
                            onChange={e => updateNote(step.id, e.target.value)}
                            style={{
                              width: "100%",
                              minHeight: "32px",
                              fontSize: "12px",
                              padding: "6px 8px",
                              borderRadius: "var(--border-radius-md)",
                              border: "0.5px solid var(--color-border-tertiary)",
                              background: "var(--color-background-primary)",
                              color: "var(--color-text-primary)",
                              fontFamily: "var(--font-mono)",
                              resize: "vertical",
                              lineHeight: 1.5
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Claude Code prompt templates */}
      <div style={{
        marginTop: "1.5rem",
        padding: "1rem 1.25rem",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)"
      }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 8px" }}>Claude Code session prompts</h3>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 12px" }}>
          Copy these to start each build session. Each references the right KB docs.
        </p>
        {[
          {
            phase: "Phase 1",
            prompt: `Build the MCP Gateway scaffold with the PostgreSQL module. The project structure is in knowledge-base/TOOL_ECOSYSTEM_PLAN.md. Database schema is in knowledge-base/DB_SCHEMA.md. Deployment config is in knowledge-base/GCP_INFRA_CONFIG.md. Build in mcp-servers/ai-os-gateway/. Start with config.py (DB pool + secrets), then mcp_registry.py (tool registration pattern), then auth/bearer.py (API key validation), then main.py (FastAPI + MCP server), then modules/postgres.py (6 tool calls: query_db, insert_record, update_record, get_schema, search_knowledge, log_pipeline_run). Include Dockerfile and requirements.txt. Use asyncpg for DB access, mcp Python SDK for the MCP protocol.`
          },
          {
            phase: "Phase 2",
            prompt: `Add Google sync modules to the MCP Gateway. Reference knowledge-base/INTERFACE_STRATEGY.md for the data flow patterns, Google Tasks mapping, Drive folder structure, and Calendar sync model. Build three new module files in mcp-servers/ai-os-gateway/app/modules/: google_tasks.py (5 tools: list_tasks, create_task, update_task, complete_task, sync_to_db), drive_write.py (3 tools: upload_file, create_doc, create_folder), calendar_sync.py (3 tools: create_milestone_event, update_milestone_event, delete_milestone_event). Also build auth/google_oauth.py for token management. Register all modules in main.py.`
          },
          {
            phase: "Phase 2b",
            prompt: `Build the first Category B Cloud Function: task-notification-daily. It runs daily at 6AM IST via Cloud Scheduler. Logic: query overdue tasks from Cloud SQL, create/update Google Tasks with [OVERDUE] prefix, log run to pipeline_runs table. Build in cloud-functions/task-notification/. Reference knowledge-base/DB_SCHEMA.md for table structure and knowledge-base/GCP_INFRA_CONFIG.md for deployment template. Use cloud-sql-python-connector for DB access. Include requirements.txt.`
          }
        ].map(t => (
          <div key={t.phase} style={{ marginBottom: "10px" }}>
            <div style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--color-text-info)",
              marginBottom: "4px"
            }}>{t.phase}</div>
            <div style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              padding: "8px 10px",
              background: "var(--color-background-secondary)",
              borderRadius: "var(--border-radius-md)",
              lineHeight: 1.6,
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              userSelect: "all"
            }}>{t.prompt}</div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: "1rem",
        fontSize: "11px",
        color: "var(--color-text-tertiary)",
        textAlign: "center"
      }}>
        Progress auto-saves and persists across sessions · Last saved state loads on open
      </div>
    </div>
  );
}
