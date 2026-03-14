-- Migration: 001_projects
-- Description: Project management schema for AI Operating System
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-14

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE project_status AS ENUM (
    'planning',
    'active',
    'paused',
    'completed',
    'archived'
);

CREATE TYPE phase_status AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'blocked'
);

CREATE TYPE milestone_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'missed'
);

CREATE TYPE task_status AS ENUM (
    'todo',
    'in_progress',
    'blocked',
    'done',
    'cancelled'
);

CREATE TYPE task_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

CREATE TYPE artifact_type AS ENUM (
    'document',
    'code',
    'config',
    'design',
    'media',
    'deployment',
    'other'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Projects: top-level project entities
CREATE TABLE projects (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    status      project_status NOT NULL DEFAULT 'planning',
    category    TEXT,                              -- e.g. 'Category A', 'Category B'
    tech_stack  TEXT[],                            -- array of tech used
    repo_url    TEXT,
    live_url    TEXT,
    owner       TEXT NOT NULL DEFAULT 'atharva',
    metadata    JSONB DEFAULT '{}'::JSONB,         -- flexible extra data
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project phases: major phases within a project
CREATE TABLE project_phases (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    status      phase_status NOT NULL DEFAULT 'not_started',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    started_at  TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Milestones: key deliverables within a phase
CREATE TABLE milestones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id    UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    status      milestone_status NOT NULL DEFAULT 'pending',
    due_date    DATE,
    completed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks: actionable work items
CREATE TABLE tasks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    status      task_status NOT NULL DEFAULT 'todo',
    priority    task_priority NOT NULL DEFAULT 'medium',
    assignee    TEXT DEFAULT 'atharva',
    due_date    DATE,
    completed_at TIMESTAMPTZ,
    metadata    JSONB DEFAULT '{}'::JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Artifacts: files, links, outputs tied to a project
CREATE TABLE artifacts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id     UUID REFERENCES tasks(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,
    artifact_type artifact_type NOT NULL DEFAULT 'other',
    file_path   TEXT,                              -- relative path in repo
    url         TEXT,                              -- external link
    description TEXT,
    metadata    JSONB DEFAULT '{}'::JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project tags: flexible labeling for projects
CREATE TABLE project_tags (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tag         TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, tag)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Projects
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_owner ON projects(owner);

-- Project phases
CREATE INDEX idx_phases_project_id ON project_phases(project_id);
CREATE INDEX idx_phases_status ON project_phases(status);

-- Milestones
CREATE INDEX idx_milestones_phase_id ON milestones(phase_id);
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_due_date ON milestones(due_date);

-- Tasks
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_milestone_id ON tasks(milestone_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Artifacts
CREATE INDEX idx_artifacts_project_id ON artifacts(project_id);
CREATE INDEX idx_artifacts_task_id ON artifacts(task_id);
CREATE INDEX idx_artifacts_type ON artifacts(artifact_type);

-- Project tags
CREATE INDEX idx_project_tags_project_id ON project_tags(project_id);
CREATE INDEX idx_project_tags_tag ON project_tags(tag);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at on projects
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- Auto-update updated_at on tasks
CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

COMMIT;
