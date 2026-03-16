-- Seed: 009_seed_risk_engine_pipeline
-- Description: Pipeline definition for the AI Risk Engine service
-- Created: 2026-03-16

BEGIN;

INSERT INTO pipelines (id, name, slug, category, description, schedule, entrypoint, config, is_active, notify_telegram) VALUES

-- Risk Engine — Daily at 06:30 IST, computes 5 risk types, alerts via Telegram
('a7000000-0000-0000-0000-000000000007',
 'Risk Engine', 'risk-engine-daily',
 'B',
 'Daily risk computation: overdue clusters, velocity decline, milestone slips, dependency chains, stale projects. Writes risk_alerts table and sends Telegram for high/critical severity.',
 '0 1 * * *',
 'workflows/category-b/risk-engine/',
 '{"timezone": "Asia/Kolkata", "risk_types": ["overdue_cluster", "velocity_decline", "milestone_slip", "dependency_chain", "stale_project"], "telegram_threshold": "high"}'::JSONB,
 TRUE,
 TRUE)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  schedule = EXCLUDED.schedule,
  config = EXCLUDED.config,
  notify_telegram = EXCLUDED.notify_telegram;

COMMIT;
