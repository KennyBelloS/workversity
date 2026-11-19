import { useState } from 'react';
import { Database, ClipboardCopy, ExternalLink, Check } from 'lucide-react';
import { copiarSqlActualizacion, enlaceSqlEditor } from '../../lib/sqlActualizacion';

/** Ayuda para actualizar la base de datos cuando la app avisa que le falta una tabla o columna. */
export default function BaseDatosCard() {
  const [estado, setEstado] = useState('');
  const copiar = async () => {
    try { await copiarSqlActualizacion(); setEstado('copiado'); setTimeout(() => setEstado(''), 3000); } catch { setEstado('error'); }
  };
  return (
    <section className="ficha">
      <p className="ficha-cabecera !mb-3 !justify-start gap-2 rotulo"><Database size={16} /> Base de datos</p>
      <p className="mb-3 text-xs text-textSecondary">
        Si la app dice que a tu base de datos le falta una tabla o columna, copia el SQL de actualización, pégalo en el SQL Editor de Supabase y pulsa <b>Run</b>. Es seguro repetirlo: no borra datos.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <button onClick={copiar} className="boton-secundario justify-center">
          {estado === 'copiado' ? <Check size={15} /> : <ClipboardCopy size={15} />} {estado === 'copiado' ? '¡Copiado!' : 'Copiar SQL de actualización'}
        </button>
        <a href={enlaceSqlEditor()} target="_blank" rel="noreferrer" className="boton-secundario justify-center !text-textSecondary"><ExternalLink size={15} /> Abrir el SQL Editor</a>
      </div>
      {estado === 'error' && <p className="mt-2 text-xs font-semibold text-danger">No se pudo copiar. Abre supabase/schema.sql en el Bloc de notas y copia su contenido.</p>}
    </section>
  );
}
