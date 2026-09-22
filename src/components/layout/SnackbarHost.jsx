import { useEffect, useRef, useState } from 'react';

/** Mensajes breves con acción ("Tarea eliminada · Deshacer"). Se disparan con mostrarSnackbar() de lib/snackbar.js */
export default function SnackbarHost() {
  const [item, setItem] = useState(null);
  const temporizador = useRef(null);

  useEffect(() => {
    const mostrar = (e) => {
      clearTimeout(temporizador.current);
      setItem(e.detail);
      temporizador.current = setTimeout(() => setItem(null), e.detail.ms || 7000);
    };
    window.addEventListener('workversity:snackbar', mostrar);
    return () => { window.removeEventListener('workversity:snackbar', mostrar); clearTimeout(temporizador.current); };
  }, []);

  if (!item) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[7.5rem] z-[46] flex justify-center px-3 sm:bottom-32">
      <div role="status" className="anim-slide pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-textPrimary px-4 py-2.5 text-sm font-semibold text-bg shadow-xl">
        <span className="min-w-0 truncate">{item.texto}</span>
        {item.etiqueta && (
          <button onClick={() => { const f = item.onAccion; setItem(null); f?.(); }} className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-white">{item.etiqueta}</button>
        )}
      </div>
    </div>
  );
}
