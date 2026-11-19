import { useLocation } from 'react-router-dom';
import { SECCIONES } from '../../lib/secciones';

/** Encabezado editorial de la sección actual (no se muestra en el Dashboard ni en las vistas de detalle). */
export default function EncabezadoPagina() {
  const { pathname } = useLocation();
  const s = SECCIONES[pathname];
  if (!s) return null;
  const fecha = new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <header key={pathname} className="encabezado mb-6 sm:mb-8">
      <div className="encabezado-linea">
        <span className="font-mono text-t-micro text-primary">{s.n}</span>
        <span className="font-mono text-t-micro uppercase tracking-[0.14em] text-textSecondary">{s.grupo}</span>
        <span className="encabezado-regla" aria-hidden="true"><i /></span>
        <span className="font-mono text-t-micro text-textSecondary">{fecha}</span>
      </div>
      <h1 className="encabezado-titulo"><span>{s.titulo}</span></h1>
      <p className="encabezado-bajada">{s.bajada}</p>
    </header>
  );
}
