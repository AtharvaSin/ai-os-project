-- Migration: 010_task_annotations
-- Description: Task annotations table — stores user-written execution comments
--              captured from the Google Tasks notes user zone.
-- Created: 2026-03-17
-- Depends on: 009_risk_alerts (28 tables → 29 tables after this migration)

BEGIN;

-- =============================================================================
-- 1. task_annotations — Timestamped execution comments from Google Tasks
-- =============================================================================
-- Separate from tasks.description (Item 1 brief) — this is Item 2.
-- Append-only: no updated_at trigger needed. Content-hash dedup prevents
-- the same annotation being inserted twice for the same task.

CREATE TABLE IF NOT EXISTS task_annotations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    source          TEXT NOT NULL DEFAULT 'google_tasks',
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content_hash    TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dedup: same content can't be inserted twice for same task
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_annotations_task_hash
    ON task_annotations(task_id, content_hash);

CREATE INDEX IF NOT EXISTS idx_task_annotations_task_id
    ON task_annotations(task_id);

CREATE INDEX IF NOT EXISTS idx_task_annotations_captured_at
    ON task_annotations(captured_at DESC);

COMMENT ON TABLE task_annotations IS
    'Item 2: timestamped execution comments from the Google Tasks user zone.
     Item 1 (task brief) lives in tasks.description. These are never conflated.';

COMMIT;
