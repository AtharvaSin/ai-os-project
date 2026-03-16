-- Seed: 011_seed_task_annotation_sync
-- Description: Pipeline definition for the Task Annotation Sync service
-- Created: 2026-03-17

BEGIN;

INSERT INTO pipelines (id, name, slug, category, description, schedule, entrypoint, config, is_active, notify_telegram) VALUES

-- Task Annotation Sync — Every 15 minutes, captures user notes from Google Tasks
('a7000000-0000-0000-0000-000000000008',
 'Task Annotation Sync', 'task-annotation-sync',
 'B',
 'Syncs user-written execution annotations from Google Tasks notes user zone into task_annotations table. Content-hash dedup prevents duplicates. Runs every 15 minutes.',
 '*/15 * * * *',
 'workflows/category-b/task-annotation-sync/',
 '{"timezone": "Asia/Kolkata", "source": "google_tasks", "dedup": "content_hash"}'::JSONB,
 TRUE,
 FALSE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  schedule = EXCLUDED.schedule,
  config = EXCLUDED.config,
  notify_telegram = EXCLUDED.notify_telegram;

COMMIT;
