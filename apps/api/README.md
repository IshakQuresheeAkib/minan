# MINAN API

Express 5 backend for authentication, admin CRUD, public catalog/checkout APIs, MongoDB Order persistence, fee-only bKash attempts, rate limiting, and Meta CAPI forwarding.

The API is the only data layer for the app. Next.js route handlers are intentionally not used for data operations; the frontend may expose `/api/revalidate` only for cache invalidation.

`DELIVERY_FEE_INSIDE_SYLHET_BDT` and `DELIVERY_FEE_OUTSIDE_SYLHET_BDT` are the required positive-integer shipping fee sources. `GET /api/checkout/config` exposes the ordered `inside_sylhet` and `outside_sylhet` options, BDT currency, and non-refundable policy with ETag/cache metadata. Checkout requests submit the required `shipping_zone` ID only; the API resolves and snapshots the fee on the Order, and every bKash creation or retry charges that frozen snapshot.

During the compatible API/web rollout, keep the previous `DELIVERY_FEE_BDT=100` deployment value available only for rollback to the previous release. Current code does not read it. Use `migrate:orders` as a dry run before the maintenance-window cutover; add `-- --apply` only after backup and anomaly review.

```json
{
  "data": {
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
