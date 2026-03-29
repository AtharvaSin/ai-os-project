-- Migration: 020_content_pipeline
-- Description: Bharatvarsh content pipeline — post tracking, status workflow, audit log
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-21
-- Purpose: Track Bharatvarsh promotional content through a 9-stage pipeline from
--          planning through image generation, rendering, approval, and publishing.
--          Draft-only posting with human-in-loop approval. Audit trail for every
--          status transition, image upload, render, and publish event.
--          1 enum type, 2 new tables → total 47 tables.

BEGIN;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE content_post_status AS ENUM (
    'planned',          -- post is in the calendar but not yet fleshed out
    'prompt_ready',     -- art prompt generated, awaiting human image creation
    'awaiting_image',   -- prompt sent to Atharva, waiting for upload
    'image_uploaded',   -- source image placed in content-pipelines/bharatvarsh/ directory
    'rendered',         -- render-post.js has produced platform-specific assets
    'approved',         -- Atharva has approved the final output
    'scheduled',        -- post is queued for a specific date/time
    'published',        -- post is live on one or more platforms
    'failed'            -- pipeline error at any stage
);

COMMIT;

-- Enum additions must commit before use in table definitions
BEGIN;

-- =============================================================================
-- TABLE: content_posts
-- Core table for the Bharatvarsh content pipeline. Each row represents one
-- piece of content that moves through the 9-stage workflow: planned →
-- prompt_ready → awaiting_image → image_uploaded → rendered → approved →
-- scheduled → published (or failed at any point).
--
-- Posts are identified by a human-readable post_id (e.g., 'ARC1-001') that
-- maps to the campaign arc and sequence number. The art_prompt JSONB stores
-- the full prompt configuration from arc1_post_prompts.json. render_manifest
-- captures output from render-post.js. social_post_ids maps platform names
-- to their external post identifiers after publishing.
--
-- Draft-only: posts are NEVER auto-published. The 'approved' status gate
-- ensures human review before any post reaches 'scheduled' or 'published'.
-- =============================================================================

CREATE TABLE content_posts (
    id                 SERIAL PRIMARY KEY,
    post_id            VARCHAR(20) UNIQUE NOT NULL,         -- e.g., 'ARC1-001'
    campaign           VARCHAR(100) NOT NULL,               -- e.g., 'arc1_whispers_of_dharma'
    content_pillar     VARCHAR(50) NOT NULL,                -- stores story_angle value for backward compat
    story_angle        VARCHAR(50),                          -- 'bharatsena', 'akakpen', 'tribhuj'
    distillation_filter VARCHAR(50),                         -- 'living_without_religion', 'med_mil_progress', 'novel_intro'
    content_channel    VARCHAR(50),                           -- 'declassified_report', 'graffiti_photo', 'news_article'
    topic              TEXT NOT NULL,                        -- post topic / subject line
    hook               TEXT,                                 -- opening hook or attention-grabber
    lore_refs          TEXT,                                 -- comma-separated lore references for canon validation
    classified_status  VARCHAR(30),                          -- spoiler classification: 'safe', 'minor_spoiler', 'major_spoiler'
    channels           TEXT[] NOT NULL,                      -- target platforms: {'instagram', 'twitter', 'facebook', 'linkedin'}
    caption_text       TEXT,                                 -- final caption / post body text
    visual_direction   TEXT,                                 -- human-readable visual direction notes
    art_prompt         JSONB,                                -- full prompt config from arc post prompts JSON
    model_routing      VARCHAR(50),                          -- image model: 'seedream_4_5', 'nano_banana', etc.
    source_image_path  TEXT,                                 -- local filesystem path to uploaded source image
    render_manifest    JSONB,                                -- output from render-post.js (paths, dimensions, formats)
    style_overrides    JSONB,                                -- per-post style overrides from post_style_overrides.json
    scheduled_date     DATE,                                 -- target publish date
    scheduled_time     TIME,                                 -- target publish time (IST)
    target_audience    TEXT,                                 -- audience segment description
    hashtags           TEXT,                                 -- space or comma-separated hashtag string
    cta_type           VARCHAR(50),                          -- call-to-action type: 'link', 'follow', 'share', 'buy', etc.
    cta_link           TEXT,                                 -- call-to-action URL
    social_post_ids    JSONB,                                -- platform → external post ID mapping after publishing
    status             content_post_status NOT NULL DEFAULT 'planned',
    approved_at        TIMESTAMPTZ,                          -- when Atharva approved the post
    published_at       TIMESTAMPTZ,                          -- when the post went live
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE content_posts IS 'Bharatvarsh content pipeline posts. Each row tracks one promotional post through a 9-stage workflow from planning to publishing. Draft-only: human approval required before scheduling. art_prompt stores full image generation config, render_manifest stores render-post.js output, social_post_ids maps platform→external ID after publishing. post_id format is ARC{n}-{seq} (e.g., ARC1-001).';

COMMENT ON COLUMN content_posts.post_id IS 'Human-readable identifier in ARC{n}-{seq} format. Used as the primary reference in pipeline commands and Google Tasks.';
COMMENT ON COLUMN content_posts.campaign IS 'Campaign arc name. Maps to content-pipelines/bharatvarsh/calendar/ arc definitions (e.g., arc1_whispers_of_dharma).';
COMMENT ON COLUMN content_posts.content_pillar IS 'Primary content category. Now stores story_angle value (bharatsena/akakpen/tribhuj) for backward compatibility with dashboard filters. See story_angle, distillation_filter, content_channel for the full 3-axis taxonomy.';
COMMENT ON COLUMN content_posts.story_angle IS 'Content strategy Layer 2: bharatsena (state perspective), akakpen (tribal/wild perspective), tribhuj (resistance perspective).';
COMMENT ON COLUMN content_posts.distillation_filter IS 'Content strategy Layer 3: living_without_religion, med_mil_progress, novel_intro. Determines thematic lens.';
COMMENT ON COLUMN content_posts.content_channel IS 'Content strategy Layer 4: declassified_report (formal docs), graffiti_photo (artistic), news_article (media artifacts). Determines output format.';
COMMENT ON COLUMN content_posts.channels IS 'Target social platforms. Array of: instagram, twitter, facebook, linkedin.';
COMMENT ON COLUMN content_posts.art_prompt IS 'Full image generation prompt config from arc post prompts JSON. Includes prompt text, negative prompt, style params, aspect ratio.';
COMMENT ON COLUMN content_posts.model_routing IS 'Image generation model identifier. Primary: seedream_4_5 (Google). Fallback: nano_banana (local).';
COMMENT ON COLUMN content_posts.render_manifest IS 'Output from render-post.js — file paths, dimensions, formats for each target platform.';
COMMENT ON COLUMN content_posts.style_overrides IS 'Per-post style overrides from post_style_overrides.json. Merged with global brand styles at render time.';
COMMENT ON COLUMN content_posts.social_post_ids IS 'Platform-to-external-ID mapping after publishing. E.g., {"instagram": "17854360...", "twitter": "17293..."}.';
COMMENT ON COLUMN content_posts.classified_status IS 'Spoiler classification for canon safety: safe, minor_spoiler, major_spoiler. Determines review depth.';

-- =============================================================================
-- TABLE: content_pipeline_log
-- Immutable audit trail for every pipeline action. Append-only — no updates
-- or deletes. Every status transition, image upload, render pass, approval,
-- and publish event is recorded with full context in the details JSONB.
-- =============================================================================

CREATE TABLE content_pipeline_log (
    id              SERIAL PRIMARY KEY,
    post_id         VARCHAR(20) NOT NULL REFERENCES content_posts(post_id),
    action          VARCHAR(50) NOT NULL,                   -- 'status_change', 'image_upload', 'render', 'approve', 'publish', 'error'
    old_status      content_post_status,                    -- previous status (NULL for first entry)
    new_status      content_post_status,                    -- resulting status
    details         JSONB,                                  -- action-specific context (error message, file paths, platform response, etc.)
    performed_by    VARCHAR(100) DEFAULT 'system',          -- 'system', 'atharva', 'pipeline', tool name, etc.
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE content_pipeline_log IS 'Immutable audit log for the Bharatvarsh content pipeline. Every action (status change, image upload, render, approval, publish, error) is recorded with timestamps, actor, and JSONB details. Append-only — no updated_at column. Used for pipeline debugging, SLA tracking, and compliance audit.';

COMMENT ON COLUMN content_pipeline_log.action IS 'Pipeline action type: status_change, image_upload, render, approve, publish, schedule, caption_edit, prompt_generate, error.';
COMMENT ON COLUMN content_pipeline_log.details IS 'Action-specific context. For errors: {error, traceback}. For renders: {output_files, durations}. For publishes: {platform, post_id, url}.';
COMMENT ON COLUMN content_pipeline_log.performed_by IS 'Actor identity: system (automated), atharva (manual), pipeline (batch job), or specific tool name.';

-- =============================================================================
-- INDEXES: content_posts
-- =============================================================================

-- Filter by pipeline status (the most common query pattern)
CREATE INDEX idx_content_posts_status ON content_posts (status);

-- Filter by campaign arc
CREATE INDEX idx_content_posts_campaign ON content_posts (campaign);

-- Calendar view — find posts by scheduled date
CREATE INDEX idx_content_posts_scheduled ON content_posts (scheduled_date) WHERE scheduled_date IS NOT NULL;

-- Content pillar / story angle analytics
CREATE INDEX idx_content_posts_pillar ON content_posts (content_pillar);

-- Story angle analytics (new 3-axis taxonomy)
CREATE INDEX idx_content_posts_story_angle ON content_posts (story_angle) WHERE story_angle IS NOT NULL;

-- Distillation filter analytics
CREATE INDEX idx_content_posts_distillation ON content_posts (distillation_filter) WHERE distillation_filter IS NOT NULL;

-- Content channel analytics
CREATE INDEX idx_content_posts_channel ON content_posts (content_channel) WHERE content_channel IS NOT NULL;

-- Channel-based queries (GIN for array containment)
CREATE INDEX idx_content_posts_channels ON content_posts USING GIN (channels);

-- Recent posts
CREATE INDEX idx_content_posts_created ON content_posts (created_at DESC);

-- =============================================================================
-- INDEXES: content_pipeline_log
-- =============================================================================

-- Look up all log entries for a given post
CREATE INDEX idx_pipeline_log_post ON content_pipeline_log (post_id);

-- Filter by action type
CREATE INDEX idx_pipeline_log_action ON content_pipeline_log (action);

-- Time-range queries for audit and debugging
CREATE INDEX idx_pipeline_log_created ON content_pipeline_log (created_at DESC);

-- Composite: post + time for timeline reconstruction
CREATE INDEX idx_pipeline_log_post_time ON content_pipeline_log (post_id, created_at);

-- =============================================================================
-- TRIGGERS: Auto-update updated_at on content_posts
-- =============================================================================

CREATE TRIGGER content_posts_updated_at
    BEFORE UPDATE ON content_posts
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- NOTE: content_pipeline_log has NO updated_at trigger — it is append-only.
-- Every pipeline event creates a new row; existing rows are never modified.

COMMIT;
