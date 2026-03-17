-- Migration: 012_domain_fk_additions
-- Description: Add domain_id FK to tasks and projects tables
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-17
-- Purpose: Bridge existing task/project management with Life Graph domains
-- Note: Both columns are nullable — existing rows unaffected

BEGIN;

-- =============================================================================
-- ADD domain_id TO tasks TABLE
-- =============================================================================

ALTER TABLE tasks ADD COLUMN domain_id UUID REFERENCES life_domains(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_domain ON tasks (domain_id);

-- =============================================================================
-- ADD domain_id TO projects TABLE
-- =============================================================================

ALTER TABLE projects ADD COLUMN domain_id UUID REFERENCES life_domains(id) ON DELETE SET NULL;
CREATE INDEX idx_projects_domain ON projects (domain_id);

COMMIT;
