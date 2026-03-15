# AI OS -- Dashboard PWA Architecture

## What the Dashboard Is

The AI OS Dashboard is a Progressive Web App (PWA) that serves as the intelligence layer of the AI Operating System. It is the only interface that shows the full picture across all projects, reading directly from Cloud SQL to surface risks, progress, and analytics. It complements Claude.ai (the cognitive engine) and Google Tools (the notification rails) by providing what neither can: AI-powered risk surfacing, cross-project analytics, interactive Gantt charts, and a unified command center.

## Tech Stack

- **Framework:** Next.js 14 (App Router with SSR for initial load speed, API routes for data access, PWA support)
- **Styling:** Tailwind CSS (consistent with Claude artifact conventions)
- **Auth:** NextAuth.js with Google OAuth (single sign-on with existing Google account)
- **Drag-and-Drop:** @hello-pangea/dnd for interactive task management
- **Hosting:** Cloud Run (asia-south1, scales to zero)
- **Database:** Cloud SQL PostgreSQL (via Cloud SQL Auth Proxy sidecar)
- **Push Notifications:** Firebase Cloud Messaging (FCM) via service worker

## Current State

The Dashboard PWA is live on Cloud Run with the following pages and capabilities:
- **Home / Command Center** -- Project cards with health scores, today's tasks, upcoming milestones, risk alerts
- **Project Detail** -- Phase progress, milestone timeline, task list, artifacts, tags
- **Task Board** -- Filterable task list by project, priority, and status with optional Kanban layout
- **Gantt / Timeline** -- Interactive Gantt chart with phases as swim lanes, milestones as diamonds, and dependency arrows

The dashboard has 6 pages, 7 API routes, 16 React components, and full authentication gating via middleware.

## PWA Capabilities

The dashboard is installable on mobile home screens (Android and iOS) without app store listing:
- Custom splash screen and app icon
- Full-screen mode
- Push notifications via service worker + FCM (iOS 16.4+ required)
- Offline-capable for cached dashboard views
- Google Tasks handles critical deadline notifications on both platforms as a fallback

## Design System

The dashboard follows a dark-mode design system:
- **Backgrounds:** #0d0d14 (page), #12121e (cards), #1a1a2e (hover states)
- **Text:** #e8e6e1 (primary), #a09d95 (secondary), #807d75 (muted)
- **Accents:** Gold #E8B931 (warnings), Teal #4ECDC4 (success), Purple #7B68EE (primary actions), Red #FF6B6B (critical)
- **Typography:** Instrument Serif for display headings, DM Sans for body, JetBrains Mono for code and data

## Deployment Architecture

The dashboard runs as a separate Cloud Run service (`ai-os-dashboard`) from the MCP Gateway (`ai-os-gateway`), sharing the same GCP project, service account, Cloud SQL instance, and Secret Manager secrets. Separation enables independent scaling and deployment cycles. Both services scale to zero, keeping monthly cost between $3-8.

CI/CD is handled by Cloud Build, automatically triggered on push to main.

## Planned Extensions (Phase 3b+)

- **Risk Dashboard** -- Overdue task clusters, velocity decline trends, blocked dependency chains
- **Notifications Center** -- Push notification history, alert settings, digest preferences
- **Content Calendar** -- Visual calendar for campaigns and posts with platform-specific previews
- **Pipeline Monitor** -- Workflow status, last run, success rates, logs
- **Knowledge Explorer** -- Force-directed graph of knowledge entries and connections
- **Analytics** -- Weekly velocity charts, domain time allocation, trend analysis
