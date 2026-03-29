---
name: bharatvarsh-art-prompts
description: "Generates model-aligned, lore-canonical, visually consistent AI art prompts for Bharatvarsh content marketing. Use when creating visual assets, character portraits, location art, or video content for social media."
---

# SKILL: Bharatvarsh AI Art Prompts

> **Scope:** Generates model-aligned, lore-canonical, visually consistent prompts for AI image and video generation tools (OpenArt, Google Flow/Imagen/Veo) used in Bharatvarsh content marketing.
> **Type:** Workflow skill — produces structured prompt packages ready for copy-paste into generation tools.
> **Version:** 1.1 — 2026-03-20
> **Dependencies:** BHARATVARSH_BIBLE.md, BRAND_IDENTITY.md (Context B), Character Reference Sheets
> **Data Files:** `content-pipelines/bharatvarsh/prompts/` (style_anchors.json, character_dna.json, environment_templates.json, negative_prompts.json)
> **Reference Catalog:** `content-pipelines/bharatvarsh/assets/references/REFERENCE_CATALOG.json` (53 assets cataloged)

---

## Model Routing — DECIDE FIRST

Before writing any prompt, select the generation model based on what you're creating:

| What You're Generating | Model | Platform | Why |
|---|---|---|---|
| Character portrait, face, expression | **Seedream 4.5** | OpenArt | Best facial accuracy with reference images. Attach expression sheet + front ref via IP-Adapter. |
| Costume/uniform detail shot | **Seedream 4.5** | OpenArt | Maintains costume consistency from reference sheets. |
| Action scene with character face visible | **Seedream 4.5** | OpenArt | Face identity must match reference. |
| Cityscape, landscape, environment | **Nano Banana** | OpenArt | Superior painterly compositions and atmospheric depth. |
| Technology in environment (Oxy Poles, Mesh) | **Nano Banana** | OpenArt | Excels at cinematic scenery with tech elements. |
| Quote card / atmospheric background | **Nano Banana** | OpenArt | Moody abstract compositions. |
| Isolated device close-up (Bracecomm, Pulse Gun) | **Seedream 4.5** | OpenArt | Fine detail accuracy on tech objects. |
| Video extension from still | **Veo** | Google Flow | Image-to-video with subtle motion. |

**Key Rule:** If a character's face needs to match a reference → Seedream 4.5. If no face matching needed → Nano Banana.

---

## Reference Image Strategy

The pipeline maintains 53 cataloged reference assets in `content-pipelines/bharatvarsh/assets/references/`. Consult `REFERENCE_CATALOG.json` for the full inventory.

### Which References to Attach

**For any character portrait (Seedream 4.5):**
1. ALWAYS attach the character's **expression sheet** (e.g., `Kahaan Expressions.jpg`) as the primary face anchor
2. Add the **front reference** (e.g., `Kahaan Front.png`) for costume accuracy
3. For action poses, also attach the action reference (e.g., `Kahaan angle.jpg`)

**For environment art (Nano Banana):**
- `Bharatvarsh.webp` — primary city aesthetic anchor
- `Mesh.webp` — surveillance/control atmosphere
- `Commute.webp` — civilian normalcy
- `20-10.webp` — destruction/aftermath mood

**For technology (model varies):**
- `Oxy Pole.jpg` — atmospheric infrastructure
- `Bracecom Card.jpg` — wrist device detail
- `Pulse Gun.png` — standard weapon

**For faction-specific content:**
- Akakpen: `Akakpen Banner.jpg`, `Akakpen Symbol.png`
- Bharatsena: `Army logo.png`, `Bharatsena Card.jpg`
- Bracecomm: `Bracecom banner.jpg`, `Bracecom Card.jpg`

### Art Style Reference — Jim Lee Modern American Comic Book
ALL Bharatvarsh visual content MUST follow the Jim Lee modern American comic book art style. Review `Art Style.pdf` (11 pages, 10 Jim Lee reference images at `content-pipelines/bharatvarsh/assets/art_style/Jim 1-10.jpg`).

**Jim Lee Style Checklist — EVERY prompt must include these elements:**

| Category | Requirements |
|----------|-------------|
| **Line & Shading** | Dense hatching and cross-hatching for depth. Heavy blacks balanced with sharp white highlights. Bold ink outlines. |
| **Anatomy** | Heroic musculature, strong jawlines, idealized but realistic faces. |
| **Poses** | Dynamic foreshortened poses, aggressive low angles, Dutch tilts. |
| **Cinematic Energy** | Action frozen at peak tension. Silhouette readability. Bold paneling logic. |
| **Camera** | 24-35mm for drama, 50-85mm for heroic close-ups. |
| **Costume Detail** | Sharp tactical seams, armor lines crisp. |
| **Mood & Texture** | Textured line-work surfaces, slight grit. NEVER flat digital fills, smooth gradients, or airbrush. |
| **Heroic Presence** | Characters always monumental even when calm. |

**Style Anchor Phrase (prepend to every prompt):**
`Jim Lee modern American comic book art style. Dense hatching and cross-hatching for depth. Heavy blacks balanced with sharp white highlights. Bold ink outlines. Textured line-work surfaces with slight grit.`

**Negative Prompt Additions (Jim Lee exclusions):**
`soft gradients, airbrush, smooth digital rendering, watercolor, anime, manga, chibi, flat colors, pastel palette, cel shading, vector art, minimalist, abstract, photorealistic, photograph, 3D render, CGI, Pixar style, oil painting, impressionist`

---

## When to Use

Activate when:
- Creating visual assets for Bharatvarsh social media content
- Generating character portraits, location art, tech close-ups, or atmospheric scenes
- Building reference sheets for character/location consistency
- Extending still images to video clips for Reels
- Any visual generation task where the output must be lore-canonical and brand-consistent

Trigger phrases: "generate art for," "create a visual," "Bharatvarsh image," "prompt for OpenArt," "asset for post," "character art," "scene for reel"

---

## How to Use

1. **Select model:** Seedream 4.5 (faces/costumes) or Nano Banana (environments/atmospheres) — see routing table above
2. **Select references:** Read `REFERENCE_CATALOG.json`, pick the appropriate reference images to attach
3. **Load context:** Read `content-pipelines/bharatvarsh/prompts/character_dna.json` and `content-pipelines/bharatvarsh/prompts/style_anchors.json`
4. **Select style anchor:** Pick from `style_anchors.json` based on target type
5. **Insert subject:** Pull character Visual DNA verbatim from `character_dna.json` or write custom subject
6. **Insert environment:** Pull from `environment_templates.json` or write custom
7. **Compile negative prompts:** Base + model-specific + target-specific from `negative_prompts.json`
8. **Set technical parameters:** Model, aspect ratio, steps, guidance, seed, reference image + strength

## Full Skill Reference

See `content-pipelines/bharatvarsh/skills/SKILL_BHARATVARSH_ART_PROMPTS.md` for the complete 11-phase prompting framework including:
- Character Visual DNA registry (Phase 3) — now with reference image paths for 6 characters
- Style Anchor System with 5 pre-validated anchors (Phase 4) — now with model routing
- Environment Templates for 4 key locations (Phase 5)
- Negative Prompt Library with model-specific tuning (Phase 6)
- Prompt Assembly Protocol (Phase 7)
- Model-Specific Parameter Recommendations (Phase 8) — includes Seedream 4.5 and Nano Banana
- Consistency Enforcement Protocol (Phase 9)
- Ready-to-use prompt examples (Phase 10)
- Iteration Protocol for quality refinement (Phase 11)
- Quality Checklist (10-item gate before approving any asset)
