export default function ErrorCarga({ mensaje }) {
  if (!mensaje) return null;
  const faltaEsquema = /does not exist|schema cache|could not find/i.test(mensaje);
  return (
    <div className="mb-4 rounded-sm2 bg-dangerSoft px-4 py-3 text-sm font-semibold text-danger">
      <p>No se pudo cargar la información: {mensaje}</p>
      {faltaEsquema && (
        <p className="mt-1 text-xs font-medium">
          Parece que a la base de datos le faltan tablas o columnas. Ejecuta el archivo <code>supabase/schema.sql</code> en
          el SQL Editor de Supabase (es seguro correrlo varias veces).
        </p>
      )}
    </div>
  );
}
