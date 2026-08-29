# MINAN

MINAN is a Bangladesh fashion-commerce platform with an Express-owned Order domain. Every checkout freezes a server-verified merchandise snapshot and lets the customer either pay the complete Order through bKash or pay the non-refundable delivery fee in advance and leave merchandise payable by COD.

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

## Database maintenance

The product, banner, admin-role, lead-checkout, Order-index expansion, and packing-status migrations are complete. Their one-time scripts have been retired, but two guarded maintenance commands remain:

- `npm --workspace @minan/api run migrate:orders` is dry-run-only unless `-- --apply` is supplied. Retain it until every legacy payment attempt has `order_id` and no longer depends on `lead_id`; take a MongoDB backup and enable checkout maintenance before any apply run.
- `npm --workspace @minan/api run cleanup:inactive-admin-sessions` is dry-run-only unless `-- --apply` is supplied. Use it before reactivating a legacy inactive admin to clear stale refresh-token hashes and advance `session_version`.

Keep the legacy `leads` collection until the Order/payment compatibility and rollback window is explicitly closed. New Orders are not dual-written to Leads. Merchandise refunds are executed manually and recorded against the Order; delivery fees are never refundable. Exchange replacement Orders always waive delivery in v1 and do not create a payment link.
