# Frontend Architecture Guide (`apps/web`)

## 1. Concept & Overview
`apps/web` is a Next.js 16 storefront and admin web application. It runs on React 19 with the React Compiler enabled and uses Tailwind CSS v4 and GSAP 3.x for orchestrated transitions. It handles presentation only. It never connects directly to MongoDB Atlas. Instead, Next.js rewrites all `/api/*` data and auth calls to the Express backend.

## 2. Visual Architecture & Request Flow

```
Customer or Admin Browser
           │
           ├── 1. Navigates to page route (/, /products, /admin/orders)
           │      └── Next.js 16 App Router renders React 19 UI
           │          ├── PublicChrome wraps storefront routes
           │          └── AdminShell wraps protected admin routes (guarded by proxy.ts)
           │
           ├── 2. Form submission / user action
           │      └── React Hook Form validates input using Zod
           │
           └── 3. Data or auth request (e.g. fetch /api/products)
                  └── Next.js proxy rewrite forwards request to Express API on Render
```

## 3. Strict Technical Specifications

### Tech Stack & Tools
| Technology | Version / Rule | Notes |
| :--- | :--- | :--- |
| **Next.js** | 16.3.4 | App Router, Turbopack, `proxy.ts` (Never create `middleware.ts`). |
| **React** | 19.2.7 | React Compiler enabled. |
| **TypeScript** | 6.0.3 | Strict mode: no `any`, no `as unknown`. |
| **Tailwind CSS** | 4.3.0 | Modern utility styling. No CSS-in-JS. |
| **Motion** | GSAP 3.x | Orchestrated page transitions and product reveals. (Framer Motion is banned). |
| **Client State** | Zustand 5.x | Cart items in `cart.store.ts` (persisted to localStorage); admin auth token in `auth.store.ts`. |
| **Form Management** | React Hook Form 7.x | Validated with Zod schemas. |
| **Client Fetching** | SWR 2.x | Stale-while-revalidate caching for client catalog and account data. |
| **API Client** | `apps/web/src/lib/api/client.ts` | Native `fetch` wrapper. Attaches `X-Requested-With: XMLHttpRequest`. Do not use axios. |

---

### Authoritative Page Route Catalog

#### Storefront Routes (`app/(public)/`)
| Route | Page Name | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | Home | Public | Hero carousel, featured categories, trust signals, FAQ. |
| `/products` | Product Catalog | Public | Multi-select filters (category, subcategory, size, color, price, sort). |
| `/collections/[slug]` | Category Collection | Public | Filtered catalog for a single parent category. |
| `/products/[slug]` | Product Detail (PDP) | Public | Size/color selection, cart additions, WhatsApp ordering button. |
| `/cart` | Cart Review | Public | Review cart lines, subtotal, and proceeds to checkout. |
| `/checkout` | Checkout | Public | Single-page order form (`leadInputSchema`), shipping zones, payments. |
| `/checkout/buy-now` | Buy-Now Checkout | Public | Single-item direct checkout bypassing cart. |
| `/orders` | Order Tracking | Public | Order lookup by order number (`MN-YYYYMMDD-####`) or mobile number. |
| `/payment/result` | Payment Result | Public | Resolves opaque bKash payment result and displays status. |
| `/account/login` | Customer Login | Public | Login for returning customers. |
| `/account/orders` | Customer Orders | Authenticated | SWR cursor-paginated order history for customer. |
| `/account/orders/[orderNumber]` | Customer Order Detail | Authenticated | Full order details for an owned order. |

#### Static & Discovery Endpoints
| Route | Access | Purpose |
| :--- | :--- | :--- |
| `/manifest.webmanifest` | Public | PWA manifest (`standalone` mode, brand colors `#974822`, `#FBF7F4`). |
| `/llms.txt` | Public | Plain-text brand, product pillars, and delivery summary for LLM agents. |
| `/llms-full.txt` | Public | Complete technical and policy specifications for LLM crawlers. |
| `/robots.txt` (`app/robots.ts`)| Public | Permits AI crawlers (`GPTBot`, `ClaudeBot`) on public routes; blocks private paths. |

#### Admin Routes (`app/(admin)/admin/` & `app/(public)/admin/login`)
| Route | Page Name | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `/admin/login` | Admin Login | Public | Email and password login form (`app/(public)/admin/login/page.tsx`). |
| `/admin` | Dashboard | Admin | Real-time sales metrics, charts, low stock alerts, order status counts. |
| `/admin/orders` | Order Fulfillment | Admin | Paginated order list, status filters, change notifications. |
| `/admin/orders/[id]` | Order Detail | Admin | Full order view, timeline, status transitions, activity notes, refunds. |
| `/admin/orders/[id]/invoice` | Order Invoice | Admin | Printable customer invoice view. |
| `/admin/orders/[id]/packing-slip` | Packing Slip | Admin | Printable warehouse packing slip view. |
| `/admin/products` | Product Management | Admin | Product catalog table, create, edit, deactivate, delete. |
| `/admin/categories` | Category Management | Admin | Category creation, editing, and soft-deactivation. |
| `/admin/home-banners` | Banner Management | Admin | 1-5 versioned desktop and mobile homepage banners. |
| `/admin/admins` | Admin Management | Admin | Admin account creation, password update, soft-disable. |
| `/admin/leads` | Redirect | Admin | Redirects legacy lead route to `/admin/orders`. |

---

### Core Frontend Architecture Rules

1. **No Next.js Route Handlers for Database Access:**
   Never create files like `app/api/products/route.ts` or `app/api/orders/route.ts`. All data requests must flow through the rewrite proxy to Express. The only permitted exception is `app/api/revalidate/route.ts` for ISR cache tag invalidation.
2. **No Server Actions for Database Writes:**
   Do not write `'use server'` actions that write to MongoDB. Actions in `features/<domain>/actions/` are plain async functions calling Express API endpoints with `fetch`.
3. **Motion Guidelines:**
   Use GSAP for orchestrated transitions and staggered product reveals. Use Tailwind CSS transitions for simple hover and button focus states. Framer Motion is banned. Do not attach GSAP animations to internal Radix UI primitives.
4. **Media and Links:**
   Use `next/image` with Cloudinary for all image assets. Always supply `width`, `height`, and `sizes`. Raw `<img>` tags are forbidden. Use `next/link` for internal page navigation. Raw `<a>` tags are forbidden for internal routes.
5. **State Ownership:**
   - Cart items: Zustand (`cart.store.ts`) persisted to browser `localStorage`.
   - Admin access token: Zustand (`auth.store.ts`) in React memory only.
   - Customer access token: Zustand (`customer-auth.store.ts`) in React memory only.
   - Form state: React Hook Form.
   - Server data: SWR or Server Components.
6. **Speculation Rules:**
   `components/layouts/SpeculationRules.tsx` injects browser speculation rules to prerender `/products*` and `/collections/*` on hover. Respects `[data-no-prerender]` overrides.

---

## 4. Common Beginner Pitfalls & Mistakes to Avoid

- **Mistake:** Creating routes like `/orders/track` or `/orders/[orderNumber]`.
  **Fix:** Order tracking in MINAN is located at `/orders` (public search) and `/account/orders/[orderNumber]` (customer history).
- **Mistake:** Creating placeholder policy routes (`/terms`, `/privacy`, `/returns`) as dynamic app routes.
  **Fix:** These routes do not exist as independent page files.
- **Mistake:** Inventing `/admin/staff`, `/admin/audit-logs`, or `/admin/settings`.
  **Fix:** Admin users are managed at `/admin/admins`. Audit records are viewed inside `/admin/orders/[id]`. Delivery fees are configured via backend environment variables.
- **Mistake:** Importing Mongoose models in Next.js components or pages.
  **Fix:** Next.js must never touch Mongoose. Call Express API endpoints via `lib/api/client.ts`.
