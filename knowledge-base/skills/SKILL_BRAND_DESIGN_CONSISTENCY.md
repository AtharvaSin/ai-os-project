# Skill: Brand & Design Consistency

> **Scope:** Enforces Atharva Singh's three-context brand identity system across all visual output produced by the AI Operating System. This is a gate skill — it MUST run before producing any document, artifact, infographic, UI component, presentation, or visual deliverable.
>
> **Type:** Enforcement skill — Claude applies these rules automatically. No user trigger needed when producing visual output, but can be invoked explicitly.
>
> **Runtime:** Claude.ai (primary). Claude Code counterparts at `.claude/skills/brand-guidelines/`, `.claude/skills/infographic/`, `.claude/skills/ui-design-process/`.
>
> **Canonical token source:** `BRAND_IDENTITY.md` (in this project's knowledge base)

---

## When to Use

**Automatic activation (no trigger needed):** This skill activates whenever Claude is about to produce ANY visual output — React artifacts, HTML interfaces, documents (docx/pptx), infographics, charts, diagrams, data visualizations, system maps, markdown with visual structure, social media graphics, or styled content.

**Explicit triggers:** `/brand-guidelines`, "apply brand", "check brand consistency", "audit design", "make it on-brand", "design review", or any request mentioning brand, visual consistency, or design system.

**Skill consolidation:** This single skill replaces three Claude Code skills:
- `brand-guidelines` — context identification + token dispatch
- `infographic` — data visualization with brand tokens
- `ui-design-process` — anti-slop enforcement for interfaces

---

## Phase 1: Context Identification (MANDATORY — always first)

Before producing ANY visual output, identify the brand context. Apply these rules in order — first match wins.

### Context A: AI OS System

**Triggers:** `ai os`, `operating system`, `dashboard`, `portal`, `prd`, `product requirements`, `system design`, `architecture`, `research doc`, `decision memo`, `weekly review`, `morning brief`, `infographic`, `data visualization`, `technical report`, `sprint planning`, `roadmap`, `kanban`, `gantt`, `pipeline`, `mcp`, `cloud run`, `domain health`, `life graph`, `workflow`, `zealogics`, `professional work`

**Default:** When in doubt and content is work/technical → Context A.

### Context B: Bharatvarsh

**Triggers:** `bharatvarsh`, `mahabharatvarsh`, `novel`, `lore`, `faction`, `character`, `welcometobharatvarsh`, `timeline`, `alternate history`, `cyberpunk india`, `promotional`, `bhv`, `bharat`, `marketing` (when related to novel)

### Context C: Portfolio

**Triggers:** `portfolio`, `personal website`, `atharvasingh.com`, `personal branding`, `profile page`, `linkedin`, `resume site`, `showcase`

### Declaration

State your determination explicitly before proceeding:

```
CONTEXT: [A: AI OS System / B: Bharatvarsh / C: Portfolio]
CONTENT TYPE: [doc / artifact / infographic / UI / presentation / social]
ACCENT COLOR: [hex]
DISPLAY FONT: [font name]
```

If ambiguous, ask ONE clarifying question: "Is this for the AI OS / Bharatvarsh / Portfolio?"

---

## Phase 2: Load Design Tokens

Read `BRAND_IDENTITY.md` from the knowledge base. Load ONLY the section for your identified context. Hold these in working memory:

### Context A Quick Tokens (AI OS System)

| Token | Value | Usage |
|-------|-------|-------|
| Background (base) | `#0d0d14` | Page background |
| Background (surface) | `#12121e` | Cards, panels |
| Background (elevated) | `#1a1a2e` | Hover states |
| Border | `#1f1f35` | Dividers, card edges |
| **Accent primary** | **`#00D492`** | THE ONE accent — CTAs, active states, key data. Max 3-5 uses per screen. |
| Text primary | `#EEEAE4` | Headings |
| Text secondary | `#A09D95` | Body copy |
| Text muted | `#606060` | Labels, captions |
| Display font | Instrument Serif 400 | Hero text only |
| Heading font | DM Sans 700-800 | All headings |
| Body font | DM Sans 400 | Body text |
| Label font | DM Sans 600 UPPERCASE | Category labels |
| Data font | JetBrains Mono 400/600 | Metrics, code, timestamps |

**Section number grammar:** `01 — Section Title` (number in JetBrains Mono, accent color)

**Spatial rules:** Border radius max 12px. No box-shadow on dark backgrounds — border defines the edge. Generous whitespace between sections, tight within components.

### Context B Quick Tokens (Bharatvarsh)

| Token | Value | Usage |
|-------|-------|-------|
| Background (base) | `#0F1419` (Obsidian-900) | App background |
| Background (surface) | `#1A1F2E` (Obsidian-800) | Surface cards |
| **Accent primary** | **`#F1C232`** (Mustard) | Primary interactive — ALWAYS on dark, never as bg |
| Accent secondary | `#C9DBEE` (Powder-300) | Technical readouts, accent text |
| Text primary | `#F0F4F8` | Main body |
| Display font | Bebas Neue 400 | Military-style titles |
| Body font | Inter 400 | Standard UI copy |
| Lore font | Crimson Pro 400/600 | Historical documents, narrative |
| Hindi font | Noto Sans Devanagari 400 | All Hindi/Devanagari text |
| Data font | JetBrains Mono 400 | Terminal, data, logs |

**Atmospheric effects:** Film grain (SVG noise, opacity 0.04 on page wrappers), vignette (radial gradient on full-page containers), surveillance grid, glow effects (`0 0 20px rgba(241,194,50,0.3)` for mustard glow).

**Faction colors:** Military `#0B2742`, Mesh `#8B5CF6`, Resistance `#DC2626`, Republic `#3B82F6`, Guild `#F1C232`. Use semantically — never decoratively.

### Context C Quick Tokens (Portfolio)

| Token | Value | Usage |
|-------|-------|-------|
| **Light mode bg** | `#fafafa` | Default page background |
| Light mode surface | `#f5f5f5` | Cards |
| **Primary** | **`#8b5cf6`** (Violet) | Primary color |
| **Accent** | **`#f97316`** (Coral) | Secondary accent |
| Text heading | `#171717` | Headings |
| Text body | `#404040` | Body |
| ALL text font | Inter (all weights) | Universal — the portfolio IS Inter |
| Data font | JetBrains Mono | Code only |

**Dark Gallery mode (creative showcase only):** bg `#0a0a0a`, neon cyan `#00ffff`, neon magenta `#ff00ff`. Full section break between light and dark — never gradual.

**Rule:** Glassmorphism (`bg-white/80` + backdrop blur) is allowed in light mode Context C ONLY.

---

## Phase 3: Anti-Slop Checklist (MANDATORY before writing code)

Scan your planned output against this checklist. If any item matches, redesign before proceeding.

### Universal Violations (fail in any context)

- [ ] Generic hero: gradient text on dark bg + subtitle + two CTA buttons
- [ ] Three-column feature cards with icon + title + description
- [ ] Cookie-cutter "stats row" with big numbers and small labels
- [ ] Generic glassmorphism cards (allowed in Context C light mode only)
- [ ] Purple/blue gradient as primary visual element
- [ ] shadcn defaults without any customization
- [ ] Sidebar nav + main content without specific justification
- [ ] Everything in Inter or system-ui (wrong for Contexts A and B)
- [ ] Using `box-shadow: 0 4px 6px rgba(0,0,0,0.1)` on dark backgrounds
- [ ] Tables without brand color in header row
- [ ] Mixing tokens from different contexts (no mustard in A, no violet in B)

### Context A Violations

- [ ] Inter, Roboto, Arial, or system-ui as body font
- [ ] More than one prominent accent color per screen
- [ ] Glassmorphism / frosted blur effects
- [ ] Film grain or cinematic overlays
- [ ] Border radius > 12px
- [ ] Hero sections with gradient text (SaaS template, not OS)
- [ ] Drop shadows instead of borders
- [ ] Light-mode layout with just a dark background applied

### Context B Violations

- [ ] White/light mode backgrounds
- [ ] Violet (#8b5cf6) from Context C
- [ ] Mustard as background color (should be accent ON dark)
- [ ] Instrument Serif or DM Sans 800 headings
- [ ] Neon cyan/magenta gallery accents from Context C
- [ ] Hindi text in non-Devanagari font
- [ ] Film grain on small inline elements (page-level only)
- [ ] Faction colors used decoratively outside their faction

### Context C Violations

- [ ] Obsidian dark backgrounds outside Dark Gallery sections
- [ ] Mustard gold from Context B
- [ ] Heavy (800) DM Sans headings
- [ ] Film grain or surveillance textures
- [ ] Bebas Neue or Instrument Serif
- [ ] Neon accents on the light-mode version
- [ ] Purple gradient hero that looks like a SaaS homepage

**If any violation is found → fix it before outputting.**

---

## Phase 4: Output Type — Apply Design Rules

### For React Artifacts / Interactive HTML

**Step 4a: Use Case Interrogation**

Before coding, answer:

| Question | Answer it |
|----------|-----------|
| **Who uses this?** | Developer monitoring? Executive reviewing? Reader immersed? Visitor judging? |
| **When and where?** | Dashboard tab? One-time artifact? Mobile quick-check? Print/PDF? |
| **What's the ONE job?** | "The user needs to [do X] in order to [achieve Y]." |
| **Emotional register?** | Focus / Action / Trust / Exploration / Celebration / Warning / Clarity |

**Step 4b: Aesthetic Direction Commit**

Pick ONE direction archetype. Write it in 2-3 sentences. **No code until this is written.**

| Archetype | Character | Best for |
|-----------|-----------|----------|
| Architectural Precision | Exact grids, numbered sections, single accent | Context A system views |
| Operational Command | Dense data, status indicators, nothing wasted | Dashboards, pipelines |
| Editorial Authority | Large type, generous whitespace, content is design | Decision memos, reports |
| Cinematic Tension | Atmosphere first, glows, textures, dramatic contrast | Context B content |
| Quiet Competence | Restrained, perfect spacing, typography does the work | Context C professional |
| Dark Gallery Drama | Neon accents, artwork framing, gallery energy | Context C creative showcase |
| Data Landscape | Chart-first layout, data is the hero | Analytics, research |
| Process Theatre | Numbered steps, progress indicators, journey clarity | Workflows, tutorials |

**Write the direction.** Example: "Architectural Precision for an operational status view. Dark surface, electric emerald for live indicators, JetBrains Mono for metrics, numbered section labels. The user should feel informed and in control, not excited."

**Step 4c: Differentiation Decision**

Name ONE concrete design detail someone will remember:
- "The active state uses a 2px emerald left border that the eye jumps to"
- "Section numbers in JetBrains Mono create visual rhythm down the page"
- "Metric values use Instrument Serif for an editorial feel"

**Step 4d: Build**

Inject CSS variables at the artifact root:

```css
/* Context A example */
:root {
  --bg-base: #0d0d14;
  --bg-surface: #12121e;
  --bg-elevated: #1a1a2e;
  --border: #1f1f35;
  --accent: #00D492;
  --text-primary: #EEEAE4;
  --text-secondary: #A09D95;
  --text-muted: #606060;
}
```

Import correct fonts:
- **Context A:** `DM Sans` (400, 600, 700, 800) + `Instrument Serif` (400) + `JetBrains Mono`
- **Context B:** `Bebas Neue` + `Inter` + `Crimson Pro` + `Noto Sans Devanagari` + `JetBrains Mono`
- **Context C:** `Inter` (all weights) + `JetBrains Mono`

Construction order: layout shell → typography → key content (the ONE job) → secondary content → interactive states → empty/loading/error → mobile adjustments.

### For Infographics & Data Visualizations

Determine the visualization type:

| Type | When | Template pattern |
|------|------|-----------------|
| Metric card | KPIs, single stats | Large JetBrains Mono number + small DM Sans label |
| Comparison table | 2-4 options across attributes | Branded header row, accent highlight column |
| Process flow | Step-by-step workflow | Numbered steps with accent connector lines |
| Architecture diagram | System components | Mermaid with branded theme variables |
| Timeline | Chronological events | Horizontal/vertical with accent markers |
| Bar/line chart | Categorical/trend data | recharts or matplotlib with brand colors |
| Breakdown | Part-to-whole | recharts pie/donut with context palette |

**In Claude.ai:** Default to React artifact with recharts/d3 for charts, inline SVG for diagrams.

**Chart color rules:**
- Primary data series: context accent color
- Secondary series: `text-secondary` tone
- Axis labels and annotations: `text-muted`
- Chart background: `bg-surface` on dark contexts
- Always use token variables, never hardcoded hex

**Context A section label grammar for charts:**
```
01 —  CHART TITLE
```
(JetBrains Mono number in accent, DM Sans 600 title, 11px UPPERCASE)

**Mermaid diagrams (Context A themed):**
```mermaid
%%{init: {
  'theme': 'dark',
  'themeVariables': {
    'primaryColor': '#12121e',
    'primaryBorderColor': '#1f1f35',
    'primaryTextColor': '#EEEAE4',
    'lineColor': '#00D492',
    'edgeLabelBackground': '#1a1a2e'
  }
}}%%
```

### For Documents (docx / pptx)

- Cover page background: context primary bg color
- Heading font: context display font
- Body font: context body font
- Accent color on: H1 underlines, table headers, key callout boxes
- Reference Drive templates at `AI OS/BRAND_TEMPLATES/{context-a-ai-os, context-b-bharatvarsh, context-c-portfolio}/` if available

### For Social Media Content

- Apply context tokens to any generated visual direction or mockup
- LinkedIn/professional content → Context A or Context C depending on subject
- Bharatvarsh promotional → Context B always
- Include font + color callouts in art direction notes for production

### For Markdown Documents

- Open with a one-line context declaration comment: `<!-- Brand: Context A -->`
- Use structure (headers, tables, bold) to convey the brand's precision
- When the document will be rendered as HTML/artifact later, note the context for the rendering step

---

## Phase 5: Self-Review (MANDATORY before output)

Before finalizing, verify:

```
[ ] Brand context declared (A/B/C) with accent + font
[ ] No hardcoded colors — all from token variables
[ ] Correct font loaded (not Inter in A, not DM Sans in B, not Bebas in C)
[ ] Section number labels applied (Context A only)
[ ] Labels use text-muted or text-secondary, not primary
[ ] No box-shadow on dark backgrounds
[ ] No anti-slop patterns survived (Phase 3)
[ ] Data is accurate (numbers double-checked)
[ ] Mobile-readable (min 11px labels, 16px mobile padding)
[ ] The aesthetic direction from Phase 4 is visible in output
[ ] ONE memorable design detail exists
[ ] Would someone remember this? What would they remember?
```

End every branded output with this tag (in a comment or note):

```
<!-- Brand: Context [A/B/C] | Accent: [hex] | Fonts: [list] | Checked: [date] -->
```

---

## Font Context Lock Table

This table is absolute. No exceptions.

| Font | A (AI OS) | B (Bharatvarsh) | C (Portfolio) |
|------|-----------|-----------------|---------------|
| Instrument Serif | Display only | FORBIDDEN | FORBIDDEN |
| DM Sans | Primary | FORBIDDEN | FORBIDDEN |
| Bebas Neue | FORBIDDEN | Primary display | FORBIDDEN |
| Crimson Pro | FORBIDDEN | Lore/narrative | FORBIDDEN |
| Inter | FORBIDDEN | Body text | ALL text |
| Noto Sans Devanagari | FORBIDDEN | Hindi text | FORBIDDEN |
| **JetBrains Mono** | **Data/metrics** | **Data/metrics** | **Data/metrics** |

---

## Reference

- **Full token tables:** `BRAND_IDENTITY.md` in this knowledge base (532 lines, all three contexts with complete hex values, type scales, spatial systems, component patterns, anti-patterns)
- **Claude Code skills:** `.claude/skills/brand-guidelines/`, `.claude/skills/infographic/`, `.claude/skills/ui-design-process/`
- **Drive templates:** `AI OS/Artifacts/Brand-Templates/` (3 context subfolders: context-a-ai-os, context-b-bharatvarsh, context-c-portfolio)
- **Matplotlib theme:** `.claude/skills/infographic/assets/mpl-themes/ai_os_system.mplstyle` (Claude Code only)
- **React templates:** `.claude/skills/infographic/assets/react-templates/` — MetricCard, ComparisonTable, ProcessFlow (Claude Code only)
- **Extraction source:** wibify.agency dark mode — Context A accent #00D492 (electric emerald)

---

## Connectors Used

- **BRAND_IDENTITY.md** — Knowledge base document (primary reference, always available)
- **Google Drive** — For accessing pre-built .docx/.potx templates from `AI OS/Artifacts/Brand-Templates/`
- **AIOSMCP** — For uploading branded outputs to Drive via `upload_file` or `create_doc`
