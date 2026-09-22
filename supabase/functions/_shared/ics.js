// Genera archivos de calendario (.ics) compatibles con Google Calendar, iPhone/Mac, Outlook…
// Sin dependencias: lo usa la app (descarga) y la Edge Function "calendario" (suscripción).

const CRLF = '\r\n';
const esc = (s = '') => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

function plegar(linea) {
  const enc = new TextEncoder();
  if (enc.encode(linea).length <= 75) return linea;
  const partes = [];
  let actual = '';
  let bytes = 0;
  for (const ch of linea) {
    const b = enc.encode(ch).length;
    if (bytes + b > (partes.length ? 74 : 75)) {
      partes.push(actual);
      actual = '';
      bytes = 0;
    }
    actual += ch;
    bytes += b;
  }
  partes.push(actual);
  return partes.join(CRLF + ' ');
}

const dos = (n) => String(n).padStart(2, '0');
export const fechaUtc = (d) => {
  const x = new Date(d);
  return `${x.getUTCFullYear()}${dos(x.getUTCMonth() + 1)}${dos(x.getUTCDate())}T${dos(x.getUTCHours())}${dos(x.getUTCMinutes())}${dos(x.getUTCSeconds())}Z`;
};

function fechaLocalEnZona(fecha, tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(fecha).map((x) => [x.type, x.value])
  );
  return { y: +p.year, m: +p.month, d: +p.day };
}

/** Primera fecha (YYYYMMDD) desde hoy cuyo día de la semana (1=lunes…7=domingo) coincide. */
function primerDia(dow, ahora, tz) {
  const p = fechaLocalEnZona(ahora, tz);
  for (let off = 0; off < 8; off++) {
    const f = new Date(Date.UTC(p.y, p.m - 1, p.d + off));
    if (((f.getUTCDay() + 6) % 7) + 1 === dow) return `${f.getUTCFullYear()}${dos(f.getUTCMonth() + 1)}${dos(f.getUTCDate())}`;
  }
  return null;
}
const horaLocal = (min) => `T${dos(Math.floor(min / 60))}${dos(min % 60)}00`;

function offsetMin(fecha, tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(fecha).map((x) => [x.type, x.value])
  );
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - Math.floor(fecha.getTime() / 60000) * 60000) / 60000);
}

// Definición de la zona horaria dentro del archivo (Outlook y algunos importadores la exigen).
// Solo para zonas SIN horario de verano; en las demás se confía en el nombre de la zona (America/…).
function vtimezone(tz, ahora) {
  const y = ahora.getUTCFullYear();
  const a = offsetMin(new Date(Date.UTC(y, 0, 1)), tz);
  const b = offsetMin(new Date(Date.UTC(y, 6, 1)), tz);
  if (a !== b) return [];
  const o = `${a < 0 ? '-' : '+'}${dos(Math.floor(Math.abs(a) / 60))}${dos(Math.abs(a) % 60)}`;
  return ['BEGIN:VTIMEZONE', `TZID:${tz}`, 'BEGIN:STANDARD', 'DTSTART:19700101T000000', `TZOFFSETFROM:${o}`, `TZOFFSETTO:${o}`, `TZNAME:GMT${o.slice(0, 3)}`, 'END:STANDARD', 'END:VTIMEZONE'];
}

function alarma(descripcion, minutos) {
  return ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(descripcion)}`, `TRIGGER:-PT${Math.max(0, minutos)}M`, 'END:VALARM'];
}

/**
 * @param {object} o
 * @param {Date} o.ahora  @param {string} o.zona  @param {number} [o.semanas]
 * @param {object[]} o.materias @param {object[]} o.bloques @param {object[]} o.tareas (solo pendientes)
 */
export function generarICS({ ahora = new Date(), zona = 'America/Bogota', semanas = 16, materias = [], bloques = [], tareas = [], nombre = 'Workversity' }) {
  const L = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Workversity//Agenda//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(nombre)}`, `X-WR-TIMEZONE:${zona}`, 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H',
    ...vtimezone(zona, ahora),
  ];
  const sello = fechaUtc(ahora);
  const materiaPorId = new Map(materias.map((m) => [m.id, m]));

  const semanal = (uid, { titulo, dow, inicio, fin, lugar, descripcion, enlace, categoria, alarmaMin }) => {
    const dia = primerDia(dow, ahora, zona);
    if (!dia) return;
    L.push('BEGIN:VEVENT', `UID:${uid}@workversity.app`, `DTSTAMP:${sello}`,
      `DTSTART;TZID=${zona}:${dia}${horaLocal(inicio)}`, `DTEND;TZID=${zona}:${dia}${horaLocal(fin)}`,
      `RRULE:FREQ=WEEKLY;COUNT=${semanas}`, `SUMMARY:${esc(titulo)}`);
    if (lugar) L.push(`LOCATION:${esc(lugar)}`);
    if (descripcion) L.push(`DESCRIPTION:${esc(descripcion)}`);
    if (enlace) L.push(`URL:${enlace}`);
    L.push(`CATEGORIES:${esc(categoria)}`);
    if (alarmaMin != null) L.push(...alarma(`${titulo} empieza pronto`, alarmaMin));
    L.push('END:VEVENT');
  };

  for (const m of materias) {
    semanal(`materia-${m.id}`, {
      titulo: `📚 ${m.nombre}${m.es_virtual ? ' (virtual)' : ''}`, dow: m.day_of_week, inicio: m.start_minutes, fin: m.end_minutes,
      lugar: m.es_virtual ? 'Virtual' : m.salon, enlace: m.es_virtual ? m.enlace_virtual : '', categoria: 'Clase',
      descripcion: [m.profesor && `Profesor: ${m.profesor}`, m.nrc && `NRC: ${m.nrc}`, m.es_virtual && m.enlace_virtual && `Enlace: ${m.enlace_virtual}`].filter(Boolean).join('\n'),
      alarmaMin: m.tiene_recordatorio === false ? null : m.recordatorio_minutos_antes || 60,
    });
  }
  const EMOJI = { reunion: '🤝', trabajo: '💼', clase: '📚', almuerzo: '🍽️', otro: '📌' };
  const ROTULO = { reunion: 'Reunión', trabajo: 'Trabajo', clase: 'Clase', almuerzo: 'Almuerzo', otro: 'Evento' };
  for (const b of bloques) {
    semanal(`bloque-${b.id}`, {
      titulo: `${EMOJI[b.type] || '📌'} ${b.title}`, dow: b.day_of_week, inicio: b.start_minutes, fin: b.end_minutes,
      lugar: b.location, categoria: ROTULO[b.type] || 'Evento',
      alarmaMin: b.tiene_recordatorio === false || b.type === 'almuerzo' ? null : b.recordatorio_minutos_antes || 60,
    });
  }

  for (const t of tareas) {
    const due = new Date(t.due_date);
    const mat = t.materia_id ? materiaPorId.get(t.materia_id) : null;
    L.push('BEGIN:VEVENT', `UID:tarea-${t.id}@workversity.app`, `DTSTAMP:${sello}`, `DTSTART:${fechaUtc(due)}`,
      `DTEND:${fechaUtc(new Date(due.getTime() + 30 * 60000))}`, `SUMMARY:${esc(`📝 ${t.title}`)}`);
    const desc = [mat && `Materia: ${mat.nombre}`, `Prioridad: ${t.priority}`, t.description].filter(Boolean).join('\n');
    if (desc) L.push(`DESCRIPTION:${esc(desc)}`);
    L.push('CATEGORIES:Tarea');
    if (t.has_reminder !== false) L.push(...alarma(`Entrega pronto: ${t.title}`, t.reminder_minutes_before || 60));
    L.push('END:VEVENT');
  }

  L.push('END:VCALENDAR');
  return L.map(plegar).join(CRLF) + CRLF;
}

/** Enlace para agregar UN evento a Google Calendar (opcionalmente semanal). */
export function enlaceGoogle({ titulo, inicio, fin, detalle = '', lugar = '', semanas = 0 }) {
  const p = new URLSearchParams({ action: 'TEMPLATE', text: titulo, dates: `${fechaUtc(inicio)}/${fechaUtc(fin)}`, details: detalle, location: lugar });
  if (semanas) p.set('recur', `RRULE:FREQ=WEEKLY;COUNT=${semanas}`);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
