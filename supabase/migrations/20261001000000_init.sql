-- =========================================================
-- Glow by Grace — database schema
-- Catalogue, delivery zones, customer profiles, orders,
-- admin access and product image storage.
-- All money values are whole Naira (integer).
-- =========================================================

-- ---------- Admins ----------
create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------- Shared updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Delivery zones ----------
create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  fee integer not null check (fee >= 0),
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger delivery_zones_touch before update on public.delivery_zones
  for each row execute function public.touch_updated_at();

-- ---------- Products ----------
create table public.products (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  tagline text,
  category text not null,
  badge text,
  lace text,
  density text,
  description text,
  model_url text,
  sample_url text,
  featured boolean not null default false,
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- one row per length option; stock null = not tracked (always available)
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products on delete cascade on update cascade,
  length text not null,
  price integer not null check (price > 0),
  stock integer check (stock is null or stock >= 0),
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, length)
);

-- ---------- Customer profiles ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  address text,
  city text,
  state text,
  delivery_zone_id uuid references public.delivery_zones on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Orders ----------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('GBG-' || nextval('public.order_number_seq')),
  user_id uuid references auth.users on delete set null,
  email text not null,
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  state text not null,
  delivery_zone_id uuid references public.delivery_zones on delete set null,
  delivery_zone_name text not null,
  notes text,
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null check (delivery_fee >= 0),
  total integer not null check (total >= 0),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_reference text unique,
  payment_channel text,
  paid_at timestamptz,
  confirmation_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id text references public.products on delete set null on update cascade,
  variant_id uuid references public.product_variants on delete set null,
  product_name text not null,
  length text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer not null check (line_total >= 0),
  image_url text
);
create index order_items_order_idx on public.order_items (order_id);

-- status history shown as a timeline to customers and the seller
create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

create or replace function public.log_order_status()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_events (order_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;
create trigger orders_status_log after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- Called only by the payment server functions (service role).
-- Marks an order paid once, checks the amount, and reduces tracked stock.
create or replace function public.mark_order_paid(
  p_order_id uuid, p_reference text, p_amount_kobo bigint, p_channel text
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;
  if v_order.paid_at is not null then
    return false;
  end if;
  if p_amount_kobo <> v_order.total::bigint * 100 then
    raise exception 'Amount paid (% kobo) does not match order total (% NGN)', p_amount_kobo, v_order.total;
  end if;

  update public.orders
     set status = 'paid', paid_at = now(), payment_reference = p_reference, payment_channel = p_channel
   where id = p_order_id;

  update public.product_variants v
     set stock = greatest(v.stock - i.quantity, 0)
    from public.order_items i
   where i.order_id = p_order_id and i.variant_id = v.id and v.stock is not null;

  return true;
end;
$$;
revoke all on function public.mark_order_paid(uuid, text, bigint, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text, bigint, text) to service_role;

-- Customers can cancel their own order while it is still awaiting payment.
create or replace function public.cancel_my_order(p_order_id uuid)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  update public.orders
     set status = 'cancelled'
   where id = p_order_id and user_id = auth.uid() and status = 'pending_payment';
  return found;
end;
$$;
revoke all on function public.cancel_my_order(uuid) from public, anon;
grant execute on function public.cancel_my_order(uuid) to authenticated;

-- ---------- Row level security ----------
alter table public.admins enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

create policy "admins read admins" on public.admins for select using (public.is_admin());
create policy "admins manage admins" on public.admins for all using (public.is_admin()) with check (public.is_admin());

create policy "read active zones" on public.delivery_zones for select using (active or public.is_admin());
create policy "admins manage zones" on public.delivery_zones for all using (public.is_admin()) with check (public.is_admin());

create policy "read active products" on public.products for select using (active or public.is_admin());
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "read variants of active products" on public.product_variants for select using (
  public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.active)
);
create policy "admins manage variants" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

create policy "read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "insert own profile" on public.profiles for insert with check (id = auth.uid());
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- orders are created only by the checkout server function
create policy "read own orders" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "admins update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());

create policy "read own order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
create policy "read own order events" on public.order_events for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
);
create policy "admins add order notes" on public.order_events for insert with check (public.is_admin());

grant select on public.products, public.product_variants, public.delivery_zones to anon, authenticated;
grant insert, update, delete on public.products, public.product_variants, public.delivery_zones to authenticated;
grant select, insert, delete on public.admins to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select, insert on public.order_events to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Product image storage ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "admins upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "admins update product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy "admins delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- ---------- Starting data ----------
insert into public.delivery_zones (name, description, fee, sort) values
  ('Within Lagos', 'Same-day or next-day delivery', 0, 1),
  ('Outside Lagos', 'Nationwide delivery, 2–4 working days', 3000, 2);
