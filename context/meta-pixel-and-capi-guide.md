# Meta Pixel and Conversions API (CAPI) Integration Guide

A complete, beginner-friendly manual and developer blueprint for custom Next.js and Express.js websites.

---

## 1. Executive Summary & Mental Model

### What is Meta Pixel?
Meta Pixel is a client-side JavaScript snippet that runs in the visitor's web browser. It tracks browser actions like page visits, button clicks, and product views. It relies on browser cookies (`_fbp` and `_fbc`).

**The Limitation:** Ad blockers, Safari ITP (Intelligent Tracking Prevention), iOS privacy settings, and network drops block or strip 20% to 40% of browser pixel events.

### What is Meta Conversions API (CAPI)?
Conversions API (CAPI) is a server-to-server HTTP connection between your website backend (Express.js) and Meta's Graph API. When a user buys a product or completes an order, your server sends an HTTP POST request directly to Meta.

**The Advantage:** Ad blockers cannot see or block server-to-server traffic. It guarantees critical conversion delivery.

### Why You Must Run Both (Hybrid Setup)
Running only Pixel loses data. Running only CAPI misses top-of-funnel browsing interactions and fast browser attribution.

When you run both:
1. Browser Pixel sends the event from the client.
2. Server CAPI sends the same event from the backend.
3. Both events carry the identical `event_id` and `event_name`.
4. Meta's servers receive both, match them via `event_id`, discard the duplicate, and keep the richest data. This process is called **Event Deduplication**.

---

## 2. Meta Events Manager & Business Portfolio Walkthrough

For developers opening Meta Business Suite for the first time, here is what each term and screen means.

### Key Terminology
* **Business Portfolio (formerly Business Manager):** The top-level account that owns your Facebook pages, ad accounts, payment methods, and datasets.
* **Events Manager:** The control center inside your Business Portfolio where you inspect, configure, and monitor web tracking data.
* **Dataset (formerly Pixel):** In 2024–2026, Meta replaced the term "Pixel" with "Dataset". A Dataset is an identifier (Dataset ID) that unifies both client-side Pixel events and server-side Conversions API events into one stream. Your Dataset ID is your Pixel ID.
* **Access Token:** A secret string created in Events Manager that allows your Express backend to post server events to your Dataset. Treat it like a database password.
* **Event Match Quality (EMQ):** A score from 1 to 10 in Events Manager. It measures how effectively your customer data (hashed email, phone, IP, user agent, cookies) links to real Meta accounts. A score of 8.0+ is considered high quality.

---

### Step-by-Step Setup in Meta Events Manager

#### Screen 1: Connecting Your Data Source
1. Navigate to **business.facebook.com** and open **Events Manager**.
2. In the left navigation, click **Connect data** (the green plus icon).
3. Select **Web** and click **Connect**.
4. Enter a name for your dataset (e.g., `MINAN Web Dataset`) and click **Create**.

#### Screen 2: Choosing Your Conversions API Setup Method
Meta presents three options:
1. **Set up Conversions API Gateway with Birch (or AWS):**
   * *What it is:* A paid, third-party hosted cloud container that duplicates browser events into server events.
   * *Should you choose it?* **No.** You have a custom Next.js and Express codebase. Birch adds recurring monthly fees, third-party vendor lock-in, and complicates debugging.
2. **Set up with partner integration:**
   * *What it is:* Pre-built plugins for Shopify, WooCommerce, or WordPress.
   * *Should you choose it?* **No.** This is only for turnkey CMS platforms.
3. **Set up manually:**
   * *What it is:* Direct implementation via the official Meta Graph API from your code.
   * *Should you choose it?* **YES.** Select **Set up manually**. This gives you full control, zero extra monthly fees, and deterministic deduplication.

#### Screen 3: Selecting Standard Events
When prompted to select events for your industry (e-commerce):
* Select only the events that correspond to actual interactions in your application:
  * `ViewContent`: Triggered on product detail pages.
  * `AddToCart`: Triggered when an item is added to cart.
  * `InitiateCheckout`: Triggered when starting the checkout step.
  * `Purchase`: Triggered when payment or order confirmation succeeds.
  * `Contact` or `Lead`: Triggered on contact forms or WhatsApp order links.
* Do not select events you do not support (e.g., `Subscribe`, `StartTrial`, `Schedule`, `FindLocation`). Selecting an event in the wizard does not send it; your code must send it.

#### Screen 4: Automatic Advanced Matching
* Turn on **Automatic Advanced Matching**.
* What it does: The browser Pixel automatically inspects form fields (such as checkout inputs) for email, phone, and name data, hashes them with SHA-256 in the browser, and attaches them to browser events.
* Recommended configuration toggles:
  * **Email:** Turn ON.
  * **Phone number:** Turn ON.
  * **First and last name:** Turn ON.
  * **Country:** Turn ON.
  * **External ID:** Turn ON (if you have internal user IDs).
  * **City, State, Zip:** Turn OFF unless you collect discrete city/state fields in checkout.
  * **Date of birth, Gender:** Turn OFF. Never collect or share sensitive personal data you do not need.
* Form Field Best Practice: Give your checkout input elements standard `type` and `name` attributes (e.g., `type="email" name="email" autocomplete="email"`, `type="tel" name="phone" autocomplete="tel"`). This enables the Pixel script to locate them reliably.

#### Screen 5: The "Set Up Events" Greyed-Out Checklist
* After finishing the wizard, the setup checklist often displays "Set up events" as greyed out.
* **Do not worry:** Meta keeps this step disabled until it receives its very first live `PageView` event from your site. Once your Next.js frontend sends its first PageView, the status updates automatically.

#### Screen 6: Generating the Conversions API Access Token
1. In Events Manager, click your **Dataset**.
2. Open the **Settings** tab.
3. Scroll down to the **Conversions API** section.
4. Under "Set up manually", click **Generate access token**.
5. Copy the generated token immediately and store it in your backend environment variables:
   ```env
   META_CAPI_TOKEN=EAA...
   META_PIXEL_ID=123456789012345
   ```
6. **Security Rule:** Never place `META_CAPI_TOKEN` in frontend code, git commits, or `NEXT_PUBLIC_` variables.

#### Screen 7: Domain Verification
1. In Business Settings, go to **Brand safety and suitability** > **Domains**.
2. Click **Add** > **Create a new domain**.
3. Enter your bare domain (e.g., `minanclothing.com` without `https://` or `www`).
4. Select **Add a DNS TXT record to your domain host**.
5. Copy the TXT value (`facebook-domain-verification=...`).
6. In your DNS provider (Cloudflare, Namecheap, cPanel), create a TXT record with host `@` and paste the verification string.
7. Click **Verify domain** in Meta Business Manager.

---

## 3. Core Technical Architecture & Data Rules

```
+-------------------------------------------------------------------------+
|                              CLIENT BROWSER                              |
|                                                                         |
|  1. User adds item to cart                                              |
|  2. Generate event_id = crypto.randomUUID()                             |
|  3. Read _fbp and _fbc cookies                                          |
|                                                                         |
|         |                                              |                |
|  [Pixel fbq("track")]                           [fetch POST]            |
|         |                                              |                |
+---------|----------------------------------------------|----------------+
          | Browser Event                                | JSON Payload
          | (event_name, event_id, _fbp, _fbc)           | (event_id, fbp, fbc, data)
          v                                              v
+-----------------------+                    +----------------------------+
|                       |                    |     EXPRESS.JS BACKEND     |
|                       |                    |                            |
|                       |                    | 1. Capture req.ip & UA     |
|                       |                    | 2. Normalize & SHA-256 PII |
|                       |                    | 3. Save to MongoDB log     |
|                       |                    | 4. Dispatch CAPI request   |
|                       |                    +----------------------------+
|   META EVENT SERVER   |                                  |
|   (Events Manager)    |                                  | Server Event
|                       | <--------------------------------+ (Graph API v21.0/v22.0)
|                       |
| 1. Matches event_id   |
| 2. Deduplicates event |
| 3. Scores EMQ (8.0+)  |
+-----------------------+
```

### Event Deduplication Rules
1. Every event sent through both Pixel and CAPI must have:
   * The identical `event_name` (e.g., both use `Purchase`).
   * The identical `event_id` (a unique string generated at the time of the action).
2. For browsing actions (like `AddToCart` or `Lead`), generate a UUID v4 on the client: `crypto.randomUUID()`.
3. For orders, use the unique Order Number (e.g., `MN-20261112-0001`) as the `event_id`.
4. Never bake static event IDs into server-rendered HTML or static caches. Every action must produce a new unique ID.

### Meta Data Hashing Rules (SHA-256)
Meta requires all PII (Personally Identifiable Information) strings to be normalized and hashed using **SHA-256** before being sent to CAPI.

| Field | JSON Key | Normalization Format Before SHA-256 | Hashing Required? | Example Input | Normalized Before Hash |
|---|---|---|---|---|---|
| Email | `em` | Trim whitespace, convert to lowercase | **YES** | `" User@Example.COM "` | `"user@example.com"` |
| Phone | `ph` | Remove all non-digit characters (`+`, `-`, spaces, `()`). Must include country code without `+` or leading zeros | **YES** | `"+880 1712-345678"` | `"8801712345678"` |
| First Name | `fn` | Trim whitespace, convert to lowercase, remove punctuation | **YES** | `" John "` | `"john"` |
| Last Name | `ln` | Trim whitespace, convert to lowercase, remove punctuation | **YES** | `" Doe "` | `"doe"` |
| Country | `country` | Two-letter ISO 3166-1 alpha-2 code, lowercase | **YES** | `"BD"` or `"Bangladesh"` | `"bd"` |
| City | `ct` | Lowercase, trim, remove all spaces and special characters | **YES** | `" Sylhet "` | `"sylhet"` |
| External ID | `external_id` | Trim, string format of internal customer database ID | **YES** | `"654321"` | `"654321"` |
| Browser ID | `fbp` | Raw `_fbp` cookie string (`fb.1.<time>.<rand>`) | **NO** | Raw cookie value | Do not hash |
| Click ID | `fbc` | Raw `_fbc` cookie string (`fb.1.<time>.<fbclid>`) | **NO** | Raw cookie value | Do not hash |
| Client IP | `client_ip_address` | Raw IPv4 or IPv6 address | **NO** | `"103.205.71.4"` | Do not hash |
| User Agent | `client_user_agent` | Raw browser User-Agent string | **NO** | `"Mozilla/5.0..."` | Do not hash |

> **Crucial Warning:** Never hash `client_ip_address`, `client_user_agent`, `fbp`, or `fbc`. Hashing them causes Meta to reject the match keys and drops your EMQ score.

### Understanding `_fbp` and `_fbc` Cookies
* **`_fbp` (Browser ID):** Meta Pixel automatically creates this first-party cookie on the visitor's browser. Format: `fb.1.[timestamp].[random_number]`.
* **`_fbc` (Click ID):** Created when a user clicks a Facebook/Instagram ad containing a `fbclid` query parameter in the URL. Format: `fb.1.[timestamp].[fbclid]`.
* If a visitor arrives from a Facebook ad, the URL contains `?fbclid=XYZ`. If the Pixel has not yet set `_fbc` in `document.cookie`, your code can assemble it manually:
  ```ts
  const fbc = `fb.1.${Date.now()}.${fbclid}`;
  ```

---

## 4. Next.js Frontend Implementation (`apps/web`)

### Step 1: Base Pixel Component
Mount this component in your root layout (`apps/web/src/app/layout.tsx`).

```tsx
// apps/web/src/components/analytics/MetaPixel.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function MetaPixel() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // Track page views on client-side route navigation in App Router
  useEffect(() => {
    if (!PIXEL_ID) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  if (!PIXEL_ID) return null;

  return (
    <Script
      id="meta-pixel-init"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}
```

### Step 2: Client Tracking Helper & Cookie Reader
Create reusable utilities to read Meta cookies and dispatch events with deduplication IDs.

```ts
// apps/web/src/lib/analytics/pixel.ts

export function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

export function getMetaCookies(): { fbp?: string; fbc?: string } {
  if (typeof window === "undefined") return {};

  const fbp = getCookie("_fbp");
  let fbc = getCookie("_fbc");

  // Fallback: build fbc if fbclid is in the current URL query params
  if (!fbc) {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get("fbclid");
    if (fbclid) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
    }
  }

  return { fbp, fbc };
}

export function trackClientPixelEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  eventId?: string
): void {
  if (typeof window === "undefined" || !window.fbq) return;

  if (eventId) {
    window.fbq("track", eventName, params, { eventID: eventId });
  } else {
    window.fbq("track", eventName, params);
  }
}
```

### Step 3: Triggering an Action (Example: Add to Cart)

```ts
// Example: Called inside product detail or cart line item
import { trackClientPixelEvent, getMetaCookies } from "@/lib/analytics/pixel";

export async function handleAddToCart(product: { id: string; name: string; price: number }) {
  const eventId = crypto.randomUUID();
  const { fbp, fbc } = getMetaCookies();

  // 1. Fire browser Pixel
  trackClientPixelEvent(
    "AddToCart",
    {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      value: product.price,
      currency: "BDT",
    },
    eventId
  );

  // 2. Post to Express backend for CAPI forwarding
  await fetch("/api/v1/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "add_to_cart",
      event_id: eventId,
      session_id: "user-session-id",
      product_id: product.id,
      fbp,
      fbc,
      custom_data: {
        value: product.price,
        currency: "BDT",
      },
    }),
  });
}
```

---

## 5. Express.js Backend Implementation (`apps/api`)

### Step 1: Normalization & SHA-256 Hashing Utilities
Create a dedicated utility module for preparing user data according to Meta's strict specifications.

```ts
// apps/api/src/lib/metaHash.ts
import { createHash } from "node:crypto";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const cleaned = email.trim().toLowerCase();
  return cleaned ? sha256(cleaned) : undefined;
}

export function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, "");

  // Bangladesh local normalization: convert 017... to 88017...
  if (digits.startsWith("01") && digits.length === 11) {
    digits = "88" + digits;
  }

  return digits ? sha256(digits) : undefined;
}

export function normalizeName(name?: string): string | undefined {
  if (!name) return undefined;
  const cleaned = name.trim().toLowerCase().replace(/[^\p{L}\s]/gu, "");
  return cleaned ? sha256(cleaned) : undefined;
}

export function normalizeCountry(countryCode?: string): string | undefined {
  if (!countryCode) return undefined;
  const cleaned = countryCode.trim().toLowerCase();
  return cleaned ? sha256(cleaned) : undefined;
}
```

### Step 2: Meta Conversions API Client
Build the direct HTTP client communicating with Meta Graph API.

```ts
// apps/api/src/lib/metaCapi.ts
import {
  normalizeCountry,
  normalizeEmail,
  normalizeName,
  normalizePhone,
  sha256,
} from "./metaHash.js";

export type MetaCapiEventData = {
  eventName: string;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    city?: string;
    externalId?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
  };
  customData?: {
    currency?: string;
    value?: number;
    orderId?: string;
    contentIds?: string[];
    contentName?: string;
    contentType?: string;
  };
};

export async function sendMetaCapiEvent(event: MetaCapiEventData): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  const pixelId = process.env.META_PIXEL_ID;
  const testCode = process.env.META_TEST_EVENT_CODE; // Set during testing only

  if (!token || !pixelId) {
    return;
  }

  const u = event.userData ?? {};
  const c = event.customData ?? {};

  // Construct hashed user data
  const userDataPayload: Record<string, unknown> = {};

  const em = normalizeEmail(u.email);
  if (em) userDataPayload.em = [em];

  const ph = normalizePhone(u.phone);
  if (ph) userDataPayload.ph = [ph];

  const fn = normalizeName(u.firstName);
  if (fn) userDataPayload.fn = fn;

  const ln = normalizeName(u.lastName);
  if (ln) userDataPayload.ln = ln;

  const country = normalizeCountry(u.country ?? "bd");
  if (country) userDataPayload.country = [country];

  if (u.city) userDataPayload.ct = sha256(u.city.trim().toLowerCase());
  if (u.externalId) userDataPayload.external_id = sha256(u.externalId.trim());

  // Non-hashed parameters
  if (u.clientIpAddress) userDataPayload.client_ip_address = u.clientIpAddress;
  if (u.clientUserAgent) userDataPayload.client_user_agent = u.clientUserAgent;
  if (u.fbp) userDataPayload.fbp = u.fbp;
  if (u.fbc) userDataPayload.fbc = u.fbc;

  const body = {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: "website",
        event_source_url: event.eventSourceUrl,
        user_data: userDataPayload,
        custom_data: {
          currency: c.currency,
          value: c.value,
          order_id: c.orderId,
          content_ids: c.contentIds,
          content_name: c.contentName,
          content_type: c.contentType,
        },
      },
    ],
    ...(testCode ? { test_event_code: testCode } : {}),
  };

  try {
    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Meta CAPI Error]", response.status, errorText);
    }
  } catch (err) {
    console.error("[Meta CAPI Network Error]", err);
  }
}
```

### Step 3: Analytics Route & Schema Validation

```ts
// apps/api/src/schemas/analytics.schemas.ts
import { z } from "zod";

export const postAnalyticsEventSchema = z.object({
  event_type: z.enum([
    "page_view",
    "product_view",
    "add_to_cart",
    "checkout_start",
    "lead_submit",
    "whatsapp_click",
    "purchase",
  ]),
  event_id: z.string().min(1),
  session_id: z.string().min(1),
  product_id: z.string().optional(),
  fbp: z.string().optional(),
  fbc: z.string().optional(),
  custom_data: z
    .object({
      value: z.number().optional(),
      currency: z.string().optional(),
      content_name: z.string().optional(),
    })
    .optional(),
});
```

---

## 6. E-Commerce Order & Purchase Flow (MINAN Project Specification)

The `Purchase` event is the single most valuable event for Facebook Ads optimization. In MINAN, payment involves bKash (full online payment or advance delivery fee for Cash on Delivery).

### Architectural Decisions Approved for MINAN
1. **Purchase Event Trigger & Value:**
   * Both `bkash_full` and `cod` orders track a Meta `Purchase` event upon successful order placement and fee settlement.
   * Both use the **full order total** as the `value` parameter (with currency `"BDT"`). This instructs Meta ad algorithms to optimize for actual gross merchandise value (GMV).
2. **City Matching Rule:**
   * When `shipping_zone === "inside_sylhet"`, the backend sends `ct: sha256("sylhet")`.
   * When `shipping_zone === "outside_sylhet"`, the `ct` parameter is omitted entirely. Free-text address parsing is prohibited to avoid sending inaccurate city data.
3. **Attribution Persistence Across Payment Gateways:**
   * When the customer places an order, the frontend extracts `_fbp` and `_fbc` from browser cookies and sends them in the checkout payload.
   * The Express API stores `meta_fbp`, `meta_fbc`, `client_ip`, and `client_user_agent` as optional fields on the MongoDB `Order` document.
   * When the bKash callback or redirect executes on server-to-server endpoints, the server retrieves these saved attribution keys from the `Order` record and dispatches CAPI `Purchase` using the original customer identity.

### Deduplication on Order Completion
* **Backend:** Dispatches CAPI `Purchase` with `event_id: order.order_number`.
* **Frontend:** If the user lands on the order confirmation screen, the browser Pixel fires `fbq('track', 'Purchase', ..., { eventID: order_number })`.
* Meta matches `order_number` across both channels and records a single deduplicated purchase. Refreshing the confirmation page does not result in a second purchase count because the `order_number` remains identical.

---

## 7. Testing, Verification, & Troubleshooting

### How to Test Using Events Manager "Test Events"
1. In Meta Events Manager, open your dataset and click the **Test events** tab.
2. In the "Confirm your server events are set up correctly" card, copy the **Test Event Code** (e.g., `TEST12345`).
3. Set `META_TEST_EVENT_CODE=TEST12345` in your Express `.env` file and restart the API.
4. In the "Confirm your website events are set up correctly" card, enter your website URL and click **Open Website**.
5. Perform actions: view a product, add to cart, and place a test order.
6. Check the Test Events stream in your browser window:
   * You should see two entries for each action: one labeled **Browser**, one labeled **Server**.
   * Under the Event column, a green badge should display **Deduplicated**.
7. If only "Browser" appears: Check Express logs to verify CAPI requests are firing.
8. If only "Server" appears: Verify the base Pixel script is loaded in Next.js without errors.
9. If both appear but **not** deduplicated: The `event_id` or `event_name` values do not match exactly.

### Verification Checklist Before Production
- [ ] Base Pixel script present in root layout (`apps/web/src/app/layout.tsx`).
- [ ] `NEXT_PUBLIC_META_PIXEL_ID` set in web environment.
- [ ] `META_PIXEL_ID` and `META_CAPI_TOKEN` set in API environment.
- [ ] `META_TEST_EVENT_CODE` removed from production environment.
- [ ] Root domain verified via DNS TXT record.
- [ ] SHA-256 normalization verified for phone numbers (`880...` prefix) and emails.
- [ ] `_fbp` and `_fbc` cookies extracted and passed to backend.
- [ ] Order Number used as `event_id` for Purchase events.
- [ ] Event Match Quality (EMQ) monitored in Events Manager (target score 8.0+).

---

## 8. Common Mistakes to Avoid

1. **Exposing the CAPI Token:** Never prefix your access token with `NEXT_PUBLIC_`. It must remain exclusively in the server environment.
2. **Double Counting Purchases:** Never fire a `Purchase` event when an order fails or when a user simply clicks "Confirm Order". Fire it only upon true order creation or payment verification.
3. **Generating New Event IDs on Page Refresh:** Do not generate a random UUID on the order thank-you page. Use the database Order Number so refreshes do not send duplicate purchases.
4. **Hashing Raw Phone Numbers Without Country Codes:** Hashing `01712345678` causes Meta to fail matching. Always convert to international digits `8801712345678`.
5. **Hashing `_fbp` or `_fbc`:** These cookie strings must be sent in plaintext.
6. **Leaving Test Event Code in Production:** If `test_event_code` remains in production, events route to the testing sandbox and do not count toward ad campaign optimization.
