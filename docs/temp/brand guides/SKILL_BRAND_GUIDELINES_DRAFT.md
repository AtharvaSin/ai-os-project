---
name: brand-guidelines
description: Apply Atharva Singh's brand identity system to any visual output. ALWAYS use this skill when creating documents, presentations, infographics, React artifacts, HTML interfaces, or any visual content. This skill dispatches to one of three brand contexts — AI OS System (dark, electric, DM Sans), Bharatvarsh (cinematic, mustard/obsidian, Bebas Neue), or Portfolio (violet/coral, Inter). Use it when the user mentions making a doc, deck, artifact, chart, or any deliverable that needs to look good and on-brand. Also use it to audit whether existing output follows brand rules.
---

# Brand Guidelines Skill

This skill applies the correct brand context and design tokens to any visual output from the AI OS.
It is a dispatcher — it reads context, loads the right token table, and enforces it.

## Step 0: Identify the Brand Context

Before producing ANY visual output, run this identification:

1. Read the user's request and look for context keywords (see TOKENS.md §Context Identification Rules)
2. State your determination explicitly:
   ```
   CONTEXT: [A: AI OS System / B: Bharatvarsh / C: Portfolio]
   REASON: [one sentence — why this context was selected]
   ```
3. If ambiguous, ask one clarifying question: "Is this for the AI OS / Bharatvarsh / Portfolio?"
4. Load only the relevant section from `references/TOKENS.md`

## Step 1: Load Token Table

Open `references/TOKENS.md`. Read ONLY the section for the identified context (A, B, or C).
Do not load all three — only the one you need.

Extract and hold in working memory:
- Primary background hex
- Accent color hex  
- Primary display font + weight
- Body font + weight
- 2–3 key component patterns

## Step 2: Apply Tokens

### For Documents (docx / pptx via skills)
- Set cover page background to primary bg color
- Set heading font to context display font
- Set body font to context body font
- Apply accent color to H1 underlines, table headers, and key callout boxes
- Refer to Drive: AI OS/BRAND_TEMPLATES/ for pre-built .dotx/.potx if available

### For React Artifacts / HTML Interfaces
Inject CSS variables at the root:
```css
:root {
  /* CONTEXT A example — replace with actual extracted values */
  --bg-base: #0d0d14;
  --bg-surface: #12121e;
  --bg-elevated: #1a1a2e;
  --border: #1f1f35;
  --accent: [accent-primary from extracted tokens];
  --text-primary: #EEEAE4;
  --text-secondary: #A09D95;
  --text-muted: #606060;
}
```

Import Google Fonts for the context:
- Context A: `DM Sans` (400, 600, 700, 800) + `Instrument Serif` (400) + `JetBrains Mono`
- Context B: `Bebas Neue` + `Inter` + `Crimson Pro` + `Noto Sans Devanagari` + `JetBrains Mono`
- Context C: `Inter` (all weights) only + `JetBrains Mono`

### For Infographics (SVG / React charts)
- Use the context's accent as the primary data color
- Use `text-secondary` for axis labels and annotations
- Use `bg-surface` for chart backgrounds on dark contexts
- Refer to the infographic skill for specific chart templates

### For Markdown Documents
- The document will be rendered; use frontmatter to specify context if supported
- Open with a one-line context declaration comment
- Apply bold/emphasis using accent-relevant phrasing (not color)

## Step 3: Anti-Pattern Check

Before finalizing output, scan against this checklist:

```
UNIVERSAL VIOLATIONS (fail any context):
□ Using Inter/Roboto/Arial in Context A
□ Using Instrument Serif in Context B or C
□ Using Bebas Neue in Context A or C
□ Mixing accent colors from different contexts
□ Generic purple-gradient-on-white layout (wrong in all contexts)
□ Box shadows on dark backgrounds (invisible, meaningless)
□ Table without styled header row

CONTEXT A VIOLATIONS:
□ Glassmorphism / frosted blur effects
□ Film grain or cinematic overlays
□ More than one prominent accent color per screen
□ Border radius > 12px

CONTEXT B VIOLATIONS:
□ White/light mode backgrounds
□ Violet (#8b5cf6) from Context C
□ Mustard as background color (should be accent ON dark)
□ Hindi text in non-Devanagari font

CONTEXT C VIOLATIONS:
□ Obsidian dark backgrounds outside Dark Gallery sections
□ Mustard gold from Context B
□ Heavy (800) DM Sans headings
□ Film grain or surveillance textures
```

If any violation is found, fix it before outputting.

## Output Declaration

End every branded output with this block (in a comment or note):

```
<!-- Brand: Context [A/B/C] | Accent: [hex] | Fonts: [list] | Checked: [date] -->
```

## When to escalate to other skills

- Need an infographic or data chart → use the `infographic` skill
- Need a full UI component with process thinking → use the `ui-design-process` skill  
- Need a docx/pptx file → use the `docx` or `pptx` skill AND this skill together

## Reference

Full token tables, anti-pattern lists, and component patterns:
→ Read `references/TOKENS.md` (this is a copy of `knowledge-base/BRAND_IDENTITY.md`)
→ For Context A detailed spec: `references/SPEC_CONTEXT_A.md`
→ For Context B detailed spec: `references/SPEC_CONTEXT_B.md`
→ For Context C detailed spec: `references/SPEC_CONTEXT_C.md`
