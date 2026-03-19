# Forge Projects

This directory contains specifications and manifests for all projects built with the ASR Software Forge.

Each subdirectory is a project:
```
{slug}/
├── manifest.json         # Project identity, status, metadata
└── specs/
    ├── prd.md            # Product requirements
    ├── architecture.md   # Stack decision + rationale
    ├── design-direction.md  # UI direction + tokens + anti-slop
    └── competitive-scan.md  # Market context (optional)
```

The actual code for each project lives OUTSIDE this repository at:
```
C:\Users\ASR\OneDrive\Desktop\Zealogics Work\Projects\implementations\{slug}\
```

Each project has its own git repository.

## Quick Status

To see all projects and their current phase, check each `manifest.json` for the `phase` field:
- `ideating` — Project idea captured, no specs yet
- `specified` — PRD + architecture + design direction complete
- `setup-complete` — Project directory and git initialized
- `built` — Code scaffolded and building
- `reviewed` — Quality gate passed
- `shipped` — Deployed to production
