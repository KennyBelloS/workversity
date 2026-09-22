import { Clock, Bell, Repeat, Check, RotateCcw, Pencil, CalendarPlus, Trash2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEscape } from '../../hooks/useEscape';
import { CATEGORIES, PRIORITIES, STATUS_ORDER, TASK_STATUSES } from '../../lib/constants';
import { formatearFechaHora } from '../../lib/dateUtils';
import { estaVencida } from '../../services/tareas';

function FilaInfo({ icono: Icono, texto, color, destacado }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Icono size={17} color={color || '#6E7180'} />
      <span className="text-[13px] font-semibold" style={{ color: color || 'rgb(var(--textPrimary))' }}>{texto}</span>
      {destacado && <span className="rounded bg-danger px-1.5 py-0.5 text-[9px] font-extrabold text-white">{destacado}</span>}
    </div>
  );
}

function aFechaGoogle(iso) {
  return new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
}

function agregarAlCalendario(tarea) {
  const inicio = new Date(new Date(tarea.due_date).getTime() - 30 * 60000);
  const fin = new Date(tarea.due_date);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: tarea.title,
    dates: `${aFechaGoogle(inicio)}/${aFechaGoogle(fin)}`,
    details: tarea.description || '',
  });
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
}

export default function TaskDetail({ tarea, onCerrar, onEditar, onToggle, onEliminar, onMover }) {
  const navigate = useNavigate();
  useEscape(onCerrar);
  const categoria = CATEGORIES[tarea.category];
  const prioridad = PRIORITIES[tarea.priority];
  const vencida = estaVencida(tarea);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onCerrar}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-lg2 bg-white px-6 pb-8 pt-5 sm:rounded-lg2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/10" />
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: `${categoria.color}1F`, color: categoria.color }}>
            {categoria.label}
          </span>
          <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: `${prioridad.color}1F`, color: prioridad.color }}>
            Prioridad {prioridad.label}
          </span>
          {tarea.is_recurring && (
            <span className="inline-flex items-center gap-1 rounded-full bg-info/[0.12] px-2.5 py-1 text-[11px] font-bold text-info">
              <Repeat size={11} /> Recurrente
            </span>
          )}
        </div>

        <h2 className={`mt-3.5 text-[22px] font-extrabold ${tarea.status === 'hecha' ? 'text-textSecondary line-through' : 'text-textPrimary'}`}>
          {tarea.title}
        </h2>
        {tarea.description && <p className="mt-2 text-sm leading-relaxed text-textSecondary">{tarea.description}</p>}

        <div className="mt-4">
          <FilaInfo icono={Clock} texto={formatearFechaHora(tarea.due_date)} color={vencida ? '#E5484D' : 'rgb(var(--textPrimary))'} destacado={vencida ? 'VENCIDA' : null} />
          {tarea.has_reminder && (
            <FilaInfo
              icono={Bell}
              texto={`Te avisa ${tarea.reminder_minutes_before >= 60 ? `${Math.floor(tarea.reminder_minutes_before / 60)} hora(s)` : `${tarea.reminder_minutes_before} min`} antes`}
            />
          )}
          {tarea.is_recurring && <FilaInfo icono={Repeat} texto={`Se repite cada ${tarea.recurrence_interval_days} días`} />}
        </div>

        {tarea.photo_paths?.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {tarea.photo_paths.map((f, i) => <img key={i} src={f} alt="" className="h-[90px] w-[90px] shrink-0 rounded-sm2 object-cover" />)}
          </div>
        )}

        {tarea.status !== 'hecha' && (
          <button onClick={() => { onCerrar(); navigate(`/enfoque/${tarea.id}`); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-sm2 bg-success py-3.5 text-sm font-extrabold text-white shadow-card">
            <Play size={17} /> Iniciar tarea (abrir espacio de enfoque)
          </button>
        )}

        <div className="mt-3 flex gap-2.5">
          <button
            onClick={() => { onCerrar(); onToggle(); }}
            className="flex flex-1 items-center justify-center gap-2 rounded-sm2 border border-black/10 py-3 text-sm font-bold text-textPrimary"
          >
            {tarea.status === 'hecha' ? <RotateCcw size={17} /> : <Check size={17} />}
            {tarea.status === 'hecha' ? 'Reabrir' : 'Completar'}
          </button>
          <button
            onClick={() => { onCerrar(); onEditar(); }}
            className="flex flex-1 items-center justify-center gap-2 rounded-sm2 bg-primary py-3 text-sm font-bold text-white"
          >
            <Pencil size={16} /> Editar
          </button>
        </div>

        {onMover && (
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-textSecondary">Mover a</p>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_ORDER.map((estado) => {
                const info = TASK_STATUSES[estado];
                const actual = tarea.status === estado;
                return (
                  <button
                    key={estado}
                    disabled={actual}
                    onClick={() => { onCerrar(); onMover(estado); }}
                    className="rounded-sm2 border py-2 text-[11px] font-bold transition disabled:cursor-default"
                    style={{
                      borderColor: actual ? info.color : 'rgba(0,0,0,0.08)',
                      backgroundColor: actual ? `${info.color}1F` : 'transparent',
                      color: actual ? info.color : '#6E7180',
                    }}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-2.5 flex items-center gap-2.5">
          <button onClick={() => agregarAlCalendario(tarea)} className="flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-bold text-textSecondary hover:text-primary">
            <CalendarPlus size={17} /> Agregar al calendario
          </button>
          <button onClick={() => { onCerrar(); onEliminar(); }} className="flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-danger">
            <Trash2 size={17} /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
