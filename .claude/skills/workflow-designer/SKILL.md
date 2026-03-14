---
name: workflow-designer
description: "Category B/C workflow specification with flow diagrams and cost estimates. Use when user wants to design, automate, or build a workflow, agent, or background service."
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

### Step 2: Classify the Workflow

**Category A — Chat-Grounded (Claude session)**
Use when: The task needs human judgment, context-heavy reasoning, or interactive refinement.
Implementation: Encode as a skill document in this project's KB.
Example: Research tasks, content creation, architecture sessions.

**Category B — Scheduled Background Service**
Use when: The task runs on a predictable schedule, is fully deterministic, and needs no human input during execution.
Implementation: Cloud Function (Gen 2) + Cloud Scheduler.
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
- Supabase tables needed (new or existing)
- Fields, types, relationships
- Reference SUPABASE_SCHEMA.md if it exists

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

---

## Output Format

For simple Category A workflows (skill design): Present the spec in chat and offer to create the skill document.

For Category B/C workflows: Produce as a downloadable markdown or docx artifact — these specs become the blueprint for actual development.

Always include a Mermaid diagram of the workflow flow.

After delivering, ask: "Want me to add this to the Evolution Log, or start building any components?"

---

## Quality Rules

- Start with the simplest category that works. Don't design a LangGraph agent for what a Cloud Function can handle.
- Cost estimates must be realistic. A workflow running 30 times/day at $0.05/run = $45/month. Make this visible.
- Every workflow must have an error handling section. "It won't fail" is not acceptable.
- Expert-in-the-loop gates should be the default for any workflow that produces public-facing content.
- The Mermaid diagram is not optional — visual representation catches design flaws that prose hides.
- Reference the Reference Architecture for all technology choices. Don't propose tools outside the stack without justification.

---

## Connectors Used

- **Knowledge base: Reference Architecture** — tech stack grounding (required)
- **Knowledge base: WORK_PROJECTS.md** — project context
- **Knowledge base: SUPABASE_SCHEMA.md** — database schema (when available)
- **Knowledge base: OS_EVOLUTION_LOG.md** — prior workflow decisions
- **Past chats search** — previous discussions about this workflow
