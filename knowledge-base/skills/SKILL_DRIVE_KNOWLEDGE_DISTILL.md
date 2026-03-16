# Skill: Drive Knowledge Distill

> **Scope:** This skill operates within the AI Operating System project only. It reads files from Google Drive, classifies them, proposes knowledge entries, and commits approved ones to the knowledge layer.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered. Human-in-the-loop: nothing is committed without explicit approval.
>
> **Runtime:** Claude.ai (primary). Claude Code counterpart at `.claude/skills/drive-knowledge-distill/SKILL.md`.

---

## When to Use

Activate this workflow when the user says `/drive-knowledge-distill`, "monthly knowledge sync", "distill Drive knowledge", "what changed in Drive", or "knowledge review."

Also activate when the user asks to update the knowledge layer from recent Drive activity, or requests a monthly knowledge curation cycle.

Typical cadence: once per month (reminder fires on the 28th via Telegram), or ad-hoc when significant new documents land in Drive.

---

## Process

### Step 0: Mode Selection

This skill has three access modes depending on tool availability. Try them in order:

**Mode A — Direct Drive Read (preferred)**
Test: call `list_drive_files(folder_path="AI OS/Knowledge/System/")` via the AIOSMCP connector. If it returns file listings, use Mode A for all steps.

**Mode B — Pipeline DB Entries**
Test: call `query_db(sql="SELECT COUNT(*) FROM knowledge_ingestion_jobs WHERE status='success' AND completed_at > NOW() - INTERVAL '7 days'")` via the AIOSMCP connector. If recent ingestion jobs exist, use drive_scan_state + knowledge_entries tables for discovery.

**Mode C — Manual Paste (fallback)**
If neither A nor B is available (e.g., MCP connector not set up), ask the user to paste file contents or describe what changed. Process manually.

Tell the user which mode is active before proceeding.

---

### Step 1: Discover Changes

**Mode A:**
1. Call `get_drive_changes_summary(days_back=30)` to get a grouped summary of all tracked folders.
2. Focus on files with status `"new"` or `"modified"`. Skip `"ingested"`.
3. For each new/modified file, call `read_drive_file(file_id=...)` to get content.

**Mode B:**
1. Query `drive_scan_state` for last scan timestamps.
2. Query `knowledge_entries` with `WHERE created_at > (last distill date)` grouped by `drive_file_id`.
3. Identify entries that were auto-ingested by the scanner but may need curation (title cleanup, tag refinement, connection proposals).

**Mode C:**
1. Ask the user: "What documents have you added or updated in Drive recently?"
2. Accept pasted content or file descriptions.

---

### Step 2: Analyse & Classify

For each discovered file, determine:

| Field | Rule |
|-------|------|
| **domain** | From folder path — see Classification Rules below |
| **sub_domain** | From folder path — see Classification Rules below |
| **source_type** | From domain + filename keywords (reference, decision, lesson_learned, journal_entry, goal, event_record, preference, manual) |
| **project_id** | Resolve from project slug via `query_db(sql="SELECT id FROM projects WHERE slug='...'")` |
| **tags** | 3-7 tags extracted from content + filename. Use lowercase, hyphenated. |
| **title** | Clean, descriptive. For split docs: `"{Doc Title} -- {Section Header}"` |

**Granularity Rules:**
- **Long docs (> 2000 words):** Split by major sections (H2/H3 headers). Create one overview entry + one entry per major section. Overview entry summarises the full document in 200-300 words.
- **Short docs (< 2000 words):** Single entry. Summary is 100-200 words capturing the key points.

**Cross-Project Rule:**
If a document spans multiple projects (e.g., a comparison doc covering AI OS and Bharatvarsh), create separate knowledge entries for each project. Each entry contains only the content relevant to that project. Do not create one entry that references multiple projects.

---

### Step 3: Present Proposals (Human-in-the-Loop Gate)

Present each proposed knowledge entry in this format:

```
## Proposal {N}: {title}
- Domain: {domain} / {sub_domain}
- Source type: {source_type}
- Project: {project_name or "none"}
- Tags: {tag1, tag2, tag3, ...}
- Summary preview: {first 150 chars of proposed summary}
- Source file: {filename} (modified {date})
- Action: [Split into {N} entries | Single entry]
```

After presenting all proposals, ask:

> **Review these proposals.** For each, you can:
> - **approve** — commit as-is
> - **edit** — modify title, tags, domain, or summary before committing
> - **reject** — skip this file (will be re-proposed if the file is later modified)
> - **merge** — combine multiple proposals into one entry
> - **split** — break a single proposal into multiple entries
> - **batch approve** — approve all remaining proposals at once
>
> Reply with your decisions (e.g., "approve 1-3, reject 4, edit 5: change domain to personal").

Do NOT proceed to Step 4 until the user has reviewed every proposal.

---

### Step 4: Commit Approved Entries

For each approved entry, call `insert_record` via the AIOSMCP connector:

```
insert_record(
  table="knowledge_entries",
  data={
    "title": "...",
    "content": "...(full summary, 200-500 words)...",
    "domain": "...",
    "sub_domain": "...",
    "source_type": "...",
    "project_id": "...(UUID or null)...",
    "drive_file_id": "...(from Drive)...",
    "tags": ["tag1", "tag2", ...],
    "metadata": {
      "distilled_by": "drive-knowledge-distill",
      "distilled_at": "2026-...",
      "source_filename": "...",
      "source_modified": "...",
      "word_count": ...,
      "chunk_index": ...(if split)...,
      "total_chunks": ...(if split)...
    }
  }
)
```

For rejected entries, note the rejection in the conversation but do NOT store rejection state in the database. The file will be re-proposed on the next run if its `modifiedTime` is newer than the last ingestion.

---

### Step 5: Post-Commit

After all entries are committed:

1. **Summary table:** Present a table showing what was committed:
   | # | Title | Domain | Tags | Status |
   |---|-------|--------|------|--------|

2. **Connection proposals:** For each new entry, call:
   `search_knowledge(query="{entry title}", domain="{entry domain}", limit=3)`
   If related entries are found, propose knowledge connections:
   > "Entry X appears related to '{existing_entry_title}'. Want me to create a connection?"

3. **Pipeline logging:** Call:
   ```
   log_pipeline_run(
     pipeline_slug="drive-knowledge-distill",
     status="success",
     trigger_type="manual",
     triggered_by="user",
     output_summary="Distilled {N} entries from {M} files across {K} folders. {R} rejected."
   )
   ```

4. **Next task:** If there are files that couldn't be processed (PDFs, images, unsupported formats), create a task:
   ```
   insert_record(table="tasks", data={
     "title": "Manually review {N} Drive files not auto-distilled",
     "status": "todo",
     "priority": "low",
     "description": "Files: {list}. These need manual content extraction."
   })
   ```

---

## Classification Rules

| Folder Path | Domain | Sub-domain | Project Slug |
|-------------|--------|------------|-------------|
| AI OS/Knowledge/System/ | system | (none) | (none) |
| AI OS/Knowledge/Projects/AI-OS/ | project | ai-os | ai-os |
| AI OS/Knowledge/Projects/Bharatvarsh/ | project | bharatvarsh | bharatvarsh |
| AI OS/Knowledge/Projects/AI-and-U/ | project | ai-and-u | ai-and-u |
| AI OS/Knowledge/Projects/Zealogics/ | project | zealogics | (none) |
| AI OS/Knowledge/Personal/ | personal | (none) | (none) |
| AI OS/AI Operating System/ | project | ai-os | ai-os |
| AI OS/AI&U/ | project | ai-and-u | ai-and-u |
| AI OS/Bharatvarsh/ | project | bharatvarsh | bharatvarsh |
| AI OS/Zealogics/ | project | zealogics | (none) |

For files outside these paths, ask the user to classify.

---

## Rejection Handling

- Rejected files are NOT stored anywhere. The rejection is ephemeral (conversation-only).
- On the next monthly run, `get_drive_changes_summary` will show the file again if its `modifiedTime` is newer than the last ingestion.
- If the file hasn't been modified since rejection, it will appear as `"ingested"` (if previously ingested) or `"new"` (if never ingested). Re-propose `"new"` files each run — the user can reject again if still not relevant.

---

## Quality Rules

1. **Tags:** 3-7 per entry. Lowercase, hyphenated. Include domain-specific terms. Avoid generic tags like "document" or "file".
2. **Summaries:** 200-500 words for long docs, 100-200 for short docs. Capture key decisions, facts, and actionable information. Write in third person.
3. **Deduplication:** Before committing, call `search_knowledge(query="{proposed title}")` to check for duplicates. If a similar entry exists, propose updating it instead of creating a new one.
4. **Source attribution:** Every entry must have `drive_file_id` set and `metadata.source_filename` populated.
5. **No fabrication:** Only distil information present in the source file. Do not add interpretations or external context not in the document.

---

## Infrastructure

- **MCP Gateway tools used:** `list_drive_files`, `read_drive_file`, `get_drive_changes_summary` (Drive Read module, 3 tools), `query_db`, `insert_record`, `search_knowledge`, `log_pipeline_run` (PostgreSQL module)
- **Pipeline registered:** `drive-knowledge-distill` in `pipelines` table (category A, manual trigger)
- **Skill registered:** `drive-knowledge-distill` in `skill_registry` table (v1.0.0)
- **Monthly reminder:** Cloud Scheduler job `monthly-knowledge-distill-reminder` fires on the 28th at 10:00 AM IST via Telegram

---

## Connectors Used

- **AIOSMCP (AI OS MCP Gateway)** — required for all modes. Provides `list_drive_files`, `read_drive_file`, `get_drive_changes_summary`, `query_db`, `insert_record`, `search_knowledge`, `log_pipeline_run`.
- **Google Drive** — optional fallback for browsing Drive content directly via the directory connector (if AIOSMCP Drive Read tools are unavailable).
- **Google Calendar** — not directly used, but monthly Telegram reminder references this skill.
