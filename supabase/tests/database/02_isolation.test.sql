-- Isolamento: ninguém acessa dados de outro casamento ou de outra assessoria.
--
-- Cenário (IDs fixos; o sufixo indica o papel):
--   W1 (…ee01) — casamento sem assessor: A1 (…0a1, noivo) e F1 (…0f1, família)
--   W2 (…ee02) — casamento sem assessor: B1 (…0b1, noivo)
--   G1 (…aa01) — assessoria de P1 (…0c1, dono), equipe S1 (…0d1) e S2 (…0d2)
--     W3 (…ee03) — casamento de G1, S1 liberado
--     W4 (…ee04) — casamento de G1, ninguém da equipe liberado
--   G2 (…aa02) — assessoria de P2 (…0c2, dono)
--     W5 (…ee05) — casamento de G2
--   X  (…0e1) — usuário sem vínculo nenhum
begin;
create extension if not exists pgtap with schema extensions;

select plan(31);

-- Helper de login (desfeito no rollback).
create function public._test_login(p_user uuid)
returns void
language plpgsql
as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user, 'role', 'authenticated')::text,
    true
  );
  perform set_config('role', 'authenticated', true);
end;
$$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a1@teste.local'),
  ('00000000-0000-0000-0000-0000000000f1', 'f1@teste.local'),
  ('00000000-0000-0000-0000-0000000000b1', 'b1@teste.local'),
  ('00000000-0000-0000-0000-0000000000c1', 'p1@teste.local'),
  ('00000000-0000-0000-0000-0000000000d1', 's1@teste.local'),
  ('00000000-0000-0000-0000-0000000000d2', 's2@teste.local'),
  ('00000000-0000-0000-0000-0000000000c2', 'p2@teste.local'),
  ('00000000-0000-0000-0000-0000000000e1', 'x@teste.local');

insert into public.agencies (id, name) values
  ('00000000-0000-0000-0000-00000000aa01', 'Assessoria Um'),
  ('00000000-0000-0000-0000-00000000aa02', 'Assessoria Dois');

insert into public.agency_members (agency_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-0000000000c1', 'owner'),
  ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-0000000000d1', 'staff'),
  ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-0000000000d2', 'staff'),
  ('00000000-0000-0000-0000-00000000aa02', '00000000-0000-0000-0000-0000000000c2', 'owner');

insert into public.weddings (id, agency_id, partner1_name, partner2_name, city) values
  ('00000000-0000-0000-0000-00000000ee01', null, 'Ana', 'Pedro', 'Campinas'),
  ('00000000-0000-0000-0000-00000000ee02', null, 'Bia', 'Caio', 'Santos'),
  ('00000000-0000-0000-0000-00000000ee03', '00000000-0000-0000-0000-00000000aa01', 'Duda', 'Edu', 'Jundiaí'),
  ('00000000-0000-0000-0000-00000000ee04', '00000000-0000-0000-0000-00000000aa01', 'Fê', 'Gui', 'Sorocaba'),
  ('00000000-0000-0000-0000-00000000ee05', '00000000-0000-0000-0000-00000000aa02', 'Helô', 'Ivo', 'Valinhos');

insert into public.wedding_members (wedding_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000ee01', '00000000-0000-0000-0000-0000000000a1', 'couple'),
  ('00000000-0000-0000-0000-00000000ee01', '00000000-0000-0000-0000-0000000000f1', 'family'),
  ('00000000-0000-0000-0000-00000000ee02', '00000000-0000-0000-0000-0000000000b1', 'couple');

insert into public.agency_wedding_staff (wedding_id, user_id) values
  ('00000000-0000-0000-0000-00000000ee03', '00000000-0000-0000-0000-0000000000d1');

-- ---------------------------------------------------------------------------
-- A1 — noivo de W1
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000a1');

select results_eq(
  'select id from public.weddings order by id',
  $$ values ('00000000-0000-0000-0000-00000000ee01'::uuid) $$,
  'noivo vê só o próprio casamento'
);

select is(
  (select count(*)::int from public.wedding_members),
  2,
  'noivo vê só os membros do próprio casamento'
);

select is_empty(
  $$ select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000b1' $$,
  'noivo não vê perfil de outro casamento'
);

select isnt_empty(
  $$ select 1 from public.profiles where id = '00000000-0000-0000-0000-0000000000f1' $$,
  'noivo vê o perfil da família do próprio casamento'
);

select is_empty('select 1 from public.agencies', 'noivo sem assessor não vê assessorias');

select is_empty('select 1 from public.audit_log', 'noivo não lê o log de auditoria');

select throws_ok(
  $$ insert into public.weddings (partner1_name, partner2_name) values ('Zé', 'Zoe') $$,
  '42501',
  null,
  'não cria casamento por INSERT direto (só pela RPC)'
);

select throws_ok(
  $$ update public.weddings set couple_plan_code = 'couple_premium'
     where id = '00000000-0000-0000-0000-00000000ee01' $$,
  '42501',
  null,
  'noivo não troca o próprio plano'
);

select throws_ok(
  $$ update public.profiles set is_demo = true
     where id = '00000000-0000-0000-0000-0000000000a1' $$,
  '42501',
  null,
  'usuário não se marca como conta demo'
);

-- Tentativas que a RLS ignora em silêncio (conferidas no fim como postgres).
update public.weddings set city = 'Invadido' where id = '00000000-0000-0000-0000-00000000ee02';
delete from public.wedding_members where user_id = '00000000-0000-0000-0000-0000000000b1';

reset role;

-- ---------------------------------------------------------------------------
-- F1 — família de W1
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000f1');

select results_eq(
  'select id from public.weddings',
  $$ values ('00000000-0000-0000-0000-00000000ee01'::uuid) $$,
  'família vê o casamento em que foi incluída'
);

update public.weddings set city = 'Mudou' where id = '00000000-0000-0000-0000-00000000ee01';

reset role;

-- ---------------------------------------------------------------------------
-- P1 — dono da assessoria G1
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000c1');

select results_eq(
  'select id from public.weddings order by id',
  $$ values ('00000000-0000-0000-0000-00000000ee03'::uuid), ('00000000-0000-0000-0000-00000000ee04'::uuid) $$,
  'dono vê todos os casamentos da própria assessoria e nenhum outro'
);

select results_eq(
  'select id from public.agencies',
  $$ values ('00000000-0000-0000-0000-00000000aa01'::uuid) $$,
  'dono vê só a própria assessoria'
);

select lives_ok(
  $$ insert into public.couple_permissions (wedding_id, module, level)
     values ('00000000-0000-0000-0000-00000000ee03', 'budget', 'view') $$,
  'dono define permissões dos noivos no próprio casamento'
);

select throws_ok(
  $$ insert into public.couple_permissions (wedding_id, module, level)
     values ('00000000-0000-0000-0000-00000000ee01', 'budget', 'none') $$,
  '42501',
  null,
  'dono não define permissões em casamento de fora'
);

select throws_ok(
  $$ update public.agencies set plan_code = 'planner_agencia'
     where id = '00000000-0000-0000-0000-00000000aa01' $$,
  '42501',
  null,
  'dono não troca o plano da assessoria por conta própria'
);

update public.weddings set city = 'Itu' where id = '00000000-0000-0000-0000-00000000ee03';

reset role;

-- ---------------------------------------------------------------------------
-- S1 — equipe de G1, liberado só em W3
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000d1');

select results_eq(
  'select id from public.weddings',
  $$ values ('00000000-0000-0000-0000-00000000ee03'::uuid) $$,
  'equipe vê só os casamentos liberados'
);

select throws_ok(
  $$ insert into public.agency_wedding_staff (wedding_id, user_id)
     values ('00000000-0000-0000-0000-00000000ee04', '00000000-0000-0000-0000-0000000000d1') $$,
  '42501',
  null,
  'equipe não se libera sozinha em outro casamento'
);

reset role;

-- ---------------------------------------------------------------------------
-- S2 — equipe de G1 sem nenhum casamento liberado
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000d2');

select is_empty('select 1 from public.weddings', 'equipe sem liberação não vê casamentos');

select isnt_empty(
  $$ select 1 from public.agencies where id = '00000000-0000-0000-0000-00000000aa01' $$,
  'equipe vê a própria assessoria'
);

reset role;

-- ---------------------------------------------------------------------------
-- P2 — dono da assessoria G2
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000c2');

select results_eq(
  'select id from public.weddings',
  $$ values ('00000000-0000-0000-0000-00000000ee05'::uuid) $$,
  'outra assessoria vê só os próprios casamentos'
);

select is_empty(
  $$ select 1 from public.agency_members where agency_id = '00000000-0000-0000-0000-00000000aa01' $$,
  'outra assessoria não vê a equipe de G1'
);

select is_empty(
  $$ select 1 from public.agency_wedding_staff $$,
  'outra assessoria não vê liberações de G1'
);

reset role;

-- ---------------------------------------------------------------------------
-- X — usuário sem vínculo
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000e1');

select is_empty(
  $$ select 1 from public.weddings
     union all select 1 from public.wedding_members
     union all select 1 from public.agencies
     union all select 1 from public.agency_members
     union all select 1 from public.couple_permissions
     union all select 1 from public.invites $$,
  'usuário sem vínculo não vê nada'
);

select results_eq(
  'select id from public.profiles',
  $$ values ('00000000-0000-0000-0000-0000000000e1'::uuid) $$,
  'usuário sem vínculo vê só o próprio perfil'
);

select isnt_empty('select 1 from public.plan_capabilities', 'qualquer usuário vê os planos');

reset role;

-- ---------------------------------------------------------------------------
-- Anônimo
-- ---------------------------------------------------------------------------
set local role anon;

select throws_ok(
  'select 1 from public.weddings',
  '42501',
  null,
  'anônimo não lê casamentos'
);

select throws_ok(
  'select public.create_couple_wedding(''A'', ''B'', null, ''C'', 1, 0, ''classico'')',
  '42501',
  null,
  'anônimo não executa RPCs'
);

reset role;

-- ---------------------------------------------------------------------------
-- Conferência final (como postgres): as tentativas silenciosas não tiveram efeito
-- ---------------------------------------------------------------------------
select is(
  (select city from public.weddings where id = '00000000-0000-0000-0000-00000000ee02'),
  'Santos',
  'noivo de W1 não alterou W2'
);

select isnt_empty(
  $$ select 1 from public.wedding_members where user_id = '00000000-0000-0000-0000-0000000000b1' $$,
  'noivo de W1 não removeu o noivo de W2'
);

select is(
  (select city from public.weddings where id = '00000000-0000-0000-0000-00000000ee01'),
  'Campinas',
  'família não edita os dados centrais do casamento'
);

select is(
  (select city from public.weddings where id = '00000000-0000-0000-0000-00000000ee03'),
  'Itu',
  'dono da assessoria edita o casamento da assessoria'
);

select * from finish();
rollback;
