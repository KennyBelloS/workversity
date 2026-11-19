// Utilidades puras del tablero Kanban.
const CLAVE_ORDEN = 'workversity:kanban-orden';
const CLAVE_COLAPSO = 'workversity:kanban-colapso';

/** Límite de trabajo en curso por columna (WIP). Pasarlo muestra "Sobre el límite". */
export const LIMITES_WIP = { enProgreso: 3 };

/** Identificador corto y estable para mostrar en la tarjeta: "WV-4F2A". */
export function idCorto(uuid) {
  const limpio = String(uuid || '').replace(/[^a-f0-9]/gi, '');
  return `WV-${(limpio.slice(0, 4) || '0000').toUpperCase()}`;
}

/**
 * Ordena las tarjetas de una columna: primero según el orden que la persona dejó al arrastrar
 * (guardado en el dispositivo) y las que no tienen lugar asignado, por fecha de entrega.
 */
export function ordenarColumna(tareas, ordenGuardado = []) {
  const pos = new Map(ordenGuardado.map((id, i) => [id, i]));
  return [...tareas].sort((a, b) => {
    const pa = pos.has(a.id) ? pos.get(a.id) : Infinity;
    const pb = pos.has(b.id) ? pos.get(b.id) : Infinity;
    if (pa !== pb) return pa - pb;
    return new Date(a.due_date) - new Date(b.due_date);
  });
}

export function leerOrden() {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_ORDEN) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

export function guardarOrden(orden) {
  try {
    // Solo se guardan los últimos 200 ids por columna (suficiente y no crece sin límite).
    const recortado = Object.fromEntries(Object.entries(orden).map(([k, ids]) => [k, ids.slice(0, 200)]));
    localStorage.setItem(CLAVE_ORDEN, JSON.stringify(recortado));
  } catch {
    /* sin almacenamiento: el orden vuelve a ser por fecha */
  }
}

/**
 * Qué estados vienen plegados en la composición móvil del tablero (apilada, una sección por
 * estado). Por defecto, "Hecha" empieza plegada para que la pantalla abra enfocada en lo
 * pendiente; la persona puede plegar o desplegar cualquier sección y eso se recuerda.
 */
export function leerColapso() {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE_COLAPSO));
    return Array.isArray(v) ? new Set(v) : new Set(['hecha']);
  } catch {
    return new Set(['hecha']);
  }
}

export function guardarColapso(set) {
  try { localStorage.setItem(CLAVE_COLAPSO, JSON.stringify([...set])); } catch { /* sin almacenamiento */ }
}
