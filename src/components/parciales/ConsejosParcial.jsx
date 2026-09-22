import { Lightbulb } from 'lucide-react';
import { consejosEstudio } from '../../lib/parciales';

const ICONO = { urgente: '⏰', plan: '🗓️', dominio: '🎯', difíciles: '🔁', test: '🧠', general: '🍅' };

export default function ConsejosParcial({ diasRestantes, dominio, tarjetasDificiles, ultimoPorcentaje }) {
  const consejos = consejosEstudio({ diasRestantes, dominio, tarjetasDificiles, ultimoPorcentaje });
  return (
    <div className="rounded-md2 bg-white p-4 shadow-card">
      <p className="mb-3 flex items-center gap-2 text-sm font-extrabold"><Lightbulb size={16} className="text-warning" /> Consejos para este parcial</p>
      <ul className="space-y-2.5">
        {consejos.map((c, i) => <li key={i} className="flex gap-2 text-sm"><span>{ICONO[c.t] || '💡'}</span><span>{c.x}</span></li>)}
      </ul>
    </div>
  );
}
