import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { ChevronLeft, ChevronRight, Copy, Check, Printer, CalendarCheck, Flame, CheckCircle2, AlertTriangle, Timer, GraduationCap, Wallet, Target } from 'lucide-react';
import { useSyncEstado } from '../hooks/useSyncEstado';
import LogrosCard from '../components/resumen/LogrosCard';
import ErrorCarga from '../components/ErrorCarga';
import { listarTareas } from '../services/tareas';
import { listarMaterias } from '../services/materias';
import { listarBloques } from '../services/horario';
import { listarMovimientos } from '../services/finanzas';
import { listarSesionesRecientes } from '../services/analitica';
import { rangoPeriodo, calcularResumen } from '../lib/resumen';
import { calcularRacha } from '../lib/productividad';
import { listarEvaluaciones } from '../services/notas';
import { listarCortes } from '../services/cortes';
import { agruparNotas, leerMetaNota, etiquetaMateria } from '../lib/notas';
import { currencyFormat } from '../lib/constants';
import { formatearFechaCorta } from '../lib/dateUtils';

const ResumenGraficos = lazy(() => import('../components/resumen/ResumenGraficos'));

function Kpi({ icono: Icono, color, etiqueta, valor, nota }) {
  return (
    <div className="rounded-md2 bg-white p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs font-bold" style={{ color }}>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}1F` }}><Icono size={15} /></span>{etiqueta}
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{valor}</p>
      {nota && <p className="text-[11px] text-textSecondary">{nota}</p>}
    </div>
  );
}

const horas = (min) => (min >= 60 ? `${(min / 60).toFixed(1)} h` : `${min} min`);

export default function Resumen() {
  const { version } = useSyncEstado();
  const [datos, setDatos] = useState({ tareas: [], materias: [], bloques: [], movimientos: [], sesiones: [], evaluaciones: [], cortes: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modo, setModo] = useState('semana');
  const [offset, setOffset] = useState(0);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [tareas, materias, bloques, movimientos, sesiones] = await Promise.all([listarTareas(), listarMaterias(), listarBloques(), listarMovimientos(), listarSesionesRecientes(60)]);
        const [evaluaciones, cortes] = await Promise.all([listarEvaluaciones().catch(() => []), listarCortes().catch(() => [])]);
        setDatos({ tareas, materias, bloques, movimientos, sesiones, evaluaciones, cortes });
        setError('');
      } catch (err) {
        setError(mensajeAmigable(err, 'cargar el resumen'));
      } finally {
        setCargando(false);
      }
    })();
  }, [version]);

  const ahora = new Date();
  const rango = useMemo(() => rangoPeriodo(modo, offset, ahora), [modo, offset]); // eslint-disable-line react-hooks/exhaustive-deps
  const r = useMemo(
    () => calcularResumen({ rango, rangoPrevio: rangoPeriodo(modo, offset - 1, ahora), ahora, ...datos }),
    [rango, datos] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const racha = calcularRacha(datos.tareas, datos.sesiones, ahora);
  const notas = useMemo(() => new Map(agruparNotas({ materias: datos.materias, evaluaciones: datos.evaluaciones, cortes: datos.cortes, meta: leerMetaNota() }).map((f) => [f.materia.nombre, f.m])), [datos]);

  const texto = () =>
    [
      `📊 Resumen ${modo === 'mes' ? 'del mes' : 'de la semana'}: ${rango.etiqueta}`, '',
      `✅ Tareas completadas: ${r.hechas}${r.cumplimiento != null ? ` (${r.cumplimiento}% de cumplimiento)` : ''}`,
      `⚠️ Vencidas: ${r.vencidas} · Por vencer: ${r.porVencer}`,
      `⏱️ Enfoque: ${horas(r.minutosEnfoque)} en ${r.sesiones} sesiones`,
      `📚 Clases: ${r.clases} · Compromisos: ${r.compromisos}`,
      `💰 Ingresos ${currencyFormat.format(r.ingresos)} · Gastos ${currencyFormat.format(r.gastos)} · Ahorro ${currencyFormat.format(r.ahorro)}`,
      `🔥 Racha: ${racha} día(s)`, '',
      ...r.filas.filter((f) => f.activas + f.completadas > 0).map((f) => { const n = notas.get(f.nombre); return `• ${f.nombre}: ${f.completadas} completadas, ${f.activas} activas${f.vencidas ? `, ${f.vencidas} vencidas` : ''}${n?.hayDatos ? ` · nota ${(n.final ?? n.proyectada ?? n.acumulado).toFixed(2)}` : ''}`; }), '',
      ...r.insights,
    ].join('\n');

  const copiar = async () => { await navigator.clipboard.writeText(texto()); setCopiado(true); setTimeout(() => setCopiado(false), 2000); };

  if (cargando) return <p className="py-10 text-center text-sm text-textSecondary">Preparando tu resumen…</p>;

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-white p-1 shadow-card">
            {[['semana', 'Semana'], ['mes', 'Mes']].map(([v, t]) => (
              <button key={v} onClick={() => { setModo(v); setOffset(0); }} className={`rounded-full px-4 py-1.5 text-xs font-bold ${modo === v ? 'bg-primary text-white' : 'text-textSecondary'}`}>{t}</button>
            ))}
          </div>
          <button onClick={() => setOffset((o) => o - 1)} aria-label="Anterior" className="rounded-full bg-white p-2 shadow-card"><ChevronLeft size={16} /></button>
          <button onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset === 0} aria-label="Siguiente" className="rounded-full bg-white p-2 shadow-card disabled:opacity-40"><ChevronRight size={16} /></button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.dispatchEvent(new CustomEvent('workversity:revision'))} className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-card"><CalendarCheck size={14} /> Revisión semanal</button>
          <button onClick={copiar} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-primary shadow-card">{copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiado' : 'Copiar resumen'}</button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-textSecondary shadow-card"><Printer size={14} /> Imprimir / PDF</button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">{rango.etiqueta}</h2>
        <p className="text-sm text-textSecondary">Resumen {modo === 'mes' ? 'mensual' : 'semanal'} de tu trabajo, estudio y finanzas.</p>
      </div>
      <ErrorCarga mensaje={error} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icono={CheckCircle2} color="#17C964" etiqueta="Completadas" valor={r.hechas} nota={r.cumplimiento != null ? `${r.cumplimiento}% de cumplimiento` : 'Sin entregas en este periodo'} />
        <Kpi icono={AlertTriangle} color="#E5484D" etiqueta="Vencidas" valor={r.vencidas} nota={`${r.porVencer} por vencer`} />
        <Kpi icono={Timer} color="#F5A524" etiqueta="Enfoque" valor={horas(r.minutosEnfoque)} nota={`${r.sesiones} sesión${r.sesiones !== 1 ? 'es' : ''} Pomodoro`} />
        <Kpi icono={Flame} color="#E5789C" etiqueta="Racha" valor={`${racha} día${racha !== 1 ? 's' : ''}`} nota="Con actividad seguida" />
        <Kpi icono={GraduationCap} color="#5B8DEF" etiqueta="Clases" valor={r.clases} nota={`${r.compromisos} reuniones/turnos`} />
        <Kpi icono={Wallet} color="#17C964" etiqueta="Ingresos" valor={currencyFormat.format(r.ingresos)} />
        <Kpi icono={Wallet} color="#E5484D" etiqueta="Gastos" valor={currencyFormat.format(r.gastos)} nota={r.ingresos ? `${Math.round((r.gastos / r.ingresos) * 100)}% de tus ingresos` : null} />
        <Kpi icono={Target} color="#3E7BFA" etiqueta="Ahorro" valor={currencyFormat.format(r.ahorro)} />
      </div>

      <div className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-2 text-sm font-extrabold">Lo que dicen tus datos</p>
        <ul className="space-y-1.5 text-sm">{r.insights.map((f) => <li key={f}>{f}</li>)}</ul>
      </div>

      <Suspense fallback={<div className="h-64 animate-pulse rounded-md2 bg-white shadow-card" />}>
        <ResumenGraficos resumen={r} />
      </Suspense>

      <div className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-3 text-sm font-extrabold">Por materia</p>
        {r.filas.length === 0 ? <p className="py-6 text-center text-sm text-textSecondary">Registra tus materias para ver su avance aquí.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead><tr className="text-[11px] font-bold text-textSecondary"><th className="pb-2">Materia</th><th className="pb-2 text-center">Activas</th><th className="pb-2 text-center">Completadas</th><th className="pb-2 text-center">Vencidas</th><th className="pb-2">Nota</th><th className="pb-2">Progreso</th><th className="pb-2">Próxima entrega</th></tr></thead>
              <tbody>
                {r.filas.map((f) => (
                  <tr key={f.nombre} className="border-t border-black/5">
                    <td className="py-2.5 pr-2 font-bold"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color }} />{f.nombre}</td>
                    <td className="py-2.5 text-center">{f.activas}</td>
                    <td className="py-2.5 text-center text-success">{f.completadas}</td>
                    <td className={`py-2.5 text-center ${f.vencidas ? 'font-bold text-danger' : 'text-textSecondary'}`}>{f.vencidas}</td>
                    <td className="py-2.5 pr-2 text-xs font-bold">{(() => { const n = notas.get(f.nombre); if (!n || !n.hayDatos) return <span className="font-normal text-textSecondary">—</span>; const e = etiquetaMateria(n); return <span style={{ color: e.color }}>{(n.final ?? n.proyectada ?? n.acumulado).toFixed(2)}</span>; })()}</td>
                    <td className="w-40 py-2.5 pr-3">{f.progreso == null ? <span className="text-xs text-textSecondary">—</span> : (<div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full" style={{ width: `${f.progreso}%`, backgroundColor: f.color }} /></div><span className="w-8 text-right text-[11px] font-bold">{f.progreso}%</span></div>)}</td>
                    <td className="py-2.5 text-xs text-textSecondary">{f.proxima ? `${f.proxima.title} · ${formatearFechaCorta(f.proxima.due_date)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LogrosCard />
    </div>
  );
}
