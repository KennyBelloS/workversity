// Tokens de movimiento. Tres curvas y nada más, para que toda la app se mueva igual.
//
//   rapido  → respuesta al dedo: hundir un botón, encender un chip. Casi instantáneo.
//   natural → entradas y salidas de elementos: tarjetas, filas, avisos.
//   pesado  → cosas grandes con masa: hojas, paneles, el teclado.
//
// Se usan con `motion`. Si alguien pidió menos movimiento en su sistema, `sinMovimiento`
// las deja en cero y la app sigue funcionando igual, solo que sin animación.

export const RAPIDO = { type: 'spring', stiffness: 520, damping: 34, mass: 0.6 };
export const NATURAL = { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 };
export const PESADO = { type: 'spring', stiffness: 180, damping: 26, mass: 1.1 };

/** Para opacidades y colores, donde un resorte se ve raro. */
export const SUAVE = { duration: 0.22, ease: [0.25, 0.9, 0.3, 1] };

export const sinMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Entrada escalonada: cada hijo sale un pelo después del anterior. */
export const enFila = (retraso = 0.035) => ({
  animate: { transition: { staggerChildren: retraso } },
});

export const hijoDeFila = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: NATURAL },
  exit: { opacity: 0, y: -6, transition: SUAVE },
};
