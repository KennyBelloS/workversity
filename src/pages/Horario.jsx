import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, LayoutGrid, List, CalendarPlus } from 'lucide-react';
import CalendarioModal from '../components/calendario/CalendarioModal';
import { useAuth } from '../context/AuthContext';
import { useSyncEstado } from '../hooks/useSyncEstado';
import ErrorCarga from '../components/ErrorCarga';
import { listarBloques, crearBloque, actualizarBloque, eliminarBloque } from '../services/horario';
import { listarMaterias, crearMateria, actualizarMateria, eliminarMateria } from '../services/materias';
import { listarTareas, completarTarea } from '../services/tareas';
import AgendaSemana from '../components/horario/AgendaSemana';
import AgendaLista from '../components/horario/AgendaLista';
import BlockModal from '../components/horario/BlockModal';
import { MateriaModal } from '../components/materias/Materias';
import { DIAS_SEMANA } from '../lib/constants';
import { inicioDeSemana, sumarDias, eventosDeSemana, mismoDia, TIPOS_AGENDA } from '../lib/agenda';

export default function Horario() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { version } = useSyncEstado();
  const [bloques, setBloques] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [semana, setSemana] = useState(inicioDeSemana());
  const [vista, setVista] = useState(() => (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'semana' : 'lista'));
  const [diaSel, setDiaSel] = useState((new Date().getDay() + 6) % 7);
  const [ocultos, setOcultos] = useState([]);
  const [bloqueModal, setBloqueModal] = useState(undefined); // undefined = cerrado, null = nuevo
  const [materiaModal, setMateriaModal] = useState(undefined);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);

  const cargar = async () => {
    try {
      const [b, m, t] = await Promise.all([listarBloques(), listarMaterias(), listarTareas()]);
      setBloques(b); setMaterias(m); setTareas(t); setError('');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setCargando(false);
    }
  };
   
  useEffect(() => { cargar(); }, [version]);

  const todos = useMemo(() => eventosDeSemana(semana, { materias, bloques, tareas }), [semana, materias, bloques, tareas]);
  const visibles = todos.filter((e) => !ocultos.includes(e.tipo));
  const conteo = (tipo) => todos.filter((e) => e.tipo === tipo).length;

  const abrir = (e) => {
    if (e.origen === 'materia') setMateriaModal(e.ref);
    else if (e.origen === 'bloque') setBloqueModal(e.ref);
    else navigate('/tareas');
  };

  const alternarTarea = async (t) => {
    await completarTarea(t, usuario.id);
    await cargar();
  };

  const guardarBloque = async (b) => {
    if (b.id) {
       
      const { id, user_id, created_at, ...cambios } = b;
      await actualizarBloque(id, cambios);
    } else await crearBloque(b, usuario.id);
    await cargar(); setBloqueModal(undefined);
  };
  const guardarMateria = async (m) => {
    if (m.id) {
       
      const { id, user_id, created_at, ...cambios } = m;
      await actualizarMateria(id, cambios);
    } else await crearMateria(m, usuario.id);
    await cargar(); setMateriaModal(undefined);
  };

  const fin = sumarDias(semana, 6);
  const rango = `${semana.getDate()} ${semana.toLocaleDateString('es-CO', { month: 'short' })} – ${fin.getDate()} ${fin.toLocaleDateString('es-CO', { month: 'short' })}`;
  const esSemanaActual = mismoDia(semana, inicioDeSemana());

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setSemana(sumarDias(semana, -7))} aria-label="Semana anterior" className="rounded-full bg-white p-2 shadow-card"><ChevronLeft size={18} /></button>
          <button onClick={() => setSemana(inicioDeSemana())} disabled={esSemanaActual} className="rounded-full bg-white px-3.5 py-2 text-xs font-bold shadow-card disabled:text-textSecondary">Hoy</button>
          <button onClick={() => setSemana(sumarDias(semana, 7))} aria-label="Semana siguiente" className="rounded-full bg-white p-2 shadow-card"><ChevronRight size={18} /></button>
          <span className="ml-2 text-sm font-extrabold">{rango}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-full bg-white p-1 shadow-card lg:flex">
            {[['semana', LayoutGrid, 'Semana'], ['lista', List, 'Lista']].map(([v, Icono, txt]) => (
              <button key={v} onClick={() => setVista(v)} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${vista === v ? 'bg-primary text-white' : 'text-textSecondary'}`}>
                <Icono size={14} /> {txt}
              </button>
            ))}
          </div>
          <button onClick={() => setCalendarioAbierto(true)} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3.5 py-2.5 text-sm font-bold text-primary shadow-card">
            <CalendarPlus size={17} /> <span className="hidden sm:inline">Calendario</span>
          </button>
          <button onClick={() => setBloqueModal(null)} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primaryDark">
            <Plus size={18} /> Nuevo
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(TIPOS_AGENDA).map(([tipo, info]) => {
          const off = ocultos.includes(tipo);
          return (
            <button
              key={tipo}
              onClick={() => setOcultos((o) => (off ? o.filter((x) => x !== tipo) : [...o, tipo]))}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition"
              style={{ borderColor: off ? 'rgba(120,130,150,0.3)' : info.color, backgroundColor: off ? 'transparent' : `${info.color}1F`, color: off ? '#8a91a3' : info.color, opacity: off ? 0.7 : 1 }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: info.color }} />
              {info.label} <span className="opacity-70">{conteo(tipo)}</span>
            </button>
          );
        })}
      </div>

      <ErrorCarga mensaje={error} />

      {cargando ? (
        <p className="py-10 text-center text-sm text-textSecondary">Cargando…</p>
      ) : (
        <>
          {vista === 'semana' && (
            <div className="hidden lg:block"><AgendaSemana inicioSemana={semana} eventos={visibles} onAbrir={abrir} /></div>
          )}
          {vista === 'lista' && (
            <>
              {/* móvil: un día a la vez */}
              <div className="lg:hidden">
                <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
                  {DIAS_SEMANA.map((d, i) => {
                    const f = sumarDias(semana, i);
                    const sel = diaSel === i;
                    return (
                      <button key={d} onClick={() => setDiaSel(i)} className={`flex min-w-[46px] flex-col items-center rounded-sm2 px-2 py-2 ${sel ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}>
                        <span className="text-[10px] font-bold">{d.slice(0, 3)}</span>
                        <span className="text-base font-extrabold">{f.getDate()}</span>
                        <span className="mt-0.5 h-1 w-1 rounded-full" style={{ backgroundColor: visibles.some((e) => e.dia === i) ? (sel ? '#fff' : '#6FA8DC') : 'transparent' }} />
                      </button>
                    );
                  })}
                </div>
                <AgendaLista inicioSemana={semana} eventos={visibles} dias={[diaSel]} onAbrir={abrir} onToggleTarea={alternarTarea} />
              </div>
              {/* escritorio: toda la semana */}
              <div className="hidden lg:block">
                <AgendaLista inicioSemana={semana} eventos={visibles} dias={[0, 1, 2, 3, 4, 5, 6]} onAbrir={abrir} onToggleTarea={alternarTarea} />
              </div>
            </>
          )}
          {vista === 'semana' && (
            <div className="lg:hidden">
              <AgendaLista inicioSemana={semana} eventos={visibles} dias={[diaSel]} onAbrir={abrir} onToggleTarea={alternarTarea} />
            </div>
          )}
        </>
      )}

      {calendarioAbierto && <CalendarioModal onCerrar={() => setCalendarioAbierto(false)} />}
      {bloqueModal !== undefined && (
        <BlockModal
          bloqueExistente={bloqueModal}
          onGuardar={guardarBloque}
          onEliminar={async (b) => { await eliminarBloque(b.id); await cargar(); setBloqueModal(undefined); }}
          onCerrar={() => setBloqueModal(undefined)}
        />
      )}
      {materiaModal !== undefined && (
        <MateriaModal
          materiaExistente={materiaModal}
          onGuardar={guardarMateria}
          onEliminar={async (m) => { await eliminarMateria(m.id); await cargar(); setMateriaModal(undefined); }}
          onCerrar={() => setMateriaModal(undefined)}
        />
      )}
    </div>
  );
}
