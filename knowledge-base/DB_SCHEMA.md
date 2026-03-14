# AI OS Database Schema

> Auto-generated from `ai_os` database on 2026-03-14
> Instance: `bharatvarsh-website:us-central1:bharatvarsh-db`
> Database: `ai_os` | User: `ai_os_admin` | PostgreSQL 15 | Extensions: vector 0.8.1, moddatetime 1.0

## Overview

| # | Table | Rows | Columns | Domain | Migration |
|---|-------|------|---------|--------|-----------|
| 1 | `projects` | 3 | 13 | Project Management | 001 |
| 2 | `project_phases` | 8 | 9 | Project Management | 001 |
| 3 | `milestones` | 8 | 9 | Project Management | 001 |
| 4 | `tasks` | 0 | 13 | Project Management | 001 |
| 5 | `artifacts` | 0 | 10 | Project Management | 001 |
| 6 | `project_tags` | 12 | 4 | Project Management | 001 |
| 7 | `contacts` | 10 | 16 | Contacts & Reference | 002 |
| 8 | `contact_relationships` | 4 | 7 | Contacts & Reference | 002 |
| 9 | `important_dates` | 12 | 11 | Contacts & Reference | 002 |
| 10 | `audiences` | 3 | 9 | Contacts & Reference | 002 |
| 11 | `audience_members` | 15 | 5 | Contacts & Reference | 002 |
| 12 | `pipelines` | 5 | 11 | Pipeline Tracking | 003 |
| 13 | `pipeline_runs` | 0 | 14 | Pipeline Tracking | 003 |
| 14 | `pipeline_logs` | 0 | 6 | Pipeline Tracking | 003 |
| 15 | `campaigns` | 2 | 13 | Pipeline Tracking | 003 |
| 16 | `campaign_posts` | 4 | 13 | Pipeline Tracking | 003 |
| 17 | `knowledge_entries` | 0 | 11 | Knowledge & Intelligence | 004 |
| 18 | `knowledge_embeddings` | 0 | 5 | Knowledge & Intelligence | 004 |
| 19 | `knowledge_connections` | 0 | 7 | Knowledge & Intelligence | 004 |
| 20 | `skill_registry` | 15 | 12 | Knowledge & Intelligence | 004 |
| 21 | `skill_evolution_log` | 15 | 8 | Knowledge & Intelligence | 004 |

---

## Domain 1: Project Management (migration 001)

Tracks projects, phases, milestones, tasks, artifacts, and tags. Core hierarchy: **project -> phase -> milestone -> task**. Artifacts attach to projects/tasks.

### Table: `projects`
_Top-level project entities_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `name` | `text` | NO |  |  |
| `slug` | `text` | NO |  | UNIQUE |
| `description` | `text` | YES |  |  |
| `status` | `project_status` | NO | `'planning'::project_status` |  |
| `category` | `text` | YES |  |  |
| `tech_stack` | `text[]` | YES |  |  |
| `repo_url` | `text` | YES |  |  |
| `live_url` | `text` | YES |  |  |
| `owner` | `text` | NO | `atharva` |  |
| `metadata` | `jsonb` | YES | `{}` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |
| `updated_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `project_phases`
_Major phases within a project_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `project_id` | `uuid` | NO |  | FK -> `projects.id` (CASCADE) |
| `name` | `text` | NO |  |  |
| `description` | `text` | YES |  |  |
| `status` | `phase_status` | NO | `'not_started'::phase_status` |  |
| `sort_order` | `integer` | NO | `0` |  |
| `started_at` | `timestamp with time zone` | YES |  |  |
| `completed_at` | `timestamp with time zone` | YES |  |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `milestones`
_Key deliverables within a phase_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `phase_id` | `uuid` | NO |  | FK -> `project_phases.id` (CASCADE) |
| `project_id` | `uuid` | NO |  | FK -> `projects.id` (CASCADE) |
| `name` | `text` | NO |  |  |
| `description` | `text` | YES |  |  |
| `status` | `milestone_status` | NO | `'pending'::milestone_status` |  |
| `due_date` | `date` | YES |  |  |
| `completed_at` | `timestamp with time zone` | YES |  |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `tasks`
_Actionable work items_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `milestone_id` | `uuid` | YES |  | FK -> `milestones.id` (SET NULL) |
| `project_id` | `uuid` | NO |  | FK -> `projects.id` (CASCADE) |
| `title` | `text` | NO |  |  |
| `description` | `text` | YES |  |  |
| `status` | `task_status` | NO | `'todo'::task_status` |  |
| `priority` | `task_priority` | NO | `'medium'::task_priority` |  |
| `assignee` | `text` | YES | `atharva` |  |
| `due_date` | `date` | YES |  |  |
| `completed_at` | `timestamp with time zone` | YES |  |  |
| `metadata` | `jsonb` | YES | `{}` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |
| `updated_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `artifacts`
_Files, links, outputs tied to a project_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `project_id` | `uuid` | NO |  | FK -> `projects.id` (CASCADE) |
| `task_id` | `uuid` | YES |  | FK -> `tasks.id` (SET NULL) |
| `name` | `text` | NO |  |  |
| `artifact_type` | `artifact_type` | NO | `'other'::artifact_type` |  |
| `file_path` | `text` | YES |  |  |
| `url` | `text` | YES |  |  |
| `description` | `text` | YES |  |  |
| `metadata` | `jsonb` | YES | `{}` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `project_tags`
_Flexible labeling for projects_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `project_id` | `uuid` | NO |  | UNIQUE(project_id,tag), FK -> `projects.id` (CASCADE) |
| `tag` | `text` | NO |  | UNIQUE(project_id,tag) |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |

---

## Domain 2: Contacts & Reference Records (migration 002)

People in the network, their relationships, important dates (birthday pipeline), and audience segmentation for targeted outreach.

### Table: `contacts`
_People in the network_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `name` | `text` | NO |  |  |
| `email` | `text` | YES |  |  |
| `phone` | `text` | YES |  |  |
| `company` | `text` | YES |  |  |
| `title` | `text` | YES |  |  |
| `contact_type` | `contact_type` | NO | `'professional'::contact_type` |  |
| `tags` | `text[]` | YES | `'{}'[]` |  |
| `notes` | `text` | YES |  |  |
| `linkedin_url` | `text` | YES |  |  |
| `twitter_handle` | `text` | YES |  |  |
| `location` | `text` | YES |  |  |
| `metadata` | `jsonb` | YES | `{}` |  |
| `is_active` | `boolean` | NO | `true` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |
| `updated_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `contact_relationships`
_Bidirectional links between contacts_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `contact_id_a` | `uuid` | NO |  | UNIQUE(a,b,type), FK -> `contacts.id` (CASCADE) |
| `contact_id_b` | `uuid` | NO |  | UNIQUE(a,b,type), FK -> `contacts.id` (CASCADE) |
| `relationship_type` | `relationship_type` | NO |  | UNIQUE(a,b,type) |
| `description` | `text` | YES |  |  |
| `strength` | `integer` | YES |  |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `important_dates`
_Birthdays, anniversaries for reminder pipelines_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `contact_id` | `uuid` | NO |  | FK -> `contacts.id` (CASCADE) |
| `date_type` | `date_type` | NO |  |  |
| `date_value` | `date` | NO |  |  |
| `year_known` | `boolean` | NO | `true` |  |
| `label` | `text` | YES |  |  |
| `reminder_days_before` | `integer` | NO | `1` |  |
| `last_reminded_at` | `timestamp with time zone` | YES |  |  |
| `is_active` | `boolean` | NO | `true` |  |
| `metadata` | `jsonb` | YES | `{}` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `audiences`
_Named segments for targeted outreach_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `name` | `text` | NO |  | UNIQUE |
| `slug` | `text` | NO |  | UNIQUE |
| `description` | `text` | YES |  |  |
| `criteria` | `jsonb` | YES | `{}` |  |
| `is_dynamic` | `boolean` | NO | `false` |  |
| `metadata` | `jsonb` | YES | `{}` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |
| `updated_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `audience_members`
_Junction linking contacts to audiences_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `audience_id` | `uuid` | NO |  | UNIQUE(audience_id,contact_id), FK -> `audiences.id` (CASCADE) |
| `contact_id` | `uuid` | NO |  | UNIQUE(audience_id,contact_id), FK -> `contacts.id` (CASCADE) |
| `metadata` | `jsonb` | YES | `{}` |  |
| `added_at` | `timestamp with time zone` | NO | `now()` |  |

---

## Domain 3: Pipeline Tracking (migration 003)

Pipeline definitions, execution runs with cost tracking, structured logs, and content campaign management with post-level performance metrics.

### Table: `pipelines`
_Registered pipeline definitions_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `name` | `text` | NO |  | UNIQUE |
| `slug` | `text` | NO |  | UNIQUE |
| `category` | `pipeline_category` | NO |  |  |
| `description` | `text` | YES |  |  |
| `schedule` | `text` | YES |  |  |
| `entrypoint` | `text` | YES |  |  |
| `config` | `jsonb` | YES | `{}` |  |
| `is_active` | `boolean` | NO | `true` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |
| `updated_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `pipeline_runs`
_Pipeline execution history_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `pipeline_id` | `uuid` | NO |  | FK -> `pipelines.id` (CASCADE) |
| `status` | `run_status` | NO | `'running'::run_status` |  |
| `trigger_type` | `trigger_type` | NO | `'manual'::trigger_type` |  |
| `triggered_by` | `text` | YES |  |  |
| `started_at` | `timestamp with time zone` | NO | `now()` |  |
| `completed_at` | `timestamp with time zone` | YES |  |  |
| `duration_ms` | `integer` | YES |  |  |
| `tokens_used` | `integer` | YES | `0` |  |
| `cost_estimate_usd` | `numeric` | YES | `0` |  |
| `output_summary` | `text` | YES |  |  |
| `error_message` | `text` | YES |  |  |
| `metadata` | `jsonb` | YES | `{}` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `pipeline_logs`
_Per-run log entries_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `run_id` | `uuid` | NO |  | FK -> `pipeline_runs.id` (CASCADE) |
| `timestamp` | `timestamp with time zone` | NO | `now()` |  |
| `level` | `log_level` | NO | `'info'::log_level` |  |
| `message` | `text` | NO |  |  |
| `metadata` | `jsonb` | YES | `{}` |  |

### Table: `campaigns`
_Content campaigns tied to audiences_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `name` | `text` | NO |  |  |
| `description` | `text` | YES |  |  |
| `platform` | `text` | YES |  |  |
| `audience_id` | `uuid` | YES |  | FK -> `audiences.id` (SET NULL) |
| `status` | `campaign_status` | NO | `'planned'::campaign_status` |  |
| `start_date` | `date` | YES |  |  |
| `end_date` | `date` | YES |  |  |
| `goals` | `text` | YES |  |  |
| `metrics` | `jsonb` | YES | `{}` |  |
| `metadata` | `jsonb` | YES | `{}` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |
| `updated_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `campaign_posts`
_Individual content pieces within a campaign_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `campaign_id` | `uuid` | NO |  | FK -> `campaigns.id` (CASCADE) |
| `platform` | `text` | NO |  |  |
| `content_preview` | `text` | YES |  |  |
| `content_type` | `text` | YES |  |  |
| `scheduled_at` | `timestamp with time zone` | YES |  |  |
| `published_at` | `timestamp with time zone` | YES |  |  |
| `status` | `post_status` | NO | `'draft'::post_status` |  |
| `performance_metrics` | `jsonb` | YES | `{}` |  |
| `external_post_id` | `text` | YES |  |  |
| `metadata` | `jsonb` | YES | `{}` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |
| `updated_at` | `timestamp with time zone` | NO | `now()` |  |

---

## Domain 4: Knowledge & Intelligence (migration 004)

Semantic knowledge store with vector embeddings (pgvector), typed connections between entries, skill registry, and evolution tracking.

### Table: `knowledge_entries`
_Core knowledge store_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `title` | `text` | NO |  |  |
| `content` | `text` | NO |  |  |
| `domain` | `text` | YES |  |  |
| `source` | `text` | YES |  |  |
| `source_type` | `source_type` | NO | `'manual'::source_type` |  |
| `confidence_score` | `numeric` | YES |  |  |
| `tags` | `text[]` | YES | `'{}'[]` |  |
| `metadata` | `jsonb` | YES | `{}` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |
| `updated_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `knowledge_embeddings`
_Vector representations for semantic search_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `entry_id` | `uuid` | NO |  | UNIQUE, FK -> `knowledge_entries.id` (CASCADE) |
| `embedding` | `vector(1536)` | NO |  |  |
| `model_used` | `text` | NO | `text-embedding-3-small` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `knowledge_connections`
_Typed relationships between entries_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `source_entry_id` | `uuid` | NO |  | UNIQUE(src,tgt,type), FK -> `knowledge_entries.id` (CASCADE) |
| `target_entry_id` | `uuid` | NO |  | UNIQUE(src,tgt,type), FK -> `knowledge_entries.id` (CASCADE) |
| `relationship_type` | `relationship_type_kb` | NO |  | UNIQUE(src,tgt,type) |
| `strength` | `numeric` | YES |  |  |
| `context` | `text` | YES |  |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `skill_registry`
_Tracks all Claude Code skills_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `name` | `text` | NO |  | UNIQUE |
| `version` | `text` | NO | `1.0.0` |  |
| `category` | `text` | YES |  |  |
| `workstream` | `text` | YES |  |  |
| `description` | `text` | YES |  |  |
| `skill_path` | `text` | YES |  |  |
| `last_tested_at` | `timestamp with time zone` | YES |  |  |
| `performance_notes` | `text` | YES |  |  |
| `metadata` | `jsonb` | YES | `{}` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |
| `updated_at` | `timestamp with time zone` | NO | `now()` |  |

### Table: `skill_evolution_log`
_Tracks changes to skills over time_

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `uuid` | NO | `uuid_generate_v4()` | PK |
| `skill_id` | `uuid` | NO |  | FK -> `skill_registry.id` (CASCADE) |
| `change_type` | `skill_change_type` | NO |  |  |
| `change_description` | `text` | NO |  |  |
| `version_before` | `text` | YES |  |  |
| `version_after` | `text` | YES |  |  |
| `metadata` | `jsonb` | YES | `{}` |  |
| `created_at` | `timestamp with time zone` | NO | `now()` |  |

---

## Indexes

### `projects`

| Index Name | Definition |
|------------|------------|
| `idx_projects_owner` | `idx_projects_owner ON public.projects USING btree (owner)` |
| `idx_projects_slug` | `idx_projects_slug ON public.projects USING btree (slug)` |
| `idx_projects_status` | `idx_projects_status ON public.projects USING btree (status)` |
| `projects_pkey` | `UNIQUE: projects_pkey ON public.projects USING btree (id)` |
| `projects_slug_key` | `UNIQUE: projects_slug_key ON public.projects USING btree (slug)` |

### `project_phases`

| Index Name | Definition |
|------------|------------|
| `idx_phases_project_id` | `idx_phases_project_id ON public.project_phases USING btree (project_id)` |
| `idx_phases_status` | `idx_phases_status ON public.project_phases USING btree (status)` |
| `project_phases_pkey` | `UNIQUE: project_phases_pkey ON public.project_phases USING btree (id)` |

### `milestones`

| Index Name | Definition |
|------------|------------|
| `idx_milestones_due_date` | `idx_milestones_due_date ON public.milestones USING btree (due_date)` |
| `idx_milestones_phase_id` | `idx_milestones_phase_id ON public.milestones USING btree (phase_id)` |
| `idx_milestones_project_id` | `idx_milestones_project_id ON public.milestones USING btree (project_id)` |
| `idx_milestones_status` | `idx_milestones_status ON public.milestones USING btree (status)` |
| `milestones_pkey` | `UNIQUE: milestones_pkey ON public.milestones USING btree (id)` |

### `tasks`

| Index Name | Definition |
|------------|------------|
| `idx_tasks_assignee` | `idx_tasks_assignee ON public.tasks USING btree (assignee)` |
| `idx_tasks_due_date` | `idx_tasks_due_date ON public.tasks USING btree (due_date)` |
| `idx_tasks_milestone_id` | `idx_tasks_milestone_id ON public.tasks USING btree (milestone_id)` |
| `idx_tasks_priority` | `idx_tasks_priority ON public.tasks USING btree (priority)` |
| `idx_tasks_project_id` | `idx_tasks_project_id ON public.tasks USING btree (project_id)` |
| `idx_tasks_status` | `idx_tasks_status ON public.tasks USING btree (status)` |
| `tasks_pkey` | `UNIQUE: tasks_pkey ON public.tasks USING btree (id)` |

### `artifacts`

| Index Name | Definition |
|------------|------------|
| `artifacts_pkey` | `UNIQUE: artifacts_pkey ON public.artifacts USING btree (id)` |
| `idx_artifacts_project_id` | `idx_artifacts_project_id ON public.artifacts USING btree (project_id)` |
| `idx_artifacts_task_id` | `idx_artifacts_task_id ON public.artifacts USING btree (task_id)` |
| `idx_artifacts_type` | `idx_artifacts_type ON public.artifacts USING btree (artifact_type)` |

### `project_tags`

| Index Name | Definition |
|------------|------------|
| `idx_project_tags_project_id` | `idx_project_tags_project_id ON public.project_tags USING btree (project_id)` |
| `idx_project_tags_tag` | `idx_project_tags_tag ON public.project_tags USING btree (tag)` |
| `project_tags_pkey` | `UNIQUE: project_tags_pkey ON public.project_tags USING btree (id)` |
| `project_tags_project_id_tag_key` | `UNIQUE: project_tags_project_id_tag_key ON public.project_tags USING btree (project_id, tag)` |

### `contacts`

| Index Name | Definition |
|------------|------------|
| `contacts_pkey` | `UNIQUE: contacts_pkey ON public.contacts USING btree (id)` |
| `idx_contacts_company` | `idx_contacts_company ON public.contacts USING btree (company)` |
| `idx_contacts_contact_type` | `idx_contacts_contact_type ON public.contacts USING btree (contact_type)` |
| `idx_contacts_email` | `idx_contacts_email ON public.contacts USING btree (email)` |
| `idx_contacts_fulltext` | `idx_contacts_fulltext ON public.contacts USING gin (to_tsvector('english'::regconfig, ((((COALESCE(name, ''::text) || ' '::text) || COALESCE(company, ''::text)) || ' '::text) || COALESCE(notes, ''::text))))` |
| `idx_contacts_is_active` | `idx_contacts_is_active ON public.contacts USING btree (is_active)` |
| `idx_contacts_tags` | `idx_contacts_tags ON public.contacts USING gin (tags)` |

### `contact_relationships`

| Index Name | Definition |
|------------|------------|
| `contact_relationships_pkey` | `UNIQUE: contact_relationships_pkey ON public.contact_relationships USING btree (id)` |
| `idx_contact_rel_a` | `idx_contact_rel_a ON public.contact_relationships USING btree (contact_id_a)` |
| `idx_contact_rel_b` | `idx_contact_rel_b ON public.contact_relationships USING btree (contact_id_b)` |
| `idx_contact_rel_type` | `idx_contact_rel_type ON public.contact_relationships USING btree (relationship_type)` |
| `unique_relationship` | `UNIQUE: unique_relationship ON public.contact_relationships USING btree (contact_id_a, contact_id_b, relationship_type)` |

### `important_dates`

| Index Name | Definition |
|------------|------------|
| `idx_important_dates_active` | `idx_important_dates_active ON public.important_dates USING btree (is_active)` |
| `idx_important_dates_contact_id` | `idx_important_dates_contact_id ON public.important_dates USING btree (contact_id)` |
| `idx_important_dates_date_type` | `idx_important_dates_date_type ON public.important_dates USING btree (date_type)` |
| `idx_important_dates_date_value` | `idx_important_dates_date_value ON public.important_dates USING btree (date_value)` |
| `important_dates_pkey` | `UNIQUE: important_dates_pkey ON public.important_dates USING btree (id)` |

### `audiences`

| Index Name | Definition |
|------------|------------|
| `audiences_name_key` | `UNIQUE: audiences_name_key ON public.audiences USING btree (name)` |
| `audiences_pkey` | `UNIQUE: audiences_pkey ON public.audiences USING btree (id)` |
| `audiences_slug_key` | `UNIQUE: audiences_slug_key ON public.audiences USING btree (slug)` |
| `idx_audiences_slug` | `idx_audiences_slug ON public.audiences USING btree (slug)` |

### `audience_members`

| Index Name | Definition |
|------------|------------|
| `audience_members_audience_id_contact_id_key` | `UNIQUE: audience_members_audience_id_contact_id_key ON public.audience_members USING btree (audience_id, contact_id)` |
| `audience_members_pkey` | `UNIQUE: audience_members_pkey ON public.audience_members USING btree (id)` |
| `idx_audience_members_audience_id` | `idx_audience_members_audience_id ON public.audience_members USING btree (audience_id)` |
| `idx_audience_members_contact_id` | `idx_audience_members_contact_id ON public.audience_members USING btree (contact_id)` |

### `pipelines`

| Index Name | Definition |
|------------|------------|
| `idx_pipelines_category` | `idx_pipelines_category ON public.pipelines USING btree (category)` |
| `idx_pipelines_is_active` | `idx_pipelines_is_active ON public.pipelines USING btree (is_active)` |
| `pipelines_name_key` | `UNIQUE: pipelines_name_key ON public.pipelines USING btree (name)` |
| `pipelines_pkey` | `UNIQUE: pipelines_pkey ON public.pipelines USING btree (id)` |
| `pipelines_slug_key` | `UNIQUE: pipelines_slug_key ON public.pipelines USING btree (slug)` |

### `pipeline_runs`

| Index Name | Definition |
|------------|------------|
| `idx_pipeline_runs_pipeline_status` | `idx_pipeline_runs_pipeline_status ON public.pipeline_runs USING btree (pipeline_id, status)` |
| `idx_pipeline_runs_started_at` | `idx_pipeline_runs_started_at ON public.pipeline_runs USING btree (started_at DESC)` |
| `idx_pipeline_runs_status` | `idx_pipeline_runs_status ON public.pipeline_runs USING btree (status)` |
| `pipeline_runs_pkey` | `UNIQUE: pipeline_runs_pkey ON public.pipeline_runs USING btree (id)` |

### `pipeline_logs`

| Index Name | Definition |
|------------|------------|
| `idx_pipeline_logs_level` | `idx_pipeline_logs_level ON public.pipeline_logs USING btree (level)` |
| `idx_pipeline_logs_run_timestamp` | `idx_pipeline_logs_run_timestamp ON public.pipeline_logs USING btree (run_id, "timestamp")` |
| `pipeline_logs_pkey` | `UNIQUE: pipeline_logs_pkey ON public.pipeline_logs USING btree (id)` |

### `campaigns`

| Index Name | Definition |
|------------|------------|
| `campaigns_pkey` | `UNIQUE: campaigns_pkey ON public.campaigns USING btree (id)` |
| `idx_campaigns_audience_id` | `idx_campaigns_audience_id ON public.campaigns USING btree (audience_id)` |
| `idx_campaigns_platform` | `idx_campaigns_platform ON public.campaigns USING btree (platform)` |
| `idx_campaigns_status` | `idx_campaigns_status ON public.campaigns USING btree (status)` |

### `campaign_posts`

| Index Name | Definition |
|------------|------------|
| `campaign_posts_pkey` | `UNIQUE: campaign_posts_pkey ON public.campaign_posts USING btree (id)` |
| `idx_campaign_posts_campaign_id` | `idx_campaign_posts_campaign_id ON public.campaign_posts USING btree (campaign_id)` |
| `idx_campaign_posts_platform` | `idx_campaign_posts_platform ON public.campaign_posts USING btree (platform)` |
| `idx_campaign_posts_scheduled_at` | `idx_campaign_posts_scheduled_at ON public.campaign_posts USING btree (scheduled_at)` |
| `idx_campaign_posts_status` | `idx_campaign_posts_status ON public.campaign_posts USING btree (status)` |

### `knowledge_entries`

| Index Name | Definition |
|------------|------------|
| `idx_knowledge_entries_domain` | `idx_knowledge_entries_domain ON public.knowledge_entries USING btree (domain)` |
| `idx_knowledge_entries_fulltext` | `idx_knowledge_entries_fulltext ON public.knowledge_entries USING gin (to_tsvector('english'::regconfig, ((COALESCE(title, ''::text) || ' '::text) || COALESCE(content, ''::text))))` |
| `idx_knowledge_entries_source_type` | `idx_knowledge_entries_source_type ON public.knowledge_entries USING btree (source_type)` |
| `idx_knowledge_entries_tags` | `idx_knowledge_entries_tags ON public.knowledge_entries USING gin (tags)` |
| `knowledge_entries_pkey` | `UNIQUE: knowledge_entries_pkey ON public.knowledge_entries USING btree (id)` |

### `knowledge_embeddings`

| Index Name | Definition |
|------------|------------|
| `idx_knowledge_embeddings_vector` | `idx_knowledge_embeddings_vector ON public.knowledge_embeddings USING hnsw (embedding vector_cosine_ops) WITH (m='16', ef_construction='64')` |
| `knowledge_embeddings_entry_id_key` | `UNIQUE: knowledge_embeddings_entry_id_key ON public.knowledge_embeddings USING btree (entry_id)` |
| `knowledge_embeddings_pkey` | `UNIQUE: knowledge_embeddings_pkey ON public.knowledge_embeddings USING btree (id)` |

### `knowledge_connections`

| Index Name | Definition |
|------------|------------|
| `idx_knowledge_conn_source` | `idx_knowledge_conn_source ON public.knowledge_connections USING btree (source_entry_id)` |
| `idx_knowledge_conn_target` | `idx_knowledge_conn_target ON public.knowledge_connections USING btree (target_entry_id)` |
| `idx_knowledge_conn_type` | `idx_knowledge_conn_type ON public.knowledge_connections USING btree (relationship_type)` |
| `knowledge_connections_pkey` | `UNIQUE: knowledge_connections_pkey ON public.knowledge_connections USING btree (id)` |
| `unique_knowledge_connection` | `UNIQUE: unique_knowledge_connection ON public.knowledge_connections USING btree (source_entry_id, target_entry_id, relationship_type)` |

### `skill_registry`

| Index Name | Definition |
|------------|------------|
| `idx_skill_registry_category` | `idx_skill_registry_category ON public.skill_registry USING btree (category)` |
| `idx_skill_registry_workstream` | `idx_skill_registry_workstream ON public.skill_registry USING btree (workstream)` |
| `skill_registry_name_key` | `UNIQUE: skill_registry_name_key ON public.skill_registry USING btree (name)` |
| `skill_registry_pkey` | `UNIQUE: skill_registry_pkey ON public.skill_registry USING btree (id)` |

### `skill_evolution_log`

| Index Name | Definition |
|------------|------------|
| `idx_skill_evolution_change_type` | `idx_skill_evolution_change_type ON public.skill_evolution_log USING btree (change_type)` |
| `idx_skill_evolution_created_at` | `idx_skill_evolution_created_at ON public.skill_evolution_log USING btree (created_at DESC)` |
| `idx_skill_evolution_skill_id` | `idx_skill_evolution_skill_id ON public.skill_evolution_log USING btree (skill_id)` |
| `skill_evolution_log_pkey` | `UNIQUE: skill_evolution_log_pkey ON public.skill_evolution_log USING btree (id)` |

---

## Functions

_No user-defined application functions exist yet._ All current functions are internal to pgvector and moddatetime extensions.

### Planned: `match_knowledge()` (RAG semantic search primitive)

```sql
-- PLANNED — semantic similarity search over knowledge_entries via pgvector
-- Signature: match_knowledge(
--   query_embedding vector(1536),
--   match_threshold float DEFAULT 0.7,
--   match_count int DEFAULT 10,
--   filter_domain text DEFAULT NULL
-- )
-- RETURNS TABLE (id uuid, title text, content text, domain text, similarity float)
--
-- Performs cosine similarity search using the HNSW index on knowledge_embeddings.
-- Joins back to knowledge_entries for full content.
-- Core RAG primitive — all agents call this for semantic retrieval.
```

### Planned: `traverse_knowledge()` (knowledge graph traversal)

```sql
-- PLANNED — graph traversal across knowledge_connections
-- Signature: traverse_knowledge(
--   start_entry_id uuid,
--   max_depth int DEFAULT 2,
--   relationship_types relationship_type_kb[] DEFAULT NULL
-- )
-- RETURNS TABLE (entry_id uuid, title text, content text, depth int, path uuid[], relationship text)
--
-- Recursive CTE traversal of the knowledge_connections graph.
-- Follows typed edges (relates_to, derived_from, expands, etc.)
-- Used after match_knowledge() to expand context with related entries.
```

### Extension Functions (pgvector & moddatetime)

pgvector provides ~170 internal C functions for vector operations. Key operators:

| Operator | Function | Purpose |
|----------|----------|---------|
| `<=>` | cosine distance | Primary similarity metric for HNSW index |
| `<->` | L2 (Euclidean) distance | Alternative distance metric |
| `<#>` | negative inner product | Dot product similarity |
| `vector_dims()` | dimension count | Returns 1536 for our embeddings |
| `l2_normalize()` | unit normalization | Normalize vectors before comparison |

`moddatetime()` — trigger function used by all `updated_at` triggers.

---

## Triggers

| Trigger Name | Table | Timing | Event | Action |
|-------------|-------|--------|-------|--------|
| `projects_updated_at` | `projects` | BEFORE | UPDATE | `EXECUTE FUNCTION moddatetime('updated_at')` |
| `tasks_updated_at` | `tasks` | BEFORE | UPDATE | `EXECUTE FUNCTION moddatetime('updated_at')` |
| `contacts_updated_at` | `contacts` | BEFORE | UPDATE | `EXECUTE FUNCTION moddatetime('updated_at')` |
| `audiences_updated_at` | `audiences` | BEFORE | UPDATE | `EXECUTE FUNCTION moddatetime('updated_at')` |
| `pipelines_updated_at` | `pipelines` | BEFORE | UPDATE | `EXECUTE FUNCTION moddatetime('updated_at')` |
| `campaigns_updated_at` | `campaigns` | BEFORE | UPDATE | `EXECUTE FUNCTION moddatetime('updated_at')` |
| `campaign_posts_updated_at` | `campaign_posts` | BEFORE | UPDATE | `EXECUTE FUNCTION moddatetime('updated_at')` |
| `knowledge_entries_updated_at` | `knowledge_entries` | BEFORE | UPDATE | `EXECUTE FUNCTION moddatetime('updated_at')` |
| `skill_registry_updated_at` | `skill_registry` | BEFORE | UPDATE | `EXECUTE FUNCTION moddatetime('updated_at')` |

All `updated_at` triggers use `moddatetime()` from the `moddatetime` extension — automatically sets the column to `NOW()` on any `UPDATE`.

---

## Relationships (Foreign Keys)

| Source | Column | Target | Column | ON DELETE |
|--------|--------|--------|--------|-----------|
| `artifacts` | `project_id` | `projects` | `id` | CASCADE |
| `artifacts` | `task_id` | `tasks` | `id` | SET NULL |
| `audience_members` | `audience_id` | `audiences` | `id` | CASCADE |
| `audience_members` | `contact_id` | `contacts` | `id` | CASCADE |
| `campaign_posts` | `campaign_id` | `campaigns` | `id` | CASCADE |
| `campaigns` | `audience_id` | `audiences` | `id` | SET NULL |
| `contact_relationships` | `contact_id_a` | `contacts` | `id` | CASCADE |
| `contact_relationships` | `contact_id_b` | `contacts` | `id` | CASCADE |
| `important_dates` | `contact_id` | `contacts` | `id` | CASCADE |
| `knowledge_connections` | `source_entry_id` | `knowledge_entries` | `id` | CASCADE |
| `knowledge_connections` | `target_entry_id` | `knowledge_entries` | `id` | CASCADE |
| `knowledge_embeddings` | `entry_id` | `knowledge_entries` | `id` | CASCADE |
| `milestones` | `phase_id` | `project_phases` | `id` | CASCADE |
| `milestones` | `project_id` | `projects` | `id` | CASCADE |
| `pipeline_logs` | `run_id` | `pipeline_runs` | `id` | CASCADE |
| `pipeline_runs` | `pipeline_id` | `pipelines` | `id` | CASCADE |
| `project_phases` | `project_id` | `projects` | `id` | CASCADE |
| `project_tags` | `project_id` | `projects` | `id` | CASCADE |
| `skill_evolution_log` | `skill_id` | `skill_registry` | `id` | CASCADE |
| `tasks` | `milestone_id` | `milestones` | `id` | SET NULL |
| `tasks` | `project_id` | `projects` | `id` | CASCADE |

---

## CHECK Constraints

These constraints enforce valid values — skills and pipelines that `INSERT` data must respect these.

| Table | Constraint | Definition |
|-------|-----------|------------|
| `contact_relationships` | `contact_relationships_strength_check` | `CHECK (((strength >= 1) AND (strength <= 5)))` |
| `contact_relationships` | `no_self_relationship` | `CHECK ((contact_id_a <> contact_id_b))` |
| `knowledge_connections` | `knowledge_connections_strength_check` | `CHECK (((strength >= (0)::numeric) AND (strength <= (1)::numeric)))` |
| `knowledge_connections` | `no_self_connection` | `CHECK ((source_entry_id <> target_entry_id))` |
| `knowledge_entries` | `knowledge_entries_confidence_score_check` | `CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric)))` |

---

## Enum Types

All `USER-DEFINED` columns use PostgreSQL enum types. Valid values:

- **`project_status`**: `planning`, `active`, `paused`, `completed`, `archived`
- **`phase_status`**: `not_started`, `in_progress`, `completed`, `blocked`
- **`milestone_status`**: `pending`, `in_progress`, `completed`, `missed`
- **`task_status`**: `todo`, `in_progress`, `blocked`, `done`, `cancelled`
- **`task_priority`**: `low`, `medium`, `high`, `urgent`
- **`artifact_type`**: `document`, `code`, `config`, `design`, `media`, `deployment`, `other`
- **`contact_type`**: `professional`, `personal`, `both`
- **`relationship_type`**: `colleague`, `mentor`, `mentee`, `friend`, `family`, `client`, `collaborator`, `investor`, `advisor`, `acquaintance`
- **`date_type`**: `birthday`, `anniversary`, `work_anniversary`, `custom`
- **`pipeline_category`**: `A`, `B`, `C`
- **`run_status`**: `running`, `success`, `failed`, `cancelled`
- **`trigger_type`**: `scheduled`, `manual`, `event`, `webhook`
- **`log_level`**: `debug`, `info`, `warn`, `error`
- **`campaign_status`**: `planned`, `active`, `paused`, `completed`
- **`post_status`**: `draft`, `scheduled`, `published`, `failed`, `cancelled`
- **`source_type`**: `research_session`, `decision`, `lesson_learned`, `reference`, `manual`
- **`relationship_type_kb`**: `relates_to`, `derived_from`, `contradicts`, `supersedes`, `expands`, `depends_on`
- **`skill_change_type`**: `created`, `updated`, `tested`, `deprecated`

---

## Extensions

| Extension | Version | Purpose |
|-----------|---------|---------|
| `vector` | 0.8.1 | Vector similarity search (pgvector) — enables `vector(1536)` type and HNSW indexes |
| `moddatetime` | 1.0 | Auto-update `updated_at` timestamps on row modification |
| `uuid-ossp` | — | UUID generation — `uuid_generate_v4()` for primary keys |

---

## Connection Reference

| Property | Value |
|----------|-------|
| Instance | `bharatvarsh-website:us-central1:bharatvarsh-db` |
| Database | `ai_os` |
| User | `ai_os_admin` |
| Password secret | `AI_OS_DB_PASSWORD` (in Secret Manager, project `ai-operating-system-490208`) |
| Cloud Functions | `cloud-sql-python-connector[pg8000]` |
| Cloud Run | Auth Proxy sidecar via `--add-cloudsql-instances` |
| Local dev | `cloud-sql-proxy` CLI -> localhost:5432 |

