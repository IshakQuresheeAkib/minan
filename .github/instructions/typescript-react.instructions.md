---
description: "Enforce TypeScript, Next.js 16, and general React conventions for MINAN project."
applyTo: "**/*.{ts,tsx}"
---

# TypeScript & React/Next.js Guidelines

When generating or modifying React or Next.js components and related TypeScript files, adhere to the following rules based on the MINAN architecture:

## 1. Next.js 16 App Router
- Use Next.js 16 App Router exclusively. No Pages Router.
- Do NOT use middleware.ts. The project uses proxy.ts for server-side auth verification.
- Do NOT use Next.js Route Handlers (app/api/*). All API calls should go to the Express backend.
- Use the `use cache` directive for SSR data caching (Next.js 16 pattern), NOT fetch() options.
- Always use next/image for images, combining with Cloudinary URLs stored in the MongoDB database, rather than raw <img> tags.

## 2. State & Data
- Use **Zustand** exclusively for global state (no Redux, no React Context for state). Global state should reside in store/.
- Use **React Hook Form + Zod** exclusively for forms. No uncontrolled inputs.
- Place all Zod schemas in features/<domain>/schemas/.

## 3. TypeScript
- Strict mode is mandatory.
- No `any` types. Avoid type casting with `as unknown`. Provide proper typing for all interfaces and functions.

## 4. Architecture & Colocation
- Domain logic must be colocated in features/<domain>/. This includes components, hooks, actions, services, schemas, and types.
- Do not manually edit files in components/ui/. This directory is strictly for **shadcn/ui** generated output.

## 5. Animations
- Use **GSAP** only for animations. Do NOT use Framer Motion.
- Do NOT target Radix UI internal DOM nodes with GSAP.
- Stick to transform and opacity for animations.
