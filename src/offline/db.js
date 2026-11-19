// ---------------------------------------------------------------------------
// Almacenamiento local (IndexedDB) para el modo sin conexión.
//
// Guarda tres cosas:
//   • "tablas": una copia local de cada tabla de Supabase (clave = nombre de tabla)
//   • "cola":   los cambios hechos sin internet, pendientes de subir (outbox)
//   • "meta":   datos sueltos (de qué usuario es esta copia, errores de sync…)
//
// Si el navegador no permite IndexedDB (p. ej. modo privado de algunos
// navegadores) se usa memoria como respaldo: la app sigue funcionando, pero
// sin persistir entre recargas.
// ---------------------------------------------------------------------------

const NOMBRE_BD = 'workversity-offline';
const VERSION_BD = 1;

let promesaBd = null;
const memoria = { tablas: new Map(), cola: new Map(), meta: new Map(), siguienteId: 1 };
let usarMemoria = false;

function abrir() {
  if (usarMemoria) return Promise.resolve(null);
  if (promesaBd) return promesaBd;
  promesaBd = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      usarMemoria = true;
      return resolve(null);
    }
    let req;
    try {
      req = indexedDB.open(NOMBRE_BD, VERSION_BD);
    } catch {
      usarMemoria = true;
      return resolve(null);
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('tablas')) db.createObjectStore('tablas');
      if (!db.objectStoreNames.contains('cola')) db.createObjectStore('cola', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
    };
    req.onsuccess = () => {
      const db = req.result;
      // Safari/iOS a veces cierra solo una conexión que lleva un rato sin usarse. Sin esto,
      // la siguiente operación fallaba con "The database connection is closing" (se veía en
      // pantalla como un error crudo). Al detectarlo, se olvida la conexión guardada para que
      // la próxima llamada abra una nueva en vez de seguir usando la que ya se cerró.
      db.onclose = () => { promesaBd = null; };
      db.onversionchange = () => { db.close(); promesaBd = null; };
      resolve(db);
    };
    req.onerror = () => {
      usarMemoria = true;
      resolve(null);
    };
    req.onblocked = () => {
      usarMemoria = true;
      resolve(null);
    };
  });
  return promesaBd;
}

function envolver(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function operar(store, modo, fn, reintentar = true) {
  const db = await abrir();
  if (!db) return undefined;
  let tx;
  try {
    tx = db.transaction(store, modo);
  } catch (err) {
    // Si la conexión se cerró justo entre abrir() y crear la transacción (carrera rara pero
    // posible), se olvida y se reintenta UNA vez con una conexión nueva, en vez de dejar
    // pasar el error crudo hasta la pantalla.
    if (reintentar && /closing|closed/i.test(err?.message || '')) {
      promesaBd = null;
      return operar(store, modo, fn, false);
    }
    throw err;
  }
  const resultado = await fn(tx.objectStore(store));
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  return resultado;
}

// --- Tablas (copia local) --------------------------------------------------

export async function leerTabla(tabla) {
  const db = await abrir();
  if (!db) return structuredClone(memoria.tablas.get(tabla) || []);
  return (await operar('tablas', 'readonly', (s) => envolver(s.get(tabla)))) || [];
}

export async function guardarTabla(tabla, filas) {
  const db = await abrir();
  if (!db) {
    memoria.tablas.set(tabla, structuredClone(filas));
    return;
  }
  await operar('tablas', 'readwrite', (s) => envolver(s.put(filas, tabla)));
}

// --- Cola de cambios pendientes ---------------------------------------------

export async function leerCola() {
  const db = await abrir();
  if (!db) return [...memoria.cola.values()].sort((a, b) => a.id - b.id);
  const todas = await operar('cola', 'readonly', (s) => envolver(s.getAll()));
  return (todas || []).sort((a, b) => a.id - b.id);
}

export async function agregarACola(op) {
  const db = await abrir();
  if (!db) {
    const id = memoria.siguienteId++;
    memoria.cola.set(id, { ...op, id });
    return id;
  }
  return operar('cola', 'readwrite', (s) => envolver(s.add(op)));
}

export async function reemplazarEnCola(op) {
  const db = await abrir();
  if (!db) {
    memoria.cola.set(op.id, op);
    return;
  }
  await operar('cola', 'readwrite', (s) => envolver(s.put(op)));
}

export async function obtenerDeCola(id) {
  const db = await abrir();
  if (!db) return memoria.cola.get(id) || null;
  return (await operar('cola', 'readonly', (s) => envolver(s.get(id)))) || null;
}

export async function borrarDeCola(id) {
  const db = await abrir();
  if (!db) {
    memoria.cola.delete(id);
    return;
  }
  await operar('cola', 'readwrite', (s) => envolver(s.delete(id)));
}

// --- Meta -------------------------------------------------------------------

export async function leerMeta(clave) {
  const db = await abrir();
  if (!db) return memoria.meta.get(clave) ?? null;
  return (await operar('meta', 'readonly', (s) => envolver(s.get(clave)))) ?? null;
}

export async function guardarMeta(clave, valor) {
  const db = await abrir();
  if (!db) {
    memoria.meta.set(clave, valor);
    return;
  }
  await operar('meta', 'readwrite', (s) => envolver(s.put(valor, clave)));
}

// --- Limpieza total (al cerrar sesión o cambiar de usuario) -----------------

export async function limpiarTodo() {
  memoria.tablas.clear();
  memoria.cola.clear();
  memoria.meta.clear();
  const db = await abrir();
  if (!db) return;
  for (const store of ['tablas', 'cola', 'meta']) {
    await operar(store, 'readwrite', (s) => envolver(s.clear()));
  }
}
