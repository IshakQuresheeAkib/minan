# MINAN Project Documentation

**Scope:** Marketing-focused commerce platform (Lead Gen/Conversion). No payment processing in MVP.
**Market:** Bangladesh, mobile-first, 3G/4G, Facebook Ads.
**Database:** MongoDB Atlas + custom JWT auth.
**Route Handlers:** NONE in Next.js. All data ops go through Express API on Render.

---

## 1. Project Meta

| Property | Value |
|---|---|
| Framework | Next.js 16 |
| Phase | MVP v1 |
| Market | Bangladesh (Sylhet) |
| Traffic | Facebook Ads |
| Payment | Not in MVP — bKash TX ID collected manually |

---

## 2. Business Goals

- Premium brand experience
- Lead collection via checkout — first-party database
- Meta Pixel + CAPI with event deduplication
- Role-based admin dashboard
- Supports future e-commerce migration
- Facebook custom audience retargeting

---

## 3. Coding Principles
- Always follow the patterns and decisions defined in the documentation. suggest alternatives if any technology is not mentioned or if you think the alternative technology should be obviously used.
- Follow Next.js 16 conventions: use proxy.ts not middleware.ts.
- Always strictly maintain best practices and follow the best performance-optimized way. Must ensure the principles, coding style, and syntax of the latest versions of Next.js 16, Tailwind version 4, and React 19 and always use latest versions
- All code must be production-ready and working. No placeholders, no TODO stubs.
- When generating code, stay consistent with the existing architecture described in the docs.
- For animations, use GSAP only. Do not suggest Framer Motion.
- For the global state, use Zustand only.
- Keep responses concise. Skip basic explanations. Use code blocks.
- TypeScript strict mode everywhere — `no any`, no type casting with `as unknown`
- `use cache` directive for SSR data caching — requires `dynamicIO: true` in `next.config.ts`. Do NOT use `fetch()` cache options; do not mix caching models
- No Next.js Route Handlers (`app/api/route.ts`) — all API calls go to Express
- No Next.js Server Actions (`"use server"`) — `*.actions.ts` files are plain async functions that call Express, not Next.js Server Actions
- GSAP only for animations — no Framer Motion
- React Hook Form + Zod only for forms — no uncontrolled inputs
- Do not target Radix UI internal DOM nodes with GSAP
- Tailwind v4 utility classes only — no arbitrary CSS-in-JS
- All Zod schemas defined in `features/<domain>/schemas/` — frontend uses them directly; backend maintains its own copies (not shared across repos)
- `next/image` for all images — never raw `<img>` tags
- `next/link` for all internal links/routes — never `<a>` tags.
- Cloudinary URLs stored in DB — never local image paths
- BD phone validation regex: `/^(?:\+?88)?01[3-9]\d{8}$/`

---

## 4. Tech Stack

### Frontend

| Technology | Version |
|---|---|
| Next.js | 16 (App Router, `proxy.ts`) |
| React | 19 (Compiler enabled) |
| TypeScript | 5.1+ (strict, no `any`) |
| Tailwind CSS | v4 |
| shadcn/ui | Latest |
| Zustand | Latest |
| React Hook Form | Latest |
| Zod | Latest |
| GSAP | Latest |
| Cloudinary | via `next/image` + blur placeholders |

### Backend

| Technology | Version |
|---|---|
| Node.js | 24.16.0 |
| Express.js | 5.2.1 |
| MongoDB | 8.3 |
| Mongoose | 8.x |
| jsonwebtoken | Latest |
| argon2 | Latest |
| cookie-parser | Latest |
| cors | Latest |
| express-rate-limit | Latest |
| helmet | Latest |
| Zod | Latest |

### Infrastructure

| Service | Role |
|---|---|
| Vercel | Frontend (Next.js) |
| Render | Backend (Express) — Node 24.16.0 |
| MongoDB Atlas | Managed MongoDB 8.3 |
| Cloudinary | Image storage + CDN |
| Meta Pixel + CAPI | Client + server-side ad events |
| GA4 | Traffic + behavior |
| Microsoft Clarity | Session recordings + heatmaps |

---

## 5. Architecture

```
Browser → Next.js (Vercel) → Express API (Render) → MongoDB Atlas
```

### Auth Cookie Strategy — Cross-Domain Requirement

Both frontend and backend must run on subdomains of the same parent domain so cookies are readable by `proxy.ts`:

| Service | Domain |
|---|---|
| Frontend (Vercel) | `app.minan.com` |
| Backend (Render) | `api.minan.com` |

Express sets auth cookies with `Domain=.minan.com`. This allows the browser to send the cookie on page requests to `app.minan.com`, which means `proxy.ts` can read the access token cookie server-side before admin pages render.

**Without this setup, `proxy.ts` cookie check does not work in production.** Custom domains must be configured before any admin auth is tested in a deployed environment.

### Request Layers

| Layer | Role |
|---|---|
| `proxy.ts` | Reads httpOnly access token cookie, verifies JWT, redirects if invalid |
| Next.js Client | Sends `Authorization: Bearer <token>` from Zustand on every API call |
| Express Middleware | Verifies Bearer token independently on every protected route |
| Express Routes | Business logic, DB ops, CAPI, rate limiting |
| Mongoose | Persistence |

### `proxy.ts` Clarification

`proxy.ts` is placed at `src/proxy.ts` and registered as the middleware entry point in `next.config.ts` via the `experimental.middleware` config. It is a standard Next.js Edge Middleware function — the filename is `proxy.ts` purely as a project convention to signal its role (auth guard), not a special Next.js API.

### Admin Boot Flow (Zustand Hydration After Reload)

On load of any admin route, the admin layout (`app/(admin)/admin/layout.tsx`) calls `POST /api/auth/refresh` on mount to:
1. Exchange the valid refresh token cookie for a new access token
2. Repopulate `auth.store.ts` with the new access token in Zustand memory

If the refresh call fails (cookie expired or missing), redirect to `/admin/login`. This ensures API calls work immediately after a browser refresh.

### CORS

| Option | Value |
|---|---|
| `origin` | `https://app.minan.com` from env var — never `*` |
| `credentials` | `true` |

---

## 6. Authentication

**Scope:** Admin-only. No public user auth in MVP.
**Pattern:** Two-token JWT (access + refresh).

### Why httpOnly for Access Token

`proxy.ts` is server-side — cannot read Zustand or localStorage. Access token in httpOnly cookie lets `proxy.ts` verify JWT before page renders. 15-min TTL limits exposure.

### Token Storage

| Token | Storage | TTL |
|---|---|---|
| Access Token | httpOnly cookie + Zustand memory | 15 min |
| Refresh Token | httpOnly cookie only | 7 days, rotated on every use |

- Cookie → `proxy.ts` server-side read + admin layout boot refresh
- Zustand → `Authorization: Bearer` header for API calls

### Cookie Config

| Flag | Value |
|---|---|
| `httpOnly` | `true` |
| `secure` | `true` |
| `sameSite` | `none` (cross-origin: `app.minan.com` ↔ `api.minan.com`) |
| `domain` | `.minan.com` |
| `path` | `/` |

### Auth Flow

1. `POST /api/auth/login` → argon2 verify → issue access (15min) + refresh (7d) as httpOnly cookies with `Domain=.minan.com` + access token in response body
2. Next.js stores access token in Zustand (`auth.store.ts`)
3. Admin layout calls `POST /api/auth/refresh` on mount to rehydrate Zustand after page reload
4. `proxy.ts` reads httpOnly cookie → blocks unauthenticated admin renders
5. API calls send `Authorization: Bearer` from Zustand
6. 401 → `POST /api/auth/refresh` → Express rotates both tokens → returns new access token in body
7. `POST /api/auth/logout` → Express clears cookies → Zustand cleared

### CSRF Mitigation

- `X-Requested-With: XMLHttpRequest` required on all state-changing requests
- Browsers block third-party sites from setting custom headers
- Refresh token rotated on every use

---

## 7. Admin Roles

| Role | Access |
|---|---|
| `general` | Dashboard read-only |
| `premium` | Full CRUD — products, categories, leads, admins |

### Permission Matrix

| Feature | general | premium |
|---|---|---|
| View Dashboard + Traffic | ✓ | ✓ |
| Product CRUD | ✗ | ✓ |
| Category CRUD | ✗ | ✓ |
| Lead Read / Create / Update | ✗ | ✓ |
| Admin CRUD | ✗ | ✓ |

### Enforcement

- Role in JWT payload: `{ id, email, role }`
- Express middleware checks role per route — never from request body
- `proxy.ts` reads role from JWT cookie for server-side nav rendering
- Role change requires token refresh to take effect

---

## 8. Database — MongoDB 8.3 (Mongoose 8.x)

### `products`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `name` | String | required |
| `slug` | String | required, unique |
| `description` | String | required |
| `price` | Number | required, min: 0 |
| `category_id` | ObjectId (ref: `Category`) | required |
| `sizes` | [String] | `["S","M","L","XL"]` |
| `colors` | [String] | `["Red","Black"]` |
| `images` | [String] | Cloudinary URLs |
| `is_active` | Boolean | default: `true` (soft delete) |
| `createdAt` / `updatedAt` | Date | auto via `timestamps: true` |

### `categories`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `name` | String | required |
| `slug` | String | required, unique |
| `image_url` | String | Cloudinary URL |
| `is_active` | Boolean | default: `true` (soft delete) |
| `createdAt` / `updatedAt` | Date | auto |

### `leads`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `name` | String | required |
| `phone_number` | String | required |
| `email` | String | required |
| `address` | String | required |
| `notes` | String | optional |
| `bkash_txn_id` | String | optional |
| `cart_snapshot` | Object | embedded cart at checkout — shape: `{ items: Array<{ product_id: string, name: string, price: number, size: string, color: string, quantity: number }>, total: number }` |
| `status` | String | enum: `pending \| confirmed \| cancelled`, default: `pending` |
| `createdAt` / `updatedAt` | Date | auto |

### `analytics_events`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `event_type` | String | enum: `page_view \| product_view \| add_to_cart \| checkout_start \| lead_submit \| whatsapp_click` |
| `event_id` | String | `crypto.randomUUID()` — used for Meta CAPI deduplication; stored for audit |
| `product_id` | ObjectId (ref: `Product`) | optional |
| `category_id` | ObjectId (ref: `Category`) | optional |
| `session_id` | String | required |
| `utm_source` | String | optional |
| `utm_medium` | String | optional |
| `utm_campaign` | String | optional |
| `createdAt` | Date | auto |

> `analytics_events` uses `{ timestamps: { createdAt: true, updatedAt: false } }` — events are immutable, `updatedAt` is not applicable.

### `admin_users`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | PK |
| `email` | String | required, unique, lowercase |
| `password` | String | argon2 hashed — never in API response |
| `role` | String | enum: `general \| premium`, required |
| `is_active` | Boolean | default: `true` (soft disable) |
| `createdAt` / `updatedAt` | Date | auto |

### Mongoose Patterns

- `timestamps: true` on all schemas except `analytics_events` (uses `{ timestamps: { createdAt: true, updatedAt: false } }`)
- Soft deletes via `is_active` — no hard deletes on products, categories, or admins
- `populate('category_id')` on product queries when category data needed
- Indexes: `slug` unique on products + categories; `email` unique on admin_users; compound `{ event_type, createdAt }` on analytics_events
- `pre('save')` on admin_users → argon2 hash password
- `toJSON` transform on admin_users → strip `password`

---

## 9. API Routes (Express)

### Public

| Method | Route | Description |
|---|---|---|
| GET | `/api/products` | List active products (filterable by category, featured) |
| GET | `/api/products/:slug` | Single product by slug |
| GET | `/api/categories` | List active categories |
| POST | `/api/leads` | Submit checkout lead — rate-limited 5 req/15 min/IP |
| POST | `/api/analytics` | Log analytics event + forward to Meta CAPI |
| POST | `/api/whatsapp-click` | Log WhatsApp click + forward to Meta CAPI |
| POST | `/api/auth/login` | Admin login — rate-limited 10 req/15 min/IP |
| POST | `/api/auth/refresh` | Rotate tokens |
| POST | `/api/auth/logout` | Clear auth cookies |

### Protected (Bearer token required)

| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | general + premium | Metrics summary |
| GET | `/api/admin/leads` | premium | List leads |
| PATCH | `/api/admin/leads/:id` | premium | Update lead status |
| GET | `/api/admin/products` | premium | List all products (incl. inactive) |
| POST | `/api/admin/products` | premium | Create product |
| PATCH | `/api/admin/products/:id` | premium | Update product |
| PATCH | `/api/admin/products/:id/deactivate` | premium | Soft delete |
| GET | `/api/admin/categories` | premium | List all categories |
| POST | `/api/admin/categories` | premium | Create category |
| PATCH | `/api/admin/categories/:id` | premium | Update category |
| PATCH | `/api/admin/categories/:id/deactivate` | premium | Soft delete |
| GET | `/api/admin/admins` | premium | List admins |
| POST | `/api/admin/admins` | premium | Create admin |
| PATCH | `/api/admin/admins/:id` | premium | Update admin |
| PATCH | `/api/admin/admins/:id/deactivate` | premium | Soft disable |

---

## 10. Pages / Routes

| Route | Page | Access |
|---|---|---|
| `/` | Home | Public |
| `/products` | Product Listing | Public |
| `/products/[slug]` | Product Detail | Public |
| `/cart` | Cart | Public |
| `/checkout` | Checkout | Public |
| `/admin/login` | Admin Login | Public |
| `/admin` | Dashboard | General + Premium |
| `/admin/products` | Product Management | Premium |
| `/admin/categories` | Category Management | Premium |
| `/admin/leads` | Lead Management | Premium |
| `/admin/admins` | Admin Management | Premium |

---

## 11. Frontend Folder Structure

```
src/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── cart/page.tsx
│   │   └── checkout/page.tsx
│   │
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx          ← calls POST /api/auth/refresh on mount to rehydrate Zustand
│   │       ├── login/page.tsx
│   │       ├── page.tsx            ← dashboard (maps to /admin)
│   │       ├── products/page.tsx
│   │       ├── categories/page.tsx
│   │       ├── leads/page.tsx
│   │       └── admins/page.tsx
│   │
│   ├── layout.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── loading.tsx
│   └── globals.css
│
├── features/
│   ├── home/
│   │   ├── components/
│   │   │   ├── HeroCarousel.tsx
│   │   │   └── FeaturedProducts.tsx
│   │   └── hooks/
│   │
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductGallery.tsx
│   │   │   └── SizeColorSelector.tsx
│   │   ├── actions/product.actions.ts
│   │   ├── services/product.service.ts
│   │   ├── hooks/useProducts.ts
│   │   ├── schemas/product.schema.ts
│   │   └── types.ts
│   │
│   ├── cart/
│   │   ├── components/
│   │   │   └── CartItem.tsx
│   │   ├── hooks/useCart.ts        ← thin hook over cart.store.ts
│   │   └── types.ts
│   │
│   ├── checkout/
│   │   ├── components/LeadForm.tsx
│   │   ├── actions/checkout.actions.ts
│   │   ├── schemas/lead.schema.ts
│   │   └── types.ts
│   │
│   ├── categories/
│   │   ├── components/
│   │   ├── actions/category.actions.ts
│   │   ├── services/category.service.ts
│   │   ├── schemas/category.schema.ts
│   │   └── types.ts
│   │
│   └── admin/
│       ├── components/
│       │   ├── LeadsTable.tsx
│       │   ├── MetricsCard.tsx
│       │   ├── ProductsTable.tsx
│       │   ├── CategoriesTable.tsx
│       │   └── AdminsTable.tsx
│       ├── actions/
│       └── hooks/
│
├── components/
│   ├── ui/               ← shadcn/ui output only — do not edit manually
│   ├── shared/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── WhatsAppButton.tsx
│   └── layouts/
│       ├── PublicLayout.tsx
│       └── AdminLayout.tsx
│
├── lib/
│   ├── api/
│   │   └── client.ts     ← fetch wrapper — base URL = NEXT_PUBLIC_API_URL (not axios)
│   ├── cloudinary/
│   │   └── config.ts
│   ├── analytics/
│   │   └── pixel.ts      ← Meta Pixel client-side only. CAPI fired from Express, not here.
│   └── utils.ts
│
├── store/
│   ├── auth.store.ts     ← access token in memory (string | null) — never persisted to localStorage
│   ├── cart.store.ts     ← cart items in memory. features/cart/hooks/useCart.ts wraps this store
│   └── ui.store.ts
│
├── hooks/
│   ├── useAnalytics.ts
│   └── useDebounce.ts
│
├── types/
│   ├── api.types.ts
│   └── global.types.ts
│
├── constants/
│   ├── categories.ts
│   └── routes.ts
│
├── config/
│   └── site.config.ts
│
└── proxy.ts
```

**Folder rules:**
- `features/<domain>/` — all domain logic colocated: components, hooks, actions, services, schemas, types
- `features/<domain>/actions/*.actions.ts` — plain async functions calling Express. NOT Next.js Server Actions. No `"use server"` directive.
- `components/ui/` — shadcn/ui output only, never manually edited
- `lib/api/client.ts` — fetch wrapper, not axios
- `lib/analytics/pixel.ts` — Meta Pixel client-side events only. CAPI is Express-only.
- `store/auth.store.ts` — access token string in memory. Never persisted to localStorage.
- `store/cart.store.ts` — cart state. `features/cart/hooks/useCart.ts` wraps this.
- No `app/api/` route handlers — all API calls go to Express on Render
- Zod schemas in `features/<domain>/schemas/` — frontend source of truth. Backend maintains equivalent schemas independently (separate repos — no shared package).

---

## 12. Checkout / Lead Form

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | text | yes | |
| `phone_number` | text | yes | BD format — Zod regex: `/^(?:\+?88)?01[3-9]\d{8}$/` |
| `email` | email | yes | |
| `address` | textarea | yes | |
| `notes` | textarea | no | |
| `bkash_txn_id` | text | no | Manual admin verification |

Rate limit: 5 req / 15 min / IP on `POST /api/leads`.

---

## 13. MVP Features

- Animated UI (GSAP), responsive, mobile-first
- Product categories: T-Shirts, Shirts, Pants, Footwear, Accessories, Ladies' Bags
- WhatsApp ordering: pre-filled message from PDP — fires Lead event to CAPI via `/api/whatsapp-click`, bypasses cart/checkout
- Cart: Zustand memory only, no server-side cart
- Checkout: lead form → MongoDB `leads` collection
- Admin dashboard + CRUD (role-gated)

---

## 14. Analytics & Tracking

### Tool Matrix

| Tool | Fires From | Role |
|---|---|---|
| Meta Pixel | Next.js client | page_view, ViewContent, AddToCart, InitiateCheckout |
| Meta CAPI | Express only | Server-side mirror — dedup via `event_id` |
| GA4 | Next.js client | Traffic, behavior, conversions |
| Microsoft Clarity | Next.js client | Session recordings + heatmaps |
| `analytics_events` | Express | First-party MongoDB log |

### Deduplication Flow

Applies to: `product_view`, `add_to_cart`, `checkout_start`, `whatsapp_click`

1. Client generates `event_id` via `crypto.randomUUID()`
2. Client fires Meta Pixel with `event_id`
3. Client POSTs to Express `/api/analytics` (or `/api/whatsapp-click`) with same `event_id`
4. Express writes to `analytics_events` + forwards to Meta CAPI with identical `event_id`
5. Meta deduplicates on matching `event_id`

### Non-Dedup Events

| Event | Fired By | Notes |
|---|---|---|
| `page_view` | Client Pixel only | No CAPI mirror — not needed for dedup |
| `lead_submit` | Express only (via `POST /api/leads`) | No client Pixel event — server creates this after lead is saved |

### Tracked Events

| Event | Client Pixel | Express CAPI |
|---|---|---|
| `page_view` | ✓ | ✗ |
| `product_view` | ✓ | ✓ |
| `add_to_cart` | ✓ | ✓ |
| `checkout_start` | ✓ | ✓ |
| `lead_submit` | ✗ | ✓ |
| `whatsapp_click` | ✓ | ✓ |

---

## 15. Performance

- Sub 3s load on 3G/4G
- Cloudinary CDN — `next/image` with blur placeholders
- `use cache` directive for SSR product + category fetches — requires `dynamicIO: true` in `next.config.ts`
- Turbopack in development
- MongoDB indexes: `slug` (unique), `email` (unique), compound `{ event_type, createdAt }`
- GSAP: `transform` + `opacity` only — no layout-triggering properties
- Render cold start mitigation: configure a keep-alive ping (e.g. UptimeRobot) to prevent Render free-tier spin-down

---

## 16. Security

| Concern | Mitigation |
|---|---|
| XSS token theft | httpOnly cookies — JS cannot read |
| CSRF | `X-Requested-With: XMLHttpRequest` on all state-changing requests |
| Password storage | argon2 |
| Token expiry | Access: 15 min / Refresh: 7d, rotated |
| Brute force | rate-limit `/auth/login` — 10 req / 15 min / IP |
| Checkout spam | rate-limit `/leads` — 5 req / 15 min / IP |
| HTTP headers | `helmet` |
| CORS | `https://app.minan.com` only, `credentials: true`, never `*` |
| Password leak | Mongoose `toJSON` strips `password` |
| Role escalation | Role from JWT only — never from request body |

---

## 17. Deployment & Env Vars

| Service | Platform | Domain |
|---|---|---|
| Frontend | Vercel | `app.minan.com` |
| Backend | Render (Node 24.16.0) | `api.minan.com` |
| Database | MongoDB Atlas 8.3 — IP whitelist: Render IPs only | — |
| Images | Cloudinary | — |

> Custom domains are required in production. `proxy.ts` cookie auth does not work on default `*.vercel.app` + `*.onrender.com` domains (no shared parent domain).

### Frontend `.env.local`

```
NEXT_PUBLIC_API_URL=https://api.minan.com
NEXT_PUBLIC_META_PIXEL_ID
NEXT_PUBLIC_GA4_ID
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```

### Backend `.env`

```
MONGODB_URI
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
ALLOWED_ORIGIN=https://app.minan.com
META_CAPI_TOKEN
META_PIXEL_ID
CLOUDINARY_URL
NODE_ENV
```

---

## 18. Admin Dashboard Metrics

| Metric | Query | Access |
|---|---|---|
| Today's Leads | `leads` count by today | General + Premium |
| This Month's Leads | `leads` count by month | General + Premium |
| Most Viewed Product | `analytics_events` — `product_view` agg by `product_id` | General + Premium |
| Top Category | `analytics_events` — `product_view` agg by `category_id` | General + Premium |
| Traffic Source | `analytics_events` — agg by `utm_source` | General + Premium |

---

## 19. Future Roadmap

- Payment Gateway (bKash API, SSLCommerz)
- Order Management
- Customer Accounts
- Inventory per SKU
- Coupons, Reviews, Recommendations
- Marketing Automation (email/SMS)
- Advanced Analytics, Order Tracking