# Implementation Plan: Modularization of Project Documentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break down monolithic 1,000-line `context/project.md` into a lean master hub and 6 focused domain guides in `context/`, formatted with plain human language (ASD-STE100 / ISO 24495-1) and strict technical rules.

**Architecture:** Hybrid Hub-and-Spoke model. A lean `context/project.md` serves as the router and index. 6 sub-documents contain domain-specific specifications with visual flows, exact tables, schemas, and beginner pitfalls.

**Tech Stack:** Markdown, Mermaid/ASCII diagrams, Next.js 16, Express 5, MongoDB 8.3 / Mongoose 9.x.

**Spec:** `docs/superpowers/specs/2026-11-13-context-docs-modularization-design.md`

## Global Constraints
- Preserve 100% of the technical specifications, schemas, regexes, endpoints, and environment variables from legacy `project.md`. Zero knowledge loss.
- Follow ASD-STE100 and ISO 24495-1:2023 plain language principles. Keep sentences direct, active, and under 25 words.
- Ban AI buzzwords (`delve`, `leverage`, `robust`, `comprehensive`, `streamline`, `pivotal`, `tapestry`, `landscape`, `underscore`).
- Keep existing `context/bkash-payment-gateway-guide.md` and `context/meta-pixel-and-capi-guide.md` intact; link to them from the new sub-documents.
- Standard 4-part anatomy in each sub-document:
  1. Plain English Concept & Overview
  2. Visual Flow Diagram
  3. Strict Technical Specifications & Rules
  4. Beginner Pitfalls & Common Mistakes to Avoid

## Review Focus
- Missing rule coverage: ensure Next.js `proxy.ts` vs Render cookie domain constraint is explicitly documented in both `auth-admin.md` and `deployment-security.md`.
- Ensure phone regex `/^(?:\+?88)?01[3-9]\d{8}$/` is preserved in `checkout-orders.md`.
- Ensure all 5 Mongoose schemas (`User`, `Product`, `Order`, `Counter`, `AuditLog`) are fully specified in `database.md`.
- Ensure API route tables and status codes match legacy `project.md` in `backend-api.md`.
- Ensure `AGENTS.md` correctly points to the new modular files.

---

### Task 1: Create `context/frontend.md`
**Files:**
- Create: `context/frontend.md`
- Source: `context/project.md` (§4 Frontend, §10 Pages/Routes, §11 Frontend Structure, §15 SEO/PWA, §16 Performance, §22 Cloudinary Client)

- [ ] **Step 1: Draft `context/frontend.md` following the 4-part anatomy with humanized prose and strict rules.**
- [ ] **Step 2: Verify file creation and rule coverage (GSAP motion, Tailwind v4, Zustand store, SWR, Next.js 16 App Router).**

---

### Task 2: Create `context/backend-api.md`
**Files:**
- Create: `context/backend-api.md`
- Source: `context/project.md` (§4 Backend, §5 Rewrites/Proxy, §9 API Routes, §21 Backend Rules, §22 Cloudinary Signatures)

- [ ] **Step 1: Draft `context/backend-api.md` following the 4-part anatomy.**
- [ ] **Step 2: Verify file creation and route table completeness (exact endpoints, methods, auth requirements, payloads).**

---

### Task 3: Create `context/database.md`
**Files:**
- Create: `context/database.md`
- Source: `context/project.md` (§8 Database & Mongoose)

- [ ] **Step 1: Draft `context/database.md` following the 4-part anatomy.**
- [ ] **Step 2: Verify Mongoose schemas (`User`, `Product`, `Order`, `Counter`, `AuditLog`), index definitions, and atomic counter rules.**

---

### Task 4: Create `context/checkout-orders.md`
**Files:**
- Create: `context/checkout-orders.md`
- Source: `context/project.md` (§12 Checkout / Order Form, §19 Order Status Lifecycle)

- [ ] **Step 1: Draft `context/checkout-orders.md` following the 4-part anatomy.**
- [ ] **Step 2: Verify BD phone regex, advance delivery fee rules, order state machine, and link to `bkash-payment-gateway-guide.md`.**

---

### Task 5: Create `context/auth-admin.md`
**Files:**
- Create: `context/auth-admin.md`
- Source: `context/project.md` (§6 Authentication, §7 Admin Access, §19 Admin Metrics)

- [ ] **Step 1: Draft `context/auth-admin.md` following the 4-part anatomy.**
- [ ] **Step 2: Verify dual JWT flow, cookie handling in `proxy.ts`, RBAC roles, password reset flow, and admin KPI calculations.**

---

### Task 6: Create `context/deployment-security.md`
**Files:**
- Create: `context/deployment-security.md`
- Source: `context/project.md` (§17 Security, §18 Deployment & Env Vars)

- [ ] **Step 1: Draft `context/deployment-security.md` following the 4-part anatomy.**
- [ ] **Step 2: Verify all environment variables for Vercel, Render, and MongoDB Atlas, plus Argon2, CORS, and rate limit rules.**

---

### Task 7: Rewrite `context/project.md` as the Master Hub
**Files:**
- Modify: `context/project.md`
- Target: ~150-200 lines

- [ ] **Step 1: Overwrite `context/project.md` with the new lean Master Hub and Navigation Matrix.**
- [ ] **Step 2: Verify links to all 6 sub-documents and 2 existing guides.**

---

### Task 8: Update Root `AGENTS.md`
**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Update `AGENTS.md` to instruct AI agents on the modular documentation layout.**
- [ ] **Step 2: Verify instructions and links.**

---

### Task 9: Final Quality Gate & Verification
- [ ] **Step 1: Verify all 7 files exist in `context/`.**
- [ ] **Step 2: Check for forbidden AI vocabulary (humanizer audit).**
- [ ] **Step 3: Confirm complete technical parity with the legacy 1,000-line content.**
