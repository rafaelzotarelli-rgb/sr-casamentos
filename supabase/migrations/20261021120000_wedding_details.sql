-- Ajustes pedidos após o teste da Etapa 1:
--   * local do casamento e contato (e-mail e WhatsApp) de um dos noivos;
--   * membro da assessoria não pode aceitar convite de noivo do próprio casamento;
--   * prévia do convite (quem convidou e para qual casamento);
--   * exclusão de casamento pelo dono da assessoria;
--   * cadastro por e-mail liberado, sempre com confirmação (D25).

-- ---------------------------------------------------------------------------
-- Novos campos
-- ---------------------------------------------------------------------------

alter table public.weddings
  add column venue_name text check (char_length(venue_name) between 2 and 120),
  -- Contato de um dos noivos, informado pelo assessor antes de os noivos entrarem no app.
  add column contact_email text check (
    char_length(contact_email) <= 254 and contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  -- Só dígitos, formato internacional E.164 sem "+": DDI + número (8 a 15 dígitos).
  -- Ex.: 5519991234567 (Brasil), 351912345678 (Portugal). Validação fina no zod.
  add column contact_phone text check (contact_phone ~ '^[1-9][0-9]{7,14}$');

grant update (venue_name, contact_email, contact_phone) on public.weddings to authenticated;

-- ---------------------------------------------------------------------------
-- RPCs de criação com os novos campos (substituem as anteriores)
-- ---------------------------------------------------------------------------

drop function public.create_couple_wedding(text, text, date, text, int, bigint, text);
drop function public.create_agency_wedding(uuid, text, text, date, text, int, bigint, text);

create function public.create_couple_wedding(
  p_partner1_name text,
  p_partner2_name text,
  p_wedding_date date,
  p_city text,
  p_estimated_guests int,
  p_estimated_budget_cents bigint,
  p_style text,
  p_venue_name text default null
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
    partner1_name, partner2_name, wedding_date, city, venue_name,
    estimated_guests, estimated_budget_cents, style, created_by
  ) values (
    trim(p_partner1_name), trim(p_partner2_name), p_wedding_date, trim(p_city),
    nullif(trim(p_venue_name), ''),
    p_estimated_guests, p_estimated_budget_cents, p_style, uid
  )
  returning id into new_id;

  insert into public.wedding_members (wedding_id, user_id, role)
  values (new_id, uid, 'couple');

  return new_id;
end;
$$;

create function public.create_agency_wedding(
  p_agency_id uuid,
  p_partner1_name text,
  p_partner2_name text,
  p_wedding_date date,
  p_city text default null,
  p_estimated_guests int default null,
  p_estimated_budget_cents bigint default null,
  p_style text default null,
  p_venue_name text default null,
  p_contact_email text default null,
  p_contact_phone text default null
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
    agency_id, partner1_name, partner2_name, wedding_date, city, venue_name,
    contact_email, contact_phone,
    estimated_guests, estimated_budget_cents, style, created_by
  ) values (
    p_agency_id, trim(p_partner1_name), trim(p_partner2_name), p_wedding_date, trim(p_city),
    nullif(trim(p_venue_name), ''),
    nullif(lower(trim(p_contact_email)), ''), nullif(p_contact_phone, ''),
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
-- Aceite de convite: assessoria não vira noivo do próprio casamento
-- ---------------------------------------------------------------------------

create or replace function public.accept_invite(p_token text)
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
    -- Quem é da assessoria do casamento já tem acesso pelo painel; aceitar o
    -- convite com essa conta "gastaria" o convite dos noivos (caso real em teste).
    if exists (
      select 1
      from public.weddings w
      join public.agency_members am on am.agency_id = w.agency_id
      where w.id = inv.wedding_id and am.user_id = uid
    ) then
      raise exception 'assessoria_nao_aceita_convite_de_noivos' using errcode = 'P0001';
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

-- ---------------------------------------------------------------------------
-- Prévia do convite: mostra quem convidou antes do login/aceite.
-- Pode ser chamada sem login: quem tem o token (256 bits, secreto) já foi
-- convidado. Não revela nada além de nomes do casal e da assessoria.
-- ---------------------------------------------------------------------------

create function public.invite_preview(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  inv public.invites;
  w public.weddings;
  agency_name text;
  uid uuid := auth.uid();
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{43}$' then
    return jsonb_build_object('valid', false);
  end if;

  select * into inv from public.invites where token_hash = private.hash_token(p_token);
  if inv.id is null or inv.used_at is not null or inv.revoked_at is not null
     or inv.expires_at <= now() then
    return jsonb_build_object('valid', false);
  end if;

  if inv.wedding_id is not null then
    select * into w from public.weddings where id = inv.wedding_id;
  end if;
  select name into agency_name
  from public.agencies
  where id = coalesce(inv.agency_id, w.agency_id);

  return jsonb_build_object(
    'valid', true,
    'kind', inv.kind,
    'partner1_name', w.partner1_name,
    'partner2_name', w.partner2_name,
    'agency_name', agency_name,
    -- O usuário logado já é da assessoria deste casamento? (não pode aceitar como noivo)
    'is_agency_member', uid is not null and exists (
      select 1 from public.agency_members
      where agency_id = coalesce(inv.agency_id, w.agency_id) and user_id = uid
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Exclusão de casamento da assessoria: só o dono, com auditoria (trigger).
-- ---------------------------------------------------------------------------

create function public.delete_agency_wedding(p_wedding_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_user();
begin
  if not exists (
    select 1
    from public.weddings w
    join public.agency_members am
      on am.agency_id = w.agency_id and am.user_id = uid and am.role = 'owner'
    where w.id = p_wedding_id
  ) then
    raise exception 'sem_permissao' using errcode = 'P0001';
  end if;

  delete from public.weddings where id = p_wedding_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cadastro por e-mail liberado (com confirmação obrigatória — config.toml)
-- ---------------------------------------------------------------------------

create or replace function private.before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  provider text := event -> 'user' -> 'app_metadata' ->> 'provider';
begin
  if provider in ('google', 'apple', 'email') then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Cadastro disponível com Google, Apple ou e-mail.'
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissões
-- ---------------------------------------------------------------------------

revoke execute on function
  public.create_couple_wedding(text, text, date, text, int, bigint, text, text),
  public.create_agency_wedding(uuid, text, text, date, text, int, bigint, text, text, text, text),
  public.invite_preview(text),
  public.delete_agency_wedding(uuid)
from public;

grant execute on function
  public.create_couple_wedding(text, text, date, text, int, bigint, text, text),
  public.create_agency_wedding(uuid, text, text, date, text, int, bigint, text, text, text, text),
  public.delete_agency_wedding(uuid)
to authenticated;

grant execute on function public.invite_preview(text) to anon, authenticated;
