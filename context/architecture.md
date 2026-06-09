
## 5. Architecture

```
Browser → Next.js (Vercel) → Express API (Render) → MongoDB Atlas
```

- `proxy.ts` verifies JWT httpOnly cookie server-side before admin page renders (UI guard)
- Express middleware verifies JWT Bearer token on every protected API request (data guard)
- These are two independent checks — `proxy.ts` does NOT replace Express auth

### Request Layers

| Layer | Role |
|---|---|
| `proxy.ts` | Reads httpOnly access token cookie, verifies JWT, redirects if invalid |
| Next.js Client | Sends `Authorization: Bearer <token>` from Zustand on every API call |
| Express Middleware | Verifies Bearer token independently on every protected route |
| Express Routes | Business logic, DB ops, CAPI, rate limiting |
| Mongoose | Persistence |

### CORS

| Option | Value |
|---|---|
| `origin` | Vercel domain from env var — never `*` |
| `credentials` | `true` |

---