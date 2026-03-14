---
name: kb-sync
description: "KB synchronization between Claude.ai project and GitHub repo. Use when user says sync KB, push KB changes, pull latest, kb audit, or at session close when KB edits were made."
---

# Skill: KB Sync (Claude Code Pointer)

This skill primarily runs in **Claude.ai**, not Claude Code.

The full skill specification lives at `knowledge-base/skills/SKILL_KB_SYNC.md` in this repository.

## What It Does

`/kb-sync` handles three sync workflows between Claude.ai and the GitHub repo:

- **Pull** — Refreshes Claude.ai project KB from the latest repo state
- **Push** — Gets Claude.ai session edits committed back into the repo
- **Audit** — Full KB health check comparing project KB against repo inventory

## Claude Code's Role

In Claude Code, the counterpart skill is `/update-project-state`, which scans the filesystem and writes `PROJECT_STATE.md`. After that runs and changes are pushed, `/kb-sync` in Claude.ai consumes the updated state.

## Replaces

This skill supersedes `/sync-from-repo` (`knowledge-base/SYNC_FROM_REPO.md`), which is now deprecated.
