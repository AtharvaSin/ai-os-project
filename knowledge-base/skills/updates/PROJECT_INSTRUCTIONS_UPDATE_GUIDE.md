# Project Instructions — Update Guide for Skills Ecosystem Upgrade

**Date:** 2026-03-19
**Context:** Skills ecosystem upgrade — 3 skills removed, 3 added, 8 upgraded. Net skill count unchanged at 26.

---

## How to Use This Guide

Each change below shows the **section** where the edit lives, the **FIND** text (copy-paste to locate it), and the **REPLACE** text. Apply all 12 changes in order. No other sections need modification — the count of "26 skills" remains accurate (3 removed + 3 added = net zero).

---

## Change 1 — Bharatvarsh Lore Layer: Skill References

**Section:** `Current Build State` → `Bharatvarsh Lore Layer (Complete — Sprint 10-B, Deployed)`

**FIND:**
```
3 Claude.ai skills (SKILL_BHARATVARSH_CONTENT v2.0, SKILL_LORE_CHECK, SKILL_BHARATVARSH_WRITER). bharatvarsh-content v2.0 skill with MCP lore validation.
```

**REPLACE:**
```
1 unified Claude.ai skill (SKILL_BHARATVARSH v3.0 — three modes: content, writer, lore check). Replaces previous separate bharatvarsh-content, bharatvarsh-writer, and lore-check skills. Full MCP lore validation across all modes.
```

---

## Change 2 — W2: Context & Planning Skills

**Section:** `The Five Workstreams` → `W2: Context & Planning`

**FIND:**
```
Skills: /morning-brief, /session-resume, /action-planner, /weekly-review, /kb-sync, /create-task
```

**REPLACE:**
```
Skills: /morning-brief (v2.0 — Life Graph + contacts + knowledge), /session-resume (v2.0 — task tracking + handoffs), /action-planner (v2.0 — dedup + domain health), /weekly-review (v2.0 — pipeline stats + Life Graph deltas), /kb-sync, /create-task, /life-graph (domain management + milestone sync), /capture-entry (auto-classified journal capture), /entry-analysis (triage unprocessed entries)
```

---

## Change 3 — W3: Content & Communications Skills

**Section:** `The Five Workstreams` → `W3: Content & Communications`

**FIND:**
```
Skills: /draft-email, /build-prd, /decision-memo, /checklist-gen
```

**REPLACE:**
```
Skills: /draft-email (v2.0 — contact enrichment + communication logging), /build-prd, /decision-memo, /checklist-gen, /content-gen (non-Bharatvarsh content pipeline with dedup + Telegram push)
```

---

## Change 4 — W5: Creative Content Skills

**Section:** `The Five Workstreams` → `W5: Creative Content`

**FIND:**
```
Skills: /bharatvarsh-content, /social-post, /visual-artifact, /brand-guidelines, /infographic, /ui-design-process
```

**REPLACE:**
```
Skills: /bharatvarsh (v3.0 unified — content mode for marketing, writer mode for fiction, lore check mode for validation), /content-gen (professional + AI&U content), /social-post, /visual-artifact, /brand-guidelines, /infographic, /ui-design-process
```

---

## Change 5 — W4: System Administration Skills

**Section:** `The Five Workstreams` → `W4: System Administration`

**FIND:**
```
Skills: /workflow-designer, /kb-sync, /drive-knowledge-distill, /update-project-state (Claude Code)
```

**REPLACE:**
```
Skills: /workflow-designer (v2.0 — pipeline dedup check), /kb-sync, /drive-knowledge-distill, /life-graph (infrastructure-tier domain management), /update-project-state (Claude Code)
```

---

## Change 6 — Connector Usage: Bharatvarsh Content

**Section:** `Connector Usage Patterns`

**FIND:**
```
When creating Bharatvarsh content (W5): Load both BHARATVARSH_BIBLE.md (lore) and BHARATVARSH_PLATFORM.md (marketing/tech). Apply Context B brand rules from BRAND_IDENTITY.md.
```

**REPLACE:**
```
When creating Bharatvarsh content (W5): Use /bharatvarsh skill — content mode for social/marketing, writer mode for fiction/narrative, lore check mode for validation. The unified skill auto-loads BHARATVARSH_BIBLE.md, CHARACTERS, VISUAL_GUIDE, WRITING_GUIDE, and queries MCP lore tools (query_lore, get_character, get_writing_style, check_lore_consistency) before generating. Persists drafts to campaign_posts or knowledge_entries. Apply Context B brand rules from BRAND_IDENTITY.md.
```

---

## Change 7 — Connector Usage: Life Graph

**Section:** `Connector Usage Patterns`

**FIND:**
```
When working with Life Graph (W2, W4): Use get_domain_tree to see full hierarchy, get_domain_tasks for domain-specific task lists, get_domain_summary for health overview. Tag new tasks with appropriate domain_slug.
```

**REPLACE:**
```
When working with Life Graph (W2, W4): Use /life-graph skill for standalone domain management — overview (all domains + health), deep-dive (single domain + tasks + context), add context (observations/notes/milestones), complete items, and milestone sync to Google Calendar. For piecemeal queries within other skills, use get_domain_tree, get_domain_tasks, get_domain_summary directly. Tag new tasks with appropriate domain_slug.
```

---

## Change 8 — Connector Usage: Capturing

**Section:** `Connector Usage Patterns`

**FIND:**
```
When capturing thoughts or journal entries (W2): Use capture_entry via MCP for journals (mood, energy, tags) or quick entries (observations, ideas, epiphanies). Use /capture-entry skill for prefix-based routing. Use /entry-analysis to triage unprocessed entries. Telegram /j, /e, /ei, /em commands for mobile capture.
```

**REPLACE:**
```
When capturing thoughts or journal entries (W2): Use /capture-entry skill for structured capture with auto-classification (thought, task, decision, observation), domain tagging, and optional chaining to /create-task or knowledge base persistence. Supports batch capture mode for multiple items. Use /entry-analysis to triage accumulated unprocessed entries — extracts tasks, decisions, and knowledge items, marks entries processed. Telegram /j, /e, /ei, /em commands for mobile capture.
```

---

## Change 9 — Connector Usage: Content Creation (NEW — add after the Capturing paragraph)

**Section:** `Connector Usage Patterns` — add as a new paragraph after the capturing one

**ADD (new paragraph):**
```
When creating non-Bharatvarsh content (W3, W5): Use /content-gen skill for LinkedIn posts, blog drafts, thought leadership, AI&U scripts, and professional social content. The skill checks campaign_posts table for dedup, applies brand voice from BRAND_IDENTITY.md (Context A for professional, Context C for personal), and persists all drafts to the campaign system. Offers Telegram push for mobile review.
```

---

## Change 10 — Knowledge Base Contents: Skills List

**Section:** `Knowledge Base Contents` → `Skills (26 total)`

**FIND:**
```
Skills (26 total)
SKILL_MORNING_BRIEF.md (RAG-grounded, domain health), SKILL_DEEP_RESEARCH.md, SKILL_DRAFT_EMAIL.md, SKILL_SESSION_RESUME.md (RAG-grounded, domain health), SKILL_ACTION_PLANNER.md (domain-aware), SKILL_BUILD_PRD.md, SKILL_DECISION_MEMO.md, SKILL_CHECKLIST_GEN.md, SKILL_WEEKLY_REVIEW.md (RAG-grounded, domain health), SKILL_BHARATVARSH_CONTENT.md, SKILL_SOCIAL_POST.md, SKILL_WORKFLOW_DESIGNER.md, SKILL_TECH_EVAL.md, SKILL_COMPETITIVE_INTEL.md, SKILL_VISUAL_ARTIFACT.md, SKILL_KB_SYNC.md, SYNC_FROM_REPO.md (deprecated — superseded by KB_SYNC), SKILL_DRIVE_KNOWLEDGE_DISTILL.md (monthly knowledge curation), SKILL_BRAND_GUIDELINES.md (context-aware brand token dispatch), SKILL_INFOGRAPHIC.md (React + matplotlib data visualization), SKILL_UI_DESIGN_PROCESS.md (anti-slop UI enforcement), SKILL_CAPTURE_ENTRY.md (journal/entry capture routing), SKILL_ENTRY_ANALYSIS.md (unprocessed entry triage), SKILL_CONTACT_LOOKUP.md (contact search/lookup), SKILL_LORE_CHECK.md (lore consistency validation), SKILL_BHARATVARSH_WRITER.md (lore-grounded fiction writing), SKILL_CREATE_TASK.md (standardized task creation with domain mapping, duplicate checking, annotation protocol, batch mode, quick syntax)
```

**REPLACE:**
```
Skills (26 total — upgraded 2026-03-19)

Tier 1 — Ritual Skills (daily/weekly orchestrators):
SKILL_MORNING_BRIEF.md (v2.0 — Calendar + Gmail + Life Graph pulse + contacts + knowledge + pipeline logging), SKILL_WEEKLY_REVIEW.md (v2.0 — pipeline stats + Life Graph deltas + journal metrics + write-back), SKILL_SESSION_RESUME.md (v2.0 — task tracking + decisions + session handoffs)

Tier 2 — Action Skills (create/execute/write-back):
SKILL_CREATE_TASK.md (standardized task creation with domain mapping, duplicate checking, annotation protocol, batch mode, quick syntax), SKILL_ACTION_PLANNER.md (v2.0 — dedup-before-create + Life Graph health weighting + Telegram push), SKILL_CAPTURE_ENTRY.md (v2.0 — auto-classification + domain tagging + task/decision chaining), SKILL_ENTRY_ANALYSIS.md (v2.0 — triage unprocessed journals into tasks/decisions/knowledge), SKILL_CONTACT_LOOKUP.md (v2.0 — 891 contacts + Gmail/Calendar enrichment + relationship context), SKILL_DRAFT_EMAIL.md (v2.0 — contact enrichment pre-flight + communication logging), SKILL_DEEP_RESEARCH.md (v2.0 — knowledge write-back + pipeline logging)

Tier 3 — Domain Skills (specialized content/creative):
SKILL_BHARATVARSH.md (v3.0 unified — replaces bharatvarsh-content + bharatvarsh-writer + lore-check. Three modes: content/writer/lore-check. Wires 11 MCP tools including query_lore, get_character, get_writing_style, check_lore_consistency), SKILL_CONTENT_GEN.md (v1.0 — non-Bharatvarsh content pipeline: LinkedIn, blog, AI&U. Dedup via campaign_posts + Telegram push), SKILL_SOCIAL_POST.md

Tier 4 — Infrastructure Skills (system management):
SKILL_LIFE_GRAPH.md (v1.0 — domain overview/deep-dive/add-context/complete/milestone-sync. Wires 9 Life Graph + Calendar Sync tools), SKILL_WORKFLOW_DESIGNER.md (v2.0 — pipeline dedup check + knowledge persistence), SKILL_KB_SYNC.md, SKILL_DRIVE_KNOWLEDGE_DISTILL.md (monthly knowledge curation)

Guard Skills (auto-activate):
SKILL_BRAND_GUIDELINES.md (context-aware brand token dispatch), SKILL_INFOGRAPHIC.md (React + matplotlib data visualization), SKILL_UI_DESIGN_PROCESS.md (anti-slop UI enforcement)

Unchanged utility skills:
SKILL_BUILD_PRD.md, SKILL_DECISION_MEMO.md, SKILL_CHECKLIST_GEN.md, SKILL_TECH_EVAL.md, SKILL_COMPETITIVE_INTEL.md, SKILL_VISUAL_ARTIFACT.md

Deprecated: SYNC_FROM_REPO.md (superseded by KB_SYNC)
Retired: SKILL_BHARATVARSH_CONTENT.md, SKILL_BHARATVARSH_WRITER.md, SKILL_LORE_CHECK.md (merged into SKILL_BHARATVARSH.md v3.0)

Cross-cutting patterns: 8 skills write back to DB via insert_record. 4 skills push to Telegram. 4 skills query Life Graph health. 3 skills dedup before create. 9 skills log execution via log_pipeline_run.
```

---

## Change 11 — Personal Capture System: Skill Descriptions

**Section:** `Current Build State` → `Personal Capture System`

**FIND:**
```
Skills: capture-entry (Claude.ai prefix routing), entry-analysis (triage unprocessed entries).
```

**REPLACE:**
```
Skills: capture-entry v2.0 (auto-classification into thought/task/decision/observation, domain tagging, chain to /create-task or knowledge base, batch mode), entry-analysis v2.0 (triage unprocessed entries into tasks/decisions/knowledge/reflections, batch approval, pipeline logging).
```

---

## Change 12 — Contact Intelligence Layer: Skill Descriptions

**Section:** `Current Build State` → `Contact Intelligence Layer (Complete — Sprint 10-A, Deployed)`

**FIND:**
```
contact-lookup skill. morning-brief, weekly-review, draft-email skills enhanced with contact context.
```

**REPLACE:**
```
contact-lookup v2.0 skill (full profile + Gmail history + Calendar meetings + relationship network + company lookup mode). morning-brief v2.0, weekly-review v2.0, draft-email v2.0 skills enhanced with contact context and upcoming date awareness.
```

---

## Summary of Changes

| # | Section | What Changed |
|---|---------|-------------|
| 1 | Bharatvarsh Lore Layer | 3 separate skills → 1 unified v3.0 |
| 2 | W2 Skills | Added /life-graph, /capture-entry, /entry-analysis; version tags |
| 3 | W3 Skills | Added /content-gen; version tags |
| 4 | W5 Skills | /bharatvarsh-content → /bharatvarsh + /content-gen |
| 5 | W4 Skills | Added /life-graph; version tags |
| 6 | Connector: Bharatvarsh | Unified skill reference + MCP tool list |
| 7 | Connector: Life Graph | /life-graph skill as primary interface |
| 8 | Connector: Capturing | Updated skill descriptions to match v2.0 |
| 9 | Connector: Content (NEW) | New paragraph for /content-gen |
| 10 | KB Contents: Skills | Full rewrite — tiered organization, version tags, retired list |
| 11 | Capture System | Updated skill version descriptions |
| 12 | Contact Intelligence | Updated skill version descriptions |

**No changes needed to:**
- Skill count ("26 skills" — unchanged: 3 removed + 3 added = net zero)
- MCP tool counts (unchanged)
- Architecture sections
- GCP config
- Dashboard descriptions
- Session Protocol
- Google Drive routing rules
