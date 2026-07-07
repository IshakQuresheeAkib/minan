# MINAN API

Express 5 backend for authentication, admin CRUD, public product/category/lead APIs, MongoDB persistence, rate limiting, and Meta CAPI forwarding.

The API is the only data layer for the app. Next.js route handlers are intentionally not used for data operations; the frontend may expose `/api/revalidate` only for cache invalidation.
