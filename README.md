# AI Operating System

A personal AI-enabled operating system built on Claude + LangGraph + GCP.

## What This Is
An orchestrated system that manages all domains of life — professional work, creative projects, and personal operations — through three service categories:

- **Category A:** Claude.ai project as the primary chat interface (15 skills, 3+ connectors, rich knowledge base)
- **Category B:** Scheduled Cloud Functions for autonomous background tasks
- **Category C:** LangGraph agentic workflows on Cloud Run for complex multi-step operations

## Quick Start

```bash
# Clone and setup
cd ai-os-project
cp .env.example .env
# Fill in your API keys

# Start a Claude Code session
claude

# Deploy a Category B workflow
cd workflows/category-b/birthday-wishes
gcloud functions deploy birthday-wishes --runtime python312 --trigger-http

# Deploy Category C agent service
cd workflows/category-c
gcloud run deploy ai-os-agents --source .
```

## Architecture
See `CLAUDE.md` for the full context that Claude Code reads on every session.
See `knowledge-base/OS_EVOLUTION_LOG.md` for the running decision log.

## Tech Stack
Python 3.12 | FastAPI | LangGraph | GCP (Cloud Run, Functions, Scheduler) | Supabase | Claude API

## Owner
Atharva Singh — atharvasingh.24@gmail.com
