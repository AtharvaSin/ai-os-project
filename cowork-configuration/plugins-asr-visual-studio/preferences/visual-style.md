# Visual Style Preferences — Atharva Singh

> Read this file BEFORE every render. These rules override generic defaults.
> Source truth: knowledge-base/BRAND_IDENTITY.md + knowledge-base/BHARATVARSH_VISUAL_GUIDE.md

---

## The Anti-Generic Mandate

The #1 goal is that every output looks like it came from Atharva's studio, not from a template library. Generic visual content has these tells — avoid ALL of them:

**Generic tells to eliminate:**
- Centered text on a gradient background (the "Canva slide" look)
- Perfectly symmetrical layouts with no visual tension
- Stock photo with text overlay and no compositional thought
- Drop shadows and rounded corners everywhere
- White/light text on a vaguely dark background with no intentional hierarchy
- Gradients that serve no narrative purpose (just "looks pretty")
- Safe, predictable 50/50 text-image splits

**What makes output distinctly Atharva's:**
- Asymmetric layouts that create visual tension and hierarchy
- Intentional negative space — not filling every pixel
- Typography that has rhythm (size jumps of 2x or more between levels)
- A single hero element (one image, one number, one word) that dominates
- Brand-specific textures and effects (grain for B, glow for A, gradient accents for C)
- Footer/metadata in JetBrains Mono as a quiet signature across all contexts

---

## Context A — AI OS: The Intelligence Aesthetic

**Reference:** wibify.agency dark mode. Obsidian Aurora design system.

**Composition rules:**
- Left-aligned text, always. Never center headlines. The left edge is the power position.
- Headlines in DM Sans 800, sentence case. Never ALL CAPS for Context A.
- Accent emerald `#00D492` appears in exactly 1-3 places per asset: accent bar, one key word, footer dot. That's it.
- Background: solid `#0A0A0A` or very subtle gradient to `#1A1A1A`. No complex gradients.
- Grid pattern overlay at 3-5% opacity adds technical depth without screaming "tech."
- Metric-style callouts: large JetBrains Mono numbers with small DM Sans labels underneath.
- Section labels: `01 —` prefix in accent color, JetBrains Mono, 11px, UPPERCASE, tracked.

**Layout patterns (choose one per asset):**
1. **The Dashboard Card** — dark background, accent bar top-left, headline, subtitle, metric in bottom-right corner
2. **The Terminal** — JetBrains Mono dominates, minimal decoration, data-first, accent only on the key metric
3. **The Hero Statement** — one oversized headline (48-64px), tiny subtitle, massive negative space

**Effects:**
- Subtle box-shadow glow on accent elements: `0 0 30px #00D49240`
- No film grain. No vignette. Clean and precise.
- Border: 1px solid `#1f1f35`. Not rounded >8px.

**What it should feel like:** A command center readout. Intelligent. Precise. Like the OS itself is presenting data.

---

## Context B — Bharatvarsh: The Cinematic Frame

**Reference:** knowledge-base/BHARATVARSH_VISUAL_GUIDE.md (full art direction), welcometobharatvarsh.com

**Composition rules:**
- Bebas Neue ALL CAPS for titles. Letter-spacing: 0.15em. This is non-negotiable.
- Text is ALWAYS bottom-anchored or bottom-third. The top 2/3 is atmosphere.
- Film grain overlay at 5-8% opacity, animated seed per frame for video.
- Vignette: radial gradient darkening edges, heaviest at top corners.
- Background: never flat black. Use `#0A0D12` → `#0F1419` gradients (obsidian scale from brand guide).
- Mustard gold `#F1C232` for accent bar, badge text, or one key word highlight. Sparse usage.
- Cinematic letterboxing: thin black bars top/bottom at 2.35:1 crop even on 16:9 assets adds film quality.

**Layout patterns:**
1. **The Poster** — atmospheric background (dark, textured), bold title in lower third, thin accent bar, minimal text
2. **The Intel Report** — classified document aesthetic. Redacted zones (black bars), faction stamps, JetBrains Mono for dates/codes, mustard accent on clearance level
3. **The Character Reveal** — image on one side (60%), text on remaining 40%, name in Bebas Neue, epithet or role in JetBrains Mono small

**Effects:**
- Film grain (feTurbulence SVG, fractalNoise, baseFrequency 0.65, 3 octaves)
- Vignette (radial-gradient from transparent center to rgba(0,0,0,0.6) at edges)
- Warm color shift: desaturate slightly, shift toward amber/sepia
- Scan lines at 2% opacity for CRT/surveillance feel on certain compositions
- NO glow effects. Bharatvarsh is analog, not digital.

**Faction-aware styling (when content mentions a faction):**
- Bharatsena: navy `#0D1B2A` background tint, powder-blue `#BFD7EA` for secondary text, mustard `#FFB703` emblem accent
- The Mesh: steel-cyan tech accents, pale grey, surveillance grid pattern
- Tribhuj: grey tones, orange cloth texture accents, resistance/underground feel
- Akakpen: deep green `#162B18`, marigold `#FFC933` warning accents

**What it should feel like:** A frame from a Villeneuve or Nolan film. Atmospheric, weighty, a world that existed before you looked at it.

---

## Context C — Portfolio: The Modern Authority

**Reference:** Professional but distinctly creative. Not corporate. Not startup-bro.

**Composition rules:**
- Inter 700-800 for headlines, sentence case. Clean and readable.
- Violet `#8b5cf6` as primary accent, coral `#f97316` as secondary. Use ONE per asset, never both in equal measure.
- Can go light OR dark background depending on platform:
  - LinkedIn: prefer dark (`#0F0F0F`) — stands out in the feed
  - General social: dark or light, context-dependent
- Typography-forward: let the words do the work, images are supporting.
- Gradient accent: subtle violet→coral gradient on a single element (accent bar, underline, border) — never as background fill.

**Layout patterns:**
1. **The Thought Leader** — headline dominates, small author byline in JetBrains Mono, violet accent underline on one key phrase
2. **The Proof Point** — large JetBrains Mono metric (like "64 tools" or "26 skills"), context sentence below, violet accent
3. **The Carousel Anchor** — bold statement, "read more" or "swipe" indicator, clean negative space

**Effects:**
- Subtle glow on violet elements: `0 0 20px #8b5cf640`
- No film grain. No vignette.
- Clean geometry — lines, bars, dots as decorative elements, not textures

**What it should feel like:** A senior tech leader's personal brand. Confident, knowledgeable, distinctive — the kind of LinkedIn post that gets saved, not just liked.

---

## Universal Composition Rules (All Contexts)

1. **Text hierarchy must be aggressive.** If headline is 52px, subtitle must be ≤24px. No gentle gradations.
2. **One focal point per asset.** The eye should have exactly one place to go first.
3. **JetBrains Mono is the signature thread.** It appears in footers, metrics, dates, and code references across all three contexts. This is the subtle unifying element that says "this is Atharva's."
4. **Accent color is surgical.** Maximum 3 accent-colored elements per composition. The power is in restraint.
5. **Negative space is a feature.** 30-40% of the canvas should be intentionally empty.
6. **No centered text layouts.** Left-align or bottom-anchor. Center alignment is the hallmark of template design.
7. **Every asset gets an accent bar.** 60-100px wide, 3-4px tall, in the context's accent color. Position it to anchor the text block. This is Atharva's visual signature.
