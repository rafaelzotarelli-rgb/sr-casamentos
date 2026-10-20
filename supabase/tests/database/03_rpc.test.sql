-- Regras de negócio das RPCs: onboarding, convites, limites por plano,
-- exclusão de conta com carência e log de auditoria.
begin;
create extension if not exists pgtap with schema extensions;

select plan(37);

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

-- Guarda valores entre trechos do teste (IDs e tokens gerados pelas RPCs).
create function public._test_set(p_key text, p_value text)
returns void
language sql
as $$ select set_config('test.' || p_key, p_value, false); $$;

create function public._test_get(p_key text)
returns text
language sql
stable
as $$ select current_setting('test.' || p_key); $$;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a1@teste.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'a2@teste.local'),
  ('00000000-0000-0000-0000-0000000000a3', 'a3@teste.local'),
  ('00000000-0000-0000-0000-0000000000c1', 'p1@teste.local'),
  ('00000000-0000-0000-0000-0000000000d1', 's1@teste.local'),
  ('00000000-0000-0000-0000-0000000000e1', 'x@teste.local');

-- ---------------------------------------------------------------------------
-- Onboarding e convite do(a) parceiro(a)
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000a1');

select lives_ok(
  $$ select public._test_set('w1', public.create_couple_wedding(
       '  Ana ', 'Pedro', '2027-05-15', 'Campinas', 150, 8000000, 'classico')::text) $$,
  'noivo cria o casamento no onboarding'
);

select results_eq(
  $$ select partner1_name, role::text from public.weddings w
     join public.wedding_members m on m.wedding_id = w.id
     where w.id = public._test_get('w1')::uuid $$,
  $$ values ('Ana', 'couple') $$,
  'quem cria vira noivo do casamento, com nome sem espaços'
);

select throws_ok(
  $$ select public.create_couple_wedding('Ana', 'Pedro', null, 'Campinas', 0, 0, 'classico') $$,
  '23514',
  null,
  'o banco rejeita dados inválidos (0 convidados)'
);

select lives_ok(
  $$ select public._test_set('tok_partner', public.create_invite('partner', public._test_get('w1')::uuid)) $$,
  'noivo gera convite para o(a) parceiro(a)'
);

select is(length(public._test_get('tok_partner')), 43, 'token tem 43 caracteres (32 bytes)');

reset role;

select is(
  (select count(*)::int from public.invites
   where token_hash = extensions.digest(public._test_get('tok_partner'), 'sha256')),
  1,
  'o banco guarda só o hash do token'
);

select public._test_login('00000000-0000-0000-0000-0000000000e1');

select throws_ok(
  $$ select public.create_invite('partner', public._test_get('w1')::uuid) $$,
  'P0001',
  'sem_permissao',
  'quem não é noivo não gera convite de parceiro'
);

reset role;
select public._test_login('00000000-0000-0000-0000-0000000000a2');

select is(
  public.accept_invite(public._test_get('tok_partner')) ->> 'ok',
  'true',
  'parceiro(a) aceita o convite'
);

select results_eq(
  $$ select role::text from public.wedding_members
     where wedding_id = public._test_get('w1')::uuid
       and user_id = '00000000-0000-0000-0000-0000000000a2' $$,
  $$ values ('couple') $$,
  'parceiro(a) vira a segunda conta de noivos'
);

reset role;
select public._test_login('00000000-0000-0000-0000-0000000000a3');

select is(
  public.accept_invite(public._test_get('tok_partner')) ->> 'error',
  'convite_invalido',
  'convite é de uso único'
);

select is(
  public.accept_invite('curto') ->> 'error',
  'convite_invalido',
  'token com formato inválido é recusado'
);

reset role;
select public._test_login('00000000-0000-0000-0000-0000000000a1');

select throws_ok(
  $$ select public.create_invite('partner', public._test_get('w1')::uuid) $$,
  'P0001',
  'casamento_completo',
  'não gera convite quando já há 2 noivos'
);

reset role;

-- Convite expirado (criado direto no banco com token conhecido).
insert into public.invites (kind, wedding_id, token_hash, created_by, expires_at)
values (
  'partner',
  public._test_get('w1')::uuid,
  extensions.digest(repeat('e', 43), 'sha256'),
  '00000000-0000-0000-0000-0000000000a1',
  now() - interval '1 minute'
);

select public._test_login('00000000-0000-0000-0000-0000000000a3');

select is(
  public.accept_invite(repeat('e', 43)) ->> 'error',
  'convite_expirado',
  'convite expirado é recusado'
);

reset role;

select throws_ok(
  $$ insert into public.wedding_members (wedding_id, user_id, role)
     values (public._test_get('w1')::uuid, '00000000-0000-0000-0000-0000000000a3', 'couple') $$,
  'P0001',
  'casamento_completo',
  'o banco nunca aceita um terceiro noivo'
);

-- Limite de tentativas: a3 já fez 3 tentativas; mais 7 completam 10.
select public._test_login('00000000-0000-0000-0000-0000000000a3');
select public.accept_invite(repeat('x', 43)) from generate_series(1, 7);

select throws_ok(
  $$ select public.accept_invite(repeat('x', 43)) $$,
  'P0001',
  'limite_requisicoes',
  'a 11ª tentativa na mesma hora é bloqueada (tentativas inválidas contam)'
);

reset role;

-- ---------------------------------------------------------------------------
-- Assessoria: limite de eventos ativos e de equipe (plano Free: 5 eventos, 1 login)
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000c1');

select lives_ok(
  $$ select public._test_set('g1', public.create_agency('Assessoria Um')::text) $$,
  'assessor cria a assessoria'
);

select throws_ok(
  $$ select public.create_agency('Outra') $$,
  'P0001',
  'ja_tem_assessoria',
  'cada assessor é dono de uma só assessoria'
);

select lives_ok(
  $$ select public.create_agency_wedding(public._test_get('g1')::uuid, 'N' || i, 'M' || i,
       case when i = 1 then null else current_date + 30 * i end)
     from generate_series(1, 5) i $$,
  'cria 5 eventos ativos no plano Free'
);

select throws_ok(
  $$ select public.create_agency_wedding(public._test_get('g1')::uuid, 'Seis', 'Sete', current_date + 400) $$,
  'P0001',
  'limite_eventos_ativos',
  'o 6º evento ativo é bloqueado no plano Free'
);

select lives_ok(
  $$ select public._test_set('w_past', public.create_agency_wedding(
       public._test_get('g1')::uuid, 'Antigo', 'Casal', current_date - 10)::text) $$,
  'casamento com data passada não conta como ativo'
);

select is(
  (select count(*)::int from public.weddings),
  6,
  'atingir o limite não bloqueia o acesso aos casamentos existentes'
);

select throws_ok(
  $$ select public.create_invite('staff', null, public._test_get('g1')::uuid) $$,
  'P0001',
  'limite_equipe',
  'plano Free tem 1 login: não convida equipe'
);

reset role;
update public.agencies set plan_code = 'planner_profissional' where id = public._test_get('g1')::uuid;
select public._test_login('00000000-0000-0000-0000-0000000000c1');

select lives_ok(
  $$ select public._test_set('tok_staff', public.create_invite('staff', null, public._test_get('g1')::uuid)) $$,
  'plano Profissional permite convidar equipe'
);

select lives_ok(
  $$ select public._test_set('tok_couple', public.create_invite('couple', public._test_get('w_past')::uuid)) $$,
  'assessor convida os noivos para o casamento que criou'
);

reset role;
select public._test_login('00000000-0000-0000-0000-0000000000d1');

select is(
  public.accept_invite(public._test_get('tok_staff')) ->> 'ok',
  'true',
  'membro aceita o convite da equipe'
);

select is_empty(
  'select 1 from public.weddings',
  'equipe recém-chegada ainda não vê casamentos (precisa ser liberada)'
);

reset role;
select public._test_login('00000000-0000-0000-0000-0000000000e1');

select is(
  public.accept_invite(public._test_get('tok_couple')) ->> 'kind',
  'couple',
  'noivo entra no casamento criado pelo assessor'
);

select results_eq(
  'select name from public.agencies',
  $$ values ('Assessoria Um') $$,
  'noivo vê o nome da assessoria responsável'
);

reset role;

-- ---------------------------------------------------------------------------
-- Exclusão de conta com carência de 30 dias
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000a2');

select ok(
  public.request_account_deletion() between now() + interval '29 days' and now() + interval '31 days',
  'exclusão fica agendada para daqui a 30 dias'
);

select lives_ok('select public.cancel_account_deletion()', 'usuário pode cancelar durante a carência');

select is_empty('select 1 from public.account_deletion_requests', 'cancelamento remove o pedido');

select public.request_account_deletion();

reset role;
update public.account_deletion_requests set scheduled_for = now() - interval '1 second';
select private.process_scheduled_deletions();

select is_empty(
  $$ select 1 from auth.users where id = '00000000-0000-0000-0000-0000000000a2' $$,
  'após a carência a conta é apagada'
);

select results_eq(
  $$ select user_id from public.wedding_members where wedding_id = public._test_get('w1')::uuid $$,
  $$ values ('00000000-0000-0000-0000-0000000000a1'::uuid) $$,
  'o casamento continua com o outro noivo'
);

-- O último noivo sai de um casamento sem assessor: casamento entra na carência.
select public._test_login('00000000-0000-0000-0000-0000000000a1');
delete from public.wedding_members where wedding_id = public._test_get('w1')::uuid;
reset role;

select isnt(
  (select deletion_scheduled_for from public.weddings where id = public._test_get('w1')::uuid),
  null,
  'casamento sem noivos e sem assessor fica agendado para exclusão'
);

-- Em casamento com assessor, a saída dos noivos não apaga nada (pertence à assessoria).
delete from public.wedding_members where wedding_id = public._test_get('w_past')::uuid;

select is(
  (select deletion_scheduled_for from public.weddings where id = public._test_get('w_past')::uuid),
  null,
  'casamento da assessoria permanece quando os noivos saem'
);

-- ---------------------------------------------------------------------------
-- Auditoria
-- ---------------------------------------------------------------------------
select isnt_empty(
  $$ select 1 from public.audit_log
     where table_name = 'agencies' and action = 'update'
       and old_data ->> 'plan_code' = 'planner_free'
       and new_data ->> 'plan_code' = 'planner_profissional' $$,
  'mudança de plano fica registrada'
);

select throws_ok(
  'delete from public.audit_log',
  'P0001',
  null,
  'nem o dono do banco apaga o log de auditoria'
);

select * from finish();
rollback;
