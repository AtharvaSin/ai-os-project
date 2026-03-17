---
name: ui-design-process
description: Build genuinely distinctive, use-case-specific UI/UX designs that avoid AI slop and generic aesthetics. ALWAYS use this skill when building any web interface, React component, dashboard page, landing section, form, or interactive artifact — especially when quality matters. This skill runs a structured pre-build process (context declaration, aesthetic direction commit, anti-slop check) BEFORE writing code, ensuring every UI is designed for its specific purpose, not copy-pasted from a template. Pair with the brand-guidelines skill for token application.
---

# UI Design Process Skill

Produces intentional, distinctive, use-case-specific UI that doesn't look like every other Claude artifact.

The rule: **no code until the design direction is committed in writing.**

---

## Step 0: CONTEXT DECLARATION (mandatory)

Before anything else, state:

```
BRAND CONTEXT: [A: AI OS System / B: Bharatvarsh / C: Portfolio]
CONTENT TYPE: [dashboard / form / landing / component / data-view / interactive]
TOKEN SOURCE: [paste the 5–6 key tokens you'll use from BRAND_IDENTITY.md]
```

Load the brand-guidelines skill immediately after this declaration.

---

## Step 1: USE CASE INTERROGATION

Answer these before touching any code. Extract answers from the request; ask only if genuinely unclear.

**Who uses this?**
- Developer monitoring a pipeline? → Precision, data-density, operational clarity
- Executive reviewing a brief? → Hierarchy, scannable, low-noise
- Reader immersed in lore? → Atmosphere, narrative pacing, world-building
- Visitor judging a portfolio? → Taste signal, skill demonstration, first impression

**When and where?**
- Always-open dashboard tab → comfortable for long sessions, not overwhelming
- One-time decision artifact → high impact, makes the case fast
- Mobile quick-check → information density must drop, thumb targets must grow
- Print/PDF output → no dark backgrounds, high contrast for paper

**What's the ONE job?**
Write it as a single sentence: "The user needs to [do X] in order to [achieve Y]."

**What's the emotional register?**
Pick one: `Focus / Action / Trust / Exploration / Celebration / Warning / Clarity`

---

## Step 2: AESTHETIC DIRECTION COMMIT

Pick ONE aesthetic direction. Write it in 2–3 sentences. No code until this is written.

**The direction must:**
1. Be specific to THIS use case (not generic "dark and modern")
2. Reference the brand context tokens
3. Identify the ONE visual signature someone will remember

**Direction archetypes to choose from:**

| Archetype | Character | Works for |
|-----------|-----------|-----------|
| Architectural Precision | Exact grids, numbered sections, single accent, no decoration | Context A system views |
| Operational Command | Dense data, status indicators, nothing wasted | Dashboards, pipelines |
| Editorial Authority | Large type, generous whitespace, content is the design | Decision memos, reports |
| Cinematic Tension | Atmosphere first, glows, textures, dramatic contrast | Context B content |
| Quiet Competence | Restrained, perfect spacing, typography does the work | Context C professional |
| Dark Gallery Drama | Neon accents, artwork framing, gallery energy | Context C creative showcase |
| Data Landscape | Chart-first layout, data is the hero | Analytics, research |
| Process Theatre | Numbered steps, progress indicators, journey clarity | Workflows, tutorials |

**Example direction statement:**
> "Architectural Precision for an operational status view. The page feels like a command display — 
> dark surface, electric teal for live/healthy indicators, JetBrains Mono for all metrics, 
> numbered section labels. The user should feel informed and in control, not excited."

**Write your direction statement now.** If you can't write it in 2–3 sentences, you don't have a direction yet.

---

## Step 3: ANTI-SLOP CHECKLIST

Before writing a single line of code, verify you are NOT about to build:

```
GENERIC AI ARTIFACT PATTERNS — any of these = start over:
□ Hero with gradient text on dark background + subtitle + two CTA buttons
□ Three-column feature cards with icon + title + description
□ "Stats row" with big numbers and small labels
□ Cookie-cutter glassmorphism cards
□ Purple/blue gradient as primary visual element
□ shadcn default styling without any customization
□ Sidebar nav + main content area (without specific need)
□ Everything in Inter or system-ui

CONTEXT A SPECIFIC SLOPS:
□ Light-mode layout with just a dark background applied
□ More than 2 accent colors active at once
□ Drop shadows instead of borders

CONTEXT B SPECIFIC SLOPS:
□ Generic "dark theme" without atmospheric effects
□ Mustard CTA buttons on light backgrounds
□ Faction colors used decoratively (not semantically)

CONTEXT C SPECIFIC SLOPS:
□ Purple gradient hero that looks like a SaaS homepage
□ Generic portfolio template layout
□ "Glassmorphism everything" without purpose
```

If you caught yourself about to use any of these, rethink the aesthetic direction (back to Step 2).

---

## Step 4: DIFFERENTIATION DECISION

Identify ONE thing that makes this design unforgettable.
This must be a concrete design decision, not an adjective.

Examples:
- "The active state uses a 2px electric teal left border that the eye jumps to"
- "Section numbers in JetBrains Mono create a deliberate visual rhythm down the page"
- "The empty state has a centered data readout instead of an illustration"
- "Metric values use Instrument Serif for an editorial, not technical, feel"
- "Table rows highlight the entire row with a hairline left border, no background change"

Write yours: ___

---

## Step 5: BUILD

Now write the code, with the direction and differentiation decision in your context.

**Construction rules:**

1. **CSS variables or inline token objects — never hardcoded hex values**
2. **Fonts loaded via Google Fonts import or system font stack**
3. **No placeholder content** — use realistic data that matches the actual use case
4. **Responsive by default** — test mentally at 375px and 1280px
5. **Accessible** — all interactive elements have `:focus-visible` states
6. **Purposeful motion** — if you add animation, state why (entrance, feedback, transition)

**Component construction order:**
1. Layout shell (background, overall structure)
2. Typography hierarchy (install fonts, set scale)
3. Key data/content (the ONE job — make this work first)
4. Secondary content and navigation
5. Interactive states (hover, focus, active)
6. Empty/loading/error states
7. Mobile adjustments

---

## Step 6: SELF-REVIEW

Before handing off, answer:

```
□ Is the aesthetic direction from Step 2 visible in the output?
□ Does the ONE unforgettable thing from Step 4 exist in the output?
□ Did you catch and fix all anti-slop patterns from Step 3?
□ Are all colors from BRAND_IDENTITY.md (no rogue hex values)?
□ Does the correct font load (not Inter in Context A)?
□ Is the design specific to THIS use case, or could it be any app?
□ Would someone remember it? What would they remember?
```

If any answer is "no" — fix it. Don't ship the slop.

---

## Reference Files

- Token reference: load `brand-guidelines` skill
- Anti-slop extended checklist: `references/ANTI_SLOP_CHECKLIST.md`
- Frontend execution: load `frontend-design` skill for implementation technique
