// Dashboard con widgets movibles: qué se muestra y en qué orden, guardado en el dispositivo.
// Funciones puras (fáciles de probar); el guardado en localStorage vive en el componente.
export const WIDGETS = [
  { id: 'plan-hoy', titulo: 'Tu plan de hoy' },
  { id: 'metas', titulo: 'Tus metas' },
  { id: 'pendientes-materia', titulo: 'Pendientes por materia' },
  { id: 'notas', titulo: 'Tus notas' },
  { id: 'aprendizaje', titulo: 'Lo que aprendí de ti' },
  { id: 'graficos', titulo: 'Tus números' },
  { id: 'entregas', titulo: 'Próximas entregas' },
];
export const CLAVE_WIDGETS = 'workversity:dashboard-widgets';

/** Ajusta lo guardado a los widgets que existen hoy: agrega los nuevos al final, quita los que ya no existen. */
export function normalizarLayout(guardado, ids = WIDGETS.map((w) => w.id)) {
  const validos = new Set(ids);
  const ordenGuardado = Array.isArray(guardado?.orden) ? guardado.orden.filter((id) => validos.has(id)) : [];
  const faltantes = ids.filter((id) => !ordenGuardado.includes(id));
  const ocultosGuardados = Array.isArray(guardado?.ocultos) ? guardado.ocultos.filter((id) => validos.has(id)) : [];
  return { orden: [...ordenGuardado, ...faltantes], ocultos: ocultosGuardados };
}

/** Mueve `id` justo antes de `antesDeId` en el orden (sin efecto si son el mismo). */
export function moverAntesDe(orden, id, antesDeId) {
  if (id === antesDeId) return orden;
  const sinId = orden.filter((x) => x !== id);
  const i = sinId.indexOf(antesDeId);
  if (i === -1) return orden;
  return [...sinId.slice(0, i), id, ...sinId.slice(i)];
}

/** Mueve `id` un paso (dir: -1 arriba, +1 abajo) saltando los ocultos (para que ↑/↓ se sienta natural). */
export function moverPaso(orden, ocultos, id, dir) {
  const visibles = orden.filter((x) => !ocultos.includes(x) || x === id);
  const i = visibles.indexOf(id);
  const j = i + dir;
  if (i === -1 || j < 0 || j >= visibles.length) return orden;
  return moverAntesDe(orden, id, dir < 0 ? visibles[j] : visibles[j + 1] ?? null) ?? orden;
}

export function alternarOculto(ocultos, id) {
  return ocultos.includes(id) ? ocultos.filter((x) => x !== id) : [...ocultos, id];
}

export function leerLayout() {
  let guardado = null;
  try { guardado = JSON.parse(localStorage.getItem(CLAVE_WIDGETS) || 'null'); } catch { /* nada */ }
  return normalizarLayout(guardado);
}
export function guardarLayout(layout) {
  try { localStorage.setItem(CLAVE_WIDGETS, JSON.stringify(layout)); } catch { /* nada */ }
}
export const layoutPorDefecto = () => ({ orden: WIDGETS.map((w) => w.id), ocultos: [] });
