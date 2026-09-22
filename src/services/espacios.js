// Espacios compartidos: llamadas directas a Supabase (esta función necesita conexión,
// porque coordina en tiempo real con otras personas; no usa la cola offline).
import { supabase } from './supabase';
import { nuevoId } from '../offline/repositorio';

function opsError(error, contexto) {
  if (error) throw new Error(error.message || `No se pudo ${contexto}`);
}

export async function crearEspacio(nombre) {
  const { data, error } = await supabase.rpc('crear_espacio', { p_nombre: nombre.trim() });
  opsError(error, 'crear el espacio');
  return data;
}

/** Devuelve el espacio (con `ya_era_miembro` si ya estabas dentro). */
export async function unirseAEspacio(codigo) {
  const { data, error } = await supabase.rpc('unirse_a_espacio', { p_codigo: codigo });
  opsError(error, 'unirte con ese código');
  return data;
}

/** Espacios de los que soy miembro, con mi propia fila de membresía. */
export async function listarMisEspacios(userId) {
  const [{ data: espacios, error: e1 }, { data: miMembresia, error: e2 }] = await Promise.all([
    supabase.from('espacios').select('*').order('created_at', { ascending: true }),
    supabase.from('espacio_miembros').select('*').eq('user_id', userId),
  ]);
  opsError(e1, 'cargar tus espacios');
  opsError(e2, 'cargar tu membresía');
  // La base de datos ya solo debería devolver los espacios donde soy miembro (así lo hacen las
  // políticas de seguridad), pero filtramos también aquí por si acaso: nunca mostrar un espacio
  // ajeno solo porque una consulta devolvió más filas de las esperadas.
  return (espacios || [])
    .map((e) => ({ ...e, miMembresia: (miMembresia || []).find((m) => m.espacio_id === e.id) }))
    .filter((e) => e.miMembresia);
}

export async function listarMiembros(espacioId) {
  const { data, error } = await supabase.from('espacio_miembros').select('*').eq('espacio_id', espacioId);
  opsError(error, 'cargar los miembros');
  return data || [];
}

export async function listarPerfilesDe(userIds) {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase.from('perfiles').select('*').in('id', userIds);
  opsError(error, 'cargar los perfiles');
  return data || [];
}

export async function cambiarRolMiembro(miembroId, rol) {
  const { error } = await supabase.from('espacio_miembros').update({ rol }).eq('id', miembroId);
  opsError(error, 'cambiar el rol');
}
export async function quitarMiembro(miembroId) {
  const { error } = await supabase.from('espacio_miembros').delete().eq('id', miembroId);
  opsError(error, 'quitar a esa persona');
}

export async function listarSolicitudes(espacioId) {
  const { data, error } = await supabase.from('solicitudes_horario').select('*').eq('espacio_id', espacioId);
  opsError(error, 'cargar las solicitudes');
  return data || [];
}
export async function crearSolicitud(solicitud) {
  const fila = { id: nuevoId(), estado: 'pendiente', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...solicitud };
  const { error } = await supabase.from('solicitudes_horario').insert(fila);
  opsError(error, 'enviar la solicitud');
  return fila;
}
export async function responderSolicitud(id, estado) {
  const { error } = await supabase.from('solicitudes_horario').update({ estado, updated_at: new Date().toISOString() }).eq('id', id);
  opsError(error, 'responder la solicitud');
}
export async function eliminarSolicitud(id) {
  const { error } = await supabase.from('solicitudes_horario').delete().eq('id', id);
  opsError(error, 'eliminar la solicitud');
}
