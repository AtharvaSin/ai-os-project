# Context B: Bharatvarsh — Design Specification

> **Status:** LOCKED — derived from official brand guide (brand-guide-bharatvarsh-website.md)
> **Do not modify without explicit approval from Atharva**

---

## Design Character

Military precision meets dystopian India. Cinematic, atmospheric, high-contrast.
The UI feels like an intelligence briefing from an alternate 2047 — dark command centers,
classified documents, surveillance aesthetics. Indian heritage is in the DNA, not the decoration.

Key visual signatures:
- Obsidian darkness with mustard gold as the one warm light source
- Powder blue as cold, technical accent (scanner readouts, data feeds)
- Film grain, scanlines, vignette — not decoration, but world-building
- Bebas Neue for anything with authority or power
- Crimson Pro for lore, history, narrative — making readers lean in

---

## Color Tokens

### Backgrounds (Obsidian)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--obsidian-950` | `#0A0D12` | `bg-obsidian-950` | Deepest bg, outer wrapper |
| `--obsidian-900` | `#0F1419` | `bg-obsidian-900` | **Base app background** |
| `--obsidian-850` | `#141A21` | `bg-obsidian-850` | Intermediate layer |
| `--obsidian-800` | `#1A1F2E` | `bg-obsidian-800` | Surface cards |
| `--obsidian-700` | `#252A3B` | `bg-obsidian-700` | Elevated surfaces |
| `--obsidian-600` | `#323848` | — | Borders, dividers |

### Primary (Navy)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--navy-900` | `#0B2742` | `bg-navy-900` | Deep navy sections, faction-military bg |
| `--navy-800` | `#0D3050` | `bg-navy-800` | |
| `--navy-700` | `#11405F` | `bg-navy-700` | |
| `--navy-600` | `#15506E` | `bg-navy-600` | |
| `--navy-500` | `#1A607D` | `bg-navy-500` | |

### Accent: Mustard Gold (Primary Interactive)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--mustard-400` | `#F5D56A` | | Light highlight |
| `--mustard-500` | `#F1C232` | `ring-mustard-500` | **PRIMARY interactive/selection** |
| `--mustard-600` | `#D9AD2B` | | Hover state |
| `--mustard-700` | `#B8921F` | | Active/pressed |

### Accent: Powder Blue (Technical/Secondary)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--powder-100` | `#E8F1F8` | | |
| `--powder-200` | `#D1E3F1` | | |
| `--powder-300` | `#C9DBEE` | `text-accent` | **Accent text, technical readouts** |
| `--powder-400` | `#A8C5DD` | | |
| `--powder-500` | `#87AFCC` | | |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#F0F4F8` | Main body text |
| `--text-secondary` | `#A0AEC0` | Supporting text |
| `--text-muted` | `#718096` | Disabled, inactive |
| `--text-accent` | `var(--powder-300)` | Highlighted, technical |

### Semantic & Lore Colors

**Status:**
| Name | Hex | Usage |
|------|-----|-------|
| `status-alert` | `#DC2626` | Red — danger |
| `status-warning` | `#F59E0B` | Amber |
| `status-success` | `#10B981` | Green |
| `status-info` | `#3B82F6` | Blue |

**Faction Colors:**
| Faction | Hex |
|---------|-----|
| Military | `#0B2742` |
| Mesh | `#8B5CF6` |
| Resistance | `#DC2626` |
| Republic | `#3B82F6` |
| Guild | `#F1C232` |

**Timeline Event Types:**
| Type | Hex |
|------|-----|
| Economic | `#F1C232` (Mustard) |
| Political | `#0B2742` (Navy) |
| Conflict | `#DC2626` (Red) |
| Governance | `#10B981` (Green) |
| Era marker | `#8B5CF6` (Purple) |

---

## Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display / Headings | **Bebas Neue** | 400 | Bold, military-style titles, numbers |
| Body / Base | **Inter** | 400 | Standard UI copy, readable text |
| Lore / Narrative | **Crimson Pro** | 400/600 | Historical docs, narrative passages |
| Devanagari | **Noto Sans Devanagari** | 400 | All Hindi/Devanagari rendering |
| Monospace | **JetBrains Mono** | 400 | Terminal UI, data printouts, technical logs |

---

## Atmospheric Effects

These CSS classes are defined in Bharatvarsh's `globals.css`. Always use them (not custom alternatives):

| Class | Effect | Usage Rule |
|-------|--------|------------|
| `.film-grain` | SVG noise overlay (opacity 0.04) | Apply to page wrapper and hero sections |
| `.vignette` | Radial gradient darkens edges | Apply to full-page bg containers |
| `.surveillance-grid` | Subtle rectangular grid pattern | Background texture for UI sections |
| `.digital-grid` | Tight cyan grid | Data/terminal UI elements |
| `.aged-paper` | Yellowish overlay | Historical document sections |

### Gradients
| Name | Definition |
|------|------------|
| `bg-gradient-hero` | Vertical: Obsidian-900 → Navy-900 |
| `bg-gradient-card` | 135deg: Obsidian-800 → Obsidian-700 |
| `text-gradient` | Premium: Powder-300 → Mustard-500 |

### Glow Variables
| Variable | Value | Usage |
|----------|-------|-------|
| `--glow-mustard` | `0 0 20px rgba(241,194,50,0.3)` | Active interactive elements |
| `--glow-powder` | `0 0 20px rgba(201,219,238,0.2)` | Technical/scanner elements |
| `--glow-mesh` | `0 0 30px rgba(139,92,246,0.2)` | Mesh faction content |

### Key Animations
| Class | Effect |
|-------|--------|
| `.animate-scanline-scroll` | Screen/data feed monitors |
| `.animate-screen-flicker` | Malfunctioning/dystopian screens |
| `.animate-glow-pulse` | Critical data, active elements |
| `.animate-text-glow` | Pulsing text shadow |
| `.animate-fade-in` | Standard entrance |

---

## Component Patterns

### Interactive States
- Focus visible: outline with `mustard-500`
- Hover: `glow-mustard` shadow
- Active: `mustard-600` background

### Glassmorphism (for Bharatvarsh)
Use the `.glass` utility: `bg-opacity-80, blur-12px` on Obsidian dark backgrounds.
Different from Context C glassmorphism which uses lighter, frosted glass.

---

## Anti-Patterns (Context B)

**Never:**
- Use Instrument Serif (that's Context A)
- Use the Violet/Coral portfolio palette in any Bharatvarsh content
- Use blue-purple gradients on white backgrounds
- Apply `.film-grain` to small inline elements (only page-level)
- Use faction colors outside of their faction context
- Render Hindi text in any font other than Noto Sans Devanagari
- Make the mustard gold the background (it's always the accent ON the obsidian)

---

## Bharatvarsh Content Types & Their Design Treatment

| Content Type | Primary Font | Bg | Key Accent |
|---|---|---|---|
| Character profile | Bebas Neue + Inter | Obsidian 900 | Faction color |
| Timeline entry | Bebas Neue + Crimson Pro | Navy 900 | Event type color |
| Lore document | Crimson Pro | Obsidian 850 | Powder 300 |
| Faction brief | Bebas Neue | Faction bg | Mustard 500 |
| Terminal/data | JetBrains Mono | Obsidian 950 | Digital grid |
| Marketing/social | Bebas Neue | Gradient hero | Mustard 500 |
| Promotional poster | Bebas Neue | Full cinematic | Film grain + vignette |
