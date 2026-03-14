-- Migration: 004_knowledge
-- Description: Knowledge base, embeddings, connections, and skill registry
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-14
-- Purpose: Semantic knowledge store with vector search, skill tracking and evolution

BEGIN;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE source_type AS ENUM (
    'research_session',
    'decision',
    'lesson_learned',
    'reference',
    'manual'
);

CREATE TYPE relationship_type_kb AS ENUM (
    'relates_to',
    'derived_from',
    'contradicts',
    'supersedes',
    'expands',
    'depends_on'
);

CREATE TYPE skill_change_type AS ENUM (
    'created',
    'updated',
    'tested',
    'deprecated'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Knowledge entries: core knowledge store
CREATE TABLE knowledge_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               TEXT NOT NULL,
    content             TEXT NOT NULL,
    domain              TEXT,                          -- e.g. 'ai', 'cloud', 'marketing', 'writing'
    source              TEXT,                          -- where the knowledge came from
    source_type         source_type NOT NULL DEFAULT 'manual',
    confidence_score    NUMERIC(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),
    tags                TEXT[] DEFAULT '{}',
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Knowledge embeddings: vector representations for semantic search
CREATE TABLE knowledge_embeddings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id        UUID NOT NULL UNIQUE REFERENCES knowledge_entries(id) ON DELETE CASCADE,
    embedding       vector(1536) NOT NULL,
    model_used      TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Knowledge connections: typed relationships between entries
CREATE TABLE knowledge_connections (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_entry_id     UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
    target_entry_id     UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
    relationship_type   relationship_type_kb NOT NULL,
    strength            NUMERIC(3, 2) CHECK (strength BETWEEN 0 AND 1),
    context             TEXT,                          -- why this connection exists
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_connection CHECK (source_entry_id <> target_entry_id),
    CONSTRAINT unique_knowledge_connection UNIQUE (source_entry_id, target_entry_id, relationship_type)
);

-- Skill registry: tracks all Claude Code skills
CREATE TABLE skill_registry (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL UNIQUE,
    version             TEXT NOT NULL DEFAULT '1.0.0',
    category            TEXT,                          -- e.g. 'productivity', 'content', 'research'
    workstream          TEXT,                          -- e.g. 'ai-os', 'bharatvarsh', 'aiu'
    description         TEXT,
    skill_path          TEXT,                          -- e.g. '.claude/skills/morning-brief/'
    last_tested_at      TIMESTAMPTZ,
    performance_notes   TEXT,
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skill evolution log: tracks changes to skills over time
CREATE TABLE skill_evolution_log (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id            UUID NOT NULL REFERENCES skill_registry(id) ON DELETE CASCADE,
    change_type         skill_change_type NOT NULL,
    change_description  TEXT NOT NULL,
    version_before      TEXT,
    version_after       TEXT,
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Knowledge entries
CREATE INDEX idx_knowledge_entries_domain ON knowledge_entries(domain);
CREATE INDEX idx_knowledge_entries_source_type ON knowledge_entries(source_type);
CREATE INDEX idx_knowledge_entries_tags ON knowledge_entries USING GIN (tags);
CREATE INDEX idx_knowledge_entries_fulltext ON knowledge_entries USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
);

-- Knowledge embeddings — HNSW for fast approximate nearest neighbor search
CREATE INDEX idx_knowledge_embeddings_vector ON knowledge_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Knowledge connections
CREATE INDEX idx_knowledge_conn_source ON knowledge_connections(source_entry_id);
CREATE INDEX idx_knowledge_conn_target ON knowledge_connections(target_entry_id);
CREATE INDEX idx_knowledge_conn_type ON knowledge_connections(relationship_type);

-- Skill registry
CREATE INDEX idx_skill_registry_category ON skill_registry(category);
CREATE INDEX idx_skill_registry_workstream ON skill_registry(workstream);

-- Skill evolution log
CREATE INDEX idx_skill_evolution_skill_id ON skill_evolution_log(skill_id);
CREATE INDEX idx_skill_evolution_change_type ON skill_evolution_log(change_type);
CREATE INDEX idx_skill_evolution_created_at ON skill_evolution_log(created_at DESC);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER knowledge_entries_updated_at
    BEFORE UPDATE ON knowledge_entries
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER skill_registry_updated_at
    BEFORE UPDATE ON skill_registry
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

COMMIT;
