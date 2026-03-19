---
name: capture-entry
description: "Capture journal entries or quick knowledge entries via MCP. Use when user says 'log journal', 'capture entry', 'quick entry', or starts message with 'Journal:' or 'Entry:'."
---

# Skill: Capture Entry

> **Scope:** This skill operates within the AI Operating System project only. It uses the MCP Gateway's capture_entry tool and related enrichment tools.
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

### Step 1: Detect Entry Type and Classify

**Priority 1 — Prefix routing (takes precedence):**

Parse the user's message to determine type from explicit prefixes:

| Prefix | Type | capture_type |
|---|---|---|
| `Journal:` | journal | N/A |
| `Entry:` | quick | observation (default) |
| `Entry idea:` | quick | idea |
| `Entry epiphany:` | quick | epiphany |
| `Entry memory:` | quick | memory_recall |

If a prefix is present, use it directly. Skip auto-classification.

**Priority 2 — Auto-classification (when no prefix is present):**

When the user triggers capture without a prefix (e.g., "log this thought: ...", "capture entry: ..."), analyze the content to determine `entry_type` and `capture_type`:

| Content Signal | entry_type | capture_type |
|---|---|---|
| Action verb + deadline indicators: "need to", "should", "must", "by Friday", "before Monday", "deadline", "TODO" | quick | task |
| Decision language: "decided", "going with", "choosing", "settled on", "final call", "picking" | quick | decision |
| Emotional/reflective language: "realized", "feeling", "noticed", "struck me", "it hit me", "grateful" | quick | observation |
| Idea language: "what if", "could we", "imagine", "concept", "brainstorm" | quick | idea |
| Default (no strong signal) | quick | thought |

Apply the **first matching rule** — if the content contains signals from multiple categories, the first match in the table above wins. When genuinely ambiguous, default to `thought`.

### Step 2: Extract Metadata

**For journals:**
- Parse inline hints from the content: `mood=<text>` and `energy=<1-5>`
- Extract these before passing content to the tool
- Example: "Journal: mood=reflective energy=3. Quiet day..." -> mood="reflective", energy_level=3, content="Quiet day..."

**For quick entries:**
- Detect if urgency is mentioned: "urgent", "high priority" -> urgency="high"
- Detect domain references: "for work", "personal", domain names -> domain slug

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

### Step 5: Domain Suggestion

After confirming storage, call `list_domains` to retrieve the active Life Graph domains. Suggest the most relevant domain based on the entry content:

> "Suggested domain: **{domain_name}**. Correct?"

Match logic:
- Work/career/project mentions -> `career` or relevant work domain
- Personal growth, habits, health -> `health` or `personal-growth`
- Relationship/people mentions -> `relationships`
- Finance/money -> `finances`
- Creative/writing/content -> `creative` or `bharatvarsh` if lore-related
- If no strong match, suggest the most general applicable domain or skip the suggestion

If the user confirms, update the entry with the domain association. If the user corrects or declines, respect their choice silently.

### Step 6: Chain Actions Based on Type

Based on the detected or assigned `capture_type`, offer a single relevant follow-up action:

| capture_type | Follow-up Offer |
|---|---|
| `task` | "This sounds like a task. Create it via /create-task?" |
| `decision` | "Log this decision to the knowledge base?" — If accepted: `insert_record(table: "knowledge_entries", data: { entry_type: "decision", content: "<decision summary>", metadata: { context: "<surrounding context>", date: "<ISO date>" } })` |
| `idea` | No automatic follow-up (ideas are exploratory by nature) |
| `epiphany` | No automatic follow-up |
| `observation` | No automatic follow-up |
| `memory_recall` | No automatic follow-up |
| `thought` | No automatic follow-up |

Only offer ONE follow-up per capture. Never chain multiple prompts.

### Step 7: Related Knowledge Lookup (optional enrichment)

After the primary capture flow is complete, call `search_knowledge(query="<entry content summary>")` to check for related entries in the knowledge base.

- If **relevant matches found** (similarity above threshold): surface the top 1-2 connections:
  > "This connects to: **{related entry title/summary}**. Want to link them?"
- If **no relevant matches** or results are too generic: skip silently. Do not say "no related entries found."

If the user wants to link, create the association via the appropriate knowledge tool. If the user ignores or declines, move on.

This step should feel like a helpful nudge, not an interrogation. If the capture was a quick throwaway thought, skip the lookup entirely — use judgment based on content length and substance (entries under 10 words or purely logistical rarely benefit from knowledge linking).

---

## Examples

**Input:** "Journal: Had a productive sprint review. Team is aligned on v2 architecture. mood=energized energy=4"
**Action:** `capture_entry(type="journal", content="Had a productive sprint review. Team is aligned on v2 architecture.", mood="energized", energy_level=4)`
**Response:** "Stored journal entry `abc123` at 2026-03-18T14:30:00Z. 12 words."
**Domain suggestion:** "Suggested domain: **career**. Correct?"

**Input:** "Entry idea: What if the weekly review skill auto-generates a draft PR description?"
**Action:** `capture_entry(type="quick", content="What if the weekly review skill auto-generates a draft PR description?", capture_type="idea")`
**Response:** "Captured idea: What if the weekly review skill auto-generates a draft... (`def456`)"
**Domain suggestion:** "Suggested domain: **ai-os**. Correct?"

**Input:** "Entry memory: Ramesh mentioned his cousin works at Google Cloud"
**Action:** `capture_entry(type="quick", content="Ramesh mentioned his cousin works at Google Cloud", capture_type="memory_recall")`
**Response:** "Captured memory_recall: Ramesh mentioned his cousin works at Google... (`ghi789`)"
**Knowledge lookup:** "This connects to: **Ramesh Iyer — contact note about GCP interest**. Want to link them?"

**Input (auto-classified):** "capture entry: Need to finalize the deployment pipeline by Friday"
**Classification:** Contains "need to" + "by Friday" -> capture_type = `task`
**Action:** `capture_entry(type="quick", content="Need to finalize the deployment pipeline by Friday", capture_type="task")`
**Response:** "Captured task: Need to finalize the deployment pipeline by Friday (`jkl012`)"
**Follow-up:** "This sounds like a task. Create it via /create-task?"

**Input (auto-classified):** "save this thought: Going with PostgreSQL over DynamoDB for the contacts table — better joins"
**Classification:** Contains "going with" -> capture_type = `decision`
**Action:** `capture_entry(type="quick", content="Going with PostgreSQL over DynamoDB for the contacts table — better joins", capture_type="decision")`
**Response:** "Captured decision: Going with PostgreSQL over DynamoDB for the contacts... (`mno345`)"
**Follow-up:** "Log this decision to the knowledge base?"

---

## Connectors Used

- **MCP Gateway: capture_entry** — Primary tool for storing entries
- **MCP Gateway: list_domains** — Life Graph domain lookup for domain suggestion
- **MCP Gateway: search_knowledge** — Related knowledge lookup for entry enrichment
- **MCP Gateway: insert_record** — Knowledge base logging for decisions and linked entries
