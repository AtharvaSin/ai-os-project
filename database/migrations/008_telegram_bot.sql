-- Migration: 008_telegram_bot
-- Description: Telegram bot tables — conversations, notification log, inbox
-- Created: 2026-03-16
-- Depends on: 007_knowledge_ingestion (24 tables → 27 tables after this migration)

BEGIN;

-- =============================================================================
-- 1. bot_conversations — Multi-turn conversation threads
-- =============================================================================

CREATE TABLE bot_conversations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status      TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'resolved', 'parked')),
    topic       TEXT,
    messages    JSONB NOT NULL DEFAULT '[]'::JSONB,
    thread_summary TEXT,
    context_entities TEXT[] DEFAULT '{}',
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_conversations_status ON bot_conversations (status);
CREATE INDEX idx_bot_conversations_last_active ON bot_conversations (last_active_at DESC);
CREATE INDEX idx_bot_conversations_active ON bot_conversations (status, last_active_at DESC)
    WHERE status = 'active';

CREATE TRIGGER bot_conversations_updated_at
    BEFORE UPDATE ON bot_conversations
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);


-- =============================================================================
-- 2. notification_log — Outbound notification tracking (dedup + audit)
-- =============================================================================

CREATE TABLE notification_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel     TEXT NOT NULL DEFAULT 'telegram'
                    CHECK (channel IN ('telegram', 'email', 'push')),
    notification_type TEXT NOT NULL,
    recipient   TEXT NOT NULL,
    message_preview TEXT,
    telegram_message_id BIGINT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    action_taken TEXT,
    action_at   TIMESTAMPTZ,
    metadata    JSONB DEFAULT '{}'::JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_log_type ON notification_log (notification_type, delivered_at DESC);
CREATE INDEX idx_notification_log_dedup ON notification_log (notification_type, recipient, delivered_at DESC);


-- =============================================================================
-- 3. bot_inbox — Complex requests parked for Claude.ai
-- =============================================================================

CREATE TABLE bot_inbox (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source      TEXT NOT NULL DEFAULT 'telegram',
    message_text TEXT NOT NULL,
    thread_id   UUID REFERENCES bot_conversations(id) ON DELETE SET NULL,
    context     JSONB DEFAULT '{}'::JSONB,
    status      TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'addressed', 'dismissed')),
    addressed_in_chat TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_inbox_status ON bot_inbox (status, created_at DESC);
CREATE INDEX idx_bot_inbox_pending ON bot_inbox (status, created_at DESC)
    WHERE status = 'pending';

CREATE TRIGGER bot_inbox_updated_at
    BEFORE UPDATE ON bot_inbox
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);


-- =============================================================================
-- 4. Column addition — pipelines.notify_telegram
-- =============================================================================

ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS notify_telegram BOOLEAN DEFAULT false;


-- =============================================================================
-- 5. Utility function — short_id(uuid) → first 8 hex chars
-- =============================================================================

CREATE OR REPLACE FUNCTION short_id(full_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT substring(replace(full_uuid::text, '-', '') FROM 1 FOR 8);
$$;

COMMIT;
