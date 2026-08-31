# SGS Hyper Supermarket

Customer storefront, product administration, staff order management, pickup
tracking, stock alerts, and support tools for SGS Hyper Supermarket.

This branch uses a free Supabase project for the database, authentication,
storage, realtime order updates, and row-level security. The frontend is a
React application deployed as a static Vite site on Vercel.

## Stack

- React 18, TypeScript, and Vite
- Tailwind CSS
- Supabase Postgres, Auth, Storage, Realtime, and Row Level Security (RLS)
- Vercel for frontend previews and production hosting
- Optional Razorpay checkout; a secure server-side payment API is still needed

## Available pages

| URL | Purpose | Access |
| --- | --- | --- |
| `/` | Customer storefront and pickup checkout | Public |
| `/admin` | Products, orders, stock alerts, support, and account security | Owner/admin with MFA |
| `/staff` | Store order queue, stock alerts, support, and account security | Approved staff with MFA |
| `/track-order` | Track an order using order number and mobile number | Public |
| `/contact-us` | Submit a support request | Public |
| `/pickup-info` | Pickup locations and instructions | Public |

Vercel uses `vercel.json` to rewrite these client-side routes to the application.

## What is implemented

- Product search and category browsing
- Product price, MRP, automatic discount display, offers, images, and stock state
- Out-of-stock products remain visible and accept back-in-stock requests
- Unique product IDs enforced by both the UI and the database primary key
- Secure staff email/password authentication
- Mandatory TOTP MFA before staff data can be read or changed
- Owner, admin, and worker roles
- Workers restricted to orders from their assigned store
- Live order feed and order status changes
- Customer order tracking
- Support message and stock alert inboxes
- Supabase image uploads for product images
- Local browser-only fallback when Supabase is not configured

## Important current limitations

- Customer email notifications are not connected yet. Customers currently see
  updates on `/track-order`, which checks every 20 seconds.
- Razorpay cannot accept payments until a server-side API creates Razorpay
  orders and verifies payment signatures. The public key alone is not enough.
- Pay at Pickup is recommended for the free first release but is not yet a
  selectable payment method in the checkout UI.
- Owner and admin currently have the same catalog and order permissions. The
  owner role is reserved for future staff-management controls.
- Staff accounts and role changes are currently managed in Supabase, not inside
  the website.

## 1. Local setup

Requirements:

- Node.js 18 or newer
- npm
- A Supabase project

Install and start the application:

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/`.

Useful commands:

```powershell
npm run lint
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

`npm run dev` is the development server. `npm run preview` serves the compiled
production build after `npm run build`.

## 2. Environment variables

Create a local `.env` file from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Use Vite variable names exactly as shown:

```ini
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
VITE_SUPABASE_PRODUCTS_TABLE=products
VITE_SUPABASE_ADMINS_TABLE=admins
VITE_SUPABASE_PRODUCT_IMAGES_BUCKET=product-images
VITE_SUPABASE_ORDERS_TABLE=orders
VITE_SUPABASE_STAFF_TABLE=staff_members
VITE_SUPABASE_STOCK_ALERTS_TABLE=stock_alerts
VITE_SUPABASE_SUPPORT_MESSAGES_TABLE=support_messages

VITE_RAZORPAY_KEY_ID=
VITE_ORDER_API_BASE_URL=
VITE_GOOGLE_MAPS_API_KEY=
```

Find the Supabase values under **Supabase Dashboard > Project Settings > API**:

- Project URL goes in `VITE_SUPABASE_URL`.
- Publishable key, or the legacy anon key, goes in
  `VITE_SUPABASE_PUBLISHABLE_KEY`.

This is a Vite project. Do not use `NEXT_PUBLIC_SUPABASE_URL` or
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Rules for `.env`:

- Do not use Markdown links such as `[https://...](https://...)`.
- Do not commit `.env`; it is ignored by Git.
- The Supabase publishable/anon key is designed for browser use. RLS protects
  the database.
- Never put the Supabase service-role key, Razorpay secret, passwords, OTPs, or
  webhook secrets in a frontend variable or GitHub.
- Restart the Vite server after changing `.env`.

## 3. Supabase database setup

1. Create a Supabase project.
2. Open **SQL Editor**.
3. Open `supabase/schema.sql` from this repository.
4. Paste the entire script into a new query.
5. Click **Run**.

The script creates:

- `products`
- `admins` for backwards compatibility
- `staff_members`
- `orders`
- `stock_alerts`
- `support_messages`
- `product-images` storage bucket
- Order tracking and authorization functions
- RLS policies requiring approved roles and MFA

The script is safe to re-run when the schema changes. Existing owner and worker
roles are preserved.

Confirm the tables exist:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

If Supabase reports that `staff_members` is missing from the schema cache, run
the latest complete `supabase/schema.sql`, wait a few seconds, and reload the
site. The application can temporarily fall back to the legacy `admins` table,
but roles and store restrictions require `staff_members`.

## 4. Authentication URLs

In **Supabase Dashboard > Authentication > URL Configuration**, configure:

Local development:

```text
Site URL: http://127.0.0.1:4173
Redirect URL: http://127.0.0.1:4173/admin
Redirect URL: http://127.0.0.1:4173/staff
```

Vercel preview and production examples:

```text
https://YOUR-PROJECT.vercel.app/admin
https://YOUR-PROJECT.vercel.app/staff
https://YOUR-DOMAIN.com/admin
https://YOUR-DOMAIN.com/staff
```

Keep local, Vercel, and custom-domain redirect URLs while testing. Password
setup, password recovery, and email changes use these URLs.

## 5. Create the first owner

First create the login:

1. Open **Supabase Dashboard > Authentication > Users**.
2. Select **Add user**.
3. Enter the owner's email and a temporary strong password.
4. Create the user.

Then use SQL Editor to assign the owner role:

```sql
insert into public.staff_members (user_id, email, role, store_id)
select id, email, 'owner', null
from auth.users
where lower(email) = lower('owner@example.com')
on conflict (user_id) do update
set email = excluded.email,
    role = 'owner',
    store_id = null;
```

Verify it:

```sql
select email, role, store_id
from public.staff_members
order by email;
```

The Auth user and `staff_members` row are both required. Creating only one of
them is not enough.

## 6. Create admins and workers

Create every staff login under **Authentication > Users** first.

Create an admin who can manage the catalog and all orders:

```sql
insert into public.staff_members (user_id, email, role, store_id)
select id, email, 'admin', null
from auth.users
where lower(email) = lower('admin@example.com')
on conflict (user_id) do update
set email = excluded.email,
    role = 'admin',
    store_id = null;
```

Create a worker assigned to Thoraipakam:

```sql
insert into public.staff_members (user_id, email, role, store_id)
select id, email, 'worker', 'thoraipakam'
from auth.users
where lower(email) = lower('worker@example.com')
on conflict (user_id) do update
set email = excluded.email,
    role = 'worker',
    store_id = 'thoraipakam';
```

Valid active store IDs currently include:

- `thoraipakam`
- `velachery`
- `ocean-dew`

Use the exact ID from `src/data/stores.ts`. A worker assigned to `velachery`
cannot see a `thoraipakam` order. This restriction is enforced by Supabase RLS,
not only by the page.

## 7. Change a role or store

Promote a worker to admin:

```sql
update public.staff_members
set role = 'admin', store_id = null
where lower(email) = lower('worker@example.com');
```

Make an admin the owner:

```sql
update public.staff_members
set role = 'owner', store_id = null
where lower(email) = lower('admin@example.com');
```

Move a worker to another store:

```sql
update public.staff_members
set role = 'worker', store_id = 'velachery'
where lower(email) = lower('worker@example.com');
```

Remove website access without deleting the Auth login:

```sql
delete from public.staff_members
where lower(email) = lower('former-worker@example.com');
```

After a role change, the person should sign out and sign back in. Never give a
worker a null store assignment in production; a worker without an assigned
store will see no orders.

Role permissions:

| Capability | Owner | Admin | Worker |
| --- | --- | --- | --- |
| Edit products, prices, offers, stock, and images | Yes | Yes | No |
| View and update all store orders | Yes | Yes | No |
| View and update assigned-store orders | Yes | Yes | Yes |
| View support and stock-alert inboxes | Yes | Yes | Yes |
| Must use MFA | Yes | Yes | Yes |

## 8. MFA setup and sign-in

All company roles use the same authentication system.

1. Open `/admin` for an owner/admin or `/staff` for a worker.
2. Sign in with the Supabase Auth email and password.
3. On first sign-in, scan the QR code with an authenticator app such as Google
   Authenticator, Microsoft Authenticator, or 1Password.
4. Enter the current six-digit code to verify enrollment.
5. Future sign-ins require a current MFA code.

Database policies require an `aal2` MFA session before products or company data
can be managed. Hiding buttons is not the security boundary; Supabase RLS is.

If a person loses their authenticator, an authorized project owner must manage
that account through Supabase. Do not disable MFA policies just to regain quick
access.

## 9. Product and image management

Owners and admins can open `/admin` and use the **Products** tab to:

- Search by product ID, name, or brand
- Filter by category
- Add products
- Edit name, brand, category, pack size, price, MRP, offer text, and popularity
- Mark a product in or out of stock
- Upload an image to Supabase Storage
- Delete a product

Discount is calculated from MRP and selling price:

```text
discount percent = ((MRP - price) / MRP) * 100
```

Set MRP higher than price to display a discount. `offer_text` is descriptive and
does not itself change the price.

Product IDs are unique and cannot be reused by two products. Use stable IDs
such as `ponni-rice-5kg`; changing an ID creates a different product identity.

When a product becomes unavailable, turn off **In stock** instead of deleting
it. Customers will still see it with an Out of Stock label and can request a
notification.

Recommended images:

- JPG, PNG, or WebP
- Square or nearly square
- Consistent lighting and background
- Compressed before upload
- No private customer or staff information

## 10. Create and test a fake order

Run this in Supabase SQL Editor:

```sql
insert into public.orders (
  order_number,
  customer_name,
  customer_email,
  customer_mobile,
  store_id,
  order_type,
  items,
  pickup_date,
  pickup_slot_id,
  subtotal,
  charges,
  total,
  payment_status,
  order_status,
  status_note
)
values (
  'SGSTEST001',
  'Test Customer',
  'test@example.com',
  '9876543210',
  'thoraipakam',
  'PICKUP',
  '[{
    "productId": "test-product",
    "productName": "Test Rice",
    "brand": "SGS",
    "packSize": "1 kg",
    "imageUrl": "",
    "quantity": 2,
    "unitPrice": 100,
    "lineTotal": 200
  }]'::jsonb,
  current_date + 1,
  'slot-1',
  200,
  0,
  200,
  'PENDING',
  'PLACED',
  'Test order received.'
)
on conflict (order_number) do update
set customer_mobile = excluded.customer_mobile,
    store_id = excluded.store_id,
    payment_status = excluded.payment_status,
    order_status = excluded.order_status,
    status_note = excluded.status_note;
```

Test the worker view:

1. Ensure the worker has `store_id = 'thoraipakam'`.
2. Sign in at `/staff` and finish MFA.
3. Open **Orders** and find `SGSTEST001`.
4. Add a customer-facing note.
5. Change the status through Confirmed, Ready, and Completed.

Test the customer view:

1. Open `/track-order` in a private/incognito window.
2. Enter order number `SGSTEST001`.
3. Enter mobile number `9876543210`.
4. Confirm that the status and note match the worker view.
5. Change the status as the worker and wait up to 20 seconds, or refresh the
   customer page.

Order statuses:

```text
PLACED -> CONFIRMED -> READY -> COMPLETED
                         \-> CANCELLED
```

The current UI allows changing to any other status, including cancellation.

Useful diagnostic queries:

```sql
select email, role, store_id
from public.staff_members
order by email;

select order_number, store_id, payment_status, order_status, updated_at
from public.orders
order by created_at desc;
```

To move only the fake order to a worker's assigned store:

```sql
update public.orders o
set store_id = s.store_id
from public.staff_members s
where o.order_number = 'SGSTEST001'
  and lower(s.email) = lower('worker@example.com');
```

## 11. Support and stock-alert testing

Support:

1. Open `/contact-us` as a customer.
2. Submit the form.
3. Sign in at `/staff` or `/admin` with MFA.
4. Open **Support** and confirm the message appears.

Stock alerts:

1. Mark a product out of stock in `/admin`.
2. Find that product on the storefront.
3. Select **Notify me** and submit contact information.
4. Open **Stock Alerts** in `/staff` or `/admin`.

Submitting these forms stores the request. Automatic email/SMS delivery is not
implemented yet.

## 12. Payments and free testing

The safest free initial payment choice is Pay at Pickup. A merchant UPI QR can
also be used with manual verification, but staff must verify the transaction in
the merchant bank application and never trust a screenshot alone.

Razorpay Test Mode moves no real money and can be used for development. A
production-grade Razorpay integration requires server-side endpoints for:

- Creating the Razorpay order using the secret key
- Verifying the returned payment signature
- Receiving and verifying webhooks
- Updating `payment_status` only after server verification

The frontend expects:

```text
POST {VITE_ORDER_API_BASE_URL}/create-order
Body: { "amount": 10000, "currency": "INR" }
Response: { "orderId": "order_xxxxx" }
```

Never mark an order paid only because browser JavaScript reports success. Never
put a Razorpay secret in `.env`, a `VITE_` variable, GitHub, or Vercel's frontend
build output.

Leave both Razorpay variables blank until the server-side integration exists:

```ini
VITE_RAZORPAY_KEY_ID=
VITE_ORDER_API_BASE_URL=
```

## 13. Deploy a branch preview to Vercel

1. Push this branch to GitHub.
2. Import `Hari6682/sgs-hyper-supermarket` into Vercel, or open the existing
   Vercel project.
3. Set the framework preset to **Vite**.
4. Set build command to `npm run build`.
5. Set output directory to `dist`.
6. Add all required `VITE_SUPABASE_*` variables under **Project Settings >
   Environment Variables**.
7. Apply them to **Preview** first.
8. Deploy the branch and test every route.
9. Add the Vercel preview `/admin` and `/staff` URLs to Supabase redirect URLs.

Do not upload `.env` to GitHub. Vercel environment variables replace it during
deployment. After changing a Vercel environment variable, redeploy so Vite can
build it into the frontend.

## 14. Move from the Vercel URL to a custom domain

After preview testing is complete:

1. Open **Vercel > Project > Settings > Domains**.
2. Add the domain or subdomain.
3. Follow Vercel's DNS instructions at the domain registrar.
4. Wait for DNS and HTTPS verification.
5. Add the custom `/admin` and `/staff` URLs to Supabase Auth redirect URLs.
6. Change the Supabase Site URL to the final production domain when ready.
7. Test sign-in, password recovery, MFA, images, order creation, staff updates,
   and customer tracking on the final domain.

The application code does not need a hardcoded Vercel URL. It uses the current
browser origin for authentication redirects.

## 15. Security checklist before production

- Keep RLS enabled on every public table.
- Run the latest complete schema after pulling database changes.
- Require MFA for every owner, admin, and worker.
- Give each worker only their correct store assignment.
- Remove access immediately when employment or responsibilities change.
- Never expose service-role, payment, or webhook secrets.
- Verify payments on the server and make webhook processing idempotent.
- Use HTTPS; Vercel supplies it automatically for verified domains.
- Do not store card numbers, CVVs, UPI PINs, OTPs, or authenticator secrets.
- Review Supabase Auth users and `staff_members` regularly.
- Test worker access with a real worker account, not only an owner account.
- Back up production data before destructive database changes.

## 16. Troubleshooting

### Supabase variables appear ignored

- Use `VITE_SUPABASE_URL`, not `NEXT_PUBLIC_SUPABASE_URL`.
- Use plain values, not Markdown links.
- Restart the local server or redeploy Vercel after changes.
- Confirm `.env` is in the repository root beside `package.json`.

### `staff_members` is missing from the schema cache

Run the complete latest `supabase/schema.sql`. Do not run only the user insert.
Then reload the page.

### Signed in but access is denied

Confirm the Auth user ID has a matching row:

```sql
select u.id, u.email, s.role, s.store_id
from auth.users u
left join public.staff_members s on s.user_id = u.id
order by u.email;
```

### Worker sees zero orders

Compare the worker and order store IDs:

```sql
select email, role, store_id from public.staff_members;
select order_number, store_id, order_status from public.orders;
```

They must match exactly. Workers intentionally cannot see other stores.

### Admin can sign in but cannot save changes

- Complete MFA and confirm the session badge says `AAL2`.
- Confirm the role is `owner` or `admin`.
- Re-run the latest policies from `supabase/schema.sql`.

### Customer tracks an order but staff cannot see it

This usually means the worker's assigned store differs from the order's store,
or the staff session is not at MFA level `aal2`.

### Product disappears after a price change

Confirm `price` is a non-negative number, `mrp` is empty or a valid number, and
the product still has its original unique ID. Check the browser notice and the
Supabase `products` row for validation errors.

### Direct routes return 404 on Vercel

Confirm `vercel.json` is committed and redeploy. It contains the SPA rewrite
needed for `/admin`, `/staff`, and customer support routes.

## Project structure

```text
src/
  components/       Storefront, checkout, admin, staff, and support pages
  context/          Product, cart, store, and order state/data access
  data/             Store, category, sample product, and pickup configuration
  hooks/            Staff authentication and MFA session handling
  lib/              Supabase, Razorpay, currency, and geolocation helpers
  App.tsx            Client-side routing and providers
supabase/
  schema.sql         Tables, functions, storage bucket, and RLS policies
.env.example         Safe environment-variable template
vercel.json          Vercel SPA route rewrite
```

## Adding stores

Edit `src/data/stores.ts`. Replace placeholder location entries with the real
store name, address, phone, latitude, and longitude, then set `isActive: true`.
Use the same `storeId` when assigning workers and creating orders.

## Git workflow

Keep production changes isolated until testing is complete:

```powershell
git switch codex/admin-staff-orders
npm install
npm run lint
npm run build
```

Deploy this branch as a Vercel preview. Merge it into the production branch only
after Supabase, MFA, role restrictions, product editing, order updates, customer
tracking, and mobile/desktop layouts have all been tested.
