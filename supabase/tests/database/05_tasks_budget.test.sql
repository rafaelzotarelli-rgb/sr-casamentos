-- Tarefas e orçamento: permissões por módulo, origem das tarefas e plano inicial.
--   W1 (…ee01): casamento da assessoria G1 (dono P1); noiva A1; família F1
--   W2 (…ee02): casamento sem assessor; noivo B1
begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

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
  ('00000000-0000-0000-0000-0000000000a1', 't5-a1@teste.local'),
  ('00000000-0000-0000-0000-0000000000f1', 't5-f1@teste.local'),
  ('00000000-0000-0000-0000-0000000000b1', 't5-b1@teste.local'),
  ('00000000-0000-0000-0000-0000000000c1', 't5-p1@teste.local');

insert into public.agencies (id, name) values ('00000000-0000-0000-0000-00000000aa01', 'G1');
insert into public.agency_members (agency_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-0000000000c1', 'owner');

insert into public.weddings (id, agency_id, partner1_name, partner2_name) values
  ('00000000-0000-0000-0000-00000000ee01', '00000000-0000-0000-0000-00000000aa01', 'Ana', 'Pedro'),
  ('00000000-0000-0000-0000-00000000ee02', null, 'Bia', 'Caio');

insert into public.wedding_members (wedding_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000ee01', '00000000-0000-0000-0000-0000000000a1', 'couple'),
  ('00000000-0000-0000-0000-00000000ee01', '00000000-0000-0000-0000-0000000000f1', 'family'),
  ('00000000-0000-0000-0000-00000000ee02', '00000000-0000-0000-0000-0000000000b1', 'couple');

-- ---------------------------------------------------------------------------
-- Plano inicial (checklist + orçamento): uma única vez
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000a1');

select is(
  public.initialize_wedding_plan(
    '00000000-0000-0000-0000-00000000ee01',
    '[{"title":"Contratar o buffet","category":"buffet","phase":"9m","due_date":"2027-01-10"},
      {"title":"Enviar os convites","category":"convites","phase":"3m","due_date":null}]',
    '[{"key":"buffet","name":"Buffet","planned_cents":2800000,"sort_order":1},
      {"key":"local","name":"Local","planned_cents":1200000,"sort_order":0}]'
  ),
  true,
  'noiva cria o checklist e o orçamento iniciais'
);

select is(
  public.initialize_wedding_plan(
    '00000000-0000-0000-0000-00000000ee01',
    '[{"title":"Duplicada","category":"geral","phase":"9m","due_date":null}]',
    '[]'
  ),
  false,
  'a segunda chamada não duplica nada'
);

select is(
  (select count(*)::int from public.tasks where origin = 'template'),
  2,
  'tarefas do modelo têm origem "template"'
);

select throws_ok(
  $$ select public.initialize_wedding_plan('00000000-0000-0000-0000-00000000ee02', '[]', '[]') $$,
  'P0001',
  'sem_permissao',
  'não inicializa casamento de outro casal'
);

-- ---------------------------------------------------------------------------
-- Noiva: cria, conclui e não forja a origem
-- ---------------------------------------------------------------------------
select lives_ok(
  $$ insert into public.tasks (wedding_id, title) values
       ('00000000-0000-0000-0000-00000000ee01', 'Escolher o padrinho') $$,
  'noiva cria tarefa'
);

select is(
  (select origin::text from public.tasks where title = 'Escolher o padrinho'),
  'manual',
  'tarefa criada pela noiva é "manual"'
);

update public.tasks set done = true where title = 'Escolher o padrinho';

select isnt(
  (select completed_at from public.tasks where title = 'Escolher o padrinho'),
  null,
  'concluir registra a data de conclusão'
);

select throws_ok(
  $$ update public.tasks set origin = 'contract' where title = 'Escolher o padrinho' $$,
  '42501',
  null,
  'o app não altera a origem da tarefa'
);

select is_empty(
  $$ select 1 from public.tasks where wedding_id = '00000000-0000-0000-0000-00000000ee02' $$,
  'noiva não vê tarefas de outro casamento'
);

reset role;

-- ---------------------------------------------------------------------------
-- Assessor: tarefa com origem "assessor"
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000c1');

insert into public.tasks (wedding_id, title) values
  ('00000000-0000-0000-0000-00000000ee01', 'Agendar a visita técnica');

select is(
  (select origin::text from public.tasks where title = 'Agendar a visita técnica'),
  'planner',
  'tarefa criada pelo assessor aparece como "criada pelo assessor"'
);

select is(
  (select count(*)::int from public.budget_categories),
  2,
  'assessor vê o orçamento do casamento'
);

-- Assessor deixa os noivos só verem o orçamento e esconde as tarefas.
insert into public.couple_permissions (wedding_id, module, level) values
  ('00000000-0000-0000-0000-00000000ee01', 'budget', 'view'),
  ('00000000-0000-0000-0000-00000000ee01', 'tasks', 'none');

reset role;

-- ---------------------------------------------------------------------------
-- Noiva com permissões restritas pelo assessor
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000a1');

select is(
  (select count(*)::int from public.budget_categories),
  2,
  'com "só vê", a noiva continua vendo o orçamento'
);

update public.budget_categories set planned_cents = 1 where key = 'buffet';

select is_empty('select 1 from public.tasks', 'com "não vê", as tarefas somem para a noiva');

select throws_ok(
  $$ insert into public.tasks (wedding_id, title) values
       ('00000000-0000-0000-0000-00000000ee01', 'Tentativa') $$,
  '42501',
  null,
  'sem permissão, a noiva não cria tarefas'
);

reset role;

select is(
  (select planned_cents from public.budget_categories
   where key = 'buffet' and wedding_id = '00000000-0000-0000-0000-00000000ee01'),
  2800000::bigint,
  'com "só vê", a alteração da noiva no orçamento não teve efeito'
);

-- ---------------------------------------------------------------------------
-- Família: nada até ser liberada; depois, só o liberado
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000f1');

select is_empty(
  $$ select 1 from public.tasks union all select 1 from public.budget_categories $$,
  'família sem liberação não vê tarefas nem orçamento'
);

select throws_ok(
  $$ insert into public.family_permissions (wedding_id, user_id, module, level) values
       ('00000000-0000-0000-0000-00000000ee01', '00000000-0000-0000-0000-0000000000f1', 'budget', 'edit') $$,
  '42501',
  null,
  'família não se dá permissão sozinha'
);

reset role;
select public._test_login('00000000-0000-0000-0000-0000000000c1');
delete from public.couple_permissions where wedding_id = '00000000-0000-0000-0000-00000000ee01';
reset role;

select public._test_login('00000000-0000-0000-0000-0000000000a1');

select lives_ok(
  $$ insert into public.family_permissions (wedding_id, user_id, module, level) values
       ('00000000-0000-0000-0000-00000000ee01', '00000000-0000-0000-0000-0000000000f1', 'tasks', 'view') $$,
  'noiva libera as tarefas para a família (só ver)'
);

reset role;
select public._test_login('00000000-0000-0000-0000-0000000000f1');

select isnt_empty('select 1 from public.tasks', 'família liberada vê as tarefas');
select is_empty('select 1 from public.budget_categories', 'mas continua sem ver o orçamento');

select throws_ok(
  $$ insert into public.tasks (wedding_id, title) values
       ('00000000-0000-0000-0000-00000000ee01', 'Tentativa da família') $$,
  '42501',
  null,
  'família com "só vê" não cria tarefas'
);

reset role;

select isnt_empty(
  $$ select 1 from public.audit_log where table_name = 'family_permissions' $$,
  'liberação da família fica na auditoria'
);

select * from finish();
rollback;
