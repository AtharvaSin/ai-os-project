---
name: workflow-designer
description: "Skill: Workflow Designer"
---

# Skill: Workflow Designer

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user wants to design a new automation, workflow, agent, or background service for the AI Operating System. Trigger phrases include: "design a workflow for," "automate this," "build an agent that," "create a pipeline for," "how should I automate," "workflow for," or any request to convert a recurring process into a systematic, potentially automated workflow.

Also activate when the /action-planner skill flags automation candidates that need to be designed.

---

## Process

### Step 1: Understand the Workflow
Determine:
- **What** does this workflow do? (What input → what processing → what output?)
- **Why** automate it? (Frequency, time savings, consistency, error reduction)
- **Who** triggers it? (Human, schedule, event, another workflow)

### Step 1.5: Pipeline Dedup Check
Before classifying or designing, check whether a similar pipeline already exists:
- Call `query_db` with:
  ```sql
  SELECT slug, name, category, schedule, status, description FROM pipelines WHERE status = 'active' ORDER BY name
  ```
- Compare the proposed workflow's purpose against each active pipeline's name and description.
- **If a similar pipeline exists**, present the user with options:
  > An existing pipeline **'{name}'** ({category}, schedule: {schedule}) handles something similar: "{description}".
  >
  > Options:
  > **(a)** Extend this pipeline with the new capability
  > **(b)** Create a new separate pipeline (different enough to justify)
  > **(c)** Replace the existing pipeline with an upgraded design
  >
  > Which approach?
- Wait for the user's decision before proceeding to Step 2.
- **If no similar pipeline exists**, proceed directly.

### Step 2: Classify the Workflow

**Category A — Chat-Grounded (Claude session)**
Use when: The task needs human judgment, context-heavy reasoning, or interactive refinement.
Implementation: Encode as a skill document in this project's KB.
Example: Research tasks, content creation, architecture sessions.

**Category B — Scheduled Background Service**
Use when: The task runs on a predictable schedule, is fully deterministic, and needs no human input during execution.
Implementation: Cloud Run service + Cloud Scheduler.
Example: Birthday wishes, database maintenance, content audits, weekly report generation.

**Category C — Autonomous Agentic System**
Use when: The task involves conditional logic, multi-step reasoning, tool use decisions, or human-in-the-loop review gates.
Implementation: LangGraph on FastAPI + Cloud Run.
Example: Multi-source research aggregation, novel marketing content pipeline with review, complex data processing.

### Step 3: Specify the Workflow

Produce a **Workflow Specification** with these sections:

**1. Overview**
- Name
- Category (A / B / C)
- One-line description
- Trigger type (manual / cron / event / webhook)
- Frequency (if scheduled)

**2. Input/Output Contract**
- What goes in (data sources, parameters, context)
- What comes out (deliverables, side effects, notifications)

**3. Flow Design**
- Step-by-step process with decision points
- For Category B: Linear pipeline diagram
- For Category C: LangGraph-style graph with conditional edges and state schema
- Produce a Mermaid diagram showing the flow

**4. Tools & Integrations**
- Which MCP servers / APIs are needed
- Which databases are read from / written to
- Which external services are called

**5. AI Model Routing**
- Which model for which step:
  - Haiku ($1/$5 per MTok) — classification, routing, simple extraction
  - Sonnet ($3/$15 per MTok) — generation, synthesis, standard reasoning
  - Opus ($5/$25 per MTok) — complex reasoning, novel-quality writing, architecture

**6. Expert-in-the-Loop Gates**
- Where does a human need to review/approve?
- What does the human see at the gate? (preview of output, confidence score, options)
- What happens if the human rejects? (retry, modify, abort)

**7. Data Schema**
- Postgres tables needed (new or existing)
- Fields, types, relationships
- Reference DB_SCHEMA.md if it exists

**8. Error Handling**
- What happens when each step fails?
- Retry logic
- Dead letter / alerting
- Graceful degradation

**9. Cost Estimate**
- Estimated tokens per run (input + output per model)
- Estimated cost per run
- Monthly cost at expected frequency
- Compare to doing it manually

**10. Implementation Plan**
- Build order (which pieces first)
- Dependencies
- Testing approach
- Phase assignment (which OS build phase this fits into)

### Step 4: Deliver and Persist

After delivering the workflow specification to the user:

1. **Persist the design** — Call `insert_record(table: 'knowledge_entries', entry_type: 'workflow-design', content: {workflow_name, category, trigger_type, frequency, tools_used, cost_estimate_monthly, implementation_phases, date})`. This makes the design discoverable by future sessions. If the user chose to extend or replace an existing pipeline (from Step 1.5), note the original pipeline slug in the content for lineage.

2. **Offer next steps:**
   - "Want me to add this to the Evolution Log?"
   - "Ready to start building any components?"
   - "Should I create implementation tasks via /action-planner?"

### Step 5: Log Pipeline Run
After all steps complete, call:
```
log_pipeline_run(
  slug: 'workflow-designer',
  status: 'success',
  metadata: {
    workflow_name: '<name of designed workflow>',
    category: '<A|B|C>',
    trigger_type: '<manual|cron|event|webhook>',
    extends_existing: '<pipeline slug or null>',
    replaces_existing: '<pipeline slug or null>',
    estimated_monthly_cost: '<dollar amount>',
    tools_count: <number of tools/integrations used>
  }
)
```
If any step fails, log with `status: 'error'` and include the failure reason in metadata.

---

## Output Format

For simple Category A workflows (skill design): Present the spec in chat and offer to create the skill document.

For Category B/C workflows: Produce as a downloadable markdown or docx artifact — these specs become the blueprint for actual development.

Always include a Mermaid diagram of the workflow flow.

After delivering, ask: "Want me to add this to the Evolution Log, persist the design to the knowledge base, or start building any components?"

---

## Quality Rules

- Start with the simplest category that works. Don't design a LangGraph agent for what a Cloud Run service can handle.
- Cost estimates must be realistic. A workflow running 30 times/day at $0.05/run = $45/month. Make this visible.
- Every workflow must have an error handling section. "It won't fail" is not acceptable.
- Expert-in-the-loop gates should be the default for any workflow that produces public-facing content.
- The Mermaid diagram is not optional — visual representation catches design flaws that prose hides.
- Reference the Reference Architecture for all technology choices. Don't propose tools outside the stack without justification.
- Always check for existing pipelines before designing a new one. Extending is better than duplicating.
- When replacing an existing pipeline, document what changes and what carries over.

---

## Connectors Used

- **Knowledge base: Reference Architecture** — tech stack grounding (required)
- **Knowledge base: WORK_PROJECTS.md** — project context
- **Knowledge base: DB_SCHEMA.md** — database schema (when available)
- **Knowledge base: EVOLUTION_LOG.md** — prior workflow decisions
- **Past chats search** — previous discussions about this workflow
- **MCP Gateway: query_db** — fetch active pipelines for dedup checking before designing new workflows
- **MCP Gateway: insert_record** — persist workflow designs as knowledge_entries for cross-session discovery
- **MCP Gateway: log_pipeline_run** — record skill execution for observability and analytics
