import { Check, Video, CalendarX } from 'lucide-react';
import { DIAS_SEMANA } from '../../lib/constants';
import { minutosAHora } from '../../lib/dateUtils';
import { previewDeEvento } from '../../lib/preview';
import { sumarDias, mismoDia, TIPOS_AGENDA } from '../../lib/agenda';

const hora = (f) => minutosAHora(f.getHours() * 60 + f.getMinutes());

function Fila({ e, onAbrir, onToggleTarea }) {
  const esTarea = e.origen === 'tarea';
  return (
    <div className="flex items-stretch gap-3 rounded-sm2 bg-bg p-2.5" {...previewDeEvento(e)}>
      <div className="w-14 shrink-0 text-[11px] font-bold text-textSecondary">
        <p>{hora(e.inicio)}</p>
        {!esTarea && <p className="font-medium opacity-70">{hora(e.fin)}</p>}
      </div>
      <span className="w-1 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
      <button onClick={() => onAbrir(e)} className="min-w-0 flex-1 text-left">
        <p className={`flex items-center gap-1.5 truncate text-sm font-bold ${e.hecha ? 'text-textSecondary line-through' : ''}`}>
          {e.virtual && <Video size={13} className="shrink-0 text-info" />} {e.titulo}
        </p>
        <p className="truncate text-[11px] text-textSecondary">
          <span style={{ color: e.color }} className="font-bold">{TIPOS_AGENDA[e.tipo].label.replace(/s$/, '')}</span>
          {e.detalle ? ` · ${e.detalle}` : ''}
        </p>
      </button>
      {esTarea && onToggleTarea && (
        <button
          onClick={() => onToggleTarea(e.ref)}
          aria-label="Completar tarea"
          className={`flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full border-2 ${e.hecha ? 'border-success bg-success' : 'border-textSecondary/40'}`}
        >
          {e.hecha && <Check size={14} className="text-white" />}
        </button>
      )}
    </div>
  );
}

/** Muestra los días indicados (índices 0-6) con sus eventos. */
export default function AgendaLista({ inicioSemana, eventos, dias, onAbrir, onToggleTarea }) {
  const hoy = new Date();
  return (
    <div className="space-y-4">
      {dias.map((i) => {
        const fecha = sumarDias(inicioSemana, i);
        const delDia = eventos.filter((e) => e.dia === i);
        return (
          <section key={i}>
            <p className={`mb-2 text-xs font-extrabold ${mismoDia(fecha, hoy) ? 'text-primary' : 'text-textSecondary'}`}>
              {DIAS_SEMANA[i]} {fecha.getDate()} {mismoDia(fecha, hoy) && '· Hoy'}
            </p>
            {delDia.length === 0 ? (
              <div className="flex items-center gap-2 rounded-sm2 bg-white px-3 py-4 text-xs text-textSecondary shadow-card">
                <CalendarX size={14} /> Sin nada agendado
              </div>
            ) : (
              <div className="space-y-2 rounded-md2 bg-white p-2.5 shadow-card">
                {delDia.map((e) => <Fila key={e.id} e={e} onAbrir={onAbrir} onToggleTarea={onToggleTarea} />)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
