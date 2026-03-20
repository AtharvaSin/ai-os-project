# Creative Writing Plugin — Claude Cowork Plugin

General-purpose creative writing engine for the AI Operating System. Interactive-first: gathers all information before writing. Supports structured story development, brainstorming, quick outputs, and critique.

## Architecture

```
creative-writing-plugin/
├── .claude-plugin/plugin.json     <- Plugin manifest
├── skills/
│   └── creative-writer/SKILL.md   <- Main skill (4 modes)
├── context/
│   ├── truby-framework.md         <- Truby's 22-step story structure reference
│   └── brainstorm-methods.md      <- 7 brainstorm methods reference
└── README.md                      <- This file
```

## Infrastructure (outside plugin directory)

| File | Location | Purpose |
|------|----------|---------|
| Migration | `database/migrations/019_creative_writer.sql` | 4 tables, 4 enums |
| MCP Module | `mcp-servers/ai-os-gateway/app/modules/creative_writer.py` | 8 MCP tools |
| Seed | `database/seeds/014_seed_creative_writer.sql` | Pipeline registration |
| Skill Copy | `.claude/skills/creative-writer/SKILL.md` | Claude Code auto-discovery |

## Modes

| Mode | Trigger | Purpose |
|------|---------|---------|
| **Quick** | "write a blog post", "draft an article", "headline ideas" | One-off writing with interactive requirements gathering |
| **Project** | "help me write a novel", "outline a screenplay" | Long-running creative projects with Truby's 22-step structure |
| **Brainstorm** | "brainstorm story ideas", "what should I write about" | 7 interactive ideation methods |
| **Critique** | "give me feedback on this chapter", "review my draft" | Structured writing critique |

## MCP Tools (8)

| # | Tool | Purpose |
|---|------|---------|
| 1 | `create_creative_project` | Create project + auto-populate 22 Truby steps |
| 2 | `get_creative_project` | Full project with steps, stats, output counts |
| 3 | `list_creative_projects` | List with filtering (status, type, universe) |
| 4 | `update_project_step` | Advance/update a Truby step |
| 5 | `save_writing_output` | Persist draft with auto-versioning |
| 6 | `get_writing_outputs` | Retrieve past drafts with filtering |
| 7 | `create_brainstorm_session` | Start brainstorm session |
| 8 | `update_brainstorm_session` | Add ideas, select winners, conclude |

## Database Tables (4)

| Table | Purpose |
|-------|---------|
| `creative_projects` | Projects with Truby structure, character web, world rules |
| `creative_project_steps` | 22-step tracker (auto-populated for narrative types) |
| `brainstorm_sessions` | Ideation sessions with 7 methods |
| `writing_outputs` | Versioned drafts (append-only) |

## Key Design Principles

1. **Interactive-first** — Every mode gathers ALL context before generating
2. **Minimal capture** — During brainstorming, record only what user states
3. **Source tagging** — Untagged = user, `<AI>` = suggestion, `<hidden>` = author-only
4. **Versioning over overwriting** — New version = new row, never modify
5. **Universe-agnostic** — Works for any world; `universe='bharatvarsh'` loads lore
6. **Mode chaining** — Brainstorm flows into Project or Quick naturally

## Deployment

1. Apply migration: `psql -f database/migrations/019_creative_writer.sql`
2. Apply seed: `psql -f database/seeds/014_seed_creative_writer.sql`
3. Deploy gateway with new module (auto-registered in main.py)
4. Skill auto-discovered by Claude Code via `.claude/skills/creative-writer/SKILL.md`
