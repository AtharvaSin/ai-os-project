---
name: visual-artifact
description: "Rich interactive artifacts: dashboards, diagrams, infographics, and cards. Use when user asks to visualize, diagram, create a dashboard, infographic, or any visual output."
---

# Skill: Visual Artifact

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks to create a visual output: infographic, dashboard, process diagram, system map, comparison visualization, character card, data visualization, interactive tool, or any request where the primary value is in a rendered visual artifact rather than text.

Trigger phrases include: "create a diagram," "visualize this," "build a dashboard," "infographic for," "architecture diagram," "show this visually," "interactive view of," "character card for," or any request where the user explicitly wants a visual output.

---

## Process

### Step 1: Identify the Visual Type

| Visual Type | Best Format | When to Use |
|-------------|------------|-------------|
| System architecture | Mermaid (.mermaid) or SVG | Showing components, connections, data flow |
| Process flow | Mermaid or SVG | Sequential steps, decision trees, pipelines |
| Data dashboard | React (.jsx) | Metrics, KPIs, charts, live data display |
| Comparison matrix | React (.jsx) | Multi-criteria evaluation, side-by-side options |
| Infographic | HTML (.html) | Educational content, summaries, concept maps |
| Character/lore card | HTML (.html) | Bharatvarsh character profiles, faction dossiers |
| Timeline | React (.jsx) or SVG | Chronological events, project roadmaps |
| Content calendar | React (.jsx) | Planning views, status tracking |
| Checklist tool | React (.jsx) | Interactive checklists with state |

### Step 2: Gather Content
Pull the data or concepts that need visualization:
- If showing **architecture**: Reference the Reference Architecture
- If showing **project status**: Pull from WORK_PROJECTS.md and Evolution Log
- If showing **Bharatvarsh lore**: Pull from Bible and Platform docs
- If showing **data/metrics**: Pull from the relevant source or have the user provide data
- If showing **AI&U content**: Pull from the Knowledge Pack

### Step 3: Design with Intention
Before coding, decide:
- **What is the ONE thing** the viewer should understand from this visual?
- **What is the hierarchy?** What's most important → least important?
- **What's interactive?** What should the user be able to click, filter, toggle, or explore?

### Step 4: Build the Artifact

**Design principles (mandatory):**
- Clean, flat design. No gradients, no shadows, no decorative noise.
- Dark mode compatible — use CSS variables for colors, not hardcoded hex.
- Typography: 2 sizes max (heading + body). Weight: 400 regular, 500 bold only.
- Color: 2-3 color ramps maximum. Color encodes meaning, not decoration.
- White space is structural. Don't fill every pixel.
- Mobile-aware: use responsive layouts that work at narrow widths.

**For React artifacts:**
- Use Tailwind core utility classes only
- Use Recharts for charts, lucide-react for icons
- Default export, no required props
- Use useState for interactivity

**For HTML artifacts:**
- Single file with inline styles and scripts
- Load libraries from cdnjs.cloudflare.com if needed
- No external images — use SVG shapes, CSS, or text

**For Mermaid diagrams:**
- Use standard Mermaid syntax
- Keep to 15 nodes max per diagram — split into multiple if more

**For Bharatvarsh-themed visuals:**
- Use the obsidian/powder/mustard palette from the website
- Intelligence dossier aesthetic — classified stamps, redacted sections, data-card format
- Maintain the world's tone — controlled, precise, atmospheric

### Step 5: Deliver and Iterate
Present the artifact. Then ask: "Want me to adjust the layout, colors, data, or add interactivity?"

---

## Quality Rules

- Every visual must pass the "glance test" — the main point should be clear in 3 seconds.
- Don't visualize what should be text. A paragraph explaining three options doesn't need to be a diagram.
- Interactive elements must have a clear purpose. Don't add filters and toggles just because you can.
- Charts need labels, axes, and legends. No ambiguous data.
- Architecture diagrams should use standard conventions — boxes for components, arrows for data flow, dashed lines for optional/async.
- Bharatvarsh visuals must be lore-accurate. Check names, factions, tech against the Bible.

---

## Connectors Used

- **Knowledge base** — domain-specific docs depending on content
- **Artifacts system** — React, HTML, SVG, Mermaid rendering (required)
- **Web search** — if the visual needs current data or references
