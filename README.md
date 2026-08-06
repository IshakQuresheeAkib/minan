# MINAN

MINAN is a Bangladesh fashion-commerce platform with an Express-owned Order domain. Every checkout freezes a server-verified merchandise snapshot, charges a backend-authoritative non-refundable delivery fee through bKash, and leaves merchandise payable by COD.

## Architecture

```text
Browser -> Next.js web app -> Express API -> MongoDB Atlas
```

## Repository Structure

```text
minan/
├── apps/
│   ├── web/      # Next.js 16 App Router frontend
│   └── api/      # Express 5 API for auth, CRUD, analytics, and CAPI
├── packages/
│   ├── shared-types/
│   ├── shared-schemas/
│   └── shared-constants/
├── docs/
├── context/
├── .github/
├── package.json
├── README.md
└── .gitignore
```

## Project Rules

- Next.js App Router only.
- No Next.js route handlers. All data operations go through the Express API.
- MongoDB Atlas and Mongoose are used for persistence. Supabase is not used.
- TypeScript strict mode is required across the project.
- Zod schemas live in feature schema folders and can be shared through `packages/shared-schemas`.
- Global client state uses Zustand.
- Forms use React Hook Form and Zod.
- Animations use GSAP only.
- Product images are Cloudinary URLs rendered with `next/image`.

## Order and payment rollout

The API and web app deploy independently. For payment-model releases, deploy in this order:

1. Configure bKash plus `DELIVERY_FEE_BDT=100`, preview/apply `npm --workspace @minan/api run migrate:orders:expand -- --apply`, deploy the expansion API, and take a MongoDB backup.
2. Run `npm --workspace @minan/api run migrate:orders` and resolve every dry-run anomaly.
3. Enable `CHECKOUT_MAINTENANCE_MODE=true` for payment creation/retry while keeping callbacks, results, and admin rechecks available.
4. Apply with `npm --workspace @minan/api run migrate:orders -- --apply`, run it again to prove idempotency, and verify counts, finances, counters, attempt links, transaction IDs, and dashboard metrics.
5. Deploy the Orders frontend, confirm the bKash sandbox flow charges only the delivery fee, then disable maintenance.

Legacy Leads remain untouched as a migration rollback source for one compatibility release. New Orders are not dual-written to Leads. Merchandise refunds are executed manually and recorded against the Order; delivery fees are never refundable. Exchange replacement Orders always waive delivery in v1 and do not create a payment link.
