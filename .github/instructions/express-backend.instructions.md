---
description: 'Enforce Express API, Mongoose, and JWT conventions for MINAN backend.'
applyTo: "apps/api/**/*.ts"
---

# Express Backend & API Guidelines

When generating or modifying Express.js backend code, adhere to the following rules based on MINAN architecture:

## 1. Architecture & Frameworks
- Node.js version is 24.16.0, Express 5.2.1.
- Use MongoDB with Mongoose (v8.x) for all data persistence. Do NOT use Supabase.
- Mongoose schemas go in `src/models/`.
- Use soft deletes via `is_active` instead of hard deletes where applicable.

## 2. Security & Auth Flow
- Protect private routes using the Express JWT middleware (Bearer token authentication).
- Tokens are sent by the Next.js client via the `Authorization: Bearer <token>` header.
- **Roles:** The JWT payload contains roles (`general`, `premium`). Express middleware must check these roles per route—never from the request body.
- Use `argon2` for password hashing via the Mongoose `pre('save')` hook.
- Ensure Mongoose `toJSON` transforms strip the `password` field from admin users.
- Apply `helmet` and `express-rate-limit` for standard API security.

## 3. Meta CAPI & Analytics
- The backend is responsible for firing Meta CAPI events and writing to `analytics_events`.
- For events like `product_view` and `add_to_cart`, the client generates an `event_id`. The backend must receive and forward this identical `event_id` to CAPI for event deduplication.
- **Lead Submits:** Handled EXCLUSIVELY server-side to prevent PII leaks. Generate a server-side UUID `event_id` when firing the CAPI event during the `/api/leads` POST route.

## 4. Validation & Schemas
- Use **Zod** exclusively for validating incoming request payloads (body, query, params) in the controllers.
- Zod schemas should be placed in `src/schemas/`.
- **Note:** Ensure backend schemas are manually kept in sync with the frontend validation schemas as they are not currently shared across repositories.
- Return standardized JSON error responses with proper HTTP status codes.

## 5. Code Structure
- **Controllers:** Handle HTTP req/res, validation responses, and calling services. (in `src/controllers/`)
- **Services:** Pure business and database logic. Keep them entirely separate from req/res objects. (in `src/services/`)
- **Routes:** Only bind routes to controllers and middlewares. (in `src/routes/`)
- **Middleware:** Auth, error handling, rate limiting. (in `src/middleware/`)

## 6. TypeScript
- Strict mode is mandatory. NO `any`.
- Define robust TypeScript interfaces explicitly (in `src/types/` or co-located).
