-- Seed 006: Register Knowledge Layer V2 pipelines and update skill_registry
-- Run after migrations 006 + 007 are applied
-- Date: 2026-03-15

-- ============================================
-- 1. Register new pipelines
-- ============================================

INSERT INTO pipelines (name, slug, category, description, schedule, metadata)
VALUES
    ('Embedding Generator', 'embedding-generator', 'B',
     'Generates vector embeddings for knowledge entries without embeddings. Uses OpenAI text-embedding-3-small. Processes batches of 50 entries every 5 minutes.',
     '*/5 * * * *',
     '{"service": "embedding-generator", "runtime": "cloud-run", "model": "text-embedding-3-small"}'::jsonb),

    ('Drive Knowledge Scanner', 'drive-knowledge-scanner', 'B',
     'Scans Google Drive AI OS/Knowledge/ folder tree for new or modified files. Chunks content by headers/paragraphs and ingests as knowledge entries.',
     '0 0 * * *',
     '{"service": "drive-knowledge-scanner", "runtime": "cloud-run", "scan_root": "AI OS/Knowledge/"}'::jsonb),

    ('Weekly Knowledge Summary', 'weekly-knowledge-summary', 'B',
     'Generates natural-language weekly summaries of operational data (tasks, milestones, pipeline runs) using Claude Haiku. Creates knowledge entries per active project.',
     '30 16 * * 0',
     '{"service": "weekly-knowledge-summary", "runtime": "cloud-run", "model": "claude-haiku-4-5-20251001", "schedule_tz": "Sunday 22:00 IST"}'::jsonb),

    ('Knowledge Auto-Connector', 'knowledge-auto-connector', 'B',
     'Discovers cross-domain connections between new knowledge entries using embedding similarity and Claude Haiku classification. Proposes connections for human approval.',
     '30 17 * * 0',
     '{"service": "knowledge-auto-connector", "runtime": "cloud-run", "models": ["text-embedding-3-small", "claude-haiku-4-5-20251001"], "schedule_tz": "Sunday 23:00 IST"}'::jsonb)

ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    schedule = EXCLUDED.schedule,
    metadata = EXCLUDED.metadata,
    updated_at = now();

-- ============================================
-- 2. Update skill_registry with new/updated skills
-- ============================================

-- Update existing skills to reflect RAG grounding
UPDATE skill_registry
SET version = version || '-rag',
    description = description || ' [RAG-grounded: queries knowledge layer via search_knowledge MCP tool]',
    metadata = COALESCE(metadata, '{}'::jsonb) || '{"rag_grounded": true, "rag_grounded_at": "2026-03-15"}'::jsonb,
    updated_at = now()
WHERE name IN ('morning-brief', 'weekly-review', 'session-resume')
AND (metadata IS NULL OR NOT (metadata ? 'rag_grounded'));

-- Log skill evolution for RAG grounding
INSERT INTO skill_evolution_log (skill_id, change_type, change_description, version_before, version_after, metadata)
SELECT
    sr.id,
    'updated'::skill_change_type,
    'Added Knowledge Layer V2 RAG grounding: skill now queries knowledge_entries via search_knowledge MCP tool for project summaries, personal events, system updates, and knowledge health stats.',
    sr.version,
    sr.version || '-rag',
    '{"sprint": "5C", "change": "rag_grounding"}'::jsonb
FROM skill_registry sr
WHERE sr.name IN ('morning-brief', 'weekly-review', 'session-resume');

-- ============================================
-- 3. Verification
-- ============================================
-- Run these after applying:
-- SELECT slug, name, category, schedule FROM pipelines WHERE category = 'B' ORDER BY slug;
-- SELECT name, version, metadata->>'rag_grounded' as rag FROM skill_registry WHERE name IN ('morning-brief', 'weekly-review', 'session-resume');
