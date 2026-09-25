import { useEffect, useState } from 'react';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { useSearchParams } from 'react-router-dom';
import { Plus, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listarMaterias } from '../services/materias';
import { listarSesionesRecientes } from '../services/analitica';
import { MateriasCtx } from '../lib/materiasCtx';
import { listarTareas, crearTarea, actualizarTarea, eliminarTarea, completarTarea } from '../services/tareas';
import TareasPorMateria from '../components/tareas/TareasPorMateria';
import { useSyncEstado } from '../hooks/useSyncEstado';
import { mostrarSnackbar } from '../lib/snackbar';
import ErrorCarga from '../components/ErrorCarga';
import { sugerirSubTareas } from '../lib/motorAnalitica';
import { ViewSelector, FilterTabs } from '../components/tareas/Selectors';
import KanbanBoard from '../components/tareas/KanbanBoard';
import { DayView, WeekView, MonthView } from '../components/tareas/AgendaViews';
import TaskModal from '../components/tareas/TaskModal';
import TaskDetail from '../components/tareas/TaskDetail';

export default function Tareas() {
  const { usuario, perfil } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [vista, setVista] = useState('tablero');
  const [filtro, setFiltro] = useState(null);
  const [dia, setDia] = useState(new Date());
  const [mes, setMes] = useState(new Date());
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tareaEditando, setTareaEditando] = useState(null);
  const [tareaDetalle, setTareaDetalle] = useState(null);
  const { version } = useSyncEstado();
  const [params, setParams] = useSearchParams();
  // Desde la vista previa: /tareas?ver=ID abre el detalle de esa tarea.
  useEffect(() => {
    const id = params.get('ver');
    if (!id || tareas.length === 0) return;
    const t = tareas.find((x) => x.id === id);
    if (t) setTareaDetalle(t);
    const p = new URLSearchParams(params); p.delete('ver'); setParams(p, { replace: true });
  }, [params, tareas, setParams]);

  const cargar = async () => {
    try {
      const [t, m, ses] = await Promise.all([listarTareas(), listarMaterias(), listarSesionesRecientes(120).catch(() => [])]);
      setSesiones(ses);
      setTareas(t);
      setMaterias(m);
      setErrorCarga('');
    } catch (err) {
      setErrorCarga(mensajeAmigable(err, 'cargar tus tareas'));
    } finally {
      setCargando(false);
    }
  };

   
  useEffect(() => { cargar(); }, [version]);

  const enSupervivencia = !!perfil?.modo_supervivencia;
  const hoyMas3Dias = new Date();
  hoyMas3Dias.setDate(hoyMas3Dias.getDate() + 3);

  const tareasVisibles = enSupervivencia
    ? tareas.filter((t) => t.priority === 'alta' || new Date(t.due_date) <= hoyMas3Dias)
    : tareas;

  const tareasFiltradas = filtro ? tareasVisibles.filter((t) => t.category === filtro) : tareasVisibles;

  const dividirEnSubtareas = async (tareaPadre) => {
    const sugerencias = sugerirSubTareas(tareaPadre);
    for (const s of sugerencias) {
      await crearTarea(
        {
          title: s.title,
          description: '',
          category: tareaPadre.category,
          priority: tareaPadre.priority,
          due_date: tareaPadre.due_date,
          has_reminder: false,
          reminder_minutes_before: 60,
          photo_paths: [],
          status: 'pendiente',
          is_recurring: false,
          recurrence_interval_days: 7,
          estimated_minutes: s.estimated_minutes,
          parent_task_id: tareaPadre.id,
          materia_id: tareaPadre.materia_id || null,
        },
        usuario.id
      );
    }
    await cargar();
    setModalAbierto(false);
    setTareaEditando(null);
  };

  const handleGuardar = async (tareaParcial) => {
    if (tareaParcial.id) {
      const { id, user_id, created_at, ...cambios } = tareaParcial;
      await actualizarTarea(id, cambios);
    } else {
      await crearTarea(tareaParcial, usuario.id);
    }
    await cargar();
    setModalAbierto(false);
    setTareaEditando(null);
  };

  const handleEliminar = async (tarea) => {
    await eliminarTarea(tarea.id);
    await cargar();
    mostrarSnackbar({ texto: `«${tarea.title}» eliminada`, etiqueta: 'Deshacer', onAccion: async () => { await crearTarea(tarea, usuario.id); await cargar(); } });
  };

  const handleToggle = async (tarea) => {
    const nuevoEstado = tarea.status === 'hecha' ? 'pendiente' : 'hecha';
    await cambiarEstado(tarea, nuevoEstado);
  };

  // Cambia el estado y, si la tarea es recurrente y se completó, crea la siguiente repetición.
  const cambiarEstado = async (tarea, nuevoEstado) => {
    await completarTarea(tarea, usuario.id, nuevoEstado);
    await cargar();
    if (nuevoEstado === 'hecha' && !tarea.is_recurring) {
      mostrarSnackbar({ texto: 'Tarea completada 🎉', etiqueta: 'Deshacer', onAccion: async () => { await completarTarea(tarea, usuario.id, 'pendiente'); await cargar(); } });
    }
  };

  const handleMover = async (id, nuevoEstado) => {
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea || tarea.status === nuevoEstado) return;
    await cambiarEstado(tarea, nuevoEstado);
  };

  const mapaMaterias = new Map(materias.map((m) => [m.id, m]));

  return (
    <MateriasCtx.Provider value={mapaMaterias}>
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 max-w-full">
          <ViewSelector value={vista} onChange={setVista} />
        </div>
        <button
          onClick={() => { setTareaEditando(null); setModalAbierto(true); }}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primaryDark"
        >
          <Plus size={18} /> Nueva tarea
        </button>
      </div>

      <div className="mb-4">
        <FilterTabs value={filtro} onChange={setFiltro} />
      </div>

      {enSupervivencia && (
        <div className="mb-4 flex items-center gap-2 rounded-md2 bg-danger px-4 py-2.5 text-white shadow-card">
          <ShieldAlert size={16} />
          <p className="text-xs font-bold">Modo Supervivencia activo — solo se muestra lo urgente y lo de prioridad alta.</p>
        </div>
      )}

      <ErrorCarga mensaje={errorCarga} />

      {cargando ? (
        <p className="py-10 text-center text-sm text-textSecondary">Cargando…</p>
      ) : (
        <>
          {vista === 'tablero' && (
            <KanbanBoard tasks={tareasFiltradas} onOpen={setTareaDetalle} onToggle={handleToggle} onDelete={handleEliminar} onMove={handleMover} />
          )}
          {vista === 'materias' && (
            <TareasPorMateria tareas={tareasFiltradas} materias={materias} onOpen={setTareaDetalle} onToggle={handleToggle} />
          )}
          {vista === 'dia' && (
            <DayView dia={dia} onCambiarDia={setDia} tasks={tareasFiltradas} onOpen={setTareaDetalle} onToggle={handleToggle} onDelete={handleEliminar} />
          )}
          {vista === 'semana' && (
            <WeekView tasks={tareasFiltradas} onOpen={setTareaDetalle} onToggle={handleToggle} onDelete={handleEliminar} />
          )}
          {vista === 'mes' && (
            <MonthView mes={mes} onCambiarMes={setMes} tasks={tareasFiltradas} onOpen={setTareaDetalle} onToggle={handleToggle} onDelete={handleEliminar} />
          )}
        </>
      )}

      {modalAbierto && (
        <TaskModal
          materias={materias}
          historial={{ tareas, sesiones }}
          tareaExistente={tareaEditando}
          onGuardar={handleGuardar}
          onEliminar={async (t) => { await handleEliminar(t); setModalAbierto(false); setTareaEditando(null); }}
          onCerrar={() => { setModalAbierto(false); setTareaEditando(null); }}
          onDividirEnSubtareas={dividirEnSubtareas}
        />
      )}

      {tareaDetalle && (
        <TaskDetail
          tarea={tareaDetalle}
          onCerrar={() => setTareaDetalle(null)}
          onEditar={() => { setTareaEditando(tareaDetalle); setModalAbierto(true); }}
          onToggle={() => handleToggle(tareaDetalle)}
          onMover={(estado) => handleMover(tareaDetalle.id, estado)}
          onEliminar={() => handleEliminar(tareaDetalle)}
        />
      )}
    </div>
    </MateriasCtx.Provider>
  );
}
