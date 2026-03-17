# Bharatvarsh Brand & Visual Design Guide

This guide serves as the single source of truth for the visual design language of the Bharatvarsh website. It should be used as a reference when creating new UI designs and components to maintain a cohesive, atmospheric experience that blends military precision, dystopian cyberpunk aesthetics, and Indian heritage.

## 1. Core Principles

- **Dark & Atmospheric:** The primary UI sits on dark, "Obsidian" backgrounds to emphasize glowing accents and atmospheric effects.
- **Cinematic & Narrative-Driven:** Uses film grain, scanlines, and texture gradients to evoke a cinematic, alternate-reality thriller feeling.
- **High Contrast:** Bright "Mustard" and "Powder" accents are used primarily for interactive elements, highlights, and critical information against the dark background.

---

## 2. Color System

The project uses Tailwind CSS v4 with highly customized theme variables defined in `src/app/globals.css`.

### Backgrounds (Obsidian)
Used for main backgrounds, deeper layers, and surface cards.
- **Obsidian 950:** `#0A0D12` (`bg-obsidian-950`)
- **Obsidian 900:** `#0F1419` (`bg-obsidian-900`) - *Base App Background*
- **Obsidian 850:** `#141A21` (`bg-obsidian-850`)
- **Obsidian 800:** `#1A1F2E` (`bg-obsidian-800`) - *Surface/Cards*
- **Obsidian 700:** `#252A3B` (`bg-obsidian-700`) - *Elevated Surfaces*
- **Obsidian 600:** `#323848` (`opacity-600`) - *Borders/Dividers*

### Primary Colors (Navy)
Used for branding, secondary surfaces, and deep accents.
- **Navy 900:** `#0B2742` (`bg-navy-900`, `text-navy-900`)
- **Navy 800:** `#0D3050`
- **Navy 700:** `#11405F`
- **Navy 600:** `#15506E`
- **Navy 500:** `#1A607D`

### Secondary Colors (Powder Blue)
Used for secondary highlights, technical readouts, and muted interactive states.
- **Powder 100:** `#E8F1F8`
- **Powder 200:** `#D1E3F1`
- **Powder 300:** `#C9DBEE` - *Accent Text Color* (`text-accent`)
- **Powder 400:** `#A8C5DD`
- **Powder 500:** `#87AFCC`

### Accent Colors (Mustard)
Used for primary actions, CTA buttons, focus states, and critical highlights.
- **Mustard 400:** `#F5D56A`
- **Mustard 500:** `#F1C232` - *Primary Interactive / Selection Color*
- **Mustard 600:** `#D9AD2B`
- **Mustard 700:** `#B8921F`

### Text Colors
- `text-primary`: `#F0F4F8` (Main body text)
- `text-secondary`: `#A0AEC0` (Supporting text)
- `text-muted`: `#718096` (Disabled/inactive text)
- `text-accent`: `var(--powder-300)` (Highlighted/Technical text)

### Semantic & Lore Colors
**Status:**
- `status-alert`: `#DC2626` (Red)
- `status-warning`: `#F59E0B` (Amber)
- `status-success`: `#10B981` (Green)
- `status-info`: `#3B82F6` (Blue)

**Timeline Event Types:**
- `event-economic`: `#F1C232` (Mustard)
- `event-political`: `#0B2742` (Navy)
- `event-conflict`: `#DC2626` (Red)
- `event-governance`: `#10B981` (Green)
- `event-era`: `#8B5CF6` (Purple)

**Factions:**
- `faction-military`: `#0B2742`
- `faction-mesh`: `#8B5CF6`
- `faction-resistance`: `#DC2626`
- `faction-republic`: `#3B82F6`
- `faction-guild`: `#F1C232`

---

## 3. Typography

Fonts are optimized and imported via Next.js `next/font/google` in `layout.tsx`.

- **Sans / Base Text** (`font-sans`): **Inter**
  Used for all standard UI copy, body text, and reading experiences.
- **Display / Headings** (`font-display`): **Bebas Neue**
  Used for bold, imposing, military-style headings, titles, and numbers.
- **Serif / Lore text** (`font-serif`): **Crimson Pro**
  Used for narrative text, historical documents, or atmospheric reading segments.
- **Devanagari** (`font-devanagari`): **Noto Sans Devanagari**
  Used whenever Hindi/Devanagari script is rendered.
- **Monospace** (`font-mono`): **JetBrains Mono**
  Used for terminal interfaces, data printouts, and technical logs.

---

## 4. Atmospheric Effects

The UI goes beyond flat colors by incorporating custom CSS classes for atmospheric immersion (defined in `globals.css`).

### Gradients
- `bg-gradient-hero`: Vertical gradient from Obsidian 900 to Navy 900.
- `bg-gradient-card`: Diagonal 135deg gradient for surface cards (Obsidian 800 to 700).
- `text-gradient`: Premium text gradient spanning Powder 300 to Mustard 500.

### Glows (Shadows)
Use these variables or corresponding shadow utilities to create emissive light sources:
- `--glow-mustard`: `0 0 20px rgba(241, 194, 50, 0.3)`
- `--glow-powder`: `0 0 20px rgba(201, 219, 238, 0.2)`
- `--glow-mesh`: `0 0 30px rgba(139, 92, 246, 0.2)`

### Textures & Overlays
- `.film-grain`: Adds a lightweight SVG noise overlay (opacity 0.04) for cinematic grit.
- `.vignette`: A radial gradient overlay to darken the edges of a container.
- `.surveillance-grid`: A subtle rectangular grid repeating background pattern.
- `.digital-grid`: Tight cyan-tinted grid pattern for UI data elements.
- `.aged-paper`: Yellowish-brown overlay for historical documents.

### Key Animations
- `.animate-fade-in`, `.animate-scale-in`, `.animate-slide-in-left` (Standard UI intro animations).
- `.animate-scanline-scroll`: For screen monitors and data feeds.
- `.animate-screen-flicker`: Dystopian / malfunctioning screen effect.
- `.animate-glow-pulse`: Emphasizes critical data or active elements.
- `.animate-text-glow`: Pulsing text shadow.

---

## 5. Layout & Spacing

### Page Margins
Adhere to the following custom CSS variables for consistent page padding:
- Mobile: `1rem`
- Tablet: `2rem`
- Desktop: `4rem`

### Mobile Safe Areas
Use the safe-area utility classes to prevent overlap with notches and home indicators on modern mobile devices:
- `.safe-area-top`, `.safe-area-bottom`, `.safe-area-x`, `.safe-area-y`, `.safe-area-all`
- `.touch-target`: Ensures elements have a `44x44px` minimum size for WCAG compliance.

### Z-Index Scale
Maintain visual stacking order using the predefined z-index scale:
- Base: `0` (`z-base`)
- Dropdown: `10` (`z-dropdown`)
- Sticky: `20` (`z-sticky`)
- Fixed: `30` (`z-fixed`)
- Header: `40` (`z-header`)
- Overlay: `50` (`z-overlay`)
- Modal: `60` (`z-modal`)
- Popover: `70` (`z-popover`)
- Tooltip: `80` (`z-tooltip`)
- Toast: `90` (`z-toast`)
- Max: `100` (`z-max`)

---

## 6. Implementation Guidelines for New Components

1. **Use Base Tailwind Classes:** With Tailwind v4, you can directly use the CSS variables mapped as token names (e.g., `text-navy-500`, `bg-obsidian-900`, `ring-mustard-500`).
2. **Interactive States:** Use `hover:`, `focus:`, and `focus-visible:` extensively. `focus-visible` should outline with `mustard-500`.
3. **Glassmorphism:** The `.glass` utility class provides a standard Obsidian blur (`bg-opacity-80`, `blur-12px`). Use this for floating headers and overlapping cards.
4. **Theme Standard Components First:** Before creating a truly custom component, check the existing `src/components/ui` folder for Shadcn/UI primitives.
5. **Add Flavor with Restraint:** While atmospheric animations (`.animate-screen-flicker`, `.vignette`) are cool, use them sparingly to avoid performance hits and user distraction. Base UI components should be highly legible and performant.
