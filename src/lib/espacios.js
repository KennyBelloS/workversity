// Espacios compartidos (pareja, compañeros de piso, grupo de estudio…): funciones puras.
// Dos roles: 'admin' (creó el espacio o fue ascendido; acceso total) y 'miembro'
// (mismo acceso a las funciones del espacio; pensado para el uso del día a día).
export const esAdmin = (miembro) => miembro?.rol === 'admin';

export function normalizarCodigo(codigo) {
  return String(codigo || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}
export function codigoValido(codigo) {
  return /^[A-Z0-9]{4,10}$/.test(normalizarCodigo(codigo));
}

/** Nombre para mostrar de un miembro (tu propio perfil o el de otra persona del espacio). */
export function nombreDeMiembro(miembro, perfiles) {
  if (miembro.esYo) return 'Tú';
  return perfiles.find((p) => p.id === miembro.user_id)?.nombre || 'Alguien del espacio';
}

/**
 * Junta la agenda de varias personas en una sola lista, cada evento con quién es
 * (`persona`) y su color, para pintarlos juntos en una vista compartida.
 * `agendasPorMiembro`: [{ miembro, eventos: [...eventos de agenda.js] }]
 */
export function combinarAgendas(agendasPorMiembro, perfiles) {
  return agendasPorMiembro
    .flatMap(({ miembro, eventos }) => eventos.map((ev) => ({ ...ev, persona: nombreDeMiembro(miembro, perfiles), personaId: miembro.user_id, colorPersona: miembro.color })))
    .sort((a, b) => a.inicio - b.inicio);
}

/** ¿Un rango de tiempo nuevo choca con alguno ya ocupado? (para avisar antes de pedir el espacio) */
export function seCruzaConAlgo(inicio, fin, eventosOcupados) {
  return eventosOcupados.filter((ev) => inicio < ev.fin && fin > ev.inicio);
}

/** Tabla de posiciones del espacio: cada miembro con sus puntos, ordenados de mayor a menor. */
export function tablaPosiciones(miembros, perfiles) {
  return miembros
    .map((m) => ({ ...m, nombre: nombreDeMiembro(m, perfiles), puntos: perfiles.find((p) => p.id === m.user_id)?.puntos || 0 }))
    .sort((a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre));
}

export function ordenarSolicitudes(lista) {
  const peso = { pendiente: 0, aceptada: 1, rechazada: 2 };
  return [...lista].sort((a, b) => peso[a.estado] - peso[b.estado] || new Date(b.created_at) - new Date(a.created_at));
}

/** Texto corto de para quién es una solicitud de horario. */
export function destinatarioTexto(solicitud, miembros, perfiles) {
  if (!solicitud.para_user_id) return 'Para todo el espacio';
  return `Para ${nombreDeMiembro(miembros.find((m) => m.user_id === solicitud.para_user_id) || {}, perfiles)}`;
}
