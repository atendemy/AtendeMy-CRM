-- 0411: Cifragem de OAuth/secrets com suporte explícito ao schema extensions do pgcrypto.
-- Garante pgcrypto e qualifica extensions.pgp_sym_encrypt / extensions.pgp_sym_decrypt.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.fn_encrypt_oauth(plaintext text) returns bytea
    language plpgsql security definer
    set search_path to 'public', 'private', 'extensions', 'pg_temp'
    as $$
declare
  k text := private.fn_oauth_key();
begin
  if k is null or length(k) < 32 then
    raise exception 'NUVEMSHOP_OAUTH_ENCRYPTION_KEY ausente';
  end if;
  return extensions.pgp_sym_encrypt(plaintext, k, 'cipher-algo=aes256');
end$$;

create or replace function public.fn_decrypt_oauth(ciphertext bytea) returns text
    language plpgsql security definer
    set search_path to 'public', 'private', 'extensions', 'pg_temp'
    as $$
declare
  k text := private.fn_oauth_key();
begin
  return extensions.pgp_sym_decrypt(ciphertext, k);
end$$;

revoke all on function public.fn_encrypt_oauth(text) from public;
revoke all on function public.fn_decrypt_oauth(bytea) from public;
grant execute on function public.fn_encrypt_oauth(text) to service_role;
grant execute on function public.fn_decrypt_oauth(bytea) to service_role;

