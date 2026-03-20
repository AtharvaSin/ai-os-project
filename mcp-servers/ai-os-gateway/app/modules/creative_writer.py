"""Creative Writer MCP tools for the AI OS Gateway.

Provides 8 tools for managing creative writing projects, brainstorming,
and versioned writing outputs:
- create_creative_project: Create project + auto-populate Truby's 22 steps
- get_creative_project: Full project with steps, stats, output counts
- list_creative_projects: Filter by status, type, universe
- update_project_step: Advance/update a Truby step
- save_writing_output: Persist draft with auto-versioning
- get_writing_outputs: Retrieve past drafts with filtering
- create_brainstorm_session: Start a brainstorm session
- update_brainstorm_session: Add ideas, select winners, conclude
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from fastmcp import FastMCP


# ── Truby's 22 Steps ────────────────────────────────────────────────────
TRUBY_22_STEPS = [
    (1, "Self-Revelation, Need, Desire"),
    (2, "Ghost and Story World"),
    (3, "Weakness and Need"),
    (4, "Inciting Event"),
    (5, "Desire"),
    (6, "Ally or Allies"),
    (7, "Opponent and/or Mystery"),
    (8, "Fake-Ally Opponent"),
    (9, "First Revelation and Decision"),
    (10, "Plan"),
    (11, "Opponent's Plan and Counterattack"),
    (12, "Drive"),
    (13, "Attack by Ally"),
    (14, "Apparent Defeat"),
    (15, "Second Revelation and Decision"),
    (16, "Audience Revelation"),
    (17, "Third Revelation and Decision"),
    (18, "Gate, Gauntlet, Visit to Death"),
    (19, "Battle"),
    (20, "Self-Revelation"),
    (21, "Moral Decision"),
    (22, "New Equilibrium"),
]

# Project types that get Truby's 22 steps auto-populated
NARRATIVE_TYPES = {"novel", "comic_series", "screenplay", "anthology"}


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


def _slugify(text: str) -> str:
    """Convert text to a URL-safe slug."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register all creative writer tools on the given FastMCP instance."""

    # ── 1. create_creative_project ──────────────────────────────────────

    @mcp.tool(description=(
        "Create a new creative writing project. For narrative types (novel, comic_series, "
        "screenplay, anthology), auto-populates Truby's 22-step story structure. "
        "title: project title (required). "
        "project_type: novel|comic_series|blog_series|screenplay|poetry_collection|anthology|custom. "
        "genre: array of genre strings. "
        "logline: one-sentence premise. "
        "universe: optional universe name ('bharatvarsh' loads lore context). "
        "target_word_count: target total word count. "
        "domain_id: UUID of life_domains row to link. "
        "Returns: {project, steps_created, _meta}. "
        "Example: create_creative_project(title='The Last Signal', project_type='novel', "
        "genre=['sci-fi', 'thriller'], logline='A lone engineer decodes an alien signal...', "
        "universe='bharatvarsh')."
    ))
    async def create_creative_project(
        title: str,
        project_type: str,
        genre: list[str] | None = None,
        logline: str | None = None,
        synopsis: str | None = None,
        universe: str | None = None,
        target_word_count: int | None = None,
        domain_id: str | None = None,
        tags: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> str:
        pool = get_pool()
        slug = _slugify(title)

        try:
            async with pool.acquire() as conn:
                # Check slug uniqueness
                existing = await conn.fetchval(
                    "SELECT id FROM creative_projects WHERE slug = $1", slug
                )
                if existing:
                    slug = f"{slug}-{str(uuid.uuid4())[:8]}"

                project = await conn.fetchrow(
                    "INSERT INTO creative_projects "
                    "(id, title, slug, project_type, genre, logline, synopsis, "
                    " universe, target_word_count, domain_id, tags, metadata) "
                    "VALUES (uuid_generate_v4(), $1, $2, $3::creative_project_type, "
                    " $4, $5, $6, $7, $8, $9::uuid, $10, $11::jsonb) "
                    "RETURNING *",
                    title, slug, project_type,
                    genre or [],
                    logline, synopsis, universe,
                    target_word_count,
                    domain_id,
                    tags or [],
                    json.dumps(metadata or {}),
                )

                project_id = project["id"]
                steps_created = 0

                # Auto-populate Truby's 22 steps for narrative types
                if project_type in NARRATIVE_TYPES:
                    for step_num, step_name in TRUBY_22_STEPS:
                        await conn.execute(
                            "INSERT INTO creative_project_steps "
                            "(id, project_id, step_number, step_name, step_type) "
                            "VALUES (uuid_generate_v4(), $1, $2, $3, 'truby')",
                            project_id, step_num, step_name,
                        )
                        steps_created += 1

                result = _row_to_dict(project)
                result["steps_created"] = steps_created
                result["_meta"] = {
                    "related_tools": [
                        "get_creative_project", "update_project_step",
                        "create_brainstorm_session", "save_writing_output",
                    ],
                }

                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Failed to create project: {exc}"})

    # ── 2. get_creative_project ─────────────────────────────────────────

    @mcp.tool(description=(
        "Get a creative project by slug with all steps, stats, and output counts. "
        "slug: the project's unique slug. "
        "Returns: full project data with steps array, brainstorm_count, output_count. "
        "Example: get_creative_project(slug='the-last-signal'). "
        "Returns: {id, title, slug, status, steps: [{step_number, step_name, status, content}], "
        "brainstorm_count, output_count, stats, _meta}."
    ))
    async def get_creative_project(slug: str) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                project = await conn.fetchrow(
                    "SELECT * FROM creative_projects WHERE slug = $1", slug
                )
                if not project:
                    return json.dumps({"error": f"Project not found: {slug}"})

                result = _row_to_dict(project)
                project_id = project["id"]

                # Fetch all steps
                step_rows = await conn.fetch(
                    "SELECT * FROM creative_project_steps "
                    "WHERE project_id = $1 ORDER BY step_number ASC",
                    project_id,
                )
                result["steps"] = [_row_to_dict(s) for s in step_rows]

                # Count brainstorm sessions
                brainstorm_count = await conn.fetchval(
                    "SELECT count(*) FROM brainstorm_sessions WHERE project_id = $1",
                    project_id,
                )
                result["brainstorm_count"] = brainstorm_count

                # Count writing outputs
                output_count = await conn.fetchval(
                    "SELECT count(*) FROM writing_outputs WHERE project_id = $1",
                    project_id,
                )
                result["output_count"] = output_count

                # Step completion stats
                total_steps = len(step_rows)
                completed = sum(1 for s in step_rows if s["status"] == "complete")
                next_pending = next(
                    (s["step_number"] for s in step_rows if s["status"] == "pending"),
                    None,
                )

                result["stats"] = {
                    "total_steps": total_steps,
                    "completed_steps": completed,
                    "progress_pct": round(completed / total_steps * 100) if total_steps else 0,
                    "next_pending_step": next_pending,
                }

                result["_meta"] = {
                    "related_tools": [
                        "update_project_step", "save_writing_output",
                        "create_brainstorm_session", "list_creative_projects",
                    ],
                }
                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Failed to get project: {exc}"})

    # ── 3. list_creative_projects ───────────────────────────────────────

    @mcp.tool(description=(
        "List creative projects with optional filtering. "
        "status: filter by project status (ideation|outlining|drafting|revising|editing|complete|paused|abandoned). "
        "project_type: filter by type (novel|comic_series|blog_series|screenplay|poetry_collection|anthology|custom). "
        "universe: filter by universe name. "
        "limit: max results (default 20). "
        "Returns: {projects: [{id, title, slug, project_type, status, universe, logline, progress}], count, filters, _meta}. "
        "Example: list_creative_projects(status='drafting', project_type='novel', limit=10)."
    ))
    async def list_creative_projects(
        status: str | None = None,
        project_type: str | None = None,
        universe: str | None = None,
        limit: int = 20,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                conditions: list[str] = []
                params: list[Any] = []
                idx = 1

                if status:
                    conditions.append(f"cp.status = ${idx}::creative_project_status")
                    params.append(status)
                    idx += 1

                if project_type:
                    conditions.append(f"cp.project_type = ${idx}::creative_project_type")
                    params.append(project_type)
                    idx += 1

                if universe:
                    conditions.append(f"cp.universe = ${idx}")
                    params.append(universe)
                    idx += 1

                where = (" WHERE " + " AND ".join(conditions)) if conditions else ""
                safe_limit = min(limit, 50)
                params.append(safe_limit)

                sql = (
                    f"SELECT cp.id, cp.title, cp.slug, cp.project_type, cp.status, "
                    f"cp.universe, cp.genre, cp.logline, cp.target_word_count, "
                    f"cp.current_word_count, cp.tags, cp.created_at, cp.updated_at, "
                    f"(SELECT count(*) FROM creative_project_steps s "
                    f" WHERE s.project_id = cp.id AND s.status = 'complete') AS completed_steps, "
                    f"(SELECT count(*) FROM creative_project_steps s "
                    f" WHERE s.project_id = cp.id) AS total_steps "
                    f"FROM creative_projects cp"
                    f"{where} "
                    f"ORDER BY cp.updated_at DESC "
                    f"LIMIT ${idx}"
                )

                rows = await conn.fetch(sql, *params)
                projects = []
                for r in rows:
                    p = _row_to_dict(r)
                    total = r["total_steps"] or 0
                    done = r["completed_steps"] or 0
                    p["progress_pct"] = round(done / total * 100) if total else 0
                    projects.append(p)

                return json.dumps({
                    "projects": projects,
                    "count": len(projects),
                    "filters": {
                        "status": status,
                        "project_type": project_type,
                        "universe": universe,
                    },
                    "_meta": {
                        "related_tools": [
                            "get_creative_project", "create_creative_project",
                        ],
                    },
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to list projects: {exc}"})

    # ── 4. update_project_step ──────────────────────────────────────────

    @mcp.tool(description=(
        "Update a Truby step on a creative project. Advances status, records content and decisions. "
        "project_slug: the project's slug. "
        "step_number: which step to update (1-22 for Truby, 100+ for custom). "
        "status: new status (pending|active|complete|skipped). "
        "content: written content or notes for this step. "
        "description: how this step applies to the project. "
        "decisions: list of key decisions made (array of strings). "
        "Returns: updated step record with project context. "
        "Example: update_project_step(project_slug='the-last-signal', step_number=1, "
        "status='complete', content='Protagonist is blind to their need for human connection...', "
        "decisions=['Hero starts isolated', 'Need = belonging'])."
    ))
    async def update_project_step(
        project_slug: str,
        step_number: int,
        status: str | None = None,
        content: str | None = None,
        description: str | None = None,
        decisions: list[str] | None = None,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                # Resolve project
                project = await conn.fetchrow(
                    "SELECT id, title FROM creative_projects WHERE slug = $1",
                    project_slug,
                )
                if not project:
                    return json.dumps({"error": f"Project not found: {project_slug}"})

                # Build dynamic SET clause
                sets: list[str] = []
                params: list[Any] = []
                idx = 1

                if status:
                    sets.append(f"status = ${idx}")
                    params.append(status)
                    idx += 1

                if content is not None:
                    sets.append(f"content = ${idx}")
                    params.append(content)
                    idx += 1

                if description is not None:
                    sets.append(f"description = ${idx}")
                    params.append(description)
                    idx += 1

                if decisions is not None:
                    sets.append(f"decisions = ${idx}::jsonb")
                    params.append(json.dumps(decisions))
                    idx += 1

                if not sets:
                    return json.dumps({"error": "No fields to update."})

                set_clause = ", ".join(sets)
                params.extend([project["id"], step_number])

                sql = (
                    f"UPDATE creative_project_steps SET {set_clause} "
                    f"WHERE project_id = ${idx} AND step_number = ${idx + 1} "
                    f"RETURNING *"
                )

                step = await conn.fetchrow(sql, *params)
                if not step:
                    return json.dumps({
                        "error": f"Step {step_number} not found in project '{project_slug}'"
                    })

                result = _row_to_dict(step)
                result["project_title"] = project["title"]
                result["project_slug"] = project_slug
                result["_meta"] = {
                    "related_tools": [
                        "get_creative_project", "save_writing_output",
                    ],
                }
                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Failed to update step: {exc}"})

    # ── 5. save_writing_output ──────────────────────────────────────────

    @mcp.tool(description=(
        "Save a writing draft with auto-versioning. Creates a new row — never overwrites. "
        "title: output title (required). "
        "content: full text of the draft (required). "
        "output_type: blog|article|headline|slogan|caption|poem|script|chapter|scene|vignette|essay|ad_copy|social_post|custom. "
        "project_slug: link to a creative project (optional — null for quick-mode). "
        "step_number: link to a specific Truby step (optional). "
        "platform: target platform (linkedin, twitter, blog, etc.). "
        "tone: writing tone (formal, casual, playful, etc.). "
        "audience: target audience description. "
        "parent_output_id: UUID of previous version for revision chain. "
        "Returns: {id, title, version, word_count, _meta}. "
        "Example: save_writing_output(title='AI Agents Are the New APIs', content='...', "
        "output_type='blog', platform='linkedin', tone='authoritative')."
    ))
    async def save_writing_output(
        title: str,
        content: str,
        output_type: str,
        project_slug: str | None = None,
        step_number: int | None = None,
        platform: str | None = None,
        tone: str | None = None,
        audience: str | None = None,
        parent_output_id: str | None = None,
        tags: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                project_id = None
                step_id = None

                # Resolve project if provided
                if project_slug:
                    proj = await conn.fetchrow(
                        "SELECT id FROM creative_projects WHERE slug = $1",
                        project_slug,
                    )
                    if proj:
                        project_id = proj["id"]

                        # Resolve step if provided
                        if step_number is not None:
                            step = await conn.fetchrow(
                                "SELECT id FROM creative_project_steps "
                                "WHERE project_id = $1 AND step_number = $2",
                                project_id, step_number,
                            )
                            if step:
                                step_id = step["id"]

                # Calculate version
                version = 1
                if parent_output_id:
                    parent_version = await conn.fetchval(
                        "SELECT version FROM writing_outputs WHERE id = $1::uuid",
                        parent_output_id,
                    )
                    if parent_version:
                        version = parent_version + 1

                word_count = len(content.split())

                record = await conn.fetchrow(
                    "INSERT INTO writing_outputs "
                    "(id, project_id, step_id, output_type, title, content, "
                    " version, word_count, platform, tone, audience, "
                    " parent_output_id, tags, metadata) "
                    "VALUES (uuid_generate_v4(), $1, $2, $3::writing_output_type, "
                    " $4, $5, $6, $7, $8, $9, $10, $11::uuid, $12, $13::jsonb) "
                    "RETURNING *",
                    project_id, step_id, output_type,
                    title, content, version, word_count,
                    platform, tone, audience,
                    parent_output_id,
                    tags or [],
                    json.dumps(metadata or {}),
                )

                # Update project word count if linked
                if project_id:
                    await conn.execute(
                        "UPDATE creative_projects "
                        "SET current_word_count = ("
                        "  SELECT coalesce(sum(word_count), 0) "
                        "  FROM writing_outputs WHERE project_id = $1"
                        ") WHERE id = $1",
                        project_id,
                    )

                result = _row_to_dict(record)
                result["_meta"] = {
                    "related_tools": [
                        "get_writing_outputs", "get_creative_project",
                    ],
                }
                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Failed to save output: {exc}"})

    # ── 6. get_writing_outputs ──────────────────────────────────────────

    @mcp.tool(description=(
        "Retrieve writing outputs with flexible filtering. "
        "project_slug: filter by project. "
        "output_type: filter by type (blog|article|chapter|scene|etc). "
        "search: full-text search in title and content. "
        "limit: max results (default 20). "
        "Returns: {outputs: [{id, title, output_type, version, word_count, platform, created_at}], count, _meta}. "
        "Example: get_writing_outputs(project_slug='the-last-signal', output_type='chapter', limit=5)."
    ))
    async def get_writing_outputs(
        project_slug: str | None = None,
        output_type: str | None = None,
        search: str | None = None,
        limit: int = 20,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                conditions: list[str] = []
                params: list[Any] = []
                idx = 1

                if project_slug:
                    proj = await conn.fetchrow(
                        "SELECT id FROM creative_projects WHERE slug = $1",
                        project_slug,
                    )
                    if proj:
                        conditions.append(f"wo.project_id = ${idx}")
                        params.append(proj["id"])
                        idx += 1
                    else:
                        return json.dumps({"error": f"Project not found: {project_slug}"})

                if output_type:
                    conditions.append(f"wo.output_type = ${idx}::writing_output_type")
                    params.append(output_type)
                    idx += 1

                if search:
                    conditions.append(
                        f"to_tsvector('english', coalesce(wo.title,'') || ' ' || "
                        f"coalesce(wo.content,'')) "
                        f"@@ plainto_tsquery('english', ${idx})"
                    )
                    params.append(search)
                    idx += 1

                where = (" WHERE " + " AND ".join(conditions)) if conditions else ""
                safe_limit = min(limit, 50)
                params.append(safe_limit)

                sql = (
                    f"SELECT wo.id, wo.title, wo.output_type, wo.version, "
                    f"wo.word_count, wo.platform, wo.tone, wo.audience, "
                    f"wo.parent_output_id, wo.tags, wo.created_at, "
                    f"left(wo.content, 500) AS content_preview, "
                    f"cp.title AS project_title, cp.slug AS project_slug "
                    f"FROM writing_outputs wo "
                    f"LEFT JOIN creative_projects cp ON wo.project_id = cp.id"
                    f"{where} "
                    f"ORDER BY wo.created_at DESC "
                    f"LIMIT ${idx}"
                )

                rows = await conn.fetch(sql, *params)
                outputs = [_row_to_dict(r) for r in rows]

                return json.dumps({
                    "outputs": outputs,
                    "count": len(outputs),
                    "filters": {
                        "project_slug": project_slug,
                        "output_type": output_type,
                        "search": search,
                    },
                    "_meta": {
                        "related_tools": [
                            "save_writing_output", "get_creative_project",
                        ],
                    },
                })
        except Exception as exc:
            return json.dumps({"error": f"Failed to get outputs: {exc}"})

    # ── 7. create_brainstorm_session ────────────────────────────────────

    @mcp.tool(description=(
        "Start a brainstorm session. Can be standalone or linked to a project. "
        "title: session title (required). "
        "method: socratic|constraint|character_driven|theme_exploration|genre_fusion|yes_and|mind_map. "
        "prompt: seed question, constraint, or starting thought. "
        "project_slug: link to a creative project (optional). "
        "constraints: list of constraints for constraint method. "
        "Returns: {id, title, method, project_title, _meta}. "
        "Example: create_brainstorm_session(title='Protagonist Motivation', "
        "method='socratic', prompt='Why does the hero leave their safe world?', "
        "project_slug='the-last-signal')."
    ))
    async def create_brainstorm_session(
        title: str,
        method: str | None = None,
        prompt: str | None = None,
        project_slug: str | None = None,
        constraints: list[str] | None = None,
        tags: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                project_id = None
                project_title = None

                if project_slug:
                    proj = await conn.fetchrow(
                        "SELECT id, title FROM creative_projects WHERE slug = $1",
                        project_slug,
                    )
                    if proj:
                        project_id = proj["id"]
                        project_title = proj["title"]

                record = await conn.fetchrow(
                    "INSERT INTO brainstorm_sessions "
                    "(id, project_id, title, method, prompt, constraints, tags, metadata) "
                    "VALUES (uuid_generate_v4(), $1, $2, $3::brainstorm_method, "
                    " $4, $5::jsonb, $6, $7::jsonb) "
                    "RETURNING *",
                    project_id, title,
                    method,
                    prompt,
                    json.dumps(constraints or []),
                    tags or [],
                    json.dumps(metadata or {}),
                )

                result = _row_to_dict(record)
                if project_title:
                    result["project_title"] = project_title
                result["_meta"] = {
                    "related_tools": [
                        "update_brainstorm_session", "create_creative_project",
                        "save_writing_output",
                    ],
                }
                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Failed to create brainstorm session: {exc}"})

    # ── 8. update_brainstorm_session ────────────────────────────────────

    @mcp.tool(description=(
        "Update a brainstorm session — add ideas, select winners, or conclude. "
        "session_id: UUID of the session. "
        "ideas: array of idea objects [{idea, score, notes, is_selected, source}]. "
        "  source: untagged = user said it, 'ai' = AI suggestion. "
        "selected_ideas: array of promoted idea objects. "
        "conclusion: final synthesis text. "
        "Returns: updated session with all ideas and selections. "
        "Example: update_brainstorm_session(session_id='...', "
        "ideas=[{\"idea\": \"Hero discovers hidden message\", \"source\": \"user\", \"score\": 8}], "
        "conclusion='Going with the hidden message angle — ties into theme of truth vs. secrecy')."
    ))
    async def update_brainstorm_session(
        session_id: str,
        ideas: list[dict[str, Any]] | None = None,
        selected_ideas: list[dict[str, Any]] | None = None,
        conclusion: str | None = None,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                # Fetch current session
                session = await conn.fetchrow(
                    "SELECT * FROM brainstorm_sessions WHERE id = $1::uuid",
                    session_id,
                )
                if not session:
                    return json.dumps({"error": f"Session not found: {session_id}"})

                sets: list[str] = []
                params: list[Any] = []
                idx = 1

                if ideas is not None:
                    # Append new ideas to existing
                    existing_ideas = json.loads(session["ideas"]) if isinstance(session["ideas"], str) else (session["ideas"] or [])
                    merged = existing_ideas + ideas
                    sets.append(f"ideas = ${idx}::jsonb")
                    params.append(json.dumps(merged))
                    idx += 1

                if selected_ideas is not None:
                    sets.append(f"selected_ideas = ${idx}::jsonb")
                    params.append(json.dumps(selected_ideas))
                    idx += 1

                if conclusion is not None:
                    sets.append(f"conclusion = ${idx}")
                    params.append(conclusion)
                    idx += 1

                if not sets:
                    return json.dumps({"error": "No fields to update."})

                set_clause = ", ".join(sets)
                params.append(session_id)

                sql = (
                    f"UPDATE brainstorm_sessions SET {set_clause} "
                    f"WHERE id = ${idx}::uuid RETURNING *"
                )

                updated = await conn.fetchrow(sql, *params)
                result = _row_to_dict(updated)
                result["_meta"] = {
                    "related_tools": [
                        "create_brainstorm_session", "create_creative_project",
                        "save_writing_output",
                    ],
                }
                return json.dumps(result)
        except Exception as exc:
            return json.dumps({"error": f"Failed to update brainstorm session: {exc}"})
