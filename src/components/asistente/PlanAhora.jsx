import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Check, Flame, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { completarTarea } from '../../services/tareas';
import { obtenerEnergiaHoy } from '../../services/analitica';
import { recomendarAhora, clasificarEisenhower, calcularRacha } from '../../lib/productividad';
import { formatearFechaHora, minutosAHora } from '../../lib/dateUtils';
import { eventosDeSemana, inicioDeSemana } from '../../lib/agenda';
import { calcularHuecos, asignarAHuecos } from '../../lib/huecos';
import { useHabitos } from '../../hooks/useHabitos';

const CUADROS = [
  { clave: 'hacerYa', titulo: 'Hazlo ya', sub: 'Urgente e importante', color: '#E5484D' },
  { clave: 'planificar', titulo: 'Planifícalo', sub: 'Importante, no urgente', color: '#3E7BFA' },
  { clave: 'rapidas', titulo: 'Resuélvelo rápido', sub: 'Urgente, poco importante', color: '#F5A524' },
  { clave: 'despues', titulo: 'Puede esperar', sub: 'Ni urgente ni importante', color: '#8B93A7' },
];

export default function PlanAhora({ tareas, sesiones, materias, bloques = [], onCambio }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [energia, setEnergia] = useState(null);
  const ahora = new Date();
  const { habitos, aprender } = useHabitos();

  useEffect(() => {
    obtenerEnergiaHoy().then((r) => setEnergia(r?.nivel ?? null)).catch(() => {});
  }, []);

  const recomendadas = recomendarAhora(tareas, { ahora, energia, n: 3 });
  const eis = clasificarEisenhower(tareas, ahora);
  const racha = calcularRacha(tareas, sesiones, ahora);
  const eventosHoy = eventosDeSemana(inicioDeSemana(ahora), { materias, bloques, tareas: [] }).filter((e) => e.dia === (ahora.getDay() + 6) % 7);
  const huecos = calcularHuecos(eventosHoy, { ahora });
  const factor = (aprender && habitos?.estimacion.factor) || 1;
  const horasFuertes = aprender ? habitos?.franjas.horasFuertes || null : null;
  const propuesta = asignarAHuecos(huecos, recomendadas.map((r) => r.tarea), { factor, preferirHoras: horasFuertes });
  const aprendiendo = factor !== 1 || !!horasFuertes;
  const hh = (f) => minutosAHora(f.getHours() * 60 + f.getMinutes());
  const materiaPorId = new Map(materias.map((m) => [m.id, m]));

  const hecha = async (t) => { await completarTarea(t, usuario.id, 'hecha'); onCambio?.(); };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md2 bg-white p-4 shadow-card lg:col-span-2">
          <p className="flex items-center gap-2 text-sm font-extrabold"><Target size={16} className="text-primary" /> ¿Qué hago ahora?</p>
          <p className="mb-3 text-xs text-textSecondary">
            Ordenadas por urgencia y prioridad{energia != null ? `, y ajustadas a tu energía de hoy (${energia}/5)` : ' (registra tu energía en la pestaña Enfoque para afinarlo)'}.
          </p>
          {recomendadas.length === 0 ? (
            <p className="rounded-sm2 bg-successSoft py-8 text-center text-sm font-semibold text-success">No tienes tareas pendientes 🎉</p>
          ) : (
            <div className="space-y-2">
              {recomendadas.map(({ tarea: t, razones }, i) => (
                <div key={t.id} className="flex items-start gap-3 rounded-sm2 bg-bg p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => navigate('/tareas')} className="block max-w-full truncate text-left text-sm font-bold">{t.title}</button>
                    <p className="text-[11px] text-textSecondary">
                      {formatearFechaHora(t.due_date)}{t.materia_id && materiaPorId.get(t.materia_id) ? ` · ${materiaPorId.get(t.materia_id).nombre}` : ''}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {razones.map((r) => <span key={r} className="rounded-full bg-primarySoft px-2 py-0.5 text-[10px] font-bold text-primary">{r}</span>)}
                    </div>
                  </div>
                  <button onClick={() => hecha(t)} className="flex shrink-0 items-center gap-1 rounded-full border border-success/40 px-3 py-1.5 text-[11px] font-bold text-success hover:bg-success/10">
                    <Check size={13} /> Hecha
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md2 bg-white p-4 shadow-card">
          <p className="flex items-center gap-2 text-sm font-extrabold"><Flame size={16} className="text-warning" /> Tu racha</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight">{racha}<span className="ml-1 text-base font-bold text-textSecondary">día{racha !== 1 ? 's' : ''}</span></p>
          <p className="mt-1 text-xs text-textSecondary">
            {racha === 0 ? 'Completa una tarea o un Pomodoro hoy para empezar tu racha.' : 'Días seguidos completando tareas o Pomodoros. ¡No la rompas hoy!'}
          </p>
        </div>
      </div>

      <div className="rounded-md2 bg-white p-4 shadow-card">
        <p className="flex items-center gap-2 text-sm font-extrabold"><Clock size={16} className="text-primary" /> Huecos libres de hoy</p>
        <p className="mb-3 text-xs text-textSecondary">Los espacios de 45 min o más entre tus clases y compromisos (7:00 a 21:00), con la tarea sugerida para cada uno.{aprendiendo && <span className="ml-1 rounded-full bg-primarySoft px-2 py-0.5 text-[10px] font-bold text-primary">🧠 ajustado a tus hábitos</span>}</p>
        {huecos.length === 0 ? (
          <p className="rounded-sm2 bg-bg py-4 text-center text-xs text-textSecondary">No quedan huecos de 45 minutos hoy. ¡Descansa cuando puedas!</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {huecos.map((h, i) => {
              const p = propuesta.find((x) => x.inicio.getTime() >= h.inicio.getTime() && x.inicio.getTime() < h.fin.getTime());
              return (
                <div key={i} className="rounded-sm2 bg-bg p-3">
                  <p className="text-xs font-extrabold">{hh(h.inicio)} – {hh(h.fin)} <span className="font-medium text-textSecondary">· {h.minutos} min libres</span></p>
                  <p className="mt-0.5 text-[11px] text-textSecondary">{p ? <>👉 <b className="text-textPrimary">{p.tarea.title}</b> ({hh(p.inicio)}–{hh(p.fin)}, {p.minutos} min){p.enTuMejorHora && <span className="ml-1 font-bold text-success">⭐ en tu mejor hora</span>}</> : 'Libre: úsalo para adelantar o descansar'}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-md2 bg-white p-4 shadow-card">
        <p className="text-sm font-extrabold">Matriz de prioridades (Eisenhower)</p>
        <p className="mb-3 text-xs text-textSecondary">Urgente = vence en menos de 48 h. Importante = prioridad alta (o media y larga).</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {CUADROS.map((c) => (
            <div key={c.clave} className="rounded-sm2 border p-3" style={{ borderColor: `${c.color}55`, backgroundColor: `${c.color}0F` }}>
              <p className="text-xs font-extrabold" style={{ color: c.color }}>{c.titulo} <span className="opacity-70">· {eis[c.clave].length}</span></p>
              <p className="mb-2 text-[10px] text-textSecondary">{c.sub}</p>
              {eis[c.clave].length === 0 ? <p className="text-[11px] text-textSecondary">—</p> : (
                <ul className="space-y-1">
                  {eis[c.clave].slice(0, 4).map((t) => (
                    <li key={t.id}><button onClick={() => navigate('/tareas')} className="block max-w-full truncate text-left text-xs font-semibold">• {t.title}</button></li>
                  ))}
                  {eis[c.clave].length > 4 && <li className="text-[10px] text-textSecondary">y {eis[c.clave].length - 4} más…</li>}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
