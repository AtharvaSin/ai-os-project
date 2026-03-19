---
name: create-video
description: Create programmatic videos using FFmpeg and Puppeteer frame generation. Use when the user asks to create a video, animation, motion graphic, book trailer, promo clip, social video, YouTube intro/outro, or any moving visual content. Accepts custom images/video clips.
---

# Create Video

Generate branded video content using frame-by-frame Puppeteer rendering + FFmpeg assembly. No Remotion dependency — lightweight, portable, and reliable.

## Before Starting

1. Read `${CLAUDE_PLUGIN_ROOT}/context/brand-system.md` — brand tokens AND links to all preference files
2. Read `${CLAUDE_PLUGIN_ROOT}/preferences/visual-style.md` — anti-generic mandate, composition rules per context
3. Read `${CLAUDE_PLUGIN_ROOT}/preferences/copy-tone.md` — voice, headline rules, word banks per context
4. Read `${CLAUDE_PLUGIN_ROOT}/engine/video-renderer.js` for the video rendering API
5. Verify FFmpeg is available: `ffmpeg -version`
6. Determine brand context (A/B/C) from content topic
7. Check for user-provided assets (images, video clips, audio) in the working folder

## Step 1: Parse the Brief

| Field | Description | Default |
|-------|-------------|---------|
| Video type | text_reveal, ken_burns, slideshow, title_card, promo_clip | text_reveal |
| Brand context | A (AI OS), B (Bharatvarsh), C (Portfolio) | Infer from topic |
| Title | Main headline | Required |
| Subtitle | Secondary text | Optional |
| Duration | Seconds | Type-dependent (5-15s) |
| Aspect ratio | 16:9, 9:16, 1:1, 2.35:1 | 16:9 |
| FPS | Frames per second | 30 |
| Custom assets | Background images, clips, audio | Auto-detect |
| Output format | mp4, webm | mp4 |

### Video Type Quick Reference

| Type | Best For | Default Duration |
|------|----------|-----------------|
| `text_reveal` | Animated text with brand styling, announcements | 8s |
| `ken_burns` | Slow zoom/pan on image with text overlay | 10s |
| `slideshow` | Multi-image with transitions | 15s |
| `title_card` | Simple branded intro/outro card | 5s |
| `promo_clip` | Full promotional clip with multiple elements | 15s |

### Aspect Ratio Presets

| Key | Dimensions | Use For |
|-----|-----------|---------|
| `landscape_16x9` | 1920×1080 | YouTube, general landscape |
| `portrait_9x16` | 1080×1920 | Reels, Stories, TikTok |
| `square_1x1` | 1080×1080 | Instagram feed video |
| `cinematic` | 1920×817 | Cinematic letterbox trailers |

## Step 2: Check Prerequisites

```bash
# FFmpeg is required for video assembly
ffmpeg -version || echo "ERROR: FFmpeg not available — install with: apt-get install ffmpeg"

# Node packages
[ -f package.json ] || npm init -y
npm list puppeteer 2>/dev/null || npm install puppeteer
```

## Step 3: Render by Video Type

### Type: text_reveal

Animated text fade-in with brand effects (grain for B, glow for A/C).

```javascript
const { generateTextRevealFrames, assembleVideo, cleanupFrames, VIDEO_PRESETS }
  = require('${CLAUDE_PLUGIN_ROOT}/engine/video-renderer.js');

const outputDir = './output';
const preset = VIDEO_PRESETS.landscape_16x9;

(async () => {
  console.log('Generating text reveal frames...');
  const framesDir = await generateTextRevealFrames({
    brandContext: 'B',
    title: 'BHARATVARSH',
    subtitle: 'A world rewritten. A truth buried.',
    width: preset.width,
    height: preset.height,
    fps: 30,
    duration: 8,
    outputDir
  });

  console.log('Assembling video...');
  assembleVideo(framesDir, `${outputDir}/text-reveal.mp4`, { fps: 30 });

  cleanupFrames(framesDir);
  console.log('✓ Done');
})();
```

### Type: ken_burns

Slow zoom/pan on a provided image with branded text overlay.

```javascript
const { generateKenBurnsFrames, assembleVideo, cleanupFrames, VIDEO_PRESETS }
  = require('${CLAUDE_PLUGIN_ROOT}/engine/video-renderer.js');

(async () => {
  const framesDir = await generateKenBurnsFrames({
    brandContext: 'B',
    imagePath: './hero-image.jpg', // User-provided image
    title: 'THE NEXUS AWAITS',
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 10,
    outputDir: './output'
  });

  assembleVideo(framesDir, './output/ken-burns.mp4', { fps: 30 });
  cleanupFrames(framesDir);
})();
```

### Type: ken_burns (Fast FFmpeg path — no Puppeteer)

For simple zoom without branded text overlay:

```javascript
const { ffmpegKenBurns, addTextOverlay } = require('${CLAUDE_PLUGIN_ROOT}/engine/video-renderer.js');

// Step 1: Ken Burns zoom
ffmpegKenBurns('./hero-image.jpg', './output/zoom.mp4', {
  width: 1920, height: 1080, duration: 10
});

// Step 2: Add text overlay
addTextOverlay('./output/zoom.mp4', './output/final.mp4', {
  text: 'BHARATVARSH',
  fontSize: 72,
  fontColor: '#F1C232',
  x: '(w-text_w)/2',
  y: '(h-text_h)*0.8',
  fadeIn: 2
});
```

### Type: slideshow

Multi-image with crossfade transitions:

```bash
# Generate crossfade slideshow from multiple images
# Each image shown for 3 seconds with 0.5s crossfade
ffmpeg -y \
  -loop 1 -t 3.5 -i image1.png \
  -loop 1 -t 3.5 -i image2.png \
  -loop 1 -t 3.5 -i image3.png \
  -filter_complex \
  "[0:v]fade=t=out:st=3:d=0.5[v0]; \
   [1:v]fade=t=in:st=0:d=0.5,fade=t=out:st=3:d=0.5[v1]; \
   [2:v]fade=t=in:st=0:d=0.5[v2]; \
   [v0][v1]overlay[ov1]; \
   [ov1][v2]overlay" \
  -c:v libx264 -pix_fmt yuv420p output/slideshow.mp4
```

### Type: title_card

Simple 5-second branded card — use `text_reveal` with shorter duration:

```javascript
const framesDir = await generateTextRevealFrames({
  brandContext: 'A',
  title: 'AI OPERATING SYSTEM',
  subtitle: 'Sprint 11 Update',
  width: 1920, height: 1080,
  fps: 30, duration: 5,
  outputDir: './output'
});
assembleVideo(framesDir, './output/title-card.mp4', { fps: 30 });
```

## Step 4: Post-Processing

### Add Audio Track
```bash
ffmpeg -y -i output/video.mp4 -i background-music.mp3 \
  -c:v copy -c:a aac -shortest output/video-with-audio.mp4
```

### Convert to Portrait (9:16) from Landscape
```bash
ffmpeg -y -i output/landscape.mp4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" \
  output/portrait.mp4
```

### Generate Thumbnail from Best Frame
```bash
# Extract frame at 3 seconds
ffmpeg -y -i output/video.mp4 -ss 3 -vframes 1 output/thumbnail.png
```

### Create GIF Preview
```bash
ffmpeg -y -i output/video.mp4 -vf "fps=10,scale=480:-1:flags=lanczos" \
  -c:v gif output/preview.gif
```

## Step 5: Deliver

```
output/
├── [video-name].mp4           # Primary video output
├── [video-name]-portrait.mp4  # Portrait variant (if requested)
├── thumbnail.png              # Auto-generated thumbnail
├── preview.gif                # GIF preview (optional)
└── render-log.md              # Creation metadata
```

## Quality Checklist

- [ ] FFmpeg confirmed available before starting
- [ ] Brand context correctly applied in every frame
- [ ] Text readable at target platform's thumbnail size
- [ ] No font fallbacks — Google Fonts loaded explicitly
- [ ] Aspect ratio correct for target platform
- [ ] Duration matches brief (±0.5s)
- [ ] Frame cleanup completed (no leftover _frames/ directory)
- [ ] File size reasonable (<50MB for 15s at 1080p)

## Error Handling

| Error | Recovery |
|-------|----------|
| FFmpeg not found | Install via `apt-get install ffmpeg` or `brew install ffmpeg` |
| Puppeteer launch fails | Add `--no-sandbox --disable-setuid-sandbox` flags (auto-handled) |
| Frame generation OOM | Reduce resolution or deviceScaleFactor |
| User video clip corrupt | Skip clip, note in render log, continue with available assets |
| Render takes >5 min | Reduce frame count (lower fps or duration) |
| Fonts not loading | Check internet; frames use Google Fonts CDN |

## Performance Notes

- **30fps × 10s = 300 frames** — expect ~2-5 minutes render time with Puppeteer
- **Ken Burns via FFmpeg** (no Puppeteer) renders in seconds for simple zoom
- For long videos (>30s), consider rendering scenes separately and concatenating
- Clean up `_frames/` directory after assembly to reclaim disk space
