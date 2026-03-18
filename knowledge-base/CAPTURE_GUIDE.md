# Personal Capture System — Quick Guide

## Claude.ai

Start any message with these prefixes. Claude recognises them and routes to the `capture_entry` MCP tool automatically.

### Journal Entries

```
Journal: Had a productive sprint review. Team aligned on v2 architecture.
```

```
Journal: mood=frustrated energy=2. Stuck on the OAuth token refresh bug all afternoon.
```

```
Journal: mood=reflective energy=3. Quiet day reading about RAG architectures. No breakthroughs but the mental model is solidifying.
```

- **mood=X** — optional, any text (e.g. energized, frustrated, reflective, calm)
- **energy=N** — optional, 1-5 scale (1=drained, 5=peak)
- If omitted, Claude may ask or leave null
- Stored in `journals` table, distilled monthly on the 28th

### Quick Entries

```
Entry: The MCP gateway's create_task tool has a bug where domain_slug is required but not exposed.
```

```
Entry idea: What if we add domain-specific mini-reviews instead of one monolithic weekly review?
```

```
Entry epiphany: The reason the content pipeline feels stuck is batch-production. Switch to continuous single-video flow.
```

```
Entry memory: Ramesh mentioned his cousin works at Google Cloud — useful for the GCP credits conversation.
```

| Prefix | Capture Type | When to Use |
|---|---|---|
| `Entry:` | observation | General notes, bugs, facts |
| `Entry idea:` | idea | New feature concepts, approaches |
| `Entry epiphany:` | epiphany | Sudden realisations, breakthroughs |
| `Entry memory:` | memory_recall | People, conversations, references |

- Stored in `knowledge_entries` with `source_type='quick_capture'`
- Searchable via `search_knowledge` within 5 minutes (auto-embedded)

### Reviewing Captures

Say any of these to trigger the entry-analysis skill:

```
Analyse entries
```

```
Process entries
```

```
Review captures
```

Claude will pull unprocessed quick entries, cross-reference with active tasks and objectives, and propose actions (new tasks, knowledge connections, objective updates). You approve or reject each proposal.

---

## Telegram Bot (@AsrAiOsbot)

### Journal

```
/j Had a great morning standup. Clear priorities for the week.
```

```
/j mood=energized energy=4 Shipped the capture system today. Feels good to close a full feature end-to-end.
```

### Quick Capture

| Command | Type | Example |
|---|---|---|
| `/e` | observation | `/e Dashboard API routes return 500 when DB pool exhausts` |
| `/ei` | idea | `/ei Weekly domain health digest sent via Telegram every Monday` |
| `/em` | memory | `/em Priya mentioned a Cloud Run cold start fix using min-instances=1` |

### What Happens Next

- **Quick entries** are embedded within 5 minutes by the existing embedding pipeline and become searchable via `search_knowledge`
- **Journals** accumulate until the 28th, when `journal-monthly-distill` extracts themes, mood patterns, tensions, decisions, and missed actions via Claude Haiku
- Distilled journal insights appear as `knowledge_entries` with `source_type='journal_entry'` and tags `journal_distill, monthly, YYYY-MM`
- Use the Dashboard `/capture` page to browse your inbox and journal feed
