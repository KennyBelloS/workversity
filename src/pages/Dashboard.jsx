import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Check, ArrowUpDown, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listarTareas, completarTarea, estaVencida } from '../services/tareas';
import CapturaRapida from '../components/dashboard/CapturaRapida';
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
import { formatearFechaHora, minutosAHora, claveMesActual, claveMesDe, semanaDelAno } from '../lib/dateUtils';
import { inicioDeSemana, eventosDeSemana, proximoEvento, TIPOS_AGENDA, textoDuracion } from '../lib/agenda';
import { useSyncEstado } from '../hooks/useSyncEstado';
import ErrorCarga from '../components/ErrorCarga';
import CargaBento from '../components/CargaBento';
import { PiezaDia, PiezaSiguiente, PiezaTemporizador, PiezaCompletadas, PiezaMaterias, PiezaCalendario, PiezaSupervivencia, PiezaCifra } from '../components/dashboard/Bento';
import Franja from '../components/layout/Franja';
import CintaDia from '../components/dashboard/CintaDia';
import ParteDelDia from '../components/dashboard/ParteDelDia';
import BandaPulso from '../components/dashboard/BandaPulso';
import { actualizarPerfil } from '../services/auth';

const DashboardGraficos = lazy(() => import('../components/dashboard/DashboardGraficos'));

const ORDEN_PRIORIDAD = { alta: 0, media: 1, baja: 2 };
const hora = (f) => minutosAHora(f.getHours() * 60 + f.getMinutes());

export default function Dashboard() {
  const { perfil, usuario, refrescarPerfil } = useAuth();
  const [resueltos, setResueltos] = useState([]); // avisos resueltos desde la campana (filas insertadas)
  const navigate = useNavigate();
  const { version } = useSyncEstado();
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

  // Cuando se resuelve un aviso desde la campana, su fila aparece arriba empujando el contenido.
  useEffect(() => {
    const alResolver = (e) => {
      const fila = { id: Date.now(), ...e.detail, visible: false };
      setResueltos((r) => [fila, ...r].slice(0, 3));
      setTimeout(() => setResueltos((r) => r.map((x) => (x.id === fila.id ? { ...x, visible: true } : x))), 520);
      setTimeout(() => cargar(), 600);
    };
    window.addEventListener('workversity:aviso-resuelto', alResolver);
    return () => window.removeEventListener('workversity:aviso-resuelto', alResolver);
  }, []);  

  if (cargando) return <CargaBento />;

  const idxHoy = (ahora.getDay() + 6) % 7;
  const hoyEventos = eventosSemana.filter((e) => e.dia === idxHoy);
  const hechosHoy = hoyEventos.filter((e) => (e.origen === 'tarea' ? e.hecha : e.fin <= ahora)).length;
  const progresoHoy = hoyEventos.length ? Math.round((hechosHoy / hoyEventos.length) * 100) : 0;

  const pendientes = tareas.filter((t) => t.status !== 'hecha');
  const vencidas = pendientes.filter(estaVencida);
  // Las tres tareas que piden una decisión ya: lo vencido primero, después lo que vence antes.
  const urgentes = pendientes
    .filter((t) => t.due_date)
    .sort((x, y) => (estaVencida(y) - estaVencida(x)) || (new Date(x.due_date) - new Date(y.due_date)))
    .slice(0, 3)
    .map((t) => {
      const m = materias.find((x) => x.id === t.materia_id);
      const f = new Date(t.due_date);
      return { ...t, materia: m?.nombre, atrasada: f < ahora, cuando: textoDuracion(Math.abs(f - ahora)) };
    });

  // Lo que todavía queda por delante hoy (clases, turnos, reuniones y entregas).
  const bloquesHoy = hoyEventos.filter((e) => e.origen !== 'tarea');
  const entregasHoy = hoyEventos.filter((e) => e.origen === 'tarea');
  const porVenir = hoyEventos.filter((e) => e.fin > ahora).slice(0, 3);
  const minutosOcupados = bloquesHoy.reduce((acc, e) => acc + Math.max(0, (e.fin - e.inicio) / 60000), 0);

  const mes = claveMesActual();
  const delMes = movimientos.filter((m) => claveMesDe(m.date) === mes);
  const total = (tipo) => delMes.filter((m) => m.type === tipo).reduce((s, m) => s + Number(m.amount), 0);
  const balance = total('ingreso') - total('gasto') - total('ahorro');

  const racha = calcularRacha(tareas, sesiones, ahora);
  const rachaEntrada = estadoRachaEntrada(ahora).racha;
  const puntos = perfil?.puntos || 0;
  const nivel = Math.floor(puntos / 100) + 1;

  const cifras = [
    ...(vencidas.length ? [{ etiqueta: 'Vencidas', valor: vencidas.length, nota: 'reprogramar', to: '/tareas', alerta: true }] : []),
    { etiqueta: 'Pendientes', valor: pendientes.length, nota: 'por hacer', to: '/tareas' },
    { etiqueta: 'Racha', valor: racha || rachaEntrada, nota: (racha || rachaEntrada) === 1 ? 'día' : 'días' },
    { etiqueta: 'Nivel', valor: nivel, nota: `${puntos} pts`, to: '/analitica' },
  ];

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
  const vacio = tareas.length === 0 && materias.length === 0 && bloques.length === 0;

  // Bento: datos de cada pieza
  const lunes = inicioDeSemana(ahora);
  const porDia = [0, 0, 0, 0, 0, 0, 0];
  for (const t of tareas) {
    if (t.status !== 'hecha' || !t.completed_at) continue;
    const d = new Date(t.completed_at);
    if (d >= lunes) porDia[(d.getDay() + 6) % 7] += 1;
  }
  const finSemana = new Date(lunes); finSemana.setDate(finSemana.getDate() + 7);
  // Pulso de la semana: enfoque y bloques por día, para la banda de cifras grandes.
  const enfoquePorDia = [0, 0, 0, 0, 0, 0, 0];
  for (const ses of sesiones) {
    const d = new Date(ses.creado || ses.created_at || ses.fecha || 0);
    if (d >= lunes) enfoquePorDia[(d.getDay() + 6) % 7] += Math.round((ses.minutos ?? ses.duracion ?? 25));
  }
  const clasesPorDia = [0, 0, 0, 0, 0, 0, 0];
  for (const e of eventosSemana) if (e.origen !== 'tarea' && e.dia >= 0 && e.dia <= 6) clasesPorDia[e.dia] += 1;
  const metaSemana = tareas.filter((t) => new Date(t.due_date) >= lunes && new Date(t.due_date) < finSemana).length;
  const filasMaterias = materias.map((m) => {
    const suyas = tareas.filter((t) => t.materia_id === m.id);
    return { nombre: m.nombre, color: m.color_value, pct: suyas.length ? (suyas.filter((t) => t.status === 'hecha').length / suyas.length) * 100 : 0, n: suyas.length };
  }).filter((f) => f.n > 0).sort((a, b) => b.n - a.n);
  const cambiarSupervivencia = async () => {
    await actualizarPerfil(usuario.id, { modo_supervivencia: !perfil?.modo_supervivencia });
    await refrescarPerfil();
  };
  const fechaLarga = ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <ParteDelDia
        ahora={ahora}
        fecha={fechaLarga}
        semana={semanaDelAno(ahora)}
        saludo={saludo}
        nombre={nombre}
        urgentes={urgentes}
        siguientes={porVenir}
        cifras={cifras}
        minutosOcupados={minutosOcupados}
        bloques={bloquesHoy.length}
        hoyEntregas={entregasHoy.length}
        vencidas={vencidas.length}
      />

      {resueltos.map((r) => (
        <div key={r.id} className={`av-fila ${r.visible ? 'av-fila--visible' : ''}`}>
          <div>
            <div className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-card">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-white"><Check size={14} strokeWidth={2.6} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-t-base font-semibold">{r.titulo}</p>
                <p className="truncate text-t-micro text-textSecondary">{r.detalle}</p>
              </div>
              {r.etiqueta && <span className="shrink-0 rounded-full px-2.5 py-1 text-t-micro font-medium" style={{ background: r.color ? `${r.color}1F` : 'rgb(var(--success) / .12)', color: r.color || 'rgb(var(--success))' }}>{r.etiqueta}</span>}
            </div>
          </div>
        </div>
      ))}

      <ErrorCarga mensaje={error} />

      <CapturaRapida materias={materias} onCreada={cargar} />

      {vacio && (
        <div className="rounded-[22px] bg-white p-5 shadow-card">
          <p className="rotulo">Primeros pasos</p>
          <p className="mt-2 text-t-medio font-light tracking-tight">Tres pasos y tu agenda queda lista.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[['/materias', BookOpen, 'Registra tus materias'], ['/tareas', Check, 'Crea tus tareas'], ['/configuracion', Clock, 'Activa las notificaciones']].map(([to, Icono, txt], k) => (
              <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl bg-bg p-3 text-t-pie font-medium transition hover:bg-primarySoft">
                <span className="font-mono text-t-micro text-textSecondary">0{k + 1}</span><Icono size={15} className="text-primary" /> {txt}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Franja acc={hora(ahora)}>El tablero de hoy</Franja>

      <CintaDia ahora={ahora} eventos={hoyEventos} />

      {/* Bento: se arma pieza por pieza y las cifras cuentan hacia arriba */}
      <div className="bento">
        <PiezaDia i={0} ahora={ahora} progreso={progresoHoy} hechos={hechosHoy} total={hoyEventos.length} />
        <PiezaSiguiente i={1} ahora={ahora} siguiente={siguiente} eventosHoy={hoyEventos} onPomodoro={() => navigate('/analitica')} />
        <PiezaTemporizador i={2} />
        <PiezaCompletadas i={3} porDia={porDia} meta={metaSemana} />
        <PiezaCifra i={4} rotulo="Balance del mes" valor={balance} formato={(v) => currencyFormat.format(Math.round(v))} nota={`Ahorrado: ${currencyFormat.format(total('ahorro'))}`} to="/finanzas" tono={balance < 0 ? 'rgb(var(--danger))' : undefined} />
        <PiezaMaterias i={4} filas={filasMaterias} />
        <PiezaCalendario i={5} ahora={ahora} eventos={hoyEventos} />
        <PiezaSupervivencia ancho i={6} activo={!!perfil?.modo_supervivencia} onCambiar={cambiarSupervivencia} />
      </div>

      <Franja acc={`${pendientes.length} pendientes`}>Tu semana</Franja>

      <BandaPulso hechas={porDia} enfoque={enfoquePorDia} clases={clasesPorDia} hoy={idxHoy} />

      <WidgetGrid piezas={{
        'plan-hoy': (
        <div data-arana className="ficha">
          <div className="ficha-cabecera">
            <span className="rotulo">Tu plan de hoy</span>
            <Link to="/horario" className="franja-acc transition hover:text-textPrimary">Ver agenda →</Link>
          </div>
          {hoyEventos.length === 0 ? (
            <p className="py-10 text-center text-t-pie text-textSecondary">No tienes nada agendado hoy.</p>
          ) : (
            <div>
              {hoyEventos.map((e) => {
                const pasado = e.origen === 'tarea' ? e.hecha : e.fin <= ahora;
                const activo = e.origen !== 'tarea' && e.inicio <= ahora && e.fin > ahora;
                return (
                  <div key={e.id} {...previewDeEvento(e)} className={`fila-dato ${pasado ? 'opacity-50' : ''}`}>
                    <span className="fila-hora">{hora(e.inicio)}</span>
                    <span className="h-7 w-[3px] shrink-0 rounded-full" style={{ backgroundColor: activo ? e.color : `${e.color}55` }} />
                    <button onClick={() => (e.origen === 'tarea' ? navigate('/tareas') : navigate('/horario'))} className="min-w-0 flex-1 text-left">
                      <p className={`truncate text-t-base font-medium ${e.hecha ? 'line-through' : ''}`}>{e.titulo}</p>
                      <p className="truncate text-t-micro text-textSecondary">
                        <span style={{ color: e.color }}>{TIPOS_AGENDA[e.tipo].uno}</span>{e.detalle ? ` · ${e.detalle}` : ''}
                      </p>
                    </button>
                    {activo && <span className="shrink-0 font-mono text-t-micro text-danger">en curso</span>}
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
          <div className="ficha">
            <div className="ficha-cabecera"><span className="rotulo">Pendientes por materia</span><span className="franja-acc">{listaMaterias.length}</span></div>
            {listaMaterias.length === 0 ? (
              <p className="py-10 text-center text-t-pie text-textSecondary">Asocia tus tareas a una materia para verlas aquí</p>
            ) : (
              <div className="space-y-3">
                {listaMaterias.map(([nombreMateria, v]) => (
                  <button key={nombreMateria} onClick={() => navigate('/tareas')} className="block w-full text-left">
                    <div className="mb-1.5 flex justify-between text-t-pie"><span className="truncate font-medium">{nombreMateria}</span><span className="font-mono text-t-micro text-textSecondary">{v.n}</span></div>
                    <div className="h-[5px] overflow-hidden rounded-full bg-textPrimary/[.06]"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${(v.n / maxMateria) * 100}%`, backgroundColor: v.color }} /></div>
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
          <span className="rotulo">Tus números</span>
          <div className="flex seg">
            {[7, 14, 30].map((d) => (
              <button key={d} onClick={() => setDias(d)} className={`rounded-[9px] px-3 py-1 text-xs font-medium ${dias === d ? 'bg-surface text-textPrimary shadow-[0_1px_2px_rgba(0,0,0,.08),0_0_0_1px_rgb(var(--linea)/.06)]' : 'text-textSecondary'}`}>{d} días</button>
            ))}
          </div>
        </div>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-md2 bg-white shadow-card" />}>
          <DashboardGraficos tareas={tareas} movimientos={movimientos} sesiones={sesiones} dias={dias} />
        </Suspense>
        </div>
        ),
        'entregas': (
      <div className="ficha">
        <div className="ficha-cabecera flex-wrap">
          <span className="rotulo">Próximas entregas</span>
          <div className="seg">
            {[['todas', 'Todas'], ['universidad', 'Universidad'], ['trabajo', 'Trabajo']].map(([v, t]) => (
              <button key={v} onClick={() => setFiltro(v)} className={`seg-op ${filtro === v ? 'activo' : ''}`}>{t}</button>
            ))}
          </div>
        </div>
        {filas.length === 0 ? (
          <p className="py-10 text-center text-t-pie text-textSecondary">Nada pendiente por aquí.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="font-mono text-t-micro uppercase tracking-[0.1em] text-textSecondary">
                  <th className="pb-2.5 pr-2 font-normal">Tarea</th>
                  {[['materia', 'Materia'], ['due_date', 'Vence'], ['priority', 'Prioridad']].map(([c, t]) => (
                    <th key={c} className="pb-2.5 pr-2 font-normal"><button onClick={() => ordenarPor(c)} className="flex items-center gap-1 uppercase">{t}<ArrowUpDown size={10} className={orden.campo === c ? 'text-primary' : 'opacity-40'} /></button></th>
                  ))}
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {filas.map((t) => {
                  const m = materiaPorId.get(t.materia_id);
                  const p = PRIORITIES[t.priority] || PRIORITIES.media;
                  return (
                    <tr key={t.id} {...propsPreview('tarea', t.id)} className="border-t border-textPrimary/[.06]">
                      <td className="max-w-[220px] truncate py-3 pr-2 font-medium">{t.title}</td>
                      <td className="py-3 pr-2 text-xs">{m ? <span className="inline-flex items-center gap-1.5" style={{ color: m.color_value }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color_value }} />{m.nombre}</span> : <span className="text-textSecondary">{t.category === 'trabajo' ? 'Trabajo' : '—'}</span>}</td>
                      <td className={`py-3 pr-2 font-mono text-[11px] ${estaVencida(t) ? 'text-danger' : 'text-textSecondary'}`}>{formatearFechaHora(t.due_date)}</td>
                      <td className="py-3 pr-2"><span className="font-mono text-t-micro" style={{ color: p.color }}>{p.label.toLowerCase()}</span></td>
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

    </div>
  );
}
