import { crearRepositorio } from '../offline/repositorio';
import { esErrorDeEsquema } from '../offline/errores';

// Avances de las metas de progreso (p. ej. "leí 25 páginas hoy")
const repo = crearRepositorio({
  tabla: 'avances_meta',
  comparar: (a, b) => new Date(b.fecha) - new Date(a.fecha),
});

export async function listarAvances() {
  try {
    return { lista: await repo.listar(), disponible: true };
  } catch (err) {
    if (esErrorDeEsquema(err)) return { lista: [], disponible: false };
    throw err;
  }
}
export const crearAvance = (datos, userId) => repo.crear(datos, userId);
export const eliminarAvance = (id) => repo.eliminar(id);
