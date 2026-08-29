# Customer Order Tracking Implementation Brief

**Status:** Approved product and architecture contract. Implement this feature in the numbered sequence below; each task must preserve the decisions and scope boundaries in this document.

## Product decisions

- Audience: both guests and account customers.
- Fulfillment stages remain `new -> confirmed -> processing -> shipped -> delivered`.
- Exceptional stages remain `on_hold`, `cancelled`, `returned`, and `exchanged`.
- Never reintroduce `packing` as an Order status.
- Guest access uses Order ID plus email OTP.
- Account access uses email and password.
- A guest Order is claimed only after OTP verification and only one Order at a time. Never bulk-claim Orders by matching email alone.
- Tracking is view-only in v1.
- The customer timeline uses fixed customer-safe status copy plus an optional admin-authored public note. Existing internal activity reasons and notes remain private.
- The delivery estimate is an admin-entered calendar date.
- Notifications use Resend email for major events only. A later task must use an outbox and retry design rather than sending inline with Order mutations.

## Architecture and security contract

- Extend the existing Order access layer. Do not create a parallel tracking aggregate.
- Customer ownership is the authenticated `customer_id`. Never authorize ownership from browser-supplied email, phone number, or customer ID.
- Guest OTP verification may atomically claim only the single verified Order when its `customer_id` is still null.
- Customer responses use a dedicated allowlisted serializer/DTO. Never expose the admin `serializeOrder` payload to a customer.
- Customer and admin authentication remain separate security boundaries.
- All persistence stays behind the Express API.
- Preserve frozen Order values and every payment, COD, bKash, fee, idempotency, reconciliation, and settlement invariant.

## UX contract

- Use a mobile-first stitched journey from checkout confirmation to tracking, account Orders, and Order details.
- Use English status labels with Bangla helper text.
- Show full progress in Order details.
- Add only a navbar account/Orders entry; do not change the bottom navigation.
- Offer a post-checkout signup prompt.
- Account v1 contains authentication and Orders only.

## Implementation sequence

1. Order tracking domain contract and migration.
2. Customer auth and email foundation.
3. Guest OTP access and one-Order claiming.
4. Checkout/admin public-note, delivery-estimate, and notification integration.
5. Customer web UI.
6. Security, accessibility, browser verification, and release hardening.

Each task must start from the completed previous task, read this brief, remain inside its numbered scope, add focused regression coverage, and leave the repository ready for the next task. Migrations are dry-run by default and are never applied to a real database without an explicit deployment step.

## Step 1 cutline

Step 1 adds only the Order tracking domain fields, shared email normalization, a customer-safe Order DTO, exchange ownership/email inheritance, and a dry-run historical backfill. It does not add customer/auth/session/verification/outbox models, customer or guest routes, OTP or Resend behavior, UI, notifications, or any payment behavior change.
