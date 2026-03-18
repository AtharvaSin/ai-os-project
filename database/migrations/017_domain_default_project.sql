-- Migration 017: Add default_project_id to life_domains metadata
-- Enables dynamic project resolution in task sync and create_task
-- Each domain maps to its default project for phone-created tasks

-- 001 Friends and Gatherings → personal
UPDATE life_domains SET metadata = metadata || '{"default_project_id": "f75716c2-e8aa-4270-a1e0-db171f0e720d"}'::jsonb
WHERE domain_number = '001';

-- 002 Health → personal
UPDATE life_domains SET metadata = metadata || '{"default_project_id": "f75716c2-e8aa-4270-a1e0-db171f0e720d"}'::jsonb
WHERE domain_number = '002';

-- 003 Wife and Family → personal
UPDATE life_domains SET metadata = metadata || '{"default_project_id": "f75716c2-e8aa-4270-a1e0-db171f0e720d"}'::jsonb
WHERE domain_number = '003';

-- 004 Novel Promotion → bharatvarsh
UPDATE life_domains SET metadata = metadata || '{"default_project_id": "a1000000-0000-0000-0000-000000000003"}'::jsonb
WHERE domain_number = '004';

-- 005 Miscellaneous Tasks → personal
UPDATE life_domains SET metadata = metadata || '{"default_project_id": "f75716c2-e8aa-4270-a1e0-db171f0e720d"}'::jsonb
WHERE domain_number = '005';

-- 006 Managing AI OS → ai-os
UPDATE life_domains SET metadata = metadata || '{"default_project_id": "a1000000-0000-0000-0000-000000000001"}'::jsonb
WHERE domain_number = '006';

-- 007 Networking → personal
UPDATE life_domains SET metadata = metadata || '{"default_project_id": "f75716c2-e8aa-4270-a1e0-db171f0e720d"}'::jsonb
WHERE domain_number = '007';

-- 008 Admin → personal
UPDATE life_domains SET metadata = metadata || '{"default_project_id": "f75716c2-e8aa-4270-a1e0-db171f0e720d"}'::jsonb
WHERE domain_number = '008';

-- 009 Zealogics Onboarding → zealogics
UPDATE life_domains SET metadata = metadata || '{"default_project_id": "d1e0e72c-5b0a-4695-908c-9fe8e33bc4eb"}'::jsonb
WHERE domain_number = '009';

-- 010 Career Network → personal
UPDATE life_domains SET metadata = metadata || '{"default_project_id": "f75716c2-e8aa-4270-a1e0-db171f0e720d"}'::jsonb
WHERE domain_number = '010';
