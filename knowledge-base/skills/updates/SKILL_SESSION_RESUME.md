# Skill: Session Resume v2.0

> **Scope:** Context recovery from past sessions, system state changes, and the OS's own activity since the last interaction. Bridges the gap between conversations so every session starts warm, not cold.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary).
>
> **Version:** 2.0 — Upgraded from chat-search-only to full system-state-aware resume with task tracking, knowledge entries, and session handoff context.

---

## When to Use

Activate this workflow when the user wants to pick up where they left off or understand what happened since their last session.

**Trigger phrases:** "resume", "pick up where I left off", "what were we working on", "continue", "session resume", "what happened since last time", "catch me up", "where were we", "last session"

**Also activate when:** The user returns after a gap of >4 hours and seems to be continuing prior work rather than starting something new. Offer: "Want me to pull up what we were working on?"

---

## Process

### Step 1: Recover Conversation Context

1. **Recent conversations** → Scan last 3 conversations (Claude native `recent_chats`)
   - Extract: key topics, open threads, unfinished work, decisions made
   - Identify: the primary workstream from the last session

2. **Topic-specific search** → If the user hints at a specific topic (Claude native `conversation_search`)
   - Query: the topic keyword(s) the user mentioned
   - Pull: relevant conversation snippets

### Step 2: Query System State Changes

3. **`search_knowledge`** → Decisions and context items from last 7 days (AIOSMCP)
   - Query: knowledge entries created or modified since last active session
   - Surface: decisions, insights, research findings

4. **`query_db`** → Tasks created or completed since last session (AIOSMCP)
   ```sql
   SELECT title, domain_slug, status, priority,
          CASE WHEN status = 'completed' THEN 'completed' ELSE 'created' END as change_type
   FROM tasks
   WHERE updated_at > '{last_session_timestamp}'
   ORDER BY updated_at DESC
   LIMIT 10
   ```

5. **`query_db`** → Check for session handoff context (AIOSMCP)
   ```sql
   SELECT content, metadata, created_at
   FROM knowledge_entries
   WHERE entry_type = 'session-handoff'
   ORDER BY created_at DESC
   LIMIT 1
   ```
   - Graceful fallback if no handoff row exists — this is expected for most sessions

### Step 3: Compose the Resume

**Output format:**

```
## Session Resume

### Last Session
{What was discussed — key topics, decisions, open threads}
{Primary workstream: "{description}"}

### Since Then
**Tasks completed:** {count}
{Bulleted list of completed tasks with domain}

**Tasks added:** {count}
{Bulleted list of new tasks with domain and priority}

**Decisions recorded:** {count}
{Bulleted list of decisions from knowledge_entries}

**Pipeline activity:**
{Any notable pipeline runs — daily brief, knowledge sync, etc.}

### Handoff Context
{Content from session_handoff knowledge entry if available}
{If no handoff: "No formal handoff from last session."}

### Suggested Starting Point
{AI recommendation based on:
 - Unfinished work from last session
 - Highest priority open task
 - Any time-sensitive items (overdue tasks, upcoming deadlines)
 - Domain health alerts if any domain is critical}

> Ready to pick up from here, or want to start something new?
```

---

## Session End: Create Handoff

At the **end** of any significant session, proactively offer to create a handoff entry:

> "Want me to save a session handoff for next time?"

If yes:

1. Summarize: what was worked on, what's still open, any blockers
2. **`insert_record`** → Save to `knowledge_entries` (AIOSMCP)
   - Params: `table: 'knowledge_entries'`, `entry_type: 'session-handoff'`, `content: {summary}`

This handoff is what Step 2.5 retrieves in the next session.

---

## Quality Rules

- **Speed first.** The resume should generate quickly. Don't wait for all enrichment — show what's available.
- **Don't overwhelm.** If there are 50 tasks changed since last session, summarize by domain/priority rather than listing all.
- **Handoff is optional.** Never auto-create a handoff without asking. The user may not want one.
- **Timestamp awareness.** Use relative time ("2 hours ago", "yesterday") for recent changes, absolute dates for older ones.
- **Graceful with gaps.** If there's no recent conversation history (e.g., first session in a while), focus on system state and skip the "Last Session" section.

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `search_knowledge` | PostgreSQL (AIOSMCP) | Recent decisions and context |
| `query_db` | PostgreSQL (AIOSMCP) | Task changes, session handoff, pipeline runs |
| `insert_record` | PostgreSQL (AIOSMCP) | Creating session handoff entries |

---

## Connectors Used

- **AIOSMCP** — PostgreSQL module (3 tools)
- **Claude native** — `recent_chats`, `conversation_search` (for conversation context recovery)
