# Software Engineering Preferences — ASR Software Forge v2

This file is loaded by all Software Forge skills. It encodes architectural preferences, coding standards, quality gates, and deployment targets that every generated application must follow.

## Philosophy

1. **Bespoke over generic.** Every project gets its own design direction, not a template. The anti-slop process exists for a reason.
2. **Stack fits the problem.** Don't default to Next.js for everything. A CLI tool doesn't need React. An API doesn't need a frontend framework.
3. **Build quality in, don't bolt it on.** Type safety, validation, error handling, and accessibility are not features — they're baseline expectations.
4. **Realistic over placeholder.** No lorem ipsum. No "Get Started" buttons that go nowhere. The app should look real from first run.
5. **Ship small, iterate fast.** P0 features first. Build what's needed, not everything that's possible.

## Tech Stack Decision Matrix

Choose the stack based on the actual project requirements. This matrix is a starting point, not a mandate.

### Frontend Frameworks (in order of preference per use case)

| Use Case | Framework | Why |
|----------|-----------|-----|
| Full-stack web app | **Next.js 14+ (App Router)** | SSR/SSG + API routes + ecosystem |
| Content-heavy site with SEO | **Astro** | Best content performance, island architecture |
| Heavy client-side interactivity | **Next.js** or **SvelteKit** | React ecosystem vs Svelte performance |
| Widget/embed | **React + Vite** | Small bundle, easy integration |
| Static marketing site | **Astro** or **Next.js (static export)** | Astro for pure content, Next for dynamic islands |
| Mobile-first PWA | **Next.js + PWA** or **Expo** | Web for reach, native for features |
| Desktop application | **Tauri** | Rust backend, web frontend, small binary |

### Backend Frameworks

| Use Case | Framework | Why |
|----------|-----------|-----|
| Python API service | **FastAPI** | Async, type-safe, auto-docs |
| Full-stack (frontend + API) | **Next.js API Routes** | Same deploy unit |
| High-performance Node API | **Hono** | Lightweight, edge-compatible |
| CLI tool | **Python (Typer)** or **Node (Commander)** | Python for data, Node for JS ecosystem |
| Background workers | **Python + asyncio** | Native async patterns |

### Databases

| Use Case | Database | ORM |
|----------|----------|-----|
| Structured data, relationships | **PostgreSQL** | Prisma (TS) / SQLAlchemy (Py) |
| Simple single-user app | **SQLite** | Prisma / raw SQL |
| Document/flexible schema | **MongoDB** | Mongoose |
| Real-time sync | **Supabase (PostgreSQL)** | Supabase client |
| Key-value / caching | **Redis** | ioredis / redis-py |
| Vector search (AI apps) | **PostgreSQL + pgvector** | Prisma + raw SQL |

### Authentication

| Use Case | Solution |
|----------|----------|
| Next.js with social login | **NextAuth.js / Auth.js** |
| Quick social auth | **Clerk** |
| API-only auth | **Custom JWT** |
| Enterprise/SSO | **Auth0** or **Clerk** |
| Supabase project | **Supabase Auth** |

### CSS / Styling

| Framework | Rules |
|-----------|-------|
| **Tailwind CSS** | Always. No CSS-in-JS, no vanilla CSS files, no CSS modules. |
| **shadcn/ui** | Preferred component library. ALWAYS customize — never ship shadcn defaults. |
| **Framer Motion** | For purposeful animation only. Not decoration. |

### TypeScript Configuration

Always strict mode:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInImports": true
  }
}
```

Path aliases: `@/components`, `@/lib`, `@/hooks`, `@/types`

## Deployment Targets

### Platform Decision Matrix

| Signal | Target | Config |
|--------|--------|--------|
| Next.js app, simple deployment | **Vercel** | vercel.json, env vars in dashboard |
| Container needed, GCP preferred | **Google Cloud Run** | Dockerfile + cloudbuild.yaml |
| Container needed, AWS preferred | **AWS ECS Fargate** or **AWS App Runner** | Dockerfile + task definition |
| Container needed, Azure preferred | **Azure Container Apps** | Dockerfile + bicep/ARM template |
| Quick deploy, hobby/side project | **Railway** or **Fly.io** | railway.toml or fly.toml |
| Static site | **Cloudflare Pages** or **Vercel** | Build command + output directory |
| Serverless functions | **AWS Lambda** or **GCP Cloud Functions** | Serverless framework or native config |
| Self-hosted / VPS | **Docker Compose** | docker-compose.yml with all services |

### Dockerfile Standard (all containerized deployments)

Every Dockerfile must:
1. Use multi-stage builds (deps → build → runtime)
2. Run as non-root user
3. Set `NODE_ENV=production` (for Node apps)
4. Expose the correct port
5. Include a HEALTHCHECK instruction
6. Target image size < 500MB for web apps

### CI/CD Templates

Generate based on the git host:

| Host | CI Config | Key Steps |
|------|-----------|-----------|
| **GitHub** | `.github/workflows/ci.yml` | Lint, Type-check, Build, Test, Deploy |
| **Azure DevOps** | `azure-pipelines.yml` | Same steps, ADO syntax |
| **GitLab** | `.gitlab-ci.yml` | Same steps, GitLab syntax |
| **Cloud Build (GCP)** | `cloudbuild.yaml` | Docker build, push, deploy |

## Coding Standards

### Universal Rules
- **No magic values.** Constants at the top of the file or in a config module.
- **Explicit error handling.** try/catch with structured error responses. Never swallow errors.
- **Secrets via environment variables.** `.env.local` for dev, Secret Manager / platform secrets for prod.
- **Every function has a clear contract.** Types or docstrings — never `any`.
- **No dead code.** If it's commented out, delete it. That's what git history is for.

### TypeScript Rules
- `strict: true` in tsconfig — no negotiation
- Path aliases (`@/components`, `@/lib`)
- Named exports for components (no default exports)
- Zod for runtime validation at API boundaries
- No barrel exports unless they genuinely improve imports

### Python Rules
- Type hints on all function signatures
- Docstrings on public functions
- f-strings over `.format()`
- `ruff` for linting
- `asyncio` patterns for I/O-heavy code
- Pydantic for data validation

### File Organization (Next.js)
```
src/
├── app/              # App Router pages and layouts
│   ├── (auth)/       # Route groups for auth-required pages
│   ├── api/          # API routes
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/
│   ├── ui/           # Reusable primitives (shadcn-based, customized)
│   └── features/     # Feature-specific component compositions
├── lib/              # Utilities, clients, configs
│   ├── db.ts         # Database client
│   ├── auth.ts       # Auth configuration
│   └── utils.ts      # Shared utilities
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
└── styles/           # Global styles, Tailwind config
```

### File Organization (FastAPI)
```
app/
├── main.py           # FastAPI app + router mounting
├── config.py         # Settings (pydantic-settings)
├── models/           # SQLAlchemy models
├── schemas/          # Pydantic request/response schemas
├── routes/           # API route handlers
├── services/         # Business logic
├── middleware/        # Auth, CORS, error handling
└── utils/            # Shared utilities
```

## Quality Gates

Before declaring ANY forge project "done":

### Mandatory (blocking)
1. `npm run build` passes with zero errors
2. `npx tsc --noEmit` passes (TypeScript strict)
3. `npm run lint` passes
4. No hardcoded secrets in code
5. `.env.example` documents every environment variable
6. `README.md` with: purpose, 3-step setup, architecture, environment vars, deployment
7. `CLAUDE.md` with: project overview, tech stack, coding standards, directory structure
8. Dockerfile with multi-stage build, non-root user (if containerized)
9. Health check endpoint exists (/health or /api/health)
10. Mobile-responsive layout

### Design Quality (blocking for forge projects)
11. Design direction statement committed before building
12. Anti-slop checklist passed (0 violations)
13. Differentiation decision visibly implemented
14. All colors from token system (no rogue hex values)
15. Specified fonts loaded and rendering

### Recommended (non-blocking, should fix)
16. Core web vitals targets: LCP < 2.5s, CLS < 0.1
17. Error boundaries on all page components
18. Loading states for all async operations
19. Empty states for all data-dependent views
20. Accessibility: WCAG AA color contrast, keyboard navigation, focus states

## Brand Integration

When building UIs, design direction comes from the forge spec:

1. **If `design-direction.md` exists:** Extract tokens, apply to Tailwind config and CSS variables
2. **If brand guidelines are provided separately:** Extract tokens from them
3. **If neither exists:** Apply a clean, intentional default based on the project type (see scaffold-app Quick Direction Defaults)

**NEVER** use default shadcn/ui theme without customization.
**NEVER** use Inter as the only font unless the design direction specifically calls for it.
**ALWAYS** use JetBrains Mono for code/data display.

## Contribution Standards (Existing Repos)

When contributing to repos managed by others (Zealogics team projects, open-source, etc.), the forge ADAPTS to the existing codebase. The standards above are fallbacks, not mandates.

### The Adaptation Principle
- **Greenfield:** Forge sets conventions → repo follows them
- **Contribution:** Repo has conventions → forge follows them

### What to Detect and Match
| Convention | How to Detect | What to Match |
|-----------|---------------|---------------|
| Code style | `.eslintrc`, `.prettierrc`, `.editorconfig`, codebase observation | Semicolons, tabs vs spaces, quote style, trailing commas |
| Commit messages | `git log --oneline -15` | Conventional commits, ticket prefixes, free-form |
| Branching | `git branch -r`, CONTRIBUTING.md | `feature/`, `fix/`, `{ticket-id}/`, `{username}/` |
| Testing | `jest.config`, `vitest.config`, `conftest.py` | Same framework, same file location, same naming |
| File organization | Directory tree observation | Same folder structure, same naming patterns |
| Error handling | Existing route handlers, middleware | Same error response format, same logging approach |
| Imports | Existing files | Relative vs alias, barrel exports vs direct |

### Contribution Rules
1. **Stay in scope.** Don't fix unrelated code. One task = one PR.
2. **No surprise dependencies.** Adding a library is a team decision.
3. **Existing tests must pass.** If they were passing before your branch, they pass after.
4. **Match commit style.** If the repo uses conventional commits, you use conventional commits.
5. **Clean PRs.** No debug code, no commented experiments, no formatting-only changes mixed with feature work.
6. **PR descriptions are complete.** The reviewer should understand the change without asking.
7. **Never force-push shared branches.** Only force-push your own feature branches during rebase.

### Repo Host Tooling
| Host | Clone | PR Creation | CI Status |
|------|-------|-------------|-----------|
| GitHub | `git clone https://github.com/...` | `gh pr create` | `gh run list` |
| Azure DevOps | `git clone https://dev.azure.com/...` | `az repos pr create` | ADO pipeline dashboard |
| GitLab | `git clone https://gitlab.com/...` | `glab mr create` | `glab ci status` |
| Bitbucket | `git clone https://bitbucket.org/...` | Bitbucket web UI | BB pipelines dashboard |

## Project Registry

All forge projects are tracked via file-based manifests. Two project types:

### Greenfield Projects (project_type: "greenfield")
```
ai-os-project/forge-projects/
├── {slug-1}/
│   ├── manifest.json
│   └── specs/
│       ├── prd.md
│       ├── architecture.md
│       ├── design-direction.md
│       └── competitive-scan.md (optional)
```

### Contribution Projects (project_type: "contribution")
```
ai-os-project/forge-projects/
├── {slug-2}/
│   ├── manifest.json
│   ├── codebase-brief.md
│   └── prs/
│       ├── feature-metrics/
│       │   ├── change-plan.md
│       │   └── test-checklist.md
│       └── fix-auth-timeout/
│           └── change-plan.md
```

The actual code lives OUTSIDE this repository:
```
C:\Users\ASR\OneDrive\Desktop\Zealogics Work\Projects\implementations\{slug}\
```

Greenfield projects have their own git repos. Contribution projects are clones of existing team repos.
