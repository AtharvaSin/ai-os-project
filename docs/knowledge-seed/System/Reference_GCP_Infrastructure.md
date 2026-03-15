# Reference: GCP Infrastructure

## Context

This is the canonical reference for all Google Cloud Platform infrastructure provisioned for the AI Operating System. All deployment commands, secret references, and service account configurations should reference this document.

## Decision / Content

### Project Identity
- **Project ID:** ai-operating-system-490208
- **Project Number:** 1054489801008
- **Primary Region:** asia-south1 (Mumbai)
- **Owner:** aiwithasr@gmail.com

### Enabled APIs (16)
Cloud Run, Cloud Functions, Cloud Scheduler, Secret Manager, Artifact Registry, Cloud Build, Compute Engine, IAM, Resource Manager, Cloud Logging, Cloud Monitoring, Pub/Sub, Cloud SQL Admin, Google Tasks API, Google Drive API, Google Calendar API.

Planned addition: Firebase Cloud Messaging API (Phase 3b, for PWA push notifications).

### Service Accounts

| Service Account | Purpose | Key Roles |
|----------------|---------|-----------|
| ai-os-cloud-run | Cloud Run services (MCP Gateway, Dashboard) | run.admin, secretmanager.secretAccessor, logging.logWriter, monitoring.metricWriter |
| ai-os-cloud-functions | Cloud Functions (Category B pipelines) | cloudfunctions.invoker, run.invoker, secretmanager.secretAccessor, logging.logWriter, cloudscheduler.admin, pubsub.publisher |
| ai-os-cicd | Cloud Build CI/CD | cloudbuild.builds.builder, run.admin, cloudfunctions.developer, artifactregistry.writer, iam.serviceAccountUser, logging.logWriter, secretmanager.secretAccessor |

All three have `roles/cloudsql.client` on the bharatvarsh-website project for cross-project database access.

### Secret Manager (8 secrets)
- AI_OS_DB_PASSWORD -- Database password for ai_os_admin
- AI_OS_DB_INSTANCE -- Cloud SQL connection name string
- MCP_GATEWAY_API_KEY -- Bearer token for MCP Gateway authentication
- GOOGLE_CLIENT_ID -- OAuth Desktop client ID (MCP Gateway)
- GOOGLE_CLIENT_SECRET -- OAuth Desktop client secret (MCP Gateway)
- GOOGLE_REFRESH_TOKEN -- OAuth refresh token (MCP Gateway)
- NEXTAUTH_SECRET -- NextAuth.js session encryption key (Dashboard)
- DASHBOARD_OAUTH_SECRET -- Web Application OAuth client secret (Dashboard)

### Artifact Registry
- **Repository:** ai-os-images (Docker format)
- **URL:** asia-south1-docker.pkg.dev/ai-operating-system-490208/ai-os-images
- **Images:** ai-os-gateway (~107MB), ai-os-dashboard (~78MB)

### Cloud Run Services
- **ai-os-gateway** -- MCP Gateway (FastAPI), Bearer token auth, LIVE
- **ai-os-dashboard** -- Dashboard PWA (Next.js), Google OAuth, LIVE
- **task-notification-daily** -- Daily overdue scan (Python), OIDC auth, LIVE

### Cloud Build Triggers
- **deploy-mcp-gateway** -- Fires on push to main when `mcp-servers/ai-os-gateway/**` changes
- **deploy-ai-os-dashboard** -- Fires on push to main when `dashboard/**` changes

### Cloud Scheduler
- **task-notification-daily-trigger** -- Runs at 06:00 IST daily, targets task-notification-daily service

## Consequences

- All infrastructure is in a single GCP project for simplified IAM and billing
- Cross-project Cloud SQL access adds IAM complexity but saves database costs
- 8 secrets must be rotated periodically (especially GOOGLE_REFRESH_TOKEN)

## Related

- Decision: Cloud SQL Shared Instance (database lives in a different GCP project)
- Decision: Scale-to-Zero Cloud Run (all services use min-instances=0)
- Decision: Unified MCP Gateway (gateway deployment details)
- Decision: Dashboard as PWA (dashboard deployment details)
