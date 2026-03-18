# Interface Layer Strategy

> **Purpose:** Canonical reference for the AI OS interface layer design. Governs how interfaces are chosen, built, and connected. All dashboard, notification, artifact storage, and mobile access decisions reference this document.
>
> **Decision:** Option C — Google Rails + Custom Intelligence Layer
>
> **Last updated:** 2026-03-18 (State v11. 25 skills. Dashboard: 9 pages, 23 API routes, 28 components. MCP Gateway: 56 tools deployed, 10 modules.)

---

## Design Principle: Separation of Concerns

The interface layer is built on a strict separation between three roles:

| Role | Tool | Why |
|------|------|-----|
| **Cognitive Engine** | Claude.ai (this project) + Claude Code | 60-70% of work. Creates tasks, generates artifacts, plans, drafts, decides. Talks to Google and Cloud SQL through the MCP Gateway. |
| **Notification Rails** | Google Tasks, Calendar, Drive, Telegram Bot | Delivery channels that push alerts to the phone and store files. NOT data stores. Cloud SQL is always the source of truth. |
| **Intelligence Layer** | Next.js PWA Dashboard | What no third-party tool can provide: AI-powered risk surfacing, cross-project analytics, interactive Gantt, and a unified command center reading directly from Cloud SQL. |

**Rule:** Google tools are downstream consumers of Cloud SQL data. They never hold canonical state. If Google Tasks shows a task as complete, the Cloud SQL `tasks` table is updated first (via MCP Gateway), and Google Tasks reflects the change. Not the other way around.

---

## Component Architecture

### 1. Claude.ai — The Thinking Interface (NOW — already operational)

**What it does:** Brainstorming, research, planning, content drafting, email composition, decision-making, visual artifacts, morning briefs, weekly reviews.

**Interface capabilities used:**
- Connectors: Gmail, Calendar, Drive (read)
- Message compose tool for email drafting
- Interactive artifacts (React/HTML) for visual outputs
- Past chats search for session continuity
- Skills (25 active) for structured workflows

**What it creates for the interface layer:**
- Tasks → written to Cloud SQL via MCP Gateway → synced to Google Tasks
- Artifacts (docx, pptx, md, xlsx) → saved to Google Drive via MCP Gateway → metadata logged in Cloud SQL `artifacts` table
- Calendar events → created via Calendar connector for milestone deadlines
- Action plans → stored as structured data in Cloud SQL, not as loose documents

### 2. Google Tasks — Mobile Task Notifications (Phase 2 — build with MCP Gateway)

**What it does:** Receives tasks from the MCP Gateway. Sends push notifications to the phone for due dates. Allows quick task completion on mobile.

**What it does NOT do:** Store canonical task state. Manage subtasks. Provide Kanban views. Run analytics.

**Sync model:**
```
Claude creates task → MCP Gateway writes to Cloud SQL tasks table
                    → MCP Gateway creates Google Task with:
                        - title (from tasks.title)
                        - due date (from tasks.due_date)
                        - notes (link back to project + milestone context)
                    → Google Tasks app sends push notification on due date
                    
User completes in Google Tasks → Webhook/poll updates Cloud SQL tasks.status = 'done'
User completes in Claude.ai → MCP Gateway updates Cloud SQL + Google Tasks
User completes in Dashboard → API updates Cloud SQL + Google Tasks
```

**Google Tasks mapping:**
| Cloud SQL Field | Google Tasks Field | Notes |
|----------------|-------------------|-------|
| `tasks.title` | Task title | Direct map |
| `tasks.due_date` | Due date | Triggers phone notification |
| `tasks.description` | Notes | Include project name + milestone context |
| `tasks.priority` | N/A | Google Tasks has no priority — use title prefix: `[URGENT]`, `[HIGH]` |
| `tasks.project_id` | Task list | One Google Task List per project |
| `tasks.status` | Completed flag | `done` ↔ completed, all others ↔ not completed |

**Task list structure (domain-based since Life Graph v2):**
- `001 Friends and Gatherings` — social domain tasks
- `002 Health` — health and fitness tasks
- `003 Home` — home management tasks
- `004 Finance` — financial tasks
- `005 Learning` — personal learning tasks
- `006 AI Operating System` — AI OS build tasks
- `007 AI&U` — YouTube channel tasks
- `008 Bharatvarsh` — novel and transmedia tasks
- `009 Career` — professional work tasks
- `010 Career Network` — contact/networking tasks (155 contacts linked)
- See LIFE_GRAPH.md for full domain hierarchy.

### 3. Google Calendar — Deadline Alerts (Phase 2 — extend existing connector)

**What it does:** Receives milestone due dates and creates calendar events with reminders. Phone gets push notification 1 day before and on the day.

**Sync model:**
```
Milestone gets due_date in Cloud SQL → MCP Gateway creates Calendar event
                                     → Event title: "[PROJECT] Milestone: {name}"
                                     → Reminders: 1 day before (email), day-of (popup)
                                     → Description: milestone context + link to dashboard (Phase 3)
```

**Calendar structure:**
- Use a dedicated "AI OS Milestones" calendar (separate from personal calendar)
- Color-code by project
- All-day events for milestones, timed events for meetings/deadlines

### 4. Google Drive — Artifact Storage (Phase 2 — build Drive Write MCP module)

**What it does:** Stores Claude-generated documents (PRDs, plans, reports, presentations). Organized by project. Accessible from phone and desktop.

**Folder structure:**
```
AI OS/
├── AI Operating System/
│   ├── PRDs/
│   ├── Architecture/
│   ├── Decision Memos/
│   └── Session Artifacts/
├── AI&U/
│   ├── Scripts/
│   ├── Thumbnails/
│   └── Research/
├── Bharatvarsh/
│   ├── Marketing/
│   ├── Lore Docs/
│   └── Content/
└── Zealogics/
    ├── Project Docs/
    └── Deliverables/
```

**Artifact logging:**
```
Claude generates document → MCP Gateway saves to Drive (correct folder)
                          → MCP Gateway writes to Cloud SQL artifacts table:
                              - project_id (FK to projects)
                              - task_id (FK to tasks, if task-related)
                              - artifact_type (document, design, code, etc.)
                              - file_path (Drive file ID / URL)
                              - name, description, metadata
```

### 5. Telegram Bot — Pocket Command Channel (Phase 3a — deployed)

**Bot:** @AsrAiOsbot
**What it does:** Provides a mobile-first notification channel, lightweight command interface, and personal capture input. Receives scheduled briefs, overdue alerts, and weekly digests. Supports 9 slash commands for quick task management, project status checks, and personal capture from the phone.

**Commands:**
| Command | Action |
|---------|--------|
| `/brief` | On-demand morning brief (projects, tasks, milestones) |
| `/add <task>` | Quick-add a task from Telegram |
| `/done <task_id>` | Mark a task complete |
| `/status` | Project status summary |
| `/log <note>` | Log a quick note to the knowledge base |
| `/j <text>` | Capture a journal entry (mood, energy optional) |
| `/e <text>` | Quick capture (observation) |
| `/ei <text>` | Capture an idea |
| `/em <text>` | Capture a memory recall |

**Scheduled notifications (via Cloud Scheduler):**
- **Morning Brief** (6:30 AM IST) — project snapshot, today's tasks, upcoming milestones
- **Overdue Alerts** (9:00 AM IST) — overdue tasks and at-risk milestones
- **Weekly Digest** (Sunday 7:00 PM IST) — week-in-review with velocity and progress

**AI triage:** Free-form messages are processed by Claude Haiku for intent classification and routed to the appropriate handler. Conversation memory stored in `bot_conversations` table for context continuity.

**What it does NOT do:** Replace the Dashboard for analytics or deep-dive views. It is a quick-action and notification surface.

### 6. Next.js PWA Dashboard — The Intelligence Layer (Phase 3 — custom build)

**What it does:** The AI-powered command center. Reads from Cloud SQL. Surfaces risks, progress, and analytics. The only interface that shows the FULL picture across all projects.

**Tech stack:**
| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Next.js 14+ (App Router) | SSR for initial load speed, API routes for data, PWA support |
| Styling | Tailwind CSS | Consistent with Claude artifact conventions, utility-first |
| Charts | Recharts or Chart.js | Already available in Claude artifact ecosystem |
| Gantt | frappe-gantt or custom D3 | Dependency-aware, interactive, drag-to-reschedule |
| Auth | Google OAuth (NextAuth.js) | Single sign-on with existing Google account |
| Push | Firebase Cloud Messaging (FCM) | Free tier covers all needs, works with PWA service worker |
| Hosting | Cloud Run (asia-south1) | Same project, same service account, scales to zero |
| Database | Cloud SQL (existing) | Direct connection via Cloud SQL Auth Proxy sidecar |

**PWA capabilities:**
- Installable on home screen (Android + iOS)
- Push notifications via service worker + FCM
- Offline-capable for cached dashboard views
- No app store listing, no Apple Developer account
- Full-screen mode with custom splash screen and icon

**iOS limitation acknowledged:** Push notifications require iOS 16.4+. Badge counts not supported. Background refresh limited. Android gets the full experience. This is acceptable because Google Tasks handles critical deadline notifications on both platforms.

**Dashboard pages (by build order):**

**Phase 3a — Core Views (4-6 weeks):**

| Page | What It Shows | Data Source |
|------|--------------|-------------|
| Home / Command Center | Project cards with health scores, today's tasks, upcoming milestones, risk alerts | `projects`, `tasks`, `milestones` |
| Project Detail | Phase progress, milestone timeline, task list, artifacts, tags | `project_phases`, `milestones`, `tasks`, `artifacts` |
| Task Board | Filterable task list (by project, priority, status). Optional Kanban layout. | `tasks` with joins |
| Gantt / Timeline | Interactive Gantt chart. Phases as swim lanes, milestones as diamonds, dependencies as arrows. | `project_phases`, `milestones` |

**Phase 3b — Intelligence Layer (2-3 weeks):**

| Page | What It Shows | Data Source |
|------|--------------|-------------|
| Risk Dashboard | Overdue task clusters, blocked chains, milestone slip trends, velocity warnings | Computed from `tasks`, `milestones` |
| Notifications Center | Push notification history, alert settings, digest preferences | New `notifications` table |
| Settings | Push notification toggles, Google sync status, theme, profile | Config table |

**Phase 4-5 — Extended Views (ongoing):**

| Page | What It Shows | Data Source |
|------|--------------|-------------|
| Content Calendar | Visual calendar for campaigns and posts. Platform-specific previews. | `campaigns`, `campaign_posts` |
| Pipeline Monitor | Category B/C workflow status, last run, success rates, logs | `pipelines`, `pipeline_runs`, `pipeline_logs` |
| Knowledge Explorer | Force-directed graph of knowledge entries and connections | `knowledge_entries`, `knowledge_connections` |
| Analytics | Weekly velocity charts, domain time allocation, trend analysis | Aggregated from all tables |
| Contact Network | Visual network of contacts, relationships, upcoming dates | `contacts`, `contact_relationships`, `important_dates` |

**AI Risk Engine (Background Job):**

A Cloud Function runs daily (or on-demand via dashboard trigger) and computes:
- **Overdue Score:** Count of overdue tasks weighted by priority. Projects with high overdue scores get flagged.
- **Velocity Trend:** Rolling 7-day task completion rate. Declining velocity triggers a warning.
- **Milestone Slip Risk:** If >50% of tasks in a milestone are overdue or blocked, flag the milestone as at-risk.
- **Dependency Chain Risk:** If a blocked task is a prerequisite for other tasks (via milestone hierarchy), flag the downstream tasks.
- **Stale Project Warning:** Projects with no task activity in 14+ days get surfaced.

Results are written to a `risk_alerts` table (new, to be added in Phase 3) and pushed via FCM to the dashboard PWA.

---

## Data Flow Patterns

### Pattern 1: Task Creation (Claude → Phone)
```
1. User in Claude.ai: "Create tasks for MCP Gateway Phase 1"
2. Claude calls MCP Gateway → insert_record (tasks table)
3. MCP Gateway writes task to Cloud SQL
4. MCP Gateway calls Google Tasks API → create task with due date
5. Google Tasks app sends push notification on due date
6. Dashboard (when built) shows task in project view + task board
```

### Pattern 2: Artifact Generation (Claude → Drive → DB)
```
1. User in Claude.ai: "Generate a PRD for the dashboard"
2. Claude creates document (docx/md)
3. Claude calls MCP Gateway → upload_file (Drive) + insert_record (artifacts table)
4. MCP Gateway saves file to Drive (AI OS/AI Operating System/PRDs/)
5. MCP Gateway writes artifact metadata to Cloud SQL (file_path = Drive URL)
6. Dashboard (when built) shows artifact in project detail view
```

### Pattern 3: Deadline Alert (DB → Calendar → Phone)
```
1. Milestone due date set in Cloud SQL (via Claude or Dashboard)
2. Cloud Function (daily) or MCP Gateway (on write) creates Calendar event
3. Calendar event has reminders: 1 day before + day-of
4. Phone gets Calendar push notification
5. Dashboard shows milestone in Gantt + risk dashboard (if approaching/overdue)
```

### Pattern 4: Risk Alert (DB → Dashboard → Phone)
```
1. AI Risk Engine (Cloud Function) runs daily at 06:00 IST
2. Queries overdue tasks, blocked chains, velocity trends from Cloud SQL
3. Writes risk_alerts to Cloud SQL
4. Sends FCM push notification to Dashboard PWA
5. Dashboard shows risk cards on Command Center
6. Optionally: Cloud Function also creates urgent Google Tasks for critical risks
```

### Pattern 5: Progress Update (Dashboard → DB → Claude)
```
1. User marks task complete in Dashboard
2. Dashboard API updates Cloud SQL tasks.status = 'done'
3. Dashboard API updates Google Tasks (mark complete)
4. Next Claude.ai session: /morning-brief or /session-resume reads updated state from DB
5. Claude has current project state without manual updates
```

---

## Schema Additions Required

### Phase 2 — Google Sync Tracking

```sql
-- Add to existing tasks table
ALTER TABLE tasks ADD COLUMN google_task_id TEXT;
ALTER TABLE tasks ADD COLUMN google_task_list TEXT;
ALTER TABLE tasks ADD COLUMN last_synced_at TIMESTAMPTZ;

-- Add to existing milestones table
ALTER TABLE milestones ADD COLUMN google_calendar_event_id TEXT;

-- Add to existing artifacts table
ALTER TABLE artifacts ADD COLUMN drive_file_id TEXT;
ALTER TABLE artifacts ADD COLUMN drive_url TEXT;
```

### Phase 3 — Dashboard Support

```sql
-- Risk alerts (computed by AI Risk Engine)
CREATE TABLE risk_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,  -- 'overdue_cluster', 'velocity_decline', 'milestone_slip', 'dependency_chain', 'stale_project'
    severity TEXT NOT NULL DEFAULT 'medium',  -- 'low', 'medium', 'high', 'critical'
    title TEXT NOT NULL,
    description TEXT,
    affected_tasks UUID[],  -- array of task IDs involved
    affected_milestones UUID[],  -- array of milestone IDs involved
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Push notification log
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,  -- 'risk_alert', 'task_due', 'milestone_approaching', 'pipeline_failure', 'digest'
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',  -- payload for deep linking
    is_sent BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User preferences (dashboard settings, notification preferences)
CREATE TABLE user_preferences (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Deployment Architecture

### Service Topology (Phase 3+)

```
Cloud Run (asia-south1)
├── ai-os-gateway          ← MCP Gateway (FastAPI) — existing plan
│   ├── /mcp/*             ← MCP tool endpoints (Claude.ai, Claude Code, workflows)
│   ├── /api/tasks/sync    ← Google Tasks sync endpoint
│   ├── /api/drive/upload  ← Drive upload endpoint
│   └── /health            ← Health check
│
└── ai-os-dashboard        ← Next.js PWA — NEW
    ├── /                  ← Dashboard UI (SSR)
    ├── /api/*             ← Dashboard API routes (read/write Cloud SQL)
    ├── /sw.js             ← Service worker (push notifications, offline cache)
    └── /manifest.json     ← PWA manifest (installability)
```

**Why two services, not one:**
- Independent scaling (dashboard may get more traffic than MCP Gateway)
- Independent deployment (dashboard UI changes shouldn't redeploy the MCP Gateway)
- Different runtime needs (Next.js vs FastAPI)
- Both scale to zero independently — cost difference is negligible

**Shared infrastructure:**
- Same GCP project (ai-operating-system-490208)
- Same service account (ai-os-cloud-run)
- Same Cloud SQL instance (via Auth Proxy sidecar)
- Same Secret Manager secrets

### Dashboard Deployment Template

```bash
gcloud run deploy ai-os-dashboard \
  --image=asia-south1-docker.pkg.dev/ai-operating-system-490208/ai-os-images/ai-os-dashboard:TAG \
  --region=asia-south1 \
  --service-account=ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com \
  --add-cloudsql-instances=bharatvarsh-website:us-central1:bharatvarsh-db \
  --set-secrets=DB_PASSWORD=AI_OS_DB_PASSWORD:latest \
  --set-env-vars=GOOGLE_CLIENT_ID=xxx,FCM_SERVER_KEY=xxx \
  --min-instances=0 \
  --allow-unauthenticated  # Public access, auth handled by NextAuth.js
```

---

## Design System (Dashboard)

The dashboard follows the same design principles as Claude artifact visuals for consistency across the OS.

**Colors:**
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0d0d14` | Page background |
| `--bg-card` | `#12121e` | Card/panel background |
| `--bg-hover` | `#1a1a2e` | Hover states |
| `--border` | `#1f1f35` | Card borders, dividers |
| `--text-primary` | `#e8e6e1` | Headings, primary text |
| `--text-secondary` | `#a09d95` | Body text |
| `--text-muted` | `#807d75` | Labels, captions |
| `--accent-gold` | `#E8B931` | Warnings, Phase 1 indicators |
| `--accent-teal` | `#4ECDC4` | Success, Phase 3 indicators |
| `--accent-purple` | `#7B68EE` | Primary actions, links, Phase 4+ |
| `--accent-red` | `#FF6B6B` | Errors, critical risks |

**Typography:**
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Display headings | Instrument Serif | 28-42px | 400 |
| Section headings | DM Sans | 16-20px | 600 |
| Body text | DM Sans | 14px | 400 |
| Code / data | JetBrains Mono | 12-13px | 400 |
| Labels / badges | JetBrains Mono | 11px | 600 |

**Component patterns:** Cards with `--bg-card` background, `--border` border, 8px radius. Score bars for metrics. Badges for status. Minimal animation — content over decoration.

---

## Brand Identity System

The OS operates three distinct brand contexts managed via `BRAND_IDENTITY.md`
and the `brand-guidelines` skill. See that document for canonical token tables.

Context routing:
- AI OS System (Context A): Dashboard, PRDs, research docs, infographics, system artifacts
- Bharatvarsh (Context B): Novel content, website, promotional material, lore
- Portfolio (Context C): Personal website, profile content, atharvasingh.com

All visual output from this OS MUST declare its context before applying any tokens.

Skills added:
- `brand-guidelines` — context-aware token dispatch (A/B/C routing)
- `infographic` — dual-mode visual generation (React artifact + matplotlib)
- `ui-design-process` — anti-slop process with Step 0 context declaration

---

## Implementation Phases (Interface-Specific)

### Phase 2: Google Modules (Now → 6 weeks, part of MCP Gateway build)

| Deliverable | Effort | Depends On |
|-------------|--------|------------|
| Google Tasks MCP module (create_task, update_task, complete_task, sync_to_db) | 2-3 days | MCP Gateway scaffold (Phase 1) |
| Google Drive Write MCP module (upload_file, create_doc, create_folder) | 1-2 days | MCP Gateway scaffold |
| Calendar milestone sync (create events with reminders for milestone due dates) | 1 day | Google Calendar connector (already active) |
| Task notification Cloud Function (daily: query overdue → create/update Google Tasks) | 2-3 days | Google Tasks module |
| Schema additions (google_task_id, drive_file_id columns) | 0.5 day | Database access |

**Exit criteria:** Creating a task in Claude.ai results in a Google Tasks notification on the phone within 1 minute. Generating a document in Claude.ai results in a Drive file accessible from the phone.

### Phase 3: Dashboard PWA (6-12 weeks)

| Deliverable | Effort | Depends On |
|-------------|--------|------------|
| Next.js scaffold + Cloud Run deployment + PWA manifest | 3-4 days | GCP infra (already provisioned) |
| Google OAuth (NextAuth.js) | 1 day | Google OAuth client ID |
| Command Center (project cards, health scores, today's tasks) | 1 week | Cloud SQL access |
| Project Detail (phases, milestones, tasks, artifacts) | 1 week | Command Center |
| Interactive Gantt (phases as lanes, milestones as diamonds, drag-to-reschedule) | 1 week | Project Detail |
| Task Board (filterable, optional Kanban) | 3-4 days | Cloud SQL access |
| AI Risk Engine (Cloud Function + risk_alerts table) | 3-4 days | Schema additions |
| Push notification system (service worker + FCM) | 2-3 days | FCM setup |
| Risk Dashboard (overdue clusters, velocity trends, blocked chains) | 3-4 days | AI Risk Engine |

**Exit criteria:** Dashboard is installable on phone home screen. Shows project health at a glance. Sends push notifications for risk alerts. Gantt chart is interactive and reads from live data.

### Phase 4-5: Extended Views (3-6 months)

| Deliverable | Effort | Depends On |
|-------------|--------|------------|
| Content Calendar (campaigns, posts, platform previews) | 1 week | campaigns + campaign_posts tables |
| Pipeline Monitor (workflow status, logs, success rates) | 3-4 days | pipeline_runs table populated |
| Knowledge Explorer (force-directed graph) | 1 week | knowledge_entries populated |
| Analytics (velocity charts, domain allocation, trends) | 1 week | Sufficient task history data |
| Contact Network (visual graph + upcoming dates) | 3-4 days | contacts data |

---

## Cost Model (Interface Layer)

| Component | Phase | Monthly Cost |
|-----------|-------|-------------|
| Google Tasks (free tier) | 2 | $0 |
| Google Calendar (free tier) | 2 | $0 |
| Google Drive (15 GB free) | 2 | $0 |
| MCP Gateway (Cloud Run, scale-to-zero) | 1-2 | $0-7 |
| Dashboard (Cloud Run, scale-to-zero) | 3+ | $3-8 |
| Firebase Cloud Messaging (free tier) | 3+ | $0 |
| **Total interface layer** | | **$3-15/month** |

---

## Rejected Alternatives

### Notion (Option A — rejected)
- **Why rejected:** Data bifurcation (two sources of truth), sync fragility (Notion API rate limits), cost ($10/month for Pro), no AI-native analytics, limited Gantt (no dependencies).
- **When to reconsider:** If Notion releases a first-party MCP connector with real-time sync AND Cloud SQL can be deprecated as the single source of truth. Unlikely.

### Full Custom Native Mobile (Option B — rejected)
- **Why rejected:** 3-6 month development before any value, native mobile doubles codebase, competes with Zealogics onboarding bandwidth, over-engineered for current needs.
- **When to reconsider:** If PWA push notification limitations on iOS become a real problem AND the dashboard has enough usage to justify a dedicated mobile app.

---

*Update this document when interface components are built, Google modules go live, dashboard pages ship, or the deployment topology changes.*
