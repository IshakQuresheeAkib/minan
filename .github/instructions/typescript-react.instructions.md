---
description: "Enforce TypeScript, Next.js 16, and general React conventions for MINAN project."
applyTo: "**/*.{ts,tsx}"
---

# TypeScript & React/Next.js Guidelines

When generating or modifying React or Next.js components and related TypeScript files, adhere to the following rules based on the MINAN architecture:

## 1. Next.js 16 (App Router) & React 19
- Use Next.js 16 App Router exclusively, alongside React 19 (Compiler enabled). No Pages Router.
- **NO `middleware.ts`.** The project strictly uses `proxy.ts` for server-side JWT verification.
- **NO Route Handlers** (`app/api/*`). All API calls should go to the Express backend.
- **NO Server Actions for data mutations:** `actions/*.actions.ts` files must be plain async client-side functions that act as wrappers to call the Express API.
- **Exception:** Next.js Server Actions should ONLY be used for auth functions (login/refresh/logout) because they are required to set `httpOnly` cookies over the network natively.
- Use the `use cache` directive for SSR data caching. Do NOT use `fetch()` cache options, as they are removed in Next 15+ when `cacheComponents: true` is enabled.

## 2. State & Data
- Use **Zustand** exclusively for global state (no Redux, no React Context for state). Access tokens reside here in memory.
- Use **React Hook Form + Zod** exclusively for forms. No uncontrolled inputs.
- Place all Zod schemas in `features/<domain>/schemas/`. Important: These schemas must be manually kept in sync with the backend schemas as they are not shared cross-repo right now.

## 3. Tracking & CAPI
- The client should generate a unique `event_id` (using `crypto.randomUUID()`) when firing Meta Pixel events for tracking scenarios that require deduplication (e.g., `product_view`, `add_to_cart`).
- **Never fire** `lead_submit` Pixel events on the client-side. This is managed exclusively via the backend through Meta CAPI.

## 4. TypeScript
- Strict mode is mandatory.
- No `any` types. Avoid type casting with `as unknown`. Provide proper typing for all interfaces and functions.

## 5. Architecture & Colocation
- Domain logic must be colocated in `features/<domain>/`. This includes components, hooks, actions, services, schemas, and types.
- Do not manually edit files in `components/ui/`. This directory is strictly for **shadcn/ui** generated output.

## 6. Next Semantics & Animations
- Always use `next/image` with Cloudinary URLs. Never use raw `<img>` tags.
- Always use `next/link` for internal navigation. Never use `<a>` tags.
- Use **GSAP** only for animations. Do NOT use Framer Motion.
- Do NOT target Radix UI internal DOM nodes with GSAP.
- Stick to transform and opacity for animations.
