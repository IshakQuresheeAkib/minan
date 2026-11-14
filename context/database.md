# Database Architecture & Mongoose Schemas (`MongoDB Atlas 8.3`)

## 1. Concept & Overview
MongoDB Atlas is the single data store for MINAN. Only `apps/api` connects to MongoDB using Mongoose 9.x. The frontend never imports Mongoose or connects directly to the database. All collections enforce strict types, required fields, and index constraints.

## 2. Visual Entity-Relationship Overview

```
 [AdminUser]
     │
     ├── manages ──> [Category] ──< contains ── [Subcategory]
     │                    │                          │
     │                    └── categorizes ──> [Product] (sizes, colors, discount)
     │                                            │
     └── audits & transitions                     └── ordered in lines
            │                                             ▼
            └─────────────────────────────────> [Order] <── checkout (POST /api/bkash/payments)
                                                   ├── atomic order_number ("MN-YYYYMMDD-####") via [OrderCounter]
                                                   ├── checkout attempts via [PaymentAttempt]
                                                   └── embedded audit trail in order.activity ([OrderActivity])

 [Customer] ── owns ──> [CustomerSession] (refresh token rotation)
 [HomeBannerSet] ──────> Singleton homepage carousel banners
 [BkashToken] ─────────> Private singleton cache for bKash API grant
 [AnalyticsEvent] ─────> Client & server event tracking with Meta CAPI dedup key
```

## 3. Strict Technical Specifications

### Core Database Rules
- **Engine:** MongoDB Atlas 8.3 with Mongoose 9.7.3.
- **Persistence Boundary:** Only `apps/api` connects to MongoDB. Next.js must never import Mongoose.
- **Timestamps:** Enabled (`{ timestamps: true }`) on all schemas except `analytics_events`, which only tracks `createdAt`.
- **Soft Deletes:** Products, categories, subcategories, and admin accounts use `is_active: boolean`. Permanent deletion is restricted to admin product removal.

---

### Collections & Mongoose Schemas

#### 1. `products` (`apps/api/src/models/Product.ts`)
Stores catalog merchandise, sizes, colors, and pricing.
```typescript
export interface ProductDocument extends Document {
  name: string;
  slug: string; // unique, lowercase, trimmed
  description: string;
  description_html: string | null;
  price: number; // min: 0
  discount: number; // integer percentage, default 0, min 0, max 100
  category_id: Types.ObjectId | CategoryDocument;
  subcategory_id?: Types.ObjectId | SubcategoryDocument | null;
  sizes: string[]; // default []
  colors: string[]; // default []
  images: string[]; // remote image URLs
  is_active: boolean; // default true
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. `categories` (`apps/api/src/models/Category.ts`)
Stores primary catalog categories.
```typescript
export interface CategoryDocument extends Document {
  name: string;
  slug: string; // unique
  image_url: string;
  is_active: boolean; // default true
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3. `subcategories` (`apps/api/src/models/Subcategory.ts`)
Stores subcategories grouped under parent categories.
```typescript
export interface SubcategoryDocument extends Document {
  category_id: Types.ObjectId | CategoryDocument;
  name: string;
  slug: string; // unique, lowercase
  display_order: number; // default 0, min 0
  is_active: boolean; // default true
  createdAt: Date;
  updatedAt: Date;
}
```

#### 4. `orders` (`apps/api/src/models/Order.ts`)
Stores customer orders, frozen line items, financials, payment status, and embedded audit logs.
```typescript
export type OrderStatus =
  | "new"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "on_hold"
  | "cancelled"
  | "returned"
  | "exchanged";

export interface OrderActivity {
  action: string;
  timestamp: Date;
  actor_admin_id?: Types.ObjectId | null;
  actor_email?: string | null;
  note?: string | null;
  customer_note?: string | null;
  system_event?: boolean;
}

export interface OrderDocument extends Document {
  name: string;
  phone_number: string;
  normalized_phone: string; // canonical BD phone, indexed for lookup
  email: string;
  normalized_email: string;
  address: string;
  customer_notes?: string;
  order_number: string; // unique MN-YYYYMMDD-#### via OrderCounter
  lines: Array<{
    product_id: Types.ObjectId;
    name: string;
    price: number;
    discount: number;
    effective_price: number;
    size?: string;
    color?: string;
    quantity: number;
    image_url?: string;
  }>;
  status: OrderStatus;
  checkout_source: "cart" | "buy_now" | "exchange";
  shipping_zone: "inside_sylhet" | "outside_sylhet";
  payment_method: "bkash_full" | "cod";
  settled_payment_attempt_id?: Types.ObjectId;
  checkout_idempotency_hash?: string;
  customer_id?: Types.ObjectId | null;
  expected_delivery_date?: Date | null;
  financials: {
    merchandise_subtotal: number;
    merchandise_discount: number;
    delivery_fee: number;
    merchandise_due: number;
    amount_paid: number;
    merchandise_refunded: number;
  };
  delivery_fee_status: "pending" | "paid" | "not_required" | "refunded";
  cod_status: "pending" | "delivered_uncollected" | "collected" | "settled";
  held_from_status?: OrderStatus | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  revision: number; // optimistic-concurrency revision
  activity: OrderActivity[]; // embedded audit trail (NO separate AuditLog collection)
  refunds: Array<{
    amount: number;
    reason: string;
    gateway_refund_id?: string;
    timestamp: Date;
  }>;
  meta_attribution?: {
    fbp?: string;
    fbc?: string;
    client_ip?: string;
    client_user_agent?: string;
  };
  meta_purchase?: {
    event_id?: string;
    sent_at?: Date;
    error?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### 5. `OrderCounter` (`apps/api/src/models/OrderCounter.ts`)
Allocates atomic daily sequential order numbers.
```typescript
export interface OrderCounterDocument extends Document<string> {
  _id: string; // dateKey: "YYYYMMDD" (in Bangladesh time UTC+6)
  sequence: number; // positive integer starting at 1
  updatedAt: Date;
}

// Allocator produces: MN-YYYYMMDD-####
// e.g., MN-20261114-0001
```

#### 6. `customers` & `customer_sessions` (`apps/api/src/models/Customer.ts`, `CustomerSession.ts`)
- `customers`: Stores customer email, normalized unique email index, Argon2 password hash, and session version.
- `customer_sessions`: Stores customer reference, session version, refresh token hash, immediate previous token hash, expiry date, rotation timestamp, and revocation flag. Uses MongoDB TTL index on `expires_at`.

#### 7. `payment_attempts` (`apps/api/src/models/PaymentAttempt.ts`)
Tracks bKash payment lifecycle and idempotency per order.
- Links to `order_id`.
- Records `payment_purpose`: `"delivery_fee"` | `"order_total"`.
- Stores frozen purpose amount, gateway payment ID, transaction ID, and hashed result references.

#### 8. `bkash_tokens` (`apps/api/src/models/BkashToken.ts`)
Private singleton document caching the bKash API token grant. Survives server restarts.

#### 9. `analytics_events` (`apps/api/src/models/AnalyticsEvent.ts`)
Stores raw storefront events and deduplication keys for Meta CAPI.
- Fields: `event_type`, `event_id` (UUID dedup key), `product_id`, `category_id`, `session_id`, UTM params.
- Only uses `createdAt` timestamp.

#### 10. `admin_users` (`apps/api/src/models/AdminUser.ts`)
Single admin model for store operators.
```typescript
export interface AdminUserDocument extends Document {
  email: string; // unique, lowercase, trimmed
  password: string; // Argon2 hash
  is_active: boolean; // default true
  session_version: number; // default 0
  refresh_token_hash: string | null;
  previous_refresh_token_hash: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```
*Note:* MINAN uses a single admin account structure with active/disabled flags and session versions. There are no `staff` or `super_admin` roles.

#### 11. `home_banner_sets` (`apps/api/src/models/HomeBannerSet.ts`)
Singleton document (`key: "homepage"`) containing 1-5 ordered responsive banners with image descriptions and optimistic revision tracking.

---

### Database Indexes

| Collection | Fields | Type | Purpose |
| :--- | :--- | :--- | :--- |
| `products` | `slug` | Unique | Public product detail route lookup. |
| `products` | `subcategory_id` | Standard | Catalog filter lookups. |
| `products` | `category_id`, `is_active` | Compound | Fast active catalog display. |
| `categories` | `slug` | Unique | Category detail lookup. |
| `subcategories` | `slug` | Unique | Subcategory routing. |
| `subcategories`| `category_id`, `display_order`, `name` | Compound | Ordered subcategory dropdown lists. |
| `orders` | `order_number` | Unique | Exact lookup on receipts and tracking. |
| `orders` | `normalized_phone` | Standard | Customer order lookup by mobile number. |
| `orders` | `customer_id`, `createdAt` | Compound | Customer account order history. |
| `orders` | `status`, `createdAt` | Compound | Admin order queue filtering. |
| `admin_users` | `email` | Unique | Admin credential lookup. |
| `customers` | `normalized_email` | Unique | Customer account lookup. |
| `customer_sessions` | `expires_at` | TTL | Automatic session expiration cleanup. |
| `analytics_events` | `event_id` | Unique | Meta CAPI deduplication match. |
| `analytics_events` | `event_type`, `createdAt` | Compound | Event rollups. |

---

## 4. Common Beginner Pitfalls & Mistakes to Avoid

- **Mistake:** Creating a separate `AuditLog` collection.
  **Fix:** Order audit trails are stored in the embedded `activity` array inside `Order.ts`. There is no `AuditLog` collection.
- **Mistake:** Generating order numbers by counting documents (`Order.countDocuments() + 1`).
  **Fix:** Multiple orders created in the same second will collide. Always allocate numbers using `OrderCounter.findOneAndUpdate` on the daily Bangladesh date key.
- **Mistake:** Querying products by `status: "active"`.
  **Fix:** The product model uses `is_active: true`. It does not have a `status` field.
- **Mistake:** Hard-deleting orders or categories.
  **Fix:** Never delete orders. Never delete categories that active products reference. Use status updates or `is_active: false`.
