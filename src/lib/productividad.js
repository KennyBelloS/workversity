import { fechaLocalISO } from './dateUtils';

const H = 3600000;

/** Días (YYYY-MM-DD) con al menos una tarea completada o un Pomodoro terminado. */
export function diasConActividad(tareas, sesiones) {
  const dias = new Set();
  tareas.filter((t) => t.status === 'hecha' && t.completed_at).forEach((t) => dias.add(fechaLocalISO(t.completed_at)));
  sesiones.filter((s) => s.completada).forEach((s) => dias.add(fechaLocalISO(s.hora_inicio)));
  return dias;
}

/** Racha de días seguidos con actividad. Si hoy aún no hay, cuenta desde ayer (la racha no se pierde hasta que termina el día). */
export function calcularRacha(tareas, sesiones, ahora = new Date()) {
  const dias = diasConActividad(tareas, sesiones);
  const d = new Date(ahora);
  if (!dias.has(fechaLocalISO(d))) d.setDate(d.getDate() - 1);
  let racha = 0;
  while (dias.has(fechaLocalISO(d))) {
    racha++;
    d.setDate(d.getDate() - 1);
  }
  return racha;
}

const PESO_PRIORIDAD = { alta: 3, media: 2, baja: 1 };

/** Qué hacer primero: mezcla urgencia + prioridad (+ energía del día). */
export function puntuarTarea(t, { ahora = new Date(), energia = null } = {}) {
  const falta = new Date(t.due_date) - ahora;
  const razones = [];
  let score = PESO_PRIORIDAD[t.priority] * 10;
  if (t.priority === 'alta') razones.push('Prioridad alta');
  if (falta < 0) { score += 60; razones.push('Ya venció'); }
  else if (falta < 6 * H) { score += 45; razones.push('Vence en pocas horas'); }
  else if (falta < 24 * H) { score += 32; razones.push('Vence hoy o mañana'); }
  else if (falta < 48 * H) { score += 22; razones.push('Vence en 2 días'); }
  else if (falta < 7 * 24 * H) score += 10;
  if (t.status === 'enProgreso') { score += 8; razones.push('Ya la empezaste'); }
  const est = t.estimated_minutes || 0;
  if (energia != null && energia <= 2 && est && est <= 30) { score += 12; razones.push('Corta: buena para un día de poca energía'); }
  if (energia != null && energia >= 4 && est >= 60) { score += 8; razones.push('Tienes energía para una tarea larga'); }
  return { score, razones };
}

export function recomendarAhora(tareas, { ahora = new Date(), energia = null, n = 3 } = {}) {
  return tareas
    .filter((t) => t.status !== 'hecha' && !tareas.some((x) => x.parent_task_id === t.id && x.status !== 'hecha'))
    .map((t) => ({ tarea: t, ...puntuarTarea(t, { ahora, energia }) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/** Matriz de Eisenhower: urgente = vence en <48 h (o ya venció); importante = prioridad alta (o media y larga). */
export function clasificarEisenhower(tareas, ahora = new Date()) {
  const q = { hacerYa: [], planificar: [], rapidas: [], despues: [] };
  for (const t of tareas.filter((x) => x.status !== 'hecha')) {
    const urgente = new Date(t.due_date) - ahora < 48 * H;
    const importante = t.priority === 'alta' || (t.priority === 'media' && (t.estimated_minutes || 0) >= 90);
    if (urgente && importante) q.hacerYa.push(t);
    else if (importante) q.planificar.push(t);
    else if (urgente) q.rapidas.push(t);
    else q.despues.push(t);
  }
  return q;
}
