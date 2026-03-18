-- Migration: 014_contacts_import_columns
-- Description: Add columns to contacts table for Google Contacts CSV import support
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-18
-- Purpose: Enable idempotent CSV re-import, Life Graph domain linkage, interaction tracking

BEGIN;

-- =============================================================================
-- NEW COLUMNS on contacts
-- =============================================================================

-- Links to Google Contacts for idempotent re-import (hash of first+last+phone1)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS google_contact_id TEXT;

-- Tracks origin: 'manual', 'google_csv', 'gmail_parse'
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS import_source TEXT NOT NULL DEFAULT 'manual';

-- Last known interaction timestamp (updated manually or by future pipelines)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- Life Graph domain link (e.g., 'friends_and_gatherings', 'admin', 'wife_family')
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS domain_slug TEXT;

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Unique index on google_contact_id for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_google_contact_id
    ON contacts(google_contact_id);

-- Index on domain_slug for Life Graph queries
CREATE INDEX IF NOT EXISTS idx_contacts_domain_slug ON contacts(domain_slug);

-- Index on import_source for filtering
CREATE INDEX IF NOT EXISTS idx_contacts_import_source ON contacts(import_source);

-- Index on last_contacted_at for "going cold" queries
CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted ON contacts(last_contacted_at)
    WHERE last_contacted_at IS NOT NULL;

COMMIT;
