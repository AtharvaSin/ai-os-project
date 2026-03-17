/**
 * extract_wibify_tokens.js
 * Extracts design tokens from wibify.agency using Playwright.
 * Outputs specs/context_a_extracted.json relative to this script's directory.
 *
 * Run: node extract_wibify_tokens.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URLS = [
  'https://wibify.agency',
  'https://wibify.agency/leistungen/webentwicklung',
];

const OUTPUT_PATH = path.join(__dirname, '..', 'specs', 'context_a_extracted.json');

// CSS selectors to probe for computed styles
const PROBE_SELECTORS = {
  body:         'body',
  nav:          'nav, header',
  hero_heading: 'h1',
  section_heading: 'h2',
  body_text:    'p',
  cta_button:   'a[href*="angebot"], button, .btn',
  card:         '[class*="card"], [class*="Card"], article',
  badge_label:  '[class*="badge"], [class*="label"], [class*="tag"]',
  number_stat:  '[class*="stat"], [class*="number"], [class*="metric"]',
  section_label:'[class*="section"], [class*="eyebrow"], small',
  border_elem:  '[class*="border"], hr, [class*="divider"]',
  footer:       'footer',
};

// CSS properties to extract per element
const CSS_PROPS = [
  'backgroundColor',
  'color',
  'borderColor',
  'borderTopColor',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'letterSpacing',
];

async function extractTokens() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });

  const results = {
    source: 'wibify.agency',
    extracted_at: new Date().toISOString(),
    css_variables: {},
    computed_styles: {},
    color_frequency: {},
    font_families: new Set(),
  };

  for (const url of URLS) {
    console.log(`\nVisiting: ${url}`);
    const page = await context.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000); // let animations settle

      // --- Extract :root CSS custom properties ---
      const cssVars = await page.evaluate(() => {
        const root = document.documentElement;
        const style = getComputedStyle(root);
        const vars = {};
        for (const prop of style) {
          if (prop.startsWith('--')) {
            vars[prop] = style.getPropertyValue(prop).trim();
          }
        }
        return vars;
      });

      Object.assign(results.css_variables, cssVars);
      console.log(`  CSS variables found: ${Object.keys(cssVars).length}`);

      // --- Extract computed styles for probe selectors ---
      for (const [label, selector] of Object.entries(PROBE_SELECTORS)) {
        try {
          const styles = await page.evaluate(
            ({ selector, props }) => {
              const el = document.querySelector(selector);
              if (!el) return null;
              const computed = getComputedStyle(el);
              const result = {};
              for (const prop of props) {
                result[prop] = computed[prop];
              }
              // Also get background of parent if element bg is transparent
              result._text = el.textContent?.slice(0, 50).trim();
              result._tagName = el.tagName;
              result._classes = el.className?.toString().slice(0, 100);
              return result;
            },
            { selector, props: CSS_PROPS }
          );

          if (styles) {
            if (!results.computed_styles[label]) {
              results.computed_styles[label] = styles;
            }
          }
        } catch (e) {
          // Selector not found on this page, skip
        }
      }

      // --- Color frequency analysis ---
      // Find all unique background and text colors across all elements
      const colorMap = await page.evaluate(() => {
        const freq = {};
        const elements = document.querySelectorAll('*');
        const sample = Array.from(elements).slice(0, 300); // sample first 300 elements

        for (const el of sample) {
          const s = getComputedStyle(el);
          ['backgroundColor', 'color'].forEach(prop => {
            const val = s[prop];
            if (val && val !== 'rgba(0, 0, 0, 0)' && val !== 'transparent') {
              freq[val] = (freq[val] || 0) + 1;
            }
          });
        }
        return freq;
      });

      for (const [color, count] of Object.entries(colorMap)) {
        results.color_frequency[color] = (results.color_frequency[color] || 0) + count;
      }

      // --- Font families used ---
      const fonts = await page.evaluate(() => {
        const families = new Set();
        const elements = document.querySelectorAll('h1, h2, h3, p, a, button, span');
        for (const el of elements) {
          const ff = getComputedStyle(el).fontFamily;
          if (ff) families.add(ff.split(',')[0].replace(/['"]/g, '').trim());
        }
        return [...families];
      });
      fonts.forEach(f => results.font_families.add(f));

    } catch (err) {
      console.error(`  Error on ${url}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // --- Post-process: identify key semantic roles ---
  const colors = results.color_frequency;
  const sortedColors = Object.entries(colors)
    .sort((a, b) => b[1] - a[1])
    .map(([color, freq]) => ({ color, freq, hex: rgbToHex(color) }))
    .filter(c => c.hex); // Only keep parseable colors

  results.top_colors = sortedColors.slice(0, 20);
  results.font_families = [...results.font_families];

  // Attempt to identify semantic roles from frequency + context
  results.semantic_mapping = inferSemanticRoles(sortedColors, results.computed_styles);

  // Serialize (Sets aren't JSON-serializable)
  const output = JSON.stringify(results, null, 2);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, output);
  console.log(`\n✅ Extraction complete. Output: ${OUTPUT_PATH}`);
  console.log(`   Top colors found: ${sortedColors.slice(0, 5).map(c => c.hex).join(', ')}`);
  console.log(`   Fonts found: ${results.font_families.join(', ')}`);

  return results;
}

function rgbToHex(rgb) {
  if (!rgb) return null;
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  const [, r, g, b] = match.map(Number);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function inferSemanticRoles(sortedColors, computedStyles) {
  const mapping = {};

  // Darkest backgrounds (most frequent dark colors)
  const darkColors = sortedColors.filter(c => {
    const hex = c.hex;
    if (!hex) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance < 50; // very dark
  });

  if (darkColors[0]) mapping['bg-void'] = darkColors[0].hex;
  if (darkColors[1]) mapping['bg-base'] = darkColors[1].hex;
  if (darkColors[2]) mapping['bg-surface'] = darkColors[2].hex;

  // Lightest text colors
  const lightColors = sortedColors.filter(c => {
    const hex = c.hex;
    if (!hex) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 180;
  });
  if (lightColors[0]) mapping['text-primary'] = lightColors[0].hex;
  if (lightColors[1]) mapping['text-secondary'] = lightColors[1].hex;

  // Accent: look for non-neutral, high-saturation colors
  const accentColors = sortedColors.filter(c => {
    const hex = c.hex;
    if (!hex) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    return saturation > 0.4 && max > 100; // saturated and bright
  });

  if (accentColors[0]) mapping['accent-primary'] = accentColors[0].hex;
  if (accentColors[1]) mapping['accent-secondary'] = accentColors[1].hex;

  // CTA button color from computed styles
  if (computedStyles.cta_button) {
    const ctaBg = rgbToHex(computedStyles.cta_button.backgroundColor);
    const ctaColor = rgbToHex(computedStyles.cta_button.color);
    if (ctaBg) mapping['cta-bg'] = ctaBg;
    if (ctaColor) mapping['cta-text'] = ctaColor;
  }

  // Nav background
  if (computedStyles.nav) {
    const navBg = rgbToHex(computedStyles.nav.backgroundColor);
    if (navBg) mapping['nav-bg'] = navBg;
  }

  return mapping;
}

extractTokens().catch(err => {
  console.error('Extraction failed:', err);
  console.log('\nRun the fallback script instead: node extract_wibify_fallback.js');
  process.exit(1);
});
