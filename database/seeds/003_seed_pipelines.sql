-- Seed: 003_seed_pipelines
-- Description: 5 pipeline definitions and sample campaigns
-- Created: 2026-03-14

BEGIN;

-- =============================================================================
-- PIPELINE DEFINITIONS (5 pipelines)
-- =============================================================================

INSERT INTO pipelines (id, name, slug, category, description, schedule, entrypoint, config, is_active) VALUES

-- 1. Birthday Wishes — daily at 08:00 IST (02:30 UTC)
('a7000000-0000-0000-0000-000000000001',
 'Birthday Wishes', 'birthday_wishes',
 'B',
 'Daily pipeline that checks for upcoming birthdays and drafts personalized greeting messages. Queries contacts + important_dates, generates message via Claude Haiku, queues for review.',
 '0 2 * * *',
 'workflows/category-b/birthday-wishes/',
 '{"timezone": "Asia/Kolkata", "run_time_ist": "08:00", "model": "claude-haiku-4-5", "reminder_window_days": 3, "delivery_channels": ["email", "whatsapp"]}'::JSONB,
 TRUE),

-- 2. Log Cleanup — weekly Sunday 03:00 IST
('a7000000-0000-0000-0000-000000000002',
 'Log Cleanup', 'log_cleanup',
 'B',
 'Weekly maintenance pipeline. Purges pipeline_logs older than 30 days, archives completed pipeline_runs older than 90 days, vacuums tables.',
 '0 21 * * 0',
 'workflows/category-b/log-cleanup/',
 '{"log_retention_days": 30, "run_retention_days": 90, "vacuum_tables": ["pipeline_logs", "pipeline_runs"]}'::JSONB,
 TRUE),

-- 3. Content Audit — weekly Monday 09:00 IST
('a7000000-0000-0000-0000-000000000003',
 'Content Audit', 'content_audit',
 'B',
 'Weekly audit of content pipeline health. Checks scheduled posts status, flags overdue content, summarizes campaign performance metrics, and generates a brief report.',
 '0 3 * * 1',
 'workflows/category-b/content-audit/',
 '{"model": "claude-haiku-4-5", "report_recipients": ["atharva"], "check_platforms": ["linkedin", "twitter", "youtube"]}'::JSONB,
 TRUE),

-- 4. Morning Digest — daily 07:30 IST (Cat B, feeds into morning-brief skill)
('a7000000-0000-0000-0000-000000000004',
 'Morning Digest', 'morning_digest',
 'B',
 'Pre-computes data for the morning brief skill. Pulls calendar events, pending tasks, upcoming deadlines, birthdays, and project status into a digest JSON stored in GCS.',
 '0 2 * * 1-5',
 'workflows/category-b/morning-digest/',
 '{"timezone": "Asia/Kolkata", "run_time_ist": "07:30", "model": "claude-haiku-4-5", "output_bucket": "ai-os-artifacts", "weekdays_only": true}'::JSONB,
 TRUE),

-- 5. Social Post Generator — Cat C (LangGraph, on-demand)
('a7000000-0000-0000-0000-000000000005',
 'Social Post Generator', 'social_post_generator',
 'C',
 'Agentic workflow for generating social media content. Takes a topic/brief, researches context, drafts platform-specific content, applies brand voice, and queues for human review.',
 NULL,
 'workflows/category-c/social-post-generator/',
 '{"model": "claude-sonnet-4-6", "platforms": ["linkedin", "twitter"], "requires_approval": true, "max_iterations": 3}'::JSONB,
 TRUE);

-- =============================================================================
-- SAMPLE CAMPAIGNS
-- =============================================================================

INSERT INTO campaigns (id, name, description, platform, audience_id, status, start_date, end_date, goals, metrics) VALUES

('a8000000-0000-0000-0000-000000000001',
 'Bharatvarsh March Lore Reveals',
 'Weekly lore reveal posts building up to the graphic novel announcement. Mix of character deep-dives and world-building snippets.',
 'multi',
 'f1000000-0000-0000-0000-000000000001',
 'active',
 '2026-03-01', '2026-03-31',
 'Drive engagement with Bharatvarsh readers, build anticipation for graphic novel',
 '{"target_posts": 8, "published": 2, "total_impressions": 450, "total_engagement": 34}'::JSONB),

('a8000000-0000-0000-0000-000000000002',
 'AI&U Pre-Launch Teasers',
 'Teaser content for AI&U YouTube channel launch. Short-form posts highlighting upcoming video topics.',
 'linkedin',
 'f1000000-0000-0000-0000-000000000003',
 'planned',
 '2026-04-01', '2026-04-14',
 'Build awareness before first video publish, drive initial subscribers',
 '{"target_posts": 5, "published": 0}'::JSONB);

-- =============================================================================
-- SAMPLE CAMPAIGN POSTS
-- =============================================================================

INSERT INTO campaign_posts (campaign_id, platform, content_preview, content_type, scheduled_at, published_at, status, performance_metrics) VALUES

('a8000000-0000-0000-0000-000000000001', 'linkedin',
 'In the age before the Mahabharata, before the great war that shattered kingdoms, there existed a city that defied time itself...',
 'post', '2026-03-03 09:00:00+05:30', '2026-03-03 09:02:00+05:30', 'published',
 '{"impressions": 280, "likes": 18, "comments": 4, "shares": 2}'::JSONB),

('a8000000-0000-0000-0000-000000000001', 'twitter',
 'Thread: 5 things about Bharatvarsh''s magic system that make it unlike anything in Indian fantasy...',
 'thread', '2026-03-10 18:00:00+05:30', '2026-03-10 18:01:00+05:30', 'published',
 '{"impressions": 170, "likes": 12, "retweets": 6, "replies": 4}'::JSONB),

('a8000000-0000-0000-0000-000000000001', 'linkedin',
 'Meet Devrath — the warrior-sage whose choices reshape an entire civilization. Character deep-dive from Bharatvarsh...',
 'post', '2026-03-17 09:00:00+05:30', NULL, 'scheduled',
 '{}'::JSONB),

('a8000000-0000-0000-0000-000000000001', 'twitter',
 'What if the Vedic sages had access to technology we can barely imagine? That''s the premise behind Bharatvarsh...',
 'post', '2026-03-20 18:00:00+05:30', NULL, 'scheduled',
 '{}'::JSONB);

COMMIT;
