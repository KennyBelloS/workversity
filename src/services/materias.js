import { crearRepositorio } from '../offline/repositorio';

const repo = crearRepositorio({
  tabla: 'materias',
  comparar: (a, b) => a.day_of_week - b.day_of_week || a.start_minutes - b.start_minutes,
});

export const listarMaterias = () => repo.listar();
export const crearMateria = (materia, userId) => repo.crear(materia, userId);
export const actualizarMateria = (id, cambios) => repo.actualizar(id, cambios);
export const eliminarMateria = (id) => repo.eliminar(id);
