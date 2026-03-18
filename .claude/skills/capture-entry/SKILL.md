---
name: capture-entry
description: "Capture journal entries or quick knowledge entries via MCP. Use when user says 'log journal', 'capture entry', 'quick entry', or starts message with 'Journal:' or 'Entry:'."
---

# Skill: Capture Entry

> **Scope:** This skill operates within the AI Operating System project only. It uses the MCP Gateway's capture_entry tool.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate when the user:
- Starts a message with **"Journal:"** — route to journal capture
- Starts a message with **"Entry:"** — route to quick capture
- Starts with **"Entry idea:"**, **"Entry epiphany:"**, **"Entry memory:"** — route to quick capture with subtype
- Says "log journal", "capture entry", "quick entry", or "save this thought"

Do NOT activate for general knowledge queries, search requests, or task management.

---

## Process

### Step 1: Detect Entry Type

Parse the user's message to determine type:

| Prefix | Type | capture_type |
|---|---|---|
| `Journal:` | journal | N/A |
| `Entry:` | quick | observation (default) |
| `Entry idea:` | quick | idea |
| `Entry epiphany:` | quick | epiphany |
| `Entry memory:` | quick | memory_recall |

### Step 2: Extract Metadata

**For journals:**
- Parse inline hints from the content: `mood=<text>` and `energy=<1-5>`
- Extract these before passing content to the tool
- Example: "Journal: mood=reflective energy=3. Quiet day..." → mood="reflective", energy_level=3, content="Quiet day..."

**For quick entries:**
- Detect if urgency is mentioned: "urgent", "high priority" → urgency="high"
- Detect domain references: "for work", "personal", domain names → domain slug

### Step 3: Call MCP Tool

Call the `capture_entry` MCP tool with parsed parameters:

```
capture_entry(
    type: "journal" | "quick",
    content: <extracted content>,
    mood: <if journal>,
    energy_level: <if journal>,
    capture_type: <if quick>,
    domain: <if detected>,
    tags: <if mentioned>,
    urgency: <if quick>
)
```

### Step 4: Confirm Storage

Respond with a concise confirmation:
- Journal: "Stored journal entry `<id>` at `<timestamp>`. <word_count> words."
- Quick: "Captured `<capture_type>`: `<title>` (`<id>`)"

Do NOT add commentary, suggestions, or follow-up questions unless the user asks.

---

## Examples

**Input:** "Journal: Had a productive sprint review. Team is aligned on v2 architecture. mood=energized energy=4"
**Action:** `capture_entry(type="journal", content="Had a productive sprint review. Team is aligned on v2 architecture.", mood="energized", energy_level=4)`
**Response:** "Stored journal entry `abc123` at 2026-03-18T14:30:00Z. 12 words."

**Input:** "Entry idea: What if the weekly review skill auto-generates a draft PR description?"
**Action:** `capture_entry(type="quick", content="What if the weekly review skill auto-generates a draft PR description?", capture_type="idea")`
**Response:** "Captured idea: What if the weekly review skill auto-generates a draft... (`def456`)"

**Input:** "Entry memory: Ramesh mentioned his cousin works at Google Cloud"
**Action:** `capture_entry(type="quick", content="Ramesh mentioned his cousin works at Google Cloud", capture_type="memory_recall")`
**Response:** "Captured memory_recall: Ramesh mentioned his cousin works at Google... (`ghi789`)"

---

## Connectors Used

- **MCP Gateway: capture_entry** — Primary tool for storing entries
