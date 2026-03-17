# Brand Consistency System — Claude Code Build Instructions

> **Purpose:** Complete build guide for the AI OS brand consistency system.
> Execute these phases in order. Each phase has explicit success criteria before proceeding.
>
> **Estimated effort:** 3–4 Claude Code sessions
> **Output:** BRAND_IDENTITY.md (KB doc) + 3 new skills + matplotlib theme + Drive templates

---

## Pre-Flight Check

Before starting, verify:
```bash
# Check Playwright is available (needed for Phase 1)
npx playwright --version || npm install -g playwright

# Check Python + matplotlib (needed for Phase 3)
python3 -c "import matplotlib; print(matplotlib.__version__)"

# Check repo structure
ls ~/ai-os-project/knowledge-base/
ls ~/ai-os-project/skills/
```

If `~/ai-os-project/` doesn't exist, ask the user for the correct repo path before continuing.

---

## Phase 1: Token Extraction (Wibify → Context A)

**Goal:** Extract exact CSS design tokens from wibify.agency and produce `specs/context_a_extracted.json`

### Step 1.1 — Run the extraction script

```bash
cd /tmp && node ~/ai-os-project/brand-system-build/scripts/extract_wibify_tokens.js
```

This script (provided in `scripts/extract_wibify_tokens.js`) uses Playwright to:
1. Visit `https://wibify.agency`
2. Extract all `:root` CSS custom properties
3. Extract computed styles for key elements (nav, hero text, cards, CTAs, backgrounds)
4. Scrape the primary accent color (the neon green/electric color used on interactive elements)
5. Output to `specs/context_a_extracted.json`

### Step 1.2 — Validate extraction output

Open `specs/context_a_extracted.json` and verify it contains:
- At minimum: background color, one accent color, text colors, border colors
- If the extraction returned empty or failed, run the fallback manual extraction:

```bash
node ~/ai-os-project/brand-system-build/scripts/extract_wibify_fallback.js
```

The fallback visits multiple pages and does a broader computed-style scan.

### Step 1.3 — Reconcile with AI OS palette

Read `specs/context_a_extracted.json` alongside `specs/SPEC_CONTEXT_A.md`.
Update `specs/SPEC_CONTEXT_A.md` with the actual extracted hex values, replacing any placeholder values.

**Key reconciliation rules:**
- Extracted background colors that are near-black: map to `bg-void` / `bg-base` / `bg-surface`
- The primary interactive/CTA accent (likely a bright green or electric teal): map to `accent-primary`
- Any secondary accent: map to `accent-secondary`
- Text colors: map to `text-primary` / `text-secondary` / `text-muted`
- If Wibify uses a variable that maps closely to an existing Obsidian Aurora token (within ~15% luminance), keep the existing Obsidian Aurora value

**Phase 1 success criteria:** `specs/SPEC_CONTEXT_A.md` has no placeholder `#???` values.

---

## Phase 2: Build BRAND_IDENTITY.md

**Goal:** Produce the canonical `BRAND_IDENTITY.md` KB document and commit it to the repo.

### Step 2.1 — Assemble from specs

Read all three spec files:
- `specs/SPEC_CONTEXT_A.md` (AI OS System — Wibify-inspired, now with extracted tokens)
- `specs/SPEC_CONTEXT_B.md` (Bharatvarsh — from brand guide)
- `specs/SPEC_CONTEXT_C.md` (Portfolio Website — from brand guide)

Produce `knowledge-base/BRAND_IDENTITY.md` following the template in `specs/BRAND_IDENTITY_TEMPLATE.md`.

### Step 2.2 — Validate completeness

The output file MUST contain:
- [ ] All three context token tables (colors, typography, spacing)
- [ ] Context identification rules (routing logic)
- [ ] Anti-pattern list per context ("Never use X in Context Y")
- [ ] Cross-context rules (what's shared vs. separated)
- [ ] Quick-reference card at the top

### Step 2.3 — Commit to repo

```bash
cd ~/ai-os-project
git add knowledge-base/BRAND_IDENTITY.md
git commit -m "feat(brand): add BRAND_IDENTITY.md — three-context design system

Contexts:
- A: AI OS System (Wibify-inspired, Obsidian Aurora evolution)
- B: Bharatvarsh (dystopian-cinematic, Mustard/Obsidian/Navy)
- C: Portfolio Website (Violet/Coral, Dark Gallery mode)

Includes routing rules, token tables, anti-patterns, and cross-context
typography shared layer (JetBrains Mono universal, DM Sans system)."
```

**Phase 2 success criteria:** File exists at `knowledge-base/BRAND_IDENTITY.md`, git status is clean.

---

## Phase 3: Build the Three Skills

Build in this order: Brand Guidelines → Infographic → UI Design Process.
Each skill goes in `skills/` and follows the SKILL.md structure.

### Skill A: brand-guidelines

**Source:** `skill-drafts/SKILL_BRAND_GUIDELINES_DRAFT.md`

```bash
mkdir -p ~/ai-os-project/skills/brand-guidelines/references
cp ~/ai-os-project/brand-system-build/skill-drafts/SKILL_BRAND_GUIDELINES_DRAFT.md \
   ~/ai-os-project/skills/brand-guidelines/SKILL.md
```

Then create the reference file:
```bash
# Copy the full token tables as a standalone reference
cp ~/ai-os-project/knowledge-base/BRAND_IDENTITY.md \
   ~/ai-os-project/skills/brand-guidelines/references/TOKENS.md
```

Edit `SKILL.md` to reference `references/TOKENS.md`:
> "For the complete token table, read `references/TOKENS.md`. Load only the section for the identified context."

### Skill B: infographic

**Source:** `skill-drafts/SKILL_INFOGRAPHIC_DRAFT.md`

```bash
mkdir -p ~/ai-os-project/skills/infographic/{references,assets/react-templates,assets/mpl-themes}
cp ~/ai-os-project/brand-system-build/skill-drafts/SKILL_INFOGRAPHIC_DRAFT.md \
   ~/ai-os-project/skills/infographic/SKILL.md
```

Generate the matplotlib theme file:
```bash
python3 ~/ai-os-project/brand-system-build/scripts/generate_mpl_theme.py \
  --spec ~/ai-os-project/brand-system-build/specs/SPEC_CONTEXT_A.md \
  --output ~/ai-os-project/skills/infographic/assets/mpl-themes/ai_os_system.mplstyle
```

Generate the React infographic template components:
```bash
node ~/ai-os-project/brand-system-build/scripts/generate_react_templates.js \
  --output ~/ai-os-project/skills/infographic/assets/react-templates/
```

This creates:
- `MetricCard.jsx` — KPI summary card, Context A branded
- `ComparisonTable.jsx` — Side-by-side comparison, dark themed
- `ProcessFlow.jsx` — Numbered steps with connector lines
- `ArchDiagram.jsx` — System architecture layout
- `TimelineView.jsx` — Horizontal timeline with markers

### Skill C: ui-design-process

**Source:** `skill-drafts/SKILL_UI_DESIGN_PROCESS_DRAFT.md`

```bash
mkdir -p ~/ai-os-project/skills/ui-design-process/references
cp ~/ai-os-project/brand-system-build/skill-drafts/SKILL_UI_DESIGN_PROCESS_DRAFT.md \
   ~/ai-os-project/skills/ui-design-process/SKILL.md
```

Create the anti-slop reference checklist:
```bash
cp ~/ai-os-project/brand-system-build/skill-drafts/ANTI_SLOP_CHECKLIST.md \
   ~/ai-os-project/skills/ui-design-process/references/ANTI_SLOP_CHECKLIST.md
```

### Step 3.4 — Commit all skills

```bash
cd ~/ai-os-project
git add skills/brand-guidelines/ skills/infographic/ skills/ui-design-process/
git commit -m "feat(skills): add three brand consistency skills

- brand-guidelines: context-aware token dispatch (A/B/C routing)
- infographic: dual-mode visual generation (React artifact + matplotlib)
- ui-design-process: anti-slop process with Step 0 context declaration

All skills reference BRAND_IDENTITY.md as canonical source."
```

**Phase 3 success criteria:** All three skills have valid SKILL.md with YAML frontmatter and body content. React templates render without errors. `.mplstyle` file has no syntax errors (run `python3 -c "import matplotlib; matplotlib.style.use('path/to/file')"` to validate).

---

## Phase 4: Drive Templates

**Goal:** Create branded document templates in Google Drive.

### Step 4.1 — Create Drive folder structure

Use the AIOSMCP `create_drive_folder` tool (or Claude.ai MCP) to create:
```
Drive: AI OS/
  └── BRAND_TEMPLATES/
      ├── context-a-ai-os/
      ├── context-b-bharatvarsh/
      └── context-c-portfolio/
```

### Step 4.2 — Generate the DOCX templates

```bash
python3 ~/ai-os-project/brand-system-build/scripts/generate_docx_templates.py
```

This script (see `scripts/generate_docx_templates.py`) uses `python-docx` to generate:
- `ai_os_template.docx` — Context A: DM Sans body, Instrument Serif titles, near-black cover page, electric teal accents
- `bharatvarsh_template.docx` — Context B: Crimson Pro body, Bebas Neue titles, obsidian cover, mustard accents
- `portfolio_template.docx` — Context C: Inter body, Inter Display titles, violet/coral accents

```bash
# Install python-docx if needed
pip install python-docx --break-system-packages
```

### Step 4.3 — Upload to Drive

For each generated file, use AIOSMCP `upload_file` to place it in the correct Drive subfolder. Log each upload in the artifacts table via `insert_record`.

### Step 4.4 — Final commit

```bash
cd ~/ai-os-project
git add brand-system-build/
git commit -m "chore(brand): add brand-system-build infrastructure

Scripts, specs, and skill drafts used to generate the brand consistency
system. Kept in repo for future updates and re-generation."
```

---

## Phase 5: Update KB Documents

After all phases complete, update these KB documents:

### 5.1 — Update INTERFACE_STRATEGY.md

Add a new section after "Design System (Dashboard)":
```markdown
## Brand Identity System

The OS operates three distinct brand contexts managed via `BRAND_IDENTITY.md`
and the `brand-guidelines` skill. See that document for canonical token tables.

Context routing:
- AI OS System (Context A): Dashboard, PRDs, research docs, infographics, system artifacts
- Bharatvarsh (Context B): Novel content, website, promotional material, lore
- Portfolio (Context C): Personal website, profile content, atharvasingh.com

All visual output from this OS MUST declare its context before applying any tokens.
```

Update the Skills count (15 → 22 with the new additions).

### 5.2 — Add entry to EVOLUTION_LOG.md

```markdown
## Entry 013 — Brand Consistency System (Sprint 9-A)

**Date:** [current date]
**Decision:** Built three-context brand identity system.
**Contexts:** A (AI OS/Wibify-inspired), B (Bharatvarsh cinematic), C (Portfolio violet/coral)
**Artifacts:** BRAND_IDENTITY.md, skills/brand-guidelines, skills/infographic, skills/ui-design-process
**Infra:** matplotlib theme (Context A), React infographic templates (5 components), 3 Drive .docx templates
**Impact:** All visual output from the OS is now brand-declarative. Anti-slop enforcement embedded in ui-design-process skill.
```

### 5.3 — Commit and sync

```bash
cd ~/ai-os-project
git add knowledge-base/INTERFACE_STRATEGY.md knowledge-base/EVOLUTION_LOG.md
git commit -m "docs(kb): update INTERFACE_STRATEGY + EVOLUTION_LOG for brand system

Sprint 9-A complete. Three-context brand system operational."
```

Then in Claude.ai: trigger /kb-sync to pull the updated docs into the project knowledge base.

---

## Verification Checklist

Run this after all phases complete:

```bash
cd ~/ai-os-project

echo "=== Knowledge Base ===" 
ls knowledge-base/BRAND_IDENTITY.md

echo "=== Skills ==="
ls skills/brand-guidelines/SKILL.md
ls skills/infographic/SKILL.md
ls skills/ui-design-process/SKILL.md
ls skills/infographic/assets/mpl-themes/ai_os_system.mplstyle
ls skills/infographic/assets/react-templates/*.jsx

echo "=== Git Status ==="
git log --oneline -5
git status

echo "=== Matplotlib theme validation ==="
python3 -c "
import matplotlib
matplotlib.style.use('skills/infographic/assets/mpl-themes/ai_os_system.mplstyle')
print('Theme valid')
"
```

All checks should pass before closing the session.

---

## If You Hit Blockers

| Blocker | Resolution |
|---|---|
| Playwright can't reach wibify.agency | Use `scripts/extract_wibify_manual.md` — manually specified fallback tokens based on visual inspection |
| python-docx template generation fails | Skip Phase 4, create templates manually in Google Docs and apply brand tokens manually |
| Repo path not at `~/ai-os-project` | Ask user: "What is the path to the ai-os-project repo on this machine?" |
| Skills directory structure unclear | Check existing skills: `ls ~/ai-os-project/skills/` for reference structure |
| Drive upload fails (AIOSMCP not connected) | Skip upload, note in summary, user will connect and upload separately |
