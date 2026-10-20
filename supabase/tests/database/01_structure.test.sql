-- Estrutura de segurança: RLS ligada em todas as tabelas e nada exposto ao anônimo.
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

select is_empty(
  $$
    select format('%I.%I', n.nspname, c.relname)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('r', 'p')
      and n.nspname in ('public', 'private')
      and not c.relrowsecurity
  $$,
  'toda tabela em public/private tem RLS ligada'
);

select is_empty(
  $$
    select table_name
    from information_schema.role_table_grants
    where grantee = 'anon'
      and table_schema = 'public'
      and table_name <> 'plan_capabilities'
  $$,
  'anon não tem acesso a nenhuma tabela além dos planos'
);

select is_empty(
  $$
    select privilege_type
    from information_schema.role_table_grants
    where grantee in ('authenticated', 'anon', 'service_role')
      and table_name = 'audit_log'
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
  $$,
  'ninguém escreve diretamente no log de auditoria'
);

select is_empty(
  $$
    select p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'execute')
      and p.proname <> 'invite_preview'
  $$,
  'anon só executa a prévia de convite (e nenhuma outra função de public)'
);

select is_empty(
  $$
    select p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prosecdef
      and not exists (
        select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%'
      )
  $$,
  'toda função security definer fixa o search_path'
);

select is(
  (select count(*)::int from public.plan_capabilities),
  7,
  'os 7 planos estão cadastrados'
);

select is(
  private.before_user_created('{"user": {"app_metadata": {"provider": "phone"}}}') -> 'error' ->> 'http_code',
  '403',
  'cadastro por telefone (ou outro provedor) é recusado'
);

select is(
  private.before_user_created('{"user": {"app_metadata": {"provider": "email"}}}'),
  '{}'::jsonb,
  'cadastro por e-mail (com confirmação) é aceito'
);

select is(
  private.before_user_created('{"user": {"app_metadata": {"provider": "google"}}}'),
  '{}'::jsonb,
  'cadastro pelo Google é aceito'
);

select * from finish();
rollback;
