# Authentication, Admin & Security Guide

## 1. Concept & Overview
MINAN separates admin operations from customer accounts. Admin operators log in via `/admin/login`. Authentication uses a dual JWT system with short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days). In production, refresh tokens rotate automatically on each refresh and their hashes are stored in MongoDB. Next.js 16 uses `apps/web/src/proxy.ts` to protect admin routes on the server.

## 2. Visual Authentication Flow

```
Admin Browser                          Next.js proxy.ts                Express API
     │                                        │                             │
     ├── 1. POST /api/auth/login ─────────────┼────────────────────────────>│
     │      (Email & Password)                │                             │
     │                                        │                             ├── Validates with Argon2
     │<── 2. Sets httpOnly cookies: access_token (15m) & refresh_token (7d)─┤
     │       Returns accessToken in response body                           │
     │                                        │                             │
     ├── 3. Navigates to /admin/orders ──────>│                             │
     │                                        ├── Checks access_token       │
     │                                        ├── Valid -> Render Page      │
     │                                        └── Expired -> Check refresh  │
     │                                            └── Found: Allow layout   │
     │                                                to call /auth/refresh │
     │                                                                      │
     ├── 4. Token Expired During Admin Session                              │
     │      └── AdminSessionProvider calls POST /api/auth/refresh ─────────>│
     │      └── Express rotates refresh token hash and returns new tokens ──┤
```

## 3. Strict Technical Specifications

### Admin Account Model
MINAN uses a single admin account model (`apps/api/src/models/AdminUser.ts`). Every active admin has full management capabilities (dashboard, product catalog, categories, subcategories, order fulfillment, banners, uploads, and admin account creation).
*Note:* There are **no** `staff` or `super_admin` roles. Role-based claims are not used.

### Self-Guard Rule
An admin cannot deactivate or soft-delete their own account:
- `PATCH /api/admin/admins/:id` rejects self `is_active: false`.
- `PATCH /api/admin/admins/:id/deactivate` rejects self-deactivation.

---

### Dual JWT Token Architecture

| Token Type | Lifespan | Storage Location | Payload Contents | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Access Token** | 15 minutes | In-memory Zustand store + Cookie (`access_token`) | `{ id, email, session_version, actor: "admin", aud: "minan-admin" }` | Authorizes API calls via `Authorization: Bearer <token>`. Verified by `proxy.ts` on page loads. |
| **Admin Refresh Token**| 7 days | HTTP-only Cookie (`refresh_token`) | `{ id, email, session_version, actor: "admin", aud: "minan-admin" }` | Rotated atomically on `/api/auth/refresh`. Hash stored in `admin_users.refresh_token_hash`. |
| **Customer Access Token** | 15 minutes | Cookie (`customer_access_token`) | `{ id, email, session_version, session_id, actor: "customer", aud: "minan-customer" }` | Authorizes customer order history lookups. |
| **Customer Refresh Token**| 7 days | Cookie (`customer_refresh_token`) | Same customer payload | Hash stored in `customer_sessions`. |

---

### Cookie Configuration Rules

Production cookies use the following settings (`apps/api/src/config/auth.ts`):
```typescript
res.cookie("access_token", accessToken, {
  httpOnly: true,
  secure: true, // Requires HTTPS in production
  sameSite: "none", // Required for cross-origin credentials (Vercel frontend -> Render API)
  path: "/", // Cookie must be available for all routes, including /admin
  maxAge: 15 * 60 * 1000,
});

res.cookie("refresh_token", refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

#### Cookie Domain Guidelines
- **Default Deployment Domains (`*.vercel.app` & `*.onrender.com`):** Leave `AUTH_COOKIE_DOMAIN` **unset**. Express emits host-only cookies for the caller, and Next.js proxy rewrites pass them cleanly.
- **Do NOT set `AUTH_COOKIE_DOMAIN=.minan.com` on Vercel preview or default domains.** Browsers reject cookies if the domain suffix does not match the page origin.
- **Custom Production Subdomains (`minan.com`):** Set `AUTH_COOKIE_DOMAIN=.minan.com` only after purchasing and configuring custom subdomains on both frontend and API.

---

### `proxy.ts` Routing Guard (`apps/web/src/proxy.ts`)
Next.js 16 protects admin pages through `proxy.ts`:
- **Location:** `apps/web/src/proxy.ts` (Never create `middleware.ts`).
- **Matcher:** `/admin/:path*` (excluding `/admin/login`).
- **Behavior:**
  1. Checks for the `access_token` cookie. If valid, request proceeds to the page.
  2. If `access_token` is expired or missing, but `refresh_token` exists, `proxy.ts` lets the request pass so `AdminSessionProvider` in `app/(admin)/admin/layout.tsx` can attempt silent background token refresh via `POST /api/auth/refresh`.
  3. If neither token is present, `proxy.ts` redirects to `/admin/login?next=<path>&reauth=1`.
  4. The parameter `reauth=1` bypasses login-to-dashboard redirects so administrators can re-authenticate cleanly.

---

### CSRF Protection
All state-changing endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) require the following header:
```http
X-Requested-With: XMLHttpRequest
```
The shared API fetcher (`apps/web/src/lib/api/client.ts`) attaches this header automatically for non-GET requests.

---

### Admin Dashboard Metrics
The endpoint `GET /api/admin/dashboard` returns real-time business and workflow metrics:
- Sales summary: monthly revenue, total revenue, monthly growth percentage, total orders.
- Order status counts: `new`, `confirmed`, `processing`, `shipped`, `delivered`, `on_hold`, `cancelled`, `returned`, `exchanged`.
- Delivery fee status & COD collection balances.
- Best-selling products with 7-day sparklines.
- Low stock inventory alerts.
- Customer location insights (Inside Sylhet vs Outside Sylhet).

---

### Order Activity Audit Trail
There is **no** separate `AuditLog` collection. Audit history is stored directly inside each order's `activity` array (`OrderActivity` in `apps/api/src/models/Order.ts`):
```typescript
interface OrderActivity {
  action: string; // e.g. "order.transition", "payment.reconcile"
  timestamp: Date;
  actor_admin_id?: Types.ObjectId | null;
  actor_email?: string | null;
  note?: string | null;
  customer_note?: string | null;
  system_event?: boolean;
}
```

---

## 4. Common Beginner Pitfalls & Mistakes to Avoid

- **Mistake:** Setting cookie path to `/api/auth`.
  **Fix:** Next.js `proxy.ts` guards `/admin` pages on the server. If cookie path is restricted to `/api/auth`, the browser will not send the cookie on `/admin` requests, breaking authentication. Cookie path must be `/`.
- **Mistake:** Setting cookie `sameSite: "strict"` in production across different domains.
  **Fix:** When the storefront is on Vercel and the API is on Render, `sameSite` must be `"none"` and `secure` must be `true`.
- **Mistake:** Inventing role checks (e.g., `req.user.role === "super_admin"`).
  **Fix:** MINAN has a single admin model without role tiers. Any active admin has access to all admin routes.
- **Mistake:** Calling `GET /api/admin/metrics`.
  **Fix:** The real dashboard endpoint is `GET /api/admin/dashboard`.
