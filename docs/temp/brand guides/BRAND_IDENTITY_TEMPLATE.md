# Brand Identity — AI OS Design System

> **Canonical source for all visual output from the AI Operating System.**
> All skills, artifacts, documents, infographics, and UI components MUST reference this document.
> Last updated: [DATE — fill in when generating]
> Version: 1.0

---

## Quick Reference Card

```
WHAT ARE YOU BUILDING?          CONTEXT?    ACCENT         DISPLAY FONT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard / PRD / Research doc  A (OS)     [accent-A]     DM Sans 800
Infographic / System diagram    A (OS)     [accent-A]     DM Sans 700
Decision memo / Weekly review   A (OS)     [accent-A]     DM Sans 800
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

[CLAUDE CODE: Fill these in from specs/SPEC_CONTEXT_A.md after Phase 1 extraction]

| Token | Hex | Usage |
|-------|-----|-------|
| `--a-bg-void` | `[EXTRACTED]` | Deepest background |
| `--a-bg-base` | `#0d0d14` | Default page background |
| `--a-bg-surface` | `#12121e` | Cards, panels |
| `--a-bg-elevated` | `#1a1a2e` | Hover states |
| `--a-border` | `#1f1f35` | Dividers, card borders |
| `--a-accent-primary` | `[EXTRACTED]` | **THE ONE accent** — CTAs, active, key data |
| `--a-accent-warning` | `#E8B931` | Warnings |
| `--a-accent-danger` | `#FF6B6B` | Errors |
| `--a-text-primary` | `#EEEAE4` | Headings |
| `--a-text-secondary` | `#A09D95` | Body |
| `--a-text-muted` | `#606060` | Labels, captions |
| `--a-text-label` | `[same as accent-primary]` | Section labels |

### Typography (Context A)

| Role | Font | Weight |
|------|------|--------|
| Display (hero only) | Instrument Serif | 400 |
| Heading | DM Sans | 700–800 |
| Body | DM Sans | 400 |
| Label | DM Sans | 600, UPPERCASE, tracked |
| Data / Mono | JetBrains Mono | 400/600 |

**Section number grammar:** `01 — Section Title` (number in JetBrains Mono accent color)

### Anti-Patterns (Context A)
- ✗ Inter, Roboto, Arial, system-ui
- ✗ Purple gradients on any background
- ✗ Multiple competing accent colors in one view
- ✗ Glassmorphism / blur effects
- ✗ Film grain or vignette textures
- ✗ Border radius > 12px

---

## Context B: Bharatvarsh

*Dystopian-cinematic. Military precision meets Indian heritage.*
*Source: brand-guide-bharatvarsh-website.md (LOCKED)*

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--b-bg-base` | `#0F1419` | Base app background |
| `--b-bg-surface` | `#1A1F2E` | Surface cards |
| `--b-bg-elevated` | `#252A3B` | Elevated surfaces |
| `--b-bg-deep` | `#0A0D12` | Deepest background |
| `--b-navy` | `#0B2742` | Navy sections |
| `--b-accent-mustard` | `#F1C232` | **PRIMARY interactive/CTA** |
| `--b-accent-powder` | `#C9DBEE` | Technical readouts, accent text |
| `--b-text-primary` | `#F0F4F8` | Main body |
| `--b-text-secondary` | `#A0AEC0` | Supporting |
| `--b-text-muted` | `#718096` | Disabled |
| `--b-glow-mustard` | `0 0 20px rgba(241,194,50,0.3)` | Active glow |
| `--b-glow-powder` | `0 0 20px rgba(201,219,238,0.2)` | Technical glow |

### Faction Colors

| Faction | Hex |
|---------|-----|
| Military | `#0B2742` |
| Mesh | `#8B5CF6` |
| Resistance | `#DC2626` |
| Republic | `#3B82F6` |
| Guild | `#F1C232` |

### Typography (Context B)

| Role | Font | Usage |
|------|------|-------|
| Display / Titles | Bebas Neue | All authority headings |
| Body | Inter | Standard copy |
| Lore / Narrative | Crimson Pro | Historical docs, story passages |
| Hindi/Devanagari | Noto Sans Devanagari | All Devanagari script |
| Data / Terminal | JetBrains Mono | Technical, logs |

### Atmospheric Effects

Always use these CSS classes (defined in Bharatvarsh globals.css):
`.film-grain` | `.vignette` | `.surveillance-grid` | `.digital-grid` | `.aged-paper`
`.animate-scanline-scroll` | `.animate-screen-flicker` | `.animate-glow-pulse`

### Anti-Patterns (Context B)
- ✗ Instrument Serif or DM Sans 800 headings
- ✗ Violet/Coral from Context C
- ✗ Mustard gold as a background (always accent ON obsidian)
- ✗ Neon cyan/magenta gallery accents
- ✗ Light mode / white backgrounds

---

## Context C: Portfolio Website

*Dual-mode professional portfolio. Light mode clarity + Dark Gallery drama.*
*Source: brand-guide-portfolio-website.md (LOCKED)*

### Color Tokens

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
| `--c-neon-cyan` | `#00ffff` | Gallery highlight |
| `--c-neon-magenta` | `#ff00ff` | Gallery accent |
| `--c-neon-orange` | `#ff6b35` | Gallery warm |

### Typography (Context C)

| Role | Font | Usage |
|------|------|-------|
| ALL text | **Inter** | Universal — light + dark modes |
| Monospace | system monospace | Code only |

Font sizes use responsive `clamp()` — see SPEC_CONTEXT_C.md for full scale.

### Anti-Patterns (Context C)
- ✗ Bebas Neue or Instrument Serif
- ✗ Mustard gold from Context B
- ✗ Obsidian backgrounds outside Dark Gallery sections
- ✗ Film grain or surveillance textures
- ✗ DM Sans 800 headings

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
