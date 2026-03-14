-- Migration 005: Add Google sync tracking columns
-- Required by: Google Tasks module, Drive Write module, Calendar Sync module
-- Reference: INTERFACE_STRATEGY.md §Schema Additions Required (Phase 2)

-- Tasks ↔ Google Tasks sync
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_task_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_task_list TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Milestones ↔ Google Calendar sync
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Artifacts ↔ Google Drive sync
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS drive_file_id TEXT;
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS drive_url TEXT;
