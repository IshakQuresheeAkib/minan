# MINAN

MINAN is a marketing-focused commerce platform for the Bangladesh market, built for lead generation and conversion. The MVP collects checkout leads and bKash transaction IDs manually, with no payment processing in the first release.

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

