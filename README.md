# SGS Hyper Supermarket — Phase 1

One-page online ordering site for SGS Hyper Supermarket (Chennai). Customers
browse products, get matched to their nearest store by geolocation, build a
cart, and check out for **in-store pickup only** — no delivery in Phase 1.

Stack: React + Vite + TypeScript + Tailwind CSS.

## 1. Install & run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Hot-reloads as you edit.

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in:

- `VITE_RAZORPAY_KEY_ID` — your Razorpay **Key ID** (public, safe in
  frontend code). Get a test key from the Razorpay Dashboard →
  Settings → API Keys. Starts with `rzp_test_` for sandbox.
- `VITE_ORDER_API_BASE_URL` — see the payment backend section below.
  The site will still run and let people browse/cart without this, but
  the "Pay & Place Order" button needs it to actually take payment.

**Never put your Razorpay Key Secret in `.env` or any frontend file.**
It must only live on a server.

## 3. Payment backend (required before going live)

Razorpay requires an order to be created server-side before opening
checkout, and the payment signature verified server-side afterward —
both steps need your Key **Secret**, which can never ship in frontend
code. This repo's frontend (`src/lib/razorpay.ts`) is already wired to
call:

```
POST {VITE_ORDER_API_BASE_URL}/create-order
Body: { amount: <paise>, currency: "INR" }
Response: { orderId: "order_xxxxx" }
```

You'll need a small backend for this — a single serverless function is
enough (Vercel/Netlify function, AWS Lambda, or a tiny Express app).
Razorpay's docs show the exact server-side snippet:
https://razorpay.com/docs/payments/server-integration/nodejs/

Until that's deployed, the app is fully usable for browsing, cart, and
checkout form — payment will show a clear "not configured yet" message
instead of failing silently.

## 4. Build for production

```bash
npm run build
```

Outputs static files to `dist/`.

## 5. Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages, etc.):

1. Push this repo to GitHub/GitLab.
2. Import it in Vercel or Netlify.
3. Set the environment variables from `.env.example` in the host's
   dashboard (not committed to the repo).
4. Build command: `npm run build`, output directory: `dist`.
5. Deploy your payment backend separately (or as the same project's
   serverless functions folder) and point `VITE_ORDER_API_BASE_URL`
   at it.

## Project structure

```
src/
  data/            # Stores, categories, products, pickup slots — edit
                    # these to change catalog/config, not the UI
  lib/              # Haversine distance, currency formatting, Razorpay
  context/          # StoreContext (location + store selection),
                    # CartContext (cart state, localStorage-backed)
  components/       # Header, Hero, LocationDetector, StoreSelectorModal,
                    # CategoryList, ProductGrid, ProductCard, CartDrawer,
                    # Checkout, Payment, OrderConfirmation, Footer
  App.tsx           # View routing: shop → checkout → confirmation
```

## Adding the two remaining stores

Open `src/data/stores.ts` and fill in the `location-4` / `location-5`
entries with real `latitude`, `longitude`, `address`, and `phone`, then
flip `isActive: true`. They'll appear in the nearest-store detection,
manual selector, and checkout automatically — no other code changes
needed.

## Editing the product catalog

`src/data/products.ts` is sample data with placeholder images
(placehold.co). Replace it with your real inventory — every component
reads from the `Product` type in `src/types.ts`, so any data source
that matches that shape (a CMS, a spreadsheet export, a backend API)
can swap in later without touching the UI.

## Phase 2 hooks already in place

- `Store.deliveryEnabled` and `OrderType` in `src/types.ts` are ready
  for a `'DELIVERY'` order type — the checkout UI already shows a
  disabled "Home Delivery — Coming Soon" row.
- Store, product, and category data are all centralized config files,
  not hardcoded in components.
- `Order` type already models `orderStatus` progression
  (`PLACED → CONFIRMED → READY → COMPLETED`) for when you add an order
  management / tracking backend.

## States handled

- Empty cart (cart drawer and checkout)
- Location permission denied / unsupported browser → manual store picker
- Payment gateway not configured / failed → inline error, no silent failure
- No search/filter results
- Product out of stock
