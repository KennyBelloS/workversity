import { crearRepositorio } from '../offline/repositorio';

const repo = crearRepositorio({
  tabla: 'bloques_horario',
  comparar: (a, b) => a.day_of_week - b.day_of_week || a.start_minutes - b.start_minutes,
});

export const listarBloques = () => repo.listar();
export const crearBloque = (bloque, userId) => repo.crear(bloque, userId);
export const actualizarBloque = (id, cambios) => repo.actualizar(id, cambios);
export const eliminarBloque = (id) => repo.eliminar(id);
