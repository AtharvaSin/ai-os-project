---
name: competitive-intel
description: "Market landscape analysis with competitor profiles and differentiation. Use when user asks for competitive analysis, market landscape, or positioning assessment."
---

# Skill: Competitive Intelligence

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user asks to analyze competitors, understand market positioning, assess the competitive landscape, or identify differentiation opportunities. Trigger phrases include: "competitive analysis," "who are the competitors," "market landscape," "how does X compare to," "competitive intel on," "what's out there for," or any request involving understanding the competitive environment around a product, service, or content niche.

Applicable to: Bharatvarsh (novel market positioning), AI&U (YouTube channel competitive landscape), AI OS (competing tools and approaches), or professional consulting contexts.

---

## Process

### Step 1: Define the Competitive Frame
- **What** is being positioned? (a product, a channel, a service, a practice area)
- **Against whom?** (direct competitors, adjacent players, substitutes)
- **For what purpose?** (differentiation strategy, GTM planning, content positioning, pitch preparation)

### Step 2: Load Internal Context
- If **Bharatvarsh**: Load Bible + Platform docs. Understand current positioning, distribution, unique features (Bhoomi AI, lore archive, forum).
- If **AI&U**: Load AI&U Knowledge Pack. Understand pillars, voice, differentiation claims.
- If **Professional**: Load OWNER_PROFILE.md and Career Reference Index for positioning context.

### Step 3: Conduct Research
Use web search with multiple queries:
- Direct competitor names + recent activity
- Market category + "landscape" or "market map"
- Competitor products/channels + reviews, audience size, growth
- Industry reports if available
- Social media presence and engagement levels

### Step 4: Produce the Intelligence Brief

**COMPETITIVE INTELLIGENCE: [Subject]**

**1. Landscape Overview**
The market in 2-3 sentences. Size, growth direction, key dynamics.

**2. Competitor Profiles**
For each competitor (3-6 max):

| Dimension | Detail |
|-----------|--------|
| Name | |
| What they do | One sentence |
| Strengths | 2-3 specific strengths |
| Weaknesses | 2-3 specific gaps |
| Audience/Market | Who they serve |
| Scale indicators | Users, subscribers, revenue, funding — whatever's available |
| Recent moves | Last 6 months of notable activity |

**3. Positioning Map**
A 2x2 or spectrum visualization showing where competitors sit on the most relevant dimensions. For example:
- AI&U: Practical ↔ Hype vs. Beginner ↔ Advanced
- Bharatvarsh: Traditional marketing ↔ Immersive experience vs. Single-book ↔ Transmedia
- Use a text-based or artifact visualization.

**4. Differentiation Opportunities**
What gaps exist in the market that the user can uniquely fill? Be specific — "better content" is not a differentiation. "Implementation-grade AI workflows taught by someone with enterprise consulting experience" is.

**5. Threats**
What competitive moves could undermine the user's position? What's the realistic risk level?

**6. Recommended Actions**
3-5 specific actions to strengthen competitive position. Each with: action, expected impact, effort level.

---

## Output Format

For quick assessments (3 or fewer competitors): Present directly in chat.

For comprehensive landscape analysis: Produce as a downloadable markdown or docx artifact.

---

## Quality Rules

- Competitor strengths must be genuine, not strawmen. Dismissing competitors makes the analysis useless.
- Scale indicators need sources. Don't guess subscriber counts — search for them.
- Differentiation must be honest. If competitors already do something well, say so and find a different angle.
- "Be better" is never a recommendation. Specific, actionable moves only.
- Update the analysis with dates — competitive landscapes shift. Note when data was collected.

---

## Connectors Used

- **Web search** — primary research tool (required)
- **Web fetch** — for reading competitor sites, reviews, reports
- **Knowledge base** — relevant domain docs (Bible, Platform, AI&U Pack, Profile)
- **Past chats search** — previous competitive discussions
