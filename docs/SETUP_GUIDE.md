# AI Operating System — Claude Desktop Project Setup Guide

## What You're Building

A Claude Desktop **project** that acts as the command center for your personal AI Operating System. This project gives Claude persistent context about who you are, your architecture vision, your life domains, and your novel world — so every new chat starts from a place of deep understanding rather than zero.

---

## Step 1: Create the Project in Claude Desktop

1. Open Claude Desktop (or claude.ai)
2. Go to **Projects** in the sidebar → **+ New Project**
3. Name it: **`AI Operating System`**
4. Description (for your reference only — Claude won't see this): *"Command center for designing, brainstorming, and building my AI-enabled personal operating system across work, creative, and personal domains."*

---

## Step 2: Set Project Instructions

Open the project and paste the contents of **`PROJECT_INSTRUCTIONS.md`** into the **Project Instructions** field.

This is the most important piece — it tells Claude:
- Who you are (professional + creative identity)
- What this project is (the 4-layer OS architecture)
- Your life domains and how they're structured
- How to think and communicate with you
- Common task types and how to handle them
- Session protocol for continuity

---

## Step 3: Upload Knowledge Base Documents

Upload these files to the project's **Knowledge Base** (right sidebar):

| File | Purpose |
|------|---------|
| `OWNER_PROFILE.md` | Your full professional and creative profile |
| `BHARATVARSH_BIBLE.md` | Novel world lore, characters, factions, tech, themes |
| `OS_EVOLUTION_LOG.md` | Running log of design decisions (update after key sessions) |
| `Architectures.pdf` | Your original 4-layer architecture vision |
| `Life_Graph.png` | Visual map of your life domains and task hierarchies |

**Total:** 5 core documents. Well within Claude's knowledge base limits.

---

## Step 4: Configure Your User Preferences (Global)

In **Settings → Profile → User Preferences**, set these account-wide preferences that apply across all projects:

```
I'm Atharva Singh, a 32-year-old AI & Cloud Product Leader based in Hyderabad.
I think in systems and architectures. I value directness, technical precision, 
and visual storytelling. Don't be generic or agreeable — co-architect with me, 
challenge assumptions, and suggest alternatives. I'm a full-stack developer 
comfortable with Python, JS, React, FastAPI, Azure, and MCP servers.
When explaining, default to structured formats with clear sections.
I ship working prototypes over perfect documents.
```

---

## Step 5: Set Up a Custom Style (Optional)

Create a custom style called **"Architect"** for this project:
- Go to **Settings → Styles → Create Style**
- Provide 3-4 writing samples from your professional work (solution architecture docs, product specs)
- This ensures Claude matches your communication register in architecture discussions

---

## How to Use the Project

### Starting a New Chat
Just open a new chat within the project. Claude will have access to all knowledge base documents and project instructions automatically. You don't need to re-explain who you are or what you're building.

### Types of Sessions You Can Run

**Architecture Design:**
> "Let's design the orchestration layer. I want to map out what agents I need, how they route tasks, and what triggers exist."

**Domain Deep-Dive:**
> "Let's work on the Novel domain. I need to design the marketing funnel workflow — from content creation to campaign execution to forum management."

**Brainstorming:**
> "I want to brainstorm what new life domains or tasks this OS should cover. Let's think about health tracking, financial planning, and learning goals."

**Bharatvarsh Creative:**
> "I'm working on a new chapter. Kahaan has just discovered something about the Mesh that contradicts what Pratap told him. Help me develop this scene."

**Professional Work:**
> "I need to architect a RAG-based knowledge assistant for an airline maintenance use case. Help me design the solution."

**Workflow Design:**
> "Design a rigid workflow for the Birthday Wishes automation — from detecting upcoming birthdays to generating and sending WhatsApp messages."

### After Important Sessions
When a session produces key decisions or artifacts:
1. Ask Claude to summarize what was decided
2. Copy the summary into `OS_EVOLUTION_LOG.md` as a new entry
3. Update any knowledge base docs that changed (e.g., new characters added to Bharatvarsh Bible)
4. Re-upload the updated files to the project knowledge base

---

## Evolution Roadmap

This project is the **starting point**. Here's how it grows:

### Phase 1: Foundation (Now)
- [x] Claude Desktop project with full context
- [x] Knowledge base with profile, novel bible, architecture docs
- [x] Evolution log for session continuity
- [ ] First 3 workflow designs (brainstorm in project)

### Phase 2: Workflow Design (Next)
- [ ] Map each life domain to concrete workflows
- [ ] Design agent hierarchies and task routing
- [ ] Identify rigid vs. dynamic vs. event-driven workflows
- [ ] Spec out MCP server integrations needed

### Phase 3: Tool Integration
- [ ] Connect Gmail, Google Calendar via Claude connectors
- [ ] Design custom MCP servers for Bharatvarsh lore queries
- [ ] Set up notification/reminder workflows
- [ ] Build research task automation

### Phase 4: Custom UI (Future)
- [ ] Dashboard for monitoring OS activity and logs
- [ ] Visual interface for configuring workflows
- [ ] Stats and analytics on task completion, domain focus allocation

### Phase 5: Full Orchestration (Future)
- [ ] Multi-agent orchestration with hierarchy and routing
- [ ] Cron-triggered background processes
- [ ] Vector DB for semantic knowledge retrieval
- [ ] Graph DB for relationship mapping across domains

---

## File Manifest

```
ai-os-project/
├── PROJECT_INSTRUCTIONS.md      ← Paste into Claude project instructions
├── SETUP_GUIDE.md               ← This file (your reference)
└── knowledge-base/
    ├── OWNER_PROFILE.md         ← Upload to project knowledge base
    ├── BHARATVARSH_BIBLE.md     ← Upload to project knowledge base
    └── OS_EVOLUTION_LOG.md      ← Upload to project knowledge base
    
Also upload to knowledge base:
    ├── Architectures.pdf        ← Your original file
    └── Life_Graph.png           ← Your original file
```

---

## Tips for Maximum Effectiveness

1. **One domain per chat** — Don't mix Bharatvarsh writing with architecture design in the same chat. Start a new chat for each domain/task.

2. **Update the Evolution Log** — This is your lightweight memory. After any session that produces decisions, update it. It's 2 minutes of work that saves 20 minutes of re-explanation.

3. **Challenge Claude** — The project instructions tell Claude to co-architect with you. If it's being too agreeable, push back. Ask "what am I missing?" or "what would break this?"

4. **Use artifacts** — Ask Claude to produce architecture diagrams, component specs, workflow maps as artifacts. These become your building blocks.

5. **Evolve the knowledge base** — As the Bharatvarsh world expands or your architecture matures, update the docs. The project is designed to grow with you.
