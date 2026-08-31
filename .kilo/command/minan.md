---
description: Load full MINAN architecture and common workflow pointers
---

You are working in the MINAN commerce platform (Bangladesh fashion e-commerce, Next.js 16 + Express 5 + MongoDB Atlas).

Before starting any task, internalize these constraints from `context/project.md` and `AGENTS.md`:

- Frontend: `apps/web/src` (App Router, `proxy.ts`, not `middleware.ts`). No Next.js Route Handlers for data — all data goes through Express via `/api/:path*` rewrites.
- Backend: `apps/api/src` (controllers/routes/services/models/middleware). Mongoose 9, Zod 4, argon2, two-token JWT auth.
- Strict TypeScript, no `any`, no Framer Motion (use GSAP), `next/image` only, Zustand for global state, React Hook Form + Zod.
- Follow existing repo patterns before introducing new ones. Production-ready code only — no TODO stubs.

When the user asks for a feature, first locate the relevant existing files under `apps/web/src/features` and `apps/api/src`, then implement following the documented structure and API routes. Reference `context/project.md` section numbers (e.g. "see §9 API Routes") when clarifying scope.
