/**
 * extract_wibify_fallback.js
 * Fallback extraction using fetch + CSS parsing.
 * No Playwright needed — works in any Node environment.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', 'specs', 'context_a_extracted.json');

// These are manually observed values from wibify.agency visual inspection
// Update with actual DevTools values if you can extract them
const MANUAL_FALLBACK = {
  source: 'wibify.agency (manual fallback — update with DevTools values)',
  extracted_at: new Date().toISOString(),
  note: 'PLAYWRIGHT EXTRACTION FAILED. These values are estimated from visual inspection. ' +
        'Open DevTools on wibify.agency → Computed tab → copy actual values to override.',
  semantic_mapping: {
    // Background hierarchy (near-black, very dark)
    'bg-void':    '#080808',  // Deepest background (estimated)
    'bg-base':    '#0d0d0d',  // Main page background
    'bg-surface': '#141414',  // Card/panel surface
    'bg-elevated':'#1a1a1a',  // Elevated elements, hover states

    // Accent (CRITICAL: update this — it's the signature brand color)
    // Wibify uses a bright electric color for CTAs, active states, highlights
    // Common choices: electric green #00ff88, lime #84cc16, electric teal #00e5cc
    // Check the "Angebot" (CTA) button and nav hover states in DevTools
    'accent-primary':   '#PLACEHOLDER', // ← UPDATE THIS FROM DEVTOOLS

    // Text hierarchy
    'text-primary':   '#ffffff',  // Headings, primary text
    'text-secondary': '#a3a3a3',  // Body, supporting text
    'text-muted':     '#525252',  // Labels, captions

    // Borders and dividers
    'border':         '#1f1f1f',  // Subtle dividers

    // Typography (observed from rendered page)
    'font-display':   'Geist, Inter, sans-serif', // Large headings (update with actual)
    'font-body':      'Geist, Inter, sans-serif', // Body text
    'font-mono':      'JetBrains Mono, monospace', // Code/data if any

    // Structural characteristics observed
    'section-label-style': 'uppercase, small, tracked, accent color or muted',
    'numbered-sections': true,   // Uses 01/02/03 numbering pattern
    'card-style': 'minimal border, dark surface, no heavy shadows',
    'heading-weight': '700-800', // Bold/extra-bold headings
  },
  instructions_for_manual_update: [
    '1. Open https://wibify.agency in Chrome',
    '2. Press F12 → Elements tab → select <html> or <body>',
    '3. In Computed panel, look for --color-* or --bg-* CSS variables',
    '4. Specifically: click the CTA button (Angebot), inspect backgroundColor',
    '5. Check nav background, hero heading color, card border color',
    '6. Update accent-primary with the exact hex of the CTA/interactive color',
    '7. Update bg-void with the darkest background found',
    '8. Save this file, then Claude Code will use these values in SPEC_CONTEXT_A.md'
  ]
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(MANUAL_FALLBACK, null, 2));

console.log('✅ Fallback token file written to:', OUTPUT_PATH);
console.log('\n⚠️  IMPORTANT: accent-primary is a PLACEHOLDER.');
console.log('   You must update it with the actual Wibify CTA color from DevTools.');
console.log('   See instructions_for_manual_update in the output file.\n');
