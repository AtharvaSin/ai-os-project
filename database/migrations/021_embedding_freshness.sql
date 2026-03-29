-- Migration: 021_embedding_freshness
-- Description: Add content hashing and embedding staleness tracking
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-28
-- Purpose: Enable incremental embedding updates by detecting content changes
--          via SHA-256 hashes, and tracking embedding freshness via updated_at.
--          Prevents wasteful re-embedding of unchanged chunks and detects stale
--          embeddings when source content is updated via API.

BEGIN;

-- =============================================================================
-- 1. Add content_hash to knowledge_entries
-- =============================================================================
-- SHA-256 hex digest of (title || '\n\n' || content), matching the text format
-- sent to the embedding model. Used by drive-knowledge-scanner to skip unchanged
-- chunks and by embedding-generator to detect content drift.

ALTER TABLE knowledge_entries
    ADD COLUMN content_hash TEXT;

COMMENT ON COLUMN knowledge_entries.content_hash IS
    'SHA-256 hex digest of (title || chr(10) || chr(10) || content). '
    'Used for deduplication and stale-embedding detection.';

-- Index for fast lookup during re-ingestion
CREATE INDEX idx_knowledge_entries_content_hash ON knowledge_entries(content_hash);

-- =============================================================================
-- 2. Add updated_at to knowledge_embeddings
-- =============================================================================
-- Tracks when the embedding vector was last generated. Compared against
-- knowledge_entries.updated_at to find stale embeddings that need refresh.

ALTER TABLE knowledge_embeddings
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN knowledge_embeddings.updated_at IS
    'When this embedding was last generated or refreshed. '
    'Stale when knowledge_entries.updated_at > this value.';

-- Auto-update on re-embed (ON CONFLICT DO UPDATE path)
CREATE TRIGGER knowledge_embeddings_updated_at
    BEFORE UPDATE ON knowledge_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- =============================================================================
-- 3. Backfill content_hash for existing entries
-- =============================================================================
-- Uses PostgreSQL's encode(digest(...)) to compute SHA-256 in-database.
-- pgcrypto must be available (installed by default on Cloud SQL).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE knowledge_entries
SET content_hash = encode(
    digest(title || E'\n\n' || content, 'sha256'),
    'hex'
)
WHERE content_hash IS NULL;

-- =============================================================================
-- 4. Backfill updated_at for existing embeddings from created_at
-- =============================================================================

UPDATE knowledge_embeddings
SET updated_at = created_at
WHERE updated_at = NOW();
-- Note: rows just altered by the ADD COLUMN default will have updated_at = NOW().
-- We reset them to created_at so the staleness comparison is accurate for
-- existing embeddings.

COMMIT;
