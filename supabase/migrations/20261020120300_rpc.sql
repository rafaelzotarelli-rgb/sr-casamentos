-- Etapa 1 — operações expostas ao app (RPCs). Todas:
--   * exigem usuário autenticado;
--   * validam permissões e limites no servidor (o cliente também valida com zod);
--   * levantam erros com códigos estáveis em `message` (o app traduz para pt-BR).
--
-- Códigos de erro: nao_autenticado, sem_permissao, limite_requisicoes,
-- limite_eventos_ativos, limite_equipe, casamento_completo, convite_invalido,
-- convite_expirado, ja_e_membro, ja_tem_assessoria, dados_invalidos.

-- ---------------------------------------------------------------------------
-- Auxiliares
-- ---------------------------------------------------------------------------

create function private.require_user()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'nao_autenticado' using errcode = 'P0001';
  end if;
  return uid;
end;
$$;

-- Limite de requisições por chave numa janela deslizante.
create function private.check_rate_limit(p_key text, p_max int, p_window interval)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.rate_limit_events
  where key = p_key and occurred_at < now() - p_window;

  if (select count(*) from private.rate_limit_events where key = p_key) >= p_max then
    raise exception 'limite_requisicoes' using errcode = 'P0001';
  end if;

  insert into private.rate_limit_events (key) values (p_key);
end;
$$;

-- Eventos ativos de uma assessoria: casamentos sem data ou com data >= hoje (São Paulo).
create function private.active_event_count(p_agency_id uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.weddings
  where agency_id = p_agency_id
    and (wedding_date is null or wedding_date >= (now() at time zone 'America/Sao_Paulo')::date);
$$;

create function private.plan_limit(p_plan_code text, p_key text)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select (capabilities ->> p_key)::int
  from public.plan_capabilities
  where code = p_plan_code;
$$;

create function private.hash_token(p_token text)
returns bytea
language sql
immutable
set search_path = ''
as $$
  select extensions.digest(p_token, 'sha256');
$$;

-- ---------------------------------------------------------------------------
-- Onboarding dos noivos (casamento sem assessor)
-- ---------------------------------------------------------------------------

create function public.create_couple_wedding(
  p_partner1_name text,
  p_partner2_name text,
  p_wedding_date date,
  p_city text,
  p_estimated_guests int,
  p_estimated_budget_cents bigint,
  p_style text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_user();
  new_id uuid;
begin
  perform private.check_rate_limit('create_wedding:' || uid, 5, interval '1 hour');

  insert into public.weddings (
    partner1_name, partner2_name, wedding_date, city,
    estimated_guests, estimated_budget_cents, style, created_by
  ) values (
    trim(p_partner1_name), trim(p_partner2_name), p_wedding_date, trim(p_city),
    p_estimated_guests, p_estimated_budget_cents, p_style, uid
  )
  returning id into new_id;

  insert into public.wedding_members (wedding_id, user_id, role)
  values (new_id, uid, 'couple');

  return new_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Assessorias
-- ---------------------------------------------------------------------------

create function public.create_agency(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_user();
  new_id uuid;
begin
  if exists (select 1 from public.agency_members where user_id = uid and role = 'owner') then
    raise exception 'ja_tem_assessoria' using errcode = 'P0001';
  end if;

  insert into public.agencies (name, created_by)
  values (trim(p_name), uid)
  returning id into new_id;

  insert into public.agency_members (agency_id, user_id, role)
  values (new_id, uid, 'owner');

  return new_id;
end;
$$;

-- Casamento criado pelo assessor. Bloqueia só a criação ao atingir o limite de
-- eventos ativos do plano; o acesso aos existentes nunca é bloqueado (briefing, 5).
create function public.create_agency_wedding(
  p_agency_id uuid,
  p_partner1_name text,
  p_partner2_name text,
  p_wedding_date date,
  p_city text default null,
  p_estimated_guests int default null,
  p_estimated_budget_cents bigint default null,
  p_style text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_user();
  member_role public.agency_role;
  agency_plan text;
  max_events int;
  new_id uuid;
begin
  select role into member_role
  from public.agency_members
  where agency_id = p_agency_id and user_id = uid;

  if member_role is null then
    raise exception 'sem_permissao' using errcode = 'P0001';
  end if;

  -- Trava a assessoria para que dois cadastros simultâneos não furem o limite.
  select plan_code into agency_plan from public.agencies where id = p_agency_id for update;
  max_events := private.plan_limit(agency_plan, 'maxActiveEvents');

  -- Casamento com data já passada não conta como ativo (ex.: cadastro retroativo).
  if max_events is not null
     and (p_wedding_date is null
          or p_wedding_date >= (now() at time zone 'America/Sao_Paulo')::date)
     and private.active_event_count(p_agency_id) >= max_events then
    raise exception 'limite_eventos_ativos' using errcode = 'P0001';
  end if;

  insert into public.weddings (
    agency_id, partner1_name, partner2_name, wedding_date, city,
    estimated_guests, estimated_budget_cents, style, created_by
  ) values (
    p_agency_id, trim(p_partner1_name), trim(p_partner2_name), p_wedding_date, trim(p_city),
    p_estimated_guests, p_estimated_budget_cents, p_style, uid
  )
  returning id into new_id;

  -- Membro da equipe que cria o casamento já fica liberado nele.
  if member_role = 'staff' then
    insert into public.agency_wedding_staff (wedding_id, user_id) values (new_id, uid);
  end if;

  return new_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Convites por link: uso único, expiração de 7 dias, token só no retorno.
-- ---------------------------------------------------------------------------

create function public.create_invite(
  p_kind public.invite_kind,
  p_wedding_id uuid default null,
  p_agency_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_user();
  token text;
  couple_count int;
  team_count int;
  team_max int;
begin
  perform private.check_rate_limit('create_invite:' || uid, 20, interval '1 hour');

  if p_kind = 'couple' then
    -- Assessor convida os noivos para o casamento que criou.
    if p_wedding_id is null or not private.has_agency_access(p_wedding_id) then
      raise exception 'sem_permissao' using errcode = 'P0001';
    end if;
  elsif p_kind = 'partner' then
    -- Noivo convida o(a) parceiro(a).
    if p_wedding_id is null or not private.is_wedding_couple(p_wedding_id) then
      raise exception 'sem_permissao' using errcode = 'P0001';
    end if;
  elsif p_kind = 'staff' then
    if p_agency_id is null or not private.is_agency_owner(p_agency_id) then
      raise exception 'sem_permissao' using errcode = 'P0001';
    end if;
  end if;

  if p_kind in ('couple', 'partner') then
    select count(*) into couple_count
    from public.wedding_members
    where wedding_id = p_wedding_id and role = 'couple';
    if couple_count >= 2 then
      raise exception 'casamento_completo' using errcode = 'P0001';
    end if;
  else
    select count(*) into team_count from public.agency_members where agency_id = p_agency_id;
    team_max := private.plan_limit(
      (select plan_code from public.agencies where id = p_agency_id), 'maxTeamLogins'
    );
    if team_max is not null and team_count >= team_max then
      raise exception 'limite_equipe' using errcode = 'P0001';
    end if;
  end if;

  -- 32 bytes aleatórios em base64url sem padding = 43 caracteres.
  token := rtrim(
    translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'),
    '='
  );

  insert into public.invites (kind, wedding_id, agency_id, token_hash, created_by, expires_at)
  values (
    p_kind,
    case when p_kind = 'staff' then null else p_wedding_id end,
    case when p_kind = 'staff' then p_agency_id else null end,
    private.hash_token(token),
    uid,
    now() + interval '7 days'
  );

  return token;
end;
$$;

create function public.accept_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_user();
  inv public.invites;
  team_count int;
  team_max int;
begin
  -- Conta tentativas (inclusive as inválidas) para impedir adivinhação de tokens.
  perform private.check_rate_limit('accept_invite:' || uid, 10, interval '1 hour');

  -- Falhas viram retorno { ok: false, error } em vez de exceção: uma exceção
  -- desfaria a transação inteira, inclusive o registro da tentativa acima.
  begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'convite_invalido' using errcode = 'P0001';
  end if;

  select * into inv
  from public.invites
  where token_hash = private.hash_token(p_token)
  for update;

  if inv.id is null or inv.used_at is not null or inv.revoked_at is not null then
    raise exception 'convite_invalido' using errcode = 'P0001';
  end if;
  if inv.expires_at <= now() then
    raise exception 'convite_expirado' using errcode = 'P0001';
  end if;

  if inv.kind in ('couple', 'partner') then
    if exists (
      select 1 from public.wedding_members
      where wedding_id = inv.wedding_id and user_id = uid
    ) then
      raise exception 'ja_e_membro' using errcode = 'P0001';
    end if;
    -- O limite de 2 noivos é garantido pelo trigger wedding_members_couple_limit.
    insert into public.wedding_members (wedding_id, user_id, role)
    values (inv.wedding_id, uid, 'couple');
  else
    if exists (
      select 1 from public.agency_members where agency_id = inv.agency_id and user_id = uid
    ) then
      raise exception 'ja_e_membro' using errcode = 'P0001';
    end if;
    perform 1 from public.agencies where id = inv.agency_id for update;
    select count(*) into team_count from public.agency_members where agency_id = inv.agency_id;
    team_max := private.plan_limit(
      (select plan_code from public.agencies where id = inv.agency_id), 'maxTeamLogins'
    );
    if team_max is not null and team_count >= team_max then
      raise exception 'limite_equipe' using errcode = 'P0001';
    end if;
    insert into public.agency_members (agency_id, user_id, role)
    values (inv.agency_id, uid, 'staff');
  end if;

  update public.invites set used_at = now(), used_by = uid where id = inv.id;

  return jsonb_build_object(
    'ok', true,
    'kind', inv.kind,
    'wedding_id', inv.wedding_id,
    'agency_id', inv.agency_id
  );
  exception when sqlstate 'P0001' then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
  end;
end;
$$;

create function public.revoke_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_user();
begin
  update public.invites
  set revoked_at = now()
  where id = p_invite_id and created_by = uid and used_at is null and revoked_at is null;

  if not found then
    raise exception 'convite_invalido' using errcode = 'P0001';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Exclusão de conta com carência de 30 dias (D09)
-- ---------------------------------------------------------------------------

create function public.request_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_user();
  scheduled timestamptz := now() + interval '30 days';
begin
  insert into public.account_deletion_requests (user_id, scheduled_for)
  values (uid, scheduled)
  on conflict (user_id) do nothing;

  return (select scheduled_for from public.account_deletion_requests where user_id = uid);
end;
$$;

create function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_user();
begin
  delete from public.account_deletion_requests where user_id = uid;
end;
$$;

-- Executada diariamente (pg_cron). Remove contas e casamentos cuja carência acabou.
-- Apagar o usuário em auth.users remove em cascata perfil, vínculos e consentimentos;
-- casamentos da assessoria permanecem com ela (D10); casamentos sem noivos e sem
-- assessor entram na carência pelo trigger wedding_members_orphan_check.
create function private.process_scheduled_deletions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users u
  using public.account_deletion_requests r
  where r.user_id = u.id and r.scheduled_for <= now();

  delete from public.weddings
  where deletion_scheduled_for is not null and deletion_scheduled_for <= now();
end;
$$;

create extension if not exists pg_cron;

select cron.schedule(
  'processar-exclusoes-agendadas',
  '0 6 * * *', -- 03:00 em São Paulo
  'select private.process_scheduled_deletions()'
);

-- ---------------------------------------------------------------------------
-- Permissões de execução
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon;

grant execute on function
  public.create_couple_wedding(text, text, date, text, int, bigint, text),
  public.create_agency(text),
  public.create_agency_wedding(uuid, text, text, date, text, int, bigint, text),
  public.create_invite(public.invite_kind, uuid, uuid),
  public.accept_invite(text),
  public.revoke_invite(uuid),
  public.request_account_deletion(),
  public.cancel_account_deletion()
to authenticated;

-- Funções internas não executáveis pelos clientes.
revoke execute on function
  private.require_user(),
  private.check_rate_limit(text, int, interval),
  private.active_event_count(uuid),
  private.plan_limit(text, text),
  private.hash_token(text),
  private.process_scheduled_deletions(),
  private.set_updated_at(),
  private.random_code(int),
  private.handle_new_user(),
  private.enforce_couple_limit(),
  private.schedule_orphan_wedding_deletion(),
  private.enforce_staff_assignment(),
  private.cleanup_staff_assignments()
from public, anon, authenticated;
