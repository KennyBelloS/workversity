// Convierte una frase como "entregar informe de física mañana 5pm !alta" en una tarea.

const MESES = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };
const DIAS = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 };
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const PALABRAS_VACIAS = new Set(['de', 'del', 'la', 'las', 'los', 'para', 'general', 'introduccion', 'fundamentos', 'basica', 'basico', 'nivel']);

export function interpretarCaptura(texto, { materias = [], ahora = new Date() } = {}) {
  let t = ` ${texto.trim()} `;
  const quitar = (re) => { const m = t.match(re); if (m) t = t.replace(re, ' '); return m; };
  let prioridad = 'media';

  // Prioridad
  if (quitar(/\s!{2,}(?=\s)|\s!alta\b|\burgente\b/i)) prioridad = 'alta';
  else if (quitar(/\s!baja\b/i)) prioridad = 'baja';
  else quitar(/\s!media\b/i);

  // Hora
  let hora = null;
  let m;
  if ((m = quitar(/\b(?:a las |a la |para las |para la )?(\d{1,2})(?::(\d{2}))?\s*(?:de la\s+(tarde|noche|ma[ñn]ana)|(a\.?\s?m\.?|p\.?\s?m\.?))(?=[\s.,;!?]|$)/i))) {
    let h = +m[1];
    const min = +(m[2] || 0);
    const pm = /tarde|noche/i.test(m[3] || '') || /^p/i.test(m[4] || '');
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
    hora = { h, min };
  } else if ((m = quitar(/\b(?:a las |a la |para las |para la )(\d{1,2})(?::(\d{2}))?(?=[\s.,;!?]|$)/i))) {
    let h = +m[1];
    if (h >= 1 && h <= 6) h += 12; // "a las 5" → 5 p. m.
    hora = { h, min: +(m[2] || 0) };
  } else if ((m = quitar(/\b([01]?\d|2[0-3]):([0-5]\d)\b/))) {
    hora = { h: +m[1], min: +m[2] };
  }

  // Fecha
  const base = new Date(ahora);
  base.setHours(0, 0, 0, 0);
  let fecha = null;
  if (quitar(/\bpasado ma[ñn]ana\b/i)) { fecha = new Date(base); fecha.setDate(fecha.getDate() + 2); }
  else if (quitar(/\bma[ñn]ana\b/i)) { fecha = new Date(base); fecha.setDate(fecha.getDate() + 1); }
  else if (quitar(/\bhoy\b/i)) fecha = new Date(base);
  else if ((m = quitar(/\ben (\d+) d[ií]as?\b/i))) { fecha = new Date(base); fecha.setDate(fecha.getDate() + +m[1]); }
  else if ((m = quitar(/\ben (\d+) horas?\b/i))) { const d = new Date(ahora.getTime() + +m[1] * 3600000); fecha = new Date(d); fecha.setHours(0, 0, 0, 0); hora = { h: d.getHours(), min: d.getMinutes() }; }
  else if ((m = quitar(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))) {
    const anio = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : base.getFullYear();
    fecha = new Date(anio, +m[2] - 1, +m[1]);
    if (!m[3] && fecha < base) fecha.setFullYear(fecha.getFullYear() + 1);
  } else if ((m = quitar(/\b(?:el |para el )?(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/i))) {
    fecha = new Date(base.getFullYear(), MESES[m[2].toLowerCase()], +m[1]);
    if (fecha < base) fecha.setFullYear(fecha.getFullYear() + 1);
  } else if ((m = quitar(/\b(?:para el |el |este |pr[oó]ximo )?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/i))) {
    const objetivo = DIAS[norm(m[1])];
    fecha = new Date(base);
    let dif = (objetivo - base.getDay() + 7) % 7;
    if (dif === 0) dif = 7;
    fecha.setDate(fecha.getDate() + dif);
  }

  // Ensamblar fecha y hora
  let due;
  let fechaInferida = false;
  if (fecha) {
    due = new Date(fecha);
    due.setHours(hora ? hora.h : 23, hora ? hora.min : 59, 0, 0);
  } else if (hora) {
    due = new Date(base);
    due.setHours(hora.h, hora.min, 0, 0);
    if (due <= ahora) due.setDate(due.getDate() + 1);
  } else {
    due = new Date(base);
    due.setDate(due.getDate() + 1);
    due.setHours(23, 59, 0, 0);
    fechaInferida = true;
  }

  // Materia / categoría
  const limpio = norm(texto);
  let materia = null;
  for (const mat of [...materias].sort((a, b) => b.nombre.length - a.nombre.length)) {
    const nombre = norm(mat.nombre);
    const palabras = nombre.split(/\s+/).filter((w) => w.length >= 5 && !PALABRAS_VACIAS.has(w));
    if (limpio.includes(nombre) || palabras.some((w) => new RegExp(`\\b${w}\\b`).test(limpio))) { materia = mat; break; }
  }
  const categoria = materia ? 'universidad' : /\b(trabajo|oficina|cliente|jefe|reuni[oó]n|empresa)\b/i.test(texto) ? 'trabajo' : null;

  // Título
  let titulo = t.replace(/\s+/g, ' ').trim().replace(/\s(?:para|el|a|de|antes del?|hasta el?|en)$/i, '').replace(/[,;:.\-\s]+$/, '').trim();
  if (!titulo) titulo = texto.trim();
  titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);

  return { titulo, due, prioridad, materiaId: materia?.id || null, materiaNombre: materia?.nombre || null, categoria, fechaInferida, conHora: !!hora };
}
