// Acceso al SQL completo de la base de datos (supabase/schema.sql) desde la app,
// para copiarlo con un botón (así no se daña al copiar y pegar desde un chat o un archivo).

/** Texto completo de supabase/schema.sql (se carga solo cuando se necesita). */
export async function leerSqlActualizacion() {
  const modulo = await import('../../supabase/schema.sql?raw');
  return modulo.default;
}

/** Enlace directo al SQL Editor de tu proyecto de Supabase (usa VITE_SUPABASE_URL). */
export function enlaceSqlEditor() {
  try {
    const host = new URL(import.meta.env.VITE_SUPABASE_URL).hostname; // abcdxyz.supabase.co
    const ref = host.split('.')[0];
    return ref ? `https://supabase.com/dashboard/project/${ref}/sql/new` : 'https://supabase.com/dashboard';
  } catch {
    return 'https://supabase.com/dashboard';
  }
}

export async function copiarSqlActualizacion() {
  const sql = await leerSqlActualizacion();
  await navigator.clipboard.writeText(sql);
  return sql.length;
}
