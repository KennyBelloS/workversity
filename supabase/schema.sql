-- ============================================================================
-- WORKVERSITY — esquema completo (idempotente: seguro de correr varias veces)
-- Sirve para un proyecto nuevo y para uno que ya tenga los archivos anteriores.
-- Supabase → SQL Editor → pegar todo → Run.
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- PERFILES
create table if not exists perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  correo text not null,
  avatar_url text,
  created_at timestamptz default now()
);
alter table perfiles add column if not exists capacidad_maxima_horas numeric not null default 8;
alter table perfiles add column if not exists hora_limite_sin_tareas text not null default '20:00';
alter table perfiles add column if not exists modo_supervivencia boolean not null default false;
alter table perfiles add column if not exists puntos integer not null default 0;

alter table perfiles enable row level security;
drop policy if exists "perfiles_select_propio" on perfiles;
create policy "perfiles_select_propio" on perfiles for select using ((select auth.uid()) = id);
drop policy if exists "perfiles_insert_propio" on perfiles;
create policy "perfiles_insert_propio" on perfiles for insert with check ((select auth.uid()) = id);
drop policy if exists "perfiles_update_propio" on perfiles;
create policy "perfiles_update_propio" on perfiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.manejar_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, correo)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.manejar_nuevo_usuario();

insert into public.perfiles (id, nombre, correo)
select u.id, coalesce(u.raw_user_meta_data->>'nombre', split_part(u.email, '@', 1)), u.email
from auth.users u
on conflict (id) do nothing;

-- ------------------------------------------------------------------ TAREAS
create table if not exists tareas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text default '',
  category text not null check (category in ('universidad', 'trabajo')),
  due_date timestamptz not null,
  has_reminder boolean not null default true,
  reminder_minutes_before integer not null default 60,
  photo_paths text[] not null default '{}',
  status text not null default 'pendiente' check (status in ('pendiente', 'enProgreso', 'hecha')),
  priority text not null default 'media' check (priority in ('baja', 'media', 'alta')),
  is_recurring boolean not null default false,
  recurrence_interval_days integer not null default 7,
  created_at timestamptz default now()
);
alter table tareas add column if not exists estimated_minutes integer;
alter table tareas add column if not exists parent_task_id uuid references tareas (id) on delete cascade;
create index if not exists idx_tareas_user on tareas (user_id);
create index if not exists idx_tareas_due_date on tareas (due_date);
create index if not exists idx_tareas_parent on tareas (parent_task_id);

-- ----------------------------------------------------------------- HORARIO
create table if not exists bloques_horario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  location text default '',
  type text not null default 'clase' check (type in ('clase', 'trabajo', 'reunion', 'almuerzo', 'otro')),
  day_of_week integer not null check (day_of_week between 1 and 7),
  start_minutes integer not null,
  end_minutes integer not null,
  color_value text not null default '#5B8DEF',
  created_at timestamptz default now()
);
create index if not exists idx_bloques_user on bloques_horario (user_id);

-- ---------------------------------------------------------------- MATERIAS
create table if not exists materias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  profesor text default '',
  salon text default '',
  nrc text default '',
  day_of_week integer not null check (day_of_week between 1 and 7),
  start_minutes integer not null,
  end_minutes integer not null,
  color_value text not null default '#5B8DEF',
  tiene_recordatorio boolean not null default true,
  recordatorio_minutos_antes integer not null default 15,
  prioridad text not null default 'media' check (prioridad in ('baja', 'media', 'alta')),
  created_at timestamptz default now()
);
create index if not exists idx_materias_user on materias (user_id);

-- --------------------------------------------------------------- FINANZAS
create table if not exists movimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('ingreso', 'gasto', 'ahorro')),
  amount numeric not null,
  category text not null default 'Otro',
  note text default '',
  date timestamptz not null default now(),
  created_at timestamptz default now()
);
create index if not exists idx_movimientos_user on movimientos (user_id);
create index if not exists idx_movimientos_date on movimientos (date);

create table if not exists metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  target_amount numeric not null,
  categoria_vinculada text not null,
  fecha_limite date,
  color_value text not null default '#6FA8DC',
  created_at timestamptz default now()
);
create index if not exists idx_metas_user on metas (user_id);

create table if not exists presupuestos_mensuales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mes text not null,
  amount numeric not null,
  created_at timestamptz default now(),
  unique (user_id, mes)
);

-- ---------------------------------------------------------------- ANALÍTICA
create table if not exists registros_energia (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null default current_date,
  nivel integer not null check (nivel between 1 and 5),
  created_at timestamptz default now(),
  unique (user_id, fecha)
);

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

-- ------------------------------------------- updated_at + RLS en todas las tablas
do $$
declare t text;
begin
  foreach t in array array['perfiles','tareas','bloques_horario','materias','movimientos',
                           'metas','presupuestos_mensuales','registros_energia','sesiones_pomodoro']
  loop
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', t);
    execute format('drop trigger if exists trg_%s_updated_at on public.%I', t, t);
    execute format('create trigger trg_%s_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t, t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ------------------- Políticas: cada persona solo ve y modifica lo suyo
do $$
declare r record;
begin
  for r in select * from (values
    ('tareas','tareas_todo_propio'),
    ('bloques_horario','bloques_todo_propio'),
    ('materias','materias_todo_propio'),
    ('movimientos','movimientos_todo_propio'),
    ('metas','metas_todo_propio'),
    ('presupuestos_mensuales','presupuestos_todo_propio'),
    ('registros_energia','energia_todo_propio'),
    ('sesiones_pomodoro','pomodoro_todo_propio')
  ) as v(tabla, politica)
  loop
    execute format('drop policy if exists %I on public.%I', r.politica, r.tabla);
    execute format('create policy %I on public.%I for all
                    using ((select auth.uid()) = user_id)
                    with check ((select auth.uid()) = user_id)', r.politica, r.tabla);
  end loop;
end $$;

-- ------------------------------------------------ Integridad (no toca datos viejos)
do $$ begin
  alter table movimientos add constraint movimientos_monto_positivo check (amount > 0) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table metas add constraint metas_monto_positivo check (target_amount > 0) not valid;
exception when duplicate_object then null; end $$;

-- ============================================================================
-- v3: materias virtuales, tareas ligadas a materia, reuniones, notificaciones push
-- ============================================================================
alter table materias add column if not exists es_virtual boolean not null default false;
alter table materias add column if not exists enlace_virtual text default '';

alter table tareas add column if not exists materia_id uuid references materias (id) on delete set null;
create index if not exists idx_tareas_materia on tareas (materia_id);

alter table bloques_horario drop constraint if exists bloques_horario_type_check;
alter table bloques_horario add constraint bloques_horario_type_check
  check (type in ('clase', 'trabajo', 'reunion', 'almuerzo', 'otro'));
alter table bloques_horario add column if not exists tiene_recordatorio boolean not null default true;
alter table bloques_horario add column if not exists recordatorio_minutos_antes integer not null default 60;

alter table perfiles add column if not exists zona_horaria text not null default 'America/Bogota';
alter table perfiles add column if not exists notif_resumen_diario boolean not null default true;
alter table perfiles add column if not exists notif_hora_resumen text not null default '07:30';

create table if not exists push_suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text default '',
  created_at timestamptz default now()
);
create index if not exists idx_push_user on push_suscripciones (user_id);
alter table push_suscripciones enable row level security;
drop policy if exists "push_todo_propio" on push_suscripciones;
create policy "push_todo_propio" on push_suscripciones for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Registro de avisos ya enviados (evita repetirlos). Solo lo usa el servidor.
create table if not exists notificaciones_enviadas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  clave text not null,
  enviada_en timestamptz not null default now(),
  unique (user_id, clave)
);
alter table notificaciones_enviadas enable row level security;

-- ============================================================================
-- v4: resúmenes (fecha de cierre), calendario (enlace de suscripción), notas por materia
-- ============================================================================
alter table tareas add column if not exists completed_at timestamptz;

alter table perfiles add column if not exists calendario_token uuid not null default gen_random_uuid();
create unique index if not exists idx_perfiles_calendario_token on perfiles (calendario_token);

create table if not exists evaluaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  materia_id uuid not null references materias (id) on delete cascade,
  nombre text not null,
  porcentaje numeric not null check (porcentaje >= 0 and porcentaje <= 100),
  nota numeric check (nota >= 0 and nota <= 5),
  created_at timestamptz default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_evaluaciones_user on evaluaciones (user_id);
create index if not exists idx_evaluaciones_materia on evaluaciones (materia_id);
alter table evaluaciones enable row level security;
drop policy if exists "evaluaciones_todo_propio" on evaluaciones;
create policy "evaluaciones_todo_propio" on evaluaciones for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop trigger if exists trg_evaluaciones_updated_at on evaluaciones;
create trigger trg_evaluaciones_updated_at before update on evaluaciones
  for each row execute function public.set_updated_at();

-- ============================================================================
-- v5: notas por cortes (3 cortes con peso configurable, por defecto 35 / 35 / 30)
-- ============================================================================
alter table evaluaciones add column if not exists corte smallint not null default 1 check (corte between 1 and 3);
create index if not exists idx_evaluaciones_corte on evaluaciones (materia_id, corte);

create table if not exists cortes_notas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  materia_id uuid not null references materias (id) on delete cascade,
  peso1 numeric not null default 35 check (peso1 >= 0 and peso1 <= 100),
  peso2 numeric not null default 35 check (peso2 >= 0 and peso2 <= 100),
  peso3 numeric not null default 30 check (peso3 >= 0 and peso3 <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, materia_id)
);
alter table cortes_notas enable row level security;
drop policy if exists "cortes_notas_todo_propio" on cortes_notas;
create policy "cortes_notas_todo_propio" on cortes_notas for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop trigger if exists trg_cortes_notas_updated_at on cortes_notas;
create trigger trg_cortes_notas_updated_at before update on cortes_notas
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';

-- ============================================================================
-- v6: actividades desglosadas (p. ej. "Talleres" con Taller 1, Taller 2…)
-- ============================================================================
alter table evaluaciones add column if not exists items jsonb not null default '[]'::jsonb;
notify pgrst, 'reload schema';

-- ============================================================================
-- v7: categorías de ahorro propias (para saber a dónde va cada ahorro)
-- ============================================================================
create table if not exists categorias_ahorro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  color text not null default '#5B8DEF',
  created_at timestamptz default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, nombre)
);
alter table categorias_ahorro enable row level security;
drop policy if exists "categorias_ahorro_todo_propio" on categorias_ahorro;
create policy "categorias_ahorro_todo_propio" on categorias_ahorro for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop trigger if exists trg_categorias_ahorro_updated_at on categorias_ahorro;
create trigger trg_categorias_ahorro_updated_at before update on categorias_ahorro
  for each row execute function public.set_updated_at();
notify pgrst, 'reload schema';

-- ============================================================================
-- v8: metas de progreso (leer un libro, estudiar, ejercicio…) y sus avances
-- ============================================================================
alter table metas add column if not exists tipo text not null default 'ahorro';
alter table metas add column if not exists unidad text not null default '';
alter table categorias_ahorro add column if not exists tipo text not null default 'ahorro';

create table if not exists avances_meta (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meta_id uuid not null references metas (id) on delete cascade,
  cantidad numeric not null check (cantidad > 0),
  nota text default '',
  fecha timestamptz not null default now(),
  created_at timestamptz default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_avances_user on avances_meta (user_id);
create index if not exists idx_avances_meta on avances_meta (meta_id, fecha);
alter table avances_meta enable row level security;
drop policy if exists "avances_meta_todo_propio" on avances_meta;
create policy "avances_meta_todo_propio" on avances_meta for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop trigger if exists trg_avances_meta_updated_at on avances_meta;
create trigger trg_avances_meta_updated_at before update on avances_meta
  for each row execute function public.set_updated_at();
notify pgrst, 'reload schema';

-- ============================================================================
-- v9: dificultad y tiempo real de las tareas, y documentos del espacio de trabajo
-- ============================================================================
alter table tareas add column if not exists dificultad text not null default 'media';
alter table tareas drop constraint if exists tareas_dificultad_check;
alter table tareas add constraint tareas_dificultad_check check (dificultad in ('facil', 'media', 'dificil'));
alter table tareas add column if not exists tiempo_real_minutos numeric not null default 0;

create table if not exists documentos_tarea (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tarea_id uuid not null references tareas (id) on delete cascade,
  tipo text not null check (tipo in ('texto', 'hoja', 'diapositivas', 'notas')),
  titulo text not null default '',
  contenido text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_documentos_tarea on documentos_tarea (tarea_id);
create index if not exists idx_documentos_user on documentos_tarea (user_id);
alter table documentos_tarea enable row level security;
drop policy if exists "documentos_tarea_todo_propio" on documentos_tarea;
create policy "documentos_tarea_todo_propio" on documentos_tarea for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop trigger if exists trg_documentos_tarea_updated_at on documentos_tarea;
create trigger trg_documentos_tarea_updated_at before update on documentos_tarea
  for each row execute function public.set_updated_at();
notify pgrst, 'reload schema';

-- ============================================================================
-- v10: espacios compartidos (pareja, compañeros de piso, grupo de estudio…)
-- Dos roles: admin (acceso total, sin restricciones) y miembro (mismo acceso,
-- pero pensado para el día a día: sus tareas, pedir un espacio en la agenda…).
-- Los puntos de cada quien siguen siendo suyos (columna perfiles.puntos); aquí
-- solo se agrega una forma de compararlos dentro del espacio (tabla de posiciones).
-- ============================================================================
create table if not exists espacios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo text not null unique,
  creado_por uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists espacio_miembros (
  id uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references espacios (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rol text not null default 'miembro' check (rol in ('admin', 'miembro')),
  color text not null default '#5B8DEF',
  created_at timestamptz default now(),
  unique (espacio_id, user_id)
);
create index if not exists idx_espacio_miembros_espacio on espacio_miembros (espacio_id);
create index if not exists idx_espacio_miembros_user on espacio_miembros (user_id);

create table if not exists solicitudes_horario (
  id uuid primary key default gen_random_uuid(),
  espacio_id uuid not null references espacios (id) on delete cascade,
  de_user_id uuid not null references auth.users (id) on delete cascade,
  para_user_id uuid references auth.users (id) on delete cascade, -- null = para todo el espacio
  titulo text not null,
  nota text default '',
  inicio timestamptz not null,
  fin timestamptz not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aceptada', 'rechazada')),
  created_at timestamptz default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_solicitudes_espacio on solicitudes_horario (espacio_id);

-- Funciones "security definer": evitan que las políticas de espacio_miembros se
-- consulten a sí mismas (lo que Postgres rechaza con "infinite recursion").
create or replace function public.es_miembro_espacio(p_espacio uuid, p_user uuid)
returns boolean language sql security definer stable as $$
  select exists(select 1 from espacio_miembros where espacio_id = p_espacio and user_id = p_user);
$$;
create or replace function public.es_admin_espacio(p_espacio uuid, p_user uuid)
returns boolean language sql security definer stable as $$
  select exists(select 1 from espacio_miembros where espacio_id = p_espacio and user_id = p_user and rol = 'admin');
$$;

alter table espacios enable row level security;
drop policy if exists "espacios_los_ve_quien_es_miembro" on espacios;
create policy "espacios_los_ve_quien_es_miembro" on espacios for select
  using (es_miembro_espacio(id, (select auth.uid())));
drop policy if exists "espacios_lo_borra_el_admin" on espacios;
create policy "espacios_lo_borra_el_admin" on espacios for delete
  using (es_admin_espacio(id, (select auth.uid())));

alter table espacio_miembros enable row level security;
drop policy if exists "miembros_ven_su_espacio" on espacio_miembros;
create policy "miembros_ven_su_espacio" on espacio_miembros for select
  using (es_miembro_espacio(espacio_id, (select auth.uid())));
drop policy if exists "admin_administra_miembros" on espacio_miembros;
create policy "admin_administra_miembros" on espacio_miembros for update
  using (es_admin_espacio(espacio_id, (select auth.uid())));
drop policy if exists "admin_o_el_mismo_se_puede_salir" on espacio_miembros;
create policy "admin_o_el_mismo_se_puede_salir" on espacio_miembros for delete
  using (es_admin_espacio(espacio_id, (select auth.uid())) or user_id = (select auth.uid()));

alter table solicitudes_horario enable row level security;
drop policy if exists "solicitudes_todo_el_espacio" on solicitudes_horario;
create policy "solicitudes_todo_el_espacio" on solicitudes_horario for all
  using (es_miembro_espacio(espacio_id, (select auth.uid())))
  with check (es_miembro_espacio(espacio_id, (select auth.uid())));

-- Crear un espacio y quedar como su admin, en un solo paso.
create or replace function public.crear_espacio(p_nombre text)
returns espacios language plpgsql security definer as $$
declare
  nuevo espacios;
  intento text;
begin
  loop
    intento := upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from espacios where codigo = intento);
  end loop;
  insert into espacios (nombre, codigo, creado_por) values (p_nombre, intento, auth.uid()) returning * into nuevo;
  insert into espacio_miembros (espacio_id, user_id, rol, color) values (nuevo.id, auth.uid(), 'admin', '#5B8DEF');
  return nuevo;
end;
$$;

-- Unirse a un espacio con su código de invitación. Si ya eras miembro, no duplica nada.
create or replace function public.unirse_a_espacio(p_codigo text)
returns jsonb language plpgsql security definer as $$
declare
  e espacios;
  ya_era boolean;
  n_miembros int;
  paleta text[] := array['#5B8DEF', '#E5789C', '#17C964', '#F5A524', '#8B7FD1', '#7FD1C3'];
begin
  select * into e from espacios where codigo = upper(trim(p_codigo));
  if e.id is null then
    raise exception 'Ese código no existe o ya no es válido.';
  end if;
  select exists(select 1 from espacio_miembros where espacio_id = e.id and user_id = auth.uid()) into ya_era;
  if not ya_era then
    select count(*) into n_miembros from espacio_miembros where espacio_id = e.id;
    insert into espacio_miembros (espacio_id, user_id, rol, color)
      values (e.id, auth.uid(), 'miembro', paleta[(n_miembros % array_length(paleta, 1)) + 1]);
  end if;
  return jsonb_build_object('id', e.id, 'nombre', e.nombre, 'codigo', e.codigo, 'creado_por', e.creado_por, 'ya_era_miembro', ya_era);
end;
$$;

notify pgrst, 'reload schema';

-- ============================================================================
-- v11: espacio para parciales (tarjetas, mini test, simulación de examen)
-- ============================================================================
create table if not exists parciales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  materia_id uuid references materias (id) on delete set null,
  titulo text not null,
  fecha date,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_parciales_user on parciales (user_id);
alter table parciales enable row level security;
drop policy if exists "parciales_todo_propio" on parciales;
create policy "parciales_todo_propio" on parciales for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop trigger if exists trg_parciales_updated_at on parciales;
create trigger trg_parciales_updated_at before update on parciales
  for each row execute function public.set_updated_at();

create table if not exists parcial_fuentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  parcial_id uuid not null references parciales (id) on delete cascade,
  nombre text not null default 'Apuntes',
  texto text not null default '',
  created_at timestamptz default now()
);
create index if not exists idx_parcial_fuentes_parcial on parcial_fuentes (parcial_id);
alter table parcial_fuentes enable row level security;
drop policy if exists "parcial_fuentes_todo_propio" on parcial_fuentes;
create policy "parcial_fuentes_todo_propio" on parcial_fuentes for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists parcial_tarjetas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  parcial_id uuid not null references parciales (id) on delete cascade,
  pregunta text not null,
  respuesta text not null,
  nivel smallint not null default 0,
  racha smallint not null default 0,
  visto_el timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_parcial_tarjetas_parcial on parcial_tarjetas (parcial_id);
alter table parcial_tarjetas enable row level security;
drop policy if exists "parcial_tarjetas_todo_propio" on parcial_tarjetas;
create policy "parcial_tarjetas_todo_propio" on parcial_tarjetas for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop trigger if exists trg_parcial_tarjetas_updated_at on parcial_tarjetas;
create trigger trg_parcial_tarjetas_updated_at before update on parcial_tarjetas
  for each row execute function public.set_updated_at();

create table if not exists parcial_resultados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  parcial_id uuid not null references parciales (id) on delete cascade,
  tipo text not null check (tipo in ('test', 'simulacro')),
  aciertos int not null,
  total int not null,
  porcentaje int not null,
  created_at timestamptz default now()
);
create index if not exists idx_parcial_resultados_parcial on parcial_resultados (parcial_id);
alter table parcial_resultados enable row level security;
drop policy if exists "parcial_resultados_todo_propio" on parcial_resultados;
create policy "parcial_resultados_todo_propio" on parcial_resultados for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';

-- ============================================================================
-- v12: Apuntes (cuaderno digital): clase, tarea, proyecto o libre, con mapa mental
-- ============================================================================
create table if not exists apuntes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  materia_id uuid references materias (id) on delete set null,
  tipo text not null default 'clase' check (tipo in ('clase', 'tarea', 'proyecto', 'libre')),
  titulo text not null,
  contenido text not null default '',
  mapa_mental jsonb not null default '[]'::jsonb,
  favorito boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_apuntes_user on apuntes (user_id);
create index if not exists idx_apuntes_materia on apuntes (materia_id);
alter table apuntes enable row level security;
drop policy if exists "apuntes_todo_propio" on apuntes;
create policy "apuntes_todo_propio" on apuntes for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop trigger if exists trg_apuntes_updated_at on apuntes;
create trigger trg_apuntes_updated_at before update on apuntes
  for each row execute function public.set_updated_at();
notify pgrst, 'reload schema';

-- ============================================================================
-- v13: agenda visible entre miembros de un espacio + conflictos al pedir un horario
-- Quien está en tu mismo espacio ve tu horario real (materias, bloques y tareas)
-- para poder proponer citas sin chocar con lo que ya tienes agendado. Solo lectura:
-- nadie puede editar o borrar nada que no sea suyo.
-- ============================================================================
create or replace function public.comparten_espacio(p_a uuid, p_b uuid)
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from espacio_miembros m1 join espacio_miembros m2 using (espacio_id)
    where m1.user_id = p_a and m2.user_id = p_b
  );
$$;

drop policy if exists "materias_las_ve_el_espacio" on materias;
create policy "materias_las_ve_el_espacio" on materias for select
  using (comparten_espacio(user_id, (select auth.uid())));
drop policy if exists "bloques_los_ve_el_espacio" on bloques_horario;
create policy "bloques_los_ve_el_espacio" on bloques_horario for select
  using (comparten_espacio(user_id, (select auth.uid())));
drop policy if exists "tareas_las_ve_el_espacio" on tareas;
create policy "tareas_las_ve_el_espacio" on tareas for select
  using (comparten_espacio(user_id, (select auth.uid())));

notify pgrst, 'reload schema';
