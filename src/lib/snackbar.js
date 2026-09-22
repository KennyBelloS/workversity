/** Mensaje breve con acción (p. ej. "Tarea eliminada · Deshacer"). Lo dibuja components/layout/SnackbarHost.jsx */
export function mostrarSnackbar({ texto, etiqueta, onAccion, ms = 7000 }) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('workversity:snackbar', { detail: { texto, etiqueta, onAccion, ms } }));
}
