// Dificultad de las tareas y tiempos que la app va aprendiendo de ti.

export const DIFICULTADES = {
  facil: { clave: 'facil', label: 'Fácil', emoji: '🟢', color: '#17C964', base: 30 },
  media: { clave: 'media', label: 'Media', emoji: '🟡', color: '#F5A524', base: 60 },
  dificil: { clave: 'dificil', label: 'Difícil', emoji: '🔴', color: '#E5484D', base: 120 },
};
export const normalizarDificultad = (d) => (d in DIFICULTADES ? d : 'media');

const redondear5 = (n) => Math.max(5, Math.round(n / 5) * 5);
const acotar = (v, min, max) => Math.min(max, Math.max(min, v));

/** Minutos realmente invertidos en una tarea: lo que se midió en el espacio de trabajo y en sesiones Pomodoro (sin duplicar). */
export function tiempoRealDeTarea(tarea, sesiones = []) {
  const propio = Number(tarea.tiempo_real_minutos) || 0;
  const deSesiones = sesiones.filter((s) => s.tarea_id === tarea.id && s.completada).reduce((a, s) => a + Number(s.duracion_minutos || 0), 0);
  return Math.max(propio, deSesiones);
}

/** Tareas terminadas con tiempo medido: de ahí aprende la app. */
export function muestrasDeTiempo(tareas, sesiones = [], ahora = new Date()) {
  return tareas
    .filter((t) => t.status === 'hecha')
    .map((t) => ({ id: t.id, dificultad: normalizarDificultad(t.dificultad), categoria: t.category, materia_id: t.materia_id || null, minutos: tiempoRealDeTarea(t, sesiones), estimado: Number(t.estimated_minutes) || 0, fecha: t.completed_at || t.due_date }))
    .filter((m) => m.minutos >= 5)
    .map((m) => ({ ...m, peso: Math.pow(0.5, Math.max(0, (ahora - new Date(m.fecha)) / 86400000) / 60) })); // lo reciente pesa más (vida media: 60 días)
}

function mediaPonderada(items) {
  const w = items.reduce((s, x) => s + x.w, 0);
  return w > 0 ? items.reduce((s, x) => s + x.v * x.w, 0) / w : null;
}

/**
 * Tiempo estimado para una tarea nueva. Empieza con una base por dificultad (30 / 60 / 120 min)
 * y se acerca a lo que de verdad tardas a medida que terminas tareas.
 */
export function predecirMinutos({ dificultad = 'media', categoria, materia_id, tareas = [], sesiones = [], ahora = new Date(), excluirId = null }) {
  const d = normalizarDificultad(dificultad);
  const base = DIFICULTADES[d].base;
  const todas = muestrasDeTiempo(tareas.filter((t) => t.id !== excluirId), sesiones, ahora).filter((m) => m.dificultad === d);
  const aItem = (m) => ({ v: acotar(m.minutos, base * 0.25, base * 4), w: m.peso });
  const global = mediaPonderada(todas.map(aItem));
  const afines = todas.filter((m) => (materia_id ? m.materia_id === materia_id : m.categoria === categoria));
  let aprendido = global;
  if (afines.length >= 2) {
    const a = mediaPonderada(afines.map(aItem));
    aprendido = global == null ? a : global * 0.4 + a * 0.6; // lo de la misma materia pesa más
  }
  const n = todas.length;
  const confianza = n / (n + 2);
  const minutos = aprendido == null ? base : base * (1 - confianza) + aprendido * confianza;
  return { minutos: redondear5(minutos), base, aprendido: aprendido == null ? null : Math.round(aprendido), muestras: n, confianza: Number(confianza.toFixed(2)), origen: n > 0 ? 'aprendido' : 'base' };
}

export function tablaAprendizaje(tareas, sesiones = [], ahora = new Date()) {
  return Object.values(DIFICULTADES).map((d) => {
    const p = predecirMinutos({ dificultad: d.clave, tareas, sesiones, ahora });
    return { ...d, aprendido: p.aprendido, muestras: p.muestras, prediccion: p.minutos };
  });
}

/** ¿Tardas más o menos de lo que estimas? ratio < 1: eres más rápido que tu estimación. */
export function precisionDeEstimaciones(tareas, sesiones = [], ahora = new Date()) {
  const m = muestrasDeTiempo(tareas, sesiones, ahora).filter((x) => x.estimado > 0);
  if (m.length < 2) return null;
  const ratio = m.reduce((s, x) => s + x.minutos / x.estimado, 0) / m.length;
  return { ratio, muestras: m.length, texto: ratio < 0.9 ? `Sueles terminar ${Math.round((1 - ratio) * 100)}% más rápido de lo que estimas.` : ratio > 1.1 ? `Sueles tardar ${Math.round((ratio - 1) * 100)}% más de lo que estimas: la app lo tendrá en cuenta.` : 'Tus estimaciones son muy acertadas. 🎯' };
}

export const formatoMinutos = (min) => {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
};
