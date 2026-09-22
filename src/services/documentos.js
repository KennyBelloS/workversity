import { crearRepositorio } from '../offline/repositorio';
import { esErrorDeEsquema } from '../offline/errores';

// Documentos del espacio de trabajo de una tarea: texto, hoja de cálculo, diapositivas y notas.
const repo = crearRepositorio({ tabla: 'documentos_tarea', comparar: (a, b) => new Date(a.created_at) - new Date(b.created_at) });

export async function listarDocumentos() {
  try {
    return { lista: await repo.listar(), disponible: true };
  } catch (err) {
    if (esErrorDeEsquema(err)) return { lista: [], disponible: false };
    throw err;
  }
}
export const crearDocumento = (datos, userId) => repo.crear(datos, userId);
export const actualizarDocumento = (id, cambios) => repo.actualizar(id, cambios);
export const eliminarDocumento = (id) => repo.eliminar(id);
