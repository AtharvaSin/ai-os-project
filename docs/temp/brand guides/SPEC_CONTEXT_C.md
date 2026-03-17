# Context C: Portfolio Website — Design Specification

> **Status:** LOCKED — derived from official brand guide (brand-guide-portfolio-website.md)
> **Do not modify without explicit approval from Atharva**

---

## Design Character

Clean, dual-mode professional portfolio. Light mode for professional clarity.
Dark Gallery mode for artwork and creative work. The palette says: technical AND creative —
the violet-coral split visually represents AI product work (cool, deep) and creative/novel work
(warm, expressive). The split identity is the point.

---

## Color Tokens

### Primary Colors (AI/Product — Deep Violet/Purple)

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary-50` | `#f5f3ff` | Very light tint |
| `--primary-100` | `#ede9fe` | Light bg tint |
| `--primary-500` | `#8b5cf6` | **Base primary** |
| `--primary-600` | `#7c3aed` | Hover/active state |
| `--primary-900` | `#4c1d95` | Deep primary |

### Accent Colors (Creative — Warm Coral/Orange)

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-50` | `#fff7ed` | Very light tint |
| `--accent-100` | `#ffedd5` | Light bg tint |
| `--accent-500` | `#f97316` | **Base accent** |
| `--accent-600` | `#ea580c` | Hover/active |
| `--accent-900` | `#7c2d12` | Deep accent |

### Neutral Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--neutral-50` | `#fafafa` | **Light mode page background** |
| `--neutral-100` | `#f5f5f5` | Light surface |
| `--neutral-500` | `#737373` | Muted text |
| `--neutral-900` | `#171717` | Main text (light mode) |

### Dark Gallery Theme (Artwork sections)

| Token | Hex | Usage |
|-------|-----|-------|
| `--dark-bg` | gradient `from-#0a0a0a via-#171717 to-#0a0a0a` | Gallery background |
| `--dark-surface` | `#171717` | Gallery cards |
| `--dark-surface-light` | `#262626` | Gallery hover surface |
| `--dark-text` | `#fafafa` | Gallery text |
| `--dark-text-dim` | `#a3a3a3` | Gallery secondary text |

### Neon Accents (Dark Gallery only)

| Name | Hex | Usage |
|------|-----|-------|
| Neon Cyan | `#00ffff` | Gallery highlight |
| Neon Magenta | `#ff00ff` | Gallery accent |
| Neon Orange | `#ff6b35` | Gallery warm accent |
| Neon Purple | `#b026ff` | Gallery purple |

### Semantic Colors

| Name | Hex |
|------|-----|
| Success | `#22c55e` |
| Error | `#ef4444` |
| Warning | `#f59e0b` |

---

## Typography

**NOTE: Portfolio uses Inter as its primary font. This is intentional — the portfolio
is about accessibility and professional clarity, not typographic drama.**

| Role | Font | Size | Usage |
|------|------|------|-------|
| All headings + body | **Inter** | See scale below | Universal |
| Monospace | **monospace** (system) | — | Code snippets |

### Font Size Scale (responsive via clamp)

| Element | clamp() formula | At min | At max |
|---------|----------------|--------|--------|
| H1 | `clamp(2.25rem, 1.6rem + 2vw, 3.75rem)` | 36px | 60px |
| H2 | `clamp(1.75rem, 1.4rem + 1.4vw, 3rem)` | 28px | 48px |
| H3 | `clamp(1.35rem, 1.1rem + 1vw, 2.25rem)` | ~22px | 36px |
| H4 | `clamp(1.125rem, 1.02rem + 0.5vw, 1.75rem)` | 18px | 28px |
| Body | `clamp(1rem, 0.96rem + 0.3vw, 1.125rem)` | 16px | 18px |

### Text Color Utilities

| Utility class | Tailwind equiv | Usage |
|---------------|---------------|-------|
| `.text-heading` | `text-neutral-900` | Primary bold elements |
| `.text-body` | `text-neutral-700` | Standard copy |
| `.text-secondary` | `text-neutral-500` | Supporting text |
| `.text-muted` | `text-neutral-400` | Captions, disabled |

---

## Layout & Containers

| Class | Definition |
|-------|-----------|
| `.container-custom` | max-width 7xl, auto margin, fluid padding via `clamp(1rem, 4vw, 2rem)` |
| `.section-padding-sm` | `py-8 md:py-12` |
| `.section-padding` | `py-10 md:py-16 lg:py-20` |
| `.section-padding-lg` | `py-14 md:py-20 lg:py-28` |

---

## Components

### Buttons

| Class | Description |
|-------|-------------|
| `.btn-primary` | Solid primary violet, scales on hover |
| `.btn-secondary` | White bg, gray border, neutral text |
| `.btn-ghost` | Transparent, primary text |
| `.btn-accent` | Solid coral/orange |
| `.btn-neon` | Dark Gallery only — glowing border |

### Cards

| Class | Description |
|-------|-------------|
| `.card` | Base: rounded-lg, subtle shadow |
| `.card-interactive` | Adds pointer, ring focus |
| `.card-lg` | Larger radius, stronger shadow, lifts on hover |
| `.artwork-frame` | Dark Gallery — dark border, glow on hover |

### Badges

| Class | Description |
|-------|-------------|
| `.tag` | Light gray chip for categories |
| `.tag-active` | Primary-colored chip |
| `.badge-gold / .badge-silver / .badge-bronze` | Metallic gradients |

### Links

| Class | Description |
|-------|-------------|
| `.link-underline` | Underline with primary color |
| `.link-hover` | Primary text, deepens on hover |

---

## Animations & Effects

### Timing

| Name | Duration |
|------|----------|
| Fast | 150ms |
| Base | 200ms |
| Slow | 300ms |

### Keyframes

| Class | Effect |
|-------|--------|
| `.animate-fade-in` | Opacity 0→1 |
| `.animate-slide-in-right` | Slide from right |
| `.animate-slide-in-left` | Slide from left |
| `.animate-scale-in` | Scale up from 95% |
| `.animate-float` | Used on `.particle` floating elements |

### Scroll Reveal

Add `.scroll-reveal` class + trigger `.visible` on scroll.
Variants: `.fade-in-up`, `.fade-in-left`, `.scale-in`

### Glassmorphism

| Class | Description |
|-------|-------------|
| `.glass` | `bg-white/80` + backdrop blur — LIGHT mode |
| `.glass-dark` | `bg-neutral-900/80` + backdrop blur — DARK mode |

---

## Two-Mode Strategy

Context C has a deliberate dual personality:

| Mode | When | Background | Text | Accents |
|------|------|-----------|------|---------|
| Light (Professional) | Default portfolio pages | `neutral-50` | `neutral-900` | `primary-500` + `accent-500` |
| Dark Gallery | Artwork / creative showcase | gradient `#0a0a0a` | `#fafafa` | Neon Cyan/Magenta/Orange |

**Rule:** Never mix light-mode components with Dark Gallery backgrounds. The transition
between modes should be a full section break, not gradual.

---

## Anti-Patterns (Context C)

**Never:**
- Use Bebas Neue or Instrument Serif (wrong context)
- Use Obsidian 950 as a background outside of Dark Gallery sections
- Use the Mustard gold from Context B
- Apply film grain or surveillance grid textures
- Use heavy DM Sans 800 headings
- Place neon accents on the light-mode version
