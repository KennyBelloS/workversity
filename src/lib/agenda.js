// Junta clases, bloques (trabajo, reuniones…) y tareas en una sola lista de eventos.

export const TIPOS_AGENDA = {
  clase: { label: 'Clases', color: '#5B8DEF' },
  trabajo: { label: 'Trabajo', color: '#8B7FD1' },
  reunion: { label: 'Reuniones', color: '#E5789C' },
  tarea: { label: 'Tareas', color: '#F5A524' },
  otro: { label: 'Otros', color: '#7FD1C3' },
};

export function inicioDeSemana(fecha = new Date()) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
export function sumarDias(fecha, n) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + n);
  return d;
}
export function mismoDia(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
const conMinutos = (dia, minutos) => {
  const d = new Date(dia);
  d.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0);
  return d;
};

const COLOR_CATEGORIA = { universidad: '#5B8DEF', trabajo: '#8B7FD1' };

/** Eventos de la semana que empieza en `inicio` (lunes). `dia` va de 0 (lunes) a 6 (domingo). */
export function eventosDeSemana(inicio, { materias = [], bloques = [], tareas = [] }) {
  const eventos = [];
  const materiaPorId = new Map(materias.map((m) => [m.id, m]));

  for (const m of materias) {
    const dia = m.day_of_week - 1;
    const fecha = sumarDias(inicio, dia);
    eventos.push({
      id: `materia-${m.id}`, origen: 'materia', tipo: 'clase', titulo: m.nombre,
      detalle: m.es_virtual ? 'Virtual' : [m.salon, m.profesor].filter(Boolean).join(' · '),
      inicio: conMinutos(fecha, m.start_minutes), fin: conMinutos(fecha, m.end_minutes),
      dia, color: m.color_value, virtual: !!m.es_virtual, ref: m,
    });
  }

  for (const b of bloques) {
    const dia = b.day_of_week - 1;
    const fecha = sumarDias(inicio, dia);
    const tipo = ['clase', 'trabajo', 'reunion'].includes(b.type) ? b.type : 'otro';
    eventos.push({
      id: `bloque-${b.id}`, origen: 'bloque', tipo, titulo: b.title, detalle: b.location || '',
      inicio: conMinutos(fecha, b.start_minutes), fin: conMinutos(fecha, b.end_minutes),
      dia, color: b.color_value, ref: b,
    });
  }

  const fin = sumarDias(inicio, 7);
  for (const t of tareas) {
    const due = new Date(t.due_date);
    if (due < inicio || due >= fin) continue;
    const materia = t.materia_id ? materiaPorId.get(t.materia_id) : null;
    eventos.push({
      id: `tarea-${t.id}`, origen: 'tarea', tipo: 'tarea', titulo: t.title,
      detalle: materia ? materia.nombre : t.category === 'trabajo' ? 'Trabajo' : 'Universidad',
      inicio: due, fin: new Date(due.getTime() + 30 * 60000),
      dia: (due.getDay() + 6) % 7, color: materia?.color_value || COLOR_CATEGORIA[t.category] || '#F5A524',
      hecha: t.status === 'hecha', prioridad: t.priority, ref: t,
    });
  }

  return eventos.sort((a, b) => a.inicio - b.inicio);
}

/** Primer evento que está en curso o aún no empieza (mira 2 semanas). */
export function proximoEvento(ahora, datos) {
  const inicio = inicioDeSemana(ahora);
  const todos = [...eventosDeSemana(inicio, datos), ...eventosDeSemana(sumarDias(inicio, 7), datos)];
  return todos.find((e) => !e.hecha && e.fin > ahora) || null;
}

/** "1 h 20 min", "35 min", "2 días" */
export function textoDuracion(ms) {
  const min = Math.max(0, Math.round(ms / 60000));
  if (min < 1) return 'menos de 1 min';
  if (min < 60) return `${min} min`;
  if (min < 1440) {
    const h = Math.floor(min / 60);
    const r = min % 60;
    return r ? `${h} h ${r} min` : `${h} h`;
  }
  const d = Math.floor(min / 1440);
  return `${d} día${d > 1 ? 's' : ''}`;
}

/** Reparte eventos que se cruzan en columnas para dibujarlos lado a lado. */
export function repartirCarriles(eventosDelDia) {
  const orden = [...eventosDelDia].sort((a, b) => a.inicio - b.inicio || b.fin - a.fin);
  const resultado = [];
  let grupo = [];
  let finGrupo = 0;
  const cerrar = () => {
    const carriles = Math.max(1, ...grupo.map((g) => g.carril + 1));
    grupo.forEach((g) => resultado.push({ ...g, carriles }));
    grupo = [];
  };
  for (const e of orden) {
    if (grupo.length && e.inicio.getTime() >= finGrupo) cerrar();
    const usados = grupo.filter((g) => g.evento.fin > e.inicio).map((g) => g.carril);
    let carril = 0;
    while (usados.includes(carril)) carril++;
    grupo.push({ evento: e, carril });
    finGrupo = Math.max(finGrupo, e.fin.getTime());
  }
  if (grupo.length) cerrar();
  return resultado;
}
