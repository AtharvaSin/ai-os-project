#!/usr/bin/env node
/**
 * Bharatvarsh News Post Renderer
 * Renders BVN-24x7 broadcast frame posts at 4:5 (1080×1350) for Twitter + Instagram
 *
 * Uses puppeteer-core from asr-visual-studio + system Chrome.
 *
 * Usage:
 *   node scripts/render_bhv_news.js --image /path/to/image.jpg --post-id BHV-20260418-001 --post-number 5
 *
 * Asset Naming Convention:
 *   Output directory: rendered/post-{N}/   (e.g. post-5/)
 *   Output files:     post-{N}-twitter.png, post-{N}-instagram.png, post-{N}-render-manifest.json
 *   --post-number: 1-indexed row position in content_calendar.csv (skipping empty rows)
 *   If --post-number is not supplied, falls back to using --post-id as the directory name.
 */

'use strict';

const path   = require('path');
const fs     = require('fs');

// ── Puppeteer-core (installed in scripts/node_modules) ───────────────
const puppeteer = require('puppeteer-core');

// ── System Chrome path (Windows) ─────────────────────────────────────
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// ── Paths ─────────────────────────────────────────────────────────────
const PROJECT_ROOT   = path.join(__dirname, '..');
const PIPELINE_ROOT  = path.join(PROJECT_ROOT, 'content-pipelines/bharatvarsh');
const RENDERED_ROOT  = path.join(PIPELINE_ROOT, 'rendered');

// ── Arg parser ────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const imagePath  = getArg('image');
const postId     = getArg('post-id') || 'BHV-20260418-001';
const postNumber = getArg('post-number');   // e.g. "5" → output dir becomes post-5/

// Canonical output directory name: post-N if --post-number given, otherwise raw postId
const outputDirName = postNumber ? `post-${postNumber}` : postId;

// Canonical output file prefix: post-N if --post-number given, otherwise raw postId
const filePrefix = postNumber ? `post-${postNumber}` : postId;

if (!imagePath) {
  console.error('ERROR: --image argument is required.');
  console.error('Usage: node scripts/render_bhv_news.js --image /path/to/image.jpg --post-id BHV-XXXXXXXX-XXX --post-number N');
  process.exit(1);
}

if (!fs.existsSync(imagePath)) {
  console.error(`ERROR: Image not found at: ${imagePath}`);
  process.exit(1);
}

// ── Platform definitions ──────────────────────────────────────────────
const PLATFORMS = [
  {
    name:             'twitter',
    width:            1080,
    height:           1350,
    templateFile:     path.join(PIPELINE_ROOT, 'templates/twitter/BHV-T-NEWS-TW.html'),
    outputFile:       `${filePrefix}-twitter.png`,
    chyronHeadline:   'PERMITS UP 340% THIS QUARTER',
    chyronSub:        'Dept. of Civic Harmony flags recurring patterns in approved permit spaces — Q3 2025',
  },
  {
    name:             'instagram',
    width:            1080,
    height:           1350,
    templateFile:     path.join(PIPELINE_ROOT, 'templates/instagram/BHV-T-NEWS-IG.html'),
    outputFile:       `${filePrefix}-instagram.png`,
    chyronHeadline:   'BASEMENT MEDITATION PERMITS UP 340%',
    chyronSub:        'Civic Harmony audit flags non-standard orientation, timing, and counting-apparatus patterns',
  },
];

// ── Image → base64 data URL ────────────────────────────────────────────
function imageToDataUrl(p) {
  const buf  = fs.readFileSync(p);
  const ext  = path.extname(p).slice(1).toLowerCase();
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
             : ext === 'png'                    ? 'image/png'
             : ext === 'webp'                   ? 'image/webp'
             : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// ── Render a single platform ──────────────────────────────────────────
async function renderPlatform(browser, platform, imageDataUrl) {
  console.log(`\n  Rendering ${platform.name} (${platform.width}×${platform.height})...`);

  if (!fs.existsSync(platform.templateFile)) {
    throw new Error(`Template not found: ${platform.templateFile}`);
  }

  let html = fs.readFileSync(platform.templateFile, 'utf8');

  // Inject variables
  html = html
    .replace(/__BG_IMAGE__/g,        imageDataUrl)
    .replace(/__CHYRON_HEADLINE__/g, platform.chyronHeadline)
    .replace(/__CHYRON_SUB__/g,      platform.chyronSub);

  const page = await browser.newPage();

  await page.setViewport({
    width:             platform.width,
    height:            platform.height,
    deviceScaleFactor: 1,
  });

  // setContent + networkidle0 ensures Google Fonts and all assets are loaded
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 45000 });

  // Extra settle time for font rendering
  await new Promise(r => setTimeout(r, 1200));

  // Output path
  const outputDir = path.join(RENDERED_ROOT, outputDirName);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, platform.outputFile);

  await page.screenshot({ path: outputPath, type: 'png' });
  await page.close();

  const stat = fs.statSync(outputPath);
  const kb   = Math.round(stat.size / 1024);
  console.log(`  ✅ ${platform.name}: ${platform.outputFile} (${kb} KB)`);

  return {
    channel:    platform.name,
    dimensions: `${platform.width}×${platform.height}`,
    file:       platform.outputFile,
    size_bytes: stat.size,
    size_kb:    kb,
  };
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('════════════════════════════════════════════════════════');
  console.log(`  Bharatvarsh Post Renderer — ${postId} → ${outputDirName}`);
  console.log('════════════════════════════════════════════════════════');
  console.log(`  Image:   ${imagePath}`);
  console.log(`  Aspect:  4:5 (1080×1350)`);
  console.log(`  Chrome:  ${CHROME_PATH}`);
  console.log('');

  // Convert image to base64 once, reuse for all platforms
  console.log('  Converting image to base64...');
  const imageDataUrl = imageToDataUrl(imagePath);
  console.log(`  Image encoded (${Math.round(imageDataUrl.length / 1024)} KB data URL).`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless:       true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--allow-file-access-from-files',
      '--font-render-hinting=none',
    ],
  });

  const renders = [];

  try {
    for (const platform of PLATFORMS) {
      const result = await renderPlatform(browser, platform, imageDataUrl);
      renders.push(result);
    }
  } finally {
    await browser.close();
  }

  // ── Write render manifest ──────────────────────────────────────────
  const outputDir = path.join(RENDERED_ROOT, outputDirName);
  const manifest  = {
    post_id:              postId,
    post_number:          postNumber ? parseInt(postNumber, 10) : null,
    rendered_at:          new Date().toISOString(),
    pillar:               'bharatsena',
    distillation_filter:  'living_without_religion',
    content_channel:      'news_article',
    topic:                'Basement Meditation Permits — Form R-17',
    aspect_ratio:         '4:5',
    style_overrides_applied: true,
    source_image:         path.basename(imagePath),
    renders,
  };

  const manifestPath = path.join(outputDir, `${filePrefix}-render-manifest.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n  📋 Manifest: ${manifestPath}`);

  // ── Summary ────────────────────────────────────────────────────────
  console.log('');
  console.log('════════════════════════════════════════════════════════');
  console.log('  RENDER COMPLETE');
  console.log('════════════════════════════════════════════════════════');
  renders.forEach(r => {
    console.log(`  ${r.channel.padEnd(12)} ${r.dimensions}  →  ${r.file}  (${r.size_kb} KB)`);
  });
  console.log(`  Output dir: ${outputDir}`);
  console.log('');
}

main().catch(err => {
  console.error('\nERROR:', err.message || err);
  process.exit(1);
});
