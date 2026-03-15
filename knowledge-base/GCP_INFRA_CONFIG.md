# GCP Infrastructure Configuration

> **Purpose:** Canonical reference for all GCP project config, service accounts, database access, secrets, and deployment patterns. Referenced by /workflow-designer, /build-prd, /tech-eval, and any skill that deploys or connects to infrastructure.
>
> **Last updated:** 2026-03-15 (Dashboard deployed to Cloud Run, ai-os-dashboard image live, 8 secrets, DASHBOARD_OAUTH_SECRET created)

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
| Extensions | pgvector 0.8.1, pg_trgm, moddatetime |

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
| ai-os-gateway | FastAPI | MCP Gateway — tool bridge for Claude.ai, Claude Code, workflows | Bearer token / API key | LIVE (asia-south1, scale-to-zero) | https://ai-os-gateway-1054489801008.asia-south1.run.app |
| ai-os-dashboard | Next.js | PWA Dashboard — project views, Gantt, task board, milestone management | Google OAuth (NextAuth.js) | LIVE (asia-south1, scale-to-zero) | https://ai-os-dashboard-sv4fbx5yna-el.a.run.app |

Both services share the same service account (ai-os-cloud-run), the same Cloud SQL instance (via Auth Proxy sidecar), and the same Secret Manager secrets. They scale to zero independently.

See INTERFACE_STRATEGY.md for full dashboard specification and TOOL_ECOSYSTEM_PLAN.md for full gateway module inventory.

---

## 9. Cloud Build Triggers

| Trigger Name | Source | Watches | Action | Status |
|-------------|--------|---------|--------|--------|
| deploy-mcp-gateway | GitHub: AtharvaSin/ai-os-project, branch main | `mcp-servers/ai-os-gateway/**` | Build image → push to Artifact Registry → deploy to Cloud Run | Active |
| deploy-ai-os-dashboard | — | `dashboard/**` | Build image → push to Artifact Registry → deploy to Cloud Run | NOT CREATED (manual deploy only) |

---

## 10. Deferred Items

- SSL enforcement on Cloud SQL instance — skipped to avoid disrupting live Bharatvarsh website
- Authorized networks cleanup — a residential IP is in the allowlist; needs review
- postgres user password rotation — was reset during setup; should be stored securely
- Firebase project setup — needed before Phase 3b (FCM for push notifications)
- Cloud Build trigger for dashboard — needed for automated deployments

---

*Update this document after any infrastructure change: new service accounts, secrets, APIs, or database configuration.*
