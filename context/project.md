    # MINAN Project Documentation
    
    **Scope:** Marketing-focused commerce platform (Lead Gen/Conversion). No payment processing in MVP.
    **Market:** Bangladesh, mobile-first, 3G/4G, Facebook Ads.
    **Route Handlers:** NONE in Next.js. All data ops go through Express API on Render.
    
    ## 1. Project Meta
    | Property | Value |
    |---|---|
    | Framework | Next.js 16 |
    | Phase | MVP v1 |
    | Market | Bangladesh (Sylhet) |
    | Traffic | Facebook Ads |
    | Payment | Not in MVP — bKash TX ID collected manually |
    
    ## 2. Business Goals
    - Premium brand experience
    - Lead collection via checkout — first-party database
    - Meta Pixel + CAPI with event deduplication
    - Role-based admin dashboard
    - Supports future e-commerce migration
    - Facebook custom audience retargeting
    
    ## 3. Coding Principles
    - TypeScript strict mode everywhere — `no any`, no type casting with `as unknown`
    - Next.js 16 App Router only — no Pages Router, no `middleware.ts`, use `proxy.ts`
    - `use cache` for SSR data caching — do NOT use `fetch()` cache options (removed in Next.js 15+ when `cacheComponents: true` is enabled; do not mix caching models)
    - No Next.js Route Handlers — all API calls go to Express
    - No Next.js Server Actions for data mutations — `actions/*.actions.ts` files are plain async client-side functions that call Express via `lib/api/client.ts`. Exception: auth login/refresh/logout use Next.js Server Actions because they must set httpOnly cookies server-side.
    - GSAP only for animations — no Framer Motion
    - React Hook Form + Zod only for forms — no uncontrolled inputs
    - Zustand only for global state — no Redux, no Context for state
    - Do not target Radix UI internal DOM nodes with GSAP
    - Tailwind v4 utility classes only — no arbitrary CSS-in-JS
    - All Zod schemas defined in `features/<domain>/schemas/` on the frontend
    - Backend (separate Express repo) maintains its own matching Zod schemas — schemas are NOT imported across repos. Frontend and backend schemas must be kept in sync manually. A shared monorepo `packages/schemas` is a future refactor option.
    - `next/image` for all images — never raw `<img>` tags
    -`next/link` for all navigation — no `<a>` tags for internal links
    - Cloudinary URLs stored in DB — never local image paths
    
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
    
    
    ## 5. Architecture
    
    ```
    Browser → Next.js (Vercel) → Express API (Render) → MongoDB Atlas
    ```
    
    - `proxy.ts` verifies JWT httpOnly cookie server-side before admin page renders (UI guard)
    - Express middleware verifies JWT Bearer token on every protected API request (data guard)
    - These are two independent checks — `proxy.ts` does NOT replace Express auth
    
    ### Request Layers
    
    | Layer | Role |
    |---|---|
    | `proxy.ts` | Reads httpOnly access token cookie, verifies JWT, redirects if invalid |
    | Next.js Client | Sends `Authorization: Bearer <token>` from Zustand on every API call |
    | Express Middleware | Verifies Bearer token independently on every protected route |
    | Express Routes | Business logic, DB ops, CAPI, rate limiting |
    | Mongoose | Persistence |
    
    ### CORS
    | Option | Value |
    |---|---|
    | `origin` | Vercel domain from env var — never `*` |
    | `credentials` | `true` |
    
    ## 6. Authentication
    **Scope:** Admin-only. No public user auth in MVP.
    **Pattern:** Two-token JWT (access + refresh).
    
    ### Why Next.js Sets the Cookie (Not Express)
    `proxy.ts` runs on Vercel. Express runs on Render (`api.render.com`). A cookie set by Render's domain is never sent to Vercel on page requests — different origins. Therefore **Next.js must set the httpOnly cookie**, not Express. Express returns tokens in the response body; the Next.js login Server Action sets the cookie on the Vercel domain so `proxy.ts` can read it.
    
    ### Token Storage
    | Token | Storage | TTL |
    |---|---|---|
    | Access Token | httpOnly cookie (set by Next.js) + Zustand memory | 15 min |
    | Refresh Token | httpOnly cookie (set by Next.js) | 7 days, rotated on every use |
    - Cookie → `proxy.ts` server-side read (same Vercel domain — readable)
    - Zustand → `Authorization: Bearer` header for all Express API calls
    
    ### Cookie Config
    | Flag | Value |
    |---|---|
    | `httpOnly` | `true` |
    | `secure` | `true` |
    | `sameSite` | `lax` (same Vercel domain — no cross-site needed for cookie) |
    | `path` | `/` |
    
    **Note:** `sameSite: none` is only required for cross-domain cookie sending. Since the cookie is now set and read on the same Vercel domain, `lax` is sufficient and more secure.
    
    ### Auth Flow
    1. Admin POSTs credentials → Next.js login Server Action → forwards to Express `POST /api/auth/login`
    2. Express verifies argon2 → returns `{ accessToken, refreshToken }` in response body (no cookie set by Express)
    3. Next.js Server Action sets both tokens as httpOnly cookies on Vercel domain
    4. Next.js stores access token in Zustand (`auth.store.ts`)
    5. `proxy.ts` reads httpOnly access token cookie → verifies JWT → redirects if invalid
    6. API calls send `Authorization: Bearer` from Zustand
    7. **On page reload:** Zustand is empty — admin layout runs a bootstrap call (`POST /api/auth/refresh` using the httpOnly refresh cookie via the Next.js Server Action) to rehydrate Zustand with a new access token before any API calls
    8. 401 on any API call → same refresh bootstrap → retry request
    9. Logout → Next.js Server Action calls Express `POST /api/auth/logout` + clears both cookies + clears Zustand
    
    ### Bootstrap Flow (Reload Recovery)
    On every admin layout mount, before rendering protected content:
    - Read access token from Zustand
    - If empty → call refresh Server Action → Express validates refresh cookie → returns new access token → Next.js updates cookie + Zustand
    - If refresh also fails → redirect to `/admin/login`
    This ensures Zustand is always populated before any API call fires after a hard reload.
    
    ### CSRF Mitigation
    - `X-Requested-With: XMLHttpRequest` required on all state-changing requests
    - Browsers block third-party sites from setting custom headers
    - Refresh token rotated on every use
    
    
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
    | `is_featured` | Boolean | default: `false` |
    | `is_active` | Boolean | default: `true` (soft delete) |
    | `createdAt` / `updatedAt` | Date | auto via `timestamps: true` |
    
    ### `categories`
    | Field | Type | Notes |
    |---|---|---|
    | `_id` | ObjectId | PK |
    | `name` | String | required |
    | `slug` | String | required, unique |
    | `image_url` | String | Cloudinary URL |
    | `is_active` | Boolean | default: `true` |
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
    | `cart_snapshot` | (product_id, name) | embedded cart at checkout |
    | `status` | String | enum: `pending \| confirmed \| cancelled`, default: `pending` |
    | `createdAt` / `updatedAt` | Date | auto |
    
    ### `analytics_events`
    | Field | Type | Notes |
    |---|---|---|
    | `_id` | ObjectId | PK |
    | `event_type` | String | enum: `page_view \| product_view \| add_to_cart \| checkout_start \| lead_submit \| whatsapp_click` |
    | `event_id` | String | required — client `crypto.randomUUID()` for deduped events; server-generated UUID for `lead_submit` |
    | `product_id` | ObjectId (ref: `Product`) | optional |
    | `category_id` | ObjectId (ref: `Category`) | optional |
    | `session_id` | String | required |
    | `utm_source` | String | optional |
    | `utm_medium` | String | optional |
    | `utm_campaign` | String | optional |
    | `createdAt` | Date | auto — `updatedAt` disabled (`timestamps: { createdAt: true, updatedAt: false }`) |
    
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
    - `timestamps: true` on all schemas — exception: `analytics_events` uses `{ timestamps: { createdAt: true, updatedAt: false } }` (events are immutable)
    - Soft deletes via `is_active` — no hard deletes on products, categories, or admins
    - `populate('category_id')` on product queries when category data needed
    - Indexes: `slug` unique on products + categories; `email` unique on admin_users; compound `{ event_type, createdAt }` on analytics_events
    - `pre('save')` on admin_users → argon2 hash password
    - `toJSON` transform on admin_users → strip `password`
    
    ## 9. API Routes (Express)
    ### Auth
    | Method | Route | Access |
    |---|---|---|
    | POST | `/api/auth/login` | Public |
    | POST | `/api/auth/refresh` | httpOnly cookie |
    | POST | `/api/auth/logout` | JWT |
    
    ### Public
    
    | Method | Route | Notes |
    |---|---|---|
    | GET | `/api/products` | category filter |
    | GET | `/api/products/:slug` | |
    | GET | `/api/categories` | active only |
    | POST | `/api/leads` | rate limited |
    | POST | `/api/analytics` | write event + CAPI |
    | POST | `/api/whatsapp-click` | CAPI Lead event |
    
    ### Admin — General + Premium
    | Method | Route |
    |---|---|
    | GET | `/api/admin/dashboard` |
    
    ### Admin — Premium Only
    | Method | Route |
    |---|---|
    | GET / POST | `/api/admin/products` |
    | PUT / DELETE | `/api/admin/products/:id` |
    | GET / POST | `/api/admin/categories` |
    | PUT / DELETE | `/api/admin/categories/:id` |
    | GET / POST | `/api/admin/leads` |
    | PUT | `/api/admin/leads/:id` |
    | GET / POST | `/api/admin/admins` |
    | PUT / DELETE | `/api/admin/admins/:id` |
    
    ## 10. Pages & Routes (Next.js)
    | Route | Page | Access |
    |---|---|---|
    | `/` | Home | Public |
    | `/products` | All Products | Public |
    | `/products/[slug]` | Product Detail | Public |
    | `/cart` | Cart | Public |
    | `/checkout` | Checkout | Public |
    | `/admin/login` | Admin Login | Public |
    | `/admin` | Dashboard | General + Premium |
    | `/admin/products` | Product Management | Premium |
    | `/admin/categories` | Category Management | Premium |
    | `/admin/leads` | Lead Management | Premium |
    | `/admin/admins` | Admin Management | Premium |
    
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
    │   │       ├── layout.tsx
    │   │       ├── page.tsx            ← dashboard (/admin)
    │   │       ├── login/page.tsx      ← /admin/login (public, no proxy.ts guard)
    │   │       ├── products/page.tsx
    │   │       ├── categories/page.tsx
    │   │       ├── leads/page.tsx
    │   │       └── admins/page.tsx
    │   │
    │   ├── layout.tsx
    │   ├── not-found.tsx
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
    │   │   ├── hooks/
    │   │   ├── types.ts
    │   │   └── actions.ts
    │   │
    │   ├── checkout/
    │   │   ├── components/LeadForm.tsx
    │   │   ├── actions/checkout.actions.ts
    │   │   ├── schemas/lead.schema.ts
    │   │   └── types.ts
    │   │
    │   ├── categories/
    │   │   ├── components/
    │   │   ├── services/
    │   │   ├── schemas/
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
    │   │   └── client.ts     ← axios wrapper — base URL = NEXT_PUBLIC_API_URL
    │   ├── cloudinary/
    │   │   └── config.ts
    │   ├── analytics/
    │   │   └── pixel.ts      ← Meta Pixel client-side only. CAPI fired from Express, not here.
    │   └── utils.ts
    │
    ├── store/
    │   ├── auth.store.ts     ← access token in memory (string | null)
    │   ├── cart.store.ts
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
    - `components/ui/` — shadcn/ui output only, never manually edited
    - `lib/analytics/pixel.ts` — Meta Pixel client-side events only. CAPI is Express-only.
    - `store/auth.store.ts` — access token string in memory. Never persisted to localStorage.
    - No `app/api/` route handlers — all API calls go to Express on Render
    - Zod schemas in `features/<domain>/schemas/` — imported by both form components and client action functions
    
    ## 12. Checkout / Lead Form
    | Field | Type | Required | Notes |
    |---|---|---|---|
    | `name` | text | yes | |
    | `phone_number` | text | yes | BD format — Zod regex |
    | `email` | email | no | |
    | `address` | textarea | yes | |
    | `notes` | textarea | no | |
    | `bkash_txn_id` | text | no | Manual admin verification |
    
    Rate limit: 5 req / 15 min / IP on `POST /api/leads`.
    
    ## 13. MVP Features
    - Animated UI (GSAP), responsive, mobile-first
    - Product categories: T-Shirts, Shirts, Pants, Footwear, Accessories, Ladies' Bags
    - WhatsApp ordering: pre-filled message from PDP — fires Lead event to CAPI, bypasses cart/checkout
    - Cart: Zustand memory only, no server-side cart
    - Checkout: lead form → MongoDB `leads` collection
    - Admin dashboard + CRUD (role-gated)
    
    ## 14. Analytics & Tracking
    ### Tool Matrix
    | Tool | Fires From | Role |
    |---|---|---|
    | Meta Pixel | Next.js client | PageView, ViewContent, AddToCart, InitiateCheckout |
    | Meta CAPI | Express only | Server-side mirror — dedup via `event_id` for product/cart/checkout/WhatsApp events; sole channel for `lead_submit` |
    | GA4 | Next.js client | Traffic, behavior, conversions |
    | Microsoft Clarity | Next.js client | Session recordings + heatmaps |
    | `analytics_events` | Express | First-party MongoDB log |
    
    **Note:** Meta Pixel does NOT fire a `Lead` event client-side. `lead_submit` is CAPI-only — fired by Express when `POST /api/leads` succeeds. This avoids duplicate Lead signals and keeps PII off the client.
    
    ### Deduplication Flow
    
    Applies to: `product_view`, `add_to_cart`, `checkout_start`, `whatsapp_click` — events that fire on both client Pixel and Express CAPI.
    
    1. Client generates `event_id` via `crypto.randomUUID()`
    2. Client fires Meta Pixel with `event_id`
    3. Client POSTs to Express `/api/analytics` (or `/api/whatsapp-click`) with same `event_id`
    4. Express writes to `analytics_events` + forwards to Meta CAPI with identical `event_id`
    5. Meta deduplicates on matching `event_id`
    
    **`lead_submit` has no client Pixel event — no dedup needed. Express fires CAPI directly from `POST /api/leads` with a server-generated `event_id`.**
    
    ### Per-Event Route Mapping
    
    | Event | Client Route | Express Route |
    |---|---|---|
    | `product_view` | Pixel direct | `POST /api/analytics` |
    | `add_to_cart` | Pixel direct | `POST /api/analytics` |
    | `checkout_start` | Pixel direct | `POST /api/analytics` |
    | `lead_submit` | — | fired internally by `POST /api/leads` |
    | `whatsapp_click` | Pixel direct | `POST /api/whatsapp-click` |
    | `page_view` | Pixel direct | — (not logged to MongoDB) |
    
    ### Tracked Events
    | Event | Client Pixel | Express CAPI |
    |---|---|---|
    | `page_view` | ✓ | ✗ |
    | `product_view` | ✓ | ✓ |
    | `add_to_cart` | ✓ | ✓ |
    | `checkout_start` | ✓ | ✓ |
    | `lead_submit` | ✗ | ✓ |
    | `whatsapp_click` | ✓ | ✓ |
    
    ## 15. Performance
    - Sub 3s load on 3G/4G
    - Cloudinary CDN — `next/image` with blur placeholders
    - `use cache` directive for SSR product + category fetches — `cacheComponents: true` enabled in Next.js config; do not use `fetch()` cache options alongside it
    - Turbopack in development
    - MongoDB indexes: `slug` (unique), `email` (unique), compound `{ event_type, createdAt }`
    - GSAP: `transform` + `opacity` only — no layout-triggering properties
    
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
    | CORS | Vercel domain only, `credentials: true`, never `*` |
    | Password leak | Mongoose `toJSON` strips `password` |
    | Role escalation | Role from JWT only — never from request body |
    
    ## 17. Deployment & Env Vars
    | Service | Platform |
    |---|---|
    | Frontend | Vercel |
    | Backend | Render (Node 24.16.0) |
    | Database | MongoDB Atlas 8.3 — IP whitelist: Render IPs only |
    | Images | Cloudinary |
    
    ### Frontend `.env.local`
    
    ```
    NEXT_PUBLIC_API_URL
    NEXT_PUBLIC_META_PIXEL_ID
    NEXT_PUBLIC_GA4_ID
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    ```
    ### Backend `.env`
    
    ```
    MONGODB_URI
    JWT_ACCESS_SECRET
    JWT_REFRESH_SECRET
    ALLOWED_ORIGIN
    META_CAPI_TOKEN
    META_PIXEL_ID
    CLOUDINARY_URL
    NODE_ENV
    ```
    ## 18. Admin Dashboard Metrics
    | Metric | Query | Access |
    |---|---|---|
    | Today's Leads | `leads` count by today | General + Premium |
    | This Month's Leads | `leads` count by month | General + Premium |
    | Most Viewed Product | `analytics_events` — `product_view` agg by `product_id` | General + Premium |
    | Top Category | `analytics_events` — `product_view` agg by `category_id` | General + Premium |
    | Traffic Source | `analytics_events` — agg by `utm_source` | General + Premium |
    
    ## 19. Future Roadmap
    
    - Payment Gateway (bKash API, SSLCommerz)
    - Order Management
    - Customer Accounts
    - Inventory per SKU
    - Coupons, Reviews, Recommendations
    - Marketing Automation (email/SMS)
    - Advanced Analytics, Order Tracking