#!/usr/bin/env node
/**
 * ASR Visual Studio — Core Rendering Engine
 *
 * Unified renderer that handles:
 *  - HTML template → PNG/JPEG/WebP via Puppeteer
 *  - Image compositing via Sharp
 *  - SVG generation → rasterization
 *
 * Usage:
 *   node renderer.js --template social_post_square --brand A --title "Hello World" --output ./output/
 *   node renderer.js --html ./custom.html --width 1280 --height 720 --output ./output/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Chrome Auto-Detection ────────────────────────────────────────────
// Finds system-installed Chrome/Chromium so Puppeteer doesn't need its
// own bundled download. Works on Windows, macOS, and Linux.
function findSystemChrome() {
  const candidates = [
    // Windows (common install paths)
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch { /* skip */ }
  }

  // Try `which` on Unix-like systems
  try {
    const found = execSync('which google-chrome || which chromium-browser || which chromium 2>/dev/null', { encoding: 'utf8' }).trim();
    if (found) return found;
  } catch { /* not found */ }

  return null; // Let Puppeteer fall back to its bundled version
}

// ── Brand Token Registry ─────────────────────────────────────────────
const BRAND_TOKENS = {
  A: {
    name: 'AI OS',
    fontPrimary: "'DM Sans', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    accentColor: '#00D492',
    bgColor: '#0A0A0A',
    bgGradient: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
    textColor: '#FFFFFF',
    textMuted: '#A0A0A0',
    borderColor: '#2A2A2A',
    effects: { glow: true, grain: false, vignette: false },
    googleFonts: ['DM+Sans:wght@400;500;700;800', 'JetBrains+Mono:wght@400;500;700']
  },
  B: {
    name: 'Bharatvarsh',
    fontPrimary: "'Bebas Neue', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    accentColor: '#F1C232',
    bgColor: '#0D0D0D',
    bgGradient: 'linear-gradient(180deg, #1a1510 0%, #0D0D0D 60%, #000000 100%)',
    textColor: '#E8E8E8',
    textMuted: '#D4C5A0',
    borderColor: '#3A3020',
    effects: { glow: false, grain: true, vignette: true, grainOpacity: 0.08, letterSpacing: '0.15em' },
    googleFonts: ['Bebas+Neue', 'JetBrains+Mono:wght@400;500;700']
  },
  C: {
    name: 'Portfolio',
    fontPrimary: "'Inter', sans-serif",
    fontMono: "'JetBrains Mono', monospace",
    accentColor: '#8b5cf6',
    secondaryAccent: '#f97316',
    bgColor: '#0F0F0F',
    bgGradient: 'linear-gradient(135deg, #0F0F0F 0%, #1a1a2e 100%)',
    textColor: '#FFFFFF',
    textMuted: '#B0B0B0',
    borderColor: '#2A2A3A',
    effects: { glow: true, grain: false, vignette: false },
    googleFonts: ['Inter:wght@400;500;600;700;800', 'JetBrains+Mono:wght@400;500;700']
  }
};

// ── Platform Dimension Presets ───────────────────────────────────────
const PRESETS = {
  youtube_thumbnail:    { width: 1280, height: 720,  label: 'YouTube Thumbnail' },
  instagram_feed:       { width: 1080, height: 1080, label: 'Instagram Feed' },
  instagram_story:      { width: 1080, height: 1920, label: 'Instagram Story' },
  linkedin_post:        { width: 1200, height: 628,  label: 'LinkedIn Post' },
  twitter_post:         { width: 1600, height: 900,  label: 'Twitter/X Post' },
  og_image:             { width: 1200, height: 630,  label: 'OG Image' },
  banner_wide:          { width: 1500, height: 500,  label: 'Banner Wide' },
  social_post_square:   { width: 1080, height: 1080, label: 'Social Post Square' },
  social_post_landscape:{ width: 1200, height: 628,  label: 'Social Post Landscape' },
  story:                { width: 1080, height: 1920, label: 'Story' },
  poster_a4:            { width: 2480, height: 3508, label: 'A4 Poster' },
  cover_art:            { width: 3000, height: 3000, label: 'Cover Art' }
};

// ── Google Fonts CSS Generator ───────────────────────────────────────
function generateFontImports(brandContext) {
  const tokens = BRAND_TOKENS[brandContext];
  if (!tokens) throw new Error(`Unknown brand context: ${brandContext}`);
  const families = tokens.googleFonts.map(f => `family=${f}`).join('&');
  return `@import url('https://fonts.googleapis.com/css2?${families}&display=swap');`;
}

// ── Grain/Texture SVG Generator ──────────────────────────────────────
function generateGrainSVG(opacity = 0.08) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" opacity="${opacity}"/>
    </svg>`;
}

// ── Vignette CSS Generator ───────────────────────────────────────────
function generateVignetteCSS() {
  return `
    .vignette::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%);
      pointer-events: none;
      z-index: 3;
    }`;
}

// ── Brand-Aware HTML Template Builder ────────────────────────────────
function buildBrandedHTML({ brandContext, width, height, title, subtitle, footerText, footerTag, bgImageUrl, bgOpacity, badgeText, customCSS, customBody }) {
  const tokens = BRAND_TOKENS[brandContext];
  const fontImports = generateFontImports(brandContext);

  const grainOverlay = tokens.effects.grain ? `
    <div style="position:absolute;inset:0;z-index:4;pointer-events:none;opacity:${tokens.effects.grainOpacity || 0.08};mix-blend-mode:overlay;">
      <svg width="100%" height="100%"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>
    </div>` : '';

  const vignetteCSS = tokens.effects.vignette ? generateVignetteCSS() : '';
  const glowCSS = tokens.effects.glow ? `
    .accent-glow { box-shadow: 0 0 30px ${tokens.accentColor}40, 0 0 60px ${tokens.accentColor}20; }
    .text-glow { text-shadow: 0 0 20px ${tokens.accentColor}60; }` : '';

  const letterSpacingCSS = tokens.effects.letterSpacing ? `
    .title { letter-spacing: ${tokens.effects.letterSpacing}; text-transform: uppercase; }` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  ${fontImports}
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    font-family: ${tokens.fontPrimary};
    background: ${tokens.bgGradient};
    color: ${tokens.textColor};
    position: relative;
  }
  .bg-image {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    opacity: ${bgOpacity || 0.4};
  }
  .overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg,
      rgba(10,10,10,0.3) 0%,
      rgba(10,10,10,0.7) 50%,
      rgba(10,10,10,0.95) 100%
    );
    z-index: 1;
  }
  .content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
    padding: ${Math.round(width * 0.05)}px;
  }
  .accent-bar {
    width: 80px;
    height: 4px;
    background: ${tokens.accentColor};
    margin-bottom: 24px;
    border-radius: 2px;
  }
  .title {
    font-size: ${Math.round(width * 0.048)}px;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 16px;
    max-width: ${Math.round(width * 0.85)}px;
  }
  .subtitle {
    font-size: ${Math.round(width * 0.022)}px;
    font-weight: 400;
    opacity: 0.85;
    line-height: 1.4;
    max-width: ${Math.round(width * 0.75)}px;
    margin-bottom: 32px;
    color: ${tokens.textMuted};
  }
  .badge {
    display: inline-block;
    padding: 6px 16px;
    background: ${tokens.accentColor};
    color: ${tokens.bgColor};
    font-size: ${Math.round(width * 0.014)}px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-radius: 4px;
    margin-bottom: 18px;
    width: fit-content;
  }
  .footer {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: ${Math.round(width * 0.014)}px;
    font-weight: 500;
    opacity: 0.7;
    font-family: ${tokens.fontMono};
  }
  .footer-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${tokens.accentColor};
  }
  .accent-text { color: ${tokens.accentColor}; }
  ${vignetteCSS}
  ${glowCSS}
  ${letterSpacingCSS}
  ${customCSS || ''}
</style>
</head>
<body class="${tokens.effects.vignette ? 'vignette' : ''}">
  ${bgImageUrl ? `<div class="bg-image" style="background-image: url('${bgImageUrl}');"></div>` : ''}
  <div class="overlay"></div>
  ${grainOverlay}
  ${customBody || `
  <div class="content">
    ${badgeText ? `<div class="badge">${badgeText}</div>` : '<div class="accent-bar"></div>'}
    <div class="title">${title || ''}</div>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    ${footerText ? `
    <div class="footer">
      <span>${footerText}</span>
      <div class="footer-dot"></div>
      <span>${footerTag || ''}</span>
    </div>` : ''}
  </div>`}
</body>
</html>`;
}

// ── Puppeteer Renderer ───────────────────────────────────────────────
async function renderWithPuppeteer(html, outputPath, { width, height, format = 'png', quality = 90, deviceScaleFactor = 2 }) {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.log('Installing puppeteer...');
    require('child_process').execSync('npm install puppeteer', { stdio: 'inherit' });
    puppeteer = require('puppeteer');
  }

  const launchOpts = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };
  const systemChrome = findSystemChrome();
  if (systemChrome) {
    launchOpts.executablePath = systemChrome;
    console.log(`  Using system Chrome: ${systemChrome}`);
  }

  const browser = await puppeteer.launch(launchOpts);

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 500)); // Extra settling time

    const screenshotOpts = { path: outputPath, type: format };
    if (format === 'jpeg') screenshotOpts.quality = quality;

    await page.screenshot(screenshotOpts);
    const stats = fs.statSync(outputPath);
    return { success: true, path: outputPath, size: stats.size, method: 'puppeteer' };
  } finally {
    await browser.close();
  }
}

// ── Sharp Compositor ─────────────────────────────────────────────────
async function compositeWithSharp(basePath, overlays, outputPath) {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('Installing sharp...');
    require('child_process').execSync('npm install sharp', { stdio: 'inherit' });
    sharp = require('sharp');
  }

  let pipeline = sharp(basePath);
  if (overlays && overlays.length > 0) {
    pipeline = pipeline.composite(overlays.map(o => ({
      input: o.input,
      top: o.top || 0,
      left: o.left || 0,
      gravity: o.gravity,
      blend: o.blend || 'over'
    })));
  }

  await pipeline.toFile(outputPath);
  const stats = fs.statSync(outputPath);
  return { success: true, path: outputPath, size: stats.size, method: 'sharp' };
}

// ── Render Log Generator ─────────────────────────────────────────────
function generateRenderLog({ brandContext, preset, dimensions, method, outputFiles, duration, customAssets }) {
  const tokens = BRAND_TOKENS[brandContext];
  const timestamp = new Date().toISOString();

  return `# Render Log

**Generated:** ${timestamp}
**Brand Context:** ${brandContext} — ${tokens.name}
**Preset:** ${preset || 'custom'}
**Dimensions:** ${dimensions.width}×${dimensions.height}
**Rendering Method:** ${method}
**Duration:** ${duration}ms

## Brand Tokens Applied
- Primary Font: ${tokens.fontPrimary}
- Mono Font: ${tokens.fontMono}
- Accent Color: ${tokens.accentColor}
- Background: ${tokens.bgColor}
- Effects: ${Object.entries(tokens.effects).filter(([,v]) => v === true).map(([k]) => k).join(', ') || 'none'}

## Output Files
${outputFiles.map(f => `- \`${f.name}\` — ${(f.size / 1024).toFixed(1)} KB`).join('\n')}

${customAssets ? `## Custom Assets Incorporated\n${customAssets.map(a => `- ${a}`).join('\n')}` : ''}
`;
}

// ── Exports ──────────────────────────────────────────────────────────
module.exports = {
  BRAND_TOKENS,
  PRESETS,
  findSystemChrome,
  generateFontImports,
  generateGrainSVG,
  buildBrandedHTML,
  renderWithPuppeteer,
  compositeWithSharp,
  generateRenderLog
};

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);
  console.log('ASR Visual Studio — Renderer Engine v1.0');
  console.log('Available presets:', Object.keys(PRESETS).join(', '));
  console.log('Available brand contexts: A (AI OS), B (Bharatvarsh), C (Portfolio)');
}
