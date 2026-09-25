// Espacios compartidos: llamadas directas a Supabase (esta función necesita conexión,
// porque coordina en tiempo real con otras personas; no usa la cola offline).
import { supabase } from './supabase';
import { nuevoId } from '../offline/repositorio';
import { mensajeAmigable } from '../lib/erroresAmigables';

/**
 * Ejecuta una llamada a Supabase y, pase lo que pase, deja un error con un mensaje claro:
 * - si Supabase devuelve `{ error }` (lo normal), se traduce ese error;
 * - si la llamada explota de plano (p. ej. sin internet, el fetch ni siquiera llega a responder
 *   y supabase-js no alcanza a envolver el fallo en `{ error }`), igual se atrapa aquí y se
 *   traduce — así ningún "TypeError: NetworkError…" se escapa crudo hacia la pantalla.
 */
async function llamar(promesa, contexto) {
  try {
    const { data, error } = await promesa;
    if (error) throw new Error(mensajeAmigable(error, contexto));
    return data;
  } catch (err) {
    if (err instanceof Error && err.__amigable) throw err;
    const amigable = new Error(mensajeAmigable(err, contexto));
    amigable.__amigable = true;
    throw amigable;
  }
}

/**
 * Como el borrado normal de Supabase no avisa si las políticas de seguridad lo bloquearon en
 * silencio (responde "OK" sin borrar nada), se pide de vuelta la fila borrada: si no llega
 * ninguna, se avisa con un error real en vez de dejar que el registro "reviva" después.
 */
async function eliminarConfirmando(tabla, id, contexto) {
  const data = await llamar(supabase.from(tabla).delete().eq('id', id).select('id'), contexto);
  if (!data || data.length === 0) throw new Error(`No se pudo ${contexto}: puede que ya no tengas permiso, o que la base de datos no esté al día (revisa supabase/schema.sql).`);
}

export async function crearEspacio(nombre) {
  return llamar(supabase.rpc('crear_espacio', { p_nombre: nombre.trim() }), 'crear el espacio');
}

/** Devuelve el espacio (con `ya_era_miembro` si ya estabas dentro). */
export async function unirseAEspacio(codigo) {
  return llamar(supabase.rpc('unirse_a_espacio', { p_codigo: codigo }), 'unirte con ese código');
}

/** Espacios de los que soy miembro, con mi propia fila de membresía. */
export async function listarMisEspacios(userId) {
  const [espacios, miMembresia] = await Promise.all([
    llamar(supabase.from('espacios').select('*').order('created_at', { ascending: true }), 'cargar tus espacios'),
    llamar(supabase.from('espacio_miembros').select('*').eq('user_id', userId), 'cargar tu membresía'),
  ]);
  // La base de datos ya solo debería devolver los espacios donde soy miembro (así lo hacen las
  // políticas de seguridad), pero filtramos también aquí por si acaso: nunca mostrar un espacio
  // ajeno solo porque una consulta devolvió más filas de las esperadas.
  return (espacios || [])
    .map((e) => ({ ...e, miMembresia: (miMembresia || []).find((m) => m.espacio_id === e.id) }))
    .filter((e) => e.miMembresia);
}

export async function listarMiembros(espacioId) {
  const data = await llamar(supabase.from('espacio_miembros').select('*').eq('espacio_id', espacioId), 'cargar los miembros');
  return data || [];
}

export async function listarPerfilesDe(userIds) {
  if (userIds.length === 0) return [];
  const data = await llamar(supabase.from('perfiles').select('*').in('id', userIds), 'cargar los perfiles');
  return data || [];
}

export async function cambiarRolMiembro(miembroId, rol) {
  await llamar(supabase.from('espacio_miembros').update({ rol }).eq('id', miembroId), 'cambiar el rol');
}
export async function quitarMiembro(miembroId) {
  await eliminarConfirmando('espacio_miembros', miembroId, 'quitar a esa persona');
}
/** Borra el espacio completo (y, en cascada, sus miembros y solicitudes). Solo puede un admin. */
export async function eliminarEspacio(espacioId) {
  await eliminarConfirmando('espacios', espacioId, 'eliminar el espacio');
}

export async function listarSolicitudes(espacioId) {
  const data = await llamar(supabase.from('solicitudes_horario').select('*').eq('espacio_id', espacioId), 'cargar las solicitudes');
  return data || [];
}
export async function crearSolicitud(solicitud) {
  const fila = { id: nuevoId(), estado: 'pendiente', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...solicitud };
  await llamar(supabase.from('solicitudes_horario').insert(fila), 'enviar la solicitud');
  return fila;
}
export async function responderSolicitud(id, estado) {
  await llamar(supabase.from('solicitudes_horario').update({ estado, updated_at: new Date().toISOString() }).eq('id', id), 'responder la solicitud');
}
export async function eliminarSolicitud(id) {
  await eliminarConfirmando('solicitudes_horario', id, 'eliminar la solicitud');
}
