import { useEffect } from 'react';
import { Brain, ShieldCheck, Lightbulb } from 'lucide-react';
import { useHabitos } from '../../hooks/useHabitos';
import { listarSesionesRecientes, listarEnergiaUltimos } from '../../services/analitica';
import { listarTareas } from '../../services/tareas';
import { listarMaterias } from '../../services/materias';

const COLOR_CONF = { alta: '#17C964', media: '#F5A524', baja: '#8B93A7' };
const Tarjeta = ({ titulo, sub, children }) => (
  <div className="rounded-md2 bg-white p-4 shadow-card"><p className="text-sm font-extrabold">{titulo}</p>{sub && <p className="mb-3 text-[11px] text-textSecondary">{sub}</p>}{children}</div>
);
const Barra = ({ etiqueta, valor, max, color, texto }) => (
  <div className="flex items-center gap-2"><span className="w-20 shrink-0 truncate text-[11px] font-bold">{etiqueta}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full transition-all" style={{ width: `${max ? (valor / max) * 100 : 0}%`, backgroundColor: color }} /></div><span className="w-14 shrink-0 text-right text-[11px] font-bold text-textSecondary">{texto}</span></div>
);

export default function HabitosTab() {
  const { habitos: h, aprender, setAprender, recargar } = useHabitos();

  // Se asegura de tener a mano el historial más reciente (Pomodoros de 90 días, energía de 60).
  useEffect(() => {
    Promise.all([listarTareas(), listarMaterias(), listarSesionesRecientes(90), listarEnergiaUltimos(60)]).then(recargar).catch(() => {});
  }, [recargar]);

  if (!h) return <p className="py-10 text-center text-sm text-textSecondary">Analizando tus hábitos…</p>;
  const nivel = h.muestrasTotales < 10 ? ['Conociéndote', 10] : h.muestrasTotales < 30 ? ['Aprendiendo tu ritmo', 30] : ['Te conozco bien', h.muestrasTotales];
  const maxHora = Math.max(1, ...h.franjas.porHora);
  const maxDia = Math.max(1, ...h.dias.porDia.map((d) => d.hechas * 2 + d.minutos / 25));
  const b = h.puntualidad.buckets;
  const totalB = Math.max(1, h.puntualidad.muestras);
  const segmentos = [['Tarde', b.tarde, '#E5484D'], ['Última hora', b.ultimaHora, '#F5A524'], ['Ese día', b.unDia, '#3E7BFA'], ['1-3 días antes', b.anticipado, '#17C964'], ['+3 días antes', b.muyAnticipado, '#7FD1C3']];
  const maxMat = Math.max(1, ...h.porMateria.map((x) => x.minutos));

  return (
    <div className="space-y-4">
      <div className="rounded-md2 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Brain size={22} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-extrabold">Lo que la app aprende de ti</p>
              <p className="mt-0.5 max-w-xl text-xs text-textSecondary">Observa cuándo rindes, cuánto tardas de verdad y cuándo entregas, y lo usa para hacerte mejores sugerencias. Todo se calcula en tu dispositivo con tus propios datos.</p>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-full bg-bg px-3 py-2 text-xs font-bold">
            Usar lo aprendido
            <input type="checkbox" checked={aprender} onChange={(e) => setAprender(e.target.checked)} className="relative h-5 w-9 cursor-pointer appearance-none rounded-full bg-black/15 transition before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition checked:bg-primary checked:before:translate-x-4" />
          </label>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] font-bold"><span>{nivel[0]}</span><span className="text-textSecondary">{h.muestrasTotales} datos</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (h.muestrasTotales / 30) * 100)}%` }} /></div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-textSecondary"><ShieldCheck size={13} className="shrink-0 text-success" /> {aprender ? 'Activado: uso lo aprendido en el planificador, los huecos libres, los recordatorios y las alertas.' : 'Desactivado: sigo aprendiendo pero no cambio tus sugerencias.'}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {h.aprendizajes.map((a) => (
          <div key={a.id} className={`rounded-md2 p-4 shadow-card ${a.listo ? 'bg-white' : 'border border-dashed border-black/15 bg-bg'}`}>
            <div className="flex items-start justify-between gap-2"><span className="text-2xl">{a.icono}</span><span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ backgroundColor: `${COLOR_CONF[a.confianza]}22`, color: COLOR_CONF[a.confianza] }}>{a.listo ? `confianza ${a.confianza}` : 'aprendiendo'}</span></div>
            <p className="mt-1 text-sm font-extrabold leading-snug">{a.titulo}</p>
            <p className="mt-0.5 text-[11px] text-textSecondary">{a.detalle}</p>
            <p className="mt-2 text-[10px] font-bold text-primary">Se usa en: {a.aplicado}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Tus horas de enfoque" sub="Minutos de Pomodoro terminados en cada hora del día">
          <div className="flex h-28 items-end gap-[3px]">
            {h.franjas.porHora.map((m, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${i}:00 → ${m} min`}>
                <div className="w-full rounded-t transition-all" style={{ height: `${(m / maxHora) * 100}%`, minHeight: m ? 3 : 1, backgroundColor: h.franjas.horasFuertes?.has(i) ? '#17C964' : '#6FA8DC', opacity: m ? 1 : 0.25 }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-textSecondary"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div>
          <p className="mt-2 text-[11px] text-textSecondary">{h.franjas.mejorHora != null ? `🟢 Verde = tus mejores horas. Ahí pongo tus tareas exigentes en los huecos libres.` : 'Termina algunos Pomodoros para descubrir tus mejores horas.'}</p>
        </Tarjeta>

        <Tarjeta titulo="Tus días de la semana" sub="Tareas completadas y enfoque por día">
          <div className="space-y-2">{h.dias.nombres.map((n, i) => { const d = h.dias.porDia[i]; return <Barra key={n} etiqueta={n.slice(0, 3)} valor={d.hechas * 2 + d.minutos / 25} max={maxDia} color={h.dias.mejorDia === i ? '#17C964' : '#8B7FD1'} texto={`${d.hechas} · ${d.minutos}m`} />; })}</div>
        </Tarjeta>

        <Tarjeta titulo="¿Cuándo terminas tus tareas?" sub="Cuánto antes de la fecha de entrega las marcas como hechas">
          {h.puntualidad.muestras === 0 ? <p className="py-6 text-center text-xs text-textSecondary">Marca tareas como hechas para ver tu patrón.</p> : (
            <>
              <div className="flex h-5 overflow-hidden rounded-full bg-bg">{segmentos.map(([t, n, c]) => n > 0 && <div key={t} title={`${t}: ${n}`} style={{ width: `${(n / totalB) * 100}%`, backgroundColor: c }} />)}</div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">{segmentos.map(([t, n, c]) => <span key={t} className="flex items-center gap-1 text-[10px] font-bold text-textSecondary"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />{t}: {n}</span>)}</div>
              {h.puntualidad.recordatorioSugerido && <p className="mt-2 flex items-start gap-1.5 rounded-sm2 bg-primarySoft/50 p-2 text-[11px] font-semibold text-primary"><Lightbulb size={13} className="mt-0.5 shrink-0" /> Al crear tareas te sugiero un recordatorio {h.puntualidad.recordatorioSugerido === 1440 ? '1 día antes' : h.puntualidad.recordatorioSugerido === 180 ? '3 horas antes' : '1 hora antes'}.</p>}
            </>
          )}
        </Tarjeta>

        <Tarjeta titulo="Estimado vs. real" sub="Cuánto tardas frente a lo que calculas (Pomodoros ligados a tareas)">
          {h.estimacion.factor == null ? <p className="py-6 text-center text-xs text-textSecondary">Pon minutos estimados a tus tareas y elige la tarea al iniciar un Pomodoro. Con 3 tareas terminadas ya aprendo.</p> : (
            <div className="space-y-2"><Barra etiqueta="Estimas" valor={60} max={60 * Math.max(1, h.estimacion.factor)} color="#8B93A7" texto="60 min" /><Barra etiqueta="Tardas" valor={60 * h.estimacion.factor} max={60 * Math.max(1, h.estimacion.factor)} color={h.estimacion.factor > 1.15 ? '#F5A524' : '#17C964'} texto={`${Math.round(60 * h.estimacion.factor)} min`} /><p className="text-[11px] text-textSecondary">Ejemplo con una tarea de 60 min. Factor aprendido: ×{h.estimacion.factor.toFixed(2)}.</p></div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Energía y productividad" sub="Tareas completadas por día según tu energía registrada">
          {h.energia.alta == null ? <p className="py-6 text-center text-xs text-textSecondary">Registra tu energía en la pestaña Enfoque unos días ({h.energia.dias}/6).</p> : (
            <div className="space-y-2"><Barra etiqueta="Energía 4-5" valor={h.energia.alta} max={Math.max(h.energia.alta, h.energia.baja, 0.1)} color="#17C964" texto={`${h.energia.alta.toFixed(1)}/día`} /><Barra etiqueta="Energía 1-2" valor={h.energia.baja} max={Math.max(h.energia.alta, h.energia.baja, 0.1)} color="#E5484D" texto={`${h.energia.baja.toFixed(1)}/día`} /></div>
          )}
        </Tarjeta>

        <Tarjeta titulo="Estudio por materia" sub="Minutos de enfoque en tareas de cada materia">
          {h.porMateria.length === 0 ? <p className="py-6 text-center text-xs text-textSecondary">Registra materias y liga tus Pomodoros a tareas.</p> : (
            <div className="space-y-2">{h.porMateria.map((x) => <Barra key={x.nombre} etiqueta={x.nombre} valor={x.minutos} max={maxMat} color={x.color} texto={`${x.minutos} min`} />)}</div>
          )}
        </Tarjeta>
      </div>

      <div className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-2 flex items-center gap-2 text-sm font-extrabold"><Lightbulb size={16} className="text-warning" /> Para que aprenda más rápido</p>
        <ul className="grid gap-1.5 text-xs text-textSecondary sm:grid-cols-2">
          <li>⏱️ Pon minutos estimados a tus tareas.</li><li>🍅 Elige la tarea al iniciar un Pomodoro.</li>
          <li>✅ Marca tus tareas al terminarlas.</li><li>⚡ Registra tu energía cada día.</li>
        </ul>
      </div>
    </div>
  );
}
