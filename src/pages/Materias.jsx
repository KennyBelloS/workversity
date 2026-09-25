import { useEffect, useState } from 'react';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { Plus, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSyncEstado } from '../hooks/useSyncEstado';
import ErrorCarga from '../components/ErrorCarga';
import { listarMaterias, crearMateria, actualizarMateria, eliminarMateria } from '../services/materias';
import { listarTareas, completarTarea } from '../services/tareas';
import TareasPorMateria from '../components/tareas/TareasPorMateria';
import { MateriaCard, MateriaModal } from '../components/materias/Materias';

export default function Materias() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [materias, setMaterias] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  const [error, setError] = useState('');
  const { version } = useSyncEstado();

  const cargar = async () => {
    try {
      const [m, t] = await Promise.all([listarMaterias(), listarTareas()]);
      setMaterias(m);
      setTareas(t);
      setError('');
    } catch (err) {
      setError(mensajeAmigable(err, 'cargar tus materias'));
    } finally {
      setCargando(false);
    }
  };

   
  useEffect(() => { cargar(); }, [version]);

  const guardar = async (materia) => {
    if (materia.id) {
      const { id, user_id, created_at, ...cambios } = materia;
      await actualizarMateria(id, cambios);
    } else {
      await crearMateria(materia, usuario.id);
    }
    await cargar();
    setModalAbierto(false);
    setEditando(null);
  };

  const eliminar = async (materia) => {
    await eliminarMateria(materia.id);
    await cargar();
    setModalAbierto(false);
    setEditando(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-textSecondary">Tus materias de la universidad, con profesor, salón y NRC.</p>
        <button
          onClick={() => { setEditando(null); setModalAbierto(true); }}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primaryDark"
        >
          <Plus size={18} /> Nueva materia
        </button>
      </div>

      <ErrorCarga mensaje={error} />

      {cargando ? (
        <p className="py-10 text-center text-sm text-textSecondary">Cargando…</p>
      ) : materias.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md2 bg-white py-16 shadow-card">
          <BookOpen size={32} className="text-textSecondary/40" />
          <p className="text-sm text-textSecondary">Aún no has agregado ninguna materia</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {materias.map((m) => (
            <MateriaCard key={m.id} materia={m} onClick={() => { setEditando(m); setModalAbierto(true); }} />
          ))}
        </div>
      )}

      {!cargando && materias.length > 0 && (
        <section className="mt-8">
          <h3 className="mb-1 text-lg font-extrabold">Tareas activas por materia</h3>
          <p className="mb-3 text-xs text-textSecondary">Lo que tienes pendiente en cada materia, ordenado por fecha de entrega.</p>
          <TareasPorMateria
            tareas={tareas}
            materias={materias}
            onOpen={() => navigate('/tareas')}
            onToggle={async (t) => { await completarTarea(t, usuario.id); await cargar(); }}
          />
        </section>
      )}

      {modalAbierto && (
        <MateriaModal
          materiaExistente={editando}
          onGuardar={guardar}
          onEliminar={eliminar}
          onCerrar={() => { setModalAbierto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
