# Brand & Visual Design Guide

This document serves as the single source of truth for the project's visual identity, design tokens, and UI components. 

## 1. Color Palette

The project uses a structured color palette defined in Tailwind CSS.

### Primary Colors (AI/Product Persona: Deep Blue/Purple Gradient)
- **50**: `#f5f3ff`
- **100**: `#ede9fe`
- **500 (Base)**: `#8b5cf6`
- **600 (Hover/Active)**: `#7c3aed`
- **900**: `#4c1d95`

### Accent Colors (Creative Side: Warm Coral/Orange)
- **50**: `#fff7ed`
- **100**: `#ffedd5`
- **500 (Base)**: `#f97316`
- **600 (Hover/Active)**: `#ea580c`
- **900**: `#7c2d12`

### Neutral Colors (Clean Grays)
- **50 (Background)**: `#fafafa`
- **100**: `#f5f5f5`
- **500 (Muted Text)**: `#737373`
- **900 (Main Text)**: `#171717`

### Semantic Colors
- **Success**: Base `#22c55e`
- **Error**: Base `#ef4444`
- **Warning**: Base `#f59e0b`

### Dark Gallery Theme
- **Background (`bg-dark-gallery`)**: Gradient `from-[#0a0a0a] via-[#171717] to-[#0a0a0a]`
- **Surface**: `#171717`, **Surface Light**: `#262626`
- **Text**: `#fafafa`, **Text Dim**: `#a3a3a3`
- **Neon Accents**: Cyan `#00ffff`, Magenta `#ff00ff`, Orange `#ff6b35`, Purple `#b026ff`

## 2. Typography

We use Inter and system fonts for a clean, modern look.
- **Sans & Display**: `Inter`, `system-ui`, `sans-serif`
- **Mono**: `monospace`

### Font Sizes & Hierarchy
Responsive typography is handled via CSS `clamp()` in `globals.css`:
- **H1**: `clamp(2.25rem, 1.6rem + 2vw, 3.75rem)` — *Page titles*
- **H2**: `clamp(1.75rem, 1.4rem + 1.4vw, 3rem)` — *Major sections*
- **H3**: `clamp(1.35rem, 1.1rem + 1vw, 2.25rem)` — *Card titles, subsections*
- **H4**: `clamp(1.125rem, 1.02rem + 0.5vw, 1.75rem)` — *Smaller groupings*
- **Body / P**: `clamp(1rem, 0.96rem + 0.3vw, 1.125rem)`

Text color utilities to maintain hierarchy:
- `.text-heading`: Primary bold elements (`text-neutral-900`)
- `.text-body`: Standard text (`text-neutral-700`)
- `.text-secondary`: Supporting text (`text-neutral-500`)
- `.text-muted`: Subtle text (`text-neutral-400`)

## 3. Layout & Spacing

### Containers
- `.container-custom`: Max width 7xl, auto margin, fluid side padding (`clamp(1rem, 4vw, 2rem)`)

### Section Padding
- `.section-padding-sm`: `py-8 md:py-12`
- `.section-padding`: `py-10 md:py-16 lg:py-20`
- `.section-padding-lg`: `py-14 md:py-20 lg:py-28`

## 4. Components & Utilities

### Buttons
- `.btn-primary`: Solid primary color, scales up on hover.
- `.btn-secondary`: White background, gray border, neutral text.
- `.btn-ghost`: Transparent background, primary text.
- `.btn-accent`: Solid accent color.
- `.btn-neon`: For Dark Gallery. Borders glow and cast shadow on hover.

### Cards
- `.card`: Base card, rounded-lg, subtle shadow.
- `.card-interactive`: Adds cursor pointer, ring focus states.
- `.card-lg`: Larger radius, stronger shadow, lifts on hover.
- `.artwork-frame`: For Dark theme pieces. Dark border, internal/external shadow. Glows primary color on hover.

### Badges & Tags
- `.tag`: Light gray chip for categories.
- `.tag-active`: Primary colored chip.
- `.badge-gold`, `.badge-silver`, `.badge-bronze`: Metallic gradients and glow.

### Links
- `.link-underline`: Underline with primary color, deepens on hover.
- `.link-hover`: Primary text, deepens on hover.

## 5. Animations & Effects

### Transitions
- **Fast**: 150ms
- **Base**: 200ms
- **Slow**: 300ms
- **Timing Functions**: `.transition-smooth`, `.transition-bounce`

### Keyframes (`tailwind.config.ts`)
- **Fade In**: `.animate-fade-in`
- **Slide**: `.animate-slide-in-right`, `.animate-slide-in-left`
- **Scale**: `.animate-scale-in`
- **Float**: `.animate-float` (Used on `.particle` elements)
- **Scroll Reveal**: Add `.scroll-reveal` and trigger `.visible` class globally. Variants: `.fade-in-up`, `.fade-in-left`, `.scale-in`.

### Glassmorphism
- `.glass`: Light backdrop blur (`bg-white/80`).
- `.glass-dark`: Dark backdrop blur (`bg-neutral-900/80`).

---

**Usage Note**: When building new components, always prefer the semantic Tailwind variables defined over arbitrary values to ensure global consistency across the app.
