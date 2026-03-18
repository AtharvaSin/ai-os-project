# Personal Capture System — Implementation Plan

**Created:** 2026-03-18
**Source Design:** `Design_Personal_Capture_System.docx` + `Reference_Personal_Capture_Implementation.md`
**Status:** Executing

---

## Executive Summary

Add journal and quick-capture capabilities to the AI OS. Two entry types: **journals** (reflective, personal, monthly-distilled) and **quick entries** (ideas, epiphanies, memories — action-oriented, immediately searchable). Primary interface: Claude.ai natural language prefixes ("Journal:", "Entry:"). Secondary: Claude Code skill, Telegram bot commands.

## Leverage Analysis — ~70% Infrastructure Reuse

| Component | Exists? | Reuse Strategy |
|---|---|---|
| `knowledge_entries` table | Yes | Quick entries use `source_type='quick_capture'` — no new table needed |
| `knowledge_embeddings` + HNSW | Yes | Quick entries auto-embedded by existing embedding-generator pipeline |
| `knowledge_connections` | Yes | entry-analysis skill creates connections between captures and existing knowledge |
| MCP Gateway (FastMCP) | Yes | Add new `capture.py` module — follows exact pattern of `life_graph.py` |
| Telegram bot + AI triage | Yes | Extend with `/j` and `/e` command handlers |
| `KnowledgeClient` shared lib | Yes | Used by journal-monthly-distill pipeline for embedding generation |
| Dashboard (Next.js) | Yes | Add `/capture` page using existing components + API patterns |
| Cloud Run + Cloud Scheduler | Yes | journal-monthly-distill follows domain-health-scorer pattern exactly |
| Embedding generator pipeline | Yes | Picks up quick entries automatically (no changes needed) |
| Life Graph domains | Yes | Captures link to domains via `domain_id` FK |

## What's New

| Deliverable | Type | Effort |
|---|---|---|
| Migration 013: `journals` table + enum values | SQL | Small |
| `capture.py` MCP module (3 tools) | Python | Medium |
| `capture-entry` skill | SKILL.md | Small |
| `entry-analysis` skill | SKILL.md | Medium |
| `journal-monthly-distill` pipeline | Cloud Run service | Medium |
| Telegram capture commands | Python | Small |
| Dashboard `/capture` page + API routes | Next.js | Medium |
| Pipeline registration seed | SQL | Small |

---

## Phase 1: Database Schema (Migration 013)

### 1a. New `journals` Table

```sql
CREATE TABLE journals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content         TEXT NOT NULL,
    mood            TEXT,
    tags            TEXT[] DEFAULT '{}',
    energy_level    SMALLINT CHECK (energy_level BETWEEN 1 AND 5),
    domain_id       UUID REFERENCES life_domains(id) ON DELETE SET NULL,
    word_count      INTEGER GENERATED ALWAYS AS (array_length(string_to_array(content,' '),1)) STORED,
    is_embedded     BOOLEAN DEFAULT FALSE,
    embedded_at     TIMESTAMPTZ,
    distilled_at    TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Indexes: `created_at DESC`, `mood`, `domain_id`, GIN on `tags`, full-text GIN on `content`.
Trigger: `moddatetime(updated_at)`.

### 1b. Enum Additions

```sql
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'quick_capture';
ALTER TYPE source_type ADD VALUE IF NOT EXISTS 'journal_entry';
```

### 1c. Pipeline Registration

```sql
INSERT INTO pipelines (slug, name, description, schedule, category, is_active)
VALUES ('journal-monthly-distill', 'Journal Monthly Distillation',
        'Monthly batch processing of journal entries via Claude Haiku. Extracts themes, patterns, insights.',
        '0 3 28 * *', 'B', true);
```

---

## Phase 2: MCP Gateway Module (`capture.py`)

New module: `mcp-servers/ai-os-gateway/app/modules/capture.py`
Pattern: follows `life_graph.py` exactly — `register_tools(mcp, get_pool)` function.

### Tool 1: `capture_entry`
- Parameters: `type` (journal|quick), `content`, `mood?`, `energy_level?`, `capture_type?`, `domain?`, `tags?`, `urgency?`, `linked_task_ids?`
- Journal path: INSERT into `journals` table, return id + created_at
- Quick path: INSERT into `knowledge_entries` with `source_type='quick_capture'`, auto-generate title from first 60 chars, return id + title
- Domain resolution: if `domain` slug provided, resolve to `domain_id` via life_domains lookup

### Tool 2: `list_journals`
- Parameters: `days_back` (default 7), `mood?`, `limit` (default 20)
- Returns: entries with id, content preview (200 chars), mood, energy_level, word_count, domain name, created_at

### Tool 3: `search_journals`
- Parameters: `query`, `days_back` (default 90), `limit` (default 10)
- Full-text search on journals.content using `to_tsvector/plainto_tsquery`
- Returns: matching entries with ts_rank score, highlighted snippets

### Registration in `main.py`
- Import `capture` module
- Call `capture.register_tools(mcp, config.get_db_pool)`
- Add "capture" to health check modules list

---

## Phase 3: Claude Code Skills

### 3a. `capture-entry` Skill
File: `.claude/skills/capture-entry/SKILL.md`
Triggers: "log journal", "capture entry", "quick entry", "Journal:", "Entry:"
Process:
1. Parse input: detect "Journal:" or "Entry:" prefix
2. For journals: extract optional mood= and energy= hints
3. For entries: detect subtype (idea:, epiphany:, memory:) if present
4. Call `capture_entry` MCP tool with parsed parameters
5. Confirm: "Stored [type] entry [id] at [timestamp]"

### 3b. `entry-analysis` Skill
File: `.claude/skills/entry-analysis/SKILL.md`
Triggers: "analyse entries", "process entries", "review captures"
Process:
1. Gather unprocessed quick entries (metadata->>'analysed_at' IS NULL)
2. Gather current state (active tasks, objectives, recent knowledge)
3. For each entry propose: CREATE task / MODIFY task / UPDATE objective / NEW knowledge / CONNECT / SUPERSEDE
4. Present structured review for human approval
5. Apply approved changes via MCP tools
6. Mark entries as processed (metadata.analysed_at = now())

---

## Phase 4: Journal Monthly Distillation Pipeline

Service: `workflows/category-b/journal-monthly-distill/`
Files: `main.py`, `requirements.txt`, `Dockerfile`, `cloudbuild.yaml`
Pattern: follows `domain-health-scorer` exactly (FastAPI + Cloud Run + Cloud Scheduler).

Pipeline logic:
1. Query unprocessed journals (distilled_at IS NULL)
2. Batch content to Claude Haiku with extraction prompt
3. Parse JSON output: themes, patterns, tensions, decisions, missed_actions
4. For each theme: insert knowledge_entry (source_type='journal_entry', domain='personal', tags=['journal_distill', 'YYYY-MM'])
5. Mark journals as distilled (distilled_at = NOW())
6. Log pipeline run

Claude Haiku system prompt extracts: recurring themes, mood/energy patterns, unresolved tensions, key decisions, missed action items.

---

## Phase 5: Telegram Bot Extension

Extend `mcp-servers/ai-os-gateway/app/telegram/router.py` with capture commands:
- `/j <content>` → `capture_entry(type="journal", content=...)`
- `/e <content>` → `capture_entry(type="quick", content=...)`
- `/ei <content>` → `capture_entry(type="quick", capture_type="idea", content=...)`
- `/em <content>` → `capture_entry(type="quick", capture_type="memory_recall", content=...)`

Each command parses content from the message text after the command, calls the capture module directly (not via MCP), and sends a confirmation message via Telegram.

---

## Phase 6: Dashboard Capture Page

### API Routes
- `GET /api/capture/inbox` — List unprocessed quick entries (source_type='quick_capture', metadata->>'analysed_at' IS NULL)
- `GET /api/capture/journals` — List recent journals with filters (days_back, mood)
- `GET /api/capture/stats` — Capture stats (total journals, total quick entries, unprocessed count, this week count)

### Page: `/capture`
- Inbox tab: unprocessed quick entries with domain tags, urgency, capture_type badges
- Journals tab: chronological journal feed with mood/energy indicators
- Stats card: total entries, this week, unprocessed backlog

---

## Execution Order

```
Phase 1 (DB) ──┐
                ├──→ Phase 2 (MCP) ──→ Phase 3 (Skills) ──→ Phase 5 (Telegram)
Phase 4 (Pipeline) ─────────────────────────────────────────→ (independent)
Phase 6 (Dashboard) ────────────────────────────────────────→ (independent, after Phase 1)
```

Phases 1, 4, and 6 can be parallelized. Phase 2 depends on Phase 1 (needs table). Phase 3 depends on Phase 2 (needs MCP tool). Phase 5 depends on Phase 2 (calls capture module).

---

## Cost Impact

| Item | Monthly Cost |
|---|---|
| Journal raw storage | $0 (DB rows, no embeddings) |
| Journal distilled embeddings | ~$0.003/month |
| Quick entry embeddings | ~$0.001/entry (existing pipeline) |
| journal-monthly-distill Cloud Run | $0 (scales to zero, <$0.01/run) |
| Claude Haiku distillation | ~$0.01/month (30 entries) |
| **Total** | **$0.01-0.05/month** |

---

## Success Criteria

1. "Journal: <text>" in Claude.ai stores to journals table and returns confirmation
2. "Entry idea: <text>" in Claude.ai stores to knowledge_entries and is searchable within 5 minutes
3. `list_journals` returns recent entries with mood/energy
4. `search_journals` performs full-text search on journal content
5. entry-analysis skill proposes actions from unprocessed entries
6. journal-monthly-distill extracts themes and creates knowledge_entries
7. `/j` and `/e` Telegram commands work
8. Dashboard /capture page shows inbox and journal feed
