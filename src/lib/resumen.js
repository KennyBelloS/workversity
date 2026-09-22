import { inicioDeSemana, sumarDias } from './agenda';
import { claveMesDe, fechaLocalISO } from './dateUtils';

export function rangoPeriodo(modo, offset = 0, ahora = new Date()) {
  if (modo === 'mes') {
    const inicio = new Date(ahora.getFullYear(), ahora.getMonth() + offset, 1);
    const fin = new Date(ahora.getFullYear(), ahora.getMonth() + offset + 1, 1);
    const etiqueta = inicio.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    return { modo, inicio, fin, etiqueta: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1) };
  }
  const inicio = sumarDias(inicioDeSemana(ahora), offset * 7);
  const fin = sumarDias(inicio, 7);
  const ult = sumarDias(fin, -1);
  const f = (d) => `${d.getDate()} ${d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}`;
  return { modo, inicio, fin, etiqueta: `${f(inicio)} – ${f(ult)}` };
}

const dentro = (rango, valor) => {
  const t = new Date(valor).getTime();
  return t >= rango.inicio.getTime() && t < rango.fin.getTime();
};
const fechaCompletada = (t) => t.completed_at || t.due_date; // si no hay fecha real de cierre, se usa la de entrega
const contarOcurrencias = (items, rango) => {
  let n = 0;
  for (let d = new Date(rango.inicio); d < rango.fin; d = sumarDias(d, 1)) {
    const dow = ((d.getDay() + 6) % 7) + 1;
    n += items.filter((x) => x.day_of_week === dow).length;
  }
  return n;
};

export function calcularResumen({ rango, rangoPrevio, ahora = new Date(), tareas = [], sesiones = [], movimientos = [], materias = [], bloques = [] }) {
  const hechas = tareas.filter((t) => t.status === 'hecha' && dentro(rango, fechaCompletada(t)));
  const vencidas = tareas.filter((t) => t.status !== 'hecha' && dentro(rango, t.due_date) && new Date(t.due_date) < ahora);
  const porVencer = tareas.filter((t) => t.status !== 'hecha' && dentro(rango, t.due_date) && new Date(t.due_date) >= ahora);
  const total = hechas.length + vencidas.length + porVencer.length;
  const sesionesP = sesiones.filter((s) => s.completada && dentro(rango, s.hora_inicio));
  const minutosEnfoque = sesionesP.reduce((a, s) => a + s.duracion_minutos, 0);

  const dias = [];
  for (let d = new Date(rango.inicio); d < rango.fin; d = sumarDias(d, 1)) {
    const clave = fechaLocalISO(d);
    dias.push({
      fecha: new Date(d), etiqueta: `${d.getDate()}/${d.getMonth() + 1}`,
      hechas: hechas.filter((t) => fechaLocalISO(fechaCompletada(t)) === clave).length,
      minutos: sesionesP.filter((s) => fechaLocalISO(s.hora_inicio) === clave).reduce((a, s) => a + s.duracion_minutos, 0),
    });
  }

  const delPeriodo = movimientos.filter((m) => dentro(rango, m.date));
  const suma = (tipo) => delPeriodo.filter((m) => m.type === tipo).reduce((s, m) => s + Number(m.amount), 0);
  const gastosPorCategoria = {};
  delPeriodo.filter((m) => m.type === 'gasto').forEach((m) => { gastosPorCategoria[m.category] = (gastosPorCategoria[m.category] || 0) + Number(m.amount); });

  // por materia (una materia puede tener varias filas, una por día)
  const nombres = [...new Set(materias.map((m) => m.nombre))];
  const filas = nombres.map((nombre) => {
    const ids = new Set(materias.filter((m) => m.nombre === nombre).map((m) => m.id));
    const suyas = tareas.filter((t) => t.materia_id && ids.has(t.materia_id));
    const activas = suyas.filter((t) => t.status !== 'hecha');
    const proxima = activas.filter((t) => new Date(t.due_date) >= ahora).sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
    return {
      nombre, color: materias.find((m) => m.nombre === nombre).color_value,
      activas: activas.length, completadas: hechas.filter((t) => ids.has(t.materia_id)).length,
      vencidas: activas.filter((t) => new Date(t.due_date) < ahora).length,
      progreso: suyas.length ? Math.round((suyas.filter((t) => t.status === 'hecha').length / suyas.length) * 100) : null,
      proxima,
    };
  });

  const hechasPrevio = rangoPrevio ? tareas.filter((t) => t.status === 'hecha' && dentro(rangoPrevio, fechaCompletada(t))).length : null;
  const resumen = {
    hechas: hechas.length, vencidas: vencidas.length, porVencer: porVencer.length,
    cumplimiento: total ? Math.round((hechas.length / total) * 100) : null,
    minutosEnfoque, sesiones: sesionesP.length,
    clases: contarOcurrencias([...materias, ...bloques.filter((b) => b.type === 'clase')], rango),
    compromisos: contarOcurrencias(bloques.filter((b) => b.type === 'reunion' || b.type === 'trabajo'), rango),
    ingresos: suma('ingreso'), gastos: suma('gasto'), ahorro: suma('ahorro'), gastosPorCategoria,
    dias, filas, hechasPrevio,
  };
  resumen.insights = generarInsights(resumen, rango);
  return resumen;
}

function generarInsights(r, rango) {
  const frases = [];
  const NOMBRES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const puntos = {};
  r.dias.forEach((d) => { const k = d.fecha.getDay(); puntos[k] = (puntos[k] || 0) + d.hechas * 2 + d.minutos / 25; });
  const mejor = Object.entries(puntos).sort((a, b) => b[1] - a[1])[0];
  if (mejor && mejor[1] > 0) frases.push(`📈 Tu día más productivo fue el ${NOMBRES[mejor[0]]}.`);
  if (r.hechasPrevio != null) {
    const dif = r.hechas - r.hechasPrevio;
    if (dif > 0) frases.push(`🚀 Completaste ${dif} tarea${dif > 1 ? 's' : ''} más que el ${rango.modo === 'mes' ? 'mes' : 'periodo'} anterior.`);
    else if (dif < 0) frases.push(`📉 Completaste ${-dif} tarea${dif < -1 ? 's' : ''} menos que el periodo anterior: revisa qué te frenó.`);
    else if (r.hechas > 0) frases.push('⚖️ Mantuviste el mismo ritmo que el periodo anterior.');
  }
  if (r.vencidas > 0) frases.push(`⚠️ Tienes ${r.vencidas} tarea${r.vencidas > 1 ? 's' : ''} vencida${r.vencidas > 1 ? 's' : ''} en este periodo. Reprograma o ciérralas.`);
  const carga = [...r.filas].sort((a, b) => b.activas - a.activas)[0];
  if (carga && carga.activas > 0) frases.push(`📚 ${carga.nombre} es la materia con más tareas activas (${carga.activas}).`);
  if (r.minutosEnfoque >= 60) frases.push(`⏱️ Dedicaste ${(r.minutosEnfoque / 60).toFixed(1)} h de enfoque con Pomodoro.`);
  else if (r.minutosEnfoque > 0) frases.push(`⏱️ Llevas ${r.minutosEnfoque} min de enfoque con Pomodoro: una hora en total ya es un gran logro.`);
  else frases.push('⏱️ Aún no registras enfoque con Pomodoro: 25 minutos ya cuentan.');
  if (r.ahorro > 0 && r.ingresos > 0) frases.push(`💰 Ahorraste el ${Math.round((r.ahorro / r.ingresos) * 100)}% de tus ingresos.`);
  else if (r.gastos > r.ingresos && r.gastos > 0) frases.push('💸 Tus gastos superaron tus ingresos en este periodo.');
  return frases;
}

export { claveMesDe };
