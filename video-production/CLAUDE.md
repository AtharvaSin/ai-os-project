# Video Production System — Claude Code Context

## System Overview

This is the **unified video production system** for the AI Operating System. It is a single Remotion workspace that produces programmatic video content for all three projects — Bharatvarsh, AI&U YouTube, and AI OS demos — using a shared component library and per-project brand configuration.

It sits inside the AI OS monorepo at `video-production/` and connects to the broader content pipeline: Bharatvarsh posts flow from `content-pipelines/bharatvarsh/`, AI&U scripts live in `aiu-youtube/`, and rendered outputs return to their respective pipelines.

**Key design principle:** One Remotion install, one common component library, three isolated brand configurations. Components are brand-agnostic; they accept `BrandTokens` and render accordingly. No component ever hardcodes a color, font, or effect.

---

## Architecture

### Single Remotion Install

All video rendering runs through one `remotion.config.ts` with Tailwind v4 enabled. Projects register their compositions in `src/projects/{id}/compositions/`. The Remotion Studio (`npm run dev`) loads all compositions across all projects in a single preview environment.

### Common Library (`src/common/`)

Shared components that accept `BrandTokens` as a prop. These are the building blocks: typography, effects, animations, transitions, data visualizations, layout primitives, and media components. Every component is project-agnostic by design.

### Project Isolation (`src/projects/{id}/`)

Each project has its own directory with project-specific compositions, scenes, and components. Project-specific components live here and can import from `@common/*`. When a project-specific component proves useful across projects, it gets **graduated** to `src/common/`.

### Workspace System (`workspace/`)

The workspace is the active working area for the current video being produced. It contains:
- `current.json` — workspace state (which project/video/phase is active)
- `active/components/` — draft components being developed for the current video
- `active/assets/` — images and audio for the current video
- `active/renders/preview/` — preview renders (low quality, fast)
- `active/renders/final/` — production renders
- `archive/` — completed video workspaces, moved here after delivery

### Project Configuration (`projects/{id}/project.yaml`)

Each project has a `project.yaml` that defines everything about its brand: colors, typography, effects, art style, content pillars, formats, timing, CTA, and pipeline paths. This file is the **single source of truth** for a project's visual identity in the video system.

---

## BrandTokens Contract

The `BrandTokens` interface is the universal bridge between project configuration and common components. It is defined in `src/common/utils/brand-tokens.ts`.

```typescript
interface BrandTokens {
  bg:      { primary: string; surface: string; elevated: string };
  accent:  { primary: string; secondary?: string; gradient?: string };
  text:    { primary: string; secondary: string; muted: string };
  border:  string;
  fonts:   { display: string; body: string; mono: string; narrative?: string };
  fontSizes: { display: number; h1: number; h2: number; body: number; caption: number; label: number };
  effects: {
    filmGrain?: { baseFrequency: number; opacity: number };
    vignette?:  { opacity: number };
    glow?:      { color: string; spread: number };
    scanLines?: { opacity: number };
  };
  borderRadius: number;
  accentBarWidth: number;
}
```

**Every common component** must accept `tokens: BrandTokens` as a prop. Project-specific code builds a `BrandTokens` object from its `project.yaml` and passes it down. This is how a single `<TextPunch>` component renders in Mustard Gold Bebas Neue for Bharatvarsh and Amber Space Grotesk for AI&U without any conditional logic inside the component itself.

### Building Tokens from project.yaml

Each project should have a `tokens.ts` file in `src/projects/{id}/` that reads the project.yaml colors/fonts and constructs a `BrandTokens` object. Pillar-specific overrides (e.g., Bharatsena cyan vs Akakpen orange) are applied by merging pillar colors over the base tokens.

---

## Directory Layout

```
video-production/
├── CLAUDE.md                         # You are here
├── package.json                      # Remotion 4.0.438 + React 19 + tooling
├── remotion.config.ts                # Tailwind v4, JPEG output, xxhash64
├── tsconfig.json                     # Paths: @common/*, @projects/*, @engine/*
├── .gitignore                        # node_modules, renders, workspace assets
│
├── projects/                         # Project configuration (YAML)
│   ├── _template/project.yaml        # Copy this for new projects
│   ├── bharatvarsh/project.yaml      # Context B — dystopian cinematic
│   ├── aiu/project.yaml              # Context C — educational vibrant
│   └── ai-os/project.yaml            # Context A — command-center electric
│
├── src/
│   ├── index.ts                      # Remotion entry point
│   ├── index.css                     # Global Tailwind import
│   │
│   ├── common/                       # Shared component library
│   │   ├── animations/               # Easing, springs, interpolations, sequencing
│   │   ├── effects/                  # FilmGrain, Vignette, ScanLines, GlowPulse, NoiseTexture, MotionBlur
│   │   ├── typography/               # TextPunch, TypewriterText, WordReveal
│   │   ├── transitions/              # Presets, durations
│   │   ├── data-viz/                 # (Future: charts, gauges, progress bars)
│   │   ├── layout/                   # (Future: grids, split screens, letterbox)
│   │   ├── media/                    # (Future: KenBurns, video loops, audio wrappers)
│   │   └── utils/                    # brand-tokens, audio, colors, fonts, subtitles, timing
│   │
│   ├── projects/                     # Project-specific code
│   │   ├── bharatvarsh/              # Compositions, scenes, project components
│   │   │   └── compositions/
│   │   ├── aiu/                      # Compositions, scenes, components, thumbnails
│   │   │   ├── components/
│   │   │   ├── compositions/
│   │   │   ├── scenes/
│   │   │   └── thumbnails/
│   │   └── ai-os/                    # Compositions for demo videos
│   │
│   └── engine/                       # (Future: render engine, CLI logic, YAML parser)
│
├── assets/                           # Static assets (checked into git)
│   ├── common/                       # Shared across projects
│   │   ├── luts/                     # Color lookup tables
│   │   ├── music/                    # Background tracks
│   │   ├── sfx/                      # Sound effects
│   │   └── textures/                 # Noise, paper, grain textures
│   ├── bharatvarsh/
│   │   ├── brand/                    # Logos, faction insignia
│   │   ├── content/                  # AI-generated art for posts
│   │   └── prompts/                  # Art prompt templates
│   ├── aiu/
│   │   ├── brand/                    # Logo, avatar, channel art
│   │   ├── content/                  # B-roll, diagrams, screenshots
│   │   ├── music/                    # Pillar-specific tracks
│   │   └── sfx/                      # UI sounds, transitions
│   └── ai-os/
│       └── brand/                    # AI OS logos, icons
│
├── workspace/                        # Active working area (gitignored renders)
│   ├── current.json                  # Workspace state tracker
│   ├── active/
│   │   ├── components/               # Draft components for current video
│   │   ├── assets/
│   │   │   ├── images/               # Working images (gitignored)
│   │   │   └── audio/                # Working audio (gitignored)
│   │   └── renders/
│   │       ├── preview/              # Quick preview renders (gitignored)
│   │       └── final/                # Production renders (gitignored)
│   └── archive/                      # Completed video workspaces
│
├── cli/                              # CLI tools (tsx scripts)
│   ├── render.ts                     # Render command
│   ├── new-video.ts                  # Scaffold new video
│   ├── graduate.ts                   # Promote workspace component to common
│   ├── catalog.ts                    # List all compositions
│   └── bhv-generate.ts              # Bharatvarsh-specific generation
│
├── templates/                        # Video template presets
├── docs/                             # Architecture docs, ADRs
└── public/                           # Remotion public directory
```

---

## Available Components

### Effects (`src/common/effects/`)

| Component        | Props (beyond tokens) | Description |
|------------------|-----------------------|-------------|
| `FilmGrain`      | `baseFrequency`, `opacity` | SVG feTurbulence grain overlay |
| `Vignette`       | `opacity` | Radial gradient edge darkening |
| `ScanLines`      | `opacity` | Horizontal scan line overlay |
| `GlowPulse`      | `color`, `spread` | Animated accent glow |
| `NoiseTexture`   | — | Subtle noise texture layer |
| `MotionBlur`     | — | Directional motion blur effect |

### Typography (`src/common/typography/`)

| Component        | Props (beyond tokens) | Description |
|------------------|-----------------------|-------------|
| `TextPunch`      | `text`, `size`, `delay` | Scale-in text with spring physics |
| `TypewriterText` | `text`, `speed`, `cursor` | Character-by-character reveal |
| `WordReveal`     | `words`, `stagger` | Word-by-word entrance animation |

### Animations (`src/common/animations/`)

| Module           | Exports | Description |
|------------------|---------|-------------|
| `easing.ts`      | Custom easing curves | Beyond standard Remotion easings |
| `springs.ts`     | Spring presets | Reusable spring configurations |
| `interpolations.ts` | Composite interpolations | Multi-property animation helpers |
| `sequencing.ts`  | Timing utilities | Staggered entrance, cascades |

### Transitions (`src/common/transitions/`)

| Module           | Exports | Description |
|------------------|---------|-------------|
| `presets.ts`     | Transition presets | Fade, slide, wipe, dissolve |
| `durations.ts`   | Duration constants | Standardized transition lengths |

### Utilities (`src/common/utils/`)

| Module           | Exports | Description |
|------------------|---------|-------------|
| `brand-tokens.ts` | `BrandTokens`, `DEFAULT_FONT_SIZES` | The universal brand contract |
| `audio.ts`       | Audio normalization helpers | Loudness targeting, limiter |
| `colors.ts`      | Color manipulation | Alpha, lighten, darken, gradients |
| `fonts.ts`       | Font loading helpers | Google Fonts integration |
| `subtitles.ts`   | Subtitle parsing/rendering | SRT/VTT processing |
| `timing.ts`      | Frame/time conversion | FPS-aware utilities |

---

## Project Configuration

### How project.yaml Works

Each `projects/{id}/project.yaml` is the authoritative brand definition for that project. It contains:

| Section | Purpose |
|---------|---------|
| `brand.colors` | All color tokens — backgrounds, accents, text, border |
| `brand.typography` | Google Fonts family names for display, body, mono, narrative |
| `brand.effects` | Which post-processing effects are enabled and their parameters |
| `art_style` | AI image generation style, descriptors, negative prompts |
| `content_pillars` | Sub-brands with their own color palettes and moods |
| `content_channels` | Content format types with intro styles and overlays |
| `formats` | Output dimensions (width, height, fps) per format |
| `timing` | Duration defaults for intros, end cards, slides |
| `cta` | Call-to-action URL, display text, logo path |
| `notebooks` | NotebookLM notebooks for context (lore, strategy, research) |
| `pipeline` | Paths to content calendar, rendered output, and prompts |

### Adding a New Project

1. Copy `projects/_template/project.yaml` to `projects/{new-id}/project.yaml`
2. Fill in all brand details
3. Create `src/projects/{new-id}/compositions/` directory
4. Create `assets/{new-id}/brand/` directory and add logos
5. Build a `tokens.ts` in `src/projects/{new-id}/` that maps YAML values to `BrandTokens`
6. Register compositions in `src/index.ts`

---

## Video Production Workflow

Every video follows this 6-phase pipeline. The current phase is tracked in `workspace/current.json`.

### Phase 1: INITIATE
- Read `project.yaml` for the target project
- Create workspace entry in `current.json`
- Identify content source (calendar post, script, brief)
- Set format (reel, landscape, square, etc.) and target duration

### Phase 2: BRIEF
- Gather all content: headline, body text, captions, CTA
- Identify visual requirements: how many scenes, what imagery needed
- Define the emotional arc and pacing
- If project has `notebooks` configured, query NotebookLM for context
- For Bharatvarsh: run lore consistency check, apply spoiler rules

### Phase 3: DESIGN
- Design the scene breakdown: which components, in what order
- Select transitions between scenes
- Choose which effects to apply (from project.yaml `effects`)
- Define the color palette (base tokens + any pillar override)
- Draft art prompts if AI-generated images are needed

### Phase 4: ASSETS
- Generate or source all visual assets (AI art, screenshots, B-roll)
- Place assets in `workspace/active/assets/images/`
- Source or generate audio (music, SFX, voiceover)
- Place audio in `workspace/active/assets/audio/`
- Validate all assets are correct resolution and format

### Phase 5: COMPOSE
- Write Remotion compositions in `workspace/active/components/`
- Wire up `BrandTokens` from the active project
- Build scene components, connect transitions
- Add effects layer (film grain, vignette, etc. per project.yaml)
- Test in Remotion Studio (`npm run dev`)

### Phase 6: RENDER
- Preview render for review (`workspace/active/renders/preview/`)
- Iterate on feedback
- Production render (`workspace/active/renders/final/`)
- Apply audio loudness normalization

### Phase 7: REVIEW (post-render)
- Verify output meets brand guidelines
- Check audio levels reach target loudness
- Confirm correct dimensions and duration
- Move to delivery (pipeline rendered path or manual export)
- Archive workspace to `workspace/archive/`

---

## Auto-Invocation Rules

These skills fire automatically based on context. Do not wait for the user to invoke them.

| Skill | Trigger Condition | Purpose |
|-------|-------------------|---------|
| `brand-guidelines` | **Always** when producing any visual output | Ensures brand tokens are correctly applied |
| `remotion-best-practices` | When writing or modifying any `.tsx` Remotion component | Correct Remotion patterns, `useCurrentFrame()` usage |
| `bharatvarsh-art-prompts` | When Bharatvarsh project is active AND image generation needed | Jim Lee style, lore-canonical art prompts |
| `bharatvarsh` | When Bharatvarsh project is active AND content/lore needed | Lore checks, spoiler rules, character voice |
| `creative-writer` | When generating headlines, captions, or narrative text | Quality copywriting for any project |
| `content-gen` | When generating non-Bharatvarsh content (AI&U, AI OS) | LinkedIn posts, video descriptions, scripts |
| `infographic` | When the video includes data visualization or diagrams | Charts, flows, metric cards |
| `notebooklm` | When `project.yaml` has `notebooks` configured | Pull context from relevant notebooks |
| `bharatvarsh-video-renderer` | When rendering Bharatvarsh video content specifically | Full pipeline: calendar read, render, package |
| `bharatvarsh-post-renderer` | When rendering Bharatvarsh static post content | Image compositing pipeline |

---

## Commands

All commands are run from the `video-production/` directory.

| Command | Script | Description |
|---------|--------|-------------|
| `npm run dev` | `remotion studio` | Open Remotion Studio for live preview |
| `npm run build` | `remotion bundle` | Bundle for production deployment |
| `npm run render` | `tsx cli/render.ts` | Render a specific composition to file |
| `npm run new-video` | `tsx cli/new-video.ts` | Scaffold a new video (prompts for project, format) |
| `npm run graduate` | `tsx cli/graduate.ts` | Promote a workspace component to `src/common/` |
| `npm run catalog` | `tsx cli/catalog.ts` | List all registered compositions across projects |
| `npm run bhv-gen` | `tsx cli/bhv-generate.ts` | Bharatvarsh-specific video generation from pipeline |
| `npm run typecheck` | `tsc --noEmit` | TypeScript type checking |
| `npm run lint` | `eslint src && tsc --noEmit` | Lint + type check |

### Render Examples

```bash
# Preview render (720p, lower quality, fast)
npx remotion render src/index.ts BharatvarshReel --width=540 --height=960 --quality=50

# Production render (full resolution)
npx remotion render src/index.ts BharatvarshReel --codec=h264 --quality=100

# Render specific frames for review
npx remotion still src/index.ts BharatvarshReel --frame=60
```

---

## Component Graduation

When a component created in `workspace/active/components/` proves reusable:

1. **Identify** — The component works for the current project but would be useful elsewhere
2. **Generalize** — Replace any hardcoded values with `BrandTokens` props
3. **Test** — Verify it renders correctly with at least two different project token sets
4. **Move** — Run `npm run graduate` or manually move to appropriate `src/common/` subdirectory
5. **Export** — Add to the subdirectory's `index.ts` barrel export
6. **Update** — Update this CLAUDE.md's component table
7. **Clean** — Remove the copy from `workspace/active/components/`

Graduation criteria:
- Accepts `tokens: BrandTokens` (no hardcoded colors/fonts)
- Has no project-specific logic (no `if (project === 'bharatvarsh')`)
- Is stateless or uses only `useCurrentFrame()` / `useVideoConfig()` for state
- Has a clear, descriptive name
- Is under 200 lines

---

## Rules

### Brand Compliance
- **Always** read `project.yaml` before producing any visual output
- **Always** apply `BrandTokens` to common components — never pass raw color strings
- **Never** hardcode colors, font families, or effect parameters in components
- Film grain, vignette, scan lines, glow: toggle and parameterize from `project.yaml` `effects` config
- Bharatvarsh display font (Bebas Neue) is **ALL CAPS, non-negotiable**
- Bharatvarsh art style is **Jim Lee modern American comic book** — no anime, no 3D, no watercolor

### Remotion Patterns
- All animation **must** be driven by `useCurrentFrame()` and `interpolate()` — never `requestAnimationFrame`
- Never use `setTimeout`, `setInterval`, or any time-based API in components
- Use `spring()` from Remotion for physics-based animation
- Use `Sequence` for temporal composition, not conditional rendering on frame numbers
- Use `AbsoluteFill` for full-frame layers (effects, overlays, backgrounds)
- Use `staticFile()` for referencing assets in the `public/` directory
- Register all compositions in `src/index.ts` with explicit `durationInFrames`, `width`, `height`, `fps`

### Audio
- All video exports must apply **+10dB boost with limiter** to reach approximately **-16dB mean volume**
- Use the utilities in `src/common/utils/audio.ts` for loudness processing
- VP9/ProRes alpha is broken on this system — always render **opaque MP4** with embedded backgrounds
- Never export transparent video

### Code Quality
- TypeScript strict mode — no `any` types
- One component per file, PascalCase filenames
- Import order: React, Remotion, third-party, @common/*, @projects/*, local
- Use path aliases: `@common/`, `@projects/`, `@engine/`
- Keep components under 200 lines — split into sub-components if larger
- Run `npm run typecheck` before committing

### Pipeline Integration
- Bharatvarsh rendered outputs go to `content-pipelines/bharatvarsh/rendered/post-N/` — never to `docs/temp`
- AI&U rendered outputs go to the path specified in `aiu/project.yaml` pipeline config
- Always update `workspace/current.json` when starting/completing a video
- Archive completed workspaces to `workspace/archive/`

---

## Asset Paths

### Common Assets (`assets/common/`)
Shared across all projects:
- `luts/` — Color grading lookup tables
- `music/` — Royalty-free background music
- `sfx/` — Transition sounds, UI clicks, whooshes
- `textures/` — Noise, paper, film grain textures

### Bharatvarsh Assets (`assets/bharatvarsh/`)
- `brand/` — Bharatsena logo, faction insignia, watermarks
- `content/` — AI-generated character art, location art, scene illustrations
- `prompts/` — Art prompt template JSON files for each content channel

### AI&U Assets (`assets/aiu/`)
- `brand/` — AI&U logo, avatar images, channel banner
- `content/` — Screenshots, diagrams, B-roll footage
- `music/` — Pillar-specific background tracks (warm, energetic, systematic)
- `sfx/` — Notification sounds, typing sounds, completion chimes

### AI OS Assets (`assets/ai-os/`)
- `brand/` — AI OS logo, system icons, dashboard screenshots

### External Pipeline Assets
For Bharatvarsh, the content pipeline stores additional assets outside this directory:
- Calendar: `../content-pipelines/bharatvarsh/calendar/content_calendar.csv`
- Rendered posts: `../content-pipelines/bharatvarsh/rendered/`
- Prompt templates: `../content-pipelines/bharatvarsh/prompts/`

For AI&U, the editorial calendar lives at:
- Calendar: `../aiu-youtube/knowledge/editorial-calendar.md`

---

## TypeScript Path Aliases

Configured in `tsconfig.json`:

| Alias | Resolves To | Use For |
|-------|-------------|---------|
| `@common/*` | `src/common/*` | Shared components, utils, effects |
| `@projects/*` | `src/projects/*` | Project-specific compositions and components |
| `@engine/*` | `src/engine/*` | Render engine, YAML parsing, CLI internals |

---

## Quick Reference

### Starting a New Video
1. Read the target `project.yaml`
2. Update `workspace/current.json` with project ID, video ID, phase
3. Follow the 6-phase workflow (INITIATE through REVIEW)
4. Auto-invoke relevant skills per the rules table above

### Checking What Exists
- All compositions: `npm run catalog`
- Workspace state: read `workspace/current.json`
- Project config: read `projects/{id}/project.yaml`
- Available components: browse `src/common/` subdirectories

### Before Any Visual Output
1. Read `project.yaml` for the active project
2. Build `BrandTokens` from the YAML values
3. Check which effects are enabled
4. Invoke `brand-guidelines` skill
5. If Remotion code: invoke `remotion-best-practices` skill
6. If Bharatvarsh: invoke `bharatvarsh-art-prompts` / `bharatvarsh` skills as needed
