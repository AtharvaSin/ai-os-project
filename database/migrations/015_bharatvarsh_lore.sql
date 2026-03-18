-- Migration: 015_bharatvarsh_lore
-- Description: Bharatvarsh lore tables — entities, relationships, timeline, chapters, writing fragments
-- Database: ai_os (on bharatvarsh-db, bharatvarsh-website:us-central1:bharatvarsh-db)
-- Created: 2026-03-18
-- Purpose: Store the complete Bharatvarsh universe lore — characters, factions, locations,
--          technology, timeline events, novel chapter metadata, and writing style fragments
--          for AI-assisted worldbuilding and voice-matched prose generation.
--          5 new tables → total 38.

BEGIN;

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE lore_entity_type AS ENUM (
    'character', 'faction', 'location', 'technology', 'concept', 'creature', 'event'
);

CREATE TYPE lore_disclosure AS ENUM (
    'classified', 'declassified', 'redacted', 'public'
);

CREATE TYPE lore_relationship_type AS ENUM (
    'member_of', 'leader_of', 'allied_with', 'opposes', 'commands',
    'reports_to', 'child_of', 'parent_of', 'sibling_of', 'mentor_of',
    'student_of', 'created_by', 'uses', 'located_in', 'origin_of'
);

CREATE TYPE writing_fragment_type AS ENUM (
    'dialogue', 'description', 'action', 'internal_monologue', 'world_detail'
);

COMMIT;

-- Enum additions must commit before use in table definitions
BEGIN;

-- =============================================================================
-- TABLE: lore_entities
-- Core lore table for the Bharatvarsh universe. Stores characters, factions,
-- locations, technology, concepts, creatures, and events.
-- =============================================================================

CREATE TABLE lore_entities (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type      lore_entity_type NOT NULL,
    name             TEXT NOT NULL,
    name_devanagari  TEXT,
    slug             TEXT NOT NULL UNIQUE,
    tagline          TEXT,
    summary          TEXT,
    full_description TEXT,
    disclosure       lore_disclosure NOT NULL DEFAULT 'public',
    faction          TEXT,
    tags             TEXT[] DEFAULT '{}',
    visual_keys      JSONB DEFAULT '{}'::JSONB,
    metadata         JSONB DEFAULT '{}'::JSONB,
    sort_order       INTEGER DEFAULT 0,
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE lore_entities IS 'Core Bharatvarsh lore entities — characters, factions, locations, technology, concepts, creatures, and events. Each entity has a unique slug, optional Devanagari name, disclosure classification, and rich metadata for AI-assisted worldbuilding.';

-- =============================================================================
-- TABLE: lore_relationships
-- Typed, directed connections between lore entities. Supports strength scoring
-- and spoiler flagging for controlled information disclosure.
-- =============================================================================

CREATE TABLE lore_relationships (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_entity_id UUID NOT NULL REFERENCES lore_entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES lore_entities(id) ON DELETE CASCADE,
    relationship     lore_relationship_type NOT NULL,
    description      TEXT,
    strength         SMALLINT DEFAULT 5 CHECK (strength BETWEEN 1 AND 10),
    is_spoiler       BOOLEAN DEFAULT FALSE,
    metadata         JSONB DEFAULT '{}'::JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lore_rel_unique UNIQUE (source_entity_id, target_entity_id, relationship),
    CONSTRAINT lore_rel_no_self CHECK (source_entity_id != target_entity_id)
);

COMMENT ON TABLE lore_relationships IS 'Directed relationships between Bharatvarsh lore entities — member_of, allied_with, opposes, commands, etc. Each relationship has a strength score (1-10) and optional spoiler flag. Unique constraint prevents duplicate typed edges.';

-- =============================================================================
-- TABLE: lore_timeline
-- Chronological events in the Bharatvarsh universe. Supports year-based sorting,
-- era grouping, and entity cross-referencing via text slugs in entities_involved.
-- =============================================================================

CREATE TABLE lore_timeline (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year              INTEGER,
    date_label        TEXT,
    era               TEXT,
    title             TEXT NOT NULL,
    description       TEXT,
    significance      TEXT,
    entities_involved TEXT[] DEFAULT '{}',
    disclosure        lore_disclosure NOT NULL DEFAULT 'public',
    sort_order        INTEGER DEFAULT 0,
    tags              TEXT[] DEFAULT '{}',
    metadata          JSONB DEFAULT '{}'::JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE lore_timeline IS 'Chronological timeline of the Bharatvarsh universe — wars, political shifts, technological breakthroughs, founding events. Supports year-based sorting, era grouping, and cross-references to lore_entities via the entities_involved array.';

-- =============================================================================
-- TABLE: lore_chapters
-- Novel chapter metadata for MahaBharatvarsh and future Bharatvarsh novels.
-- Links to lore_entities for POV character, locations, and cast tracking.
-- =============================================================================

CREATE TABLE lore_chapters (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    novel          TEXT NOT NULL DEFAULT 'MahaBharatvarsh',
    chapter_number INTEGER NOT NULL,
    title          TEXT,
    summary        TEXT,
    pov_character  UUID REFERENCES lore_entities(id) ON DELETE SET NULL,
    location_ids   UUID[] DEFAULT '{}',
    character_ids  UUID[] DEFAULT '{}',
    plot_threads   TEXT[] DEFAULT '{}',
    word_count     INTEGER,
    mood           TEXT,
    tags           TEXT[] DEFAULT '{}',
    metadata       JSONB DEFAULT '{}'::JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT lore_chapter_unique UNIQUE (novel, chapter_number)
);

COMMENT ON TABLE lore_chapters IS 'Novel chapter metadata for MahaBharatvarsh — tracks POV character, location, cast, plot threads, word count, and mood per chapter. Enables outline-level novel management and AI-assisted continuity checking.';

-- =============================================================================
-- TABLE: writing_fragments
-- Style samples and prose fragments for voice-matching and AI writing assistance.
-- Tagged by type (dialogue, description, action, etc.) and optionally linked to
-- a specific character or chapter for contextual style retrieval.
-- =============================================================================

CREATE TABLE writing_fragments (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fragment_type writing_fragment_type NOT NULL,
    content       TEXT NOT NULL,
    character_id  UUID REFERENCES lore_entities(id) ON DELETE SET NULL,
    chapter_id    UUID REFERENCES lore_chapters(id) ON DELETE SET NULL,
    style_notes   TEXT,
    tags          TEXT[] DEFAULT '{}',
    metadata      JSONB DEFAULT '{}'::JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE writing_fragments IS 'Prose style samples from Bharatvarsh writing — dialogue, description, action sequences, internal monologue, world details. Used for AI voice-matching and consistent tone generation. Optionally linked to a character or chapter for contextual retrieval.';

-- =============================================================================
-- INDEXES: lore_entities
-- =============================================================================

-- Filter by entity type (character, faction, location, etc.)
CREATE INDEX idx_lore_entities_entity_type ON lore_entities (entity_type);

-- Disclosure-based access control
CREATE INDEX idx_lore_entities_disclosure ON lore_entities (disclosure);

-- Faction filtering (sparse — only entities with faction set)
CREATE INDEX idx_lore_entities_faction ON lore_entities (faction) WHERE faction IS NOT NULL;

-- Tag-based filtering
CREATE INDEX idx_lore_entities_tags ON lore_entities USING GIN (tags);

-- Full-text search on name, summary, and full_description
CREATE INDEX idx_lore_entities_fulltext ON lore_entities USING GIN (
    to_tsvector('english', name || ' ' || COALESCE(summary, '') || ' ' || COALESCE(full_description, ''))
);

-- =============================================================================
-- INDEXES: lore_relationships
-- =============================================================================

-- Outbound edges from a source entity
CREATE INDEX idx_lore_relationships_source ON lore_relationships (source_entity_id);

-- Inbound edges to a target entity
CREATE INDEX idx_lore_relationships_target ON lore_relationships (target_entity_id);

-- Filter by relationship type
CREATE INDEX idx_lore_relationships_relationship ON lore_relationships (relationship);

-- =============================================================================
-- INDEXES: lore_timeline
-- =============================================================================

-- Chronological sorting
CREATE INDEX idx_lore_timeline_year ON lore_timeline (year);

-- Era-based grouping
CREATE INDEX idx_lore_timeline_era ON lore_timeline (era);

-- Manual sort order for display
CREATE INDEX idx_lore_timeline_sort_order ON lore_timeline (sort_order);

-- Tag-based filtering
CREATE INDEX idx_lore_timeline_tags ON lore_timeline USING GIN (tags);

-- Cross-reference to entity slugs
CREATE INDEX idx_lore_timeline_entities_involved ON lore_timeline USING GIN (entities_involved);

-- =============================================================================
-- INDEXES: lore_chapters
-- =============================================================================

-- POV character lookup
CREATE INDEX idx_lore_chapters_pov_character ON lore_chapters (pov_character) WHERE pov_character IS NOT NULL;

-- =============================================================================
-- INDEXES: writing_fragments
-- =============================================================================

-- Filter by fragment type (dialogue, description, etc.)
CREATE INDEX idx_writing_fragments_fragment_type ON writing_fragments (fragment_type);

-- Character voice retrieval (sparse — only fragments linked to a character)
CREATE INDEX idx_writing_fragments_character ON writing_fragments (character_id) WHERE character_id IS NOT NULL;

-- Tag-based filtering
CREATE INDEX idx_writing_fragments_tags ON writing_fragments USING GIN (tags);

-- =============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- =============================================================================

CREATE TRIGGER lore_entities_updated_at
    BEFORE UPDATE ON lore_entities
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER lore_timeline_updated_at
    BEFORE UPDATE ON lore_timeline
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER lore_chapters_updated_at
    BEFORE UPDATE ON lore_chapters
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);

COMMIT;
