# Architecture Decision: Cloud SQL Shared Instance

## Context

The AI Operating System needed a relational database with vector search capabilities (pgvector) for its knowledge layer, project management, contacts, and pipeline tracking. Two options existed: provision a new Cloud SQL instance in the AI OS GCP project (asia-south1), or share the existing bharatvarsh-db instance from the Bharatvarsh website GCP project (us-central1).

The key trade-off was cost versus latency. A new instance would add $7-15/month in fixed costs but be co-located with services in asia-south1. Sharing the existing instance would be free but introduce cross-region latency.

## Decision / Content

**Share the existing bharatvarsh-db Cloud SQL instance** from the bharatvarsh-website GCP project.

### Instance Details
- **Instance:** bharatvarsh-db
- **Host project:** bharatvarsh-website
- **Connection name:** bharatvarsh-website:us-central1:bharatvarsh-db
- **PostgreSQL version:** 15
- **Tier:** db-custom-1-3840 (1 vCPU, 3.75 GB RAM, 20 GB SSD)
- **AI OS database:** ai_os (separate from the bharatvarsh database)
- **AI OS user:** ai_os_admin (full privileges on ai_os, no access to bharatvarsh)
- **Extensions:** pgvector 0.8.1, pg_trgm, moddatetime

### Cross-Project Access
All three AI OS service accounts (ai-os-cloud-run, ai-os-cloud-functions, ai-os-cicd) have `roles/cloudsql.client` on the bharatvarsh-website project via cross-project IAM bindings.

### Connection Patterns
- **Cloud Run services:** Auth Proxy sidecar (Unix socket, zero-config TLS)
- **Cloud Functions:** cloud-sql-python-connector with pg8000
- **Local development:** cloud-sql-proxy CLI on localhost:5432

### Cross-Region Latency
Instance is in us-central1, services deploy to asia-south1. The ~200-280ms additional latency is acceptable because AI API calls (2-10 seconds) dominate total request time. Database queries are a small fraction of end-to-end latency.

## Consequences

- **Enables:** Zero additional database cost. Immediate availability (no provisioning delay). Shared backup infrastructure.
- **Constrains:** Cross-region latency of ~200-280ms per query. Cannot enforce SSL without potentially disrupting the Bharatvarsh website. Schema changes must be careful not to affect the bharatvarsh database.
- **Changes:** If latency becomes a bottleneck (unlikely given AI API call dominance), the migration path is to create an asia-south1 instance and pg_dump/pg_restore the ai_os database.
- **Risk:** A residential IP is in the authorized networks allowlist and needs periodic review.

## Related

- Reference: GCP Infrastructure (full connection details and deployment templates)
- Reference: Database Schema Overview (21 tables across 4 domains in ai_os)
- Decision: Three-Category Architecture (all categories connect to this shared instance)
