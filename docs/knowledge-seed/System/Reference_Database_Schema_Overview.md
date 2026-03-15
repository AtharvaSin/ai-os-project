# Reference: Database Schema Overview

## Context

The AI OS database (`ai_os`) on the shared bharatvarsh-db Cloud SQL instance contains 21 tables organized across 4 schema domains. This reference provides a high-level overview of each domain, its tables, and their purposes. The schema was built through 5 sequential migrations.

## Decision / Content

### Database Configuration
- **Instance:** bharatvarsh-website:us-central1:bharatvarsh-db
- **Database:** ai_os
- **User:** ai_os_admin
- **PostgreSQL:** 15
- **Extensions:** pgvector 0.8.1 (vector similarity search), pg_trgm (trigram matching), moddatetime (auto-update timestamps)

### Domain 1: Project Management (6 tables, migration 001)

Core hierarchy: **project -> phase -> milestone -> task**. Artifacts attach to projects or tasks.

| Table | Purpose | Rows |
|-------|---------|------|
| projects | Top-level project entities (AI OS, AI&U, Bharatvarsh) | 3 |
| project_phases | Major phases within each project | 8 |
| milestones | Key deliverables within phases, with due dates and Google Calendar sync | 8 |
| tasks | Actionable work items with priority, status, assignee, Google Tasks sync | 28 |
| artifacts | Files, links, outputs tied to projects (Google Drive sync) | 0 |
| project_tags | Flexible labeling for projects | 12 |

### Domain 2: Contacts and Reference Records (5 tables, migration 002)

People in the professional network, their relationships, important dates (birthday reminders), and audience segmentation for targeted outreach.

| Table | Purpose | Rows |
|-------|---------|------|
| contacts | People in the network (name, email, company, tags, notes) | 10 |
| contact_relationships | Bidirectional links between contacts (colleague, mentor, friend, etc.) | 4 |
| important_dates | Birthdays, anniversaries for reminder pipelines | 12 |
| audiences | Named segments for targeted outreach | 3 |
| audience_members | Junction linking contacts to audiences | 15 |

### Domain 3: Pipeline Tracking (5 tables, migration 003)

Pipeline definitions, execution history with cost tracking, structured logs, and content campaign management with post-level performance metrics.

| Table | Purpose | Rows |
|-------|---------|------|
| pipelines | Registered pipeline definitions (Category A/B/C) | 5 |
| pipeline_runs | Execution history with duration, tokens, cost tracking | 0 |
| pipeline_logs | Per-run structured log entries | 0 |
| campaigns | Content campaigns tied to audiences | 2 |
| campaign_posts | Individual content pieces within campaigns | 4 |

### Domain 4: Knowledge and Intelligence (5 tables, migration 004)

Semantic knowledge store with vector embeddings (pgvector), typed connections between entries forming a knowledge graph, skill registry, and skill evolution tracking.

| Table | Purpose | Rows |
|-------|---------|------|
| knowledge_entries | Core knowledge store (title, content, domain, tags, confidence) | 0 |
| knowledge_embeddings | Vector representations for semantic search (1536-dim, HNSW index) | 0 |
| knowledge_connections | Typed relationships between entries (relates_to, derived_from, supersedes, etc.) | 0 |
| skill_registry | Tracks all Claude Code skills (15 registered) | 15 |
| skill_evolution_log | Change history for skills (created, updated, tested, deprecated) | 15 |

### Key Design Patterns
- All primary keys use UUID (uuid_generate_v4)
- All tables with mutable data have `updated_at` triggers via moddatetime
- Enum types enforce valid values for status, priority, and relationship types
- Full-text search indexes (GIN) on contacts and knowledge_entries
- HNSW vector index on knowledge_embeddings for fast cosine similarity search

## Consequences

- 21 tables provide comprehensive coverage of project management, networking, automation tracking, and semantic knowledge
- Knowledge domain (Domain 4) is the foundation for the Knowledge Layer V2 with vector search and graph traversal
- Google sync columns (migration 005) enable bidirectional sync with Tasks, Calendar, and Drive

## Related

- Decision: Cloud SQL Shared Instance (where this database lives)
- Reference: GCP Infrastructure (connection patterns and secrets)
- Reference: MCP Gateway Tool Inventory (tools that read/write this schema)
