---
name: tech-eval
description: "Technology evaluation scored against Reference Architecture on 5 criteria. Use when user asks to evaluate, compare, or assess a technology, framework, or tool for adoption."
---

# Skill: Tech Evaluation

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks to evaluate a specific technology, framework, service, tool, or platform for potential adoption. Trigger phrases include: "evaluate," "should I use," "compare X vs Y," "is X good for," "tech eval," "what do you think of X for our stack," or any request to assess whether a technology fits the user's needs and architecture.

This is distinct from /deep-research (which is general-purpose research). /tech-eval is specifically for technology adoption decisions measured against the user's existing architecture.

---

## Process

### Step 1: Define Evaluation Scope
- **What** technology is being evaluated? (specific name, version if relevant)
- **For what purpose?** What problem does it solve? What existing tool/approach would it replace or augment?
- **In what context?** Which project, which layer of the architecture?

### Step 2: Load Architecture Context
Always reference the **Reference Architecture** to understand:
- Current tech stack (what's already chosen)
- Build phase (what's buildable now vs. future)
- Cost model (current monthly spend targets)
- Existing decisions that constrain the choice

### Step 3: Conduct Evaluation Research
Use web search to gather:
- **Official documentation** — features, pricing, limits, supported languages/platforms
- **GitHub activity** — stars, recent commits, open issues, contributor count (for open-source)
- **Production case studies** — who uses it at scale, what they report
- **Community sentiment** — Reddit, HN, dev forums for honest reviews
- **Comparison content** — existing head-to-head comparisons with alternatives

### Step 4: Produce the Evaluation

**TECHNOLOGY EVALUATION: [Name]**

**1. What It Is**
One paragraph: what the technology does, who makes it, current version/status, pricing model.

**2. Evaluation Matrix**

| Criteria | Score (1-5) | Notes |
|----------|:-----------:|-------|
| **Fit** — Does it solve the stated problem? | | |
| **Stack Compatibility** — Does it work with our existing tech? | | |
| **Cost** — Is the pricing acceptable at our scale? | | |
| **Complexity** — How hard is it to implement and maintain? | | |
| **Maturity** — Is it production-ready? Community healthy? | | |
| **TOTAL** | /25 | |

**3. Integration Assessment**
How would this fit into the Reference Architecture? Which layer? What changes needed? Any conflicts with existing decisions?

**4. Cost Analysis**
- Pricing model (free tier, per-unit, subscription)
- Estimated monthly cost at your expected scale
- Cost comparison with alternatives or current approach

**5. Risks**
- Vendor lock-in risk
- Maintenance burden
- Breaking change history
- Bus factor (single maintainer?)

**6. Alternatives Considered**
Brief assessment of 2-3 alternatives with why they score lower (or higher).

**7. Recommendation**
One of:
- **Adopt** — Use it. Here's the integration path.
- **Trial** — Promising but needs a PoC. Here's what to test.
- **Hold** — Not right now. Here's what would change the answer.
- **Reject** — Doesn't fit. Here's why.

**8. Decision Needed**
If this should be logged as an architecture decision, flag it for the Evolution Log.

---

## Output Format

Present directly in chat for quick evaluations.
Produce as a downloadable markdown or docx for evaluations that will be referenced later or shared.

---

## Quality Rules

- Scores must be justified — a "4/5 on fit" without explanation is useless.
- Always check the Reference Architecture before recommending. Don't suggest Azure services when the stack is GCP.
- Cost analysis must include the free tier reality — many tools are "free" until you actually need them.
- The Alternatives section is mandatory. Single-option evaluations aren't evaluations.
- Maturity matters. A technically superior tool with 200 GitHub stars and one maintainer is a risk, not an opportunity.
- Be honest about complexity. "Easy to set up" means different things to different people — specify actual steps.

---

## Connectors Used

- **Web search** — primary research tool (required)
- **Web fetch** — for reading official docs and case studies
- **Knowledge base: Reference Architecture** — stack alignment (required)
- **Knowledge base: WORK_PROJECTS.md** — project context
- **Past chats search** — prior discussions about this technology
