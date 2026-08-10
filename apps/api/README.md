# MINAN API

Express 5 backend for authentication, admin CRUD, public catalog/checkout APIs, MongoDB Order persistence, fee-only bKash attempts, rate limiting, and Meta CAPI forwarding.

The API is the only data layer for the app. Next.js route handlers are intentionally not used for data operations; the frontend may expose `/api/revalidate` only for cache invalidation.

`DELIVERY_FEE_INSIDE_SYLHET_BDT` and `DELIVERY_FEE_OUTSIDE_SYLHET_BDT` are the required positive-integer shipping fee sources. `GET /api/checkout/config` exposes the ordered `inside_sylhet` and `outside_sylhet` options, BDT currency, and non-refundable policy with ETag/cache metadata. Zone-aware checkout requests submit the `shipping_zone` ID only; the API resolves and snapshots the fee on the Order, and every bKash creation or retry charges that frozen snapshot.

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
    "refundable": false
  }
}
```

Before deploying the required home-banner `alt_text` schema, run
`npm --workspace @minan/api run migrate:home-banner-alt-text`. The dry run
automatically describes only the two known seeded images. If it reports custom
legacy banners, create a JSON object mapping each reported banner ID to a
meaningful image description and pass it with
`-- --descriptions <path>`. Review the output, take a database backup, apply
with `-- --apply --descriptions <path>`, then rerun the dry run to verify
idempotency. The apply step refuses unresolved banners instead of guessing.
