# MINAN API

Express 5 backend for authentication, admin CRUD, public catalog/checkout APIs, MongoDB Order persistence, fee-only bKash attempts, rate limiting, and Meta CAPI forwarding.

The API is the only data layer for the app. Next.js route handlers are intentionally not used for data operations; the frontend may expose `/api/revalidate` only for cache invalidation.

`DELIVERY_FEE_BDT` is the single checkout fee source. `GET /api/checkout/config` exposes its safe public representation, and new payment attempts snapshot that fee against an Order. Use `migrate:orders` as a dry run before the maintenance-window cutover; add `-- --apply` only after backup and anomaly review.
