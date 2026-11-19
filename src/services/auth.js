import { supabase } from './supabase';
import { leerTabla, guardarTabla } from '../offline/db';
import { conTimeout, esErrorDeRed, encolar, vaciarCola, hayPendientesDe, marcarConexion } from '../offline/sync';

export async function registrarse(nombre, correo, password) {
  const { data, error } = await supabase.auth.signUp({
    email: correo,
    password,
    options: { data: { nombre } },
  });
  if (error) throw error;
  return data;
}

export async function iniciarSesion(correo, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo,
    password,
  });
  if (error) throw error;
  return data;
}

export async function cerrarSesion() {
  try {
    await conTimeout(supabase.auth.signOut(), 5000);
  } catch {
    // Sin internet, Supabase no alcanza a avisar al servidor: borramos la
    // sesión guardada en el navegador a mano.
  }
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nada */
  }
}

export async function obtenerSesion() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// El perfil se guarda también en el dispositivo para poder usarlo sin conexión.
export async function obtenerPerfil(userId) {
  if (navigator.onLine !== false) {
    try {
      await vaciarCola();
      if (!(await hayPendientesDe('perfiles'))) {
        const { data, error } = await conTimeout(
          supabase.from('perfiles').select('*').eq('id', userId).maybeSingle()
        );
        if (error) throw error;
        marcarConexion(true);
        if (data) await guardarTabla('perfiles', [data]);
        return data;
      }
    } catch (err) {
      if (!esErrorDeRed(err)) throw err;
      marcarConexion(false);
    }
  }
  const [local] = await leerTabla('perfiles');
  return local && local.id === userId ? local : null;
}

export async function actualizarPerfil(userId, cambios) {
  const filas = await leerTabla('perfiles');
  const actual = filas.find((f) => f.id === userId) || { id: userId };
  const nuevo = { ...actual, ...cambios };
  await guardarTabla('perfiles', [nuevo]);
  await encolar({ tabla: 'perfiles', tipo: 'patch', idFila: userId, cambios });
  return nuevo;
}

// Si por algún motivo el perfil no se creó al registrarse, lo crea (auto-reparación).
export async function asegurarPerfil(user) {
  if (!user?.id || navigator.onLine === false) return null;
  try {
    const { data, error } = await conTimeout(
      supabase
        .from('perfiles')
        .upsert(
          { id: user.id, nombre: user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario', correo: user.email || '' },
          { onConflict: 'id', ignoreDuplicates: true }
        )
        .select()
        .maybeSingle()
    );
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[perfil] No se pudo crear el perfil automáticamente:', err?.message || err);
    return null;
  }
}

export function suscribirseACambiosDeSesion(callback) {
  const { data } = supabase.auth.onAuthStateChange((evento, session) => {
    callback(evento, session);
  });
  return data.subscription;
}

/**
 * Pide el correo de recuperación. Primero intenta la función propia (/api/recuperar-clave, que
 * envía el correo con Resend y el diseño de Workversity). Si esa función no existe todavía (por
 * ejemplo en `npm run dev`, o si aún no se configuró en Vercel), usa el envío de Supabase.
 */
export async function solicitarRecuperacionPorCorreo(correo) {
  try {
    const r = await fetch('/api/recuperar-clave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: correo }),
    });
    const tipo = r.headers.get('content-type') || '';
    if (r.ok && tipo.includes('application/json')) return;
    if (r.status === 400 && tipo.includes('application/json')) {
      const { error } = await r.json();
      throw new Error(error || 'Escribe un correo válido.');
    }
    // 404 (sin función), 503 (sin configurar) o una respuesta HTML: se usa el respaldo.
  } catch (err) {
    if (/correo válido/i.test(err?.message || '')) throw err;
  }
  const { error } = await supabase.auth.resetPasswordForEmail(correo, {
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/nueva-clave` : undefined,
  });
  if (error) throw error;
}

export async function actualizarPassword(nuevaPassword) {
  const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
  if (error) throw error;
}
