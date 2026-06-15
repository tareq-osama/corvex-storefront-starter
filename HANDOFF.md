# Handoff — Headless Storefront Starter

Status snapshot for the `corvex-storefront-starter` build. Plan of record:
`C:\Users\tarek\.claude\plans\sequential-mapping-codd.md` (Tracks A/B/C).

## TL;DR

- **Track A (backend changes in `the-corvex-cms`)**: done.
- **Track B1 (BFF proxy layer + API client in this repo)**: done, typechecks
  clean.
- **Track C (live integration test suites)**: written, structurally verified.
- **Track B2/B3 (ported UI — hooks/components/pages)**: **in progress**.
  Hooks, shadcn primitives, store components, and 7 pages (home, products
  list/detail, categories, search, cart, checkout) are done and build
  cleanly. **Next up: login/signup pages (task #27)** — see "Resume here"
  below.
- **Final verification (suites green against a live backend + manual
  cross-origin walkthrough)**: **not started** — see "Before you can run the
  live suite" below, including a Stripe test-key issue that must be resolved
  first.

---

## Architecture recap

- This is a **separate git repo**, sibling to `the-corvex-cms`, with its own
  `package.json` / lockfile / node_modules. No imports from the main repo.
- **BFF pattern**: the browser only ever talks to this app's own
  `/api/bff/**` routes. Those routes call the Corvex backend
  (`CORVEX_API_URL`) server-to-server using `lib/corvex/client.ts`
  (`corvexFetch`), forwarding:
  - `Authorization: Bearer <member_sessions.token>` for member auth
  - `X-Cart-Session: <cart.session_token>` for anonymous carts
- Tokens are held in **first-party httpOnly cookies** on this app's own
  domain (`lib/corvex/cookies.ts`):
  - `corvex_member_token` — member session token (30-day or `expires_at`)
  - `corvex_cart_token` — anonymous cart session token (cleared once a cart
    is merged into a member's cart on login)
- Cart merge-on-login is automatic: `POST /api/bff/auth/login` checks for a
  `corvex_cart_token` cookie and calls `/api/store/{ws}/cart/merge`.
- **Single-tenant**: one `NEXT_PUBLIC_WORKSPACE_ID` per deployment, resolved
  server-side. **No ported page/hook/component takes a `workspaceId` param**,
  none use `useStorePath`/`sp()`/`basePath` — all links are root-relative
  (`/products`, `/cart`, `/checkout`, etc.).

## Conventions established for the UI port (apply to all remaining pages)

- **Heroicons → lucide-react** mapping used so far: `XMarkIcon`→`X`,
  `MinusIcon`→`Minus`, `PlusIcon`→`Plus`, `ShoppingBagIcon`→`ShoppingBag`,
  `TagIcon`→`Tag`, `CheckCircleIcon`→`CheckCircle`, `Bars3Icon`→`Menu`,
  `ArrowDownTrayIcon`→`Download`, `LockOpenIcon`→`Unlock`,
  `SparklesIcon`→`Sparkles`, `CheckIcon`→`Check`, `TruckIcon`→`Truck`,
  `CreditCardIcon`→`CreditCard`.
- **No shadcn `Select`** — `@radix-ui/react-select` is NOT installed and we
  decided not to add it. Use native `<select>` with a local constant:
  ```ts
  const SELECT_CLASS =
    "h-9 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
  ```
  (already defined locally in `app/products/page.tsx` and
  `app/categories/[slug]/page.tsx` — duplicate it again where needed, don't
  extract a shared module unless asked).
- **`useSearchParams()` + static export** — Next 16 fails the build with
  "useSearchParams() should be wrapped in a suspense boundary" unless wrapped.
  Pattern: outer `export default function XPage()` returns
  `<Suspense fallback={null}><XPageContent /></Suspense>`; inner
  `function XPageContent()` has the real logic. Applied to `search`,
  `products`, `categories/[slug]`.
- **R2 images**: use `toProxiedImageSrc()` from `lib/image.ts` (NOT
  `toProxiedImageSrcFromR2` from the main repo's `@/lib/client-utils`).
- **Tailwind v4**: config lives in `app/globals.css` via `@import
  "tailwindcss";` + `@plugin "...";` directives (no `tailwind.config.js`).
  `@plugin "@tailwindcss/typography";` was added (line 2) for `prose` classes
  used in product descriptions; `@tailwindcss/typography@^0.5.20` added to
  devDependencies.
- Dynamic route pages use `params: Promise<{...}>` + `use(params)` (React 19 /
  Next 16 pattern), e.g. `app/products/[handle]/page.tsx`,
  `app/categories/[slug]/page.tsx`.

## Track A — backend changes (already committed in `the-corvex-cms`)

- `resolveMemberIdUnified` (Bearer-or-cookie) is now used across all store
  routes: cart, cart/items, cart/items/[itemId], cart/discount, checkout,
  account, account/orders(+[id]), account/addresses(+[id]),
  account/purchases, products/[handle]/my-downloads,
  products/[handle]/claim.
- `getCartSessionToken(request)` added to `lib/services/store-auth.ts` —
  reads `X-Cart-Session` header first, falls back to the `corvex_cart_session`
  cookie. Wired into all cart + checkout routes.
- No CORS middleware added by design — `/api/store/*` stays same-origin /
  server-to-server only. This is intentional (see plan A3).
- Stripe checkout (`/api/store/[workspaceId]/checkout`) confirmed
  origin-agnostic: creates a `PaymentIntent` with
  `metadata.payment_type: 'store_order'`; the global webhook
  (`app/api/webhooks/stripe/route.ts`) marks `store_orders.payment_status =
  'paid'` on `payment_intent.succeeded` regardless of caller origin.

## Track B1 — BFF layer in this repo (done, typechecks clean)

### Core (`lib/corvex/`)
- `client.ts` — `corvexFetch()`, `CorvexApiError`, `storePath()`,
  `membersPath()`, `getWorkspaceId()`. Reads `CORVEX_API_URL` +
  `NEXT_PUBLIC_WORKSPACE_ID`. `cache: 'no-store'` everywhere.
- `cookies.ts` — cookie constants/helpers (`corvex_member_token`,
  `corvex_cart_token`).
- `cart-proxy.ts` — `readCartTokens()`, `persistCartToken()`.

### Types (`lib/types/`)
- `store.ts` — copied verbatim from `the-corvex-cms` (`StoreProduct`,
  `Cart`, `CartItem`, etc.)
- `account.ts` — `Member`, `AuthResponse`, `ShippingAddress*`, `StoreOrder*`,
  `CheckoutRequest/Response`, `Purchase`, `DownloadFile`,
  `MyDownloadsResponse`, `ClaimResponse`.
- `cms.ts` — `CmsFieldDefinition`, `CmsCollectionSummary`, `CmsItemSummary`,
  `CmsItemDetail`, `CmsCollectionResponse`, `CmsItemResponse`.

### Routes (`app/api/bff/**`) — confirmed full inventory this session
```
app/api/bff/account/addresses/[id]/route.ts
app/api/bff/account/addresses/route.ts
app/api/bff/account/orders/[id]/route.ts
app/api/bff/account/orders/route.ts
app/api/bff/account/purchases/route.ts
app/api/bff/account/route.ts
app/api/bff/auth/login/route.ts
app/api/bff/auth/logout/route.ts
app/api/bff/auth/register/route.ts
app/api/bff/auth/session/route.ts
app/api/bff/cart/discount/route.ts
app/api/bff/cart/items/[itemId]/route.ts
app/api/bff/cart/items/route.ts
app/api/bff/cart/route.ts
app/api/bff/categories/[slug]/route.ts
app/api/bff/categories/route.ts
app/api/bff/checkout/route.ts          <- shipping-methods subroute MISSING, see task #26 below
app/api/bff/collections/[slug]/items/[itemSlug]/route.ts
app/api/bff/collections/[slug]/route.ts
app/api/bff/products/[handle]/claim/route.ts
app/api/bff/products/[handle]/my-downloads/route.ts
app/api/bff/products/[handle]/route.ts
app/api/bff/products/route.ts
app/api/bff/search/route.ts
```
All follow the same pattern: read tokens from cookies →
`corvexFetch<T>(...)` → on `CorvexApiError` pass through `error.body` +
`error.status`; on other errors, log + 500.

## Track C — live integration tests (`tests/`)

Cookie-jar based black-box tests that hit **this app's own BFF over HTTP**
(`BFF_URL`, default `http://localhost:3001`), which in turn calls the live
backend (`CORVEX_API_URL`, default `http://localhost:3000`).

- `tests/helpers/http-client.ts` — `TestClient`: minimal fetch wrapper that
  captures/replays `Set-Cookie` across requests (uses
  `Response.headers.getSetCookie()`).
- `tests/helpers/seed.ts` — `requireEnv`, `optionalEnv`, `createClient()`,
  `loginTestMember()` (logs in `TEST_MEMBER_EMAIL`/`PASSWORD`, registers if
  missing), `uniqueEmail()`.
- `tests/integration/auth.test.ts` — register/login/session/logout,
  validation errors (bad email, short password), duplicate-email 409, wrong
  password 401. Uses a fresh `uniqueEmail()` per run — no env fixtures needed.
- `tests/integration/products.test.ts` — list (pagination/sort), 404 for
  unknown handle, categories list + detail, search. Product-detail-by-handle
  test gated on `TEST_PAID_PRODUCT_HANDLE`.
- `tests/integration/cms.test.ts` — collection 404, collection
  list/pagination + single item, gated on `TEST_CMS_COLLECTION_SLUG` /
  `TEST_CMS_ITEM_SLUG`.
- `tests/integration/cart.test.ts` — anonymous cart creation; with
  `TEST_PAID_PRODUCT_HANDLE` (or `TEST_FREE_DIGITAL_PRODUCT_HANDLE`): add/
  update/remove item, **merge-on-login** (anon cart → member cart), discount
  apply/remove gated on `TEST_DISCOUNT_CODE`.
- `tests/integration/account.test.ts` — 401 when anonymous; as
  `TEST_MEMBER_EMAIL`: profile get/update, orders list + 404 for
  nonexistent order, purchases list, shipping address CRUD + set-default,
  and (gated on `TEST_FREE_DIGITAL_PRODUCT_HANDLE`) claim + my-downloads.
- `tests/integration/checkout.test.ts` — **gated on
  `STRIPE_TEST_SECRET_KEY` + `TEST_PAID_PRODUCT_HANDLE`** (whole suite
  skipped if either is missing). Adds product to cart, calls
  `/api/bff/checkout`, confirms the returned PaymentIntent with Stripe's
  `pm_card_visa` test payment method (no browser needed), then polls
  `/api/bff/account/orders/[id]` until `payment_status === 'paid'`
  (webhook-driven). Free-product path checked separately if
  `TEST_FREE_DIGITAL_PRODUCT_HANDLE` is set.

### Env files
- `.env.local.example` → copy to `.env.local` for `pnpm dev`
  (`CORVEX_API_URL`, `NEXT_PUBLIC_WORKSPACE_ID`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
- `.env.test.example` → copy to `.env.test` for `pnpm test` (adds `BFF_URL`,
  `TEST_MEMBER_EMAIL`/`PASSWORD`, Stripe test keys, and seeded fixture
  handles/slugs — see file for the full list). `.gitignore` updated so
  `.env*` stays ignored but `.env*.example` is tracked.

---

## Track B2/B3 — UI port progress

### Done — hooks, shadcn primitives, store components (task #20–24)
- React Query hooks: `lib/hooks/use-products.ts` (`useProducts(filters?)`,
  `useProduct(handle)`, `useProductSearch(query)`), `use-categories.ts`
  (`useCategories()`, `useCategory(slug, filters?)`), `use-cart.ts`
  (`cartKeys`, `useCart`, `useAddToCart`, `useUpdateCartItem`,
  `useRemoveCartItem` — all hit `/api/bff/cart*`), `use-auth.ts`
  (`authKeys`, `useSession`, `useLogin`, `useRegister`, `useLogout` — all hit
  `/api/bff/auth/*`; `useLogin`/`useLogout` invalidate `cartKeys.all`).
- shadcn primitives ported: button, badge, input, label, skeleton, sheet,
  separator, card, toaster.
- `components/store/cart-context.tsx` — `CartProvider` /
  `useCartContext()`. **Exposed interface**: `{ cart, isLoading, itemCount,
  isDrawerOpen, openDrawer, closeDrawer, addItem(productId, variantId?,
  quantity?), updateQuantity(itemId, quantity), removeItem(itemId), isAdding,
  isUpdating, isRemoving }`. **No `refreshCart`** — see task #26 notes.
- `components/store/discount-code-input.tsx` — `DiscountCodeInput({
  appliedCode?, className? })`, **no `workspaceId` prop**, posts directly to
  `/api/bff/cart/discount`, updates `cartKeys.detail` query cache.
- `components/store/checkout/address-form.tsx` — `AddressForm({ data,
  onChange, errors? })`, exports `AddressData` interface (`first_name,
  last_name, address_line1, address_line2, city, state, postal_code, country,
  phone`) and `emptyAddress`.
- `components/store/image-gallery.tsx`, `variant-selector.tsx`,
  `price-display.tsx`, `product-grid.tsx` — all ported, no `workspaceId`.

### Done — pages (task #25)
- `app/page.tsx` (home) — hero, featured products, categories, all products.
- `app/products/page.tsx` — list with native `<select>` category/sort
  filters, pagination, Suspense-wrapped.
- `app/products/[handle]/page.tsx` — detail page: gallery, variant selector,
  price, add-to-cart / free-claim CTA (`/api/bff/products/${handle}/claim`,
  `/api/bff/products/${handle}/my-downloads`), owned-product downloads,
  related products.
- `app/categories/[slug]/page.tsx` — category page with native `<select>`
  sort, pagination, Suspense-wrapped.
- `app/search/page.tsx` — debounced search, Suspense-wrapped.

Verified: `pnpm build` succeeds (21 static pages, `/`, `/products`, `/search`
static; `/categories/[slug]`, `/products/[handle]` dynamic as expected; all
`/api/bff/**` routes dynamic). `npx tsc --noEmit` clean.

---

## Done — Task #26: cart + checkout pages

- `app/cart/page.tsx` — ported from `app/store/[workspaceId]/cart/page.tsx`.
  `QuantityControl` sub-component ported as-is (debounced 350ms quantity
  update via `setTimeout`), `MinusIcon`/`PlusIcon` (heroicons) →
  `Minus`/`Plus` (lucide-react). Uses `useCartContext()` for `{cart,
  isLoading, updateQuantity, removeItem}`,
  `<DiscountCodeInput appliedCode={appliedCode} />` (no `workspaceId` prop),
  `toProxiedImageSrc()` for thumbnails with inline SVG fallback. All links
  root-relative (`/`, `/products`, `/checkout`).

- `app/checkout/page.tsx` — ported from
  `app/store/[workspaceId]/checkout/page.tsx`. Full step machine
  (`DIGITAL_STEPS = ["Review", "Payment", "Done"]`, `PHYSICAL_STEPS =
  ["Address", "Shipping", "Payment", "Done"]`, `CheckoutSteps`,
  address/shipping/payment/done steps), `OrderSummary` (ported as an inline
  function, drops `workspaceId`, posts to `/api/bff/cart/discount` and
  updates the `cartKeys.detail` query cache), `StripePaymentForm` (ported
  as-is — `loadStripe()`, `Elements`, `elements.submit()` +
  `stripe.confirmPayment({elements, redirect: "if_required"})`).
  - **`refreshCart()` replacement**: the original called `refreshCart()`
    after a successful order. There's no such method on
    `useCartContext()`. Replaced with `useQueryClient()` +
    `queryClient.invalidateQueries({ queryKey: cartKeys.all })` (from
    `@/lib/hooks/use-cart`), called on free-order success and on Stripe
    payment success.
  - **Auth check**: replaced Supabase `supabase.auth.getUser()` with
    `useSession()` from `@/lib/hooks/use-auth.ts`. A `useEffect` redirects to
    `/login?next=/checkout` when `!sessionLoading && !session?.member`.
  - **Lint-clean patterns established (apply to remaining pages too)**:
    - Lazy-init state instead of `useState<any>(null)` + loading
      `useEffect`, e.g. the Stripe promise:
      ```ts
      const [stripePromise] = useState<Promise<Stripe | null> | null>(() => {
        if (typeof window === "undefined") return null
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        return key ? loadStripe(key) : null
      })
      ```
      (import `type { Stripe }` from `@stripe/stripe-js`).
    - One-shot state derived from async-loaded data (e.g. the initial
      `stepKey` once the cart finishes loading) uses the "adjust state
      during render" pattern — a conditional `setState` call directly in the
      render body, guarded by a `hasInitialized`-style flag — instead of
      `useEffect` + `setState` (avoids the `react-hooks/set-state-in-effect`
      lint error):
      ```ts
      const [stepInitialized, setStepInitialized] = useState(false)
      if (!isLoading && !stepInitialized) {
        setStepInitialized(true)
        setStepKey(hasPhysical ? "address" : "payment")
      }
      ```
    - Avoid `any` in `catch` blocks: `catch (e) { ... e instanceof Error ?
      e.message : "fallback" }`.
    - Avoid `any` for loosely-typed fields via inline casts, e.g.
      `(i.product as { requires_shipping?: boolean } | undefined)?.requires_shipping`.

- `app/api/bff/checkout/shipping-methods/route.ts` — **new BFF route**
  (didn't exist before). Public, unauthenticated `GET`, mirrors
  `app/api/bff/categories/route.ts`'s shape: `corvexFetch<ShippingMethodsResponse>(storePath('/checkout/shipping-methods'))`.
  No member/cart token needed.

- `lib/types/account.ts` — added `ShippingMethod` (`{id, name, description,
  price, currency, min_delivery_days, max_delivery_days, free_above}`) and
  `ShippingMethodsResponse` (`{ methods: ShippingMethod[] }`).

Verified: `npx tsc --noEmit` clean. `pnpm build` succeeds — `/cart` and
`/checkout` are static (`○`), `/api/bff/checkout/shipping-methods` is dynamic
(`ƒ`). `npx eslint app/cart/page.tsx app/checkout/page.tsx
app/api/bff/checkout/shipping-methods/route.ts` → **0 errors** (2
`no-img-element` warnings, same non-blocking warning pattern as raw `<img>`
usage elsewhere — acceptable, no stricter precedent exists).

---

## Done — Task #27: login/signup pages

- `app/login/page.tsx` — ported the visual structure of
  `app/store/[workspaceId]/login/page.tsx` (card layout, email/password
  fields with show/hide toggle, field-level error highlighting).
  `handleSubmit` calls `useLogin().mutateAsync({email, password})`; on
  success `router.push(next)` where `next = searchParams.get("next") ?? "/"`.
  Wrapped in `<Suspense>` per the `useSearchParams()` + static export pattern
  (see `app/search/page.tsx`).
  - Dropped the `/api/hub/workspace/${workspaceId}/info` company-branding
    fetch entirely — replaced with a static avatar (`SITE_NAME[0]`) and
    heading using `NEXT_PUBLIC_SITE_NAME` (same env var already used in
    `layout.tsx`/`store-footer.tsx`/`store-header.tsx`).
  - Dropped the forgot-password link — no corresponding BFF route/page
    exists. Follow-up if needed later.
  - Field-level error mapping: backend's `"Invalid email or password"` (401)
    → generic `"Incorrect email or password."` with both email+password
    fields highlighted (don't reveal which field was wrong).
  - Icons: `ArrowRightIcon`→`ArrowRight`, `EnvelopeIcon`→`Mail`,
    `LockClosedIcon`→`Lock`, `EyeIcon`→`Eye`, `EyeSlashIcon`→`EyeOff`.
  - "Create an account" link → `/signup${next ? "?next=..." : ""}`.

- `app/signup/page.tsx` — ported `PasswordStrength` helper as-is (3-bar
  strength meter based on length/uppercase/digit checks).  `handleSubmit`
  calls `useRegister().mutateAsync({email, name, password})`; since there's
  no email-verification step, the "check your inbox" success screen (`sent`
  state, `CheckCircleIcon`) was dropped entirely — on success it redirects
  straight to `next ?? "/"` like login.
  - Client-side enforces an 8-character password minimum before calling the
    mutation (backend itself only requires 6) — kept the stricter UI-side
    rule from the source page.
  - Field-level error mapping: backend's `"An account with this email
    already exists"` (409) → `"An account with this email already exists.
    Please sign in instead."` with the email field highlighted.
  - Icons: added `UserIcon`→`User` to the mapping above.
  - "Sign in instead" link → `/login${next ? "?next=..." : ""}`.

- Both pages: no `workspaceId`/`use(params)`, no `createStoreClient` import.
  Same root-relative link convention as #26.

Verified: `npx tsc --noEmit` clean, `npx eslint app/login/page.tsx
app/signup/page.tsx` clean (0 errors/warnings). `pnpm build` succeeds — both
`/login` and `/signup` are static (`○`). Full end-to-end browser test:
signup creates an account, sets the session cookie, and updates the header
(`Sign in` → `Account`/`Sign out`); sign-out clears the session; login with
the same credentials redirects to `/` and restores the authenticated header.

---

## Done — Task #28: account pages (profile, orders, addresses, purchases)

All pages live under `app/account/**`, sharing the existing `app/account/layout.tsx`
sidebar (Profile / Addresses / Orders / Purchases / Sign out — Billing nav item
dropped, no corresponding BFF route).

- `app/account/page.tsx` — Profile. `useProfile()`/`useUpdateProfile()` from
  `lib/hooks/use-account.ts`. Avatar shows initials derived from
  `member.full_name ?? member.email`. Editable "Full name" field with
  "Save changes" → "Saved!" confirmation (2.5s timeout).
- `app/account/addresses/page.tsx` — list/add/edit/delete shipping addresses
  via `useShippingAddresses`/`useCreateAddress`/`useUpdateAddress`/`useDeleteAddress`.
  Reuses `AddressForm`/`AddressData`/`emptyAddress` from
  `components/store/checkout/address-form.tsx`. "Set default" calls
  `update.mutateAsync({ id, action: 'set_default' })` — discovered this
  `action` param convention from the backend route, not documented elsewhere.
- `app/account/orders/page.tsx` — paginated order list via `useOrders(page)`,
  rows link to `/account/orders/[id]`. Uses `OrderStatusBadge` and
  `PriceDisplay`.
- `app/account/orders/[id]/page.tsx` — order detail. `use(params)` for the
  dynamic `[id]` segment (only account route needing it — others are
  root-relative per #26 convention). Renders items with `toProxiedImageSrc`,
  totals breakdown, shipping/billing address blocks (or "No address on file"
  for digital orders).
- `app/account/purchases/page.tsx` — digital purchases/downloads via
  `usePurchases()`. Single-file purchases get a direct `<a download>` button;
  multi-file purchases expand/collapse a file list. "View" links to
  `/products/[handle]`.
- `components/store/store-footer.tsx` — **fixed pre-existing bug** (found
  while building this task, not part of the original ask): footer ACCOUNT
  section always showed "Sign In"/"Create Account" regardless of auth state,
  while the header correctly showed "Account"/"Sign out". Converted to a
  client component using `useSession()`/`useLogout()` (same pattern as
  `store-header.tsx`) so the footer now shows "My Account"/"Sign out" when
  logged in.

### Bug found + fixed in `the-corvex-cms` backend (blocking issue)

`/api/bff/account` → backend `GET /api/store/[workspaceId]/account` was
returning `404 { error: "Member not found" }` for a valid, logged-in member
with a verified-good `member_sessions` row. Root cause: the route's Supabase
queries selected/updated a column `full_name` on `website_members`, but that
table's actual column is `name` (confirmed via `information_schema.columns`).
PostgREST errors on the unknown column, so `.single()` returns `data: null`,
and the route's `if (!member)` check produced a false 404 — even though
`resolveMemberIdUnified` had already succeeded.

Fixed in `the-corvex-cms`:
- `app/api/store/[workspaceId]/account/route.ts` — GET/PATCH now
  `select`/`update` the `name` column, and the JSON response maps it back to
  `full_name` (`{ ...member, full_name: member.name }`) so the existing
  `Member.full_name` contract used by both this storefront and the in-app
  store account hooks (`lib/hooks/use-store-account.ts`) didn't need to
  change.
- `app/api/store/[workspaceId]/checkout/route.ts` — same `full_name` →
  `name` column fix for the Stripe `receipt_email` lookup (was silently
  returning `undefined` due to the same query error).

Verified end-to-end in browser: `/account` now shows "Test Shopper" /
"test-shopper@example.com" / "Member since June 2026" / "TS" avatar; editing
"Full name" and clicking "Save changes" shows "Saved!" and updates the
avatar/header immediately.

Verified: `npx tsc --noEmit` clean (both repos, after removing stale
`.next/dev/types/validator.ts` / `.next/types/validator.ts`). `pnpm build`
(storefront) succeeds — `/account`, `/account/addresses`, `/account/orders`,
`/account/purchases` static (`○`), `/account/orders/[id]` dynamic (`ƒ`).
`npx eslint` on new pages → 0 errors (2 `no-img-element` warnings, same
accepted pattern as elsewhere).

---

## Remaining tasks

- **#29**: CMS collection archive + single item pages — BFF routes exist at
  `app/api/bff/collections/[slug]/route.ts` and
  `app/api/bff/collections/[slug]/items/[itemSlug]/route.ts`.
- **#30**: final typecheck + build verification of all ported UI.
- **#9/#19**: full Vitest integration suite green + manual cross-origin
  walkthrough (Track C, see below).

## ⚠️ Before you can run the live Track C suite: Stripe key issue

`the-corvex-cms/.env.local` currently has **`STRIPE_SECRET_KEY=sk_live_...`**
(live mode), not a test key. The checkout integration suite uses Stripe's
test-only `pm_card_visa` payment method, which **will not work against a
live-mode key** (and you do not want PaymentIntents hitting a live Stripe
account from a test run).

**Do not point `tests/integration/checkout.test.ts` at the current
`the-corvex-cms` dev server as-is.** Before running it:

1. Get Stripe **test-mode** keys (`sk_test_...` / `pk_test_...`) and a
   **test-mode webhook signing secret** (`whsec_...`) — easiest via
   `stripe listen --print-secret`.
2. Run the backend with those test values overridden (e.g. a separate
   `.env.local` profile, or
   `STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_... pnpm dev`).
3. Run `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`
   in another terminal so `payment_intent.succeeded` reaches the backend —
   the checkout test polls the order's `payment_status` and times out if the
   webhook never arrives.
4. Only then set `STRIPE_TEST_SECRET_KEY` + `TEST_PAID_PRODUCT_HANDLE` in
   `.env.test` — without those, `checkout.test.ts` self-skips entirely, so
   the other 5 suites can run safely regardless.

## How to run what exists today

```bash
# In corvex-storefront-starter/
pnpm install
cp .env.local.example .env.local   # fill in CORVEX_API_URL + NEXT_PUBLIC_WORKSPACE_ID
pnpm dev -- -p 3001                # starter's own BFF, port 3001

# In the-corvex-cms/ (separate terminal)
pnpm dev                           # backend, port 3000

# Back in corvex-storefront-starter/
cp .env.test.example .env.test     # fill in TEST_MEMBER_EMAIL/PASSWORD at minimum
pnpm test
```

With only `BFF_URL`/`CORVEX_API_URL`/`NEXT_PUBLIC_WORKSPACE_ID` +
`TEST_MEMBER_EMAIL`/`PASSWORD` set, you get: full `auth.test.ts`, the
non-gated parts of `products.test.ts` and `cart.test.ts` (anonymous cart),
`account.test.ts` minus the claim/downloads check, and the `cms.test.ts`
404 check. Everything else self-skips until the corresponding env vars are
filled in.

## Project memory pointer

This whole effort is also tracked in the main repo's auto-memory at
`C:\Users\tarek\.claude\projects\D--Work-Corvex-corvex-cms-project-the-corvex-cms\memory\`.
After finishing each UI-port task, add/update a `project`-type memory entry
(per `the-corvex-cms/CLAUDE.md`'s "Memory after every feature/fix" rule)
summarizing decisions — especially the `refreshCart` → `invalidateQueries`
decision and the new `shipping-methods` BFF route once added.
