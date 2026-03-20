"""PostgreSQL MCP tools for the AI OS Gateway.

Provides 6 tools for reading, writing, and searching the ai_os database.
All queries use asyncpg parameterized statements — never string interpolation
for user-supplied values.
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from fastmcp import FastMCP

from app import config as app_config

logger = logging.getLogger(__name__)

ALLOWED_TABLES = [
    "projects", "project_phases", "milestones", "tasks", "artifacts",
    "project_tags", "contacts", "contact_relationships", "important_dates",
    "audiences", "audience_members", "pipelines", "pipeline_runs",
    "pipeline_logs", "campaigns", "campaign_posts", "knowledge_entries",
    "knowledge_embeddings", "knowledge_connections", "skill_registry",
    "skill_evolution_log", "task_annotations",
    "life_domains", "domain_context_items", "domain_health_snapshots",
    "creative_projects", "creative_project_steps", "brainstorm_sessions", "writing_outputs",
]

_WRITE_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)\b",
    re.IGNORECASE,
)


def _serialize(value: Any) -> Any:
    """Convert asyncpg-native types to JSON-safe Python types."""
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, str):
        # JSONB columns sometimes arrive as raw JSON strings — decode them
        try:
            parsed = json.loads(value)
            if isinstance(parsed, (dict, list)):
                return parsed
        except (json.JSONDecodeError, TypeError, ValueError):
            pass
        return value
    if isinstance(value, dict):
        return {k: _serialize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialize(v) for v in value]
    return value


def _row_to_dict(record) -> dict[str, Any]:
    """Convert an asyncpg Record to a JSON-safe dict."""
    return {k: _serialize(v) for k, v in dict(record).items()}


async def generate_query_embedding(query: str) -> list | None:
    """Generate embedding for search query using OpenAI text-embedding-3-small.

    Returns the embedding vector as a list of floats, or None if generation
    fails (missing API key, network error, etc.). Callers should fall back
    to BM25 full-text search when None is returned.
    """
    try:
        from openai import OpenAI

        api_key = app_config.get_openai_api_key()
        if not api_key:
            logger.warning("OPENAI_API_KEY not configured — skipping embedding generation")
            return None
        client = OpenAI(api_key=api_key)
        response = client.embeddings.create(input=[query], model="text-embedding-3-small")
        return response.data[0].embedding
    except Exception as e:
        logger.warning(f"Embedding generation failed: {e}")
        return None


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register all PostgreSQL tools on the given FastMCP instance."""

    @mcp.tool(description=(
        "Execute a read-only SQL query against the ai_os database. "
        "Only SELECT and WITH...SELECT are allowed. Use $1, $2... for params. "
        "Returns: JSON array of row objects [{column: value, ...}]. "
        "Example: query_db(sql='SELECT id, title, status FROM tasks WHERE status = $1 LIMIT 5', params=['todo'])"
    ))
    async def query_db(sql: str, params: list[Any] | None = None) -> str:
        stripped = sql.strip().rstrip(";")
        if _WRITE_KEYWORDS.search(stripped):
            return json.dumps({"error": "Only SELECT queries allowed. Use insert_record/update_record for writes."})
        upper = stripped.upper().lstrip()
        if not (upper.startswith("SELECT") or upper.startswith("WITH")):
            return json.dumps({"error": "Query must start with SELECT or WITH."})
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(stripped, *(params or []))
                return json.dumps([_row_to_dict(r) for r in rows])
        except Exception as exc:
            return json.dumps({"error": f"Query failed: {exc}"})

    @mcp.tool(description=(
        "Insert a new record into an allowed table. Provide table name and a "
        "data dict of column->value pairs. UUID id auto-generated if omitted. "
        "Allowed tables: projects, project_phases, milestones, tasks, artifacts, "
        "project_tags, contacts, contact_relationships, important_dates, "
        "audiences, audience_members, pipelines, pipeline_runs, pipeline_logs, "
        "campaigns, campaign_posts, knowledge_entries, knowledge_embeddings, "
        "knowledge_connections, skill_registry, skill_evolution_log, task_annotations, "
        "life_domains, domain_context_items, domain_health_snapshots. "
        "Returns: {column: value, ..., _meta: {action, table}}. "
        "Example: insert_record(table='tasks', data={'title': 'Review PR', 'status': 'todo', 'priority': 'high', 'project_id': '...', 'domain_id': '...'})"
    ))
    async def insert_record(table: str, data: dict[str, Any]) -> str:
        if table not in ALLOWED_TABLES:
            return json.dumps({"error": f"Table '{table}' is not in the allow-list."})
        if "id" not in data:
            data["id"] = str(uuid.uuid4())
        columns = list(data.keys())
        placeholders = [f"${i+1}" for i in range(len(columns))]
        sql = (
            f"INSERT INTO {table} ({', '.join(columns)}) "
            f"VALUES ({', '.join(placeholders)}) RETURNING *"
        )
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                record = await conn.fetchrow(sql, *list(data.values()))
                result = _row_to_dict(record)
                result["_meta"] = {"action": "inserted", "table": table}
                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Insert failed: {exc}"})

    @mcp.tool(description=(
        "Update an existing record by UUID id. Provide table name, record id (UUID string), "
        "and a data dict of columns to update. Only provided columns are changed. "
        "Returns: {column: value, ..., _meta: {action, table}} or {error: string}. "
        "Example: update_record(table='tasks', id='678ea4e5-...', data={'status': 'done', 'completed_at': '2026-03-18T10:00:00Z'})"
    ))
    async def update_record(table: str, id: str, data: dict[str, Any]) -> str:
        if table not in ALLOWED_TABLES:
            return json.dumps({"error": f"Table '{table}' is not in the allow-list."})
        if not data:
            return json.dumps({"error": "No data provided for update."})
        columns = list(data.keys())
        values = list(data.values())
        set_clause = ", ".join(f"{col} = ${i+1}" for i, col in enumerate(columns))
        sql = (
            f"UPDATE {table} SET {set_clause} "
            f"WHERE id = ${len(columns)+1}::uuid RETURNING *"
        )
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                record = await conn.fetchrow(sql, *values, id)
                if record is None:
                    return json.dumps({"error": f"No record in '{table}' with id '{id}'."})
                result = _row_to_dict(record)
                result["_meta"] = {"action": "updated", "table": table}
                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Update failed: {exc}"})

    @mcp.tool(description=(
        "Inspect the database schema. With a table name: returns columns, types, "
        "constraints, and row count. Without: lists all tables with row counts. "
        "Returns: [{table, estimated_rows}] (no args) or {table, row_count, columns[], constraints[]} (with table). "
        "Example: get_schema(table='tasks') or get_schema() for full table listing."
    ))
    async def get_schema(table: str | None = None) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                if table is None:
                    rows = await conn.fetch(
                        "SELECT relname, n_live_tup "
                        "FROM pg_stat_user_tables ORDER BY relname"
                    )
                    return json.dumps([
                        {"table": r["relname"], "estimated_rows": r["n_live_tup"]}
                        for r in rows
                    ])

                cols = await conn.fetch(
                    "SELECT c.column_name, c.data_type, c.udt_name, "
                    "c.is_nullable, c.column_default "
                    "FROM information_schema.columns c "
                    "WHERE c.table_schema = 'public' AND c.table_name = $1 "
                    "ORDER BY c.ordinal_position", table,
                )
                if not cols:
                    return json.dumps({"error": f"Table '{table}' not found."})

                constraints = await conn.fetch(
                    "SELECT conname, contype, "
                    "pg_get_constraintdef(oid) AS definition "
                    "FROM pg_constraint WHERE conrelid = $1::regclass", table,
                )

                if table in ALLOWED_TABLES:
                    count_row = await conn.fetchrow(f"SELECT count(*) AS cnt FROM {table}")
                else:
                    count_row = await conn.fetchrow(
                        "SELECT n_live_tup AS cnt FROM pg_stat_user_tables "
                        "WHERE relname = $1", table,
                    )

                return json.dumps({
                    "table": table,
                    "row_count": _serialize(count_row["cnt"]) if count_row else 0,
                    "columns": [
                        {
                            "name": _serialize(c["column_name"]),
                            "type": _serialize(c["udt_name"]) if c["data_type"] == "USER-DEFINED" else _serialize(c["data_type"]),
                            "nullable": c["is_nullable"] == "YES",
                            "default": _serialize(c["column_default"]),
                        }
                        for c in cols
                    ],
                    "constraints": [
                        {
                            "name": _serialize(c["conname"]),
                            "type": _serialize(c["contype"]),
                            "definition": _serialize(c["definition"]),
                        }
                        for c in constraints
                    ],
                })
        except Exception as exc:
            return json.dumps({"error": f"Schema query failed: {exc}"})

    @mcp.tool(description=(
        "Search knowledge entries using semantic similarity (vector), "
        "BM25 full-text search, or hybrid mode (semantic first, BM25 fallback). "
        "mode: 'semantic'|'fulltext'|'hybrid' (default 'hybrid'). "
        "Supports filtering by domain (knowledge_domain enum), sub_domain, and project_slug. "
        "threshold: minimum similarity score 0.0-1.0 (default 0.3). "
        "Returns: {mode, results[], count, _meta}. "
        "Example: search_knowledge(query='deployment architecture', domain='technology', mode='hybrid', limit=5)"
    ))
    async def search_knowledge(
        query: str,
        domain: str | None = None,
        sub_domain: str | None = None,
        project_slug: str | None = None,
        mode: str = "hybrid",
        threshold: float = 0.3,
        limit: int = 10,
    ) -> str:
        pool = get_pool()
        try:
            # --- Semantic / Hybrid path ---
            if mode in ("semantic", "hybrid"):
                try:
                    embedding = await generate_query_embedding(query)

                    if embedding:
                        # Resolve project_id from slug when provided
                        project_id = None
                        if project_slug:
                            async with pool.acquire() as conn:
                                row = await conn.fetchrow(
                                    "SELECT id FROM projects WHERE slug = $1",
                                    project_slug,
                                )
                                project_id = row["id"] if row else None

                        # Call match_knowledge() SQL function
                        # Convert embedding list to pgvector string format
                        embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
                        async with pool.acquire() as conn:
                            rows = await conn.fetch(
                                "SELECT * FROM match_knowledge("
                                "$1::vector, $2, $3, $4::knowledge_domain, $5, $6)",
                                embedding_str,
                                threshold,
                                limit,
                                domain,
                                sub_domain,
                                project_id,
                            )

                        if rows or mode == "semantic":
                            return json.dumps({
                                "mode": "semantic",
                                "results": [_row_to_dict(r) for r in rows],
                                "count": len(rows),
                                "_meta": {"related_tools": ["query_db"], "search_mode": "semantic"},
                            })

                    elif mode == "semantic":
                        # Embedding generation failed and caller wants semantic only
                        return json.dumps({
                            "mode": "semantic",
                            "results": [],
                            "count": 0,
                            "warning": "Embedding generation unavailable — no results.",
                        })
                except Exception as sem_exc:
                    logger.warning(f"Semantic search failed, falling back to fulltext: {sem_exc}")
                    if mode == "semantic":
                        return json.dumps({"error": f"Semantic search failed: {sem_exc}"})

            # --- BM25 full-text fallback ---
            tsv = "to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))"
            tsq = "plainto_tsquery('english', $1)"
            sql = (
                f"SELECT id, title, left(content, 500) AS snippet, "
                f"domain::text, sub_domain, source_type::text, tags, "
                f"ts_rank({tsv}, {tsq}) AS rank "
                f"FROM knowledge_entries WHERE {tsv} @@ {tsq}"
            )
            params: list[Any] = [query]
            param_idx = 2

            if domain is not None:
                sql += f" AND domain = ${param_idx}::knowledge_domain"
                params.append(domain)
                param_idx += 1

            if sub_domain is not None:
                sql += f" AND sub_domain = ${param_idx}"
                params.append(sub_domain)
                param_idx += 1

            sql += f" ORDER BY rank DESC LIMIT ${param_idx}"
            params.append(limit)

            async with pool.acquire() as conn:
                rows = await conn.fetch(sql, *params)

            return json.dumps({
                "mode": "fulltext",
                "results": [_row_to_dict(r) for r in rows],
                "count": len(rows),
                "_meta": {"related_tools": ["query_db"], "search_mode": "fulltext"},
            })

        except Exception as exc:
            return json.dumps({"error": f"Search failed: {exc}"})

    @mcp.tool(description=(
        "Log a pipeline execution run. Looks up pipeline by slug, inserts a "
        "pipeline_runs record. Terminal statuses also set completed_at. "
        "status: 'running'|'success'|'failed'|'cancelled'. "
        "trigger_type: 'scheduled'|'manual'|'event'|'webhook'. "
        "Returns: {id, pipeline_id, status, trigger_type, started_at, completed_at, ...}. "
        "Example: log_pipeline_run(pipeline_slug='daily-brief', status='success', trigger_type='scheduled', tokens_used=1500, cost_estimate_usd=0.02)"
    ))
    async def log_pipeline_run(
        pipeline_slug: str, status: str, trigger_type: str,
        output_summary: str | None = None, error_message: str | None = None,
        tokens_used: int | None = None, cost_estimate_usd: float | None = None,
    ) -> str:
        valid_statuses = ("running", "success", "failed", "cancelled")
        valid_triggers = ("scheduled", "manual", "event", "webhook")
        if status not in valid_statuses:
            return json.dumps({"error": f"Invalid status '{status}'. Must be: {', '.join(valid_statuses)}"})
        if trigger_type not in valid_triggers:
            return json.dumps({"error": f"Invalid trigger_type '{trigger_type}'. Must be: {', '.join(valid_triggers)}"})

        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                pipeline = await conn.fetchrow(
                    "SELECT id FROM pipelines WHERE slug = $1", pipeline_slug,
                )
                if pipeline is None:
                    return json.dumps({"error": f"Pipeline '{pipeline_slug}' not found."})

                is_terminal = status in ("success", "failed", "cancelled")
                record = await conn.fetchrow(
                    "INSERT INTO pipeline_runs "
                    "(id, pipeline_id, status, trigger_type, triggered_by, "
                    " started_at, completed_at, output_summary, error_message, "
                    " tokens_used, cost_estimate_usd) "
                    "VALUES (uuid_generate_v4(), $1, $2::run_status, $3::trigger_type, "
                    " 'claude', now(), "
                    " CASE WHEN $4::boolean THEN now() ELSE NULL END, "
                    " $5, $6, $7, $8) RETURNING *",
                    pipeline["id"], status, trigger_type, is_terminal,
                    output_summary, error_message,
                    tokens_used or 0, cost_estimate_usd or 0,
                )
                return json.dumps(_row_to_dict(record))
        except Exception as exc:
            return json.dumps({"error": f"Pipeline run logging failed: {exc}"})
