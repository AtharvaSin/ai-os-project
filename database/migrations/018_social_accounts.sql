-- Migration: 018_social_accounts
-- Description: Social media account token storage for LinkedIn and Meta connectors
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-20
-- Purpose: Store OAuth tokens for LinkedIn, Facebook, Instagram posting via MCP Gateway

BEGIN;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Social accounts: OAuth token storage for connected social platforms
CREATE TABLE social_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform        TEXT NOT NULL,                          -- 'linkedin', 'facebook', 'instagram', 'twitter'
    account_name    TEXT NOT NULL,                          -- display name (e.g. 'Atharva Singh - LinkedIn')
    account_id      TEXT,                                   -- platform-specific user/page ID
    access_token    TEXT NOT NULL,                          -- current access token
    refresh_token   TEXT,                                   -- refresh token (LinkedIn, Meta long-lived)
    token_expires_at TIMESTAMPTZ,                           -- when access_token expires
    scopes          TEXT[],                                 -- granted OAuth scopes
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    metadata        JSONB DEFAULT '{}'::JSONB,              -- platform-specific config (page_id, ig_user_id, etc.)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Social post log: tracks every post attempt (supplements campaign_posts for non-campaign posts)
CREATE TABLE social_post_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id      UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
    platform        TEXT NOT NULL,
    content_preview TEXT,                                   -- first 500 chars
    content_type    TEXT NOT NULL DEFAULT 'post',           -- 'post', 'article', 'image', 'video', 'carousel', 'story'
    external_post_id TEXT,                                  -- platform post ID after publish
    external_url    TEXT,                                   -- direct link to the post
    status          post_status NOT NULL DEFAULT 'draft',   -- reuse post_status enum from 003
    campaign_post_id UUID REFERENCES campaign_posts(id) ON DELETE SET NULL, -- link to campaign if applicable
    error_message   TEXT,
    metadata        JSONB DEFAULT '{}'::JSONB,              -- full API response, media IDs, etc.
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_social_accounts_active ON social_accounts(is_active);
CREATE UNIQUE INDEX idx_social_accounts_platform_account ON social_accounts(platform, account_id);

CREATE INDEX idx_social_post_log_account ON social_post_log(account_id);
CREATE INDEX idx_social_post_log_platform ON social_post_log(platform);
CREATE INDEX idx_social_post_log_status ON social_post_log(status);
CREATE INDEX idx_social_post_log_published ON social_post_log(published_at DESC);
CREATE INDEX idx_social_post_log_campaign ON social_post_log(campaign_post_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER social_accounts_updated_at
    BEFORE UPDATE ON social_accounts
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER social_post_log_updated_at
    BEFORE UPDATE ON social_post_log
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

COMMIT;
