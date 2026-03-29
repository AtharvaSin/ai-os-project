# Step-by-Step Guide: Creating the Bharatvarsh Instagram Channel

> **Channel Knowledge ID:** `e7d1e4d3-89d9-47bd-bf35-39197fb1d43d` (profile) / `d1ea5a83-9c97-4bbf-8c88-139fc69f3923` (strategy)
> **Date:** 2026-03-20
> **Brand Context:** B (Bharatvarsh) — Obsidian + Mustard Gold (#F1C232) + Bebas Neue
> **Asset Pipeline:** `content-pipelines/bharatvarsh/` (prompts, templates, references)
> **Art Generation:** OpenArt (Seedream 4.5 for characters, Nano Banana for environments)

---

## Phase 1: Account Setup (10 minutes)

### Step 1.1 — Create the Instagram Account
1. Open Instagram app → Sign Up
2. Use a **dedicated email** (not your personal one) — e.g., `bharatvarsh.official@gmail.com` or route through your existing email with `+bharatvarsh` alias
3. **Username:** Try these in order (first available wins):
   - `@bharatvarsh_official`
   - `@bharatvarsh.book`
   - `@mahabharatvarsh`
   - `@welcometobharatvarsh`
4. **Full name field:** `Bharatvarsh | Indian Sci-Fi`
5. Complete signup → **immediately switch to Creator Account:**
   - Settings → Account → Switch to Professional Account → Creator → Book/Author category

### Step 1.2 — Profile Picture

Generate using **Seedream 4.5** on OpenArt. Attach `content-pipelines/bharatvarsh/assets/references/Bharatvarsh.webp` as style reference.

**Prompt (copy-paste to OpenArt):**

```
A bold circular emblem for a sci-fi book brand, dark obsidian background (#0F1419),
centered geometric design blending Mughal jali screen lattice patterns with military
insignia aesthetics, mustard gold (#F1C232) metallic lines forming an intricate
symmetrical pattern on deep navy (#0B2742) surface, faint blue-white glow emanating
from geometric intersections suggesting surveillance technology, subtle film grain
texture, clean edges suitable for small profile picture display, professional book
brand identity, minimalist but detailed, NOT text, NOT letters, NOT busy,
NOT colorful, NOT generic shield logo

--ar 1:1
--steps 30
--guidance 7.5
```

**Reference to attach:** `Bharatvarsh.webp` (for color/mood alignment)

**Alternative:** Use the existing book cover art or the `Novel Card.webp` from `content-pipelines/bharatvarsh/assets/references/` cropped to square — this gives instant brand recognition.

---

## Phase 2: Bio & Profile Setup (10 minutes)

### Step 2.1 — Write the Bio

Instagram allows 150 characters. Here are 3 options (pick one):

**Option A — Mystery-forward (recommended):**
```
What if India never fell?
Alternate history. Surveillance state. One soldier's truth.
📖 Novel out now ↓
```

**Option B — World-forward:**
```
Welcome to Bharatvarsh.
A world where 1717 changed everything.
Indian sci-fi · Alternate history
📖 Read now ↓
```

**Option C — Author-forward:**
```
Bharatvarsh — by Atharva Singh
Indian sci-fi · Alternate history · Dystopian
The truth is classified.
📖 Get the book ↓
```

### Step 2.2 — Link in Bio
Use **Linktree** or a direct link:
- Primary: `welcometobharatvarsh.com` (the website has Bhoomi AI, lore archive, timeline — it IS the funnel)
- Or set up a Linktree with:
  - Website: welcometobharatvarsh.com
  - Amazon India: amazon.in/dp/B0DKBV3XGS
  - Flipkart: search "Bharatvarsh Atharva Singh"
  - Notion Press: notionpress.com/read/bharatvarsh

### Step 2.3 — Category & Contact
- **Category:** Author (shows below name)
- **Contact button:** Add email for collaboration inquiries
- **Action button:** Link to book purchase page

---

## Phase 3: Highlight Covers (30 minutes)

Create 5 Story Highlight covers using the **atmospheric_background** style anchor. Generate on OpenArt with **Nano Banana**.

### Highlight 1: "LORE" — World-building archive

**Prompt:**
```
abstract atmospheric background, dark obsidian gradient (#0F1419 to #0A0D12),
faint geometric surveillance grid pattern barely visible, single mustard gold
(#F1C232) line forming a subtle Mughal jali screen lattice fragment in center,
volumetric fog, moody, brooding, minimal detail, cinematic film grain texture,
suitable for text overlay, NOT busy, NOT bright, NOT colorful, NOT detailed
in center

--ar 1:1
--steps 25
--guidance 7
```

**Reference:** `Mesh.webp`

### Highlight 2: "CHARACTERS" — Character spotlights

**Prompt:**
```
abstract atmospheric background, deep navy blue (#0B2742) to obsidian gradient,
faint silhouette suggestion of a military figure in fog, volumetric rim lighting
in warm amber, mustard gold (#F1C232) accent light bleeding from one edge,
cinematic film grain, dark moody atmosphere, space for text overlay in center,
NOT detailed face, NOT bright, NOT busy

--ar 1:1
--steps 25
--guidance 7
```

**Reference:** `Kahaan.webp`

### Highlight 3: "THE BOOK" — Purchase info & reviews

**Prompt:**
```
abstract atmospheric background, obsidian (#0F1419) base, subtle golden light
illuminating what appears to be the edge of a book spine, warm mustard gold
(#F1C232) glow, dust particles floating in a single beam of light, cinematic
stillness, library atmosphere but dark and military, film grain, NOT colorful,
NOT busy, NOT bright

--ar 1:1
--steps 25
--guidance 7
```

**Reference:** `Novel Card.webp`

### Highlight 4: "BTS" — Behind the scenes

**Prompt:**
```
abstract atmospheric background, dark gradient, subtle code-like or
blueprint-like geometric lines in faint mustard gold (#F1C232) suggesting
world-building schematics, obsidian base (#0A0D12), technical drawing
aesthetic blended with cinematic atmosphere, film grain overlay, clean center
for text overlay, NOT bright, NOT busy, NOT generic

--ar 1:1
--steps 25
--guidance 7
```

### Highlight 5: "BHOOMI" — AI experience on website

**Prompt:**
```
abstract atmospheric background, deep obsidian (#0F1419), subtle holographic
blue-white (#E0F0FF) geometric mesh lines forming a faint neural network
pattern, single mustard gold (#F1C232) node pulsing at center, artificial
intelligence aesthetic meets Indian geometric design, volumetric fog,
cinematic film grain, NOT bright, NOT busy, NOT generic AI imagery

--ar 1:1
--steps 25
--guidance 7
```

**Reference:** `Mesh.webp`

**Post-processing:** After generating, add the highlight title text (LORE, CHARACTERS, etc.) in **Bebas Neue** font, mustard gold (#F1C232), centered. Use Canva, Figma, or the asr-visual-studio `/render` command.

---

## Phase 4: Launch Grid — First 9 Posts

When someone visits your profile, the first 9 posts form the visual grid. Plan these intentionally.

### Grid Layout Strategy
```
┌─────────────┬─────────────┬─────────────┐
│  1. HOOK    │  2. WORLD   │  3. KAHAAN  │
│  (Reel)     │  (Carousel) │  (Portrait) │
├─────────────┼─────────────┼─────────────┤
│  4. QUOTE   │  5. TECH    │  6. RUDRA   │
│  (Static)   │  (Carousel) │  (Portrait) │
├─────────────┼─────────────┼─────────────┤
│  7. LORE    │  8. AUTHOR  │  9. CTA     │
│  (Reel)     │  (Carousel) │  (Static)   │
└─────────────┴─────────────┴─────────────┘
```

---

### Post 1: The Hook Reel — "What if India never fell?"

**Format:** 30-second Reel with atmospheric visuals + text overlay

**Visual prompt (Nano Banana, OpenArt):**

```
cinematic wide establishing shot of a futuristic Indian megacity at twilight,
dark atmospheric dystopian cityscape, Indian futuristic architecture blending
Mughal geometric patterns with military-industrial infrastructure, volumetric
god rays cutting through amber haze, obsidian and navy blue dominant palette
with mustard gold (#F1C232) accent lighting from technology elements — Oxy
Poles emitting faint blue-white purification light lining wide boulevards,
wet reflective streets, towering structures with vertical gardens and
surveillance cameras embedded in every corner, hovering transport vehicles
in distance, film grain overlay, photorealistic matte painting quality,
epic scale, NOT bright, NOT colorful, NOT utopian, NOT generic sci-fi,
NOT Western architecture

--ar 9:16
--steps 35
--guidance 7.5
```

**References to attach:** `Bharatvarsh.webp` + `Commute.webp`

**Text overlay sequence (use Canva/CapCut):**
1. "What if India never fell?" (Bebas Neue, gold)
2. "What if it became the most powerful nation on Earth?" (fade in)
3. "What if the cost... was your freedom?" (beat, dramatic)
4. "Welcome to Bharatvarsh." (logo/title card, obsidian + gold)
5. "The novel is here. Link in bio." (CTA)

**Audio:** Use trending ambient/cinematic audio or original dark atmospheric music

---

### Post 2: World Carousel — "The World of Bharatvarsh" (5-7 slides)

**Format:** Carousel with intelligence dossier framing

**Slide 1 — Cover:** `DECLASSIFIED: THE WORLD OF BHARATVARSH` (Bebas Neue title on obsidian background with gold accents)

**Slide 2 — The Premise:**

Generate with Nano Banana:
```
cinematic establishing shot of Bharatvarsh cityscape from above,
bird's eye view of a massive military-governed Indian city, geometric
grid of streets radiating from a central fortress complex, Oxy Poles
visible as glowing dots across the city, obsidian-navy palette with
mustard gold accent points, overcast sky, film grain, NOT bright,
NOT Western city layout

--ar 4:5
--steps 30
--guidance 7
```
**Reference:** `Bharatvarsh.webp`

**Text overlay:** "In 1717, India refused to fall. Centuries later, it is the world's most powerful nation — and its most surveilled."

**Slide 3 — The Mesh:**

Generate with Nano Banana:
```
abstract visualization of the Mesh surveillance network, countless thin
blue-white light lines forming a 3D grid overlaid on a dark cityscape
silhouette, data nodes pulsing at intersections in mustard gold (#F1C232),
facial recognition frames highlighting pedestrian silhouettes below,
holographic Directorate seal floating in the grid, obsidian background,
terrifying beauty of total surveillance, film grain

--ar 4:5
--steps 30
--guidance 7
```
**Reference:** `Mesh.webp`

**Text overlay:** "The Mesh sees everything. Every transaction. Every step. Every thought that almost happened."

**Slide 4 — Oxy Poles:**

Generate with Nano Banana:
```
cinematic street-level shot of an Oxy Pole boulevard at dusk, tall sleek
metallic Oxy Poles rising at regular intervals with glowing blue-white tops,
wet reflective streets, pedestrians walking through golden-hour light,
vertical gardens cascading down building facades, beautiful but unsettling
perfection, subtle surveillance cameras in lamp posts, obsidian-navy palette,
mustard gold from Oxy Pole glow, film grain

--ar 4:5
--steps 30
--guidance 7
```
**Reference:** `Oxy Pole.jpg`

**Text overlay:** "They breathe clean air because the Directorate allows it. The Oxy Poles giveth. The Oxy Poles can taketh away."

**Slide 5 — The Question:** Dark obsidian background, gold text:
`"Is peace worth your freedom?"` — large Bebas Neue, centered.

**Slide 6 — CTA:** Book cover + "Read it now. Link in bio." + purchase logos

---

### Post 3: Kahaan Character Portrait

**Format:** Single image, 4:5 portrait
**Model:** Seedream 4.5 on OpenArt

```
cinematic portrait photography of Kahaan, young Indian man, early 30s,
military bearing, close-cropped black hair with clean fade, sharp defined
jaw, high cheekbones, warm brown skin, intense dark brown eyes conveying
intelligence and controlled intensity, small floating tactical lens/HUD
monocle hovering near right eye emitting faint blue-white light, wearing
Bharatsena dress uniform: dark navy fitted jacket with structured shoulders,
gold piping on collar and cuffs, rank insignia on chest, athletic build,
upright posture, expression focused and contemplative carrying weight of
authority, dark moody atmospheric lighting, shallow depth of field,
volumetric fog, rim lighting from behind with warm amber edge, obsidian-navy
color palette with mustard gold accents, subtle film grain texture,
photorealistic, professional cinematography, Deakins-inspired lighting,
NOT anime, NOT cartoon, NOT plastic, NOT oversaturated

--ar 4:5
--steps 35
--guidance 7.5
```

**MUST attach references:**
1. `Kahaan Expressions.jpg` (face anchor — primary)
2. `Kahaan Front.png` (costume accuracy)

**Caption:**
```
PERSONNEL FILE — DECLASSIFIED

Name: Kahaan
Rank: [REDACTED]
Unit: Bharatsena Special Operations
Status: Active

"Duty is the first casualty of truth."

He was trained to protect the nation. He was never trained to question it.

What happens when the soldier sees behind the curtain?

#Bharatvarsh #IndianSciFi #AlternateHistory #Bookstagram #SciFiBooks
```

---

### Post 4: Quote Card

**Format:** Static 1:1
**Use the asr-visual-studio template** or generate background with Nano Banana:

```
atmospheric abstract background, dark obsidian gradient (#0F1419 fading to
#0A0D12), subtle surveillance grid pattern barely visible, volumetric fog,
faint mustard gold (#F1C232) light bleeding from bottom edge, cinematic film
grain texture, moody brooding, empty space in center for text readability,
minimal detail, NOT busy, NOT bright, NOT colorful

--ar 1:1
--steps 25
--guidance 7
```

**Reference:** `Question.webp`

**Text overlay (Bebas Neue, #F1C232):**
```
"WHAT WOULD YOU
SACRIFICE
FOR THE TRUTH?"

— BHARATVARSH
```

**Render with asr-visual-studio:** Use template `BHV-T-QUOTE-IG.html` from `content-pipelines/bharatvarsh/templates/instagram/` for brand-locked rendering.

---

### Post 5: Technology Carousel — "Weapons of Control" (5 slides)

Generate tech close-ups. Mix Nano Banana (environment) and Seedream 4.5 (device detail).

**Slide 1 — Title:** `CLASSIFIED DOSSIER: WEAPONS OF CONTROL` (Bebas Neue on obsidian)

**Slide 2 — Bracecomm (Seedream 4.5):**
```
cinematic macro detail shot of a Bracecomm device, advanced wrist-mounted
technology with Indian design language, intricate geometric patterns inspired
by Mughal jali screens and mandala geometry, holographic blue-white interface
projected above wrist, obsidian metal surface with mustard gold accent lines,
subtle blue glow from active screen, dark atmospheric background, shallow
depth of field, studio product photography lighting, film grain,
photorealistic, NOT generic smartwatch, NOT toy-like, NOT plastic

--ar 4:5
--steps 30
--guidance 7.5
```
**Reference:** `Bracecom Card.jpg`

**Text overlay:** "THE BRACECOMM — Your wallet. Your ID. Your leash."

**Slide 3 — Oxy Poles (Nano Banana):**
```
cinematic low-angle shot looking up at an Oxy Pole against dark sky,
towering slender metallic column with glowing blue-white purification unit
at top, mustard gold accent ring near base, dark obsidian sky with faint
stars, volumetric light emanating from the pole top, atmospheric and
monumental, film grain, NOT bright daylight

--ar 4:5
--steps 30
--guidance 7
```
**Reference:** `Oxy Pole.jpg`

**Text overlay:** "OXY POLES — They let you breathe. They can make you stop."

**Slide 4 — Pulse Gun (Seedream 4.5):**
```
cinematic detail shot of a Pulse Gun, military-grade weapon with sleek
obsidian metal body, Indian geometric design language on grip, faint
blue energy cell visible through translucent panel, mustard gold
Bharatsena insignia etched near barrel, dark atmospheric background,
studio lighting, sharp detail, film grain, NOT toy, NOT colorful,
NOT generic sci-fi blaster

--ar 4:5
--steps 30
--guidance 7.5
```
**Reference:** `Pulse Gun.png`

**Text overlay:** "PULSE GUN — Standard issue. The Directorate's final argument."

**Slide 5 — CTA:** "The technology that built an empire. The secrets that could destroy it. Read Bharatvarsh — Link in bio."

---

### Post 6: Rudra Character Portrait

**Model:** Seedream 4.5

```
cinematic portrait photography of Rudra, Indian man mid-30s, muscular
powerful build, battle-worn but disciplined, short dark hair with topknot,
full beard, olive/tan skin, deep-set intense dark eyes with a warrior's
focus, grey Trident insignia tattooed on chest partially visible, armband
with trident below right elbow, wearing hooded olive-green jacket over tan
undershirt, scarring on forearms suggesting combat history, expression of
quiet intensity and coiled readiness, dark moody atmospheric lighting,
shallow depth of field, volumetric fog, warm amber rim lighting,
earth-toned palette with grey-blue accents, subtle film grain,
photorealistic, NOT anime, NOT clean-cut, NOT generic soldier

--ar 4:5
--steps 35
--guidance 7.5
```

**MUST attach:**
1. `Rudra Expressions.png` (face anchor)
2. `Rudra Front.jpeg` (costume)
3. `Rudra Tattoos.png` (tattoo accuracy)

**Caption:**
```
PERSONNEL FILE — DECLASSIFIED

Name: Rudra
Affiliation: Grey Trident (Legacy)
Status: Active — Operating outside sanctioned channels

तत् त्वम् असि — "Thou art that."

He carries a dead order's symbol. He carries a blade older than the
Directorate. He carries a truth no one wants to hear.

Some soldiers fight for duty. Rudra fights for something the state
forgot to name.

#Bharatvarsh #IndianSciFi #AlternateHistory #GreyTrident #Bookstagram
```

---

### Post 7: Lore Reveal Reel — "The 1717 Refusal"

**Format:** 30-45 second atmospheric Reel

Generate 3-4 images with Nano Banana, animate with subtle Ken Burns or use **Veo** (Google Flow) for image-to-video:

**Image 1 — The moment (historical feel):**
```
cinematic painting of a grand Indian court scene in 1717, Mughal-era
architecture with towering marble pillars and jali screens, an Indian
emperor standing firm before foreign envoys, warm amber torchlight,
obsidian shadows in corners, atmospheric tension, historical drama
meets speculative fiction, painted film still quality, NOT bright,
NOT generic medieval fantasy, Indian cultural specificity

--ar 9:16
--steps 30
--guidance 7
```
**Reference:** `Refusal.webp`

**Text overlay sequence:**
1. "In 1717, they came to India with a demand."
2. "India said no."
3. "That single word changed everything."
4. "300 years later, India rules half the world."
5. "But at what cost?"
6. "BHARATVARSH — Link in bio"

---

### Post 8: Author Behind-the-Scenes Carousel (3-4 slides)

**Format:** Mix of real photos + generated atmospheric backgrounds

- **Slide 1:** Photo of you with the physical book (if available) or a styled flat-lay with the book + a notebook + laptop showing the website
- **Slide 2:** Screenshot of Bhoomi AI in action on the website
- **Slide 3:** Generated atmospheric background with a quote about why you wrote this
- **Slide 4:** "Ask me anything in the comments" CTA

**For Slide 3 background, use Nano Banana:**
```
atmospheric author study scene, dark moody room, single desk lamp casting
warm mustard gold (#F1C232) light on scattered papers and a closed laptop,
obsidian shadows filling the room, suggestion of world-building maps and
character sketches pinned to a wall in background (out of focus), Indian
design elements in room architecture, cinematic intimacy, film grain,
NOT bright, NOT clean modern office, NOT generic stock photo

--ar 4:5
--steps 25
--guidance 7
```

---

### Post 9: Gateway CTA — Book Purchase

**Format:** Static 1:1 or 4:5
**Use template** `BHV-T-CHAR-IG.html` from content-pipelines/bharatvarsh or generate:

```
cinematic composition with book mockup feel, dark obsidian background
(#0F1419), dramatic single light source from above casting mustard gold
(#F1C232) beam, atmospheric dust particles, text space for book title
and purchase info, film grain, premium literary aesthetic, NOT busy,
NOT bright, NOT generic book ad

--ar 4:5
--steps 25
--guidance 7
```

**Text overlay:**
```
BHARATVARSH
by Atharva Singh

"What if India never fell?"

Available now:
Amazon India · Flipkart · Notion Press

welcometobharatvarsh.com
```

---

## Phase 5: Account Settings & Growth Setup (15 minutes)

### Step 5.1 — Broadcast Channel
1. Go to your DMs → Create Broadcast Channel
2. Name: **"Bharatvarsh Intelligence Briefings"**
3. Description: "Classified lore drops, character reveals, and behind-the-scenes intel. For operatives only."
4. Share invite link in your first Story

### Step 5.2 — Content Calendar Setup
The content calendar CSV lives at `content-pipelines/bharatvarsh/calendar/content_calendar.csv`. Populate it with Week 1 content (the 9 posts above) plus the next 2 weeks of planned content.

### Step 5.3 — Hashtag Sets (Save in Instagram)

Save these as reusable hashtag groups:

**Set 1 — Lore/World:**
```
#Bharatvarsh #MahaBharatvarsh #IndianSciFi #AlternateHistory #Bookstagram #WorldBuilding #Dystopian #SpeculativeFiction
```

**Set 2 — Character:**
```
#Bharatvarsh #IndianSciFi #BookCharacters #SciFiBooks #IndianFiction #BookstagramIndia #AlternateHistoryFiction
```

**Set 3 — Author/BTS:**
```
#Bharatvarsh #IndianAuthor #DebutAuthor #WritingCommunity #Bookstagram #AuthorLife #IndianFiction
```

### Step 5.4 — Engagement Routine (Daily)
- **Morning (15 min):** Comment on 10-15 bookstagram posts. Be genuine, specific.
- **Evening (15 min):** Reply to all comments on your posts. DM welcome to new followers with a lore teaser.
- **Weekly:** 1 Story poll or quiz. Share 1 piece of UGC.

---

## Phase 6: Post-Setup — Update Channel Knowledge

Once the account is live and the handle is confirmed, run:

```
/channel-knowledge
Update Bharatvarsh Instagram: handle is @{your_final_handle}, URL is https://instagram.com/{your_final_handle}
```

---

## Reference Files

| Resource | Path |
|----------|------|
| Style Anchors | `content-pipelines/bharatvarsh/prompts/style_anchors.json` |
| Character Visual DNA | `content-pipelines/bharatvarsh/prompts/character_dna.json` |
| Environment Templates | `content-pipelines/bharatvarsh/prompts/environment_templates.json` |
| Negative Prompts | `content-pipelines/bharatvarsh/prompts/negative_prompts.json` |
| Reference Images (53) | `content-pipelines/bharatvarsh/assets/references/` |
| Reference Catalog | `content-pipelines/bharatvarsh/assets/references/REFERENCE_CATALOG.json` |
| IG Quote Template | `content-pipelines/bharatvarsh/templates/instagram/BHV-T-QUOTE-IG.html` |
| IG Character Template | `content-pipelines/bharatvarsh/templates/instagram/BHV-T-CHAR-IG.html` |
| Brand Tokens (JS) | `content-pipelines/bharatvarsh/templates/shared/brand-tokens.js` |
| Atmospheric Effects | `content-pipelines/bharatvarsh/templates/shared/atmospheric-effects.css` |
| Art Prompts Skill | `content-pipelines/bharatvarsh/skills/SKILL_BHARATVARSH_ART_PROMPTS.md` |
| Brand Identity | `knowledge-base/BRAND_IDENTITY.md` |
| Channel Profile (DB) | `knowledge_entries` ID: `e7d1e4d3-89d9-47bd-bf35-39197fb1d43d` |
| Channel Strategy (DB) | `knowledge_entries` ID: `d1ea5a83-9c97-4bbf-8c88-139fc69f3923` |

---

## Summary Checklist

| Step | Task | Est. Time | Done |
|------|------|-----------|------|
| 1.1 | Create account + switch to Creator | 5 min | ☐ |
| 1.2 | Generate & upload profile picture | 10 min | ☐ |
| 2.1 | Write bio | 5 min | ☐ |
| 2.2 | Set up link in bio | 5 min | ☐ |
| 2.3 | Set category + contact | 2 min | ☐ |
| 3 | Generate 5 highlight covers | 30 min | ☐ |
| 4.1 | Post 1: Hook Reel | 30 min | ☐ |
| 4.2 | Post 2: World Carousel | 30 min | ☐ |
| 4.3 | Post 3: Kahaan Portrait | 20 min | ☐ |
| 4.4 | Post 4: Quote Card | 15 min | ☐ |
| 4.5 | Post 5: Tech Carousel | 30 min | ☐ |
| 4.6 | Post 6: Rudra Portrait | 20 min | ☐ |
| 4.7 | Post 7: Lore Reel | 30 min | ☐ |
| 4.8 | Post 8: BTS Carousel | 20 min | ☐ |
| 4.9 | Post 9: Gateway CTA | 15 min | ☐ |
| 5.1 | Create Broadcast Channel | 5 min | ☐ |
| 5.2 | Populate content calendar | 15 min | ☐ |
| 5.3 | Save hashtag sets | 5 min | ☐ |
| 5.4 | Start engagement routine | Daily | ☐ |
| 6 | Update channel knowledge in AI OS | 2 min | ☐ |

**Total setup:** ~4-5 hours (can be batched across 2 sessions). After that, the channel strategy calls for ~2.5 hours/week ongoing (per `content-pipelines/bharatvarsh/README.md` steady-state workflow).
