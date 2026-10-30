-- Heartbeat for the free plan: the scheduled GitHub job calls keep_alive() daily,
-- which writes a timestamp, so Supabase sees real database activity (not just reads).
create table public.keep_alive (
  id smallint primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now(),
  pings bigint not null default 0
);
insert into public.keep_alive (id) values (1) on conflict do nothing;
alter table public.keep_alive enable row level security; -- no policies: only keep_alive() can touch it

create or replace function public.keep_alive()
returns timestamptz
language sql security definer set search_path = public
as $$
  update public.keep_alive set pinged_at = now(), pings = pings + 1 where id = 1 returning pinged_at;
$$;
revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;
