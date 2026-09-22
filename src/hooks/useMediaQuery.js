import { useSyncExternalStore } from 'react';

/** true cuando la pantalla cumple la consulta (p. ej. '(min-width: 1024px)'). */
export function useMediaQuery(consulta) {
  return useSyncExternalStore(
    (fn) => {
      const m = window.matchMedia(consulta);
      m.addEventListener('change', fn);
      return () => m.removeEventListener('change', fn);
    },
    () => window.matchMedia(consulta).matches,
    () => false
  );
}
