---
name: refine-repo
description: Analyze, refine, and upgrade an existing codebase per user instructions. Use when the user asks to "improve", "refine", "upgrade", "refactor", "fix", "modernize", or "update" an existing project or repository. Works on any codebase in the working directory.
---

# Refine Repo

Analyze an existing codebase, identify improvements, and execute upgrades. This is the iterative workflow — the user points at a repo, describes what they want changed, and comes back to an improved codebase.

## Before Starting

1. Read `${CLAUDE_PLUGIN_ROOT}/context/engineering-preferences.md` for coding standards
2. Scan the working directory to understand the existing project:
   - Read `README.md`, `package.json` / `pyproject.toml`, `tsconfig.json`
   - Identify the tech stack, framework, and conventions in use
   - Read `CLAUDE.md` or `.claude/` if present (project-specific instructions)
   - Check git history for recent changes (`git log --oneline -20`)

## Step 1: Codebase Analysis

Run a comprehensive scan:

### Structure Analysis
```bash
# File tree (2 levels)
find . -maxdepth 3 -type f | head -100

# Package dependencies
cat package.json | jq '.dependencies, .devDependencies'
# or
cat requirements.txt

# Outdated dependencies
npm outdated 2>/dev/null || pip list --outdated 2>/dev/null
```

### Quality Analysis
```bash
# TypeScript errors
npx tsc --noEmit 2>&1 | tail -20

# Lint issues
npm run lint 2>&1 | tail -20

# Build status
npm run build 2>&1 | tail -20
```

### Pattern Analysis
- Component structure (flat vs nested, naming conventions)
- State management approach
- Error handling patterns
- API layer organization
- Test coverage
- CSS/styling approach

Produce an internal analysis document (don't show to user unless asked).

## Step 2: Understand the Refinement Request

The user's instructions fall into these categories:

| Category | Examples | Approach |
|----------|---------|----------|
| **Feature addition** | "Add dark mode", "Add auth" | Build incrementally, match existing patterns |
| **Modernization** | "Upgrade to Next.js 14", "Switch to App Router" | Migrate systematically, preserve behavior |
| **Refactor** | "Clean up the components", "Extract shared logic" | Improve structure without changing behavior |
| **Bug fix** | "The dashboard crashes on mobile" | Diagnose → fix → verify |
| **Brand refresh** | "Apply these new brand guidelines" | Extract tokens → update Tailwind config → cascade |
| **Performance** | "Make it faster", "Optimize bundle" | Measure → identify bottlenecks → fix → measure again |
| **Documentation** | "Write proper docs" | Generate README, API docs, inline comments |

## Step 3: Plan the Changes

Create a change plan with:
1. **Files to modify** — list every file that will be touched
2. **Files to create** — any new files needed
3. **Files to delete** — anything being removed (requires confirmation)
4. **Dependencies to add/remove/update**
5. **Migration steps** — if database or breaking changes are involved
6. **Risk assessment** — what could break

For large refactors, use sub-agents:
- **Agent: Analyzer** — deep-read the codebase and map dependencies
- **Agent: Implementer** — make the actual changes
- **Agent: Validator** — run builds, lints, and tests after changes

## Step 4: Execute Changes

Apply changes methodically:

1. **Create a branch** (if git is initialized):
   ```bash
   git checkout -b refine/[description]
   ```

2. **Make changes in dependency order:**
   - Config files first (tsconfig, tailwind, etc.)
   - Type definitions and schemas
   - Utility/lib files
   - Components (bottom-up: primitives → compositions → pages)
   - API routes
   - Tests

3. **After each major change group, verify:**
   ```bash
   npm run build && npm run lint
   ```

4. **If something breaks, fix it before moving on.** Never leave the project in a broken state.

## Step 5: Apply Brand Guidelines (if applicable)

When the user provides updated brand guidelines:

1. Extract design tokens:
   ```typescript
   // tailwind.config.ts
   theme: {
     extend: {
       colors: {
         brand: { /* extracted colors */ },
         accent: { /* extracted accents */ }
       },
       fontFamily: {
         display: ['/* extracted display font */'],
         mono: ['JetBrains Mono', 'monospace']
       }
     }
   }
   ```

2. Update CSS variables in globals.css
3. Cascade changes through all components
4. Verify visual consistency across all pages

## Step 6: Validate and Deliver

### Pre-delivery checks:
```bash
# Must all pass
npm run build
npm run lint
npx tsc --noEmit

# If tests exist
npm test 2>/dev/null
```

### Generate change report:
```
refine-report.md
├── Summary of changes
├── Files modified (with diff summary)
├── Files created
├── Files deleted
├── Dependencies changed
├── Breaking changes (if any)
├── Before/after comparison (for visual changes)
└── Next steps / remaining TODOs
```

### Commit the changes:
```bash
git add -A
git commit -m "refine: [description of changes]"
```

## Quality Rules

- NEVER leave the project in a broken build state
- Match the existing code style — don't impose new conventions unless asked
- If the existing project uses semicolons, use semicolons. If it uses tabs, use tabs.
- Preserve all existing functionality unless explicitly asked to remove something
- Test every page/route after changes if the project has a dev server
- Don't upgrade major framework versions without explicit request (Next 13→14 is a migration, not a refinement)
- Always create a refine-report.md documenting what changed
- If changes are destructive (file deletion, data migration), get confirmation first
