# AI OS -- Skill System Design

## What the Skill System Is

The AI OS skill system is a collection of structured workflow instructions that live in the `.claude/skills/` directory of the project repository. Each skill is a markdown file (`SKILL.md`) that tells Claude exactly how to execute a specific workflow when triggered. Skills transform Claude from a general-purpose assistant into a specialised operator with repeatable, high-quality processes for recurring tasks.

As of the current state, there are 18 skills registered in the system, covering daily operations, content creation, research, planning, and project management.

## How Skills Work

Each skill follows a consistent structure:
- **Frontmatter** -- Name, description, and trigger phrases that tell Claude when to activate the skill
- **When to Use** -- Explicit conditions and trigger phrases (e.g., "good morning," "brief me," "start my day" triggers the morning-brief skill)
- **Process** -- Step-by-step instructions that Claude follows, including which connectors to use, what data to pull, and how to format the output
- **Quality Rules** -- Constraints on output length, formatting, accuracy, and tone
- **Connectors Used** -- Which external tools (Gmail, Calendar, Drive, MCP Gateway) the skill requires

When a user's message matches a skill's trigger conditions, Claude activates the skill and follows its process instructions rather than improvising a response.

## Skill Categories

### Operational Skills
- **morning-brief** -- Pulls Calendar, Gmail, project state, and carry-forward items into a daily brief. Uses Google Calendar and Gmail connectors plus the MCP Gateway for knowledge layer queries.
- **weekly-review** -- Comprehensive weekly review of project progress, knowledge layer health, content pipeline, and goal tracking.
- **session-resume** -- Reconstructs context when resuming work mid-project. Checks knowledge layer before searching past chats.

### Content and Creative Skills
- **bharatvarsh-content** -- Generates lore-accurate Bharatvarsh marketing content per platform with visual direction. Cross-references the Bible, Platform docs, Marketing Playbook, and Content Calendar.
- **social-post** -- General social media content creation across platforms.
- **build-prd** -- Produces structured Product Requirements Documents.

### Research and Analysis Skills
- **deep-research** -- Multi-source research with structured output and source tracking.
- **competitive-intel** -- Competitive landscape analysis for products and markets.
- **tech-eval** -- Technical evaluation of tools, frameworks, and architectural options.

### Planning and Decision Skills
- **action-planner** -- Breaks goals into structured action plans with milestones and dependencies.
- **decision-memo** -- Structured decision documents with options, trade-offs, and recommendations.
- **workflow-designer** -- Designs operational workflows with triggers, steps, and error handling.

### Project Management Skills
- **update-project-state** -- Filesystem-verified project state snapshot. Scans actual files and deployment status.
- **kb-sync** -- Synchronises knowledge base documents between Claude.ai and the repository.
- **sync-from-repo** -- Pulls latest code changes and updates context.
- **checklist-gen** -- Generates task checklists for specific objectives.

### Output Skills
- **visual-artifact** -- Creates interactive React/HTML artifacts for visual presentation.
- **draft-email** -- Professional email drafting with tone and context awareness.

## Skill Registry

All skills are registered in the Cloud SQL `skill_registry` table with versioning, enabling the system to track which skills exist, their current version, and when they were last updated. This allows the weekly review to detect skills that may need updates.

## Connectors and Integration

Skills integrate with three tiers of tools:
- **Tier 1 Connectors** (Gmail, Calendar, Drive) -- Direct OAuth connections in Claude.ai for reading email, calendar events, and drive files
- **Tier 2 MCP Gateway** -- The unified FastAPI service on Cloud Run with 17 tools: PostgreSQL queries (6), Google Tasks (5), Drive Write (3), Calendar Sync (3). Skills call these via MCP tool invocations.
- **Tier 3 Local STDIO** -- Developer tools like GitHub MCP that run locally in Claude Code

## Design Principles

Skills are designed with several principles: they should be trigger-clear (unambiguous activation conditions), process-explicit (step-by-step, no ambiguity in execution), quality-gated (constraints that prevent poor output), connector-aware (declare dependencies so failures degrade gracefully), and composable (skills can reference each other's outputs).
