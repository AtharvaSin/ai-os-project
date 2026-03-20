-- Seed: 014_seed_creative_writer
-- Description: Pipeline registration for creative writer plugin
-- Created: 2026-03-20

BEGIN;

-- =============================================================================
-- PIPELINE DEFINITION: Creative Writer
-- =============================================================================

INSERT INTO pipelines (id, name, slug, category, description, schedule, entrypoint, config, is_active) VALUES

('a7000000-0000-0000-0000-000000000020',
 'Creative Writer', 'creative-writer',
 'A',
 'General-purpose creative writing engine. Three modes: quick output (blogs, articles, captions), project mode (novels, screenplays with Truby 22-step structure), brainstorm mode (7 ideation methods). Interactive-first — gathers all information before generating.',
 NULL,
 'cowork-configuration/creative-writing-plugin/',
 '{"modes": ["quick", "project", "brainstorm", "critique"], "truby_steps": 22, "brainstorm_methods": 7, "mcp_tools": 8}'::JSONB,
 TRUE);

COMMIT;
