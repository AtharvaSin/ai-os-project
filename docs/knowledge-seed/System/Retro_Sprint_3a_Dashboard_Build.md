# Sprint Retrospective: Sprint 3a -- Dashboard PWA Build and Deploy

## Context

Sprint 3a (Entry 005-007, 2026-03-14 to 2026-03-15) was the largest build sprint. The goal was to design the interface layer strategy, build the Dashboard PWA from scratch, seed the database with realistic task data, and deploy everything to Cloud Run.

## Decision / Content

### What Was Delivered
- **Interface strategy decided:** Option C (Google Rails + Custom Intelligence Layer) selected over Notion integration and full native mobile
- **Dashboard PWA built:** 56 source files, ~3,200 lines of code
  - 6 pages: Command Center, Project Detail, Task Board, Gantt Timeline, Sign-in, Error
  - 7 API routes: projects, tasks, milestones, gantt, auth
  - 16 React components including KanbanBoard (drag-and-drop) and GanttChart (CSS Grid)
- **Auth system:** NextAuth.js with Google OAuth, single-email gate
- **PWA features:** manifest.json, service worker, offline fallback, installable icons
- **28 tasks seeded:** AI OS (12), AI&U (8), Bharatvarsh (8) with realistic distribution
- **Deployed to Cloud Run:** ai-os-dashboard service, scale-to-zero, 512Mi
- **2 new secrets:** NEXTAUTH_SECRET, DASHBOARD_OAUTH_SECRET

### Architecture Decisions Made
- **Custom CSS Grid Gantt over frappe-gantt:** Better React integration and theme consistency
- **Server components by default:** Command Center and Project Detail are server components; Task Board and Gantt are client components for interactivity
- **@hello-pangea/dnd for Kanban:** Maintained fork of react-beautiful-dnd
- **No ORM:** Raw SQL via pg npm package, matching the MCP Gateway's direct-SQL approach
- **Desktop OAuth for local dev:** Reused MCP Gateway's Desktop client; Web Application client for production

### What Went Well
- **End-to-end in one sprint:** From zero code to deployed dashboard with auth, 6 pages, and live data
- **Obsidian Aurora design system:** Consistent dark theme across all pages without design drift
- **Seed data quality:** 28 tasks with realistic priority/status distribution made the dashboard immediately useful

### What Could Be Improved
- **Manual deploy only:** Dashboard was deployed via Cloud Build submit, not an automated trigger. Trigger creation was deferred.
- **No automated tests:** React components have no test coverage. Acceptable for a demo/personal tool but a risk for future changes.
- **CSP disabled in dev:** Content Security Policy headers work in production but had to be disabled for local development (Next.js HMR requires eval).

### Key Metrics
- Source files: 56
- Lines of code: ~3,200
- Pages: 6
- API routes: 7
- React components: 16
- Tasks seeded: 28
- Secrets created: 2
- Image size: ~78MB

## Consequences

- The dashboard became the primary visual interface for project management
- Cloud Build trigger for auto-deploy remains a follow-up task
- Phase 3b (AI Risk Engine + push notifications) is the next major build

## Related

- Decision: Dashboard as PWA (formalized during this sprint)
- Decision: Scale-to-Zero Cloud Run (dashboard deployed with this pattern)
- Retro: Sprint 2 -- Google Modules (predecessor sprint)
- Retro: Sprint 4 -- Deployment and CI/CD (concurrent sprint, MCP Gateway deployment)
