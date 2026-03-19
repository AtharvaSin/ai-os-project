---
name: contribute-repo
description: Clone an existing repository, understand its codebase, create a working branch, implement changes, test, and prepare a pull request. Use when working on repos managed by others — team projects at Zealogics, open-source contributions, or any codebase you don't own. Trigger phrases include "clone this repo", "work on this project", "contribute to", "pick up this ticket", "create a PR for", "fix this in the team repo", or any request involving an existing external repository. Unlike scaffold-app (greenfield builds), this skill ADAPTS to the repo's existing conventions.
---

# Contribute to Repository

Work on a codebase you don't own. Clone it, understand it, branch, implement, test, and prepare a pull request — all while respecting the repo's existing conventions, not imposing forge defaults.

**Key principle:** When building from scratch, the forge sets conventions. When contributing, the forge ADAPTS to what's already there.

## Before Starting

1. Read `${CLAUDE_PLUGIN_ROOT}/context/engineering-preferences.md` — but treat it as a FALLBACK, not a mandate. The repo's own conventions take priority.
2. Determine what the user wants:
   - **A repo URL or name** to clone
   - **The task** — feature, bug fix, refactor, improvement, ticket number
   - **The target** — which branch to base off, where to submit the PR

## Phase A: Onboard — Understand the Repo

### A1. Clone the Repository

Determine the source:
```bash
# GitHub
git clone https://github.com/{org}/{repo}.git {slug}

# Azure DevOps
git clone https://dev.azure.com/{org}/{project}/_git/{repo} {slug}

# GitLab
git clone https://gitlab.com/{org}/{repo}.git {slug}

# Bitbucket
git clone https://bitbucket.org/{org}/{repo}.git {slug}

# If the user provides a full URL, use it directly
git clone {url} {slug}
```

Clone into the implementations directory:
```
C:\Users\ASR\OneDrive\Desktop\Zealogics Work\Projects\implementations\{slug}\
```

If the repo already exists locally, skip cloning:
```bash
cd {existing_path}
git fetch origin
git status
```

### A2. Discover the Codebase

Run a structured analysis to understand what you're working with. DO NOT SKIP THIS.

**Identity check:**
```bash
# What is this project?
cat README.md 2>/dev/null | head -50
cat CLAUDE.md 2>/dev/null  # AI-assisted dev context (if present)
cat CONTRIBUTING.md 2>/dev/null  # Contribution guidelines
cat .editorconfig 2>/dev/null  # Code style rules
```

**Stack detection:**
```bash
# Node.js / TypeScript
cat package.json 2>/dev/null | head -30
cat tsconfig.json 2>/dev/null | head -20

# Python
cat pyproject.toml 2>/dev/null | head -30
cat setup.py 2>/dev/null | head -20
cat requirements.txt 2>/dev/null | head -20

# .NET
cat *.csproj 2>/dev/null | head -20
cat *.sln 2>/dev/null | head -10

# Java/Kotlin
cat build.gradle 2>/dev/null | head -20
cat pom.xml 2>/dev/null | head -20

# Go
cat go.mod 2>/dev/null | head -10

# Rust
cat Cargo.toml 2>/dev/null | head -20
```

**Convention detection:**
```bash
# Linting config
ls .eslintrc* .prettierrc* .pylintrc ruff.toml pyproject.toml .rubocop.yml 2>/dev/null

# CI/CD
ls .github/workflows/*.yml .gitlab-ci.yml azure-pipelines.yml Jenkinsfile cloudbuild.yaml 2>/dev/null

# Testing
ls jest.config* vitest.config* pytest.ini conftest.py *.test.* *.spec.* 2>/dev/null

# Docker
ls Dockerfile docker-compose* 2>/dev/null
```

**Branching strategy:**
```bash
# What branches exist?
git branch -r | head -20

# Recent commit pattern (to understand commit message conventions)
git log --oneline -15

# Current branch
git branch --show-current

# Is there a develop/staging branch?
git branch -r | grep -E "develop|staging|release"
```

**Project structure:**
```bash
# Directory overview
find . -maxdepth 3 -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './.next/*' -not -path './dist/*' -not -path './__pycache__/*' -not -path './.venv/*' | head -80
```

### A3. Build the Codebase Brief

Produce an internal brief (saved to forge-projects/{slug}/):

```markdown
# Codebase Brief — {repo name}

## Identity
- **Repo:** {url}
- **Purpose:** {from README}
- **Language(s):** {detected}
- **Framework:** {detected}

## Conventions (ADAPT TO THESE)
- **Code style:** {from linter config or observation}
- **Commit messages:** {pattern from git log — conventional commits? free-form? ticket prefixes?}
- **Branching:** {main/develop? feature branches? naming pattern?}
- **Testing:** {framework, location, naming pattern}
- **PR process:** {from CONTRIBUTING.md or inferred}

## Structure
{directory tree with annotations}

## Dependencies (key ones)
{from package.json/requirements.txt — the important ones, not all 200}

## Build & Run
- Install: {command}
- Dev: {command}
- Build: {command}
- Test: {command}
- Lint: {command}
```

Save to: `forge-projects/{slug}/codebase-brief.md`

Also register in manifest.json with `project_type: "contribution"`.

## Phase B: Branch & Plan

### B1. Create a Working Branch

Follow the repo's branching convention (detected in A2):

```bash
# Ensure we're on the right base branch
git checkout {main|develop|master}
git pull origin {main|develop|master}

# Create feature branch following the repo's naming pattern
# Common patterns:
git checkout -b feature/{description}     # feature/add-user-dashboard
git checkout -b fix/{description}          # fix/mobile-nav-crash
git checkout -b {ticket-id}/{description}  # ZEAL-1234/add-metrics-api
git checkout -b {username}/{description}   # atharva/refactor-auth
```

If the repo uses a ticket system (Jira, ADO, etc.) and the user provides a ticket ID, include it in the branch name.

### B2. Understand the Task

Get clarity on what needs to happen:

**From user description:**
- What feature/fix/improvement is needed?
- Which parts of the codebase are affected?
- Are there acceptance criteria?

**From ticket (if provided):**
- Read the ticket description (user can paste it or provide a link)
- Extract: requirements, acceptance criteria, design specs, linked resources

**From codebase analysis:**
- Which files will likely need changes?
- What existing patterns should the implementation follow?
- Are there related features/components to reference?

### B3. Create a Change Plan

```markdown
# Change Plan — {branch name}

## Task
{What needs to happen}

## Affected Files
| File | Change Type | Description |
|------|------------|-------------|
| src/components/Dashboard.tsx | MODIFY | Add metrics section |
| src/lib/api/metrics.ts | CREATE | New API client for metrics |
| src/types/metrics.ts | CREATE | Type definitions |
| tests/metrics.test.ts | CREATE | Unit tests |

## Approach
{How you'll implement this — key decisions, trade-offs}

## Risks
{What could go wrong, what to watch out for}

## Testing Strategy
{How to verify the changes work — unit tests, manual testing, edge cases}
```

Save to: `forge-projects/{slug}/plans/{branch-name}.md`

Present the plan to the user for approval before implementing. They may have context about team preferences or constraints.

## Phase C: Implement

### C1. Match Existing Patterns

**This is critical.** Before writing any new code, study how the existing codebase does similar things:

- If adding a new component: look at how existing components are structured
  - Same folder structure? Same naming? Same prop patterns?
- If adding an API route: look at existing routes
  - Same error handling? Same response format? Same middleware chain?
- If adding tests: look at existing test files
  - Same assertion library? Same setup/teardown? Same mocking approach?
- If modifying styles: look at existing CSS/Tailwind patterns
  - Are they using utility classes? CSS modules? Styled components?

**DO NOT:**
- Introduce new libraries without discussing with the user (the team may have opinions)
- Change the code style (even if you prefer something different)
- Refactor unrelated code (stay in scope)
- Add patterns from forge engineering-preferences if they conflict with the repo's conventions
- Switch testing frameworks or add new tooling

**DO:**
- Follow the existing import style (relative vs alias paths)
- Follow the existing naming conventions (camelCase vs kebab-case, etc.)
- Follow the existing file organization
- Use the existing shared utilities, hooks, and helpers
- Match the existing error handling patterns

### C2. Implement Changes

Work through the change plan in dependency order:

1. **Type definitions / interfaces** first
2. **Utility functions / services** (no UI dependency)
3. **API routes / endpoints** (if applicable)
4. **Components / UI** (bottom-up: shared → feature-specific → pages)
5. **Tests** (alongside or after implementation)
6. **Documentation** (update existing docs if your changes affect them)

After each significant change:
```bash
# Verify nothing is broken
{build_command}  # npm run build, python -m pytest, dotnet build, etc.
{lint_command}   # npm run lint, ruff check, etc.
```

### C3. Write Tests

Match the repo's testing approach:

**If the repo has tests:**
- Use the same framework and patterns
- Put test files in the same location pattern as existing tests
- Follow the same describe/it/test naming convention
- Use the same mocking approach

**If the repo has NO tests:**
- Don't introduce a testing framework (that's a separate conversation with the team)
- Document in the PR what should be tested manually
- Offer to add tests as a follow-up if the team wants them

### C4. Commit Progressively

Don't save all commits for the end. Commit as you go, following the repo's commit message convention:

```bash
# If repo uses conventional commits:
git commit -m "feat(dashboard): add metrics section with real-time updates"
git commit -m "test(dashboard): add unit tests for MetricsPanel component"

# If repo uses ticket prefixes:
git commit -m "ZEAL-1234: Add metrics section to dashboard"
git commit -m "ZEAL-1234: Add unit tests for metrics"

# If repo uses free-form:
git commit -m "Add metrics section to dashboard"
git commit -m "Add unit tests for metrics panel"
```

Keep commits atomic — each commit should be a logical unit that builds successfully.

## Phase D: Test & Verify

### D1. Run the Existing Test Suite

```bash
# Whatever the repo uses
npm test                    # Node.js (Jest/Vitest)
python -m pytest            # Python
dotnet test                 # .NET
go test ./...               # Go
cargo test                  # Rust
./gradlew test              # Java/Kotlin
```

**ALL existing tests must pass.** If a pre-existing test fails, investigate:
- Did your changes break it? → Fix your code
- Was it already broken? → Note it in the PR description, don't fix unrelated things

### D2. Run Linting

```bash
# Use whatever the repo configured
npm run lint                # ESLint
npx tsc --noEmit            # TypeScript check
ruff check .                # Python (ruff)
pylint src/                 # Python (pylint)
dotnet format --verify-no-changes  # .NET
```

Fix any lint errors your changes introduced. Don't fix pre-existing lint errors (that's noise in the PR).

### D3. Build Verification

```bash
npm run build               # Next.js / React
python -m py_compile app/   # Python syntax check
dotnet build                # .NET
go build ./...              # Go
cargo build                 # Rust
```

Must pass cleanly.

### D4. Manual Testing Checklist

Generate a checklist specific to the changes:

```markdown
## Manual Testing

### Happy Path
- [ ] {Main flow works as expected}
- [ ] {Key interaction produces correct result}

### Edge Cases
- [ ] {Empty state handled}
- [ ] {Error state handled}
- [ ] {Loading state visible}

### Regression
- [ ] {Related feature X still works}
- [ ] {Existing page Y not affected}

### Device / Browser (if UI changes)
- [ ] Desktop Chrome
- [ ] Mobile viewport (375px)
- [ ] {Other relevant targets}
```

Present this to the user — they should run through it before the PR is submitted.

## Phase E: Pull Request

### E1. Push the Branch

```bash
git push -u origin {branch-name}
```

### E2. Create the Pull Request

Use `gh` CLI if available, otherwise provide the URL:

```bash
# GitHub
gh pr create --title "{title}" --body "$(cat <<'EOF'
## Summary
{1-3 bullet points explaining WHAT changed and WHY}

## Changes
{Grouped by area}

### {Area 1}
- {Change description}
- {Change description}

### {Area 2}
- {Change description}

## Testing
- [ ] All existing tests pass
- [ ] New tests added for {scope}
- [ ] Manual testing completed (see checklist below)

### Manual Testing Checklist
{From Phase D4}

## Screenshots / Demo
{If UI changes — paste screenshots or describe visual changes}

## Related
- Ticket: {ZEAL-1234 or link}
- Depends on: {other PR if applicable}
- Related docs: {if applicable}

## Notes for Reviewers
{Anything the reviewer should know — design decisions, trade-offs, areas of uncertainty}
EOF
)"

# Azure DevOps
az repos pr create --title "{title}" --description "{body}" --source-branch {branch} --target-branch {main|develop}
```

### E3. PR Quality Standards

The PR must meet these criteria before submission:

**Title:** Clear, concise, follows repo convention
- `feat(dashboard): add real-time metrics panel`
- `ZEAL-1234: Add metrics dashboard section`
- `Add metrics panel to main dashboard`

**Body:** Complete enough that a reviewer can understand without asking questions
- What changed (not a diff recap — the WHY)
- How to test
- Screenshots for visual changes
- Related tickets/issues

**Code:**
- All tests pass (existing + new)
- Lint clean (no new violations)
- Build passes
- Commits are atomic and well-messaged
- No unrelated changes (stay in scope)
- No debug code (console.log, print statements, commented-out code)

### E4. Post-PR Actions

After creating the PR:

1. **Update the forge manifest:**
```json
{
  "phase": "pr-submitted",
  "pr_url": "{url}",
  "pr_branch": "{branch}",
  "pr_target": "{main|develop}"
}
```

2. **Save the change plan and testing checklist** to forge-projects/{slug}/prs/{branch-name}/

3. **Inform the user:**
```
PR created: {url}
Branch: {branch} → {target}
Tests: PASSING
Lint: CLEAN

Next:
- Share with the team for review
- Address review feedback when it comes in
- I can help with review comments — just paste them or link the PR
```

## Handling Review Feedback

When the user comes back with PR review comments:

1. Read the review feedback
2. Create a plan for addressing each comment
3. Make changes on the same branch
4. Push updates
5. Respond to each review comment explaining what was changed

```bash
# After addressing feedback
git add -A
git commit -m "address review: {summary of changes}"
git push
```

## Working on Multiple Contributions

The forge supports multiple active contributions. Each gets:
- Its own directory in `forge-projects/{slug}/`
- Its own codebase-brief, change plans, and PR records
- Independent branch tracking

To see all active contributions:
```
forge-projects/
├── zealogics-dashboard/        # project_type: "contribution"
│   ├── manifest.json
│   ├── codebase-brief.md
│   └── prs/
│       └── feature-metrics/
├── zealogics-api/              # project_type: "contribution"
│   ├── manifest.json
│   ├── codebase-brief.md
│   └── prs/
│       └── fix-auth-timeout/
└── my-saas-app/                # project_type: "greenfield"
    ├── manifest.json
    └── specs/
```

## Quality Rules

- **ADAPT to the repo's conventions.** The forge's engineering-preferences are for greenfield projects. When contributing, the existing codebase is the style guide.
- **Stay in scope.** Don't refactor things that aren't related to your task. That's a separate PR.
- **All existing tests must pass.** Your changes must not break existing functionality.
- **No surprise dependencies.** Don't add new libraries without discussing with the user first (the team may have opinions).
- **Atomic commits.** Each commit builds successfully and represents one logical change.
- **Clean PRs.** No debug code, no commented-out experiments, no unrelated formatting changes.
- **PR descriptions are documentation.** Write them as if the reviewer has no context beyond the codebase.
- **Never force-push to a shared branch.** Only force-push to your own feature branches when rebasing.
- **If in doubt, ask.** When the repo's conventions are unclear or a design decision could go either way, flag it to the user before implementing.
