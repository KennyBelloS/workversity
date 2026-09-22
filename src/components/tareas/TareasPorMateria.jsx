import { useState } from 'react';
import { Check, ChevronDown, BookOpen, Briefcase } from 'lucide-react';
import { PRIORITIES } from '../../lib/constants';
import { formatearFechaHora } from '../../lib/dateUtils';
import { estaVencida } from '../../services/tareas';
import { propsPreview } from '../../lib/preview';

/** Tareas activas agrupadas por materia (más un grupo "Sin materia" para trabajo y otras). */
export default function TareasPorMateria({ tareas, materias, onOpen, onToggle }) {
  const [cerrados, setCerrados] = useState({});
  const activas = tareas.filter((t) => t.status !== 'hecha');
  const nombres = [...new Set(materias.map((m) => m.nombre))];

  const grupos = nombres.map((nombre) => {
    const filas = materias.filter((m) => m.nombre === nombre);
    const ids = new Set(filas.map((m) => m.id));
    return { clave: nombre, titulo: nombre, color: filas[0].color_value, virtual: filas.some((m) => m.es_virtual), icono: BookOpen, tareas: activas.filter((t) => ids.has(t.materia_id)) };
  });
  const conocidos = new Set(materias.map((m) => m.id));
  const sueltas = activas.filter((t) => !t.materia_id || !conocidos.has(t.materia_id));
  if (sueltas.length) grupos.push({ clave: '__sin', titulo: 'Sin materia (trabajo y otras)', color: '#8B7FD1', icono: Briefcase, tareas: sueltas });

  if (grupos.length === 0) {
    return <p className="rounded-md2 bg-white py-12 text-center text-sm text-textSecondary shadow-card">Registra tus materias para ver aquí sus tareas activas.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {grupos.map((g) => {
        const vencidas = g.tareas.filter(estaVencida).length;
        const cerrado = cerrados[g.clave];
        const ordenadas = [...g.tareas].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        return (
          <div key={g.clave} className="rounded-md2 bg-white shadow-card" style={{ borderTop: `4px solid ${g.color}` }}>
            <button onClick={() => setCerrados((c) => ({ ...c, [g.clave]: !c[g.clave] }))} className="flex w-full items-center gap-3 p-4 text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${g.color}22`, color: g.color }}><g.icono size={17} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold">{g.titulo}{g.virtual && <span className="ml-1.5 text-[10px] font-bold text-info">VIRTUAL</span>}</span>
                <span className="text-[11px] text-textSecondary">
                  {g.tareas.length} activa{g.tareas.length !== 1 ? 's' : ''}
                  {vencidas > 0 && <span className="font-bold text-danger"> · {vencidas} vencida{vencidas > 1 ? 's' : ''}</span>}
                </span>
              </span>
              <ChevronDown size={18} className={`shrink-0 text-textSecondary transition ${cerrado ? '-rotate-90' : ''}`} />
            </button>

            {!cerrado && (
              <div className="space-y-1.5 px-3 pb-3">
                {ordenadas.length === 0 && <p className="rounded-sm2 bg-bg px-3 py-3 text-center text-xs text-textSecondary">Sin tareas activas 🎉</p>}
                {ordenadas.map((t) => {
                  const p = PRIORITIES[t.priority];
                  const v = estaVencida(t);
                  return (
                    <div key={t.id} className="flex items-center gap-2.5 rounded-sm2 bg-bg p-2.5" {...propsPreview('tarea', t.id)}>
                      <button onClick={() => onToggle(t)} aria-label="Completar" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-textSecondary/40 hover:border-success">
                        <Check size={13} className="text-success opacity-0 hover:opacity-100" />
                      </button>
                      <button onClick={() => onOpen(t)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-[13px] font-bold">{t.title}</span>
                        <span className={`text-[11px] font-semibold ${v ? 'text-danger' : 'text-textSecondary'}`}>{formatearFechaHora(t.due_date)}</span>
                      </button>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${p.color}1F`, color: p.color }}>{p.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
