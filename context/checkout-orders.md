# Checkout, Orders & Payments Guide

## 1. Concept & Overview
This document covers the single-page checkout flow, delivery fee rules, and order fulfillment states. Customers in Bangladesh can pay the entire order total via bKash, or pay an advance non-refundable delivery fee via bKash while paying for the merchandise with Cash on Delivery (COD). Prepaying the delivery fee stops courier return losses on fake orders.

For detailed tokenized bKash integration rules, read [bKash Gateway Guide](./bkash-payment-gateway-guide.md).

## 2. Visual Checkout Flow & State Transitions

```
Customer at /checkout
         │
         ├── 1. Fills Name, Address, BD Phone Number, selects Shipping Zone & Payment Method
         │
         ├── 2. Submits Form -> POST /api/bkash/payments
         │      ├── Server creates Order with status: "new"
         │      ├── Captures Meta cookies (_fbp, _fbc), IP, User Agent
         │      └── If bKash: opens payment URL (full total or advance delivery fee)
         │
         ▼
[Payment Reconciled]
   delivery_fee_status = "paid"
         │
         ▼
[Admin Order State Machine]
   new ──(fee paid)──> confirmed ──────> processing ──(courier+tracking)──> shipped ──────> delivered
    │                      │                 │                                                  │
    ├──(reason)────────────┼─────────────────┼──────────────────────────────> cancelled         └── (locked: returns &
    │                      │                 │                                                        exchanges use
    └──(reason)────────────┴─────────────────┴──────────────────────────────> on_hold (can resume)   dedicated workflows)
```

## 3. Strict Technical Specifications

### Bangladesh Phone Number Validation
All phone numbers submitted at checkout or order lookup must match this regular expression:
```typescript
export const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;
```

### Checkout Input Zod Schema (`apps/web/src/features/checkout/schemas/lead.schema.ts`)
```typescript
import { z } from "zod";

export const leadInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone_number: z.string().trim().regex(BD_PHONE_REGEX, "Enter a valid Bangladesh phone number."),
  email: z.string().email("Enter a valid email address."),
  address: z.string().trim().min(8).max(400),
  shipping_zone: z.enum(["inside_sylhet", "outside_sylhet"], {
    error: "Select a shipping method.",
  }),
  payment_method: z.enum(["bkash_full", "cod"], {
    error: "Select a payment method.",
  }).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
```

### Delivery Fee Calculation & Environment Variables
Delivery fees are configured via backend environment variables and served to the client via `GET /api/checkout/config`:
- **Inside Sylhet:** `DELIVERY_FEE_INSIDE_SYLHET_BDT` (required positive integer, e.g. 60 BDT; no code fallback)
- **Outside Sylhet:** `DELIVERY_FEE_OUTSIDE_SYLHET_BDT` (required positive integer, e.g. 120 BDT; no code fallback)
- **Policy:** The delivery fee is non-refundable (`refundable: false`).

The browser client never calculates or submits fee amounts. Express calculates all fees and merchandise totals server-side:
- **`bkash_full`:** Customer pays total order amount (merchandise + delivery fee) via bKash. `amount_paid = total`, `merchandise_due = 0`.
- **`cod`:** Customer prepays the delivery fee via bKash. `delivery_fee_status = "paid"`, `amount_paid = delivery_fee`, `merchandise_due = merchandise_subtotal - merchandise_discount`.

### Order Creation Route
Order creation is handled exclusively at:
```http
POST /api/bkash/payments
```
Required headers: `X-Requested-With: XMLHttpRequest`.
The endpoint:
1. Validates input items, variants, stock, and contact info against `leadInputSchema`.
2. Captures `_fbp`, `_fbc`, client IP, and browser user agent for Meta CAPI attribution.
3. Allocates atomic daily order number `MN-YYYYMMDD-####`.
4. Saves the order document with `status: "new"`.
5. Initializes a bKash payment attempt and returns the payment gateway redirect URL.

---

### Order Status State Machine

The order lifecycle defines 9 statuses:
`new` | `confirmed` | `processing` | `shipped` | `delivered` | `on_hold` | `cancelled` | `returned` | `exchanged`

#### Complete Transition Rules Table
(Enforced in `apps/web/src/features/admin/lib/orderTransitions.ts` and `apps/api/src/services/adminOrders.service.ts`)

| Current Status | Permitted Target Status | Conditions / Requirements |
| :--- | :--- | :--- |
| `new` | `confirmed` | Requires delivery fee to be paid (`delivery_fee_status` is `paid` or `not_required`). |
| `new` | `processing` | Non-adjacent skip: requires pre-shipment `override_reason`. |
| `new` | `on_hold` | Requires hold `reason`. Saves `held_from_status = "new"`. |
| `new` | `cancelled` | Requires cancellation `reason`. |
| `confirmed` | `processing` | Normal linear transition. |
| `confirmed` | `new` | Non-adjacent revert: requires `override_reason`. |
| `confirmed` | `on_hold` | Requires hold `reason`. Saves `held_from_status = "confirmed"`. |
| `confirmed` | `cancelled` | Requires cancellation `reason`. |
| `processing` | `shipped` | Requires `courier_name` and `tracking_number`. |
| `processing` | `confirmed` | Non-adjacent revert: requires `override_reason` and fee paid. |
| `processing` | `on_hold` | Requires hold `reason`. Saves `held_from_status = "processing"`. |
| `processing` | `cancelled` | Requires cancellation `reason`. |
| `shipped` | `delivered` | Courier reports cash collection and successful handover. |
| `delivered` | **Locked** | Cannot transition directly. Returns and exchanges use dedicated admin refund/exchange workflows. |
| `on_hold` | Resume | Can only resume back to the exact `held_from_status` where it was held. |
| `on_hold` | `cancelled` | Allowed with a cancellation `reason`. |
| `cancelled` | **Terminal** | Cannot transition. |
| `returned` | **Terminal** | Cannot transition. |
| `exchanged` | **Terminal** | Cannot transition. |

---

## 4. Common Beginner Pitfalls & Mistakes to Avoid

- **Mistake:** Submitting orders to `POST /api/orders` or `POST /api/checkout`.
  **Fix:** Order creation lives at `POST /api/bkash/payments`.
- **Mistake:** Assuming order status can be freely set to any string in the admin dashboard.
  **Fix:** The state machine enforces strict prerequisites. You cannot move to `confirmed` without paid delivery fees, and cannot move to `shipped` without courier name and tracking number.
- **Mistake:** Using `status: "pending"` or `"refunded"`.
  **Fix:** Neither exists in MINAN. Initial orders are `new`. Refunds are tracked via the `refunds` array and `financials.merchandise_refunded`.
- **Mistake:** Allowing client-side price overrides.
  **Fix:** The browser sends product IDs, sizes, colors, and quantities. Express re-fetches prices from MongoDB and computes the total.
