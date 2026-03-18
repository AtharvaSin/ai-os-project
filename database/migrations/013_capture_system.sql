-- Migration: 013_capture_system
-- Description: Personal Capture System — journals table, source_type enum additions, pipeline registration
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-18
-- Purpose: Enable journal and quick-capture capabilities for the AI OS

BEGIN;

-- =============================================================================
-- ENUM ADDITIONS
-- =============================================================================

-- New source_type values for knowledge_entries
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'quick_capture';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'journal_entry';

COMMIT;

-- Enum additions must commit before use in table definitions
BEGIN;

-- =============================================================================
-- JOURNALS TABLE
-- =============================================================================

CREATE TABLE journals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content         TEXT NOT NULL,
    mood            TEXT,
    tags            TEXT[] DEFAULT '{}',
    energy_level    SMALLINT CHECK (energy_level BETWEEN 1 AND 5),
    domain_id       UUID REFERENCES life_domains(id) ON DELETE SET NULL,
    word_count      INTEGER GENERATED ALWAYS AS (array_length(string_to_array(content, ' '), 1)) STORED,
    is_embedded     BOOLEAN DEFAULT FALSE,
    embedded_at     TIMESTAMPTZ,
    distilled_at    TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE journals IS 'Personal journal entries — reflective, chronological, monthly-distilled. Separate from knowledge_entries to avoid polluting operational knowledge with raw reflections.';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary access pattern: recent journals chronologically
CREATE INDEX idx_journals_created_at ON journals (created_at DESC);

-- Filter by mood for pattern analysis
CREATE INDEX idx_journals_mood ON journals (mood) WHERE mood IS NOT NULL;

-- Filter by domain (Life Graph integration)
CREATE INDEX idx_journals_domain ON journals (domain_id) WHERE domain_id IS NOT NULL;

-- Tag-based filtering
CREATE INDEX idx_journals_tags ON journals USING GIN (tags);

-- Full-text search on journal content
CREATE INDEX idx_journals_fulltext ON journals USING GIN (
    to_tsvector('english', content)
);

-- Unprocessed journals for monthly distillation pipeline
CREATE INDEX idx_journals_undistilled ON journals (created_at ASC) WHERE distilled_at IS NULL;

-- Unembedded journals for batch embedding
CREATE INDEX idx_journals_unembedded ON journals (created_at ASC) WHERE is_embedded = FALSE;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER journals_updated_at
    BEFORE UPDATE ON journals
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- =============================================================================
-- PIPELINE REGISTRATION
-- =============================================================================

INSERT INTO pipelines (slug, name, description, schedule, category, is_active)
VALUES (
    'journal-monthly-distill',
    'Journal Monthly Distillation',
    'Monthly batch processing of journal entries via Claude Haiku. Extracts recurring themes, mood/energy patterns, unresolved tensions, key decisions, and missed action items. Creates distilled knowledge_entries with source_type=journal_entry.',
    '0 3 28 * *',
    'B',
    true
) ON CONFLICT (slug) DO NOTHING;

COMMIT;
