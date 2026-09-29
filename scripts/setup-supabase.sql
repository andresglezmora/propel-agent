-- Propel — schema propio dentro del proyecto de Supabase compartido con
-- LandingPilot (PRD sección 8). Nunca "public": esa es la casa de
-- LandingPilot. Sin grants para anon/authenticated y RLS activo sin
-- políticas, para que la anon key publicada en las landings de LandingPilot
-- no pueda tocar nada de aquí aunque comparta proyecto.
--
-- No se aplica con `supabase db push` (ver scripts/migrate.ts): ese CLI
-- lleva un solo historial de migraciones por proyecto y vería las de
-- LandingPilot como "faltantes". Este archivo lo aplica un script propio,
-- que además registra su versión en propel.schema_migrations.

create schema if not exists propel;

create type propel.campus_mode as enum ('single', 'network');

create type propel.proposal_status as enum (
  'draft',
  'harvesting',
  'awaiting_approval',
  'rendering',
  'delivered',
  'failed'
);

create table propel.proposals (
  id                uuid primary key default gen_random_uuid(),
  school_name       text not null,
  school_possessive text not null,
  school_short      text,
  website_url       text not null,
  campus_mode       propel.campus_mode not null default 'network',
  proposal_date     date not null default current_date,
  status            propel.proposal_status not null default 'draft',
  approved_version  int,
  ai_images_used    int not null default 0,
  requested_by      text,
  telegram_chat_id  text,
  error             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table propel.proposal_versions (
  id            uuid primary key default gen_random_uuid(),
  proposal_id   uuid not null references propel.proposals(id) on delete cascade,
  version       int not null,
  storage_path  text not null, -- propel-proposals/{proposal_id}/v{n}.pdf
  size_bytes    int,
  created_at    timestamptz not null default now(),
  unique (proposal_id, version)
);

create table propel.proposal_photos (
  id            uuid primary key default gen_random_uuid(),
  proposal_id   uuid not null references propel.proposals(id) on delete cascade,
  slot          text not null check (slot in ('cover', 'mission', 'centralized')),
  source        text not null check (source in ('site', 'ai', 'upload')),
  source_url    text, -- URL original, prompt de IA, o file_id de Telegram
  storage_path  text, -- versión ya recortada/comprimida que usa el PDF
  width         int,
  height        int,
  selected      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table propel.proposal_events (
  id            uuid primary key default gen_random_uuid(),
  proposal_id   uuid not null references propel.proposals(id) on delete cascade,
  type          text not null,
  payload       jsonb,
  created_at    timestamptz not null default now()
);

create table propel.schema_migrations (
  version     text primary key,
  applied_at  timestamptz not null default now()
);

alter table propel.proposals enable row level security;
alter table propel.proposal_versions enable row level security;
alter table propel.proposal_photos enable row level security;
alter table propel.proposal_events enable row level security;
-- Sin políticas a propósito: solo service_role (que salta RLS) puede leer o
-- escribir. anon/authenticated no tienen ningún grant sobre este schema.

-- service_role salta RLS pero NO los permisos de schema: en un schema
-- propio, PostgREST responde "permission denied for schema propel" hasta
-- que se le da uso explícito. Solo service_role — nunca anon ni
-- authenticated (ver comentario del inicio).
grant usage on schema propel to service_role;
grant all on all tables in schema propel to service_role;
grant all on all sequences in schema propel to service_role;
alter default privileges in schema propel grant all on tables to service_role;
alter default privileges in schema propel grant all on sequences to service_role;

-- Bucket privado para PDFs y fotos. Privado a propósito: los PDFs se
-- comparten solo con links firmados (30 días), nunca por URL pública.
insert into storage.buckets (id, name, public)
values ('propel-proposals', 'propel-proposals', false)
on conflict (id) do nothing;

-- Expone el schema `propel` a la API (equivale a Settings → API → Exposed schemas).
-- Conserva los schemas que ya estén expuestos y solo agrega propel.
do $$
declare cur text;
begin
  select substring(cfg from 'pgrst\.db_schemas=(.*)') into cur
  from pg_roles r, unnest(r.rolconfig) cfg
  where r.rolname = 'authenticator' and cfg like 'pgrst.db_schemas=%';
  cur := coalesce(cur, 'public,graphql_public');
  if position('propel' in cur) = 0 then
    execute format('alter role authenticator set pgrst.db_schemas = %L', cur || ',propel');
  end if;
end $$;
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
