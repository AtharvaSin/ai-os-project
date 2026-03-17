# Context A: AI OS System — Design Specification

> **Status:** FINAL — all tokens populated from Wibify extraction
> **Inspired by:** wibify.agency aesthetic language
> **Extends:** Existing Obsidian Aurora palette (INTERFACE_STRATEGY.md)

---

## Design Character

The AI OS System context is **architectural precision meets machine intelligence.** It communicates
operational seriousness without corporate blandness. The aesthetic says: "this was built by someone
who cares deeply about craft and knows exactly what they're doing."

Key visual signatures:
- Near-void backgrounds that make content feel suspended in space
- ONE electric accent color that never competes with anything else
- Section numbers (`01 —`, `02 —`) as navigational grammar
- Uppercase small labels as system-level metadata
- Heavy weight display headings (700–800) for hierarchy authority
- Zero decorative elements — every pixel is functional

---

## Color Tokens

> Values marked `[EXTRACTED]` are populated by Phase 1 from `context_a_extracted.json`.
> Values marked `[LOCKED]` are retained from existing Obsidian Aurora (change requires explicit decision).
> Values marked `[DERIVED]` are computed from extracted values.

### Backgrounds

| Token | Value | Source | Usage |
|-------|-------|--------|-------|
| `--bg-void` | `#0a0a0a` | Wibify extraction | Outermost page background |
| `--bg-base` | `#0d0d14` | [LOCKED] Obsidian Aurora | Default page bg — keeps dashboard consistent |
| `--bg-surface` | `#12121e` | [LOCKED] Obsidian Aurora | Cards, panels |
| `--bg-elevated` | `#1a1a2e` | [LOCKED] Obsidian Aurora | Hover states, elevated surfaces |
| `--bg-overlay` | `rgba(8,8,16,0.92)` | [DERIVED] | Modals, overlays |

**Reconciliation rule:** If extracted `bg-void` is within 10 luminance units of `#0d0d14`,
set both `--bg-void` and `--bg-base` to `#0d0d14` and eliminate `--bg-void` as redundant.

### Borders & Dividers

| Token | Value | Source | Usage |
|-------|-------|--------|-------|
| `--border` | `#1f1f35` | [LOCKED] | Card borders, dividers |
| `--border-subtle` | `#151520` | [DERIVED] | Inset/invisible structure |
| `--border-accent` | `rgba(0, 212, 146, 0.3)` | | Active borders, focus rings |

### Accent Colors

| Token | Value | Source | Usage |
|-------|-------|--------|-------|
| `--accent-primary` | `#00D492` | **Wibify CTA color** | Primary interactive, CTAs, active states, links |
| `--accent-warning` | `#E8B931` | [LOCKED] | Warnings, Phase indicators |
| `--accent-danger` | `#FF6B6B` | [LOCKED] | Errors, critical alerts |
| `--accent-sys` | `#7B68EE` | [LOCKED] | System actions, tertiary (use sparingly) |

> **Critical rule:** `--accent-primary` is the ONE signature color. It should appear maximum
> 3–5 times per screen. If you find yourself using it everywhere, you're using it wrong.
> It marks: the active state, the most important CTA, the key data point. That's it.

### Text

| Token | Value | Source | Usage |
|-------|-------|--------|-------|
| `--text-primary` | `#EEEAE4` | [LOCKED, refined] | Headings, key content |
| `--text-secondary` | `#A09D95` | [LOCKED] | Body text |
| `--text-muted` | `#606060` | [NEW - darker than current] | Labels, captions |
| `--text-label` | `#00D492` | | Section labels, technical annotations |
| `--text-code` | `#A09D95` | | Inline code, data values |

---

## Typography

### Font Stack

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display | `'Instrument Serif'` | 400 | Page titles, hero text — SPARSE use only |
| Heading | `'DM Sans'` | **700–800** | Section headings, card titles |
| Body | `'DM Sans'` | 400 | All body copy |
| Label | `'DM Sans'` | 600 | Uppercase section labels, badges |
| Mono | `'JetBrains Mono'` | 400/600 | Data, code, metrics, timestamps |

> **Wibify reconciliation:** If extraction shows they use Geist or another geometric sans,
> evaluate whether to add it as the Display font instead of Instrument Serif. Instrument Serif
> provides editorial gravitas; a geometric sans provides cold precision. Your call.
>
> **Decision (FINAL):** Wibify uses Geist (geometric sans). DM Sans retained for Context A — provides similar geometric precision with more typographic range (400-800 weights). Instrument Serif retained for editorial gravitas.

### Type Scale

| Element | Size | Weight | Case | Font |
|---------|------|--------|------|------|
| Section number label | 11px | 600 | UPPERCASE + tracked | DM Sans |
| Eyebrow / category | 12px | 600 | UPPERCASE + tracked | DM Sans |
| Card title | 16px | 700 | Sentence | DM Sans |
| Section heading | 20–24px | 700 | Sentence | DM Sans |
| Page heading | 28–36px | 800 | Sentence | DM Sans |
| Display / Hero | 42–64px | 400 | Sentence | Instrument Serif |
| Body copy | 14px | 400 | — | DM Sans |
| Caption / label | 12px | 400 | — | DM Sans |
| Data / metric | 13px | 400/600 | — | JetBrains Mono |
| Large metric | 32–48px | 600 | — | JetBrains Mono |

### Section Numbering Pattern

```
01 —  Section Title           ← number (JetBrains Mono, --accent-primary) + em-dash + title (DM Sans 700)
02 —  Another Section
```

This is the core structural grammar of Context A. Use it consistently for all major sections.

---

## Spatial System

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
The ratio of whitespace to content is a quality signal — don't compress it.

---

## Component Patterns

### Cards
```css
background: var(--bg-surface);
border: 1px solid var(--border);
border-radius: var(--radius-md);
/* No box-shadow. Border defines the edge. */
```

### Section Labels
```css
font-family: 'DM Sans';
font-size: 11px;
font-weight: 600;
letter-spacing: 0.15em;
text-transform: uppercase;
color: var(--accent-primary);
```

### Metric / KPI Display
```css
font-family: 'JetBrains Mono';
font-size: 36px;
font-weight: 600;
color: var(--text-primary);
/* Accompanied by 12px DM Sans label below */
```

### Data Tables
```css
/* Header row */
background: var(--bg-elevated);
border-bottom: 1px solid var(--border);
/* Alternating rows */
background: var(--bg-surface) / var(--bg-base);
/* Focus/hover row */
border-left: 2px solid var(--accent-primary);
```

---

## Anti-Patterns (Context A)

**Never:**
- Use Inter, Roboto, Arial, or system-ui
- Use the `--accent-sys` purple as a primary accent
- Add glassmorphism blur effects (that's Context C)
- Add film grain or vignette (that's Context B)
- Use purple gradients on any background
- Use more than one accent color in a single component
- Round corners to more than 12px
- Add decorative illustrations or icons that aren't functional

**Watch for:**
- "Generic card" pattern: white/light card with shadow on white page → wrong context
- Hero sections with gradient text → looks like a SaaS template, not an OS
- Multiple competing accent colors on one screen
