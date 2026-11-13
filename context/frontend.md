# Frontend Architecture Guide (`apps/web`)

## 1. Plain Concept & Overview
`apps/web` is a Next.js 16 storefront and admin interface built for fast mobile networks in Bangladesh. It handles what the customer sees and interacts with. It does not connect directly to the database. Instead, every page, form, and component sends requests to our Express backend. Next.js acts as a presentation layer and proxies API calls to keep credentials safe.

## 2. Visual Architecture & Request Flow

```
User Browser
    │
    ├── 1. Navigates to Page (/products, /checkout)
    │      └── Next.js App Router renders React 19 UI
    │
    ├── 2. User Action (Add to Cart, Submit Order)
    │      └── React Hook Form + Zod validates input in browser
    │
    └── 3. Data Request (fetch /api/orders)
           └── Next.js proxy rewrite forwards call to Express API
```

## 3. Strict Technical Specifications

### Tech Stack Versions
| Package | Version | Purpose | Rule |
| :--- | :--- | :--- | :--- |
| **Next.js** | 16.3.4 | App Router & presentation | Use `proxy.ts`, not `middleware.ts`. |
| **React** | 19.2.7 | UI library | React Compiler enabled. |
| **TypeScript** | 6.0.3 | Language | Strict mode: no `any`, no `as unknown`. |
| **Tailwind CSS** | 4.3.0 | Utility styling | Use Tailwind v4 classes. No CSS-in-JS. |
| **shadcn/ui** | Latest | Base accessible primitives | Built on Radix UI primitives. |
| **GSAP** | 3.x | Orchestrated motion | Use for page transitions and product reveals. |
| **Zustand** | 5.x | Global client state | Cart state and UI drawer state only. |
| **React Hook Form** | 7.x | Form state management | Pair with Zod resolvers. |
| **Zod** | 4.x | Schema validation | Schemas live in `features/<domain>/schemas/`. |
| **SWR** | 2.x | Client data caching | Cache product catalog and customer orders. |
| **Vitest** | 4.x | Frontend test runner | Run tests via `npm --workspace @minan/web run test`. |

### Project Directory Structure
```
apps/web/src/
├── app/                  # Next.js App Router (pages, layouts, metadata)
├── components/           # Reusable shared UI primitives (atoms, buttons, inputs)
├── features/             # Feature domains (catalog, checkout, admin, orders)
│   └── <feature>/
│       ├── components/   # Feature-specific UI
│       ├── hooks/        # Feature-specific React hooks
│       ├── schemas/      # Feature-specific Zod validation schemas
│       └── services/     # Feature-specific API caller functions
├── lib/                  # Shared utilities (fetcher, formatters, cn)
├── store/                # Zustand client stores (*.store.ts)
└── proxy.ts              # Route protection and cookie forwarding
```

### Route Catalog

#### Storefront Routes
| Route | Description | Rendering |
| :--- | :--- | :--- |
| `/` | Brand home page with featured drops | Static with ISR |
| `/collections` | Collections index | Static with ISR |
| `/collections/[slug]` | Products inside a collection | Dynamic / ISR |
| `/products` | Filterable product catalog | Dynamic / SWR |
| `/products/[slug]` | Product details and size picker | Dynamic / ISR |
| `/cart` | Slide-over cart or cart review page | Client / Zustand |
| `/checkout` | Single-page order form | Client / React Hook Form |
| `/orders/track` | Public order lookup by phone/number | Client / SWR |
| `/orders/[orderNumber]` | Order receipt and status page | Dynamic |
| `/terms`, `/privacy`, `/returns` | Policy documentation pages | Static |

#### Admin Routes
All routes under `/admin` require authenticated admin sessions verified by `proxy.ts`.
| Route | Description | Access Role |
| :--- | :--- | :--- |
| `/admin/login` | Admin email & password login | Public |
| `/admin/forgot-password`| Password reset request form | Public |
| `/admin/reset-password` | Password reset execution page | Public |
| `/admin` | Metrics dashboard & revenue overview | `staff`, `super_admin` |
| `/admin/orders` | Order management and status updates | `staff`, `super_admin` |
| `/admin/orders/[id]` | Detailed single order audit view | `staff`, `super_admin` |
| `/admin/products` | Product inventory and stock table | `staff`, `super_admin` |
| `/admin/products/new` | Create product with Cloudinary images | `staff`, `super_admin` |
| `/admin/products/[id]/edit` | Edit product, variants, and pricing | `staff`, `super_admin` |
| `/admin/collections` | Collection catalog management | `staff`, `super_admin` |
| `/admin/staff` | Staff accounts and role assignments | `super_admin` only |
| `/admin/audit-logs` | Immutable audit trail of admin actions | `super_admin` only |
| `/admin/settings` | Delivery fees and store configurations | `super_admin` only |

### Core Frontend Rules

1. **No Next.js Route Handlers for Data:**
   Do not add files like `app/api/products/route.ts` or `app/api/orders/route.ts`. All data requests must flow through the Next.js rewrite proxy to the Express API. The only allowed exception is `app/api/revalidate/route.ts` for cache tag revalidation.
2. **No Next.js Server Actions:**
   Do not write `'use server'` server actions for database writes. All actions are plain async functions calling Express API endpoints via `fetch`.
3. **Motion and Animation Rules:**
   Use GSAP for orchestrated page transitions, staggered card reveals, and sticky scroll effects. Use Tailwind CSS transitions for simple hover states, button focus, and small spinner toggles. Do NOT use Framer Motion. Do not attach GSAP animations to Radix UI internal DOM nodes.
4. **Images:**
   Use `next/image` for every image. Set explicit `width`, `height`, and `sizes` attributes. Serve all product images through Cloudinary URLs. Raw `<img>` tags are forbidden.
5. **Links and Navigation:**
   Use `next/link` for internal page navigation. Raw `<a>` tags are forbidden for internal links.
6. **State Management:**
   Use Zustand for global client state (e.g. `cart.store.ts`). Keep form state inside React Hook Form. Use SWR for server cache synchronization.
7. **SEO & Discovery:**
   Add Schema.org JSON-LD scripts on storefront pages (`Organization`, `Product`, `ItemList`, `FAQPage`). Maintain `/manifest.webmanifest`, `robots.ts`, `/llms.txt`, and `/llms-full.txt`.
8. **Font Optimization:**
   Load Google Fonts (`Manrope` for body text, `Plus_Jakarta_Sans` for headings) with `display: "swap"`.
9. **Prerendering:**
   Use the Speculation Rules API to prerender `/products*` and `/collections/*` on hover to make page transitions instant.

## 4. Beginner Pitfalls & Common Mistakes to Avoid

- **Mistake:** Trying to connect Mongoose or MongoDB inside a Next.js component.
  **Fix:** Next.js must never touch the database. Send a `fetch('/api/...')` request to Express.
- **Mistake:** Creating `src/middleware.ts`.
  **Fix:** Next.js 16 uses `src/proxy.ts`. Place routing guards inside `apps/web/src/proxy.ts`.
- **Mistake:** Installing Framer Motion for animations.
  **Fix:** Our design system uses GSAP 3.x and Tailwind keyframes. Framer Motion bloats the bundle and is banned in this repo.
- **Mistake:** Using standard HTML `<input>` without React Hook Form registration.
  **Fix:** Register inputs with React Hook Form and validate payloads against feature Zod schemas.
