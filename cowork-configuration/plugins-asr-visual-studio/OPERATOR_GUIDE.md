# ASR Visual Studio — Operator Guide

## Quick Start (30-second version)

Open Cowork, make sure the plugin is loaded, then say:

> "Create a Bharatvarsh YouTube thumbnail with the title THE NEXUS AWAITS"

That's it. The workflow detects brand context B, picks the 1280×720 preset, applies Bebas Neue + mustard gold + film grain, renders via Puppeteer, and delivers a PNG.

---

## How the Workflow Operates

### Two Modes of Interaction

**1. Conversational Mode** — Describe what you want naturally.

| You say | What happens |
|---------|-------------|
| "Create a dark cinematic poster for Bharatvarsh chapter 5" | → Brand B auto-detected → `create-image` skill → instagram_feed preset (1080×1080) |
| "Make a 10-second promo video with the text BHARATVARSH" | → Brand B → `create-video` skill → text_reveal type → 1920×1080 MP4 |
| "Generate social media content for the AI OS sprint update" | → Brand A → `create-social-pack` skill → 5 platform assets |
| "YouTube thumbnail for my new AI agents video" | → Brand C → `create-image` skill → youtube_thumbnail preset (1280×720) |
| "Create an Instagram story for the book launch with the uploaded art" | → Brand B → `create-image` skill → instagram_story preset (1080×1920) + user image composited |

**2. Command Mode** — One-line briefs via `/render`.

```
/asr-visual-studio:render YouTube thumbnail for Bharatvarsh chapter reveal
/asr-visual-studio:render Instagram social pack for AI OS sprint 11
/asr-visual-studio:render 10s text reveal video for BHARATVARSH
/asr-visual-studio:render LinkedIn banner for AI & Cloud portfolio
/asr-visual-studio:render OG image for welcometobharatvarsh.com
```

### Brand Context Auto-Detection

You don't need to specify brand context — it's inferred from your topic:

| Topic keywords | Brand | Accent | Font | Effects |
|---------------|-------|--------|------|---------|
| Bharatvarsh, novel, chapter, lore, faction, character | **B** | Mustard `#F1C232` | Bebas Neue | Film grain, vignette |
| AI OS, dashboard, sprint, system, MCP, pipeline | **A** | Emerald `#00D492` | DM Sans | Glow effects |
| Portfolio, LinkedIn, career, professional, AI&U | **C** | Violet `#8b5cf6` | Inter | Clean, modern |

Override manually: "Create a Context A banner for..." or "...using brand B styling"

### Rendering Pipeline (What Happens Under the Hood)

```
Your brief
    ↓
Parse: asset type + brand context + dimensions + content
    ↓
Route decision (MCP bridge)
    ├── Simple branded template? → MCP Gateway render_template (fast, auto-uploads to Drive)
    ├── AI-generated image needed? → MCP Gateway generate_image (Gemini API)
    └── Custom/complex/video? → Local Puppeteer/FFmpeg rendering
    ↓
Brand tokens applied (fonts via Google Fonts CDN, colors, effects)
    ↓
Render → Output files + render-log.md
```

### What You Can Create

**Static Images (create-image skill)**

| Asset | Dimensions | Best for |
|-------|-----------|----------|
| YouTube Thumbnail | 1280×720 | Video thumbnails, high contrast |
| Instagram Feed | 1080×1080 | Square posts, character reveals |
| Instagram Story | 1080×1920 | Stories, swipe-up CTAs |
| LinkedIn Post | 1200×628 | Professional announcements |
| Twitter/X Post | 1600×900 | Engagement posts |
| OG Image | 1200×630 | Website link previews |
| Banner Wide | 1500×500 | Twitter/LinkedIn headers |
| A4 Poster | 2480×3508 | Print-quality posters |
| Cover Art | 3000×3000 | Album/book cover art |

**Videos (create-video skill)**

| Type | Duration | Description |
|------|----------|-------------|
| text_reveal | 5-10s | Animated text fade-in with brand effects |
| ken_burns | 8-15s | Slow zoom/pan on image with text overlay |
| slideshow | 10-30s | Multi-image transitions |
| title_card | 3-5s | Branded intro/outro cards |
| promo_clip | 10-30s | Multi-element promotional clips |

**Social Packs (create-social-pack skill)**

One brief → 5 coordinated assets:
- Instagram Feed (1080×1080)
- Instagram Story (1080×1920)
- LinkedIn Post (1200×628)
- Twitter/X Post (1600×900)
- YouTube Thumbnail (1280×720)

Plus a `pack-preview.html` for visual review.

### Using Custom Images

Drop images into your working folder before running a render:

> "Create a Bharatvarsh poster using the uploaded character art as background"

The workflow:
1. Detects image files in the working directory
2. Converts them to data URLs for Puppeteer embedding
3. Composites them with brand-appropriate color grading
4. Adds text overlay with readability-safe contrast

### MCP Hybrid Mode

The workflow automatically decides when to use your AI OS MCP Gateway:

| Scenario | Route | Why |
|----------|-------|-----|
| Simple branded social post | MCP `render_template` | Faster, auto-uploads to Google Drive |
| AI-generated imagery | MCP `generate_image` | Needs Gemini API |
| Custom layout with CSS | Local Puppeteer | Full creative control |
| Video content | Local FFmpeg | No cloud video rendering |
| Image with user photos | Local Puppeteer | Needs local file access |

After local renders, you can optionally catalog them via MCP `store_asset` for your media library.

---

## Process Recipes

### Recipe 1: Bharatvarsh Marketing Campaign

```
Step 1: "Create a social pack for Bharatvarsh — THE NEXUS AWAITS, new chapter reveal"
        → Gets you 5 branded assets for all platforms

Step 2: "Now create a 10-second text reveal video with the same title for Reels"
        → Gets you a 9:16 MP4 with animated text + film grain

Step 3: "Make a YouTube thumbnail with the character art I uploaded"
        → Gets you a high-contrast 1280×720 thumbnail with the art composited
```

### Recipe 2: AI&U YouTube Episode

```
Step 1: "YouTube thumbnail for my video — Building AI Agents That Build Themselves"
        → Brand C, 1280×720, professional violet/coral styling

Step 2: "Create a LinkedIn post image for the same topic"
        → Brand C, 1200×628, adapted for professional audience

Step 3: "5-second title card video for the intro"
        → Brand C, 1920×1080, animated text reveal
```

### Recipe 3: AI OS Sprint Update

```
Step 1: "Social pack for AI OS Sprint 11 — Visual Content Engine shipped"
        → Brand A, all platforms, emerald accent + dark tech aesthetic

Step 2: "OG image for the blog post about the sprint"
        → Brand A, 1200×630, clean dashboard-style design
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "puppeteer not found" | Engine auto-installs on first run. If it fails: `npm install puppeteer` in the engine/ dir |
| "Chrome not found" | Set `CHROME_PATH` env variable to your Chrome executable path |
| Fonts look wrong | Check internet connection — fonts load from Google Fonts CDN |
| Video render is slow | 300 frames (30fps × 10s) takes 2-5 min. Reduce duration or fps for faster iteration |
| "ffmpeg not found" | Install FFmpeg: Windows → `choco install ffmpeg`, macOS → `brew install ffmpeg` |
| Output too large | Use WebP format for web delivery, reduce deviceScaleFactor from 2 to 1 |
