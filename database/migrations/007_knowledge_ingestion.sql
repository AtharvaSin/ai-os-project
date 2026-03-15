-- Migration: 007_knowledge_ingestion
-- Description: Ingestion tracking tables, knowledge snapshots, and Drive scan state
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-15
-- Depends on: Migration 006
-- Purpose: Support batch knowledge ingestion auditing, weekly domain health snapshots,
--          and incremental Drive folder scanning with per-folder state tracking.

BEGIN;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE ingestion_job_type AS ENUM (
    'weekly_summary',
    'drive_scan',
    'bulk_seed',
    'auto_connection',
    'embedding_batch'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Knowledge ingestion jobs: tracks every batch import operation
CREATE TABLE knowledge_ingestion_jobs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type            ingestion_job_type NOT NULL,
    status              run_status NOT NULL DEFAULT 'running',
    source_description  TEXT,
    entries_created     INTEGER DEFAULT 0,
    entries_updated     INTEGER DEFAULT 0,
    entries_failed      INTEGER DEFAULT 0,
    embeddings_generated INTEGER DEFAULT 0,
    connections_created INTEGER DEFAULT 0,
    tokens_used         INTEGER DEFAULT 0,
    cost_estimate_usd   NUMERIC DEFAULT 0,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    error_log           TEXT,
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Knowledge snapshots: weekly domain-level statistics for monitoring growth and health
CREATE TABLE knowledge_snapshots (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain                  knowledge_domain NOT NULL,
    snapshot_date           DATE NOT NULL,
    total_entries           INTEGER NOT NULL DEFAULT 0,
    total_with_embeddings   INTEGER NOT NULL DEFAULT 0,
    new_entries_since_last  INTEGER NOT NULL DEFAULT 0,
    top_sub_domains         JSONB DEFAULT '[]'::JSONB,
    top_tags                JSONB DEFAULT '[]'::JSONB,
    top_source_types        JSONB DEFAULT '[]'::JSONB,
    connection_count        INTEGER NOT NULL DEFAULT 0,
    avg_confidence          NUMERIC,
    metadata                JSONB DEFAULT '{}'::JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(domain, snapshot_date)
);

-- Drive scan state: tracks last scan timestamp per Drive folder for incremental scanning
CREATE TABLE drive_scan_state (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_path         TEXT NOT NULL UNIQUE,
    drive_folder_id     TEXT,
    last_scanned_at     TIMESTAMPTZ,
    files_processed     INTEGER DEFAULT 0,
    last_file_count     INTEGER DEFAULT 0,
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Knowledge ingestion jobs
CREATE INDEX idx_ingestion_jobs_type ON knowledge_ingestion_jobs(job_type);
CREATE INDEX idx_ingestion_jobs_status ON knowledge_ingestion_jobs(status);
CREATE INDEX idx_ingestion_jobs_started_at ON knowledge_ingestion_jobs(started_at DESC);

-- Knowledge snapshots
CREATE INDEX idx_snapshots_domain ON knowledge_snapshots(domain);
CREATE INDEX idx_snapshots_date ON knowledge_snapshots(snapshot_date DESC);

-- Drive scan state
CREATE INDEX idx_drive_scan_folder_path ON drive_scan_state(folder_path);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at on drive_scan_state
CREATE TRIGGER drive_scan_state_updated_at
    BEFORE UPDATE ON drive_scan_state
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- =============================================================================
-- TABLE COMMENTS
-- =============================================================================

COMMENT ON TABLE knowledge_ingestion_jobs IS 'Tracks all knowledge ingestion batch jobs: weekly summaries, drive scans, bulk seeds, auto-connections, and embedding batches.';
COMMENT ON TABLE knowledge_snapshots IS 'Weekly per-domain statistics for knowledge layer health monitoring. Used by /weekly-review skill and Dashboard.';
COMMENT ON TABLE drive_scan_state IS 'Tracks per-folder scan state for incremental Drive Knowledge Scanner. Prevents re-processing unchanged files.';

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Pre-populate with the 7 expected Drive Knowledge/ folder paths
INSERT INTO drive_scan_state (folder_path) VALUES
    ('AI OS/Knowledge/System/'),
    ('AI OS/Knowledge/Projects/AI-OS/'),
    ('AI OS/Knowledge/Projects/Bharatvarsh/'),
    ('AI OS/Knowledge/Projects/AI-and-U/'),
    ('AI OS/Knowledge/Projects/Zealogics/'),
    ('AI OS/Knowledge/Personal/'),
    ('AI OS/Knowledge/');

COMMIT;

-- =============================================================================
-- ROLLBACK (uncomment and run manually if migration must be reversed)
-- =============================================================================
-- WARNING: Destructive. Only use if migration must be reversed.
-- DROP TABLE IF EXISTS drive_scan_state;
-- DROP TABLE IF EXISTS knowledge_snapshots;
-- DROP TABLE IF EXISTS knowledge_ingestion_jobs;
-- DROP TYPE IF EXISTS ingestion_job_type;
