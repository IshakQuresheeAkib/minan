# Meta Pixel and Conversions API (CAPI) Integration Guide

A manual and implementation blueprint for Next.js and Express.js websites.

---

## 1. Core Architecture and Deduplication

Meta tracking works best through two parallel channels:

1. **Meta Pixel (Client):** JavaScript runs in the browser. It records actions like page views, button clicks, and cart updates with `_fbp` and `_fbc` cookies.
2. **Conversions API (Server):** Express sends HTTP POST requests directly to Meta Graph API.

Ad blockers and browser privacy tools drop up to 40% of browser events. Server traffic bypasses ad blockers. The hybrid model runs both channels together to capture all conversions.

### How Deduplication Works

Each user action triggers a client event and a server event with an identical `event_id` and `event_name`, which allows Meta to drop the duplicate automatically.

Meta drops the duplicate. It keeps the combined parameters from both events.

```
Browser Action (User clicks Add to Cart)
   │
   ├──> Client Pixel: fbq('track', 'AddToCart', ..., { eventID: id })
   │
   └──> POST /api/events ──> Express Server ──> Meta CAPI (Graph API v21.0)
                                                    │
                                                    ▼
                                          Meta Events Manager
                                          Matches event_id
                                          Records 1 deduplicated event
```

---

## 2. Meta Events Manager Configuration

### Key Terms

* **Business Portfolio:** The top account that owns your pages, ad accounts, and datasets.
* **Events Manager:** The dashboard where you configure datasets and inspect event traffic.
* **Dataset:** Meta's current name for a Pixel. Your Dataset ID is your Pixel ID.
* **Access Token:** The secret bearer key generated in Events Manager Settings. It authorizes backend CAPI calls. Store it on your server only.
* **Event Match Quality (EMQ):** A score from 1 to 10 that indicates how well user parameters link to active Meta accounts. Aim for 8.0 or higher.

### Setup Steps in Events Manager

1. Open **business.facebook.com** and select **Events Manager**.
2. Click **Connect data**, pick **Web**, and click **Connect**.
3. Name your dataset and click **Create**.
4. Choose **Set up manually**. Skip third-party gateways and CMS partner plugins. Manual code gives direct control with zero added fees.
5. Select the standard events you use:
   * `ViewContent` (product page view)
   * `AddToCart` (cart addition)
   * `InitiateCheckout` (checkout start)
   * `Purchase` (paid order confirmation)
   * `Lead` (contact or WhatsApp link click)
   * Do not select events you do not support (e.g., `Subscribe`, `StartTrial`, `Schedule`, `FindLocation`). Selecting an event in the wizard does not send it; your code must send it.
6. Turn on **Automatic Advanced Matching**. Enable email, phone, name, and country. Disable gender and date of birth. Give your checkout input elements standard `type` and `name` attributes (e.g., `type="email" name="email" autocomplete="email"`, `type="tel" name="phone" autocomplete="tel"`). This enables the Pixel script to locate them reliably. After finishing the wizard, the setup checklist often displays "Set up events" as greyed out. **Do not worry:** Meta keeps this step disabled until it receives its very first live `PageView` event from your site. Once your Next.js frontend sends its first PageView, the status updates automatically.
7. Generating the Conversions API Access Token: In Events Manager, click your **Dataset**. Then Open the **Settings** tab. Scroll down to the **Conversions API** section.Under "Set up manually", click **Generate access token**. Save it to your backend environment variables as `META_CAPI_TOKEN`. **Security Rule:** Never place `META_CAPI_TOKEN` in frontend code, git commits, or `NEXT_PUBLIC_` variables.
8. Verify your domain in **Business Settings** > **Brand safety and suitability** > **Domains** with a DNS TXT record. Domain will be  `minanclothing.com` without `https://` or `www`. Copy the TXT value (`facebook-domain-verification=...`). In your DNS provider (Cloudflare, Namecheap, cPanel), create a TXT record with host `@` and paste the verification string. Click **Verify domain** in Meta Business Manager.

The "Set up events" checklist item stays greyed out until your site sends its first live `PageView`. Meta marks it active once traffic arrives.

---

## 3. Data Formatting and Hash Rules (SHA-256)

Meta requires all personal data fields in lowercase and hashed with SHA-256 before delivery to CAPI. Browser identifiers, IP addresses, and user agents remain unhashed.

| Field | JSON Key | Format Before Hash | Hash Needed? | Raw Example |
|---|---|---|---|---|
| Email | `em` | Trim spaces, lowercase | Yes | `user@example.com` |
| Phone | `ph` | Digits only with country code, no leading zeros | Yes | `8801712345678` |
| First Name | `fn` | Trim spaces, lowercase, letters only | Yes | `john` |
| Last Name | `ln` | Trim spaces, lowercase, letters only | Yes | `doe` |
| City | `ct` | Trim spaces, lowercase, no spaces | Yes | `sylhet` |
| Country | `country` | Two-letter ISO code, lowercase | Yes | `bd` |
| External ID | `external_id` | Trim spaces, string user ID | Yes | `usr_1234` |
| Browser ID | `fbp` | Raw `_fbp` cookie string | No | `fb.1.1710000000.123456789` |
| Click ID | `fbc` | Raw `_fbc` cookie string | No | `fb.1.1710000000.IwAR0...` |
| Client IP | `client_ip_address` | Raw IPv4 or IPv6 string | No | `103.205.71.4` |
| User Agent | `client_user_agent` | Raw browser User-Agent string | No | `Mozilla/5.0...` |

Never hash IP addresses, user agents, `_fbp`, or `_fbc`. Hashing these parameters breaks attribution matching.

### Cookie Handling

* `_fbp` is created automatically by the Pixel script on your site.
* `_fbc` is set when visitors arrive from an ad URL containing `?fbclid=...`. If the cookie is not yet set, build it manually:
  ```ts
  const fbc = `fb.1.${Date.now()}.${fbclid}`;
  ```

---

## 4. Frontend Code (`apps/web`)

### Pixel Script Component

Add this component to `apps/web/src/app/layout.tsx`. It runs the base script and tracks client route changes in Next.js App Router.

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

  useEffect(() => {
    if (!PIXEL_ID) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  if (!PIXEL_ID) return null;

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`,
      }}
    />
  );
}
```

### Client Event Helper

```ts
// apps/web/src/lib/analytics/pixel.ts

export function getMetaCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === "undefined") return {};

  const cookies = Object.fromEntries(
    document.cookie.split("; ").filter(Boolean).map((c) => {
      const idx = c.indexOf("=");
      return [c.slice(0, idx), decodeURIComponent(c.slice(idx + 1))];
    })
  );

  let fbc = cookies._fbc;
  if (!fbc && typeof window !== "undefined") {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
  }

  return { fbp: cookies._fbp, fbc };
}

export function trackPixel(name: string, data: Record<string, unknown> = {}, eventId?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", name, data, eventId ? { eventID: eventId } : undefined);
}
```

### Triggering an Action (Example: Add to Cart)

```ts
import { trackPixel, getMetaCookies } from "@/lib/analytics/pixel";

export async function handleAddToCart(product: { id: string; name: string; price: number }) {
  const eventId = crypto.randomUUID();
  const { fbp, fbc } = getMetaCookies();

  trackPixel(
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

  await fetch("/api/v1/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: "add_to_cart",
      event_id: eventId,
      product_id: product.id,
      fbp,
      fbc,
      custom_data: { value: product.price, currency: "BDT" },
    }),
  });
}
```

---

## 5. Backend Code (`apps/api`)

### Hashing Helper

```ts
// apps/api/src/lib/metaHash.ts
import { createHash } from "node:crypto";

export const sha256 = (val: string) =>
  createHash("sha256").update(val).digest("hex");

export function hashEmail(val?: string) {
  const clean = val?.trim().toLowerCase();
  return clean ? sha256(clean) : undefined;
}

export function hashPhone(val?: string) {
  if (!val) return undefined;
  let digits = val.replace(/\D/g, "");
  if (digits.startsWith("01") && digits.length === 11) {
    digits = "88" + digits;
  }
  return digits ? sha256(digits) : undefined;
}

export function hashText(val?: string) {
  const clean = val?.trim().toLowerCase();
  return clean ? sha256(clean) : undefined;
}
```

### Conversions API Dispatcher

```ts
// apps/api/src/lib/metaCapi.ts
import { hashEmail, hashPhone, hashText } from "./metaHash.js";

type CapiParams = {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
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

export async function sendMetaCapiEvent(params: CapiParams): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  const pixelId = process.env.META_PIXEL_ID;
  if (!token || !pixelId) return;

  const u = params.userData || {};
  const c = params.customData || {};

  const userData: Record<string, unknown> = {
    client_ip_address: u.clientIpAddress,
    client_user_agent: u.clientUserAgent,
    fbp: u.fbp,
    fbc: u.fbc,
    country: [hashText("bd")!],
  };

  const em = hashEmail(u.email);
  if (em) userData.em = [em];

  const ph = hashPhone(u.phone);
  if (ph) userData.ph = [ph];

  const fn = hashText(u.firstName);
  if (fn) userData.fn = fn;

  const ln = hashText(u.lastName);
  if (ln) userData.ln = ln;

  const ct = hashText(u.city);
  if (ct) userData.ct = ct;

  const payload = {
    data: [
      {
        event_name: params.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        action_source: "website",
        event_source_url: params.eventSourceUrl,
        user_data: userData,
        custom_data: c,
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  };

  try {
    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("[CAPI Error]", res.status, await res.text());
    }
  } catch (err) {
    console.error("[CAPI Network Error]", err);
  }
}
```

---

## 6. Purchase Flow and Attribution Rules

Purchase events train Meta conversion delivery. Apply these rules:

1. **Order Total as Value:** Send the full order total in BDT for both online payment and cash on delivery. Meta ad delivery uses gross order value to find higher-value buyers.
2. **Deterministic City Match:** When `shipping_zone === "inside_sylhet"`, send `ct: hashText("sylhet")`. When `shipping_zone === "outside_sylhet"`, omit `ct`. Do not guess cities from free-text addresses.
3. **Persist Attribution Cookies Across Payment Redirects:** Read `_fbp` and `_fbc` at checkout. Store them with client IP and user agent on the MongoDB order record. When bKash redirects to the webhook or callback, load the saved parameters from the order record to fire CAPI.
4. **Order Number Deduplication:** Use `order.order_number` as the `event_id` on both server and client. Refreshing the confirmation page will not create duplicate purchases.

---

## 7. Testing and Verification

1. Open **Events Manager** > **open your dataset** > **Test events** tab.
2. In the "Confirm your server events are set up correctly" card, copy the **Test Event Code** (e.g., `TEST12345`).
3. Set `META_TEST_EVENT_CODE=TEST12345` in your backend `.env` file and restart Express.
4. Enter your website URL into the test box and open the site.
5. Perform actions: view a product, add to cart, and place a test order.
6. Verify the event list in Events Manager:
   * Each action displays two rows: one marked **Browser** and one marked **Server**.
   * A green badge displays **Deduplicated**.
7. If only Browser appears, verify your Express backend logs.
8. If only Server appears, verify the Next.js script element loads without errors.
9. If both appear without the deduplication badge, check that `event_id` and `event_name` match character-for-character.

---

## 8. Production Verification Checklist

- [ ] Set `NEXT_PUBLIC_META_PIXEL_ID` in web deployment settings.
- [ ] Set `META_PIXEL_ID` and `META_CAPI_TOKEN` in API environment variables.
- [ ] Remove `META_TEST_EVENT_CODE` before launching production.
- [ ] Complete domain verification via DNS TXT record.
- [ ] Normalize Bangladesh phone numbers to `8801...` before hashing.
- [ ] Pass `_fbp`, `_fbc`, IP, and user agent unhashed.
- [ ] Use `order_number` as `event_id` for Purchase events.
- [ ] Verify Event Match Quality (EMQ) reaches 8.0 or higher in Events Manager.

## 9. Common Mistakes to Avoid

1. **Exposing the CAPI Token:** Never prefix your access token with `NEXT_PUBLIC_`. It must remain exclusively in the server environment.
2. **Double Counting Purchases:** Never fire a `Purchase` event when an order fails or when a user simply clicks "Confirm Order". Fire it only upon true order creation or payment verification.
3. **Generating New Event IDs on Page Refresh:** Do not generate a random UUID on the order thank-you page. Use the database Order Number so refreshes do not send duplicate purchases.
4. **Hashing Raw Phone Numbers Without Country Codes:** Hashing `01712345678` causes Meta to fail matching. Always convert to international digits `8801712345678`.
5. **Hashing `_fbp` or `_fbc`:** These cookie strings must be sent in plaintext.
6. **Leaving Test Event Code in Production:** If `test_event_code` remains in production, events route to the testing sandbox and do not count toward ad campaign optimization.
