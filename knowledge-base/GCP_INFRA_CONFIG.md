# GCP Infrastructure Configuration

> **Purpose:** Canonical reference for all GCP project config, service accounts, database access, secrets, and deployment patterns. Referenced by /workflow-designer, /build-prd, /tech-eval, and any skill that deploys or connects to infrastructure.
>
> **Last updated:** 2026-03-18 (State v11. 13 Cloud Run services all LIVE. 14 Cloud Scheduler jobs (10 enabled, 4 paused). 13 secrets. Sprint 10-A Contact Intelligence + Sprint 10-B Bharatvarsh Lore Layer.)

---

## 1. Project Identity

| Property | Value |
|----------|-------|
| Project ID | ai-operating-system-490208 |
| Project Number | 1054489801008 |
| Primary Region | asia-south1 (Mumbai) |
| Owner | aiwithasr@gmail.com |

---

## 2. Enabled APIs

Cloud Run, Cloud Functions, Cloud Scheduler, Secret Manager, Artifact Registry, Cloud Build, Compute Engine, IAM, Resource Manager, Cloud Logging, Cloud Monitoring, Pub/Sub, Cloud SQL Admin, Google Tasks API, Google Drive API, Google Calendar API — 16 APIs covering the full Category B (scheduled functions) and Category C (agentic Cloud Run) architecture plus Google workspace integrations.

**Planned additions (Phase 3b):** Firebase Cloud Messaging API (for PWA push notifications).

---

## 3. Service Accounts

| Service Account | Purpose | Key Roles |
|----------------|---------|-----------|
| ai-os-cloud-run@... | Cloud Run (Category C services, MCP Gateway, Dashboard) | run.admin, secretmanager.secretAccessor, logging.logWriter, monitoring.metricWriter |
| ai-os-cloud-functions@... | Cloud Functions (Category B pipelines) | cloudfunctions.invoker, run.invoker, secretmanager.secretAccessor, logging.logWriter, cloudscheduler.admin, pubsub.publisher |
| ai-os-cicd@... | Cloud Build CI/CD | cloudbuild.builds.builder, run.admin, cloudfunctions.developer, artifactregistry.writer, iam.serviceAccountUser, logging.logWriter, secretmanager.secretAccessor |

All three have `roles/cloudsql.client` on the bharatvarsh-website project (cross-project IAM) for database access.

---

## 4. Database — Cloud SQL (Cross-Project)

AI OS shares the existing bharatvarsh-db instance from the bharatvarsh-website GCP project. Zero additional cost.

| Property | Value |
|----------|-------|
| Instance | bharatvarsh-db |
| Host Project | bharatvarsh-website |
| Connection Name | bharatvarsh-website:us-central1:bharatvarsh-db |
| Public IP | 35.222.127.23 |
| PostgreSQL Version | 15 |
| Tier | db-custom-1-3840 (1 vCPU, 3.75 GB RAM) |
| Disk | 20 GB SSD |
| AI OS Database | ai_os (UTF8, en_US.UTF8) |
| AI OS User | ai_os_admin (full privileges on ai_os, no access to bharatvarsh) |
| Extensions | pgvector 0.8.1, pg_trgm, moddatetime, ltree 1.2 |

### Connection Patterns

- **Cloud Run (MCP Gateway):** Auth Proxy sidecar (Unix socket, zero-config TLS). Add `--add-cloudsql-instances=bharatvarsh-website:us-central1:bharatvarsh-db` to deploy command.
- **Cloud Run (Dashboard):** Same Auth Proxy sidecar pattern. Uses `pg` npm package with Unix socket path `/cloudsql/bharatvarsh-website:us-central1:bharatvarsh-db`.
- **Cloud Functions:** `cloud-sql-python-connector[pg8000]` library. Use the connector's `connect()` method with instance connection name.
- **Local dev:** `cloud-sql-proxy bharatvarsh-website:us-central1:bharatvarsh-db` on localhost:5432.

### Cross-Region Note

Instance is in us-central1, services deploy to asia-south1. The ~200-280ms latency is acceptable because AI API calls (2-10s) dominate total request time. If latency becomes an issue, migrate to an asia-south1 instance.

### Backups

Enabled at 03:00 UTC, 7 retained, point-in-time recovery on, 7-day transaction log retention.

---

## 5. Artifact Registry

| Property | Value |
|----------|-------|
| Repository | ai-os-images (Docker format) |
| URL | asia-south1-docker.pkg.dev/ai-operating-system-490208/ai-os-images |
| Auth | Docker auth configured and ready for pushes |

**Images:**
| Image | Service | Status | Size |
|-------|---------|--------|------|
| ai-os-gateway | MCP Gateway (FastAPI) | LIVE (latest: be26f7c) | ~107MB |
| ai-os-dashboard | Dashboard PWA (Next.js) | LIVE (latest: sha256:b690e1a5...) | ~78MB |
| telegram-notifications | Telegram Bot Notifications | LIVE | ~60MB |
| embedding-generator | Knowledge Embedding Pipeline | LIVE | ~50MB |
| drive-knowledge-scanner | Drive Knowledge Scanner | LIVE | ~50MB |
| weekly-knowledge-summary | Weekly Knowledge Summaries | LIVE | ~50MB |
| knowledge-auto-connector | Knowledge Auto-Connector | LIVE | ~50MB |
| risk-engine | Risk Engine | LIVE | ~50MB |
| daily-brief-engine | Daily Brief Engine | LIVE | ~50MB |
| task-annotation-sync | Task Annotation Sync | LIVE | ~50MB |
| domain-health-scorer | Domain Health Scorer | LIVE | ~50MB |
| journal-monthly-distill | Journal Monthly Distill | LIVE | ~50MB |

---

## 6. Secret Manager

| Secret | Contents | Used By |
|--------|----------|---------|
| AI_OS_DB_PASSWORD | ai_os_admin database password | Cloud Run (Gateway + Dashboard), Cloud Functions |
| AI_OS_DB_INSTANCE | Connection name string | Cloud Run, Cloud Functions |
| MCP_GATEWAY_API_KEY | Bearer token for MCP Gateway auth | Cloud Run (Gateway), Claude Code |
| GOOGLE_CLIENT_ID | OAuth Desktop client ID (MCP Gateway) | Cloud Run (Gateway) |
| GOOGLE_CLIENT_SECRET | OAuth Desktop client secret (MCP Gateway) | Cloud Run (Gateway) |
| GOOGLE_REFRESH_TOKEN | OAuth refresh token (MCP Gateway) | Cloud Run (Gateway) |
| NEXTAUTH_SECRET | NextAuth.js session encryption key | Cloud Run (Dashboard) |
| DASHBOARD_OAUTH_SECRET | Web Application OAuth client secret (Dashboard) | Cloud Run (Dashboard) |
| TELEGRAM_BOT_TOKEN | Telegram Bot API token (@AsrAiOsbot) | Cloud Run (telegram-notifications, MCP Gateway) |
| TELEGRAM_CHAT_ID | Owner's Telegram chat ID for bot notifications | Cloud Run (telegram-notifications) |
| OPENAI_API_KEY | OpenAI API key (text-embedding-3-small) | Cloud Run (embedding-generator, MCP Gateway) |
| ANTHROPIC_API_KEY | Anthropic API key (Claude Haiku for pipelines) | Cloud Run (weekly-knowledge-summary, knowledge-auto-connector, telegram-notifications, daily-brief-engine) |
| TELEGRAM_WEBHOOK_SECRET | Webhook verification secret for Telegram updates | Cloud Run (telegram-notifications) |

---

## 7. Deployment Templates

### Category B (Cloud Functions)

```bash
gcloud functions deploy FUNCTION_NAME \
  --gen2 \
  --runtime=python312 \
  --region=asia-south1 \
  --source=. \
  --entry-point=main \
  --trigger-http \
  --service-account=ai-os-cloud-functions@ai-operating-system-490208.iam.gserviceaccount.com \
  --set-secrets=DB_PASSWORD=AI_OS_DB_PASSWORD:latest,DB_INSTANCE=AI_OS_DB_INSTANCE:latest
```

### Category C — MCP Gateway (Cloud Run)

```bash
gcloud run deploy ai-os-gateway \
  --image=asia-south1-docker.pkg.dev/ai-operating-system-490208/ai-os-images/ai-os-gateway:TAG \
  --region=asia-south1 \
  --service-account=ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com \
  --add-cloudsql-instances=bharatvarsh-website:us-central1:bharatvarsh-db \
  --set-secrets=DB_PASSWORD=AI_OS_DB_PASSWORD:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,GOOGLE_REFRESH_TOKEN=GOOGLE_REFRESH_TOKEN:latest \
  --min-instances=0 \
  --no-allow-unauthenticated
```

### Dashboard PWA (Cloud Run)

```bash
gcloud run deploy ai-os-dashboard \
  --image=asia-south1-docker.pkg.dev/ai-operating-system-490208/ai-os-images/ai-os-dashboard:TAG \
  --region=asia-south1 \
  --service-account=ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com \
  --add-cloudsql-instances=bharatvarsh-website:us-central1:bharatvarsh-db \
  --set-secrets=DB_PASSWORD=AI_OS_DB_PASSWORD:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest \
  --set-env-vars=DB_NAME=ai_os,DB_USER=ai_os_admin,DB_HOST=/cloudsql/bharatvarsh-website:us-central1:bharatvarsh-db \
  --min-instances=0 \
  --max-instances=3 \
  --memory=512Mi \
  --cpu=1 \
  --allow-unauthenticated
```

**Note:** Dashboard uses `--allow-unauthenticated` because auth is handled at the application layer by NextAuth.js (Google OAuth). This allows the PWA service worker to register and receive push notifications.

---

## 8. Cloud Run Service Topology

| Service | Container | Purpose | Auth | Status | URL |
|---------|-----------|---------|------|--------|-----|
| ai-os-gateway | FastAPI | MCP Gateway — 56 tools (10 modules: postgres, google_tasks, drive_write, drive_read, calendar_sync, telegram, life_graph, capture, contacts, bharatvarsh), Telegram webhook | Bearer token / API key | LIVE (asia-south1, scale-to-zero) | https://ai-os-gateway-1054489801008.asia-south1.run.app |
| ai-os-dashboard | Next.js | PWA Dashboard — 9 pages, 23 API routes, 28 components | Google OAuth (NextAuth.js) | LIVE (asia-south1, scale-to-zero) | https://ai-os-dashboard-sv4fbx5yna-el.a.run.app |
| task-notification-daily | Python + functions-framework | Daily overdue/upcoming task scan + Google Tasks sync | OIDC (Cloud Scheduler) | LIVE (asia-south1, scale-to-zero) | https://task-notification-daily-sv4fbx5yna-el.a.run.app |
| telegram-notifications | Python + FastAPI | Telegram bot: scheduled briefs, overdue alerts, weekly digest, AI triage | OIDC (Cloud Scheduler) + Telegram webhook | LIVE (asia-south1, scale-to-zero) | https://telegram-notifications-sv4fbx5yna-el.a.run.app |
| embedding-generator | Python | Knowledge embedding pipeline (text-embedding-3-small) | OIDC (Cloud Scheduler) | LIVE (asia-south1, scale-to-zero) | — |
| drive-knowledge-scanner | Python | Drive Knowledge/ folder scanner, chunker, ingester | OIDC (Cloud Scheduler) | LIVE (asia-south1, scale-to-zero) | — |
| weekly-knowledge-summary | Python | Per-project knowledge summaries via Claude Haiku | OIDC (Cloud Scheduler) | LIVE (asia-south1, scale-to-zero) | — |
| knowledge-auto-connector | Python | Cross-domain cosine similarity + relationship classification | OIDC (Cloud Scheduler) | LIVE (asia-south1, scale-to-zero) | — |
| domain-health-scorer | Python | Weekly domain health score computation | OIDC (Cloud Scheduler) | LIVE (asia-south1, scale-to-zero) | domain-health-scorer-1054489801008.asia-south1.run.app |
| risk-engine | Python | AI Risk Engine — 5 risk types, Telegram alerts | OIDC (Cloud Scheduler) | LIVE (asia-south1, scale-to-zero) | https://risk-engine-1054489801008.asia-south1.run.app |
| daily-brief-engine | Python + FastAPI | Daily brief — collectors + AI composer + multi-channel | OIDC (Cloud Scheduler) | LIVE (asia-south1, scale-to-zero) | https://daily-brief-engine-1054489801008.asia-south1.run.app |
| task-annotation-sync | Python | Google Tasks annotation capture every 15 min | OIDC (Cloud Scheduler) | LIVE (asia-south1, scale-to-zero) | https://task-annotation-sync-1054489801008.asia-south1.run.app |
| journal-monthly-distill | Python | Monthly journal distillation via Claude Haiku (28th) | OIDC (Cloud Scheduler) | LIVE (asia-south1, scale-to-zero) | — |

13 Cloud Run services (all live). Gateway and Dashboard share service account `ai-os-cloud-run`. Task notification and telegram-notifications use `ai-os-cloud-functions`. All use Cloud SQL Auth Proxy sidecar and scale to zero independently.

See INTERFACE_STRATEGY.md for full dashboard specification and TOOL_ECOSYSTEM_PLAN.md for full gateway module inventory.

---

## 9. Cloud Build Triggers

| Trigger Name | Source | Watches | Action | Status |
|-------------|--------|---------|--------|--------|
| deploy-mcp-gateway | GitHub: AtharvaSin/ai-os-project, branch main | `mcp-servers/ai-os-gateway/**` | Build image → push to Artifact Registry → deploy to Cloud Run | Active |
| deploy-ai-os-dashboard | GitHub: AtharvaSin/ai-os-project, branch main | `dashboard/**` | Build image → push to Artifact Registry → deploy to Cloud Run | Active |

### Cloud Scheduler Jobs

| Job Name | Schedule | Target | Auth | Status |
|----------|----------|--------|------|--------|
| task-notification-daily-trigger | `0 6 * * *` (06:00 IST) | https://task-notification-daily-sv4fbx5yna-el.a.run.app | OIDC (ai-os-cloud-functions SA) | Paused |
| telegram-morning-brief | `30 1 * * *` (06:30 AM IST / 01:30 UTC) | https://telegram-notifications-sv4fbx5yna-el.a.run.app/cron/morning-brief | OIDC (ai-os-cloud-functions SA) | Paused |
| telegram-overdue-alerts | `30 3 * * *` (09:00 AM IST / 03:30 UTC) | https://telegram-notifications-sv4fbx5yna-el.a.run.app/cron/overdue-alerts | OIDC (ai-os-cloud-functions SA) | Paused |
| telegram-weekly-digest | `30 13 * * 0` (07:00 PM IST Sunday / 13:30 UTC) | https://telegram-notifications-sv4fbx5yna-el.a.run.app/cron/weekly-digest | OIDC (ai-os-cloud-functions SA) | Paused |
| embedding-generator-trigger | `0 2 * * 0` (weekly Sunday 2 AM UTC) | embedding-generator Cloud Run | OIDC (ai-os-cloud-functions SA) | Enabled |
| drive-scanner-trigger | `0 0 * * *` (06:00 IST / 00:30 UTC) | drive-knowledge-scanner Cloud Run | OIDC (ai-os-cloud-functions SA) | Enabled |
| weekly-summary-trigger | `0 16 * * 0` (22:00 IST Sunday / 16:30 UTC) | weekly-knowledge-summary Cloud Run | OIDC (ai-os-cloud-functions SA) | Enabled |
| auto-connector-trigger | `0 17 * * 0` (23:00 IST Sunday / 17:30 UTC) | knowledge-auto-connector Cloud Run | OIDC (ai-os-cloud-functions SA) | Enabled |
| domain-health-scorer | `0 18 * * 0` (Sunday 6 PM IST / 12:30 UTC) | domain-health-scorer Cloud Run (POST /cron/compute-health) | OIDC (ai-os-cloud-functions SA) | Enabled |
| risk-engine-daily-trigger | `30 1 * * *` (06:30 IST) | risk-engine Cloud Run (POST /cron/assess-risks) | OIDC (ai-os-cloud-functions SA) | Enabled |
| daily-brief-engine-trigger | `45 0 * * *` (06:15 IST) | daily-brief-engine Cloud Run (POST /cron/daily-brief) | OIDC (ai-os-cloud-functions SA) | Enabled |
| task-annotation-sync-trigger | `*/15 * * * *` (every 15 min) | task-annotation-sync Cloud Run | OIDC (ai-os-cloud-functions SA) | Enabled |
| journal-monthly-distill | `0 3 28 * *` (28th monthly, 08:30 IST) | journal-monthly-distill Cloud Run | OIDC (ai-os-cloud-functions SA) | Enabled |
| monthly-knowledge-distill-reminder | `0 0 1 * *` (1st of month) | — (reminder only) | — | Enabled |

14 Cloud Scheduler jobs (10 enabled, 4 paused). Paused jobs: task-notification-daily-trigger, telegram-morning-brief, telegram-overdue-alerts, telegram-weekly-digest.

---

## 10. Deferred Items

- SSL enforcement on Cloud SQL instance — skipped to avoid disrupting live Bharatvarsh website
- Authorized networks cleanup — a residential IP is in the allowlist; needs review
- postgres user password rotation — was reset during setup; should be stored securely
- Firebase project setup — needed before Phase 3b (FCM for push notifications)
- Cloud Functions Gen 2 buildpack broken — buildpack creator exits immediately (all functions, all regions). Using Cloud Run + Dockerfile as workaround

---

*Update this document after any infrastructure change: new service accounts, secrets, APIs, or database configuration.*
