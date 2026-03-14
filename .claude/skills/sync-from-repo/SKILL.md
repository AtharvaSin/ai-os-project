---
name: sync-from-repo
description: "Claude.ai-side skill — reads PROJECT_STATE.md from GitHub repo and syncs KB docs + project instructions. Upload SYNC_FROM_REPO.md from knowledge-base/ to the Claude.ai project KB. Not executable in Claude Code."
---

# Skill: Sync from Repo (Claude.ai Only)

This skill runs in the **Claude.ai web project**, not in Claude Code.

The full skill specification lives at `knowledge-base/SYNC_FROM_REPO.md` — upload that file to the Claude.ai project's knowledge base.

## Purpose

Completes the sync loop with `/update-project-state`:

1. **Claude Code** runs `/update-project-state` → scans filesystem → writes `PROJECT_STATE.md` → commit + push
2. **Claude.ai** runs `/sync-from-repo` → reads `PROJECT_STATE.md` from GitHub → updates KB docs + project instructions

## What to Upload

Upload `knowledge-base/SYNC_FROM_REPO.md` to the Claude.ai project's Knowledge section. That file contains the full process, output format, and quality rules.
