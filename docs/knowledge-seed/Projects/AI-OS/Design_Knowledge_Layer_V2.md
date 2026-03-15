# AI OS -- Knowledge Layer V2 Design Rationale

## Why a Knowledge Layer

The AI Operating System started as a structured operational tracker: tasks, milestones, projects, and pipelines in PostgreSQL tables. This works well for real-time queries ("what tasks are overdue?") but fails at contextual intelligence. The system could not answer questions like "what decisions did we make about Cloud SQL and why?" or "what is Kahaan's character arc?" because operational data and accumulated knowledge are fundamentally different things.

Knowledge Layer V2 transforms the AI OS from an operational tracker into an intelligent semantic knowledge system by adding curated, searchable, interconnected knowledge entries with vector embeddings.

## The Two-Pathway Architecture

V2 introduces two distinct ingestion pathways, each solving a different problem:

### Pathway 1: Weekly Batch Summarisation
A Cloud Run service runs every Sunday at 22:00 IST. It reads the past week's operational data from PostgreSQL (completed tasks, milestone progress, pipeline runs, blockers) and uses Claude Haiku to generate natural-language summary entries. These summaries capture "what happened this week" in prose form, with embeddings for semantic search.

**Why weekly, not real-time:** Operational data changes constantly. Summarising at task granularity would produce noise, not knowledge. Weekly batch summarisation produces high-signal entries that capture patterns and progress rather than individual data points.

### Pathway 2: Drive Knowledge Scanner
A Cloud Run service runs daily at 06:00 IST. It scans the Google Drive `AI OS/Knowledge/` folder tree for new or modified documents, chunks them by headers and paragraphs, classifies their domain from the folder path, and ingests them into the knowledge base with embeddings.

**Why Drive as the input surface:** Drive is accessible from any device (phone, desktop, any browser). It allows the owner to write knowledge documents anywhere and have them automatically ingested. Claude produces knowledge docs in the .claude/skills workflows; the Drive scanner ingests them. This creates a clean separation: humans and AI produce documents, pipelines ingest them.

## Semantic Search with pgvector

The knowledge layer uses OpenAI's text-embedding-3-small model to generate 1536-dimensional vector embeddings for every knowledge entry. These are stored in the `knowledge_embeddings` table with an HNSW index for fast approximate nearest-neighbour search. The `match_knowledge()` PostgreSQL function combines vector similarity with optional domain, sub-domain, and tag filters to find semantically relevant entries.

This enables queries like "what do we know about surveillance technology in Bharatvarsh?" to return relevant lore entries even if they do not contain the exact search terms.

## Knowledge Connections

The `knowledge_connections` table creates a typed graph between entries. Relationship types include `relates_to`, `depends_on`, `derived_from`, `supersedes`, `contradicts`, and `supports`. The `traverse_knowledge()` function walks this graph to find related entries across domains -- connecting, for example, a system architecture decision to the AI OS project requirement that motivated it, or a Bharatvarsh lore entry to a content calendar post that references it.

An auto-connection discovery pipeline runs weekly after the summary pipeline. It uses embedding similarity to propose new cross-domain connections, which are presented to the owner during the weekly review for approval. This is the expert-in-the-loop principle: AI discovers potential connections, humans decide which are worth preserving.

## Domain Organisation

Knowledge entries are organised into three domains:
- **System** -- Architecture decisions, infrastructure references, sprint retrospectives, bug fixes, tool ecosystem documentation
- **Project** -- Project-specific knowledge: Bharatvarsh lore and marketing, AI&U channel strategy and content, AI OS technical design, Zealogics work context
- **Personal** -- Owner profile, goals, preferences, relationship context, location and travel

Sub-domains provide finer granularity (e.g., domain=project, sub_domain=bharatvarsh).

## Expert-in-the-Loop Principle

A core design principle of V2 is that AI tracks and summarises, but humans decide what is worth preserving. The weekly summary pipeline generates candidate entries, but the weekly review skill presents them for verification. The auto-connection pipeline proposes edges, but the owner approves them. Drive documents are manually curated before being placed in the Knowledge/ folder. This prevents the knowledge base from becoming a noisy dump of auto-generated content.

## Initial Seed

The knowledge base is bootstrapped with 80-100+ entries across all three domains, written as structured markdown documents and uploaded to Drive for ingestion. This seed provides enough content for semantic search to be immediately useful and for cross-domain connections to be meaningful.
