import { Lightbulb } from 'lucide-react';
import { consejosEstudio } from '../../lib/parciales';
import Glifo from '../Glifo';

const ICONO = { urgente: '⏰', plan: '🗓️', dominio: '🎯', difíciles: '🔁', test: '🧠', general: '🍅' };

export default function ConsejosParcial({ diasRestantes, dominio, tarjetasDificiles, ultimoPorcentaje }) {
  const consejos = consejosEstudio({ diasRestantes, dominio, tarjetasDificiles, ultimoPorcentaje });
  return (
    <div className="ficha">
      <p className="rotulo mb-3 flex items-center gap-1.5"><Lightbulb size={16} className="text-warning" /> Consejos para este parcial</p>
      <ul className="space-y-2.5">
        {consejos.map((c, i) => <li key={i} className="flex gap-2 text-sm"><span className="mt-0.5 shrink-0 text-primary"><Glifo e={ICONO[c.t] || '💡'} size={15} /></span><span>{c.x}</span></li>)}
      </ul>
    </div>
  );
}
