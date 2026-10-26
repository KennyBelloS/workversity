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
      <div className="mb-5 flex items-start gap-3 rounded-md2 bg-gradient-to-r from-primary to-primaryDark p-4 text-white shadow-card">
        <Sparkles size={20} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold">Tu asistente inteligente dice:</p>
          <p className="text-sm">{mensaje}</p>
        </div>
      </div>

      {perfil?.modo_supervivencia && (
        <div className="mb-5 flex items-center gap-2 rounded-md2 bg-danger px-4 py-3 text-white shadow-card">
          <AlertTriangle size={18} />
          <p className="text-sm font-bold">Modo Supervivencia activo — el tablero de Tareas solo muestra lo esencial.</p>
        </div>
      )}

      <div className="mb-5 flex items-center gap-2">
        <Award size={16} className="text-warning" />
        <span className="text-sm font-bold text-textPrimary">{perfil?.puntos ?? 0} puntos</span>
        <span className="text-xs text-textSecondary">— ganas puntos por registrar tu energía y completar Pomodoros</span>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-card">
        {[['plan', 'Plan', Target], ['enfoque', 'Enfoque', Timer], ['trabajos', 'Trabajos', FileText], ['notas', 'Notas', GraduationCap], ['habitos', 'Hábitos', Brain]].map(([v, t, Icono]) => (
          <button key={v} onClick={() => setTab(v)} className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition ${tab === v ? 'bg-primary text-white' : 'text-textSecondary hover:bg-black/5'}`}>
            <Icono size={15} /> {t}
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
          <div className="rounded-md2 bg-white p-4 shadow-card">
            <p className="mb-1 text-sm font-bold">Predicción de carga — próximos 14 días</p>
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

          <div className="rounded-md2 bg-white p-4 shadow-card">
            <p className="mb-1 text-sm font-bold">Patrones de concentración</p>
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
          <div className="rounded-md2 bg-white p-4 shadow-card">
            <p className="mb-1 text-sm font-bold">Despeje de la semana</p>
            <ClearHorizonGauge porcentaje={despeje} />
          </div>
          <CapacitySettings />
        </div>
      </div>
      )}
    </div>
  );
}
