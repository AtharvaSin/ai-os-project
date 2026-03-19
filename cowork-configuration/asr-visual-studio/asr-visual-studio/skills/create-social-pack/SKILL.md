---
name: create-social-pack
description: Create a complete multi-platform social media content pack from a single brief. Generates platform-optimized images for Instagram, LinkedIn, Twitter/X, YouTube, and Stories. Use when the user says "social pack", "content pack", "create posts for all platforms", or needs the same message adapted across multiple formats.
---

# Create Social Pack

Generate a coordinated set of platform-optimized visual assets from one content brief. One input → 4-6 branded outputs.

## Before Starting

1. Read `${CLAUDE_PLUGIN_ROOT}/context/brand-system.md` — brand tokens AND links to all preference files
2. Read `${CLAUDE_PLUGIN_ROOT}/preferences/visual-style.md` — anti-generic mandate, composition rules
3. Read `${CLAUDE_PLUGIN_ROOT}/preferences/copy-tone.md` — voice, headline rules per context
4. Read `${CLAUDE_PLUGIN_ROOT}/preferences/platform-rules.md` — CRITICAL for social packs: per-platform rules
5. Read `${CLAUDE_PLUGIN_ROOT}/engine/renderer.js` for the rendering API
6. Read `${CLAUDE_PLUGIN_ROOT}/engine/mcp-bridge.js` for routing decisions
7. Determine brand context from content topic
8. Check for a hero image in the working folder

## Step 1: Parse the Pack Brief

| Field | Description | Default |
|-------|-------------|---------|
| Core message | Main headline/announcement | Required |
| Brand context | A, B, or C | Infer from topic |
| Hero asset | Key image to anchor the pack | Optional |
| Platforms | Which to generate | All |
| CTA | Call-to-action text | Optional |
| Subtitle | Supporting text | Optional |

## Step 2: Output Matrix

| Asset | Preset Key | Dimensions | Priority |
|-------|-----------|-----------|----------|
| Instagram Feed | `instagram_feed` | 1080×1080 | High |
| Instagram Story | `instagram_story` | 1080×1920 | High |
| LinkedIn Post | `linkedin_post` | 1200×628 | High |
| Twitter/X Post | `twitter_post` | 1600×900 | Medium |
| YouTube Thumbnail | `youtube_thumbnail` | 1280×720 | Medium |
| OG Image | `og_image` | 1200×630 | Low |

## Step 3: Render Each Asset

For each platform target, create a render script that uses the engine:

```javascript
const { buildBrandedHTML, renderWithPuppeteer, PRESETS, generateRenderLog }
  = require('${CLAUDE_PLUGIN_ROOT}/engine/renderer.js');
const { routeRender, buildMCPRenderParams }
  = require('${CLAUDE_PLUGIN_ROOT}/engine/mcp-bridge.js');
const fs = require('fs');

const brandContext = 'B'; // Or A/C
const title = 'YOUR HEADLINE';
const subtitle = 'Supporting text';

const targets = [
  { key: 'instagram_feed', badge: '', footer: '@welcometobharatvarsh' },
  { key: 'instagram_story', badge: 'NEW', footer: 'Swipe up →' },
  { key: 'linkedin_post', badge: '', footer: 'Atharva Singh' },
  { key: 'twitter_post', badge: '', footer: '' },
  { key: 'youtube_thumbnail', badge: 'NEW VIDEO', footer: '' },
];

(async () => {
  fs.mkdirSync('./output/social-pack', { recursive: true });

  for (const target of targets) {
    const preset = PRESETS[target.key];
    const decision = routeRender({
      type: 'image', preset: target.key,
      hasCustomCSS: false, hasCustomBody: false,
      hasCustomAssets: false, complexity: 'simple'
    });

    if (decision.route === 'mcp') {
      // Generate MCP params — skill should call the MCP tool
      const mcpParams = buildMCPRenderParams({
        preset: target.key, brandContext, title, subtitle,
        badgeText: target.badge, footerText: target.footer
      });
      console.log(`MCP route for ${target.key}:`, JSON.stringify(mcpParams, null, 2));
      // The skill should invoke the MCP tool with these params
    } else {
      // Local render
      const html = buildBrandedHTML({
        brandContext,
        width: preset.width, height: preset.height,
        title, subtitle,
        badgeText: target.badge,
        footerText: target.footer,
        footerTag: brandContext === 'B' ? 'BHARATVARSH' : brandContext === 'A' ? 'AI OS' : '',
        bgOpacity: 0.4
      });

      await renderWithPuppeteer(html, `./output/social-pack/${target.key}.png`, {
        width: preset.width, height: preset.height
      });
      console.log(`✓ ${target.key} rendered`);
    }
  }

  // Generate pack preview HTML
  const previewHTML = generatePackPreview(targets, brandContext);
  fs.writeFileSync('./output/social-pack/pack-preview.html', previewHTML);
  console.log('✓ Pack preview generated');
})();

function generatePackPreview(targets, brand) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Inter, sans-serif; background: #111; color: #fff; padding: 40px; }
  h1 { margin-bottom: 30px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
  .card { background: #1a1a1a; border-radius: 12px; overflow: hidden; }
  .card img { width: 100%; display: block; }
  .card-label { padding: 12px 16px; font-size: 14px; color: #aaa; }
</style></head><body>
<h1>Social Pack Preview — Context ${brand}</h1>
<div class="grid">
  ${targets.map(t => `<div class="card"><img src="${t.key}.png"><div class="card-label">${PRESETS[t.key]?.label || t.key}</div></div>`).join('\n  ')}
</div>
</body></html>`;
}
```

## Step 4: Adapt Per Platform

Each platform needs different treatment of the SAME content:

| Platform | Text Density | Visual Weight | Tone Adjustment |
|----------|-------------|---------------|-----------------|
| Instagram Feed | Low — 3-5 words max | High — image-forward | Bold, visual |
| Instagram Story | Medium — include CTA | Medium | Action-oriented |
| LinkedIn | Higher — can include subtitle | Medium | 10% more professional |
| Twitter/X | Punchy — works at tiny size | High contrast | Attention-grabbing |
| YouTube Thumbnail | Minimal — 3 words max | Maximum contrast | Competing for clicks |

**Key rules:**
- Never reuse the exact same layout — adapt composition per aspect ratio
- YouTube thumbnails need MAXIMUM contrast (they compete against thousands)
- LinkedIn variants should feel slightly more professional
- Instagram stories need swipe-friendly CTA placement (bottom 20%)

## Step 5: Deliver

```
output/social-pack/
├── instagram_feed.png
├── instagram_story.png
├── linkedin_post.png
├── twitter_post.png
├── youtube_thumbnail.png
├── pack-preview.html        # Grid preview of all assets
└── render-log.md
```

Present all files to the user. The `pack-preview.html` provides a visual grid for quick review.

## Quality Checklist

- [ ] All assets in the pack feel visually coordinated
- [ ] Text readable at each platform's typical display size
- [ ] YouTube thumbnail has highest contrast of all variants
- [ ] LinkedIn variant feels professionally appropriate
- [ ] Instagram story has CTA in bottom 20% of canvas
- [ ] No font fallbacks in any asset
- [ ] Pack preview HTML renders correctly
