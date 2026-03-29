-- Extensions required by the AI OS database.
-- Mirrors the extensions enabled on prod: bharatvarsh-db (Postgres 15, Cloud SQL).
-- This script runs automatically on first container start via
-- /docker-entrypoint-initdb.d — do NOT remove or reorder entries.

CREATE EXTENSION IF NOT EXISTS vector;        -- pgvector: semantic embeddings (knowledge_embeddings)
CREATE EXTENSION IF NOT EXISTS ltree;         -- hierarchical path queries (life_domains)
CREATE EXTENSION IF NOT EXISTS moddatetime;   -- auto updated_at triggers across all tables
CREATE EXTENSION IF NOT EXISTS pg_trgm;       -- trigram similarity for fuzzy text search
