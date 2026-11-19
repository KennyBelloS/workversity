// Puente con la pantalla de arranque que vive en index.html (se pinta antes que React).
import { VERSION } from '../version';

/** Avisa que la app ya tiene con qué pintar: la cifra salta a 100 % y la pantalla se va. */
export function cerrarArranque() {
  try {
    window.__wvArranqueVersion?.(VERSION);
    window.__wvArranqueListo?.();
  } catch { /* la pantalla ya no existe */ }
}

/**
 * Recargar desde dentro de la app: muestra otra vez la pantalla de arranque (para que el
 * salto no se sienta brusco), pide al Service Worker la versión nueva y recarga.
 */
export async function recargarApp() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch { /* sin Service Worker: se recarga igual */ }
  window.location.reload();
}
