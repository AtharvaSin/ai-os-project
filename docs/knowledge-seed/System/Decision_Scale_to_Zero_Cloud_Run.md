# Architecture Decision: Scale-to-Zero Cloud Run

## Context

The AI Operating System runs on a personal project budget. All backend services (MCP Gateway, Dashboard PWA, Task Notification) needed hosting that would not incur fixed monthly costs during periods of inactivity. The services are used intermittently -- primarily during active development sessions and daily scheduled jobs -- not under continuous high-traffic load.

The options were: (1) always-on Cloud Run with min-instances=1 ($15-30/month), (2) scale-to-zero Cloud Run with min-instances=0 ($0-7/month per service), or (3) Cloud Functions for everything (limited by Gen 2 buildpack issues).

## Decision / Content

**All Cloud Run services use min-instances=0 (scale-to-zero)** to minimize costs during idle periods.

### Service Configuration

| Service | Memory | CPU | Min Instances | Max Instances | Auth |
|---------|--------|-----|---------------|---------------|------|
| ai-os-gateway (MCP Gateway) | 512Mi | 1 | 0 | default | Bearer token (no IAM) |
| ai-os-dashboard (Dashboard PWA) | 512Mi | 1 | 0 | 3 | Public (NextAuth.js handles auth) |
| task-notification-daily | 256Mi | 1 | 0 | 1 | OIDC (Cloud Scheduler) |

### Cost Impact
- **MCP Gateway:** $0-7/month (billed only during active requests)
- **Dashboard:** $3-8/month (SSR pages, slightly more usage)
- **Task Notification:** ~$0.01/month (runs once daily for seconds)
- **Total compute:** $3-15/month across all services

### Cold Start Trade-off
Scale-to-zero means a cold start of 2-5 seconds when a service has been idle. This is acceptable because:
- MCP Gateway cold starts are masked by AI API call latency (2-10 seconds)
- Dashboard cold starts are tolerable for a personal tool (not a customer-facing SaaS)
- Task Notification runs on a schedule (cold start does not affect user experience)

## Consequences

- **Enables:** Near-zero cost during idle periods. No fixed monthly compute charges. Services can be left deployed indefinitely without accumulating costs.
- **Constrains:** First request after idle period incurs 2-5 second cold start. Not suitable for latency-sensitive customer-facing APIs. WebSocket connections are not maintained across scale-down events.
- **Changes:** If the dashboard gains regular daily usage, min-instances could be set to 1 for the dashboard only, adding ~$8-15/month but eliminating cold starts for the most-used service.

## Related

- Reference: GCP Infrastructure (deployment templates with min-instances=0)
- Decision: Three-Category Architecture (Category B and C both use Cloud Run)
- Decision: Unified MCP Gateway (gateway uses this pattern)
- Decision: Dashboard as PWA (dashboard uses this pattern)
