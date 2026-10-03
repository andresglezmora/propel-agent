-- Variantes de propuesta: cada propuesta guarda su receta, su plan (la lista
-- ordenada de módulos, si se ajustó) y el contenido de los módulos que piden
-- datos o texto (precios de red, razones, páginas a la medida).
alter table propel.proposals add column if not exists recipe text not null default 'full-service';
alter table propel.proposals add column if not exists plan jsonb;            -- null = la receta tal cual
alter table propel.proposals add column if not exists module_data jsonb not null default '{}'::jsonb;

-- Recetas guardadas por el equipo (además de las que vienen en el código).
-- Scale puede escribir aquí más adelante; el agente las lee y puede guardar
-- una nueva a partir del plan de una propuesta.
create table if not exists propel.recipes (
  id          text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,48}$'),
  title       text not null,
  description text not null default '',
  modules     jsonb not null check (jsonb_typeof(modules) = 'array'),
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table propel.recipes enable row level security;
grant all on propel.recipes to service_role;

insert into propel.schema_migrations (version) values ('0003_plans') on conflict do nothing;
notify pgrst, 'reload schema';
