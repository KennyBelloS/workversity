// Limpieza mensual de tareas hechas: una vez al mes, si quedan tareas marcadas como "hecha"
// de meses ANTERIORES (nunca las de este mes, para no sorprender a nadie con algo reciente),
// se pregunta si se quieren borrar. Nunca borra nada sin que la persona lo confirme.
const CLAVE_META = 'limpiezaMensual.ultimaPregunta';

const claveMes = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

/** Tareas completadas en un mes anterior al actual (listas para ofrecer borrarlas). */
export function tareasParaLimpiar(tareas, ahora = new Date()) {
  const mesActual = claveMes(ahora);
  return (tareas || []).filter((t) => {
    if (t.status !== 'hecha') return false;
    const fecha = t.completed_at || t.due_date;
    if (!fecha) return false;
    return claveMes(new Date(fecha)) < mesActual;
  });
}

/** ¿Ya se preguntó este mes? (para no mostrar el diálogo más de una vez por mes). */
export function yaSePreguntoEsteMes(ahora = new Date(), leer = () => localStorage.getItem(CLAVE_META)) {
  try {
    return leer() === claveMes(ahora);
  } catch {
    return false; // sin localStorage (modo privado, SSR…): mejor preguntar que no preguntar nunca
  }
}

/** Marca que ya se preguntó este mes (se llama al cerrar el diálogo, se borre o no). */
export function guardarPreguntaHecha(ahora = new Date(), guardar = (v) => localStorage.setItem(CLAVE_META, v)) {
  try {
    guardar(claveMes(ahora));
  } catch {
    /* sin localStorage: no es crítico, solo se volverá a preguntar más seguido */
  }
}
