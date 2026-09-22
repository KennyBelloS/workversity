import { crearRepositorio } from '../offline/repositorio';

// Pesos de los 3 cortes de cada materia (por defecto 35 / 35 / 30)
const repo = crearRepositorio({ tabla: 'cortes_notas', conflicto: 'user_id,materia_id' });

export const listarCortes = () => repo.listar();
export const crearCortes = (datos, userId) => repo.crear(datos, userId);
export const actualizarCortes = (id, cambios) => repo.actualizar(id, cambios);
