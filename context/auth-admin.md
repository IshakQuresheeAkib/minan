# Authentication, Admin & Security Guide

## 1. Plain Concept & Overview
This document explains how admin and staff members log in securely and manage the store. We use a dual JSON Web Token (JWT) system. A short-lived access token authorizes API requests, while a long-lived refresh token stays safely locked inside an HTTP-only browser cookie. Next.js 16 uses `proxy.ts` to block unauthorized users before private admin pages load in the browser.

## 2. Visual Authentication Flow

```
Admin Browser                          Next.js proxy.ts                Express API
     │                                        │                             │
     ├── 1. POST /api/auth/login ─────────────┼────────────────────────────>│
     │      (Email & Password)                │                             │
     │                                        │                             ├── Validates with Argon2
     │<── 2. Returns Access Token (15m) + Sets HTTP-only Refresh Cookie (7d)─┤
     │
     ├── 3. Navigates to /admin/orders ──────>│                             │
     │                                        ├── Checks session cookie     │
     │                                        ├── Valid -> Render Page      │
     │                                        └── Expired -> /admin/login   │
     │
     ├── 4. Token Expires (15 mins later)
     │      └── Client automatically calls POST /api/auth/refresh
     │      └── Express validates refresh cookie and returns new Access Token
```

## 3. Strict Technical Specifications

### Dual JWT Token Architecture
| Token Type | Lifespan | Storage Location | Payload Contents | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Access Token** | 15 minutes | In-memory (Client state) / Header | `{ userId, email, role }` | Sent as `Authorization: Bearer <token>` on API requests. |
| **Refresh Token**| 7 days | HTTP-only Cookie (`refreshToken`) | `{ userId, tokenVersion }` | Stored securely; traded for a new access token when it expires. |

### Cookie Configuration Rules
Refresh cookies must always be set with these security attributes:
```typescript
res.cookie("refreshToken", token, {
  httpOnly: true, // Prevents malicious JavaScript / XSS from stealing the token
  secure: process.env.NODE_ENV === "production", // Enforces HTTPS in production
  sameSite: "strict", // Prevents Cross-Site Request Forgery (CSRF)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: "/api/auth", // Cookie is only sent to auth endpoints
  // Leave domain undefined when deploying frontend on vercel.app and backend on onrender.com
});
```

### Cookie Domain Warning for Deployments
- When running on default platform domains (`your-app.vercel.app` and `your-api.onrender.com`), leave `AUTH_COOKIE_DOMAIN` **unset**. Express then issues host-only cookies, and Next.js rewrites proxy calls cleanly.
- **Do NOT set `AUTH_COOKIE_DOMAIN=.minan.com` while testing on `*.vercel.app`**. Browsers reject the cookie because the domain does not match, breaking admin login sessions.
- Set `AUTH_COOKIE_DOMAIN=.minan.com` only after purchasing and connecting custom subdomains (e.g. `app.minan.com` and `api.minan.com`).

---

### `proxy.ts` Routing Guard (`apps/web/src/proxy.ts`)
Next.js 16 protects admin pages through `proxy.ts`:
- **Location:** `apps/web/src/proxy.ts` (Never create `middleware.ts`).
- **Matcher:** `/admin/:path*` (excluding `/admin/login`, `/admin/forgot-password`, `/admin/reset-password`).
- **Behavior:**
  1. If an access-token cookie exists and is valid, the request proceeds to the page.
  2. If the access token is missing or expired, but a refresh-token cookie exists, `proxy.ts` lets the request reach `AdminSessionProvider` to attempt silent background recovery.
  3. If no tokens exist, `proxy.ts` redirects to `/admin/login?next=<path>&reauth=1`.
  4. The parameter `reauth=1` bypasses any login-to-dashboard redirects so users can re-enter their credentials cleanly.

---

### Role-Based Access Control (RBAC)
We enforce two user roles in `apps/api`:
| Feature / Action | `staff` | `super_admin` |
| :--- | :---: | :---: |
| View Metrics Dashboard | Allowed | Allowed |
| View & Filter Orders | Allowed | Allowed |
| Update Order Status (`shipped`, `delivered`, etc.) | Allowed | Allowed |
| Manage Products & Collections (Create, Edit) | Allowed | Allowed |
| Generate Cloudinary Upload Signatures | Allowed | Allowed |
| Manage Staff Accounts (Create, Deactivate) | Denied (403 Forbidden) | Allowed |
| View Immutable Audit Logs | Denied (403 Forbidden) | Allowed |
| Modify Store Settings & Delivery Fees | Denied (403 Forbidden) | Allowed |

---

### Admin Dashboard KPI Calculations
The endpoint `GET /api/admin/metrics` returns key business indicators:
- **Total Revenue:** Sum of `pricing.total` for orders where `orderStatus` is `confirmed`, `processing`, `shipped`, or `delivered`.
- **Delivered Revenue:** Sum of `pricing.total` for orders where `orderStatus` is `delivered`.
- **Advance Fees Collected:** Sum of `pricing.advancePaid` for orders with successful bKash payments.
- **Pending Courier Cash:** Sum of `pricing.dueAmount` for orders currently in `shipped` status.
- **Average Order Value (AOV):** `Total Revenue / Total Non-Cancelled Orders`.
- **Order Breakdown:** Count of orders grouped by status (`pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `returned`).

---

### Audit Logging
Every action that modifies an order, product, staff member, or store setting automatically creates a document in the `AuditLog` collection:
```typescript
await AuditLog.create({
  action: "order.status_update",
  entityType: "order",
  entityId: order._id.toString(),
  performedBy: req.user._id,
  performedByEmail: req.user.email,
  changes: {
    oldStatus: previousStatus,
    newStatus: nextStatus,
  },
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
  timestamp: new Date(),
});
```

## 4. Beginner Pitfalls & Common Mistakes to Avoid

- **Mistake:** Storing JWT access tokens in browser `localStorage`.
  **Fix:** Malicious browser extensions or XSS scripts can read `localStorage`. Store access tokens in React memory and refresh tokens in HTTP-only cookies.
- **Mistake:** Allowing a `staff` member to delete or promote other staff members.
  **Fix:** Always wrap staff management endpoints with `requireRole("super_admin")` middleware.
- **Mistake:** Creating an `apps/web/src/middleware.ts` file in Next.js 16.
  **Fix:** Next.js 16 replaces `middleware.ts` with `proxy.ts`.
- **Mistake:** Hashing passwords with plain MD5 or SHA-256.
  **Fix:** Fast hashes are vulnerable to brute-force dictionary attacks. Always use Argon2 with salt.
