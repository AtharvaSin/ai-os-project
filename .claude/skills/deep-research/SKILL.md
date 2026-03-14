---
name: deep-research
description: "Multi-source research synthesized into structured blueprints. Use when user asks to research, look into, evaluate, compare, deep dive, or build understanding of any topic."
---

# Skill: Deep Research

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks to research a topic, evaluate a technology, compare options, build understanding of a domain, investigate a market, or produce a reference document grounded in current information. Trigger phrases include: "research this," "look into," "what's the state of," "evaluate," "compare," "build me a brief on," "I need to understand," "deep dive on," or any request that requires synthesizing multiple sources into an actionable artifact.

Do NOT use for quick factual questions that can be answered in a few sentences. This skill is for producing substantial, referenceable output.

---

## Process

### Step 1: Clarify Scope
Before researching, confirm:
- **What** exactly needs to be understood or decided?
- **Why** — is this for a build decision, a client conversation, content creation, or personal learning?
- **Depth** — quick scan (3-5 sources, 1-page summary) or deep blueprint (10+ sources, structured document)?

If the user's request is clear enough, skip clarification and proceed. Don't slow things down with unnecessary questions.

### Step 2: Check Internal Context First
Before searching the web, check what already exists:
- Search **Google Drive** for any existing documents, decks, or notes on this topic
- Search **past chats** in this project for previous discussions or decisions related to this topic
- Check relevant **knowledge base documents** — if the research relates to the AI OS, reference the Reference Architecture; if it relates to Bharatvarsh, reference the Bible and Platform docs; if it relates to AI&U, reference the Knowledge Pack

This prevents re-researching what's already been covered and grounds new research in existing decisions.

### Step 3: Conduct Web Research
Use web search with multiple queries to build comprehensive coverage:
- Start broad (2-3 word queries), then narrow based on initial findings
- Target authoritative sources: official docs, engineering blogs, peer-reviewed content, reputable tech publications
- For technology evaluations, always check: official documentation, GitHub repos (stars, recent activity), community sentiment, production case studies
- For market research: industry reports, competitor sites, analyst coverage
- Scale queries to complexity: 3-5 searches for a quick scan, 8-12 for a deep blueprint

### Step 4: Synthesize into Structured Output
Produce a document (markdown artifact or docx file depending on length) with this structure:

**For general research:**
1. **Executive Summary** — 3-4 sentences answering the core question
2. **Key Findings** — Each finding as a discrete point with source attribution
3. **Analysis** — Implications, patterns, contradictions across sources
4. **Recommendations** — Specific, actionable next steps grounded in findings
5. **Open Questions** — What couldn't be answered and where to look next
6. **Sources** — Links to all referenced materials

**For technology evaluations, add:**
- **Comparison Matrix** — Options scored on relevant criteria (fit, cost, complexity, maturity, community)
- **Integration Notes** — How it fits with the user's existing stack (reference Reference Architecture if relevant)
- **Cost Analysis** — Pricing model, estimated monthly cost at expected scale

**For market/competitive research, add:**
- **Landscape Map** — Key players, positioning, market segments
- **Competitor Profiles** — 3-5 lines per competitor with strengths, weaknesses, differentiators
- **Opportunity Gaps** — Where the user can differentiate

### Step 5: Ground in Project Context
End every research output with a section that connects findings to the user's actual work:
- "What this means for AI OS:" — if the research is architecture/tech related
- "What this means for AI&U:" — if the research is content/market related
- "What this means for Bharatvarsh:" — if the research is marketing/audience related
- "Decision needed:" — if the research surfaces a choice that should be logged

---

## Output Format

For quick scans (< 2 pages): Produce directly as a well-structured chat response with clear headings.

For deep blueprints (2+ pages): Produce as a downloadable artifact — either a markdown file for technical content or a docx file for professional/shareable content.

Always end with: "Should I add any findings to the Evolution Log or update any knowledge base documents?"

---

## Quality Rules

- Every claim must have a source. No unsourced assertions.
- Prefer recent sources (last 6 months) for fast-moving topics like AI/ML. Note when sources are older.
- Present conflicting information honestly — don't smooth over disagreements between sources.
- Recommendations must be specific and actionable, not generic. "Consider using X" is weak. "Use X for Y because Z, starting with their free tier" is strong.
- If the research relates to a pending decision in the Reference Architecture (Section 9: Open Decisions), explicitly flag this.
- Don't pad. If the research can be communicated in 1 page, don't stretch it to 3.

---

## Connectors Used

- **Web search** — primary research tool (required)
- **Google Drive** — check for existing internal documents on the topic
- **Past chats search** — check for previous discussions in this project
- **Knowledge base** — Reference Architecture, WORK_PROJECTS.md, domain-specific docs as relevant
- **Web fetch** — for reading full articles/docs when search snippets are insufficient
