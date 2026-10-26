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
  // No se intenta adivinar qué mensajes técnicos "se ven raros" (esa lista nunca está
  // completa: justo así se coló antes un error crudo de IndexedDB). En cambio, se
  // asume lo contrario: un mensaje solo se muestra tal cual si está en español —así
  // es como escribimos nosotros mismos los avisos pensados para la persona (p. ej.
  // "Ese código no existe o ya no es válido."). Cualquier otra cosa —en inglés, con
  // nombres de clases de JavaScript, trazas de pila, jerga de navegador— cae al
  // mensaje genérico, sin importar qué forma tenga.
  const pareceEspanol = /[áéíóúñÁÉÍÓÚÑ¿¡]/.test(msg);
  if (!msg || !pareceEspanol) {
    return `No se pudo ${accion || 'completar la acción'}. Intenta de nuevo.`;
  }
  return msg;
}
