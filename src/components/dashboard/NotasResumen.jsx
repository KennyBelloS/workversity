import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { leerTabla } from '../../offline/db';
import { useSyncEstado } from '../../hooks/useSyncEstado';
import { agruparNotas, leerMetaNota, etiquetaMateria } from '../../lib/notas';

/** Tarjeta del Dashboard con el estado de las notas de cada materia (lee la copia local). */
export default function NotasResumen() {
  const { version } = useSyncEstado();
  const [d, setD] = useState({ materias: [], evaluaciones: [], cortes: [] });
  useEffect(() => {
    Promise.all([leerTabla('materias'), leerTabla('evaluaciones'), leerTabla('cortes_notas')]).then(([materias, evaluaciones, cortes]) => setD({ materias, evaluaciones, cortes }));
  }, [version]);
  const filas = useMemo(() => agruparNotas({ ...d, meta: leerMetaNota() }).filter((f) => f.m.hayDatos), [d]);

  return (
    <div className="rounded-md2 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold"><GraduationCap size={15} className="text-primary" /> Tus notas</p>
        <Link to="/analitica?tab=notas" className="text-xs font-bold text-primary">Calcular</Link>
      </div>
      {filas.length === 0 ? (
        <p className="py-5 text-center text-xs text-textSecondary">Agrega tus cortes y actividades en Asistente → Notas y verás aquí cómo vas.</p>
      ) : (
        <div className="space-y-2">
          {filas.map(({ materia, m }) => {
            const e = etiquetaMateria(m);
            return (
              <Link key={materia.id} to="/analitica?tab=notas" className="flex items-center gap-2.5 rounded-sm2 bg-bg p-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: materia.color_value }} />
                <span className="min-w-0 flex-1 truncate text-xs font-bold">{materia.nombre}</span>
                <span className="text-xs font-extrabold" style={{ color: e.color }}>{(m.final ?? m.proyectada ?? m.acumulado).toFixed(2)}</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${e.color}1F`, color: e.color }}>{e.texto}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
