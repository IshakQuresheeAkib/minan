# MINAN Storefront Interaction and Payment Refresh Plan

This is the canonical implementation plan and evidence record. It supersedes the original native-scroll-only plan and incorporates the user-provided consolidated plan and Gemini review. Implementation date: 2026-10-05 (Asia/Dhaka).

## Scope and decisions

- Implement native category scrolling and manual payment-result refresh with safe retry tokens.
- Use ponytail: existing UI and platform behavior, minimal production diff, no speculative gesture guard.
- Use the existing Vitest runner with file-level jsdom component tests. Install only the approved development dependencies; normal semver ranges match the repository.
- Use ordinary HTTP mocks with a Next.js development server for browser integration. Production resolution requires HTTPS in `lib/api/server.ts`; retain that protection. Omit the temporary certificate harness and the five-run performance matrix per Gemini's feedback.
- Route-loading changes remain gated on reproduction and a trace-derived patch specification. This implementation supplies no production performance measurements and makes no routing/loading/cache changes.
- Preserve strict TypeScript, Express data boundaries, current checkout contracts, reference removal, analytics deduplication, and separate checkout stores. No backend/API/type changes, migrations, production dependencies, automatic polling, commits, pushes, or deployments.

Gemini's query-reference concern is covered: `shouldStripPaymentResultReference` returns true only for completed results; refresh is available only for initiated or verification_pending results. A completed result has no recheck action. Pointer capture alone is not evidence that native momentum is broken; no performance improvement is claimed.

## 1. Native category scrolling

- [x] Remove pointer capture, manual scrollLeft writes, drag refs/thresholds, click suppression, and related imports/handlers from CategoryChips.tsx.
- [x] Use touch-auto and native horizontal overflow; retain overscroll containment, dimensions, scrollbar hiding, spacing, select-none, and pending spinner/labels.
- [x] Remove grab cursors because mouse drag scrolling is not provided.
- [x] Preserve category callbacks (All submits undefined), catalog preview/preload/version safeguards, obsolete-response protection, and 250 ms search debounce.
- [x] Run the four existing home regression files.
- [x] Check narrow browser overflow and keyboard selection.
- [ ] Physical-device swipe/flick, swipe-then-tap, vertical/diagonal gestures, and pinch zoom. Physical iOS/Android devices were unavailable; emulation is not a substitute.

Add gesture suppression only after an accidental activation is reproduced. The guard must preserve mouse/keyboard behavior, cancellation, and the next valid tap. Do not restore manual scrolling.

## 2. Manual payment-result refresh

- [x] Replace document reload with startTransition(() => router.refresh()). Do not await refresh.
- [x] Show disabled Checking... feedback with aria-busy; keep navigation links available.
- [x] Guard refresh and retry against either pending operation and disable the corresponding controls.
- [x] Derive the token from the current result; retain local state only for a failed retry replacement paired with its exact originating result object.
- [x] Capture the originating result before awaiting retry. A newer server result supersedes a local replacement even when its state is unchanged; missing tokens remove retry. Late failures cannot attach their token to newer results.
- [x] Preserve validation against the originating payment contract, errors/loading release, provider/completed redirects, completion effects, and trackedOrder in the same mounted component.
- [x] Preserve reference removal before analytics, source-specific store/idempotency cleanup, accepted-event deduplication, and store retention for unavailable results.

## 3. Regression checks

Development dependencies added to @minan/web:

- @testing-library/react: ^16.3.3
- @testing-library/dom: ^10.4.2
- jsdom: ^30.1.2

PaymentResultClient.dom.test.tsx uses explicit cleanup, real render/rerender, ordinary Vitest assertions, mocked side effects, and a controlled Suspense update inside the real useTransition for pending behavior. The global Vitest environment is unchanged. The two existing static-markup payment tests remain and now mock the router.

Covered: refresh invocation/pending/busy, repeated clicks, bidirectional retry/refresh exclusion, allowed states, fresh/replacement/missing/late retry tokens, cart/buy-now isolation and correct idempotency keys, reference removal before tracking, accepted-event deduplication, unavailable preservation, retry rejection, contract mismatch, provider/completed continuation, and tracking/checkout links.

Commands run with Node 24.16.0 by prepending the installed v24.16.0 directory to PATH in each test process; the system Node version was not changed:

```powershell
npm --workspace @minan/web run test -- src/features/checkout src/features/home/components/CategoryChips.test.tsx src/features/home/components/HomeCatalogClient.test.tsx src/features/home/components/SelectedCategoryProducts.test.tsx src/features/home/components/SearchBar.lazy-loading.test.ts
npm --workspace @minan/api run test -- src/services/bkashPayments.service.test.ts src/controllers/bkash.controller.test.ts src/routes/bkash.routes.test.ts src/schemas/bkash.schemas.test.ts
npm --workspace @minan/web run typecheck
npm --workspace @minan/web run lint
npm --workspace @minan/web run build
git diff --check
```

Results: 51 web tests across 14 files (including 24 new DOM tests), 38 bKash API tests across four files, typecheck, and production build pass. ESLint exits zero with two existing relative-location-assign warnings in CheckoutForm.tsx and PaymentResultClient.tsx. Generated next-env.d.ts changes are restored after the build.

## 4. Browser evidence

Browser: Codex in-app Chromium 154 on Windows. Payment route: /payment/result. Temporary frontend port 3100, local-only HTTP mock port 3101. Existing development server was preserved; a temporary copy of apps/web with shared dependency junctions used next dev --webpack because Turbopack rejects junctions outside its project root. Production build was separately verified with the repository's normal Turbopack configuration.

- Pending result, delayed refresh (1.5-5 seconds): previous result stays visible; Checking... is disabled and aria-busy is true; checkout link remains available; reference stays in the URL.
- Pending to failed: refreshed Retry action appears. Mock logs confirm the first retry submits refreshed-token and the following retry submits replacement-token.
- Pending to completed: Payment confirmed renders, tracking/shopping links appear, and reference disappears only after completion.
- CDP request observation confirms RSC Fetch requests (rsc: 1, _rsc query), without a Document request during the tested refreshes.
- Resolver failure: Result unavailable renders and the reference stays in the URL.
- Browser fixtures use synthetic references/results and block payment creation. Only local mocked retry endpoints were contacted. GA4/Meta IDs were empty in the test process.
- Completion store isolation and accepted analytics deduplication are verified in DOM tests; browser store fixtures were not seeded.
- Narrow 390x844 viewport: category row clientWidth 344, scrollWidth 962, computed touch-action auto. Offscreen Summer keyboard activation selects Summer and brings the button into view.
- Horizontal wheel scrolling moves the row from its right limit to scrollLeft 118 without changing Summer selection. A following Women click selects Women; Space on All restores FEATURED CATEGORIES.

The unchanged payment Server Component emits a development diagnostic about uncached data outside Suspense. Refresh scenarios still resolve correctly, and the production build passes. This is not proof of a route-loading performance defect or authorization to refactor shared boundaries.

## 5. Delivery status and remaining verification

| Workstream | Status | Cutline |
| --- | --- | --- |
| Payment refresh/tokens | Verified for DOM behavior and local Next.js development integration | Production build passes; production HTTPS mock/browser testing omitted per adopted review. |
| Native category scroll | Verification incomplete | Component/tests and narrow browser interaction checked; physical-device gestures remain unchecked. |
| Route-loading performance | Verification incomplete; no source change justified by this work | Benchmark matrix deferred per Gemini review. No FCP/LCP/CLS or revisit improvement claimed. |

Before any later route patch, reproduce the full-screen revisit splash or a median revisit delay of at least 500 ms, identify the responsible boundary/request/callers, and add exact edits, regression scenario, and acceptance measurements here. Keep prefetch settings, cache lifetimes, connection(), speculation rules, and cart pricing unless traces implicate them. Preserve the initial splash without artificial delay. Do not add service workers, custom route caches, eager downloads, or speculative cache settings. Any connection() change additionally needs build-time outage, runtime recovery, and invalidation checks.

Deferred: homepage prerendering, search combobox semantics, category caching, and other unrelated UI/layout work. Other docs/ content and pre-existing changes are preserved.
