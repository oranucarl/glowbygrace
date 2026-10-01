-- Welcome email for every new customer.
-- When an account becomes verified (Google sign-ups straight away, email sign-ups once they
-- click the confirmation link) the database calls the `welcome-email` function.
-- Needs two Vault secrets, created once outside this file:
--   select vault.create_secret('<random string>', 'welcome_hook_secret');
--   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/welcome-email', 'welcome_hook_url');
-- and the same random string set as the function secret WELCOME_HOOK_SECRET.

create extension if not exists pg_net with schema extensions;

alter table public.profiles add column welcome_email_sent_at timestamptz;

create or replace function public.queue_welcome_email()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  if new.email_confirmed_at is not null
     and (tg_op = 'INSERT' or old.email_confirmed_at is null) then
    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'welcome_hook_url';
    select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'welcome_hook_secret';
    if v_url is not null and v_secret is not null then
      perform net.http_post(
        url := v_url,
        body := jsonb_build_object('user_id', new.id),
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-welcome-secret', v_secret)
      );
    end if;
  end if;
  return new;
exception when others then
  -- never block a sign-up because the welcome email couldn't be queued
  raise warning 'welcome email not queued for %: %', new.id, sqlerrm;
  return new;
end;
$$;

create trigger on_auth_user_verified
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.queue_welcome_email();
