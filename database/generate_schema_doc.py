"""Generate DB_SCHEMA.md from extracted schema JSON."""
import json
import sys
from collections import defaultdict

def load_data(path: str) -> dict:
    with open(path, "r") as f:
        return json.load(f)

def fmt_type(col: dict) -> str:
    """Format column type including max length."""
    dt = col["data_type"]
    if dt == "USER-DEFINED":
        # Extract enum type from default
        default = col.get("column_default", "") or ""
        if "::" in default:
            return default.split("::")[-1]
        return "enum"
    if dt == "ARRAY":
        return "text[]"
    ml = col.get("character_maximum_length")
    if ml:
        return f"{dt}({ml})"
    return dt

def fmt_default(val: str | None) -> str:
    if val is None:
        return ""
    # Clean up common patterns
    val = val.replace("::jsonb", "").replace("::text", "").replace("::text[]", "")
    if val == "'{}'":
        return "`{}`"
    if val == "now()":
        return "`now()`"
    if val == "uuid_generate_v4()":
        return "`uuid_generate_v4()`"
    if val == "true" or val == "false":
        return f"`{val}`"
    if val.startswith("'") and val.endswith("'"):
        return f"`{val[1:-1]}`"
    return f"`{val}`"

def main():
    data = load_data(sys.argv[1])

    # Group columns by table
    tables = defaultdict(list)
    for col in data["columns"]:
        tables[col["table_name"]].append(col)

    # Row counts
    row_counts = data.get("row_counts", {})

    # Table stats
    table_stats = {s["table_name"]: s for s in data.get("table_stats", [])}

    # Constraints grouped by table
    constraints_by_table = defaultdict(list)
    for c in data.get("constraints", []):
        constraints_by_table[c["table_name"]].append(c)

    # Indexes grouped by table
    indexes_by_table = defaultdict(list)
    for idx in data.get("indexes", []):
        indexes_by_table[idx["tablename"]].append(idx)

    # Foreign keys
    fks = data.get("foreign_keys", [])
    fks_by_table = defaultdict(list)
    for fk in fks:
        fks_by_table[fk["source_table"]].append(fk)

    # Check constraints
    checks = data.get("check_constraints", [])

    # Functions
    func_defs = data.get("function_defs", [])
    routines = data.get("routines", [])

    # Triggers
    triggers = data.get("triggers", [])

    # Extensions
    extensions = data.get("extensions", [])

    # Domain groupings
    domain1 = ["projects", "project_phases", "milestones", "tasks", "artifacts", "project_tags"]
    domain2 = ["contacts", "contact_relationships", "important_dates", "audiences", "audience_members"]
    domain3 = ["pipelines", "pipeline_runs", "pipeline_logs", "campaigns", "campaign_posts"]
    domain4 = ["knowledge_entries", "knowledge_embeddings", "knowledge_connections", "skill_registry", "skill_evolution_log"]

    ext_str = ", ".join(f"{e['extname']} {e['extversion']}" for e in extensions) if extensions else "pgvector 0.8.1"

    lines = []
    lines.append("# AI OS Database Schema")
    lines.append("")
    lines.append(f"> Auto-generated from `ai_os` database on 2026-03-14")
    lines.append(f"> Instance: `bharatvarsh-website:us-central1:bharatvarsh-db`")
    lines.append(f"> Database: `ai_os` | User: `ai_os_admin` | PostgreSQL 15 | Extensions: {ext_str}")
    lines.append("")

    # Overview table
    lines.append("## Overview")
    lines.append("")
    lines.append("| # | Table | Rows | Columns | Domain | Migration |")
    lines.append("|---|-------|------|---------|--------|-----------|")

    table_descs = {
        "projects": ("Top-level project entities", "Project Management", "001"),
        "project_phases": ("Major phases within a project", "Project Management", "001"),
        "milestones": ("Key deliverables within a phase", "Project Management", "001"),
        "tasks": ("Actionable work items", "Project Management", "001"),
        "artifacts": ("Files, links, outputs tied to a project", "Project Management", "001"),
        "project_tags": ("Flexible labeling for projects", "Project Management", "001"),
        "contacts": ("People in the network", "Contacts & Reference", "002"),
        "contact_relationships": ("Bidirectional links between contacts", "Contacts & Reference", "002"),
        "important_dates": ("Birthdays, anniversaries for reminder pipelines", "Contacts & Reference", "002"),
        "audiences": ("Named segments for targeted outreach", "Contacts & Reference", "002"),
        "audience_members": ("Junction linking contacts to audiences", "Contacts & Reference", "002"),
        "pipelines": ("Registered pipeline definitions", "Pipeline Tracking", "003"),
        "pipeline_runs": ("Pipeline execution history", "Pipeline Tracking", "003"),
        "pipeline_logs": ("Per-run log entries", "Pipeline Tracking", "003"),
        "campaigns": ("Content campaigns tied to audiences", "Pipeline Tracking", "003"),
        "campaign_posts": ("Individual content pieces within a campaign", "Pipeline Tracking", "003"),
        "knowledge_entries": ("Core knowledge store", "Knowledge & Intelligence", "004"),
        "knowledge_embeddings": ("Vector representations for semantic search", "Knowledge & Intelligence", "004"),
        "knowledge_connections": ("Typed relationships between entries", "Knowledge & Intelligence", "004"),
        "skill_registry": ("Tracks all Claude Code skills", "Knowledge & Intelligence", "004"),
        "skill_evolution_log": ("Tracks changes to skills over time", "Knowledge & Intelligence", "004"),
    }

    all_tables = domain1 + domain2 + domain3 + domain4
    for i, tbl in enumerate(all_tables, 1):
        desc, domain, mig = table_descs.get(tbl, ("", "", ""))
        rc = row_counts.get(tbl, 0)
        cc = len(tables.get(tbl, []))
        lines.append(f"| {i} | `{tbl}` | {rc} | {cc} | {domain} | {mig} |")

    lines.append("")

    # Helper to render a table section
    def render_table(tbl_name: str):
        cols = tables.get(tbl_name, [])
        desc = table_descs.get(tbl_name, ("", "", ""))[0]
        lines.append(f"### Table: `{tbl_name}`")
        lines.append(f"_{desc}_")
        lines.append("")
        lines.append("| Column | Type | Nullable | Default | Notes |")
        lines.append("|--------|------|----------|---------|-------|")
        for col in cols:
            ctype = fmt_type(col)
            nullable = "YES" if col["is_nullable"] == "YES" else "NO"
            default = fmt_default(col.get("column_default"))

            # Check for constraints on this column
            notes_parts = []
            for c in constraints_by_table.get(tbl_name, []):
                if c["column_name"] == col["column_name"]:
                    if c["constraint_type"] == "PRIMARY KEY":
                        notes_parts.append("PK")
                    elif c["constraint_type"] == "UNIQUE":
                        notes_parts.append("UNIQUE")

            for fk in fks_by_table.get(tbl_name, []):
                if fk["source_column"] == col["column_name"]:
                    notes_parts.append(f"FK -> `{fk['target_table']}.{fk['target_column']}` ({fk['on_delete']})")

            notes = ", ".join(notes_parts) if notes_parts else ""
            lines.append(f"| `{col['column_name']}` | `{ctype}` | {nullable} | {default} | {notes} |")
        lines.append("")

    # Domain 1
    lines.append("---")
    lines.append("")
    lines.append("## Domain 1: Project Management (migration 001)")
    lines.append("")
    lines.append("Tracks projects, phases, milestones, tasks, artifacts, and tags. Core hierarchy: **project -> phase -> milestone -> task**. Artifacts attach to projects/tasks.")
    lines.append("")

    for tbl in domain1:
        render_table(tbl)

    # Domain 2
    lines.append("---")
    lines.append("")
    lines.append("## Domain 2: Contacts & Reference Records (migration 002)")
    lines.append("")
    lines.append("People in the network, their relationships, important dates (birthday pipeline), and audience segmentation for targeted outreach.")
    lines.append("")

    for tbl in domain2:
        render_table(tbl)

    # Domain 3
    lines.append("---")
    lines.append("")
    lines.append("## Domain 3: Pipeline Tracking (migration 003)")
    lines.append("")
    lines.append("Pipeline definitions, execution runs with cost tracking, structured logs, and content campaign management with post-level performance metrics.")
    lines.append("")

    for tbl in domain3:
        render_table(tbl)

    # Domain 4
    lines.append("---")
    lines.append("")
    lines.append("## Domain 4: Knowledge & Intelligence (migration 004)")
    lines.append("")
    lines.append("Semantic knowledge store with vector embeddings (pgvector), typed connections between entries, skill registry, and evolution tracking.")
    lines.append("")

    for tbl in domain4:
        render_table(tbl)

    # Indexes
    lines.append("---")
    lines.append("")
    lines.append("## Indexes")
    lines.append("")

    for tbl in all_tables:
        idxs = indexes_by_table.get(tbl, [])
        if not idxs:
            continue
        lines.append(f"### `{tbl}`")
        lines.append("")
        lines.append("| Index Name | Definition |")
        lines.append("|------------|------------|")
        for idx in idxs:
            defn = idx["indexdef"]
            # Shorten CREATE INDEX ... ON table USING
            defn = defn.replace("CREATE INDEX ", "").replace("CREATE UNIQUE INDEX ", "UNIQUE: ")
            lines.append(f"| `{idx['indexname']}` | `{defn}` |")
        lines.append("")

    # Functions
    lines.append("---")
    lines.append("")
    lines.append("## Functions")
    lines.append("")

    # Filter out pgvector and moddatetime internal functions
    user_funcs = []
    if func_defs:
        for fd in func_defs:
            key = list(fd.keys())[0]
            func_text = fd[key]
            # Skip internal extension functions
            if "$libdir/" in func_text:
                continue
            user_funcs.append(func_text)

    if user_funcs:
        for func_text in user_funcs:
            lines.append("```sql")
            lines.append(func_text.strip())
            lines.append("```")
            lines.append("")
    else:
        lines.append("_No user-defined application functions exist yet._ All current functions are internal to pgvector and moddatetime extensions.")
        lines.append("")
        lines.append("### Planned: `match_knowledge()` (RAG semantic search primitive)")
        lines.append("")
        lines.append("```sql")
        lines.append("-- PLANNED — semantic similarity search over knowledge_entries via pgvector")
        lines.append("-- Signature: match_knowledge(")
        lines.append("--   query_embedding vector(1536),")
        lines.append("--   match_threshold float DEFAULT 0.7,")
        lines.append("--   match_count int DEFAULT 10,")
        lines.append("--   filter_domain text DEFAULT NULL")
        lines.append("-- )")
        lines.append("-- RETURNS TABLE (id uuid, title text, content text, domain text, similarity float)")
        lines.append("--")
        lines.append("-- Performs cosine similarity search using the HNSW index on knowledge_embeddings.")
        lines.append("-- Joins back to knowledge_entries for full content.")
        lines.append("-- Core RAG primitive — all agents call this for semantic retrieval.")
        lines.append("```")
        lines.append("")
        lines.append("### Planned: `traverse_knowledge()` (knowledge graph traversal)")
        lines.append("")
        lines.append("```sql")
        lines.append("-- PLANNED — graph traversal across knowledge_connections")
        lines.append("-- Signature: traverse_knowledge(")
        lines.append("--   start_entry_id uuid,")
        lines.append("--   max_depth int DEFAULT 2,")
        lines.append("--   relationship_types relationship_type_kb[] DEFAULT NULL")
        lines.append("-- )")
        lines.append("-- RETURNS TABLE (entry_id uuid, title text, content text, depth int, path uuid[], relationship text)")
        lines.append("--")
        lines.append("-- Recursive CTE traversal of the knowledge_connections graph.")
        lines.append("-- Follows typed edges (relates_to, derived_from, expands, etc.)")
        lines.append("-- Used after match_knowledge() to expand context with related entries.")
        lines.append("```")
        lines.append("")
        lines.append("### Extension Functions (pgvector & moddatetime)")
        lines.append("")
        lines.append("pgvector provides ~170 internal C functions for vector operations. Key operators:")
        lines.append("")
        lines.append("| Operator | Function | Purpose |")
        lines.append("|----------|----------|---------|")
        lines.append("| `<=>` | cosine distance | Primary similarity metric for HNSW index |")
        lines.append("| `<->` | L2 (Euclidean) distance | Alternative distance metric |")
        lines.append("| `<#>` | negative inner product | Dot product similarity |")
        lines.append("| `vector_dims()` | dimension count | Returns 1536 for our embeddings |")
        lines.append("| `l2_normalize()` | unit normalization | Normalize vectors before comparison |")
        lines.append("")
        lines.append("`moddatetime()` — trigger function used by all `updated_at` triggers.")
        lines.append("")

    # Triggers
    lines.append("---")
    lines.append("")
    lines.append("## Triggers")
    lines.append("")
    lines.append("| Trigger Name | Table | Timing | Event | Action |")
    lines.append("|-------------|-------|--------|-------|--------|")
    for t in triggers:
        lines.append(f"| `{t['trigger_name']}` | `{t['event_object_table']}` | {t['action_timing']} | {t['event_manipulation']} | `{t['action_statement']}` |")
    lines.append("")
    lines.append("All `updated_at` triggers use `moddatetime()` from the `moddatetime` extension — automatically sets the column to `NOW()` on any `UPDATE`.")
    lines.append("")

    # Foreign Keys
    lines.append("---")
    lines.append("")
    lines.append("## Relationships (Foreign Keys)")
    lines.append("")
    lines.append("| Source | Column | Target | Column | ON DELETE |")
    lines.append("|--------|--------|--------|--------|-----------|")
    for fk in fks:
        lines.append(f"| `{fk['source_table']}` | `{fk['source_column']}` | `{fk['target_table']}` | `{fk['target_column']}` | {fk['on_delete']} |")
    lines.append("")

    # Check constraints
    lines.append("---")
    lines.append("")
    lines.append("## CHECK Constraints")
    lines.append("")
    lines.append("These constraints enforce valid values — skills and pipelines that `INSERT` data must respect these.")
    lines.append("")
    lines.append("| Table | Constraint | Definition |")
    lines.append("|-------|-----------|------------|")
    for ck in checks:
        lines.append(f"| `{ck['table_name']}` | `{ck['constraint_name']}` | `{ck['definition']}` |")
    lines.append("")

    # Enum types
    lines.append("---")
    lines.append("")
    lines.append("## Enum Types")
    lines.append("")
    lines.append("All `USER-DEFINED` columns use PostgreSQL enum types. Valid values:")
    lines.append("")

    enums = {
        "project_status": ["planning", "active", "paused", "completed", "archived"],
        "phase_status": ["not_started", "in_progress", "completed", "blocked"],
        "milestone_status": ["pending", "in_progress", "completed", "missed"],
        "task_status": ["todo", "in_progress", "blocked", "done", "cancelled"],
        "task_priority": ["low", "medium", "high", "urgent"],
        "artifact_type": ["document", "code", "config", "design", "media", "deployment", "other"],
        "contact_type": ["professional", "personal", "both"],
        "relationship_type": ["colleague", "mentor", "mentee", "friend", "family", "client", "collaborator", "investor", "advisor", "acquaintance"],
        "date_type": ["birthday", "anniversary", "work_anniversary", "custom"],
        "pipeline_category": ["A", "B", "C"],
        "run_status": ["running", "success", "failed", "cancelled"],
        "trigger_type": ["scheduled", "manual", "event", "webhook"],
        "log_level": ["debug", "info", "warn", "error"],
        "campaign_status": ["planned", "active", "paused", "completed"],
        "post_status": ["draft", "scheduled", "published", "failed", "cancelled"],
        "source_type": ["research_session", "decision", "lesson_learned", "reference", "manual"],
        "relationship_type_kb": ["relates_to", "derived_from", "contradicts", "supersedes", "expands", "depends_on"],
        "skill_change_type": ["created", "updated", "tested", "deprecated"],
    }

    for name, vals in enums.items():
        lines.append(f"- **`{name}`**: {', '.join(f'`{v}`' for v in vals)}")
    lines.append("")

    # Extensions
    lines.append("---")
    lines.append("")
    lines.append("## Extensions")
    lines.append("")
    lines.append("| Extension | Version | Purpose |")
    lines.append("|-----------|---------|---------|")
    ext_purposes = {
        "vector": "Vector similarity search (pgvector) — enables `vector(1536)` type and HNSW indexes",
        "pg_trgm": "Trigram-based fuzzy text search — enables `%` and `<->` similarity operators",
        "moddatetime": "Auto-update `updated_at` timestamps on row modification",
        "uuid-ossp": "UUID generation — `uuid_generate_v4()` for primary keys",
    }
    if extensions:
        for e in extensions:
            purpose = ext_purposes.get(e["extname"], "")
            lines.append(f"| `{e['extname']}` | {e['extversion']} | {purpose} |")
    # Always include uuid-ossp since it's used everywhere
    lines.append(f"| `uuid-ossp` | — | UUID generation — `uuid_generate_v4()` for primary keys |")
    lines.append("")

    # Connection info
    lines.append("---")
    lines.append("")
    lines.append("## Connection Reference")
    lines.append("")
    lines.append("| Property | Value |")
    lines.append("|----------|-------|")
    lines.append("| Instance | `bharatvarsh-website:us-central1:bharatvarsh-db` |")
    lines.append("| Database | `ai_os` |")
    lines.append("| User | `ai_os_admin` |")
    lines.append("| Password secret | `AI_OS_DB_PASSWORD` (in Secret Manager, project `ai-operating-system-490208`) |")
    lines.append("| Cloud Functions | `cloud-sql-python-connector[pg8000]` |")
    lines.append("| Cloud Run | Auth Proxy sidecar via `--add-cloudsql-instances` |")
    lines.append("| Local dev | `cloud-sql-proxy` CLI -> localhost:5432 |")
    lines.append("")

    print("\n".join(lines))

if __name__ == "__main__":
    main()
