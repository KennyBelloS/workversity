import { useEffect, useState } from 'react';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, AlertTriangle, Award, Timer, Target, FileText, GraduationCap, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSyncEstado } from '../hooks/useSyncEstado';
import ErrorCarga from '../components/ErrorCarga';
import { SkeletonAnalitica } from '../components/ui/Skeleton';
import { listarTareas } from '../services/tareas';
import { listarMaterias } from '../services/materias';
import { listarBloques } from '../services/horario';
import PlanAhora from '../components/asistente/PlanAhora';
import TrabajosHelper from '../components/asistente/TrabajosHelper';
import NotasCard from '../components/asistente/NotasCard';
import HabitosTab from '../components/asistente/HabitosTab';
import { listarSesionesRecientes } from '../services/analitica';
import {
  predecirCarga,
  generarAlertasSobrecarga,
  detectarPatronesConcentracion,
  calcularDespejeSemanal,
  mensajeDeEstado,
} from '../lib/motorAnalitica';

import EnergyCheckin from '../components/analitica/EnergyCheckin';
import PomodoroTimer from '../components/analitica/PomodoroTimer';
import WorkloadChart from '../components/analitica/WorkloadChart';
import ConcentrationChart from '../components/analitica/ConcentrationChart';
import ClearHorizonGauge from '../components/analitica/ClearHorizonGauge';
import CapacitySettings from '../components/analitica/CapacitySettings';
import KoiEstanque from '../components/decoracion/KoiEstanque';

export default function Analitica() {
  const { perfil } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [params] = useSearchParams();
  const [tab, setTab] = useState(['plan', 'enfoque', 'trabajos', 'notas', 'habitos'].includes(params.get('tab')) ? params.get('tab') : 'plan');
  const [bloques, setBloques] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState('');
  const { version } = useSyncEstado();

  const cargar = async () => {
    try {
      const [t, s, m, b] = await Promise.all([listarTareas(), listarSesionesRecientes(), listarMaterias(), listarBloques()]);
      setBloques(b);
      setTareas(t);
      setSesiones(s);
      setMaterias(m);
      setError('');
    } catch (err) {
      setError(mensajeAmigable(err, 'cargar el asistente'));
    } finally {
      setCargando(false);
    }
  };

   
  useEffect(() => { cargar(); }, [version]);

  if (cargando) return <SkeletonAnalitica />;

  const capacidad = perfil?.capacidad_maxima_horas ?? 8;
  const prediccion = predecirCarga(tareas, capacidad, 14);
  const alertas = generarAlertasSobrecarga(prediccion, capacidad);
  const { porHora, mejorFranja } = detectarPatronesConcentracion(sesiones);
  const despeje = calcularDespejeSemanal(tareas);
  const mensaje = mensajeDeEstado({ sobrecargados: alertas, despeje, mejorFranja });

  return (
    <div>
      <ErrorCarga mensaje={error} />
      <div className="relative mb-5 overflow-hidden rounded-[20px] bg-[#141412] text-white">
        <div className="absolute inset-0 opacity-90"><KoiEstanque cuantos={4} celda={8} tema="oscuro" intensidad={0.55} /></div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#141412] via-[#141412]/45 to-transparent" />
        <div className="relative flex min-h-[132px] items-end gap-3 p-5 sm:p-6">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 font-mono text-t-micro uppercase tracking-[0.14em] text-white/50"><Sparkles size={12} className="text-primary" /> Tu asistente dice</p>
            <p className="mt-2 text-t-medio font-light leading-snug tracking-[-0.02em] sm:text-t-medio">{mensaje}</p>
          </div>
        </div>
      </div>

      {perfil?.modo_supervivencia && (
        <div className="mb-5 flex items-center gap-2 rounded-[14px] bg-dangerSoft px-4 py-3 text-danger ring-1 ring-danger/20">
          <AlertTriangle size={18} />
          <p className="text-sm font-bold">Modo Supervivencia activo — el tablero de Tareas solo muestra lo esencial.</p>
        </div>
      )}

      <div className="mb-5 flex items-center gap-2">
        <Award size={16} className="text-warning" />
        <span className="text-sm font-bold text-textPrimary">{perfil?.puntos ?? 0} puntos</span>
        <span className="text-xs text-textSecondary">— ganas puntos por registrar tu energía y completar Pomodoros</span>
      </div>

      <div className="seg mb-5 max-w-full overflow-x-auto" role="tablist">
        {[['plan', 'Plan', Target], ['enfoque', 'Enfoque', Timer], ['trabajos', 'Trabajos', FileText], ['notas', 'Notas', GraduationCap], ['habitos', 'Hábitos', Brain]].map(([v, t, Icono]) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={`seg-op ${tab === v ? 'activo' : ''}`}>
            <Icono size={14} strokeWidth={1.8} /> {t}
          </button>
        ))}
      </div>

      {tab === 'plan' && <PlanAhora tareas={tareas} sesiones={sesiones} materias={materias} bloques={bloques} onCambio={cargar} />}
      {tab === 'trabajos' && <TrabajosHelper tareas={tareas} />}
      {tab === 'notas' && <NotasCard materias={materias} tareas={tareas} />}
      {tab === 'habitos' && <HabitosTab />}

      {tab === 'enfoque' && (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="ficha">
            <p className="rotulo mb-3">Predicción de carga — próximos 14 días</p>
            <p className="mb-3 text-xs text-textSecondary">Comparado contra tu capacidad máxima diaria configurada.</p>
            <WorkloadChart prediccion={prediccion} capacidadMaximaHoras={capacidad} />
          </div>

          {alertas.length > 0 && (
            <div className="rounded-md2 bg-dangerSoft p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-danger"><AlertTriangle size={16} /> Alertas de sobrecarga</p>
              <div className="space-y-2">
                {alertas.map((a, i) => (
                  <div key={i} className="rounded-sm2 bg-white p-3">
                    <p className="text-xs font-semibold capitalize text-textPrimary">{a.mensaje}</p>
                    <p className="mt-1 text-xs text-textSecondary">{a.sugerencia}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="ficha">
            <p className="rotulo mb-3">Patrones de concentración</p>
            <p className="mb-3 text-xs text-textSecondary">
              {mejorFranja
                ? `Tu mejor rendimiento es entre las ${mejorFranja.hora}:00 y las ${mejorFranja.hora + 1}:00 — agenda ahí tus tareas complejas.`
                : 'Completa Pomodoros para que aparezca tu patrón aquí.'}
            </p>
            <ConcentrationChart porHora={porHora} />
          </div>
        </div>

        <div className="space-y-4">
          <EnergyCheckin onReorganizado={cargar} />
          <PomodoroTimer tareas={tareas} />
          <div className="ficha">
            <p className="rotulo mb-3">Despeje de la semana</p>
            <ClearHorizonGauge porcentaje={despeje} />
          </div>
          <CapacitySettings />
        </div>
      </div>
      )}
    </div>
  );
}
