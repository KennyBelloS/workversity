// Copia de seguridad: crear el archivo y prepararlo para restaurar (con o sin la misma cuenta).
export const FORMATO = 'workversity-respaldo';
// Orden de restauración: primero lo que otras tablas necesitan (materias antes que tareas y notas).
export const TABLAS_RESPALDO = ['materias', 'cortes_notas', 'evaluaciones', 'tareas', 'documentos_tarea', 'bloques_horario', 'categorias_ahorro', 'metas', 'avances_meta', 'movimientos', 'presupuestos_mensuales'];
const CAMPOS_REFERENCIA = ['materia_id', 'parent_task_id', 'meta_id', 'tarea_id'];

export function crearRespaldo({ usuarioId, version, tablas }) {
  return { formato: FORMATO, version, exportado_en: new Date().toISOString(), usuario_id: usuarioId, tablas };
}

/**
 * @returns {{ok:boolean, error?:string, operaciones:{tabla:string, fila:object}[], resumen:Record<string,number>, remapeado:boolean}}
 * - Misma cuenta: se conservan los ids (restaurar dos veces no duplica nada).
 * - Otra cuenta (o copia antigua): las filas que no existen aquí reciben ids nuevos y se ajustan sus referencias.
 */
export function prepararRestauracion({ respaldo, usuarioId, idsExistentes = new Set(), nuevoId }) {
  if (!respaldo || typeof respaldo !== 'object') return { ok: false, error: 'El archivo no es una copia de Workversity.', operaciones: [], resumen: {}, remapeado: false };
  const nuevoFormato = respaldo.formato === FORMATO;
  const tablas = nuevoFormato ? respaldo.tablas : respaldo;
  if (!tablas || !TABLAS_RESPALDO.some((t) => Array.isArray(tablas[t]))) return { ok: false, error: 'El archivo no contiene datos de Workversity.', operaciones: [], resumen: {}, remapeado: false };

  const mismaCuenta = nuevoFormato && respaldo.usuario_id === usuarioId;
  const mapa = new Map();
  let remapeado = false;
  for (const t of TABLAS_RESPALDO) {
    for (const f of tablas[t] || []) {
      if (!f?.id) continue;
      if (mismaCuenta || idsExistentes.has(f.id)) mapa.set(f.id, f.id);
      else { mapa.set(f.id, nuevoId()); remapeado = true; }
    }
  }

  const operaciones = [];
  const resumen = {};
  for (const t of TABLAS_RESPALDO) {
    let filas = (tablas[t] || []).filter((f) => f && typeof f === 'object' && f.id);
    if (t === 'tareas') { // las tareas padre antes que sus sub-tareas
      const ids = new Set(filas.map((f) => f.id));
      filas = [...filas.filter((f) => !f.parent_task_id || !ids.has(f.parent_task_id)), ...filas.filter((f) => f.parent_task_id && ids.has(f.parent_task_id))];
    }
    resumen[t] = filas.length;
    for (const original of filas) {
       
      const { user_id, updated_at, ...fila } = original;
      fila.id = mapa.get(original.id);
      for (const campo of CAMPOS_REFERENCIA) if (fila[campo]) fila[campo] = mapa.get(fila[campo]) || fila[campo];
      operaciones.push({ tabla: t, fila });
    }
  }
  return { ok: true, operaciones, resumen, remapeado };
}
