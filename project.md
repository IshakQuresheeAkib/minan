# MINAN Project Documentation

**Scope:** Marketing-focused commerce platform for lead generation and conversion.
**Market:** Bangladesh, mobile-first, 3G/4G, Facebook Ads.
**Supabase:** Not used.
**Database:** Data persistence is MongoDB Atlas through the Express API.
**Next.js Route Handlers:** Not used for app data operations. All data operations go through Express, either directly or through the Next.js rewrite proxy. The only `app/api` exception is `/api/revalidate`, which invalidates storefront cache tags and does not read or write app data.

---

## 1. Project Meta

| Property  | Value                                       |
| --------- | ------------------------------------------- |
| Framework | Next.js 16.2.7 App Router                   |
| Phase     | MVP v1                                      |
| Market    | Bangladesh (Sylhet)                         |
| Traffic   | Facebook Ads                                |
| Payment   | Not in MVP - bKash TX ID collected manually |

---

## 2. Business Goals

- Premium brand experience
- Lead collection through checkout into first-party MongoDB data
- Meta Pixel + CAPI infrastructure with event deduplication
- Authenticated full-access admin dashboard
- Supports future e-commerce migration
- Facebook custom audience retargeting

---

## 3. Coding Principles

- Follow this documentation and the existing repo patterns before introducing new patterns.
- Follow Next.js 16 conventions: use `proxy.ts`, not `middleware.ts`.
- Production-ready code only. No placeholders or TODO stubs.
- TypeScript strict mode everywhere: no `any`, no `as unknown` casting.
- No Next.js Route Handlers under `app/api/` for data operations. `app/api/revalidate/route.ts` is allowed for cache invalidation only.
- No Next.js Server Actions: `*.actions.ts` files are plain async functions that call Express.
- Next.js rewrites `/api/:path*` to `API_PROXY_TARGET`; do not add data route handlers to replace this.
- Use GSAP for orchestrated page and component motion. CSS/Tailwind transitions and keyframes are allowed for loading states, progress indicators, shadcn/ui state transitions, and small interaction feedback. Do not use or suggest Framer Motion.
- Zustand only for global client state.
- React Hook Form + Zod for forms.
- Do not target Radix UI internal DOM nodes with GSAP.
- Prefer Tailwind v4 utilities for component styling. Global CSS is reserved for theme tokens, base rules, browser-normalization helpers, and shared keyframes. Inline styles are allowed only for calculated runtime values, dynamic color swatches, or third-party component CSS-variable configuration; do not introduce CSS-in-JS libraries.
- Frontend Zod schemas live in `features/<domain>/schemas/`; backend keeps independent equivalent schemas.
- `next/image` for images. Never raw `<img>` tags.
- `next/link` for internal routes. Never raw `<a>` tags for internal navigation.
- Cloudinary URLs are the production image-storage target. Seed data may use temporary remote placeholder URLs.
- BD phone validation regex: `/^(?:\+?88)?01[3-9]\d{8}$/`

---

## 4. Tech Stack

### Frontend

| Technology      | Version / Rule                         |
| --------------- | -------------------------------------- |
| Next.js         | 16.2.7 (App Router, `proxy.ts`)        |
| React           | 19.2.7 (Compiler enabled)              |
| TypeScript      | 6.0.3, strict                          |
| Tailwind CSS    | 4.3.0                                  |
| shadcn/ui       | via `shadcn` package                   |
| Zustand         | 5.x                                    |
| React Hook Form | 7.x                                    |
| Zod             | 4.x                                    |
| GSAP            | 3.x                                    |
| Cloudinary      | via signed uploads + `next/image`      |

### Backend

| Technology         | Version / Rule                 |
| ------------------ | ------------------------------ |
| Node.js            | 24.16.0                        |
| Express.js         | 5.2.1                          |
| MongoDB Atlas      | 8.3 managed cluster target     |
| MongoDB driver     | 7.4.0                          |
| Mongoose           | 9.7.3                          |
| jsonwebtoken       | 9.x                            |
| argon2             | 0.44.x                         |
| cookie-parser      | 1.4.x                          |
| cors               | 2.8.x                          |
| express-rate-limit | 8.x                            |
| helmet             | 8.x                            |
| Zod                | 4.x                            |

### Infrastructure

| Service           | Role                                      | Status             |
| ----------------- | ----------------------------------------- | ------------------ |
| Vercel            | Frontend                                  | Target             |
| Render            | Express API, Node 24.16.0                 | Target             |
| MongoDB Atlas     | Managed MongoDB 8.3                       | Target             |
| Cloudinary        | Image storage + CDN                       | Implemented        |
| Meta Pixel + CAPI | Client helpers + server CAPI              | Partial            |
| GA4               | Traffic + behavior                        | Planned            |
| Microsoft Clarity | Session recordings + heatmaps             | Planned            |
| Vercel Speed Insights | Frontend performance telemetry         | Implemented        |

---

## 5. Architecture

```
Browser -> Next.js (Vercel) -> Express API (Render) -> MongoDB Atlas
```

### Auth Cookie Strategy - Cross-Domain Requirement

Both frontend and backend must run on subdomains of the same parent domain so cookies are readable by `proxy.ts`:

| Service           | Domain          |
| ----------------- | --------------- |
| Frontend (Vercel) | `app.minan.com` |
| Backend (Render)  | `api.minan.com` |

Express sets auth cookies with `AUTH_COOKIE_DOMAIN=.minan.com` in production. This lets the browser send the access token cookie on page requests to `app.minan.com`, so `proxy.ts` can verify admin auth before protected pages render.

**Production admin auth requires custom domains.** It will not work correctly across default `*.vercel.app` and `*.onrender.com` domains because they do not share a parent domain.

### Request Layers

| Layer              | Role                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| `proxy.ts`         | Verifies the access-token cookie; redirects or defers refresh-cookie recovery to the admin provider |
| Next.js Client     | Sends `Authorization: Bearer <token>` from Zustand on API calls        |
| Next.js Rewrites   | Proxies `/api/:path*` to `API_PROXY_TARGET` from `next.config.ts`      |
| Next.js Revalidate | Accepts server-to-server storefront cache invalidation at `/api/revalidate` |
| Express Middleware | Verifies Bearer token independently on protected routes                |
| Express Routes     | Business logic, DB ops, CAPI, rate limiting                            |
| Mongoose           | Persistence                                                            |

### `proxy.ts`

`proxy.ts` is placed at `apps/web/src/proxy.ts` and exports the standard Next.js proxy function plus static `config.matcher`. It does not need registration in `next.config.ts`. A missing, expired, or invalid access token is allowed through only when a refresh-token cookie exists; `AdminSessionProvider` then attempts the refresh before rendering the protected admin content. Without a recoverable refresh-token cookie, the proxy redirects to `/admin/login`.

### Admin Boot Flow

`app/(admin)/admin/layout.tsx` wraps protected admin routes in `AdminSessionProvider`. On mount, `AdminSessionProvider` calls `POST /api/auth/refresh` to:

1. Exchange a valid refresh token cookie for new tokens
2. Repopulate `auth.store.ts` with the new access token

If refresh fails, the client clears Zustand and redirects to `/admin/login`.

### CORS

| Option        | Value                                            |
| ------------- | ------------------------------------------------ |
| `origin`      | Comma-separated `ALLOWED_ORIGINS`; requests without an Origin are allowed |
| `credentials` | `true`                                           |

Never use `*` for CORS origin.

---

## 6. Authentication

**Scope:** Admin-only. No public user auth in MVP.
**Pattern:** Two-token JWT with server-side refresh-token hash rotation.

### Token Storage

| Token         | Storage                          | TTL    |
| ------------- | -------------------------------- | ------ |
| Access Token  | httpOnly cookie + Zustand memory | 15 min |
| Refresh Token | httpOnly cookie + hashed in DB   | 7 days |

- Cookie access token -> `proxy.ts` server-side admin guard
- Zustand access token -> `Authorization: Bearer` header for Express API calls
- Refresh token hash -> `admin_users.refresh_token_hash`
- Previous refresh token hash -> `admin_users.previous_refresh_token_hash` for concurrent refresh detection

### Cookie Config

| Flag       | Production Value                                         |
| ---------- | -------------------------------------------------------- |
| `httpOnly` | `true`                                                   |
| `secure`   | `true`                                                   |
| `sameSite` | `none` (cross-origin: `app.minan.com` <-> `api.minan.com`) |
| `domain`   | `.minan.com`                                             |
| `path`     | `/`                                                      |

Local development uses `secure: false`, `sameSite: "lax"`, and no cookie domain.

### Auth Flow

1. `POST /api/auth/login` -> argon2 verify -> issue access + refresh cookies and return access token in the response body
2. Express stores `argon2.hash(refreshToken)` on the admin user and clears `previous_refresh_token_hash`
3. Next.js stores access token in `auth.store.ts`
4. `proxy.ts` verifies the access-token cookie; when only a refresh-token cookie is present, it allows `AdminSessionProvider` to attempt recovery before protected content renders
5. API calls send `Authorization: Bearer <accessToken>` from Zustand
6. 401 -> `POST /api/auth/refresh` -> Express atomically rotates refresh-token hash and returns a new access token
7. Concurrent refresh with the immediately previous token returns `409 Concurrent token rotation`
8. `POST /api/auth/logout` clears cookies and nulls refresh-token hashes

Only the refresh token whose hash matches `refresh_token_hash` is accepted, with a narrow previous-token check for concurrent rotation. Replay of older refresh JWTs fails after rotation. Deactivated admins fail login and refresh. Because access tokens are stateless, an access token issued before deactivation can remain valid until its 15-minute expiry.

### CSRF Mitigation

- `X-Requested-With: XMLHttpRequest` is required on all state-changing requests
- The shared `apiRequest` client adds this header for non-GET requests
- Browser form posts from third-party sites cannot set this custom header
- Refresh-token rotation limits replay after a successful refresh

---

## 7. Admin Access

MINAN uses one authenticated admin model. Every active admin account has the full admin feature set: dashboard, product CRUD, category and subcategory management, lead management, uploads, and admin-user management.

### Enforcement

- JWT payload: `{ id, email }`
- Legacy JWTs may contain a `role` claim, but current code ignores it
- Express admin routes require authenticated Bearer tokens
- Admin write routes also require `X-Requested-With: XMLHttpRequest`
- `proxy.ts` reads the access-token cookie only to verify authenticated admin page access
- Do not accept role or privilege values from request bodies

### Self-Guard Rule

An admin cannot deactivate their own account:

- `PATCH /api/admin/admins/:id` rejects self `is_active: false`
- `PATCH /api/admin/admins/:id/deactivate` rejects self-deactivation
- Enforcement lives in the admins service/controller, not middleware

---

## 8. Database - MongoDB Atlas 8.3, Mongoose 9.x

### `products`

| Field                     | Type                       | Notes                         |
| ------------------------- | -------------------------- | ----------------------------- |
| `_id`                     | ObjectId                   | PK                            |
| `name`                    | String                     | required                      |
| `slug`                    | String                     | required, unique              |
| `description`             | String                     | required                      |
| `price`                   | Number                     | original price, required, min: 0 |
| `discount`                | Number                     | integer percent, default `0`, min: 0, max: 100 |
| `category_id`             | ObjectId (ref: `Category`) | required                      |
| `subcategory_id`          | ObjectId (ref: `Subcategory`) / null | optional, default `null`, indexed |
| `sizes`                   | [String]                   | default `[]`                  |
| `colors`                  | [String]                   | default `[]`                  |
| `images`                  | [String]                   | remote image URLs             |
| `is_active`               | Boolean                    | default `true`                |
| `createdAt` / `updatedAt` | Date                       | timestamps                    |

### `categories`

| Field                     | Type     | Notes              |
| ------------------------- | -------- | ------------------ |
| `_id`                     | ObjectId | PK                 |
| `name`                    | String   | required           |
| `slug`                    | String   | required, unique   |
| `image_url`               | String   | remote image URL   |
| `is_active`               | Boolean  | default `true`     |
| `createdAt` / `updatedAt` | Date     | timestamps         |

### `subcategories`

| Field                     | Type                       | Notes |
| ------------------------- | -------------------------- | ----- |
| `_id`                     | ObjectId                   | PK |
| `category_id`             | ObjectId (ref: `Category`) | required |
| `name`                    | String                     | required |
| `slug`                    | String                     | required, unique, lowercase |
| `display_order`           | Number                     | required, default `0`, min: 0 |
| `is_active`               | Boolean                    | default `true` |
| `createdAt` / `updatedAt` | Date                       | timestamps |

Subcategories are managed within the admin category experience. Public catalog filters expose active subcategories that are referenced by active products, grouped under their parent categories. A product may omit its subcategory.

### `leads`

| Field                     | Type     | Notes |
| ------------------------- | -------- | ----- |
| `_id`                     | ObjectId | PK |
| `name`                    | String   | required |
| `phone_number`            | String   | required, BD format |
| `email`                   | String   | required |
| `address`                 | String   | required |
| `notes`                   | String   | optional |
| `bkash_txn_id`            | String   | optional |
| `cart_snapshot`           | Object   | `{ items: Array<{ product_id, name, price, original_price, discount, size, color, quantity }>, total }` |
| `status`                  | String   | `pending | confirmed | cancelled`, default `pending` |
| `createdAt` / `updatedAt` | Date     | timestamps |

### `analytics_events`

| Field          | Type                       | Notes |
| -------------- | -------------------------- | ----- |
| `_id`          | ObjectId                   | PK |
| `event_type`   | String                     | `page_view | product_view | add_to_cart | checkout_start | lead_submit | whatsapp_click` |
| `event_id`     | String                     | UUID, unique, CAPI dedup key |
| `product_id`   | ObjectId (ref: `Product`)  | optional |
| `category_id`  | ObjectId (ref: `Category`) | optional |
| `session_id`   | String                     | required |
| `utm_source`   | String                     | optional |
| `utm_medium`   | String                     | optional |
| `utm_campaign` | String                     | optional |
| `createdAt`    | Date                       | timestamp only |

`analytics_events` uses `{ timestamps: { createdAt: true, updatedAt: false } }`.

### `admin_users`

| Field                         | Type        | Notes |
| ----------------------------- | ----------- | ----- |
| `_id`                         | ObjectId    | PK |
| `email`                       | String      | required, unique, lowercase |
| `password`                    | String      | argon2 hashed, never in API response |
| `is_active`                   | Boolean     | default `true` |
| `refresh_token_hash`          | String/null | selected only when needed |
| `previous_refresh_token_hash` | String/null | selected only when needed, concurrent rotation guard |
| `createdAt` / `updatedAt`     | Date        | timestamps |

### `home_banner_sets`

| Field                      | Type     | Notes |
| -------------------------- | -------- | ----- |
| `key`                      | String   | singleton key `homepage`, unique |
| `revision`                 | Number   | optimistic-concurrency revision |
| `banners`                  | Array    | ordered 1-5 items with desktop/mobile image URLs |
| `storefront_sync_pending`  | Boolean  | retry signal when cache invalidation fails |
| `pending_cleanup_urls`     | [String] | removed managed images retained until storefront sync succeeds |
| `createdAt` / `updatedAt`  | Date     | timestamps |

### Mongoose Patterns

- `timestamps: true` on all schemas except `analytics_events`
- Products support reversible deactivation through `is_active` and explicit admin-only permanent deletion; categories, subcategories, and admins remain soft-delete-only
- Product queries populate `category_id` and `subcategory_id` when their related data is needed
- Indexes: product/category/subcategory `slug`, product `subcategory_id`, subcategory `{ category_id, display_order, name }`, admin `email`, analytics `{ event_type, createdAt }`, analytics `event_id`
- `pre("save")` on admin users hashes passwords
- `toJSON` transform on admin users strips password and refresh-token hashes

---

## 9. API Routes (Express)

### Public

| Method | Route                 | Description |
| ------ | --------------------- | ----------- |
| GET    | `/api/products`       | List active products. Query params: `category`, `subcategory`, `color`, `size`, `search`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`, `exclude` |
| GET    | `/api/products/home`  | Active categories with up to seven newest active products per category and group totals |
| GET    | `/api/products/filters` | Active catalog filter options: categories with referenced subcategories, colors, sizes, and effective min/max price |
| POST   | `/api/products/quote` | Read-only availability and current discount-price quote for up to 50 submitted product IDs; duplicates are deduplicated |
| GET    | `/api/products/:slug` | Single active product by slug |
| GET    | `/api/home-banners`   | Ordered homepage banner images; empty until the singleton seed exists |
| POST   | `/api/leads`          | Submit checkout lead, CSRF-header protected, rate-limited 5 req/15 min/IP |
| POST   | `/api/analytics`      | Log analytics event and forward mapped events to Meta CAPI, CSRF-header protected, rate-limited 60 req/15 min/IP |
| POST   | `/api/whatsapp-click` | Log WhatsApp click and forward to Meta CAPI, CSRF-header protected, rate-limited 60 req/15 min/IP |
| POST   | `/api/auth/login`     | Admin login, CSRF-header protected, rate-limited 10 req/15 min/IP |
| POST   | `/api/auth/refresh`   | Rotate tokens, CSRF-header protected |
| POST   | `/api/auth/logout`    | Clear auth cookies and refresh-token hashes, CSRF-header protected |

### Health

| Method | Route     | Description |
| ------ | --------- | ----------- |
| GET    | `/health` | API health check with MongoDB connection status. Returns `200 ok` or `503 degraded` |

There is no public `GET /api/categories` route. Homepage category navigation comes from `/api/products/home`; catalog categories and referenced subcategories come from `/api/products/filters`.

The `subcategory` product filter is applied only when at least one `category` filter is also selected. Requested subcategories must be active and belong to the selected categories.

### Protected Admin

| Method | Route                                  | Role              | Description |
| ------ | -------------------------------------- | ----------------- | ----------- |
| GET    | `/api/admin/dashboard`                 | admin | Aggregated dashboard metrics for leads, product/category views, and traffic sources |
| GET    | `/api/admin/leads`                     | admin | List leads |
| GET    | `/api/admin/leads/:id`                 | admin | Get single lead |
| PATCH  | `/api/admin/leads/:id`                 | admin | Update lead status + notes |
| GET    | `/api/admin/products`                  | admin | List all products, including inactive. Query params: `search`, `category_id`, `status`, `page`, `limit` |
| POST   | `/api/admin/products`                  | admin | Create product |
| PATCH  | `/api/admin/products/:id`              | admin | Update product, including `is_active: true` reactivation |
| PATCH  | `/api/admin/products/:id/deactivate`   | admin | Soft delete |
| DELETE | `/api/admin/products/:id`              | admin | Permanently delete a product and clean up its unreferenced managed Cloudinary images |
| GET    | `/api/admin/categories`                | admin | List all categories |
| POST   | `/api/admin/categories`                | admin | Create category |
| PATCH  | `/api/admin/categories/:id`            | admin | Update category, including `is_active: true` reactivation |
| PATCH  | `/api/admin/categories/:id/deactivate` | admin | Soft delete, blocked when active products reference the category |
| GET    | `/api/admin/subcategories`             | admin | List subcategories, optionally filtered by `category_id` |
| POST   | `/api/admin/subcategories`             | admin | Create a subcategory under a category |
| PATCH  | `/api/admin/subcategories/reorder`     | admin | Replace the complete display order for a category's subcategories |
| PATCH  | `/api/admin/subcategories/:id`         | admin | Update subcategory name or slug |
| PATCH  | `/api/admin/subcategories/:id/deactivate` | admin | Soft deactivate, blocked when active products reference the subcategory |
| PATCH  | `/api/admin/subcategories/:id/reactivate` | admin | Reactivate a subcategory |
| GET    | `/api/admin/admins`                    | admin | List admins |
| POST   | `/api/admin/admins`                    | admin | Create admin |
| PATCH  | `/api/admin/admins/:id`                | admin | Update admin, including `is_active: true` reactivation |
| PATCH  | `/api/admin/admins/:id/deactivate`     | admin | Soft disable |
| GET    | `/api/admin/uploads/signature`         | admin | Get Cloudinary signed upload params |
| POST   | `/api/admin/uploads/delete`            | admin | Delete unreferenced managed Cloudinary uploads by public ID |
| GET    | `/api/admin/home-banners`              | admin | Get the versioned ordered banner set and sync state |
| POST   | `/api/admin/home-banners`              | admin | Append a banner using `expected_revision`, maximum five |
| PATCH  | `/api/admin/home-banners/reorder`      | admin | Replace the complete order using `expected_revision` |
| POST   | `/api/admin/home-banners/sync`         | admin | Retry storefront invalidation and deferred media cleanup |
| PATCH  | `/api/admin/home-banners/:id`          | admin | Replace one or both responsive images using `expected_revision` |
| DELETE | `/api/admin/home-banners/:id`          | admin | Remove a banner using `expected_revision`; the final banner is protected |

Admin write routes require `requireAuth` and `requireCsrfHeader`.

---

## 10. Pages / Routes

| Route               | Page                | Access            |
| ------------------- | ------------------- | ----------------- |
| `/`                 | Home                | Public            |
| `/products`         | Product Listing     | Public            |
| `/products/[slug]`  | Product Detail      | Public            |
| `/cart`             | Cart                | Public            |
| `/checkout`         | Checkout            | Public            |
| `/checkout/buy-now` | Buy-now Checkout    | Public            |
| `/admin/login`      | Admin Login         | Public            |
| `/admin`            | Dashboard           | Admin             |
| `/admin/products`   | Product Management  | Admin             |
| `/admin/categories` | Category Management | Admin             |
| `/admin/home-banners` | Homepage Banner Management | Admin        |
| `/admin/leads`      | Lead Management     | Admin             |
| `/admin/admins`     | Admin Management    | Admin             |

`/admin/login` lives under the public route group at `app/(public)/admin/login/page.tsx`. Protected admin routes live under `app/(admin)/admin/`.

---

## 11. Frontend Structure Rules

- `app/(public)/` contains storefront routes.
- `app/(admin)/admin/` contains protected admin routes and the admin shell layout.
- `app/(public)/admin/login/page.tsx` is public so unauthenticated admins can reach it.
- Public layout chrome is `components/layouts/PublicChrome.tsx`.
- Admin layout chrome is `components/layouts/AdminShell.tsx`.
- `features/<domain>/` colocates domain components, hooks, actions, services, schemas, and types.
- `features/<domain>/actions/*.actions.ts` are plain async functions calling Express. No `"use server"`.
- `components/ui/` is shadcn/ui output.
- `lib/api/client.ts` is the fetch wrapper. Do not use axios.
- `features/products/services/product.cache.ts` owns the storefront Cache Component functions. They use `"use cache"`, the shared `catalog` tag, and the `days` cache-life profile.
- `next.config.ts` rewrites `/api/:path*` to `API_PROXY_TARGET`, defaulting to `http://localhost:3001`.
- `lib/analytics/pixel.ts` contains client-side Meta Pixel helpers only. CAPI is Express-only.
- `store/auth.store.ts` keeps the access token in memory only.
- `store/cart.store.ts` keeps cart items in Zustand and persists selected cart lines to browser `localStorage`.

---

## 12. Checkout / Lead Form

| Field          | Type     | Required | Notes |
| -------------- | -------- | -------- | ----- |
| `name`         | text     | yes      | min 2, max 80 |
| `phone_number` | text     | yes      | BD regex `/^(?:\+?88)?01[3-9]\d{8}$/` |
| `email`        | email    | yes      | valid email |
| `address`      | textarea | yes      | min 8, max 400 |
| `notes`        | textarea | no       | max 500 |
| `bkash_txn_id` | text     | no       | manual admin verification, max 80 |

`POST /api/leads` is rate-limited to 5 req / 15 min / IP.

---

## 13. MVP Features

- Animated UI with GSAP, responsive, mobile-first
- Product categories: T-Shirts, Shirts, Pants, Footwear, Accessories, Women, Kids
- WhatsApp ordering from PDP with pre-filled message and `/api/whatsapp-click`
- Cart stored in Zustand and persisted to browser `localStorage`
- Product catalog supports multi-select category/subcategory/color/size filters, effective min/max price filters, sort (`newest`, `price-asc`, `price-desc`, `name-asc`), URL-backed state, and infinite scroll
- Products support integer percentage discounts. APIs retain the original `price` and expose the rounded `discounted_price`; storefront cards, PDP, cart, buy-now, and verified lead snapshots use the effective discounted price.
- Header search provides debounced product suggestions and links submitted searches to `/products?search=...`
- Checkout lead form writes to MongoDB `leads`
- Checkout verifies cart products, prices, sizes, and colors server-side before persisting the lead snapshot
- Authenticated admin management for products, categories, ordered subcategories, leads, admins, and managed uploads
- Versioned homepage banner management with 16:9 desktop and 4:5 mobile Cloudinary assets, atomic ordering, and deferred cleanup
- Dashboard aggregates Bangladesh-local daily/monthly leads, top viewed product/category, and traffic sources
- Vercel Speed Insights is mounted in the root frontend layout

---

## 14. Analytics & Tracking

Analytics is partially implemented. Keep current/live behavior separate from planned wiring.

### Tool Matrix

| Tool               | Fires From     | Role                                      | Status |
| ------------------ | -------------- | ----------------------------------------- | ------ |
| Meta Pixel helpers | Next.js client | `fbq("track")` helpers                    | Partial - helpers exist, no global bootstrap script |
| Meta CAPI          | Express        | Server-side mapped events                 | Implemented for events posted to analytics endpoints |
| GA4                | Next.js client | Traffic and conversion analytics          | Planned |
| Microsoft Clarity  | Next.js client | Session recordings and heatmaps           | Planned |
| `analytics_events` | Express        | First-party MongoDB analytics log         | Implemented |

### Current Event Status

| Event            | Client Pixel | Express CAPI | Status |
| ---------------- | ------------ | ------------ | ------ |
| `page_view`      | planned      | no           | Planned |
| `product_view`   | helper-ready | endpoint-ready | Planned wiring |
| `add_to_cart`    | helper-ready | endpoint-ready | Planned wiring |
| `checkout_start` | helper-ready | endpoint-ready | Planned wiring |
| `lead_submit`    | no           | backend-ready | Not fired by `POST /api/leads` yet |
| `whatsapp_click` | yes          | yes          | Live |

### Deduplication Pattern

For deduped events:

1. Client generates `event_id` with `crypto.randomUUID()`
2. Client fires Meta Pixel with `event_id`
3. Client POSTs to Express with the same `event_id`
4. Express writes `analytics_events` and forwards to Meta CAPI
5. Meta deduplicates on matching `event_id`

Current end-to-end live path: `whatsapp_click`.

Duplicate analytics `event_id` values are ignored before insert, so retries do not create duplicate MongoDB analytics rows.

---

## 15. Performance

- Mobile-first, optimized for Bangladesh 3G/4G users
- Public home/catalog/product pages use explicit `"use cache"` Cache Component functions with `cacheLife("days")` and the shared `catalog` cache tag.
- Homepage banners use the separate `home-banners` cache tag with a short cache life and bundled local fallback assets.
- Product, category, and subcategory admin writes trigger Express-to-Next revalidation with `revalidateTag("catalog", { expire: 0 })`.
- Catalog page server-renders the first page and filter options, then the client hook loads more pages with a page size of 20
- Turbopack in development
- MongoDB indexes: product/category/subcategory `slug`, product `subcategory_id`, subcategory `{ category_id, display_order, name }`, admin `email`, analytics `{ event_type, createdAt }`, analytics `event_id`
- GSAP animation should stay on `transform` and `opacity`
- Render cold start mitigation can use a keep-alive ping if on free-tier instances

---

## 16. Security

| Concern          | Mitigation |
| ---------------- | ---------- |
| XSS token theft  | httpOnly cookies for browser-stored tokens |
| CSRF             | `X-Requested-With: XMLHttpRequest` on state-changing requests |
| Password storage | argon2 |
| Refresh replay   | server-side refresh-token hash rotation |
| Token expiry     | Access: 15 min; Refresh: 7 days |
| Brute force      | rate-limit `/api/auth/login` |
| Checkout spam    | rate-limit `/api/leads` |
| HTTP headers     | `helmet` |
| CORS             | specific `ALLOWED_ORIGINS`, credentials enabled, never `*` |
| Password leak    | Mongoose `toJSON` strips `password` |
| Privilege escalation | Single admin access model; never accept role or privilege values from request body |

---

## 17. Deployment & Env Vars

| Service  | Platform              | Domain          |
| -------- | --------------------- | --------------- |
| Frontend | Vercel                | `app.minan.com` |
| Backend  | Render, Node 24.16.0  | `api.minan.com` |
| Database | MongoDB Atlas 8.3     | -               |
| Images   | Cloudinary            | -               |

Custom domains are required for production admin cookie auth.

Admin role removal changed the auth and admin-user payload shapes. Deploy the API and web app in the same release window; old web against new API or new web against old API can break admin refresh/admin-user forms. Existing legacy JWTs that still include `role` are tolerated by the new parser as long as they contain valid `id` and `email` claims.

### Frontend `.env.local`

```env
API_PROXY_TARGET=https://api.minan.com
JWT_ACCESS_SECRET=<same value as API>
REVALIDATE_SECRET=<same value as STOREFRONT_REVALIDATE_SECRET>
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_WHATSAPP_NUMBER=01XXXXXXXXX
```

- `API_PROXY_TARGET` is used by both `next.config.ts` rewrites and `lib/api/client.ts`.
- `JWT_ACCESS_SECRET` is required by `proxy.ts` to verify access-token cookies.

### Backend `.env`

```env
PORT=3001
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
AUTH_COOKIE_DOMAIN=.minan.com
ALLOWED_ORIGINS=http://localhost:3000,https://minan-web.vercel.app, https://minanclothing.com
META_CAPI_TOKEN=
META_PIXEL_ID=
CLOUDINARY_URL=
CLOUDINARY_UPLOAD_FOLDER=
CLOUDINARY_HOME_BANNER_UPLOAD_PRESET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
NODE_ENV=
STOREFRONT_REVALIDATE_URL=https://app.minan.com/api/revalidate
STOREFRONT_REVALIDATE_SECRET=<same value as REVALIDATE_SECRET>
```

- `AUTH_COOKIE_DOMAIN` should be `.minan.com` in production when frontend and backend share the parent domain.
- `seed:admin` upserts by `ADMIN_EMAIL`. Rerunning it updates that admin's password and `is_active: true`.
- `cleanup:admin-roles` is an optional post-deploy hygiene script that removes legacy `role` fields from `admin_users`; stale role fields are ignored by current code.
- `STOREFRONT_REVALIDATE_URL` and `STOREFRONT_REVALIDATE_SECRET` let admin product/category writes expire the public storefront cache without blocking or rolling back the saved mutation on webhook failure.
- `CLOUDINARY_HOME_BANNER_UPLOAD_PRESET` names a signed preset configured for JPEG/PNG/WebP images with a 5 MB maximum. Banner signature requests return `503` until it is configured.
- Run `npm --workspace @minan/api run seed:home-banners` after the API deploy and before the banner-backed web release. The command atomically creates the two local fallback banners only when the singleton is absent.

---

## 18. Admin Dashboard Metrics

`GET /api/admin/dashboard` returns live MongoDB aggregations. Day and month boundaries use Bangladesh time (UTC+6).

| Metric              | Implemented Query |
| ------------------- | -------------- |
| Today's Leads       | `leads` count by current day |
| This Month's Leads  | `leads` count by current month |
| Most Viewed Product | `analytics_events` product_view aggregation by `product_id` |
| Top Category        | `analytics_events` product_view aggregation by `category_id` |
| Traffic Source      | `analytics_events` aggregation by `utm_source` |

Top product and category IDs are resolved to their current names. Missing view data returns `null`, and missing/blank `utm_source` values are labeled `direct`. Traffic sources are sorted by event count and limited to eight rows.

---

## 19. Future Roadmap

- Payment Gateway (bKash API, SSLCommerz)
- Order Management
- Customer Accounts
- Inventory per SKU
- Coupons, Reviews, Recommendations
- Marketing Automation (email/SMS)
- Advanced Analytics, Order Tracking

---

## 20. Backend Structure Rules

- `apps/api/src/models/` contains Mongoose models: products, categories, subcategories, leads, analytics events, admins.
- `apps/api/src/schemas/` contains backend Zod schemas. Backend schemas are independent from frontend schemas.
- `apps/api/src/services/` owns business logic and DB access.
- `apps/api/src/controllers/` owns Express request/response handling.
- `apps/api/src/routes/` declares route wiring and middleware order.
- `apps/api/src/middleware/` owns auth, CSRF, and error middleware.
- `apps/api/src/lib/` owns shared backend helpers such as tokens, Cloudinary, Meta CAPI, slugify, pagination, and Mongo error handling.
- `apps/api/src/utils/` owns response serializers.
- Public routers: products (catalog, home groups, filters, quotes, PDP), leads, analytics, whatsapp-click, auth.
- Admin router is mounted at `/api/admin`.
- All admin routes require a valid Bearer access token. Admin `is_active` status is enforced during login and refresh rather than through a database lookup on every request.
- All admin writes require auth and CSRF header.
- Slugs are generated through `lib/slugify.ts`; duplicate slugs resolve with suffixes in current admin services.
- Admin serializers and model transforms must never expose password or refresh-token hashes.

---

## 21. Cloudinary Image Upload Flow

Admin image uploads use a signed upload pattern: Express generates the signature, the browser posts the file directly to Cloudinary, and only the resulting `secure_url` is stored in MongoDB.

```mermaid
sequenceDiagram
    participant UI as Admin Form
    participant API as Express
    participant CL as Cloudinary
    UI->>API: GET /api/admin/uploads/signature (Bearer)
    API-->>UI: { timestamp, signature, apiKey, cloudName, folder, uploadPreset? }
    UI->>CL: POST FormData + signature
    CL-->>UI: { secure_url, ... }
    UI->>API: POST/PATCH product|category { ..., images: [secure_url] }
```

**Frontend:** `lib/cloudinary/upload.ts` orchestrates the flow using `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
**Backend:** `lib/cloudinary.ts` signs the upload using `CLOUDINARY_URL`; optional folder via `CLOUDINARY_UPLOAD_FOLDER`.
**Storage:** Only remote URL strings are persisted in MongoDB. Never store local paths or base64.

### Managed Image Cleanup

- Product and category updates compare previous and next managed Cloudinary URLs and delete removed images only when they are no longer referenced anywhere in the catalog.
- Permanent product deletion attempts the same unreferenced managed-image cleanup after removing the MongoDB record.
- The admin uploader can call `POST /api/admin/uploads/delete` to clean up abandoned session uploads by public ID.
- Cleanup is restricted to the configured managed upload folder. Referenced images are retained, and Cloudinary cleanup failures do not roll back an already-saved product or category mutation.
