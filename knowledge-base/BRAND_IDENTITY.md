# Brand Identity — AI OS Design System

> **Canonical source for all visual output from the AI Operating System.**
> All skills, artifacts, documents, infographics, and UI components MUST reference this document.
> Last updated: 2026-03-18
> Version: 1.0

---

## Quick Reference Card

```
WHAT ARE YOU BUILDING?          CONTEXT?    ACCENT         DISPLAY FONT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard / PRD / Research doc  A (OS)     Emerald #00D492  DM Sans 800
Infographic / System diagram    A (OS)     Emerald #00D492  DM Sans 700
Decision memo / Weekly review   A (OS)     Emerald #00D492  DM Sans 800
─────────────────────────────────────────────────────────────────────
Novel content / Lore document   B (BV)     Mustard #F1C232  Bebas Neue
Bharatvarsh website / marketing B (BV)     Mustard #F1C232  Bebas Neue
Faction brief / Timeline entry  B (BV)     Faction color  Bebas Neue
─────────────────────────────────────────────────────────────────────
Portfolio page / Profile content C (Port)  Violet #8b5cf6   Inter
Personal branding / LinkedIn     C (Port)  Violet #8b5cf6   Inter
Creative showcase (Dark Gallery)  C (Port)  Neon Cyan        Inter
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UNIVERSAL THREAD: JetBrains Mono appears in ALL THREE contexts.
```

---

## Context Identification Rules

Apply these rules in order. First match wins.

### → Context A: AI OS System

**Triggers:** Any of these keywords or descriptions:
`ai os`, `operating system`, `dashboard`, `portal`, `prd`, `product requirements`,
`system design`, `architecture`, `research doc`, `decision memo`, `weekly review`,
`morning brief`, `infographic`, `data visualization`, `technical report`,
`sprint planning`, `roadmap`, `kanban`, `gantt`, `pipeline`, `mcp`, `cloud run`,
`domain health`, `life graph`, `workflow`, `zealogics`, `professional work`

**Default:** When in doubt about context and content is work/technical → Context A

### → Context B: Bharatvarsh

**Triggers:** Any of these keywords:
`bharatvarsh`, `mahabharatvarsh`, `novel`, `lore`, `faction`, `character`,
`welcometobharatvarsh`, `timeline`, `alternate history`, `cyberpunk india`,
`promotional`, `bhv`, `bharat`, `marketing` (when related to novel)

### → Context C: Portfolio

**Triggers:** Any of these keywords:
`portfolio`, `personal website`, `atharvasingh.com`, `personal branding`,
`profile page`, `linkedin`, `resume site`, `showcase`

---

## Context A: AI OS System

*Wibify-inspired. Obsidian Aurora evolution. Machine intelligence meets craft.*
*Source: wibify.agency extraction + existing Obsidian Aurora (INTERFACE_STRATEGY.md)*

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--a-bg-void` | `#0a0a0a` | Deepest background |
| `--a-bg-base` | `#0d0d14` | Default page background |
| `--a-bg-surface` | `#12121e` | Cards, panels |
| `--a-bg-elevated` | `#1a1a2e` | Hover states |
| `--a-border` | `#1f1f35` | Dividers, card borders |
| `--a-accent-primary` | `#00D492` | **THE ONE accent** — CTAs, active, key data |
| `--a-accent-warning` | `#E8B931` | Warnings |
| `--a-accent-danger` | `#FF6B6B` | Errors |
| `--a-text-primary` | `#EEEAE4` | Headings |
| `--a-text-secondary` | `#A09D95` | Body |
| `--a-text-muted` | `#606060` | Labels, captions |
| `--a-text-label` | `#00D492` | Section labels |

> **Critical rule:** `--a-accent-primary` is the ONE signature color. It should appear maximum
> 3-5 times per screen. If you find yourself using it everywhere, you're using it wrong.
> It marks: the active state, the most important CTA, the key data point. That's it.

### Typography (Context A)

| Role | Font | Weight |
|------|------|--------|
| Display (hero only) | Instrument Serif | 400 |
| Heading | DM Sans | 700-800 |
| Body | DM Sans | 400 |
| Label | DM Sans | 600, UPPERCASE, tracked |
| Data / Mono | JetBrains Mono | 400/600 |

**Section number grammar:** `01 — Section Title` (number in JetBrains Mono accent color)

### Type Scale (Context A)

| Element | Size | Weight | Case | Font |
|---------|------|--------|------|------|
| Section number label | 11px | 600 | UPPERCASE + tracked | DM Sans |
| Eyebrow / category | 12px | 600 | UPPERCASE + tracked | DM Sans |
| Card title | 16px | 700 | Sentence | DM Sans |
| Section heading | 20-24px | 700 | Sentence | DM Sans |
| Page heading | 28-36px | 800 | Sentence | DM Sans |
| Display / Hero | 42-64px | 400 | Sentence | Instrument Serif |
| Body copy | 14px | 400 | — | DM Sans |
| Caption / label | 12px | 400 | — | DM Sans |
| Data / metric | 13px | 400/600 | — | JetBrains Mono |
| Large metric | 32-48px | 600 | — | JetBrains Mono |

### Spatial System (Context A)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | |
| `--space-sm` | 8px | |
| `--space-md` | 16px | |
| `--space-lg` | 24px | |
| `--space-xl` | 40px | Section internal padding |
| `--space-2xl` | 64px | Section-to-section breathing room |
| `--space-3xl` | 96px | Major visual breaks |
| `--radius-sm` | 4px | Tight, precise corners (not rounded) |
| `--radius-md` | 8px | Cards, panels |
| `--radius-lg` | 12px | Modals, large surfaces |

**Spacing philosophy:** Generous whitespace between sections. Tight, precise within components.

### Component Patterns (Context A)

**Cards:**
```css
background: var(--a-bg-surface);
border: 1px solid var(--a-border);
border-radius: var(--radius-md);
/* No box-shadow. Border defines the edge. */
```

**Section Labels:**
```css
font-family: 'DM Sans';
font-size: 11px;
font-weight: 600;
letter-spacing: 0.15em;
text-transform: uppercase;
color: var(--a-accent-primary);
```

**Metric / KPI Display:**
```css
font-family: 'JetBrains Mono';
font-size: 36px;
font-weight: 600;
color: var(--a-text-primary);
/* Accompanied by 12px DM Sans label below */
```

**Data Tables:**
```css
/* Header row */
background: var(--a-bg-elevated);
border-bottom: 1px solid var(--a-border);
/* Alternating rows */
background: var(--a-bg-surface) / var(--a-bg-base);
/* Focus/hover row */
border-left: 2px solid var(--a-accent-primary);
```

### Anti-Patterns (Context A)
- ✗ Inter, Roboto, Arial, system-ui
- ✗ Purple gradients on any background
- ✗ Multiple competing accent colors in one view
- ✗ Glassmorphism / blur effects
- ✗ Film grain or vignette textures
- ✗ Border radius > 12px
- ✗ Using `--accent-sys` purple as a primary accent
- ✗ Decorative illustrations or icons that aren't functional
- ✗ Generic card pattern: white/light card with shadow on white page
- ✗ Hero sections with gradient text (looks like a SaaS template, not an OS)

---

## Context B: Bharatvarsh

*Dystopian-cinematic. Military precision meets Indian heritage.*
*Source: brand-guide-bharatvarsh-website.md (LOCKED)*

### Color Tokens

**Backgrounds (Obsidian):**

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--obsidian-950` | `#0A0D12` | `bg-obsidian-950` | Deepest bg, outer wrapper |
| `--obsidian-900` | `#0F1419` | `bg-obsidian-900` | **Base app background** |
| `--obsidian-850` | `#141A21` | `bg-obsidian-850` | Intermediate layer |
| `--obsidian-800` | `#1A1F2E` | `bg-obsidian-800` | Surface cards |
| `--obsidian-700` | `#252A3B` | `bg-obsidian-700` | Elevated surfaces |
| `--obsidian-600` | `#323848` | — | Borders, dividers |

**Primary (Navy):**

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--navy-900` | `#0B2742` | `bg-navy-900` | Deep navy sections, faction-military bg |
| `--navy-800` | `#0D3050` | `bg-navy-800` | |
| `--navy-700` | `#11405F` | `bg-navy-700` | |
| `--navy-600` | `#15506E` | `bg-navy-600` | |
| `--navy-500` | `#1A607D` | `bg-navy-500` | |

**Accent: Mustard Gold (Primary Interactive):**

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--mustard-400` | `#F5D56A` | | Light highlight |
| `--mustard-500` | `#F1C232` | `ring-mustard-500` | **PRIMARY interactive/selection** |
| `--mustard-600` | `#D9AD2B` | | Hover state |
| `--mustard-700` | `#B8921F` | | Active/pressed |

**Accent: Powder Blue (Technical/Secondary):**

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--powder-100` | `#E8F1F8` | | |
| `--powder-200` | `#D1E3F1` | | |
| `--powder-300` | `#C9DBEE` | `text-accent` | **Accent text, technical readouts** |
| `--powder-400` | `#A8C5DD` | | |
| `--powder-500` | `#87AFCC` | | |

**Text:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--b-text-primary` | `#F0F4F8` | Main body text |
| `--b-text-secondary` | `#A0AEC0` | Supporting text |
| `--b-text-muted` | `#718096` | Disabled, inactive |
| `--b-text-accent` | `var(--powder-300)` | Highlighted, technical |

**Semantic Status Colors:**

| Name | Hex | Usage |
|------|-----|-------|
| `status-alert` | `#DC2626` | Red — danger |
| `status-warning` | `#F59E0B` | Amber |
| `status-success` | `#10B981` | Green |
| `status-info` | `#3B82F6` | Blue |

### Faction Colors

| Faction | Hex |
|---------|-----|
| Military | `#0B2742` |
| Mesh | `#8B5CF6` |
| Resistance | `#DC2626` |
| Republic | `#3B82F6` |
| Guild | `#F1C232` |

### Timeline Event Type Colors

| Type | Hex |
|------|-----|
| Economic | `#F1C232` (Mustard) |
| Political | `#0B2742` (Navy) |
| Conflict | `#DC2626` (Red) |
| Governance | `#10B981` (Green) |
| Era marker | `#8B5CF6` (Purple) |

### Typography (Context B)

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display / Titles | Bebas Neue | 400 | Bold, military-style titles, numbers |
| Body / Base | Inter | 400 | Standard UI copy, readable text |
| Lore / Narrative | Crimson Pro | 400/600 | Historical docs, narrative passages |
| Devanagari | Noto Sans Devanagari | 400 | All Hindi/Devanagari rendering |
| Monospace | JetBrains Mono | 400 | Terminal UI, data printouts, technical logs |

### Atmospheric Effects

Always use these CSS classes (defined in Bharatvarsh globals.css):
`.film-grain` | `.vignette` | `.surveillance-grid` | `.digital-grid` | `.aged-paper`
`.animate-scanline-scroll` | `.animate-screen-flicker` | `.animate-glow-pulse`

**Texture Classes:**

| Class | Effect | Usage Rule |
|-------|--------|------------|
| `.film-grain` | SVG noise overlay (opacity 0.04) | Apply to page wrapper and hero sections |
| `.vignette` | Radial gradient darkens edges | Apply to full-page bg containers |
| `.surveillance-grid` | Subtle rectangular grid pattern | Background texture for UI sections |
| `.digital-grid` | Tight cyan grid | Data/terminal UI elements |
| `.aged-paper` | Yellowish overlay | Historical document sections |

**Gradients:**

| Name | Definition |
|------|------------|
| `bg-gradient-hero` | Vertical: Obsidian-900 → Navy-900 |
| `bg-gradient-card` | 135deg: Obsidian-800 → Obsidian-700 |
| `text-gradient` | Premium: Powder-300 → Mustard-500 |

**Glow Variables:**

| Variable | Value | Usage |
|----------|-------|-------|
| `--glow-mustard` | `0 0 20px rgba(241,194,50,0.3)` | Active interactive elements |
| `--glow-powder` | `0 0 20px rgba(201,219,238,0.2)` | Technical/scanner elements |
| `--glow-mesh` | `0 0 30px rgba(139,92,246,0.2)` | Mesh faction content |

**Key Animations:**

| Class | Effect |
|-------|--------|
| `.animate-scanline-scroll` | Screen/data feed monitors |
| `.animate-screen-flicker` | Malfunctioning/dystopian screens |
| `.animate-glow-pulse` | Critical data, active elements |
| `.animate-text-glow` | Pulsing text shadow |
| `.animate-fade-in` | Standard entrance |

### Content Types & Design Treatment (Context B)

| Content Type | Primary Font | Bg | Key Accent |
|---|---|---|---|
| Character profile | Bebas Neue + Inter | Obsidian 900 | Faction color |
| Timeline entry | Bebas Neue + Crimson Pro | Navy 900 | Event type color |
| Lore document | Crimson Pro | Obsidian 850 | Powder 300 |
| Faction brief | Bebas Neue | Faction bg | Mustard 500 |
| Terminal/data | JetBrains Mono | Obsidian 950 | Digital grid |
| Marketing/social | Bebas Neue | Gradient hero | Mustard 500 |
| Promotional poster | Bebas Neue | Full cinematic | Film grain + vignette |

### Anti-Patterns (Context B)
- ✗ Instrument Serif or DM Sans 800 headings
- ✗ Violet/Coral from Context C
- ✗ Mustard gold as a background (always accent ON obsidian)
- ✗ Neon cyan/magenta gallery accents
- ✗ Light mode / white backgrounds
- ✗ Blue-purple gradients on white backgrounds
- ✗ `.film-grain` on small inline elements (only page-level)
- ✗ Faction colors outside of their faction context
- ✗ Hindi text in any font other than Noto Sans Devanagari

---

## Context C: Portfolio Website

*Dual-mode professional portfolio. Light mode clarity + Dark Gallery drama.*
*Source: brand-guide-portfolio-website.md (LOCKED)*

### Color Tokens

**Primary Colors (AI/Product — Deep Violet/Purple):**

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary-50` | `#f5f3ff` | Very light tint |
| `--primary-100` | `#ede9fe` | Light bg tint |
| `--primary-500` | `#8b5cf6` | **Base primary** |
| `--primary-600` | `#7c3aed` | Hover/active state |
| `--primary-900` | `#4c1d95` | Deep primary |

**Accent Colors (Creative — Warm Coral/Orange):**

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-50` | `#fff7ed` | Very light tint |
| `--accent-100` | `#ffedd5` | Light bg tint |
| `--accent-500` | `#f97316` | **Base accent** |
| `--accent-600` | `#ea580c` | Hover/active |
| `--accent-900` | `#7c2d12` | Deep accent |

**Neutral Colors:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--neutral-50` | `#fafafa` | **Light mode page background** |
| `--neutral-100` | `#f5f5f5` | Light surface |
| `--neutral-500` | `#737373` | Muted text |
| `--neutral-900` | `#171717` | Main text (light mode) |

**Light Mode (Default):**

| Token | Hex | Usage |
|-------|-----|-------|
| `--c-bg-light` | `#fafafa` | Page background |
| `--c-surface-light` | `#f5f5f5` | Cards |
| `--c-primary` | `#8b5cf6` | **PRIMARY — violet** |
| `--c-primary-hover` | `#7c3aed` | Hover |
| `--c-accent` | `#f97316` | **SECONDARY — coral** |
| `--c-accent-hover` | `#ea580c` | Hover |
| `--c-text-heading` | `#171717` | Headings |
| `--c-text-body` | `neutral-700` | Body |
| `--c-text-muted` | `#737373` | Captions |

**Dark Gallery Mode:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--c-dark-bg` | gradient `#0a0a0a→#171717→#0a0a0a` | Gallery bg |
| `--c-dark-surface` | `#171717` | Gallery cards |
| `--c-dark-surface-light` | `#262626` | Gallery hover surface |
| `--c-dark-text` | `#fafafa` | Gallery text |
| `--c-dark-text-dim` | `#a3a3a3` | Gallery secondary text |
| `--c-neon-cyan` | `#00ffff` | Gallery highlight |
| `--c-neon-magenta` | `#ff00ff` | Gallery accent |
| `--c-neon-orange` | `#ff6b35` | Gallery warm |
| `--c-neon-purple` | `#b026ff` | Gallery purple |

**Semantic Colors:**

| Name | Hex |
|------|-----|
| Success | `#22c55e` |
| Error | `#ef4444` |
| Warning | `#f59e0b` |

### Typography (Context C)

| Role | Font | Usage |
|------|------|-------|
| ALL text | **Inter** | Universal — light + dark modes |
| Monospace | system monospace | Code only |

**NOTE:** Portfolio uses Inter as its primary font. This is intentional — the portfolio
is about accessibility and professional clarity, not typographic drama.

**Font Size Scale (responsive via clamp):**

| Element | clamp() formula | At min | At max |
|---------|----------------|--------|--------|
| H1 | `clamp(2.25rem, 1.6rem + 2vw, 3.75rem)` | 36px | 60px |
| H2 | `clamp(1.75rem, 1.4rem + 1.4vw, 3rem)` | 28px | 48px |
| H3 | `clamp(1.35rem, 1.1rem + 1vw, 2.25rem)` | ~22px | 36px |
| H4 | `clamp(1.125rem, 1.02rem + 0.5vw, 1.75rem)` | 18px | 28px |
| Body | `clamp(1rem, 0.96rem + 0.3vw, 1.125rem)` | 16px | 18px |

### Two-Mode Strategy (Context C)

| Mode | When | Background | Text | Accents |
|------|------|-----------|------|---------|
| Light (Professional) | Default portfolio pages | `neutral-50` | `neutral-900` | `primary-500` + `accent-500` |
| Dark Gallery | Artwork / creative showcase | gradient `#0a0a0a` | `#fafafa` | Neon Cyan/Magenta/Orange |

**Rule:** Never mix light-mode components with Dark Gallery backgrounds. The transition
between modes should be a full section break, not gradual.

### Components (Context C)

**Buttons:**

| Class | Description |
|-------|-------------|
| `.btn-primary` | Solid primary violet, scales on hover |
| `.btn-secondary` | White bg, gray border, neutral text |
| `.btn-ghost` | Transparent, primary text |
| `.btn-accent` | Solid coral/orange |
| `.btn-neon` | Dark Gallery only — glowing border |

**Cards:**

| Class | Description |
|-------|-------------|
| `.card` | Base: rounded-lg, subtle shadow |
| `.card-interactive` | Adds pointer, ring focus |
| `.card-lg` | Larger radius, stronger shadow, lifts on hover |
| `.artwork-frame` | Dark Gallery — dark border, glow on hover |

**Glassmorphism:**

| Class | Description |
|-------|-------------|
| `.glass` | `bg-white/80` + backdrop blur — LIGHT mode |
| `.glass-dark` | `bg-neutral-900/80` + backdrop blur — DARK mode |

### Anti-Patterns (Context C)
- ✗ Bebas Neue or Instrument Serif
- ✗ Mustard gold from Context B
- ✗ Obsidian backgrounds outside Dark Gallery sections
- ✗ Film grain or surveillance textures
- ✗ DM Sans 800 headings
- ✗ Neon accents on the light-mode version

---

## Cross-Context Rules

### What's Universal (All Three Contexts)

1. **JetBrains Mono** — data, metrics, code, timestamps. Always. In every context.
2. **No filler copy** — every word earns its place
3. **No decorative shadows** unless they're functional (glow = meaning, not decoration)
4. **Grid/column structure** — content lives in columns, not freeform
5. **Mobile-first spacing** — never less than 16px padding on mobile

### What's Forbidden in All Contexts

- Generic gradient text spans spanning entire headings (only Context A may use it sparingly for hero)
- Cookie-cutter SaaS layout: hero → features grid → CTA → footer (unless it's genuinely the right layout)
- Using `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` on dark backgrounds (invisible/meaningless)
- Tables without brand color in header row
- Mixing contexts: no mustard in Context A, no violet in Context B

### Font Context Lock Table

| Font | A (OS) | B (BV) | C (Port) |
|------|--------|--------|----------|
| Instrument Serif | ✓ Display only | ✗ | ✗ |
| DM Sans | ✓ Primary | ✗ | ✗ |
| Bebas Neue | ✗ | ✓ Primary | ✗ |
| Crimson Pro | ✗ | ✓ Lore | ✗ |
| Inter | ✗ | ✓ Body | ✓ All |
| Noto Sans Devanagari | ✗ | ✓ Hindi | ✗ |
| **JetBrains Mono** | **✓** | **✓** | **✓** |

---

## Mandatory Pre-Output Declaration

Before producing ANY visual output, state:

```
CONTEXT: [A / B / C]
CONTENT TYPE: [doc / artifact / infographic / UI / presentation]
ACCENT COLOR: [hex]
DISPLAY FONT: [font name]
```

If you cannot identify the context, ask before proceeding.
