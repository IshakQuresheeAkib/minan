# MINAN

MINAN is a marketing-focused commerce platform for the Bangladesh market, built for lead generation and conversion. Checkout uses the Express API for verified carts, auditable payment attempts, and bKash Checkout URL payments.

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

## Payment rollout

The API and web app deploy independently. For payment-model releases, deploy in this order:

1. Configure the API bKash environment variables and prepare the API release.
2. From the release checkout, preview the production migration with `npm --workspace @minan/api run migrate:lead-checkout`.
3. Apply it before promoting the API release with `npm --workspace @minan/api run migrate:lead-checkout -- --apply`.
4. Deploy the API, then deploy the web app that uses `POST /api/bkash/payments`.
