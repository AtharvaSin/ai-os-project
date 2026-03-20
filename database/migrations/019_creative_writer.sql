-- Migration: 019_creative_writer
-- Description: Creative writing plugin tables — projects, steps, brainstorm sessions, writing outputs
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-20
-- Purpose: Store creative writing projects with Truby's 22-step story structure,
--          brainstorm sessions with multiple ideation methods, and versioned
--          writing outputs for blogs, articles, chapters, and all creative formats.
--          4 new tables, 4 enum types → total 43 tables.

BEGIN;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE creative_project_type AS ENUM (
    'novel', 'comic_series', 'blog_series', 'screenplay',
    'poetry_collection', 'anthology', 'custom'
);

CREATE TYPE creative_project_status AS ENUM (
    'ideation', 'outlining', 'drafting', 'revising',
    'editing', 'complete', 'paused', 'abandoned'
);

CREATE TYPE brainstorm_method AS ENUM (
    'socratic', 'constraint', 'character_driven', 'theme_exploration',
    'genre_fusion', 'yes_and', 'mind_map'
);

CREATE TYPE writing_output_type AS ENUM (
    'blog', 'article', 'headline', 'slogan', 'caption', 'poem',
    'script', 'chapter', 'scene', 'vignette', 'essay', 'ad_copy',
    'social_post', 'custom'
);

COMMIT;

-- Enum additions must commit before use in table definitions
BEGIN;

-- =============================================================================
-- TABLE: creative_projects
-- Core project table for long-running creative work. Supports Truby's 22-step
-- story structure, character webs, moral arguments, and world-building.
-- Optional universe field links to Bharatvarsh lore when set.
-- =============================================================================

CREATE TABLE creative_projects (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title              TEXT NOT NULL,
    slug               TEXT NOT NULL UNIQUE,
    project_type       creative_project_type NOT NULL,
    status             creative_project_status NOT NULL DEFAULT 'ideation',
    universe           TEXT,
    genre              TEXT[] DEFAULT '{}',
    logline            TEXT,
    synopsis           TEXT,
    target_word_count  INTEGER,
    current_word_count INTEGER DEFAULT 0,
    moral_argument     JSONB DEFAULT '{}'::JSONB,
    character_web      JSONB DEFAULT '{}'::JSONB,
    world_rules        JSONB DEFAULT '{}'::JSONB,
    style_guide        JSONB DEFAULT '{}'::JSONB,
    domain_id          UUID REFERENCES life_domains(id) ON DELETE SET NULL,
    tags               TEXT[] DEFAULT '{}',
    metadata           JSONB DEFAULT '{}'::JSONB,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE creative_projects IS 'Creative writing projects — novels, comic series, screenplays, blog series, poetry collections. Supports Truby''s 22-step story structure via character_web and moral_argument JSONB. universe=''bharatvarsh'' triggers lore context loading. style_guide stores discovered/created writing conventions.';

-- =============================================================================
-- TABLE: creative_project_steps
-- Truby's 22-step story structure tracker. Auto-populated for narrative types.
-- Steps 1-22 are Truby standard; step_number >= 100 reserved for custom steps.
-- =============================================================================

CREATE TABLE creative_project_steps (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id   UUID NOT NULL REFERENCES creative_projects(id) ON DELETE CASCADE,
    step_number  INTEGER NOT NULL,
    step_name    TEXT NOT NULL,
    step_type    TEXT NOT NULL DEFAULT 'truby',
    status       TEXT NOT NULL DEFAULT 'pending',
    description  TEXT,
    content      TEXT,
    decisions    JSONB DEFAULT '[]'::JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT creative_step_unique UNIQUE (project_id, step_number),
    CONSTRAINT creative_step_status_check CHECK (status IN ('pending', 'active', 'complete', 'skipped'))
);

COMMENT ON TABLE creative_project_steps IS 'Story structure steps for creative projects. Steps 1-22 follow John Truby''s Anatomy of Story framework (auto-populated for novels, comics, screenplays). step_number >= 100 for custom steps. Each step tracks status, written content, and key decisions made during development.';

-- =============================================================================
-- TABLE: brainstorm_sessions
-- Interactive ideation sessions with multiple methods. Can be standalone or
-- linked to a creative project. Ideas are source-tagged (user vs AI).
-- =============================================================================

CREATE TABLE brainstorm_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID REFERENCES creative_projects(id) ON DELETE SET NULL,
    title           TEXT NOT NULL,
    method          brainstorm_method,
    prompt          TEXT,
    ideas           JSONB DEFAULT '[]'::JSONB,
    selected_ideas  JSONB DEFAULT '[]'::JSONB,
    constraints     JSONB DEFAULT '[]'::JSONB,
    conclusion      TEXT,
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE brainstorm_sessions IS 'Creative brainstorming sessions — Socratic, constraint-based, character-driven, theme exploration, genre fusion, yes-and, mind map. ideas JSONB array stores [{idea, score, notes, is_selected, source}] with source tagging (untagged=user, AI=suggestion). Can be standalone or linked to a creative_project.';

-- =============================================================================
-- TABLE: writing_outputs
-- Versioned writing drafts. Append-only — new versions create new rows linked
-- via parent_output_id. Supports quick-mode (no project) and project-linked.
-- =============================================================================

CREATE TABLE writing_outputs (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id       UUID REFERENCES creative_projects(id) ON DELETE SET NULL,
    step_id          UUID REFERENCES creative_project_steps(id) ON DELETE SET NULL,
    output_type      writing_output_type NOT NULL,
    title            TEXT NOT NULL,
    content          TEXT NOT NULL,
    version          INTEGER NOT NULL DEFAULT 1,
    word_count       INTEGER,
    platform         TEXT,
    tone             TEXT,
    audience         TEXT,
    drive_file_id    TEXT,
    drive_url        TEXT,
    parent_output_id UUID REFERENCES writing_outputs(id) ON DELETE SET NULL,
    tags             TEXT[] DEFAULT '{}',
    metadata         JSONB DEFAULT '{}'::JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE writing_outputs IS 'Versioned creative writing outputs — blogs, articles, chapters, scenes, poems, ad copy. Append-only: no updated_at column. New versions link to parent via parent_output_id with incremented version number. project_id is NULL for quick-mode outputs; step_id links to a specific Truby step when applicable.';

-- =============================================================================
-- INDEXES: creative_projects
-- =============================================================================

-- Filter by project type (novel, comic_series, etc.)
CREATE INDEX idx_creative_projects_type ON creative_projects (project_type);

-- Filter by status (ideation, drafting, complete, etc.)
CREATE INDEX idx_creative_projects_status ON creative_projects (status);

-- Filter by universe (bharatvarsh, custom worlds)
CREATE INDEX idx_creative_projects_universe ON creative_projects (universe) WHERE universe IS NOT NULL;

-- Tag-based filtering
CREATE INDEX idx_creative_projects_tags ON creative_projects USING GIN (tags);

-- Life Graph domain link
CREATE INDEX idx_creative_projects_domain ON creative_projects (domain_id) WHERE domain_id IS NOT NULL;

-- Full-text search on title, logline, and synopsis
CREATE INDEX idx_creative_projects_fulltext ON creative_projects USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(logline, '') || ' ' || coalesce(synopsis, ''))
);

-- =============================================================================
-- INDEXES: creative_project_steps
-- =============================================================================

-- Project lookup (cascade queries)
CREATE INDEX idx_creative_steps_project ON creative_project_steps (project_id);

-- Step status filtering
CREATE INDEX idx_creative_steps_status ON creative_project_steps (status);

-- =============================================================================
-- INDEXES: brainstorm_sessions
-- =============================================================================

-- Project-linked sessions
CREATE INDEX idx_brainstorm_project ON brainstorm_sessions (project_id) WHERE project_id IS NOT NULL;

-- Method-based filtering
CREATE INDEX idx_brainstorm_method ON brainstorm_sessions (method);

-- Tag-based filtering
CREATE INDEX idx_brainstorm_tags ON brainstorm_sessions USING GIN (tags);

-- =============================================================================
-- INDEXES: writing_outputs
-- =============================================================================

-- Project-linked outputs
CREATE INDEX idx_writing_outputs_project ON writing_outputs (project_id) WHERE project_id IS NOT NULL;

-- Output type filtering
CREATE INDEX idx_writing_outputs_type ON writing_outputs (output_type);

-- Version chain traversal
CREATE INDEX idx_writing_outputs_parent ON writing_outputs (parent_output_id) WHERE parent_output_id IS NOT NULL;

-- Step-linked outputs
CREATE INDEX idx_writing_outputs_step ON writing_outputs (step_id) WHERE step_id IS NOT NULL;

-- Tag-based filtering
CREATE INDEX idx_writing_outputs_tags ON writing_outputs USING GIN (tags);

-- Full-text search on title and content
CREATE INDEX idx_writing_outputs_fulltext ON writing_outputs USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
);

-- =============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- =============================================================================

CREATE TRIGGER creative_projects_updated_at
    BEFORE UPDATE ON creative_projects
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER creative_project_steps_updated_at
    BEFORE UPDATE ON creative_project_steps
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER brainstorm_sessions_updated_at
    BEFORE UPDATE ON brainstorm_sessions
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- NOTE: writing_outputs has NO updated_at trigger — it is append-only.
-- New versions create new rows linked via parent_output_id.

COMMIT;
