# MINAN Web

Next.js 16 App Router frontend for the public storefront, checkout lead flow, analytics clients, and authenticated full-access admin UI.

All API traffic should go to the Express API through `API_PROXY_TARGET`. Do not add Next.js route handlers under `app/api`, except `app/api/revalidate/route.ts` for cache invalidation only.