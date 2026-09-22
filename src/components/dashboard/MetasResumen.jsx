import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';
import { listarMetas, listarMovimientos } from '../../services/finanzas';
import { listarAvances } from '../../services/avances';
import { estadoProgreso } from '../../lib/progresoMeta';
import { currencyFormat } from '../../lib/constants';
import { useSyncEstado } from '../../hooks/useSyncEstado';

const esProgreso = (m) => m.tipo === 'progreso';

/** Mini resumen de tus 2 metas con más avance reciente (ahorro o progreso), para el Dashboard. */
export default function MetasResumen() {
  const { version } = useSyncEstado();
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    Promise.all([listarMetas(), listarMovimientos(), listarAvances().catch(() => ({ lista: [] }))]).then(([metas, movimientos, av]) => setDatos({ metas, movimientos, avances: av.lista || [] }));
  }, [version]);

  if (!datos) return null;
  const { metas, movimientos, avances } = datos;
  if (metas.length === 0) {
    return (
      <div className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-1 flex items-center gap-2 text-sm font-bold"><Target size={16} /> Tus metas</p>
        <p className="py-3 text-xs text-textSecondary">Crea una meta de ahorro o de progreso (leer un libro, estudiar…) para verla aquí.</p>
        <Link to="/metas" className="text-xs font-bold text-primary">Crear una meta →</Link>
      </div>
    );
  }
  const filas = metas.map((m) => {
    if (esProgreso(m)) {
      const e = estadoProgreso({ meta: m, avances: avances.filter((a) => a.meta_id === m.id) });
      return { m, pct: e.pct, texto: `${Math.round(e.total * 10) / 10} de ${e.objetivo} ${m.unidad || ''}`, ultima: avances.filter((a) => a.meta_id === m.id).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]?.fecha || m.created_at };
    }
    const total = movimientos.filter((mo) => mo.type === 'ahorro' && mo.category === m.categoria_vinculada).reduce((s, mo) => s + Number(mo.amount), 0);
    return { m, pct: Math.min(total / Number(m.target_amount || 1), 1), texto: `${currencyFormat.format(total)} de ${currencyFormat.format(m.target_amount)}`, ultima: m.created_at };
  }).sort((a, b) => new Date(b.ultima) - new Date(a.ultima)).slice(0, 2);

  return (
    <div className="rounded-md2 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold"><Target size={16} /> Tus metas</p>
        <Link to="/metas" className="text-xs font-bold text-primary">Ver todas</Link>
      </div>
      <div className="space-y-3">
        {filas.map(({ m, pct, texto }) => (
          <Link key={m.id} to="/metas" className="block">
            <div className="mb-1 flex items-center justify-between text-xs font-bold"><span className="truncate">{esProgreso(m) ? '📖 ' : '💰 '}{m.title}</span><span style={{ color: m.color_value }}>{Math.round(pct * 100)}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full transition-all" style={{ width: `${pct * 100}%`, backgroundColor: m.color_value }} /></div>
            <p className="mt-1 text-[11px] text-textSecondary">{texto}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
