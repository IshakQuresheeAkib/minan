# Deployment, Infrastructure & Security Guide

## 1. Concept & Overview
This document specifies production hosting, environment variables, and security enforcement for MINAN. The frontend (`apps/web`) deploys to Vercel. The backend API (`apps/api`) deploys to Render on Node 24.16.0. MongoDB Atlas hosts the database cluster. Secrets remain in cloud environment configurations and are never committed to git.

## 2. Visual Deployment Architecture

```
[Vercel Cloud]                          [Render Cloud]                  [MongoDB Atlas]
 apps/web (Next.js 16)                   apps/api (Express 5)             AWS ap-southeast-1
  - Domain: minanclothing.com             - Domain: api.minan.com          - Replica set cluster
  - Serves React 19 UI                    - Handles orders & payments      - Stores all collections
  - Rewrites /api/* to Render             - Validates input with Zod
        │                                        │                                │
        ├── (Rewrites /api/*) ──────────────────>├── (Mongoose queries) ─────────>┤
        │                                        │<── (Documents) ────────────────┤
        │<── (JSON response) ────────────────────┤
```

## 3. Strict Technical Specifications

### Hosting Platform Configuration
| Service | Component | Production Platform | Runtime / Details |
| :--- | :--- | :--- | :--- |
| **Frontend** | `apps/web` | Vercel | Next.js 16 (App Router, Turbopack, `proxy.ts`). |
| **Backend API** | `apps/api` | Render | Node 24.16.0. Build: `npm install && npm run build`. Start: `node apps/api/dist/server.js`. |
| **Database** | Primary DB | MongoDB Atlas 8.3 | AWS ap-southeast-1 (Singapore). Strict IP whitelisting. |
| **Images** | Asset CDN | Cloudinary | Signed upload parameters for admin merchandise and banner media. |

---

### Authoritative Environment Variables Reference

#### Frontend (`apps/web/.env.local` / Vercel Environment Settings)
| Variable Name | Required | Purpose / Notes |
| :--- | :---: | :--- |
| `API_PROXY_TARGET` | Yes | Target backend URL for `/api/*` rewrites (e.g. `https://api.minan.com`). |
| `JWT_ACCESS_SECRET` | Yes | Same value as backend; used by `proxy.ts` to verify access-token cookies. |
| `REVALIDATE_SECRET` | Yes | Shared secret used by `/api/revalidate` for on-demand ISR cache tag purges. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical site origin for SEO, sitemap generation, and social metadata. |
| `NEXT_PUBLIC_GA4_ID` | Yes | Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`). |
| `NEXT_PUBLIC_META_PIXEL_ID` | Yes | Meta Pixel ID for client-side event tracking. |
| `NEXT_PUBLIC_FACEBOOK_PAGE_URL` | No | Public Facebook Page URL for footer plugin. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Yes | Business WhatsApp number for one-click product ordering. |

#### Backend (`apps/api/.env` / Render Environment Settings)
| Variable Name | Required | Purpose / Notes |
| :--- | :---: | :--- |
| `PORT` | Yes | Express server port (Render assigns `$PORT` automatically; local default `3001`). |
| `NODE_ENV` | Yes | Set to `production` in live environment to enforce secure cookie flags. |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string (`mongodb+srv://...`). |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS allowed origins (`http://localhost:3000,https://minanclothing.com`). |
| `JWT_ACCESS_SECRET` | Yes | 256-bit secret for signing 15-minute admin access tokens. |
| `JWT_REFRESH_SECRET` | Yes | 256-bit secret for signing 7-day admin refresh tokens. |
| `CUSTOMER_JWT_ACCESS_SECRET` | Yes | Secret for customer session access tokens. |
| `CUSTOMER_JWT_REFRESH_SECRET` | Yes | Secret for customer session refresh tokens (must differ from access secret). |
| `ADMIN_EMAIL` | Yes (for `seed:admin`) | Initial admin email used by `seed:admin` to create or update the administrative account. |
| `ADMIN_PASSWORD` | Yes (for `seed:admin`) | Initial admin password used by `seed:admin` (must be changed from template placeholder in production). |
| `AUTH_COOKIE_DOMAIN` | No | Cookie domain. Leave **unset** on default domains (`*.vercel.app`); set `.minan.com` only on custom subdomains. |
| `CLOUDINARY_URL` | Yes | Cloudinary configuration URI (`cloudinary://key:secret@cloud_name`). |
| `CLOUDINARY_UPLOAD_FOLDER` | Yes | Destination upload directory in Cloudinary bucket. |
| `CLOUDINARY_HOME_BANNER_UPLOAD_PRESET` | Yes | Dedicated upload preset for homepage banner assets. |
| `META_PIXEL_ID` | Yes | Meta Pixel ID for server CAPI events. |
| `META_CAPI_TOKEN` | Yes | Meta Graph API Conversions access token. |
| `META_GRAPH_VERSION` | No | Meta Graph API version (default: `v27.0`). |
| `META_TEST_EVENT_CODE` | No | Debugging code for Meta Events Manager testing (leave empty in production). |
| `BKASH_BASE_URL` | Yes | bKash tokenized gateway URL (`https://tokenized.sandbox.bka.sh/v2` in UAT). |
| `BKASH_APP_KEY` | Yes | bKash merchant application key. |
| `BKASH_APP_SECRET` | Yes | bKash merchant application secret. |
| `BKASH_USERNAME` | Yes | bKash merchant username. |
| `BKASH_PASSWORD` | Yes | bKash merchant password. |
| `BKASH_RESTRICT_ACCESS` | No | Enables UAT access restriction (`true` or `false`). |
| `BKASH_UAT_ALLOWED_EMAILS` | No | Comma-separated allowed customer emails when access restriction is enabled. |
| `BKASH_ENABLE_UAT_BYPASS` | No | Allows direct UAT bypass in local/test environments (`true` or `false`). |
| `BKASH_UAT_BYPASS_TOKEN` | No | Private developer bypass token for automated testing. |
| `DELIVERY_FEE_INSIDE_SYLHET_BDT` | Yes | Delivery fee integer inside Sylhet (e.g. `60` or `80`). |
| `DELIVERY_FEE_OUTSIDE_SYLHET_BDT` | Yes | Delivery fee integer outside Sylhet (e.g. `120` or `130`). |
| `API_PUBLIC_URL` | Yes | Directly reachable Render API origin for bKash callbacks (e.g. `https://api.minan.com`). |
| `FRONTEND_URL` | Yes | Vercel storefront origin for payment redirect landing. |
| `STOREFRONT_REVALIDATE_URL` | Yes | Webhook target to trigger Next.js cache revalidation (`https://minanclothing.com/api/revalidate`). |
| `STOREFRONT_REVALIDATE_SECRET` | Yes | Shared secret authorizing storefront cache invalidation. |

---

### Security Implementation Standards

1. **CSRF Mitigation:**
   All non-GET state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the HTTP header:
   ```http
   X-Requested-With: XMLHttpRequest
   ```
   Requests missing this header receive `403 Forbidden`.

2. **Password Hashing:**
   Admin and customer passwords are protected using Argon2id with random salt. Plain passwords are never stored or logged.

3. **Rate Limiting:**
   IP-based rate limits protect endpoints against brute force and DDoS:
   - Admin login (`POST /api/auth/login`): 10 requests per 15 minutes per IP.
   - Customer login (`POST /api/customer-auth/login`): 10 requests per 15 minutes per IP.
   - Analytics logging (`POST /api/analytics`): 60 requests per 15 minutes per IP.
   - Order creation (`POST /api/bkash/payments`): Throttled per IP and idempotency token.

4. **CORS Restrictions:**
   Express allows requests only from origins defined in `ALLOWED_ORIGINS`. Server-to-server requests without an Origin header are permitted. Cross-origin credentials (`credentials: true`) are enabled.

5. **Security Headers:**
   Helmet is registered on the Express application root to enforce `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Strict-Transport-Security`.

---

## 4. Common Beginner Pitfalls & Mistakes to Avoid

- **Mistake:** Setting `AUTH_COOKIE_DOMAIN=.minan.com` on `*.vercel.app` deployments.
  **Fix:** Browsers reject cookies when the domain attribute does not match the active host. Leave `AUTH_COOKIE_DOMAIN` unset on default domains.
- **Mistake:** Using invented variable names like `NEXT_PUBLIC_APP_URL` or `CLOUDINARY_API_KEY`.
  **Fix:** MINAN uses `NEXT_PUBLIC_SITE_URL` on the frontend and `CLOUDINARY_URL` on the backend. Always use the verified variable names.
- **Mistake:** Omitting `API_PROXY_TARGET` on Vercel.
  **Fix:** Next.js uses `API_PROXY_TARGET` to rewrite `/api/*` to Render. Without it, all client API requests fail with 404 or 500 errors.
- **Mistake:** Hardcoding bKash `v1.2.0-beta` endpoints.
  **Fix:** Production uses bKash Tokenized Checkout v2 (`https://tokenized.sandbox.bka.sh/v2` in sandbox).
