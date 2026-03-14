-- Migration: 003_pipelines
-- Description: Pipeline execution tracking and campaign management
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-14
-- Purpose: Track Category B/C pipeline runs, costs, logs; manage content campaigns

BEGIN;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE pipeline_category AS ENUM (
    'A',
    'B',
    'C'
);

CREATE TYPE run_status AS ENUM (
    'running',
    'success',
    'failed',
    'cancelled'
);

CREATE TYPE trigger_type AS ENUM (
    'scheduled',
    'manual',
    'event',
    'webhook'
);

CREATE TYPE log_level AS ENUM (
    'debug',
    'info',
    'warn',
    'error'
);

CREATE TYPE campaign_status AS ENUM (
    'planned',
    'active',
    'paused',
    'completed'
);

CREATE TYPE post_status AS ENUM (
    'draft',
    'scheduled',
    'published',
    'failed',
    'cancelled'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Pipelines: registered pipeline definitions
CREATE TABLE pipelines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL UNIQUE,
    slug            TEXT NOT NULL UNIQUE,
    category        pipeline_category NOT NULL,
    description     TEXT,
    schedule        TEXT,                              -- cron expression or human-readable
    entrypoint      TEXT,                              -- e.g. "workflows/category-b/birthday_wishes/"
    config          JSONB DEFAULT '{}'::JSONB,         -- pipeline-specific configuration
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline runs: execution history
CREATE TABLE pipeline_runs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    status          run_status NOT NULL DEFAULT 'running',
    trigger_type    trigger_type NOT NULL DEFAULT 'manual',
    triggered_by    TEXT,                              -- user or system identifier
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    duration_ms     INTEGER,                           -- computed on completion
    tokens_used     INTEGER DEFAULT 0,
    cost_estimate_usd NUMERIC(10, 6) DEFAULT 0,
    output_summary  TEXT,
    error_message   TEXT,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline logs: per-run log entries
CREATE TABLE pipeline_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id          UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level           log_level NOT NULL DEFAULT 'info',
    message         TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}'::JSONB          -- structured log data
);

-- Campaigns: content campaigns tied to audiences
CREATE TABLE campaigns (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    description     TEXT,
    platform        TEXT,                              -- e.g. 'linkedin', 'youtube', 'twitter', 'multi'
    audience_id     UUID REFERENCES audiences(id) ON DELETE SET NULL,
    status          campaign_status NOT NULL DEFAULT 'planned',
    start_date      DATE,
    end_date        DATE,
    goals           TEXT,
    metrics         JSONB DEFAULT '{}'::JSONB,         -- aggregate campaign metrics
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign posts: individual content pieces within a campaign
CREATE TABLE campaign_posts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id         UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    platform            TEXT NOT NULL,                 -- 'linkedin', 'twitter', 'youtube', 'instagram'
    content_preview     TEXT,                          -- first ~500 chars or summary
    content_type        TEXT,                          -- 'post', 'thread', 'video', 'story', 'article'
    scheduled_at        TIMESTAMPTZ,
    published_at        TIMESTAMPTZ,
    status              post_status NOT NULL DEFAULT 'draft',
    performance_metrics JSONB DEFAULT '{}'::JSONB,     -- likes, shares, views, etc.
    external_post_id    TEXT,                          -- platform-specific post ID
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Pipelines
CREATE INDEX idx_pipelines_category ON pipelines(category);
CREATE INDEX idx_pipelines_is_active ON pipelines(is_active);

-- Pipeline runs
CREATE INDEX idx_pipeline_runs_pipeline_status ON pipeline_runs(pipeline_id, status);
CREATE INDEX idx_pipeline_runs_started_at ON pipeline_runs(started_at DESC);
CREATE INDEX idx_pipeline_runs_status ON pipeline_runs(status);

-- Pipeline logs
CREATE INDEX idx_pipeline_logs_run_timestamp ON pipeline_logs(run_id, timestamp);
CREATE INDEX idx_pipeline_logs_level ON pipeline_logs(level);

-- Campaigns
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_audience_id ON campaigns(audience_id);
CREATE INDEX idx_campaigns_platform ON campaigns(platform);

-- Campaign posts
CREATE INDEX idx_campaign_posts_campaign_id ON campaign_posts(campaign_id);
CREATE INDEX idx_campaign_posts_scheduled_at ON campaign_posts(scheduled_at);
CREATE INDEX idx_campaign_posts_status ON campaign_posts(status);
CREATE INDEX idx_campaign_posts_platform ON campaign_posts(platform);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER pipelines_updated_at
    BEFORE UPDATE ON pipelines
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER campaign_posts_updated_at
    BEFORE UPDATE ON campaign_posts
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

COMMIT;
