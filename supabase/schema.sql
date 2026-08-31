create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text not null,
  category_id text not null,
  pack_size text not null,
  price numeric(10, 2) not null check (price >= 0),
  mrp numeric(10, 2),
  image_url text not null,
  offer_text text,
  popular boolean not null default false,
  in_stock boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('owner', 'admin', 'worker')),
  store_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text,
  customer_mobile text not null,
  store_id text not null,
  order_type text not null default 'PICKUP',
  items jsonb not null default '[]'::jsonb,
  pickup_date date not null,
  pickup_slot_id text not null,
  subtotal numeric(10, 2) not null default 0,
  charges numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  payment_status text not null default 'PENDING',
  order_status text not null default 'PLACED',
  status_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_alerts (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  product_name text not null,
  customer_name text not null,
  email text,
  mobile_number text,
  notified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  mobile_number text,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update
set public = excluded.public;

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_company_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_members where user_id = auth.uid()
  ) or exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

create or replace function public.is_catalog_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_members
    where user_id = auth.uid()
      and role in ('owner', 'admin')
  ) or exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

create or replace function public.can_access_order(p_store_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_members
    where user_id = auth.uid()
      and (
        role in ('owner', 'admin')
        or (role = 'worker' and store_id = p_store_id)
      )
  ) or exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

create or replace function public.track_order(p_order_number text, p_mobile_number text)
returns table (
  id uuid,
  order_number text,
  customer_name text,
  customer_email text,
  customer_mobile text,
  store_id text,
  order_type text,
  items jsonb,
  pickup_date date,
  pickup_slot_id text,
  subtotal numeric,
  charges numeric,
  total numeric,
  payment_status text,
  order_status text,
  status_note text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_email,
    o.customer_mobile,
    o.store_id,
    o.order_type,
    o.items,
    o.pickup_date,
    o.pickup_slot_id,
    o.subtotal,
    o.charges,
    o.total,
    o.payment_status,
    o.order_status,
    o.status_note,
    o.created_at,
    o.updated_at
  from public.orders o
  where o.order_number = p_order_number
    and o.customer_mobile = p_mobile_number
  limit 1;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_products_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_products_updated_at();

alter table public.products enable row level security;
alter table public.admins enable row level security;
alter table public.staff_members enable row level security;
alter table public.orders enable row level security;
alter table public.stock_alerts enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products
for all
to authenticated
using (
  public.is_catalog_manager()
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
)
with check (
  public.is_catalog_manager()
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
);

drop policy if exists "Admins can read own access row" on public.admins;
create policy "Admins can read own access row"
on public.admins
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Staff can read own access row" on public.staff_members;
create policy "Staff can read own access row"
on public.staff_members
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Customers can create orders" on public.orders;
create policy "Customers can create orders"
on public.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "Staff can read orders" on public.orders;
create policy "Staff can read orders"
on public.orders
for select
to authenticated
using (
  public.can_access_order(store_id)
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
);

drop policy if exists "Staff can update orders" on public.orders;
create policy "Staff can update orders"
on public.orders
for update
to authenticated
using (
  public.can_access_order(store_id)
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
)
with check (
  public.can_access_order(store_id)
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
);

drop policy if exists "Customers can request stock alerts" on public.stock_alerts;
create policy "Customers can request stock alerts"
on public.stock_alerts
for insert
to anon, authenticated
with check (true);

drop policy if exists "Staff can view stock alerts" on public.stock_alerts;
create policy "Staff can view stock alerts"
on public.stock_alerts
for select
to authenticated
using (
  public.is_company_staff()
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
);

drop policy if exists "Staff can update stock alerts" on public.stock_alerts;
create policy "Staff can update stock alerts"
on public.stock_alerts
for update
to authenticated
using (
  public.is_company_staff()
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
)
with check (
  public.is_company_staff()
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
);

drop policy if exists "Customers can send support messages" on public.support_messages;
create policy "Customers can send support messages"
on public.support_messages
for insert
to anon, authenticated
with check (true);

drop policy if exists "Staff can read support messages" on public.support_messages;
create policy "Staff can read support messages"
on public.support_messages
for select
to authenticated
using (
  public.is_company_staff()
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
);

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
on storage.objects
for select
to public
using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.is_catalog_manager()
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
);

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_catalog_manager()
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
)
with check (
  bucket_id = 'product-images'
  and public.is_catalog_manager()
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
);

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_catalog_manager()
  and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
);

insert into public.staff_members (user_id, email, role)
select user_id, coalesce(email, 'unknown@example.com'), 'admin'
from public.admins
on conflict (user_id) do nothing;
