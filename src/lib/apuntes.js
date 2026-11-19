export const TIPOS_APUNTE = [
  { id: 'clase', t: 'Clase' },
  { id: 'tarea', t: 'Tarea' },
  { id: 'proyecto', t: 'Proyecto' },
  { id: 'libre', t: 'Libre' },
];
const COLOR_TIPO = { clase: '#3B5BA9', tarea: '#A8732A', proyecto: '#6B5FA8', libre: '#3E7E7C' };

export const etiquetaTipo = (id) => TIPOS_APUNTE.find((t) => t.id === id)?.t || 'Apunte';
export const colorTipo = (id) => COLOR_TIPO[id] || '#9A9890';
