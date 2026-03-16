-- Seed: Register drive-knowledge-distill skill and pipeline
-- Depends on: skill_registry, skill_evolution_log, pipelines tables (migration 004)

-- Register the skill
INSERT INTO skill_registry (id, name, version, category, workstream, description, skill_path, metadata)
VALUES (
  'b7e3c1a0-4f2d-4e8a-9c6b-1d5e7f8a2b3c',
  'drive-knowledge-distill',
  '1.0.0',
  'A',
  'W2',
  'Monthly human-in-the-loop knowledge distillation from Google Drive changes',
  '.claude/skills/drive-knowledge-distill/SKILL.md',
  '{"trigger_phrases": ["/drive-knowledge-distill", "monthly knowledge sync", "distill Drive knowledge", "what changed in Drive", "knowledge review"], "connectors": ["AIOSMCP", "Google Calendar"], "access_modes": ["drive_read", "pipeline_entries", "manual"]}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  version = EXCLUDED.version,
  description = EXCLUDED.description,
  skill_path = EXCLUDED.skill_path,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Log skill creation
INSERT INTO skill_evolution_log (skill_id, change_type, change_description, version_before, version_after)
VALUES (
  'b7e3c1a0-4f2d-4e8a-9c6b-1d5e7f8a2b3c',
  'created',
  'Initial creation of drive-knowledge-distill skill with 3 access modes (drive_read MCP, pipeline DB entries, manual paste)',
  NULL,
  '1.0.0'
);

-- Register the pipeline
INSERT INTO pipelines (id, name, slug, category, description, schedule, entrypoint, config, is_active)
VALUES (
  'c8f4d2b1-5a3e-4f9b-0d7c-2e6f8a9b4c5d',
  'Drive Knowledge Distill',
  'drive-knowledge-distill',
  'A',
  'Monthly curated knowledge distillation from Google Drive via Claude.ai skill',
  NULL,
  '.claude/skills/drive-knowledge-distill/SKILL.md',
  '{"trigger": "manual_skill", "frequency": "monthly", "access_modes": ["A", "B", "C"]}'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  updated_at = NOW();
