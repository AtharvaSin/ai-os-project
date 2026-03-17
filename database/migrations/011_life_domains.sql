-- Migration: 011_life_domains
-- Description: Life Graph hierarchical domain system with ltree + adjacency list
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-17
-- Purpose: Store Life Graph v2 domain hierarchy (3 categories, 9 numbered domains)
--          with Tasks/Objectives/Automations context model and weekly health snapshots

BEGIN;

-- =============================================================================
-- EXTENSION: ltree (hierarchical path queries)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS ltree;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE domain_status AS ENUM ('active', 'dormant', 'archived');
CREATE TYPE context_item_type AS ENUM ('task', 'objective', 'automation');

-- =============================================================================
-- TABLE: life_domains
-- Hybrid adjacency list (parent_id FK) + ltree (path column with GiST index)
-- for fast hierarchical queries. Trigger auto-computes path from parent_id.
-- =============================================================================

CREATE TABLE life_domains (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id       UUID REFERENCES life_domains(id) ON DELETE SET NULL,
    slug            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    path            ltree NOT NULL,
    domain_number   TEXT UNIQUE,
    level           INTEGER NOT NULL DEFAULT 0,
    description     TEXT,
    status          domain_status NOT NULL DEFAULT 'active',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    priority_weight NUMERIC(3,2) DEFAULT 0.00,
    color_code      TEXT,
    icon            TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_domains_path ON life_domains USING GIST (path);
CREATE INDEX idx_domains_parent ON life_domains (parent_id);
CREATE INDEX idx_domains_status ON life_domains (status);
CREATE INDEX idx_domains_number ON life_domains (domain_number);

-- =============================================================================
-- TABLE: domain_context_items
-- Objectives and Automations attached to domains.
-- Tasks use the existing tasks table with a domain_id FK (migration 012).
-- =============================================================================

CREATE TABLE domain_context_items (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id         UUID NOT NULL REFERENCES life_domains(id) ON DELETE CASCADE,
    item_type         context_item_type NOT NULL,
    title             TEXT NOT NULL,
    description       TEXT,
    status            TEXT NOT NULL DEFAULT 'active',
    priority          task_priority DEFAULT 'medium',
    target_date       DATE,
    completed_at      TIMESTAMPTZ,
    progress_pct      INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
    automation_config JSONB,
    metadata          JSONB DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_context_domain ON domain_context_items (domain_id);
CREATE INDEX idx_context_type ON domain_context_items (item_type);
CREATE INDEX idx_context_status ON domain_context_items (status);

-- =============================================================================
-- TABLE: domain_health_snapshots
-- Weekly computed health scores per domain. Populated by Category B pipeline.
-- =============================================================================

CREATE TABLE domain_health_snapshots (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id           UUID NOT NULL REFERENCES life_domains(id) ON DELETE CASCADE,
    snapshot_date       DATE NOT NULL,
    tasks_total         INTEGER DEFAULT 0,
    tasks_completed     INTEGER DEFAULT 0,
    tasks_overdue       INTEGER DEFAULT 0,
    objectives_total    INTEGER DEFAULT 0,
    objectives_progress NUMERIC(5,2) DEFAULT 0,
    automations_active  INTEGER DEFAULT 0,
    health_score        NUMERIC(3,2) DEFAULT 0,
    velocity_7d         NUMERIC(5,2) DEFAULT 0,
    days_since_activity INTEGER DEFAULT 0,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (domain_id, snapshot_date)
);

CREATE INDEX idx_health_domain ON domain_health_snapshots (domain_id);
CREATE INDEX idx_health_date ON domain_health_snapshots (snapshot_date DESC);

-- =============================================================================
-- TRIGGER: Auto-compute ltree path from parent_id
-- =============================================================================

CREATE OR REPLACE FUNCTION update_domain_path() RETURNS TRIGGER AS $$
DECLARE
    parent_path ltree;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = NEW.slug::ltree;
    ELSE
        SELECT path FROM life_domains WHERE id = NEW.parent_id INTO parent_path;
        IF parent_path IS NULL THEN
            RAISE EXCEPTION 'Invalid parent_id: % — parent domain does not exist', NEW.parent_id;
        END IF;
        NEW.path = parent_path || NEW.slug::ltree;
    END IF;
    NEW.level = nlevel(NEW.path) - 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER domain_path_trigger
    BEFORE INSERT OR UPDATE OF parent_id, slug ON life_domains
    FOR EACH ROW EXECUTE FUNCTION update_domain_path();

-- =============================================================================
-- TRIGGER: Cascade path updates to children when a domain moves
-- =============================================================================

CREATE OR REPLACE FUNCTION cascade_domain_path() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.path IS DISTINCT FROM NEW.path THEN
        UPDATE life_domains
        SET parent_id = parent_id  -- triggers path recomputation via domain_path_trigger
        WHERE parent_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER domain_path_cascade
    AFTER UPDATE OF path ON life_domains
    FOR EACH ROW EXECUTE FUNCTION cascade_domain_path();

-- =============================================================================
-- TRIGGER: Auto-update updated_at timestamps
-- =============================================================================

CREATE TRIGGER life_domains_updated_at
    BEFORE UPDATE ON life_domains
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER context_items_updated_at
    BEFORE UPDATE ON domain_context_items
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Get all tasks under a domain (recursively via ltree)
CREATE OR REPLACE FUNCTION get_domain_tasks(domain_slug TEXT)
RETURNS TABLE (
    task_id UUID, title TEXT, status task_status,
    priority task_priority, due_date DATE, domain_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.title, t.status, t.priority, t.due_date, d.name
    FROM tasks t
    JOIN life_domains d ON t.domain_id = d.id
    WHERE d.path <@ (SELECT path FROM life_domains WHERE slug = domain_slug)
    ORDER BY t.priority DESC, t.due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Get domain breadcrumb (full ancestor path)
CREATE OR REPLACE FUNCTION get_domain_breadcrumb(target_slug TEXT)
RETURNS TABLE (depth INTEGER, name TEXT, slug TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT (nlevel(d.path) - 1)::INTEGER, d.name, d.slug
    FROM life_domains d
    WHERE d.path @> (SELECT path FROM life_domains WHERE slug = target_slug)
    ORDER BY d.path ASC;
END;
$$ LANGUAGE plpgsql;

-- Get domain summary as JSON
CREATE OR REPLACE FUNCTION get_domain_summary(target_slug TEXT)
RETURNS JSON AS $$
DECLARE
    target_path ltree;
    result JSON;
BEGIN
    SELECT path FROM life_domains WHERE slug = target_slug INTO target_path;
    IF target_path IS NULL THEN
        RETURN json_build_object('error', 'Domain not found: ' || target_slug);
    END IF;

    SELECT json_build_object(
        'domain', target_slug,
        'domain_name', (SELECT name FROM life_domains WHERE slug = target_slug),
        'total_tasks', COALESCE((
            SELECT COUNT(*) FROM tasks t
            JOIN life_domains d ON t.domain_id = d.id
            WHERE d.path <@ target_path
        ), 0),
        'active_tasks', COALESCE((
            SELECT COUNT(*) FROM tasks t
            JOIN life_domains d ON t.domain_id = d.id
            WHERE d.path <@ target_path AND t.status IN ('todo', 'in_progress')
        ), 0),
        'completed_tasks', COALESCE((
            SELECT COUNT(*) FROM tasks t
            JOIN life_domains d ON t.domain_id = d.id
            WHERE d.path <@ target_path AND t.status = 'done'
        ), 0),
        'overdue_tasks', COALESCE((
            SELECT COUNT(*) FROM tasks t
            JOIN life_domains d ON t.domain_id = d.id
            WHERE d.path <@ target_path AND t.due_date < CURRENT_DATE
              AND t.status NOT IN ('done', 'cancelled')
        ), 0),
        'objectives', COALESCE((
            SELECT COUNT(*) FROM domain_context_items ci
            JOIN life_domains d ON ci.domain_id = d.id
            WHERE d.path <@ target_path AND ci.item_type = 'objective'
        ), 0),
        'objectives_avg_progress', COALESCE((
            SELECT AVG(ci.progress_pct) FROM domain_context_items ci
            JOIN life_domains d ON ci.domain_id = d.id
            WHERE d.path <@ target_path AND ci.item_type = 'objective'
        ), 0),
        'automations', COALESCE((
            SELECT COUNT(*) FROM domain_context_items ci
            JOIN life_domains d ON ci.domain_id = d.id
            WHERE d.path <@ target_path AND ci.item_type = 'automation'
        ), 0)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMIT;
