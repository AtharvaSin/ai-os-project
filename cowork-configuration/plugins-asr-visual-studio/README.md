# ASR Visual Studio — Claude Cowork Plugin

Programmatic visual content creation for Atharva's three-context brand system. Fire-and-forget: describe what you want, optionally provide custom images, come back to rendered files.

## Architecture

```
asr-visual-studio/
├── .claude-plugin/plugin.json     ← Plugin manifest
├── engine/                        ← Core rendering modules (the brains)
│   ├── renderer.js                ← Image: HTML builder, Puppeteer render, Sharp composite
│   ├── video-renderer.js          ← Video: Frame generation, FFmpeg assembly
│   └── mcp-bridge.js              ← Hybrid routing: local vs MCP Gateway
├── skills/                        ← Skill instructions (what Claude reads)
│   ├── create-image/SKILL.md      ← Static image generation
│   ├── create-video/SKILL.md      ← Video generation
│   └── create-social-pack/SKILL.md← Multi-platform batch generation
├── commands/
│   └── render.md                  ← /render quick-command
├── agents/
│   └── renderer.md                ← Parallel rendering sub-agent
├── context/
│   └── brand-system.md            ← Brand token reference (A/B/C)
├── templates/                     ← HTML template library (extend over time)
│   ├── context-a/                 ← AI OS templates
│   ├── context-b/                 ← Bharatvarsh templates
│   ├── context-c/                 ← Portfolio templates
│   └── shared/                    ← Cross-context utilities
├── assets/                        ← Runtime assets (fonts, textures — gitignored)
│   ├── fonts/.gitkeep
│   └── textures/.gitkeep
├── scripts/                       ← Utility scripts
├── .gitignore                     ← Excludes output/, node_modules/, generated assets
└── README.md                      ← This file
```

## What Gets Pushed to GitHub (Workflow Code Only)

The `.gitignore` ensures ONLY workflow logic goes to the repo:

**Pushed:** engine/*.js, skills/*/SKILL.md, commands/*.md, agents/*.md, context/*.md, templates/**/*.html, .claude-plugin/plugin.json, README.md, .gitignore

**NOT pushed:** output/, node_modules/, rendered images/videos, downloaded fonts, user-uploaded assets, render logs

## Skills

| Skill | Trigger | Output |
|-------|---------|--------|
| `create-image` | "Create a thumbnail", "social card", "banner", "poster" | PNG/WebP via HTML+Puppeteer |
| `create-video` | "Create a video", "book trailer", "motion graphic", "promo clip" | MP4 via FFmpeg + frame generation |
| `create-social-pack` | "Social pack", "content for all platforms" | 4-6 platform-optimized images |

## Commands

| Command | Usage |
|---------|-------|
| `/asr-visual-studio:render` | Quick-render from a one-line brief |

## Brand Contexts

Every output is branded. Context is auto-detected from topic or explicitly specified:

- **Context A** (AI OS) — Dark, electric emerald `#00D492`, DM Sans
- **Context B** (Bharatvarsh) — Dystopian-cinematic, mustard `#F1C232`, Bebas Neue + film grain
- **Context C** (Portfolio) — Modern clean, violet `#8b5cf6` / coral `#f97316`, Inter

## Rendering Pipeline

```
Brief → Parse → Route Decision → Render → Deliver
                    │
         ┌─────────┴─────────┐
         │                    │
    LOCAL RENDER          MCP GATEWAY
    (Puppeteer/FFmpeg)    (render_template / generate_image)
         │                    │
    Complex layouts      Simple branded templates
    Custom compositions  AI-generated imagery
    Video content        Auto-uploads to Drive
```

## Installation

### Option A: Local Plugin (development)
```bash
# In Claude Desktop Cowork, point at this folder:
# Settings → Plugins → Add local plugin → select asr-visual-studio/
```

### Option B: From GitHub (portable)
```bash
git clone https://github.com/AtharvaSin/asr-visual-studio.git
# Then add as local plugin in Claude Desktop Cowork
```

## Dependencies (installed at runtime)

The engine auto-installs missing packages when first used:

- **Puppeteer** — HTML-to-image rendering (auto-installed)
- **Sharp** — Image compositing (auto-installed)
- **FFmpeg** — Video processing (system binary, must be pre-installed)

## Quick Start Examples

### Conversational
> "Create a Bharatvarsh character reveal poster for Kahaan Arshad — dark, cinematic, with the uploaded character art as background"

### Command
> `/asr-visual-studio:render YouTube thumbnail for AI OS Sprint 11 update`

### Social Pack
> "Generate a social pack for the Bharatvarsh book launch — Instagram, LinkedIn, Twitter, YouTube thumbnail"

### Video
> "Create a 10-second text reveal promo video for Bharatvarsh with the title 'THE NEXUS AWAITS'"
