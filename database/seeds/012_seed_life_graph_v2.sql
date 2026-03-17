-- Seed: 012_seed_life_graph_v2
-- Description: Seed Life Graph v2 domains, context items, and project-domain links
-- Source: Life Graph v2 PDF (2026-03-17)
-- Created: 2026-03-17

BEGIN;

-- =============================================================================
-- PROJECTS: Add missing projects (personal, zealogics)
-- The existing seed has ai-os, aiu-youtube, bharatvarsh. We need personal + zealogics.
-- =============================================================================

INSERT INTO projects (id, name, slug, description, status, owner, metadata)
VALUES (
    'a1000000-0000-0000-0000-000000000004',
    'Personal',
    'personal',
    'Personal tasks and life management items not tied to a specific project.',
    'active',
    'atharva',
    '{}'::JSONB
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO projects (id, name, slug, description, status, owner, metadata)
VALUES (
    'a1000000-0000-0000-0000-000000000005',
    'Zealogics',
    'zealogics',
    'Zealogics Inc. onboarding, projects, and career development.',
    'active',
    'atharva',
    '{"role": "TPM", "start_status": "incoming"}'::JSONB
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- LIFE DOMAINS: 3 categories + 9 numbered domains = 12 rows
-- Trigger auto-computes path and level from parent_id
-- =============================================================================

-- --- Categories (level 0, no parent) ---

INSERT INTO life_domains (id, slug, name, description, status, sort_order, icon, color_code)
VALUES
('d0000000-0000-0000-0000-000000000001', 'private_affairs', 'Private Affairs',
 'Personal life domains: friends, health, family, miscellaneous',
 'active', 1, '🏠', '#8B5CF6');

INSERT INTO life_domains (id, slug, name, description, status, sort_order, icon, color_code)
VALUES
('d0000000-0000-0000-0000-000000000002', 'personal_projects', 'Personal Projects',
 'Creative and technical projects: novel, AI OS, miscellaneous',
 'active', 2, '🚀', '#00D4FF');

INSERT INTO life_domains (id, slug, name, description, status, sort_order, icon, color_code)
VALUES
('d0000000-0000-0000-0000-000000000003', 'work', 'Work',
 'Professional domains: networking, admin, career',
 'active', 3, '💼', '#EC4899');

-- --- Numbered domains (level 1, with parent_id) ---

-- 001 — Friends and Gatherings (under Private Affairs)
INSERT INTO life_domains (id, slug, name, domain_number, parent_id, description, status, sort_order, icon)
VALUES
('d0000000-0000-0000-0001-000000000001', 'friends_and_gatherings', 'Friends and Gatherings',
 '001', 'd0000000-0000-0000-0000-000000000001',
 'Social connections, friend meetups, gatherings, birthday reminders',
 'active', 1, '👥');

-- 002 — Health (under Private Affairs)
INSERT INTO life_domains (id, slug, name, domain_number, parent_id, description, status, sort_order, icon)
VALUES
('d0000000-0000-0000-0001-000000000002', 'health', 'Health',
 '002', 'd0000000-0000-0000-0000-000000000001',
 'Physical health, fitness, gym, nutrition, wellness',
 'active', 2, '💪');

-- 003 — Wife and Family (under Private Affairs)
INSERT INTO life_domains (id, slug, name, domain_number, parent_id, description, status, sort_order, icon)
VALUES
('d0000000-0000-0000-0001-000000000003', 'wife_and_family', 'Wife and Family',
 '003', 'd0000000-0000-0000-0000-000000000001',
 'Family relationships, trips, quality time, family events',
 'active', 3, '❤️');

-- 005 — Miscellaneous Tasks (under Private Affairs)
INSERT INTO life_domains (id, slug, name, domain_number, parent_id, description, status, sort_order, icon)
VALUES
('d0000000-0000-0000-0001-000000000005', 'misc_tasks_private', 'Miscellaneous Tasks',
 '005', 'd0000000-0000-0000-0000-000000000001',
 'Ad-hoc personal tasks: car servicing, errands, one-off items',
 'active', 4, '📝');

-- 004 — Novel Promotion (under Personal Projects)
INSERT INTO life_domains (id, slug, name, domain_number, parent_id, description, status, sort_order, icon)
VALUES
('d0000000-0000-0000-0001-000000000004', 'novel_promotion', 'Novel Promotion',
 '004', 'd0000000-0000-0000-0000-000000000002',
 'Bharatvarsh novel marketing: content pipeline, forum, promotional campaigns',
 'active', 1, '📚');

-- 006 — Managing AI OS (under Personal Projects)
INSERT INTO life_domains (id, slug, name, domain_number, parent_id, description, status, sort_order, icon)
VALUES
('d0000000-0000-0000-0001-000000000006', 'managing_ai_os', 'Managing AI OS',
 '006', 'd0000000-0000-0000-0000-000000000002',
 'AI Operating System development, infrastructure, skills, workflows',
 'active', 2, '🤖');

-- 007 — Networking (under Work)
INSERT INTO life_domains (id, slug, name, domain_number, parent_id, description, status, sort_order, icon)
VALUES
('d0000000-0000-0000-0001-000000000007', 'networking', 'Networking',
 '007', 'd0000000-0000-0000-0000-000000000003',
 'Professional networking, LinkedIn growth, industry connections',
 'active', 1, '🤝');

-- 008 — Admin (under Work)
INSERT INTO life_domains (id, slug, name, domain_number, parent_id, description, status, sort_order, icon)
VALUES
('d0000000-0000-0000-0001-000000000008', 'admin', 'Admin',
 '008', 'd0000000-0000-0000-0000-000000000003',
 'Financial administration: IT returns, insurance, expense tracking, subscriptions',
 'active', 2, '📊');

-- 009 — Zealogics Onboarding (under Work)
INSERT INTO life_domains (id, slug, name, domain_number, parent_id, description, status, sort_order, icon)
VALUES
('d0000000-0000-0000-0001-000000000009', 'zealogics_onboarding', 'Zealogics Onboarding',
 '009', 'd0000000-0000-0000-0000-000000000003',
 'Zealogics Inc. onboarding: key documents, skill development, high performance',
 'active', 3, '🏢');

-- =============================================================================
-- CONTEXT ITEMS: Objectives and Automations from Life Graph v2 PDF
-- =============================================================================

-- Domain 001 — Friends and Gatherings
INSERT INTO domain_context_items (domain_id, item_type, title, description, status, automation_config) VALUES
('d0000000-0000-0000-0001-000000000001', 'automation',
 'Create birthday reminders and automated messages',
 'Automated birthday detection from contacts table, send reminders via Telegram/WhatsApp',
 'active',
 '{"trigger": "daily_scan", "source": "important_dates", "channels": ["telegram", "whatsapp"]}'::JSONB);

-- Domain 002 — Health
INSERT INTO domain_context_items (domain_id, item_type, title, description, status) VALUES
('d0000000-0000-0000-0001-000000000002', 'objective',
 'Start going to gym',
 'Establish regular gym routine for physical fitness',
 'active');

-- Domain 003 — Wife and Family
INSERT INTO domain_context_items (domain_id, item_type, title, description, status, target_date) VALUES
('d0000000-0000-0000-0001-000000000003', 'objective',
 'Have a Srisailam trip in next month',
 'Plan and execute family trip to Srisailam temple',
 'active', '2026-04-17');

-- Domain 004 — Novel Promotion (3 objectives)
INSERT INTO domain_context_items (domain_id, item_type, title, description, status) VALUES
('d0000000-0000-0000-0001-000000000004', 'objective',
 'Build a content pipeline for social media interaction',
 'Systematic content creation and posting across social platforms for Bharatvarsh',
 'active'),
('d0000000-0000-0000-0001-000000000004', 'objective',
 'Build and pin forum content',
 'Create engaging forum discussions and pin key content for community engagement',
 'active'),
('d0000000-0000-0000-0001-000000000004', 'objective',
 'Refine promotional pipelines',
 'Optimize automated marketing campaigns, email sequences, and promotional workflows',
 'active');

-- Domain 006 — Managing AI OS (2 objectives)
INSERT INTO domain_context_items (domain_id, item_type, title, description, status) VALUES
('d0000000-0000-0000-0001-000000000006', 'objective',
 'Build a ChatGPT version: minimal infrastructure change, maximum functionality',
 'Create a ChatGPT-compatible interface layer with minimal new infrastructure',
 'active'),
('d0000000-0000-0000-0001-000000000006', 'objective',
 'Create content — automate as much as possible while keeping control (first image then video)',
 'Build content automation pipelines for AI OS showcase, starting with images then video',
 'active');

-- Domain 007 — Networking
INSERT INTO domain_context_items (domain_id, item_type, title, description, status) VALUES
('d0000000-0000-0000-0001-000000000007', 'objective',
 'Growing LinkedIn presence',
 'Build professional brand on LinkedIn through regular posting and engagement',
 'active');

-- Domain 008 — Admin (1 automation + 1 objective)
INSERT INTO domain_context_items (domain_id, item_type, title, description, status, automation_config) VALUES
('d0000000-0000-0000-0001-000000000008', 'automation',
 'Yearly triggers for IT return filing, form 16, insurance premiums, car servicing',
 'Calendar-based reminders for annual financial and administrative deadlines',
 'active',
 '{"trigger": "calendar_date", "items": ["IT_return_july", "form16_june", "insurance_renewal", "car_servicing_biannual"]}'::JSONB);

INSERT INTO domain_context_items (domain_id, item_type, title, description, status) VALUES
('d0000000-0000-0000-0001-000000000008', 'objective',
 'Expense tracking: subscriptions, monthly bank reports, investments, shopping, bills, miscellaneous',
 'Comprehensive expense tracking system covering all spending categories',
 'active');

-- Domain 009 — Zealogics Onboarding
INSERT INTO domain_context_items (domain_id, item_type, title, description, status) VALUES
('d0000000-0000-0000-0001-000000000009', 'objective',
 'Learn as much as possible about skills to become a high-performing employee',
 'Accelerate learning curve for TPM role at Zealogics Inc.',
 'active');

-- =============================================================================
-- PROJECT-DOMAIN LINKS: Set domain_id on existing projects
-- =============================================================================

UPDATE projects SET domain_id = 'd0000000-0000-0000-0001-000000000006' WHERE slug = 'ai-os';
UPDATE projects SET domain_id = 'd0000000-0000-0000-0001-000000000004' WHERE slug = 'bharatvarsh';
UPDATE projects SET domain_id = 'd0000000-0000-0000-0001-000000000009' WHERE slug = 'zealogics';

-- =============================================================================
-- PIPELINE: Register domain-health-scorer pipeline
-- =============================================================================

INSERT INTO pipelines (id, name, slug, category, schedule, entrypoint, config, notify_telegram)
VALUES (
    uuid_generate_v4(),
    'Domain Health Scorer',
    'domain-health-scorer',
    'B',
    '0 18 * * 0',
    'workflows/category-b/domain-health-scorer/main.py',
    '{"health_formula": "task_rate*0.4 + obj_progress*0.3 + recency*0.2 + auto_coverage*0.1"}'::JSONB,
    false
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
