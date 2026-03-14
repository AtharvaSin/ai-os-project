# Bharatvarsh Digital Platform

> **Purpose:** Technical and marketing reference for the Bharatvarsh website, infrastructure, and digital presence. Companion to BHARATVARSH_BIBLE.md (which covers lore/characters/world). This document covers the live product.
>
> **Live at:** https://welcometobharatvarsh.com
> **Last updated:** 2026-03-14

---

## 1. Platform Overview

The Bharatvarsh website is the primary digital gateway for the novel MahaBharatvarsh. It serves three strategic objectives: brand immersion and conversion to purchase, audience capture through a lead magnet funnel, and interactive storytelling that breaks the boundaries of a standard book site.

The site is NOT a static book page. It is an immersive alternate-history experience with AI-powered voice interaction (Bhoomi), community forums, interactive lore archives, and a scrollytelling landing page.

---

## 2. Architecture & Tech Stack

**Framework:** Next.js 16.1.1 (App Router, SSR/SSG, API routes)
**Language:** TypeScript (full-stack)
**Database:** PostgreSQL via Prisma ORM v6.19.2 (Cloud SQL)
**UI:** Tailwind CSS v4 + Framer Motion (scroll animations, page transitions) + Radix UI Primitives
**State:** Zustand (client-side)
**Auth:** NextAuth.js v5 Beta with Google OAuth + Prisma Adapter
**Design system:** Custom dark-mode palette — obsidian, powder, and mustard

### Application Structure
- **Home** (`src/features/home/`) — Cinematic scrollytelling with parallax, introducing the Bharatvarsh world
- **Novel** (`src/features/novel/`) — Product page with synopsis, genres, purchase links, lead magnet
- **Lore & Timeline** (`src/features/lore/`, `src/features/timeline/`) — Interactive universe exploration, factions, characters, vertical alternate-history timeline
- **Forum** (`src/features/forum/`) — Community platform (API-backed, user-generated content)
- **Bhoomi AI** (`src/components/bhoomi/`) — Conversational AI interface (global client widget)
- **Auth & Admin** — User sessions and internal dashboards

---

## 3. Deployment & Infrastructure (GCP)

**Hosting:** Google Cloud Run (serverless, auto-scaling)
**CI/CD:** Google Cloud Build — auto-triggered on push to main/staging
**Registry:** Google Artifact Registry (Docker images tagged with commit SHA)
**Secrets:** Google Cloud Secret Manager (DATABASE_URL, LIVEKIT_API_KEY, RESEND_API_KEY, etc.)
**Database:** Cloud SQL PostgreSQL with Auth Proxy

### Deployment Pipeline
1. Build → inline env vars, npm ci, generate Prisma client, build Next.js
2. Docker → multi-stage build, standalone output, non-root user, push to Artifact Registry
3. Canary → deploy with --no-traffic, route 10% → health check → 50% → 100%
4. Agent service → separate Cloud Run instance with --no-cpu-throttling (WebSocket persistence)
5. Auto-rollback on health check failure

---

## 4. External Services

| Service | Role |
|---------|------|
| Google Cloud Vertex AI | NLP processing, forum moderation, conversational intelligence for Bhoomi |
| LiveKit | WebRTC infrastructure for real-time voice streaming (Bhoomi voice assistant) |
| Resend + Nodemailer | Transactional email — verification and lead magnet delivery |
| Google Analytics / Tag Manager | User behavior tracking, marketing metrics, outbound link tracking |

---

## 5. Key User Experiences

### Scrollytelling Landing Page
Cinematic parallax experience introducing the world. Framer Motion + dark theme. Acts as the primary hook — visitors experience the world's stakes before seeing a purchase link.

### Lead Magnet Funnel (Novel Page)
User provides name, email, phone → verification email via Resend → secure link → exclusive Chapter 1 Dossier download. Captures verified reader email for future marketing campaigns.

### Bhoomi AI Voice Assistant
Floating widget → conversational UI → microphone-enabled voice interaction. Users speak with "Bhoomi" (a Directorate Mesh intelligence character) about the novel's lore in real-time. Built on LiveKit + Vertex AI. Sub-second latency. This is the flagship differentiator — unprecedented for a novel website.

### Interactive Lore & Timeline
Vertical scrollable timeline covering 1717 to present. Dynamic progress tracking. Encyclopedia-style exploration of factions, characters, locations. Classified/Declassified status system.

### Community Forum
Verified users post discussions, share theories, interact. Vertex AI moderation. Transforms readers into active fan base.

---

## 6. Purchase & Distribution

| Platform | Link |
|----------|------|
| Amazon India | amazon.in/dp/B0GHS8127Z |
| Flipkart | Listed |
| Notion Press | Listed |

---

## 7. Marketing & Growth Status

- **Website:** Live and functional with all core features
- **Bhoomi voice AI:** Operational
- **Forum:** Live but early-stage (needs community seeding)
- **Lead magnet:** Functional (Chapter 1 Dossier)
- **Social presence:** Twitter/X and Instagram linked but content cadence not yet established
- **Content marketing:** Not yet systematized — this is the primary growth lever to build next
- **SEO:** Basic setup via Next.js SSR. No dedicated SEO strategy yet.
- **Analytics:** Google Analytics + Tag Manager integrated

### Growth Priorities
1. Establish consistent content marketing cadence (social posts, lore reveals, character teasers)
2. Seed the forum with discussion topics and initial engagement
3. Drive traffic to lead magnet funnel
4. Build email list through Chapter 1 Dossier conversions
5. Cross-promote with AI&U channel where relevant (AI-powered novel experience angle)

---

## 8. Technical Roadmap

- Sequel content integration (new characters, locations, timeline entries)
- Graphic novel adaptation pipeline
- Enhanced Bhoomi capabilities (deeper lore responses, multi-turn memory)
- Newsletter/email campaign automation from captured leads
- Forum gamification and engagement mechanics
- Potential mobile app or PWA
