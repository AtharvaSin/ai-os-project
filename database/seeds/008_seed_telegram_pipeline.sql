-- Seed: 008_seed_telegram_pipeline
-- Description: Pipeline definition for telegram-notifications service
-- Created: 2026-03-16

BEGIN;

INSERT INTO pipelines (id, name, slug, category, description, schedule, entrypoint, config, is_active, notify_telegram) VALUES

-- 6. Telegram Notifications — 3 scheduled types (morning brief, overdue alerts, weekly digest)
('a7000000-0000-0000-0000-000000000006',
 'Telegram Notifications', 'telegram-notifications',
 'B',
 'Sends structured notifications to Telegram bot. Three scheduled types: morning brief (6:30 AM IST daily), overdue task alerts (9:00 AM IST daily), and weekly digest (Sunday 7 PM IST). Uses Claude Haiku for composition.',
 NULL,
 'workflows/category-b/telegram-notifications/',
 '{"timezone": "Asia/Kolkata", "model": "claude-haiku-4-5-20251001", "schedules": {"morning_brief": "30 1 * * *", "overdue_alert": "30 3 * * *", "weekly_digest": "30 13 * * 0"}, "notification_channel": "telegram"}'::JSONB,
 TRUE,
 TRUE);

COMMIT;
