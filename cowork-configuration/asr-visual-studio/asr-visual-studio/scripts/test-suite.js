#!/usr/bin/env node
/**
 * ASR Visual Studio — Full Test Suite
 *
 * Exercises all three rendering pipelines:
 *   Test 1: Static image (Bharatvarsh YouTube thumbnail — Context B)
 *   Test 2: Static image (AI OS social post — Context A)
 *   Test 3: Static image (Portfolio LinkedIn — Context C)
 *   Test 4: Social pack (5 platform variants from one brief)
 *   Test 5: Video — text reveal (8s, Context B)
 *   Test 6: Video — title card (5s, Context A)
 *   Test 7: MCP bridge routing validation
 *
 * Run: node scripts/test-suite.js
 * From: asr-visual-studio/ directory
 *
 * Prerequisites:
 *   - Google Chrome installed (auto-detected)
 *   - FFmpeg installed (for video tests)
 *   - npm install puppeteer (auto-installed on first run)
 */

const fs = require('fs');
const path = require('path');

// Resolve engine paths relative to this script
const engineDir = path.join(__dirname, '..', 'engine');
const { BRAND_TOKENS, PRESETS, findSystemChrome, buildBrandedHTML, renderWithPuppeteer, generateRenderLog } = require(path.join(engineDir, 'renderer.js'));
const { VIDEO_PRESETS, VIDEO_TYPES, checkFFmpeg, generateTextRevealFrames, assembleVideo, cleanupFrames } = require(path.join(engineDir, 'video-renderer.js'));
const { routeRender, buildMCPRenderParams } = require(path.join(engineDir, 'mcp-bridge.js'));

const OUTPUT_DIR = path.join(__dirname, '..', 'test-output');
const DIVIDER = '─'.repeat(60);

// ── Utility ──────────────────────────────────────────────────────────
function log(msg) { console.log(`  ${msg}`); }
function header(title) { console.log(`\n${DIVIDER}\n  ${title}\n${DIVIDER}`); }
function pass(msg) { console.log(`  ✓ ${msg}`); }
function fail(msg) { console.log(`  ✗ ${msg}`); }
function skip(msg) { console.log(`  ⊘ SKIPPED: ${msg}`); }

async function runTests() {
  const startTime = Date.now();
  const results = { passed: 0, failed: 0, skipped: 0 };
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // ── Pre-flight checks ──────────────────────────────────────────────
  header('PRE-FLIGHT CHECKS');

  const chrome = findSystemChrome();
  if (chrome) {
    pass(`Chrome found: ${chrome}`);
  } else {
    fail('Chrome NOT found — image/video rendering will fail');
    log('Set CHROME_PATH env variable or install Google Chrome');
  }

  const hasFFmpeg = checkFFmpeg();
  if (hasFFmpeg) {
    pass('FFmpeg found');
  } else {
    skip('FFmpeg not found — video tests will be skipped');
  }

  log(`Node.js: ${process.version}`);
  log(`Output directory: ${OUTPUT_DIR}`);
  log(`Brand contexts: ${Object.keys(BRAND_TOKENS).join(', ')}`);
  log(`Image presets: ${Object.keys(PRESETS).length}`);
  log(`Video presets: ${Object.keys(VIDEO_PRESETS).length}`);

  // ── Test 1: Bharatvarsh YouTube Thumbnail (Context B) ──────────────
  header('TEST 1: Bharatvarsh YouTube Thumbnail (Context B)');
  if (chrome) {
    try {
      const preset = PRESETS.youtube_thumbnail;
      const html = buildBrandedHTML({
        brandContext: 'B',
        width: preset.width,
        height: preset.height,
        title: 'THE NEXUS AWAITS',
        subtitle: 'Chapter 5 — The truth behind the Rathore dynasty',
        badgeText: 'NEW CHAPTER',
        footerText: '@welcometobharatvarsh',
        footerTag: 'BHARATVARSH',
        bgOpacity: 0.3
      });

      const outPath = path.join(OUTPUT_DIR, 'test1-bharatvarsh-thumbnail.png');
      const result = await renderWithPuppeteer(html, outPath, {
        width: preset.width, height: preset.height, format: 'png', deviceScaleFactor: 2
      });

      pass(`Rendered: ${path.basename(outPath)} (${(result.size / 1024).toFixed(1)} KB)`);
      results.passed++;
    } catch (e) {
      fail(`Render failed: ${e.message}`);
      results.failed++;
    }
  } else {
    skip('No Chrome — cannot render');
    results.skipped++;
  }

  // ── Test 2: AI OS Social Post (Context A) ──────────────────────────
  header('TEST 2: AI OS Social Post Square (Context A)');
  if (chrome) {
    try {
      const preset = PRESETS.social_post_square;
      const html = buildBrandedHTML({
        brandContext: 'A',
        width: preset.width,
        height: preset.height,
        title: 'Sprint 11: Visual Content Engine',
        subtitle: '64 tools, 12 modules, 39 tables — the OS grows',
        badgeText: 'AI OS',
        footerText: 'atharvasingh.dev',
        footerTag: 'v2.0',
        bgOpacity: 0.2
      });

      const outPath = path.join(OUTPUT_DIR, 'test2-aios-social-square.png');
      const result = await renderWithPuppeteer(html, outPath, {
        width: preset.width, height: preset.height, format: 'png', deviceScaleFactor: 2
      });

      pass(`Rendered: ${path.basename(outPath)} (${(result.size / 1024).toFixed(1)} KB)`);
      results.passed++;
    } catch (e) {
      fail(`Render failed: ${e.message}`);
      results.failed++;
    }
  } else {
    skip('No Chrome — cannot render');
    results.skipped++;
  }

  // ── Test 3: Portfolio LinkedIn Post (Context C) ────────────────────
  header('TEST 3: Portfolio LinkedIn Post (Context C)');
  if (chrome) {
    try {
      const preset = PRESETS.linkedin_post;
      const html = buildBrandedHTML({
        brandContext: 'C',
        width: preset.width,
        height: preset.height,
        title: 'Building AI Agents That Build Themselves',
        subtitle: 'How I designed a personal operating system powered by Claude',
        footerText: 'Atharva Singh',
        footerTag: 'AI & Cloud',
        bgOpacity: 0.2
      });

      const outPath = path.join(OUTPUT_DIR, 'test3-portfolio-linkedin.png');
      const result = await renderWithPuppeteer(html, outPath, {
        width: preset.width, height: preset.height, format: 'png', deviceScaleFactor: 2
      });

      pass(`Rendered: ${path.basename(outPath)} (${(result.size / 1024).toFixed(1)} KB)`);
      results.passed++;
    } catch (e) {
      fail(`Render failed: ${e.message}`);
      results.failed++;
    }
  } else {
    skip('No Chrome — cannot render');
    results.skipped++;
  }

  // ── Test 4: Social Pack (5 platform variants) ──────────────────────
  header('TEST 4: Social Pack — Bharatvarsh Book Launch (5 assets)');
  if (chrome) {
    const packDir = path.join(OUTPUT_DIR, 'test4-social-pack');
    fs.mkdirSync(packDir, { recursive: true });

    const targets = [
      { key: 'instagram_feed',  badge: 'NEW CHAPTER', footer: '@welcometobharatvarsh', tag: 'BHARATVARSH' },
      { key: 'instagram_story', badge: 'SWIPE UP',    footer: 'Read Chapter 5 →',       tag: '' },
      { key: 'linkedin_post',   badge: '',             footer: 'Atharva Singh',           tag: 'Author' },
      { key: 'twitter_post',    badge: 'OUT NOW',      footer: '',                        tag: '' },
      { key: 'youtube_thumbnail', badge: 'NEW VIDEO',  footer: '',                        tag: '' },
    ];

    let packPassed = 0;
    for (const target of targets) {
      try {
        const preset = PRESETS[target.key];
        const html = buildBrandedHTML({
          brandContext: 'B',
          width: preset.width, height: preset.height,
          title: 'THE NEXUS AWAITS',
          subtitle: 'A world rewritten. A truth buried.',
          badgeText: target.badge,
          footerText: target.footer,
          footerTag: target.tag,
          bgOpacity: 0.3
        });

        const outPath = path.join(packDir, `${target.key}.png`);
        const result = await renderWithPuppeteer(html, outPath, {
          width: preset.width, height: preset.height, format: 'png', deviceScaleFactor: 2
        });

        pass(`${target.key}: ${preset.width}×${preset.height} (${(result.size / 1024).toFixed(1)} KB)`);
        packPassed++;
      } catch (e) {
        fail(`${target.key}: ${e.message}`);
      }
    }

    // Generate pack preview HTML
    const previewHTML = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:Inter,sans-serif;background:#111;color:#fff;padding:40px}
h1{margin-bottom:30px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}
.card{background:#1a1a1a;border-radius:12px;overflow:hidden}.card img{width:100%;display:block}
.card-label{padding:12px 16px;font-size:14px;color:#aaa}</style></head>
<body><h1>Social Pack Preview — Bharatvarsh Book Launch</h1>
<div class="grid">${targets.map(t => `<div class="card"><img src="${t.key}.png"><div class="card-label">${PRESETS[t.key].label}</div></div>`).join('\n')}</div></body></html>`;
    fs.writeFileSync(path.join(packDir, 'pack-preview.html'), previewHTML);

    if (packPassed === targets.length) {
      pass(`All ${targets.length} pack assets rendered + preview HTML generated`);
      results.passed++;
    } else {
      fail(`${packPassed}/${targets.length} pack assets rendered`);
      results.failed++;
    }
  } else {
    skip('No Chrome — cannot render');
    results.skipped++;
  }

  // ── Test 5: Video — Text Reveal (Context B, 8s) ───────────────────
  header('TEST 5: Video — Text Reveal (Bharatvarsh, 8 seconds)');
  if (chrome && hasFFmpeg) {
    try {
      const videoDir = path.join(OUTPUT_DIR, 'test5-video');
      fs.mkdirSync(videoDir, { recursive: true });

      log('Generating frames (this takes 1-3 minutes)...');
      const framesDir = await generateTextRevealFrames({
        brandContext: 'B',
        title: 'BHARATVARSH',
        subtitle: 'A world rewritten. A truth buried.',
        width: 1920, height: 1080,
        fps: 30, duration: 8,
        outputDir: videoDir
      });

      log('Assembling MP4...');
      const outPath = path.join(videoDir, 'text-reveal.mp4');
      const result = assembleVideo(framesDir, outPath, { fps: 30 });
      cleanupFrames(framesDir);

      pass(`Video rendered: text-reveal.mp4 (${(result.size / 1024 / 1024).toFixed(1)} MB)`);
      results.passed++;
    } catch (e) {
      fail(`Video render failed: ${e.message}`);
      results.failed++;
    }
  } else {
    skip(chrome ? 'FFmpeg not available' : 'Chrome not available');
    results.skipped++;
  }

  // ── Test 6: Video — Title Card (Context A, 5s) ────────────────────
  header('TEST 6: Video — Title Card (AI OS, 5 seconds)');
  if (chrome && hasFFmpeg) {
    try {
      const videoDir = path.join(OUTPUT_DIR, 'test6-title-card');
      fs.mkdirSync(videoDir, { recursive: true });

      log('Generating frames...');
      const framesDir = await generateTextRevealFrames({
        brandContext: 'A',
        title: 'AI OPERATING SYSTEM',
        subtitle: 'Sprint 11 — Visual Content Engine',
        width: 1920, height: 1080,
        fps: 30, duration: 5,
        outputDir: videoDir
      });

      log('Assembling MP4...');
      const outPath = path.join(videoDir, 'title-card.mp4');
      const result = assembleVideo(framesDir, outPath, { fps: 30 });
      cleanupFrames(framesDir);

      pass(`Video rendered: title-card.mp4 (${(result.size / 1024 / 1024).toFixed(1)} MB)`);
      results.passed++;
    } catch (e) {
      fail(`Video render failed: ${e.message}`);
      results.failed++;
    }
  } else {
    skip(chrome ? 'FFmpeg not available' : 'Chrome not available');
    results.skipped++;
  }

  // ── Test 7: MCP Bridge Routing ─────────────────────────────────────
  header('TEST 7: MCP Bridge Routing Validation');
  try {
    const routeTests = [
      { label: 'Simple template → MCP',     input: { type: 'image', preset: 'social_post_square', hasCustomCSS: false, hasCustomBody: false, hasCustomAssets: false, complexity: 'simple' }, expect: 'mcp' },
      { label: 'Custom CSS → Local',         input: { type: 'image', preset: 'youtube_thumbnail', hasCustomCSS: true, hasCustomBody: false, hasCustomAssets: false, complexity: 'complex' }, expect: 'local' },
      { label: 'Video → Local',              input: { type: 'video' }, expect: 'local' },
      { label: 'AI generated → MCP',         input: { type: 'ai_generated' }, expect: 'mcp' },
      { label: 'With user assets → Local',   input: { type: 'image', preset: 'instagram_feed', hasCustomCSS: false, hasCustomBody: false, hasCustomAssets: true, complexity: 'simple' }, expect: 'local' },
      { label: 'No preset match → Local',    input: { type: 'image', preset: 'poster_a4', hasCustomCSS: false, hasCustomBody: false, hasCustomAssets: false, complexity: 'simple' }, expect: 'local' },
    ];

    let allPassed = true;
    for (const t of routeTests) {
      const result = routeRender(t.input);
      if (result.route === t.expect) {
        pass(`${t.label}: ${result.route} ← ${result.reason}`);
      } else {
        fail(`${t.label}: got ${result.route}, expected ${t.expect}`);
        allPassed = false;
      }
    }

    // Test MCP param generation
    const params = buildMCPRenderParams({ preset: 'youtube_thumbnail', brandContext: 'B', title: 'Test Title', subtitle: 'Test Sub' });
    if (params.tool === 'render_template' && params.params.brand_context === 'B') {
      pass('MCP param generation correct');
    } else {
      fail('MCP param generation incorrect');
      allPassed = false;
    }

    if (allPassed) results.passed++; else results.failed++;
  } catch (e) {
    fail(`Routing test error: ${e.message}`);
    results.failed++;
  }

  // ── Generate Render Log ────────────────────────────────────────────
  const totalDuration = Date.now() - startTime;
  const logContent = generateRenderLog({
    brandContext: 'B',
    preset: 'test-suite',
    dimensions: { width: 0, height: 0 },
    method: 'full-test-suite',
    outputFiles: fs.readdirSync(OUTPUT_DIR, { recursive: true })
      .filter(f => f.endsWith('.png') || f.endsWith('.mp4'))
      .map(f => {
        const fullPath = path.join(OUTPUT_DIR, f);
        try { return { name: f, size: fs.statSync(fullPath).size }; }
        catch { return { name: f, size: 0 }; }
      }),
    duration: totalDuration
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'render-log.md'), logContent);

  // ── Summary ────────────────────────────────────────────────────────
  header('TEST SUITE RESULTS');
  console.log(`  Passed:  ${results.passed}`);
  console.log(`  Failed:  ${results.failed}`);
  console.log(`  Skipped: ${results.skipped}`);
  console.log(`  Total:   ${results.passed + results.failed + results.skipped}`);
  console.log(`  Time:    ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`  Output:  ${OUTPUT_DIR}`);
  console.log(`\n  Open test-output/test4-social-pack/pack-preview.html in a browser`);
  console.log(`  to see all social pack assets in a grid.\n`);

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
