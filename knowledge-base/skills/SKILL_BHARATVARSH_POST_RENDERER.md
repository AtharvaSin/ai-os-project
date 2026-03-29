---
name: bharatvarsh-post-renderer
description: "End-to-end Bharatvarsh content post rendering pipeline. Picks the next pending post from the content calendar CSV, generates AI image prompts for the raw artwork, composites branded multi-channel renders (Instagram 1080x1080, Twitter 1600x900, LinkedIn 1200x628, Facebook 1200x630) with Context B overlays, packages everything into a downloadable zip with per-channel caption files, and marks the post as processed. Use this skill whenever the user mentions rendering Bharatvarsh posts, content pipeline, post rendering, next pending post, content calendar, branded composites, post package, or wants to produce ready-to-publish visual assets from the Bharatvarsh content pipeline. Also trigger when the user says 'render next post', 'package a post', 'what's next in the pipeline', 'create post assets', or references BHV post IDs."
---

# Bharatvarsh Post Renderer

> **Scope:** Produces publish-ready visual assets and formatted captions for every post in the Bharatvarsh content calendar. Each run takes one or more pending posts through the full pipeline: image prompt generation, branded compositing across all target channels, caption formatting, zip packaging, and status update.
>
> **Brand Context:** Always Context B (Bharatvarsh) — dystopian-cinematic, Bebas Neue titles, Mustard Gold #F1C232 accent, Obsidian backgrounds, film grain, vignette.

---

## Input Modes

This skill supports three invocation patterns. Detect which mode applies from the user's message BEFORE starting the steps:

### Mode A — Sequential (no images provided)
The user says something like "render next post" or "what's next in the pipeline" without attaching images. Follow all steps in order: pick post → generate image prompt → wait for image → render → package.

### Mode B — Images provided upfront (single post)
The user provides one or more image paths/uploads AND asks to render a specific post or "the next post." Skip Step 2 (image prompt generation) entirely and go straight from Step 1 to Step 3.

**Detection cues:** The user's message contains a file path, an uploaded image, or phrases like "I've got the image," "here's the raw art," "use this image."

### Mode C — Batch with pre-provided images (multiple posts)
The user provides multiple images and maps them to specific post IDs, or says "render the next N posts" with images attached. Process each post sequentially through Steps 1→3→4→5→6, but skip Step 2 for any post that already has an image.

**Detection cues:** Multiple image paths, post ID references like "BHV-20260409-001 uses image X, BHV-20260412-001 uses image Y," or "render these 3 posts."

### Image Mapping Rules

When the user provides images:

- **Single image, single post:** Use that image for all platform renders of that post.
- **Multiple images, one per post:** Match images to posts by order (first image → first post) unless the user explicitly maps them (e.g., "temple image → BHV-20260406-001").
- **Multiple images, same post, different resolutions:** The user may provide platform-specific images at different resolutions (e.g., a square crop for Instagram and a wide crop for Twitter). If the user labels them or if the aspect ratios clearly match specific platforms, use the best-fitting image per platform:
  - Square or near-square (aspect ratio 0.85–1.15) → Instagram (1080x1080)
  - Wide landscape (aspect ratio 1.5–2.0) → Twitter (1600x900)
  - Medium landscape (aspect ratio 1.7–2.1) → LinkedIn (1200x628) / Facebook (1200x630)
  - If only one image is provided, use it for all platforms (the script crops adaptively).
- **User-specified mapping always wins.** If the user says "use X for Instagram and Y for Twitter," follow that exactly regardless of aspect ratios.

When in doubt about which image goes where, ask once — don't guess.

---

## Before Starting

Read these files to load the brand system and rendering rules into context. This is essential — the visual quality of every render depends on it:

1. `${CLAUDE_PLUGIN_ROOT}/../asr-visual-studio/context/brand-system.md` — Brand tokens for Context B
2. `${CLAUDE_PLUGIN_ROOT}/../asr-visual-studio/preferences/visual-style.md` — Anti-generic mandate, composition rules
3. `${CLAUDE_PLUGIN_ROOT}/../asr-visual-studio/preferences/platform-rules.md` — Per-platform text density and sizing
4. `${CLAUDE_PLUGIN_ROOT}/../asr-visual-studio/preferences/copy-tone.md` — Voice and headline rules

Also read the lore guard rails:
5. Knowledge base file `knowledge-base/BHARATVARSH_CONTENT_LORE_RULES.md` — Timeline accuracy rules (if it exists)
6. Knowledge base file `knowledge-base/BHARATVARSH_TIMELINE.md` — Canonical chronology for fact-checking

**Plugin root for ASR Visual Studio:** The asr-visual-studio plugin is at one of these locations (check which exists):
- `/sessions/*/mnt/.local-plugins/marketplaces/local-desktop-app-uploads/asr-visual-studio/`
- The `CLAUDE_PLUGIN_ROOT` parent if this skill is installed alongside it

---

## Step 1: Pick the Next Pending Post

Read the content calendar CSV at `content-pipelines/bharatvarsh/calendar/content_calendar.csv` (relative to the project root).

Find the first row where `status` equals `planned` (case-insensitive). This is your target post. If no pending posts exist, tell the user the pipeline is clear and stop.

Extract these fields from the CSV row:

| Field | CSV Column | Used For |
|-------|-----------|----------|
| Post ID | `post_id` | Directory naming, file naming |
| Campaign | `campaign` | Context for the post |
| Story Angle | `story_angle` | Lore grounding (bharatsena, akakpen, tribhuj) |
| Distillation Filter | `distillation_filter` | Tone modulation |
| Content Channel | `content_channel` | Visual template selection (declassified_report, graffiti_photo, news_article) |
| Topic | `topic` | The subject line |
| Hook | `hook` | Short punchy line for overlays |
| Caption Text | `caption_text` | Full caption body |
| Lore Refs | `lore_refs` | Bible references to validate against |
| Platforms | `platforms` | Comma-separated target channels |
| Visual Direction | `visual_direction` | The detailed image composition brief |
| Hashtags | `hashtags` | Platform hashtag set |
| CTA Type | `cta_type` | Call to action type |
| CTA Link | `cta_link` | URL for CTA |
| Scheduled Date | `scheduled_date` | For caption metadata |
| Scheduled Time | `scheduled_time` | For caption metadata |

Present a summary to the user:

```
Next pending post: [post_id]
Topic: [topic]
Channel: [content_channel]
Platforms: [platforms]
Scheduled: [scheduled_date] at [scheduled_time]
```

---

## Step 2: Generate Image Prompt

> **SKIP THIS STEP** if the user already provided images (Mode B or Mode C). Jump directly to Step 3.

The `visual_direction` column contains a detailed composition brief already. Your job is to refine it into a prompt optimized for the user's image generation tool (typically an AI art generator like Nano Banana / Midjourney / DALL-E).

**Prompt construction rules:**
- Start with the art style anchor: "Jim Lee comic art style —" (this is the Bharatvarsh visual DNA)
- Include the full composition from `visual_direction`
- Add technical directives: "Dense linework, heavy blacks, cross-hatching on architectural textures. Cinematic composition."
- Add the color palette cues from the content channel:
  - `declassified_report`: Obsidian #0A0D12 dominant, mustard #F1C232 accents, aged paper borders
  - `graffiti_photo`: Earth tones, concrete grey, muted warmth, single color accent
  - `news_article`: Navy #0D1B2A, cream #F5F0E1, institutional typography feel
- End with negative prompts: "No: cartoonish style, bright saturated colors, modern UI elements, text in the image, watermarks."

**Spoiler safety check:** Before presenting the prompt, verify it doesn't reveal any of these plot secrets:
- The KACHA programme
- Pratap's orchestration role
- Kahaan's final choice
- The power transfer mechanics

Present the prompt to the user and wait for them to provide the generated image(s). The user will either paste a path or upload a file.

---

## Step 3: Render Multi-Channel Composites

Once you have the raw image (either just provided by the user, or pre-provided in Mode B/C), render branded composites for each platform listed in the `platforms` column.

**Multi-image handling:** If the user supplied different images per platform (see Image Mapping Rules above), run the render pipeline separately for each platform using its assigned image. If only one image was provided, use it for all platforms.

### Rendering Engine

The rendering uses Sharp (Node.js image processing library) to composite SVG overlays onto the base image. This approach works reliably in all environments (no browser/Puppeteer needed).

**Install dependencies if needed:**
```bash
npm list sharp 2>/dev/null || npm install sharp
```

### Per-Channel Render Specifications

Each channel gets its own render with adapted composition. The content channel (declassified_report, graffiti_photo, news_article) determines the overlay template:

#### Instagram Feed (1080x1080)
- **Crop strategy:** Square crop biased upward (keep architectural tops/towers). Use `top: Math.round((height - width) * 0.12)` for the vertical offset.
- **Text zone:** Bottom 40% only. Top 60% is pure atmosphere.
- **Overlay layers (composited in order):**
  1. Gradient: transparent (top) → obsidian #0A0D12 (bottom), starting at 45% height
  2. Vignette: radial darkening at edges (0.45 opacity)
  3. Film grain: feTurbulence SVG at 6% opacity
  4. Text SVG: classified badge (top-left), accent bar, title (Bebas Neue, 46px, ALL CAPS, letter-spacing 0.14em), subtitle (JetBrains Mono, 13px), footer (brand name + URL)
  5. Paper border frame: 26px #C3B49B border with worn-edge darkening
- **Content channel variations:**
  - `declassified_report`: Add "DIRECTIVE [ref] · DECLASSIFIED" badge, document border overlay
  - `graffiti_photo`: No badge, more atmospheric, text overlay lighter
  - `news_article`: Add "BVN-24x7" masthead-style badge, newsprint border

#### Twitter/X (1600x900)
- **Crop strategy:** Landscape crop from center of image
- **Text:** Maximum 5 words of headline. Punchy. Film-poster energy.
- **Overlay:** Same layer stack but wider gradient, less text. Title only (no subtitle).
- **Font size:** Title at 60px for readability at small sizes

#### LinkedIn (1200x628)
- **Crop strategy:** Wide landscape, bias toward architectural midground
- **Text:** Most text-friendly. Title + subtitle both included.
- **Overlay:** Professional but atmospheric. Author attribution "Atharva Singh" in footer.
- **Font size:** Title at 42px, subtitle at 14px

#### Facebook (1200x630)
- **Crop strategy:** Same as LinkedIn dimensions
- **Text:** Medium text density. Title + short hook.
- **Overlay:** Similar to LinkedIn but without author attribution

### Rendering Pipeline (Sharp)

The core pipeline for each channel render:

```
Base Image → Square/Landscape Crop → Resize to target dimensions
  → Composite gradient SVG overlay
  → Composite vignette SVG overlay
  → Composite text SVG overlay (channel-specific)
  → Composite border frame (channel-specific)
  → Output as PNG
```

Use the bundled script at `scripts/render_post.js` which implements this pipeline. The script accepts these arguments:

```bash
node scripts/render_post.js \
  --base-image "/path/to/raw-image.jpg" \
  --post-id "BHV-20260406-001" \
  --title "TEMPLE REPURPOSING DIRECTIVE" \
  --subtitle "The Lakshmanpur Mandir was redesignated as Senate Chamber 7 in 1984." \
  --badge "DIRECTIVE 1984-R/07 · DECLASSIFIED" \
  --footer-brand "BHARATVARSH" \
  --footer-url "welcometobharatvarsh.com" \
  --content-channel "declassified_report" \
  --platforms "instagram,twitter,linkedin,facebook" \
  --output-dir "/path/to/output/"
```

**Per-platform image overrides:** When the user provides different images for different platforms, pass them as additional flags. These take priority over `--base-image` for the specified platform:

```bash
node scripts/render_post.js \
  --base-image "/path/to/default.jpg" \
  --image-instagram "/path/to/square-crop.jpg" \
  --image-twitter "/path/to/wide-crop.jpg" \
  --post-id "BHV-20260406-001" \
  ...
```

If every platform has its own `--image-{platform}` override, `--base-image` can be omitted.

**Title derivation:** Create a short, punchy title from the `topic` field. All caps. Maximum 4-5 words for Twitter, can be longer for Instagram/LinkedIn. The content channel influences the title style:
- `declassified_report`: Document/directive language, formal
- `graffiti_photo`: Street-level, raw, poetic
- `news_article`: Headline news language, factual

**Subtitle derivation:** Use the `hook` field from the CSV. Trim to 1-2 sentences.

**Badge derivation:** Based on content channel:
- `declassified_report`: Extract directive reference from caption (e.g., "DIRECTIVE 1984-R/07 · DECLASSIFIED")
- `graffiti_photo`: "[LOCATION] · UNDOCUMENTED" or similar
- `news_article`: "BVN-24x7 · [DESK NAME]"

---

## Step 4: Format Per-Channel Captions

For each target platform, create a formatted caption text file. The caption structure varies by platform:

### Instagram Caption
```
[Caption text from CSV — this is the main body]

[CTA line — e.g., "📖 welcometobharatvarsh.com — link in bio."]

·
·
·

[Hashtags from CSV, space-separated with # prefix]
```

**Instagram-specific rules:**
- First 125 characters must hook the reader (before the "...more" truncation)
- Hashtags at the very end, preceded by dot separators
- Include CTA with link-in-bio reference
- No URLs in the middle of the caption (Instagram doesn't make them clickable)

### Twitter/X Caption
```
[Condensed version of caption — max 280 chars including hashtags]

[2-3 hashtags maximum]

[CTA link]
```

### LinkedIn Caption
```
[Full caption text — can be longer, 800-1800 chars]

[Insight or thought-leadership angle woven in]

[CTA]

[3-5 hashtags]
```

### Facebook Caption
```
[Caption text — conversational tone, inviting discussion]

[CTA with full link]

[Hashtags — fewer than Instagram, 3-5 max]
```

Save each caption as `{post_id}_{platform}_caption.txt` in the output directory.

Also create a combined `{post_id}_all_captions.txt` with all platforms separated by clear headers.

---

## Step 5: Package as Zip

Create a zip file containing all renders and captions:

```
{post_id}_package.zip
├── {post_id}_instagram.png
├── {post_id}_instagram_caption.txt
├── {post_id}_twitter.png
├── {post_id}_twitter_caption.txt
├── {post_id}_linkedin.png
├── {post_id}_linkedin_caption.txt
├── {post_id}_facebook.png          (if facebook in platforms)
├── {post_id}_facebook_caption.txt  (if facebook in platforms)
├── {post_id}_all_captions.txt
└── render_log.md
```

The `render_log.md` should contain:
- Post ID, topic, campaign
- Scheduled date/time
- Lore references checked
- Per-channel render specs (dimensions, file sizes)
- Timestamp of generation

Place the zip in the workspace output directory so the user can download it.

---

## Step 6: Update Post Status

After successful rendering and packaging, update the content calendar CSV:
- Change the `status` column for this post from `planned` to `rendered`
- This ensures the next skill invocation picks up the following post

Write the updated CSV back to `content-pipelines/bharatvarsh/calendar/content_calendar.csv`.

Present a completion summary:

```
✅ Post package complete: [post_id]

Topic: [topic]
Channels rendered: [list]
Package: [link to zip]

Renders:
  Instagram (1080×1080): [size] KB
  Twitter   (1600×900):  [size] KB
  LinkedIn  (1200×628):  [size] KB
  Facebook  (1200×630):  [size] KB

Status: planned → rendered

Next pending post: [next post_id] or "Pipeline clear"
```

---

## Content Channel Templates

The three content channels each have distinct visual personalities. Here's how they map to overlay design:

### declassified_report
- **Vibe:** Government document, redacted file, archival
- **Badge:** Directive/clearance reference + "DECLASSIFIED"
- **Border:** Aged paper #C3B49B with worn edges, inner dark rule
- **Title style:** All-caps, wide letter-spacing, formal/bureaucratic
- **Subtitle:** Monospace, factual, dry institutional tone
- **Special elements:** Document reference numbers, Directorate seal watermark

### graffiti_photo
- **Vibe:** Street-level documentary, caught on camera, raw
- **Badge:** Location tag + "UNDOCUMENTED" (or no badge — just atmosphere)
- **Border:** None or thin dark rule — photos don't have document borders
- **Title style:** More poetic/provocative, can be a quote fragment
- **Subtitle:** Contextual — incident date, location
- **Special elements:** Grain heavier (8%), slight warm color shift

### news_article
- **Vibe:** State news broadcast, institutional media, propaganda-adjacent
- **Badge:** "BVN-24x7" network masthead with desk label
- **Border:** Clean broadcast chrome — navy bar top, chyron bar bottom
- **Title style:** Headline news, factual, numbers-driven
- **Subtitle:** Subheadline style, one sentence
- **Special elements:** Ticker bar at bottom, dateline

---

## Error Handling

| Situation | Action |
|-----------|--------|
| No pending posts in CSV | Tell the user "Pipeline clear — no pending posts to render." and stop |
| User image not found at path | Ask user to re-provide the path. Don't render without a base image |
| Sharp not installed | Run `npm install sharp` automatically |
| Platform not recognized | Default to Instagram 1080x1080 specs |
| CSV parse error | Fall back to reading raw text lines and splitting on commas |
| Lore reference not found | Flag to user but continue — it's a warning, not a blocker |
| Image too small for target | Upscale with Sharp's resize (lanczos3 kernel) and warn about quality |

---

## Quality Checklist

Before delivering the package, verify:
- [ ] All target platform renders exist and are correct dimensions
- [ ] Text is readable against the gradient overlay (contrast check)
- [ ] Badge text matches the content channel template
- [ ] Caption files have correct platform-specific formatting
- [ ] Hashtags are present and properly formatted
- [ ] No spoiler content leaked into any caption or overlay
- [ ] Zip file is complete and downloadable
- [ ] CSV status updated from `planned` to `rendered`
- [ ] Render log documents all specifications
