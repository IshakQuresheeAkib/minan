# MINAN Project Documentation (Master Hub)

**Scope:** Commerce platform for marketing traffic, featuring order-based checkout, fulfillment, fee payments, Cash on Delivery (COD), returns, refunds, and exchanges.  
**Market:** Bangladesh (Sylhet origin), mobile-first, 3G/4G optimization, Facebook Ads traffic.  
**Database:** MongoDB Atlas managed cluster via Express API.  
**API Boundary:** Next.js does not handle application data. Express API handles all database operations, business logic, and payments. Next.js rewrites `/api/*` to the Express backend.

---

## 1. Project Meta

| Property | Value |
| :--- | :--- |
| **Frontend Framework** | Next.js 16.3.4 (App Router, `proxy.ts`, React 19 Compiler) |
| **Backend Framework** | Express 5.2.1 on Node 24.16.0 |
| **Database** | MongoDB Atlas 8.3 with Mongoose 9.7.3 |
| **Target Hosting** | Vercel (Frontend) + Render (Backend API) |
| **Target Market** | Bangladesh (Sylhet initial launch) |
| **Primary Traffic** | Facebook Ads (Meta Pixel + CAPI hybrid tracking) |
| **Payment Methods** | Full bKash payment, or advance non-refundable delivery fee with merchandise COD |

---

## 2. Business Goals

- **Brand Experience:** Clean, minimal, mobile-first apparel storefront.
- **Auditable Orders:** First-party order persistence and atomic order numbers in MongoDB.
- **Loss Prevention:** Advance non-refundable delivery fees via bKash to eliminate courier return losses on fake COD orders.
- **Meta Conversions:** Hybrid tracking combining client Meta Pixel and server CAPI with automated deduplication.
- **Admin Control:** Protected dashboard for staff order management, stock updates, and immutable audit logs.

---

## 3. Inviolable Coding Principles

Every engineer and AI agent working on this codebase must strictly follow these rules:

1. **TypeScript Strict Mode Everywhere:** No `any`, no `as unknown`. All types must be explicit.
2. **Persistence Boundary:** Only `apps/api` connects to MongoDB Atlas. Next.js components must never import Mongoose or connect to the database.
3. **No Next.js Route Handlers for Data:** Do not add route handlers under `apps/web/src/app/api/` for database operations. Next.js proxies `/api/*` calls to the Express backend. The only allowed exception is `app/api/revalidate/route.ts` for cache invalidation.
4. **No Next.js Server Actions:** Do not write `'use server'` server actions for data persistence. Actions are plain async functions making standard `fetch` requests to Express.
5. **Next.js 16 Routing Guards:** Next.js 16 uses `apps/web/src/proxy.ts` (not `middleware.ts`).
6. **Motion & Animation:** Use GSAP for orchestrated transitions and product reveals. Use Tailwind CSS transitions for simple hover and loading spinners. Framer Motion is strictly forbidden.
7. **Client State:** Zustand only for global client state (e.g. cart drawer). Use React Hook Form for forms and SWR for server cache synchronization.
8. **Media & Assets:** Use `next/image` with Cloudinary URLs for all images. Raw `<img>` tags are forbidden. Use `next/link` for internal page navigation. Raw `<a>` tags are forbidden for internal routes.
9. **Phone Validation:** All Bangladeshi phone numbers must match regex: `/^(?:\+?88)?01[3-9]\d{8}$/`.

---

## 4. System Topology

```
[Customer Browser]
       │
       ├── 1. Requests Web Page (e.g. /products, /checkout)
       │      └── Next.js 16 on Vercel serves server-rendered React 19 UI
       │
       └── 2. Submits Form or Data Request (/api/*)
              └── Next.js rewrites proxy request to Express API on Render
                     │
                     ├── Express validates input using Zod
                     ├── Express verifies JWT / session tokens
                     ├── Express processes bKash payments & Meta CAPI events
                     │
                     └── Reads / Writes to MongoDB Atlas managed database
```

---

## 5. Master Documentation Navigation Matrix

To keep context focused and avoid token waste, read the specific guide matching your current task:

| If your task involves... | Read this document |
| :--- | :--- |
| Next.js App Router, React components, Tailwind styling, GSAP animations, Zustand, SEO/PWA | [context/frontend.md](file:///c:/new%20projects/minan/context/frontend.md) |
| Express 5 routes, controllers, services, API endpoints, Zod request schemas, error handling | [context/backend-api.md](file:///c:/new%20projects/minan/context/backend-api.md) |
| MongoDB Atlas, Mongoose schemas (`User`, `Product`, `Order`, `Counter`, `AuditLog`), indexing | [context/database.md](file:///c:/new%20projects/minan/context/database.md) |
| Single-page checkout, BD phone validation, delivery fees, order status state machine | [context/checkout-orders.md](file:///c:/new%20projects/minan/context/checkout-orders.md) |
| bKash tokenized gateway integration, payment create/execute flow, webhook callbacks | [context/bkash-payment-gateway-guide.md](file:///c:/new%20projects/minan/context/bkash-payment-gateway-guide.md) |
| Meta Pixel, Conversions API (CAPI) hybrid tracking, event deduplication with `event_id`, GA4 | [context/meta-pixel-and-capi-guide.md](file:///c:/new%20projects/minan/context/meta-pixel-and-capi-guide.md) |
| Admin authentication, dual JWT tokens, `proxy.ts` cookie handling, RBAC, dashboard metrics | [context/auth-admin.md](file:///c:/new%20projects/minan/context/auth-admin.md) |
| Vercel & Render hosting, environment variables, Argon2 hashing, CORS whitelist, rate limits | [context/deployment-security.md](file:///c:/new%20projects/minan/context/deployment-security.md) |

---

## 6. Future Roadmap

- **Courier API Integration:** Automatic parcel booking with Steadfast and Pathao APIs upon marking an order `processing`.
- **SMS Notifications:** Automated order confirmation and delivery dispatch SMS via local SMS gateways (e.g. Greenweb, BulkSMSBD).
- **Multi-Vendor or Inventory Expansion:** Advanced warehouse stock synchronization and automated low-stock reorder alerts.
