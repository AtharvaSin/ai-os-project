# Skill: Lore Consistency Check

> **Scope:** Validates any Bharatvarsh content against the canonical lore database for accuracy. Catches incorrect names, non-canon technology, mismatched timelines, and classification violations.
>
> **Type:** Validation skill — Claude runs this as a quality gate before publishing or finalizing Bharatvarsh content.
>
> **Runtime:** Claude.ai (primary). Can also be invoked from Claude Code.
>
> **Dependencies:** MCP Gateway lore tools (bharatvarsh module), knowledge base files.

---

## When to Use

**Trigger phrases:** "check lore," "is this accurate?", "lore review," "validate this against Bharatvarsh," "lore check," "canon check," "is this canon?"

**Automatic activation:** This skill should be invoked automatically whenever:
- The `bharatvarsh-content` skill produces a draft
- The `bharatvarsh-writer` skill produces creative prose
- The user pastes Bharatvarsh-related text and asks for review
- Any content mentioning Bharatvarsh characters, factions, technology, or events is being finalized

---

## Process

### Step 1: Run MCP Lore Consistency Check

Use the `check_lore_consistency` MCP tool:
```
Tool: check_lore_consistency
Input: { "content": "<the full text to validate>" }
```

This tool:
1. Extracts all entity names from the text (characters, factions, locations, technology)
2. Matches them against the canonical lore database
3. Flags unknown terms that look like they could be lore references
4. Checks for disclosure classification violations
5. Returns a structured report

### Step 2: Cross-Reference Key Details

For each entity mentioned in the content, verify critical facts:

**Characters:**
- Use `get_character` to pull the full profile
- Check: name spelling (including Devanagari), rank, age, faction, physical description
- Check: dialogue voice matches the character's established patterns
- Check: arc details don't contradict established timeline

**Factions:**
- Use `get_entity` to pull faction details
- Check: faction philosophy, membership, relationships are accurate

**Technology:**
- Use `get_entity` for tech entries
- Check: capabilities, limitations, visual appearance match canon

**Timeline:**
- Use `get_timeline` for date/event verification
- Check: years, era names, event descriptions match

### Step 3: Check Classification Compliance

For each entity mentioned, verify its disclosure status:

| Disclosure | Rule |
|------------|------|
| **Public** | Free to use in any content |
| **Declassified** | Can be referenced but maintain intelligence dossier framing |
| **Redacted** | Partial information only — name and role, not full details |
| **Classified** | Do NOT reveal in public-facing content (marketing, social media) |

Flag any content that reveals classified information in a public context.

### Step 4: Deliver Report

Structure the response as:

```
## Lore Consistency Report

### Entities Found
- [List of recognized entities with their types and disclosure levels]

### Issues Found
- [List of errors, inconsistencies, or classification violations]

### Warnings
- [Potential issues that need human judgment]

### Unknown Terms
- [Terms that look like lore references but aren't in the database]

### Verdict
[PASS / PASS WITH WARNINGS / FAIL — with summary]
```

---

## Common Errors to Catch

| Error Type | Example | Correct |
|------------|---------|---------|
| Name misspelling | "Kahan" | "Kahaan" (कहान) |
| Wrong rank | "Colonel Kahaan" | "Major Kahaan" |
| Non-canon technology | "energy sword" | No such weapon exists in Bharatvarsh |
| Wrong faction | "Rudra of Bharatsena" | Rudra is Tribhuj, not Bharatsena |
| Timeline error | "bombings in 2024" | 20-10 bombings are in 2025 |
| Classification leak | Revealing Arshi's full role | Arshi is Classified |
| Wrong attribute | "Rudra's pulse gun" | Rudra uses traditional weapons (trident, machete), not Bharatsena tech |
| Tone break | "Buy now! Amazing book!" | Should be atmospheric/dossier tone |

---

## Knowledge Base Files Used

- `BHARATVARSH_BIBLE.md` — world canon reference
- `BHARATVARSH_CHARACTERS.md` — character canon reference
- `BHARATVARSH_LOCATIONS.md` — location canon reference
- `BHARATVARSH_VISUAL_GUIDE.md` — visual canon reference
- `BHARATVARSH_TIMELINE.md` — chronological canon reference

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `check_lore_consistency` | Primary validation — entity matching and consistency |
| `get_character` | Deep character fact-checking |
| `get_entity` | Generic entity fact-checking |
| `search_lore` | Find related entities for cross-reference |
| `get_timeline` | Timeline/date verification |
