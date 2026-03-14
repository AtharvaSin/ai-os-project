# SERVICES & CONFIGURATION

The Bharatvarsh website integrates multiple internal and external services to deliver its core functionalities, from authentication to AI capabilities and communications.

## 1. Internal Services
- **Authentication**: Powered by **NextAuth.js (v5 Beta)** combined with the Prisma Adapter. It currently supports Google OAuth for seamless and secure sign-ins.
- **Database**: A Cloud SQL PostgreSQL database is the core data store. It tracks users, forum topics, newsletter subscriptions, and AI conversation history.
- **API Backend**: Built directly within the Next.js App Router using Route Handlers mapping to RESTful endpoints (e.g., `/api/forum`, `/api/health`). 
- **Agent Service**: A standalone Node.js/WebSocket service (`/agent-service` directory) separated from the Next.js application, specifically dedicated to handling real-time AI capabilities.

## 2. External Services Integration
The platform relies heavily on third-party integrations:

- **Google Cloud Vertex AI**: Used to process natural language. It functions both as an AI moderation tool for the community forum and as the intelligence engine behind conversational agents.
- **LiveKit**: WebRTC infrastructure that enables real-time, low-latency audio streaming. This is the backbone of the Bhoomi AI voice assistant, connecting the client-side Widget with the backend `agent-service`.
- **Resend & Nodemailer**: Email dispatching services used for critical transactional flows—specifically, the verification of email addresses and the delivery of the novel's lead magnet (the Chapter 1 Dossier).
- **Google Analytics / Tag Manager**: Integrated securely (whitelisted in CSP) to track user behavior, marketing site metrics, and outbound links to points of sale.

## 3. Configuration Management
Environment variables govern application behavior. Safe client-side variables (`NEXT_PUBLIC_*`) are injected at build time, and sensitive secrets are managed specifically on GCP:

- **Client Variables**: Tracked in build pipelines (e.g., `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`, `NEXT_PUBLIC_LIVEKIT_URL`).
- **Secret Credentials**: Critical secrets (such as `DATABASE_URL`, `LIVEKIT_API_KEY`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`) are fetched safely at runtime using **Google Cloud Secret Manager**.
