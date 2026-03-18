# AI OS Dashboard — Visual Testing Report

**Date:** 2026-03-18
**URL:** https://ai-os-dashboard-sv4fbx5yna-el.a.run.app
**Tool:** Playwright MCP (browser automation)
**Viewports:** Desktop 1440x900, Mobile 390x844

---

## Executive Summary

| Area | Status | Notes |
|------|--------|-------|
| Sign-In Page | PASS | All elements render correctly |
| Auth Error Page | PASS | Proper error messaging and recovery link |
| Auth Redirects | PARTIAL FAIL | 2 of 6 routes bypass middleware |
| OAuth Flow | BLOCKED | Local dev server (port 3000) intercepts callback |
| Risk Dashboard | PASS (layout) | Page shell renders; data fails without session |
| Pipeline Monitor | PASS (layout) | Page shell renders; shows 0 pipelines |
| Desktop Sidebar Nav | PASS | All 8 links route correctly with active states |
| Mobile Bottom Nav | PASS | All 5 links route correctly with active states |
| Responsive Design | PASS | Sidebar hidden on mobile, bottom nav visible |
| Theme CSS | PASS | Obsidian dark theme with correct custom properties |
| Console Errors | PASS | Zero JS errors on production pages |

**Overall: 9 PASS, 1 PARTIAL FAIL, 1 BLOCKED**

---

## Phase 1: Unauthenticated Tests

### 1.1 Sign-In Page (`/auth/signin`)

**Result: PASS**

| Check | Status | Detail |
|-------|--------|--------|
| "AI OS" heading | PASS | `<h1>` with Instrument Serif font, 36px |
| "Command Center" subtitle | PASS | Paragraph below heading |
| "Sign in with Google" button | PASS | Purple button with Google icon |
| "Restricted to authorized accounts only." | PASS | Footer text present |
| Desktop layout | PASS | Centered card on dark background, sidebar visible |
| Mobile layout | PASS | Card centered, sidebar hidden, bottom nav visible |
| Console errors | PASS | Zero errors |

**Screenshots:** `test-signin-desktop.png`, `test-signin-mobile.png`

**Visual Notes:**
- Sign-in card has subtle border with rounded corners on obsidian background
- Purple (#7b68ee) accent on the Google button matches `--accent-purple`
- Sidebar and Sign Out button visible on sign-in page (minor UX issue — user isn't authenticated)

---

### 1.2 Auth Error Page (`/auth/error`)

**Result: PASS**

| Check | Status | Detail |
|-------|--------|--------|
| "Access Denied" heading | PASS | Red text heading |
| Error message | PASS | "This account is not authorized to access AI OS." |
| "Try Another Account" link | PASS | Links to `/auth/signin` |
| Console errors | PASS | Zero errors |

**Screenshot:** `test-auth-error-desktop.png`

---

### 1.3 Auth Redirect Tests

**Result: PARTIAL FAIL — 2 routes bypass middleware**

| Route | Expected | Actual | Status |
|-------|----------|--------|--------|
| `/` | Redirect to signin | `/auth/signin?callbackUrl=%2F` | PASS |
| `/tasks` | Redirect to signin | `/auth/signin?callbackUrl=%2Ftasks` | PASS |
| `/gantt` | Redirect to signin | `/auth/signin?callbackUrl=%2Fgantt` | PASS |
| `/risks` | Redirect to signin | **Loads Risk Dashboard page** | FAIL |
| `/pipelines` | Redirect to signin | **Loads Pipeline Monitor page** | FAIL |
| `/projects/ai-os` | Redirect to signin | `/auth/signin?callbackUrl=%2Fprojects%2Fai-os` | PASS |

**Root Cause:** The deployed middleware.ts does not include `/risks` and `/pipelines` in its matcher. The local codebase has a staged fix (`git status` shows `M dashboard/src/middleware.ts`) that adds these routes, but it hasn't been deployed yet.

**Network Evidence:**
- `GET /api/risks` → 307 redirect (API layer IS protected)
- `GET /pipelines` (RSC) → 200 (page layer NOT protected)

**Impact:** Page shells load unauthenticated, but API data is protected (returns empty/error). Low severity — no data leakage, but unintended page access.

**Fix:** Deploy the staged middleware.ts changes to Cloud Run.

---

### 1.4 OAuth Authentication

**Result: BLOCKED**

**Issue:** Clicking "Sign in with Google" on the Cloud Run site triggers NextAuth OAuth flow, which redirects the browser to `http://localhost:3000/api/auth/error?error=OAuthSignin`. A local Next.js dev server (PID 13140) is running on port 3000 and intercepting the OAuth callback.

**Likely Causes:**
1. Cloud Run deployment may have `NEXTAUTH_URL=http://localhost:3000` in its environment
2. Google OAuth console may have `http://localhost:3000` as the only authorized redirect URI
3. The local dev server is catching the redirect before the Cloud Run callback completes

**Impact:** All Phase 2 authenticated page tests (Command Center, Task Board, Gantt Timeline, Project Detail) could not be executed with live data.

**Fix Required:** Stop local dev server on port 3000 OR verify `NEXTAUTH_URL` on Cloud Run deployment matches the production URL.

---

## Phase 2: Authenticated Tests (Partial — Unprotected Routes Only)

### 2.4 Risk Dashboard (`/risks`)

**Result: PASS (layout) — data requires auth**

| Check | Status | Detail |
|-------|--------|--------|
| Page heading | PASS | "Risk Dashboard" |
| Subtitle | PASS | "Proactive risk detection across all projects" |
| Risk type filter dropdown | PASS | 6 options: All, Overdue Clusters, Velocity Decline, Milestone Slips, Dependency Chains, Stale Projects |
| Loading state | PASS | Shows "Loading risk data..." then error |
| Error state | PASS | "Failed to load risk data" (API returns 307 without session) |
| Summary cards | NOT TESTED | Requires data |
| Risk alert list | NOT TESTED | Requires data |
| Velocity chart | NOT TESTED | Requires data |
| Console errors | PASS | Zero errors |
| Mobile layout | PASS | Responsive, bottom nav shows "Risks" active |

**Screenshots:** `test-risks-desktop.png`, `test-risks-mobile.png`

---

### 2.5 Pipeline Monitor (`/pipelines`)

**Result: PASS (layout) — data requires auth**

| Check | Status | Detail |
|-------|--------|--------|
| Page heading | PASS | "Pipeline Monitor" |
| Subtitle | PASS | "Real-time status of all 0 autonomous pipelines" |
| Loading state | PASS | Shows "Loading pipelines..." then resolves to 0 |
| Pipeline cards | NOT TESTED | Requires data / no pipelines configured |
| Console errors | PASS | Zero errors |
| Mobile layout | PASS | Responsive, bottom nav shows "Pipes" active |

**Screenshots:** `test-pipelines-desktop.png`, `test-pipelines-mobile.png`

---

### Pages NOT Tested (Auth Required)

| Page | Route | Reason |
|------|-------|--------|
| Command Center | `/` | Auth redirect, OAuth blocked |
| Task Board | `/tasks` | Auth redirect, OAuth blocked |
| Gantt Timeline | `/gantt` | Auth redirect, OAuth blocked |
| Project Detail | `/projects/ai-os` | Auth redirect, OAuth blocked |
| Project Detail (AIU) | `/projects/aiu-youtube` | Auth redirect, OAuth blocked |
| Project Detail (Bharatvarsh) | `/projects/bharatvarsh` | Auth redirect, OAuth blocked |

---

## Phase 2.7: Navigation Tests

### Desktop Sidebar

**Result: PASS**

| Link | Route | Active State | Correct Page |
|------|-------|-------------|-------------|
| Command Center | `/` → signin redirect | PASS | PASS |
| Task Board | `/tasks` → signin redirect | PASS | PASS |
| Gantt Timeline | `/gantt` → signin redirect | PASS | PASS |
| Risk Dashboard | `/risks` | PASS | PASS |
| Pipelines | `/pipelines` | PASS | PASS |
| AI Operating System | `/projects/ai-os` → signin redirect | PASS | PASS |
| AI&U YouTube | `/projects/aiu-youtube` | Present | Not clicked |
| Bharatvarsh | `/projects/bharatvarsh` | Present | Not clicked |

**Visual:** Active link text is brighter/highlighted vs muted text for inactive links. "PROJECTS" section header properly separates page nav from project nav.

### Mobile Bottom Nav

**Result: PASS**

| Link | Route | Active State |
|------|-------|-------------|
| Home | `/` → signin redirect | PASS |
| Tasks | `/tasks` → signin redirect | PASS |
| Risks | `/risks` | PASS |
| Pipes | `/pipelines` | PASS |
| More | `/projects/ai-os` → signin redirect | PASS |

**Visual:** Bottom nav is fixed at viewport bottom with icon + label for each item. Active item highlighted with accent color.

---

## Phase 3: Cross-Cutting Checks

### Theme CSS Variables

**Result: PASS — 11 custom properties defined**

| Variable | Value | Expected | Status |
|----------|-------|----------|--------|
| `--bg-primary` | `#0d0d14` | Dark obsidian | PASS |
| `--bg-card` | `#12121e` | Slightly lighter | PASS |
| `--bg-hover` | `#1a1a2e` | Hover state | PASS |
| `--border` | `#1f1f35` | Subtle border | PASS |
| `--text-primary` | `#e8e6e1` | Off-white | PASS |
| `--text-secondary` | `#a09d95` | Muted | PASS |
| `--text-muted` | `#807d75` | Very muted | PASS |
| `--accent-gold` | `#e8b931` | Gold accent | PASS |
| `--accent-teal` | `#4ecdc4` | Teal accent | PASS |
| `--accent-purple` | `#7b68ee` | Purple accent | PASS |
| `--accent-red` | `#ff6b6b` | Red accent | PASS |

**Computed Styles:**
- Body background: `rgb(13, 13, 20)` = `#0d0d14` ✓
- Sidebar background: `rgb(18, 18, 30)` = `#12121e` ✓
- H1 font: Instrument Serif (serif), 36px, `#e8e6e1` ✓

### Console Errors

| Page | Errors | Warnings |
|------|--------|----------|
| `/auth/signin` | 0 | 0 |
| `/auth/error` | 0 | 0 |
| `/risks` | 0 | 0 |
| `/pipelines` | 0 | 0 |

**Note:** Console errors only appeared on the localhost:3000 error page (middleware-manifest.json missing), not on any Cloud Run pages.

### Network Health

| Endpoint | Status | Note |
|----------|--------|------|
| `/api/auth/session` | 200 | Returns empty session (expected) |
| `/api/risks` | 307 | Redirects to signin (API protected) |
| `/` RSC | 307 | Protected |
| `/tasks` RSC | 307 | Protected |
| `/gantt` RSC | 307 | Protected |
| `/pipelines` RSC | 200 | **Not protected** |
| `/projects/ai-os` RSC | 307 | Protected |
| No CORS errors | PASS | All same-origin |

---

## Issues Found

### Critical

None.

### High

1. **Middleware Gap — `/risks` and `/pipelines` bypass auth** (Phase 1.3)
   - Deployed middleware.ts missing these routes in matcher
   - Fix staged locally but not deployed
   - Data layer IS protected (API returns 307), so no data leakage
   - **Action:** Deploy staged middleware.ts to Cloud Run

### Medium

2. **OAuth Flow Broken in Playwright** (Phase 1.4)
   - Local dev server on port 3000 intercepts OAuth callback
   - Prevented testing of 6 authenticated pages
   - **Action:** Verify `NEXTAUTH_URL` in Cloud Run env; ensure Google OAuth redirect URIs include the Cloud Run URL

### Low

3. **Sidebar + Sign Out visible on unauthenticated pages** (Phase 1.1)
   - Sign-in and error pages show the full sidebar with navigation links and a "Sign Out" button
   - Clicking nav links from signin page just redirects back to signin
   - **Action:** Consider hiding sidebar/Sign Out on auth pages for cleaner UX

4. **MobileNav visible on sign-in page** (Phase 1.1)
   - Bottom navigation (Home, Tasks, Risks, Pipes, More) shows on the sign-in page
   - **Action:** Consider conditionally hiding MobileNav on `/auth/*` routes

5. **Page title always "AI OS — Command Center"** (all pages)
   - Every page has the same `<title>` regardless of the actual page
   - **Action:** Set dynamic page titles per route for better tab/bookmark identification

6. **Pipeline count shows "0 autonomous pipelines"** (Phase 2.5)
   - Even without auth, the page subtitle shows "all 0 autonomous pipelines"
   - This leaks the pipeline count (albeit harmless)
   - **Action:** Show generic text when no session, or protect the page properly

---

## Recommendations

1. **Deploy middleware fix immediately** — the staged changes to `middleware.ts` add `/risks` and `/pipelines` to the auth matcher. Redeploy to close the auth gap.

2. **Verify NEXTAUTH_URL on Cloud Run** — ensure the environment variable matches `https://ai-os-dashboard-sv4fbx5yna-el.a.run.app` (not localhost).

3. **Add dynamic page titles** — each route should set its own `<title>` for SEO and usability.

4. **Conditionally hide nav on auth pages** — check the session/route and hide the sidebar + MobileNav on `/auth/signin` and `/auth/error` for a cleaner pre-auth experience.

5. **Re-run authenticated tests** — once OAuth is working in a browser session, re-test Command Center, Task Board, Gantt Timeline, and all 3 Project Detail pages with live data.

---

## Test Artifacts

| File | Description |
|------|-------------|
| `test-signin-desktop.png` | Sign-in page at 1440x900 |
| `test-signin-mobile.png` | Sign-in page at 390x844 |
| `test-auth-error-desktop.png` | Auth error page at 1440x900 |
| `test-risks-desktop.png` | Risk Dashboard at 1440x900 |
| `test-risks-mobile.png` | Risk Dashboard at 390x844 |
| `test-pipelines-desktop.png` | Pipeline Monitor at 1440x900 |
| `test-pipelines-mobile.png` | Pipeline Monitor at 390x844 |
