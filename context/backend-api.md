# Backend API Architecture Guide (`apps/api`)

## 1. Plain Concept & Overview
`apps/api` is an Express 5 server. It is the only part of our application that connects directly to the MongoDB Atlas database. It handles user authentication, calculates order totals, processes bKash payments, creates audit logs, and sends conversion events to Meta. When the frontend needs data or saves an order, it sends an HTTP request to this API.

## 2. Visual Architecture & Request Flow

```
Next.js Rewrite Proxy (or Direct Client)
                 │
                 ▼
        [Express Middleware]
         - Helmet (Security headers)
         - CORS (Origin checks)
         - Rate Limiter (Abuse protection)
         - Auth Middleware (JWT validation)
                 │
                 ▼
        [Controller Layer]
         - Validates input with Zod
         - Returns HTTP status codes (200, 201, 400, 404, 500)
                 │
                 ▼
        [Service Layer]
         - Business logic (calculate order pricing, verify bKash token)
         - Calls external APIs (Meta CAPI, Cloudinary, bKash)
                 │
                 ▼
        [Mongoose Models]
         - Reads and writes to MongoDB Atlas collections
```

## 3. Strict Technical Specifications

### Tech Stack Versions
| Package | Version | Purpose | Rule |
| :--- | :--- | :--- | :--- |
| **Node.js** | 24.16.0 | Runtime | Target production runtime on Render. |
| **Express** | 5.2.1 | HTTP framework | Use native async route handlers. |
| **MongoDB Atlas**| 8.3 | Managed database | Only persistence boundary. |
| **Mongoose** | 9.7.3 | ODM / Data Modeling | Schemas define all database structure. |
| **jsonwebtoken**| 9.x | Session tokens | Issue access tokens (15m) and refresh tokens (7d). |
| **argon2** | 0.44.x | Password hashing | Never store plain text passwords. |
| **express-rate-limit** | 8.x | Rate limiting | Protect public endpoints and checkout. |
| **helmet** | 8.x | Security headers | Enforce standard web protection. |
| **Zod** | 4.x | Request validation | Validate every body, query, and param. |
| **Vitest** | 4.x | API test runner | Run tests via `npm --workspace @minan/api run test`. |

### Project Directory Structure
```
apps/api/src/
├── controllers/          # HTTP request handlers (parse inputs, call services, send responses)
├── services/             # Pure business logic (orders, catalog, auth, bKash, meta)
├── models/               # Mongoose schema definitions (User, Product, Order, Counter, AuditLog)
├── routes/               # Express router modules
├── middleware/           # Auth, role check, error handling, rate limiting
├── schemas/              # Backend Zod validation schemas
├── lib/                  # Shared utilities (jwt, logger, db connection)
└── seed/                 # Database seed scripts for products and admin accounts
```

### Standard API Response Format
All API responses must strictly follow this JSON envelope:
```typescript
// Success Response (200 OK, 201 Created)
{
  "success": true,
  "data": { ... },
  "meta"?: {
    "page": 1,
    "limit": 20,
    "total": 120
  }
}

// Error Response (400, 401, 403, 404, 500)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Phone number must be a valid Bangladesh mobile number",
    "details"?: [ ... ]
  }
}
```

### Complete API Route Catalog

#### 1. Authentication (`/api/auth`)
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Validates credentials with Argon2; sets HTTP-only refresh cookie; returns access token. |
| `POST` | `/api/auth/refresh` | Cookie | Reads refresh cookie; verifies JWT; issues new access token. |
| `POST` | `/api/auth/logout` | Public | Clears the HTTP-only refresh cookie. |
| `POST` | `/api/auth/forgot-password`| Public | Generates time-limited reset token; sends password recovery instructions. |
| `POST` | `/api/auth/reset-password` | Public | Validates reset token and sets new Argon2 hashed password. |
| `GET` | `/api/auth/me` | Bearer | Returns the authenticated user profile and permissions. |

#### 2. Products (`/api/products`)
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | Returns paginated products. Query: `search`, `category`, `status`, `page`, `limit`, `sort`. |
| `GET` | `/api/products/:slug` | Public | Returns a single active product by slug for storefront display. |
| `POST` | `/api/products` | Staff | Creates a new product with variants, prices, and Cloudinary image URLs. |
| `PUT` | `/api/products/:id` | Staff | Updates product details, prices, or inventory levels. |
| `DELETE` | `/api/products/:id` | Staff | Deactivates or soft-deletes a product from the public catalog. |

#### 3. Collections (`/api/collections`)
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/collections` | Public | Returns active collections for storefront navigation. |
| `GET` | `/api/collections/:slug` | Public | Returns collection details and attached products. |
| `POST` | `/api/collections` | Staff | Creates a new collection category. |
| `PUT` | `/api/collections/:id` | Staff | Updates collection title, description, or banner image. |
| `DELETE` | `/api/collections/:id` | Staff | Deletes a collection. |

#### 4. Orders & Checkout (`/api/orders`)
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Public / Rate-limited | Creates a customer order. Validates stock, calculates delivery fee, records customer IP/User Agent. |
| `GET` | `/api/orders/track` | Public | Customer looks up order status using phone number and order number. |
| `GET` | `/api/orders` | Staff | Admin paginated order list. Filters: `status`, `paymentStatus`, `search`, `page`, `limit`. |
| `GET` | `/api/orders/:id` | Staff | Fetches full order details, delivery address, items, and status change audit history. |
| `PATCH` | `/api/orders/:id/status` | Staff | Updates order status (e.g. `confirmed`, `shipped`, `delivered`). Appends audit log entry. |
| `PATCH` | `/api/orders/:id/payment`| Staff | Manually updates payment status (e.g. verifying cash or manual bKash transaction ID). |

#### 5. Payments & bKash (`/api/payments/bkash`)
Detailed flow is documented in [bkash-payment-gateway-guide.md](file:///c:/new%20projects/minan/context/bkash-payment-gateway-guide.md).
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/bkash/create` | Public | Calls bKash Tokenized Checkout API to create payment URL for advance delivery fee or full payment. |
| `POST` | `/api/payments/bkash/execute`| Public | Executes bKash payment with `paymentID`; updates order status to paid; triggers Meta CAPI Purchase event. |
| `POST` | `/api/payments/bkash/webhook`| Public / Verified | Receives asynchronous bKash Instant Payment Notifications (IPN). |

#### 6. Admin, Staff & Audit (`/api/admin`)
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/metrics` | Staff | Returns dashboard KPIs: total revenue, order count by status, average order value, conversion trends. |
| `GET` | `/api/admin/audit-logs` | Super Admin | Returns paginated audit events: who changed which order or product, IP address, and timestamp. |
| `GET` | `/api/admin/staff` | Super Admin | Lists staff accounts and active roles. |
| `POST` | `/api/admin/staff` | Super Admin | Creates a new staff member account. |
| `PATCH` | `/api/admin/staff/:id` | Super Admin | Updates staff status (active/disabled) or changes role. |

#### 7. Media & Upload Signatures (`/api/media`)
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/media/sign-upload` | Staff | Generates a signed Cloudinary upload signature so admin client can upload images directly to CDN. |

## 4. Beginner Pitfalls & Common Mistakes to Avoid

- **Mistake:** Writing database queries directly inside an Express route file.
  **Fix:** Keep routes clean. Routes map to controllers. Controllers parse inputs. Services execute database queries.
- **Mistake:** Returning 200 OK when a validation error occurs.
  **Fix:** Always return 400 Bad Request with a clear validation error message so frontend forms display field errors.
- **Mistake:** Trusting prices sent from the browser client.
  **Fix:** The frontend only submits product IDs and quantities. The Express `orders.service.ts` must fetch product prices from MongoDB and calculate the total.
- **Mistake:** Forgetting to handle async errors in Express.
  **Fix:** Express 5 handles rejected promises automatically, but always pass unhandled errors to the next middleware or throw custom application errors.
