-- Migration 005: Add Google sync columns for Phase 2
-- Adds google_calendar_event_id to milestones and google_task_list_id to projects
-- Tasks store google_task_id in their existing metadata JSONB column.
--
-- Run via cloud-sql-proxy:
--   psql -h localhost -U ai_os_admin -d ai_os -f scripts/migration_005_google_sync.sql

BEGIN;

-- milestones: store the Calendar event ID for sync
ALTER TABLE milestones
    ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

COMMENT ON COLUMN milestones.google_calendar_event_id
    IS 'Google Calendar event ID — set when milestone is synced to "AI OS Milestones" calendar';

-- Create index for looking up milestones by calendar event ID
CREATE INDEX IF NOT EXISTS idx_milestones_gcal_event_id
    ON milestones (google_calendar_event_id)
    WHERE google_calendar_event_id IS NOT NULL;

COMMIT;
