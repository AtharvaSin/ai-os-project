# References — Mood Boards & Examples

This directory holds visual references that the workflow studies before rendering. Drop images here to influence the output style.

## Structure

```
references/
├── mood-boards/           ← Visual direction per context
│   ├── context-a/         ← AI OS inspiration (screenshots, designs you like)
│   ├── context-b/         ← Bharatvarsh inspiration (film stills, posters, atmosphere)
│   └── context-c/         ← Portfolio inspiration (LinkedIn designs, personal brands)
├── examples/              ← Your own past outputs that hit the mark
│   ├── approved/          ← "More like this" — reference for future renders
│   └── rejected/          ← "Not like this" — anti-patterns to avoid
└── README.md              ← This file
```

## How to Use

**Mood boards:** Drop 3-5 images into the appropriate context folder. The workflow will study them before rendering to match the visual language. File names should describe what you like about each image:
- `wibify-dark-dashboard-clean-hierarchy.png`
- `blade-runner-2049-atmospheric-lighting.jpg`
- `linear-app-metric-display-minimal.png`

**Examples:** After each render, move outputs you love into `examples/approved/` and outputs you dislike into `examples/rejected/`. Over time this builds a feedback library.

**External inspiration:** Save screenshots of designs from the web that match your desired aesthetic. The workflow's skills reference this directory.

## Linked Resources (read from knowledge-base, not stored here)

The workflow also pulls visual direction from these AI OS knowledge base files:
- `knowledge-base/BRAND_IDENTITY.md` — Full color tokens, typography, spatial system, anti-patterns
- `knowledge-base/BHARATVARSH_VISUAL_GUIDE.md` — Character appearances, faction colors, art direction, architecture
- `knowledge-base/BHARATVARSH_WRITING_GUIDE.md` — Voice, tone, terminology for copy generation

These are READ from the knowledge base at render time. Don't duplicate them here.

## .gitignore Note

Image files in this directory are gitignored (they're large and personal). Only this README and the directory structure are tracked. Keep your references local, or sync them via Google Drive.
