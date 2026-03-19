# Brand Context Reference

This file is loaded by skills that produce visual output. Every visual asset MUST declare one brand context before rendering.

**Before rendering, ALWAYS read these preference files in order:**
1. `${CLAUDE_PLUGIN_ROOT}/preferences/visual-style.md` — Anti-generic mandate, composition rules, layout patterns per context
2. `${CLAUDE_PLUGIN_ROOT}/preferences/copy-tone.md` — Voice, headline rules, word banks per context
3. `${CLAUDE_PLUGIN_ROOT}/preferences/platform-rules.md` — Per-platform composition, text density, sizing rules

**For deep brand reference (read when doing complex or first-time renders):**
- `knowledge-base/BRAND_IDENTITY.md` — Full color tokens, typography scales, spatial system, CSS patterns, anti-patterns
- `knowledge-base/BHARATVARSH_VISUAL_GUIDE.md` — Character appearances, faction colors, architecture, art direction
- `knowledge-base/BHARATVARSH_WRITING_GUIDE.md` — Narrative voice, dialogue conventions, terminology

**For mood reference (check if files exist):**
- `${CLAUDE_PLUGIN_ROOT}/references/mood-boards/context-a/` — AI OS inspiration images
- `${CLAUDE_PLUGIN_ROOT}/references/mood-boards/context-b/` — Bharatvarsh inspiration images
- `${CLAUDE_PLUGIN_ROOT}/references/mood-boards/context-c/` — Portfolio inspiration images
- `${CLAUDE_PLUGIN_ROOT}/references/examples/approved/` — Past outputs that hit the mark
- `${CLAUDE_PLUGIN_ROOT}/references/examples/rejected/` — Anti-patterns from past renders

---

## Context A — AI OS System
- **Aesthetic:** Dark, precise, electric-accented. Wibify.agency-inspired. Command-center feel.
- **Display Font:** DM Sans 700–800 (headings, titles). Instrument Serif 400 for hero-only display.
- **Mono Font:** JetBrains Mono (data, metrics, code, timestamps, section numbers)
- **Accent Color:** Electric Emerald `#00D492` — THE ONE accent. Max 3 uses per asset.
- **Background:** Void `#0A0A0A`, Base `#0D0D14`, Surface `#12121E`, Elevated `#1A1A2E`
- **Text:** Primary `#EEEAE4`, Secondary `#A09D95`, Muted `#606060`, Labels `#00D492`
- **Borders:** `#1F1F35`. Max radius 8px. No shadows — border defines the edge.
- **Section labels:** `01 —` prefix, JetBrains Mono, 11px, UPPERCASE, tracked, accent color
- **Layout:** Left-aligned. Never center. Generous negative space between sections.
- **Effects:** Subtle glow on accent elements (`0 0 30px #00D49240`). Optional grid pattern at 3-5% opacity.
- **Anti-patterns:** No film grain, no vignette, no gradient text, no rounded corners >12px, no Inter/Roboto/Arial
- **Use for:** Dashboard screenshots, PRDs, research reports, AI OS infographics, tech content, sprint updates

## Context B — Bharatvarsh
- **Aesthetic:** Dystopian-cinematic. Dark, atmospheric, narrative-driven. Villeneuve/Nolan visual weight.
- **Display Font:** Bebas Neue, ALL CAPS, letter-spacing 0.15em. Non-negotiable.
- **Mono Font:** JetBrains Mono (dates, data overlays, faction codes, clearance levels)
- **Accent Color:** Mustard Gold `#F1C232` — sparse, surgical usage
- **Background:** Obsidian scale: `#0A0D12` → `#0F1419` → `#141A21` → `#1A1F2E`. Never flat black.
- **Text:** Off-white `#E8E8E8` / Aged paper `#D4C5A0`
- **Texture:** Film grain (feTurbulence, baseFrequency 0.65, 5-8% opacity), vignette (radial darkening at edges)
- **Layout:** Text ALWAYS bottom-anchored or bottom-third. Top 2/3 is atmosphere.
- **Effects:** Grain, vignette, warm color shift, optional scan lines at 2%. Cinematic letterbox (2.35:1 bars).
- **Anti-patterns:** No glow effects (Bharatvarsh is analog), no bright colors, no cheerful palettes, no generic sci-fi
- **Faction styling:** Bharatsena (navy+powder-blue+mustard), Mesh (steel-cyan+grey), Tribhuj (grey+orange), Akakpen (deep green+marigold)
- **Use for:** Novel marketing, character reveals, lore posts, book trailers, world-building content

## Context C — Personal Portfolio
- **Aesthetic:** Modern, clean, authoritative. Professional but not corporate. Not startup-bro.
- **Display Font:** Inter 700–800, sentence case. Clean and readable.
- **Mono Font:** JetBrains Mono (code snippets, technical details, footer attribution)
- **Primary Accent:** Violet `#8b5cf6` — use for ONE accent element per asset
- **Secondary Accent:** Coral `#f97316` — never equal weight with violet. One dominates.
- **Background:** Dark preferred for LinkedIn (`#0F0F0F`). Light or dark context-dependent elsewhere.
- **Text:** White `#FFFFFF` / Muted `#B0B0B0`
- **Layout:** Typography-forward. Words do the work, images are supporting.
- **Effects:** Subtle violet glow (`0 0 20px #8b5cf640`). Gradient accent (violet→coral) on single element only.
- **Anti-patterns:** No film grain, no vignette, no stock photos, no SaaS-template gradients
- **Use for:** LinkedIn content, portfolio pieces, AI&U channel, personal brand, professional social media

## Universal Rules
- JetBrains Mono appears in ALL three contexts — the unifying signature thread
- Contexts are mutually exclusive — never mix
- Every visual output declares its context before rendering
- Accent bar (60-100px × 3-4px, accent color) on every asset — Atharva's visual signature
- Maximum 3 accent-colored elements per composition. Restraint is power.
- No centered text layouts. Left-align or bottom-anchor.
- Text hierarchy must be aggressive: 2x+ size jumps between levels
- 30-40% intentional negative space per canvas
- No exclamation marks in headlines. No emoji in rendered assets.
- When user doesn't specify context, infer from content topic:
  - AI/tech/OS topics → Context A
  - Novel/lore/fiction → Context B
  - Professional/personal/career → Context C
