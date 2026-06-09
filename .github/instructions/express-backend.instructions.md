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

## 2. Security & Auth
- Protect private routes using the Express JWT middleware (Bearer token authentication).
- Tokens are sent by the Next.js client via the `Authorization: Bearer <token>` header.
- Use `argon2` for password hashing.
- Apply `helmet` and `express-rate-limit` for standard API security where applicable.

## 3. Validation & Schemas
- Use **Zod** exclusively for validating incoming request payloads (body, query, params) in the controllers.
- Zod schemas should be placed in `src/schemas/` or shared packages when possible.
- Return standardized JSON error responses with proper HTTP status codes.

## 4. Code Structure
- **Controllers:** Handle HTTP req/res, validation responses, and calling services. (in `src/controllers/`)
- **Services:** Pure business and database logic. Keep them entirely separate from req/res objects. (in `src/services/`)
- **Routes:** Only bind routes to controllers and middlewares. (in `src/routes/`)
- **Middleware:** Auth, error handling, rate limiting. (in `src/middleware/`)

## 5. TypeScript
- Strict mode is mandatory. NO `any`.
- Define robust TypeScript interfaces explicitly (in `src/types/` or co-located).
