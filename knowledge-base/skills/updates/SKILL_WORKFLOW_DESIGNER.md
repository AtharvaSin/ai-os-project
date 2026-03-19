# Skill: Workflow Designer v2.0

> **Scope:** Designs new automation workflows by classifying them into the three-category architecture (A/B/C), checking for existing similar pipelines to prevent duplication, and persisting the design to the knowledge base. The system architect for the AI OS automation layer.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.
>
> **Runtime:** Claude.ai (primary). Claude Code executes the actual implementation.
>
> **Version:** 2.0 — Upgraded with dedup-before-design pattern and knowledge persistence.

---

## When to Use

Activate this workflow when the user wants to design a new automation, pipeline, scheduled job, or workflow for the AI Operating System.

**Trigger phrases:** "workflow", "automate", "build a pipeline", "scheduled job", "new automation", "design a workflow", "Category B service", "Category C agent", "cron job", "recurring task", "automate {X}"

**Also activate when:** The user describes a process they're doing manually and it sounds like it could be automated. Suggest: "This sounds like it could be a workflow. Want me to design it?"

---

## Process

### Step 1: Check Existing Pipelines (NEW — Dedup Before Design)

**Tool calls:**

1. **`query_db`** → Get all active pipelines (AIOSMCP)
   ```sql
   SELECT slug, name, category, schedule, status, description
   FROM pipelines
   WHERE status = 'active'
   ORDER BY name
   ```

2. Compare the proposed workflow against existing pipelines:
   - Check for semantic similarity (same purpose, different name)
   - Check for functional overlap (different scope but same data sources)

3. **If similar pipeline exists:**
   > "An existing pipeline '{name}' ({category}) already handles something similar: {description}
   > Options: (a) Extend this pipeline, (b) Create a new one, (c) Replace it"

4. **If no overlap:** Proceed to design.

### Step 2: Classify the Category

Follow the architecture decision tree from `TOOL_ECOSYSTEM_PLAN.md`:

| Category | When to Use | Examples |
|----------|-------------|---------|
| **A — Claude.ai Skill** | Interactive, needs human judgment, uses connectors | Content generation, planning, reviews |
| **B — Cloud Run Service** | Scheduled, no human input, fixed logic, needs DB/API access | Daily briefs, knowledge sync, health scoring |
| **C — LangGraph Agent** | Conditional logic, multi-step reasoning, human-in-the-loop | Complex analysis, research agents |

**Decision flow:**
1. Does it need real-time human input? → Category A (skill)
2. Is it a fixed schedule with deterministic logic? → Category B (Cloud Run + Scheduler)
3. Does it need conditional branching or multi-agent orchestration? → Category C (LangGraph)
4. Is it a one-off task? → Don't build a workflow — just do it

### Step 3: Design the Workflow

**Output format:**

```
## Workflow Design — {Name}

### Classification
**Category:** {A / B / C}
**Rationale:** {Why this category}

### Purpose
{One sentence: what this workflow does and why it exists}

### Trigger
{Schedule (cron expression), event trigger, or manual invocation}

### Data Flow
```
{Step-by-step data flow diagram in text}
1. Input: {data source}
2. Process: {what happens}
3. Output: {where results go}
4. Notification: {how user is notified}
```

### Infrastructure Requirements
- **Runtime:** {Cloud Run / Cloud Function / Claude.ai / Local}
- **Database tables:** {which tables are read/written}
- **Secrets needed:** {which Secret Manager secrets}
- **External APIs:** {any third-party APIs}
- **Estimated cost:** {monthly cost estimate}

### Implementation Notes
- {Key technical decisions}
- {Error handling strategy}
- {Retry/backoff policy}
- {Logging approach}

### Similar Existing Pipelines
{From Step 1 — how this relates to existing workflows}
```

### Step 4: User Approval

Present the design for review. The user may:
- Approve → proceed to persist
- Modify → adjust and re-present
- Reject → no persistence
- Redirect to Claude Code → for actual implementation

### Step 5: Persist the Design

5. **`insert_record`** → Log the workflow design to `knowledge_entries` (AIOSMCP)
   - Params: `table: 'knowledge_entries'`, `entry_type: 'workflow-design'`, `content: {full_design}`

6. **`log_pipeline_run`** → Track the design session (AIOSMCP)
   - Params: `slug: 'workflow-designer'`, `status: 'success'`, `metadata: {workflow_name, category}`

### Step 6: Implementation Handoff

If the user wants to implement:
- **Category A:** Generate the skill file and suggest `/kb-sync` to push
- **Category B:** Generate a Claude Code implementation checklist:
  ```
  Implementation in Claude Code:
  1. Create directory: workflows/category-b/{slug}/
  2. Write: main.py, requirements.txt, Dockerfile, cloudbuild.yaml
  3. Create migration if new tables needed
  4. Deploy: gcloud run deploy {slug} ...
  5. Schedule: gcloud scheduler jobs create http {slug}-trigger ...
  6. Test: verify first run
  ```
- **Category C:** Flag as higher complexity, suggest breaking into phases

---

## Quality Rules

- **Always dedup first.** The pipeline table check in Step 1 is mandatory. Never design a duplicate.
- **Follow the architecture.** Category classification must follow TOOL_ECOSYSTEM_PLAN.md. Don't create Category C when Category B suffices.
- **Cost estimation.** Every design must include a monthly cost estimate. The OS targets $0-7/month for infrastructure.
- **Error handling is mandatory.** Every design must specify what happens when the workflow fails.
- **Persist the design.** Every approved design gets logged to `knowledge_entries` for future reference.
- **Simple first.** "Cloud Functions before LangGraph. Plain Python before frameworks."

---

## MCP Tools Used

| Tool | Module | When |
|------|--------|------|
| `query_db` | PostgreSQL (AIOSMCP) | Existing pipeline lookup |
| `insert_record` | PostgreSQL (AIOSMCP) | Design persistence to knowledge_entries |
| `log_pipeline_run` | PostgreSQL (AIOSMCP) | Execution logging |

---

## Connectors Used

- **AIOSMCP** — PostgreSQL module (3 tools)
- **Knowledge Base** — TOOL_ECOSYSTEM_PLAN.md, GCP_INFRA_CONFIG.md for architecture reference
