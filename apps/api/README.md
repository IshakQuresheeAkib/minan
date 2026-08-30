# MINAN API

Express 5 backend for authentication, admin CRUD, public catalog/checkout APIs, MongoDB Order persistence, full-Order and fee-only bKash attempts, rate limiting, and Meta CAPI forwarding.

The API is the only data layer for the app. Next.js route handlers are intentionally not used for data operations; the frontend may expose `/api/revalidate` only for cache invalidation.

## Customer authentication and transactional email

Customer account endpoints are isolated under `/api/customer-auth` and use separate customer access/refresh cookies, JWT secrets, middleware, Customer records, and CustomerSession records. They do not reuse admin identities or sessions. Configure `CUSTOMER_JWT_ACCESS_SECRET` and `CUSTOMER_JWT_REFRESH_SECRET` independently from the admin secrets. Production cookies also use the existing `AUTH_COOKIE_DOMAIN` setting.

The transactional-email foundation uses the official Resend Node SDK behind an injected adapter. Configure `RESEND_API_KEY` server-side and set `RESEND_FROM` to a sender on a domain verified in Resend, for example `MINAN <orders@example.com>`. No signup, login, or Order mutation sends email; OTP and Order-event delivery remain later steps.

`DELIVERY_FEE_INSIDE_SYLHET_BDT` and `DELIVERY_FEE_OUTSIDE_SYLHET_BDT` are the required positive-integer shipping fee sources. `GET /api/checkout/config` exposes the ordered `inside_sylhet` and `outside_sylhet` options, BDT currency, non-refundable policy, and payment contract v2 with ETag/cache metadata. Zone-aware checkout requests submit the `shipping_zone` ID and `payment_method`. The API resolves and freezes every amount: `bkash_full` charges `overall_order_value`, while `cod` charges only the delivery fee and leaves merchandise due on delivery. Retries preserve the original attempt purpose and amount.

`DELIVERY_FEE_BDT=100` remains required during the compatibility release. The config response includes it as the legacy `delivery_fee`, and zone-less requests from the previous storefront snapshot that value with `shipping_zone` unspecified. The new storefront uses `shipping_options` when present and falls back to the single legacy fee when paired with the previous API. Deploy the API first when possible, then the web; either deployment order and either single-service rollback remain checkout-safe during this release. Remove this compatibility field and make `shipping_zone` required in a later cleanup release only after the previous storefront can no longer send traffic.

```json
{
  "data": {
    "delivery_fee": 100,
    "shipping_options": [
      { "id": "inside_sylhet", "label": "Inside Sylhet Shipping Cost", "delivery_fee": 60 },
      { "id": "outside_sylhet", "label": "Outside Sylhet Shipping Cost", "delivery_fee": 120 }
    ],
    "currency": "BDT",
    "refundable": false,
    "payment_contract": {
      "version": 2,
      "methods": ["bkash_full", "cod"]
    }
  }
}
```

The home-banner `alt_text` migration is complete and its one-time command is retired. If the banner singleton is absent, use `npm --workspace @minan/api run seed:home-banners`; the seed preserves an existing set.

Two dry-run-by-default maintenance commands remain: `migrate:orders` for the legacy Lead/PaymentAttempt compatibility window and `cleanup:inactive-admin-sessions` before reactivating a legacy inactive admin. Supply `-- --apply` only after reviewing the dry run and taking any required MongoDB backup.
