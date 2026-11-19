// Acciones de administrador: todas pasan por una función del servidor (Edge Function), nunca
// directo con la clave pública. Así: 1) la validación de "¿este usuario sí es admin?" la hace
// el servidor con el token real (no se puede falsear desde el navegador), y 2) ninguna acción
// sensible (borrar cuenta, resetear contraseña de otra persona) queda al alcance del cliente.
import { supabase } from './supabase';
import { conTimeout } from '../offline/sync';

export async function listarUsuarios() {
  const { data, error } = await conTimeout(
    supabase.from('perfiles').select('id, nombre, correo, created_at, ultimo_ingreso, total_ingresos, es_admin, puntos, suspendida')
  );
  if (error) throw error;
  return data || [];
}

/** Se llama una vez al iniciar sesión: registra la entrada para las estadísticas del admin. */
export async function registrarIngreso() {
  try {
    await conTimeout(supabase.rpc('registrar_ingreso'));
  } catch {
    // No es crítico: si falla (sin conexión, función aún no creada), no debe bloquear el login.
  }
}

async function llamarAccionAdmin(accion, userId, extra = {}) {
  const { data, error } = await conTimeout(supabase.functions.invoke('admin-usuarios', { body: { accion, userId, ...extra } }));
  if (error) throw new Error(data?.error || error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export const suspenderUsuario = (userId) => llamarAccionAdmin('suspender', userId);
export const reactivarUsuario = (userId) => llamarAccionAdmin('reactivar', userId);
export const eliminarUsuario = (userId) => llamarAccionAdmin('eliminar', userId);
export const resetearPasswordUsuario = (userId, nuevaPassword) => llamarAccionAdmin('resetear_password', userId, { nuevaPassword });
