# Architecture Decision: Dashboard as Progressive Web App (PWA)

## Context

The AI Operating System needed a visual interface for project management, task tracking, Gantt timelines, and risk surfacing. No third-party tool (Notion, Asana, etc.) could provide AI-native analytics reading directly from Cloud SQL. The options were: (A) use Notion as the dashboard with two-way sync, (B) build a full custom native mobile app + web app, or (C) build a PWA dashboard with Google Tools as notification rails.

## Decision / Content

**Build a Next.js Progressive Web App (PWA)** deployed as a separate Cloud Run service, with Google Tasks/Calendar/Drive as downstream notification channels.

### Technology Stack
- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS with Obsidian Aurora design system
- **Auth:** NextAuth.js with Google OAuth (single-email gate)
- **Database:** Direct Cloud SQL access via pg npm package + Auth Proxy sidecar
- **Drag-and-drop:** @hello-pangea/dnd (maintained fork of react-beautiful-dnd)
- **Gantt:** Custom CSS Grid implementation (not frappe-gantt)
- **Hosting:** Cloud Run, asia-south1, scale-to-zero
- **PWA:** manifest.json, service worker, offline fallback, installable on home screen

### Pages Delivered (Phase 3a)
1. **Command Center** -- Project cards with health indicators, today's tasks, upcoming milestones
2. **Project Detail** -- Phase progress, milestone timeline, task list, artifacts
3. **Task Board** -- Kanban layout with drag-and-drop status changes, filterable by project/priority
4. **Gantt Timeline** -- Interactive CSS Grid chart with click-to-reschedule milestones
5. **Auth pages** -- Sign-in and error handling

### Why PWA Over Native Mobile
- One codebase (Next.js) serves desktop and mobile
- Installable on home screen (Android + iOS)
- No app store, no Apple Developer account ($99/year saved)
- Push notifications via FCM (iOS 16.4+ required)
- Google Tasks handles critical deadline notifications on all platforms as a fallback

### Why Separate Service (Not Part of MCP Gateway)
- Independent scaling (dashboard may get more traffic)
- Independent deployment (UI changes should not redeploy the gateway)
- Different runtime needs (Next.js vs FastAPI)
- Both scale to zero independently

## Consequences

- **Enables:** AI-native dashboard reading directly from Cloud SQL. Installable on mobile without app stores. Single codebase for all screen sizes. Full design control with Obsidian Aurora theme.
- **Constrains:** iOS push notification support requires 16.4+. Background refresh limited on iOS. No native mobile gestures or deep hardware integration.
- **Changes:** Dashboard deployed at https://ai-os-dashboard-sv4fbx5yna-el.a.run.app. Cloud Build trigger auto-deploys on push to `dashboard/**`.

## Related

- Decision: Unified MCP Gateway (the dashboard and gateway are sibling Cloud Run services)
- Decision: Scale-to-Zero Cloud Run (dashboard uses the same pattern)
- Decision: Cloud SQL Shared Instance (dashboard reads directly from the shared database)
- Retro: Sprint 3a Dashboard Build (build retrospective)
