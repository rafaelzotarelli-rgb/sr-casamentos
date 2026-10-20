-- Etapa 2 — tarefas (checklist) e orçamento por categoria, com permissões por módulo.

-- ---------------------------------------------------------------------------
-- Permissões por módulo
-- ---------------------------------------------------------------------------

-- Acesso da família/ajudantes, módulo a módulo, definido pelos noivos (briefing, 2.12).
create table public.family_permissions (
  wedding_id uuid not null,
  user_id uuid not null,
  module text not null check (
    module in ('tasks', 'budget', 'payments', 'vendors', 'contracts', 'guests', 'tables', 'site')
  ),
  level public.access_level not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (wedding_id, user_id, module),
  foreign key (wedding_id, user_id)
    references public.wedding_members (wedding_id, user_id) on delete cascade
);

create trigger family_permissions_updated_at
before update on public.family_permissions
for each row execute function private.set_updated_at();

/**
 * Nível do usuário atual num módulo do casamento:
 *   assessoria (dono ou equipe liberada) → edit;
 *   noivos → o que o assessor definiu (sem linha = edit);
 *   família → o que os noivos liberaram (sem linha = none).
 */
create function private.module_level(p_wedding_id uuid, p_module text)
returns public.access_level
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  member_role public.wedding_role;
begin
  if private.has_agency_access(p_wedding_id) then
    return 'edit';
  end if;

  select role into member_role
  from public.wedding_members
  where wedding_id = p_wedding_id and user_id = (select auth.uid());

  if member_role = 'couple' then
    return coalesce(
      (select level from public.couple_permissions
       where wedding_id = p_wedding_id and module = p_module),
      'edit'
    );
  elsif member_role = 'family' then
    return coalesce(
      (select level from public.family_permissions
       where wedding_id = p_wedding_id and user_id = (select auth.uid()) and module = p_module),
      'none'
    );
  end if;
  return 'none';
end;
$$;

create function private.can_view_module(p_wedding_id uuid, p_module text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select private.module_level(p_wedding_id, p_module) <> 'none'; $$;

create function private.can_edit_module(p_wedding_id uuid, p_module text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select private.module_level(p_wedding_id, p_module) = 'edit'; $$;

grant execute on function
  private.module_level(uuid, text),
  private.can_view_module(uuid, text),
  private.can_edit_module(uuid, text)
to authenticated;

-- Níveis do usuário atual em todos os módulos (as telas escondem o que não pode
-- ser editado; quem garante a regra é a RLS).
create function public.my_module_access(p_wedding_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_object_agg(m, private.module_level(p_wedding_id, m))
  from unnest(array['tasks', 'budget', 'payments', 'vendors', 'contracts', 'guests', 'tables', 'site']) as m;
$$;

revoke execute on function public.my_module_access(uuid) from public, anon;
grant execute on function public.my_module_access(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Tarefas
-- ---------------------------------------------------------------------------

create type public.task_assignee as enum ('both', 'partner1', 'partner2', 'family', 'planner');
create type public.task_origin as enum ('manual', 'template', 'contract', 'planner');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  notes text check (char_length(notes) <= 2000),
  category text not null default 'geral' check (
    category in ('geral', 'orcamento', 'convidados', 'local', 'buffet', 'bebidas', 'decoracao',
                 'foto_video', 'musica', 'vestido_traje', 'convites', 'lembrancinhas', 'lua_de_mel')
  ),
  -- Fase do checklist; usada para agrupar quando não há prazo.
  phase text check (phase in ('12m', '9m', '6m', '3m', '1m', 'semana', 'dia')),
  due_date date,
  assignee public.task_assignee not null default 'both',
  origin public.task_origin not null default 'manual',
  done boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_wedding_due_idx on public.tasks (wedding_id, done, due_date);

create trigger tasks_updated_at
before update on public.tasks
for each row execute function private.set_updated_at();

-- Origem e conclusão são definidas pelo servidor, nunca pelo cliente.
-- Roda com os privilégios de quem chama (sem security definer) para que
-- `current_user` diferencie o app ('authenticated') das funções do servidor.
create function private.tasks_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    -- Inserção direta pelo app/painel: manual (noivos) ou criada pelo assessor.
    -- 'template' e 'contract' só vêm de funções do servidor.
    if current_user = 'authenticated' then
      new.origin := case
        when private.has_agency_access(new.wedding_id)
             and not private.is_wedding_member(new.wedding_id) then 'planner'::public.task_origin
        else 'manual'::public.task_origin
      end;
    end if;
  end if;

  if new.done and (tg_op = 'INSERT' or not old.done) then
    new.completed_at := now();
    new.completed_by := auth.uid();
  elsif not new.done then
    new.completed_at := null;
    new.completed_by := null;
  end if;
  return new;
end;
$$;

create trigger tasks_before_write
before insert or update on public.tasks
for each row execute function private.tasks_before_write();

-- ---------------------------------------------------------------------------
-- Orçamento por categoria (o contratado e o pago vêm de fornecedores e pagamentos)
-- ---------------------------------------------------------------------------

create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  -- Categoria do catálogo (packages/shared/src/budget.ts) ou null para personalizada.
  key text check (
    key in ('local', 'buffet', 'bebidas', 'decoracao', 'foto_video', 'musica', 'vestido_traje',
            'convites', 'lembrancinhas', 'lua_de_mel', 'reserva')
  ),
  name text not null check (char_length(name) between 2 and 60),
  planned_cents bigint not null default 0 check (planned_cents between 0 and 10000000000),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wedding_id, key)
);

create index budget_categories_wedding_idx on public.budget_categories (wedding_id, sort_order);

create trigger budget_categories_updated_at
before update on public.budget_categories
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Checklist e orçamento iniciais (gerados pelo app a partir do onboarding)
-- ---------------------------------------------------------------------------

alter table public.weddings add column starter_initialized_at timestamptz;

/**
 * Cria o checklist e o orçamento sugeridos uma única vez por casamento.
 * O conteúdo vem do pacote compartilhado (fonte única); aqui só validamos e
 * gravamos de forma atômica. Retorna false se já tinha sido feito.
 */
create function public.initialize_wedding_plan(
  p_wedding_id uuid,
  p_tasks jsonb,
  p_budget jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_user();
begin
  if not private.can_manage_wedding(p_wedding_id) then
    raise exception 'sem_permissao' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_tasks) <> 'array' or jsonb_array_length(p_tasks) > 100
     or jsonb_typeof(p_budget) <> 'array' or jsonb_array_length(p_budget) > 30 then
    raise exception 'dados_invalidos' using errcode = 'P0001';
  end if;

  -- Trava o casamento: duas abas abertas ao mesmo tempo não duplicam o checklist.
  perform 1 from public.weddings
  where id = p_wedding_id and starter_initialized_at is null
  for update;
  if not found then
    return false;
  end if;

  insert into public.tasks (wedding_id, title, category, phase, due_date, origin, created_by)
  select p_wedding_id, t.title, t.category, t.phase, t.due_date, 'template', uid
  from jsonb_to_recordset(p_tasks) as t(title text, category text, phase text, due_date date);

  insert into public.budget_categories (wedding_id, key, name, planned_cents, sort_order)
  select p_wedding_id, b.key, b.name, b.planned_cents, b.sort_order
  from jsonb_to_recordset(p_budget)
    as b(key text, name text, planned_cents bigint, sort_order int);

  update public.weddings set starter_initialized_at = now() where id = p_wedding_id;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS e GRANTs
-- ---------------------------------------------------------------------------

alter table public.family_permissions enable row level security;
alter table public.tasks enable row level security;
alter table public.budget_categories enable row level security;

create policy "quem acessa o casamento vê as permissões da família"
on public.family_permissions for select
to authenticated
using (private.can_access_wedding(wedding_id));

create policy "noivos e assessor definem o acesso da família"
on public.family_permissions for all
to authenticated
using (private.can_manage_wedding(wedding_id))
with check (private.can_manage_wedding(wedding_id));

create policy "ver tarefas"
on public.tasks for select
to authenticated
using (private.can_view_module(wedding_id, 'tasks'));

create policy "criar tarefas"
on public.tasks for insert
to authenticated
with check (private.can_edit_module(wedding_id, 'tasks'));

create policy "editar tarefas"
on public.tasks for update
to authenticated
using (private.can_edit_module(wedding_id, 'tasks'))
with check (private.can_edit_module(wedding_id, 'tasks'));

create policy "apagar tarefas"
on public.tasks for delete
to authenticated
using (private.can_edit_module(wedding_id, 'tasks'));

create policy "ver orçamento"
on public.budget_categories for select
to authenticated
using (private.can_view_module(wedding_id, 'budget'));

create policy "criar categoria"
on public.budget_categories for insert
to authenticated
with check (private.can_edit_module(wedding_id, 'budget'));

create policy "editar categoria"
on public.budget_categories for update
to authenticated
using (private.can_edit_module(wedding_id, 'budget'))
with check (private.can_edit_module(wedding_id, 'budget'));

create policy "apagar categoria"
on public.budget_categories for delete
to authenticated
using (private.can_edit_module(wedding_id, 'budget'));

grant select, delete on public.family_permissions to authenticated;
grant insert (wedding_id, user_id, module, level), update (level)
  on public.family_permissions to authenticated;

grant select, delete on public.tasks to authenticated;
grant insert (id, wedding_id, title, notes, category, phase, due_date, assignee, done)
  on public.tasks to authenticated;
grant update (title, notes, category, phase, due_date, assignee, done)
  on public.tasks to authenticated;

grant select, delete on public.budget_categories to authenticated;
grant insert (id, wedding_id, key, name, planned_cents, sort_order)
  on public.budget_categories to authenticated;
grant update (name, planned_cents, sort_order) on public.budget_categories to authenticated;

revoke execute on function private.tasks_before_write() from public, anon;
revoke execute on function public.initialize_wedding_plan(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.initialize_wedding_plan(uuid, jsonb, jsonb) to authenticated;

-- Auditoria: mudanças no acesso da família (briefing, seção 10: permissões).
create trigger audit_family_permissions
after insert or update or delete on public.family_permissions
for each row execute function private.audit();
