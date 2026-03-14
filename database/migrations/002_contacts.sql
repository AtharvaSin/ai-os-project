-- Migration: 002_contacts
-- Description: Contacts, relationships, important dates, and audience management
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-14
-- Purpose: Supports Birthday Wishes pipeline (Category B) and audience segmentation

BEGIN;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE contact_type AS ENUM (
    'professional',
    'personal',
    'both'
);

CREATE TYPE relationship_type AS ENUM (
    'colleague',
    'mentor',
    'mentee',
    'friend',
    'family',
    'client',
    'collaborator',
    'investor',
    'advisor',
    'acquaintance'
);

CREATE TYPE date_type AS ENUM (
    'birthday',
    'anniversary',
    'work_anniversary',
    'custom'
);

-- =============================================================================
-- TABLES
-- =============================================================================

-- Contacts: people in Atharva's network
CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    company         TEXT,
    title           TEXT,                              -- job title / role
    contact_type    contact_type NOT NULL DEFAULT 'professional',
    tags            TEXT[] DEFAULT '{}',               -- flexible labels
    notes           TEXT,                              -- free-form notes
    linkedin_url    TEXT,
    twitter_handle  TEXT,
    location        TEXT,                              -- city / country
    metadata        JSONB DEFAULT '{}'::JSONB,         -- flexible extra data
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact relationships: bidirectional links between contacts
CREATE TABLE contact_relationships (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id_a        UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    contact_id_b        UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    relationship_type   relationship_type NOT NULL,
    description         TEXT,                          -- e.g. "worked together at Microsoft"
    strength            INTEGER CHECK (strength BETWEEN 1 AND 5),  -- 1=weak, 5=strong
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_relationship CHECK (contact_id_a <> contact_id_b),
    CONSTRAINT unique_relationship UNIQUE (contact_id_a, contact_id_b, relationship_type)
);

-- Important dates: birthdays, anniversaries, etc. for reminder pipelines
CREATE TABLE important_dates (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id              UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    date_type               date_type NOT NULL,
    date_value              DATE NOT NULL,             -- the actual date (year may be 1900 if unknown)
    year_known              BOOLEAN NOT NULL DEFAULT TRUE,  -- false if only month/day known
    label                   TEXT,                      -- custom label, e.g. "Wedding anniversary"
    reminder_days_before    INTEGER NOT NULL DEFAULT 1,     -- how many days before to trigger reminder
    last_reminded_at        TIMESTAMPTZ,               -- tracks when last reminder was sent
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    metadata                JSONB DEFAULT '{}'::JSONB, -- e.g. {"message_template": "..."}
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audiences: named segments for targeted outreach
CREATE TABLE audiences (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL UNIQUE,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT,
    criteria        JSONB DEFAULT '{}'::JSONB,         -- segment rules (tags, types, etc.)
    is_dynamic      BOOLEAN NOT NULL DEFAULT FALSE,    -- true = auto-populate from criteria
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audience members: junction linking contacts to audiences
CREATE TABLE audience_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audience_id     UUID NOT NULL REFERENCES audiences(id) ON DELETE CASCADE,
    contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    metadata        JSONB DEFAULT '{}'::JSONB,         -- per-member data (subscription date, source, etc.)
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (audience_id, contact_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Contacts
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company ON contacts(company);
CREATE INDEX idx_contacts_contact_type ON contacts(contact_type);
CREATE INDEX idx_contacts_is_active ON contacts(is_active);
CREATE INDEX idx_contacts_tags ON contacts USING GIN (tags);
CREATE INDEX idx_contacts_fulltext ON contacts USING GIN (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(company, '') || ' ' || coalesce(notes, ''))
);

-- Contact relationships
CREATE INDEX idx_contact_rel_a ON contact_relationships(contact_id_a);
CREATE INDEX idx_contact_rel_b ON contact_relationships(contact_id_b);
CREATE INDEX idx_contact_rel_type ON contact_relationships(relationship_type);

-- Important dates
CREATE INDEX idx_important_dates_contact_id ON important_dates(contact_id);
CREATE INDEX idx_important_dates_date_value ON important_dates(date_value);
CREATE INDEX idx_important_dates_date_type ON important_dates(date_type);
CREATE INDEX idx_important_dates_active ON important_dates(is_active);

-- Audiences
CREATE INDEX idx_audiences_slug ON audiences(slug);

-- Audience members
CREATE INDEX idx_audience_members_audience_id ON audience_members(audience_id);
CREATE INDEX idx_audience_members_contact_id ON audience_members(contact_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at on contacts
CREATE TRIGGER contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

-- Auto-update updated_at on audiences
CREATE TRIGGER audiences_updated_at
    BEFORE UPDATE ON audiences
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

COMMIT;
