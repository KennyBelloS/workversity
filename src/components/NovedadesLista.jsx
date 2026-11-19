import Glifo from './Glifo';

const TIPOS = {
  nuevo: { icono: '✨', etiqueta: 'Nuevo', color: 'rgb(var(--primary))' },
  mejora: { icono: '🔧', etiqueta: 'Mejora', color: 'rgb(var(--textPrimary))' },
  arreglo: { icono: '🐞', etiqueta: 'Arreglo', color: 'rgb(var(--success))' },
};

/** Lista de cambios de una versión, agrupada por tipo. */
export function CambiosDeVersion({ release }) {
  return (
    <div className="space-y-3">
      {Object.entries(TIPOS).map(([tipo, info]) => {
        const items = release.cambios.filter((c) => c.t === tipo);
        if (items.length === 0) return null;
        return (
          <div key={tipo}>
            <p className="rotulo mb-2 flex items-center gap-1.5" style={{ color: info.color, '--punto': info.color }}><Glifo e={info.icono} size={12} /> {info.etiqueta}</p>
            <ul className="space-y-1.5">
              {items.map((c) => <li key={c.x} className="flex gap-2 text-t-pie leading-snug"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: info.color }} /><span>{c.x}</span></li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function fechaBonita(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Historial completo (acordeón). */
export default function NovedadesLista({ releases, abrirPrimera = true }) {
  return (
    <div className="divide-y divide-black/5">
      {releases.map((r, i) => (
        <details key={r.version} open={abrirPrimera && i === 0} className="py-2.5">
          <summary className="cursor-pointer list-none marker:hidden">
            <span className="text-sm font-extrabold">Versión {r.version}</span>
            <span className="ml-2 text-t-micro text-textSecondary">{fechaBonita(r.fecha)}</span>
            <span className="block text-xs text-textSecondary">{r.titulo}</span>
          </summary>
          <div className="mt-2.5"><CambiosDeVersion release={r} /></div>
        </details>
      ))}
    </div>
  );
}
