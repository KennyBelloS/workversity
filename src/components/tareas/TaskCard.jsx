import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3, Repeat, Check, Trash2, BookOpen, Play, CalendarClock } from 'lucide-react';
import { formatoMinutos } from '../../lib/tiempos';
import { MateriasCtx } from '../../lib/materiasCtx';
import { CATEGORIES, etiquetaRecurrencia } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { formatearFechaHora } from '../../lib/dateUtils';
import { estaVencida } from '../../services/tareas';
import { propsPreview } from '../../lib/preview';

// ---------------------------------------------------------------------------------------------
// Tarjeta de tarea para las vistas de agenda (Día / Semana / Mes). Una tarjeta con identidad
// propia, distinta de la del tablero: aquí la tarea vive en el tiempo, así que el color de su
// materia (o categoría) tiñe toda la tarjeta —suave, no un bloque sólido ni genérico— en vez de
// ser solo una etiqueta al margen. El tinte se calcula con color-mix sobre la superficie real,
// así se adapta solo a modo claro u oscuro sin tener que definir dos paletas a mano.
// ---------------------------------------------------------------------------------------------

const iniciales = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export default function TaskCard({ task, onClick, onToggle, onDelete, draggable, onDragStart }) {
  const navigate = useNavigate();
  const materias = useContext(MateriasCtx);
  const { perfil } = useAuth();
  const materia = task.materia_id ? materias.get(task.materia_id) : null;
  const vencida = estaVencida(task);
  const categoria = CATEGORIES[task.category] || CATEGORIES.universidad;
  const foto = task.photo_paths?.[0];
  const hecha = task.status === 'hecha';
  const c = materia?.color_value || categoria.color;
  const Icono = materia ? BookOpen : CalendarClock;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      {...propsPreview('tarea', task.id)}
      className="group relative mb-2.5 cursor-pointer"
      onClick={onClick}
    >
      <div className="ta-card" style={{ '--c': c }} data-hecha={hecha ? '1' : undefined}>
        <div className="ta-card-cab">
          <span className="ta-card-ico"><Icono size={13} strokeWidth={2.1} /></span>
          <span className="ta-card-etq truncate">{materia ? materia.nombre : categoria.label}</span>
          {task.estimated_minutes ? <span className="ta-card-dur">{formatoMinutos(task.estimated_minutes)}</span> : null}
        </div>

        <p className={`ta-card-t ${hecha ? 'line-through' : ''}`}>{task.title}</p>

        <div className="ta-card-pie">
          <span className={`ta-card-hora ${vencida && !hecha ? 'ta-card-hora--vencida' : ''}`}>
            <Clock3 size={12} strokeWidth={2} />
            {formatearFechaHora(task.due_date)}
            {task.is_recurring && <Repeat size={11} strokeWidth={2} className="ml-0.5 opacity-70" title={etiquetaRecurrencia(task.recurrence_interval_days)} />}
          </span>

          <span className="ta-card-acciones">
            {foto && <img src={foto} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-[rgb(var(--surface))]" />}
            <span className="ta-card-avatar" title={perfil?.nombre}>{iniciales(perfil?.nombre)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              aria-label={hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}
              className={`ta-card-check ${hecha ? 'ta-card-check--si' : ''}`}
            >
              <Check size={12} strokeWidth={3} />
            </button>
            {!hecha && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/enfoque/${task.id}`); }}
                aria-label={`Iniciar tarea ${task.title}`}
                title="Iniciar tarea"
                className="ta-card-play"
              >
                <Play size={11} />
              </button>
            )}
          </span>
        </div>

      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        aria-label="Eliminar tarea"
        className="absolute -right-1.5 -top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow-md group-hover:flex"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
