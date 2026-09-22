// Recuerda quién inició sesión en este dispositivo, para poder abrir la app
// sin internet (Supabase no puede renovar el token de acceso sin red).

import { limpiarTodo, leerMeta, guardarMeta } from './db';
import { reiniciarEstado } from './sync';

const CLAVE = 'workversity:usuario';

export function leerUsuarioLocal() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) || 'null');
  } catch {
    return null;
  }
}

export function guardarUsuarioLocal(user) {
  if (!user?.id) return;
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ id: user.id, email: user.email || '' }));
  } catch {
    /* almacenamiento lleno o bloqueado: no es crítico */
  }
}

export function borrarUsuarioLocal() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* nada */
  }
}

/** Si en este dispositivo había datos de OTRA cuenta, se borran antes de usar los de esta. */
export async function prepararCopiaLocal(userId) {
  const duenio = await leerMeta('userId');
  if (duenio && duenio !== userId) {
    await limpiarTodo();
    await reiniciarEstado();
  }
  if (duenio !== userId) await guardarMeta('userId', userId);
}

export async function borrarCopiaLocal() {
  borrarUsuarioLocal();
  await limpiarTodo();
  await reiniciarEstado();
}
