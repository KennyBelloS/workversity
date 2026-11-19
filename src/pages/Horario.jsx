import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, ChevronDown, LayoutGrid, List, CalendarPlus, SlidersHorizontal } from 'lucide-react';
import CalendarioModal from '../components/calendario/CalendarioModal';
import { useAuth } from '../context/AuthContext';
import { useSyncEstado } from '../hooks/useSyncEstado';
import { useMediaQuery } from '../hooks/useMediaQuery';
import ErrorCarga from '../components/ErrorCarga';
import { listarBloques, crearBloque, actualizarBloque, eliminarBloque } from '../services/horario';
import { listarMaterias, crearMateria, actualizarMateria, eliminarMateria } from '../services/materias';
import { listarTareas, completarTarea } from '../services/tareas';
import RejillaSemana from '../components/horario/RejillaSemana';
import DiaMovil from '../components/horario/DiaMovil';
import PanelSemana, { MesChico } from '../components/horario/PanelSemana';
import AgendaLista from '../components/horario/AgendaLista';
import BlockModal from '../components/horario/BlockModal';
import { MateriaModal } from '../components/materias/Materias';
import { ICONO_TIPO } from '../components/horario/iconosTipo';
import Hoja from '../components/ui/Hoja';
import { RAPIDO, NATURAL, sinMovimiento } from '../lib/movimiento';
import { inicioDeSemana, sumarDias, eventosDeSemana, mismoDia, TIPOS_AGENDA } from '../lib/agenda';

// ---------------------------------------------------------------------------------------------
// Agenda. Dos pantallas distintas, no una encogida:
//
//  • Computador: la semana entera en una rejilla a escala real que usa todo el ancho, con un
//    panel a la derecha (cuentas, filtros y un mes para saltar de semana). Los controles son una
//    sola línea arriba, así la semana empieza casi pegada al encabezado.
//  • Celular: un día a la vez como línea de tiempo vertical, con la tira de días pegada arriba.
//    Los filtros se fueron a una hoja, porque en 390 px ocupaban un tercio de la pantalla antes
//    de que apareciera la primera clase.
// ---------------------------------------------------------------------------------------------

export default function Horario() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { version } = useSyncEstado();
  const ancha = useMediaQuery('(min-width: 1024px)');
  const [bloques, setBloques] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [semana, setSemana] = useState(inicioDeSemana());
  const [vista, setVista] = useState('semana');
  const [diaSel, setDiaSel] = useState((new Date().getDay() + 6) % 7);
  const [ocultos, setOcultos] = useState([]);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [bloqueModal, setBloqueModal] = useState(undefined); // undefined = cerrado, null = nuevo
  const [inicialBloque, setInicialBloque] = useState(null);
  const [materiaModal, setMateriaModal] = useState(undefined);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [fechaAbierta, setFechaAbierta] = useState(false);
  const fechaRef = useRef(null);
  const quieto = sinMovimiento();

  // Cierra el salto de fecha al hacer clic afuera.
  useEffect(() => {
    if (!fechaAbierta) return undefined;
    const alClic = (e) => { if (!fechaRef.current?.contains(e.target)) setFechaAbierta(false); };
    document.addEventListener('mousedown', alClic);
    return () => document.removeEventListener('mousedown', alClic);
  }, [fechaAbierta]);

  const cargar = async () => {
    try {
      const [b, m, t] = await Promise.all([listarBloques(), listarMaterias(), listarTareas()]);
      setBloques(b); setMaterias(m); setTareas(t); setError('');
    } catch (err) {
      setError(mensajeAmigable(err, 'cargar tu agenda'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [version]);

  const todos = useMemo(() => eventosDeSemana(semana, { materias, bloques, tareas }), [semana, materias, bloques, tareas]);
  const visibles = todos.filter((e) => !ocultos.includes(e.tipo));
  const conteo = (tipo) => todos.filter((e) => e.tipo === tipo).length;
  const alternarTipo = (tipo) => setOcultos((o) => (o.includes(tipo) ? o.filter((x) => x !== tipo) : [...o, tipo]));

  const abrir = (e) => {
    if (e.origen === 'materia') setMateriaModal(e.ref);
    else if (e.origen === 'bloque') setBloqueModal(e.ref);
    else navigate('/tareas');
  };

  /** Hueco vacío de la rejilla (o del día vacío en celular): crea algo justo ahí.
   *  `minutos` es el minuto del día en que empieza (480 = 8:00 a. m.), no la hora redonda —
   *  la rejilla de escritorio ajusta el hueco a pasos de 30 min. */
  const nuevoEn = (diaSemana, minutos) => {
    setInicialBloque({ day_of_week: diaSemana, start_minutes: minutos, end_minutes: minutos + 60 });
    setBloqueModal(null);
  };
  const nuevoLibre = () => { setInicialBloque(null); setBloqueModal(null); };

  /** Cambia de día en el celular, cruzando de semana si hace falta (deslizar el dedo). */
  const irADia = (delta) => {
    let destino = diaSel + delta;
    if (destino < 0) { setSemana((s) => sumarDias(s, -7)); destino += 7; }
    else if (destino > 6) { setSemana((s) => sumarDias(s, 7)); destino -= 7; }
    setDiaSel(destino);
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
    await cargar(); setBloqueModal(undefined); setInicialBloque(null);
  };
  const guardarMateria = async (m) => {
    if (m.id) {

      const { id, user_id, created_at, ...cambios } = m;
      await actualizarMateria(id, cambios);
    } else await crearMateria(m, usuario.id);
    await cargar(); setMateriaModal(undefined);
  };

  const fin = sumarDias(semana, 6);
  const mismoMes = semana.getMonth() === fin.getMonth();
  const rango = mismoMes
    ? `${semana.getDate()} – ${fin.getDate()} ${fin.toLocaleDateString('es-CO', { month: 'long' })}`
    : `${semana.getDate()} ${semana.toLocaleDateString('es-CO', { month: 'short' })} – ${fin.getDate()} ${fin.toLocaleDateString('es-CO', { month: 'short' })}`;
  const esSemanaActual = mismoDia(semana, inicioDeSemana());
  const activos = Object.keys(TIPOS_AGENDA).length - ocultos.length;

  return (
    <div>
      {/* Una sola línea de controles: navegar la semana a la izquierda, acciones a la derecha. */}
      <div className="ag-barra">
        <div className="ag-nav">
          <button onClick={() => setSemana(sumarDias(semana, -7))} aria-label="Semana anterior" className="ag-flecha"><ChevronLeft size={17} /></button>
          <button onClick={() => setSemana(sumarDias(semana, 7))} aria-label="Semana siguiente" className="ag-flecha"><ChevronRight size={17} /></button>
          <div ref={fechaRef} className="ag-fecha-env">
            <button
              type="button"
              onClick={() => setFechaAbierta((a) => !a)}
              aria-haspopup="dialog"
              aria-expanded={fechaAbierta}
              className="ag-rango ag-rango--boton"
            >
              {rango}
              <ChevronDown size={13} strokeWidth={2.3} />
            </button>
            <AnimatePresence>
              {fechaAbierta && (
                <motion.div
                  className="ag-fecha-pop"
                  initial={quieto ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
                  animate={quieto ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                  exit={quieto ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
                  transition={NATURAL}
                >
                  <MesChico semana={semana} onSemana={(s) => { setSemana(s); setFechaAbierta(false); }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!esSemanaActual && (
            <button onClick={() => setSemana(inicioDeSemana())} className="ag-hoy">Hoy</button>
          )}
        </div>

        <div className="ag-acciones">
          {ancha && (
            <div className="seg flex">
              {[['semana', LayoutGrid, 'Rejilla'], ['lista', List, 'Lista']].map(([v, Icono, txt]) => (
                <button key={v} onClick={() => setVista(v)} aria-pressed={vista === v} className={`flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-xs font-medium ${vista === v ? 'bg-surface text-textPrimary shadow-[0_1px_2px_rgba(0,0,0,.08),0_0_0_1px_rgb(var(--linea)/.06)]' : 'text-textSecondary'}`}>
                  <Icono size={14} /> {txt}
                </button>
              ))}
            </div>
          )}
          {!ancha && (
            <button onClick={() => setFiltrosAbiertos(true)} aria-label="Filtros" className="ag-boton">
              <SlidersHorizontal size={16} />
              <span className="ag-boton-n">{activos}</span>
            </button>
          )}
          <button onClick={() => setCalendarioAbierto(true)} className="ag-boton" aria-label="Calendario académico">
            <CalendarPlus size={16} /> <span className="hidden sm:inline">Calendario</span>
          </button>
          {ancha && (
            <motion.button onClick={nuevoLibre} whileTap={{ scale: 0.96 }} transition={RAPIDO} className="boton-ppal">
              <Plus size={17} /> Nuevo
            </motion.button>
          )}
        </div>
      </div>

      <ErrorCarga mensaje={error} />

      {cargando ? (
        <p className="py-10 text-center text-sm text-textSecondary">Cargando…</p>
      ) : ancha ? (
        <div className="ag-marco">
          <div className="min-w-0">
            {vista === 'semana'
              ? <RejillaSemana inicioSemana={semana} eventos={visibles} onAbrir={abrir} onNuevo={nuevoEn} />
              : <AgendaLista inicioSemana={semana} eventos={visibles} dias={[0, 1, 2, 3, 4, 5, 6]} onAbrir={abrir} onToggleTarea={alternarTarea} />}
          </div>
          <PanelSemana
            eventos={todos}
            ocultos={ocultos}
            onAlternar={alternarTipo}
            conteo={conteo}
          />
        </div>
      ) : (
        <DiaMovil
          inicioSemana={semana}
          eventos={visibles}
          dia={diaSel}
          onDia={setDiaSel}
          onDesplazar={irADia}
          onAbrir={abrir}
          onToggleTarea={alternarTarea}
          onNuevo={nuevoEn}
        />
      )}

      {filtrosAbiertos && (
        <Hoja abierta onCerrar={() => setFiltrosAbiertos(false)} rotulo="Agenda" titulo="¿Qué quieres ver?" ancho="30rem">
          <div className="pn-filtros pn-filtros--tactil" role="group" aria-label="Tipos de evento visibles">
            {Object.entries(TIPOS_AGENDA).map(([tipo, info]) => {
              const off = ocultos.includes(tipo);
              const Icono = ICONO_TIPO[tipo];
              return (
                <motion.button
                  key={tipo}
                  type="button"
                  role="switch"
                  aria-checked={!off}
                  whileTap={{ scale: 0.98 }}
                  transition={RAPIDO}
                  onClick={() => alternarTipo(tipo)}
                  className={`pn-filtro ${off ? 'pn-filtro--off' : ''}`}
                  style={{ '--c': info.color }}
                >
                  <span className="pn-filtro-punto" aria-hidden="true" />
                  <Icono size={14} strokeWidth={2} className="pn-filtro-ico" aria-hidden="true" />
                  <span className="pn-filtro-t">{info.label}</span>
                  <span className="pn-filtro-n">{off ? 'oculto' : `${conteo(tipo)} esta semana`}</span>
                  <span className="pn-filtro-i" aria-hidden="true" />
                </motion.button>
              );
            })}
          </div>
        </Hoja>
      )}

      {calendarioAbierto && <CalendarioModal onCerrar={() => setCalendarioAbierto(false)} />}
      {bloqueModal !== undefined && (
        <BlockModal
          bloqueExistente={bloqueModal}
          inicial={inicialBloque}
          onGuardar={guardarBloque}
          onEliminar={async (b) => { await eliminarBloque(b.id); await cargar(); setBloqueModal(undefined); }}
          onCerrar={() => { setBloqueModal(undefined); setInicialBloque(null); }}
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
