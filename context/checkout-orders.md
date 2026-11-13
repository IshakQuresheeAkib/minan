# Checkout, Orders & Payments Guide

## 1. Plain Concept & Overview
This document explains how a customer buys merchandise on MINAN and how orders move through fulfillment. Our checkout is a single-page form optimized for mobile shoppers in Bangladesh. Customers can pay the full amount via bKash, or pay an advance non-refundable delivery fee via bKash while paying for the clothes with Cash on Delivery (COD). This reduces fake orders and prevents delivery losses.

For the full bKash API token negotiation and callback setup, read [bkash-payment-gateway-guide.md](file:///c:/new%20projects/minan/context/bkash-payment-gateway-guide.md).

## 2. Visual Checkout & Order Lifecycle

```
Customer at /checkout
         │
         ├── 1. Fills Name, Address, BD Phone Number
         │
         ├── 2. Selects Payment Method:
         │      ├── A. Full bKash Payment (Merchandise + Delivery)
         │      └── B. Advance Delivery Fee (bKash) + Merchandise COD
         │
         ├── 3. Submits Order -> POST /api/orders (Status: "pending")
         │
         ├── 4. bKash Gateway opens in iframe/redirect
         │      └── On success -> paymentStatus = "paid" / "partial_advance_paid"
         │      └── Order status moves to "confirmed"
         │
         ▼
[Admin Fulfillment Flow]
  "confirmed" ──> "processing" ──> "shipped" ──> "delivered"
       │                              │
       └── "cancelled"                └── "returned" (if delivery fails)
```

## 3. Strict Technical Specifications

### Bangladesh Phone Number Validation
All phone numbers submitted at checkout or order tracking must match this regular expression:
```typescript
export const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

// Normalization function (strips spaces, dashes, +88 prefix):
export function normalizeBdPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-]/g, "");
  if (cleaned.startsWith("+8801")) return cleaned.slice(3);
  if (cleaned.startsWith("8801")) return cleaned.slice(2);
  return cleaned;
}
```

### Checkout Form Zod Schema (`apps/web/src/features/checkout/schemas/checkout.schema.ts`)
```typescript
import { z } from "zod";

export const checkoutFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(60),
  phone: z.string().regex(BD_PHONE_REGEX, "Enter a valid 11-digit Bangladeshi mobile number"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  district: z.string().min(1, "Select your district"),
  city: z.string().min(1, "Enter your city or thana"),
  streetAddress: z.string().min(5, "Enter your road, house, and area details"),
  paymentMethod: z.enum(["cod", "bkash_full", "bkash_advance"]),
  orderNotes: z.string().max(200).optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
```

### Delivery Fee Calculation Rules
Delivery fees are calculated based on the delivery location:
- **Inside Sylhet City:** 80 BDT
- **Outside Sylhet (All other districts in Bangladesh):** 130 BDT

```typescript
export function calculateOrderPricing(params: {
  subtotal: number;
  district: string;
  paymentMethod: "cod" | "bkash_full" | "bkash_advance";
  discount?: number;
}) {
  const isSylhet = params.district.trim().toLowerCase() === "sylhet";
  const deliveryFee = isSylhet ? 80 : 130;
  const discount = params.discount || 0;
  const total = params.subtotal + deliveryFee - discount;

  let advancePaid = 0;
  let dueAmount = total;

  if (params.paymentMethod === "bkash_full") {
    advancePaid = total;
    dueAmount = 0;
  } else if (params.paymentMethod === "bkash_advance") {
    advancePaid = deliveryFee;
    dueAmount = params.subtotal - discount;
  }

  return { subtotal: params.subtotal, deliveryFee, discount, total, advancePaid, dueAmount };
}
```

---

### Order Status State Machine
Orders follow a strict state transition path. Transitions outside this map are rejected by the API:

```
[pending] ──────> [confirmed] ──────> [processing] ──────> [shipped] ──────> [delivered]
    │                 │                   │                  │
    ▼                 ▼                   ▼                  ▼
[cancelled]       [cancelled]         [cancelled]        [returned]
                                                             │
                                                             ▼
                                                         [refunded]
```

| Current Status | Allowed Next Statuses | Trigger Event |
| :--- | :--- | :--- |
| `pending` | `confirmed`, `cancelled` | Customer completes bKash payment or staff verifies phone. |
| `confirmed` | `processing`, `cancelled` | Warehouse starts picking and packaging items. |
| `processing`| `shipped`, `cancelled` | Package handed to courier (Steadfast / Pathao). |
| `shipped` | `delivered`, `returned` | Courier reports successful dropoff or customer refusal. |
| `delivered` | None (Final state) | Cash collected; sale complete. |
| `returned` | `refunded` | Parcel returns to inventory; any advance fee audited. |
| `cancelled` | `refunded` | Order aborted before courier handover. |
| `refunded` | None (Final state) | Refund sent back through bKash disbursement. |

---

### Fraud Prevention & Attribution Capture
When an order is submitted to `POST /api/orders`, the server automatically extracts and persists:
- `attribution.fbp`: Meta browser cookie ID (`_fbp`).
- `attribution.fbc`: Meta click ID (`_fbc` from Facebook ad clicks).
- `attribution.ipAddress`: Client IP address from request headers (`x-forwarded-for`).
- `attribution.userAgent`: Full browser user agent string.

These values are required to send the automated server-side Meta Conversions API (CAPI) `Purchase` event without losing attribution.

## 4. Beginner Pitfalls & Common Mistakes to Avoid

- **Mistake:** Trusting delivery fees or product prices sent from the client.
  **Fix:** The client sends the district and selected items. Express recalculates the delivery fee and product prices on the server.
- **Mistake:** Marking an order `delivered` immediately upon creating a courier parcel.
  **Fix:** Mark the order `shipped` when the courier takes the box. Only mark `delivered` after the courier confirms cash delivery.
- **Mistake:** Accepting phone numbers without validation.
  **Fix:** Bangladeshi couriers cannot deliver without an 11-digit mobile number starting with `01`. Always validate against `BD_PHONE_REGEX`.
- **Mistake:** Allowing customers to submit orders twice by clicking the button repeatedly.
  **Fix:** Disable the submit button and show a loading spinner as soon as the form submits.
