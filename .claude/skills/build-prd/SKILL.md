---
name: build-prd
description: "Full PRD generation with professional docx output. Use when user asks for a PRD, spec, requirements document, implementation plan, or feature specification."
---

# Skill: Build PRD

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks to create a product requirements document, feature spec, implementation plan, or technical specification. Trigger phrases include: "build a PRD," "write a spec," "create requirements for," "spec this out," "product requirements," "implementation plan for," or any request for a structured product/feature document.

Also activate when the user describes a feature or system they want to build and needs it formalized into a document before development.

---

## Process

### Step 1: Understand the Product Context
Determine:
- **What** is being specified? (a feature, a full product, a system component, a workflow)
- **Who** is the audience for this PRD? (yourself, a dev team, a client, a stakeholder)
- **Which project?** Map to active focus projects in WORK_PROJECTS.md — AI OS, AI&U, Bharatvarsh, Zealogics, or external.

If the user gives enough context upfront, proceed directly into the document. Don't over-clarify.

### Step 2: Pull Relevant Context
- If this is an **AI OS component**, load the Reference Architecture for tech stack grounding
- If this is a **Bharatvarsh feature**, load BHARATVARSH_PLATFORM.md for current tech and architecture
- If this is for a **professional engagement**, reference WORK_PROJECTS.md and the Career Reference Index for domain context
- Check **past chats** for any previous discussions about this feature

### Step 3: Generate the PRD
Follow this structure strictly:

**1. Problem Statement**
What problem does this solve? Who experiences it? What happens if we don't solve it?

**2. Goals & Success Metrics**
What does "done" look like? How will we measure success? Include specific, measurable targets.

**3. User Personas**
Who uses this? 2-3 personas with name, role, key need, and frustration.

**4. User Stories**
As a [persona], I want [action] so that [outcome]. Group by persona. Mark priority (P0/P1/P2).

**5. Functional Requirements**
Organized by priority:
- **P0 (Must Have)** — Ship-blocking. Without these, the product doesn't work.
- **P1 (Should Have)** — Important but not blocking launch.
- **P2 (Nice to Have)** — Enhancements for future iterations.

Each requirement: ID, description, acceptance criteria.

**6. Non-Functional Requirements**
Performance, security, scalability, accessibility, compliance constraints.

**7. Technical Architecture**
High-level system design. Reference the user's actual tech stack. Include: components, data flow, integrations, infrastructure. Produce a Mermaid diagram if helpful.

**8. Implementation Plan**
Phases with milestones. Each phase: scope, deliverables, estimated effort, dependencies.

**9. Risks & Mitigations**
Technical risks, resource risks, timeline risks. Each with likelihood, impact, and mitigation strategy.

**10. Open Questions**
What remains unresolved? What needs stakeholder input?

### Step 4: Deliver as Document
Produce as a professional **docx file** with:
- Table of contents
- Clean heading hierarchy
- Tables for requirements and risks
- Mermaid or text-based architecture diagram

---

## Output Format

Always produce as a downloadable docx artifact. PRDs are reference documents that get shared, annotated, and revisited — they need to exist outside of chat.

After delivering, ask: "Want me to log this in the Evolution Log, or break the implementation plan into an action plan?"

---

## Quality Rules

- Requirements must be testable. "The system should be fast" is not a requirement. "API response time < 200ms at p95" is.
- P0 requirements should be the minimum viable set. If there are more than 8-10 P0 items, the scope is too large — suggest splitting into phases.
- The architecture section must reference the user's actual tech stack, not generic recommendations.
- Every requirement needs acceptance criteria — how do you know it's done?
- Keep the PRD under 15 pages. If it's longer, the scope needs tightening.
- User stories should reflect real user behavior, not developer tasks disguised as stories.

---

## Connectors Used

- **Knowledge base: Reference Architecture** — for technical grounding
- **Knowledge base: BHARATVARSH_PLATFORM.md** — if speccing Bharatvarsh features
- **Knowledge base: WORK_PROJECTS.md** — for project context
- **Past chats search** — for previous discussions about the feature
- **File creation (docx)** — required for output
