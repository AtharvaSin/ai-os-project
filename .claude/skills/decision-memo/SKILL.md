---
name: decision-memo
description: "One-page decision document with options analysis and recommendation. Use when user needs to decide, evaluate trade-offs, compare options, or document a decision."
---

# Skill: Decision Memo

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user needs to make, document, or evaluate a decision. Trigger phrases include: "help me decide," "decision memo," "should I," "evaluate the trade-offs," "what's the best option," "compare these options," "document this decision," or any request involving structured decision-making between alternatives.

Also activate at the end of a working session when a significant decision has been reached and needs to be formalized before logging in the Evolution Log.

---

## Process

### Step 1: Frame the Decision
Identify:
- **What** is being decided? State in one sentence.
- **Why now?** What triggered this decision point?
- **What are the constraints?** Time, budget, technical, organizational.
- **Who is affected?** Which projects, stakeholders, or systems.

### Step 2: Pull Context
- Check **Evolution Log** for prior decisions in this domain that may constrain or inform this one
- Reference **WORK_PROJECTS.md** for project state that affects the decision
- If technical, reference the **Reference Architecture** for stack alignment
- Search **past chats** for previous discussions about this topic

### Step 3: Structure the Memo
Follow this format strictly — the memo must fit on ONE page:

**DECISION**
[One sentence: what is being decided]

**CONTEXT**
[2-3 sentences: why this decision matters now. What triggered it.]

**OPTIONS**

| Option | Pros | Cons | Effort | Risk |
|--------|------|------|--------|------|
| A: ... | ... | ... | ... | ... |
| B: ... | ... | ... | ... | ... |
| C: ... | ... | ... | ... | ... |

**ANALYSIS**
[3-5 sentences: the key trade-off. What matters most given current constraints? What would change the answer?]

**RECOMMENDATION**
[One sentence: the recommended option and why.]

**DISSENTING CONSIDERATIONS**
[1-2 sentences: the strongest argument against the recommendation. What would make you reconsider?]

**REVERSIBILITY**
[One sentence: how easy is it to reverse this decision if it turns out wrong?]

**STATUS**
[ ] Proposed — awaiting review
[ ] Decided — proceeding with Option X
[ ] Superseded — replaced by [later decision]

---

## Output Format

Present directly in chat as a structured response. The one-page constraint is intentional — decision memos should be scannable in 60 seconds.

If the user confirms the decision, offer to:
1. Log it in the Evolution Log
2. Update WORK_PROJECTS.md if it changes a project's status or direction
3. Update the Reference Architecture if it's a technical architecture decision

---

## Quality Rules

- Maximum 3 options. More than 3 means the decision isn't framed tightly enough — help narrow first.
- Every option must have at least one genuine pro and one genuine con. If an option has no cons, it's not really a decision.
- The DISSENTING CONSIDERATIONS section is mandatory. It proves the recommendation was stress-tested.
- REVERSIBILITY matters more than most people think. Flag one-way-door decisions explicitly.
- Don't pad. If the decision is straightforward, the memo should be short.
- Never recommend "it depends" — commit to a recommendation and state what would change it.

---

## Connectors Used

- **Knowledge base: EVOLUTION_LOG.md** — prior decisions
- **Knowledge base: WORK_PROJECTS.md** — project state
- **Knowledge base: Reference Architecture** — technical alignment
- **Past chats search** — previous discussions
