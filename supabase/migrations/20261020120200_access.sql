-- Etapa 1 — controle de acesso: funções auxiliares, Row Level Security e GRANTs.
--
-- Regra geral: RLS ligada em TODAS as tabelas (o teste 01_rls_enabled falha se não).
-- Escritas sensíveis (criar casamento, convites, exclusão) passam por RPCs
-- `security definer` em 20261020120300_rpc.sql, nunca por INSERT direto.

-- ---------------------------------------------------------------------------
-- Funções auxiliares (security definer para não recursar nas políticas)
-- ---------------------------------------------------------------------------

create function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;

create function private.is_wedding_member(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.wedding_members
    where wedding_id = p_wedding_id and user_id = (select auth.uid())
  );
$$;

create function private.is_wedding_couple(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.wedding_members
    where wedding_id = p_wedding_id and user_id = (select auth.uid()) and role = 'couple'
  );
$$;

create function private.is_agency_member(p_agency_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.agency_members
    where agency_id = p_agency_id and user_id = (select auth.uid())
  );
$$;

create function private.is_agency_owner(p_agency_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.agency_members
    where agency_id = p_agency_id and user_id = (select auth.uid()) and role = 'owner'
  );
$$;

-- Dono da assessoria do casamento, ou membro da equipe liberado para ele
-- (e que ainda pertence à assessoria).
create function private.has_agency_access(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.weddings w
    join public.agency_members am
      on am.agency_id = w.agency_id and am.user_id = (select auth.uid())
    where w.id = p_wedding_id
      and (
        am.role = 'owner'
        or exists (
          select 1 from public.agency_wedding_staff s
          where s.wedding_id = w.id and s.user_id = am.user_id
        )
      )
  );
$$;

create function private.can_access_wedding(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_wedding_member(p_wedding_id) or private.has_agency_access(p_wedding_id);
$$;

-- Editar os dados centrais do casamento: noivos ou assessor (família não).
create function private.can_manage_wedding(p_wedding_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_wedding_couple(p_wedding_id) or private.has_agency_access(p_wedding_id);
$$;

-- O usuário atual pode ver o perfil de `p_user_id`? (Mesmo casamento ou mesma assessoria.)
create function private.shares_context_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.wedding_members m
      where m.user_id = p_user_id and private.can_access_wedding(m.wedding_id)
    )
    or exists (
      select 1 from public.agency_members am
      where am.user_id = p_user_id and private.is_agency_member(am.agency_id)
    )
    or exists (
      select 1
      from public.weddings w
      join public.agency_members am on am.agency_id = w.agency_id
      where am.user_id = p_user_id and private.is_wedding_member(w.id)
    );
$$;

-- O usuário atual é noivo/família de algum casamento desta assessoria?
-- (Os noivos veem o nome do assessor responsável.)
create function private.is_client_of_agency(p_agency_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.weddings w
    where w.agency_id = p_agency_id and private.is_wedding_member(w.id)
  );
$$;

grant usage on schema private to authenticated;
revoke all on all functions in schema private from public;
grant execute on function
  private.is_platform_admin(),
  private.is_wedding_member(uuid),
  private.is_wedding_couple(uuid),
  private.is_agency_member(uuid),
  private.is_agency_owner(uuid),
  private.has_agency_access(uuid),
  private.can_access_wedding(uuid),
  private.can_manage_wedding(uuid),
  private.shares_context_with(uuid),
  private.is_client_of_agency(uuid)
to authenticated;

-- ---------------------------------------------------------------------------
-- Regras de integridade
-- ---------------------------------------------------------------------------

-- No máximo 2 contas de noivos por casamento (briefing, seção 1).
create function private.enforce_couple_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'couple' then
    -- Trava o casamento para evitar corrida entre dois aceites simultâneos.
    perform 1 from public.weddings where id = new.wedding_id for update;
    if (
      select count(*) from public.wedding_members
      where wedding_id = new.wedding_id and role = 'couple' and user_id <> new.user_id
    ) >= 2 then
      raise exception 'casamento_completo' using errcode = 'P0001';
    end if;
    -- Voltou a ter noivo: cancela exclusão agendada do casamento.
    update public.weddings set deletion_scheduled_for = null
    where id = new.wedding_id and deletion_scheduled_for is not null;
  end if;
  return new;
end;
$$;

create trigger wedding_members_couple_limit
before insert or update of role on public.wedding_members
for each row execute function private.enforce_couple_limit();

-- Casamento sem noivos e sem assessor entra na carência de exclusão (D09).
create function private.schedule_orphan_wedding_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.weddings w
  set deletion_scheduled_for = now() + interval '30 days'
  where w.id = old.wedding_id
    and w.agency_id is null
    and w.deletion_scheduled_for is null
    and not exists (
      select 1 from public.wedding_members m
      where m.wedding_id = w.id and m.role = 'couple'
    );
  return null;
end;
$$;

create trigger wedding_members_orphan_check
after delete on public.wedding_members
for each row execute function private.schedule_orphan_wedding_deletion();

-- Só membros da equipe da própria assessoria do casamento podem ser liberados nele.
create function private.enforce_staff_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.weddings w
    join public.agency_members am on am.agency_id = w.agency_id
    where w.id = new.wedding_id and am.user_id = new.user_id and am.role = 'staff'
  ) then
    raise exception 'membro_nao_pertence_a_assessoria' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger agency_wedding_staff_check
before insert or update on public.agency_wedding_staff
for each row execute function private.enforce_staff_assignment();

-- Ao sair da equipe, perde a liberação em todos os casamentos da assessoria.
create function private.cleanup_staff_assignments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.agency_wedding_staff s
  using public.weddings w
  where s.wedding_id = w.id and w.agency_id = old.agency_id and s.user_id = old.user_id;
  return null;
end;
$$;

create trigger agency_members_cleanup
after delete on public.agency_members
for each row execute function private.cleanup_staff_assignments();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.plan_capabilities enable row level security;
alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.agencies enable row level security;
alter table public.agency_members enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.agency_wedding_staff enable row level security;
alter table public.couple_permissions enable row level security;
alter table public.invites enable row level security;
alter table public.consents enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table private.rate_limit_events enable row level security;

-- Planos: leitura pública (tela de planos e site).
create policy "planos são públicos"
on public.plan_capabilities for select
to anon, authenticated
using (true);

-- Perfis
create policy "ver o próprio perfil e de quem compartilha casamento/assessoria"
on public.profiles for select
to authenticated
using (id = (select auth.uid()) or private.shares_context_with(id) or private.is_platform_admin());

create policy "editar o próprio perfil"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Administradores
create policy "admins veem a lista de admins"
on public.platform_admins for select
to authenticated
using (private.is_platform_admin());

-- Assessorias
create policy "membros e clientes veem a assessoria"
on public.agencies for select
to authenticated
using (
  private.is_agency_member(id) or private.is_client_of_agency(id) or private.is_platform_admin()
);

create policy "dono edita a assessoria"
on public.agencies for update
to authenticated
using (private.is_agency_owner(id))
with check (private.is_agency_owner(id));

-- Membros da assessoria
create policy "membros veem a equipe"
on public.agency_members for select
to authenticated
using (private.is_agency_member(agency_id) or private.is_platform_admin());

create policy "dono remove equipe; equipe pode sair"
on public.agency_members for delete
to authenticated
using (
  role = 'staff'
  and (private.is_agency_owner(agency_id) or user_id = (select auth.uid()))
);

-- Casamentos
create policy "membros e assessor veem o casamento"
on public.weddings for select
to authenticated
using (private.can_access_wedding(id) or private.is_platform_admin());

create policy "noivos e assessor editam o casamento"
on public.weddings for update
to authenticated
using (private.can_manage_wedding(id))
with check (private.can_manage_wedding(id));

-- Membros do casamento
create policy "quem acessa o casamento vê os membros"
on public.wedding_members for select
to authenticated
using (private.can_access_wedding(wedding_id) or private.is_platform_admin());

create policy "sair do casamento, ou noivos/assessor removem família"
on public.wedding_members for delete
to authenticated
using (
  user_id = (select auth.uid())
  or private.has_agency_access(wedding_id)
  or (role = 'family' and private.is_wedding_couple(wedding_id))
);

-- Equipe liberada por casamento
create policy "equipe da assessoria vê as liberações"
on public.agency_wedding_staff for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.weddings w
    where w.id = wedding_id and private.is_agency_owner(w.agency_id)
  )
);

create policy "dono libera equipe"
on public.agency_wedding_staff for insert
to authenticated
with check (
  exists (
    select 1 from public.weddings w
    where w.id = wedding_id and private.is_agency_owner(w.agency_id)
  )
);

create policy "dono retira liberação"
on public.agency_wedding_staff for delete
to authenticated
using (
  exists (
    select 1 from public.weddings w
    where w.id = wedding_id and private.is_agency_owner(w.agency_id)
  )
);

-- Permissões dos noivos
create policy "quem acessa o casamento vê as permissões"
on public.couple_permissions for select
to authenticated
using (private.can_access_wedding(wedding_id));

create policy "assessor define permissões (insert)"
on public.couple_permissions for insert
to authenticated
with check (private.has_agency_access(wedding_id));

create policy "assessor define permissões (update)"
on public.couple_permissions for update
to authenticated
using (private.has_agency_access(wedding_id))
with check (private.has_agency_access(wedding_id));

create policy "assessor define permissões (delete)"
on public.couple_permissions for delete
to authenticated
using (private.has_agency_access(wedding_id));

-- Convites: só quem criou vê (o token nunca é legível; só o hash é guardado).
create policy "quem criou vê seus convites"
on public.invites for select
to authenticated
using (created_by = (select auth.uid()));

-- Consentimentos
create policy "ver os próprios consentimentos"
on public.consents for select
to authenticated
using (user_id = (select auth.uid()));

create policy "registrar o próprio consentimento"
on public.consents for insert
to authenticated
with check (user_id = (select auth.uid()));

-- Pedido de exclusão: só leitura do próprio; criar/cancelar via RPC.
create policy "ver o próprio pedido de exclusão"
on public.account_deletion_requests for select
to authenticated
using (user_id = (select auth.uid()));

-- private.rate_limit_events: sem políticas (só funções security definer acessam).

-- ---------------------------------------------------------------------------
-- GRANTs explícitos (auto_expose_new_tables = false)
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

grant select on public.plan_capabilities to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
grant select on public.platform_admins to authenticated;
grant select on public.agencies to authenticated;
grant update (name) on public.agencies to authenticated;
grant select, delete on public.agency_members to authenticated;
grant select on public.weddings to authenticated;
grant update (
  partner1_name, partner2_name, wedding_date, city, estimated_guests, estimated_budget_cents, style
) on public.weddings to authenticated;
grant select, delete on public.wedding_members to authenticated;
grant select, insert, delete on public.agency_wedding_staff to authenticated;
grant select, insert, update, delete on public.couple_permissions to authenticated;
grant select (id, kind, wedding_id, agency_id, created_by, expires_at, used_at, used_by, revoked_at, created_at)
  on public.invites to authenticated;
grant select, insert on public.consents to authenticated;
grant select on public.account_deletion_requests to authenticated;
