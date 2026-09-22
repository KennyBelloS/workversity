// Clasificación de errores del servidor (funciones puras, fáciles de probar).

/** La base de datos está desactualizada: falta una tabla o una columna que la app ya usa. */
export function esErrorDeEsquema(err) {
  if (!err) return false;
  const msg = String(err.message || '');
  return (
    ['PGRST204', 'PGRST205', '42703', '42P01'].includes(err.code) ||
    /schema cache|could not find the .* column|column .* does not exist|relation .* does not exist/i.test(msg)
  );
}

/** Texto para la persona: qué falta y qué hacer. */
export function textoErrorDeEsquema(err) {
  const msg = String(err?.message || '');
  const columna = msg.match(/'([^']+)' column of '([^']+)'/i);
  const tabla = msg.match(/table '(?:public\.)?([^']+)'/i) || msg.match(/relation "?(?:public\.)?([^"\s]+)"? does not exist/i);
  const que = columna ? `la columna «${columna[1]}» de «${columna[2]}»` : tabla ? `la tabla «${tabla[1]}»` : 'una tabla o columna nueva';
  return `A tu base de datos le falta ${que}. Ejecuta supabase/schema.sql en el SQL Editor de Supabase: este cambio está guardado y se enviará solo después.`;
}
