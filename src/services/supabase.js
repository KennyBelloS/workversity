import { createClient } from '@supabase/supabase-js';

// Limpia errores típicos al copiar/pegar: espacios, comillas, barra final o rutas extra
// (p. ej. "https://xxx.supabase.co/" o "https://xxx.supabase.co/rest/v1" causan "Invalid path specified in request URL").
const limpiarUrl = (v) =>
  (v || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\/(rest|auth|storage|functions)\/v1.*$/i, '')
    .replace(/\/+$/, '');
const supabaseUrl = limpiarUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');

const sonPlaceholders =
  !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('tu-proyecto') || supabaseAnonKey.includes('tu-clave');

export let supabaseConfigurado = false;
let clienteSupabase;

try {
  if (sonPlaceholders) {
    throw new Error('Faltan las variables de entorno de Supabase');
  }
  clienteSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  supabaseConfigurado = true;
} catch (err) {
  console.error(
    '[Supabase] No se pudo conectar: ' +
      err.message +
      '. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver .env.example). ' +
      'En Vercel: Project Settings → Environment Variables → y vuelve a desplegar.'
  );
  // Cliente "vacío" para que importar este archivo nunca rompa la app; la
  // pantalla <ConfigError /> explica qué falta.
  const sinConexion = async () => ({ data: null, error: new Error('Supabase no está configurado') });
  const consulta = () => {
    const q = { select: () => q, eq: () => q, gte: () => q, order: () => q, then: (r) => r({ data: null, error: new Error('Supabase no está configurado') }) };
    return q;
  };
  clienteSupabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: sinConexion,
      signUp: sinConexion,
      signOut: async () => ({ error: null }),
    },
    from: consulta,
  };
}

export const supabase = clienteSupabase;
export { supabaseUrl };
