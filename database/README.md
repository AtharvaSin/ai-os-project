# AI OS Database Layer

## Overview

The AI Operating System uses PostgreSQL (via GCP Cloud SQL) as its persistence layer. The database stores project state, contacts, pipeline logs, knowledge entries with vector embeddings, and skill registry data.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Cloud SQL Instance: bharatvarsh-db (us-central1)       │
│  Host Project: bharatvarsh-website                      │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  bharatvarsh  │  │    ai_os     │ ← AI OS database   │
│  │  (website DB) │  │  (this one)  │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
         │                    │
         │                    ├── Cloud Run (MCP server, via Auth Proxy sidecar)
         │                    ├── Cloud Functions (Category B, via python-connector)
         │                    └── Local dev (via cloud-sql-proxy on localhost:5432)
         │
         └── Bharatvarsh website (Next.js via Prisma)
```

## Database: ai_os

- **User:** ai_os_admin (full privileges, no access to bharatvarsh DB)
- **Extensions:** pgvector 0.8.1, pg_trgm, moddatetime
- **Encoding:** UTF8, en_US.UTF8

## Schema Domains (4 migration groups)

1. **Projects** (001) — Project management: projects, phases, milestones, tasks, artifacts, tags
2. **Contacts** (002) — Reference records: contacts, relationships, important_dates, audiences, audience_members
3. **Pipelines** (003) — Execution tracking: pipelines, pipeline_runs, pipeline_logs, campaigns, campaign_posts
4. **Knowledge** (004) — Intelligence layer: knowledge_entries, knowledge_embeddings (pgvector), knowledge_connections, skill_registry, skill_evolution_log

## Key Capabilities

- **Vector search:** pgvector HNSW index on knowledge_embeddings for semantic similarity queries via `match_knowledge()` function
- **Graph traversal:** Relational CTEs on knowledge_connections table via `traverse_knowledge()` function (2-3 hop depth)
- **Full-text search:** tsvector indexes on contacts and knowledge_entries for keyword search
- **JSONB flexibility:** Pipeline metrics, campaign performance, audience criteria stored as JSONB for schema-flexible data

## Connection

```python
# Cloud Functions pattern
from google.cloud.sql.connector import Connector
connector = Connector()
conn = connector.connect(
    "bharatvarsh-website:us-central1:bharatvarsh-db",
    "pg8000",
    user="ai_os_admin",
    password=db_password,  # from Secret Manager
    db="ai_os"
)
```

```python
# Cloud Run pattern (via Auth Proxy sidecar on Unix socket)
import psycopg2
conn = psycopg2.connect(
    host="/cloudsql/bharatvarsh-website:us-central1:bharatvarsh-db",
    user="ai_os_admin",
    password=db_password,
    dbname="ai_os"
)
```

## Files

```
database/
├── README.md              ← This file
├── DB_SCHEMA.md           ← Auto-generated schema docs (after migrations)
├── migrations/
│   ├── README.md          ← Migration conventions and status
│   ├── apply.sh           ← Migration runner script
│   ├── 001_projects.sql   ← Project management tables
│   ├── 002_contacts.sql   ← Contact and reference records
│   ├── 003_pipelines.sql  ← Pipeline execution tracking
│   └── 004_knowledge.sql  ← Knowledge, embeddings, skills
└── seeds/
    ├── seed_projects.sql  ← Initial project data from WORK_PROJECTS.md
    ├── seed_contacts.sql  ← Contacts with birthdays for Birthday Wishes
    └── seed_pipelines.sql ← Pipeline definitions
```

## Supabase Migration Path

If Supabase convenience features are ever needed:
1. `pg_dump --format=custom ai_os > ai_os_backup.dump`
2. Create Supabase project, `pg_restore` the dump
3. Enable pgvector in Supabase dashboard
4. Update connection strings in Secret Manager
5. Redeploy services — zero schema changes needed
