# Anti-Slop Checklist — Extended Reference

> Used by the `ui-design-process` skill.
> If ANY of these appear in your output without a specific, justified reason — rebuild.

---

## Typography Slops

- [ ] **Inter on everything** — Inter is Context C ONLY. Context A uses DM Sans.
- [ ] **Roboto / Arial / system-ui** — Generic fallbacks that signal no design decision was made.
- [ ] **All-caps for everything** — UPPERCASE is reserved for small section labels (12px, tracked). Not headings.
- [ ] **Font weights that don't progress** — If H1 and H2 are both weight 600, there's no hierarchy.
- [ ] **Body text smaller than 14px** — Always minimum 14px for readable body.
- [ ] **Line height below 1.4** — Compressed body text is hard to read and signals carelessness.

---

## Color Slops

- [ ] **Purple gradient on white/light** — The most overused AI aesthetic. Never.
- [ ] **Purple gradient on dark** — Also overused. Only use if your direction specifically calls for it AND it's not the hero.
- [ ] **`rgba(139, 92, 246, 0.1)` tinted cards** — The shadcn default. It signals no design decision.
- [ ] **Using 4+ colors as active elements** — Every color you add dilutes the accent. Pick ONE.
- [ ] **Semantic red/green/yellow as decoration** — These colors mean error/success/warning. If you use them decoratively, you confuse signal with noise.
- [ ] **Near-black backgrounds with bright white text and no mid-tones** — Harsh contrast without tone hierarchy. Use text-secondary and text-muted to build the scale.
- [ ] **Matching border AND background AND text in the same component with the accent color** — Accent overload. Accent marks ONE thing.

---

## Layout Slops

- [ ] **3-column feature cards below a hero** — The SaaS template. Unavoidable only if the content genuinely IS a feature grid.
- [ ] **"Stats row" immediately after hero** — 4 big numbers with small labels. Fine if it's a dashboard. Slop if it's a landing page that's just mimicking one.
- [ ] **Sticky CTA button on mobile that covers content** — Bad UX AND ugly. Never.
- [ ] **Centered everything on a wide screen** — Centered layouts on 1440px feel orphaned. Use left-aligned grids.
- [ ] **Full-width sections with no max-width container** — Content stretches to the edge on ultrawide. Always max-width.
- [ ] **Padding that disappears on mobile** — 64px desktop padding → 0px mobile is a layout collapse.
- [ ] **Z-index soup** — More than 3 levels of stacking = layout confusion.

---

## Component Slops

- [ ] **shadcn Card component with default styling** — `rounded-lg border bg-card text-card-foreground shadow-sm`. This is fine as a base, never as final output.
- [ ] **shadcn Badge with default colors** — Always customize badge colors to context tokens.
- [ ] **Heroicons/Lucide icons at default gray** — Icons should be token-colored or intentionally muted, never default gray.
- [ ] **Empty state with a centered SVG illustration** — Overused pattern. Use text-based empty states (or a subtle icon) with Context A.
- [ ] **Skeleton loading that looks different from real content** — If your skeleton is white on dark and your content is dark on dark, the flash is jarring.
- [ ] **Toast notifications in bottom-right by default** — Think about where the user's eye is. For an OS dashboard top-right or top-center may be better.

---

## Data Visualization Slops

- [ ] **Default recharts styling with no customization** — Gray axes, no brand colors. Always customize.
- [ ] **Tooltips that are white cards on dark backgrounds** — Jarring. Style tooltips to match the chart background.
- [ ] **Pie charts for everything proportional** — Donut charts read better and allow center labels.
- [ ] **Legend below the chart instead of inline or to the right** — Forces eye travel. Inline labels or right-aligned legends read faster.
- [ ] **Axis labels at default recharts font size** — Usually too small. Always set explicitly.
- [ ] **Chart titles that just repeat what the axis says** — "Revenue by Month" when the Y-axis already says "Revenue" and X-axis shows months. Use the title to provide insight, not description.

---

## Context-Specific Slops

### Context A — AI OS System
- [ ] Light-mode component ported to dark background (card still has white fill)
- [ ] Glassmorphism blur on dark surface (invisible effect, just noise)
- [ ] Multiple accent colors in one view competing for attention
- [ ] DM Sans at weight 400 for headings (needs 700–800)
- [ ] Missing section numbering pattern (`01 —`) on multi-section views
- [ ] Metrics displayed in DM Sans instead of JetBrains Mono

### Context B — Bharatvarsh
- [ ] No film grain on full-page hero sections
- [ ] No vignette on full-bleed images
- [ ] Mustard (#F1C232) used as background color (should only be accent)
- [ ] Standard hover states without glow (use `--glow-mustard`)
- [ ] Faction content without faction color theming
- [ ] Narrative/lore text in Inter instead of Crimson Pro

### Context C — Portfolio
- [ ] Dark Gallery neon accents used in the light-mode professional section
- [ ] Violet (#8b5cf6) used in Bharatvarsh content
- [ ] Gallery section without `.artwork-frame` component
- [ ] Missing scroll-reveal animations on portfolio sections

---

## The Final Test

**"Could this be any app?"**

Before shipping any UI, ask: if you stripped the text content, would this layout/design only work for THIS specific use case?

If the answer is "it could be any SaaS dashboard" or "it could be any portfolio" — you have slop.
If the answer is "this is clearly a personal AI operating system" or "this is clearly a cinematic novel website" — you're done.
