---
description: Quick-build a new application. Usage — /asr-software-forge:build [description]. Example — /asr-software-forge:build A portfolio site for a photographer with gallery, contact form, and booking system
---

Build a new application from a one-line description.

Parse $ARGUMENTS to extract:
1. **What to build** (app type, core feature)
2. **Key features** mentioned
3. **Any constraints** (framework, platform, style)

Check the working directory for input files:
- If a PRD (.md with "requirements" or "PRD" in content) exists → use it as the spec
- If brand guidelines exist → apply them
- If mockups/wireframes exist → use them as visual reference
- If none of the above → infer everything from the description

Then invoke the `scaffold-app` skill with the extracted inputs.

Default assumptions when not specified:
- Stack: Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Auth: None unless user data is involved
- Database: SQLite for simple apps, PostgreSQL for anything with relationships
- Deployment: Docker-ready
- Brand: Context C (Portfolio) defaults
