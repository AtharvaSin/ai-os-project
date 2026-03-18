-- Migration 016: Media Assets table for Visual Content Generation System
-- Tracks all generated and manually stored media across brand contexts.
-- Part of the media_gen.py MCP Gateway module.

CREATE TABLE IF NOT EXISTS media_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_context   VARCHAR(1) NOT NULL CHECK (brand_context IN ('A', 'B', 'C')),
    asset_type      VARCHAR(50) NOT NULL,  -- social, thumbnail, hero, illustration, concept, banner, template, video, animation, og_image, story
    source          VARCHAR(20) NOT NULL DEFAULT 'generated' CHECK (source IN ('generated', 'manual', 'template', 'edited')),
    model_used      VARCHAR(100),          -- imagen-4.0-fast-generate-001, gemini-3.1-flash-image-preview, etc.
    prompt_used     TEXT,                  -- The full enhanced prompt sent to the API
    original_prompt TEXT,                  -- The user's original prompt before brand injection
    content_type    VARCHAR(50),           -- Content category: social, thumbnail, hero, illustration, concept
    aspect_ratio    VARCHAR(20),           -- 1:1, 16:9, 9:16, 4:3, custom
    dimensions      VARCHAR(20),           -- e.g. "1080x1080", "1280x720"
    file_format     VARCHAR(10),           -- png, jpg, webp
    file_size_bytes INTEGER,
    drive_file_id   VARCHAR(255),
    drive_url       TEXT,
    drive_folder_id VARCHAR(255),
    template_name   VARCHAR(100),          -- For template-rendered assets: social_post_square, youtube_thumbnail, etc.
    domain_id       UUID REFERENCES life_domains(id) ON DELETE SET NULL,
    tags            TEXT[] DEFAULT '{}',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_media_assets_brand ON media_assets(brand_context);
CREATE INDEX idx_media_assets_type ON media_assets(asset_type);
CREATE INDEX idx_media_assets_source ON media_assets(source);
CREATE INDEX idx_media_assets_domain ON media_assets(domain_id);
CREATE INDEX idx_media_assets_tags ON media_assets USING GIN(tags);
CREATE INDEX idx_media_assets_created ON media_assets(created_at DESC);
CREATE INDEX idx_media_assets_content_type ON media_assets(content_type);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_media_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_media_assets_updated_at
    BEFORE UPDATE ON media_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_media_assets_updated_at();

-- Comment on table
COMMENT ON TABLE media_assets IS 'Tracks all generated and manually stored media assets across the three brand contexts (A: AI OS, B: Bharatvarsh, C: Portfolio).';
