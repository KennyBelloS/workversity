// Revisión semanal: qué se logró, qué quedó vencido (y cómo reprogramarlo) y qué viene.
import { fechaLocalISO } from './dateUtils';
import { inicioDeSemana, sumarDias } from './agenda';

export const CLAVE_REVISION = 'workversity:revision-semana';
export const claveSemana = (ahora = new Date()) => fechaLocalISO(inicioDeSemana(ahora));

/** Viernes, sábado y domingo se sugiere hacerla, si todavía no se hizo esta semana. */
export function debeSugerirRevision(ahora = new Date(), ultima = null) {
  const d = ahora.getDay();
  return (d === 5 || d === 6 || d === 0) && ultima !== claveSemana(ahora);
}

export const OPCIONES_REPROGRAMAR = [
  { clave: 'manana', dias: 1, etiqueta: 'Mañana' },
  { clave: 'tres', dias: 3, etiqueta: '3 días' },
  { clave: 'semana', dias: 7, etiqueta: '1 semana' },
];

/** Nueva fecha de entrega: dentro de `dias` días, a la misma hora que tenía. */
export function reprogramar(tarea, dias, ahora = new Date()) {
  const original = new Date(tarea.due_date);
  const d = new Date(ahora);
  d.setHours(original.getHours(), original.getMinutes(), 0, 0);
  d.setDate(d.getDate() + dias);
  if (d <= ahora) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

export function datosRevision({ ahora = new Date(), tareas = [] }) {
  const pendientes = tareas.filter((t) => t.status !== 'hecha');
  const porFecha = (a, b) => new Date(a.due_date) - new Date(b.due_date);
  const vencidas = pendientes.filter((t) => new Date(t.due_date) < ahora).sort(porFecha);
  const limite = sumarDias(ahora, 7);
  const proximas = pendientes.filter((t) => { const d = new Date(t.due_date); return d >= ahora && d < limite; }).sort(porFecha);
  return { vencidas, proximas };
}

export function leerUltimaRevision() {
  try { return localStorage.getItem(CLAVE_REVISION); } catch { return null; }
}
export function guardarRevisionHecha(ahora = new Date()) {
  try {
    localStorage.setItem(CLAVE_REVISION, claveSemana(ahora));
    localStorage.setItem('workversity:revisiones', String(Number(localStorage.getItem('workversity:revisiones') || 0) + 1));
  } catch { /* nada */ }
}
export function totalRevisiones() {
  try { return Number(localStorage.getItem('workversity:revisiones') || 0); } catch { return 0; }
}
