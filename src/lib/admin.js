// Estadísticas del panel de administrador: funciones puras sobre la lista de
// perfiles, sin tocar la red — fáciles de probar y de reutilizar.

/** true si la fecha (ISO) cae dentro de los últimos `dias` días, contando desde `ahora`. */
function dentroDeUltimosDias(fechaISO, dias, ahora) {
  if (!fechaISO) return false;
  const ms = ahora.getTime() - new Date(fechaISO).getTime();
  return ms >= 0 && ms <= dias * 86400000;
}

/**
 * @param {Array} usuarios filas de `perfiles`
 * @param {Date} ahora
 * @returns resumen para las tarjetas del panel de administrador
 */
export function calcularEstadisticasUsuarios(usuarios, ahora = new Date()) {
  const total = usuarios.length;
  const activos7d = usuarios.filter((u) => dentroDeUltimosDias(u.ultimo_ingreso, 7, ahora)).length;
  const activos30d = usuarios.filter((u) => dentroDeUltimosDias(u.ultimo_ingreso, 30, ahora)).length;
  const nuevos7d = usuarios.filter((u) => dentroDeUltimosDias(u.created_at, 7, ahora)).length;
  const sumaIngresos = usuarios.reduce((acc, u) => acc + (u.total_ingresos || 0), 0);
  const promedioIngresos = total > 0 ? Math.round((sumaIngresos / total) * 10) / 10 : 0;
  const nuncaEntraron = usuarios.filter((u) => !u.ultimo_ingreso).length;
  return { total, activos7d, activos30d, nuevos7d, promedioIngresos, nuncaEntraron };
}

/** Usuarios ordenados por entrada más reciente primero; sin ingreso, al final. */
export function ordenarPorUltimoIngreso(usuarios) {
  return [...usuarios].sort((a, b) => {
    if (!a.ultimo_ingreso && !b.ultimo_ingreso) return 0;
    if (!a.ultimo_ingreso) return 1;
    if (!b.ultimo_ingreso) return -1;
    return new Date(b.ultimo_ingreso) - new Date(a.ultimo_ingreso);
  });
}
