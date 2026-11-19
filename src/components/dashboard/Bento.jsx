import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SkipBack, SkipForward, Play, Pause, Moon, ShieldAlert, Video, MapPin, ArrowUpRight, RotateCcw } from 'lucide-react';
import { minutosAHora } from '../../lib/dateUtils';
import { textoDuracion, TIPOS_AGENDA } from '../../lib/agenda';
import { previewDeEvento } from '../../lib/preview';

// ---------------------------------------------------------------------------------------------
// Bento del Dashboard (referencia: tablero de widgets que se arma pieza por pieza y cuyas cifras
// cuentan hacia arriba). Cada pieza entra escalonada; los números arrancan en 0 y suben.
// ---------------------------------------------------------------------------------------------

const hora = (f) => minutosAHora(f.getHours() * 60 + f.getMinutes());
const reducido = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Número que cuenta desde 0 hasta `valor` (con aceleración suave) después de `retraso` ms. */
export function useContador(valor, retraso = 0, duracion = 1100) {
  const [v, setV] = useState(() => (reducido() ? valor : 0));
  const desde = useRef(0);
  useEffect(() => {
    if (reducido()) { setV(valor); return undefined; }
    let raf = 0;
    const inicio = desde.current;
    const t0 = performance.now() + retraso;
    const paso = (t) => {
      const p = Math.min(1, Math.max(0, (t - t0) / duracion));
      const e = 1 - (1 - p) ** 3;
      setV(inicio + (valor - inicio) * e);
      if (p < 1) raf = requestAnimationFrame(paso);
      else desde.current = valor;
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor, retraso, duracion]);
  return v;
}

/** Pieza del bento: entra escalonada (orden `i`) y se ve "fantasma" hasta que termina de llegar. */
export function Pieza({ i = 0, className = '', children, oscura = false, ...props }) {
  return (
    <div {...props} data-arana className={`bento-pieza ${oscura ? 'bento-pieza--oscura' : ''} ${className}`} style={{ '--i': i, ...props.style }}>
      {children}
    </div>
  );
}

export function Rotulo({ children, extra }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="rotulo">{children}</span>
      {extra && <span className="text-t-micro tabular-nums text-textSecondary">{extra}</span>}
    </div>
  );
}

/** Tu día: porcentaje grande + el arco del día con un punto que marca la hora actual. */
export function PiezaDia({ i, ahora, progreso, hechos, total }) {
  const pct = useContador(progreso, 200 + i * 90);
  const inicioDia = 6;
  const finDia = 22;
  const h = ahora.getHours() + ahora.getMinutes() / 60;
  const f = Math.max(0, Math.min(1, (h - inicioDia) / (finDia - inicioDia)));
  const px = 6 + f * 148;
  const py = 46 - Math.sin(f * Math.PI) * 36;
  return (
    <Pieza i={i} className="flex flex-col justify-between">
      <Rotulo extra={`${hechos}/${total}`}>Tu día</Rotulo>
      <div>
        <p className="bento-cifra">{Math.round(pct)}<span className="bento-cifra-unidad">%</span></p>
        <p className="mt-0.5 text-t-micro text-textSecondary">{total ? `${hechos} de ${total} completados` : 'Nada agendado hoy'}</p>
      </div>
      <svg viewBox="0 0 160 52" className="mt-1 w-full overflow-visible" aria-hidden="true">
        <path d="M6 46 Q 80 -26 154 46" fill="none" stroke="rgb(var(--linea) / .14)" strokeWidth="1.2" strokeDasharray="2 3" />
        <path d="M6 46 Q 80 -26 154 46" fill="none" stroke="rgb(var(--primary))" strokeWidth="1.4" pathLength="100" strokeDasharray={`${f * 100} 100`} className="bento-trazo" />
        <circle cx={px} cy={py} r="3.6" fill="rgb(var(--primary))" className="bento-punto" />
        <line x1="2" x2="158" y1="47" y2="47" stroke="rgb(var(--linea) / .1)" />
        <text x="2" y="52" fontSize="5" fill="rgb(var(--textSecondary))" fontFamily="Geist Mono Variable, monospace">06:00</text>
        <text x="158" y="52" fontSize="5" fill="rgb(var(--textSecondary))" textAnchor="end" fontFamily="Geist Mono Variable, monospace">22:00</text>
      </svg>
    </Pieza>
  );
}

/** "Sonando ahora" → lo siguiente en tu agenda, con su "carátula" del color de la materia. */
export function PiezaSiguiente({ i, ahora, siguiente, eventosHoy, onPomodoro }) {
  const navigate = useNavigate();
  const enCurso = siguiente && siguiente.inicio <= ahora;
  const progreso = enCurso ? Math.min(1, (ahora - siguiente.inicio) / Math.max(1, siguiente.fin - siguiente.inicio)) : 0;
  const color = siguiente?.color || 'rgb(var(--primary))';
  const idx = siguiente ? eventosHoy.findIndex((e) => e.id === siguiente.id) : -1;
  return (
    <Pieza i={i} className="col-span-2 flex gap-4" {...(siguiente ? previewDeEvento(siguiente) : {})}>
      <div className="bento-caratula" style={{ '--c': color }}>
        <span className="bento-caratula-sol" />
        <span className="absolute bottom-2.5 left-3 font-mono text-t-nota tracking-wider text-white/80">{siguiente ? (siguiente.origen === 'tarea' ? 'TAREA' : TIPOS_AGENDA[siguiente.tipo].label.slice(0, 5).toUpperCase()) : 'LIBRE'}</span>
        <span className="absolute bottom-2 left-3 right-3 h-px bg-white/40" style={{ bottom: 22 }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <span className="rotulo">{enCurso ? 'Ahora mismo' : 'Lo siguiente'}</span>
          {enCurso && <span className="bento-eq" aria-hidden="true"><i /><i /><i /><i /></span>}
        </div>
        {siguiente ? (
          <>
            <p className="mt-1.5 truncate text-t-medio font-semibold leading-tight tracking-tight">{siguiente.titulo}</p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-t-micro text-textSecondary">
              {siguiente.virtual ? <><Video size={11} /> Virtual</> : siguiente.detalle ? <><MapPin size={11} /> {siguiente.detalle}</> : TIPOS_AGENDA[siguiente.tipo].uno}
            </p>
            <div className="mt-auto pt-3">
              <div className="h-[3px] overflow-hidden rounded-full bg-[rgb(var(--linea)/.1)]"><div className="h-full rounded-full bg-textPrimary transition-all duration-700" style={{ width: `${progreso * 100}%` }} /></div>
              <div className="mt-1 flex justify-between font-mono text-t-nota text-textSecondary">
                <span>{hora(siguiente.inicio)}</span>
                <span>{enCurso ? `quedan ${textoDuracion(siguiente.fin - ahora)}` : `en ${textoDuracion(siguiente.inicio - ahora)}`}</span>
                <span>{siguiente.origen === 'tarea' ? 'entrega' : hora(siguiente.fin)}</span>
              </div>
              <div className="mt-2 flex items-center justify-center gap-5">
                <button aria-label="Evento anterior" disabled={idx <= 0} onClick={() => navigate('/horario')} className="text-textSecondary hover:text-textPrimary disabled:opacity-30"><SkipBack size={15} fill="currentColor" /></button>
                <button aria-label="Empezar un Pomodoro" onClick={onPomodoro} className="bento-play"><Play size={14} fill="currentColor" className="ml-0.5" /></button>
                <button aria-label="Ver la agenda" onClick={() => navigate('/horario')} className="text-textSecondary hover:text-textPrimary"><SkipForward size={15} fill="currentColor" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-1.5">
            <p className="text-t-medio font-semibold tracking-tight">Sin compromisos a la vista</p>
            <p className="mt-0.5 text-t-micro text-textSecondary">Buen momento para adelantar algo o descansar.</p>
            <Link to="/horario" className="mt-3 inline-flex items-center gap-1 text-t-micro font-medium text-primary">Abrir agenda <ArrowUpRight size={12} /></Link>
          </div>
        )}
      </div>
    </Pieza>
  );
}

/** Temporizador de enfoque: anillo de marcas que se apagan a medida que corre el tiempo. */
export function PiezaTemporizador({ i, minutos = 25 }) {
  const total = minutos * 60;
  const [restante, setRestante] = useState(total);
  const [corriendo, setCorriendo] = useState(false);
  useEffect(() => {
    if (!corriendo) return undefined;
    const t = setInterval(() => setRestante((r) => { if (r <= 1) { setCorriendo(false); return 0; } return r - 1; }), 1000);
    return () => clearInterval(t);
  }, [corriendo]);
  const marcas = 60;
  const activas = Math.round((restante / total) * marcas);
  const mm = String(Math.floor(restante / 60)).padStart(2, '0');
  const ss = String(restante % 60).padStart(2, '0');
  return (
    <Pieza i={i} className="flex flex-col">
      <Rotulo extra={restante !== total ? <button onClick={() => { setCorriendo(false); setRestante(total); }} aria-label="Reiniciar"><RotateCcw size={11} /></button> : null}>Enfoque</Rotulo>
      <button onClick={() => setCorriendo((c) => !c)} className="group relative mx-auto my-auto aspect-square w-full max-w-[150px]" aria-label={corriendo ? 'Pausar' : 'Empezar'}>
        <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden="true">
          {Array.from({ length: marcas }, (_, k) => {
            const a = (k / marcas) * Math.PI * 2 - Math.PI / 2;
            const on = k < activas;
            return <line key={k} x1={50 + Math.cos(a) * 41} y1={50 + Math.sin(a) * 41} x2={50 + Math.cos(a) * (k % 5 === 0 ? 47 : 45)} y2={50 + Math.sin(a) * (k % 5 === 0 ? 47 : 45)} stroke={on ? (corriendo ? 'rgb(var(--primary))' : 'rgb(var(--linea) / .35)') : 'rgb(var(--linea) / .08)'} strokeWidth={k % 5 === 0 ? 1.3 : 0.8} strokeLinecap="round" style={{ transition: 'stroke .4s' }} />;
          })}
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="bento-cifra text-[30px]">{mm}:{ss}</span>
          <span className="mt-0.5 flex items-center gap-1 text-t-nota text-textSecondary">{corriendo ? <><Pause size={9} fill="currentColor" /> Concentrado</> : <><Play size={9} fill="currentColor" /> Trabajo profundo</>}</span>
        </span>
      </button>
    </Pieza>
  );
}

/** Tareas completadas (como los "pasos" de la referencia): cifra grande + barras por día. */
export function PiezaCompletadas({ i, porDia, meta }) {
  const total = porDia.reduce((a, b) => a + b, 0);
  const n = useContador(total, 260 + i * 90);
  const max = Math.max(1, ...porDia);
  const hoy = (new Date().getDay() + 6) % 7;
  return (
    <Pieza i={i} className="flex flex-col">
      <Rotulo>Completadas</Rotulo>
      <p className="bento-cifra mt-2">{Math.round(n).toLocaleString('es-CO')}</p>
      <p className="text-t-micro text-textSecondary">esta semana{meta ? ` · ${Math.round((total / meta) * 100)}% de ${meta}` : ''}</p>
      <div className="mt-auto flex items-end gap-[5px] pt-3">
        {porDia.map((v, k) => (
          <div key={k} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative h-[52px] w-full">
              <span className="absolute inset-x-0 bottom-0 rounded-[3px] bg-[rgb(var(--linea)/.07)]" style={{ top: 0 }} />
              <span className="bento-barra absolute inset-x-0 bottom-0 rounded-[3px]" style={{ height: `${(v / max) * 100}%`, background: k === hoy ? 'rgb(var(--primary))' : 'rgb(var(--textPrimary))', '--d': `${500 + i * 90 + k * 60}ms` }} />
            </div>
            <span className="font-mono text-t-nota text-textSecondary">{'LMMJVSD'[k]}</span>
          </div>
        ))}
      </div>
    </Pieza>
  );
}

/** Materias (como las "baterías"): avance de cada materia con su barra. */
export function PiezaMaterias({ i, filas }) {
  return (
    <Pieza i={i} className="flex flex-col">
      <Rotulo>Materias</Rotulo>
      {filas.length === 0 ? (
        <p className="m-auto py-4 text-center text-t-micro text-textSecondary">Registra tus materias para ver su avance.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {filas.slice(0, 4).map((f, k) => <FilaMateria key={f.nombre} f={f} retraso={420 + i * 90 + k * 90} />)}
        </div>
      )}
    </Pieza>
  );
}
function FilaMateria({ f, retraso }) {
  const pct = useContador(f.pct, retraso);
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md font-mono text-t-nota text-white" style={{ background: f.color }}>{f.nombre.slice(0, 2).toUpperCase()}</span>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between text-t-micro"><span className="truncate">{f.nombre}</span><span className="tabular-nums text-textSecondary">{Math.round(pct)}%</span></div>
        <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-[rgb(var(--linea)/.08)]"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: f.color }} /></div>
      </div>
    </div>
  );
}

/** Calendario: el día del mes enorme y, al lado, la línea de tiempo de hoy. */
export function PiezaCalendario({ i, ahora, eventos }) {
  const navigate = useNavigate();
  const dia = useContador(ahora.getDate(), 300 + i * 90, 900);
  const dias = ahora.toLocaleDateString('es-CO', { weekday: 'long' });
  const mes = ahora.toLocaleDateString('es-CO', { month: 'long' });
  return (
    <Pieza i={i} className="col-span-2 flex gap-5">
      <div className="flex w-[38%] shrink-0 flex-col">
        <span className="rotulo capitalize">{dias}</span>
        <p className="bento-cifra mt-auto text-[64px] leading-[0.9]">{Math.round(dia)}</p>
        <p className="mt-1 text-t-pie capitalize">{mes}</p>
        <p className="text-t-micro text-textSecondary">{eventos.length} evento{eventos.length === 1 ? '' : 's'} hoy</p>
      </div>
      <div className="min-w-0 flex-1 border-l border-[rgb(var(--linea)/.08)] pl-4">
        {eventos.length === 0 ? (
          <p className="pt-6 text-t-micro text-textSecondary">Día libre. Nada en tu agenda.</p>
        ) : (
          <ul className="space-y-2.5">
            {eventos.slice(0, 4).map((e, k) => {
              const pasado = e.origen === 'tarea' ? e.hecha : e.fin <= ahora;
              return (
                <li key={e.id} {...previewDeEvento(e)} className={`bento-evento flex gap-3 ${pasado ? 'opacity-45' : ''}`} style={{ '--d': `${520 + k * 80}ms` }}>
                  <span className="w-[52px] shrink-0 whitespace-nowrap pt-px font-mono text-t-nota text-textSecondary">{hora(e.inicio)}</span>
                  <span className="w-[2px] shrink-0 rounded-full" style={{ background: e.color }} />
                  <button onClick={() => navigate(e.origen === 'tarea' ? '/tareas' : '/horario')} className="min-w-0 text-left">
                    <span className={`block truncate text-t-pie font-medium ${e.hecha ? 'line-through' : ''}`}>{e.titulo}</span>
                    <span className="block truncate text-t-nota text-textSecondary">{TIPOS_AGENDA[e.tipo].uno}{e.origen !== 'tarea' ? ` · ${textoDuracion(e.fin - e.inicio)}` : ''}</span>
                  </button>
                </li>
              );
            })}
            {eventos.length > 4 && <li className="pl-12 text-t-micro text-textSecondary">+{eventos.length - 4} más</li>}
          </ul>
        )}
      </div>
    </Pieza>
  );
}

/** Modo Supervivencia (como el interruptor "Focus" de la referencia): al activarse, la pieza se oscurece. */
export function PiezaSupervivencia({ i, activo, onCambiar, ancho = false }) {
  return (
    <Pieza i={i} oscura={activo} className={`flex ${ancho ? '!min-h-0 items-center gap-4 sm:col-span-2 lg:col-span-3' : 'flex-col'}`}>
      {ancho ? (
        <>
          <span className="bento-luna shrink-0">{activo ? <ShieldAlert size={15} /> : <Moon size={15} />}</span>
          <div className="min-w-0 flex-1">
            <span className="rotulo">Supervivencia</span>
            <p className="mt-1.5 text-t-base">
              <span className="font-medium">{activo ? 'Activo' : 'Apagado'}</span>
              <span className="opacity-60"> · {activo ? 'solo ves lo urgente de hoy' : 'déjalo en lo urgente cuando la semana se te venga encima'}</span>
            </p>
          </div>
          <button role="switch" aria-checked={activo} aria-label="Modo supervivencia" onClick={onCambiar} className={`bento-switch shrink-0 ${activo ? 'bento-switch--on' : ''}`}><span /></button>
        </>
      ) : (
        <>
          <span className="rotulo">Supervivencia</span>
          <span className="bento-luna mt-3">{activo ? <ShieldAlert size={15} /> : <Moon size={15} />}</span>
          <div className="mt-auto">
            <p className="text-t-grande font-light tracking-tight">{activo ? 'Activo' : 'Apagado'}</p>
            <p className="text-t-micro opacity-60">{activo ? 'Solo lo urgente' : 'Toca para enfocarte'}</p>
            <button role="switch" aria-checked={activo} aria-label="Modo supervivencia" onClick={onCambiar} className={`bento-switch mt-3 ${activo ? 'bento-switch--on' : ''}`}><span /></button>
          </div>
        </>
      )}
    </Pieza>
  );
}

/** Cifra simple (balance, vencidas, nivel…), mismo lenguaje visual. */
export function PiezaCifra({ i, rotulo, valor, formato = (v) => Math.round(v).toLocaleString('es-CO'), nota, to, tono }) {
  const v = useContador(valor, 300 + i * 90);
  const contenido = (
    <>
      <span className="rotulo" style={tono ? { '--punto': tono } : undefined}>{rotulo}</span>
      <p className="bento-cifra mt-auto pt-4 text-[30px]" style={tono ? { color: tono } : undefined}>{formato(v)}</p>
      {nota && <p className="text-t-micro text-textSecondary">{nota}</p>}
    </>
  );
  return (
    <Pieza i={i} className="group flex min-h-[132px] flex-col">
      {to ? <Link to={to} className="flex flex-1 flex-col">{contenido}<ArrowUpRight size={13} className="absolute right-4 top-4 text-textSecondary opacity-0 transition group-hover:opacity-100" /></Link> : contenido}
    </Pieza>
  );
}
