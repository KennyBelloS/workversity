// Convierte errores técnicos (en inglés, con jerga de red/JS) en un mensaje claro para la
// persona. Nunca debería llegarle a alguien un "TypeError: NetworkError..." tal cual.
import { esErrorDeRed } from '../offline/sync';

/**
 * @param err El error atrapado (de un fetch, de Supabase, de lo que sea).
 * @param accion Qué se estaba intentando hacer, en minúscula y sin mayúscula inicial
 *   (ej: "crear el espacio", "unirte con ese código"). Opcional.
 */
export function mensajeAmigable(err, accion) {
  if (esErrorDeRed(err)) {
    return accion
      ? `Para ${accion} necesitas conexión a internet. Cuando la tengas, intenta de nuevo.`
      : 'Esto necesita conexión a internet. Cuando la tengas, intenta de nuevo.';
  }
  const msg = String(err?.message || err || '').trim();
  // Si de todas formas quedó algo con pinta de error técnico (nombres de clase JS, stacks…),
  // mejor un mensaje genérico que mostrarlo tal cual.
  if (!msg || /^(TypeError|Error|SyntaxError|ReferenceError|RangeError)[:.]|:\d+:\d+\)?$/.test(msg)) {
    return `No se pudo ${accion || 'completar la acción'}. Intenta de nuevo.`;
  }
  return msg;
}
