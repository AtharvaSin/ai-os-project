# Reference: Tool Ecosystem Decision Tree

## Context

As the AI Operating System grows, new tools and integrations will be needed. Without a clear framework, each new tool could become a separate infrastructure decision, leading to tool sprawl, inconsistent patterns, and unnecessary cost. The decision tree provides a repeatable framework for placing new tools in the right tier of the ecosystem.

## Decision / Content

### The Three Tiers

| Tier | Description | Cost | Setup Time | Access From |
|------|-------------|------|------------|-------------|
| Tier 1 | Directory Connectors (Claude.ai OAuth) | $0 | 1 minute | Claude.ai chat only |
| Tier 2 | Unified MCP Gateway (Cloud Run module) | $0 incremental | 2-4 hours | Claude.ai, Claude Code, workflows |
| Tier 3 | Local STDIO MCP (npm packages) | $0 | 10 minutes | Claude Code only |

### Decision Tree (Follow In Order)

**Step 1: Does a Claude.ai directory connector exist for this tool?**
- YES -> Use it. $0 cost. 1 minute setup. Done.
- NO -> Go to Step 2.

**Step 2: Is this tool only needed during Claude Code development sessions?**
- YES -> Find a community STDIO MCP package (npm). $0 cost. 10 minutes setup. Done.
- NO -> Go to Step 3.

**Step 3: Is this tool needed from Claude.ai chat AND/OR Category B/C workflows?**
- YES -> Add a module to the MCP Gateway. $0 incremental cost. 2-4 hours development. Redeploy gateway. Done.
- NO -> Go to Step 4.

**Step 4: Does this tool need heavy compute, persistent connections, or a fundamentally different runtime?**
- YES -> Create a separate Cloud Run service (rare). Justify the infrastructure addition.
- NO -> Reconsider Step 3. Most tools fit in the gateway.

**Step 5: Does this tool need a visual UI for browsing or interacting with data?**
- YES -> Add a page to the Dashboard PWA. Varies in effort (1-5 days). Reads from Cloud SQL.
- NO -> The tool is likely covered by Steps 1-4.

### Current Tier Inventory

**Tier 1 (Connected):** Gmail, Google Calendar, Google Drive
**Tier 1 (Pending):** Slack, Canva, GitHub
**Tier 1 (Deprioritized):** Notion (creates data bifurcation, $10/month, fragile sync)

**Tier 2 (Live -- 17 tools):** PostgreSQL (6), Google Tasks (5), Drive Write (3), Calendar Sync (3)
**Tier 2 (Planned):** Bharatvarsh Admin (4), Lore Search (2), WhatsApp (3), Content Tracker (4)

**Tier 3 (To configure):** Evernote (learning notes), n8n (automation workflows), GitHub (repo management)

### Cost Model
- Tier 1: $0 (always free, Google provides infrastructure)
- Tier 2: $0-7/month (Cloud Run scale-to-zero, billed per request)
- Tier 3: $0 (runs locally as subprocess)
- Dashboard: $3-8/month (Cloud Run scale-to-zero)
- **Total ecosystem: $3-15/month**

## Consequences

- Every new tool request goes through this decision tree before any implementation begins
- The gateway-first approach prevents infrastructure sprawl (no new Cloud Run services per tool)
- Tier 1 connectors are always preferred when available (zero cost, zero maintenance)
- Notion was explicitly deprioritized following this framework (Cloud SQL + Dashboard replaces its workspace role)

## Related

- Decision: Unified MCP Gateway (Tier 2 implementation)
- Decision: Three-Category Architecture (governs which tools each category needs)
- Reference: MCP Gateway Tool Inventory (current Tier 2 tools)
- Reference: GCP Infrastructure (where Tier 2 deploys)
