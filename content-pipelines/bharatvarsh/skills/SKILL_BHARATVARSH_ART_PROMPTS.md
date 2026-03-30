# SKILL: Bharatvarsh AI Art Prompts

> **Scope:** Generates model-aligned, lore-canonical, visually consistent prompts for AI image and video generation tools (OpenArt, Google Flow/Imagen/Veo) used in Bharatvarsh content marketing.
> **Type:** Workflow skill — produces structured prompt packages ready for copy-paste into generation tools.
> **Version:** 1.0 — 2026-03-20
> **Dependencies:** BHARATVARSH_BIBLE.md, BRAND_IDENTITY.md (Context B), Character Reference Sheets

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

## PHASE 1: Context Loading (Always First)

Before generating any prompt, load:

1. **BHARATVARSH_BIBLE.md** — Verify character names, faction details, tech descriptions, classified/declassified status
2. **BRAND_IDENTITY.md §Context B** — Confirm color tokens (obsidian, mustard gold, powder blue, navy), atmospheric effects
3. **Character Visual DNA** (§3 below) — Pull the canonical visual descriptor for any featured character
4. **Content calendar row** — Read the `visual_direction` and `content_pillar` fields

**Classified content gate:** If the content references a character or tech element marked `Classified` in the Bible, STOP. Do not generate public-facing art for classified elements. Suggest an alternative using declassified elements only.

---

## PHASE 2: Determine Generation Target

Identify what you're generating:

| Target Type | When to Use | Typical Model | Aspect Ratio |
|-------------|-------------|---------------|--------------|
| Character Portrait | Character teaser, spotlight | SDXL / Flux (OpenArt) | 4:5 (IG), 16:9 (TW) |
| Location/Environment | World window, lore reveal bg | SDXL / Flux (OpenArt) | 16:9 or 1:1 |
| Technology Close-Up | Mesh, Bracecomm, Oxy Pole | SDXL / Flux (OpenArt) | 1:1 or 4:5 |
| Action Scene | Dynamic faction moments | Flux (OpenArt) | 16:9 |
| Quote Card Background | Atmospheric bg for text overlay | SDXL (OpenArt) | 1:1 (IG), 16:9 (TW) |
| Author/BTS Scene | Behind-the-build content | Imagen (Google Flow) | 1:1 or 16:9 |
| Video Extension | Reel from still image | Veo (Google Flow) | 9:16 |
| Reference Sheet | Character consistency anchor | SDXL / Flux (OpenArt) | 1:1 grid |

---

## PHASE 3: Character Visual DNA Registry

These are the **canonical visual descriptors** for each character. They MUST be included verbatim (or near-verbatim) in every prompt featuring that character. This is the primary mechanism for cross-image consistency.

### Kahaan (कहान) — DECLASSIFIED

```
VISUAL DNA: Young Indian man, early 30s, military bearing. Close-cropped black 
hair with clean fade. Sharp defined jaw, high cheekbones, warm brown skin. 
Intense dark brown eyes conveying intelligence and controlled intensity. 
Small floating tactical lens/HUD monocle hovering near right eye emitting 
faint blue-white light. Wearing Bharatsena dress uniform: dark navy fitted 
jacket with structured shoulders, gold piping on collar and cuffs, rank 
insignia on chest. Athletic build, upright posture. Expression: focused, 
contemplative, carrying weight of authority.
```

**Faction color accent:** Navy (`#0B2742`) + Gold piping (`#F1C232`)
**Signature element:** The floating tactical lens — this is his visual signature and MUST appear in every portrait.
**Mood:** Precision, burden of duty, controlled intensity

### Rudra (रुद्र) — DECLASSIFIED

```
VISUAL DNA: Indian man, mid-30s, muscular powerful build. Battle-worn but 
disciplined. Short dark hair, slight stubble. Deep-set intense dark eyes 
with a warrior's focus. Grey Trident insignia tattooed or patched on left 
shoulder/upper arm. Wearing tactical combat gear: matte dark grey body armor 
with utilitarian straps, reinforced panels. Scarring on forearms suggesting 
combat history. Expression: quiet intensity, coiled readiness, unwavering 
loyalty. Posture: grounded, alert, ready to act.
```

**Faction association:** Grey Trident legacy — use desaturated grey-blue tones
**Signature element:** Grey Trident insignia
**Mood:** Disciplined violence, loyalty, silence

### General Pratap (प्रताप) — DECLASSIFIED

```
VISUAL DNA: Indian man, late 50s, commanding presence. Silver-streaked hair 
swept back neatly. Deep lines on face suggesting decades of difficult 
decisions. Piercing dark eyes that assess and calculate. Clean-shaven, 
patrician features. Wearing Directorate high command uniform: dark navy 
long coat with gold epaulettes, chest covered in service decorations and 
campaign ribbons. Tall, straight posture despite age. Hands often clasped 
behind back or resting on desk/table. Expression: absolute authority, 
controlled calm masking ruthlessness.
```

**Faction color accent:** Navy (`#0B2742`) heavy, gold (`#F1C232`) decoration
**Signature element:** Gold epaulettes, service decorations, commanding posture
**Mood:** Cold authority, the weight of empire, calculated sacrifice

### Hana (हना) — DECLASSIFIED

```
VISUAL DNA: East Asian woman (implied Japanese heritage), late 20s. Delicate 
but resilient features. Long dark hair, often loosely tied or flowing. 
Perceptive almond-shaped eyes that seem to see what others miss. Wearing 
layered clothing mixing Eastern traditional elements with utilitarian modern 
pieces — flowing dark fabric with structured underlayers. Subtle resistance 
symbols woven into fabric patterns (if close-up). Expression: quiet 
intelligence, guarded warmth, the weight of knowing something others don't. 
Carries herself with fluid grace, aware of surroundings.
```

**Color palette:** Warmer tones — deep earth, muted crimson, aged gold
**Signature element:** The layered East-meets-modern clothing, perceptive eyes
**Mood:** Hidden knowledge, cultural memory, quiet resistance

### Arshi (अर्शी) — CLASSIFIED

```
⛔ CLASSIFIED — No public-facing art generation permitted.
Use silhouette, obscured face, or atmospheric suggestion only.
If absolutely needed for teaser content:
  "Mysterious figure, face hidden in shadow, only the suggestion of a 
   presence at the edge of light. Obsidian palette. No identifiable features."
```

---

## PHASE 4: Style Anchor System

Every prompt MUST begin with a style anchor. These are pre-validated strings that lock the visual tone.

### Anchor A: CINEMATIC PORTRAIT (Characters)

```
cinematic portrait photography, dark moody atmospheric lighting, 
Indian cyberpunk military aesthetic, film still quality, shallow depth 
of field, volumetric fog, rim lighting from behind with warm amber edge, 
obsidian-navy color palette with mustard gold accents, subtle film grain 
texture, photorealistic, professional cinematography, Deakins-inspired 
lighting, NOT anime, NOT cartoon, NOT plastic, NOT oversaturated, 
NOT generic stock photo
```

### Anchor B: ENVIRONMENT/LANDSCAPE (Locations)

```
cinematic wide establishing shot, dark atmospheric dystopian cityscape, 
Indian futuristic architecture blending Mughal geometric patterns with 
military-industrial infrastructure, volumetric god rays cutting through 
haze, obsidian and navy blue dominant palette with mustard gold accent 
lighting from technology elements, wet reflective streets, towering 
structures with vertical gardens, surveillance technology subtly visible, 
film grain overlay, photorealistic matte painting quality, NOT bright, 
NOT colorful, NOT utopian, NOT generic sci-fi, NOT Western architecture
```

### Anchor C: TECHNOLOGY CLOSE-UP (Mesh, Bracecomm, Oxy Poles)

```
cinematic macro detail shot, dark atmospheric, advanced technology with 
Indian design language, intricate geometric patterns inspired by Mughal 
jali screens and mandala geometry, holographic blue-white interfaces, 
obsidian metal surfaces with mustard gold accent lines, subtle blue glow 
from active technology, shallow depth of field, studio product photography 
lighting, film grain, photorealistic, NOT generic sci-fi prop, NOT toy-like, 
NOT plastic, NOT neon-heavy cyberpunk
```

### Anchor D: ATMOSPHERIC BACKGROUND (Quote cards, text overlays)

```
atmospheric abstract background, dark obsidian gradient, subtle surveillance 
grid pattern barely visible, volumetric fog, faint mustard gold light 
bleeding from one edge, cinematic film grain texture, moody, brooding, 
empty space for text overlay, minimal detail in center for readability, 
photorealistic atmospheric, NOT busy, NOT detailed in center, NOT bright, 
NOT colorful
```

### Anchor E: ACTION/DYNAMIC (Faction confrontations, movement)

```
cinematic action still, motion blur on secondary elements, sharp focus on 
subject, dark atmospheric Indian cyberpunk military aesthetic, dramatic 
low-angle or Dutch angle composition, volumetric dust/particles in air, 
intense rim lighting, obsidian-navy palette with mustard gold sparks/accents, 
high contrast, film grain, dynamic energy, NOT clean, NOT static, NOT calm, 
NOT anime-style action, NOT Marvel/DC aesthetic
```

---

## PHASE 5: Environment Templates

Pre-built location descriptions for key Bharatvarsh settings:

### Indrapur HQ

```
massive military command complex, monolithic dark architecture blending 
Mughal fortress geometry with brutalist military design, towering walls 
with geometric jali screen patterns in concrete, guarded entrance with 
biometric scanners and Mesh sensor arrays, Bharatsena soldiers in dark 
navy uniforms standing guard, wide ceremonial approach avenue lined with 
Oxy Poles emitting faint blue-white light, Directorate insignia carved 
into stone above main gate, overcast sky, oppressive scale suggesting 
absolute authority
```

### Lakshmanpur (Industrial Metropolis)

```
sprawling industrial cityscape, smokestacks mixing with surveillance towers, 
dense urban grid with narrow streets between massive factory-residential 
hybrid blocks, Oxy Poles working overtime to scrub thick air, warm amber 
industrial lighting mixing with cool blue Mesh scanner glow, workers in 
utilitarian clothing moving through checkpoints, vertical gardens clinging 
to concrete towers, wet streets reflecting neon-tinted light from commercial 
displays, crowded but orderly — compliance visible in the flow of movement
```

### Oxy Pole Boulevard

```
wide tree-lined boulevard in a Bharatvarsh city, clean and orderly, tall 
sleek Oxy Poles rising at regular intervals — each pole a slender metallic 
column with a glowing top section emitting faint blue-white purification 
light, silent glide-cars passing on smooth road surface, pedestrians walking 
on wide footpaths, vertical gardens cascading down building facades, 
everything immaculate and surveilled — surveillance cameras subtly embedded 
in lamp posts and building corners, children walking to school passing through 
checkpoints they don't question, beautiful but unsettling in its perfection
```

### Mesh Surveillance Zone (Abstract/Tech)

```
abstract visualization of the Mesh network, countless thin blue-white light 
lines forming a 3D grid overlaid on a dark cityscape, data nodes pulsing 
at intersections, facial recognition frames highlighting pedestrians below, 
transaction data flowing as streams of light, holographic Directorate 
seal floating in the grid, everything connected — wallets, gates, streets, 
eyes — the architecture of total awareness rendered as beautiful, terrifying 
infrastructure
```

---

## PHASE 6: Negative Prompt Library

Negative prompts are critical for avoiding common AI art failure modes. Apply the base negatives to EVERY prompt, then add model-specific and target-specific negatives.

### Base Negative (Always Include)

```
cartoon, anime, manga, comic book style, 3D render, plastic, 
low quality, blurry, deformed, disfigured, extra limbs, extra fingers, 
mutated hands, poorly drawn face, mutation, ugly, oversaturated, 
neon, bright colors, white background, stock photo, generic, 
watermark, text, logo, signature, Western architecture, 
European features (unless specified), light skin (unless specified),
Marvel aesthetic, DC aesthetic, generic cyberpunk neon
```

### Model-Specific Additions

**For SDXL / Stable Diffusion (OpenArt):**
```
(add to base) worst quality, low quality, normal quality, lowres, 
jpeg artifacts, compression artifacts, duplicate, morbid, ugly, 
tiling, poorly drawn, bad anatomy, bad proportions, cloned face
```

**For Flux (OpenArt):**
```
(add to base) smooth, airbrushed, overprocessed, HDR, 
hyper-realistic uncanny valley, too clean, too perfect, 
digital art look, concept art style
```

**For Imagen (Google Flow):**
```
(Imagen uses natural language negatives rather than token lists)
"Do not generate: cartoon style, anime style, overly bright or 
saturated colors, Western architectural elements, light-skinned 
characters unless specified, generic stock photography look, 
smooth plastic skin texture, or any text/watermarks in the image."
```

### Target-Specific Additions

**For character portraits:** `bad hands, wrong number of fingers, asymmetric face, crossed eyes, looking away from camera (unless specified)`

**For environments:** `people in foreground (unless specified), too many focal points, cluttered composition, daytime bright sunshine`

**For technology:** `toy-like, chunky, low-detail, generic sci-fi prop, lightsaber-style glowing`

---

## PHASE 7: Prompt Assembly Protocol

### Step 1: Select style anchor (Phase 4) based on target type
### Step 2: Insert subject description (Character DNA from Phase 3 or custom)
### Step 3: Insert environment (Phase 5 template or custom)
### Step 4: Add lighting and mood specifics
### Step 5: Add technical parameters
### Step 6: Compile negative prompt (Phase 6)
### Step 7: Add reference image instructions (if using img2img/IP-Adapter)

### Assembled Prompt Template

```
POSITIVE PROMPT:
[STYLE ANCHOR from Phase 4]
[SUBJECT: Character Visual DNA or custom description]
[ENVIRONMENT: Phase 5 template or custom]
[LIGHTING: specific direction, color, intensity]
[COMPOSITION: camera angle, framing, depth]
[MOOD: emotional tone in 2-3 words]

NEGATIVE PROMPT:
[BASE negative from Phase 6]
[MODEL-SPECIFIC additions]
[TARGET-SPECIFIC additions]

TECHNICAL PARAMETERS:
- Model: [SDXL / Flux / Imagen / Veo]
- Aspect ratio: [based on channel format]
- Steps: [model-dependent, see §8]
- CFG/Guidance: [model-dependent, see §8]
- Seed: [note if reusing for consistency]
- Reference image: [path if using img2img/IP-Adapter]
- Reference strength: [0.3-0.7 typical]
```

---

## PHASE 8: Model-Specific Parameter Recommendations

### OpenArt — SDXL

| Parameter | Recommended | Notes |
|-----------|------------|-------|
| Steps | 30-50 | Higher for portraits, lower for backgrounds |
| CFG Scale | 7-9 | 7 for natural, 9 for more prompt adherence |
| Sampler | DPM++ 2M Karras | Good balance of quality and speed |
| Size | 1024×1024 (1:1), 832×1216 (4:5), 1216×832 (16:9) | Native SDXL resolutions |
| Denoise (img2img) | 0.4-0.6 | Lower preserves reference, higher allows more variation |

### OpenArt — Flux

| Parameter | Recommended | Notes |
|-----------|------------|-------|
| Steps | 20-30 | Flux converges faster than SDXL |
| Guidance | 3.0-4.5 | Flux uses lower guidance than SDXL |
| Size | 1024×1024 minimum | Flux handles higher res well |
| Note | — | Flux is better at natural language understanding — prompts can be more conversational |

### Google Flow — Imagen 3

| Parameter | Recommended | Notes |
|-----------|------------|-------|
| Aspect ratio | Specify in prompt | "in 16:9 aspect ratio" |
| Style | Describe in natural language | Imagen responds well to style descriptions vs. token stacking |
| Negative | Use natural language | "Avoid cartoon styles, overly bright colors..." |
| Note | — | Imagen excels at photorealism; lean into that for portraits and environments |

### Google Flow — Veo (Image-to-Video)

| Parameter | Recommended | Notes |
|-----------|------------|-------|
| Source | Final approved still image | Always start from the highest quality still |
| Duration | 4-8 seconds | Optimal for social media clips |
| Motion | Specify camera movement in prompt | "slow push in," "subtle parallax," "atmospheric fog drifting" |
| Note | — | Veo works best with subtle motion. Avoid complex character movement — stick to camera motion and environmental effects |

**Veo prompt formula:**
```
"[Source image description]. Subtle [camera movement]. [Environmental motion: 
fog drifting, light flickering, fabric moving]. Maintain cinematic atmosphere. 
No sudden movements. Smooth 4-second loop."
```

---

## PHASE 9: Consistency Enforcement Protocol

### Rule 1: Reference Sheet First
Before generating ANY content images for a character, generate (or confirm) a canonical reference sheet exists in `content-pipelines/bharatvarsh/assets/references/`. If it doesn't exist, that's the first generation task.

### Rule 2: Same Seed Anchoring
When generating multiple images of the same character across different posts, note the seed of the best result and reuse it as a starting point for subsequent generations (with denoise 0.3-0.5 to allow variation while maintaining facial similarity).

### Rule 3: IP-Adapter / Reference Image
When available in the model, ALWAYS attach the character reference sheet as an IP-Adapter reference or img2img input. This is the strongest consistency tool.

### Rule 4: Visual DNA Verbatim
The character Visual DNA (Phase 3) must appear nearly word-for-word in every prompt. Do not paraphrase or summarize — the exact phrasing has been tuned for reliable generation.

### Rule 5: Style Anchor Lock
Use the SAME style anchor (Phase 4) across an entire content series. Switching anchors mid-series creates visual inconsistency even if characters look right.

### Rule 6: Symbol Consistency
These visual symbols must remain consistent across all generated art:
- **Bharatsena:** Dark navy uniforms, gold piping, structured military aesthetic
- **The Mesh:** Blue-white light grids, thin lines, holographic data overlays
- **Oxy Poles:** Tall slender metallic poles with glowing top sections, blue-white light
- **Bracecomm:** Wrist-mounted device, holographic interface, geometric patterns
- **Akakpen:** Earth tones, organic textures, resistance-coded fabrics
- **Directorate:** Imposing architecture, gold seals, absolute order

---

## PHASE 10: Prompt Examples (Ready to Use)

### Example 1: Kahaan Character Teaser (Instagram Feed, 4:5)

**POSITIVE:**
```
cinematic portrait photography, dark moody atmospheric lighting, 
Indian cyberpunk military aesthetic, film still quality, shallow depth 
of field, volumetric fog, rim lighting from behind with warm amber edge, 
obsidian-navy color palette with mustard gold accents, subtle film grain 
texture, photorealistic, professional cinematography, Deakins-inspired 
lighting, NOT anime, NOT cartoon, NOT plastic, NOT oversaturated.

Young Indian man, early 30s, military bearing. Close-cropped black hair 
with clean fade. Sharp defined jaw, high cheekbones, warm brown skin. 
Intense dark brown eyes conveying intelligence and controlled intensity. 
Small floating tactical lens hovering near right eye emitting faint 
blue-white light. Wearing Bharatsena dress uniform: dark navy fitted 
jacket with structured shoulders, gold piping on collar and cuffs, rank 
insignia on chest. Athletic build, upright posture. Expression: focused, 
contemplative, carrying weight of authority.

Standing in a dimly lit command room with holographic tactical displays 
in the background casting blue-white light. Dark obsidian walls. 
Single overhead light creating dramatic shadows on face.

Close-up portrait framing, face and upper chest, slight low angle 
conveying authority. Shallow depth of field blurring the background.

Mood: duty, burden, precision.
```

**NEGATIVE:**
```
cartoon, anime, manga, 3D render, plastic, low quality, blurry, deformed, 
extra limbs, extra fingers, mutated hands, poorly drawn face, oversaturated, 
neon, bright colors, white background, stock photo, generic, watermark, 
text, Western architecture, European features, Marvel aesthetic, bad hands, 
wrong number of fingers, asymmetric face, worst quality, jpeg artifacts
```

**PARAMS:** SDXL, 832×1216 (4:5), Steps 40, CFG 8, DPM++ 2M Karras

---

### Example 2: Oxy Pole Boulevard (Twitter, 16:9)

**POSITIVE:**
```
cinematic wide establishing shot, dark atmospheric dystopian cityscape, 
Indian futuristic architecture blending Mughal geometric patterns with 
military-industrial infrastructure, volumetric god rays cutting through 
haze, obsidian and navy blue dominant palette with mustard gold accent 
lighting, wet reflective streets, film grain overlay, photorealistic 
matte painting quality.

Wide tree-lined boulevard in a Bharatvarsh city, clean and orderly. Tall 
sleek Oxy Poles rising at regular intervals — slender metallic columns with 
glowing top sections emitting faint blue-white purification light. Silent 
glide-cars passing on smooth road surface. Vertical gardens cascading down 
building facades. Surveillance cameras subtly embedded. Everything 
immaculate and surveilled. Beautiful but unsettling in its perfection.

Late evening golden hour fading to blue. Mustard gold light from Oxy Pole 
tops contrasting with deepening blue sky. Wet street surface reflecting 
both colors.

Wide composition, vanishing point perspective down the boulevard, 
Oxy Poles creating rhythm leading the eye.

Mood: engineered calm, beautiful oppression.
```

**NEGATIVE:**
```
cartoon, anime, 3D render, plastic, low quality, blurry, oversaturated, 
neon, bright colors, white background, stock photo, generic, watermark, 
Western architecture, generic cyberpunk neon, people in foreground, 
too many focal points, cluttered composition, daytime bright sunshine,
worst quality, jpeg artifacts, duplicate, tiling
```

**PARAMS:** SDXL, 1216×832 (16:9), Steps 35, CFG 7.5, DPM++ 2M Karras

---

### Example 3: Video Extension — Oxy Pole Boulevard (Instagram Reel, 9:16)

**Source:** Final approved still from Example 2 (rotated/cropped to 9:16)

**Veo prompt:**
```
Atmospheric cityscape boulevard at dusk. Slow push-in camera movement toward 
the vanishing point. Subtle fog drifting through the scene. Oxy Pole lights 
gently pulsing with faint blue-white glow. Reflections on wet street subtly 
shifting. A single silent glide-car passing through frame left to right in 
the distance. Maintain cinematic dark atmospheric tone. No sudden movements. 
Smooth 6-second sequence.
```

---

## PHASE 11: Iteration Protocol

When a generation doesn't meet quality standards:

1. **Wrong style:** Adjust the style anchor. Add more specific negative prompts blocking the unwanted style.
2. **Wrong face/character:** Increase reference image weight (img2img denoise down to 0.3). Add more specific facial descriptors.
3. **Wrong colors:** Explicitly name hex values in prompt: "color palette centered on dark navy (#0B2742) and obsidian black (#0F1419) with mustard gold (#F1C232) accents only."
4. **Too AI-looking / plastic:** Add "film grain, subtle skin texture, imperfections, natural lighting" to positive. Add "smooth, airbrushed, HDR, hyper-realistic uncanny valley, too perfect" to negative.
5. **Wrong composition:** Be more explicit about camera angle, framing, subject placement, and negative space.
6. **Missing signature element:** Emphasize the element with extra prompt weight — OpenArt uses `(floating tactical lens:1.4)` syntax for emphasis.

---

## Quality Checklist (Before Approving Any Asset)

- [ ] Character face matches reference sheet
- [ ] Signature element present (Kahaan's lens, Rudra's Trident, Pratap's epaulettes)
- [ ] Color palette is obsidian/navy/mustard — no unexpected colors
- [ ] No classified elements visible
- [ ] Image doesn't look "AI-generated" — has film grain, natural imperfections
- [ ] Composition leaves space for text overlay (if quote card / lore card)
- [ ] Correct aspect ratio for target channel
- [ ] No anatomical errors (hands, fingers, eyes)
- [ ] Lore-accurate tech/faction representation
- [ ] Atmospheric and cinematic, not bright or sterile

---

*This skill is the quality gate for all Bharatvarsh visual content. Every AI-generated asset passes through this framework. Update character Visual DNA when reference sheets are finalized. Add new style anchors and environment templates as the content library grows.*
