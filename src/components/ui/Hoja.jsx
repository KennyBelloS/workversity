import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { PESADO, SUAVE, sinMovimiento } from '../../lib/movimiento';

// ---------------------------------------------------------------------------------------------
// Hoja: el contenedor de todo lo que se abre encima de la app (formularios, selectores).
//
// Dos cosas importantes de arquitectura:
//  1. Se dibuja con un portal al <body>. Si se dibujara dentro de la página, cualquier ancestro
//     con `transform` la sacaría de la pantalla — que es exactamente el error que tenía la app.
//  2. En celular sube desde abajo y se puede cerrar arrastrándola; en pantalla ancha aparece
//     centrada. Es la misma hoja, no dos componentes distintos.
// ---------------------------------------------------------------------------------------------

export default function Hoja({ abierta, onCerrar, titulo, rotulo, acciones, children, ancho = '34rem' }) {
  const panel = useRef(null);
  const qued = useRef(null);

  useEffect(() => {
    if (!abierta) return undefined;
    qued.current = document.activeElement;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const alTeclear = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCerrar(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      // Trampa de foco: tabular no debe salirse de la hoja.
      const focos = panel.current.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
      if (!focos.length) return;
      const primero = focos[0];
      const ultimo = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener('keydown', alTeclear, true);
    const t = setTimeout(() => {
      const auto = panel.current?.querySelector('[data-autofoco]');
      (auto || panel.current)?.focus?.();
    }, 60);
    return () => {
      document.removeEventListener('keydown', alTeclear, true);
      document.body.style.overflow = previo;
      clearTimeout(t);
      qued.current?.focus?.();
    };
  }, [abierta, onCerrar]);

  if (typeof document === 'undefined') return null;
  const quieto = sinMovimiento();

  return createPortal(
    <AnimatePresence>
      {abierta && (
        <div className="hoja-raiz" role="dialog" aria-modal="true" aria-label={titulo}>
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="hoja-velo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SUAVE}
            onClick={onCerrar}
          />
          <motion.div
            ref={panel}
            tabIndex={-1}
            className="hoja-panel"
            style={{ '--ancho': ancho }}
            initial={quieto ? { opacity: 0 } : { y: '100%', opacity: 0.6 }}
            animate={quieto ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={quieto ? { opacity: 0 } : { y: '100%', opacity: 0.4 }}
            transition={PESADO}
            drag={quieto ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => { if (info.offset.y > 130 || info.velocity.y > 700) onCerrar(); }}
          >
            <span className="hoja-asa" aria-hidden="true" />
            <header className="hoja-cab">
              <div className="min-w-0">
                {rotulo && <p className="rotulo">{rotulo}</p>}
                <h2 className="hoja-titulo">{titulo}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {acciones}
                <button type="button" onClick={onCerrar} aria-label="Cerrar" className="hoja-x"><X size={18} strokeWidth={1.9} /></button>
              </div>
            </header>
            <div className="hoja-cuerpo">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
