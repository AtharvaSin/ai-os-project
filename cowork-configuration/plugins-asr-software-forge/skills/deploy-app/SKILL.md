---
name: deploy-app
description: Package an application for deployment — build Docker images, generate CI/CD configs, create deployment documentation, and optionally push to a git repository. Use when the user says "deploy", "ship it", "make it deployable", "push to repo", or "prepare for production".
---

# Deploy App

Package a built application for deployment. Generates all infrastructure files, validates the build, and optionally initializes a git repository for pushing to GitHub.

## Before Starting

1. Read `${CLAUDE_PLUGIN_ROOT}/context/engineering-preferences.md`
2. Identify the application type from the working directory
3. Check if git is already initialized

## Step 1: Identify Deployment Target

| Signal | Target | Config Generated |
|--------|--------|-----------------|
| User says "Cloud Run" or "GCP" | Google Cloud Run | Dockerfile + cloudbuild.yaml |
| User says "Vercel" | Vercel | vercel.json |
| User says "Docker" only | Generic Docker | Dockerfile + docker-compose.yml |
| User says "GitHub Pages" | Static hosting | GitHub Actions workflow |
| User says "repo" or "push" | Git repository | .gitignore + README + git init |
| No preference | Docker + Cloud Run (default) | Dockerfile + cloudbuild.yaml |

## Step 2: Generate Infrastructure Files

### Dockerfile (Next.js)
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### Dockerfile (FastAPI)
```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
RUN adduser --system --no-create-home appuser
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
USER appuser
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Cloud Build (cloudbuild.yaml)
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'REGION-docker.pkg.dev/PROJECT/REPO/IMAGE:$COMMIT_SHA', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'REGION-docker.pkg.dev/PROJECT/REPO/IMAGE:$COMMIT_SHA']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args: ['run', 'deploy', 'SERVICE', '--image', 'REGION-docker.pkg.dev/PROJECT/REPO/IMAGE:$COMMIT_SHA', '--region', 'REGION']
```

## Step 3: Validate Build

```bash
# Build the Docker image
docker build -t app-test .

# Test it runs
docker run -p 3000:3000 --rm app-test &
sleep 5
curl -s http://localhost:3000 | head -5
docker stop $(docker ps -q --filter ancestor=app-test)
```

## Step 4: Git Repository Setup

If the user wants to push to a new repository:

```bash
# Initialize
git init
git add -A
git commit -m "feat: initial commit — [app description]"

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.next/
.env
.env.local
*.log
dist/
.vercel/
__pycache__/
*.pyc
.venv/
EOF
```

Remind the user to:
1. Create a new repo on GitHub
2. `git remote add origin https://github.com/[user]/[repo].git`
3. `git push -u origin main`

## Step 5: Generate Deployment Documentation

Append to README.md:
```markdown
## Deployment

### Prerequisites
- [List all required accounts/tools]

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| [from .env.example] | | |

### Deploy to [Target]
[Step-by-step instructions specific to the deployment target]
```

## Step 6: Deliver

```
deployment-additions/
├── Dockerfile
├── .dockerignore
├── docker-compose.yml        # For local dev
├── cloudbuild.yaml            # If GCP
├── vercel.json                # If Vercel
├── .github/workflows/ci.yml  # If GitHub Actions
├── .gitignore
├── .env.example
└── deploy-report.md           # Summary of deployment config
```

## Quality Rules

- Dockerfile MUST use multi-stage builds and non-root users
- .env.example must document EVERY environment variable
- Docker image should be under 500MB for web apps
- Health check endpoint should exist (/health or /api/health)
- All secrets via environment variables — never hardcoded
- README deployment section must be copy-paste executable
