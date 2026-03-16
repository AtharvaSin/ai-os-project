-- Migration: 009_risk_alerts
-- Description: Risk Engine tables — risk alerts with severity, type, and resolution tracking
-- Created: 2026-03-16
-- Depends on: 008_telegram_bot (27 tables → 28 tables after this migration)

BEGIN;

-- =============================================================================
-- 1. Enum types for risk engine
-- =============================================================================

CREATE TYPE risk_alert_type AS ENUM (
    'overdue_cluster',
    'velocity_decline',
    'milestone_slip',
    'dependency_chain',
    'stale_project'
);

CREATE TYPE risk_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


-- =============================================================================
-- 2. risk_alerts — Proactive risk detection results
-- =============================================================================

CREATE TABLE risk_alerts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    alert_type          risk_alert_type NOT NULL,
    severity            risk_severity NOT NULL DEFAULT 'medium',
    title               TEXT NOT NULL,
    description         TEXT,
    affected_tasks      UUID[] DEFAULT '{}',
    affected_milestones UUID[] DEFAULT '{}',
    score               NUMERIC,
    is_resolved         BOOLEAN NOT NULL DEFAULT false,
    resolved_at         TIMESTAMPTZ,
    resolution_note     TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_risk_alerts_project ON risk_alerts (project_id);
CREATE INDEX idx_risk_alerts_type ON risk_alerts (alert_type);
CREATE INDEX idx_risk_alerts_severity ON risk_alerts (severity);
CREATE INDEX idx_risk_alerts_unresolved ON risk_alerts (project_id, severity DESC, created_at DESC)
    WHERE is_resolved = false;
CREATE INDEX idx_risk_alerts_created ON risk_alerts (created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER risk_alerts_updated_at
    BEFORE UPDATE ON risk_alerts
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

COMMIT;
