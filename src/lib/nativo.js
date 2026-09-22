// Detalles de "app nativa": vibración, insignia en el ícono y celebración.
export const vibrar = (ms = 25) => { try { navigator.vibrate?.(ms); } catch { /* nada */ } };

/** Número sobre el ícono de la app instalada (tareas vencidas o de hoy). */
export async function actualizarInsignia(n) {
  try {
    if (n > 0) await navigator.setAppBadge?.(n);
    else await navigator.clearAppBadge?.();
  } catch { /* no soportado */ }
}

export function celebrar() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('workversity:celebrar'));
}
