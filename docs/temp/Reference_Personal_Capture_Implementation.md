# AI OS -- Personal Capture System Implementation Reference

## MCP Gateway: capture_entry Tool

```python
@tool("capture_entry")
async def capture_entry(
    type: Literal["journal", "quick"],
    content: str,
    mood: Optional[str] = None,
    energy_level: Optional[int] = None,
    capture_type: Optional[Literal["idea", "epiphany", "memory_recall", "observation"]] = None,
    domain: Optional[str] = None,
    tags: Optional[List[str]] = None,
    urgency: Optional[Literal["low", "medium", "high"]] = None,
    linked_task_ids: Optional[List[str]] = None,
) -> dict:
    if type == "journal":
        record = await insert_journal(content, mood, energy_level, domain)
        return {"type": "journal", "id": record["id"], "created_at": record["created_at"]}
    elif type == "quick":
        entry = await insert_knowledge_entry(
            title=auto_generate_title(content),
            content=content,
            source_type="quick_capture",
            domain=domain or "personal",
            tags=(tags or []) + ["quick_capture"] + ([capture_type] if capture_type else []),
            metadata={
                "capture_type": capture_type or "observation",
                "urgency": urgency or "low",
                "linked_tasks": linked_task_ids or [],
                "source_interface": detect_source()
            }
        )
        return {"type": "quick", "id": entry["id"], "title": entry["title"]}
```

## Claude.ai Capture Convention

Claude.ai is the primary capture interface. No slash commands, no special project. Claude recognises these natural language prefixes in any conversation:

- "Journal:" → capture_entry(type="journal", content=everything after prefix)
- "Entry:" → capture_entry(type="quick", content=everything after prefix)
- "Entry idea:" → capture_entry(type="quick", capture_type="idea")
- "Entry epiphany:" → capture_entry(type="quick", capture_type="epiphany")
- "Entry memory:" → capture_entry(type="quick", capture_type="memory_recall")

For journals, inline metadata hints are parsed: "mood=frustrated energy=2" extracts mood and energy_level. Claude confirms storage with entry ID.

This requires zero infrastructure — Claude's existing MCP connector handles the tool call. The convention is maintained through Claude's contextual understanding of the AI OS system and user preferences.

## capture-entry SKILL.md (Claude Code Only)

```markdown
# capture-entry

## Trigger
"log journal", "capture entry", "quick entry", "Journal:", "Entry:"

## Process
1. Parse input: detect "Journal:" or "Entry:" prefix
2. For journals: extract optional mood= and energy= hints
3. For entries: detect subtype (idea:, epiphany:, memory:) if present
4. Call capture_entry MCP tool with parsed parameters
5. Confirm: "Stored [type] entry [id] at [timestamp]"

## Connectors
- MCP Gateway: capture_entry tool
```

## entry-analysis SKILL.md (Claude Code + Claude.ai)

```markdown
# entry-analysis

## Trigger
"analyse entries", "process entries", "review captures"

## Process

### 1. Gather recent quick entries
SELECT * FROM knowledge_entries
WHERE source_type = 'quick_capture'
AND (metadata->>'analysed_at') IS NULL
ORDER BY created_at DESC;

### 2. Gather current state
- Active tasks: status IN ('todo', 'in_progress')
- Active objectives: domain_context_items WHERE status = 'active'
- Recent knowledge entries for cross-referencing

### 3. Analyse
For each entry determine:
a. CREATE new task? -> Propose title, project, priority
b. MODIFY existing task? -> Propose task_id + changes
c. UPDATE objective? -> Propose objective changes
d. NEW knowledge worth preserving? -> Propose knowledge entry
e. CONNECT to existing? -> Propose knowledge_connection
f. SUPERSEDE/CONTRADICT existing? -> Flag for review

### 4. Present structured review
Format proposals with clear categories:
- NEW TASKS (with project, priority)
- TASK MODIFICATIONS (with task_id, change description)
- OBJECTIVE UPDATES (with domain, change)
- NEW KNOWLEDGE (with source_type, domain)
- NEW CONNECTIONS (with relationship_type)

### 5. Human approves/rejects each proposal

### 6. Apply approved changes via MCP tools

### 7. Mark entries as processed
Update metadata: analysed_at = now(), analysis_actions = [...]

## Connectors
- MCP Gateway: query_db, insert_record, create_task, update_task, search_knowledge
```

## journal-monthly-distill Cloud Run Service

### Claude Haiku System Prompt
```
You are analysing a month of personal journal entries. Extract:
1. Recurring themes (what keeps coming up?)
2. Mood/energy patterns (day-of-week or context correlations?)
3. Unresolved tensions or blockers mentioned repeatedly
4. Key decisions or realisations captured
5. Action items mentioned but not yet tracked

Output ONLY valid JSON:
{
  "themes": [{"title": "...", "evidence": "...", "frequency": N}],
  "patterns": [{"pattern": "...", "correlation": "..."}],
  "tensions": [{"tension": "...", "first_mentioned": "date", "still_active": bool}],
  "decisions": [{"decision": "...", "context": "..."}],
  "missed_actions": [{"action": "...", "from_date": "date", "priority": "..."}]
}
```

### Pipeline Registration
```sql
INSERT INTO pipelines (slug, name, description, schedule, is_active) VALUES (
    'journal-monthly-distill',
    'Journal Monthly Distillation',
    'Monthly batch processing of journal entries via Claude Haiku. Extracts themes, patterns, insights. Creates distilled knowledge entries with embeddings.',
    '0 3 28 * *',
    true
);
```

### Output Processing
For each theme -> knowledge_entry (source_type='journal_entry', domain='personal', tags=['journal_distill','monthly','YYYY-MM'])
For each missed_action -> flag in weekly review (not auto-create task, respects expert-in-the-loop principle)

## Additional MCP Tools

### list_journals
```python
@tool("list_journals")
async def list_journals(days_back: int = 7, mood: str = None, limit: int = 20) -> dict:
    # Query journals table with optional mood filter
    # Returns: entries with id, content preview (first 200 chars), mood, energy_level, created_at
```

### search_journals
```python
@tool("search_journals")
async def search_journals(query: str, days_back: int = 90, limit: int = 10) -> dict:
    # Full-text search on journals.content for recent entries
    # For historical/semantic search, redirect to search_knowledge (distilled entries)
```

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Journal table grows >10K entries/year | Medium | Low | Partition by month, archive after 1 year |
| Analysis skill produces low-quality proposals | Medium | Medium | Expert-in-the-loop: all changes need approval |
| Monthly distillation misses patterns | Low | Medium | Review output in weekly review |
| Quick entries pollute search results | Medium | Medium | Filter by source_type, lower confidence_score |
| Cost overrun from embedding volume | Low | Low | Monthly batch + existing 5-min cycle |
| Claude.ai misinterprets "Journal:" as conversation | Low | Low | MCP tool call is idempotent; worst case is a duplicate entry easily deleted |
