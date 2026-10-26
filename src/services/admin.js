import { supabase } from './supabase';
import { conTimeout } from '../offline/sync';

/**
 * Trae todos los perfiles registrados — solo funciona de verdad para un admin: la
 * seguridad a nivel de fila (RLS) hace que un usuario normal solo reciba su propia
 * fila aunque pida todas, así que no hace falta validar el rol aquí también.
 */
export async function listarUsuarios() {
  const { data, error } = await conTimeout(
    supabase.from('perfiles').select('id, nombre, correo, created_at, ultimo_ingreso, total_ingresos, es_admin, puntos')
  );
  if (error) throw error;
  return data || [];
}
