# Sprint Retrospective: Sprint 2 -- GCP Infrastructure + Google Modules

## Context

Sprint 2 (Entry 003-004, 2026-03-14) transitioned the AI OS from a document-only system to a full cloud-backed platform. The goal was to provision GCP infrastructure, build the database layer, and design the tool ecosystem architecture that would govern all future tool additions.

## Decision / Content

### What Was Delivered
- **GCP project provisioned:** ai-operating-system-490208 in asia-south1 with 16 enabled APIs
- **3 service accounts created:** ai-os-cloud-run, ai-os-cloud-functions, ai-os-cicd
- **Artifact Registry configured:** Docker format repository for container images
- **Cloud SQL database created:** ai_os database on shared bharatvarsh-db instance with pgvector
- **4 migrations applied:** 21 tables across 4 schema domains (Project Management, Contacts, Pipelines, Knowledge)
- **DB_SCHEMA.md generated:** Canonical schema reference auto-generated from live database
- **Tool Ecosystem Plan designed:** Three-tier architecture (Directory Connectors, Unified Gateway, Local STDIO)
- **Decision tree created:** Framework for where new tools should live

### What Went Well
- **Shared instance decision saved cost:** Reusing bharatvarsh-db avoided $7-15/month in new instance costs
- **pgvector from day one:** Installing pgvector during initial setup avoided a retroactive migration later
- **Schema completeness:** All 4 domains designed upfront prevented multiple small migration cycles
- **Cross-project IAM worked:** All three service accounts got cloudsql.client on the bharatvarsh-website project without issues

### What Could Be Improved
- **Cross-region latency not measured:** The ~200-280ms estimate was theoretical. Should have benchmarked actual query times from asia-south1 to us-central1.
- **Seed data deferred:** Tables were created empty. Seeding was deferred to Sprint 3, which delayed meaningful testing of the dashboard.
- **Too many tables at once:** 21 tables in one sprint is ambitious. Some tables (campaigns, campaign_posts) had no immediate use case and could have been deferred.

### Key Metrics
- GCP APIs enabled: 16
- Service accounts: 3
- Database tables: 21
- Schema domains: 4
- Migrations applied: 4
- Secrets created: 2 (AI_OS_DB_PASSWORD, AI_OS_DB_INSTANCE)
- Cost added: $0 (shared instance)

## Consequences

- The database became the single source of truth for all project state
- The tool ecosystem decision tree established a clear framework that prevented ad-hoc tool proliferation
- pgvector + knowledge tables laid the groundwork for the Knowledge Layer V2

## Related

- Decision: Cloud SQL Shared Instance (key decision made during this sprint)
- Decision: Unified MCP Gateway (designed during this sprint)
- Retro: Sprint 1 -- Foundation (predecessor sprint)
- Retro: Sprint 3a -- Dashboard Build (next sprint, consumed the schema)
- Reference: Database Schema Overview (output of this sprint)
