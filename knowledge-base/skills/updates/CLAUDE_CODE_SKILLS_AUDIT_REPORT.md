# Claude Code Skills Audit Report

**Date:** 2026-03-19
**Scope:** All 26 skills in `.claude/skills/`
**Context:** Post Claude.ai skills ecosystem upgrade (14 skills upgraded/created in KB)

---

## Executive Summary

The Claude Code skills have **diverged significantly** from the upgraded Claude.ai skills. The Claude.ai KB now has v2.0/v3.0 skills with write-back, Telegram notifications, Life Graph awareness, and dedup logic — but the Claude Code counterparts are still on v1.0 without any of these patterns. Additionally, there are **cross-cutting bugs** (stale file references, missing frontmatter) and **3 missing skills** that exist in Claude.ai but have no Claude Code counterpart.

### Scorecard

| Category | Count | Skills |
|----------|-------|--------|
| Solid — no changes needed | 8 | update-project-state, brand-guidelines, ui-design-process, infographic, drive-knowledge-distill, kb-sync, capture-entry, contact-lookup |
| Needs alignment with Claude.ai v2.0 | 8 | morning-brief, weekly-review, session-resume, action-planner, draft-email, deep-research, bharatvarsh-content, workflow-designer |
| Prompt templates — working fine | 7 | social-post, build-prd, decision-memo, checklist-gen, tech-eval, competitive-intel, visual-artifact |
| Stale / deprecated | 1 | sync-from-repo |
| Missing entirely | 3 | /life-graph, /content-gen, /bharatvarsh (unified) |
| Entry analysis (good MCP) | 1 | entry-analysis |

---

## Tier 1: Solid — No Changes Needed (8 skills)

### update-project-state
**Rating:** Excellent
**Why:** Most comprehensive skill in the repo. 11-step process covering filesystem scanning, git state, drift detection, KB updates, PROJECT_INSTRUCTIONS.md updates. Claude Code-specific and appropriate. Well-structured output template.
**Lines:** 339 | **MCP tools:** query_db (via SQL examples) | **Write-back:** Yes (writes PROJECT_STATE.md, updates KB files)

### brand-guidelines
**Rating:** Solid
**Why:** Clean dispatcher pattern. Context identification → token loading → anti-pattern check → output declaration. References TOKENS.md correctly. Escalation paths to infographic and ui-design-process skills.

### ui-design-process
**Rating:** Solid
**Why:** Mandatory pre-build process prevents AI slop. 6-step pipeline: context → use case → aesthetic direction → anti-slop checklist → differentiation → build → self-review. Has a companion ANTI_SLOP_CHECKLIST.md reference file.

### infographic
**Rating:** Solid
**Why:** 4-mode skill (React, Matplotlib, SVG, Mermaid). Correct token tables for all 3 brand contexts. Has companion assets: 3 React templates (MetricCard, ComparisonTable, ProcessFlow) + matplotlib theme file.

### drive-knowledge-distill
**Rating:** Solid
**Why:** Thorough 3-mode skill (Direct Drive Read, Pipeline DB, Manual Paste). Classification rules table, human-in-the-loop gate, connection proposals, pipeline logging. Well-wired MCP tools (list_drive_files, read_drive_file, get_drive_changes_summary, query_db, search_knowledge, insert_record, log_pipeline_run).

### kb-sync
**Rating:** Solid
**Why:** Correctly identifies itself as a Claude.ai-primary skill with a Claude Code pointer. Points to the full specification in `knowledge-base/skills/SKILL_KB_SYNC.md`. Appropriate scope for Claude Code.

### capture-entry
**Rating:** Good
**Why:** Clean prefix-based routing (Journal:, Entry:, Entry idea:, Entry epiphany:, Entry memory:). Correctly calls `capture_entry` MCP tool with parsed metadata. Minimal and focused.
**Minor note:** The Claude.ai v2.0 adds auto-classification, domain tagging, and chain actions (create-task, decision logging) that this version doesn't have. Low priority since capture from Claude Code is less common than Claude.ai.

### contact-lookup
**Rating:** Good
**Why:** Correct MCP tool selection (search_contacts, get_contact, get_contact_network, update_contact, add_relationship). Handles name lookup, company search, tag/domain filtering. Network overview mode. Good quality rules on PII.

---

## Tier 2: Needs Alignment with Claude.ai v2.0 (8 skills)

These skills work but are missing patterns from the Claude.ai upgrade: write-back, Telegram push, dedup, pipeline logging.

---

### morning-brief
**Rating:** Good but stale
**Gaps:**
1. **Stale file reference:** References `OS_EVOLUTION_LOG.md` at line 143 — should be `EVOLUTION_LOG.md`
2. **No pipeline logging:** Claude.ai v2.0 calls `log_pipeline_run(slug: 'morning-brief')` after execution. This version doesn't.
3. **No active tasks query:** Claude.ai v2.0 runs a SQL query for top 5 active tasks by priority. This version relies on WORK_PROJECTS.md fallback.
4. **Connector mismatch:** Steps 1-2 use Google Calendar and Gmail connectors which are only available in Claude.ai. Claude Code gets MCP tools (`gcal_list_events`, `gmail_search_messages`) — but the skill doesn't mention these.
**Upgrade effort:** Low — add pipeline logging, fix file reference, add tasks query.

---

### weekly-review
**Rating:** Good but missing write-back
**Gaps:**
1. **No write-back:** Claude.ai v2.0 calls `insert_record(table: 'knowledge_entries', type: 'weekly-review')` to persist the review for delta comparison next week. This version doesn't persist anything.
2. **No pipeline logging:** Missing `log_pipeline_run` call.
3. **Stale file reference:** References `OS_EVOLUTION_LOG.md` at line 234 — should be `EVOLUTION_LOG.md`.
4. **Good existing MCP integration:** Already has Knowledge Layer queries (Step 2b), Life Graph review (Step 2c), Contact Network health (Step 2d). These are strong.
**Upgrade effort:** Low — add write-back + pipeline logging + fix file reference.

---

### session-resume
**Rating:** Good but missing session handoff
**Gaps:**
1. **No session handoff pattern:** Claude.ai v2.0 has a "Session End: Create Handoff" flow that saves `session-handoff` entries to `knowledge_entries`, and retrieves them on resume. This version doesn't.
2. **Stale file reference:** References `OS_EVOLUTION_LOG.md` — should be `EVOLUTION_LOG.md`.
3. **Good existing MCP integration:** Already has Knowledge Layer primary (Step 2A), Life Graph context (Step 2A.4), past chats fallback.
**Upgrade effort:** Medium — add handoff creation + retrieval + fix file reference.

---

### action-planner
**Rating:** Functional but missing critical patterns
**Gaps:**
1. **No dedup-before-create:** Claude.ai v2.0 calls `get_domain_tasks` to pull existing active tasks and checks similarity before creating new ones (>80% overlap = flag). This version creates tasks without checking.
2. **No plan persistence:** Claude.ai v2.0 calls `insert_record(type: 'action-plan')` to log approved plans. This version doesn't persist anything.
3. **No Telegram push:** Claude.ai v2.0 offers `send_telegram_message` for plan summary. Missing here.
4. **No pipeline logging:** Missing `log_pipeline_run`.
5. **No prioritization scoring:** Claude.ai v2.0 has a weighted scoring formula (urgency × domain health × priority base). This version uses simpler P0/P1/P2.
**Upgrade effort:** Medium-High — dedup logic is the biggest addition.

---

### draft-email
**Rating:** Good, minor gaps
**Gaps:**
1. **No birthday proximity check:** Claude.ai v2.0 calls `get_upcoming_dates` and suggests mentioning a birthday if within 3 days. Missing here.
2. **No communication logging:** Claude.ai v2.0 offers `insert_record(type: 'communication-log')` to persist key points. Missing here.
3. **Already has contact lookup:** Uses `search_contacts` and `get_contact` correctly.
4. **Connector dependency:** Uses Gmail connector (search, send, message compose) which is Claude.ai-only. Claude Code would need MCP `gmail_*` tools.
**Upgrade effort:** Low — add upcoming dates check + optional logging.

---

### deep-research
**Rating:** Functional but zero MCP integration
**Gaps:**
1. **No knowledge base check:** Claude.ai v2.0 calls `search_knowledge` to find existing research before web searching. This version only checks Drive and past chats.
2. **No write-back:** Claude.ai v2.0 calls `insert_record(type: 'research')` to persist findings. This version produces artifacts but doesn't persist anything to the DB.
3. **No pipeline logging:** Missing `log_pipeline_run`.
4. **No MCP tools listed:** The Connectors section only lists web search, Drive, past chats, KB. No MCP Gateway tools at all.
**Upgrade effort:** Low — add search_knowledge check, insert_record write-back, log_pipeline_run.

---

### bharatvarsh-content
**Rating:** Outdated — needs replacement
**Gaps:**
1. **Still separate skill:** Claude.ai has a unified `/bharatvarsh` v3.0 with 3 modes (content/writer/lore-check). This is still the old content-only version.
2. **References deprecated skill:** Line 21 says "use the `bharatvarsh-writer` skill instead" — but bharatvarsh-writer was merged.
3. **Missing writer mode entirely:** No fiction/narrative writing capability.
4. **Missing lore check mode:** No standalone lore validation.
5. **No write-back:** Doesn't call `insert_record` for campaign_posts. Doesn't call `log_pipeline_run`.
6. **No Telegram push:** Missing `send_telegram_message` for draft review.
7. **Good lore tools:** Already references check_lore_consistency, get_character, search_lore, query_lore, get_timeline.
**Upgrade effort:** High — needs full rewrite to match unified v3.0 spec.

---

### workflow-designer
**Rating:** Functional but no MCP integration
**Gaps:**
1. **No pipeline dedup check:** Claude.ai v2.0 queries `pipelines` table before designing to prevent duplicates. This version doesn't.
2. **No write-back:** Doesn't persist designs via `insert_record`. Doesn't call `log_pipeline_run`.
3. **Stale Category B description:** Line 34 says "Cloud Function (Gen 2) + Cloud Scheduler" but all Category B services are on Cloud Run. This is a factual error.
4. **Missing YAML frontmatter:** No `---` block at the top (unlike other skills).
5. **No MCP tools listed:** The Connectors section only lists KB docs and past chats.
**Upgrade effort:** Medium — add pipeline lookup, write-back, fix Category B description, add frontmatter.

---

## Tier 3: Prompt Templates — Working Fine (7 skills)

These are pure prompt/structure templates that don't need MCP integration. They work as-is in both Claude.ai and Claude Code.

| Skill | Rating | Notes |
|-------|--------|-------|
| **social-post** | Good | Platform-specific generation, voice calibration table. References correct KB docs. References `/bharatvarsh-content` at line 18 — should be updated to `/bharatvarsh`. |
| **build-prd** | Good | 10-section PRD structure. Clean. No issues. |
| **decision-memo** | Good | One-page constraint, dissenting considerations, reversibility. Clean. |
| **checklist-gen** | Good | Priority markers, templates by use case. Missing YAML frontmatter. |
| **tech-eval** | Good | 5-criteria scoring matrix. Clean. |
| **competitive-intel** | Good | Competitor profiles, positioning map, differentiation. Clean. |
| **visual-artifact** | Good | Visual type identification, design principles. References brand tokens correctly. |

---

## Tier 4: Stale / Deprecated (1 skill)

### sync-from-repo
**Status:** Explicitly deprecated. Superseded by `/kb-sync`.
**Recommendation:** Delete the directory `.claude/skills/sync-from-repo/` entirely.

---

## Tier 5: Missing — Need Creation (3 skills)

These exist as upgraded skills in the Claude.ai KB but have NO Claude Code counterpart.

| Skill | Priority | Rationale |
|-------|----------|-----------|
| `/life-graph` | HIGH | Wires 9 MCP tools. Foundation for other skills. Claude Code can call all Life Graph MCP tools directly. |
| `/content-gen` | MEDIUM | Non-Bharatvarsh content pipeline. Less frequently used from Claude Code. |
| `/bharatvarsh` (unified) | HIGH | Replace `bharatvarsh-content` with unified 3-mode skill matching Claude.ai v3.0. |

---

## Cross-Cutting Issues

### Issue 1: Stale File References
**`OS_EVOLUTION_LOG.md` → `EVOLUTION_LOG.md`**

The actual file is `knowledge-base/EVOLUTION_LOG.md` but multiple skills reference the old name:

| Skill | Line(s) |
|-------|---------|
| morning-brief | 143 |
| weekly-review | 234 |
| session-resume | 129 |
| action-planner | 115 |
| workflow-designer | 132 |
| decision-memo | 97 |

**Fix:** Find-and-replace `OS_EVOLUTION_LOG.md` → `EVOLUTION_LOG.md` across all 6 files.

### Issue 2: Missing YAML Frontmatter
Two skills lack the standard `---` frontmatter block:

| Skill | Impact |
|-------|--------|
| workflow-designer | Won't be discovered by Claude Code's skill matching |
| checklist-gen | Won't be discovered by Claude Code's skill matching |

**Fix:** Add frontmatter block with `name` and `description` fields.

### Issue 3: No Write-Back Pattern in Claude Code
The Claude.ai v2.0 upgrade established that **8 skills must persist output** via `insert_record` + `log_pipeline_run`. None of the Claude Code versions implement this.

| Skill | Missing Write-Back |
|-------|-------------------|
| morning-brief | `log_pipeline_run` |
| weekly-review | `insert_record` (review to knowledge_entries) + `log_pipeline_run` |
| action-planner | `insert_record` (plan to knowledge_entries) + `log_pipeline_run` |
| deep-research | `insert_record` (findings to knowledge_entries) + `log_pipeline_run` |
| workflow-designer | `insert_record` (design to knowledge_entries) + `log_pipeline_run` |
| bharatvarsh-content | `insert_record` (draft to campaign_posts) + `log_pipeline_run` |

### Issue 4: No Telegram Notification Pattern
The Claude.ai v2.0 added `send_telegram_message` to 4 skills. None of the Claude Code versions have this:
- action-planner (plan summary)
- bharatvarsh-content (draft review)
- content-gen (draft review) — skill doesn't exist yet
- capture-entry (confirmation) — low priority for Claude Code

### Issue 5: Stale Cross-Skill References
| Skill | Reference | Should Be |
|-------|-----------|-----------|
| bharatvarsh-content:21 | "use the `bharatvarsh-writer` skill" | "use writer mode of this skill" (or reference unified /bharatvarsh) |
| social-post:18 | "/bharatvarsh-content" | "/bharatvarsh" |

### Issue 6: Stale Category B Description
workflow-designer:34 says `"Cloud Function (Gen 2) + Cloud Scheduler"` but all Category B services run on Cloud Run due to a persistent buildpack issue. Should say `"Cloud Run service + Cloud Scheduler"`.

---

## Recommended Upgrade Priority

### Phase 1 — Quick Wins (30 min total)
1. **Fix stale file references** — `OS_EVOLUTION_LOG.md` → `EVOLUTION_LOG.md` in 6 files
2. **Add missing frontmatter** — workflow-designer, checklist-gen
3. **Fix cross-skill references** — bharatvarsh-content, social-post
4. **Fix Category B description** — workflow-designer
5. **Delete sync-from-repo** — deprecated

### Phase 2 — Write-Back & Logging (1-2 hours)
6. **Add `log_pipeline_run`** to: morning-brief, weekly-review, action-planner, deep-research, workflow-designer
7. **Add `insert_record` write-back** to: weekly-review, action-planner, deep-research, workflow-designer
8. **Add `search_knowledge` pre-check** to: deep-research
9. **Add `get_upcoming_dates`** to: draft-email
10. **Add session handoff pattern** to: session-resume

### Phase 3 — Structural Upgrades (2-3 hours)
11. **Replace bharatvarsh-content** with unified `/bharatvarsh` v3.0 (3 modes)
12. **Add dedup-before-create** to: action-planner
13. **Add pipeline dedup** to: workflow-designer
14. **Create `/life-graph` skill** for Claude Code
15. **Create `/content-gen` skill** for Claude Code

### Phase 4 — Optional Enhancements
16. **Add Telegram notification** to: action-planner, bharatvarsh (content mode)
17. **Add weighted prioritization scoring** to: action-planner
18. **Add active tasks SQL query** to: morning-brief
19. **Align capture-entry** with v2.0 (auto-classification, domain tagging)

---

## Summary Metrics

| Metric | Current | After Full Upgrade |
|--------|---------|-------------------|
| Skills with write-back | 2 (drive-knowledge-distill, update-project-state) | 8 |
| Skills with pipeline logging | 1 (drive-knowledge-distill) | 7 |
| Skills with stale references | 6 | 0 |
| Missing skills (vs Claude.ai) | 3 | 0 |
| Deprecated skills still present | 1 | 0 |
| Skills with Telegram push | 0 | 2-4 |
| Skills aligned with Claude.ai v2.0 | 10 | 26 |
