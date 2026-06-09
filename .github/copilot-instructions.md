# MINAN Copilot Instructions

You are an expert AI programming assistant working on the MINAN platform—a marketing-focused commerce platform built with Next.js 16, Express, and MongoDB.

## 🎯 1. Project Context & Goals
- **Frameworks:** Next.js 16 (App Router), Express.js (Node 24.16.0), MongoDB Atlas (8.3).
- **Scope:** Lead Gen/Conversion MVP (No payment processing).
- **Market:** Bangladesh (Sylhet), mobile-first, 3G/4G, Facebook Ads driven.
- **Goals:** Premium brand experience, first-party database building, Meta Pixel + CAPI with event deduplication.
- **Vibe:** Highly optimized, strictly typed, and scalable for future e-commerce migration.

## 🏗️ 2. Architecture Overview
**Flow:** Browser -> Next.js (Vercel) -> Express API (Render) -> MongoDB Atlas

### Auth & Request Layers:
- **`proxy.ts`:** Verifies JWT via `httpOnly` cookie server-side *before* Next.js renders admin pages. Serves as a UI guard.
- **Next.js Client:** Sends `Authorization: Bearer <token>` from Zustand on every API call.
- **Express Middleware:** Verifies Bearer token independently on every protected API route. Serves as a Data guard.
- No Supabase. We solely rely on custom JWT Auth + MongoDB.

## 📜 3. Absolute Code Rules

### Next.js & React Core
- **App Router ONLY.** No Pages Router.
- **NO `middleware.ts`.** The project strictly uses `proxy.ts`.
- **NO Route Handlers** (`app/api/*`). All APIs and data fetching go through the Express API backend.
- **Caching:** Use the Next.js 16 `use cache` directive for SSR caching. Do NOT use `fetch()` cache options.
- **Images:** Always use `<Image>` from `next/image` with Cloudinary URLs. NEVER use raw `<img>` tags or local image files.

### State & Forms
- **Global State:** Zustand ONLY (no Redux, no React Context for state).
- **Forms:** React Hook Form + Zod ONLY (no uncontrolled inputs).
- **Validation:** Define Zod schemas in `features/<domain>/schemas/`. Share these schemas with the backend where applicable.

### Styling & Animation
- **Styling:** Tailwind CSS v4 utility classes ONLY. No arbitrary CSS-in-JS.
- **Components:** `shadcn/ui` output goes in `components/ui/`. DO NOT manually edit these generated files.
- **Animations:** GSAP ONLY. No Framer Motion. Do not target Radix UI internal DOM nodes with GSAP.

### TypeScript Strictness
- **Strict Mode Everywhere.**
- **NO `any`.**
- **NO type casting** with `as unknown`.

## 📁 4. Project Structure (Feature-Sliced Colocation)
Always colocate domain logic in `features/<domain>/`:
- `components/` - Domain-specific UI
- `hooks/` - Domain-specific React hooks
- `actions/` - Server actions or API call wrappers
- `services/` - Logic encapsulation
- `schemas/` - Zod validation schemas
- `types/` - TS types/interfaces

## 🛠️ 5. Sub-Instructions & Skills
The repository modularizes code rules dynamically via `.github/instructions/`:
- **React/Next.js/TS:** Core guidelines (`typescript-react.instructions.md`)
- **Tailwind:** Styling guidelines (`tailwind-components.instructions.md`)
- **Express Backend:** Backend API guidelines (`express-backend.instructions.md`)

Use `.github/skills/systematic-debugging/SKILL.md` when diagnosing unexpected behavior or test failures.
