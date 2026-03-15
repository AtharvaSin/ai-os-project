# Bharatvarsh Website Technical Architecture

## Platform Overview

The Bharatvarsh website (welcometobharatvarsh.com) is the primary digital gateway for the novel MahaBharatvarsh. It is not a static book page. It is an immersive alternate-history experience featuring AI-powered voice interaction, community forums, interactive lore archives, and a cinematic scrollytelling landing page. The site serves three strategic objectives: brand immersion and conversion to purchase, audience capture through a lead magnet funnel, and interactive storytelling that breaks the boundaries of a standard book site.

## Core Tech Stack

- **Framework:** Next.js 16.1.1 (App Router, SSR/SSG, API routes)
- **Language:** TypeScript (full-stack)
- **Database:** PostgreSQL via Prisma ORM v6.19.2 (Cloud SQL)
- **UI:** Tailwind CSS v4 + Framer Motion (scroll animations, page transitions) + Radix UI Primitives
- **State Management:** Zustand (client-side)
- **Auth:** NextAuth.js v5 Beta with Google OAuth + Prisma Adapter
- **Design System:** Custom dark-mode palette -- obsidian, powder, and mustard

## Application Structure

The website is organised into feature modules:
- **Home** (`src/features/home/`) -- Cinematic scrollytelling with parallax, introducing the Bharatvarsh world as the primary hook
- **Novel** (`src/features/novel/`) -- Product page with synopsis, genres, purchase links, and lead magnet funnel
- **Lore and Timeline** (`src/features/lore/`, `src/features/timeline/`) -- Interactive universe exploration with factions, characters, locations, and a vertical alternate-history timeline from 1717 to present
- **Forum** (`src/features/forum/`) -- Community platform with API-backed user-generated content and Vertex AI moderation
- **Bhoomi AI** (`src/components/bhoomi/`) -- Conversational AI interface as a global floating widget

## Deployment and Infrastructure

The website runs entirely on Google Cloud Platform:
- **Hosting:** Cloud Run (serverless, auto-scaling)
- **CI/CD:** Cloud Build, auto-triggered on push to main/staging
- **Container Registry:** Google Artifact Registry (Docker images tagged with commit SHA)
- **Secrets:** Cloud Secret Manager (DATABASE_URL, LIVEKIT_API_KEY, RESEND_API_KEY, etc.)
- **Database:** Cloud SQL PostgreSQL with Auth Proxy

The deployment pipeline uses a canary strategy: build the Next.js app, create a Docker image with multi-stage build and non-root user, deploy with zero traffic, then progressively route 10% to 50% to 100% with health checks at each stage. Auto-rollback on health check failure.

## External Services

- **Google Cloud Vertex AI** -- NLP processing, forum moderation, conversational intelligence for Bhoomi
- **LiveKit** -- WebRTC infrastructure for real-time voice streaming (Bhoomi voice assistant)
- **Resend + Nodemailer** -- Transactional email for verification and lead magnet delivery
- **Google Analytics / Tag Manager** -- User behaviour tracking and marketing metrics

## Key Experiences

The flagship differentiator is the **Bhoomi AI Voice Assistant** -- a floating widget that enables real-time voice interaction with a Directorate Mesh intelligence character. Built on LiveKit + Vertex AI with sub-second latency, it is unprecedented for a novel website.

The **Lead Magnet Funnel** captures reader emails through a Chapter 1 Dossier download: name + email + phone submission, verification email via Resend, and secure download link. Captured emails feed future marketing campaigns and sequel announcements.

## Purchase and Distribution

The novel MahaBharatvarsh is available on Amazon India (amazon.in/dp/B0GHS8127Z), Flipkart, and Notion Press.
