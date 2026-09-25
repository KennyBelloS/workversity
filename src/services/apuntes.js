import { crearRepositorio } from '../offline/repositorio';

const repo = crearRepositorio({ tabla: 'apuntes', comparar: (a, b) => new Date(b.updated_at) - new Date(a.updated_at) });

export const listarApuntes = () => repo.listar();
export const crearApunte = (datos, userId) => repo.crear(datos, userId);
export const actualizarApunte = (id, cambios) => repo.actualizar(id, cambios);
export const eliminarApunte = (id) => repo.eliminar(id);
