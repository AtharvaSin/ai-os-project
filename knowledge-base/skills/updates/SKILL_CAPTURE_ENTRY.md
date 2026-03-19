# Skill: Capture Entry

> **Scope:** Quick capture of thoughts, ideas, decisions, and observations into the journals table via MCP. Enables mobile-first capture from Claude.ai with auto-classification, domain tagging, and optional chaining to `/create-task` or knowledge base persistence.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary). Telegram bot handles `/j`, `/e` commands as a parallel capture path.
>
> **Version:** 1.0 — New skill closing the critical journals/capture tool gap.

---

## When to Use

Activate this workflow when the user wants to quickly capture a thought, log a journal entry, jot down an idea, or record a decision — without going through a formal task or document creation flow.

**Trigger phrases:** "capture", "log this", "journal", "quick note", "remember this", "jot down", "save this thought", "note to self", "capture entry", "quick entry", "log journal"

**Also activate when:** The user sends a freeform message that looks like a journal entry or quick capture — short, personal, reflective, or action-oriented without being a direct command. Use judgment: a 1-2 sentence observation about their day, a quick idea, or a reflection should trigger this skill with a confirmation prompt.

**Do NOT activate for:** Formal task creation (use `/create-task`), document drafting, email composition, or structured planning.

---

## Process

### Step 1: Capture the Entry

**Tool call:**

1. **`capture_entry`** → Write the entry to the journals table (AIOSMCP)
   - Params: `content` (the user's text), `entry_type` (auto-classified — see below)

### Step 2: Auto-Classify Entry Type

Before calling `capture_entry`, classify the entry:

| Signal | Classification | `entry_type` |
|--------|---------------|-------------|
| Contains action verb + deadline/target ("need to", "should", "must", "by Friday") | Task candidate | `task` |
| Contains "decided", "going with", "choosing", "will use", "settled on" | Decision | `decision` |
| Contains emotional language, reflection, "realized", "feeling", "noticed" | Observation | `observation` |
| Contains a question, hypothesis, or "what if" | Idea | `thought` |
| Default — none of the above | General thought | `thought` |

### Step 3: Suggest Domain Tag

**Tool call:**

2. **`list_domains`** → Get available Life Graph domains (AIOSMCP)

Based on the entry content, suggest the most relevant domain. Present it as a suggestion, not an auto-assignment:

> "Captured as **{entry_type}**. Suggested domain: **{domain_name}**. Correct?"

### Step 4: Optional Enrichment

If the entry seems related to existing knowledge:

3. **`search_knowledge`** → Find related knowledge entries (AIOSMCP)
   - If matches found: "This connects to: {related entry summary}. Want me to link them?"

### Step 5: Chain Actions Based on Type

**If `entry_type` = 'task':**
> "This sounds like a task. Want me to also create it as a formal task via `/create-task`?"
- If yes → invoke `/create-task` skill with the entry content as the task description

**If `entry_type` = 'decision':**
> "This is a decision. Want me to also log it to the knowledge base for future reference?"
- If yes → **`insert_record`** to `knowledge_entries` table with `type: 'decision'` (AIOSMCP)

**If entry connects to a recent conversation or project:**
> "Want me to push this to Telegram for reference?"
- If yes → **`send_telegram_message`** with a formatted capture confirmation (AIOSMCP)

### Step 6: Confirm

**Output format:**

```
Captured ✓
Type: {entry_type} | Domain: {domain_name}
{If linked: "Connected to: {related entry}"}
{If chained: "Also created as task #XXX" or "Also logged to knowledge base"}
```

---

## Batch Capture Mode

If the user sends multiple items at once (bullet list, numbered list, or multiple lines), process each as a separate capture:

1. Split into individual entries
2. Classify each independently
3. Call `capture_entry` for each
4. Present a summary table:

```
## Batch Capture — {count} entries

| # | Content (truncated) | Type | Domain |
|---|---------------------|------|--------|
| 1 | {first 50 chars}... | thought | career |
| 2 | {first 50 chars}... | task | health |
| 3 | {first 50 chars}... | decision | projects |

Tasks detected: {count} — create as formal tasks?
Decisions detected: {count} — log to knowledge base?
```

---

## Quality Rules

- **Speed over perfection.** Capture should feel instant. Don't over-prompt or ask too many questions. One confirmation is enough.
- **Preserve the user's words.** Store the original text as-is. Classification and tagging are metadata, not rewrites.
- **Domain suggestion, not assignment.** Always suggest, never auto-assign without confirmation.
- **Chain actions are optional.** Always ask before creating tasks or logging decisions. The capture itself should succeed without any chaining.
- **No empty captures.** If the user's text is too short (< 5 characters) or unintelligible, ask for clarification.

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `capture_entry` | Capture | Always — core capture action |
| `list_domains` | Life Graph | Domain tag suggestion |
| `search_knowledge` | PostgreSQL | Related knowledge lookup |
| `insert_record` | PostgreSQL | Decision → knowledge base persistence |
| `send_telegram_message` | Telegram | Optional notification push |

---

## Connectors Used

- **AIOSMCP** — Capture module (1 tool), Life Graph module (1 tool), PostgreSQL module (2 tools), Telegram module (1 tool)
