// Funciones puras para el panel de administrador: estadísticas de usuarios, orden,
// series para la mini gráfica y búsqueda. Sin llamadas a red aquí (eso vive en
// services/admin.js) para que esta lógica se pueda probar sin mocks.

const unDia = 24 * 60 * 60 * 1000;

/** Resumen general: cuántos usuarios hay, cuántos entraron recientemente, cuántos nunca. */
export function calcularEstadisticasUsuarios(usuarios, ahora = new Date()) {
  const total = usuarios.length;
  const hace7 = ahora.getTime() - 7 * unDia;
  const hace30 = ahora.getTime() - 30 * unDia;
  let activos7d = 0;
  let activos30d = 0;
  let nuevos7d = 0;
  let nuncaEntraron = 0;
  let sumaIngresos = 0;
  for (const u of usuarios) {
    sumaIngresos += u.total_ingresos || 0;
    if (!u.ultimo_ingreso) { nuncaEntraron += 1; } else {
      const t = new Date(u.ultimo_ingreso).getTime();
      if (t >= hace7) activos7d += 1;
      if (t >= hace30) activos30d += 1;
    }
    if (u.created_at && new Date(u.created_at).getTime() >= hace7) nuevos7d += 1;
  }
  return {
    total,
    activos7d,
    activos30d,
    nuevos7d,
    nuncaEntraron,
    promedioIngresos: total ? Math.round((sumaIngresos / total) * 10) / 10 : 0,
  };
}

/** Lista de usuarios ordenada por quién entró más recientemente (los que nunca entraron, al final). */
export function ordenarPorUltimoIngreso(usuarios) {
  return [...usuarios].sort((a, b) => {
    const ta = a.ultimo_ingreso ? new Date(a.ultimo_ingreso).getTime() : -Infinity;
    const tb = b.ultimo_ingreso ? new Date(b.ultimo_ingreso).getTime() : -Infinity;
    return tb - ta;
  });
}

/** Cuántas cuentas se registraron en cada una de las últimas `semanas` semanas (para la mini gráfica). */
export function registrosPorSemana(usuarios, semanas = 8, ahora = new Date()) {
  // Ventanas de 7 días hacia atrás desde HOY (la última incluye la semana en curso).
  const fin = ahora.getTime();
  const cestas = Array.from({ length: semanas }, (_, i) => ({
    desde: fin - (semanas - i) * 7 * unDia,
    hasta: fin - (semanas - 1 - i) * 7 * unDia,
    cantidad: 0,
  }));
  for (const u of usuarios) {
    if (!u.created_at) continue;
    const t = new Date(u.created_at).getTime();
    const cesta = cestas.find((c) => t > c.desde && t <= c.hasta);
    if (cesta) cesta.cantidad += 1;
  }
  return cestas.map((c) => c.cantidad);
}

/** Filtra usuarios por nombre o correo, sin distinguir mayúsculas ni tildes. */
export function filtrarUsuarios(usuarios, busqueda) {
  const q = String(busqueda || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (!q) return usuarios;
  return usuarios.filter((u) => {
    const texto = `${u.nombre || ''} ${u.correo || ''}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return texto.includes(q);
  });
}
