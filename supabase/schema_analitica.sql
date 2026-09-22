-- ============================================================================
-- WORKVERSITY — Módulo de Analítica / Asistente Inteligente
-- ----------------------------------------------------------------------------
-- Corre este archivo DESPUÉS de supabase/schema.sql (no lo reemplaza, lo
-- complementa). Agrega: nivel de energía diario, sesiones de Pomodoro,
-- sub-tareas (micro-tasking), duración estimada, y ajustes de capacidad
-- máxima / modo supervivencia / puntos de gamificación en el perfil.
-- Seguro de volver a correr.
-- ============================================================================

-- --- Ajustes de bienestar y capacidad en el perfil ---
alter table perfiles add column if not exists capacidad_maxima_horas numeric not null default 8;
alter table perfiles add column if not exists hora_limite_sin_tareas text not null default '20:00';
alter table perfiles add column if not exists modo_supervivencia boolean not null default false;
alter table perfiles add column if not exists puntos integer not null default 0;

-- --- Duración estimada y sub-tareas (micro-tasking) en las tareas ---
alter table tareas add column if not exists estimated_minutes integer;
alter table tareas add column if not exists parent_task_id uuid references tareas (id) on delete cascade;

create index if not exists idx_tareas_parent on tareas (parent_task_id);

-- --- Registro diario de energía (1 a 5) ---
create table if not exists registros_energia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null default current_date,
  nivel integer not null check (nivel between 1 and 5),
  created_at timestamptz default now(),
  unique (user_id, fecha)
);

alter table registros_energia enable row level security;

drop policy if exists "energia_todo_propio" on registros_energia;
create policy "energia_todo_propio" on registros_energia
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- --- Sesiones de Pomodoro (para detectar patrones de concentración) ---
create table if not exists sesiones_pomodoro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tarea_id uuid references tareas (id) on delete set null,
  tipo text not null default 'mecanica' check (tipo in ('mecanica', 'profunda')),
  duracion_minutos integer not null,
  completada boolean not null default false,
  hora_inicio timestamptz not null default now(),
  hora_fin timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_pomodoro_user on sesiones_pomodoro (user_id);
create index if not exists idx_pomodoro_hora_inicio on sesiones_pomodoro (hora_inicio);

alter table sesiones_pomodoro enable row level security;

drop policy if exists "pomodoro_todo_propio" on sesiones_pomodoro;
create policy "pomodoro_todo_propio" on sesiones_pomodoro
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Fin. Ya puedes usar el módulo de Analítica en la app.
-- ============================================================================
