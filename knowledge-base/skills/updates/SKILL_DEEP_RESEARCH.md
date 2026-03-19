# Skill: Deep Research v2.0

> **Scope:** Multi-source research synthesized into structured blueprints. Checks Google Drive first, then web, then synthesizes. Now with automatic write-back to the knowledge base so research findings persist beyond the chat session.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary).
>
> **Version:** 2.0 — Minor upgrade adding knowledge persistence and pipeline logging.

---

## When to Use

Activate this workflow when the user asks you to research, investigate, evaluate, compare, deep-dive, or build understanding of any topic.

**Trigger phrases:** "research", "look into", "evaluate", "compare", "deep dive", "investigate", "what's the state of", "how does {X} work", "find out about", "analyze {topic}", "build me a brief on"

**Do NOT use for:** Quick factual lookups (just answer directly), Bharatvarsh lore queries (use `/bharatvarsh` lore check mode), or technology evaluation against the reference architecture (use `/tech-eval`).

---

## Process

### Step 1: Check Existing Knowledge

Before going to the web, check if the answer already exists:

1. **`search_knowledge`** → Check knowledge base for existing research on this topic (AIOSMCP)
   - If recent research exists (< 30 days old), present it and ask: "I found existing research on this from {date}. Use this as a starting point, or start fresh?"

2. **`list_drive_files`** → Check Google Drive for relevant documents (AIOSMCP)
   - Search for: topic keywords in file names and descriptions
   - If relevant docs found, read them first

3. **`read_drive_file`** → Read any relevant Drive documents (AIOSMCP)

### Step 2: Web Research

4. **Web search** → Structured queries across multiple angles (Claude native)
   - Query 1: "{topic} overview current state"
   - Query 2: "{topic} best practices" or "{topic} comparison"
   - Query 3: "{topic} risks challenges limitations"

5. **Synthesize** — Don't just collect links. Analyze, compare, and form insights.

### Step 3: Structure the Findings

**Output format:**

```
## Research Brief — {Topic}

**Date:** {today}
**Depth:** {Quick scan / Standard / Deep dive}
**Sources:** {count} sources consulted

### Executive Summary
{3-5 sentences — the key finding in plain language}

### Key Findings
1. {Finding with evidence}
2. {Finding with evidence}
3. ...

### Comparison (if applicable)
| Criterion | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| ... | ... | ... | ... |

### Risks & Limitations
{What to watch out for, potential downsides}

### Recommendations
{Actionable next steps based on findings}

### Sources
{Numbered list of sources with brief descriptions}
```

### Step 4: Persist Findings (NEW in v2.0)

6. **`insert_record`** → Save research to knowledge_entries (AIOSMCP)
   - Params: `table: 'knowledge_entries'`, `entry_type: 'research'`, `content: {topic, key_findings_summary, source_count, date}`
   - This makes the research discoverable by other skills (`/morning-brief`, `/action-planner`, etc.)

7. **`log_pipeline_run`** → Track execution (AIOSMCP)
   - Params: `slug: 'deep-research'`, `status: 'success'`, `metadata: {topic, depth, source_count}`

### Step 5: Offer Follow-Up

After presenting findings:
- "Want me to save the full brief to Google Drive?" → use `upload_file` or `create_doc`
- "Want me to create tasks based on the recommendations?" → chain to `/action-planner`
- "Want me to evaluate a specific option from this research?" → chain to `/tech-eval`

---

## Quality Rules

- **Check before searching.** Always look in knowledge base and Drive first. Don't re-research what's already documented.
- **Synthesize, don't summarize.** The value is in analysis and insight, not in listing what search results say.
- **Source attribution.** Every claim must be traceable to a source.
- **Recency matters.** Flag if sources are >12 months old for fast-moving topics.
- **Knowledge persistence is mandatory.** Always call `insert_record` after research — findings that only live in chat are lost within 24 hours.
- **Pipeline logging is mandatory.** Always call `log_pipeline_run`.

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `search_knowledge` | PostgreSQL (AIOSMCP) | Check existing research |
| `list_drive_files` | Drive Read (AIOSMCP) | Check Drive for docs |
| `read_drive_file` | Drive Read (AIOSMCP) | Read relevant Drive docs |
| `insert_record` | PostgreSQL (AIOSMCP) | Persist findings to knowledge_entries |
| `log_pipeline_run` | PostgreSQL (AIOSMCP) | Execution logging |

---

## Connectors Used

- **AIOSMCP** — PostgreSQL module (2 tools), Drive Read module (2 tools)
- **Claude native** — Web search for external research
- **Google Drive** — Existing document reference
