---
name: bharatvarsh-video-renderer
description: "End-to-end Bharatvarsh video content rendering pipeline. Reads the next pending post from the content calendar CSV, generates or accepts AI artwork, builds a branded Remotion timeline with Context B overlays (film grain, vignette, faction colors, channel-specific intros), renders multi-format videos (Instagram Reels 9:16, YouTube Shorts 9:16, Landscape Trailer 16:9) with animated text, ken burns backgrounds, and lead-gen end cards, then packages outputs and updates the calendar. Use this skill whenever the user mentions rendering Bharatvarsh video, video content, motion content, reels, shorts, trailers, video pipeline, animated posts, or wants to produce motion-based marketing assets from the Bharatvarsh content pipeline. Also trigger when the user says 'render next video', 'make a reel', 'create trailer', 'video for post', 'animate this post', or references BHV post IDs with video intent."
---

> **Infrastructure Update:** The Remotion video engine has been consolidated into `video-production/`. All Bharatvarsh compositions now live at `video-production/src/projects/bharatvarsh/`. Use `cd video-production && npm run dev` to preview. The brand configuration is at `video-production/projects/bharatvarsh/project.yaml`.

# Bharatvarsh Video Renderer

> **Scope:** Produces publish-ready video assets for Bharatvarsh content marketing. Each run takes a pending post from the content calendar through the full motion pipeline: image prompt/acceptance, Remotion timeline generation, branded video rendering across target formats (Reels, Shorts, Trailer), and status update.
>
> **Brand Context:** Always Context B (Bharatvarsh) — dystopian-cinematic, Bebas Neue titles, Mustard Gold #F1C232 accent, Obsidian backgrounds, film grain, vignette, faction-specific color tinting.
>
> **Relationship to Post Renderer:** This skill is the *motion companion* to `bharatvarsh-post-renderer`. The post renderer produces static PNG composites; this skill produces animated MP4 videos from the same content calendar. They share the same CSV, the same 3-axis taxonomy (story_angle × distillation_filter × content_channel), and the same brand system. They can run independently or together for a complete multi-format content package.

---

## Mandatory Brand Guidelines

These rules apply to EVERY video rendered by this skill. Do not skip any of them.

### 1. Website CTA — www.welcometobharatvarsh.com

The canonical URL is `www.welcometobharatvarsh.com` (with www prefix). It must appear in:
- **End cards:** Always. Rendered in Bebas Neue, Mustard Gold (#F1C232), centered, with "Read the full story" subtitle.
- **Intro cards (declassified_report and news_article channels):** Subtle watermark in the bottom-right corner (textMuted #718096, 18px Inter, 40% opacity).
- **Captions and descriptions:** Always included as the primary CTA link in every platform caption variant.

Use `www.welcometobharatvarsh.com` — never `welcometobharatvarsh.com` without the www, never shortened URLs.

### 2. Official Bharatsena Logo

The Bharatsena faction logo (golden inverted triangle containing an Ashoka Chakra wheel on navy background) is stored at:
```
video-production/public/brand/bharatsena-logo.jpeg
```

**Usage rules:**
- **Bharatsena-angle videos:** The logo MUST appear in the intro card (top-left or top-right corner, 80×80px with 8px margin, semi-transparent background badge).
- **End cards (all angles):** The logo appears as a small watermark (48×48px, bottom-left, 50% opacity) as a brand unifier across all faction content.
- **Rendering fidelity:** The golden triangle with Ashoka Chakra must render at its original proportions. Never stretch, crop, or alter the geometry. Use `object-fit: contain` when sizing.
- **Color accuracy:** The logo's gold (#F1C232 range) on navy (#0B2742) must be preserved exactly. Do NOT apply color tinting or faction overlays on top of the logo itself.

If the logo file is missing at the expected path, warn the user and ask them to place `bharatsena-logo.jpeg` in `video-production/public/brand/`.

### 3. Lead-Generation Intent

Every video produced by this skill exists to drive novel sales. The content must create curiosity without satisfying it — the payoff is reading the book. Specific rules:
- End every video with the website CTA (rule 1 above). No exceptions.
- Never resolve a mystery or answer a posed question in the video — leave the hook open.
- Caption text should end with a curiosity-gap line (e.g., "What happened in 2025 changed everything." not "In 2025, Pratap orchestrated...").
- The tone is "declassified glimpse into a world that already exists" — viewers should feel they're discovering something, not being marketed to.

---

## Input Modes

This skill supports three invocation patterns. Detect which mode applies from the user's message BEFORE starting the steps:

### Mode A — Sequential (no images provided)
The user says something like "render next video", "make a reel for the next post", or "create a trailer" without attaching images. Follow all steps in order: pick post → generate image prompts → wait for images → build timeline → render → package.

### Mode B — Images provided upfront
The user provides one or more image paths/uploads AND asks to render a specific post or "the next post" as video. Skip Step 2 (image prompt generation) entirely and go straight from Step 1 to Step 3.

**Detection cues:** File paths, uploaded images, or phrases like "I've got the images," "use these," "here's the art."

### Mode C — Render from existing post renderer output
The user says something like "animate this post" or "make a video from BHV-20260406-001" and images already exist in `content-pipelines/bharatvarsh/posts/{post_id}/`. Reuse the existing rendered images.

**Detection cues:** References to already-rendered posts, "animate the last post," "turn this into a video."

### Image Mapping Rules

- **Single image:** Used for all slides (different ken burns animations per slide create motion variety)
- **Multiple images (one per slide):** Matched by order to narration segments
- **User-specified mapping always wins.** If the user says "use X for slide 1 and Y for slide 2," follow that exactly.
- When in doubt about which image goes where, ask once — don't guess.

---

## Before Starting

Read these files to load the brand system and Remotion project context:

1. `video-production/src/bharatvarsh/constants.ts` — Brand tokens, faction colors, timing
2. `video-production/src/bharatvarsh/types.ts` — BharatvarshTimeline schema
3. Visual Studio brand context (if available):
   - `${PLUGIN_ROOT}/../asr-visual-studio/context/brand-system.md`
   - `${PLUGIN_ROOT}/../asr-visual-studio/preferences/visual-style.md`
4. Lore guard rails:
   - `knowledge-base/BHARATVARSH_CONTENT_LORE_RULES.md`
   - `knowledge-base/BHARATVARSH_TIMELINE.md`

Also verify that the video-production project has dependencies installed:
```bash
cd video-production && ls node_modules/.package-lock.json 2>/dev/null || npm install
```

---

## Step 1: Pick the Target Post

Read the content calendar CSV at `content-pipelines/bharatvarsh/calendar/content_calendar.csv` (relative to the project root).

Find the target post:
- **Default:** First row where `status` equals `planned` (case-insensitive)
- **If user specifies a post ID:** Find that exact row regardless of status
- **If user says "animate post X" and status is `rendered`:** That's fine — we're adding video to an already-rendered static post

If no eligible post is found, tell the user the pipeline is clear and stop.

**Determine the post number** — count the 1-indexed position of the target row among all non-empty data rows in the CSV (skip header row and blank rows). This becomes the canonical `post-N` identifier for all asset storage. For example, the 4th non-empty data row is `post-4`.

Extract these fields from the CSV row:

| Field | CSV Column | Used For |
|-------|-----------|----------|
| Post ID | `post_id` | Directory naming, timeline metadata |
| Campaign | `campaign` | Context |
| Story Angle | `story_angle` | Faction colors, intro tinting |
| Distillation Filter | `distillation_filter` | Mood/tone for image prompts |
| Content Channel | `content_channel` | Visual template (intro style, overlays) |
| Topic | `topic` | Title text in video |
| Hook | `hook` | Subtitle/tagline overlay |
| Caption Text | `caption_text` | Narration segments (animated text) |
| Lore Refs | `lore_refs` | Spoiler safety check |
| Visual Direction | `visual_direction` | AI image prompt source |
| Platforms | `platforms` | Target output formats |
| CTA Link | `cta_link` | End card URL |
| Hashtags | `hashtags` | End card / description |

Present a summary to the user:

```
Next post for video: [post_id]  (post-[N] in the pipeline)
Topic: [topic]
Channel: [content_channel] → [intro type]
Angle: [story_angle] → [faction colors]
Formats: Reel (9:16) + Trailer (16:9)
Estimated duration: [X]s
```

---

## Step 2: Generate Image Prompts (Mode A only)

### Narration Segmentation

Split `caption_text` into 4-8 narration segments at sentence boundaries. Each segment becomes one video slide. Target segment sizes:
- Short (≤5 words): 2 seconds display time
- Medium (6-15 words): 4 seconds
- Long (16+ words): 6 seconds

Total video should be 30-60 seconds for reels, 60-90 seconds for trailers.

### Image Prompt Generation

For each segment, generate a DALL-E 3 prompt using the `visual_direction` field as foundation:

**Prompt template:**
```
Jim Lee comic art style — dense linework, heavy blacks, cross-hatching, cinematic framing.
[visual_direction adapted for this specific segment]
Mood: [derived from distillation_filter]
  - living_without_religion → eerie, unsettling, philosophical
  - med_mil_progress → awe-inspiring, imposing, technological
  - novel_intro → suspenseful, cinematic, mysterious
Color palette: [derived from story_angle faction]
  - bharatsena → Navy, Powder-blue, Cyan, Mustard
  - akakpen → Deep Green, Bark Brown, Orange, Marigold
  - tribhuj → Grey, Red-Orange, Neon accents
Vertical composition (1024x1792), dramatic lighting, atmospheric depth.
NO text, NO logos, NO watermarks.
```

**Spoiler Safety:** Before generating, scan the prompt for:
- "KACHA" or "KACHA programme" → Remove entirely
- "Pratap" + "bombing" or "orchestrat" → Sanitize
- "Kahaan" + "choice" or "power transfer" → Sanitize

If a spoiler is detected, rewrite the prompt to be lore-safe while preserving the visual intent.

Present prompts to the user for approval. If using the AI image generation flow (`--images` not provided), generate images via DALL-E 3 at 1024×1792. Save to `video-production/public/content/post-{N}/images/`.

---

## Step 3: Build the Remotion Timeline

Use the CLI pipeline at `video-production/cli/bhv-generate.ts` OR build the timeline manually. The timeline schema is:

```typescript
interface BharatvarshTimeline {
  postId: string;           // e.g. "BHV-20260415-001"
  shortTitle: string;       // 4-5 words from topic, ALL CAPS
  hook: string;             // From CSV hook field
  storyAngle: 'bharatsena' | 'akakpen' | 'tribhuj';
  contentChannel: 'declassified_report' | 'graffiti_photo' | 'news_article';
  badge: string;            // Channel-specific badge text
  ctaUrl: string;           // "welcometobharatvarsh.com"
  elements: BackgroundElement[];  // One per slide
  text: TextElement[];            // Narration segments
  audio: [];                      // Empty (text-only mode)
}
```

### Badge Generation

Based on `content_channel`:
- `declassified_report` → Extract directive ref from lore_refs, e.g. "DIRECTIVE 1984-R/07 · DECLASSIFIED"
- `graffiti_photo` → Extract location from topic, e.g. "SECTOR 7 · UNDOCUMENTED"
- `news_article` → "BVN-24x7 · BREAKING" or "BVN-24x7 · HERITAGE DESK"

### Animation Specifications

**Background elements (per slide):**
- Ken burns: alternating zoom-in (1.3→1.0) and zoom-out (1.0→1.3) over full slide duration
- Enter transition: blur (1200ms)
- Exit transition: blur (1200ms)

**Text elements:**
- Spring entrance animation (damping 150, 8 frames — slower/more cinematic than generic template)
- Position: bottom-center
- Duration: proportional to word count (see timing above)

**Video structure:**
```
[Intro: 2s] → [Slide 1: 2-6s] → [Slide 2: 2-6s] → ... → [End Card: 3s]
```

### Using the CLI

Preferred method — run the CLI to generate the timeline:

```bash
cd video-production

# Mode A: Generate everything from calendar
npm run bhv-gen

# Mode B: With pre-provided images
npm run bhv-gen -- --post-id BHV-20260415-001 --images /path/to/img1.png,/path/to/img2.png

# Dry run to preview
npm run bhv-gen -- --dry-run
```

The CLI outputs `bharatvarsh-timeline.json` to `public/content/{post-slug}/`.

---

## Step 4: Render Videos

Render using Remotion's CLI. Two composition variants are registered:

### Reel/Shorts (9:16 vertical — 1080×1920)

```bash
cd video-production
npx remotion render bhv-reel-{post-slug} --output ../content-pipelines/bharatvarsh/rendered/post-{N}/post-{N}-reel.mp4
```

### Landscape Trailer (16:9 — 1920×1080)

```bash
npx remotion render bhv-trailer-{post-slug} --output ../content-pipelines/bharatvarsh/rendered/post-{N}/post-{N}-trailer.mp4
```

### Render Quality Settings

For production renders, add:
```bash
--codec h264 --image-format jpeg --jpeg-quality 90 --scale 1
```

For quick previews:
```bash
--codec h264 --image-format jpeg --jpeg-quality 70 --every-nth-frame 2
```

---

## Step 5: Package Outputs

Create the output directory at `content-pipelines/bharatvarsh/rendered/post-{N}/` containing:

```
post-{N}-reel.mp4              — Instagram Reels / YouTube Shorts (9:16)
post-{N}-trailer.mp4           — Landscape trailer (16:9)
post-{N}-thumbnail.png         — Frame 0 still (thumbnail-ready key still)
post-{N}-video-captions.txt    — Platform-specific caption variants
post-{N}-render-manifest.json  — Render specs and metadata
```

The post_id (e.g. BHV-20260415-001) is stored inside `post-{N}-render-manifest.json` only — it does NOT appear in any filename.

### Video Caption File

Generate platform-appropriate captions for the video:

**Instagram Reel:**
```
[hook]

[caption_text condensed to ≤2200 chars]

welcometobharatvarsh.com — link in bio.

·
·
·

[hashtags]
```

**YouTube Shorts:**
```
[hook] | Bharatvarsh

[caption_text]

Read the full story: [cta_link]

[hashtags]
```

### Render Log

```markdown
# Video Render Log — {post_id}
- **Topic:** {topic}
- **Campaign:** {campaign}
- **Story Angle:** {story_angle}
- **Content Channel:** {content_channel}
- **Formats rendered:** Reel (1080×1920), Trailer (1920×1080)
- **Duration:** {X}s
- **Slides:** {N}
- **Animations:** Ken Burns + blur transitions
- **Brand:** Context B (Bharatvarsh)
- **Generated:** {timestamp}
```

---

## Step 6: Update Post Status

Update the content calendar CSV:
- If status was `planned` → change to `video_rendered`
- If status was `rendered` (static already done) → change to `fully_rendered`
- Write the updated CSV back to `content-pipelines/bharatvarsh/calendar/content_calendar.csv`

Present completion summary:

```
Video rendered for post-[N] ([post_id]): [topic]

Outputs:
  Reel (9:16):   content-pipelines/bharatvarsh/rendered/post-[N]/post-[N]-reel.mp4
  Trailer (16:9): content-pipelines/bharatvarsh/rendered/post-[N]/post-[N]-trailer.mp4
  Thumbnail:     content-pipelines/bharatvarsh/rendered/post-[N]/post-[N]-thumbnail.png
  Captions:      content-pipelines/bharatvarsh/rendered/post-[N]/post-[N]-video-captions.txt

Duration: {X}s ({N} slides + intro + end card)
Next pending post: [next_post_id] (post-[N+1]) or "Pipeline clear"
```

Provide file links for the user to view/download.

---

## Video Composition Visual Spec

### Intro Card (2 seconds) — varies by content_channel

**Declassified Report:**
- Obsidian (#0A0D12) background with surveillance grid
- "CLASSIFIED" stamp flickers in (opacity pulse over 500ms)
- Badge text in JetBrains Mono, Mustard Gold (#F1C232)
- Horizontal scanline scrolling down
- Faction color tint (15% opacity)

**Graffiti / Photography:**
- Full black → atmospheric fade reveal (800ms)
- Title in Bebas Neue, large, with subtle glow pulse
- No grid, no stamps — pure cinematic mood
- Faction color glow at edges

**News Article:**
- BVN-24x7 masthead bar (Navy background, white text, Mustard accent)
- "BREAKING" ticker scrolling left at bottom
- Digital grid background
- Title appears letter-by-letter (typewriter effect, 50ms/char)

### Content Slides (variable duration)

Each slide composites these layers (bottom to top):
1. **Background image** — Full-bleed with ken burns scale animation
2. **Faction color wash** — 15% opacity overlay using story_angle primary color
3. **Film grain** — SVG feTurbulence (baseFrequency: 0.65, 6% opacity)
4. **Vignette** — Radial gradient (transparent center → obsidian edges)
5. **Bottom gradient** — Obsidian → transparent, bottom 35% of frame
6. **Mustard accent line** — 2px, 60% width, centered above text
7. **Text overlay** — Bebas Neue for ≤3 words, Crimson Pro for longer text

### End Card (3 seconds)

- Background: Obsidian with surveillance grid
- Mustard accent bar (4px, 80% width) at top
- "welcometobharatvarsh.com" in Bebas Neue, Mustard Gold, center
- "Read the full story" in Inter, textSecondary, below URL
- Faction glow stripe (2px, story_angle primary color, pulsing) at bottom
- Fade in from black over 500ms

### Brand Tokens Reference

```
obsidian: #0A0D12       navy: #0B2742
mustard: #F1C232        mustardLight: #F5D56A
powderBlue: #C9DBEE     paper: #C3B49B
textPrimary: #F0F4F8    textSecondary: #A0AEC0
textMuted: #718096      badgeBg: rgba(10,13,18,0.78)
grainOpacity: 0.06

Bharatsena: Navy #0B2742, Cyan #17D0E3, Mustard #FFB703
Akakpen: Green #162B18, Orange #D9781E, Marigold #FFC933
Tribhuj: Grey #4A4A4A, Red #DC2626, Orange #FF6B35

Bebas Neue (titles) | Crimson Pro (narrative) | Inter (body) | JetBrains Mono (data)
```

---

## Error Handling

- **No pending posts** → "Pipeline clear" message
- **Missing images** → Ask user to provide or switch to Mode A (AI generation)
- **Missing caption_text** → Use `hook` field as single-slide narration
- **Remotion not installed** → Run `cd video-production && npm install`
- **DALL-E rate limit** → Retry 3x with 2s backoff, then ask user to provide images manually
- **Video too short (<10s)** → Extend slide durations to minimum 3s each
- **Video too long (>90s for reel)** → Trim segments, warn user
- **Image too small** → Upscale warning, continue with lanczos3
- **Spoiler content detected** → Sanitize and warn user

---

## Quality Checklist (Pre-Delivery)

- [ ] Timeline JSON validates against BharatvarshTimeline schema
- [ ] All images exist at expected paths
- [ ] Intro matches content_channel style
- [ ] End card shows correct CTA URL
- [ ] Faction colors match story_angle
- [ ] Film grain visible but subtle (6% opacity)
- [ ] Text readable against gradient overlay
- [ ] Video duration within target range (30-60s reels, 60-90s trailers)
- [ ] No spoiler content in any visible text
- [ ] Captions formatted per platform
- [ ] Render log complete
- [ ] CSV status updated
