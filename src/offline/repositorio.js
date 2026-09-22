// ---------------------------------------------------------------------------
// Repositorio genérico "offline-first" para una tabla de Supabase.
//
//   listar()      → con internet: sube lo pendiente, descarga y guarda copia.
//                   sin internet: devuelve la copia local.
//   crear()       → guarda local al instante y sube cuando hay red.
//   actualizar()  → ídem (solo envía los campos que cambiaron).
//   eliminar()    → ídem.
//
// Los ids se generan en el cliente (UUID), así se pueden crear registros sin
// internet y luego subirlos sin duplicarse (la subida es idempotente).
// ---------------------------------------------------------------------------

import { supabase } from '../services/supabase';
import { leerTabla, guardarTabla } from './db';
import { encolar, vaciarCola, hayPendientesDe, conTimeout, esErrorDeRed, marcarConexion } from './sync';

export function nuevoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0'));
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10).join('')}`;
}

// Evita que dos escrituras simultáneas a la misma tabla se pisen entre sí.
const cerrojos = new Map();
function conCerrojo(tabla, fn) {
  const anterior = cerrojos.get(tabla) || Promise.resolve();
  const siguiente = anterior.catch(() => {}).then(fn);
  cerrojos.set(tabla, siguiente);
  return siguiente;
}

/**
 * @param {object} cfg
 * @param {string} cfg.tabla
 * @param {(a:object,b:object)=>number} [cfg.comparar]      orden de la lista
 * @param {string} [cfg.conflicto]                            columnas únicas para upsert (por defecto "id")
 * @param {(q:any)=>any} [cfg.filtroServidor]                 recorta lo que se descarga (p. ej. últimos 30 días)
 * @param {string} [cfg.campoPadre]                           columna que apunta a la fila padre (borrado en cascada local)
 */
export function crearRepositorio(cfg) {
  const { tabla, comparar, conflicto, filtroServidor, campoPadre } = cfg;
  const ordenar = (filas) => (comparar ? [...filas].sort(comparar) : filas);

  async function descargar() {
    let q = supabase.from(tabla).select('*');
    if (filtroServidor) q = filtroServidor(q);
    const { data, error } = await conTimeout(q);
    if (error) throw error;
    return data || [];
  }

  async function listar() {
    if (navigator.onLine !== false) {
      try {
        await vaciarCola();
        if (!(await hayPendientesDe(tabla))) {
          const filas = await descargar();
          marcarConexion(true);
          await conCerrojo(tabla, async () => {
            // Si mientras descargábamos el usuario hizo un cambio, no lo pisamos.
            if (await hayPendientesDe(tabla)) return;
            await guardarTabla(tabla, filas);
          });
        }
      } catch (err) {
        if (!esErrorDeRed(err)) throw err; // errores reales (tabla inexistente, permisos…) sí se muestran
        marcarConexion(false);
      }
    }
    return ordenar(await leerTabla(tabla));
  }

  async function crear(datos, userId) {
    const ahora = new Date().toISOString();
    const fila = { ...datos, id: datos.id || nuevoId(), user_id: userId, created_at: datos.created_at || ahora };
    await conCerrojo(tabla, async () => {
      const filas = await leerTabla(tabla);
      const idx = filas.findIndex((f) => f.id === fila.id);
      if (idx >= 0) filas[idx] = fila;
      else filas.push(fila);
      await guardarTabla(tabla, filas);
    });
    await encolar({ tabla, tipo: 'upsert', idFila: fila.id, fila, conflicto });
    return fila;
  }

  async function actualizar(id, cambios) {
     
    const { id: _id, user_id, created_at, ...limpios } = cambios;
    let resultado;
    await conCerrojo(tabla, async () => {
      const filas = await leerTabla(tabla);
      const idx = filas.findIndex((f) => f.id === id);
      if (idx < 0) throw new Error('No se encontró el registro que intentas editar.');
      resultado = { ...filas[idx], ...limpios };
      filas[idx] = resultado;
      await guardarTabla(tabla, filas);
    });
    await encolar({ tabla, tipo: 'patch', idFila: id, cambios: limpios });
    return resultado;
  }

  async function eliminar(id) {
    await conCerrojo(tabla, async () => {
      const filas = await leerTabla(tabla);
      await guardarTabla(
        tabla,
        filas.filter((f) => f.id !== id && !(campoPadre && f[campoPadre] === id))
      );
    });
    await encolar({ tabla, tipo: 'delete', idFila: id });
  }

  return { tabla, listar, crear, actualizar, eliminar };
}
