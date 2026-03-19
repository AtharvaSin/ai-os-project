#!/usr/bin/env node
/**
 * ASR Visual Studio — MCP Bridge
 *
 * Hybrid layer that decides whether to render locally or delegate
 * to the AI OS MCP Gateway (render_template, generate_image, store_asset).
 *
 * Decision logic:
 *   - Custom layouts, complex compositions, video → LOCAL (Puppeteer/FFmpeg)
 *   - Simple branded templates that match Gateway presets → MCP (render_template)
 *   - AI-generated imagery → MCP (generate_image via Gemini)
 *   - Asset cataloging after local render → MCP (store_asset)
 *
 * This module doesn't call MCP directly — it generates the MCP tool call
 * parameters so the skill can invoke them through Claude's tool system.
 */

const { PRESETS, BRAND_TOKENS } = require('./renderer.js');

// ── MCP Gateway Template Mapping ─────────────────────────────────────
// Maps local presets to MCP Gateway's render_template names
const MCP_TEMPLATE_MAP = {
  social_post_square:    'social_post_square',
  social_post_landscape: 'social_post_landscape',
  youtube_thumbnail:     'youtube_thumbnail',
  banner_wide:           'banner_wide',
  story:                 'story',
  og_image:              'og_image'
};

// ── Route Decision ───────────────────────────────────────────────────
function routeRender(request) {
  const {
    type,           // 'image' | 'video' | 'social_pack' | 'ai_generated'
    preset,         // PRESETS key
    hasCustomCSS,   // boolean
    hasCustomBody,  // boolean
    hasCustomAssets, // boolean (user-provided images)
    needsDriveUpload, // boolean
    complexity      // 'simple' | 'moderate' | 'complex'
  } = request;

  // AI-generated images always go to MCP
  if (type === 'ai_generated') {
    return { route: 'mcp', tool: 'generate_image', reason: 'AI image generation requires Gemini API via MCP Gateway' };
  }

  // Video always renders locally
  if (type === 'video') {
    return { route: 'local', reason: 'Video rendering requires local FFmpeg/Puppeteer pipeline' };
  }

  // Complex custom layouts render locally
  if (hasCustomCSS || hasCustomBody || complexity === 'complex') {
    return { route: 'local', reason: 'Custom layout requires local Puppeteer rendering' };
  }

  // Simple branded templates with a matching MCP template → MCP (faster, auto-uploads to Drive)
  if (type === 'image' && preset && MCP_TEMPLATE_MAP[preset] && !hasCustomAssets && complexity === 'simple') {
    return {
      route: 'mcp',
      tool: 'render_template',
      template: MCP_TEMPLATE_MAP[preset],
      reason: 'Simple branded template matches MCP Gateway preset — faster rendering + auto Drive upload'
    };
  }

  // Everything else renders locally
  return { route: 'local', reason: 'Default to local rendering for full control' };
}

// ── Build MCP render_template Parameters ─────────────────────────────
function buildMCPRenderParams({ preset, brandContext, title, subtitle, footerText, footerTag, bgImageUrl, bgOpacity, badgeText, domain, tags }) {
  return {
    tool: 'render_template',
    params: {
      template_name: MCP_TEMPLATE_MAP[preset] || preset,
      title: title,
      subtitle: subtitle || '',
      brand_context: brandContext,
      footer_text: footerText || null,
      footer_tag: footerTag || null,
      bg_image_url: bgImageUrl || '',
      bg_opacity: String(bgOpacity || '0.4'),
      badge_text: badgeText || '',
      domain: domain || null,
      tags: tags || null
    }
  };
}

// ── Build MCP generate_image Parameters ──────────────────────────────
function buildMCPGenerateParams({ prompt, brandContext, contentType, aspectRatio, domain, tags }) {
  return {
    tool: 'generate_image',
    params: {
      prompt: prompt,
      brand_context: brandContext,
      content_type: contentType || 'social',
      aspect_ratio: aspectRatio || '1:1',
      domain: domain || null,
      tags: tags || null
    }
  };
}

// ── Build MCP store_asset Parameters (for cataloging local renders) ──
function buildMCPStoreParams({ driveFileId, brandContext, assetType, description, fileFormat, dimensions, domain, tags }) {
  return {
    tool: 'store_asset',
    params: {
      drive_file_id: driveFileId,
      brand_context: brandContext,
      asset_type: assetType || 'social',
      description: description || '',
      file_format: fileFormat || 'png',
      dimensions: dimensions || null,
      domain: domain || null,
      tags: tags || null
    }
  };
}

// ── Exports ──────────────────────────────────────────────────────────
module.exports = {
  MCP_TEMPLATE_MAP,
  routeRender,
  buildMCPRenderParams,
  buildMCPGenerateParams,
  buildMCPStoreParams
};
