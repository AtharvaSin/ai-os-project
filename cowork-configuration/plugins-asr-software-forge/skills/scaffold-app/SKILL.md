---
name: scaffold-app
description: Build a complete application from forge specs — PRD, architecture decision, and design direction. Produces a fully deployable codebase with branded UI, working backend, and infrastructure files. This is Phase 3 of the Software Forge workflow. Use when specs are ready and the project directory is initialized. Also works standalone if the user provides enough context.
---

# Scaffold App (Phase 3)

Build the actual application. This skill reads all Phase 1 specs and produces a working, buildable codebase that matches the committed design direction.

## Before Starting

1. Read `${CLAUDE_PLUGIN_ROOT}/context/engineering-preferences.md` for coding standards
2. **Check for forge specs** — Look for `forge-projects/{slug}/specs/` in the ai-os-project:
   - If specs exist: load `prd.md`, `architecture.md`, `design-direction.md`
   - If specs DON'T exist: check the working directory for user-provided inputs (*.md, *.pdf, *.png, *.json)
   - If neither: generate an internal mini-spec from the user's description (but warn that running specify-project first produces better results)
3. Read `forge-projects/{slug}/manifest.json` for the project's code_path
4. Navigate to the project directory (from Phase 2, or current working directory)

## Step 1: Load and Validate Inputs

### From Forge Specs (preferred path):
| Spec File | What to Extract |
|-----------|----------------|
| **prd.md** | P0/P1 requirements, data model, API spec, page inventory, user personas |
| **architecture.md** | Stack choice, key dependencies, deployment target, database choice |
| **design-direction.md** | Aesthetic archetype, token system, differentiation decision, anti-slop commitments |
| **competitive-scan.md** | Differentiators to emphasize in the UI/UX |

### From User-Provided Files (standalone path):
| Input | What to Extract |
|-------|----------------|
| Product summary / PRD | Core purpose, features, requirements |
| Brand guidelines | Colors, fonts, spacing, component patterns |
| Mockups / wireframes (*.png, *.jpg) | Page structure, component hierarchy |
| API specs (*.json) | Endpoints, data models, auth requirements |

### From Description Only (minimal path):
If only a verbal description is available:
1. Infer the stack using the architecture decision matrix from engineering-preferences.md
2. Generate an internal mini-PRD: problem statement, 5-8 P0 features, basic data model, page list
3. Apply a default design direction based on the project type (see Quick Direction Defaults below)
4. Proceed, but log a warning in build-report.md that specs were inferred

### Quick Direction Defaults (when no design-direction.md exists):
| Project Type | Default Direction |
|-------------|-------------------|
| SaaS dashboard | Operational Command + neutral dark palette |
| Marketing/landing | Editorial Authority + light palette with one accent |
| E-commerce | Marketplace Grid + warm neutral palette |
| Developer tool | Architectural Precision + dark palette + mono font |
| Content/blog | Editorial Authority + generous whitespace |
| Portfolio | Quiet Competence + minimal palette |

## Step 2: Install Dependencies

Based on the architecture decision, install only what's needed:

### For Next.js Projects
```bash
# Core UI
npx shadcn@latest init -d
npm install lucide-react

# Forms & Validation
npm install zod @hookform/resolvers react-hook-form

# State (if needed)
npm install zustand

# Animation (if design direction calls for purposeful motion)
npm install framer-motion

# Database (if applicable)
npm install prisma @prisma/client
npx prisma init
```

### For FastAPI Projects
```bash
pip install fastapi uvicorn sqlalchemy[asyncio] alembic pydantic
pip install python-dotenv httpx  # common utilities
```

Only install what the architecture spec calls for. Don't add libraries "just in case."

## Step 3: Apply Design System

**This step runs BEFORE building any pages.** The design system must be in place so every component is born on-brand.

### 3a. Tailwind Configuration
Inject the token system from design-direction.md into `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Map directly from design-direction.md token system
        background: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          subtle: 'var(--border-subtle)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
        },
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          error: 'var(--status-error)',
          info: 'var(--status-info)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
};
export default config;
```

### 3b. CSS Variables
In `globals.css`, define the actual values:
```css
@import url('https://fonts.googleapis.com/css2?family={fonts from design-direction}');

:root {
  --bg-base: {from tokens};
  --bg-surface: {from tokens};
  --bg-elevated: {from tokens};
  --border-default: {from tokens};
  --border-subtle: {from tokens};
  --text-primary: {from tokens};
  --text-secondary: {from tokens};
  --text-muted: {from tokens};
  --accent-primary: {from tokens};
  --accent-secondary: {from tokens};
  --status-success: {from tokens};
  --status-warning: {from tokens};
  --status-error: {from tokens};
  --status-info: {from tokens};
  --font-display: '{display font}', sans-serif;
  --font-body: '{body font}', sans-serif;
  --font-mono: '{mono font}', monospace;
  --radius-sm: {from tokens};
  --radius-md: {from tokens};
  --radius-lg: {from tokens};
}
```

### 3c. shadcn Theme Customization
If using shadcn/ui, customize the theme to match the design direction. Don't use shadcn defaults — that's the #1 source of AI slop.

## Step 4: Build the Application

Use a structured, layered approach. Build bottom-up:

### Layer 1 — Data (Backend Builder Agent)
- Database schema (Prisma schema or SQLAlchemy models from PRD data model)
- Migration files
- Seed data (realistic data matching the PRD's domain, NOT lorem ipsum)
- Type definitions derived from schema

### Layer 2 — API (Backend Builder Agent)
- API routes matching the PRD's API specification
- Input validation (Zod schemas at every boundary)
- Error handling middleware with structured responses
- Authentication/authorization (if PRD requires it)
- Pagination on all list endpoints

### Layer 3 — Shared Components (Frontend Builder Agent)
Build the reusable component library FIRST:
- Typography components (heading hierarchy matching design direction)
- Button variants (primary, secondary, ghost — using accent tokens)
- Input/form components
- Card/container components (matching the design archetype)
- Navigation components
- Status indicators (using status token colors)
- Empty/loading/error state components

**Critical:** Every component must use the CSS variable tokens, not hardcoded values.

### Layer 4 — Pages (Frontend Builder Agent)
Build each page from the PRD's page inventory:
- Layout structure matching the aesthetic archetype
- Data fetching (Server Components by default, Client where interactivity requires)
- Loading states (loading.tsx for each route group)
- Error handling (error.tsx for each route group)
- Mobile responsiveness (test mentally at 375px and 1280px)

**The differentiation decision from design-direction.md must be visible in the output.**
If the spec says "metric cards use a hairline left border in their status color," that mechanism must exist in the components.

### Layer 5 — Infrastructure
- Dockerfile (multi-stage build, non-root user)
- docker-compose.yml (for local development with database)
- .env.example (every variable documented)
- Health check endpoint (/health or /api/health)

## Step 5: Populate with Realistic Content

NO LOREM IPSUM. NO PLACEHOLDER TEXT. The application should look real:

- If it's a dashboard: use plausible metric values matching the domain
- If it's e-commerce: use realistic product names, descriptions, prices
- If it's a blog: use real article titles and realistic preview text
- If it's a SaaS: use demo account data that tells a story

For images, use placeholder services that return relevant images (Unsplash API) or solid-color placeholders that match the design tokens. Never leave broken image icons.

## Step 6: Build Verification

Before delivering, run ALL quality gates:

```bash
# Build
npm run build  # MUST pass with zero errors

# Lint
npm run lint   # MUST pass

# Types
npx tsc --noEmit  # MUST pass in strict mode

# If tests exist
npm test 2>/dev/null
```

**Fix any issues found. Do not deliver code that doesn't build.**

If the build fails:
1. Read the error output carefully
2. Fix each error
3. Re-run the build
4. Repeat until clean

## Step 7: Generate Build Report

Create `build-report.md` in the project root:

```markdown
# Build Report — {Project Name}
Generated: {date}
Forge Spec: forge-projects/{slug}/

## Stack
{Full stack listing with versions}

## Architecture Decisions
{Key decisions and rationale, referencing architecture.md}

## Design Implementation
- Aesthetic archetype: {from design-direction.md}
- Differentiation decision: {what was committed → what was implemented}
- Token system: {applied to Tailwind config and CSS variables}
- Anti-slop compliance: {self-assessment against the checklist}

## Pages Built
| Route | Purpose | Status |
|-------|---------|--------|
{From page inventory}

## API Endpoints
| Method | Route | Auth | Status |
|--------|-------|------|--------|
{From API spec}

## Database
- Schema: {summary}
- Tables: {count}
- Seed data: {present/absent}

## Requirements Coverage
- P0: {covered}/{total}
- P1: {covered}/{total}

## Known Limitations
{Honest list of what's incomplete or simplified}

## Next Steps
{What to build in the next iteration}
```

## Step 8: Deliver

Update the forge manifest:
```json
{
  "phase": "built",
  "build_status": "passing",
  "pages_built": {count},
  "api_endpoints": {count},
  "ready_for": "review"
}
```

Print summary:
```
BUILD COMPLETE: {Project Name}

Stack: {summary}
Pages: {count} built
API Endpoints: {count} implemented
Build: PASSING
Design: {archetype} applied with {differentiation}

Recommend: Run review-project for quality gate before shipping.
```

## Quality Rules

- The app MUST build before delivery. No exceptions.
- No `any` types in TypeScript. Ever.
- No placeholder/lorem ipsum content — use realistic domain-appropriate data.
- Every page must be mobile-responsive.
- Error boundaries and loading states on all route groups.
- .env.example must document every environment variable.
- README must include: purpose, 3-step setup, architecture summary, deployment stub.
- The design direction's differentiation decision must be visibly implemented — if it's not, the build failed its primary design goal.
- If auth is in the PRD, it must work end-to-end (not stubbed with TODO comments).
- Seed data must be realistic enough that the app looks like a real product on first run.
