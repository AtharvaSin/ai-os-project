#!/usr/bin/env node
/**
 * Bharatvarsh Content Operations — Post Renderer
 *
 * Reads a calendar row by post_id, selects the correct template per channel,
 * fills slot data (background image, text content), renders via Puppeteer,
 * and outputs channel-ready images to rendered/{post_id}/.
 *
 * Usage:
 *   node render-post.js <post_id>                    # Render all channels for a post
 *   node render-post.js <post_id> --channel instagram # Render one channel only
 *   node render-post.js <post_id> --template BHV-T-QUOTE --channel twitter  # Override template
 *   node render-post.js --list                        # List all calendar rows
 *   node render-post.js --preview <template> --channel instagram  # Preview a template with defaults
 *   node render-post.js --dry-run <post_id>                      # Validate pipeline, output filled HTML (no browser needed)
 *   node render-post.js --validate                                # Run full pipeline validation on all posts
 *
 * Requires: puppeteer (auto-installs if missing) — except --dry-run and --validate which need no browser.
 */

const fs = require('fs');
const path = require('path');

// ─── Paths ──────────────────────────────────────────────────────────────────
const CONTENT_OPS = path.resolve(__dirname);
const CALENDAR_PATH = path.join(CONTENT_OPS, 'calendar', 'content_calendar.csv');
const TEMPLATES_DIR = path.join(CONTENT_OPS, 'templates');
const REGISTRY_PATH = path.join(CONTENT_OPS, 'templates', 'template-registry.json');
const ASSETS_DIR = path.join(CONTENT_OPS, 'assets');
const RENDERED_DIR = path.join(CONTENT_OPS, 'rendered');
const PROMPTS_DIR = path.join(CONTENT_OPS, 'prompts');
const STYLE_OVERRIDES_PATH = path.join(CONTENT_OPS, 'calendar', 'post_style_overrides.json');
const ATMOSPHERIC_CSS_PATH = path.join(CONTENT_OPS, 'templates', 'shared', 'atmospheric-effects.css');

// ─── CSV Parser (lightweight, no dependency) ────────────────────────────────
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── Style Overrides ────────────────────────────────────────────────────────
function loadStyleOverrides(postId) {
  try {
    const data = JSON.parse(fs.readFileSync(STYLE_OVERRIDES_PATH, 'utf-8'));
    const entry = (data.overrides || []).find(o => o.post_id === postId);
    return entry || null;
  } catch {
    return null;
  }
}

function buildOverrideCSSVars(overrides) {
  if (!overrides) return '';
  const vars = [];
  if (overrides.accent_color_override) vars.push(`--accent-override: ${overrides.accent_color_override}`);
  if (overrides.overlay_opacity != null) vars.push(`--overlay-opacity: ${overrides.overlay_opacity}`);
  if (overrides.grid_opacity != null) vars.push(`--grid-opacity: ${overrides.grid_opacity}`);
  if (overrides.grain_opacity != null) vars.push(`--grain-opacity: ${overrides.grain_opacity}`);
  if (overrides.stamp_rotation != null) vars.push(`--stamp-rotation: ${overrides.stamp_rotation}deg`);
  return vars.length > 0 ? `:root { ${vars.map(v => v + ';').join(' ')} }` : '';
}

// ─── Template Selection ─────────────────────────────────────────────────────
function loadRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
}

function selectTemplate(registry, pillar, channel, overrideTemplate) {
  const templateId = overrideTemplate || registry.pillar_to_template_default[pillar];
  if (!templateId) {
    throw new Error(`No template mapping for pillar "${pillar}". Available: ${Object.keys(registry.pillar_to_template_default).join(', ')}`);
  }
  const template = registry.templates[templateId];
  if (!template) {
    throw new Error(`Template "${templateId}" not found in registry. Available: ${Object.keys(registry.templates).join(', ')}`);
  }
  const variant = template.variants[channel];
  if (!variant) {
    throw new Error(`No ${channel} variant for template "${templateId}". Available: ${Object.keys(template.variants).join(', ')}`);
  }
  return { templateId, template, variant };
}

// ─── Slot Data Extraction ───────────────────────────────────────────────────
/**
 * Extract template slot data from a calendar row.
 * @param {object} calendarRow
 * @param {string} templateId
 * @param {string|null} [backgroundImagePath] - Optional override for the background image path.
 *   When provided, this file is used directly instead of searching for final.* in the asset dir.
 */
function extractSlotData(calendarRow, templateId, backgroundImagePath = null) {
  const slots = {};

  // Background image: use override path if provided, otherwise search post asset folder
  let imagePath = backgroundImagePath;
  if (!imagePath) {
    const postAssetDir = path.join(ASSETS_DIR, calendarRow.post_id);
    const possibleImages = ['final.png', 'final.jpg', 'final.webp', 'raw_v1.png', 'raw_v1.jpg'];
    for (const img of possibleImages) {
      const candidate = path.join(postAssetDir, img);
      if (fs.existsSync(candidate)) {
        imagePath = candidate;
        break;
      }
    }
  }

  if (imagePath && fs.existsSync(imagePath)) {
    const buf = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).slice(1).replace('jpg', 'jpeg');
    slots.backgroundImage = `data:image/${ext};base64,${buf.toString('base64')}`;
  }

  // Template-specific slot mapping
  switch (templateId) {
    case 'BHV-T-QUOTE':
      slots.quoteText = calendarRow.hook || calendarRow.caption_text || '';
      slots.attribution = '— BHARATVARSH';
      slots.showClassified = calendarRow.classified_status === 'declassified' ? 'true' : 'false';
      break;

    case 'BHV-T-CHAR':
      slots.characterPortrait = slots.backgroundImage || '';
      slots.characterName = extractCharacterName(calendarRow.topic) || 'CHARACTER';
      slots.tagline = calendarRow.hook || '';
      slots.factionColor = lookupFactionColor(calendarRow) || '#F1C232';
      // Clear backgroundImage since portrait goes in a different slot
      delete slots.backgroundImage;
      break;

    case 'BHV-T-LORE':
      slots.headline = extractHeadline(calendarRow.topic) || 'INTEL BRIEF';
      slots.bodySnippet = calendarRow.hook || calendarRow.caption_text || '';
      slots.classifiedStamp = calendarRow.classified_status === 'declassified' ? 'true' : 'false';
      break;

    case 'BHV-T-CTA':
      slots.ctaHeadline = calendarRow.hook || calendarRow.topic || '';
      slots.ctaButtonText = getCTAButtonText(calendarRow.cta_type);
      slots.url = calendarRow.cta_link || 'welcometobharatvarsh.com';
      break;

    case 'BHV-T-BTS':
      slots.headline = calendarRow.topic || 'BEHIND THE BUILD';
      slots.bodyText = calendarRow.caption_text || calendarRow.hook || '';
      break;
  }

  return slots;
}

function extractCharacterName(topic) {
  const names = ['Kahaan', 'Rudra', 'Pratap', 'Hana', 'Arshi', 'Surya'];
  for (const name of names) {
    if (topic.toLowerCase().includes(name.toLowerCase())) return name.toUpperCase();
  }
  return null;
}

function extractHeadline(topic) {
  // Pull the main noun phrase: "The Mesh — what it sees" → "THE MESH"
  const dashIdx = topic.indexOf('—');
  if (dashIdx > 0) return topic.substring(0, dashIdx).trim().toUpperCase();
  return topic.toUpperCase();
}

function lookupFactionColor(row) {
  const topic = (row.topic + ' ' + row.lore_refs).toLowerCase();
  if (topic.includes('kahaan') || topic.includes('bharatsena')) return '#0B2742';
  if (topic.includes('rudra') || topic.includes('trident')) return '#718096';
  if (topic.includes('mesh')) return '#8B5CF6';
  if (topic.includes('akakpen') || topic.includes('resistance')) return '#DC2626';
  if (topic.includes('hana')) return '#C9DBEE';
  if (topic.includes('surya') || topic.includes('guhyakas')) return '#06B6D4';
  return '#F1C232'; // Default mustard
}

function getCTAButtonText(ctaType) {
  const map = {
    'website': 'ENTER BHARATVARSH',
    'purchase': 'GET THE NOVEL',
    'lead_magnet': 'DOWNLOAD DOSSIER',
    'forum': 'JOIN THE DISCUSSION',
    'bhoomi': 'ASK BHOOMI',
    'none': ''
  };
  return map[ctaType] || 'LEARN MORE';
}

// ─── Puppeteer Rendering ────────────────────────────────────────────────────
async function ensurePuppeteer() {
  try {
    return require('puppeteer');
  } catch {
    console.log('📦 Installing puppeteer (first run)...');
    const { execSync } = require('child_process');
    execSync('npm install puppeteer --save', { cwd: CONTENT_OPS, stdio: 'inherit' });
    return require('puppeteer');
  }
}

async function renderTemplate(templateFilePath, slots, dimensions, outputPath, styleOverrides) {
  const puppeteer = await ensurePuppeteer();

  // Read the template HTML
  let html = fs.readFileSync(templateFilePath, 'utf-8');

  // Build URL params for slot injection
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(slots)) {
    if (value) params.set(key, value);
  }

  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: dimensions.width,
      height: dimensions.height,
      deviceScaleFactor: 2
    });

    // Load the template HTML as a data URL with params
    // We'll inject the HTML directly and then run the param injection
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    // Inject atmospheric-effects.css for overlay classes
    if (fs.existsSync(ATMOSPHERIC_CSS_PATH)) {
      const atmosphericCSS = fs.readFileSync(ATMOSPHERIC_CSS_PATH, 'utf-8');
      await page.addStyleTag({ content: atmosphericCSS });
    }

    // Inject CSS custom property overrides from style overrides
    if (styleOverrides) {
      const cssVars = buildOverrideCSSVars(styleOverrides);
      if (cssVars) await page.addStyleTag({ content: cssVars });
    }

    // Inject style override DOM elements (corner label, badge, stamp, effects)
    if (styleOverrides) {
      await page.evaluate((ov) => {
        const container = document.querySelector('.template-container') || document.body;

        // Corner label
        if (ov.corner_label) {
          const el = document.createElement('div');
          el.className = 'corner-label';
          el.textContent = ov.corner_label;
          container.appendChild(el);
        }

        // Classification badge
        if (ov.badge_text) {
          const el = document.createElement('div');
          el.className = `classification-badge ${ov.badge_style || 'default'}`;
          el.textContent = ov.badge_text;
          container.appendChild(el);
        }

        // Stamp text
        if (ov.stamp_text) {
          const el = document.createElement('div');
          el.className = 'stamp-text';
          el.textContent = ov.stamp_text;
          container.appendChild(el);
        }

        // Vignette
        if (ov.vignette_intensity) {
          const el = document.createElement('div');
          el.className = `vignette-${ov.vignette_intensity}`;
          el.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;';
          container.appendChild(el);
        }

        // Scanline effect
        if (ov.scanline_effect) {
          const el = document.createElement('div');
          el.className = 'scanline-overlay';
          el.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:4;';
          container.appendChild(el);
        }

        // Hex grid
        if (ov.hex_grid) {
          const el = document.createElement('div');
          el.className = 'hex-grid';
          el.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:4;';
          container.appendChild(el);
        }

        // Data stream
        if (ov.data_stream) {
          const el = document.createElement('div');
          el.className = 'data-stream';
          el.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:4;';
          container.appendChild(el);
        }

        // Text alignment
        if (ov.text_alignment) {
          const textEls = container.querySelectorAll('[id*="text"], [id*="Text"], [id*="headline"], [id*="Headline"], [id*="snippet"], [id*="Snippet"]');
          textEls.forEach(el => { el.style.textAlign = ov.text_alignment; });
        }
      }, styleOverrides);
    }

    // Inject slot data via JavaScript (same logic as URL params but direct)
    await page.evaluate((slotData) => {
      // Background image
      const bgEl = document.getElementById('bgImage');
      if (bgEl && slotData.backgroundImage) {
        bgEl.style.backgroundImage = `url(${slotData.backgroundImage})`;
      }

      // Portrait image (character template)
      const portraitEl = document.getElementById('portraitImage');
      if (portraitEl && slotData.characterPortrait) {
        portraitEl.style.backgroundImage = `url(${slotData.characterPortrait})`;
      }

      // Text slots — match by ID
      const textSlots = {
        'quoteText': slotData.quoteText,
        'attribution': slotData.attribution,
        'characterName': slotData.characterName,
        'tagline': slotData.tagline,
        'headline': slotData.headline,
        'bodySnippet': slotData.bodySnippet,
        'bodyText': slotData.bodyText,
        'ctaHeadline': slotData.ctaHeadline,
        'ctaButtonText': slotData.ctaButtonText,
        'url': slotData.url || slotData.displayUrl
      };

      for (const [id, value] of Object.entries(textSlots)) {
        const el = document.getElementById(id);
        if (el && value) el.textContent = value;
      }

      // Classified/declassified stamp
      const stamp = document.getElementById('stamp');
      if (stamp && slotData.classifiedStamp === 'false') {
        stamp.style.display = 'none';
      }

      // Watermark
      const watermark = document.getElementById('watermark');
      if (watermark && slotData.showClassified === 'false') {
        watermark.style.display = 'none';
      }

      // Faction color
      if (slotData.factionColor) {
        document.documentElement.style.setProperty('--faction-color', slotData.factionColor);
        const factionLine = document.getElementById('factionLine');
        if (factionLine) factionLine.style.background = slotData.factionColor;
      }
    }, slots);

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 500)); // settle time

    // Screenshot
    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: { x: 0, y: 0, width: dimensions.width, height: dimensions.height }
    });

    const stats = fs.statSync(outputPath);
    return { success: true, path: outputPath, size: stats.size };
  } finally {
    await browser.close();
  }
}

// ─── Dry-Run Rendering (no browser needed) ─────────────────────────────────
function dryRenderTemplate(templateFilePath, slots, dimensions, outputPath, styleOverrides) {
  let html = fs.readFileSync(templateFilePath, 'utf-8');

  // Inject atmospheric CSS
  if (fs.existsSync(ATMOSPHERIC_CSS_PATH)) {
    const atmosphericCSS = fs.readFileSync(ATMOSPHERIC_CSS_PATH, 'utf-8');
    html = html.replace('</head>', `<style>${atmosphericCSS}</style>\n</head>`);
  }

  // Inject CSS custom property overrides
  if (styleOverrides) {
    const cssVars = buildOverrideCSSVars(styleOverrides);
    if (cssVars) html = html.replace('</head>', `<style>${cssVars}</style>\n</head>`);
  }

  // Inject slot data directly into the HTML by replacing placeholder content
  // This produces a "filled" HTML file that can be opened in any browser for visual verification
  const slotInjectionScript = `
<script>
(function() {
  const slotData = ${JSON.stringify(slots)};

  // Background image
  const bgEl = document.getElementById('bgImage');
  if (bgEl && slotData.backgroundImage) {
    bgEl.style.backgroundImage = 'url(' + slotData.backgroundImage + ')';
  }

  // Portrait image
  const portraitEl = document.getElementById('portraitImage');
  if (portraitEl && slotData.characterPortrait) {
    portraitEl.style.backgroundImage = 'url(' + slotData.characterPortrait + ')';
  }

  // Text slots
  const textSlots = {
    'quoteText': slotData.quoteText,
    'attribution': slotData.attribution,
    'characterName': slotData.characterName,
    'tagline': slotData.tagline,
    'headline': slotData.headline,
    'bodySnippet': slotData.bodySnippet,
    'bodyText': slotData.bodyText,
    'ctaHeadline': slotData.ctaHeadline,
    'ctaButtonText': slotData.ctaButtonText,
    'url': slotData.url || slotData.displayUrl
  };

  for (const [id, value] of Object.entries(textSlots)) {
    const el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }

  // Stamps and watermarks
  const stamp = document.getElementById('stamp');
  if (stamp && slotData.classifiedStamp === 'false') stamp.style.display = 'none';
  const watermark = document.getElementById('watermark');
  if (watermark && slotData.showClassified === 'false') watermark.style.display = 'none';

  // Faction color
  if (slotData.factionColor) {
    document.documentElement.style.setProperty('--faction-color', slotData.factionColor);
    const factionLine = document.getElementById('factionLine');
    if (factionLine) factionLine.style.background = slotData.factionColor;
  }
})();
</script>`;

  // Inject the script before </body>
  html = html.replace('</body>', slotInjectionScript + '\n</body>');

  // Inject style override DOM elements for dry-run
  if (styleOverrides) {
    const overrideScript = `
<script>
(function() {
  var ov = ${JSON.stringify(styleOverrides)};
  var c = document.querySelector('.template-container') || document.body;
  if (ov.corner_label) { var el = document.createElement('div'); el.className = 'corner-label'; el.textContent = ov.corner_label; c.appendChild(el); }
  if (ov.badge_text) { var el = document.createElement('div'); el.className = 'classification-badge ' + (ov.badge_style || 'default'); el.textContent = ov.badge_text; c.appendChild(el); }
  if (ov.stamp_text) { var el = document.createElement('div'); el.className = 'stamp-text'; el.textContent = ov.stamp_text; c.appendChild(el); }
  if (ov.vignette_intensity) { var el = document.createElement('div'); el.className = 'vignette-' + ov.vignette_intensity; el.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;'; c.appendChild(el); }
  if (ov.scanline_effect) { var el = document.createElement('div'); el.className = 'scanline-overlay'; el.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:4;'; c.appendChild(el); }
  if (ov.hex_grid) { var el = document.createElement('div'); el.className = 'hex-grid'; el.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:4;'; c.appendChild(el); }
  if (ov.data_stream) { var el = document.createElement('div'); el.className = 'data-stream'; el.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:4;'; c.appendChild(el); }
})();
</script>`;
    html = html.replace('</body>', overrideScript + '\n</body>');
  }

  // Write the filled HTML
  const htmlOutputPath = outputPath.replace('.png', '.html');
  fs.writeFileSync(htmlOutputPath, html);
  const stats = fs.statSync(htmlOutputPath);
  return { success: true, path: htmlOutputPath, size: stats.size, mode: 'dry-run' };
}

// ─── Validation Suite ──────────────────────────────────────────────────────
function runValidation() {
  const results = { passed: 0, failed: 0, warnings: 0, details: [] };

  function pass(test) { results.passed++; results.details.push({ status: '✅', test }); }
  function fail(test, reason) { results.failed++; results.details.push({ status: '❌', test, reason }); }
  function warn(test, reason) { results.warnings++; results.details.push({ status: '⚠️', test, reason }); }

  console.log('\n🔍 BCOP Pipeline Validation\n' + '═'.repeat(60) + '\n');

  // 1. CSV parsing
  console.log('1. CSV Calendar Parsing');
  try {
    const csv = fs.readFileSync(CALENDAR_PATH, 'utf-8');
    const rows = parseCSV(csv);
    if (rows.length > 0) pass(`Parsed ${rows.length} calendar rows`);
    else fail('CSV parsing', 'No rows found');

    // Check required fields
    const required = ['post_id', 'topic', 'hook', 'status'];
    // content_pillar OR story_angle, channels OR platforms — check at least one exists
    const hasPillar = rows[0].content_pillar !== undefined || rows[0].story_angle !== undefined;
    const hasChannels = rows[0].channels !== undefined || rows[0].platforms !== undefined;
    if (hasPillar) pass('Field "content_pillar/story_angle" present');
    else fail('Field "content_pillar/story_angle"', 'Missing from CSV headers');
    if (hasChannels) pass('Field "channels/platforms" present');
    else fail('Field "channels/platforms"', 'Missing from CSV headers');
    for (const field of required) {
      if (rows[0][field] !== undefined) pass(`Field "${field}" present`);
      else fail(`Field "${field}"`, 'Missing from CSV headers');
    }

    // Check post_id format
    rows.forEach(r => {
      if (/^BHV-\d{8}-\d{3}$/.test(r.post_id)) pass(`Post ID format: ${r.post_id}`);
      else fail(`Post ID format: ${r.post_id}`, 'Expected BHV-YYYYMMDD-NNN');
    });
  } catch (err) {
    fail('CSV parsing', err.message);
  }

  // 2. Template registry
  console.log('\n2. Template Registry');
  try {
    const registry = loadRegistry();
    const templates = Object.keys(registry.templates);
    pass(`Registry loaded: ${templates.length} templates`);

    // Check all pillars have defaults
    const pillars = ['world_window', 'character_spotlight', 'the_question', 'behind_the_build', 'gateway_cta', 'mesh_intel', 'personnel_file', 'flagged_query', 'clearance_upgrade'];
    for (const pillar of pillars) {
      if (registry.pillar_to_template_default[pillar]) pass(`Default template for "${pillar}": ${registry.pillar_to_template_default[pillar]}`);
      else fail(`Default template for "${pillar}"`, 'No mapping in pillar_to_template_default');
    }

    // Check all template files exist
    for (const [tid, tpl] of Object.entries(registry.templates)) {
      for (const [channel, variant] of Object.entries(tpl.variants)) {
        const filePath = path.join(TEMPLATES_DIR, variant.file);
        if (fs.existsSync(filePath)) pass(`Template file: ${variant.file}`);
        else fail(`Template file: ${variant.file}`, 'File not found');
      }
    }
  } catch (err) {
    fail('Registry loading', err.message);
  }

  // 3. Slot extraction for each calendar row
  console.log('\n3. Slot Extraction');
  try {
    const csv = fs.readFileSync(CALENDAR_PATH, 'utf-8');
    const rows = parseCSV(csv);
    const registry = loadRegistry();

    for (const row of rows) {
      const pillar = (row.content_pillar || row.story_angle);
      const templateId = registry.pillar_to_template_default[pillar];
      if (!templateId) { fail(`Slot extraction: ${row.post_id}`, `No template for pillar "${pillar}"`); continue; }

      const slots = extractSlotData(row, templateId);
      const slotKeys = Object.keys(slots).filter(k => slots[k]);
      if (slotKeys.length > 0) pass(`${row.post_id} → ${templateId}: ${slotKeys.length} slots filled (${slotKeys.join(', ')})`);
      else warn(`${row.post_id} → ${templateId}`, 'No slots filled — may need asset images');
    }
  } catch (err) {
    fail('Slot extraction', err.message);
  }

  // 4. Channel routing
  console.log('\n4. Channel Routing');
  try {
    const csv = fs.readFileSync(CALENDAR_PATH, 'utf-8');
    const rows = parseCSV(csv);
    const registry = loadRegistry();

    for (const row of rows) {
      const channels = (row.channels || row.platforms).split(',').map(c => c.trim());
      for (const ch of channels) {
        try {
          selectTemplate(registry, (row.content_pillar || row.story_angle), ch);
          pass(`${row.post_id} → ${ch}`);
        } catch (err) {
          fail(`${row.post_id} → ${ch}`, err.message);
        }
      }
    }
  } catch (err) {
    fail('Channel routing', err.message);
  }

  // 5. Prompt data files
  console.log('\n5. Prompt Data Files');
  const promptFiles = ['style_anchors.json', 'character_dna.json', 'environment_templates.json', 'negative_prompts.json'];
  for (const pf of promptFiles) {
    const fp = path.join(PROMPTS_DIR, pf);
    if (fs.existsSync(fp)) {
      try { JSON.parse(fs.readFileSync(fp, 'utf-8')); pass(`${pf} — valid JSON`); }
      catch { fail(pf, 'Invalid JSON'); }
    } else {
      fail(pf, 'File not found');
    }
  }

  // 6. Reference catalog
  console.log('\n6. Reference Catalog');
  const catalogPath = path.join(ASSETS_DIR, 'references', 'REFERENCE_CATALOG.json');
  if (fs.existsSync(catalogPath)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      const totalAssets = Object.values(catalog.categories).reduce((sum, cat) => sum + cat.assets.length, 0);
      pass(`Reference catalog: ${totalAssets} assets in ${Object.keys(catalog.categories).length} categories`);
    } catch (err) { fail('Reference catalog', err.message); }
  } else {
    warn('Reference catalog', 'File not found at expected path');
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 Results: ${results.passed} passed, ${results.failed} failed, ${results.warnings} warnings\n`);

  if (results.failed > 0) {
    console.log('❌ FAILURES:');
    results.details.filter(d => d.status === '❌').forEach(d => {
      console.log(`   ${d.test}: ${d.reason}`);
    });
    console.log('');
  }

  if (results.warnings > 0) {
    console.log('⚠️  WARNINGS:');
    results.details.filter(d => d.status === '⚠️').forEach(d => {
      console.log(`   ${d.test}: ${d.reason}`);
    });
    console.log('');
  }

  return results.failed === 0;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  // --validate mode
  if (args.includes('--validate')) {
    const ok = runValidation();
    process.exit(ok ? 0 : 1);
  }

  // --list mode
  if (args.includes('--list')) {
    const csv = fs.readFileSync(CALENDAR_PATH, 'utf-8');
    const rows = parseCSV(csv);
    console.log('\n📋 Content Calendar:\n');
    console.log('POST ID              STATUS          PILLAR              TOPIC');
    console.log('─'.repeat(90));
    rows.forEach(r => {
      console.log(`${r.post_id.padEnd(21)}${r.status.padEnd(16)}${r.content_pillar.padEnd(20)}${r.topic.substring(0, 40)}`);
    });
    console.log(`\n${rows.length} posts total.\n`);
    return;
  }

  // Parse arguments
  const postId = args.find(a => a.startsWith('BHV-'));
  const channelIdx = args.indexOf('--channel');
  const channelFilter = channelIdx >= 0 ? args[channelIdx + 1] : null;
  const templateIdx = args.indexOf('--template');
  const templateOverride = templateIdx >= 0 ? args[templateIdx + 1] : null;
  const isPreview = args.includes('--preview');

  if (!postId && !isPreview) {
    console.log(`
Bharatvarsh Content Ops — Post Renderer

Usage:
  node render-post.js <post_id>                          Render all channels (requires Puppeteer)
  node render-post.js <post_id> --channel instagram      Render one channel
  node render-post.js <post_id> --template BHV-T-QUOTE   Override template
  node render-post.js --dry-run <post_id>                Validate + output filled HTML (no browser)
  node render-post.js --dry-run <post_id> --channel instagram  Dry-run one channel
  node render-post.js --list                             List calendar rows
  node render-post.js --preview BHV-T-QUOTE --channel instagram  Preview with defaults
  node render-post.js --validate                         Full pipeline validation suite
`);
    return;
  }

  // Load registry
  const registry = loadRegistry();

  if (isPreview) {
    // Preview mode: render a template with its default content
    const templateId = templateOverride || args[args.indexOf('--preview') + 1];
    const channel = channelFilter || 'instagram';
    const template = registry.templates[templateId];
    if (!template) {
      console.error(`Template "${templateId}" not found.`);
      process.exit(1);
    }
    const variant = template.variants[channel];
    if (!variant) {
      console.error(`No ${channel} variant for "${templateId}".`);
      process.exit(1);
    }

    const outputDir = path.join(RENDERED_DIR, 'previews');
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${templateId}-${channel}-preview.png`);
    const templatePath = path.join(TEMPLATES_DIR, variant.file);

    console.log(`🖼️  Previewing ${templateId} (${channel}, ${variant.dimensions.width}×${variant.dimensions.height})...`);
    const result = isDryRun
      ? dryRenderTemplate(templatePath, {}, variant.dimensions, outputPath)
      : await renderTemplate(templatePath, {}, variant.dimensions, outputPath);
    console.log(`✅ Preview: ${result.path} (${(result.size / 1024).toFixed(1)} KB)${result.mode === 'dry-run' ? ' [dry-run HTML]' : ''}`);
    return;
  }

  // Load calendar and find the post
  const csv = fs.readFileSync(CALENDAR_PATH, 'utf-8');
  const rows = parseCSV(csv);
  const row = rows.find(r => r.post_id === postId);
  if (!row) {
    console.error(`Post "${postId}" not found in calendar. Use --list to see available posts.`);
    process.exit(1);
  }

  // Load per-post style overrides
  const styleOverrides = loadStyleOverrides(row.post_id);

  // ─── Detect render mode from asset directory ──────────────────────────────
  const assetDir = path.join(ASSETS_DIR, row.post_id);
  let slideFiles = [], frameFiles = [], singleFile = null;

  if (fs.existsSync(assetDir)) {
    const assetFiles = fs.readdirSync(assetDir);
    slideFiles = assetFiles.filter(f => /^slide_\d+\.(png|jpg|jpeg|webp)$/i.test(f)).sort();
    frameFiles = assetFiles.filter(f => /^frame_\d+\.(png|jpg|jpeg|webp)$/i.test(f)).sort();
    singleFile = ['final.png', 'final.jpg', 'final.webp'].find(f =>
      fs.existsSync(path.join(assetDir, f))
    ) || null;
  }

  const renderMode = slideFiles.length > 0 ? 'carousel'
                   : frameFiles.length > 0 ? 'animation'
                   : 'single';

  const multiFiles = renderMode === 'carousel' ? slideFiles
                   : renderMode === 'animation' ? frameFiles
                   : [];

  console.log(`\n🎬 Rendering: ${row.post_id}`);
  console.log(`   Topic: ${row.topic}`);
  console.log(`   Pillar: ${(row.content_pillar || row.story_angle)}`);
  console.log(`   Channels: ${(row.channels || row.platforms)}`);
  console.log(`   Mode: ${renderMode}${multiFiles.length > 0 ? ` (${multiFiles.length} files)` : ''}`);
  if (styleOverrides) console.log(`   Style: ${styleOverrides.corner_label || 'custom overrides loaded'}`);
  console.log('');

  // Determine which channels to render
  const channels = channelFilter
    ? [channelFilter]
    : (row.channels || row.platforms).split(',').map(c => c.trim());

  // Create output directory
  const outputDir = path.join(RENDERED_DIR, row.post_id);
  fs.mkdirSync(outputDir, { recursive: true });

  const results = [];

  for (const channel of channels) {
    try {
      // Select template
      const { templateId, template, variant } = selectTemplate(
        registry, (row.content_pillar || row.story_angle), channel, templateOverride
      );

      const templatePath = path.join(TEMPLATES_DIR, variant.file);
      if (!fs.existsSync(templatePath)) {
        console.error(`   ❌ Template file missing: ${variant.file}`);
        continue;
      }

      if (renderMode === 'single') {
        // ── Single render (original behaviour) ────────────────────────────
        const slots = extractSlotData(row, templateId);
        const outputFilename = `${channel}_${variant.aspect_ratio.replace(':', 'x')}.png`;
        const outputPath = path.join(outputDir, outputFilename);

        console.log(`   📐 ${channel} (${variant.dimensions.width}×${variant.dimensions.height}) → ${templateId}${isDryRun ? ' [dry-run]' : ''}...`);

        const result = isDryRun
          ? dryRenderTemplate(templatePath, slots, variant.dimensions, outputPath, styleOverrides)
          : await renderTemplate(templatePath, slots, variant.dimensions, outputPath, styleOverrides);
        results.push({ channel, templateId, ...result });

        const label = isDryRun ? path.basename(result.path) : outputFilename;
        console.log(`   ✅ ${label} (${(result.size / 1024).toFixed(1)} KB)${result.mode === 'dry-run' ? ' [open in browser to preview]' : ''}`);

      } else {
        // ── Carousel / Animation: one render per file per channel ──────────
        const fileLabel = renderMode === 'carousel' ? 'slide' : 'frame';
        for (let fi = 0; fi < multiFiles.length; fi++) {
          const frameFile = multiFiles[fi];
          const frameNum = fi + 1;
          const frameNumPadded = String(frameNum).padStart(2, '0');
          const bgImagePath = path.join(assetDir, frameFile);

          const slots = extractSlotData(row, templateId, bgImagePath);
          const outputFilename = `${channel}_${fileLabel}_${frameNumPadded}.png`;
          const outputPath = path.join(outputDir, outputFilename);

          console.log(`   📐 ${channel} ${fileLabel} ${frameNumPadded}/${String(multiFiles.length).padStart(2,'0')} → ${templateId}${isDryRun ? ' [dry-run]' : ''}...`);

          const result = isDryRun
            ? dryRenderTemplate(templatePath, slots, variant.dimensions, outputPath, styleOverrides)
            : await renderTemplate(templatePath, slots, variant.dimensions, outputPath, styleOverrides);

          const resultEntry = {
            channel,
            templateId,
            [fileLabel]: frameNum,
            ...result,
          };
          results.push(resultEntry);

          const label = isDryRun ? path.basename(result.path) : outputFilename;
          console.log(`   ✅ ${label} (${(result.size / 1024).toFixed(1)} KB)${result.mode === 'dry-run' ? ' [open in browser to preview]' : ''}`);
        }
      }
    } catch (err) {
      console.error(`   ❌ ${channel}: ${err.message}`);
    }
  }

  // Write render manifest
  const countKey = renderMode === 'carousel' ? 'slide_count'
                 : renderMode === 'animation' ? 'frame_count'
                 : null;

  const manifest = {
    post_id: row.post_id,
    rendered_at: new Date().toISOString(),
    pillar: (row.content_pillar || row.story_angle),
    topic: row.topic,
    type: renderMode,
    ...(countKey ? { [countKey]: multiFiles.length } : {}),
    style_overrides_applied: !!styleOverrides,
    renders: results.map(r => {
      const entry = {
        channel: r.channel,
        template: r.templateId,
        file: path.basename(r.path),
        size_bytes: r.size,
      };
      if (r.slide != null) entry.slide = r.slide;
      if (r.frame != null) entry.frame = r.frame;
      return entry;
    }),
  };
  fs.writeFileSync(path.join(outputDir, 'render-manifest.json'), JSON.stringify(manifest, null, 2));

  const totalExpected = renderMode === 'single'
    ? channels.length
    : channels.length * multiFiles.length;
  console.log(`\n✅ Rendered ${results.length}/${totalExpected} ${renderMode === 'single' ? 'channel variants' : `${renderMode} frames`} → ${outputDir}/`);
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
