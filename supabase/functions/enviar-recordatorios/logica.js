// ---------------------------------------------------------------------------
// Lógica PURA de recordatorios (sin red ni dependencias): decide qué
// notificaciones toca enviar en este momento. La usa la Edge Function y se
// puede probar con Node.
// ---------------------------------------------------------------------------

const MIN = 60000;

// --- Zonas horarias -----------------------------------------------------------
export function partesEnZona(fecha, tz) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short',
  });
  const p = Object.fromEntries(f.formatToParts(fecha).map((x) => [x.type, x.value]));
  const dias = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, min: +p.minute, dow: dias[p.weekday], ymd: `${p.year}-${p.month}-${p.day}` };
}

function desfase(fecha, tz) {
  const p = partesEnZona(fecha, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min) - Math.floor(fecha.getTime() / MIN) * MIN;
}

/** Instante UTC que corresponde a "año-mes-día + minutos" en la zona horaria del usuario. */
export function instanteLocal(y, m, d, minutos, tz) {
  const base = Date.UTC(y, m - 1, d, 0, minutos);
  let t = base - desfase(new Date(base), tz);
  t = base - desfase(new Date(t), tz);
  return new Date(t);
}

// --- Textos creativos -----------------------------------------------------------
function hash(texto) {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h;
}
const elegir = (opciones, clave) => opciones[hash(clave) % opciones.length];

export function faltan(min) {
  if (min < 1) return 'menos de 1 min';
  if (min < 60) return `${min} min`;
  if (min >= 1440) return `${Math.round(min / 1440)} día${min >= 2880 ? 's' : ''}`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}

const horaLocal = (fecha, tz) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(fecha);

const FRASES_TAREA = {
  alta: ['Es prioridad alta: respira, enfócate y dale 💪', 'De las importantes. Un último empujón 🚀', 'Cierra lo demás un momento y termínala 🎯'],
  media: ['Buen momento para revisar que todo esté listo ✅', 'Ya casi. Repasa y envíala con calma 😌', 'Un vistazo final y a entregar 📬'],
  baja: ['Sin estrés: aún hay tiempo, pero no la olvides 🌿', 'Tranqui, solo una alarma amistosa 🙂'],
};
const EMOJI_TAREA = { alta: '🔥', media: '⏰', baja: '🌿' };

// --- Etapas: si varios avisos ya "tocan", solo se envía el más urgente ---------
function etapaActual(ahora, instante, leads) {
  const vigentes = leads.filter((L) => ahora.getTime() >= instante.getTime() - L * MIN && ahora < instante);
  if (vigentes.length === 0) return null;
  const actual = Math.min(...vigentes);
  return { actual, anteriores: vigentes.filter((L) => L !== actual) };
}

/**
 * @returns {{clave:string, titulo:string, cuerpo:string, url:string, etiqueta:string, silenciosa?:boolean, importante?:boolean}[]}
 */
export function calcularNotificaciones({ ahora, perfil, tareas = [], materias = [], bloques = [], enviadas = new Set() }) {
  const tz = perfil?.zona_horaria || 'America/Bogota';
  const nombre = (perfil?.nombre || '').split(' ')[0] || 'estudiante';
  const salida = [];
  const materiaPorId = new Map(materias.map((m) => [m.id, m]));

  const agregar = (n) => {
    if (!enviadas.has(n.clave)) salida.push(n);
  };

  // Emite el aviso de la etapa actual y deja registrados (en silencio) los anteriores.
  const emitirEtapa = (prefijo, instante, leads, construir) => {
    const etapa = etapaActual(ahora, instante, leads);
    if (!etapa) return;
    const clave = (L) => `${prefijo}:${L}:${instante.getTime()}`;
    for (const L of etapa.anteriores) agregar({ clave: clave(L), silenciosa: true });
    const restante = Math.max(0, Math.round((instante.getTime() - ahora.getTime()) / MIN));
    agregar({ clave: clave(etapa.actual), ...construir(restante, clave(etapa.actual)) });
  };

  // ---- Tareas -------------------------------------------------------------------
  for (const t of tareas) {
    if (t.status === 'hecha') continue;
    const vence = new Date(t.due_date);
    const materia = t.materia_id ? materiaPorId.get(t.materia_id) : null;
    const leads = [];
    if (t.has_reminder !== false) leads.push(t.reminder_minutes_before || 60);
    if (t.priority === 'alta' && !leads.includes(10)) leads.push(10);

    emitirEtapa(`t:${t.id}`, vence, leads, (rest, clave) => ({
      titulo: `${EMOJI_TAREA[t.priority] || '⏰'} Faltan ${faltan(rest)} para «${t.title}»`,
      cuerpo: `${materia ? `📘 ${materia.nombre} · ` : ''}Vence a las ${horaLocal(vence, tz)} · ${elegir(FRASES_TAREA[t.priority] || FRASES_TAREA.media, clave)}`,
      url: '/tareas',
      etiqueta: `tarea-${t.id}`,
      importante: t.priority === 'alta' && rest <= 15,
    }));

    // Aviso de tarea vencida hace poco
    const pasado = (ahora.getTime() - vence.getTime()) / MIN;
    if (pasado >= 0 && pasado < 15) {
      agregar({
        clave: `t:${t.id}:vencida:${vence.getTime()}`,
        titulo: `⌛ Se venció «${t.title}»`,
        cuerpo: 'Si ya la entregaste, márcala como hecha ✅. Si no, aún puedes ponerte al día.',
        url: '/tareas',
        etiqueta: `tarea-${t.id}`,
      });
    }
  }

  // ---- Ocurrencias de eventos semanales (materias y bloques) -----------------------
  const ocurrencias = (item) => {
    const res = [];
    for (let off = 0; off <= 2; off++) {
      const p = partesEnZona(new Date(ahora.getTime() + off * 86400000), tz);
      if (p.dow === item.day_of_week) res.push(instanteLocal(p.y, p.m, p.d, item.start_minutes, tz));
    }
    return res;
  };

  for (const m of materias) {
    if (m.tiene_recordatorio === false) continue;
    const lead = m.recordatorio_minutos_antes || 60;
    for (const inicio of ocurrencias(m)) {
      emitirEtapa(`m:${m.id}`, inicio, [lead], (rest, clave) => ({
        titulo: m.es_virtual
          ? `💻 ${m.nombre} (virtual) empieza en ${faltan(rest)}`
          : `📚 ${m.nombre} empieza en ${faltan(rest)}`,
        cuerpo: m.es_virtual
          ? `Clase virtual a las ${horaLocal(inicio, tz)} · ${elegir(['Ten el enlace a la mano 🔗', 'Conéctate unos minutos antes 🎧', 'Revisa tu internet y tus audífonos 🎒'], clave)}`
          : `${m.salon ? `📍 ${m.salon} · ` : ''}${m.profesor ? `👩‍🏫 ${m.profesor} · ` : ''}${elegir(['Alista tus cosas y sal con tiempo 🎒', 'Que sea un gran día de clase ✨', 'Llega con tiempo y con ganas 🙌'], clave)}`,
        url: '/horario',
        etiqueta: `materia-${m.id}`,
      }));
    }
  }

  const EMOJI_BLOQUE = { reunion: '🤝', trabajo: '💼', clase: '📚', otro: '📌' };
  const ROTULO_BLOQUE = { reunion: 'Reunión', trabajo: 'Trabajo', clase: 'Clase', otro: 'Evento' };
  for (const b of bloques) {
    if (b.tiene_recordatorio === false || b.type === 'almuerzo') continue;
    const lead = b.recordatorio_minutos_antes || 60;
    for (const inicio of ocurrencias(b)) {
      emitirEtapa(`b:${b.id}`, inicio, [lead], (rest, clave) => ({
        titulo: `${EMOJI_BLOQUE[b.type] || '📌'} ${ROTULO_BLOQUE[b.type] || 'Evento'}: ${b.title} en ${faltan(rest)}`,
        cuerpo: `${b.location ? `📍 ${b.location} · ` : ''}A las ${horaLocal(inicio, tz)} · ${elegir(
          b.type === 'reunion'
            ? ['Prepara tus puntos clave 📝', 'Respira hondo, todo saldrá bien 🌟', 'Llega con la agenda clara 🎯']
            : ['Que te rinda el día 💪', 'Un buen arranque lo cambia todo ☕'],
          clave
        )}`,
        url: '/horario',
        etiqueta: `bloque-${b.id}`,
      }));
    }
  }

  // ---- Resumen diario ----------------------------------------------------------------
  if (perfil?.notif_resumen_diario !== false) {
    const [hh, mm] = String(perfil?.notif_hora_resumen || '07:30').split(':').map(Number);
    const objetivo = (hh || 0) * 60 + (mm || 0);
    const p = partesEnZona(ahora, tz);
    const minutosAhora = p.h * 60 + p.min;
    if (minutosAhora >= objetivo && minutosAhora < objetivo + 45) {
      const clases = materias.filter((m) => m.day_of_week === p.dow).length + bloques.filter((b) => b.day_of_week === p.dow && b.type === 'clase').length;
      const otros = bloques.filter((b) => b.day_of_week === p.dow && (b.type === 'reunion' || b.type === 'trabajo')).length;
      const paraHoy = tareas.filter((t) => t.status !== 'hecha' && partesEnZona(new Date(t.due_date), tz).ymd === p.ymd).length;
      const vencidas = tareas.filter((t) => t.status !== 'hecha' && new Date(t.due_date) < ahora && partesEnZona(new Date(t.due_date), tz).ymd !== p.ymd).length;

      const partes = [];
      if (clases) partes.push(`📚 ${clases} clase${clases > 1 ? 's' : ''}`);
      if (otros) partes.push(`💼 ${otros} compromiso${otros > 1 ? 's' : ''}`);
      if (paraHoy) partes.push(`📝 ${paraHoy} entrega${paraHoy > 1 ? 's' : ''} hoy`);
      if (vencidas) partes.push(`⚠️ ${vencidas} vencida${vencidas > 1 ? 's' : ''}`);

      const clave = `resumen:${p.ymd}`;
      agregar({
        clave,
        titulo: `${elegir(['☀️ Buen día', '🌤️ Arrancamos', '🚀 A por el día'], clave)}, ${nombre}`,
        cuerpo: partes.length
          ? `Hoy: ${partes.join(' · ')}. ${elegir(['Tú puedes con todo 💙', 'Paso a paso, sin prisa y sin pausa ✨'], clave)}`
          : 'Día libre de pendientes 🎉 Aprovecha para adelantar algo o descansar.',
        url: '/',
        etiqueta: 'resumen-diario',
      });
    }
  }

  return salida;
}
