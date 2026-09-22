// Versión de esta compilación (la define vite.config.js a partir de package.json).
export const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
export const FECHA_VERSION = typeof __APP_FECHA__ !== 'undefined' ? __APP_FECHA__ : '';

/** Compara "1.10.0" con "1.9.2": >0 si a es más nueva que b. */
export function compararVersiones(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}
