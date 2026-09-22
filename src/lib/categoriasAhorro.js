import { CATEGORIAS_AHORRO } from './constants';
import { CATEGORIAS_PROGRESO_BASE, COLOR_CATEGORIA_PROGRESO } from './progresoMeta';

const COLOR_BASE = { 'Fondo de emergencia': '#17C964', 'Meta personal': '#3E7BFA', 'Inversión': '#8B7FD1', Otro: '#8B93A7' };

/** Categorías predeterminadas + las que creó la persona ("Otro" siempre al final). */
export function combinarCategorias(propias = [], tipo = 'ahorro') {
  const nombresBase = tipo === 'progreso' ? CATEGORIAS_PROGRESO_BASE : CATEGORIAS_AHORRO;
  const colores = tipo === 'progreso' ? COLOR_CATEGORIA_PROGRESO : COLOR_BASE;
  const base = nombresBase.map((nombre) => ({ nombre, color: colores[nombre] || '#8B93A7', propia: false }));
  const extra = propias
    .filter((p) => (p.tipo || 'ahorro') === tipo)
    .filter((p) => !base.some((b) => b.nombre.toLowerCase() === p.nombre.toLowerCase()))
    .map((p) => ({ id: p.id, nombre: p.nombre, color: p.color || '#5B8DEF', propia: true }));
  return [...base.filter((b) => b.nombre !== 'Otro'), ...extra, ...base.filter((b) => b.nombre === 'Otro')];
}

export function limpiarNombre(s) {
  const n = String(s || '').replace(/\s+/g, ' ').trim().slice(0, 30);
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : '';
}

/**
 * Reparte el ahorro por categoría: [{nombre,color,propia,id?,total,usos,metas,huerfana?}]
 * Incluye las categorías con dinero o con metas, las propias, y las que aparecen en movimientos aunque ya no existan.
 */
export function resumenAhorro({ categorias, movimientos, metas }) {
  const ahorros = movimientos.filter((m) => m.type === 'ahorro');
  const lista = [...categorias];
  for (const nombre of new Set(ahorros.map((m) => m.category))) {
    if (!lista.some((c) => c.nombre === nombre)) lista.push({ nombre, color: '#8B93A7', propia: false, huerfana: true });
  }
  const filas = lista.map((c) => {
    const suyos = ahorros.filter((m) => m.category === c.nombre);
    return { ...c, total: suyos.reduce((s, m) => s + Number(m.amount), 0), usos: suyos.length, metas: metas.filter((m) => m.categoria_vinculada === c.nombre) };
  }).filter((f) => f.total > 0 || f.propia || f.metas.length > 0);
  const total = filas.reduce((s, f) => s + f.total, 0);
  return { filas, total, sinMeta: filas.filter((f) => f.total > 0 && f.metas.length === 0) };
}
