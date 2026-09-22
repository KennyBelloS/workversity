import { useState } from 'react';
import { Bell, Video, CalendarPlus, Check, Wallet, Sparkles, Smartphone, Command } from 'lucide-react';

const d = (n) => ({ animationDelay: `${n}s` });
const Caja = ({ children, className = '', style }) => <div className={`rounded-xl bg-white shadow-card ${className}`} style={style}>{children}</div>;
const COLORES = { clase: '#5B8DEF', fisica: '#E5789C', web: '#7FD1C3', trabajo: '#8B7FD1', reunion: '#E5789C', tarea: '#F5A524' };

export function IlusMaterias() {
  const mats = [['Cálculo II', COLORES.clase, 'B-204', 1], ['Física', COLORES.fisica, 'A-101', 3], ['Programación', COLORES.web, '💻 Virtual', 2]];
  return (
    <div className="grid h-full grid-cols-2 gap-3 p-3">
      <div className="space-y-2">
        {mats.map(([n, c, s], i) => (
          <Caja key={n} className="anim-slide-x p-2.5" style={{ borderLeft: `4px solid ${c}`, ...d(0.3 + i * 0.8) }}>
            <p className="text-xs font-extrabold">{n}</p><p className="text-[10px] text-textSecondary">{s}</p>
          </Caja>
        ))}
      </div>
      <div className="rounded-xl bg-bg p-2">
        <p className="mb-1.5 text-center text-[10px] font-bold text-textSecondary">Se agregan solas a tu agenda</p>
        <div className="grid grid-cols-5 gap-1" style={{ height: '78%' }}>
          {[0, 1, 2, 3, 4].map((col) => (
            <div key={col} className="relative rounded bg-white/70">
              {mats.map(([n, c, , dia], i) => (dia - 1 === col || dia + 1 === col) && (
                <span key={n} className="anim-pop absolute inset-x-0.5 rounded" style={{ top: `${12 + i * 24}%`, height: '30%', backgroundColor: `${c}55`, borderLeft: `3px solid ${c}`, ...d(1.4 + i * 0.8) }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function IlusAgenda() {
  const filtros = [['Clases', COLORES.clase], ['Trabajo', COLORES.trabajo], ['Reuniones', COLORES.reunion], ['Tareas', COLORES.tarea]];
  const bloques = [[0, 12, 26, COLORES.clase, 0.6], [1, 40, 24, COLORES.trabajo, 1.1], [2, 18, 22, COLORES.reunion, 1.6], [3, 52, 26, COLORES.clase, 2.1], [4, 30, 8, COLORES.tarea, 2.6, true], [2, 60, 20, COLORES.trabajo, 2.9]];
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex flex-wrap gap-1.5">{filtros.map(([t, c], i) => <span key={t} className="anim-pop rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${c}25`, color: c, ...d(0.1 + i * 0.15) }}>{t}</span>)}</div>
      <div className="relative grid flex-1 grid-cols-5 gap-1 rounded-xl bg-bg p-1.5">
        {['L', 'M', 'X', 'J', 'V'].map((dia, col) => (
          <div key={dia} className="relative rounded bg-white/70">
            <span className="block text-center text-[9px] font-bold text-textSecondary">{dia}</span>
            {bloques.filter((b) => b[0] === col).map(([, top, h, c, t, punteado], i) => (
              <span key={i} className="anim-pop absolute inset-x-0.5 rounded" style={{ top: `${top}%`, height: `${h}%`, backgroundColor: `${c}40`, borderLeft: `3px ${punteado ? 'dashed' : 'solid'} ${c}`, ...d(t) }} />
            ))}
          </div>
        ))}
        <span className="anim-now pointer-events-none absolute inset-x-1 h-px bg-danger" />
      </div>
    </div>
  );
}

export function IlusTareas() {
  const col = (t, c) => <div className="flex-1 rounded-lg bg-bg p-1.5"><p className="mb-1 text-[9px] font-extrabold" style={{ color: c }}>{t}</p></div>;
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <Caja className="flex items-center gap-2 px-2.5 py-1.5">
        <Sparkles size={13} className="text-warning" />
        <span className="text-[10px] font-semibold text-textSecondary">informe de física mañana 5pm !alta<span className="anim-blink">|</span></span>
        <span className="anim-pop ml-auto rounded-full bg-infoSoft px-1.5 py-0.5 text-[9px] font-bold text-info" style={d(1.6)}>Mañana 5:00 p. m.</span>
      </Caja>
      <div className="relative flex flex-1 gap-2">
        {col('Por hacer', '#8B93A7')}{col('En progreso', '#F5A524')}{col('Hecha', '#17C964')}
        <div className="anim-card absolute left-0 top-6 w-[calc(33.3%-0.35rem)]">
          <Caja className="p-1.5" style={{ borderLeft: `3px solid ${COLORES.clase}` }}>
            <p className="text-[10px] font-extrabold">Informe de Física</p>
            <span className="rounded-full bg-primarySoft px-1.5 text-[8px] font-bold text-primary">Física</span>
          </Caja>
        </div>
      </div>
    </div>
  );
}

export function IlusAsistente() {
  const filas = [['Parcial de Cálculo', 'Vence en pocas horas', 1.0], ['Informe de Física', 'Prioridad alta', 1.8], ['Taller de Web', 'Vence mañana', 2.6]];
  return (
    <div className="grid h-full grid-cols-5 gap-2 p-3">
      <div className="col-span-3 space-y-1.5">
        <p className="text-[10px] font-extrabold">¿Qué hago ahora?</p>
        {filas.map(([t, r, dl], i) => (
          <Caja key={t} className="anim-slide flex items-center gap-2 p-1.5" style={d(dl)}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-white">{i + 1}</span>
            <span className="min-w-0"><span className="block truncate text-[10px] font-bold">{t}</span><span className="text-[9px] text-primary">{r}</span></span>
          </Caja>
        ))}
        <Caja className="anim-slide p-1.5 text-[9px]" style={d(3.4)}>🕐 Hueco libre 2:00–3:00 → <b>Parcial</b></Caja>
      </div>
      <div className="col-span-2 grid grid-cols-2 gap-1">
        {[['#E5484D', 'Ya'], ['#3E7BFA', 'Planificar'], ['#F5A524', 'Rápido'], ['#8B93A7', 'Esperar']].map(([c, t], i) => (
          <div key={t} className="anim-pop flex items-center justify-center rounded-lg text-[9px] font-extrabold" style={{ backgroundColor: `${c}22`, color: c, ...d(1.2 + i * 0.5) }}>{t}</div>
        ))}
      </div>
    </div>
  );
}

export function IlusNotas() {
  const cortes = [['Corte 1', 35, '4.15', '#5B8DEF', 0.4], ['Corte 2', 35, '3.00', '#8B7FD1', 1.2], ['Corte 3', 30, '2.00', '#E5789C', 2.0]];
  return (
    <div className="flex h-full flex-col justify-center gap-2 p-3">
      {cortes.map(([n, p, nota, c, t]) => (
        <div key={n} className="flex items-center gap-2">
          <span className="w-12 text-[10px] font-extrabold">{n}</span>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-bg"><div className="anim-fill h-full rounded-full" style={{ width: `${p * 2.4}%`, backgroundColor: c, ...d(t) }} /></div>
          <span className="w-8 text-[10px] font-bold text-textSecondary">{p}%</span>
          <span className="anim-pop w-8 text-right text-[11px] font-extrabold" style={{ color: c, ...d(t + 1) }}>{nota}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between rounded-xl bg-primarySoft px-3 py-2">
        <span className="text-[10px] font-bold text-primary">Nota final calculada</span>
        <span className="num-seq text-right text-lg font-extrabold text-primary"><span>0.00</span><span>1.45</span><span>2.53</span><span>3.10</span></span>
      </div>
    </div>
  );
}

export function IlusNotificaciones() {
  return (
    <div className="relative flex h-full items-center justify-center gap-6 p-3">
      <div className="anim-float relative"><Bell size={44} className="anim-bell text-primary" /><span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-extrabold text-white">3</span></div>
      <div className="relative h-36 w-24 rounded-2xl border-4 border-textSecondary/40 bg-bg">
        <div className="anim-toast absolute inset-x-1 top-2 rounded-lg bg-white p-1.5 shadow-card"><p className="text-[8px] font-extrabold">⏰ Faltan 1 h para «Parcial de Cálculo»</p><p className="text-[7px] text-textSecondary">Con la app cerrada</p></div>
        <Smartphone size={16} className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-textSecondary/50" />
      </div>
    </div>
  );
}

export function IlusCalendario() {
  const ev = [['Cálculo II', COLORES.clase], ['Reunión', COLORES.reunion], ['Parcial', COLORES.tarea], ['Turno', COLORES.trabajo]];
  return (
    <div className="grid h-full grid-cols-2 items-center gap-3 p-3">
      <div className="space-y-1.5">
        <Caja className="p-2 text-center text-[10px] font-extrabold text-primary">Workversity</Caja>
        <p className="text-center text-[9px] text-textSecondary">.ics · enlace de suscripción</p>
      </div>
      <div className="rounded-xl bg-bg p-2">
        <p className="mb-1 flex items-center justify-center gap-1 text-[10px] font-bold text-textSecondary"><CalendarPlus size={11} /> Google · iPhone · Outlook</p>
        <div className="space-y-1">{ev.map(([n, c], i) => <div key={n} className="anim-fly rounded px-1.5 py-1 text-[9px] font-bold" style={{ backgroundColor: `${c}30`, borderLeft: `3px solid ${c}`, color: c, ...d(0.4 + i * 0.6) }}>{n} 🔔</div>)}</div>
      </div>
    </div>
  );
}

export function IlusResumen() {
  const barras = [30, 55, 40, 75, 60, 90, 50];
  return (
    <div className="grid h-full grid-cols-5 gap-3 p-3">
      <div className="col-span-3 flex items-end justify-between gap-1.5 rounded-xl bg-bg p-2">
        {barras.map((h, i) => <span key={i} className="anim-grow flex-1 rounded-t bg-primary/80" style={{ height: `${h}%`, ...d(0.2 + i * 0.15) }} />)}
      </div>
      <div className="col-span-2 flex flex-col justify-center gap-2">
        <svg viewBox="0 0 36 36" className="mx-auto h-16 w-16 -rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke="rgb(var(--bg))" strokeWidth="5" /><circle cx="18" cy="18" r="15" fill="none" stroke="#17C964" strokeWidth="5" strokeLinecap="round" strokeDasharray="94" strokeDashoffset="94" style={{ animation: 'wv-dash-fill 1.6s ease-out 0.6s forwards' }} /></svg>
        <style>{'@keyframes wv-dash-fill { to { stroke-dashoffset: 24; } }'}</style>
        <p className="text-center text-[10px] font-extrabold text-success">74% cumplido</p>
      </div>
    </div>
  );
}

export function IlusFinanzas() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-4">
      <div><div className="mb-1 flex justify-between text-[10px] font-bold"><span>Presupuesto del mes</span><span className="text-textSecondary">$1.200.000</span></div><div className="h-3 overflow-hidden rounded-full bg-bg"><div className="anim-fill h-full rounded-full bg-success" style={{ width: '62%', ...d(0.4) }} /></div></div>
      <div className="flex gap-2">{[['Comida', '#F5A524', '-$45.000'], ['Transporte', '#3E7BFA', '-$12.000'], ['Ahorro', '#17C964', '+$150.000']].map(([t, c, v], i) => <Caja key={t} className="anim-slide flex-1 p-2 text-center" style={{ borderTop: `3px solid ${c}`, ...d(1 + i * 0.6) }}><Wallet size={12} className="mx-auto" style={{ color: c }} /><p className="text-[9px] font-bold">{t}</p><p className="text-[10px] font-extrabold" style={{ color: c }}>{v}</p></Caja>)}</div>
    </div>
  );
}

export function IlusAtajos() {
  const iconos = ['📊', '🗓️', '✅', '📚', '💰'];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-3">
      <div className="flex gap-1.5 rounded-2xl bg-white px-2.5 py-1.5 shadow-card">
        {iconos.map((e, i) => <span key={e} className="anim-pop flex h-8 w-8 items-center justify-center rounded-full bg-primarySoft text-sm" style={d(0.3 + i * 0.25)}>{e}</span>)}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-textSecondary">
        <kbd className="anim-key rounded-md border border-black/10 bg-white px-2 py-1 shadow-card">Ctrl</kbd>+<kbd className="anim-key rounded-md border border-black/10 bg-white px-2 py-1 shadow-card" style={d(0.15)}><Command size={11} className="inline" /> K</kbd>
        <span className="ml-1">busca todo al instante</span>
      </div>
      <p className="text-[10px] text-textSecondary">Instálala · funciona sin internet</p>
    </div>
  );
}

// ------------------------------------------------------------------ Mapa "en conjunto"
const NODOS = {
  materias: { x: 70, y: 170, t: 'Materias', c: '#5B8DEF', e: '📚', txt: 'Es el punto de partida: registras tus materias (día, hora, salón o virtual). De aquí salen tu agenda, la asociación de tareas y el cálculo de notas.' },
  agenda: { x: 265, y: 55, t: 'Agenda', c: '#7FD1C3', e: '🗓️', txt: 'Junta clases, trabajo, reuniones y tareas en una sola vista. Sirve de base para los huecos libres, los avisos y el calendario externo.' },
  tareas: { x: 265, y: 170, t: 'Tareas', c: '#F5A524', e: '✅', txt: 'Cada tarea de universidad va ligada a una materia. Alimenta las alertas, el plan del asistente, el resumen y tu racha.' },
  notas: { x: 265, y: 285, t: 'Notas', c: '#8B7FD1', e: '🎓', txt: 'Tres cortes por materia (35/35/30 por defecto), con actividades y porcentajes. Calcula tu nota y lo que necesitas para tu meta.' },
  avisos: { x: 470, y: 35, t: 'Avisos', c: '#E5484D', e: '🔔', txt: 'La campana y las notificaciones push te avisan antes de cada tarea, clase o reunión, y si una materia está en riesgo.' },
  calendario: { x: 470, y: 110, t: 'Calendario', c: '#3E7BFA', e: '📅', txt: 'Exporta tu agenda y tareas (con alarmas) a Google Calendar, iPhone u Outlook, o suscríbete para que se actualice sola.' },
  asistente: { x: 470, y: 195, t: 'Asistente', c: '#E5789C', e: '✨', txt: 'Te dice qué hacer ahora, dónde hay huecos libres y cómo planificar trabajos grandes, usando tus tareas y tus notas.' },
  resumen: { x: 470, y: 280, t: 'Resumen', c: '#17C964', e: '📊', txt: 'Semana o mes en un vistazo: tareas, enfoque, dinero, notas y avance por materia. Lo puedes copiar o imprimir.' },
};
const ARISTAS = [['materias', 'agenda'], ['materias', 'tareas'], ['materias', 'notas'], ['agenda', 'avisos'], ['agenda', 'calendario'], ['tareas', 'avisos'], ['tareas', 'calendario'], ['tareas', 'asistente'], ['tareas', 'resumen'], ['notas', 'asistente'], ['notas', 'resumen'], ['notas', 'avisos']];

export function MapaConjunto({ interactivo = false, compacto = false }) {
  const [sel, setSel] = useState(null);
  const camino = (a, b) => { const A = NODOS[a]; const B = NODOS[b]; const x1 = A.x + 50; const x2 = B.x - 50; const m = (x1 + x2) / 2; return `M ${x1} ${A.y} C ${m} ${A.y}, ${m} ${B.y}, ${x2} ${B.y}`; };
  return (
    <div>
      <svg viewBox="0 0 560 330" className="w-full" role="img" aria-label="Cómo se conectan los módulos de Workversity">
        {ARISTAS.map(([a, b], i) => {
          const activa = !sel || sel === a || sel === b;
          const p = camino(a, b);
          return (
            <g key={a + b} opacity={activa ? 1 : 0.12}>
              <path d={p} fill="none" stroke={NODOS[a].c} strokeWidth="2" className="anim-dash" />
              <circle r="3.5" fill={NODOS[a].c}><animateMotion dur={`${3 + (i % 3)}s`} repeatCount="indefinite" path={p} begin={`${(i % 4) * 0.5}s`} /></circle>
            </g>
          );
        })}
        {Object.entries(NODOS).map(([k, n]) => (
          <g key={k} transform={`translate(${n.x - 50},${n.y - 20})`} onClick={interactivo ? () => setSel(sel === k ? null : k) : undefined} style={{ cursor: interactivo ? 'pointer' : 'default' }} opacity={!sel || sel === k || ARISTAS.some(([a, b]) => (a === sel && b === k) || (b === sel && a === k)) ? 1 : 0.35}>
            <rect width="100" height="40" rx="12" fill="rgb(var(--surface))" stroke={n.c} strokeWidth={sel === k ? 3 : 1.6} />
            <text x="14" y="25" fontSize="14">{n.e}</text>
            <text x="34" y="25" fontSize={compacto ? 11 : 12} fontWeight="800" fill="rgb(var(--textPrimary))">{n.t}</text>
          </g>
        ))}
      </svg>
      {interactivo && (
        <div className="mt-2 min-h-[3.5rem] rounded-sm2 bg-bg p-3 text-xs">
          {sel ? (<><p className="font-extrabold" style={{ color: NODOS[sel].c }}>{NODOS[sel].e} {NODOS[sel].t}</p><p className="mt-0.5 text-textSecondary">{NODOS[sel].txt}</p></>) : <p className="text-textSecondary">👆 Toca un módulo para ver qué recibe y qué le da a los demás.</p>}
        </div>
      )}
    </div>
  );
}

export const IlusConjunto = () => <div className="flex h-full items-center p-2"><div className="w-full"><MapaConjunto compacto /></div></div>;
export { Check, Video };
