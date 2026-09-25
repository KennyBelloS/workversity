export const TIPOS_APUNTE = [
  { id: 'clase', t: 'Clase' },
  { id: 'tarea', t: 'Tarea' },
  { id: 'proyecto', t: 'Proyecto' },
  { id: 'libre', t: 'Libre' },
];
const COLOR_TIPO = { clase: '#5B8DEF', tarea: '#F5A524', proyecto: '#8B7FD1', libre: '#7FD1C3' };

export const etiquetaTipo = (id) => TIPOS_APUNTE.find((t) => t.id === id)?.t || 'Apunte';
export const colorTipo = (id) => COLOR_TIPO[id] || '#8B93A7';
