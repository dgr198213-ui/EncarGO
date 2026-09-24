-- Encargo · esquema inicial (Fase 1)
-- Usuarios: gestionados por Supabase Auth (auth.users), no se duplica tabla propia.

create extension if not exists "pgcrypto";

create type tipo_encargo as enum ('contenido', 'automatizacion', 'diseno', 'administrativo');
create type estado_encargo as enum (
  'borrador',
  'pendiente_confirmacion',
  'confirmado',
  'ejecutando',
  'completado',
  'rechazado'
);
create type canal_entrada as enum ('chat', 'formulario', 'mixto');

create table if not exists encargos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo tipo_encargo not null,
  canal_entrada canal_entrada not null,
  input_bruto text,
  campos_formulario jsonb,
  parametros_extraidos jsonb not null default '{}'::jsonb,
  confianza_clasificacion numeric(3, 2) check (confianza_clasificacion between 0 and 1),
  estado estado_encargo not null default 'borrador',
  resumen_legible text,
  requiere_confirmacion_explicita boolean not null default false,
  creado_en timestamptz not null default now(),
  confirmado_en timestamptz
);

create table if not exists pasos_ejecucion (
  id uuid primary key default gen_random_uuid(),
  encargo_id uuid not null references encargos(id) on delete cascade,
  orden integer not null,
  descripcion text not null,
  herramienta_destino text not null,
  editable boolean not null default true,
  aprobado boolean not null default false,
  resultado jsonb
);

create index if not exists idx_encargos_usuario on encargos(usuario_id);
create index if not exists idx_encargos_estado on encargos(estado);
create index if not exists idx_pasos_encargo on pasos_ejecucion(encargo_id);

-- Row Level Security: cada usuario solo ve/edita sus propios encargos.
alter table encargos enable row level security;
alter table pasos_ejecucion enable row level security;

create policy "usuario ve sus encargos" on encargos
  for select using (auth.uid() = usuario_id);
create policy "usuario crea sus encargos" on encargos
  for insert with check (auth.uid() = usuario_id);
create policy "usuario actualiza sus encargos" on encargos
  for update using (auth.uid() = usuario_id);

create policy "usuario ve pasos de sus encargos" on pasos_ejecucion
  for select using (
    exists (select 1 from encargos e where e.id = encargo_id and e.usuario_id = auth.uid())
  );
create policy "usuario actualiza pasos de sus encargos" on pasos_ejecucion
  for update using (
    exists (select 1 from encargos e where e.id = encargo_id and e.usuario_id = auth.uid())
  );
