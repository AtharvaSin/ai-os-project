---
name: create-image
description: Create programmatic images using HTML+Puppeteer rendering with brand-consistent styling. Use when the user asks to create a static image, poster, banner, thumbnail, social card, infographic, branded graphic, or any visual asset. Accepts custom images as inputs.
---

# Create Image

Generate branded static visual assets using code-driven rendering. Outputs PNG/JPEG/WebP files.

## Before Starting

1. Read `${CLAUDE_PLUGIN_ROOT}/context/brand-system.md` — brand tokens AND links to all preference files
2. Read `${CLAUDE_PLUGIN_ROOT}/preferences/visual-style.md` — anti-generic mandate, composition rules, layout patterns
3. Read `${CLAUDE_PLUGIN_ROOT}/preferences/copy-tone.md` — voice, headline rules, word banks per context
4. Read `${CLAUDE_PLUGIN_ROOT}/preferences/platform-rules.md` — per-platform composition and sizing
5. Read `${CLAUDE_PLUGIN_ROOT}/engine/renderer.js` to understand the rendering API
6. Read `${CLAUDE_PLUGIN_ROOT}/engine/mcp-bridge.js` to understand routing decisions
7. Determine brand context (A/B/C) from content topic
8. Check for user-provided images in the working folder
9. Check `${CLAUDE_PLUGIN_ROOT}/references/examples/approved/` for past outputs that hit the mark (if files exist)
10. Check `${CLAUDE_PLUGIN_ROOT}/references/mood-boards/context-{A|B|C}/` for visual inspiration (if files exist)

## Step 1: Parse the Brief

Extract from the user's request:

| Field | Description | Default |
|-------|-------------|---------|
| Asset type | thumbnail, social card, banner, poster, infographic, etc. | social card |
| Preset | Platform preset key (see table below) | `social_post_square` |
| Brand context | A (AI OS), B (Bharatvarsh), C (Portfolio) | Infer from topic |
| Title | Main headline text | Required |
| Subtitle | Secondary text | Optional |
| Badge text | Top badge/label | Optional |
| Footer text | Bottom-left footer | Optional |
| Footer tag | Bottom-right tag | Optional |
| Background image | User-provided image path or URL | Optional |
| Background opacity | 0.0–1.0 | 0.4 |
| Output format | png, jpeg, webp | png |
| Custom assets | User-provided photos/illustrations | Auto-detect |

### Platform Presets (from engine/renderer.js)

| Key | Dimensions | Use For |
|-----|-----------|---------|
| `youtube_thumbnail` | 1280×720 | YouTube thumbnails |
| `instagram_feed` | 1080×1080 | Instagram feed posts |
| `instagram_story` | 1080×1920 | Instagram/FB stories |
| `linkedin_post` | 1200×628 | LinkedIn posts |
| `twitter_post` | 1600×900 | Twitter/X posts |
| `og_image` | 1200×630 | Website OG images |
| `banner_wide` | 1500×500 | Twitter/LinkedIn banners |
| `social_post_square` | 1080×1080 | General square posts |
| `poster_a4` | 2480×3508 | Print posters |

## Step 2: Route the Render

Use the MCP bridge to decide rendering path:

```javascript
const { routeRender } = require('${CLAUDE_PLUGIN_ROOT}/engine/mcp-bridge.js');

const decision = routeRender({
  type: 'image',
  preset: 'youtube_thumbnail',
  hasCustomCSS: false,
  hasCustomBody: false,
  hasCustomAssets: !!bgImagePath,
  needsDriveUpload: false,
  complexity: 'simple' // or 'moderate' or 'complex'
});
```

**If route is 'mcp':** Use the `render_template` MCP tool with `buildMCPRenderParams()`.
**If route is 'local':** Continue to Step 3.

## Step 3: Local Rendering

### 3a. Set up the project

```bash
mkdir -p output
cd /path/to/working/dir
```

### 3b. Initialize Node project if needed

```bash
[ -f package.json ] || npm init -y
npm list puppeteer 2>/dev/null || npm install puppeteer
```

### 3c. Write the render script

Create a `render.js` file that uses the engine:

```javascript
const { buildBrandedHTML, renderWithPuppeteer, PRESETS, generateRenderLog } = require('${CLAUDE_PLUGIN_ROOT}/engine/renderer.js');

const preset = PRESETS['youtube_thumbnail']; // or whichever
const brandContext = 'B'; // A, B, or C

const html = buildBrandedHTML({
  brandContext,
  width: preset.width,
  height: preset.height,
  title: 'YOUR TITLE HERE',
  subtitle: 'Your subtitle here',
  footerText: 'footer text',
  footerTag: 'tag',
  bgImageUrl: '', // optional: path to background image
  bgOpacity: 0.4,
  badgeText: '', // optional: top badge
  customCSS: '', // optional: additional CSS
  customBody: '' // optional: replace entire body content
});

(async () => {
  const startTime = Date.now();
  const result = await renderWithPuppeteer(html, './output/render.png', {
    width: preset.width,
    height: preset.height,
    format: 'png',
    deviceScaleFactor: 2
  });
  const duration = Date.now() - startTime;

  // Generate render log
  const log = generateRenderLog({
    brandContext,
    preset: 'youtube_thumbnail',
    dimensions: preset,
    method: 'puppeteer',
    outputFiles: [{ name: 'render.png', size: result.size }],
    duration,
    customAssets: []
  });
  require('fs').writeFileSync('./output/render-log.md', log);

  console.log(`✓ Rendered: ${result.path} (${(result.size / 1024).toFixed(1)} KB)`);
})();
```

### 3d. Run the render

```bash
node render.js
```

## Step 4: Custom Compositions

For layouts that go beyond the standard template, use `customCSS` and `customBody` parameters:

```javascript
const html = buildBrandedHTML({
  brandContext: 'B',
  width: 1280,
  height: 720,
  customCSS: `
    .hero-layout { display: grid; grid-template-columns: 1fr 1fr; height: 100%; }
    .text-zone { display: flex; flex-direction: column; justify-content: center; padding: 60px; }
    .image-zone { position: relative; overflow: hidden; }
    .character-img { width: 100%; height: 100%; object-fit: cover; }
  `,
  customBody: `
    <div class="hero-layout" style="position:relative; z-index:2;">
      <div class="text-zone">
        <div class="accent-bar"></div>
        <div class="title">CHAPTER 5: THE RECKONING</div>
        <div class="subtitle">The truth behind the Nexus emerges...</div>
      </div>
      <div class="image-zone">
        <img class="character-img" src="character-art.png" />
      </div>
    </div>
  `
});
```

## Step 5: Incorporate User Assets

When the user provides images:

1. **Check the working folder** for image files (.png, .jpg, .webp, .svg)
2. **Convert to data URLs** for Puppeteer embedding (avoids file:// protocol issues):
   ```javascript
   const fs = require('fs');
   const imgBuf = fs.readFileSync('user-image.png');
   const dataUrl = `data:image/png;base64,${imgBuf.toString('base64')}`;
   // Use dataUrl in bgImageUrl or customBody img src
   ```
3. **Apply brand color grading** using Sharp if needed:
   ```javascript
   const sharp = require('sharp');
   await sharp('user-image.png')
     .modulate({ brightness: 0.9, saturation: 0.8 }) // Context B: warm/desaturated
     .tint({ r: 200, g: 180, b: 140 }) // Warm tone
     .toFile('graded-image.png');
   ```

## Step 6: Deliver

Place all output in the working folder:

```
output/
├── [asset-name].png           # Primary output
├── render-log.md              # Creation metadata
```

Present the image to the user using the Cowork file presentation system.

## Quality Checklist

Before delivering, verify:
- [ ] Brand context is correctly applied (colors, fonts, effects)
- [ ] Text is readable (contrast ratio ≥ 4.5:1)
- [ ] No system font fallbacks used
- [ ] User images not stretched or distorted
- [ ] Output dimensions match the requested preset
- [ ] File size is reasonable (<2MB for social, <5MB for print)
- [ ] Render log is generated

## Error Handling

| Error | Recovery |
|-------|----------|
| Puppeteer not installed | `npm install puppeteer` (auto-handled by engine) |
| Font loading fails | Engine uses Google Fonts CDN — check network |
| User image not found | Continue without it, note in render log |
| Output path not writable | Create output/ directory first |
| Render timeout (>30s) | Reduce deviceScaleFactor to 1, simplify composition |
