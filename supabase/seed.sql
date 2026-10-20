-- Dados locais de desenvolvimento. Rodado só em `supabase db reset` (nunca em produção).
--
-- Contas de teste LOCAIS (login por e-mail e senha em /entrar → "Acesso de demonstração"):
--   assessor@teste.local  /  SrCasamentos2026
--   noiva@teste.local     /  SrCasamentos2026
-- A conta de demonstração para os revisores das lojas será criada na Etapa 7.

create function pg_temp.create_test_user(p_id uuid, p_email text, p_name text)
returns void
language sql
as $$
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
    extensions.crypt('SrCasamentos2026', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_name),
    now(), now(), '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), p_id, p_id::text, 'email',
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    now(), now(), now()
  );
  update public.profiles set is_demo = true where id = p_id;
$$;

select pg_temp.create_test_user(
  '10000000-0000-0000-0000-000000000001', 'assessor@teste.local', 'Assessor Teste'
);
select pg_temp.create_test_user(
  '10000000-0000-0000-0000-000000000002', 'noiva@teste.local', 'Noiva Teste'
);
