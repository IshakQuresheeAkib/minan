# MINAN Web

Next.js 16 App Router frontend for the public storefront, delivery-fee checkout, analytics clients, and the authenticated Order fulfillment workspace.

All API traffic should go to the Express API through `API_PROXY_TARGET`. Do not add Next.js route handlers under `app/api`, except `app/api/revalidate/route.ts` for cache invalidation only.

Checkout configuration is fetched server-to-server from Express; do not add a public build-time fee variable. Admin Order list/detail/dashboard reads use SWR. Notification storage is limited to a versioned opaque changes cursor and the notification preference—never Order PII.
