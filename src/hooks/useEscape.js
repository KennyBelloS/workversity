import { useEffect, useRef } from 'react';

/** Cierra una ventana con la tecla Escape. */
export function useEscape(alCerrar) {
  const ref = useRef(alCerrar);
  ref.current = alCerrar;
  useEffect(() => {
    const f = (e) => { if (e.key === 'Escape') ref.current?.(); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);
}
