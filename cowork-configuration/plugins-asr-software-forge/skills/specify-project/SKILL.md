---
name: specify-project
description: Generate a complete project specification — PRD, UI design direction, brand tokens, and architecture decision — before any code is written. Use when starting a new project with the forge. This is Phase 1 of the Software Forge workflow. Trigger phrases include "spec this project", "start a new forge project", "I want to build...", or any new product idea that needs formalizing before development.
---

# Specify Project (Phase 1)

The thinking phase. No code until the spec is committed. This skill produces the strategic documents that make every forge project bespoke rather than a generic AI-generated scaffold.

Every minute spent here saves an hour in Phase 3 (Build).

## Before Starting

1. Read `${CLAUDE_PLUGIN_ROOT}/context/engineering-preferences.md` for standards
2. Check if `forge-projects/{slug}/` already exists in the ai-os-project root — if so, we're resuming a prior spec
3. If the user hasn't described the project yet, ask for a 2-3 sentence pitch

## Step 1: Project Identity

Establish the fundamentals before any detailed thinking:

| Field | How to Derive |
|-------|---------------|
| **Slug** | Derive from name, kebab-case, globally unique across forge-projects/ |
| **Name** | The project's display name |
| **One-liner** | What it does in one sentence — if you can't say it in one sentence, the scope is too large |
| **Target users** | Be specific. "Developers" is too vague. "Solo founders who need to track their SaaS metrics" is good. |
| **Problem statement** | What pain exists today? What happens if nobody builds this? |
| **Revenue model** | How does this make money (or save time)? Even side projects need a reason to exist. |

Create the project directory:
```bash
mkdir -p {AI_OS_ROOT}/forge-projects/{slug}/specs
```

Initialize `manifest.json` from the template at `${CLAUDE_PLUGIN_ROOT}/templates/manifest.json`. Fill in identity fields.

## Step 2: Competitive Landscape (5 minutes, not 5 hours)

Don't skip this. Even a quick scan prevents building something that already exists or missing an obvious differentiator.

Run a focused competitive check:
1. Search for 3-5 existing products that solve a similar problem
2. For each: name, URL, what they do well, what they do poorly, pricing
3. Identify the **gap** — what would YOUR version do that they don't?

If the user wants deeper research, chain to the `deep-research` skill in `.claude/skills/`. But for most projects, a 5-minute scan is sufficient.

Output: `forge-projects/{slug}/specs/competitive-scan.md`

If nothing competing exists, document that too — it's either a blue ocean or a dead market. Figure out which.

## Step 3: Generate the PRD

Follow the build-prd skill structure, adapted for forge projects. This is NOT a 15-page enterprise document — it's a focused, actionable spec.

### 3a. Problem & Goals
- **Problem Statement** — 3-4 sentences. The pain, who feels it, what happens without a solution.
- **Goals** — 3-5 measurable targets. "Active users in first month: 50" not "get users."
- **Non-Goals** — Equally important. What is this project explicitly NOT trying to do?

### 3b. User Personas (2-3 max)
For each persona:
- Name and role (make them real — "Priya, a freelance designer managing 8 clients")
- Primary need
- Current workaround (how they solve this today)
- Frustration with current approach

### 3c. User Stories
Format: As [persona], I want [action] so that [outcome].
Group by persona. Mark priority:
- **P0** — Ship-blocking. The product doesn't make sense without these.
- **P1** — Important for a good experience. Ship within first iteration.
- **P2** — Nice-to-have. Future roadmap.

If there are more than 8 P0 stories, the scope is too large. Split into phases.

### 3d. Functional Requirements
For each P0 and P1 requirement:
- ID (REQ-001, REQ-002, etc.)
- Description
- Acceptance criteria (how do you know it's done?)
- Dependencies (what else needs to exist first?)

### 3e. Non-Functional Requirements
Cover these categories:
- **Performance** — Load time targets, API response targets, concurrent user targets
- **Security** — Auth requirements, data sensitivity, encryption needs
- **Accessibility** — WCAG level, keyboard navigation, screen reader support
- **SEO** — If applicable, meta tags, SSR/SSG requirements, structured data
- **Offline/PWA** — If applicable, what works offline?

### 3f. Data Model
Define the core entities:
- Entity name, fields, types, constraints
- Relationships (one-to-many, many-to-many)
- Indexes needed for common queries
- Seed data requirements

Use a table format. This becomes the Prisma schema or SQLAlchemy model.

### 3g. API Specification
For each endpoint:
- Method + route (GET /api/projects/:id)
- Request body/params
- Response shape
- Auth requirement (public, authenticated, admin)
- Error responses

### 3h. Page/Screen Inventory
Every page in the application:
- Route path
- Purpose (what the user does here)
- Key components on the page
- Data requirements (what API calls does this page need?)
- Interaction patterns (forms, drag-drop, real-time updates)

Output: `forge-projects/{slug}/specs/prd.md`

## Step 4: Architecture Decision

**DO NOT default to Next.js.** Evaluate the actual needs against this decision matrix:

| Signal | Best Stack | Why |
|--------|-----------|-----|
| Content site with SEO + some interactivity | **Next.js 14 (App Router)** | SSR/SSG + React ecosystem |
| Heavy client-side interactivity (dashboards, editors) | **Next.js 14** or **SvelteKit** | React for ecosystem, Svelte for performance |
| API-first service (no UI or minimal UI) | **FastAPI** (Python) or **Hono** (TypeScript) | Lean, fast, type-safe |
| Real-time features (chat, collaboration) | **Next.js + Supabase Realtime** or **Socket.io** | Depends on persistence needs |
| Static marketing/portfolio | **Astro** or **Next.js (static export)** | Astro for content, Next for dynamic islands |
| Widget/embed for other sites | **React + Vite** (no framework) | Small bundle, easy embed |
| CLI tool or automation | **Python (Typer)** or **Node (Commander)** | Python for data, Node for JS ecosystem |
| Desktop application | **Tauri** (Rust + web) or **Electron** | Tauri for performance, Electron for familiarity |
| Mobile-first PWA | **Next.js + PWA config** or **Expo (React Native)** | Web for reach, native for features |
| Multi-tenant SaaS | **Next.js + row-level security + auth** | Full framework needed |
| Data pipeline / ETL | **Python (Prefect/Dagster)** | Native data ecosystem |

Document the decision with:
1. **Stack chosen** — every layer (frontend, backend, database, auth, hosting)
2. **Rationale** — why this over the alternatives (reference specific project requirements)
3. **Key dependencies** — libraries, services, APIs needed
4. **Deployment target** — where this runs (Vercel, Cloud Run, Railway, etc.)
5. **Cost estimate** — monthly hosting cost at expected scale

Output: `forge-projects/{slug}/specs/architecture.md`

## Step 5: UI Design Direction

**THIS IS THE ANTI-SLOP PHASE.** This step is what separates forge-built software from generic AI output.

Run the complete design thinking process:

### 5a. Context Declaration
```
BRAND CONTEXT: [A: AI OS System / B: Bharatvarsh / C: Portfolio / D: Custom for this project]
CONTENT TYPE: [dashboard / form / landing / commerce / content / tool / admin]
TARGET FEELING: [what should users feel when they use this? Be specific.]
```

If Brand Context is D (custom), define the brand from scratch in this step.
If it's A, B, or C, load tokens from the brand-guidelines skill reference files.

### 5b. Use-Case Interrogation
Answer EVERY question. Extract from the PRD; don't make up answers.

**Who uses this?**
- Their technical level (developer? non-technical? mixed?)
- Their context (working fast? browsing leisurely? stressed?)
- Their device (desktop primary? mobile primary? both equally?)

**When and where?**
- Always-open daily tool → comfortable for long sessions, low cognitive load
- Occasional-use tool → needs to be learnable each time
- One-time experience → high impact, guide through a flow
- Mobile in sunlight → high contrast, large touch targets

**What's the ONE job?**
Write it as a single sentence: "The user needs to [do X] in order to [achieve Y]."
If you need two sentences, the product tries to do too much.

**What's the emotional register?**
Pick ONE: `Focus / Action / Trust / Exploration / Celebration / Warning / Clarity`
This choice drives every visual decision downstream.

### 5c. Aesthetic Direction Commit
Pick ONE aesthetic direction. Write it in 2-3 sentences.

**The direction MUST:**
1. Be specific to THIS project (not "dark and modern")
2. Reference concrete visual mechanisms (grid structure, typography treatment, color usage)
3. Identify the ONE visual signature element

Choose from these archetypes or create a hybrid:

| Archetype | Character | Best for |
|-----------|-----------|----------|
| **Architectural Precision** | Exact grids, numbered sections, single accent, zero decoration | System tools, developer UIs |
| **Operational Command** | Dense data, status indicators, nothing wasted | Dashboards, monitoring |
| **Editorial Authority** | Large type, generous whitespace, content IS the design | Blogs, documentation, reports |
| **Warm Product** | Rounded corners, friendly palette, approachable spacing | Consumer apps, onboarding |
| **Brutalist Function** | Raw grid, heavy typography, no ornamentation | Creative portfolios, statement pieces |
| **Cinematic Immersion** | Atmospheric depth, dramatic contrast, textured surfaces | Entertainment, storytelling |
| **Quiet Competence** | Restrained palette, perfect spacing, typography does the heavy lifting | Professional tools, finance |
| **Data Landscape** | Charts first, data is the hero, controls are secondary | Analytics, research tools |
| **Process Theatre** | Numbered steps, progress indicators, journey is visible | Wizards, tutorials, setup flows |
| **Marketplace Grid** | Card-based browsing, filters, visual density | E-commerce, directories, catalogs |

**Example direction statement (good):**
> "Operational Command for a SaaS metrics dashboard. The layout is a dense 12-column grid on dark charcoal — every pixel earns its place. Status uses a three-color traffic-light system (green/amber/red) with no gradients. JetBrains Mono for all numbers. The signature: metric cards have a 2px left border in their status color — the eye scans the border strip to assess health in under a second."

**Example direction statement (bad — too vague, would produce slop):**
> "Modern dark theme with clean cards and nice animations."

Write your direction statement now. If it's fewer than 2 sentences or contains only adjectives, it's not a direction yet.

### 5d. Anti-Slop Checklist
Before committing the direction, verify you are NOT about to build:

```
GENERIC AI PATTERNS — any of these means rethink:
□ Hero section with gradient text on dark background + subtitle + two CTA buttons
□ Three-column feature cards with icon + title + description
□ "Stats row" with big numbers and small labels in a horizontal strip
□ Cookie-cutter glassmorphism cards with blur(10px)
□ Purple-to-blue gradient as the primary visual element
□ shadcn/ui default theme without ANY customization
□ Sidebar nav + main content area (without a specific reason for sidebar)
□ Inter or system-ui as the only typeface
□ Card-based layout where every card has identical structure
□ Rounded rectangles with subtle shadows as the only design language
□ A landing page that could belong to any SaaS product

UI ANTI-PATTERNS:
□ More than 3 colors actively competing for attention
□ Animations that don't serve a functional purpose
□ Decorative gradients that carry no information
□ Lorem ipsum or placeholder content
□ Stock-photo hero images
□ "Get Started" button that goes nowhere
```

If you caught yourself about to use ANY of these, return to Step 5c and rethink.

### 5e. Differentiation Decision
Identify ONE concrete design decision someone will remember about this product.

This must be a **specific visual or interaction mechanism**, not an adjective:
- "Metric cards use a hairline left border in their status color — you scan the border strip to read health"
- "Section transitions use a subtle horizontal rule with a numbered marker, creating a document-like rhythm"
- "The primary action button uses the display font at a larger weight than anything else on screen"
- "Empty states show a single data point placeholder with a dashed outline, not an illustration"
- "Table rows on hover show a contextual action bar that slides in from the right edge"

Write yours. If it sounds like it could apply to any app, it's not specific enough.

### 5f. Token System
Define the complete design token set for this project:

```
COLORS:
  background-base: #___       # Page/app background
  background-surface: #___    # Cards, panels
  background-elevated: #___   # Modals, dropdowns
  border-default: #___        # Standard borders
  border-subtle: #___         # Hairlines, dividers
  text-primary: #___          # Main readable text
  text-secondary: #___        # Supporting text
  text-muted: #___            # Disabled, placeholder
  accent-primary: #___        # Primary action color
  accent-secondary: #___      # Secondary actions
  status-success: #___
  status-warning: #___
  status-error: #___
  status-info: #___

TYPOGRAPHY:
  font-display: ___           # Headings, hero text
  font-body: ___              # Body copy, UI text
  font-mono: ___              # Code, data, metrics
  scale: [12, 14, 16, 20, 24, 32, 48]  # px values

SPACING:
  unit: _px                   # Base unit (4px or 8px)
  scale: [4, 8, 12, 16, 24, 32, 48, 64, 96]

BORDERS:
  radius-sm: _px
  radius-md: _px
  radius-lg: _px
  radius-full: 9999px

SHADOWS:
  strategy: [none / subtle / layered]
  # Define if using shadows
```

Output: `forge-projects/{slug}/specs/design-direction.md`

## Step 6: Assemble and Validate Spec Package

Verify all files exist and are internally consistent:

```
forge-projects/{slug}/
├── manifest.json                  # Project identity + metadata
├── specs/
│   ├── prd.md                    # Product requirements (Step 3)
│   ├── architecture.md           # Stack decision + rationale (Step 4)
│   ├── design-direction.md       # UI direction + tokens (Step 5)
│   └── competitive-scan.md       # Market context (Step 2, optional)
```

### Consistency Checks:
- PRD page inventory matches the architecture's routing approach
- Data model in PRD aligns with database choice in architecture
- Design direction's emotional register matches the target users in PRD
- Token system is complete (no gaps — every UI state has a color)
- Architecture deployment target is realistic for the project's scale

Update manifest.json:
```json
{
  "phase": "specified",
  "specs_complete": true,
  "ready_for": "setup"
}
```

Print summary:
```
PROJECT: {name}
STACK: {stack summary}
AESTHETIC: {direction archetype}
SIGNATURE: {differentiation decision}
PAGES: {count from page inventory}
P0 REQUIREMENTS: {count}

Ready for Phase 2 (Setup) → Phase 3 (Build).
```

## Quality Rules

- The PRD must be actionable by a developer who hasn't read the original conversation. No implicit context.
- Architecture decisions must have rationale. "We're using Next.js" without "because..." is not a decision.
- The design direction statement must be specific enough that two different builders would produce visually similar output.
- Token values must be actual hex/font values, not placeholders. If the user hasn't specified, pick intentional defaults that match the direction.
- The anti-slop checklist is not optional. Run it. If the direction triggers any items, rethink.
- P0 requirements should number 5-10. More than 10 means the scope is too large — suggest phasing.
- Every page in the inventory must have a clear ONE JOB — if a page tries to do three things, split it.
