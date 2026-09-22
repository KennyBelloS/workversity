import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useHabitos } from '../../hooks/useHabitos';

/** Tarjeta del Dashboard: lo más reciente que la app aprendió de tus hábitos. */
export default function AprendizajeResumen() {
  const { habitos: h, aprender } = useHabitos();
  if (!h) return null;
  const listos = h.aprendizajes.filter((a) => a.listo).slice(0, 3);
  return (
    <div className="rounded-md2 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold"><Brain size={15} className="text-primary" /> Lo que aprendí de ti</p>
        <Link to="/analitica?tab=habitos" className="text-xs font-bold text-primary">Ver hábitos</Link>
      </div>
      {listos.length === 0 ? (
        <>
          <p className="text-xs text-textSecondary">Aún te estoy conociendo. Completa tareas, marca los Pomodoros y registra tu energía para que pueda ayudarte mejor.</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (h.muestrasTotales / 30) * 100)}%` }} /></div>
        </>
      ) : (
        <ul className="space-y-2">{listos.map((a) => <li key={a.id} className="flex items-start gap-2 rounded-sm2 bg-bg p-2.5 text-xs"><span>{a.icono}</span><span className="font-semibold">{a.titulo}</span></li>)}</ul>
      )}
      {!aprender && <p className="mt-2 text-[10px] text-textSecondary">Uso de lo aprendido desactivado.</p>}
    </div>
  );
}
