# Backend API Architecture Guide (`apps/api`)

## 1. Concept & Overview
`apps/api` is an Express 5 application on Node 24. It is the only component in the architecture that connects to MongoDB Atlas. It handles authentication, catalog queries, order creation, bKash payment verification, and Meta Conversions API (CAPI) events. Next.js proxies client calls from `/api/*` to this service.

## 2. Visual Architecture & Request Flow

```
Next.js Proxy Rewrite (or Direct Client)
                 │
                 ▼
        [Express Middlewares]
         - Helmet (Security headers)
         - CORS (ALLOWED_ORIGINS)
         - CSRF Check (requireCsrfHeader: X-Requested-With === "XMLHttpRequest")
         - Rate Limiter (IP-based throttling)
         - Auth Guard (requireAuth / requireCustomerAuth)
                 │
                 ▼
        [Controller Layer]
         - Parses inputs and validates with Zod
         - Invokes services and sends JSON responses
                 │
                 ▼
        [Service Layer]
         - Business logic (allocate order number, verify bKash token)
         - External APIs (bKash, Cloudinary, Meta Graph API)
                 │
                 ▼
        [Mongoose Models]
         - MongoDB Atlas queries and atomic updates
```

## 3. Strict Technical Specifications

### Server Framework & Boundaries
- **Runtime:** Node 24.16.0 on Render.
- **Framework:** Express 5.2.1.
- **CORS:** Only allows origins listed in comma-separated `ALLOWED_ORIGINS`. Requests without an Origin header (e.g. server-to-server) are allowed. Credentials enabled (`credentials: true`).
- **CSRF Protection:** All state-changing methods (`POST`, `PUT`, `PATCH`, `DELETE`) require the HTTP header:
  ```http
  X-Requested-With: XMLHttpRequest
  ```
- **Response Format:** Express controllers return specific operational JSON shapes. There is **no** universal `{ success: true, data: ... }` envelope. Real shapes returned include:
  - `{ data: ... }` for catalog entities
  - `{ order: ... }` or `{ orders: ... }` for order endpoints
  - `{ accessToken: ... }` for auth refresh
  - `{ ok: true }` for acknowledgments
  - `{ error: string }` or `{ errors: [...] }` on error responses (HTTP 400, 401, 403, 404, 409, 500)

---

### Complete API Route Catalog

#### Public Routes
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | List active products. Query params: `category`, `subcategory`, `color`, `size`, `search`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`, `exclude`. |
| `GET` | `/api/products/home` | Active categories with up to 7 newest active products per category and group totals. |
| `GET` | `/api/products/filters`| Active catalog filter options: categories with referenced subcategories, colors, sizes, min/max price. |
| `POST` | `/api/products/quote` | Read-only availability and current discount-price quote for up to 50 product IDs. |
| `GET` | `/api/products/:slug` | Single active product by slug. |
| `GET` | `/api/home-banners` | Ordered homepage banners with responsive images and alt text. |
| `GET` | `/api/checkout/config` | Authoritative shipping options, BDT fees, and non-refundable delivery fee policy. |
| `POST` | `/api/bkash/payments` | **Order Creation Route.** Creates or retrieves an Order with frozen totals. Captures Meta cookies (`_fbp`, `_fbc`), client IP, and user agent for attribution tracking. |
| `GET` | `/api/bkash/callback` | Reconciles provider redirect after bKash payment. |
| `GET` | `/api/bkash/harness-callback`| Authorization confirmation page for bKash UAT harness. |
| `POST` | `/api/bkash/results/resolve` | Resolves an opaque result reference to Order number, fee, COD, and transaction details. |
| `POST` | `/api/bkash/payments/retry` | Creates another attempt for the same frozen payment purpose and amount from a retry token. |
| `POST` | `/api/analytics` | Logs analytics event and forwards mapped events to Meta CAPI. Rate-limited (60 req/15 min/IP). |
| `POST` | `/api/whatsapp-click` | Logs WhatsApp click and forwards to Meta CAPI. Rate-limited (60 req/15 min/IP). |
| `POST` | `/api/order-tracking/search`| Public Order search by order number or paginated mobile number lookup. Rate-limited. |
| `POST` | `/api/auth/login` | Admin login. Returns access token in body and sets HTTP-only cookies. Rate-limited (10 req/15 min/IP). |
| `POST` | `/api/auth/refresh` | Rotates admin access and refresh tokens. |
| `POST` | `/api/auth/logout` | Clears auth cookies and invalidates refresh token hash. |
| `POST` | `/api/customer-auth/login` | Customer login. Sets customer session cookies. Rate-limited (10 req/15 min/IP). |
| `POST` | `/api/customer-auth/refresh`| Rotates customer session cookies. Rate-limited (30 req/15 min/IP). |
| `POST` | `/api/customer-auth/logout` | Clears customer cookies and revokes session. |
| `GET` | `/api/customer-auth/me` | Current authenticated customer profile. |
| `GET` | `/api/customer-orders` | Paginated orders owned by the authenticated customer. |
| `GET` | `/api/customer-orders/:orderNumber`| Single order owned by the authenticated customer. |

#### Health Route
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | API health check with MongoDB connection status (`200 ok` or `503 degraded`). |

#### Protected Admin Routes (Require `requireAuth` & `requireCsrfHeader`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard` | Sales summary, 7D/30D chart series, inventory snapshot, best-sellers, customer insights, workflow metrics. |
| `GET` | `/api/admin/orders` | Paginated order summaries with search and status filtering. |
| `GET` | `/api/admin/orders/changes` | Opaque-cursor polling for new orders. |
| `GET` | `/api/admin/orders/export` | Filtered, injection-safe UTF-8 CSV export (10,000-row cap). |
| `GET` | `/api/admin/orders/:id` | Full Order document, embedded activity audit trail, refunds, and payment attempts. |
| `PATCH/POST`| `/api/admin/orders/:id/*` | Order mutations: customer info, workflow transition, courier tracking, COD, timeline notes, refunds, exchanges. |
| `GET` | `/api/admin/products` | List all products (including inactive). Query params: `search`, `category_id`, `status`, `page`, `limit`. |
| `POST` | `/api/admin/products` | Create a product. |
| `PATCH` | `/api/admin/products/:id` | Update product details, pricing, discount, and variants. |
| `PATCH` | `/api/admin/products/:id/deactivate` | Soft-delete product (`is_active: false`). |
| `DELETE`| `/api/admin/products/:id` | Permanently delete product and delete unreferenced managed Cloudinary images. |
| `GET` | `/api/admin/categories` | List all categories. |
| `POST` | `/api/admin/categories` | Create a category. |
| `PATCH` | `/api/admin/categories/:id` | Update category name, slug, or image. |
| `PATCH` | `/api/admin/categories/:id/deactivate` | Soft-delete category (blocked if active products reference it). |
| `GET` | `/api/admin/subcategories` | List subcategories (optionally filtered by `category_id`). |
| `POST` | `/api/admin/subcategories` | Create a subcategory under a category. |
| `PATCH` | `/api/admin/subcategories/reorder` | Replace complete display order for a category's subcategories. |
| `PATCH` | `/api/admin/subcategories/:id` | Update subcategory name or slug. |
| `PATCH` | `/api/admin/subcategories/:id/deactivate`| Soft-deactivate subcategory. |
| `PATCH` | `/api/admin/subcategories/:id/reactivate`| Reactivate subcategory. |
| `GET` | `/api/admin/admins` | List admin user accounts. |
| `POST` | `/api/admin/admins` | Create an admin user account. |
| `PATCH` | `/api/admin/admins/:id` | Update admin account (active status, password). |
| `PATCH` | `/api/admin/admins/:id/deactivate` | Soft-disable admin account. |
| `GET` | `/api/admin/uploads/signature` | Generate Cloudinary signed upload parameters. |
| `POST` | `/api/admin/uploads/delete` | Delete unreferenced managed Cloudinary uploads by public ID. |
| `GET` | `/api/admin/home-banners` | Get the versioned ordered banner set and sync state. |
| `POST` | `/api/admin/home-banners` | Append a banner with alt text, desktop/mobile images, and optimistic revision check. |
| `PATCH` | `/api/admin/home-banners/reorder` | Replace banner order using `expected_revision`. |
| `POST` | `/api/admin/home-banners/sync` | Retry storefront cache revalidation and cleanup. |
| `PATCH` | `/api/admin/home-banners/:id` | Update banner alt text or images using `expected_revision`. |
| `DELETE`| `/api/admin/home-banners/:id` | Remove a banner using `expected_revision` (final banner is protected). |

---

## 4. Common Beginner Pitfalls & Mistakes to Avoid

- **Mistake:** Sending order creation to `POST /api/orders` or `POST /api/checkout`.
  **Fix:** Order creation in MINAN is exclusively handled at `POST /api/bkash/payments`. The `checkoutRouter` only serves `GET /api/checkout/config`.
- **Mistake:** Omitting the CSRF header on POST/PATCH requests.
  **Fix:** Express rejects any state-changing request with `403 Forbidden` if `X-Requested-With: XMLHttpRequest` is missing.
- **Mistake:** Assuming all API responses wrap payload in `{ success: true, data: ... }`.
  **Fix:** Different controllers return domain-specific shapes (`{ order }`, `{ data }`, `{ ok: true }`). Unpack the response according to the endpoint specification.
- **Mistake:** Calling `/api/collections` for category lists.
  **Fix:** There is no `/api/collections` endpoint. Public category navigation is loaded from `/api/products/home` and `/api/products/filters`.
