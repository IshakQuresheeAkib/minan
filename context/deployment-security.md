# Deployment, Infrastructure & Security Guide

## 1. Plain Concept & Overview
This document explains where our application runs in production, how environment variables are configured, and how we protect user data. Our storefront runs on Vercel. Our Express API runs on Render. Our data lives in MongoDB Atlas. These services communicate over encrypted HTTPS connections. Secrets like database passwords and API keys stay inside cloud dashboards; they are never committed to git.

## 2. Visual Deployment Architecture

```
[Vercel Cloud]                          [Render Cloud]                  [MongoDB Atlas]
 apps/web (Next.js 16)                   apps/api (Express 5)             Managed Cluster
  - Domain: minan.vercel.app              - Domain: minan-api.onrender.com - Connection URI
  - Serves React UI                       - Executes business logic        - Stores collections
  - Proxies /api/* to Render              - Validates with Zod
        │                                        │                                │
        ├── (Rewrites /api/orders) ─────────────>├── (Mongoose queries) ─────────>┤
        │                                        │<── (Data documents) ───────────┤
        │<── (JSON response) ────────────────────┤
```

## 3. Strict Technical Specifications

### Hosting Services
| Service | Component | Production Host | Configuration Notes |
| :--- | :--- | :--- | :--- |
| **Vercel** | `apps/web` | `minan.vercel.app` (or custom) | Framework preset: Next.js. Automatic edge deployment on git push. |
| **Render** | `apps/api` | `minan-api.onrender.com` | Environment: Node 24.16.0. Build: `npm install && npm run build`. Start: `node apps/api/dist/server.js`. |
| **MongoDB Atlas**| Database | AWS ap-southeast-1 (Singapore) | Replica set. Whitelist Render IP addresses or set 0.0.0.0/0 with strong user password. |
| **Cloudinary** | Image CDN | Managed Cloudinary bucket | Signed uploads for admin product images. |

---

### Complete Environment Variables Reference

#### Frontend (`apps/web/.env.local` / Vercel Environment Variables)
| Variable Name | Required | Example Value | Purpose |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://minan.vercel.app` | Base public URL of the storefront for canonical links and SEO. |
| `NEXT_PUBLIC_API_URL` | Yes | `/api` | Relative API path in browser (handled by Next.js rewrites). |
| `API_PROXY_TARGET` | Yes | `https://minan-api.onrender.com` | Destination URL where Next.js proxies all `/api/:path*` calls. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | `minan-fashion` | Cloudinary cloud identifier for `next/image` transformations. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Yes | `123456789012345` | Meta Pixel identifier for client-side tracking. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Yes | `G-XXXXXXXXXX` | Google Analytics 4 web stream ID. |
| `REVALIDATE_SECRET` | Yes | `minan_cache_secret_xyz` | Secret key used by `/api/revalidate` to authorize cache clears. |

#### Backend (`apps/api/.env` / Render Environment Variables)
| Variable Name | Required | Example Value | Purpose |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | `5000` | Port for the Express server (Render assigns `$PORT` automatically). |
| `NODE_ENV` | Yes | `production` | Set to `production` in live environments to enable strict cookie flags. |
| `MONGODB_URI` | Yes | `mongodb+srv://admin:pass@cluster.mongodb.net/minan` | MongoDB Atlas database connection string. |
| `WEB_URL` | Yes | `https://minan.vercel.app` | Allowed CORS origin for frontend requests. |
| `JWT_ACCESS_SECRET` | Yes | `super_secure_random_string_access` | 256-bit secret used to sign 15-minute access tokens. |
| `JWT_REFRESH_SECRET`| Yes | `super_secure_random_string_refresh` | 256-bit secret used to sign 7-day refresh tokens. |
| `AUTH_COOKIE_DOMAIN`| No | Unset (or `.minan.com`) | Leave unset on `*.vercel.app`. Set `.minan.com` only on custom domains. |
| `CLOUDINARY_CLOUD_NAME` | Yes | `minan-fashion` | Cloudinary bucket identifier for server-side signatures. |
| `CLOUDINARY_API_KEY` | Yes | `123456789012345` | Cloudinary API access key. |
| `CLOUDINARY_API_SECRET` | Yes | `secret_cloudinary_key` | Cloudinary API access secret. |
| `META_PIXEL_ID` | Yes | `123456789012345` | Meta Pixel identifier used in server CAPI events. |
| `META_CAPI_ACCESS_TOKEN`| Yes | `EAA...` | Meta Graph API Conversions token for server event reporting. |
| `META_TEST_EVENT_CODE` | No | `TEST12345` | Debugging code for Meta Events Manager testing. |
| `BKASH_APP_KEY` | Yes | `key_from_bkash_merchant` | bKash tokenized payment gateway application key. |
| `BKASH_APP_SECRET` | Yes | `secret_from_bkash_merchant` | bKash tokenized payment gateway application secret. |
| `BKASH_USERNAME` | Yes | `merchant_username` | bKash merchant login identifier. |
| `BKASH_PASSWORD` | Yes | `merchant_password` | bKash merchant login password. |
| `BKASH_BASE_URL` | Yes | `https://tokenized.pay.bka.sh/v1.2.0-beta` | bKash gateway endpoint (sandbox or production). |
| `REVALIDATE_SECRET` | Yes | `minan_cache_secret_xyz` | Shared secret to trigger storefront cache invalidation. |

---

### Security Implementation Checklist

1. **Password Hashing:**
   All user passwords must be hashed using Argon2id with recommended memory and iteration factors. Passwords must never be stored in plain text or logged.
2. **Rate Limiting:**
   Enforce rate limits on public Express endpoints:
   - Login endpoints (`/api/auth/login`): 5 requests per 15 minutes per IP.
   - Order submission (`/api/orders`): 10 orders per 15 minutes per IP.
   - General public endpoints: 100 requests per 15 minutes per IP.
3. **CORS Restrictions:**
   Express allows requests only from `WEB_URL` and `http://localhost:3000`. All other origins receive a CORS rejection error.
4. **HTTP Security Headers:**
   Helmet is registered on the Express app root. It enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `Strict-Transport-Security`.
5. **Input Validation:**
   Every API endpoint passes incoming request bodies and query parameters through Zod validation schemas. Fields not declared in schemas are stripped automatically.

## 4. Beginner Pitfalls & Common Mistakes to Avoid

- **Mistake:** Committing `.env` or `.env.local` files to git.
  **Fix:** Add `.env` and `.env.local` to `.gitignore`. Configure variables directly in Vercel and Render project settings.
- **Mistake:** Setting `AUTH_COOKIE_DOMAIN=.minan.com` when testing on `vercel.app`.
  **Fix:** Browsers reject cookies when the domain doesn't match the host. Leave `AUTH_COOKIE_DOMAIN` empty until you configure custom subdomains.
- **Mistake:** Forgetting to set `API_PROXY_TARGET` on Vercel.
  **Fix:** Next.js won't know where to forward `/api/*` calls, resulting in 404 or 500 errors on all data fetches.
- **Mistake:** Exposing private keys (`BKASH_APP_SECRET`, `JWT_ACCESS_SECRET`) with `NEXT_PUBLIC_` prefixes.
  **Fix:** Any variable starting with `NEXT_PUBLIC_` is bundled into client JavaScript for anyone to see. Keep private keys strictly in `apps/api/.env`.
