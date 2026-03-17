# brand-system-build

> Complete build infrastructure for the AI OS three-context brand consistency system.
> Hand this entire folder to Claude Code with the instruction: "Execute BRAND_SYSTEM_BUILD.md"

---

## What's in here

```
brand-system-build/
├── BRAND_SYSTEM_BUILD.md       ← MAIN INSTRUCTION FILE — start here
│
├── specs/
│   ├── SPEC_CONTEXT_A.md       Context A token spec (AI OS System — Wibify-inspired)
│   ├── SPEC_CONTEXT_B.md       Context B token spec (Bharatvarsh — locked from brand guide)
│   ├── SPEC_CONTEXT_C.md       Context C token spec (Portfolio — locked from brand guide)
│   └── BRAND_IDENTITY_TEMPLATE.md  Template Claude Code fills to produce BRAND_IDENTITY.md
│
├── scripts/
│   ├── extract_wibify_tokens.js     Playwright CSS extractor (wibify.agency)
│   ├── extract_wibify_fallback.js   Fallback if Playwright fails
│   ├── generate_mpl_theme.py        Matplotlib .mplstyle theme generator
│   ├── generate_react_templates.js  React infographic component generator
│   └── generate_docx_templates.py   Branded .docx template generator
│
└── skill-drafts/
    ├── SKILL_BRAND_GUIDELINES_DRAFT.md   brand-guidelines skill
    ├── SKILL_INFOGRAPHIC_DRAFT.md        infographic skill
    ├── SKILL_UI_DESIGN_PROCESS_DRAFT.md  ui-design-process skill
    └── ANTI_SLOP_CHECKLIST.md            Extended anti-pattern reference
```

---

## How to hand this to Claude Code

Copy the `brand-system-build/` folder into your `ai-os-project/` repo, then in Claude Code:

```
Read brand-system-build/BRAND_SYSTEM_BUILD.md and execute it phase by phase.
Ask me before starting Phase 4 (Drive uploads).
```

That's it. The build file is self-contained — it tells Claude Code exactly what to do,
in what order, with what success criteria.

---

## What comes out

After all phases complete, you'll have:

| Artifact | Location | Purpose |
|----------|----------|---------|
| `BRAND_IDENTITY.md` | `knowledge-base/` | Canonical KB doc — token tables for A/B/C |
| `brand-guidelines` skill | `skills/brand-guidelines/` | Context dispatcher skill |
| `infographic` skill | `skills/infographic/` | Visual generation skill |
| `ui-design-process` skill | `skills/ui-design-process/` | Anti-slop UI process skill |
| `ai_os_system.mplstyle` | `skills/infographic/assets/mpl-themes/` | Matplotlib theme |
| `MetricCard.jsx` etc | `skills/infographic/assets/react-templates/` | React components |
| `ai_os_template.docx` | Drive: AI OS/BRAND_TEMPLATES/ | Context A Word template |
| `bharatvarsh_template.docx` | Drive: AI OS/BRAND_TEMPLATES/ | Context B Word template |
| `portfolio_template.docx` | Drive: AI OS/BRAND_TEMPLATES/ | Context C Word template |

---

## Critical: Update accent-primary after Phase 1

The ONE most important thing to get right is `accent-primary` in Context A.
This is the signature electric color from wibify.agency that defines the OS aesthetic.

After Phase 1 (Playwright extraction):
1. Open `specs/context_a_extracted.json`
2. Find `semantic_mapping.accent-primary`
3. If it's `#PLACEHOLDER` — open DevTools on wibify.agency manually and find the CTA button color
4. Update this value in `specs/SPEC_CONTEXT_A.md` and `specs/context_a_extracted.json`
5. All downstream scripts read from here automatically

---

## Design intent summary

```
CONTEXT A — AI OS SYSTEM
  Character: Machine intelligence, architectural precision
  Background: #0d0d14 (Obsidian Aurora) + [Wibify accent]
  Fonts: DM Sans 700–800 (headings) + JetBrains Mono (data) + Instrument Serif (display)
  Grammar: Numbered sections (01 —), uppercase labels, single accent

CONTEXT B — BHARATVARSH
  Character: Cinematic, dystopian-Indian, military-intelligence
  Background: Obsidian #0F1419 + Navy #0B2742
  Fonts: Bebas Neue (authority) + Crimson Pro (lore) + Inter (UI) + JetBrains Mono
  Grammar: Mustard CTAs, powder blue tech, film grain, glows

CONTEXT C — PORTFOLIO
  Character: Dual-mode professional clarity + Dark Gallery creative
  Background: #fafafa (light) / #0a0a0a (gallery)
  Fonts: Inter everywhere
  Grammar: Violet primary, coral accent, scroll-reveal, neon in gallery only

UNIVERSAL: JetBrains Mono in ALL contexts. No context mixing.
```
