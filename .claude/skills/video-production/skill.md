---
name: video-production
description: "Unified video production pipeline for all AI OS projects. Manages the full lifecycle from brief to final render: initiates workspace, applies project brand, suggests animation components conversationally, queries NotebookLM for references, invokes sub-skills for copywriting and art direction, builds Remotion compositions, renders multi-format outputs, and graduates reusable components to the common library. Use this skill when the user mentions: 'new video', 'start video production', 'continue the video', 'video status', 'preview', 'render final', 'archive video', 'graduate component', 'what video am I working on', 'render next post as video', 'video for [project]', 'what components do I have', 'component library', or any video production workflow. Also trigger when the user says 'render a reel', 'make a trailer', 'create video graphics', 'design a motion piece', or references video-production/ directory."
---

# Video Production System

> **Scope:** Manages the complete lifecycle of video production across ALL AI OS projects. Each project (Bharatvarsh, AI&U, AI OS, or any new project) has its own brand configuration in `video-production/projects/{id}/project.yaml`. The system uses a single Remotion installation with a shared common component library and project-specific compositions.
>
> **Architecture:** `video-production/` is the unified directory. `src/common/` contains brand-neutral components. `src/projects/` contains project-specific code. `workspace/active/` is the one-at-a-time production workspace.

---

## Auto-Invocation Rules

These capabilities are embedded — the user never needs to ask for them. Invoke automatically when conditions are met:

| Condition | Auto-Invoke |
|-----------|-------------|
| Any visual output being produced | Load `brand-guidelines` skill + read project.yaml tokens |
| Writing Remotion composition code | Load `remotion-best-practices` skill |
| Bharatvarsh project is active | Run spoiler safety scan, use `bharatvarsh` lore skill for consistency |
| AI art prompts needed (Bharatvarsh) | Use `bharatvarsh-art-prompts` skill with project art_style config |
| Headlines, captions, or copy needed | Use `creative-writer` skill (fiction) or `content-gen` skill (marketing) |
| Data visualization component needed | Use `infographic` skill for design guidance |
| Research or reference needed | Query NotebookLM using project.yaml `notebooks` config |
| New component being created | Enforce BrandTokens interface contract from `src/common/utils/brand-tokens.ts` |
| Brand consistency check needed | Apply rules from ASR Visual Studio `context/brand-system.md` |

---

## Workspace State

The active video state is tracked in `video-production/workspace/current.json`:

```json
{
  "status": "active | idle",
  "projectId": "bharatvarsh | aiu | ai-os | {custom}",
  "videoId": "bhv-reel-kahaan-001 | aiu-vid02-s1-g01 | {custom-id}",
  "phase": "brief | design | assets | compose | render | review",
  "startedAt": "2026-03-27T14:30:00Z"
}
```

Always read this file first to understand current state. If status is "active", offer to continue the current video or archive it before starting a new one.

---

## Phase 0: INITIATE

**Trigger:** User says "new video for {project}" or "start video production" or "render next {project} video"

**Steps:**
1. Read `video-production/workspace/current.json`
2. If active video exists → ask: "You have an active video ({videoId}). Continue it, or archive and start fresh?"
3. Load `video-production/projects/{projectId}/project.yaml` — this is the brand source of truth
4. Create workspace: ensure `video-production/workspace/active/` directories exist
5. Auto-invoke `brand-guidelines` skill — the brand context (A/B/C) comes from project.yaml
6. Update `workspace/current.json` with new video state
7. Proceed to Phase 1

---

## Phase 1: BRIEF

**For Bharatvarsh:**
1. Read content calendar CSV from `project.yaml → pipeline.calendar_path`
2. Find next post with status = "planned" or "prompt_ready"
3. Extract: post_id, topic, hook, story_angle, content_channel, visual_direction, caption_text
4. Run spoiler safety scan against protected plot points (Kacha identity, Pratap orchestration, Kahaan's choice, power transfer mechanics)
5. Query NotebookLM (bhv-lore notebook) for relevant lore context

**For AI&U:**
1. Read script/chapter from `aiu-youtube/content/video-{NN}/`
2. Identify graphics needed per chapter: scene types, overlays, diagrams, B-roll
3. Determine pillar and load pillar-specific tokens
4. Query NotebookLM (aiu-content notebook) for topic research

**For new/custom projects:**
1. Interactively collect: topic, audience, format, duration, tone, key message
2. If notebooks configured → query for context

**Output:** Write `video-production/workspace/active/brief.md`

---

## Phase 2: DESIGN (Conversational + References)

This phase is conversational, not mechanical. Claude reads the brief and has a design discussion with the user.

**Component Discovery:**
1. Read the brief and identify visual needs (what animations, effects, text styles, data viz, etc.)
2. Check `video-production/src/common/` for matching components
3. Check `video-production/src/projects/{projectId}/` for project-specific matches
4. For matches → describe what exists, suggest usage with token configuration
5. For gaps → suggest building new components, reference closest existing pattern
6. Reference `knowledge-base/ANIMATION_STYLE_TAXONOMY.md` for animation style options

**Research & References:**
- Query NotebookLM for visual tone references if project has notebooks configured
- Suggest AI art prompt directions using project.yaml `art_style` config
- Auto-invoke `creative-writer` or `content-gen` for headline/caption options
- Auto-invoke `bharatvarsh-art-prompts` for Bharatvarsh image prompts

**Output:** Write `video-production/workspace/active/design.md` with:
- Component plan (which existing components to use, which to build)
- Art direction (image prompt suggestions, style references)
- Animation rationale (why specific styles fit the brief's mood)
- Copy options (headline variants, caption drafts)

---

## Phase 3: ASSETS

1. **Image preparation:**
   - If AI art needed → provide prompts using project.yaml `art_style` config
   - User generates images externally (OpenArt, Flow, Midjourney, etc.)
   - User places images in `video-production/workspace/active/assets/images/`

2. **Audio preparation:**
   - Browse `video-production/assets/common/sfx/` for sound effects
   - Browse `video-production/assets/{projectId}/music/` for background tracks
   - User places custom audio in `workspace/active/assets/audio/`

3. **Asset manifest:**
   - Write `video-production/workspace/active/assets/manifest.json` tracking all assets
   - Include: file paths, dimensions, duration (audio), purpose

---

## Phase 4: COMPOSE

1. **Build custom components** (if design phase identified gaps):
   - Create in `video-production/workspace/active/components/`
   - MUST accept `tokens: BrandTokens` prop for brand-neutral styling
   - Auto-invoke `remotion-best-practices` for all Remotion code
   - All animation driven by `useCurrentFrame()` — never `requestAnimationFrame`

2. **Generate timeline:**
   - Bharatvarsh: Use `video-production/cli/bhv-generate.ts` pattern
   - AI&U: Build input JSON with chapters/scenes/overlays
   - Custom: Interactive timeline construction
   - Write to `video-production/workspace/active/timeline.json`

3. **Register composition:**
   - Add temporary composition to `src/Root.tsx` for the active video
   - User previews with `cd video-production && npm run dev`

---

## Phase 5: RENDER

1. **Preview render** (fast, low quality):
   ```bash
   cd video-production
   npx remotion render {comp-id} workspace/active/renders/preview/{comp-id}.mp4 --quality 60
   ```

2. **Production render** (per format from project.yaml):
   ```bash
   npx remotion render {comp-id} workspace/active/renders/final/{comp-id}-{format}.mp4 \
     --codec h264 --crf 18 --pixel-format yuv420p
   ```

3. **Post-processing:**
   - Generate thumbnails if applicable
   - Generate per-platform captions
   - Audio loudness: apply +10dB boost with limiter to reach ~-16dB mean volume

---

## Phase 6: REVIEW & ARCHIVE

1. **Quality checklist** (auto-generated from project.yaml):
   - [ ] Brand colors match project tokens
   - [ ] CTA present (if project.yaml cta.url is set)
   - [ ] Film grain / vignette / effects applied per project effects config
   - [ ] Audio levels normalized
   - [ ] No hardcoded colors (all from BrandTokens)
   - [ ] Text readable at target resolution

2. **Component graduation:**
   - Review components in `workspace/active/components/`
   - Ask: "Should any of these be promoted to the common library or project library?"
   - If yes → copy to `src/common/{category}/` or `src/projects/{id}/`
   - Update barrel exports
   - Log to `video-production/docs/GRADUATION_LOG.md`

3. **Archive:**
   - Move `workspace/active/` → `workspace/archive/{projectId}-{videoId}/`
   - Reset `workspace/current.json` to idle state
   - Update pipeline status (CSV for Bharatvarsh, etc.)

---

## Sub-Commands

The user can invoke specific phases directly:

| Command | Action |
|---------|--------|
| "video status" / "what am I working on" | Read and display `workspace/current.json` |
| "new video for {project}" | Phase 0 + 1 |
| "design the video" | Phase 2 |
| "prep assets" | Phase 3 |
| "compose" / "build the composition" | Phase 4 |
| "preview" / "render preview" | Phase 5 (preview only) |
| "render final" | Phase 5 (production) |
| "review" / "archive this video" | Phase 6 |
| "graduate components" | Phase 6 graduation only |
| "what components do I have" | List components in `src/common/` by category |

---

## Project Management

### Adding a New Project
1. Copy `video-production/projects/_template/project.yaml` to `projects/{new-id}/project.yaml`
2. Fill in brand colors, typography, art style, content pillars
3. Create `src/projects/{new-id}/` with `tokens.ts` and `overrides.ts`
4. The BrandTokens factory makes common components instantly available

### Available Components (Common Library)

**Animations:** springs (5 presets), easing (5 presets), useSlideIn, useScaleIn, useFadeIn, useSlamIn, stagger helpers

**Effects:** FilmGrain, Vignette, ScanLines, GlowPulse, NoiseTexture, MotionBlur (4 presets)

**Transitions:** fade, slide, wipe, flip, clockWipe + 4 duration presets (quick/standard/slow/cinematic)

**Typography:** TypewriterText, TextPunch, WordReveal, CountUp, KaraokeSubtitle

**Layout:** SafeArea, AccentBar, LetterboxBars, ProgressBar, Watermark

**Data-viz:** StatCard

**Media:** KenBurnsImage

---

## Connectors Used

- **MCP Gateway:** bharatvarsh module (lore queries), content posts (pipeline status)
- **NotebookLM:** via project.yaml notebooks config (Tier 3 local STDIO)
- **Google Drive:** optional upload of rendered outputs via MCP store_asset
- **Skills:** brand-guidelines, remotion-best-practices, bharatvarsh-art-prompts, bharatvarsh (lore), creative-writer, content-gen, infographic

---

## Quality Rules

1. **Never hardcode colors** — always use BrandTokens from project.yaml
2. **All animation via useCurrentFrame()** — never requestAnimationFrame or useFrame()
3. **Film grain / vignette / effects** come from project.yaml effects config, not inline
4. **Audio loudness** must reach ~-16dB mean (apply +10dB boost with limiter)
5. **Bharatvarsh CTA** is always `www.welcometobharatvarsh.com` (with www)
6. **One video at a time** — always check workspace/current.json before starting
7. **Spoiler safety** for Bharatvarsh — protected plot points must not be revealed
