import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Volume2, Coffee } from 'lucide-react';
import { iniciarSesionPomodoro, finalizarSesionPomodoro } from '../../services/analitica';
import { SONIDOS, iniciarSonido, detenerSonido, ponerVolumen, pitido } from '../../lib/audioEnfoque';
import { formatoMinutos } from '../../lib/tiempos';
import { vibrar } from '../../lib/nativo';

const MODOS = {
  pomodoro: { nombre: 'Pomodoro 25/5', trabajo: 25, descanso: 5, tipo: 'mecanica' },
  profundo: { nombre: 'Profundo 50/10', trabajo: 50, descanso: 10, tipo: 'profunda' },
  maraton: { nombre: 'Maratón 90/20', trabajo: 90, descanso: 20, tipo: 'profunda' },
  libre: { nombre: 'Cronómetro', trabajo: 0, descanso: 0, tipo: 'profunda' },
};
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Temporizador de la tarea: mide el tiempo real que dedicas (así la app aprende cuánto tardas). */
export default function PanelTemporizador({ tarea, usuarioId, onTiempo, tiempoTotal, estimado, compacto = false }) {
  const [modo, setModo] = useState('pomodoro');
  const [fase, setFase] = useState('trabajo');
  const [corriendo, setCorriendo] = useState(false);
  const [seg, setSeg] = useState(MODOS.pomodoro.trabajo * 60);
  const [ciclos, setCiclos] = useState(0);
  const [distracciones, setDistracciones] = useState(0);
  const [sonido, setSonido] = useState('');
  const [volumen, setVolumen] = useState(0.35);

  const cfg = MODOS[modo];
  const faseRef = useRef('trabajo');
  const ciclosRef = useRef(0);
  const finRef = useRef(0);
  const inicioRef = useRef(0);
  const baseSegRef = useRef(0); // segundos acumulados (cronómetro)
  const trabajadoRef = useRef(0); // segundos trabajados en la sesión actual (cuenta regresiva)
  const acreditadoRef = useRef(0); // minutos ya sumados a la tarea en esta sesión
  const sesionRef = useRef(null);
  const wakeRef = useRef(null);

  const duracion = useCallback((m, f, c) => (f === 'trabajo' ? MODOS[m].trabajo * 60 : (c > 0 && c % 4 === 0 ? 15 * 60 : MODOS[m].descanso * 60)), []);

  const acreditarHasta = useCallback((minutosTotales) => {
    const delta = minutosTotales - acreditadoRef.current;
    if (delta >= 0.5) { acreditadoRef.current += delta; onTiempo(delta); }
  }, [onTiempo]);

  const avisar = useCallback((titulo, cuerpo) => {
    pitido(2); vibrar([200, 100, 200]);
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        navigator.serviceWorker?.ready.then((r) => r.showNotification(titulo, { body: cuerpo, icon: '/icon-192.png', tag: 'enfoque' })).catch(() => new Notification(titulo, { body: cuerpo }));
      }
    } catch { /* nada */ }
  }, []);

  const finFase = useCallback(() => {
    setCorriendo(false);
    if (faseRef.current === 'trabajo') {
      acreditarHasta(MODOS[modo].trabajo);
      if (sesionRef.current) { finalizarSesionPomodoro(sesionRef.current, true).catch(() => {}); sesionRef.current = null; }
      trabajadoRef.current = 0; acreditadoRef.current = 0;
      ciclosRef.current += 1; setCiclos(ciclosRef.current);
      faseRef.current = 'descanso'; setFase('descanso');
      const d = duracion(modo, 'descanso', ciclosRef.current);
      setSeg(d); finRef.current = Date.now() + d * 1000;
      avisar('¡Sesión terminada! 🎉', `Descansa ${Math.round(d / 60)} minutos.`);
      setCorriendo(true);
    } else {
      faseRef.current = 'trabajo'; setFase('trabajo'); setSeg(MODOS[modo].trabajo * 60);
      avisar('Descanso terminado', 'Vuelve a la tarea cuando quieras.');
    }
  }, [acreditarHasta, avisar, duracion, modo]);

  useEffect(() => {
    if (!corriendo) return undefined;
    const id = setInterval(() => {
      if (modo === 'libre') setSeg(Math.floor(baseSegRef.current + (Date.now() - inicioRef.current) / 1000));
      else {
        const r = Math.max(0, Math.ceil((finRef.current - Date.now()) / 1000));
        setSeg(r);
        if (r <= 0) { clearInterval(id); finFase(); }
      }
    }, 250);
    return () => clearInterval(id);
  }, [corriendo, modo, finFase]);

  const trabajadoAhora = () => (modo === 'libre'
    ? baseSegRef.current + (corriendo ? (Date.now() - inicioRef.current) / 1000 : 0)
    : trabajadoRef.current + (corriendo && faseRef.current === 'trabajo' ? Math.max(0, MODOS[modo].trabajo * 60 - seg) - trabajadoRef.current : 0));

  const iniciar = async () => {
    if (modo === 'libre') inicioRef.current = Date.now();
    else finRef.current = Date.now() + seg * 1000;
    if (faseRef.current === 'trabajo' && !sesionRef.current) {
      try { const s = await iniciarSesionPomodoro({ userId: usuarioId, tareaId: tarea.id, tipo: cfg.tipo, duracionMinutos: modo === 'libre' ? 25 : cfg.trabajo }); sesionRef.current = s.id; } catch { /* sigue sin registrar la sesión */ }
    }
    setCorriendo(true);
  };
  const pausar = () => {
    if (modo === 'libre') { baseSegRef.current += (Date.now() - inicioRef.current) / 1000; setSeg(Math.floor(baseSegRef.current)); acreditarHasta(baseSegRef.current / 60); }
    else {
      const r = Math.max(0, Math.ceil((finRef.current - Date.now()) / 1000));
      setSeg(r);
      if (faseRef.current === 'trabajo') { trabajadoRef.current = MODOS[modo].trabajo * 60 - r; acreditarHasta(trabajadoRef.current / 60); }
    }
    setCorriendo(false);
  };
  const reiniciar = () => {
    const trabajado = trabajadoAhora() / 60;
    if (faseRef.current === 'trabajo') acreditarHasta(trabajado);
    if (sesionRef.current) { finalizarSesionPomodoro(sesionRef.current, false).catch(() => {}); sesionRef.current = null; }
    setCorriendo(false); baseSegRef.current = 0; trabajadoRef.current = 0; acreditadoRef.current = 0;
    faseRef.current = 'trabajo'; setFase('trabajo'); setSeg(modo === 'libre' ? 0 : MODOS[modo].trabajo * 60);
  };
  const saltarDescanso = () => { setCorriendo(false); faseRef.current = 'trabajo'; setFase('trabajo'); setSeg(MODOS[modo].trabajo * 60); };
  const cambiarModo = (m) => {
    if (corriendo) return;
    reiniciar();
    setModo(m); setSeg(m === 'libre' ? 0 : MODOS[m].trabajo * 60);
  };

  // Mantener la pantalla encendida mientras trabajas, y mostrar el tiempo en la pestaña
  useEffect(() => {
    if (!corriendo) { wakeRef.current?.release?.().catch(() => {}); wakeRef.current = null; return undefined; }
    navigator.wakeLock?.request('screen').then((w) => { wakeRef.current = w; }).catch(() => {});
    return () => { wakeRef.current?.release?.().catch(() => {}); wakeRef.current = null; };
  }, [corriendo]);
  useEffect(() => {
    const anterior = document.title;
    if (corriendo) document.title = `${mmss(seg)} · ${fase === 'trabajo' ? tarea.title : 'Descanso'}`;
    return () => { document.title = anterior; };
  }, [corriendo, seg, fase, tarea.title]);
  useEffect(() => { if (sonido) iniciarSonido(sonido, volumen); else detenerSonido(); return () => detenerSonido(); }, [sonido]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { ponerVolumen(volumen); }, [volumen]);
  useEffect(() => () => { // al salir se guarda lo trabajado
    const trabajado = modo === 'libre' ? baseSegRef.current / 60 : trabajadoRef.current / 60;
    if (faseRef.current === 'trabajo') acreditarHasta(trabajado);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const total = duracion(modo, fase, ciclos);
  const progreso = modo === 'libre' ? 0 : total ? 1 - seg / total : 0;
  const R = 44;

  return (
    <section className="rounded-md2 bg-white p-4 shadow-card">
      {!compacto && (
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          {Object.entries(MODOS).map(([k, m]) => (
            <button key={k} onClick={() => cambiarModo(k)} disabled={corriendo} className={`rounded-sm2 border px-2 py-2 text-[11px] font-bold transition disabled:opacity-50 ${modo === k ? 'border-primary bg-primarySoft text-primary' : 'border-black/10 text-textSecondary'}`}>{m.nombre}</button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(var(--bg))" strokeWidth="8" />
            <circle cx="50" cy="50" r={R} fill="none" stroke={fase === 'trabajo' ? 'rgb(var(--primary))' : '#17C964'} strokeWidth="8" strokeLinecap="round" strokeDasharray={2 * Math.PI * R} strokeDashoffset={2 * Math.PI * R * (1 - progreso)} style={{ transition: 'stroke-dashoffset .25s linear' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold tabular-nums" aria-live="off">{mmss(seg)}</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-textSecondary">{fase === 'trabajo' ? 'Trabajo' : <><Coffee size={10} /> Descanso</>}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex gap-2">
            {!corriendo ? (
              <button onClick={iniciar} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white"><Play size={15} /> {seg !== (modo === 'libre' ? 0 : cfg.trabajo * 60) || ciclos > 0 ? 'Seguir' : 'Empezar'}</button>
            ) : (
              <button onClick={pausar} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-warning px-4 py-2.5 text-sm font-bold text-white"><Pause size={15} /> Pausar</button>
            )}
            <button onClick={reiniciar} aria-label="Reiniciar" className="rounded-full border border-black/10 p-2.5 text-textSecondary"><RotateCcw size={15} /></button>
            {fase === 'descanso' && <button onClick={saltarDescanso} aria-label="Saltar descanso" className="rounded-full border border-black/10 p-2.5 text-textSecondary"><SkipForward size={15} /></button>}
          </div>
          <p className="text-[11px] text-textSecondary">
            Sesiones: <b>{ciclos}</b> · En esta tarea: <b>{formatoMinutos(tiempoTotal)}</b>{estimado ? <> de ≈ {formatoMinutos(estimado)}</> : null}
          </p>
        </div>
      </div>

      {!compacto && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3">
          <button onClick={() => setDistracciones((d) => d + 1)} className="rounded-full bg-bg px-3 py-1.5 text-[11px] font-bold text-textSecondary" title="Anota cada vez que te distraes">🧠 Me distraje{distracciones ? ` · ${distracciones}` : ''}</button>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-textSecondary">
            <Volume2 size={13} />
            <select value={sonido} onChange={(e) => setSonido(e.target.value)} aria-label="Sonido de fondo" className="rounded-full bg-bg px-2 py-1 text-[11px] outline-none">
              <option value="">Sin sonido</option>
              {SONIDOS.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.nombre}</option>)}
            </select>
          </label>
          {sonido && <input type="range" min={0.05} max={1} step={0.05} value={volumen} onChange={(e) => setVolumen(Number(e.target.value))} aria-label="Volumen" className="w-20 accent-primary" />}
        </div>
      )}
    </section>
  );
}
