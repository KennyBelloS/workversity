import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Zap, Brain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  iniciarSesionPomodoro,
  finalizarSesionPomodoro,
  minutosContinuosDeHoy,
  sumarPuntos,
} from '../../services/analitica';
import { duracionPomodoroSugerida, necesitaPausaAntiestres } from '../../lib/motorAnalitica';
import BreathingModal from './BreathingModal';

export default function PomodoroTimer({ tareas }) {
  const { usuario, refrescarPerfil } = useAuth();
  const [tipo, setTipo] = useState('mecanica');
  const [tareaId, setTareaId] = useState('');
  const [segundosRestantes, setSegundosRestantes] = useState(duracionPomodoroSugerida('mecanica') * 60);
  const [corriendo, setCorriendo] = useState(false);
  const [sesionId, setSesionId] = useState(null);
  const [mostrarPausa, setMostrarPausa] = useState(false);

  // El reloj se calcula contra una hora de fin (no restando 1 por tick): así
  // sigue exacto aunque el navegador "duerma" la pestaña o la app esté en segundo plano.
  const finRef = useRef(0);
  const restanteRef = useRef(duracionPomodoroSugerida('mecanica') * 60);
  const sesionRef = useRef(null);
  const pausaHechaRef = useRef(false); // la respiración ya se hizo: puede empezar el siguiente Pomodoro

  const duracionMin = duracionPomodoroSugerida(tipo);

  // Al cambiar de tipo (solo posible antes de empezar) se reinicia el reloj.
  useEffect(() => {
    if (!sesionRef.current) {
      restanteRef.current = duracionMin * 60;
      setSegundosRestantes(duracionMin * 60);
    }
  }, [duracionMin]);

  const reiniciarReloj = () => {
    sesionRef.current = null;
    setSesionId(null);
    restanteRef.current = duracionMin * 60;
    setSegundosRestantes(duracionMin * 60);
  };

  const terminar = async (completado) => {
    setCorriendo(false);
    const id = sesionRef.current;
    reiniciarReloj();
    if (!id) return;
    await finalizarSesionPomodoro(id, completado);
    if (completado) {
      await sumarPuntos(usuario.id, 10);
      await refrescarPerfil();
    }
  };

  useEffect(() => {
    if (!corriendo) return undefined;
    const intervalo = setInterval(() => {
      const restante = Math.max(0, Math.ceil((finRef.current - Date.now()) / 1000));
      setSegundosRestantes(restante);
      if (restante <= 0) {
        clearInterval(intervalo);
        terminar(true);
      }
    }, 250);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo]);

  const iniciar = async () => {
    if (!sesionRef.current) {
      const minutosPrevios = await minutosContinuosDeHoy();
      if (!pausaHechaRef.current && necesitaPausaAntiestres(minutosPrevios)) {
        setMostrarPausa(true);
        return;
      }
      const s = await iniciarSesionPomodoro({ userId: usuario.id, tareaId: tareaId || null, tipo, duracionMinutos: duracionMin });
      sesionRef.current = s.id;
      setSesionId(s.id);
      pausaHechaRef.current = false;
    }
    finRef.current = Date.now() + restanteRef.current * 1000;
    setCorriendo(true);
  };

  const pausar = () => {
    restanteRef.current = Math.max(0, Math.ceil((finRef.current - Date.now()) / 1000));
    setSegundosRestantes(restanteRef.current);
    setCorriendo(false);
  };

  const reiniciar = async () => {
    setCorriendo(false);
    const id = sesionRef.current;
    reiniciarReloj();
    if (id) await finalizarSesionPomodoro(id, false);
  };

  const minutos = Math.floor(segundosRestantes / 60).toString().padStart(2, '0');
  const segundos = (segundosRestantes % 60).toString().padStart(2, '0');
  const progreso = 1 - segundosRestantes / (duracionMin * 60);
  const bloqueado = corriendo || !!sesionId;

  return (
    <div className="rounded-md2 bg-white p-4 shadow-card">
      <p className="mb-3 text-sm font-bold">Enfoque adaptativo (Pomodoro)</p>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => !bloqueado && setTipo('mecanica')}
          disabled={bloqueado}
          className="flex items-center justify-center gap-1.5 rounded-sm2 border py-2 text-xs font-bold disabled:opacity-50"
          style={{ borderColor: tipo === 'mecanica' ? '#F5A524' : 'rgba(0,0,0,0.08)', backgroundColor: tipo === 'mecanica' ? '#FDF3E3' : 'transparent', color: tipo === 'mecanica' ? '#F5A524' : '#6E7180' }}
        >
          <Zap size={14} /> Mecánica (25 min)
        </button>
        <button
          onClick={() => !bloqueado && setTipo('profunda')}
          disabled={bloqueado}
          className="flex items-center justify-center gap-1.5 rounded-sm2 border py-2 text-xs font-bold disabled:opacity-50"
          style={{ borderColor: tipo === 'profunda' ? '#3E7BFA' : 'rgba(0,0,0,0.08)', backgroundColor: tipo === 'profunda' ? '#EAF1FF' : 'transparent', color: tipo === 'profunda' ? '#3E7BFA' : '#6E7180' }}
        >
          <Brain size={14} /> Profunda (50 min)
        </button>
      </div>

      <select
        value={tareaId}
        onChange={(e) => setTareaId(e.target.value)}
        disabled={bloqueado}
        className="mb-4 w-full rounded-sm2 bg-primarySoft/60 px-3 py-2 text-xs outline-none disabled:opacity-60"
      >
        <option value="">Sin tarea específica</option>
        {tareas.filter((t) => t.status !== 'hecha').map((t) => (
          <option key={t.id} value={t.id}>{t.title}</option>
        ))}
      </select>

      <div className="relative mx-auto mb-4 flex h-36 w-36 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#EAF3FB" strokeWidth="7" />
          <circle
            cx="50" cy="50" r="45" fill="none" stroke="#6FA8DC" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - progreso)}
            style={{ transition: 'stroke-dashoffset 0.25s linear' }}
          />
        </svg>
        <span className="text-2xl font-extrabold text-textPrimary">{minutos}:{segundos}</span>
      </div>

      <div className="flex justify-center gap-3">
        {!corriendo ? (
          <button onClick={iniciar} className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primaryDark">
            <Play size={16} /> {sesionId ? 'Reanudar' : 'Iniciar'}
          </button>
        ) : (
          <button onClick={pausar} className="flex items-center gap-2 rounded-full bg-warning px-6 py-2.5 text-sm font-bold text-white">
            <Pause size={16} /> Pausar
          </button>
        )}
        <button onClick={reiniciar} className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-sm font-bold text-textSecondary">
          <RotateCcw size={16} />
        </button>
      </div>

      {mostrarPausa && (
        <BreathingModal
          onCerrar={() => {
            pausaHechaRef.current = true;
            setMostrarPausa(false);
          }}
        />
      )}
    </div>
  );
}
