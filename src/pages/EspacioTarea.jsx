import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Table2, Presentation, Search, Bot, Flag, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSyncEstado } from '../hooks/useSyncEstado';
import { useDocumento } from '../hooks/useDocumento';
import { listarTareas, actualizarTarea, crearTarea, completarTarea } from '../services/tareas';
import { listarMaterias } from '../services/materias';
import { listarSesionesRecientes } from '../services/analitica';
import { listarDocumentos } from '../services/documentos';
import { DIFICULTADES, normalizarDificultad, predecirMinutos, tiempoRealDeTarea, formatoMinutos } from '../lib/tiempos';
import { PRIORITIES } from '../lib/constants';
import { formatearFechaHora } from '../lib/dateUtils';
import { textoPlanoDeHtml } from '../lib/sanitizar';
import { mostrarSnackbar } from '../lib/snackbar';
import { celebrar } from '../lib/nativo';
import PanelTemporizador from '../components/espacio/PanelTemporizador';
import PanelPasos, { datosPaso } from '../components/espacio/PanelPasos';
import EditorTexto from '../components/espacio/EditorTexto';
import EditorHoja from '../components/espacio/EditorHoja';
import EditorDiapositivas from '../components/espacio/EditorDiapositivas';
import PanelInvestigar from '../components/espacio/PanelInvestigar';
import PanelIA from '../components/espacio/PanelIA';
import SnackbarHost from '../components/layout/SnackbarHost';
import Celebracion from '../components/layout/Celebracion';

const TABS = [['texto', 'Texto', FileText], ['hoja', 'Hoja', Table2], ['diapositivas', 'Diapositivas', Presentation], ['investigar', 'Investigar', Search], ['ia', 'IA', Bot]];
const CLAVE_TAB = 'workversity:espacio-tab';

function Espacio({ datos, recargar }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { tarea: tareaInicial, tareas, materias, sesiones, docs, docsDisponible } = datos;
  const [tarea, setTarea] = useState(tareaInicial);
  const tareaRef = useRef(tareaInicial);
  useEffect(() => { setTarea(tareaInicial); tareaRef.current = tareaInicial; }, [tareaInicial]);

  const [tab, setTab] = useState(() => { try { const t = localStorage.getItem(CLAVE_TAB); return TABS.some((x) => x[0] === t) ? t : 'texto'; } catch { return 'texto'; } });
  const [visitadas, setVisitadas] = useState(() => new Set([tab]));
  const [terminando, setTerminando] = useState(false);
  const insertarTexto = useRef(null);
  const agregarDiapositivas = useRef(null);
  const htmlTexto = useRef('');

  const docTexto = useDocumento({ tareaId: tarea.id, tipo: 'texto', docs, usuarioId: usuario.id, titulo: tarea.title });
  const docHoja = useDocumento({ tareaId: tarea.id, tipo: 'hoja', docs, usuarioId: usuario.id, titulo: tarea.title });
  const docDiapos = useDocumento({ tareaId: tarea.id, tipo: 'diapositivas', docs, usuarioId: usuario.id, titulo: tarea.title });
  const docNotas = useDocumento({ tareaId: tarea.id, tipo: 'notas', docs, usuarioId: usuario.id, titulo: 'Notas' });
  const [notas, setNotas] = useState(docNotas.inicial);

  // Al entrar, la tarea pasa a «En progreso»
  useEffect(() => { if (tareaInicial.status === 'pendiente') actualizarTarea(tareaInicial.id, { status: 'enProgreso' }).catch(() => {}); }, [tareaInicial.id, tareaInicial.status]);

  const irA = (t) => { setTab(t); setVisitadas((v) => new Set(v).add(t)); try { localStorage.setItem(CLAVE_TAB, t); } catch { /* nada */ } };

  const sumarTiempo = useCallback(async (minutos) => {
    const actual = tareaRef.current;
    const nuevo = Math.round(((Number(actual.tiempo_real_minutos) || 0) + minutos) * 10) / 10;
    tareaRef.current = { ...actual, tiempo_real_minutos: nuevo };
    setTarea(tareaRef.current);
    await actualizarTarea(actual.id, { tiempo_real_minutos: nuevo }).catch(() => {});
  }, []);

  const materia = materias.find((m) => m.id === tarea.materia_id)?.nombre || '';
  const dif = DIFICULTADES[normalizarDificultad(tarea.dificultad)];
  const prediccion = useMemo(() => predecirMinutos({ dificultad: tarea.dificultad, categoria: tarea.category, materia_id: tarea.materia_id, tareas, sesiones, excluirId: tarea.id }), [tarea.dificultad, tarea.category, tarea.materia_id, tarea.id, tareas, sesiones]);
  const estimado = Number(tarea.estimated_minutes) || prediccion.minutos;
  const real = tiempoRealDeTarea(tarea, sesiones);
  const pasos = tareas.filter((t) => t.parent_task_id === tarea.id);

  const insertar = (html) => { irA('texto'); setTimeout(() => insertarTexto.current?.(html), 80); mostrarSnackbar({ texto: 'Insertado en tu documento', ms: 2500 }); };
  const crearPasos = async (lineas) => { for (const l of lineas) await crearTarea(datosPaso(tarea, l), usuario.id); await recargar(); mostrarSnackbar({ texto: `Se crearon ${lineas.length} pasos`, ms: 3500 }); };
  const crearDiapositivas = (lineas) => { irA('diapositivas'); setTimeout(() => agregarDiapositivas.current?.(lineas), 120); };

  const finalizar = async () => { await completarTarea(tarea, usuario.id, 'hecha'); celebrar(); navigate('/tareas'); };

  const contexto = { titulo: tarea.title, materia, descripcion: tarea.description, dificultad: normalizarDificultad(tarea.dificultad), entrega: formatearFechaHora(tarea.due_date) };
  const panel = (id, hijo) => visitadas.has(id) && <div className={tab === id ? 'h-full' : 'hidden'}>{hijo}</div>;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-bg/90 px-3 py-2.5 backdrop-blur sm:px-5" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
        <div className="mx-auto flex max-w-[1500px] items-center gap-3">
          <button onClick={() => navigate('/tareas')} aria-label="Volver a Tareas" className="rounded-full p-2 text-textSecondary hover:bg-black/5"><ArrowLeft size={18} /></button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold sm:text-lg">{tarea.title}</h1>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-textSecondary">
              <span style={{ color: dif.color }}>{dif.emoji} {dif.label}</span>
              <span>· {PRIORITIES[tarea.priority]?.label}</span>
              {materia && <span>· {materia}</span>}
              <span>· Entrega {formatearFechaHora(tarea.due_date)}</span>
            </p>
          </div>
          <div className="hidden text-right text-[11px] sm:block"><p className="font-extrabold">⏱ {formatoMinutos(real)}</p><p className="text-textSecondary">de ≈ {formatoMinutos(estimado)}</p></div>
          <button onClick={() => setTerminando(true)} className="flex shrink-0 items-center gap-1.5 rounded-full bg-success px-4 py-2 text-xs font-extrabold text-white"><Flag size={14} /> Terminar</button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr]">
        <div className="order-1 lg:col-start-2 lg:row-start-1">
          <PanelTemporizador tarea={tarea} usuarioId={usuario.id} onTiempo={sumarTiempo} tiempoTotal={real} estimado={estimado} />
        </div>

        <div className="order-2 flex min-w-0 flex-col gap-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {!docsDisponible && <p className="rounded-sm2 bg-warningSoft p-3 text-xs font-semibold text-warning">Para guardar tus documentos falta ejecutar el SQL de la base de datos (Ajustes → Base de datos). Lo que escribas se conserva en este dispositivo y se sube después.</p>}
          <nav className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-card" aria-label="Herramientas">
            {TABS.map(([k, t, Icono]) => (
              <button key={k} onClick={() => irA(k)} aria-pressed={tab === k} className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition ${tab === k ? 'bg-primary text-white' : 'text-textSecondary hover:bg-black/5'}`}><Icono size={14} /> {t}</button>
            ))}
          </nav>
          <div className="h-[72vh] min-h-[26rem] lg:h-[calc(100vh-9.5rem)]">
            {panel('texto', <EditorTexto inicial={docTexto.inicial} onCambio={(h) => { htmlTexto.current = h; docTexto.cambiar(h); }} estado={docTexto.estado} titulo={tarea.title} registrarInsertar={(f) => { insertarTexto.current = f; }} />)}
            {panel('hoja', <EditorHoja inicial={docHoja.inicial} onCambio={docHoja.cambiar} estado={docHoja.estado} titulo={tarea.title} />)}
            {panel('diapositivas', <EditorDiapositivas inicial={docDiapos.inicial} onCambio={docDiapos.cambiar} estado={docDiapos.estado} titulo={tarea.title} registrarAgregar={(f) => { agregarDiapositivas.current = f; }} />)}
            {panel('investigar', <PanelInvestigar tema={tarea.title} onInsertar={insertar} />)}
            {panel('ia', <PanelIA ctx={contexto} textoDocumento={tab === 'ia' ? textoPlanoDeHtml(htmlTexto.current || docTexto.inicial) : ''} onInsertar={insertar} onCrearPasos={crearPasos} onCrearDiapositivas={crearDiapositivas} />)}
          </div>
        </div>

        <div className="order-3 space-y-3 lg:col-start-2 lg:row-start-2">
          <PanelPasos tarea={tarea} pasos={pasos} usuarioId={usuario.id} onCambio={recargar} />
          <section className="rounded-md2 bg-white p-4 shadow-card">
            <p className="mb-2 text-sm font-extrabold">Notas rápidas</p>
            <textarea value={notas} onChange={(e) => { setNotas(e.target.value); docNotas.cambiar(e.target.value); }} rows={5} placeholder="Ideas, dudas, cosas por buscar…" aria-label="Notas rápidas" className="w-full rounded-sm2 bg-primarySoft/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </section>
        </div>
      </main>

      {terminando && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={() => setTerminando(false)}>
          <div className="w-full max-w-sm rounded-lg2 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between"><h2 className="text-lg font-extrabold">¿Terminaste? 🎉</h2><button onClick={() => setTerminando(false)} aria-label="Cerrar" className="rounded-full p-1.5 hover:bg-black/5"><X size={16} /></button></div>
            <div className="my-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-sm2 bg-bg p-3"><p className="text-xl font-extrabold">{formatoMinutos(real)}</p><p className="text-[11px] text-textSecondary">tiempo real</p></div>
              <div className="rounded-sm2 bg-bg p-3"><p className="text-xl font-extrabold">≈ {formatoMinutos(estimado)}</p><p className="text-[11px] text-textSecondary">estimado</p></div>
            </div>
            <p className="mb-4 text-xs text-textSecondary">{real >= 5 ? 'La app usará este tiempo para calcular mejor tus próximas tareas.' : 'Si mides tu tiempo con el temporizador, la app aprende cuánto tardas.'}</p>
            <div className="space-y-2">
              <button onClick={finalizar} className="w-full rounded-sm2 bg-success py-3 text-sm font-extrabold text-white">Marcar como hecha</button>
              <button onClick={() => navigate('/tareas')} className="w-full rounded-sm2 border border-black/10 py-3 text-sm font-bold text-textSecondary">Guardar y salir (sigue en progreso)</button>
              <button onClick={() => setTerminando(false)} className="w-full py-2 text-xs font-bold text-textSecondary">Seguir trabajando</button>
            </div>
          </div>
        </div>
      )}
      <SnackbarHost />
      <Celebracion />
    </div>
  );
}

export default function EspacioTarea() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { version } = useSyncEstado();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [tareas, materias, sesiones, d] = await Promise.all([listarTareas(), listarMaterias(), listarSesionesRecientes(120).catch(() => []), listarDocumentos().catch(() => ({ lista: [], disponible: true }))]);
      const tarea = tareas.find((t) => t.id === id);
      if (!tarea) { setError('No encontramos esta tarea. Puede que ya se haya eliminado.'); return; }
      setDatos({ tarea, tareas, materias, sesiones, docs: d.lista, docsDisponible: d.disponible });
    } catch (e) { setError(e.message || String(e)); }
  }, [id]);
  useEffect(() => { cargar(); }, [cargar, version]);

  if (error) return <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg p-6 text-center"><p className="text-sm font-semibold">{error}</p><button onClick={() => navigate('/tareas')} className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">Volver a Tareas</button></div>;
  if (!datos) return <div className="flex min-h-screen items-center justify-center bg-bg"><Loader2 className="animate-spin text-primary" /></div>;
  return <Suspense fallback={null}><Espacio key={datos.tarea.id} datos={datos} recargar={cargar} /></Suspense>;
}
