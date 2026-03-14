---
name: session-resume
description: "Context recovery from past sessions and Evolution Log. Use when user says continue, resume, pick up from last time, or references a previous conversation."
---

# Skill: Session Resume

> **Scope:** This skill operates within the AI Operating System project only. It references project-specific knowledge base documents and connectors available in this project.
>
> **Type:** Workflow skill — Claude follows these instructions when triggered.

---

## When to Use

Activate this workflow when the user wants to continue where a previous session left off. Trigger phrases include: "continue where we left off," "resume," "pick up from last time," "what were we working on," "where did we leave things," or any reference to a previous conversation or decision that needs to be recovered.

Also activate when the user references a specific past topic and wants to rebuild context before continuing work on it.

---

## Process

### Step 1: Identify What to Resume
Determine the domain or topic:
- If the user specifies a domain ("resume the AI&U planning"), search for that directly.
- If the user is vague ("continue where we left off"), search broadly for the most recent substantive sessions.

### Step 2: Search for Previous Context
Execute these searches in order:

**A. Past Chats Search**
Search recent conversations in this project for the relevant topic. Look for:
- The last substantive working session on this domain
- Any explicit "next steps" or action items stated at the end
- Decisions that were made
- Artifacts that were produced
- Open questions that were deferred

**B. Evolution Log**
Read the OS_EVOLUTION_LOG.md from the knowledge base. Check:
- Most recent entries for the relevant domain
- Any status changes ([ACTIVE], [COMPLETED], [PARKED])
- Listed next steps that may still be pending
- Architecture decisions that provide context

**C. WORK_PROJECTS.md**
Check the current project status for the relevant focus area:
- Current phase and status
- Next milestone
- Pending decisions

### Step 3: Compose the Continuity Summary

Present as a concise "Previously on..." briefing:

**LAST SESSION**
[Date if available. What was worked on. Key topic/domain.]

**DECISIONS MADE**
[Bullet list of decisions from that session, if any]

**ARTIFACTS PRODUCED**
[Documents, diagrams, code, plans that were created]

**OPEN ITEMS**
[Action items, unanswered questions, deferred decisions]

**CURRENT PROJECT STATE**
[Pull from WORK_PROJECTS.md — where the relevant project stands now]

**PROPOSED NEXT STEPS**
[Based on all the above, suggest 2-3 concrete actions to continue the work. These should be specific enough to immediately start executing.]

### Step 4: Transition to Work
After presenting the summary, ask: "Ready to pick up from here, or do you want to adjust the direction?"

Then seamlessly transition into the working session — the resume is a ramp, not a destination.

---

## Output Format

Keep the entire summary under 400 words. This is a context recovery tool, not a report. The user should be able to scan it in 60 seconds and say "yes, let's continue" or "actually, let's pivot to X."

If the past chat search returns links to previous conversations, include them so the user can reference the full session if needed.

---

## Quality Rules

- Never fabricate session history. If past chat search returns nothing relevant, say so: "I couldn't find a recent session on this topic. What should we focus on?"
- Prioritize the most recent session on the topic. Don't surface sessions from weeks ago unless the user specifically asks.
- PROPOSED NEXT STEPS should continue the trajectory of the previous session, not restart from scratch. If the last session ended with "next: build the Supabase schema," the proposed step should be "build the Supabase schema," not "let's discuss whether we should use Supabase."
- If an Evolution Log entry conflicts with what past chat search surfaces (e.g., a decision was revised in a later session), go with the more recent information.
- Be brief. The user knows what they worked on — they need a memory jog, not a lecture.

---

## Connectors Used

- **Past chats search** — primary tool for finding previous session context (required)
- **Knowledge base: OS_EVOLUTION_LOG.md** — for decision history and status tracking
- **Knowledge base: WORK_PROJECTS.md** — for current project state
- **Knowledge base: domain-specific docs** — loaded based on which project/domain is being resumed
