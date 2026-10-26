import { fmtNum } from './progresoMeta';
import { eventosDeSemana, inicioDeSemana, sumarDias, textoDuracion } from './agenda';

const H = 3600000;

/** Avisos que se ven en la campana: lo urgente y lo que viene pronto. */
export function calcularAlertas({ ahora = new Date(), tareas = [], materias = [], bloques = [], notas = [], habitos = null, presupuesto = null, sugerirRevision = false, metasProgreso = [] }) {
  const alertas = [];
  const materiaPorId = new Map(materias.map((m) => [m.id, m]));
  const pendientes = tareas.filter((t) => t.status !== 'hecha');
  const nombreMateria = (t) => (t.materia_id && materiaPorId.get(t.materia_id)?.nombre ? ` · ${materiaPorId.get(t.materia_id).nombre}` : '');

  const vencidas = pendientes.filter((t) => new Date(t.due_date) < ahora).sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
  // Se muestran TODAS las tareas vencidas, sin límite: pediste que "todas son todas".
  vencidas.forEach((t) =>
    alertas.push({ id: `v:${t.id}`, tipo: 'vencida', nivel: 'alta', orden: 0, titulo: `Vencida: ${t.title}`, detalle: `Venció hace ${textoDuracion(ahora - new Date(t.due_date))}${nombreMateria(t)}`, url: '/tareas' })
  );

  const enUnDia = pendientes
    .filter((t) => { const d = new Date(t.due_date) - ahora; return d >= 0 && d <= 24 * H; })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  enUnDia.forEach((t) => {
    const falta = new Date(t.due_date) - ahora;
    const urgente = falta <= 3 * H || t.priority === 'alta';
    alertas.push({ id: `p:${t.id}:${new Date(t.due_date).getTime()}`, tipo: 'pronto', nivel: urgente ? 'alta' : 'media', orden: urgente ? 1 : 3, titulo: `Vence en ${textoDuracion(falta)}: ${t.title}`, detalle: `Prioridad ${t.priority}${nombreMateria(t)}`, url: '/tareas' });
  });

  const inicio = inicioDeSemana(ahora);
  const eventos = [...eventosDeSemana(inicio, { materias, bloques, tareas: [] }), ...eventosDeSemana(sumarDias(inicio, 7), { materias, bloques, tareas: [] })];
  eventos
    .filter((e) => e.fin > ahora && e.inicio - ahora <= 3 * H)
    .forEach((e) => {
      const enCurso = e.inicio <= ahora;
      alertas.push({
        id: `e:${e.id}:${e.inicio.getTime()}`, tipo: 'evento', nivel: 'media', orden: 2,
        titulo: enCurso ? `Ahora: ${e.titulo}` : `${e.titulo} empieza en ${textoDuracion(e.inicio - ahora)}`,
        detalle: e.virtual ? 'Clase virtual' : e.detalle || 'Agenda', url: '/horario',
      });
    });

  if (habitos?.puntualidad.perfil === 'ultima-hora') {
    pendientes
      .filter((t) => t.status === 'pendiente' && (t.priority === 'alta' || (t.estimated_minutes || 0) >= 90) && new Date(t.due_date) - ahora > 24 * H && new Date(t.due_date) - ahora <= 72 * H)
      .slice(0, 2)
      .forEach((t) => alertas.push({ id: `h:${t.id}:${new Date(t.due_date).getTime()}`, tipo: 'habito', nivel: 'media', orden: 3, titulo: `Empieza hoy: ${t.title}`, detalle: '🧠 Sueles terminar a última hora; empezar hoy te da margen', url: '/tareas' }));
  }
  const en48 = pendientes.filter((t) => { const d = new Date(t.due_date) - ahora; return d >= 0 && d <= 48 * H; });
  if (en48.length >= 4) {
    alertas.push({ id: `c:carga:${ahora.toDateString()}`, tipo: 'consejo', nivel: 'info', orden: 4, titulo: `${en48.length} entregas en las próximas 48 h`, detalle: 'Empieza por las de prioridad alta. Mira el plan sugerido en el Asistente.', url: '/analitica' });
  }
  for (const { materia, m } of notas) {
    if (m.estado === 'imposible') alertas.push({ id: `n:${materia.nombre}:imposible`, tipo: 'nota', nivel: 'alta', orden: 1, titulo: `${materia.nombre}: ya no alcanzas 3.0`, detalle: 'Ni sacando 5.0 en lo que falta. Habla con tu profesor', url: '/analitica?tab=notas' });
    else if (m.estado === 'riesgo') alertas.push({ id: `n:${materia.nombre}:riesgo:${m.necesariaAprobar.toFixed(1)}`, tipo: 'nota', nivel: 'media', orden: 3, titulo: `${materia.nombre}: necesitas ${m.necesariaAprobar.toFixed(1)} para aprobar`, detalle: 'Materia en riesgo · toca para ver tus cortes', url: '/analitica?tab=notas' });
  }
  if (presupuesto && presupuesto.nivel !== 'ok') {
    const $ = (n) => `$${Math.round(n).toLocaleString('es-CO')}`;
    if (presupuesto.nivel === 'excedido') alertas.push({ id: `b:${presupuesto.mes}:excedido`, tipo: 'presupuesto', nivel: 'alta', orden: 1, titulo: 'Superaste tu presupuesto del mes', detalle: `Gastaste ${$(presupuesto.gastado)} de ${$(presupuesto.tope)}`, url: '/finanzas' });
    else if (presupuesto.nivel === 'aviso') alertas.push({ id: `b:${presupuesto.mes}:aviso:${Math.floor(presupuesto.pct / 5)}`, tipo: 'presupuesto', nivel: 'media', orden: 2, titulo: `Llevas el ${Math.round(presupuesto.pct)}% de tu presupuesto`, detalle: `Te quedan ${$(presupuesto.restante)} para ${presupuesto.diasRestantes} días (≈ ${$(presupuesto.sugeridoPorDia)} por día)`, url: '/finanzas' });
    else alertas.push({ id: `b:${presupuesto.mes}:ritmo`, tipo: 'presupuesto', nivel: 'info', orden: 4, titulo: 'A este ritmo te pasarás del presupuesto', detalle: `Proyección del mes: ${$(presupuesto.proyeccion)} (tu presupuesto: ${$(presupuesto.tope)})`, url: '/finanzas' });
  }
  for (const { meta, e } of metasProgreso) {
    if (e.hecho) continue;
    if (e.estado === 'atrasado') alertas.push({ id: `mp:${meta.id}:${ahora.toDateString()}`, tipo: 'meta', nivel: 'media', orden: 3, titulo: `Vas atrasado con «${meta.title}»`, detalle: `Necesitas ${fmtNum(e.necesarioPorDia)} ${meta.unidad || ''}/día (llevas ≈${fmtNum(e.ritmo)})`, url: '/metas' });
    else if (e.total > 0 && e.diasSinAvance >= 3) alertas.push({ id: `ms:${meta.id}:${ahora.toDateString()}`, tipo: 'meta', nivel: 'info', orden: 4, titulo: `Hace ${e.diasSinAvance} días que no avanzas en «${meta.title}»`, detalle: 'Un poquito hoy mantiene el hábito', url: '/metas' });
  }
  if (sugerirRevision) alertas.push({ id: `r:${ahora.toDateString()}`, tipo: 'revision', nivel: 'info', orden: 4, titulo: 'Es hora de tu revisión semanal', detalle: 'Cierra la semana: reprograma lo vencido y prepara la próxima', url: '/?revision=1' });
  return alertas.sort((a, b) => a.orden - b.orden);
}
