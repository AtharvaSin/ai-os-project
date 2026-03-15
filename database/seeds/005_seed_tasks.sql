-- Seed: 005_seed_tasks
-- Description: Seed 28 realistic tasks across 3 projects + update milestone due dates
-- Purpose: Populate dashboard with data so it's not empty on first deploy
-- Created: 2026-03-15

BEGIN;

-- =============================================================================
-- UPDATE MILESTONE DUE DATES (some were NULL)
-- =============================================================================

UPDATE milestones SET due_date = '2026-04-15' WHERE id = 'c1000000-0000-0000-0000-000000000003'; -- First Cat B Workflow
UPDATE milestones SET due_date = '2026-05-15' WHERE id = 'c1000000-0000-0000-0000-000000000004'; -- First Cat C Agent
UPDATE milestones SET due_date = '2026-04-01' WHERE id = 'c1000000-0000-0000-0000-000000000005'; -- First Video Published
UPDATE milestones SET due_date = '2026-05-01' WHERE id = 'c1000000-0000-0000-0000-000000000006'; -- 10-Video Foundation Library
UPDATE milestones SET due_date = '2026-03-31' WHERE id = 'c1000000-0000-0000-0000-000000000007'; -- Content Marketing Cadence
UPDATE milestones SET due_date = '2026-06-01' WHERE id = 'c1000000-0000-0000-0000-000000000008'; -- Bhoomi AI Voice Assistant

-- =============================================================================
-- AI OPERATING SYSTEM — 12 tasks
-- =============================================================================

-- Sprint 1 milestone tasks
INSERT INTO tasks (project_id, milestone_id, title, status, priority, due_date, assignee) VALUES
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
 'Build morning-brief skill with Calendar + Gmail integration', 'done', 'high', '2026-03-10', 'atharva'),

('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
 'Create session-resume skill for context recovery', 'done', 'high', '2026-03-12', 'atharva'),

('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
 'Implement update-project-state skill to scan codebase', 'in_progress', 'high', '2026-03-18', 'atharva'),

('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001',
 'Create kb-sync skill for KB synchronization', 'in_progress', 'medium', '2026-03-20', 'atharva'),

-- Data Layer milestone tasks
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002',
 'Apply all 4 database migrations to Cloud SQL', 'done', 'urgent', '2026-03-14', 'atharva'),

('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002',
 'Deploy MCP Gateway with PostgreSQL module', 'done', 'urgent', '2026-03-15', 'atharva'),

('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002',
 'Set up Google OAuth credentials for MCP modules', 'blocked', 'high', '2026-03-12', 'atharva'),

('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002',
 'Seed all 4 domain tables with realistic data', 'done', 'medium', '2026-03-14', 'atharva'),

-- First Cat B Workflow tasks
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003',
 'Build Task Notification Cloud Function (daily overdue scan)', 'todo', 'high', '2026-03-25', 'atharva'),

('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003',
 'Set up Cloud Scheduler trigger for daily 06:00 IST', 'todo', 'medium', '2026-03-28', 'atharva'),

-- Dashboard tasks (no milestone — or create one for Phase 3)
('a1000000-0000-0000-0000-000000000001', NULL,
 'Build AI OS Dashboard PWA — Phase 3a scaffold', 'in_progress', 'urgent', '2026-03-15', 'atharva'),

('a1000000-0000-0000-0000-000000000001', NULL,
 'Create NEXTAUTH_SECRET and store in Secret Manager', 'todo', 'high', '2026-03-16', 'atharva');

-- =============================================================================
-- AI&U YOUTUBE — 8 tasks
-- =============================================================================

-- First Video milestone tasks
INSERT INTO tasks (project_id, milestone_id, title, status, priority, due_date, assignee) VALUES
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000005',
 'Write script for Video 1: What is AI Really?', 'in_progress', 'high', '2026-03-20', 'atharva'),

('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000005',
 'Set up recording environment and test audio quality', 'todo', 'high', '2026-03-22', 'atharva'),

('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000005',
 'Design thumbnail template in Canva', 'todo', 'medium', '2026-03-25', 'atharva'),

('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000005',
 'Record and edit Video 1 in DaVinci Resolve', 'todo', 'high', '2026-03-30', 'atharva'),

-- 10-Video Foundation Library tasks
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000006',
 'Create content calendar for first 10 videos', 'in_progress', 'medium', '2026-03-18', 'atharva'),

('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000006',
 'Research and outline 5 "AI for Common Person" topics', 'todo', 'medium', '2026-03-28', 'atharva'),

('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000006',
 'Set up YouTube channel branding and about section', 'todo', 'low', '2026-04-05', 'atharva'),

('a1000000-0000-0000-0000-000000000002', NULL,
 'Decide on intro/outro music and visual identity', 'todo', 'low', '2026-04-10', 'atharva');

-- =============================================================================
-- BHARATVARSH — 8 tasks
-- =============================================================================

-- Content Marketing Cadence milestone tasks
INSERT INTO tasks (project_id, milestone_id, title, status, priority, due_date, assignee) VALUES
('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000007',
 'Draft 4 lore reveal social posts for March', 'in_progress', 'high', '2026-03-13', 'atharva'),

('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000007',
 'Create character teaser visual for Agni', 'todo', 'medium', '2026-03-20', 'atharva'),

('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000007',
 'Schedule Instagram carousel: World of Bharatvarsh', 'todo', 'medium', '2026-03-22', 'atharva'),

('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000007',
 'Publish LinkedIn post about the writing journey', 'done', 'low', '2026-03-08', 'atharva'),

('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000007',
 'Set up reader engagement survey on website', 'todo', 'low', '2026-03-30', 'atharva'),

-- Bhoomi AI milestone tasks
('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000008',
 'Define Bhoomi personality guide and lore constraints', 'todo', 'medium', '2026-04-15', 'atharva'),

('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000008',
 'Build RAG pipeline for Bharatvarsh lore search', 'todo', 'high', '2026-05-01', 'atharva'),

('a1000000-0000-0000-0000-000000000003', NULL,
 'Plan graphic novel adaptation timeline with artist', 'todo', 'low', '2026-06-01', 'atharva');

COMMIT;
