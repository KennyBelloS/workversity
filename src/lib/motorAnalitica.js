// Motor de analítica y asistente de productividad.
//
// Implementa las reglas de negocio como funciones puras y deterministas
// (no depende de ningún servicio de IA externo — corre al instante,
// gratis, en el navegador de cada usuario).

const MINUTOS_QUICK_WIN = 20; // tareas "mecánicas" cortas, se mantienen incluso con poca energía
const UMBRAL_MICROTAREA_MIN = 90; // a partir de esto, se sugiere dividir en sub-tareas
const DURACION_SUBPASO_MIN = 25;
const HORAS_TRABAJO_CONTINUO_ANTES_DE_PAUSA = 2;

function claveFecha(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Regla 1-3: predicción de carga de los próximos 14 días + alertas de
// sobrecarga cuando se supera la capacidad diaria configurada.
// ---------------------------------------------------------------------------
export function predecirCarga(tareas, capacidadMaximaHoras = 8, dias = 14) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const porDia = new Map();
  for (let i = 0; i < dias; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() + i);
    porDia.set(claveFecha(d), { fecha: d, minutos: 0, tareas: [] });
  }

  for (const t of tareas) {
    if (t.status === 'hecha' || t.parent_task_id) continue; // las sub-tareas no duplican la carga del padre
    const clave = claveFecha(t.due_date);
    if (!porDia.has(clave)) continue;
    const entrada = porDia.get(clave);
    entrada.minutos += t.estimated_minutes || 45; // si no estimó, se asume una tarea mediana
    entrada.tareas.push(t);
  }

  return Array.from(porDia.values()).map((e) => ({
    ...e,
    horas: Math.round((e.minutos / 60) * 10) / 10,
    sobrecargado: e.minutos / 60 > capacidadMaximaHoras,
  }));
}

export function generarAlertasSobrecarga(prediccion, capacidadMaximaHoras = 8) {
  return prediccion
    .filter((d) => d.sobrecargado)
    .map((d) => {
      const exceso = Math.round((d.horas - capacidadMaximaHoras) * 10) / 10;
      const candidatas = [...d.tareas].sort((a, b) => {
        const orden = { baja: 0, media: 1, alta: 2 };
        return orden[a.priority] - orden[b.priority];
      });
      const sugerida = candidatas[0];
      return {
        fecha: d.fecha,
        horas: d.horas,
        exceso,
        mensaje: `${d.fecha.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}: tienes ${d.horas}h estimadas, ${exceso}h por encima de tu límite de ${capacidadMaximaHoras}h.`,
        sugerencia: sugerida
          ? `Reprograma "${sugerida.title}" (prioridad ${sugerida.priority}) a un día con menos carga.`
          : 'Revisa qué tareas de este día pueden moverse.',
        tareaSugerida: sugerida || null,
      };
    });
}

// ---------------------------------------------------------------------------
// Regla 4: patrones de concentración — a qué hora del día se completan más
// pomodoros, para sugerir ubicar ahí las tareas más complejas.
// ---------------------------------------------------------------------------
export function detectarPatronesConcentracion(sesiones) {
  const porHora = Array.from({ length: 24 }, (_, h) => ({ hora: h, completadas: 0, total: 0 }));
  for (const s of sesiones) {
    const h = new Date(s.hora_inicio).getHours();
    porHora[h].total += 1;
    if (s.completada) porHora[h].completadas += 1;
  }
  const conDatos = porHora.filter((p) => p.total >= 2);
  const mejorFranja = [...conDatos].sort((a, b) => b.completadas / b.total - a.completadas / a.total)[0];
  return { porHora, mejorFranja: mejorFranja || null };
}

// ---------------------------------------------------------------------------
// Micro-tasking: dividir una tarea compleja en sub-pasos de ~25-30 min.
// ---------------------------------------------------------------------------
export function necesitaMicroTareas(tarea) {
  return !tarea.parent_task_id && (tarea.estimated_minutes || 0) >= UMBRAL_MICROTAREA_MIN;
}

export function sugerirSubTareas(tarea) {
  const total = tarea.estimated_minutes || UMBRAL_MICROTAREA_MIN;
  const nPasos = Math.max(2, Math.round(total / DURACION_SUBPASO_MIN));
  const plantillas = [
    'Investigar y armar el esquema',
    'Redactar / avanzar la primera mitad',
    'Redactar / avanzar la segunda mitad',
    'Revisar y ajustar detalles',
    'Pulir y dejar lista para entregar',
  ];
  return Array.from({ length: nPasos }, (_, i) => ({
    title: `${tarea.title} — Parte ${i + 1}/${nPasos}: ${plantillas[Math.min(i, plantillas.length - 1)]}`,
    estimated_minutes: DURACION_SUBPASO_MIN,
  }));
}

// ---------------------------------------------------------------------------
// Pomodoro adaptativo: duración según el tipo de tarea.
// ---------------------------------------------------------------------------
export function duracionPomodoroSugerida(tipo) {
  return tipo === 'profunda' ? 50 : 25;
}

// ---------------------------------------------------------------------------
// Pausa antiestrés obligatoria tras 2h continuas de trabajo.
// ---------------------------------------------------------------------------
export function necesitaPausaAntiestres(minutosContinuosHoy) {
  return minutosContinuosHoy >= HORAS_TRABAJO_CONTINUO_ANTES_DE_PAUSA * 60;
}

// ---------------------------------------------------------------------------
// Reorganización activa del día cuando la energía reportada es baja (1-2).
// Devuelve los ids de tareas de hoy que conviene mover a mañana: todo lo que
// no sea prioridad alta y no sea un "quick win" (tarea corta y mecánica).
// ---------------------------------------------------------------------------
export function tareasAReprogramarPorBajaEnergia(tareasDeHoy) {
  return tareasDeHoy.filter((t) => {
    const esQuickWin = (t.estimated_minutes || 0) <= MINUTOS_QUICK_WIN;
    return t.status !== 'hecha' && t.priority !== 'alta' && !esQuickWin;
  });
}

// ---------------------------------------------------------------------------
// "Clear Horizon" — presión de la semana: % de tareas de esta semana que ya
// están resueltas (completadas o reprogramadas fuera de la semana).
// ---------------------------------------------------------------------------
export function calcularDespejeSemanal(tareas) {
  const hoy = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  lunes.setHours(0, 0, 0, 0);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 7);

  const deEstaSemana = tareas.filter((t) => !t.parent_task_id && new Date(t.due_date) >= lunes && new Date(t.due_date) < domingo);
  if (deEstaSemana.length === 0) return 100;
  const resueltas = deEstaSemana.filter((t) => t.status === 'hecha').length;
  return Math.round((resueltas / deEstaSemana.length) * 100);
}

// ---------------------------------------------------------------------------
// Mensajes: tono motivador, analítico, directo, con una acción concreta.
// ---------------------------------------------------------------------------
export function mensajeDeEstado({ sobrecargados, despeje, mejorFranja }) {
  if (sobrecargados.length > 0) {
    return `Tienes ${sobrecargados.length} día(s) sobrecargado(s) en los próximos 14. Reprograma ahora, antes de que se acumule.`;
  }
  if (despeje >= 80) {
    return `Vas muy bien: ${despeje}% de la semana resuelto. Aprovecha el margen para adelantar algo de la próxima semana.`;
  }
  if (mejorFranja) {
    return `Tu mejor franja de concentración es entre las ${mejorFranja.hora}:00 y las ${mejorFranja.hora + 1}:00. Agenda ahí tu tarea más compleja de hoy.`;
  }
  return 'Sin sobrecargas detectadas por ahora. Sigue registrando tus Pomodoros para afinar tus predicciones.';
}
