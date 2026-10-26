// Caché rápida para pantallas que dependen de datos en vivo (Grupo…): la última respuesta
// buena se guarda en el dispositivo y se muestra AL INSTANTE la próxima vez, mientras de
// fondo se intenta traer algo más nuevo. Así la pantalla nunca se queda en blanco o
// "cargando…" solo por una red lenta o sin conexión.
const PREFIJO = 'workversity:cache:';

export function leerCacheRapida(clave) {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}
export function guardarCacheRapida(clave, datos) {
  try { localStorage.setItem(PREFIJO + clave, JSON.stringify(datos)); } catch { /* nada (localStorage lleno o no disponible) */ }
}

/**
 * Trae datos con "muestra lo de antes ya mismo, y actualiza cuando pueda" (stale-while-revalidate):
 * 1) si hay algo guardado de una vez anterior, se entrega de inmediato (`onRapido`);
 * 2) en paralelo se pide lo actual con un tiempo límite corto, para no dejar la pantalla
 *    esperando una red lenta; si llega a tiempo, se entrega y se guarda para la próxima.
 * Devuelve { datos, deCache, fresco }: `deCache` es true si lo mostrado es lo guardado
 * (no se pudo confirmar con el servidor a tiempo), y `fresco` es true si sí se logró actualizar.
 */
export async function traerConCacheRapida(clave, pedir, { onRapido, tiempoLimiteMs = 9000 } = {}) {
  const guardado = leerCacheRapida(clave);
  if (guardado) onRapido?.(guardado);
  try {
    const espera = new Promise((_, rej) => setTimeout(() => rej(new Error('tiempo agotado')), tiempoLimiteMs));
    const datos = await Promise.race([pedir(), espera]);
    guardarCacheRapida(clave, datos);
    return { datos, deCache: false, fresco: true };
  } catch {
    if (guardado) return { datos: guardado, deCache: true, fresco: false };
    throw new Error('No se pudo cargar y no hay nada guardado de antes. Revisa tu conexión.');
  }
}
