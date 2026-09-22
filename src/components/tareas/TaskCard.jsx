import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Repeat, Check, Trash2, BookOpen, Play } from 'lucide-react';
import { DIFICULTADES, normalizarDificultad, formatoMinutos } from '../../lib/tiempos';
import { MateriasCtx } from '../../lib/materiasCtx';
import { CATEGORIES, PRIORITIES, etiquetaRecurrencia } from '../../lib/constants';
import { formatearFechaHora } from '../../lib/dateUtils';
import { estaVencida } from '../../services/tareas';
import { propsPreview } from '../../lib/preview';

function Etiqueta({ texto, color, icono: Icono }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-bold"
      style={{ backgroundColor: `${color}1F`, color }}
    >
      {Icono && <Icono size={11} />}
      {texto}
    </span>
  );
}

export default function TaskCard({ task, onClick, onToggle, onDelete, draggable, onDragStart }) {
  const navigate = useNavigate();
  const dificultad = DIFICULTADES[normalizarDificultad(task.dificultad)];
  const materias = useContext(MateriasCtx);
  const materia = task.materia_id ? materias.get(task.materia_id) : null;
  const vencida = estaVencida(task);
  const categoria = CATEGORIES[task.category];
  const prioridad = PRIORITIES[task.priority];
  const foto = task.photo_paths?.[0];

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      {...propsPreview('tarea', task.id)}
      className="group relative mb-2 rounded-md2 bg-white p-3.5 shadow-card cursor-pointer transition hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
            task.status === 'hecha' ? 'border-success bg-success' : 'border-textSecondary/40 bg-transparent'
          }`}
        >
          {task.status === 'hecha' && <Check size={14} className="text-white" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className={`text-[15px] font-bold ${task.status === 'hecha' ? 'text-textSecondary line-through' : 'text-textPrimary'}`}>
            {task.title}
          </p>
          <div className="mt-1.5 flex items-center gap-1">
            <Clock size={13} className={vencida ? 'text-danger' : 'text-textSecondary'} />
            <span className={`text-xs font-semibold ${vencida ? 'text-danger' : 'text-textSecondary'}`}>
              {formatearFechaHora(task.due_date)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {materia && <Etiqueta texto={materia.nombre} color={materia.color_value} icono={BookOpen} />}
            <Etiqueta texto={categoria.label} color={categoria.color} />
            <Etiqueta texto={prioridad.label} color={prioridad.color} />
            <Etiqueta texto={`${dificultad.emoji} ${dificultad.label}`} color={dificultad.color} />
            {task.estimated_minutes ? <Etiqueta texto={`⏱ ${formatoMinutos(task.estimated_minutes)}`} color="#6E7180" /> : null}
            {task.is_recurring && <Etiqueta texto={etiquetaRecurrencia(task.recurrence_interval_days)} color="#3E7BFA" icono={Repeat} />}
          </div>
        </div>

        {task.status !== 'hecha' && (
          <button onClick={(e) => { e.stopPropagation(); navigate(`/enfoque/${task.id}`); }} aria-label={`Iniciar tarea ${task.title}`} title="Iniciar tarea" className="mt-0.5 flex h-8 shrink-0 items-center gap-1 rounded-full bg-primarySoft px-2.5 text-[11px] font-extrabold text-primary transition hover:bg-primary hover:text-white"><Play size={12} /> Iniciar</button>
        )}

        {foto && <img src={foto} alt="" className="h-[46px] w-[46px] shrink-0 rounded-[10px] object-cover" />}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-1.5 -top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow group-hover:flex"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
