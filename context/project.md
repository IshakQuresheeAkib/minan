# MINAN Project Documentation (Master Hub)

Scope: Minimalist apparel commerce platform for Bangladesh, optimized for mobile networks (3G/4G) and direct marketing traffic.
Market: Bangladesh (Sylhet origin).
Database: MongoDB Atlas managed cluster accessed only via Express API.
Architecture Boundary: Next.js handles presentation and proxies `/api/*` requests to Express. Express handles database access, order lifecycle, payment negotiation, and Meta CAPI.

---

## 1. Project Meta

| Property | Value |
| :--- | :--- |
| **Frontend Framework** | Next.js 16.3.4 (App Router, `proxy.ts`, React 19 Compiler) |
| **Backend Framework** | Express 5.2.1 on Node 24.16.0 |
| **Database** | MongoDB Atlas 8.3 with Mongoose 9.7.3 |
| **Target Hosting** | Vercel (Frontend) + Render (Backend API) |
| **Target Market** | Bangladesh (Sylhet launch) |
| **Primary Traffic** | Facebook Ads (Meta Pixel + CAPI hybrid tracking) |
| **Payment Flow** | bKash tokenized gateway prepayment, or advance non-refundable delivery fee with merchandise COD |

---

## 2. Business Goals

- Provide a fast, minimal, mobile-first apparel shopping experience.
- Maintain auditable orders and atomic daily order numbers in MongoDB.
- Eliminate courier return losses by collecting advance non-refundable delivery fees via bKash on COD orders.
- Send accurate purchase conversion data to Meta using client Pixel and server Conversions API (CAPI) deduplication.
- Protect admin operations with secure session cookies and activity history.

---

## 3. Inviolable Coding Principles

Every engineer and AI agent working on this codebase must follow these rules:

1. **TypeScript Strict Mode:** Explicit types everywhere. Never use `any` or `as unknown`.
2. **Persistence Boundary:** Only `apps/api` connects to MongoDB Atlas. Next.js components must never import Mongoose or connect to the database.
3. **No Next.js Route Handlers for Data:** Do not add route handlers under `apps/web/src/app/api/` for database access. Next.js rewrites `/api/*` to Express. The only permitted exception is `app/api/revalidate/route.ts` for cache tag invalidation.
4. **No Server Actions for Database Writes:** Do not write `'use server'` actions that write to the database. Actions are plain async functions calling Express API endpoints with `fetch`.
5. **Next.js 16 Routing Guards:** Route guards live in `apps/web/src/proxy.ts`. Never create `middleware.ts`.
6. **Motion and Animation:** Use GSAP for orchestrated transitions and product reveals. Use Tailwind CSS transitions for simple hover and button focus states. Framer Motion is banned.
7. **Client State:** Use Zustand for client UI state (e.g., cart drawer). Use React Hook Form with Zod for forms. Use SWR for client-side data fetching.
8. **Media and Navigation:** Use `next/image` with Cloudinary for images. Use `next/link` for internal page navigation. Raw `<img>` and `<a>` tags for internal links are forbidden.
9. **Phone Validation:** All Bangladeshi phone numbers must match regex: `/^(?:\+?88)?01[3-9]\d{8}$/`.

---

## 4. System Topology

```
[Customer Browser]
       │
       ├── 1. Navigates to storefront pages (/, /products, /checkout)
       │      └── Next.js 16 on Vercel serves server-rendered React 19 UI
       │
       └── 2. Sends data or payment request (/api/*)
              └── Next.js rewrites proxy request to Express API on Render
                     │
                     ├── Express validates input using Zod
                     ├── Express verifies auth tokens and CSRF header
                     ├── Express coordinates bKash payments and Meta CAPI events
                     │
                     └── Reads / writes to MongoDB Atlas collections
```

---

## 5. Master Documentation Navigation Matrix

Read the modular guide for your current task:

| If your task involves... | Read this document |
| :--- | :--- |
| Next.js App Router, storefront pages, admin views, Tailwind styling, GSAP motion, Zustand | [Frontend Guide](./frontend.md) |
| Express 5 routes, controllers, services, Zod schemas, CSRF checks, error handling | [Backend API Guide](./backend-api.md) |
| MongoDB Atlas, Mongoose schemas (`Product`, `Order`, `Category`, `AdminUser`, etc.), indexes | [Database Guide](./database.md) |
| Single-page checkout, BD phone validation, delivery fees, order status state machine | [Checkout & Orders Guide](./checkout-orders.md) |
| bKash tokenized gateway integration, payment create/execute flow, webhook callbacks | [bKash Gateway Guide](./bkash-payment-gateway-guide.md) |
| Meta Pixel, Conversions API (CAPI) hybrid tracking, event deduplication with `event_id`, GA4 | [Meta Pixel & CAPI Guide](./meta-pixel-and-capi-guide.md) |
| Admin authentication, customer sessions, `proxy.ts` cookie handling, dashboard metrics | [Auth & Admin Guide](./auth-admin.md) |
| Vercel & Render hosting, environment variables, Argon2 hashing, CORS whitelist, rate limits | [Deployment & Security Guide](./deployment-security.md) |

---

## 6. Future Roadmap

- **Courier API Integration:** Automatic parcel booking with Steadfast and Pathao APIs upon marking an order `processing`.
- **SMS Notifications:** Automated order confirmation and delivery dispatch SMS via local SMS gateways (e.g. Greenweb, BulkSMSBD).
- **Inventory Expansion:** Multi-warehouse stock synchronization and automated low-stock reorder alerts.
