---
name: setup-project
description: Initialize a new software project directory, git repository, and forge manifest outside the AI OS root. Use after specify-project completes, or when the user has specs ready and wants to create the actual project skeleton. This is Phase 2 of the Software Forge workflow.
---

# Setup Project (Phase 2)

Create the actual project directory, initialize version control, and establish the link between the specs (in ai-os-project) and the code (in the external project folder).

## Before Starting

1. Read `${CLAUDE_PLUGIN_ROOT}/context/engineering-preferences.md`
2. Verify that `forge-projects/{slug}/specs/` exists and contains at minimum: `prd.md`, `architecture.md`, `design-direction.md`
3. Read `forge-projects/{slug}/manifest.json` for project identity
4. Read `forge-projects/{slug}/specs/architecture.md` to know the stack

## Step 1: Determine Project Location

The default project root is:
```
C:\Users\ASR\OneDrive\Desktop\Zealogics Work\Projects\implementations\{slug}\
```

In Cowork, this maps to a mounted directory. If access is not available:
1. Use `request_cowork_directory` to request access to the implementations folder
2. If the user prefers a different location, ask and update the manifest

If the implementations folder is not accessible, create the project in the Cowork workspace folder and inform the user of the path to move it.

## Step 2: Initialize Based on Stack

Read the architecture decision from `specs/architecture.md` and initialize accordingly:

### For Next.js Projects
```bash
cd {project_root}
npx create-next-app@latest {slug} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
cd {slug}
```

### For FastAPI Projects
```bash
cd {project_root}
mkdir {slug} && cd {slug}
python -m venv .venv
pip install fastapi uvicorn sqlalchemy alembic pydantic
mkdir -p app tests
touch app/__init__.py app/main.py app/config.py
```

### For Astro Projects
```bash
cd {project_root}
npm create astro@latest {slug} -- --template minimal --typescript strict --no-git
cd {slug}
npx astro add tailwind
```

### For React + Vite (Widget/Embed)
```bash
cd {project_root}
npm create vite@latest {slug} -- --template react-ts
cd {slug}
npm install
npm install -D tailwindcss @tailwindcss/vite
```

### For Python CLI (Typer)
```bash
cd {project_root}
mkdir {slug} && cd {slug}
python -m venv .venv
pip install typer rich
mkdir -p src tests
touch src/__init__.py src/main.py
```

### For Tauri Desktop App
```bash
cd {project_root}
npm create tauri-app@latest {slug} -- --template react-ts
cd {slug}
npm install
```

Adapt for other stacks as needed based on the architecture decision.

## Step 3: Create Project Infrastructure Files

### 3a. CLAUDE.md (for the new project)
Generate from the template at `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md.template`, filling in:
- Project name and one-liner from manifest
- Tech stack from architecture.md
- Coding standards from engineering-preferences.md
- Path back to specs: `Specs and design documents: {ai-os-project-path}/forge-projects/{slug}/specs/`
- Key architectural decisions

This file is critical — it's what grounds future Claude sessions working on this codebase.

### 3b. .env.example
Generate from the architecture.md:
- Database connection strings (if applicable)
- API keys needed (with placeholder values)
- Auth configuration
- Deployment-specific vars
- Comment each variable explaining its purpose

### 3c. .gitignore
Generate appropriate for the stack:
```bash
# Node.js
node_modules/
.next/
.env
.env.local
.env.*.local
dist/
*.log

# Python
__pycache__/
*.pyc
.venv/
.env

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Build
build/
out/
```

### 3d. README.md (stub)
```markdown
# {Project Name}

{One-liner from manifest}

## Quick Start

1. Clone: `git clone {repo-url}`
2. Install: `npm install` (or `pip install -r requirements.txt`)
3. Configure: `cp .env.example .env` and fill in values
4. Run: `npm run dev` (or `uvicorn app.main:app --reload`)

## Architecture

> Full specification: see forge-projects/{slug}/specs/ in the AI OS project

{Brief stack summary from architecture.md}

## Development

{Stack-specific dev instructions}

## Deployment

> Deployment configurations will be added in Phase 5 (Ship).
```

## Step 4: Initialize Git

```bash
cd {project_root}/{slug}
git init
git add -A
git commit -m "feat: initial project scaffold — {project name}

Stack: {stack summary}
Spec: forge-projects/{slug}/ in ai-os-project

Scaffolded by ASR Software Forge v2"
```

Do NOT create a remote or push yet. The user will set up the remote repository (GitHub, ADO, GitLab, etc.) separately.

Remind the user:
```
To connect to a remote repository:
  git remote add origin https://github.com/{user}/{slug}.git
  git push -u origin main

Or for Azure DevOps:
  git remote add origin https://dev.azure.com/{org}/{project}/_git/{slug}
  git push -u origin main
```

## Step 5: Update Forge Manifest

Update `forge-projects/{slug}/manifest.json`:
```json
{
  "phase": "setup-complete",
  "code_path": "{absolute_path_to_project}",
  "git_initialized": true,
  "git_remote": null,
  "stack_initialized": true,
  "ready_for": "build"
}
```

## Step 6: Verify Setup

Run stack-appropriate checks:

### For Node.js projects:
```bash
npm install  # Ensure deps resolve
npm run build 2>&1 || echo "Initial build — expected to need code"
```

### For Python projects:
```bash
source .venv/bin/activate
pip install -r requirements.txt
python -c "import app.main" 2>&1 || echo "Initial import — expected to need code"
```

## Deliver

Print summary:
```
PROJECT: {name}
LOCATION: {code_path}
STACK: {stack}
GIT: Initialized (no remote)
FILES: CLAUDE.md, .env.example, .gitignore, README.md

Specs linked: forge-projects/{slug}/specs/
Ready for Phase 3 (Build).

Next: Run scaffold-app to build the application, or /forge to continue the workflow.
```

## Quality Rules

- The generated CLAUDE.md must be comprehensive enough that a fresh Claude session can understand the project without reading this conversation
- .env.example must document EVERY variable the architecture needs — no surprises during setup
- .gitignore must be stack-appropriate — no node_modules or .env committed
- The initial commit message must reference the forge and the spec location
- Never create a git remote or push without explicit user instruction
- If the implementations folder is not accessible, clearly tell the user where the project was created and how to move it
