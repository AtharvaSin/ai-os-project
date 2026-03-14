-- Seed: 001_seed_projects
-- Description: Seed 3 active projects with phases and milestones
-- Source: knowledge-base/WORK_PROJECTS.md
-- Created: 2026-03-14

BEGIN;

-- =============================================================================
-- PROJECT 1: AI Operating System
-- =============================================================================

INSERT INTO projects (id, name, slug, description, status, category, tech_stack, owner, metadata)
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'AI Operating System',
    'ai-os',
    'AI-enabled Personal Operating System. Category A interface + Category B/C orchestration for automated workflows, content, and life management.',
    'active',
    'Category A',
    ARRAY['Claude.ai', 'Claude Code', 'LangGraph', 'FastAPI', 'Cloud Run', 'Cloud Functions', 'Cloud SQL PostgreSQL', 'pgvector', 'GCS', 'GCP'],
    'atharva',
    '{"current_sprint": 3, "pending_decisions": ["WhatsApp Business API setup", "embedding model finalization"]}'::JSONB
);

-- AI OS Phases
INSERT INTO project_phases (id, project_id, name, description, status, sort_order, started_at) VALUES
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
 'Phase 1 — Category A Interface', 'Build Claude project ecosystem: skills, connectors, knowledge base',
 'in_progress', 1, '2026-03-01'),
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
 'Phase 2 — Category B Workflows', 'Cloud Functions + Cloud Scheduler scheduled pipelines',
 'not_started', 2, NULL),
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
 'Phase 3 — Category C Agents', 'LangGraph on FastAPI + Cloud Run agentic workflows',
 'not_started', 3, NULL);

-- AI OS Milestones
INSERT INTO milestones (id, phase_id, project_id, name, description, status, due_date) VALUES
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
 'Sprint 1 — Skills & Connectors', '5 skills live, 3 connectors active, KB enriched',
 'in_progress', '2026-03-21'),
('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
 'Data Layer Setup', 'Cloud SQL PostgreSQL configured, migrations applied, pgvector enabled',
 'in_progress', '2026-03-18'),
('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
 'First Category B Workflow', 'First scheduled Cloud Function deployed and running',
 'pending', NULL),
('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
 'First Category C Agent', 'First LangGraph agent deployed on Cloud Run',
 'pending', NULL);

-- =============================================================================
-- PROJECT 2: AI&U YouTube Channel
-- =============================================================================

INSERT INTO projects (id, name, slug, description, status, category, tech_stack, owner, metadata)
VALUES (
    'a1000000-0000-0000-0000-000000000002',
    'AI&U YouTube Channel',
    'aiu-youtube',
    'YouTube channel demystifying AI for everyone. Three pillars: AI for Common Person, Using AI Tools, Building AI Workflows.',
    'active',
    NULL,
    ARRAY['DaVinci Resolve', 'Prism Live Studio', 'Canva', 'Claude'],
    'atharva',
    '{"pillars": ["AI for Common Person", "Using AI Tools", "Building AI Workflows"], "pending_decisions": ["recording setup", "first video topic", "thumbnail template"]}'::JSONB
);

-- AI&U Phases
INSERT INTO project_phases (id, project_id, name, description, status, sort_order, started_at) VALUES
('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002',
 'Pre-launch — Foundation Library', 'Build first 10-video foundation library. Production pipeline being established.',
 'in_progress', 1, '2026-03-01'),
('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002',
 'Launch — Publish & Grow', 'Publish first videos, establish cadence, grow audience',
 'not_started', 2, NULL);

-- AI&U Milestones
INSERT INTO milestones (id, phase_id, project_id, name, description, status) VALUES
('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002',
 'First Video Published', 'First video scripted, recorded, edited, and published',
 'pending'),
('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002',
 '10-Video Foundation Library', 'Complete 10-video library across all three pillars',
 'pending');

-- =============================================================================
-- PROJECT 3: Bharatvarsh Novel & Transmedia
-- =============================================================================

INSERT INTO projects (id, name, slug, description, status, category, tech_stack, live_url, owner, metadata)
VALUES (
    'a1000000-0000-0000-0000-000000000003',
    'Bharatvarsh Novel & Transmedia',
    'bharatvarsh',
    'Published novel with live website. Marketing and community-building phase. Sequel in early development.',
    'active',
    NULL,
    ARRAY['Next.js', 'React', 'Tailwind', 'Cloud Run', 'Cloud SQL PostgreSQL'],
    'https://welcometobharatvarsh.com',
    'atharva',
    '{"published": true, "available_on": ["Amazon", "Flipkart", "Notion Press"], "pending_decisions": ["graphic novel timeline", "forum growth strategy", "sequel plotting"]}'::JSONB
);

-- Bharatvarsh Phases
INSERT INTO project_phases (id, project_id, name, description, status, sort_order, started_at) VALUES
('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003',
 'Publication & Website', 'Novel published, website live with lore pages',
 'completed', 1, '2025-01-01'),
('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003',
 'Marketing & Community', 'Content marketing, social posts, lore reveals, community engagement',
 'in_progress', 2, '2026-02-01'),
('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003',
 'Transmedia Expansion', 'Bhoomi AI voice assistant, forum, graphic novel adaptation, sequel',
 'not_started', 3, NULL);

-- Bharatvarsh Milestones
INSERT INTO milestones (id, phase_id, project_id, name, description, status) VALUES
('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003',
 'Content Marketing Cadence', 'Established cadence of social posts, lore reveals, and community engagement',
 'in_progress'),
('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003',
 'Bhoomi AI Voice Assistant', 'AI-powered lore companion deployed on website',
 'pending');

-- =============================================================================
-- TAGS
-- =============================================================================

INSERT INTO project_tags (project_id, tag) VALUES
('a1000000-0000-0000-0000-000000000001', 'ai'),
('a1000000-0000-0000-0000-000000000001', 'infrastructure'),
('a1000000-0000-0000-0000-000000000001', 'gcp'),
('a1000000-0000-0000-0000-000000000001', 'automation'),
('a1000000-0000-0000-0000-000000000001', 'primary'),
('a1000000-0000-0000-0000-000000000002', 'content'),
('a1000000-0000-0000-0000-000000000002', 'youtube'),
('a1000000-0000-0000-0000-000000000002', 'ai'),
('a1000000-0000-0000-0000-000000000003', 'creative'),
('a1000000-0000-0000-0000-000000000003', 'marketing'),
('a1000000-0000-0000-0000-000000000003', 'transmedia'),
('a1000000-0000-0000-0000-000000000003', 'published');

COMMIT;
