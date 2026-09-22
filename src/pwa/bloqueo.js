// Evita que una actualización automática recargue la app mientras hay cambios sin guardar.
const sucios = new Set();
export const marcarSucio = (clave, valor) => { if (valor) sucios.add(clave); else sucios.delete(clave); };
export const haySinGuardar = () => sucios.size > 0;
