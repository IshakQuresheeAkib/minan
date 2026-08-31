# Repository Guidelines

## Project Structure & Module Organization
Read context/project.md for full architecture before starting any task.
MINAN is an npm workspace commerce platform. The frontend lives in `apps/web`, a Next.js 16 App Router app with source under `apps/web/src`. Routes are in `src/app`, reusable UI in `src/components`, feature code in `src/features`, shared client state in `src/store`, and API helpers in `src/lib`.

The backend lives in `apps/api`, an Express 5 API with `src/controllers`, `src/routes`, `src/services`, `src/models`, `src/middleware`, and seed scripts under `src/seed`. Repository context and architecture notes are in `context/`; Stitch-generated reference artifacts are in `stitch/`.

Detailed architecture is in context/project.md — read it before working.

## Build, Test, and Development Commands

- `npm install`: install workspace dependencies. Use Node `24.16.0`.
- `npm run dev:web`: start the Next.js frontend with Turbopack.
- `npm run dev:api`: start the Express API with `tsx watch`.
- `npm run build`: build all workspaces that define a build script.
- `npm run lint`: run ESLint across workspaces.
- `npm --workspace @minan/web run typecheck`: run the web TypeScript check.
- `npm --workspace @minan/api run seed` / `seed:admin`: seed product data or the admin user.

## Coding Style & Naming Conventions

Use TypeScript in strict mode. Avoid `any`; the API ESLint config treats explicit `any` as an error. Follow the existing two-space indentation, double quotes, and semicolon style. React components use PascalCase filenames, hooks use `useX.ts`, stores use `*.store.ts`, schemas use `*.schema.ts`, and services use `*.service.ts`.

Keep data access behind the Express API. Do not add Next.js route handlers for app data operations. Use Zod for validation, React Hook Form for forms, Zustand for global client state, GSAP for animations, and `next/image` for Cloudinary product images.

## Testing Guidelines

No test runner is currently configured. When adding tests, colocate them near the code as `*.test.ts` or `*.test.tsx`, add the workspace `test` script, and make `npm run test` pass from the repository root. Cover service logic, auth middleware, validation schemas, and important checkout/admin flows.

## Commit & Pull Request Guidelines

Recent history mostly follows Conventional Commits, for example `feat: enhance API and web application functionality`, `refactor: update home page components`, and `docs: improve table formatting`. Prefer `feat:`, `fix:`, `refactor:`, `chore:`, and `docs:` with concise imperative summaries.

Pull requests should include a short description, linked issue when relevant, verification commands run, and screenshots or recordings for UI changes. Note any environment, seed, or database migration steps.

## Security & Configuration Tips

Keep secrets out of git. Configure MongoDB, auth, CORS, and admin credentials through local environment files. Treat `apps/api` as the only persistence boundary and review auth, role, CSRF, and rate-limit changes carefully.
