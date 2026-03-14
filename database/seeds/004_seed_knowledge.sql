-- Seed: 004_seed_knowledge
-- Description: Skill registry entries for all 15 Claude Code skills
-- Created: 2026-03-14

BEGIN;

-- =============================================================================
-- SKILL REGISTRY (15 skills from .claude/skills/)
-- =============================================================================

INSERT INTO skill_registry (id, name, version, category, workstream, description, skill_path) VALUES

('a9000000-0000-0000-0000-000000000001',
 'morning-brief', '1.0.0', 'productivity', 'ai-os',
 'Daily brief pulling Calendar, Gmail, project state, and carry-forward items.',
 '.claude/skills/morning-brief/'),

('a9000000-0000-0000-0000-000000000002',
 'deep-research', '1.0.0', 'research', 'ai-os',
 'Multi-source research synthesized into structured blueprints.',
 '.claude/skills/deep-research/'),

('a9000000-0000-0000-0000-000000000003',
 'draft-email', '1.0.0', 'productivity', 'ai-os',
 'Email drafting with tone variants and Gmail thread context.',
 '.claude/skills/draft-email/'),

('a9000000-0000-0000-0000-000000000004',
 'session-resume', '1.0.0', 'productivity', 'ai-os',
 'Context recovery from past sessions and Evolution Log.',
 '.claude/skills/session-resume/'),

('a9000000-0000-0000-0000-000000000005',
 'action-planner', '1.0.0', 'productivity', 'ai-os',
 'Goal-to-tasks decomposition with automation candidate flagging.',
 '.claude/skills/action-planner/'),

('a9000000-0000-0000-0000-000000000006',
 'build-prd', '1.0.0', 'productivity', 'ai-os',
 'Full PRD generation with professional docx output.',
 '.claude/skills/build-prd/'),

('a9000000-0000-0000-0000-000000000007',
 'decision-memo', '1.0.0', 'productivity', 'ai-os',
 'One-page decision document with options analysis and recommendation.',
 '.claude/skills/decision-memo/'),

('a9000000-0000-0000-0000-000000000008',
 'checklist-gen', '1.0.0', 'productivity', 'ai-os',
 'Generates contextual checklists for processes and workflows.',
 '.claude/skills/checklist-gen/'),

('a9000000-0000-0000-0000-000000000009',
 'weekly-review', '1.0.0', 'productivity', 'ai-os',
 'End-of-week retrospective from past chats, Calendar, Gmail, and project state.',
 '.claude/skills/weekly-review/'),

('a9000000-0000-0000-0000-000000000010',
 'bharatvarsh-content', '1.0.0', 'content', 'bharatvarsh',
 'Lore-grounded Bharatvarsh marketing content per platform with visual direction.',
 '.claude/skills/bharatvarsh-content/'),

('a9000000-0000-0000-0000-000000000011',
 'social-post', '1.0.0', 'content', 'ai-os',
 'Platform-aware professional and AI&U social content with voice calibration.',
 '.claude/skills/social-post/'),

('a9000000-0000-0000-0000-000000000012',
 'workflow-designer', '1.0.0', 'engineering', 'ai-os',
 'Designs and scaffolds Category B/C workflow implementations.',
 '.claude/skills/workflow-designer/'),

('a9000000-0000-0000-0000-000000000013',
 'tech-eval', '1.0.0', 'research', 'ai-os',
 'Technology evaluation scored against Reference Architecture on 5 criteria.',
 '.claude/skills/tech-eval/'),

('a9000000-0000-0000-0000-000000000014',
 'competitive-intel', '1.0.0', 'research', 'ai-os',
 'Market landscape analysis with competitor profiles and differentiation.',
 '.claude/skills/competitive-intel/'),

('a9000000-0000-0000-0000-000000000015',
 'visual-artifact', '1.0.0', 'content', 'ai-os',
 'Rich interactive artifacts: dashboards, diagrams, infographics, and cards.',
 '.claude/skills/visual-artifact/');

-- =============================================================================
-- SKILL EVOLUTION LOG (initial creation entries)
-- =============================================================================

INSERT INTO skill_evolution_log (skill_id, change_type, change_description, version_before, version_after) VALUES
('a9000000-0000-0000-0000-000000000001', 'created', 'Initial morning-brief skill created during Sprint 1', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000002', 'created', 'Initial deep-research skill created during Sprint 1', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000003', 'created', 'Initial draft-email skill created during Sprint 1', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000004', 'created', 'Initial session-resume skill created during Sprint 1', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000005', 'created', 'Initial action-planner skill created during Sprint 2', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000006', 'created', 'Initial build-prd skill created during Sprint 2', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000007', 'created', 'Initial decision-memo skill created during Sprint 2', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000008', 'created', 'Initial checklist-gen skill created during Sprint 2', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000009', 'created', 'Initial weekly-review skill created during Sprint 2', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000010', 'created', 'Initial bharatvarsh-content skill created during Sprint 2', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000011', 'created', 'Initial social-post skill created during Sprint 2', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000012', 'created', 'Initial workflow-designer skill created during Sprint 3', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000013', 'created', 'Initial tech-eval skill created during Sprint 3', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000014', 'created', 'Initial competitive-intel skill created during Sprint 3', NULL, '1.0.0'),
('a9000000-0000-0000-0000-000000000015', 'created', 'Initial visual-artifact skill created during Sprint 3', NULL, '1.0.0');

COMMIT;
