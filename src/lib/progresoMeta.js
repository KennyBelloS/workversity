// Metas de progreso: leer un libro, terminar un curso, hacer ejercicio… medidas en páginas, horas, veces, etc.
import { fechaLocalISO, aFechaLocal } from './dateUtils';

export const UNIDADES = ['páginas', 'capítulos', 'libros', 'horas', 'minutos', 'veces', 'km', 'ejercicios', 'lecciones'];
const PASO = { páginas: 10, capítulos: 1, libros: 1, horas: 1, minutos: 15, veces: 1, km: 1, ejercicios: 5, lecciones: 1 };
export const pasoRapido = (unidad) => PASO[unidad] || 1;

export const CATEGORIAS_PROGRESO_BASE = ['Lectura', 'Estudio', 'Salud y deporte', 'Hábitos', 'Proyecto personal', 'Otro'];
export const COLOR_CATEGORIA_PROGRESO = { Lectura: '#8B7FD1', Estudio: '#5B8DEF', 'Salud y deporte': '#17C964', Hábitos: '#F5A524', 'Proyecto personal': '#E5789C', Otro: '#8B93A7' };

export const PLANTILLAS_PROGRESO = [
  { emoji: '📖', titulo: 'Leer un libro', unidad: 'páginas', meta: 300, categoria: 'Lectura' },
  { emoji: '📚', titulo: 'Leer libros este año', unidad: 'libros', meta: 12, categoria: 'Lectura' },
  { emoji: '🎧', titulo: 'Terminar un curso', unidad: 'lecciones', meta: 30, categoria: 'Estudio' },
  { emoji: '⏱️', titulo: 'Horas de estudio', unidad: 'horas', meta: 50, categoria: 'Estudio' },
  { emoji: '🏃', titulo: 'Hacer ejercicio', unidad: 'veces', meta: 40, categoria: 'Salud y deporte' },
];

export const fmtNum = (n) => (Math.round(Number(n) * 10) / 10).toLocaleString('es-CO');

/** Cómo va una meta de progreso: total, ritmo, fecha estimada, lo que necesitas por día y si vas a tiempo. */
export function estadoProgreso({ meta, avances = [], ahora = new Date() }) {
  const objetivo = Number(meta.target_amount) || 0;
  const total = avances.reduce((s, a) => s + Number(a.cantidad), 0);
  const hecho = objetivo > 0 && total >= objetivo;
  const faltante = Math.max(0, objetivo - total);

  const porDia = new Map();
  for (const a of avances) { const k = fechaLocalISO(a.fecha); porDia.set(k, (porDia.get(k) || 0) + Number(a.cantidad)); }
  const hoy = fechaLocalISO(ahora);
  const ultimos = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(ahora); d.setDate(d.getDate() - (13 - i));
    const k = fechaLocalISO(d);
    return { fecha: k, cantidad: porDia.get(k) || 0 };
  });
  const ritmoReciente = ultimos.slice(7).reduce((s, x) => s + x.cantidad, 0) / 7;
  const dias = [...porDia.keys()].sort();
  const diasActivos = dias.length ? Math.max(1, Math.round((aFechaLocal(hoy) - aFechaLocal(dias[0])) / 86400000) + 1) : 0;
  const ritmoPromedio = diasActivos ? total / diasActivos : 0;
  const ritmo = ritmoReciente > 0 ? ritmoReciente : ritmoPromedio;
  const diasSinAvance = dias.length ? Math.round((aFechaLocal(hoy) - aFechaLocal(dias[dias.length - 1])) / 86400000) : null;

  let racha = 0;
  const d = new Date(ahora);
  if (!porDia.has(fechaLocalISO(d))) d.setDate(d.getDate() - 1);
  while (porDia.has(fechaLocalISO(d))) { racha++; d.setDate(d.getDate() - 1); }

  const fechaEstimada = !hecho && ritmo > 0 ? new Date(ahora.getTime() + (faltante / ritmo) * 86400000) : null;
  let diasRestantes = null;
  let necesarioPorDia = null;
  if (meta.fecha_limite) {
    const fin = aFechaLocal(meta.fecha_limite);
    fin.setHours(23, 59, 59, 999);
    diasRestantes = Math.ceil((fin - ahora) / 86400000);
    necesarioPorDia = !hecho && diasRestantes > 0 ? faltante / diasRestantes : null;
  }

  let estado;
  if (hecho) estado = 'hecho';
  else if (diasRestantes != null && diasRestantes <= 0) estado = 'vencida';
  else if (diasRestantes == null) estado = total > 0 ? 'sin-fecha' : 'sin-datos';
  else if (ritmo <= 0) estado = 'sin-datos';
  else if (ritmo >= necesarioPorDia * 1.25) estado = 'adelantado';
  else if (ritmo >= necesarioPorDia * 0.95) estado = 'a-tiempo';
  else estado = 'atrasado';

  return { total, objetivo, hecho, pct: objetivo > 0 ? Math.min(total / objetivo, 1) : 0, faltante, ritmo, ritmoReciente, ritmoPromedio, fechaEstimada, diasRestantes, necesarioPorDia, estado, racha, diasSinAvance, ultimos };
}

export const ETIQUETA_PROGRESO = {
  hecho: { texto: '¡Terminada!', color: '#17C964' },
  adelantado: { texto: 'Adelantado', color: '#17C964' },
  'a-tiempo': { texto: 'A tiempo', color: '#3E7BFA' },
  atrasado: { texto: 'Atrasado', color: '#F5A524' },
  vencida: { texto: 'Plazo vencido', color: '#E5484D' },
  'sin-fecha': { texto: 'En marcha', color: '#3E7BFA' },
  'sin-datos': { texto: 'Sin empezar', color: '#6E7180' },
};
