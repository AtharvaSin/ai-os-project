# docker/ — Local Development Stack

## Purpose
Local dev and test only. Production Docker images live in each service directory
(`mcp-servers/ai-os-gateway/Dockerfile`, `dashboard/Dockerfile`, etc.) and are
built by Cloud Build on push to main. Nothing in this directory is deployed to Cloud Run.

## Postgres Version
Must remain `pgvector/pgvector:pg15` — matches the prod `bharatvarsh-db` instance
(Cloud SQL Postgres 15). Do not upgrade the image tag without a prod migration plan.

## Extensions
`init/00_extensions.sql` enables all four required extensions on first container start:
- `vector` — pgvector for semantic search (knowledge_embeddings table)
- `ltree` — hierarchical path queries (life_domains table)
- `moddatetime` — auto updated_at triggers (used across all tables)
- `pg_trgm` — trigram similarity for fuzzy text search

Never remove or comment out any of these. They mirror prod exactly.

## Secrets
- `.env.local.example` is the source of truth for all env vars — committed to git.
- `.env.local` is the filled-in copy — gitignored, never committed.
- When adding new env vars to the gateway (`config.py`), add the corresponding
  entry to `.env.local.example` immediately.

## Compose Files
- `docker-compose.dev.yml` — development stack: hot-reload uvicorn, verbose logging,
  named volume for persistent data between restarts.
- `docker-compose.test.yml` — override for test runs: tmpfs replaces the named
  volume so the database is wiped on every container stop.

## Port Mapping
Host `5433` → container `5432`. Using `5433` on the host avoids collisions with
any local Postgres instance that may already be running on `5432`.

## Adding Services
Do not add services here that duplicate Cloud Run production services (e.g., the
dashboard). This stack is intentionally minimal — gateway + postgres only.
