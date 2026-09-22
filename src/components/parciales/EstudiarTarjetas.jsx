import { useMemo, useState } from 'react';
import { Check, X, RotateCcw, ThumbsUp } from 'lucide-react';
import { ordenarParaRepasar, dominioGeneral } from '../../lib/parciales';

/** Modo estudio: una tarjeta a la vez, "voltear" para ver la respuesta, y marcar si acertaste. */
export default function EstudiarTarjetas({ tarjetas, progreso, onResultado }) {
  const orden = useMemo(() => ordenarParaRepasar(tarjetas, progreso), [tarjetas, progreso]);
  const [i, setI] = useState(0);
  const [volteada, setVolteada] = useState(false);
  const dominio = dominioGeneral(tarjetas, progreso);

  if (tarjetas.length === 0) return <p className="rounded-md2 bg-white py-10 text-center text-sm text-textSecondary shadow-card">Genera tarjetas primero desde una fuente.</p>;
  if (i >= orden.length) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md2 bg-white py-12 text-center shadow-card">
        <ThumbsUp size={26} className="text-success" />
        <p className="text-sm font-bold">¡Repasaste todas las tarjetas!</p>
        <p className="text-xs text-textSecondary">Dominio general: {dominio}%</p>
        <button onClick={() => { setI(0); setVolteada(false); }} className="mt-2 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"><RotateCcw size={13} /> Repasar de nuevo</button>
      </div>
    );
  }
  const t = orden[i];
  const marcar = (acertaste) => { onResultado(t.id, acertaste); setVolteada(false); setI((x) => x + 1); };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-textSecondary"><span>Tarjeta {i + 1} de {orden.length}</span><span>Dominio: {dominio}%</span></div>
      <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(i / orden.length) * 100}%` }} /></div>
      <button onClick={() => setVolteada((v) => !v)} className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-md2 bg-white p-8 text-center shadow-card">
        <span className="text-[11px] font-bold uppercase tracking-wide text-textSecondary">{volteada ? 'Respuesta' : 'Pregunta · toca para ver la respuesta'}</span>
        <p className="text-lg font-bold">{volteada ? t.respuesta : t.pregunta}</p>
      </button>
      {volteada ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => marcar(false)} className="flex items-center justify-center gap-1.5 rounded-sm2 border border-danger/30 py-3 text-sm font-bold text-danger"><X size={16} /> Me equivoqué</button>
          <button onClick={() => marcar(true)} className="flex items-center justify-center gap-1.5 rounded-sm2 border border-success/30 py-3 text-sm font-bold text-success"><Check size={16} /> La sabía</button>
        </div>
      ) : (
        <p className="mt-3 text-center text-xs text-textSecondary">Piensa la respuesta y toca la tarjeta para verla.</p>
      )}
    </div>
  );
}
