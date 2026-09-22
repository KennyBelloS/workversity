// Logros: se calculan solos a partir de tus datos (nada que registrar aparte).
import { calcularRacha } from './productividad';
import { agruparNotas } from './notas';
import { estadoProgreso } from './progresoMeta';

export const LOGROS = [
  { id: 'primera-tarea', emoji: '✅', titulo: 'Primer paso', desc: 'Completa tu primera tarea', meta: 1, medir: (c) => c.hechas },
  { id: 'diez-tareas', emoji: '🔟', titulo: 'En marcha', desc: 'Completa 10 tareas', meta: 10, medir: (c) => c.hechas },
  { id: 'cincuenta-tareas', emoji: '💪', titulo: 'Imparable', desc: 'Completa 50 tareas', meta: 50, medir: (c) => c.hechas },
  { id: 'cien-tareas', emoji: '🏆', titulo: 'Leyenda', desc: 'Completa 100 tareas', meta: 100, medir: (c) => c.hechas },
  { id: 'puntual', emoji: '⏱️', titulo: 'Siempre a tiempo', desc: 'Entrega 5 tareas antes de su fecha', meta: 5, medir: (c) => c.puntuales },
  { id: 'racha-3', emoji: '🔥', titulo: 'Tres seguidos', desc: 'Racha de 3 días con actividad', meta: 3, medir: (c) => c.racha },
  { id: 'racha-7', emoji: '🌋', titulo: 'Semana perfecta', desc: 'Racha de 7 días', meta: 7, medir: (c) => c.racha },
  { id: 'racha-30', emoji: '☄️', titulo: 'Hábito de hierro', desc: 'Racha de 30 días', meta: 30, medir: (c) => c.racha },
  { id: 'primer-pomodoro', emoji: '🍅', titulo: 'Primer Pomodoro', desc: 'Termina una sesión de enfoque', meta: 1, medir: (c) => c.pomodoros },
  { id: 'diez-pomodoros', emoji: '🎯', titulo: 'Enfocado', desc: 'Termina 10 sesiones de enfoque', meta: 10, medir: (c) => c.pomodoros },
  { id: 'enfoque-10h', emoji: '🧠', titulo: 'Concentración total', desc: 'Acumula 10 horas de enfoque', meta: 10, medir: (c) => Math.floor(c.minutosEnfoque / 60) },
  { id: 'tres-materias', emoji: '📚', titulo: 'Bien organizado', desc: 'Registra 3 materias', meta: 3, medir: (c) => c.materias },
  { id: 'primera-nota', emoji: '🎓', titulo: 'Primera nota', desc: 'Registra tu primera nota', meta: 1, medir: (c) => c.notas },
  { id: 'corte-ganado', emoji: '📈', titulo: 'Corte ganado', desc: 'Termina un corte con 3.0 o más', meta: 1, medir: (c) => c.cortesGanados },
  { id: 'promedio-4', emoji: '🌟', titulo: 'Estudiante estrella', desc: 'Llega a 4.0 en una materia', meta: 1, medir: (c) => c.materiasCuatro },
  { id: 'primer-ahorro', emoji: '🐷', titulo: 'Ahorrador', desc: 'Registra tu primer ahorro', meta: 1, medir: (c) => c.ahorros },
  { id: 'meta-cumplida', emoji: '🏁', titulo: 'Meta cumplida', desc: 'Completa una meta de ahorro', meta: 1, medir: (c) => c.metasCumplidas },
  { id: 'categoria-propia', emoji: '🏷️', titulo: 'A tu manera', desc: 'Crea una categoría de ahorro', meta: 1, medir: (c) => c.categoriasPropias },
  { id: 'primer-avance', emoji: '🌱', titulo: 'Primer avance', desc: 'Registra el avance de una meta (leer, estudiar…)', meta: 1, medir: (c) => c.avances },
  { id: 'meta-lectura', emoji: '📖', titulo: 'Meta terminada', desc: 'Termina una meta de progreso (p. ej. leer un libro)', meta: 1, medir: (c) => c.metasProgresoCumplidas },
  { id: 'constancia-30', emoji: '🪴', titulo: 'Constancia', desc: 'Registra 30 avances', meta: 30, medir: (c) => c.avances },
  { id: 'revision-1', emoji: '🗓️', titulo: 'Revisión semanal', desc: 'Haz tu primera revisión semanal', meta: 1, medir: (c) => c.revisiones },
  { id: 'revision-4', emoji: '🧭', titulo: 'Constante', desc: 'Haz 4 revisiones semanales', meta: 4, medir: (c) => c.revisiones },
  { id: 'app-instalada', emoji: '📲', titulo: 'Como app nativa', desc: 'Instala Workversity', meta: 1, medir: (c) => (c.instalada ? 1 : 0) },
];

export function contextoLogros({ tareas = [], sesiones = [], materias = [], evaluaciones = [], cortes = [], movimientos = [], metas = [], avances = [], categoriasPropias = [], revisiones = 0, instalada = false, ahora = new Date() }) {
  const hechas = tareas.filter((t) => t.status === 'hecha');
  const completadas = sesiones.filter((s) => s.completada);
  const filas = agruparNotas({ materias, evaluaciones, cortes, meta: 3 });
  const ahorroDe = (cat) => movimientos.filter((m) => m.type === 'ahorro' && m.category === cat).reduce((s, m) => s + Number(m.amount), 0);
  return {
    hechas: hechas.length,
    puntuales: hechas.filter((t) => t.completed_at && new Date(t.completed_at) <= new Date(t.due_date)).length,
    racha: calcularRacha(tareas, sesiones, ahora),
    pomodoros: completadas.length,
    minutosEnfoque: completadas.reduce((s, x) => s + Number(x.duracion_minutos || 0), 0),
    materias: new Set(materias.map((m) => m.nombre)).size,
    notas: evaluaciones.filter((e) => e.nota != null || (e.items || []).some((i) => i.nota != null)).length,
    cortesGanados: filas.reduce((s, f) => s + f.m.cortes.filter((c) => c.estado === 'ganado').length, 0),
    materiasCuatro: filas.filter((f) => f.m.hayDatos && (f.m.final ?? f.m.promedioActual ?? 0) >= 4).length,
    ahorros: movimientos.filter((m) => m.type === 'ahorro').length,
    avances: avances.length,
    metasProgresoCumplidas: metas.filter((m) => m.tipo === 'progreso' && estadoProgreso({ meta: m, avances: avances.filter((a) => a.meta_id === m.id), ahora }).hecho).length,
    metasCumplidas: metas.filter((m) => m.tipo !== 'progreso' && Number(m.target_amount) > 0 && ahorroDe(m.categoria_vinculada) >= Number(m.target_amount)).length,
    categoriasPropias: categoriasPropias.length,
    revisiones, instalada,
  };
}

export function evaluarLogros(ctx) {
  return LOGROS.map(({ medir, ...l }) => {
    const valor = medir(ctx);
    return { ...l, actual: Math.min(valor, l.meta), logrado: valor >= l.meta };
  });
}
