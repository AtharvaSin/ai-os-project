# AIOS Skills Ecosystem — Upgrade Blueprint

**Scope:** Claude.ai project skills only  
**Based on:** Skill & Tool Critique Report (2026-03-18)  
**Date:** 2026-03-19  

---

## Executive Summary

The current project has **18 skill files** but only **5 are well-integrated** with the deployed MCP tool ecosystem. **32 of 56 MCP tools** have zero skill coverage, and **7 skills referenced in KB don't exist as files**. This blueprint consolidates the entire ecosystem into **14 upgraded/new skills** organized into 4 tiers — eliminating every gap, removing redundancies, and wiring every MCP tool to at least one controlling skill.

### What changes

| Metric | Current | After Upgrade |
|--------|---------|---------------|
| Skills with full tool coverage | 5 | 14 |
| MCP tools with zero skill coverage | 32 | 0 |
| Missing skill files (referenced in KB) | 7 | 0 |
| Skills that write back to DB | 0 | 6 |
| Skills using Telegram output | 0 | 3 |
| Skills using Life Graph | 0 | 4 |

---

## Tier 1 — Ritual Skills (Daily/Weekly Orchestrators)

These are the "control function" skills that orchestrate multiple tool modules into cohesive workflows.

---

### 1. `/morning-brief` — UPGRADE

**Status:** Exists but partial. Currently reactive (Calendar + Gmail only).

**Problem:** Misses Life Graph health, contact-derived dates (birthdays/anniversaries from 891 contacts), and RAG knowledge context. The brief tells you *what's scheduled* but not *what matters*.

**Upgrade spec:**

```
TRIGGER: "morning brief", "start my day", "what's on today", "brief me"

TOOL CALLS (ordered sequence):
1. gcal_list_events        → Today's calendar (Google Calendar MCP)
2. gmail_search_messages   → Unread/flagged since last session (Gmail MCP)
3. get_domain_summary      → Health score for each Life Graph domain (AIOSMCP)
4. get_upcoming_dates      → Birthdays/anniversaries within 7 days (AIOSMCP)
5. search_knowledge        → Recent decisions & context items from last 48hrs (AIOSMCP)
6. query_db                → Active tasks by priority DESC, limit 5 (AIOSMCP)

OUTPUT FORMAT:
## 📋 Today — {date}
### Calendar
  {events, with conflicts flagged}
### Inbox Highlights  
  {unread count, flagged threads, action-required}
### Life Graph Pulse
  {domain → health score, any domain below threshold flagged}
### Upcoming Dates
  {contacts with birthdays/anniversaries this week}
### Active Priorities
  {top 5 tasks with domain context}
### Knowledge Context
  {any recent decisions or lessons relevant to today's calendar/tasks}

POST-EXECUTION:
→ log_pipeline_run(slug: 'morning-brief', status: 'success')
```

**New tools wired:** `get_domain_summary`, `get_upcoming_dates`, `search_knowledge`, `query_db`, `log_pipeline_run`  
**Net new tool coverage:** +5 tools

---

### 2. `/weekly-review` — UPGRADE

**Status:** Exists but partial. Reads past chats, Calendar, Gmail — but doesn't read the OS's own pulse.

**Problem:** Doesn't surface pipeline run stats, Life Graph health deltas, journal entries captured during the week, or task completion rates. The review is about *external activity* but ignores the *system's own state*.

**Upgrade spec:**

```
TRIGGER: "weekly review", "week in review", "summarize my week", "what happened this week"

TOOL CALLS (ordered sequence):
1. gcal_list_events           → All events this week (Google Calendar MCP)
2. gmail_search_messages      → Sent + received volume, key threads (Gmail MCP)
3. query_db                   → pipeline_runs this week: success/fail counts (AIOSMCP)
4. query_db                   → tasks completed vs created this week (AIOSMCP)
5. get_domain_summary         → Life Graph health per domain + delta from last week (AIOSMCP)
6. list_journals              → All journal captures this week (AIOSMCP)
7. search_knowledge           → Decisions logged this week (AIOSMCP)
8. recent_chats               → Key conversation themes (Claude native)
9. google_drive_search        → Files modified this week (Google Drive)

OUTPUT FORMAT:
## 📊 Week in Review — {date range}
### By the Numbers
  {meetings attended, emails sent, tasks completed/created ratio}
### Life Graph Deltas
  {domain → this week's score vs last week, trend arrow}
### Pipeline Health
  {runs: X success / Y failed, any recurring failures flagged}
### Decisions Made
  {from knowledge_entries, bulleted}
### Journal Captures
  {from list_journals, summarized — flag any unprocessed}
### Key Conversations
  {from recent_chats, thematic clusters}
### Recommended Focus for Next Week
  {AI-generated priorities based on stalled domains, overdue tasks, unprocessed journals}

POST-EXECUTION:
→ insert_record(table: 'knowledge_entries', type: 'weekly-review', content: {summary})
→ log_pipeline_run(slug: 'weekly-review', status: 'success')
```

**New tools wired:** `query_db` (pipeline_runs + tasks), `get_domain_summary`, `list_journals`, `search_knowledge`, `insert_record`, `log_pipeline_run`  
**Net new tool coverage:** +4 tools (some shared with morning-brief)

---

### 3. `/session-resume` — UPGRADE

**Status:** Exists but partial. Searches past chats but doesn't query the DB for tasks or decisions.

**Problem:** Every session starts semi-cold. The skill finds *conversation context* but not *system state* — doesn't know what tasks opened/closed or what decisions were recorded since last session.

**Upgrade spec:**

```
TRIGGER: "resume", "pick up where I left off", "what were we working on", 
         "continue", "session resume"

TOOL CALLS (ordered sequence):
1. recent_chats              → Last 3 conversations (Claude native)
2. conversation_search       → Topic-specific if user hints at a topic (Claude native)
3. search_knowledge          → Decisions & context from last 7 days (AIOSMCP)
4. query_db                  → Tasks created/completed since last active session (AIOSMCP)
5. query_db                  → session_context table — latest handoff row (AIOSMCP)
                               (graceful fallback if table doesn't exist yet)

OUTPUT FORMAT:
## 🔄 Session Resume
### Last Session
  {what was discussed, any open threads}
### Since Then
  - Tasks completed: {list}
  - Tasks added: {list}  
  - Decisions recorded: {list}
### Handoff Context  
  {from session_context if available, otherwise "No formal handoff found"}
### Suggested Starting Point
  {AI recommendation based on open threads + highest priority task}
```

**New tools wired:** `search_knowledge`, `query_db` (tasks + session_context)

---

## Tier 2 — Action Skills (Create / Execute / Write-back)

These skills perform discrete actions and **always write results back to the DB** so outputs don't get lost in chat.

---

### 4. `/create-task` — KEEP (already solid)

**Status:** Well-integrated. Correct domain_slug mapping, delimiter awareness, Google Tasks sync.

**No changes needed.** This is the reference implementation for other skills.

---

### 5. `/action-planner` — UPGRADE

**Status:** Exists but creates tasks without checking what's already in-flight.

**Problem:** Can create duplicate or conflicting tasks because it never reads the current task backlog for that domain.

**Upgrade spec:**

```
TRIGGER: "plan", "what should I work on", "help me prioritize", 
         "action plan", "break this down"

TOOL CALLS (ordered sequence):
1. list_domains              → Get all Life Graph domains (AIOSMCP)
2. get_domain_tasks          → For the relevant domain(s), pull active tasks (AIOSMCP)
3. get_domain_summary        → Health score to prioritize underserved domains (AIOSMCP)
4. search_knowledge          → Recent decisions that constrain planning (AIOSMCP)

THEN: Generate plan, present to user for approval.

ON APPROVAL (per task):
5. create_task               → Via existing /create-task skill (AIOSMCP)
6. insert_record             → Log the plan as a knowledge_entry (AIOSMCP)

OPTIONAL OUTPUT:
7. send_telegram_message     → Push plan summary to Telegram (AIOSMCP)

DEDUP LOGIC:
Before creating any task, compare title + domain against active tasks from step 2.
If similarity > 80%, flag as potential duplicate and ask user to confirm.
```

**New tools wired:** `list_domains`, `get_domain_tasks`, `get_domain_summary`, `search_knowledge`, `insert_record`, `send_telegram_message`

---

### 6. `/capture-entry` — NEW (Critical Gap)

**Status:** Missing entirely. `capture_entry`, `list_journals`, `search_journals` are deployed but no skill orchestrates them.

**Problem:** Mobile capture from Claude.ai is completely uncovered. Quick thoughts, ideas, and observations have no structured path into the system.

**Skill spec:**

```
TRIGGER: "capture", "log this", "journal", "quick note", "remember this",
         "jot down", "save this thought", any freeform input that looks like 
         a journal entry or quick capture

TOOL CALLS:
1. capture_entry             → Write the entry to journals table (AIOSMCP)
   Params: content, entry_type (auto-classify: thought | task | decision | observation)
2. list_domains              → Suggest domain tagging (AIOSMCP)

AUTO-CLASSIFICATION LOGIC:
- Contains action verb + deadline → entry_type: 'task', offer to also /create-task
- Contains "decided", "going with", "choosing" → entry_type: 'decision'
- Contains emotional language or reflection → entry_type: 'observation'  
- Default → entry_type: 'thought'

OPTIONAL ENRICHMENT:
3. search_knowledge          → Link to related knowledge entries (AIOSMCP)
4. send_telegram_message     → Confirm capture via Telegram (AIOSMCP)

OUTPUT: Confirmation with entry ID, classified type, suggested domain tag.
If type='task', prompt: "Want me to also create this as a formal task?"
If type='decision', prompt: "Want me to log this to the knowledge base too?"
```

**New tools wired:** `capture_entry`, `list_domains`, `search_knowledge`, `send_telegram_message`

---

### 7. `/entry-analysis` — NEW (Amber Gap)

**Status:** Missing. Journals table has entries but nothing triages or processes them.

**Problem:** Captured entries sit unprocessed. No skill extracts tasks, decisions, or knowledge from raw captures.

**Skill spec:**

```
TRIGGER: "process entries", "triage journals", "analyze captures",
         "what have I captured", "unprocessed entries"

TOOL CALLS:
1. list_journals             → Pull all unprocessed journal entries (AIOSMCP)
2. search_journals           → Filter by date range if specified (AIOSMCP)

FOR EACH UNPROCESSED ENTRY:
3. AI classification: task | decision | knowledge | noise
4. IF task → create via /create-task skill
5. IF decision → insert_record(table: 'knowledge_entries', type: 'decision') (AIOSMCP)
6. IF knowledge → insert_record(table: 'knowledge_entries', type: 'insight') (AIOSMCP)  
7. IF noise → mark as processed, no further action
8. update_record             → Mark journal entry as processed (AIOSMCP)

OUTPUT FORMAT:
## 📥 Entry Triage — {count} entries processed
### Extracted
- Tasks created: {count} → {titles}
- Decisions logged: {count} → {summaries}
- Knowledge captured: {count}  
- Dismissed as noise: {count}

POST-EXECUTION:
→ log_pipeline_run(slug: 'entry-analysis', status: 'success')
```

**New tools wired:** `list_journals`, `search_journals`, `insert_record`, `update_record`, `log_pipeline_run`

---

### 8. `/contact-lookup` — NEW (Critical Gap)

**Status:** Missing. 8 contacts tools deployed, 891 contacts in DB, but no skill surfaces them.

**Problem:** `/draft-email` and `/morning-brief` both suffer. You can't pull up a contact's context, history, or relationship notes before writing to them.

**Skill spec:**

```
TRIGGER: "look up {name}", "who is {name}", "contact info for", 
         "find contact", "what do I know about {name}",
         any reference to a person's name in context of email/meeting prep

TOOL CALLS:
1. query_db                  → Search contacts table by name/email/company (AIOSMCP)
   Query: SELECT * FROM contacts WHERE name ILIKE '%{query}%' 
          OR email ILIKE '%{query}%' OR company ILIKE '%{query}%'
2. get_upcoming_dates        → Any upcoming dates for this contact (AIOSMCP)
3. gmail_search_messages     → Last 5 email threads with this contact (Gmail MCP)
4. gcal_list_events          → Recent/upcoming meetings with this contact (Google Calendar MCP)

OUTPUT FORMAT:
## 👤 {name}
**Email:** {email} | **Company:** {company} | **Role:** {role}
**Relationship notes:** {from contacts DB}
**Upcoming dates:** {birthday, anniversary if any}
**Recent email activity:** {last 3 thread subjects + dates}
**Upcoming meetings:** {next 2 scheduled events}

INTEGRATION HOOKS:
- After lookup, offer: "Draft an email?" → chains to /draft-email
- After lookup, offer: "Schedule a meeting?" → chains to calendar tools
```

**New tools wired:** `query_db` (contacts), `get_upcoming_dates`

---

### 9. `/draft-email` — KEEP + MINOR UPGRADE

**Status:** Solid. Gmail thread search, tone variants, contact awareness.

**Minor upgrade:** Before drafting, auto-call `/contact-lookup` for the recipient to inject relationship context and recent interaction history into the draft. Add a post-send hook to optionally log the communication to the DB.

```
NEW ADDITION TO EXISTING FLOW:
Step 0 (new): query_db → contacts table for recipient context (AIOSMCP)
Step 0b (new): get_upcoming_dates → if birthday is within 3 days, suggest mentioning it

POST-DRAFT (new, optional):
→ insert_record(table: 'knowledge_entries', type: 'communication-log', 
                content: {recipient, subject, key points})
```

---

### 10. `/deep-research` — KEEP + MINOR UPGRADE  

**Status:** Well designed. Drive check first, web search, structured output.

**Minor upgrade:** After research completes, auto-persist findings to the knowledge base so they're discoverable by other skills.

```
NEW ADDITION TO EXISTING FLOW:
POST-RESEARCH (new):
→ insert_record(table: 'knowledge_entries', type: 'research', 
                content: {topic, key_findings, sources})
→ log_pipeline_run(slug: 'deep-research', status: 'success')
```

---

## Tier 3 — Domain Skills (Specialized Content & Creative)

---

### 11. `/bharatvarsh` — MERGE & UPGRADE (replaces both `/bharatvarsh-content` and `/bharatvarsh-writer`)

**Status:** `/bharatvarsh-content` exists but doesn't call any lore tools. `/bharatvarsh-writer` is missing entirely.

**Problem:** Both marketing content and fiction are generated *blind* — no lore validation, no character grounding, no style consistency. This is the single biggest quality risk for the Bharatvarsh IP.

**Merged skill spec with two modes:**

```
TRIGGER: "bharatvarsh", "lore", "write bharatvarsh", "bharatvarsh content",
         "bharatvarsh post", "bharatvarsh story", any reference to the 
         Bharatvarsh universe, characters, or worldbuilding

MODE DETECTION:
- Keywords: "post", "campaign", "social", "marketing", "caption" → CONTENT MODE
- Keywords: "story", "chapter", "fiction", "narrative", "write about" → WRITER MODE
- Keywords: "check", "verify", "consistent", "lore check" → LORE CHECK MODE

═══ SHARED FOUNDATION (all modes) ═══
1. query_lore                → Relevant lore context for the topic (AIOSMCP)
2. get_character             → Character details if any character is referenced (AIOSMCP)
3. get_writing_style         → Voice and tone parameters (AIOSMCP)
4. Load BRAND_IDENTITY.md    → Visual/brand constraints (Project KB)
5. Load Bharatvarsh Bible    → Canon reference (Project KB)

═══ CONTENT MODE (marketing/social) ═══
6. query_db                  → Check campaign_posts table for recent posts (AIOSMCP)
                               Avoid topic/angle repetition
7. Generate content following brand playbook + lore constraints
8. check_lore_consistency    → Validate output against lore DB (AIOSMCP)
9. insert_record             → Save to campaign_posts table (AIOSMCP)
10. send_telegram_message    → Push draft for mobile review (AIOSMCP)

═══ WRITER MODE (fiction/narrative) ═══
6. Generate narrative grounded in character voice from get_writing_style
7. check_lore_consistency    → Validate every proper noun, timeline ref, 
                               power system detail (AIOSMCP)
8. IF inconsistencies found → flag and offer corrections before finalizing
9. insert_record             → Save to knowledge_entries as 'narrative-draft' (AIOSMCP)

═══ LORE CHECK MODE ═══
6. check_lore_consistency    → Run provided text against full lore DB (AIOSMCP)
7. Return detailed consistency report with specific contradictions

POST-EXECUTION (all modes):
→ log_pipeline_run(slug: 'bharatvarsh-{mode}', status: 'success')
```

**New tools wired:** `query_lore`, `get_character`, `get_writing_style`, `check_lore_consistency`, `insert_record`, `send_telegram_message`, `log_pipeline_run`  
**This single skill wires 7 previously uncovered tools.**

---

### 12. `/content-gen` — NEW (Amber Gap)

**Status:** Designed in a previous session but never built. `campaign_posts` table and Social Post Generator pipeline are seeded.

**Problem:** Generic content generation (non-Bharatvarsh) has no skill driving it. LinkedIn posts, blog drafts, thought leadership content — all done ad hoc.

**Skill spec:**

```
TRIGGER: "write a post", "content for", "draft a blog", "LinkedIn post",
         "thought leadership", "social post", "content calendar",
         any content generation that is NOT Bharatvarsh-specific

TOOL CALLS:
1. search_knowledge          → Recent decisions/work to base content on (AIOSMCP)
2. google_drive_search       → Existing content/templates (Google Drive)
3. web_search                → Trending angles on the topic (Claude native)
4. query_db                  → campaign_posts table to avoid repetition (AIOSMCP)

GENERATION:
5. Produce content with tone matched to platform (LinkedIn=professional, 
   Twitter=punchy, Blog=detailed)
6. Apply brand voice from BRAND_IDENTITY.md

POST-GENERATION:
7. insert_record             → Save to campaign_posts (AIOSMCP)
8. send_telegram_message     → Push draft for mobile review (AIOSMCP)
9. log_pipeline_run          → Log execution (AIOSMCP)
```

**New tools wired:** `query_db` (campaign_posts), `insert_record`, `send_telegram_message`

---

## Tier 4 — Infrastructure Skills (System Management)

---

### 13. `/life-graph` — NEW (Critical Gap — 8 tools, zero skill coverage)

**Status:** The entire Life Graph module (8 tools) has no orchestrating skill. Other skills reference it piecemeal, but nothing manages the Life Graph as a first-class entity.

**Problem:** Domains, context items, and task associations are managed manually or not at all. The Life Graph is seeded but ungoverned.

**Skill spec:**

```
TRIGGER: "life graph", "domains", "how am I doing", "domain health",
         "add context to", "life areas", "what domains", "domain summary",
         "update life graph", "complete {item}"

SUB-COMMANDS (detected from user intent):

═══ OVERVIEW ═══
1. list_domains              → All domains with slugs (AIOSMCP)
2. get_domain_summary        → Health scores for each (AIOSMCP)
3. get_domain_tree           → Full tree structure (AIOSMCP)
Output: Dashboard view of all domains with health scores + trend

═══ DOMAIN DEEP-DIVE ═══
1. get_domain_summary        → Specific domain (AIOSMCP)
2. get_domain_tasks          → All tasks in this domain (AIOSMCP)
3. get_domain_tree           → Sub-items and context (AIOSMCP)
Output: Detailed domain view with tasks, context items, health

═══ ADD CONTEXT ═══
1. add_context_item          → Add observation/note to a domain (AIOSMCP)
Output: Confirmation with updated domain context

═══ COMPLETE ITEM ═══
1. complete_context_item     → Mark a context item done (AIOSMCP)
2. get_domain_summary        → Show updated health (AIOSMCP)
Output: Completion confirmation + health impact

═══ MILESTONE SYNC ═══
1. query_db                  → Get milestones from DB (AIOSMCP)
2. create_milestone_event    → Sync to Google Calendar (AIOSMCP)
   OR update_milestone_event → Update existing synced event (AIOSMCP)
   OR delete_milestone_event → Remove if milestone cancelled (AIOSMCP)
3. gcal_create_event         → Create corresponding calendar event (Google Calendar MCP)
Output: Sync confirmation with calendar links
```

**Tools wired (all previously uncovered):**  
`list_domains`, `get_domain_tree`, `get_domain_tasks`, `get_domain_summary`, `add_context_item`, `complete_context_item`, `create_milestone_event`, `update_milestone_event`, `delete_milestone_event`  
**This single skill wires 9 previously uncovered tools — the biggest gap closure.**

---

### 14. `/workflow-designer` — UPGRADE

**Status:** Exists. Classifies A/B/C correctly but designs workflows without checking if similar pipelines already exist.

**Problem:** Has created duplicate Category B services in the past due to not querying the `pipelines` table.

**Upgrade spec:**

```
EXISTING FLOW PRESERVED, with additions:

NEW STEP (before design):
1. query_db                  → SELECT * FROM pipelines WHERE status='active' (AIOSMCP)
2. Compare proposed workflow against existing pipelines
3. IF similar pipeline exists → show it, ask: "Extend this or create new?"

NEW STEP (after design approval):
4. insert_record             → Log the workflow design to knowledge_entries (AIOSMCP)
5. log_pipeline_run          → Track the design session (AIOSMCP)
```

---

## Existing Skills — No Changes Needed

| Skill | Status | Reason |
|-------|--------|--------|
| `/create-task` | ✅ Solid | Best-integrated skill. Reference implementation. |
| `/brand-design-consistency` | ✅ Solid | Comprehensive, correctly gates visual output. |
| `/kb-sync` | ✅ Solid | Handles all three sync directions. |

---

## Tool Coverage Matrix — Before vs After

| Tool Module | Tools | Skills Before | Skills After |
|-------------|-------|---------------|--------------|
| **Life Graph** | `list_domains`, `get_domain_tree`, `get_domain_tasks`, `get_domain_summary`, `add_context_item`, `complete_context_item` | 0 | `/life-graph`, `/morning-brief`, `/weekly-review`, `/action-planner` |
| **Calendar Sync** | `create_milestone_event`, `update_milestone_event`, `delete_milestone_event` | 0 | `/life-graph` |
| **Journals** | `capture_entry`, `list_journals`, `search_journals` | 0 | `/capture-entry`, `/entry-analysis`, `/weekly-review` |
| **Contacts** | 8 contacts tools via `query_db` | 0 | `/contact-lookup`, `/draft-email`, `/morning-brief` |
| **Bharatvarsh Lore** | `query_lore`, `get_character`, `get_writing_style`, `check_lore_consistency` | 0 (skill existed but didn't call them) | `/bharatvarsh` |
| **Telegram** | `send_telegram_message`, `send_telegram_inline_keyboard`, `edit_telegram_message` | 0 | `/capture-entry`, `/bharatvarsh`, `/content-gen`, `/action-planner` |
| **DB Write** | `insert_record`, `update_record`, `log_pipeline_run` | 0 | 6 skills write back |
| **Knowledge** | `search_knowledge` | 0 | `/morning-brief`, `/session-resume`, `/action-planner`, `/capture-entry` |
| **Google Calendar** | 8 tools | `/morning-brief` only | `/morning-brief`, `/weekly-review`, `/life-graph`, `/contact-lookup` |
| **Gmail** | 6 tools | `/draft-email` only | `/draft-email`, `/morning-brief`, `/weekly-review`, `/contact-lookup` |

---

## Implementation Priority

### Phase 1 — Highest Impact (do first)

| # | Skill | Type | Rationale |
|---|-------|------|-----------|
| 1 | `/life-graph` | NEW | Wires 9 uncovered tools. Foundation for other skills. |
| 2 | `/capture-entry` | NEW | Enables mobile capture. Critical daily-use gap. |
| 3 | `/morning-brief` | UPGRADE | Most-used ritual. Upgrade = immediate daily value. |
| 4 | `/bharatvarsh` | MERGE | Wires 7 tools. Protects IP quality. Replaces 2 broken skills. |

### Phase 2 — Operational Completeness

| # | Skill | Type | Rationale |
|---|-------|------|-----------|
| 5 | `/contact-lookup` | NEW | Unlocks 891 contacts. Enriches /draft-email and /morning-brief. |
| 6 | `/session-resume` | UPGRADE | Every session benefits from better context. |
| 7 | `/action-planner` | UPGRADE | Prevents duplicate task creation. |
| 8 | `/entry-analysis` | NEW | Processes captured entries into actionable items. |

### Phase 3 — Full Ecosystem

| # | Skill | Type | Rationale |
|---|-------|------|-----------|
| 9 | `/weekly-review` | UPGRADE | Weekly cadence — less urgent than daily skills. |
| 10 | `/content-gen` | NEW | Content pipeline activation. |
| 11 | `/workflow-designer` | UPGRADE | Prevents duplicate pipeline designs. |
| 12 | `/deep-research` | MINOR | Just adding write-back. |
| 13 | `/draft-email` | MINOR | Just adding contact enrichment hook. |

---

## Cross-Cutting Patterns

### Pattern 1: Write-Back Principle
Every skill that produces a decision, plan, or artifact **must** call `insert_record` to persist it to `knowledge_entries`. Chat-only outputs are lost within 24 hours.

**Skills that now write back:** `/morning-brief`, `/weekly-review`, `/action-planner`, `/entry-analysis`, `/bharatvarsh`, `/content-gen`, `/deep-research`, `/workflow-designer`

### Pattern 2: Telegram as Notification Bus  
Any skill that produces a summary or draft should offer to push it to Telegram via `send_telegram_message`. This enables mobile review without re-opening Claude.ai.

**Skills with Telegram output:** `/capture-entry` (confirmation), `/bharatvarsh` (draft review), `/content-gen` (draft review), `/action-planner` (plan summary)

### Pattern 3: Life Graph Awareness
Skills that plan, review, or prioritize must query Life Graph domains for health context. A task in a "red" domain gets higher weight than one in a "green" domain.

**Life-Graph-aware skills:** `/morning-brief`, `/weekly-review`, `/action-planner`, `/life-graph`

### Pattern 4: Dedup Before Create
Any skill that creates tasks or workflows must first query existing items and flag potential duplicates before proceeding.

**Dedup-enabled skills:** `/action-planner`, `/workflow-designer`, `/content-gen`

### Pattern 5: Pipeline Logging
Every skill execution that involves more than 2 tool calls should log itself via `log_pipeline_run`. This builds an audit trail for `/weekly-review` to report on.

---

## Skills Retired / Merged

| Old Skill | Action | Reason |
|-----------|--------|--------|
| `/bharatvarsh-content` | Merged into `/bharatvarsh` | Content mode within unified skill |
| `/bharatvarsh-writer` | Merged into `/bharatvarsh` | Writer mode within unified skill |
| `/drive-knowledge-distill` | Deferred | Dependency on seed data. Build after `/life-graph` is live. |

---

## Final Skill Inventory (14 total)

| # | Skill | Tier | Status |
|---|-------|------|--------|
| 1 | `/morning-brief` | Ritual | UPGRADE |
| 2 | `/weekly-review` | Ritual | UPGRADE |
| 3 | `/session-resume` | Ritual | UPGRADE |
| 4 | `/create-task` | Action | KEEP |
| 5 | `/action-planner` | Action | UPGRADE |
| 6 | `/capture-entry` | Action | NEW |
| 7 | `/entry-analysis` | Action | NEW |
| 8 | `/contact-lookup` | Action | NEW |
| 9 | `/draft-email` | Action | MINOR UPGRADE |
| 10 | `/deep-research` | Action | MINOR UPGRADE |
| 11 | `/bharatvarsh` | Domain | MERGE + UPGRADE |
| 12 | `/content-gen` | Domain | NEW |
| 13 | `/life-graph` | Infrastructure | NEW |
| 14 | `/workflow-designer` | Infrastructure | UPGRADE |
| — | `/brand-design-consistency` | Guard | KEEP |
| — | `/kb-sync` | Infrastructure | KEEP |

**Total: 16 skills (14 active + 2 guards/infra kept as-is)**  
**MCP tools with zero coverage: 0** (down from 32)
