import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Check, Trash2, ArrowRight, ArrowLeft, PartyPopper } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEscape } from '../../hooks/useEscape';
import { listarTareas, actualizarTarea, eliminarTarea, completarTarea } from '../../services/tareas';
import { listarMaterias } from '../../services/materias';
import { listarBloques } from '../../services/horario';
import { listarMovimientos } from '../../services/finanzas';
import { listarSesionesRecientes } from '../../services/analitica';
import { rangoPeriodo, calcularResumen } from '../../lib/resumen';
import { calcularRacha, recomendarAhora } from '../../lib/productividad';
import { datosRevision, reprogramar, OPCIONES_REPROGRAMAR, guardarRevisionHecha } from '../../lib/revision';
import { textoDuracion } from '../../lib/agenda';
import { formatearFechaHora } from '../../lib/dateUtils';
import { mostrarSnackbar } from '../../lib/snackbar';
import { celebrar } from '../../lib/nativo';

const PASOS = ['Tu semana', 'Vencidas', 'Lo que viene', 'Cierre'];

/** Ritual de cierre de semana: qué lograste, qué reprogramar y qué viene. Se abre desde Resumen, el Dashboard, la campana o Ctrl+K. */
export default function RevisionSemanal() {
  const { usuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState(null);
  const [reflexion, setReflexion] = useState('');
  const cerrar = () => setAbierto(false);
  useEscape(() => abierto && cerrar());

  useEffect(() => {
    const abrir = (e) => { setPaso(e.detail?.paso ?? 0); setAbierto(true); };
    window.addEventListener('workversity:revision', abrir);
    return () => window.removeEventListener('workversity:revision', abrir);
  }, []);
  useEffect(() => {
    if (!params.get('revision')) return;
    setPaso(0); setAbierto(true);
    const p = new URLSearchParams(params); p.delete('revision'); setParams(p, { replace: true });
  }, [params, setParams]);

  const cargar = useCallback(async () => {
    const [tareas, materias, bloques, movimientos, sesiones] = await Promise.all([listarTareas(), listarMaterias(), listarBloques(), listarMovimientos(), listarSesionesRecientes(60).catch(() => [])]);
    setDatos({ tareas, materias, bloques, movimientos, sesiones });
  }, []);
  useEffect(() => { if (abierto) cargar(); }, [abierto, cargar]);

  const ahora = new Date();
  const resumen = useMemo(() => (datos ? calcularResumen({ rango: rangoPeriodo('semana', 0, ahora), rangoPrevio: rangoPeriodo('semana', -1, ahora), ahora, ...datos }) : null), [datos]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!abierto || !datos) return abierto ? <Cascaron onCerrar={cerrar}><p className="py-16 text-center text-sm text-textSecondary">Preparando tu revisión…</p></Cascaron> : null;

  const { vencidas, proximas } = datosRevision({ ahora, tareas: datos.tareas });
  const materia = (t) => datos.materias.find((m) => m.id === t.materia_id)?.nombre;
  const racha = calcularRacha(datos.tareas, datos.sesiones, ahora);
  const foco = recomendarAhora(datos.tareas, { ahora, n: 3 });

  const mover = async (t, dias) => { await actualizarTarea(t.id, { due_date: reprogramar(t, dias, ahora) }); await cargar(); };
  const moverTodas = async (dias) => { for (const t of vencidas) await actualizarTarea(t.id, { due_date: reprogramar(t, dias, ahora) }); await cargar(); };
  const hecha = async (t) => { await completarTarea(t, usuario.id, 'hecha'); await cargar(); };
  const borrar = async (t) => { if (!window.confirm(`¿Eliminar «${t.title}»?`)) return; await eliminarTarea(t.id); await cargar(); };

  const terminar = () => {
    guardarRevisionHecha(ahora);
    if (reflexion.trim()) {
      try {
        const lista = JSON.parse(localStorage.getItem('workversity:reflexiones') || '[]');
        lista.unshift({ fecha: ahora.toISOString(), texto: reflexion.trim() });
        localStorage.setItem('workversity:reflexiones', JSON.stringify(lista.slice(0, 30)));
      } catch { /* nada */ }
    }
    cerrar(); setReflexion(''); celebrar();
    mostrarSnackbar({ texto: '🗓️ Revisión semanal hecha. ¡Buena semana!', ms: 5000 });
  };

  const btn = 'rounded-full border border-black/10 px-2.5 py-1 text-[11px] font-bold text-textSecondary hover:border-primary hover:text-primary';
  return (
    <Cascaron onCerrar={cerrar} paso={paso} setPaso={setPaso}>
      {paso === 0 && resumen && (
        <div className="space-y-3">
          <p className="text-sm text-textSecondary">Así te fue esta semana ({resumen.hechas} tareas completadas).</p>
          <div className="grid grid-cols-2 gap-2">
            {[['✅', 'Completadas', resumen.hechas], ['🎯', 'Cumplimiento', resumen.cumplimiento != null ? `${resumen.cumplimiento}%` : '—'], ['⏱️', 'Enfoque', resumen.minutosEnfoque >= 60 ? `${(resumen.minutosEnfoque / 60).toFixed(1)} h` : `${resumen.minutosEnfoque} min`], ['🔥', 'Racha', `${racha} d`]].map(([e, t, v]) => (
              <div key={t} className="rounded-sm2 bg-bg p-3"><p className="text-lg">{e}</p><p className="text-xl font-extrabold">{v}</p><p className="text-[11px] text-textSecondary">{t}</p></div>
            ))}
          </div>
          <ul className="space-y-1.5 rounded-sm2 bg-primarySoft/50 p-3 text-[13px]">{resumen.insights.slice(0, 4).map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
      )}

      {paso === 1 && (
        <div className="space-y-3">
          {vencidas.length === 0 ? (
            <p className="rounded-sm2 bg-successSoft py-10 text-center text-sm font-bold text-success">🎉 No tienes tareas vencidas</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{vencidas.length} vencida{vencidas.length > 1 ? 's' : ''}: reprograma, ciérrala o elimínala.</p>
                <button onClick={() => moverTodas(1)} className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-white">Todas para mañana</button>
              </div>
              <div className="space-y-2">
                {vencidas.map((t) => (
                  <div key={t.id} className="rounded-sm2 bg-bg p-3">
                    <p className="text-sm font-bold">{t.title}</p>
                    <p className="mb-2 text-[11px] text-danger">Venció hace {textoDuracion(ahora - new Date(t.due_date))}{materia(t) ? ` · ${materia(t)}` : ''}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {OPCIONES_REPROGRAMAR.map((o) => <button key={o.clave} onClick={() => mover(t, o.dias)} className={btn}>{o.etiqueta}</button>)}
                      <button onClick={() => hecha(t)} className="flex items-center gap-1 rounded-full border border-success/40 px-2.5 py-1 text-[11px] font-bold text-success"><Check size={11} /> Hecha</button>
                      <button onClick={() => borrar(t)} aria-label="Eliminar" className="ml-auto text-textSecondary hover:text-danger"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-textSecondary">{proximas.length === 0 ? 'No hay entregas en los próximos 7 días.' : `${proximas.length} entrega${proximas.length > 1 ? 's' : ''} en los próximos 7 días.`}</p>
          {foco.length > 0 && (
            <div className="rounded-sm2 bg-primarySoft/50 p-3">
              <p className="mb-1 text-xs font-extrabold text-primary">Empieza por</p>
              {foco.map(({ tarea, razones }, i) => <p key={tarea.id} className="text-[13px]"><b>{i + 1}. {tarea.title}</b> <span className="text-[11px] text-textSecondary">— {razones[0] || 'próxima'}</span></p>)}
            </div>
          )}
          <div className="space-y-1.5">
            {proximas.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-sm2 bg-bg p-2.5">
                <span className="min-w-0"><span className="block truncate text-sm font-semibold">{t.title}</span><span className="text-[11px] text-textSecondary">{materia(t) || (t.category === 'trabajo' ? 'Trabajo' : 'Universidad')}</span></span>
                <span className="shrink-0 text-[11px] font-bold text-textSecondary">{formatearFechaHora(t.due_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Para cerrar: ¿qué salió bien esta semana y qué mejorarías? <span className="font-normal text-textSecondary">(opcional; se guarda solo en este dispositivo)</span></p>
          <textarea value={reflexion} onChange={(e) => setReflexion(e.target.value)} rows={4} placeholder="Ej: Terminé el informe a tiempo. La próxima semana empiezo los trabajos antes." className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={terminar} className="flex w-full items-center justify-center gap-2 rounded-sm2 bg-primary py-3 text-sm font-bold text-white"><PartyPopper size={16} /> Terminar mi revisión</button>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button onClick={() => setPaso((p) => Math.max(0, p - 1))} disabled={paso === 0} className="flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold text-textSecondary disabled:opacity-30"><ArrowLeft size={14} /> Atrás</button>
        {paso < PASOS.length - 1 && <button onClick={() => setPaso((p) => p + 1)} className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white">Siguiente <ArrowRight size={14} /></button>}
      </div>
    </Cascaron>
  );
}

function Cascaron({ children, onCerrar, paso = 0, setPaso }) {
  return (
    <div className="fixed inset-0 z-[62] flex items-end justify-center bg-black/50 p-3 sm:items-center" role="dialog" aria-label="Revisión semanal" onClick={onCerrar}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg2 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-lg font-extrabold">🗓️ Revisión semanal</p><p className="text-xs text-textSecondary">Paso {paso + 1} de {PASOS.length}: {PASOS[paso]}</p></div>
          <button onClick={onCerrar} aria-label="Cerrar" className="rounded-full p-1.5 hover:bg-black/5"><X size={18} /></button>
        </div>
        <div className="my-3 flex gap-1">{PASOS.map((p, i) => <button key={p} onClick={() => setPaso?.(i)} aria-label={p} className={`h-1.5 flex-1 rounded-full ${i <= paso ? 'bg-primary' : 'bg-black/10'}`} />)}</div>
        {children}
      </div>
    </div>
  );
}
