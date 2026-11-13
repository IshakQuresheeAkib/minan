# Design Document: Modularization of Project Documentation (`context/project.md`)

**Date:** 2026-11-13  
**Status:** Proposed  
**Author:** Antigravity (with User Collaboration via `/grill-me`, `/brainstorming`, `/humanizer`, `/caveman`, `/ponytail`)

---

## 1. Intent and The Why

The `context/project.md` document currently exceeds 1,000 lines. It acts as the single source of truth for the entire MINAN e-commerce platform. While comprehensive, this monolith causes two critical bottlenecks:

1. **For AI Agents (Context & Hallucination Prevention):** Loading 1,000+ lines into every conversational turn wastes ~25,000 tokens on irrelevant details (e.g. an agent working on GSAP animations has to ingest MongoDB Mongoose schemas and bKash webhook specs). This causes "needle-in-a-haystack" distraction, slows down processing, and increases the risk of hallucination.
2. **For the Developer (Beginner-Friendly Comprehension):** The user is a beginner developer. A monolithic technical wall of text loaded with dense backend theory makes it difficult to quickly locate relevant instructions, understand why certain patterns exist, and safely make modifications.

### Core Solution: The Hybrid Hub-and-Spoke Architecture
We will restructure the documentation into a **Hybrid Hub-and-Spoke model**:
- **The Hub (`context/project.md` ~150-200 lines):** A crisp, high-signal master index containing project meta, business goals, universal coding rules (inviolable guardrails), high-level system topology, and an **Agent Navigation Matrix**.
- **6 Focused Domain Sub-documents (The Spokes):** Self-contained, modular technical guides organized by functional domain.
- **2 Specialized Deep-Dive Guides (Kept Intact):** `bkash-payment-gateway-guide.md` and `meta-pixel-and-capi-guide.md` are retained as authoritative deep references.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Token Efficiency & Focus:** AI agents only load the specific domain sub-document relevant to their active task.
- **Zero Knowledge Loss:** 100% of the existing technical specifications, schemas, endpoints, regex patterns, environment variables, and architecture rules in the original 1,000-line `project.md` must be preserved in their designated sub-documents.
- **Humanized & Scannable (ASD-STE100 / ISO 24495-1):** Every sub-document will follow a standardized 4-part structure that starts with plain-English concepts and visual diagrams before delving into strict code rules.
- **Master Routing Index:** AI agents reading `context/project.md` or `AGENTS.md` will instantly know exactly which sub-document to load for any given prompt.

### Non-Goals
- We will **not** modify or refactor application code in `apps/web` or `apps/api`.
- We will **not** rewrite or alter the existing standalone guides (`bkash-payment-gateway-guide.md` and `meta-pixel-and-capi-guide.md`).
- We will **not** create a separate test runner or CI pipeline in this task.

### Anti-Goals (What to Strictly Avoid)
- **Anti-Overengineering (The Ponytail Rule):** Do NOT create 15-20 fragmented micro-files (e.g., `packages.md`, `buttons.md`, `colors.md`). 6 domain files strike the exact balance between modularity and cohesion.
- **Anti-Slop / Anti-Buzzword (The Humanizer Rule):** Ban generic corporate fluff ("delve", "leverage", "robust ecosystem", "multifaceted tapestry"). Replace with active, concrete, single-thought statements.
- **No Ambiguity for AI Agents:** Do not make the guides purely conversational. Every rule must maintain strict typing, exact file paths, explicit HTTP methods, and boundary constraints.

---

## 3. Structural Breakdown & Content Mapping

### Master Hub: `context/project.md` (~150-200 lines)
- **Role:** Central gateway, system overview, and router.
- **Contents:**
  1. Project Meta (Framework, Phase, Market, Traffic, Payment).
  2. Business Goals (Sylhet, Bangladesh, FB Ads, first-party data).
  3. Inviolable Coding Principles (TypeScript strict, no Next.js route handlers for data, `proxy.ts`, GSAP motion, Zustand only).
  4. High-Level Topology Diagram (`Browser -> Next.js (Vercel) -> Express API (Render) -> MongoDB Atlas`).
  5. Master Document Navigation Matrix (Table matching user/agent tasks to sub-docs).
  6. Future Roadmap.

---

### The 6 Domain Sub-Documents

| File Path | Functional Domain | Source Sections from Legacy `project.md` | Key Focus Areas |
| :--- | :--- | :--- | :--- |
| **`context/frontend.md`** | Web Storefront & UI | §4 (Frontend Stack), §10 (Pages/Routes), §11 (Frontend Structure), §15 (SEO/PWA), §16 (Performance), §22 (Cloudinary Client) | Next.js 16 App Router, GSAP motion rules, Tailwind v4, Zustand store, SWR data fetching, React Hook Form + Zod, JSON-LD, Speculation Rules. |
| **`context/backend-api.md`** | Express API & Services | §4 (Backend Stack), §5 (Proxy Rewrites), §9 (API Route Catalog), §21 (Backend Structure Rules), §22 (Cloudinary Signatures) | Express 5, Controller-Service-Model architecture, exact route table (endpoints, payloads, responses), Zod validation, error handling. |
| **`context/database.md`** | MongoDB & Mongoose | §8 (Database & Schemas) | MongoDB Atlas 8.3, Mongoose 9.x schemas (`User`, `Product`, `Order`, `Counter`, `AuditLog`), indexes, atomic counters, transaction guidelines. |
| **`context/checkout-orders.md`** | Checkout, Orders & Payments | §12 (Checkout / Order Form), §19 (Order Status Lifecycle) | Single-page checkout, BD phone regex (`/^(?:\+?88)?01[3-9]\d{8}$/`), advance bKash delivery fee vs COD, Order status state machine, reference to `bkash-payment-gateway-guide.md`. |
| **`context/auth-admin.md`** | Auth, RBAC & Admin Portal | §6 (Authentication), §7 (Admin Access), §19 (Admin Metrics) | Dual JWT token flow (access in-memory/cookie, refresh in cookie), `proxy.ts` cookie forwarding, `super_admin` vs `staff` permissions, Admin KPIs, audit logs. |
| **`context/deployment-security.md`**| DevOps, Hosting & Security | §17 (Security), §18 (Deployment & Env Vars) | Vercel (Web) + Render (API) deployment rules, `AUTH_COOKIE_DOMAIN` setup, full Environment Variables table, Argon2 password hashing, CORS, rate limits, Helmet. |

---

## 4. Standard Sub-Document Anatomy

Each of the 6 sub-documents will strictly implement the following 4-part layout:

```markdown
# [Domain Title]

## 1. Concept & Overview (Beginner Friendly)
- 2-3 plain-English sentences explaining what this part of the system does and WHY it was designed this way.
- Free of jargon, buzzwords, and fluff.

## 2. Visual Flow Diagram
- ASCII / Mermaid sequence diagram illustrating the data flow or lifecycle (e.g. User request -> Proxy -> Express -> Mongo).

## 3. Strict Technical Specifications (AI Agent Directives)
- Exact file paths, schemas, interface definitions, HTTP endpoints, status codes, and regex rules.
- Concrete tables and code blocks with zero placeholders.

## 4. Common Beginner Pitfalls & Mistakes to Avoid
- Bulleted list of practical "gotchas" (e.g. "Do NOT create an `app/api/products/route.ts` file", "Do NOT use Framer Motion", "Do NOT set AUTH_COOKIE_DOMAIN on vercel.app").
```

---

## 5. Updates to Repository Guidelines (`AGENTS.md`)

The root `AGENTS.md` currently instructs:
> "Read context/project.md for full architecture before starting any task."

This will be updated to:
> "Read `context/project.md` for high-level architecture and universal rules. For task-specific work, consult the respective domain guide in `context/`:
> - UI/Components/Pages: `context/frontend.md`
> - API Endpoints/Services: `context/backend-api.md`
> - Database Schemas/Queries: `context/database.md`
> - Checkout/Orders/bKash: `context/checkout-orders.md` (and `bkash-payment-gateway-guide.md`)
> - Auth/Admin Dashboard: `context/auth-admin.md`
> - Deployment/Security/Env: `context/deployment-security.md`
> - Meta Pixel/CAPI: `context/meta-pixel-and-capi-guide.md`"

---

## 6. Implementation Sequence

1. **Step 1:** Write `context/frontend.md` using the 4-part anatomy.
2. **Step 2:** Write `context/backend-api.md`.
3. **Step 3:** Write `context/database.md`.
4. **Step 4:** Write `context/checkout-orders.md`.
5. **Step 5:** Write `context/auth-admin.md`.
6. **Step 6:** Write `context/deployment-security.md`.
7. **Step 7:** Overwrite `context/project.md` with the new lean Master Hub (~150-200 lines).
8. **Step 8:** Update `AGENTS.md` with the modular routing instructions.
9. **Step 9:** Verify all files exist, links resolve, and no technical rules were omitted.
