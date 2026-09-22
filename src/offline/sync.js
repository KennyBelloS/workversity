// ---------------------------------------------------------------------------
// Motor de sincronización.
//
// Idea general (offline-first):
//   1. Cada cambio se aplica de inmediato en la copia local (IndexedDB).
//   2. Además se anota en una "cola" de cambios pendientes.
//   3. Cuando hay internet, la cola se sube a Supabase en orden (FIFO).
//   4. Después se vuelve a descargar la tabla para quedar igual que el servidor.
//
// Resolución de conflictos: gana el último cambio en llegar al servidor
// (last-write-wins). Las ediciones envían solo los campos modificados
// ("patch"), así dos dispositivos que editan campos distintos no se pisan.
// ---------------------------------------------------------------------------

import { supabase } from '../services/supabase';
import { esErrorDeEsquema, textoErrorDeEsquema } from './errores';
import { leerCola, agregarACola, reemplazarEnCola, obtenerDeCola, borrarDeCola, leerMeta, guardarMeta } from './db';

const TIMEOUT_MS = 15000;
const INTERVALO_REINTENTO_MS = 30000;

// --- Estado observable (para la interfaz) -----------------------------------

let estado = {
  enLinea: typeof navigator === 'undefined' ? true : navigator.onLine,
  pendientes: 0,
  sincronizando: false,
  ultimaSync: null,
  ultimoError: null,
  esquema: false, // la base de datos está desactualizada (falta una tabla o columna)
  // Sube cuando los datos pudieron cambiar por una sincronización; las páginas
  // lo usan para volver a cargar su información.
  version: 0,
};
const oyentes = new Set();

function cambiar(parcial) {
  const siguiente = { ...estado, ...parcial };
  const igual = Object.keys(siguiente).every((k) => siguiente[k] === estado[k]);
  if (igual) return;
  estado = siguiente;
  oyentes.forEach((fn) => fn());
}

export const obtenerEstado = () => estado;

export function suscribir(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/** Avisa a las pantallas abiertas que los datos locales cambiaron (para que se vuelvan a leer). */
export function notificarCambioLocal() {
  cambiar({ version: estado.version + 1 });
}

export function marcarConexion(enLinea) {
  cambiar({ enLinea });
}

// --- Utilidades de red -------------------------------------------------------

export function conTimeout(promesa, ms = TIMEOUT_MS) {
  let temporizador;
  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error('timeout de red')), ms);
  });
  return Promise.race([Promise.resolve(promesa), limite]).finally(() => clearTimeout(temporizador));
}

export function esErrorDeRed(err) {
  if (!err) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const msg = String(err.message || err);
  if ([0, 502, 503, 504].includes(err.status)) return true;
  return (
    err.name === 'TypeError' ||
    err.name === 'AbortError' ||
    /failed to fetch|networkerror|network request|load failed|timeout|timed out|offline|ECONN/i.test(msg)
  );
}

function esErrorDeSesion(err) {
  const msg = String(err?.message || '');
  return err?.status === 401 || err?.code === 'PGRST301' || /JWT (expired|invalid)/i.test(msg);
}

// --- Cola de cambios ---------------------------------------------------------

async function actualizarConteo() {
  const cola = await leerCola();
  cambiar({ pendientes: cola.length });
  return cola;
}

export async function hayPendientesDe(tabla) {
  const cola = await leerCola();
  return cola.some((op) => op.tabla === tabla);
}

/**
 * Anota un cambio para subirlo al servidor. Junta cambios repetidos sobre el
 * mismo registro para no llenar la cola.
 *   op = { tabla, tipo: 'upsert' | 'patch' | 'delete', idFila, fila?, cambios?, conflicto? }
 */
export async function encolar(op) {
  const cola = await leerCola();
  const previas = cola.filter((o) => o.tabla === op.tabla && o.idFila === op.idFila);

  if (op.tipo === 'delete') {
    // Si el registro nunca llegó a subirse, sus cambios pendientes ya no importan.
    for (const p of previas) await borrarDeCola(p.id);
    await agregarACola({ ...op, rev: 1, creadoEn: Date.now() });
  } else if (op.tipo === 'upsert') {
    const previa = previas.find((p) => p.tipo === 'upsert');
    if (previa) await reemplazarEnCola({ ...previa, fila: op.fila, rev: previa.rev + 1 });
    else await agregarACola({ ...op, rev: 1, creadoEn: Date.now() });
  } else if (op.tipo === 'patch') {
    const upsertPrevio = previas.find((p) => p.tipo === 'upsert');
    const patchPrevio = previas.find((p) => p.tipo === 'patch');
    if (upsertPrevio) {
      await reemplazarEnCola({ ...upsertPrevio, fila: { ...upsertPrevio.fila, ...op.cambios }, rev: upsertPrevio.rev + 1 });
    } else if (patchPrevio) {
      await reemplazarEnCola({ ...patchPrevio, cambios: { ...patchPrevio.cambios, ...op.cambios }, rev: patchPrevio.rev + 1 });
    } else {
      await agregarACola({ ...op, rev: 1, creadoEn: Date.now() });
    }
  }

  await actualizarConteo();
  if (navigator.onLine !== false) vaciarCola();
}

async function ejecutar(op) {
  const t = supabase.from(op.tabla);
  if (op.tipo === 'upsert') return t.upsert(op.fila, { onConflict: op.conflicto || 'id' });
  if (op.tipo === 'patch') return t.update(op.cambios).eq('id', op.idFila);
  if (op.tipo === 'delete') return t.delete().eq('id', op.idFila);
  return { error: new Error(`Operación desconocida: ${op.tipo}`) };
}

async function registrarErrorPermanente(op, err) {
  const lista = (await leerMeta('errores')) || [];
  lista.unshift({
    cuando: new Date().toISOString(),
    tabla: op.tabla,
    tipo: op.tipo,
    mensaje: err?.message || String(err),
    codigo: err?.code || null,
  });
  await guardarMeta('errores', lista.slice(0, 20));
  console.error(`[sync] Se descartó un cambio en "${op.tabla}" porque el servidor lo rechazó:`, err);
}

let vaciando = null;
let solicitudNueva = false;

/**
 * Sube los cambios pendientes, en orden. Es seguro llamarla muchas veces:
 * si ya hay una subida en curso, se une a ella.
 */
export function vaciarCola() {
  if (vaciando) {
    solicitudNueva = true;
    return vaciando;
  }
  if (navigator.onLine === false) {
    return actualizarConteo().then(() => ({ pendientes: estado.pendientes }));
  }
  vaciando = (async () => {
    let procesadas = 0;
    let habiaAntiguas = false; // cambios que esperaron (p. ej. hechos sin internet)
    let sinRed = false;
    let errorTexto = null;
    let esquemaViejo = false;

    cambiar({ sincronizando: true });
    try {
      do {
        solicitudNueva = false;
         
        while (true) {
          const cola = await leerCola();
          if (cola.length === 0) break;
          const op = cola[0];

          let resultado;
          try {
            resultado = await conTimeout(ejecutar(op));
          } catch (e) {
            resultado = { error: e };
          }

          if (resultado?.error) {
            const err = resultado.error;
            if (esErrorDeRed(err)) {
              sinRed = true;
              break;
            }
            if (esErrorDeSesion(err)) {
              errorTexto = 'Tu sesión venció. Vuelve a entrar para terminar de sincronizar.';
              break;
            }
            if (esErrorDeEsquema(err)) {
              // No se descarta: la base de datos está desactualizada. El cambio queda guardado en la cola
              // y se envía solo cuando se ejecute supabase/schema.sql.
              errorTexto = textoErrorDeEsquema(err);
              esquemaViejo = true;
              break;
            }
            await registrarErrorPermanente(op, err);
            errorTexto = `Un cambio en "${op.tabla}" fue rechazado por el servidor.`;
            await borrarDeCola(op.id);
            continue;
          }

          // Si el registro se volvió a editar mientras subía, se conserva en cola.
          const actual = await obtenerDeCola(op.id);
          if (actual && actual.rev === op.rev) await borrarDeCola(op.id);
          procesadas += 1;
          if (Date.now() - (op.creadoEn || 0) > 4000) habiaAntiguas = true;
        }
      } while (solicitudNueva && !sinRed && !errorTexto);
    } finally {
      try {
        const cola = await leerCola();
        cambiar({
          sincronizando: false,
          pendientes: cola.length,
          enLinea: sinRed ? false : navigator.onLine !== false,
          ultimoError: errorTexto,
          esquema: esquemaViejo,
          ultimaSync: procesadas > 0 && cola.length === 0 ? Date.now() : estado.ultimaSync,
          version: habiaAntiguas ? estado.version + 1 : estado.version,
        });
      } finally {
        vaciando = null;
      }
    }
    return { pendientes: estado.pendientes };
  })();
  return vaciando;
}

// --- Arranque ---------------------------------------------------------------

let iniciado = false;
let intervalo = null;

export function iniciarSync() {
  if (iniciado || typeof window === 'undefined') return;
  iniciado = true;

  const alVolverInternet = async () => {
    cambiar({ enLinea: true });
    await vaciarCola();
    // Aunque no hubiera nada pendiente, se avisa a las páginas para que
    // descarguen lo que pudo cambiar en otros dispositivos mientras no había red.
    cambiar({ version: estado.version + 1 });
  };

  window.addEventListener('online', alVolverInternet);
  window.addEventListener('offline', () => cambiar({ enLinea: false }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine !== false && estado.pendientes > 0) {
      vaciarCola();
    }
  });

  intervalo = setInterval(() => {
    if (navigator.onLine !== false && estado.pendientes > 0) vaciarCola();
  }, INTERVALO_REINTENTO_MS);

  actualizarConteo().then(() => {
    if (navigator.onLine !== false && estado.pendientes > 0) vaciarCola();
  });
}

export function detenerSync() {
  if (intervalo) clearInterval(intervalo);
  intervalo = null;
  iniciado = false;
}

export async function reiniciarEstado() {
  cambiar({ pendientes: 0, sincronizando: false, ultimoError: null, ultimaSync: null });
}
