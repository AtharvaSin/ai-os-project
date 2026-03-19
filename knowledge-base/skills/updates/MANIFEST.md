# Skills Ecosystem Upgrade — Manifest

**Date:** 2026-03-19
**Based on:** `docs/skills_ecosystem_upgrade_report.md`
**Total skills:** 13 files (14 skills — `/create-task` kept as-is, not duplicated here)

---

## Inventory

### Phase 1 — Highest Impact

| # | File | Skill | Type | Tools Wired |
|---|------|-------|------|-------------|
| 1 | `SKILL_LIFE_GRAPH.md` | `/life-graph` | NEW | 9 tools (list_domains, get_domain_tree, get_domain_tasks, get_domain_summary, add_context_item, complete_context_item, create_milestone_event, update_milestone_event, delete_milestone_event) |
| 2 | `SKILL_CAPTURE_ENTRY.md` | `/capture-entry` | NEW | 5 tools (capture_entry, list_domains, search_knowledge, insert_record, send_telegram_message) |
| 3 | `SKILL_MORNING_BRIEF.md` | `/morning-brief` | UPGRADE v2.0 | 7 tools (gcal_list_events, gmail_search_messages, get_domain_summary, get_upcoming_dates, search_knowledge, query_db, log_pipeline_run) |
| 4 | `SKILL_BHARATVARSH.md` | `/bharatvarsh` | MERGE v3.0 | 11 tools (query_lore, get_character, get_writing_style, check_lore_consistency, search_lore, get_entity, get_timeline, query_db, insert_record, send_telegram_message, log_pipeline_run) |

### Phase 2 — Operational Completeness

| # | File | Skill | Type | Tools Wired |
|---|------|-------|------|-------------|
| 5 | `SKILL_CONTACT_LOOKUP.md` | `/contact-lookup` | NEW | 7 tools (search_contacts, get_contact_brief, get_contact_network, get_upcoming_dates, query_db, gmail_search_messages, gcal_list_events) |
| 6 | `SKILL_SESSION_RESUME.md` | `/session-resume` | UPGRADE v2.0 | 3 tools (search_knowledge, query_db, insert_record) |
| 7 | `SKILL_ACTION_PLANNER.md` | `/action-planner` | UPGRADE v2.0 | 8 tools (list_domains, get_domain_tasks, get_domain_summary, search_knowledge, create_task, insert_record, send_telegram_message, log_pipeline_run) |
| 8 | `SKILL_ENTRY_ANALYSIS.md` | `/entry-analysis` | NEW | 5 tools (list_journals, search_journals, insert_record, update_record, log_pipeline_run) |

### Phase 3 — Full Ecosystem

| # | File | Skill | Type | Tools Wired |
|---|------|-------|------|-------------|
| 9 | `SKILL_WEEKLY_REVIEW.md` | `/weekly-review` | UPGRADE v2.0 | 9 tools (gcal_list_events, gmail_search_messages, query_db, get_domain_summary, list_journals, search_knowledge, list_drive_files, insert_record, log_pipeline_run) |
| 10 | `SKILL_CONTENT_GEN.md` | `/content-gen` | NEW | 6 tools (search_knowledge, list_drive_files, query_db, insert_record, send_telegram_message, log_pipeline_run) |
| 11 | `SKILL_WORKFLOW_DESIGNER.md` | `/workflow-designer` | UPGRADE v2.0 | 3 tools (query_db, insert_record, log_pipeline_run) |
| 12 | `SKILL_DEEP_RESEARCH.md` | `/deep-research` | MINOR v2.0 | 5 tools (search_knowledge, list_drive_files, read_drive_file, insert_record, log_pipeline_run) |
| 13 | `SKILL_DRAFT_EMAIL.md` | `/draft-email` | MINOR v2.0 | 6 tools (search_contacts, get_upcoming_dates, gmail_search_messages, gmail_read_thread, gmail_create_draft, insert_record) |

### Kept As-Is (not in this folder)

| Skill | Location | Reason |
|-------|----------|--------|
| `/create-task` | Claude.ai project KB | Already well-integrated. Reference implementation. |
| `/brand-design-consistency` | `knowledge-base/skills/SKILL_BRAND_DESIGN_CONSISTENCY.md` | Comprehensive. No changes needed. |
| `/kb-sync` | `knowledge-base/skills/SKILL_KB_SYNC.md` | Handles all sync directions. No changes needed. |

### Retired / Replaced

| Old Skill | Replaced By |
|-----------|-------------|
| `SKILL_BHARATVARSH_CONTENT.md` | `SKILL_BHARATVARSH.md` (content mode) |
| `SKILL_BHARATVARSH_WRITER.md` | `SKILL_BHARATVARSH.md` (writer mode) |
| `SKILL_LORE_CHECK.md` | `SKILL_BHARATVARSH.md` (lore check mode) |

---

## Cross-Cutting Patterns Applied

- **Write-Back Principle:** 8 skills now persist output to `knowledge_entries` via `insert_record`
- **Telegram Notification Bus:** 4 skills offer Telegram push via `send_telegram_message`
- **Life Graph Awareness:** 4 skills query domain health for context
- **Dedup Before Create:** 3 skills check existing items before creating new ones
- **Pipeline Logging:** 9 skills log execution via `log_pipeline_run`

## Installation

Upload each `.md` file to the Claude.ai project knowledge base. For skills replacing existing ones (morning-brief, session-resume, action-planner, weekly-review, bharatvarsh, deep-research, draft-email, workflow-designer), replace the existing KB document with the updated version.

Remove retired skills: `SKILL_BHARATVARSH_CONTENT.md`, `SKILL_BHARATVARSH_WRITER.md`, `SKILL_LORE_CHECK.md`.
