# BHARATVARSH WEBSITE - ARCHITECTURAL OVERVIEW

## 1. Introduction
The Bharatvarsh website is a modern, high-performance web application designed to promote the novel *Mahabharatvarsh* and immerse users in its alternate history universe. It serves as an interactive platform combining storytelling, community engagement, and AI-driven interactions.

## 2. Core Technologies & Frameworks
The application is built using a full-stack, server-rendered architecture. The primary technologies include:

- **Framework**: Next.js 16.1.1 leveraging the modern App Router architecture for server-side rendering (SSR), static site generation (SSG), and API routes.
- **Language**: TypeScript across both the frontend and backend for robust type safety.
- **UI & Styling**: 
  - **Tailwind CSS v4** is used for utility-first styling.
  - **Framer Motion** powers complex scroll-linked animations and page transitions.
  - **Radix UI Primitives** deliver accessible and unstyled foundational components (Dialogs, Tabs, Menus).
  - A consistent design system using global CSS variables specifically customized for an "obsidian, powder, and mustard" dark-mode palette.
- **Database**: PostgreSQL, managed via **Prisma ORM** (v6.19.2) for database interactions, schema modeling, and migrations.
- **State Management**: **Zustand** is utilized for lightweight and fast client-side state management.

## 3. Application Structure
The codebase follows a domain-driven structure, primarily organized within `src/features/` and `src/components/`:

- **Home (`src/features/home/`)**: Landing page featuring a highly animated, scrollytelling interface utilizing parallax backgrounds.
- **Novel (`src/features/novel/`)**: The core product page for *Mahabharatvarsh*, showcasing the synopsis, genres, purchase links, and a lead magnet.
- **Lore & Timeline (`src/features/lore/`, `src/features/timeline/`)**: Interactive modules for exploring universe factions, characters, and an intricate vertical timeline of alternate history.
- **Forum (`src/features/forum/`)**: A Next.js API-backed community platform allowing users to generate content and discuss the novel.
- **Bhoomi AI (`src/components/bhoomi/`)**: The conversational AI interface integrated globally into the client UI.
- **Auth & Admin**: Modules dedicated to user session management and internal dashboards.

## 4. Security
The application is secured via strict HTTP headers defined in `next.config.ts`, including strict Content Security Policies (CSP), HTTP Strict Transport Security (HSTS), and restrictive Permissions-Policy to protect against XSS and framing vulnerabilities.
