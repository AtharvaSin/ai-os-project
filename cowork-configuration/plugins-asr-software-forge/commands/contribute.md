---
description: Start contributing to an existing repository. Usage — /asr-software-forge:contribute [repo-url-or-name] [task-description]. Example — /asr-software-forge:contribute https://dev.azure.com/zealogics/portal/_git/dashboard Add real-time metrics panel to the admin dashboard
---

Quick-start contribution to an existing repo.

Parse $ARGUMENTS to extract:
1. **Repository** — URL, name, or path to an existing local repo
2. **Task** — what to build, fix, or improve
3. **Ticket** — if a ticket ID is mentioned (ZEAL-1234, #123, etc.)

Determine the operation:

**If a URL is provided:**
→ Clone the repo and invoke `contribute-repo` skill from Phase A (Onboard)

**If a local path or name matching an existing forge-project is provided:**
→ Navigate to the existing clone and invoke `contribute-repo` from Phase B (Branch & Plan)

**If no arguments:**
→ List all active contribution projects from `forge-projects/*/manifest.json` where `project_type == "contribution"`
→ Ask which project to resume, or if they want to start a new contribution

**Quick modes:**

- "clone and explore" → Run Phase A only (Onboard). Understand the repo, don't make changes yet.
- "I already have the code" → Skip cloning. Ask the user to point at the directory. Start from Phase A2 (Discover).
- "just make a PR" → Skip to Phase E. Assumes code is ready, just needs PR creation.
- "address review comments" → Load the existing PR context, apply feedback, push updates.
