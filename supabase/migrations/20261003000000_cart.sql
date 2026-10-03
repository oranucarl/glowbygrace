-- Shopping cart stored per account, so the website and the mobile app share it.
-- Both subscribe to Supabase Realtime on this table to see changes instantly.
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  product_id text not null references public.products on delete cascade on update cascade,
  length text not null,
  color text not null default '',            -- '' = product has no colour option
  quantity integer not null check (quantity between 1 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id, length, color)
);
create index cart_items_user_idx on public.cart_items (user_id);
create trigger cart_items_touch before update on public.cart_items
  for each row execute function public.touch_updated_at();

alter table public.cart_items enable row level security;
create policy "read own cart" on public.cart_items for select using (user_id = auth.uid());
create policy "add to own cart" on public.cart_items for insert with check (user_id = auth.uid());
create policy "change own cart" on public.cart_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "remove from own cart" on public.cart_items for delete using (user_id = auth.uid());
grant select, insert, update, delete on public.cart_items to authenticated;

-- Add (or top up) a line in one step, so two devices adding at once can't clash.
create or replace function public.add_to_cart(p_product_id text, p_length text, p_color text default '', p_quantity integer default 1)
returns public.cart_items
language sql
as $$
  insert into public.cart_items (user_id, product_id, length, color, quantity)
  values (auth.uid(), p_product_id, p_length, coalesce(p_color, ''), greatest(1, least(p_quantity, 50)))
  on conflict (user_id, product_id, length, color)
  do update set quantity = least(public.cart_items.quantity + excluded.quantity, 50)
  returning *;
$$;
revoke all on function public.add_to_cart(text, text, text, integer) from public, anon;
grant execute on function public.add_to_cart(text, text, text, integer) to authenticated;

-- live updates for the website and app
alter publication supabase_realtime add table public.cart_items;
