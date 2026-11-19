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
  // Lista blanca, no lista negra: en vez de tratar de reconocer CADA forma de error técnico
  // (imposible: siempre aparece una nueva, como pasó con el de IndexedDB), solo se muestra el
  // mensaje tal cual si de verdad parece estar escrito en español. Cualquier otra cosa —clases
  // de error de JS, mensajes del navegador, stacks— cae siempre al mensaje genérico.
  const pareceEspanol = /[áéíóúñÁÉÍÓÚÑ¿¡]/.test(msg);
  if (!msg || !pareceEspanol) {
    return `No se pudo ${accion || 'completar la acción'}. Intenta de nuevo.`;
  }
  return msg;
}
