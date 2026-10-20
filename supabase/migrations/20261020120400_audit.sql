-- Etapa 1 — log de auditoria (briefing, seção 10): permissões, exclusões e
-- alterações de plano. Pagamentos entram na Etapa 2 com o mesmo trigger.
--
-- O log é somente inserção: ninguém (nem o service role pela API) altera ou apaga.
-- Guarda o actor_id sem chave estrangeira para sobreviver à exclusão da conta.

create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  action text not null,
  table_name text not null,
  record_id text,
  wedding_id uuid,
  agency_id uuid,
  old_data jsonb,
  new_data jsonb
);

create index audit_log_wedding_id_idx on public.audit_log (wedding_id, occurred_at desc);
create index audit_log_agency_id_idx on public.audit_log (agency_id, occurred_at desc);
create index audit_log_actor_id_idx on public.audit_log (actor_id, occurred_at desc);

alter table public.audit_log enable row level security;

create policy "admins leem o log"
on public.audit_log for select
to authenticated
using (private.is_platform_admin());

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
revoke insert, update, delete, truncate on public.audit_log from service_role;

create function private.audit_log_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log é somente inserção' using errcode = 'P0001';
end;
$$;

create trigger audit_log_no_update
before update or delete on public.audit_log
for each row execute function private.audit_log_immutable();

create trigger audit_log_no_truncate
before truncate on public.audit_log
for each statement execute function private.audit_log_immutable();

create function private.audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.audit_log (
    actor_id, action, table_name, record_id, wedding_id, agency_id, old_data, new_data
  ) values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(
      row_data ->> 'id',
      row_data ->> 'user_id'
    ),
    case
      when tg_table_name = 'weddings' then (row_data ->> 'id')::uuid
      else (row_data ->> 'wedding_id')::uuid
    end,
    case
      when tg_table_name = 'agencies' then (row_data ->> 'id')::uuid
      else (row_data ->> 'agency_id')::uuid
    end,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

revoke execute on function private.audit(), private.audit_log_immutable()
from public, anon, authenticated;

-- Vínculos e permissões
create trigger audit_wedding_members
after insert or update or delete on public.wedding_members
for each row execute function private.audit();

create trigger audit_agency_members
after insert or update or delete on public.agency_members
for each row execute function private.audit();

create trigger audit_agency_wedding_staff
after insert or update or delete on public.agency_wedding_staff
for each row execute function private.audit();

create trigger audit_couple_permissions
after insert or update or delete on public.couple_permissions
for each row execute function private.audit();

create trigger audit_platform_admins
after insert or update or delete on public.platform_admins
for each row execute function private.audit();

-- Exclusões e mudanças de plano
create trigger audit_weddings_delete
after delete on public.weddings
for each row execute function private.audit();

create trigger audit_weddings_plan
after update of couple_plan_code, agency_id, deletion_scheduled_for on public.weddings
for each row execute function private.audit();

create trigger audit_agencies_plan
after update of plan_code on public.agencies
for each row execute function private.audit();

create trigger audit_agencies_delete
after delete on public.agencies
for each row execute function private.audit();

create trigger audit_account_deletion_requests
after insert or delete on public.account_deletion_requests
for each row execute function private.audit();
