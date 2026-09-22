import { useSyncExternalStore } from 'react';
import { suscribir, obtenerEstado } from '../offline/sync';

/** Estado de conexión y sincronización: { enLinea, pendientes, sincronizando, ultimaSync, ultimoError, version } */
export function useSyncEstado() {
  return useSyncExternalStore(suscribir, obtenerEstado, obtenerEstado);
}
