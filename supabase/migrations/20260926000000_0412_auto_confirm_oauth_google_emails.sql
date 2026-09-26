-- 0412: Auto-confirmação de e-mail para usuários autenticados via OAuth/Google.
-- Impede que travas globais de confirmação por e-mail (Email Provider) bloqueiem logins do Google em novos computadores.

create or replace function public.fn_auto_confirm_oauth_google_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth', 'pg_temp'
as $$
begin
  if new.raw_app_meta_data is not null and (
     new.raw_app_meta_data->>'provider' = 'google' or
     new.raw_app_meta_data->'providers' @> '["google"]'::jsonb
  ) then
    if new.email_confirmed_at is null then
      new.email_confirmed_at := now();
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.fn_auto_confirm_oauth_google_user() from public, anon, authenticated;
grant execute on function public.fn_auto_confirm_oauth_google_user() to service_role;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_auto_confirm_oauth_google_user'
  ) then
    create trigger trg_auto_confirm_oauth_google_user
      before insert or update on auth.users
      for each row
      execute function public.fn_auto_confirm_oauth_google_user();
  end if;
end $$;

-- Cura imediata para usuários do Google já existentes no banco:
update auth.users
   set email_confirmed_at = now()
 where email_confirmed_at is null
   and (
     raw_app_meta_data->>'provider' = 'google' or
     raw_app_meta_data->'providers' @> '["google"]'::jsonb
   );
