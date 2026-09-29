-- Vínculo con el canal de Scale CRM: cada hilo de Scale es una conversación
-- (una sesión del agente) y puede producir una propuesta.
alter table propel.proposals add column if not exists cowork_thread_id text;
create index if not exists proposals_cowork_thread_id_idx
  on propel.proposals (cowork_thread_id) where cowork_thread_id is not null;

-- Deduplicación: Scale entrega mensajes al menos una vez (outbox con reintentos).
create table if not exists propel.inbound_messages (
  message_id  text primary key,
  thread_id   text not null,
  created_at  timestamptz not null default now()
);
alter table propel.inbound_messages enable row level security;
grant all on propel.inbound_messages to service_role;

insert into propel.schema_migrations (version) values ('0002_cowork') on conflict do nothing;
notify pgrst, 'reload schema';
