-- Migration: 006_knowledge_functions
-- Description: Extended knowledge enums, domain column migration, semantic search and graph traversal functions
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-15
-- Depends on: Migration 005 (applied)
-- Purpose: Extend the knowledge layer with richer source types, typed domains, project linking,
--          Drive file tracking, pgvector semantic search, and recursive graph traversal.

-- =============================================================================
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block.
-- These statements must be executed before the BEGIN block.
-- =============================================================================

-- 1. Extend source_type enum with 7 new values
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'journal_entry';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'task_completion';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'project_update';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'preference';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'goal';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'event_record';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'relationship_note';

BEGIN;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- 2. New typed domain enum (replaces free-text domain column)
CREATE TYPE knowledge_domain AS ENUM ('system', 'project', 'personal');

-- =============================================================================
-- ALTER knowledge_entries TABLE
-- =============================================================================

-- 3a. Migrate domain column from TEXT to knowledge_domain enum
--     Step 1: Add temporary column with the enum type
ALTER TABLE knowledge_entries ADD COLUMN domain_new knowledge_domain;

--     Step 2: Migrate existing data (safe even with 0 rows; handles populated tables)
UPDATE knowledge_entries SET domain_new = domain::knowledge_domain WHERE domain IS NOT NULL;

--     Step 3: Drop old TEXT column (also drops idx_knowledge_entries_domain) and rename
ALTER TABLE knowledge_entries DROP COLUMN domain;
ALTER TABLE knowledge_entries RENAME COLUMN domain_new TO domain;

-- 3b. Add new columns
ALTER TABLE knowledge_entries ADD COLUMN sub_domain TEXT;
ALTER TABLE knowledge_entries ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE knowledge_entries ADD COLUMN drive_file_id TEXT;

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_knowledge_entries_sub_domain ON knowledge_entries(sub_domain);
CREATE INDEX idx_knowledge_entries_project_id ON knowledge_entries(project_id);
CREATE INDEX idx_knowledge_entries_drive_file_id ON knowledge_entries(drive_file_id);
CREATE INDEX idx_knowledge_entries_domain_enum ON knowledge_entries(domain);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- 4. match_knowledge() — Semantic similarity search over knowledge_entries via pgvector
CREATE OR REPLACE FUNCTION match_knowledge(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    filter_domain knowledge_domain DEFAULT NULL,
    filter_sub_domain text DEFAULT NULL,
    filter_project_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    content text,
    domain knowledge_domain,
    sub_domain text,
    source_type source_type,
    project_id uuid,
    tags text[],
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ke.id,
        ke.title,
        ke.content,
        ke.domain,
        ke.sub_domain,
        ke.source_type,
        ke.project_id,
        ke.tags,
        (1 - (kv.embedding <=> query_embedding))::float AS similarity
    FROM knowledge_entries ke
    JOIN knowledge_embeddings kv ON kv.entry_id = ke.id
    WHERE
        (1 - (kv.embedding <=> query_embedding)) >= match_threshold
        AND (filter_domain IS NULL OR ke.domain = filter_domain)
        AND (filter_sub_domain IS NULL OR ke.sub_domain = filter_sub_domain)
        AND (filter_project_id IS NULL OR ke.project_id = filter_project_id)
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_knowledge IS 'Semantic similarity search over knowledge_entries using pgvector cosine distance. Core RAG primitive.';

-- 5. traverse_knowledge() — Recursive CTE graph traversal of knowledge_connections
CREATE OR REPLACE FUNCTION traverse_knowledge(
    start_entry_id uuid,
    max_depth int DEFAULT 2,
    relationship_types relationship_type_kb[] DEFAULT NULL
)
RETURNS TABLE (
    entry_id uuid,
    title text,
    content text,
    depth int,
    path uuid[],
    relationship text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE traversal AS (
        -- Base case: start node
        SELECT
            ke.id AS entry_id,
            ke.title,
            ke.content,
            0 AS depth,
            ARRAY[ke.id] AS path,
            ''::text AS relationship
        FROM knowledge_entries ke
        WHERE ke.id = start_entry_id

        UNION ALL

        -- Recursive case: follow connections
        SELECT
            ke.id AS entry_id,
            ke.title,
            ke.content,
            t.depth + 1 AS depth,
            t.path || ke.id AS path,
            kc.relationship_type::text AS relationship
        FROM traversal t
        JOIN knowledge_connections kc ON kc.source_entry_id = t.entry_id
        JOIN knowledge_entries ke ON ke.id = kc.target_entry_id
        WHERE
            t.depth < max_depth
            AND NOT (ke.id = ANY(t.path))  -- prevent cycles
            AND (relationship_types IS NULL OR kc.relationship_type = ANY(relationship_types))
    )
    SELECT
        traversal.entry_id,
        traversal.title,
        traversal.content,
        traversal.depth,
        traversal.path,
        traversal.relationship
    FROM traversal
    ORDER BY traversal.depth ASC, traversal.title ASC;
END;
$$;

COMMENT ON FUNCTION traverse_knowledge IS 'Recursive graph traversal across knowledge_connections. Follows typed edges up to max_depth. Prevents cycles via path tracking.';

COMMIT;

-- =============================================================================
-- ROLLBACK (uncomment and run manually if migration must be reversed)
-- =============================================================================
-- WARNING: Destructive. Only use if migration must be reversed.
-- DROP FUNCTION IF EXISTS traverse_knowledge;
-- DROP FUNCTION IF EXISTS match_knowledge;
-- DROP INDEX IF EXISTS idx_knowledge_entries_domain_enum;
-- DROP INDEX IF EXISTS idx_knowledge_entries_drive_file_id;
-- DROP INDEX IF EXISTS idx_knowledge_entries_project_id;
-- DROP INDEX IF EXISTS idx_knowledge_entries_sub_domain;
-- ALTER TABLE knowledge_entries DROP COLUMN IF EXISTS drive_file_id;
-- ALTER TABLE knowledge_entries DROP COLUMN IF EXISTS project_id;
-- ALTER TABLE knowledge_entries DROP COLUMN IF EXISTS sub_domain;
-- Note: Cannot easily revert enum additions or domain column type change in PostgreSQL.
-- Enum value removal requires recreating the enum type entirely.
