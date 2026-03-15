# Architecture Decision: Three-Category Orchestration Model

## Context

The AI Operating System needed a clear execution architecture to handle three fundamentally different workload types: interactive chat-driven work (brainstorming, drafting, research), scheduled automated pipelines (daily scans, notification jobs), and complex multi-step agentic workflows (conditional logic, human-in-the-loop). A single execution model could not serve all three efficiently without overengineering or underserving specific use cases.

The key tension was between simplicity (start with what works) and extensibility (support future agentic workflows). The decision needed to respect cost constraints (personal project budget) while enabling a clear growth path.

## Decision / Content

The AI OS uses a **Three-Category Architecture** for AI orchestration:

### Category A -- Claude.ai Chat Project (Primary Interface)
- Handles 60-70% of all work: brainstorming, research, planning, content drafting, email composition, decision-making.
- 18 skills encoded as SKILL.md files, auto-discovered by Claude.
- 3 directory connectors: Gmail, Calendar, Drive (zero infrastructure, one-click OAuth).
- Rich knowledge base of project documents for session context.
- Interactive artifacts (React/HTML) for visual outputs.

### Category B -- Cloud Functions (Gen 2) + Cloud Scheduler
- Rigid, scheduled pipelines. Fire-and-forget execution.
- Plain Python + Anthropic API. No frameworks.
- Example: Daily overdue task scan + Google Tasks notification sync.
- Deployed to Cloud Run (originally intended as Cloud Functions Gen 2, pivoted due to buildpack bug).
- Triggered by Cloud Scheduler on cron schedules.

### Category C -- LangGraph on FastAPI + Cloud Run
- Complex agentic workflows with conditional logic, branching, and human-in-the-loop.
- LangGraph for state machine orchestration, FastAPI for HTTP interface.
- Deployed as Cloud Run services, scale-to-zero.
- Reserved for workflows that exceed Category B's linear execution model.

### Routing Principle
Start simple. Cloud Functions before LangGraph. Plain Python before frameworks. Only escalate to Category C when Category B cannot handle the workflow complexity.

## Consequences

- **Enables:** Clear decision framework for where new workflows should live. Prevents overengineering simple scheduled jobs. Provides a growth path for complex agentic workflows.
- **Constrains:** Category A work cannot be automated (requires human interaction). Category B pipelines must be stateless and idempotent. Category C services require more development effort and operational overhead.
- **Changes:** All new workflow proposals must identify their category before implementation begins. The decision tree in the Tool Ecosystem Plan governs placement.

## Related

- Decision: Unified MCP Gateway (the gateway serves as the tool bridge across all three categories)
- Decision: Scale-to-Zero Cloud Run (Category B and C services both use this pattern)
- Reference: Tool Ecosystem Decision Tree (governs how new tools and workflows are categorized)
- Reference: GCP Infrastructure (all three categories deploy to the same GCP project)
