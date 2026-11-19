import { motion, AnimatePresence } from 'motion/react';
import { NATURAL, SUAVE, sinMovimiento } from '../../lib/movimiento';

// ---------------------------------------------------------------------------------------------
// Formularios escritos como una frase.
//
// En vez de una pila de cajas con etiquetas encima, lo que se crea se lee en español y los
// datos que faltan son huecos que se tocan: "Entregar ___ de ___ el ___". Tocar un hueco abre
// abajo el control de ESA decisión y nada más. Antes de guardar, lees en voz normal lo que vas
// a guardar, que es la forma más corta de darte cuenta de que te equivocaste.
//
// Accesibilidad: cada hueco es un <button> de verdad, con su aria-label diciendo qué campo es,
// y la gaveta de abajo se anuncia como región.
// ---------------------------------------------------------------------------------------------

export function Frase({ children, className = '' }) {
  return <p className={`frase ${className}`}>{children}</p>;
}

/**
 * Un hueco de la frase.
 * @param {boolean} o.activo  Si su gaveta está abierta.
 * @param {boolean} o.vacio   Todavía no tiene valor: se ve como una línea por llenar.
 * @param {string} o.campo    Para el lector de pantalla: "título", "materia"…
 */
export function Hueco({ activo, vacio, campo, color, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={!!activo}
      aria-label={`${campo}${vacio ? ', sin definir' : ''}`}
      className={`hueco ${activo ? 'hueco--activo' : ''} ${vacio ? 'hueco--vacio' : ''}`}
      style={color ? { '--hc': color } : undefined}
    >
      {children}
    </button>
  );
}

/** La gaveta: el control del hueco que está activo. Solo hay una abierta a la vez. */
export function Gaveta({ clave, titulo, children }) {
  const quieto = sinMovimiento();
  return (
    <AnimatePresence mode="wait" initial={false}>
      {clave && (
        <motion.section
          key={clave}
          aria-label={titulo}
          initial={quieto ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={quieto ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
          exit={quieto ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={quieto ? SUAVE : NATURAL}
          className="gaveta"
        >
          <div className="gaveta-dentro">
            <p className="rotulo mb-3">{titulo}</p>
            {children}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

/** Fila de opciones de un solo golpe (prioridad, dificultad, categoría…). */
export function Opciones({ valor, onElegir, opciones, columnas = 3, aria }) {
  return (
    <div role="radiogroup" aria-label={aria} className="opciones" style={{ '--cols': columnas }}>
      {opciones.map((o) => {
        const sel = valor === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={sel}
            onClick={() => onElegir(o.id)}
            className={`opcion ${sel ? 'opcion--sel' : ''}`}
            style={o.color ? { '--oc': o.color } : undefined}
          >
            {o.icono}
            <span className="opcion-t">{o.titulo}</span>
            {o.nota && <span className="opcion-n">{o.nota}</span>}
          </button>
        );
      })}
    </div>
  );
}
