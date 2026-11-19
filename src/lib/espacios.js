// Espacios compartidos (pareja, compañeros de piso, grupo de estudio…): funciones puras.
// Dos roles: 'admin' (creó el espacio o fue ascendido; acceso total) y 'miembro'
// (mismo acceso a las funciones del espacio; pensado para el uso del día a día).
export const esAdmin = (miembro) => miembro?.rol === 'admin';

export function normalizarCodigo(codigo) {
  return String(codigo || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}
export function codigoValido(codigo) {
  return /^[A-Z0-9]{4,10}$/.test(normalizarCodigo(codigo));
}

/** Nombre para mostrar de un miembro (tu propio perfil o el de otra persona del espacio). */
export function nombreDeMiembro(miembro, perfiles) {
  if (miembro.esYo) return 'Tú';
  return perfiles.find((p) => p.id === miembro.user_id)?.nombre || 'Alguien del espacio';
}

/**
 * Junta la agenda de varias personas en una sola lista, cada evento con quién es
 * (`persona`) y su color, para pintarlos juntos en una vista compartida.
 * `agendasPorMiembro`: [{ miembro, eventos: [...eventos de agenda.js] }]
 */
export function combinarAgendas(agendasPorMiembro, perfiles) {
  return agendasPorMiembro
    .flatMap(({ miembro, eventos }) => eventos.map((ev) => ({ ...ev, persona: nombreDeMiembro(miembro, perfiles), personaId: miembro.user_id, colorPersona: miembro.color })))
    .sort((a, b) => a.inicio - b.inicio);
}

/** ¿Un rango de tiempo nuevo choca con alguno ya ocupado? (para avisar antes de pedir el espacio) */
export function seCruzaConAlgo(inicio, fin, eventosOcupados) {
  return eventosOcupados.filter((ev) => inicio < ev.fin && fin > ev.inicio);
}

/** Tabla de posiciones del espacio: cada miembro con sus puntos, ordenados de mayor a menor. */
export function tablaPosiciones(miembros, perfiles) {
  return miembros
    .map((m) => ({ ...m, nombre: nombreDeMiembro(m, perfiles), puntos: perfiles.find((p) => p.id === m.user_id)?.puntos || 0 }))
    .sort((a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre));
}

export function ordenarSolicitudes(lista) {
  const peso = { pendiente: 0, aceptada: 1, rechazada: 2 };
  return [...lista].sort((a, b) => peso[a.estado] - peso[b.estado] || new Date(b.created_at) - new Date(a.created_at));
}

/** Texto corto de para quién es una solicitud de horario. */
export function destinatarioTexto(solicitud, miembros, perfiles) {
  if (!solicitud.para_user_id) return 'Para todo el espacio';
  return `Para ${nombreDeMiembro(miembros.find((m) => m.user_id === solicitud.para_user_id) || {}, perfiles)}`;
}

// --- Agenda semanal del grupo: para saber si alguien ya tiene algo a esa hora ---

/** Día de la semana (1 = lunes … 7 = domingo), igual convención que materias/bloques. */
export const diaSemanaDe = (fecha) => (((new Date(fecha)).getDay() + 6) % 7) + 1;
export const minutosDelDia = (fecha) => { const f = new Date(fecha); return f.getHours() * 60 + f.getMinutes(); };

/**
 * ¿El rango [inicio, fin) choca con alguna materia o bloque semanal (de una o varias
 * personas)? Las tareas NUNCA cuentan como ocupado: una entrega no impide agendar algo
 * a esa hora. Si `inicio`/`fin` cruzan la medianoche, se revisa solo el día de `inicio`.
 */
export function chocaConHorarioSemanal(inicio, fin, { materias = [], bloques = [] }) {
  const dia = diaSemanaDe(inicio);
  const mIni = minutosDelDia(inicio);
  const mFin = Math.max(mIni + 1, minutosDelDia(fin) || mIni + 60);
  const ocupados = [
    ...materias.map((m) => ({ ...m, tipo: 'clase', titulo: m.nombre })),
    ...bloques.map((b) => ({ ...b, titulo: b.title })),
  ].filter((x) => x.day_of_week === dia && x.start_minutes < mFin && x.end_minutes > mIni);
  return ocupados;
}

/** Junta la agenda semanal (materias+bloques) de varias personas en una sola lista. */
export function combinarHorariosSemanaleS(porMiembro) {
  return { materias: porMiembro.flatMap((m) => m.materias || []), bloques: porMiembro.flatMap((m) => m.bloques || []) };
}

// --- Horario compartido del grupo -----------------------------------------------------------

export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Resume mi semana (materias + compromisos) en bloques simples para publicarlos en el espacio. */
/**
 * Qué comparte cada quien. El filtro se aplica ANTES de subir nada: lo que no entra en el
 * alcance elegido no sale del dispositivo, así que no depende de que la otra persona "no mire".
 */
export const ALCANCES = [
  {
    id: 'citas', titulo: 'Solo citas', nota: 'nadie ve tu semana',
    detalle: 'No se comparte ningún bloque. Los demás solo pueden proponerte una reunión y tú decides si la aceptas.',
    tipos: [],
  },
  {
    id: 'tareas', titulo: 'Solo entregas', nota: 'fechas de tus tareas',
    detalle: 'Se comparten las fechas de tus entregas para que el grupo sepa cuándo estás contra el tiempo. Tus clases y turnos no se ven.',
    tipos: ['tarea'],
  },
  {
    id: 'reuniones', titulo: 'Solo reuniones', nota: 'reuniones y eventos',
    detalle: 'Se comparten tus reuniones y eventos, que es lo que suele chocar al cuadrar con otros. Lo demás queda privado.',
    tipos: ['reunion'],
  },
  {
    id: 'todo', titulo: 'Toda la semana', nota: 'clases, turnos y todo lo demás',
    detalle: 'Se comparte tu semana completa: clases, turnos de trabajo, reuniones y entregas. Es lo que mejor sirve para encontrar huecos libres.',
    tipos: ['clase', 'trabajo', 'reunion', 'otro', 'tarea'],
  },
];

export const ALCANCE_POR_DEFECTO = 'todo';
export const alcanceDe = (id) => ALCANCES.find((a) => a.id === id) || ALCANCES[ALCANCES.length - 1];

/**
 * Resume mi semana para publicarla en el grupo, ya filtrada por el alcance elegido.
 * Las entregas se colocan en el día de la semana en que vencen, con media hora de ancho.
 */
export function resumirMiSemana({ materias = [], bloques = [], tareas = [] }, alcance = ALCANCE_POR_DEFECTO) {
  const permitidos = new Set(alcanceDe(alcance).tipos);
  if (permitidos.size === 0) return [];

  const deMateria = materias.map((m) => ({
    dia: m.day_of_week, inicio: m.start_minutes, fin: m.end_minutes,
    titulo: m.nombre, tipo: 'clase', lugar: m.es_virtual ? 'Virtual' : (m.salon || ''),
  }));
  const deBloque = bloques.map((b) => ({
    dia: b.day_of_week, inicio: b.start_minutes, fin: b.end_minutes,
    titulo: b.title, tipo: b.type === 'reunion' ? 'reunion' : b.type === 'trabajo' ? 'trabajo' : 'otro', lugar: b.location || '',
  }));
  const deTarea = tareas
    .filter((t) => t.status !== 'hecha' && t.due_date)
    .map((t) => {
      const f = new Date(t.due_date);
      const min = f.getHours() * 60 + f.getMinutes();
      return { dia: ((f.getDay() + 6) % 7) + 1, inicio: min, fin: Math.min(24 * 60, min + 30), titulo: t.title, tipo: 'tarea', lugar: '' };
    });

  return [...deMateria, ...deBloque, ...deTarea]
    .filter((x) => permitidos.has(x.tipo))
    .filter((x) => x.dia >= 1 && x.dia <= 7 && x.fin > x.inicio && x.titulo)
    .sort((a, b) => a.dia - b.dia || a.inicio - b.inicio);
}

/** Minutos del día → "7:30 a. m." corto ("7:30"). */
export const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/**
 * Junta los horarios publicados y las reuniones aceptadas en una sola semana, donde CADA
 * bloque sabe de quién es (nombre, iniciales y color). Devuelve 7 días con sus bloques.
 */
export function semanaDelGrupo({ horarios = [], reuniones = [], miembros = [], perfiles = [] }) {
  const dueno = (userId) => {
    const m = miembros.find((x) => x.user_id === userId);
    const nombre = nombreDeMiembro(m || {}, perfiles);
    return { personaId: userId, persona: nombre, iniciales: iniciales(nombre), color: m?.color || '#9A9890' };
  };
  const dias = Array.from({ length: 7 }, () => []);
  horarios.forEach((h) => {
    const d = dueno(h.user_id);
    (h.bloques || []).forEach((b, i) => {
      if (!(b.dia >= 1 && b.dia <= 7)) return;
      dias[b.dia - 1].push({ ...b, ...d, id: `${h.user_id}:${i}`, esReunion: false });
    });
  });
  reuniones.forEach((r) => {
    const inicio = new Date(r.inicio);
    const fin = new Date(r.fin);
    const d = dueno(r.de_user_id);
    const dia = diaSemanaDe(inicio);
    dias[dia - 1].push({
      id: `r:${r.id}`, dia, inicio: minutosDelDia(inicio), fin: Math.max(minutosDelDia(inicio) + 15, minutosDelDia(fin)),
      titulo: r.titulo, tipo: 'reunion', lugar: r.lugar || '', esReunion: true,
      con: r.para_user_id ? [dueno(r.para_user_id)] : miembros.filter((m) => m.user_id !== r.de_user_id).map((m) => dueno(m.user_id)),
      ...d,
    });
  });
  return dias.map((lista) => lista.sort((a, b) => a.inicio - b.inicio || a.persona.localeCompare(b.persona)));
}

/** Iniciales de un nombre: "Kenny Bello" → "KB". */
export function iniciales(nombre) {
  const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '··';
  return (partes[0][0] + (partes[1]?.[0] || '')).toUpperCase();
}

/** Franjas en las que TODO el grupo está libre un día (para proponer una reunión). */
export function huecosDelGrupo(bloquesDelDia, { desde = 7 * 60, hasta = 22 * 60, minimo = 45 } = {}) {
  const ocupado = [...bloquesDelDia].sort((a, b) => a.inicio - b.inicio);
  const huecos = [];
  let cursor = desde;
  ocupado.forEach((b) => {
    if (b.inicio - cursor >= minimo) huecos.push({ inicio: cursor, fin: b.inicio });
    cursor = Math.max(cursor, b.fin);
  });
  if (hasta - cursor >= minimo) huecos.push({ inicio: cursor, fin: hasta });
  return huecos;
}
