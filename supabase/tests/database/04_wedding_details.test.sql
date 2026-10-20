-- Local, contato dos noivos, prévia de convite, bloqueio do assessor como noivo
-- e exclusão de casamento pelo dono da assessoria.
begin;
create extension if not exists pgtap with schema extensions;

select plan(15);

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
  ('00000000-0000-0000-0000-0000000000c1', 't4-dono@teste.local'),
  ('00000000-0000-0000-0000-0000000000d1', 't4-equipe@teste.local'),
  ('00000000-0000-0000-0000-0000000000a1', 't4-noiva@teste.local');

insert into public.agencies (id, name, plan_code) values
  ('00000000-0000-0000-0000-00000000aa01', 'Assessoria Um', 'planner_profissional');
insert into public.agency_members (agency_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-0000000000c1', 'owner'),
  ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-0000000000d1', 'staff');

-- ---------------------------------------------------------------------------
-- Cadastro com local e contato
-- ---------------------------------------------------------------------------
select public._test_login('00000000-0000-0000-0000-0000000000c1');

select lives_ok(
  $$ select public._test_set('w', public.create_agency_wedding(
       '00000000-0000-0000-0000-00000000aa01', 'Rafael', 'Luisa', '2027-08-21',
       'Campinas', 200, 9000000, 'rustico',
       ' Fazenda Serra dos Cocais ', ' Luisa@Exemplo.com ', '5519991234567')::text) $$,
  'assessor cadastra casamento com local e contato'
);

select results_eq(
  $$ select venue_name, contact_email, contact_phone from public.weddings
     where id = public._test_get('w')::uuid $$,
  $$ values ('Fazenda Serra dos Cocais', 'luisa@exemplo.com', '5519991234567') $$,
  'local sem espaços e e-mail em minúsculas'
);

select throws_ok(
  $$ select public.create_agency_wedding(
       '00000000-0000-0000-0000-00000000aa01', 'A', 'B', null,
       null, null, null, null, null, null, '0019991234567') $$,
  '23514',
  null,
  'WhatsApp fora do formato internacional (DDI + número) é recusado pelo banco'
);

select lives_ok(
  $$ update public.weddings set venue_name = 'Espaço Jardim'
     where id = public._test_get('w')::uuid $$,
  'assessor edita o local'
);

select lives_ok(
  $$ select public._test_set('tok', public.create_invite('couple', public._test_get('w')::uuid)) $$,
  'assessor gera convite dos noivos'
);

-- ---------------------------------------------------------------------------
-- Prévia e bloqueio: a conta da assessoria não "gasta" o convite dos noivos
-- ---------------------------------------------------------------------------
select is(
  public.invite_preview(public._test_get('tok')) ->> 'is_agency_member',
  'true',
  'prévia avisa que o usuário logado é da assessoria'
);

select is(
  public.accept_invite(public._test_get('tok')) ->> 'error',
  'assessoria_nao_aceita_convite_de_noivos',
  'dono da assessoria não aceita convite de noivo do próprio casamento'
);

reset role;
select public._test_login('00000000-0000-0000-0000-0000000000d1');

select is(
  public.accept_invite(public._test_get('tok')) ->> 'error',
  'assessoria_nao_aceita_convite_de_noivos',
  'equipe da assessoria também não aceita'
);

select throws_ok(
  $$ select public.delete_agency_wedding(public._test_get('w')::uuid) $$,
  'P0001',
  'sem_permissao',
  'equipe não exclui casamento'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select results_eq(
  $$ select invite_preview ->> 'valid', invite_preview ->> 'partner1_name',
            invite_preview ->> 'agency_name', invite_preview ->> 'is_agency_member'
     from public.invite_preview(public._test_get('tok')) $$,
  $$ values ('true', 'Rafael', 'Assessoria Um', 'false') $$,
  'visitante sem login vê quem convidou (o convite continua válido)'
);

select is(
  public.invite_preview(repeat('x', 43)) ->> 'valid',
  'false',
  'token desconhecido não revela nada'
);

reset role;
select public._test_login('00000000-0000-0000-0000-0000000000a1');

select is(
  public.accept_invite(public._test_get('tok')) ->> 'ok',
  'true',
  'a noiva aceita o convite que a assessoria não conseguiu gastar'
);

select throws_ok(
  $$ select public.delete_agency_wedding(public._test_get('w')::uuid) $$,
  'P0001',
  'sem_permissao',
  'noiva não exclui o casamento da assessoria'
);

reset role;
select public._test_login('00000000-0000-0000-0000-0000000000c1');

select lives_ok(
  $$ select public.delete_agency_wedding(public._test_get('w')::uuid) $$,
  'dono da assessoria exclui o casamento'
);

reset role;

select isnt_empty(
  $$ select 1 from public.audit_log
     where table_name = 'weddings' and action = 'delete'
       and record_id = public._test_get('w') $$,
  'a exclusão fica no log de auditoria'
);

select * from finish();
rollback;
