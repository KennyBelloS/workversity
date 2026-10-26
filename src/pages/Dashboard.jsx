import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, Wallet, Target, Star, Check, ArrowUpDown, Video, MapPin, Sparkles, BookOpen, CalendarClock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listarTareas, completarTarea, estaVencida } from '../services/tareas';
import CapturaRapida from '../components/dashboard/CapturaRapida';
import { useLogros } from '../hooks/useLogros';
import { propsPreview, previewDeEvento } from '../lib/preview';
import NotasResumen from '../components/dashboard/NotasResumen';
import MetasResumen from '../components/dashboard/MetasResumen';
import WidgetGrid from '../components/dashboard/WidgetGrid';
import AprendizajeResumen from '../components/dashboard/AprendizajeResumen';
import { calcularRacha } from '../lib/productividad';
import { estadoRachaEntrada } from '../lib/rachaEntrada';
import { listarBloques } from '../services/horario';
import { listarMaterias } from '../services/materias';
import { listarMovimientos } from '../services/finanzas';
import { listarSesionesRecientes } from '../services/analitica';
import { currencyFormat, PRIORITIES } from '../lib/constants';
import { formatearFechaHora, minutosAHora, claveMesActual, claveMesDe } from '../lib/dateUtils';
import { inicioDeSemana, eventosDeSemana, proximoEvento, textoDuracion, TIPOS_AGENDA } from '../lib/agenda';
import { useSyncEstado } from '../hooks/useSyncEstado';
import ErrorCarga from '../components/ErrorCarga';
import { SkeletonDashboard } from '../components/ui/Skeleton';

const DashboardGraficos = lazy(() => import('../components/dashboard/DashboardGraficos'));

const ORDEN_PRIORIDAD = { alta: 0, media: 1, baja: 2 };
const hora = (f) => minutosAHora(f.getHours() * 60 + f.getMinutes());

function Kpi({ to, icono: Icono, color, etiqueta, valor, nota }) {
  return (
    <Link to={to} className="group relative overflow-hidden rounded-md2 bg-white p-4 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-2 text-xs font-bold" style={{ color }}>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${color}1F` }}><Icono size={15} /></span>
        {etiqueta}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{valor}</p>
      {nota && <p className="text-[11px] text-textSecondary">{nota}</p>}
    </Link>
  );
}

export default function Dashboard() {
  const { perfil, usuario } = useAuth();
  const navigate = useNavigate();
  const { version } = useSyncEstado();
  const { lista: logros } = useLogros();
  const [datos, setDatos] = useState({ tareas: [], bloques: [], materias: [], movimientos: [], sesiones: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [ahora, setAhora] = useState(new Date());
  const [dias, setDias] = useState(7);
  const [filtro, setFiltro] = useState('todas');
  const [orden, setOrden] = useState({ campo: 'due_date', dir: 1 });

  const cargar = async () => {
    try {
      const [tareas, bloques, materias, movimientos, sesiones] = await Promise.all([
        listarTareas(), listarBloques(), listarMaterias(), listarMovimientos(), listarSesionesRecientes(30),
      ]);
      setDatos({ tareas, bloques, materias, movimientos, sesiones });
      setError('');
    } catch (err) {
      setError(mensajeAmigable(err, 'cargar el dashboard'));
    } finally {
      setCargando(false);
    }
  };
   
  useEffect(() => { cargar(); }, [version]);
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const { tareas, bloques, materias, movimientos, sesiones } = datos;
  const materiaPorId = useMemo(() => new Map(materias.map((m) => [m.id, m])), [materias]);

  const eventosSemana = useMemo(
    () => eventosDeSemana(inicioDeSemana(ahora), { materias, bloques, tareas }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [materias, bloques, tareas, ahora.toDateString()]
  );
  const siguiente = useMemo(() => proximoEvento(ahora, { materias, bloques, tareas }), [ahora, materias, bloques, tareas]);

  if (cargando) return <SkeletonDashboard />;

  const idxHoy = (ahora.getDay() + 6) % 7;
  const hoyEventos = eventosSemana.filter((e) => e.dia === idxHoy);
  const hechosHoy = hoyEventos.filter((e) => (e.origen === 'tarea' ? e.hecha : e.fin <= ahora)).length;
  const progresoHoy = hoyEventos.length ? Math.round((hechosHoy / hoyEventos.length) * 100) : 0;

  const pendientes = tareas.filter((t) => t.status !== 'hecha');
  const vencidas = pendientes.filter(estaVencida);
  const cumplimiento = tareas.length ? Math.round((tareas.filter((t) => t.status === 'hecha').length / tareas.length) * 100) : 0;

  const mes = claveMesActual();
  const delMes = movimientos.filter((m) => claveMesDe(m.date) === mes);
  const total = (tipo) => delMes.filter((m) => m.type === tipo).reduce((s, m) => s + Number(m.amount), 0);
  const balance = total('ingreso') - total('gasto') - total('ahorro');

  const racha = calcularRacha(tareas, sesiones, ahora);
  const rachaEntrada = estadoRachaEntrada(ahora).racha;
  const puntos = perfil?.puntos || 0;
  const nivel = Math.floor(puntos / 100) + 1;

  const alternar = async (t) => {
    await completarTarea(t, usuario.id);
    await cargar();
  };

  // Tabla de próximas entregas
  const filas = pendientes
    .filter((t) => filtro === 'todas' || t.category === filtro)
    .sort((a, b) => {
      const va = orden.campo === 'priority' ? ORDEN_PRIORIDAD[a.priority] : orden.campo === 'materia' ? (materiaPorId.get(a.materia_id)?.nombre || 'zzz') : new Date(a.due_date).getTime();
      const vb = orden.campo === 'priority' ? ORDEN_PRIORIDAD[b.priority] : orden.campo === 'materia' ? (materiaPorId.get(b.materia_id)?.nombre || 'zzz') : new Date(b.due_date).getTime();
      return (va > vb ? 1 : va < vb ? -1 : 0) * orden.dir;
    })
    .slice(0, 8);
  const ordenarPor = (campo) => setOrden((o) => (o.campo === campo ? { campo, dir: -o.dir } : { campo, dir: 1 }));

  // Carga por materia
  const porMateria = {};
  for (const t of pendientes) {
    if (!t.materia_id) continue;
    const m = materiaPorId.get(t.materia_id);
    if (!m) continue;
    porMateria[m.nombre] ||= { n: 0, color: m.color_value };
    porMateria[m.nombre].n += 1;
  }
  const listaMaterias = Object.entries(porMateria).sort((a, b) => b[1].n - a[1].n).slice(0, 6);
  const maxMateria = Math.max(1, ...listaMaterias.map(([, v]) => v.n));

  const saludo = ahora.getHours() < 12 ? 'Buenos días' : ahora.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = perfil?.nombre?.split(' ')[0] || usuario?.email?.split('@')[0];
  const enCurso = siguiente && siguiente.inicio <= ahora;
  const vacio = tareas.length === 0 && materias.length === 0 && bloques.length === 0;

  return (
    <div className="space-y-5">
      <div className="relative flex flex-wrap items-end justify-between gap-2 overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -left-6 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative animate-aparece-suave">
          <h2 className="font-display text-[2rem] font-semibold leading-tight tracking-tight">{saludo}, {nombre} <span className="inline-block">👋</span></h2>
          <p className="text-sm text-textSecondary">{ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())}</p>
        </div>
        <div className="flex items-center gap-2">
          {racha > 0 && <span title="Días seguidos con actividad (tareas, Pomodoros…)" className="rounded-full bg-white px-3 py-2 text-xs font-bold text-warning shadow-card">🔥 {racha} día{racha > 1 ? 's' : ''} de uso</span>}
          {rachaEntrada > 0 && <span title="Días seguidos entrando a la app" className="rounded-full bg-white px-3 py-2 text-xs font-bold text-primary shadow-card">📅 {rachaEntrada} día{rachaEntrada > 1 ? 's' : ''} seguidos</span>}
          {vencidas.length > 0 && <button onClick={() => window.dispatchEvent(new CustomEvent('workversity:revision', { detail: { paso: 1 } }))} className="rounded-full bg-dangerSoft px-3 py-2 text-xs font-bold text-danger">⚠️ {vencidas.length} vencida{vencidas.length > 1 ? 's' : ''} · Reprogramar</button>}
          {logros.length > 0 && <Link to="/resumen" title="Tus logros" className="rounded-full bg-white px-3 py-2 text-xs font-bold text-textPrimary shadow-card">🏆 {logros.filter((l) => l.logrado).length}/{logros.length}</Link>}
          <Link to="/analitica" className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-primary shadow-card">
            <Sparkles size={14} /> Nivel {nivel} · {puntos} pts
          </Link>
        </div>
      </div>

      <ErrorCarga mensaje={error} />

      <CapturaRapida materias={materias} onCreada={cargar} />

      {vacio && (
        <div className="rounded-md2 bg-white p-5 shadow-card">
          <p className="text-sm font-extrabold">Empecemos 🚀</p>
          <p className="mb-3 text-xs text-textSecondary">Con tres pasos tu agenda y tus avisos quedan listos:</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[['/materias', BookOpen, '1. Registra tus materias'], ['/tareas', Check, '2. Crea tus tareas'], ['/configuracion', Clock, '3. Activa las notificaciones']].map(([to, Icono, txt]) => (
              <Link key={to} to={to} className="flex items-center gap-2 rounded-sm2 bg-primarySoft p-3 text-xs font-bold text-primary"><Icono size={15} /> {txt}</Link>
            ))}
          </div>
        </div>
      )}

      {/* Ahora / siguiente */}
      <div className="hero-grad relative overflow-hidden rounded-lg2 p-5 text-white shadow-card animate-aparece-suave [animation-delay:60ms]" {...(siguiente ? previewDeEvento(siguiente) : {})}>
        <svg aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 opacity-[0.12]" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="49" stroke="white" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="35" stroke="white" strokeWidth="1.5" />
        </svg>
        <div className="flex flex-wrap items-center justify-between gap-4">
          {siguiente ? (
            <div className="min-w-0">
              <p className="text-xs font-bold opacity-80">{enCurso ? 'Ahora mismo' : 'Lo siguiente en tu agenda'}</p>
              <p className="mt-1 truncate text-xl font-extrabold">{siguiente.titulo}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold opacity-90">
                <span>{TIPOS_AGENDA[siguiente.tipo].label.replace(/s$/, '')}</span>
                <span>{hora(siguiente.inicio)}{siguiente.origen !== 'tarea' && ` – ${hora(siguiente.fin)}`}</span>
                {siguiente.virtual && <span className="flex items-center gap-1"><Video size={12} /> Virtual</span>}
                {!siguiente.virtual && siguiente.detalle && <span className="flex items-center gap-1"><MapPin size={12} /> {siguiente.detalle}</span>}
              </p>
            </div>
          ) : (
            <div><p className="text-xl font-extrabold">Sin compromisos a la vista 🌿</p><p className="text-xs opacity-80">Buen momento para adelantar algo o descansar.</p></div>
          )}
          <div className="flex items-center gap-5">
            {siguiente && (
              <div className="text-right">
                <p className="text-[11px] font-bold opacity-80">{enCurso ? 'Termina en' : 'Empieza en'}</p>
                <p className="text-2xl font-extrabold tabular-nums">{textoDuracion((enCurso ? siguiente.fin : siguiente.inicio) - ahora)}</p>
              </div>
            )}
            <div className="text-right">
              <p className="text-[11px] font-bold opacity-80">Tu día</p>
              <p className="text-2xl font-extrabold tabular-nums">{progresoHoy}%</p>
            </div>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${progresoHoy}%` }} /></div>
      </div>

      <div className="grid grid-cols-2 gap-3 animate-aparece-suave [animation-delay:120ms] lg:grid-cols-5">
        <Kpi to="/tareas" icono={Clock} color="#F5A524" etiqueta="Pendientes" valor={pendientes.length} nota={`${cumplimiento}% completado`} />
        <Kpi to="/tareas" icono={AlertTriangle} color="#E5484D" etiqueta="Vencidas" valor={vencidas.length} nota={vencidas.length ? 'Ponte al día' : '¡Todo en orden!'} />
        <Kpi to="/horario" icono={CalendarClock} color="#3E7BFA" etiqueta="Hoy" valor={hoyEventos.length} nota={`${hoyEventos.filter((e) => e.tipo === 'clase').length} clases`} />
        <Kpi to="/finanzas" icono={Wallet} color={balance >= 0 ? '#17C964' : '#E5484D'} etiqueta="Balance del mes" valor={currencyFormat.format(balance)} />
        <Kpi to="/metas" icono={Target} color="#8B7FD1" etiqueta="Ahorro del mes" valor={currencyFormat.format(total('ahorro'))} />
      </div>

      <WidgetGrid piezas={{
        'plan-hoy': (
        <div className="rounded-md2 bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold">Tu plan de hoy</p>
            <Link to="/horario" className="text-xs font-bold text-primary">Ver agenda</Link>
          </div>
          {hoyEventos.length === 0 ? (
            <p className="py-8 text-center text-sm text-textSecondary">No tienes nada agendado hoy 🎉</p>
          ) : (
            <div className="space-y-2">
              {hoyEventos.map((e) => {
                const pasado = e.origen === 'tarea' ? e.hecha : e.fin <= ahora;
                const activo = e.origen !== 'tarea' && e.inicio <= ahora && e.fin > ahora;
                return (
                  <div key={e.id} {...previewDeEvento(e)} className={`flex items-center gap-3 rounded-sm2 p-2.5 ${activo ? 'ring-2' : ''} bg-bg ${pasado ? 'opacity-55' : ''}`} style={activo ? { '--tw-ring-color': e.color } : undefined}>
                    <span className="w-12 shrink-0 text-[11px] font-bold text-textSecondary">{hora(e.inicio)}</span>
                    <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
                    <button onClick={() => (e.origen === 'tarea' ? navigate('/tareas') : navigate('/horario'))} className="min-w-0 flex-1 text-left">
                      <p className={`truncate text-sm font-bold ${e.hecha ? 'line-through' : ''}`}>{e.titulo}</p>
                      <p className="truncate text-[11px] text-textSecondary">
                        <span className="font-bold" style={{ color: e.color }}>{TIPOS_AGENDA[e.tipo].label.replace(/s$/, '')}</span>{e.detalle ? ` · ${e.detalle}` : ''}
                      </p>
                    </button>
                    {activo && <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-extrabold text-danger">EN CURSO</span>}
                    {e.origen === 'tarea' && (
                      <button onClick={() => alternar(e.ref)} aria-label="Completar" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${e.hecha ? 'border-success bg-success' : 'border-textSecondary/40'}`}>
                        {e.hecha && <Check size={14} className="text-white" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        ),
        'metas': <MetasResumen />,
        'pendientes-materia': (
          <div className="rounded-md2 bg-white p-4 shadow-card">
            <p className="mb-3 text-sm font-bold">Pendientes por materia</p>
            {listaMaterias.length === 0 ? (
              <p className="py-8 text-center text-sm text-textSecondary">Asocia tus tareas a una materia para verlas aquí</p>
            ) : (
              <div className="space-y-3">
                {listaMaterias.map(([nombreMateria, v]) => (
                  <button key={nombreMateria} onClick={() => navigate('/tareas')} className="block w-full text-left">
                    <div className="mb-1 flex justify-between text-xs font-bold"><span className="truncate">{nombreMateria}</span><span className="text-textSecondary">{v.n}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full transition-all" style={{ width: `${(v.n / maxMateria) * 100}%`, backgroundColor: v.color }} /></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ),
        'notas': <NotasResumen />,
        'aprendizaje': <AprendizajeResumen />,
        'graficos': (
        <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-extrabold">Tus números</p>
          <div className="flex rounded-full bg-white p-1 shadow-card">
            {[7, 14, 30].map((d) => (
              <button key={d} onClick={() => setDias(d)} className={`rounded-full px-3 py-1 text-xs font-bold ${dias === d ? 'bg-primary text-white' : 'text-textSecondary'}`}>{d} días</button>
            ))}
          </div>
        </div>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-md2 bg-white shadow-card" />}>
          <DashboardGraficos tareas={tareas} movimientos={movimientos} sesiones={sesiones} dias={dias} />
        </Suspense>
        </div>
        ),
        'entregas': (
      <div className="rounded-md2 bg-white p-4 shadow-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold">Próximas entregas</p>
          <div className="flex gap-1.5">
            {[['todas', 'Todas'], ['universidad', 'Universidad'], ['trabajo', 'Trabajo']].map(([v, t]) => (
              <button key={v} onClick={() => setFiltro(v)} className={`rounded-full px-3 py-1 text-xs font-bold ${filtro === v ? 'bg-primary text-white' : 'bg-bg text-textSecondary'}`}>{t}</button>
            ))}
          </div>
        </div>
        {filas.length === 0 ? (
          <p className="py-8 text-center text-sm text-textSecondary">Nada pendiente por aquí ✨</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold text-textSecondary">
                  <th className="pb-2 pr-2">Tarea</th>
                  {[['materia', 'Materia'], ['due_date', 'Vence'], ['priority', 'Prioridad']].map(([c, t]) => (
                    <th key={c} className="pb-2 pr-2"><button onClick={() => ordenarPor(c)} className="flex items-center gap-1 font-bold">{t}<ArrowUpDown size={11} className={orden.campo === c ? 'text-primary' : 'opacity-40'} /></button></th>
                  ))}
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {filas.map((t) => {
                  const m = materiaPorId.get(t.materia_id);
                  const p = PRIORITIES[t.priority] || PRIORITIES.media;
                  return (
                    <tr key={t.id} {...propsPreview('tarea', t.id)} className="border-t border-black/5">
                      <td className="max-w-[220px] truncate py-2.5 pr-2 font-semibold">{t.title}</td>
                      <td className="py-2.5 pr-2 text-xs">{m ? <span className="rounded-full px-2 py-0.5 font-bold" style={{ backgroundColor: `${m.color_value}1F`, color: m.color_value }}>{m.nombre}</span> : <span className="text-textSecondary">{t.category === 'trabajo' ? 'Trabajo' : '—'}</span>}</td>
                      <td className={`py-2.5 pr-2 text-xs font-semibold ${estaVencida(t) ? 'text-danger' : 'text-textSecondary'}`}>{formatearFechaHora(t.due_date)}</td>
                      <td className="py-2.5 pr-2"><span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: `${p.color}1F`, color: p.color }}>{p.label}</span></td>
                      <td className="py-2.5 text-right"><button onClick={() => alternar(t)} aria-label="Completar" className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-textSecondary/40 hover:border-success hover:bg-success/10"><Check size={14} className="text-success opacity-0 hover:opacity-100" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        ),
      }} />

      <div className="grid gap-2 pb-2 text-center text-[11px] text-textSecondary">
        <Star size={12} className="mx-auto" />
        <p>Cada tarea completada, Pomodoro y check-in de energía suma puntos.</p>
      </div>
    </div>
  );
}
