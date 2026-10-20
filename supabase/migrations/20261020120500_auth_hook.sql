-- Cadastro só por Google ou Apple (D08). O login por e-mail e senha continua
-- ligado para as contas demo/admin, que são criadas direto no banco (seed ou
-- script do administrador) e por isso não passam por este gancho.
--
-- Ligado em supabase/config.toml ([auth.hook.before_user_created]) e, na nuvem,
-- em Authentication → Hooks → Before User Created.

create function private.before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  provider text := event -> 'user' -> 'app_metadata' ->> 'provider';
begin
  if provider in ('google', 'apple') then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Cadastro disponível apenas com Google ou Apple.'
    )
  );
end;
$$;

grant usage on schema private to supabase_auth_admin;
grant execute on function private.before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function private.before_user_created(jsonb) from public, anon, authenticated;
