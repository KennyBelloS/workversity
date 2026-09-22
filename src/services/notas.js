import { crearRepositorio } from '../offline/repositorio';

const repo = crearRepositorio({
  tabla: 'evaluaciones',
  comparar: (a, b) => new Date(a.created_at) - new Date(b.created_at),
});

export const listarEvaluaciones = () => repo.listar();
export const crearEvaluacion = (ev, userId) => repo.crear(ev, userId);
export const actualizarEvaluacion = (id, cambios) => repo.actualizar(id, cambios);
export const eliminarEvaluacion = (id) => repo.eliminar(id);
