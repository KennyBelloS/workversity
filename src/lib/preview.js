// Vista previa dinámica de tareas y clases: al pasar el mouse (o mantener pulsado en el celular).
import { eventosDeSemana, inicioDeSemana, sumarDias } from './agenda';
import { calcularHuecos, asignarAHuecos } from './huecos';

const emitir = (nombre, detalle) => window.dispatchEvent(new CustomEvent(nombre, { detail: detalle }));
const conHover = () => window.matchMedia?.('(hover: hover)').matches;
let temporizador = null;

/**
 * Props para poner en cualquier elemento:  <div {...propsPreview('tarea', tarea.id)} />
 * tipo: 'tarea' | 'clase' (materia) | 'bloque'
 */
export function propsPreview(tipo, id) {
  return {
    onMouseEnter: (e) => {
      if (!conHover()) return;
      clearTimeout(temporizador);
      const el = e.currentTarget;
      temporizador = setTimeout(() => emitir('workversity:preview', { tipo, id, modo: 'hover', rect: el.getBoundingClientRect() }), 380);
    },
    onMouseLeave: () => { clearTimeout(temporizador); emitir('workversity:preview-salir'); },
    onTouchStart: () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => emitir('workversity:preview', { tipo, id, modo: 'hoja' }), 480);
    },
    onTouchEnd: () => clearTimeout(temporizador),
    onTouchMove: () => clearTimeout(temporizador),
  };
}

/** Props de vista previa para un evento de la agenda (lib/agenda.js). */
export const previewDeEvento = (e) => propsPreview(e.origen === 'tarea' ? 'tarea' : e.origen === 'materia' ? 'clase' : 'bloque', e.ref.id);

/** Cuenta regresiva legible: "2 d 4 h", "3 h 12 min" o "12:05" cuando falta menos de una hora. */
export function cuentaAtras(ms) {
  const t = Math.abs(ms);
  const s = Math.floor(t / 1000) % 60;
  const m = Math.floor(t / 60000) % 60;
  const h = Math.floor(t / 3600000) % 24;
  const d = Math.floor(t / 86400000);
  let texto;
  if (d >= 1) texto = `${d} d ${h} h`;
  else if (h > 0) texto = `${h} h ${String(m).padStart(2, '0')} min`;
  else texto = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return { texto, vencida: ms < 0 };
}

export function colorUrgencia(ms, hecha = false) {
  if (hecha) return '#17C964';
  if (ms < 3 * 3600000) return '#E5484D';
  if (ms < 24 * 3600000) return '#F5A524';
  if (ms < 72 * 3600000) return '#3E7BFA';
  return '#17C964';
}

/** Cuánto del tiempo entre que se creó la tarea y su entrega ya pasó (0–1). */
export function fraccionTiempo(tarea, ahora = new Date()) {
  const fin = new Date(tarea.due_date).getTime();
  let ini = tarea.created_at ? new Date(tarea.created_at).getTime() : fin - 7 * 86400000;
  if (!(ini < fin)) ini = fin - 3 * 86400000;
  return Math.min(1, Math.max(0, (ahora.getTime() - ini) / (fin - ini)));
}

/** Próximas sesiones de una materia (por nombre) o de un bloque (por id), mirando 3 semanas. */
export function proximasSesiones({ ahora = new Date(), materias = [], bloques = [], nombre = null, bloqueId = null, n = 3 }) {
  const ini = inicioDeSemana(ahora);
  const todas = [0, 7, 14].flatMap((d) => eventosDeSemana(sumarDias(ini, d), { materias, bloques, tareas: [] }));
  return todas
    .filter((e) => (bloqueId ? e.id === `bloque-${bloqueId}` : e.origen === 'materia' && e.titulo === nombre))
    .filter((e) => e.fin > ahora)
    .sort((a, b) => a.inicio - b.inicio)
    .slice(0, n);
}

/** En qué hueco libre de hoy, mañana o pasado mañana (antes de la entrega) conviene hacer la tarea. */
export function sugerirHueco(tarea, { ahora = new Date(), materias = [], bloques = [] }) {
  const due = new Date(tarea.due_date);
  if (tarea.status === 'hecha' || due <= ahora) return null;
  for (let off = 0; off < 3; off++) {
    const base = new Date(ahora);
    if (off > 0) { base.setDate(base.getDate() + off); base.setHours(0, 0, 0, 0); }
    if (base > due) break;
    const eventos = eventosDeSemana(inicioDeSemana(base), { materias, bloques, tareas: [] }).filter((e) => e.dia === (base.getDay() + 6) % 7);
    const huecos = calcularHuecos(eventos, { ahora: base }).filter((h) => h.inicio < due);
    const plan = asignarAHuecos(huecos, [tarea])[0];
    if (plan && plan.inicio < due) return { inicio: plan.inicio, fin: plan.fin, cuando: ['hoy', 'mañana', 'pasado mañana'][off] };
  }
  return null;
}
