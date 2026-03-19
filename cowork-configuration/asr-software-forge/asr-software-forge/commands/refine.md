---
description: Refine or upgrade an existing codebase. Usage — /asr-software-forge:refine [instructions]. Example — /asr-software-forge:refine Add dark mode with a toggle, update the color scheme to use violet accents, fix mobile nav
---

Refine an existing codebase based on user instructions.

Parse $ARGUMENTS to extract:
1. **What to change** (features, fixes, refactors, brand updates)
2. **Scope** (specific files, entire app, particular feature area)
3. **Priority** (if multiple changes, infer order of importance)

The working directory should already contain the project to refine. If it doesn't, ask the user to select the correct folder.

Check for additional input files:
- Updated brand guidelines → trigger brand refresh cascade
- New PRD or feature spec → use as the change spec
- Bug reports → prioritize fixes first

Then invoke the `refine-repo` skill.

If the instructions are vague (e.g., "make it better"), run the codebase analysis first and present the top 5 improvement opportunities before proceeding.
