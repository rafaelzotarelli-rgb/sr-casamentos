-- Etapa 1 — estrutura base: perfis, assessorias, casamentos, vínculos, convites,
-- consentimentos, exclusão de conta e capacidades por plano.
--
-- Convenções:
--   * IDs UUID (podem ser gerados no aparelho — preparação do modo offline, D06).
--   * created_at/updated_at em todas as tabelas.
--   * Datas/horas em UTC; a data do casamento é `date` (sem fuso).
--   * Funções internas ficam no schema `private`, que NÃO é exposto pela API.

create schema if not exists private;
revoke all on schema private from public;

-- Tabelas, sequências e funções novas não recebem permissões automáticas dos
-- papéis da API: cada uma ganha GRANTs explícitos na própria migration.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Código alfanumérico sem caracteres ambíguos (0/O, 1/I/L), para códigos de indicação.
create function private.random_code(len int)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(len);
  result text := '';
begin
  for i in 0 .. len - 1 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.wedding_role as enum ('couple', 'family');
create type public.agency_role as enum ('owner', 'staff');
create type public.invite_kind as enum ('couple', 'partner', 'staff');
create type public.access_level as enum ('none', 'view', 'edit');

-- ---------------------------------------------------------------------------
-- Capacidades por plano (fonte: packages/shared/src/plans.ts — D04)
-- ---------------------------------------------------------------------------

create table public.plan_capabilities (
  code text primary key,
  audience text not null check (audience in ('couple', 'planner')),
  capabilities jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger plan_capabilities_updated_at
before update on public.plan_capabilities
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Perfis
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  avatar_url text check (char_length(avatar_url) <= 2048),
  -- Conta de demonstração para revisores das lojas (D08).
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

-- Administradores do Sr. Casamentos (painel interno). Só o service role escreve aqui.
create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Assessorias
-- ---------------------------------------------------------------------------

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  plan_code text not null default 'planner_free' references public.plan_capabilities (code),
  referral_code text not null unique default private.random_code(8),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger agencies_updated_at
before update on public.agencies
for each row execute function private.set_updated_at();

create table public.agency_members (
  agency_id uuid not null references public.agencies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.agency_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (agency_id, user_id)
);

create index agency_members_user_id_idx on public.agency_members (user_id);
-- Cada assessoria tem um único dono, e cada usuário é dono de no máximo uma assessoria.
create unique index agency_members_one_owner_per_agency
  on public.agency_members (agency_id) where role = 'owner';
create unique index agency_members_one_agency_per_owner
  on public.agency_members (user_id) where role = 'owner';

create trigger agency_members_updated_at
before update on public.agency_members
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Casamentos
-- ---------------------------------------------------------------------------

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  -- Casamento com assessor pertence à assessoria (D10). Uma assessoria por casamento (D11).
  agency_id uuid references public.agencies (id) on delete restrict,
  partner1_name text not null check (char_length(partner1_name) between 2 and 60),
  partner2_name text not null check (char_length(partner2_name) between 2 and 60),
  -- null = "ainda não definimos"
  wedding_date date,
  city text check (char_length(city) between 2 and 80),
  estimated_guests int check (estimated_guests between 1 and 5000),
  estimated_budget_cents bigint check (estimated_budget_cents between 0 and 10000000000),
  style text check (
    style in ('classico', 'rustico', 'praia', 'minimalista', 'boho', 'moderno', 'outro')
  ),
  -- Plano comprado pelos noivos; o efetivo considera também o plano do assessor.
  couple_plan_code text not null default 'couple_free' references public.plan_capabilities (code),
  created_by uuid references auth.users (id) on delete set null,
  -- Preenchido quando o casamento fica sem noivos e sem assessor (D09).
  deletion_scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index weddings_agency_id_idx on public.weddings (agency_id);
create index weddings_deletion_idx on public.weddings (deletion_scheduled_for)
  where deletion_scheduled_for is not null;

create trigger weddings_updated_at
before update on public.weddings
for each row execute function private.set_updated_at();

create table public.wedding_members (
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.wedding_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (wedding_id, user_id)
);

create index wedding_members_user_id_idx on public.wedding_members (user_id);

create trigger wedding_members_updated_at
before update on public.wedding_members
for each row execute function private.set_updated_at();

-- Membros da equipe do assessor liberados para cada casamento.
-- O dono da assessoria tem acesso a todos os casamentos dela sem precisar de linha aqui.
create table public.agency_wedding_staff (
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (wedding_id, user_id)
);

create index agency_wedding_staff_user_id_idx on public.agency_wedding_staff (user_id);

create trigger agency_wedding_staff_updated_at
before update on public.agency_wedding_staff
for each row execute function private.set_updated_at();

-- O que os noivos veem/editam, por módulo, quando há assessor. Sem linha = 'edit'.
create table public.couple_permissions (
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  module text not null check (
    module in ('tasks', 'budget', 'payments', 'vendors', 'contracts', 'guests', 'tables', 'site')
  ),
  level public.access_level not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (wedding_id, module)
);

create trigger couple_permissions_updated_at
before update on public.couple_permissions
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Convites por link (uso único, com expiração). Só o hash do token é guardado.
-- ---------------------------------------------------------------------------

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  kind public.invite_kind not null,
  wedding_id uuid references public.weddings (id) on delete cascade,
  agency_id uuid references public.agencies (id) on delete cascade,
  token_hash bytea not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invites_target check (
    (kind in ('couple', 'partner') and wedding_id is not null and agency_id is null)
    or (kind = 'staff' and agency_id is not null and wedding_id is null)
  )
);

create index invites_wedding_id_idx on public.invites (wedding_id);
create index invites_agency_id_idx on public.invites (agency_id);
create index invites_created_by_idx on public.invites (created_by);

create trigger invites_updated_at
before update on public.invites
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- LGPD: consentimentos e exclusão de conta
-- ---------------------------------------------------------------------------

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document text not null check (document in ('terms', 'privacy')),
  version text not null check (char_length(version) between 1 and 20),
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, document, version)
);

create table public.account_deletion_requests (
  user_id uuid primary key references auth.users (id) on delete cascade,
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger account_deletion_requests_updated_at
before update on public.account_deletion_requests
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Limite de requisições (usado pelas RPCs de convite e, depois, IA e WhatsApp)
-- ---------------------------------------------------------------------------

create table private.rate_limit_events (
  key text not null,
  occurred_at timestamptz not null default now()
);

create index rate_limit_events_key_idx on private.rate_limit_events (key, occurred_at);

-- ---------------------------------------------------------------------------
-- Perfil criado automaticamente no primeiro login
-- ---------------------------------------------------------------------------

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 120),
    left(new.raw_user_meta_data ->> 'avatar_url', 2048)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();
