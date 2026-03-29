#!/usr/bin/env node
/**
 * Bharatvarsh Post Renderer — Multi-Channel Sharp Compositor
 *
 * Renders branded composites for Instagram, Twitter, LinkedIn, and Facebook
 * from a single base image. Uses SVG overlays composited via Sharp.
 *
 * Usage:
 *   node render_post.js \
 *     --base-image "/path/to/raw.jpg" \
 *     --post-id "BHV-20260406-001" \
 *     --title "TEMPLE REPURPOSING DIRECTIVE" \
 *     --subtitle "The Lakshmanpur Mandir was redesignated..." \
 *     --badge "DIRECTIVE 1984-R/07 · DECLASSIFIED" \
 *     --footer-brand "BHARATVARSH" \
 *     --footer-url "welcometobharatvarsh.com" \
 *     --content-channel "declassified_report" \
 *     --platforms "instagram,twitter,linkedin,facebook" \
 *     --output-dir "./output/"
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ── Parse CLI args ──────────────────────────────────────────────────
function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '').replace(/-/g, '_');
    args[key] = argv[i + 1];
  }
  return args;
}

// ── Platform specs ──────────────────────────────────────────────────
const PLATFORMS = {
  instagram: { width: 1080, height: 1080, cropMode: 'square', borderSize: 26 },
  twitter:   { width: 1600, height: 900,  cropMode: 'landscape', borderSize: 0 },
  linkedin:  { width: 1200, height: 628,  cropMode: 'landscape', borderSize: 0 },
  facebook:  { width: 1200, height: 630,  cropMode: 'landscape', borderSize: 0 }
};

// ── Brand tokens (Context B — Bharatvarsh) ──────────────────────────
const BRAND = {
  accent: '#F1C232',
  obsidian: '#0A0D12',
  textPrimary: '#E8E8E8',
  textMuted: '#D4C5A0',
  textFaint: '#A09D95',
  paper: '#C3B49B',
  paperDark: 'rgba(100,85,60,0.4)',
  badgeBg: 'rgba(10,13,18,0.78)',
  badgeBorder: 'rgba(241,194,50,0.3)',
  grainOpacity: 0.06
};

// ── Content channel badge defaults ──────────────────────────────────
const CHANNEL_DEFAULTS = {
  declassified_report: {
    hasBorder: true,
    borderColor: BRAND.paper,
    badgeStyle: 'document'
  },
  graffiti_photo: {
    hasBorder: false,
    borderColor: null,
    badgeStyle: 'minimal'
  },
  news_article: {
    hasBorder: true,
    borderColor: '#0D1B2A',
    badgeStyle: 'broadcast'
  }
};

// ── SVG Helpers ─────────────────────────────────────────────────────

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function buildGradientSVG(w, h) {
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${BRAND.obsidian}" stop-opacity="0"/>
        <stop offset="45%" stop-color="${BRAND.obsidian}" stop-opacity="0"/>
        <stop offset="58%" stop-color="${BRAND.obsidian}" stop-opacity="0.35"/>
        <stop offset="72%" stop-color="${BRAND.obsidian}" stop-opacity="0.8"/>
        <stop offset="88%" stop-color="${BRAND.obsidian}" stop-opacity="0.97"/>
        <stop offset="100%" stop-color="${BRAND.obsidian}" stop-opacity="1"/>
      </linearGradient>
      <radialGradient id="v" cx="50%" cy="50%" r="72%">
        <stop offset="25%" stop-color="black" stop-opacity="0"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.45"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <rect width="${w}" height="${h}" fill="url(#v)"/>
  </svg>`);
}

function buildTextSVG(w, h, opts) {
  const { title, subtitle, badge, footerBrand, footerUrl, platform, contentChannel } = opts;
  const safeTitle = escapeXml(title || '');
  const safeSubtitle = escapeXml(subtitle || '');
  const safeBadge = escapeXml(badge || '');
  const safeFooterBrand = escapeXml(footerBrand || 'BHARATVARSH');
  const safeFooterUrl = escapeXml(footerUrl || 'welcometobharatvarsh.com');

  // Adaptive sizing based on platform
  let titleSize, subtitleSize, badgeSize, footerSize, leftPad, bottomPad;
  let showSubtitle = true;
  let showBadge = !!badge;

  switch (platform) {
    case 'twitter':
      titleSize = 64; subtitleSize = 0; badgeSize = 12; footerSize = 12;
      leftPad = 48; bottomPad = 52;
      showSubtitle = false; // Twitter: punchy title only
      break;
    case 'linkedin':
      titleSize = 42; subtitleSize = 14; badgeSize = 11; footerSize = 11;
      leftPad = 44; bottomPad = 40;
      break;
    case 'facebook':
      titleSize = 44; subtitleSize = 13; badgeSize = 11; footerSize = 11;
      leftPad = 44; bottomPad = 42;
      break;
    default: // instagram
      titleSize = 46; subtitleSize = 12.5; badgeSize = 10.5; footerSize = 11;
      leftPad = 36; bottomPad = 30;
  }

  // Title may need line breaks — split on words if too long
  const maxTitleChars = platform === 'twitter' ? 25 : 20;
  const titleWords = safeTitle.split(' ');
  let titleLines = [];
  let currentLine = '';
  for (const word of titleWords) {
    if ((currentLine + ' ' + word).trim().length > maxTitleChars && currentLine) {
      titleLines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = (currentLine + ' ' + word).trim();
    }
  }
  if (currentLine) titleLines.push(currentLine.trim());

  // Calculate positions from bottom
  const footerY = h - bottomPad;
  const subtitleBaseY = footerY - 42;
  const subtitleLineHeight = subtitleSize + 4;

  // Subtitle lines (max 2)
  const subtitleLines = showSubtitle && safeSubtitle ?
    [safeSubtitle.slice(0, 60), safeSubtitle.slice(60, 120)].filter(Boolean) : [];

  const titleBaseY = showSubtitle && subtitleLines.length ?
    subtitleBaseY - subtitleLines.length * subtitleLineHeight - 20 :
    footerY - 60;

  const titleLineHeight = titleSize + 4;
  const accentBarY = titleBaseY - titleLines.length * titleLineHeight - 12;

  let elements = [];

  // Badge (top-left)
  if (showBadge) {
    const badgeW = safeBadge.length * (badgeSize * 0.65) + 20;
    elements.push(`
      <rect x="${leftPad - 12}" y="20" width="${badgeW}" height="26" rx="0"
        fill="${BRAND.badgeBg}" stroke="${BRAND.badgeBorder}" stroke-width="1"/>
      <text x="${leftPad - 2}" y="38" font-family="monospace" font-size="${badgeSize}"
        font-weight="bold" fill="${BRAND.accent}" letter-spacing="1.2">${safeBadge}</text>
    `);
  }

  // Accent bar
  elements.push(`
    <rect x="${leftPad}" y="${accentBarY}" width="80" height="4" rx="2" fill="${BRAND.accent}"/>
  `);

  // Title (with shadow)
  titleLines.forEach((line, i) => {
    const y = titleBaseY - (titleLines.length - 1 - i) * titleLineHeight;
    elements.push(`
      <text x="${leftPad + 2}" y="${y + 2}" font-family="sans-serif" font-size="${titleSize}"
        font-weight="900" fill="rgba(0,0,0,0.7)" letter-spacing="5">${line}</text>
      <text x="${leftPad}" y="${y}" font-family="sans-serif" font-size="${titleSize}"
        font-weight="900" fill="${BRAND.textPrimary}" letter-spacing="5">${line}</text>
    `);
  });

  // Subtitle
  if (showSubtitle && subtitleLines.length) {
    subtitleLines.forEach((line, i) => {
      const y = subtitleBaseY - (subtitleLines.length - 1 - i) * subtitleLineHeight;
      elements.push(`
        <text x="${leftPad + 1}" y="${y + 1}" font-family="monospace" font-size="${subtitleSize}"
          fill="rgba(0,0,0,0.6)">${line}</text>
        <text x="${leftPad}" y="${y}" font-family="monospace" font-size="${subtitleSize}"
          fill="${BRAND.textMuted}" opacity="0.92">${line}</text>
      `);
    });
  }

  // Footer
  const brandTextWidth = safeFooterBrand.length * 8;
  elements.push(`
    <text x="${leftPad}" y="${footerY}" font-family="monospace" font-size="${footerSize}"
      font-weight="bold" fill="${BRAND.accent}" opacity="0.88">${safeFooterBrand}</text>
    <circle cx="${leftPad + brandTextWidth + 8}" cy="${footerY - 4}" r="2.5"
      fill="${BRAND.accent}" opacity="0.85"/>
    <text x="${leftPad + brandTextWidth + 18}" y="${footerY}" font-family="monospace"
      font-size="${footerSize - 1}" fill="${BRAND.textFaint}" opacity="0.7">${safeFooterUrl}</text>
  `);

  // LinkedIn: author attribution
  if (platform === 'linkedin') {
    elements.push(`
      <text x="${w - leftPad - 100}" y="${footerY}" font-family="monospace"
        font-size="10" fill="${BRAND.textFaint}" opacity="0.5" text-anchor="end">Atharva Singh</text>
    `);
  }

  // CTA watermark (bottom-right, very faint)
  elements.push(`
    <text x="${w - leftPad - 150}" y="${footerY}" font-family="monospace"
      font-size="9" fill="${BRAND.accent}" opacity="0.28" letter-spacing="0.3">${safeFooterUrl}</text>
  `);

  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${elements.join('\n')}
  </svg>`);
}

function buildPaperFrameSVG(w, h, borderSize) {
  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="${BRAND.paper}"/>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="${w}" height="${h}" filter="url(#noise)" opacity="0.06"/>
    <rect x="1" y="1" width="${w-2}" height="${h-2}" fill="none"
      stroke="rgba(100,85,60,0.4)" stroke-width="3"/>
    <rect x="4" y="4" width="${w-8}" height="${h-8}" fill="none"
      stroke="rgba(140,120,90,0.2)" stroke-width="1"/>
    <rect x="${borderSize-1}" y="${borderSize-1}" width="${w - borderSize*2 + 2}" height="${h - borderSize*2 + 2}"
      fill="none" stroke="rgba(50,40,28,0.5)" stroke-width="1"/>
  </svg>`);
}

// ── Core Render Function ────────────────────────────────────────────

async function renderForPlatform(baseImagePath, platform, spec, opts) {
  const { width, height, cropMode, borderSize } = spec;
  const meta = await sharp(baseImagePath).metadata();

  // Calculate art area (inside border if applicable)
  const artW = borderSize > 0 ? width - borderSize * 2 : width;
  const artH = borderSize > 0 ? height - borderSize * 2 : height;

  // Crop and resize base image
  let cropParams;
  if (cropMode === 'square') {
    const cropSize = Math.min(meta.width, meta.height);
    const topOffset = meta.height > meta.width ?
      Math.round((meta.height - cropSize) * 0.12) : 0;
    const leftOffset = meta.width > meta.height ?
      Math.round((meta.width - cropSize) / 2) : 0;
    cropParams = { left: leftOffset, top: topOffset, width: cropSize, height: cropSize };
  } else {
    // Landscape: take full width, crop height from center-top
    const targetRatio = artW / artH;
    const sourceRatio = meta.width / meta.height;
    let cropW, cropH, cropTop, cropLeft;
    if (sourceRatio > targetRatio) {
      cropH = meta.height;
      cropW = Math.round(cropH * targetRatio);
      cropTop = 0;
      cropLeft = Math.round((meta.width - cropW) / 2);
    } else {
      cropW = meta.width;
      cropH = Math.round(cropW / targetRatio);
      cropTop = Math.round((meta.height - cropH) * 0.2); // bias upward
      cropLeft = 0;
    }
    cropParams = { left: cropLeft, top: cropTop, width: cropW, height: cropH };
  }

  const artBuf = await sharp(baseImagePath)
    .extract(cropParams)
    .resize(artW, artH)
    .toBuffer();

  // Build overlays at art dimensions
  const gradientSVG = buildGradientSVG(artW, artH);
  const textSVG = buildTextSVG(artW, artH, { ...opts, platform });

  // Composite art + gradient + text
  const artComposite = await sharp(artBuf)
    .composite([
      { input: gradientSVG, blend: 'over' },
      { input: textSVG, blend: 'over' }
    ])
    .png()
    .toBuffer();

  // If border, wrap in paper frame
  if (borderSize > 0) {
    const frameSVG = buildPaperFrameSVG(width, height, borderSize);
    const frameBase = await sharp(frameSVG).png().toBuffer();

    return sharp(frameBase)
      .composite([
        { input: artComposite, top: borderSize, left: borderSize, blend: 'over' }
      ])
      .png()
      .toBuffer();
  }

  return artComposite;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  const baseImage = args.base_image;           // default image for all platforms
  const postId = args.post_id || 'BHV-UNKNOWN';
  const title = args.title || 'UNTITLED';
  const subtitle = args.subtitle || '';
  const badge = args.badge || '';
  const footerBrand = args.footer_brand || 'BHARATVARSH';
  const footerUrl = args.footer_url || 'welcometobharatvarsh.com';
  const contentChannel = args.content_channel || 'declassified_report';
  const platforms = (args.platforms || 'instagram').split(',').map(p => p.trim());
  const outputDir = args.output_dir || './output';

  // Per-platform image overrides: --image-instagram "/path" --image-twitter "/path"
  const platformImages = {};
  for (const p of platforms) {
    const override = args[`image_${p}`];
    if (override && fs.existsSync(override)) {
      platformImages[p] = override;
      console.log(`  Using platform-specific image for ${p}: ${override}`);
    }
  }

  if (!baseImage || !fs.existsSync(baseImage)) {
    // Check if ALL platforms have overrides — then base image isn't needed
    const allOverridden = platforms.every(p => platformImages[p]);
    if (!allOverridden) {
      console.error(`Error: Base image not found: ${baseImage}`);
      process.exit(1);
    }
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const opts = { title, subtitle, badge, footerBrand, footerUrl, contentChannel };
  const results = {};

  for (const platform of platforms) {
    const spec = PLATFORMS[platform];
    if (!spec) {
      console.warn(`  ⚠ Unknown platform: ${platform}, skipping`);
      continue;
    }

    const imageForPlatform = platformImages[platform] || baseImage;
    console.log(`Rendering ${platform} (${spec.width}×${spec.height}) from ${path.basename(imageForPlatform)}...`);
    const buf = await renderForPlatform(imageForPlatform, platform, spec, opts);

    const outputPath = path.join(outputDir, `${postId}_${platform}.png`);
    await sharp(buf).png().toFile(outputPath);

    const stats = fs.statSync(outputPath);
    results[platform] = {
      path: outputPath,
      width: spec.width,
      height: spec.height,
      sizeKB: Math.round(stats.size / 1024)
    };
    console.log(`  ✓ ${platform}: ${spec.width}×${spec.height} · ${results[platform].sizeKB} KB`);
  }

  // Write render log
  const logPath = path.join(outputDir, 'render_log.md');
  const logContent = `# Render Log — ${postId}

Generated: ${new Date().toISOString()}
Content Channel: ${contentChannel}

## Renders

${Object.entries(results).map(([p, r]) =>
  `- **${p}**: ${r.width}×${r.height} · ${r.sizeKB} KB`
).join('\n')}

## Parameters

- Title: ${title}
- Subtitle: ${subtitle}
- Badge: ${badge}
- Footer: ${footerBrand} · ${footerUrl}
`;

  fs.writeFileSync(logPath, logContent);
  console.log(`\n✓ Render log: ${logPath}`);

  // Output JSON summary for programmatic use
  const summary = { postId, contentChannel, platforms: results };
  const summaryPath = path.join(outputDir, 'render_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✓ Summary: ${summaryPath}`);
}

main().catch(e => {
  console.error('Render failed:', e.message);
  process.exit(1);
});
