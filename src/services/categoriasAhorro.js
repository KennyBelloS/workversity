import { crearRepositorio } from '../offline/repositorio';

const repo = crearRepositorio({
  tabla: 'categorias_ahorro',
  conflicto: 'user_id,nombre',
  comparar: (a, b) => new Date(a.created_at) - new Date(b.created_at),
});

/** Si la tabla aún no existe en Supabase devuelve `disponible: false` en vez de romper la pantalla. */
export async function listarCategoriasAhorro() {
  try {
    return { lista: await repo.listar(), disponible: true };
  } catch (err) {
    if (/does not exist|schema cache|could not find/i.test(err?.message || '')) return { lista: [], disponible: false };
    throw err;
  }
}
export const crearCategoriaAhorro = (datos, userId) => repo.crear(datos, userId);
export const eliminarCategoriaAhorro = (id) => repo.eliminar(id);
