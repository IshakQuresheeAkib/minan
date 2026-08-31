# PR 31 Retrospective Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify the retrospective PR #31 findings against merged `develop` and close every confirmed customer-tracking contract or migration-safety gap without expanding beyond the Step 1 domain boundary.

**Architecture:** Keep customer tracking as an allowlisted projection of the existing `Order`. Make the DTO and finite-domain mappings exhaustive at compile time, keep unknown activity events private by default, and make the dry-run migration use compare-and-set filters so concurrent Order edits cannot be overwritten.

**Tech Stack:** TypeScript strict mode, Mongoose 9, MongoDB bulk writes, Vitest 4, npm workspaces, Node 24.16.0.

**Spec:** `context/order-tracking-implementation.md`

## Global Constraints

- Preserve the Step 1 cutline: no customer routes, OTP, claiming, UI, notifications, or payment behavior changes.
- Preserve the existing uncommitted bKash-label and partial-return fixes in the working tree.
- Customer responses remain explicit allowlists; unknown activity events remain hidden.
- Migrations remain dry-run by default and are never applied to a real database in this task.
- Do not remove the checkout normalized-email compatibility fallback until a successful production backfill is confirmed.
- Do not commit, push, deploy, or run a live migration as part of this task.

---

### Task 1: Customer tracking contract exhaustiveness

**Files:**
- Modify: `apps/api/src/utils/serializeCustomerOrder.ts`
- Modify: `apps/api/src/utils/serializeCustomerOrder.test.ts`

**Interfaces:**
- Consumes: `OrderDocument`, `OrderStatus`, `PaymentMethod`, and `ShippingZone`.
- Produces: exported `CustomerOrderTrackingDTO` and `serializeCustomerOrder(order): CustomerOrderTrackingDTO`.

- [ ] **Step 1: Add a status-event coverage characterization test**

Add a table-driven serializer test that creates `status_${status}` activity for every current `OrderStatus` and expects the same stage in the customer timeline. This confirms the reported runtime gap does not currently exist and catches future removal of a mapping.

- [ ] **Step 2: Run the focused test and confirm current behavior**

Run: `npm --workspace @minan/api run test -- src/utils/serializeCustomerOrder.test.ts`

Expected: the new contract assertion passes because every current status event is already mapped; unknown non-status events remain intentionally omitted.

- [ ] **Step 3: Add explicit DTO and exhaustive finite-domain maps**

Define the complete DTO type, annotate the serializer return, replace the open-ended status map with a `Record<\`status_${OrderStatus}\`, OrderStatus>`, and use exhaustive `Record<PaymentMethod, string>` and `Record<ShippingZone, string | null>` mappings. These are compile-time hardening changes with no intended runtime behavior change. Preserve the secure behavior that unrelated activity events are omitted.

- [ ] **Step 4: Verify the focused serializer suite and TypeScript build**

Run the focused Vitest file and `npm --workspace @minan/api run build`. Both must exit 0.

### Task 2: Migration runner safety and operability

**Files:**
- Modify: `apps/api/src/scripts/orderTrackingMigration.ts`
- Modify: `apps/api/src/scripts/orderTrackingMigration.test.ts`
- Modify: `apps/api/src/scripts/migrate-order-tracking.ts`
- Modify: `apps/api/src/scripts/migrate-order-tracking.test.ts`
- Modify: `apps/api/package.json`
- Modify: `apps/api/README.md`

**Interfaces:**
- Consumes: raw Order snapshots containing email, normalized email, and guest access version.
- Produces: migration changes that retain expected source values, compare-and-set MongoDB filters, injectable logging, a dry-run npm command, and an explicit deployment sequence.

- [ ] **Step 1: Add failing compare-and-set runner tests**

Add runner tests proving apply mode filters on the original email and original values of every field being changed, represents missing fields with `$exists: false`, and rejects a bulk result whose `matchedCount` is lower than the planned write count.

- [ ] **Step 2: Run the migration tests and confirm the intended failures**

Run: `npm --workspace @minan/api run test -- src/scripts/orderTrackingMigration.test.ts src/scripts/migrate-order-tracking.test.ts`

Expected: filters are currently `_id`-only and conflict detection is absent.

- [ ] **Step 3: Implement compare-and-set snapshots and conflict detection**

Retain source-field presence/value snapshots in each planned change, build filters from those snapshots only for changed fields, and fail apply mode when concurrent changes prevent all planned writes from matching. Keep writes idempotent and unordered.

- [ ] **Step 4: Make the runner cwd-independent and logger-injectable**

Replace `dotenv/config` with `../config/env.js`, accept a minimal logger dependency defaulting to `console`, and retain the returned summary for tests and callers.

- [ ] **Step 5: Add the command and deployment documentation**

Add `migrate:order-tracking` to the API workspace. Document dry-run, unresolved-record handling, `-- --apply`, conflict reruns, the final zero-change dry run, and the cutline before code may assume every historical Order has `normalized_email` and `guest_access_version`.

- [ ] **Step 6: Verify focused migration tests**

Run both migration test files and inspect output for zero failures.

### Task 3: Integrated verification and finding disposition

**Files:**
- Review all modified files; no new behavior is added in this task.

**Interfaces:**
- Consumes: the two completed implementation slices.
- Produces: evidence-backed classification for all six Kilo findings plus the four earlier PR #31 blockers.

- [ ] **Step 1: Run affected suites**

Run serializer, migration, admin Order return, Order model, and checkout matching tests using Node 24.16.0.

- [ ] **Step 2: Run broad API verification**

Run the full API test suite, API lint, API build, and `git diff --check`.

- [ ] **Step 3: Inspect the final diff and status**

Confirm unrelated customer-auth changes are untouched, no secret or generated output was added, no live database action occurred, and every changed line maps to a confirmed finding.

- [ ] **Step 4: Report exact dispositions**

For each report item, label it confirmed-and-fixed, already-fixed-in-working-tree, intentional compatibility behavior, or not a current defect, with the corresponding verification evidence.
