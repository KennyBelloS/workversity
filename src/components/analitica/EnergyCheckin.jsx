import { useEffect, useState } from 'react';
import { BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react';
import { registrarEnergiaHoy, obtenerEnergiaHoy, sumarPuntos } from '../../services/analitica';
import { listarTareas, actualizarTarea } from '../../services/tareas';
import { tareasAReprogramarPorBajaEnergia } from '../../lib/motorAnalitica';
import { useAuth } from '../../context/AuthContext';

const NIVELES = [
  { valor: 1, label: 'Agotado', icon: BatteryLow, color: '#B04A3E' },
  { valor: 2, label: 'Bajo', icon: BatteryLow, color: '#A8732A' },
  { valor: 3, label: 'Normal', icon: BatteryMedium, color: '#A8732A' },
  { valor: 4, label: 'Bien', icon: BatteryMedium, color: '#2F7A55' },
  { valor: 5, label: 'A tope', icon: BatteryFull, color: '#2F7A55' },
];

export default function EnergyCheckin({ onReorganizado }) {
  const { usuario, refrescarPerfil } = useAuth();
  const [registro, setRegistro] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [reorganizando, setReorganizando] = useState(false);
  const [resultado, setResultado] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setRegistro(await obtenerEnergiaHoy());
      } catch (err) {
        console.warn('[energía] No se pudo cargar:', err?.message || err);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const registrar = async (nivel) => {
    const primeraVezHoy = !registro; // los puntos se ganan una sola vez al día
    const r = await registrarEnergiaHoy(usuario.id, nivel);
    setRegistro(r);
    if (primeraVezHoy) {
      await sumarPuntos(usuario.id, 5);
      await refrescarPerfil();
    }
  };

  const reorganizarDia = async () => {
    setReorganizando(true);
    try {
      const tareas = await listarTareas();
      const hoyStr = new Date().toDateString();
      const deHoy = tareas.filter((t) => new Date(t.due_date).toDateString() === hoyStr);
      const aMover = tareasAReprogramarPorBajaEnergia(deHoy);

      for (const t of aMover) {
        const nuevaFecha = new Date(t.due_date);
        nuevaFecha.setDate(nuevaFecha.getDate() + 1);
        await actualizarTarea(t.id, { due_date: nuevaFecha.toISOString() });
      }
      setResultado(
        aMover.length > 0
          ? `Moví ${aMover.length} tarea(s) no crítica(s) a mañana. Hoy solo quedan tus compromisos importantes y los rápidos.`
          : 'Ya tenías solo lo esencial para hoy — no había nada que mover.'
      );
      onReorganizado?.();
    } finally {
      setReorganizando(false);
    }
  };

  if (cargando) return null;

  return (
    <div className="ficha">
      <p className="rotulo mb-3">¿Cómo está tu energía hoy?</p>
      <div className="flex gap-2">
        {NIVELES.map((n) => {
          const Icono = n.icon;
          const sel = registro?.nivel === n.valor;
          return (
            <button
              key={n.valor}
              onClick={() => registrar(n.valor)}
              className="flex flex-1 flex-col items-center gap-1 rounded-sm2 border py-2.5 transition"
              style={{
                borderColor: sel ? n.color : 'rgba(0,0,0,0.08)',
                backgroundColor: sel ? `${n.color}1F` : 'transparent',
              }}
            >
              <Icono size={18} color={n.color} />
              <span className="text-t-nota font-bold" style={{ color: sel ? n.color : '#807F7A' }}>
                {n.label}
              </span>
            </button>
          );
        })}
      </div>

      {registro && registro.nivel <= 2 && !resultado && (
        <div className="mt-3 rounded-sm2 bg-warningSoft p-3">
          <p className="text-xs font-semibold text-textPrimary">
            Energía baja detectada. Puedo mover tus tareas no críticas de hoy a mañana y dejar solo lo importante y lo rápido.
          </p>
          <button
            onClick={reorganizarDia}
            disabled={reorganizando}
            className="mt-2 rounded-full bg-warning px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {reorganizando ? 'Reorganizando…' : 'Reorganizar mi día'}
          </button>
        </div>
      )}
      {resultado && <p className="mt-3 text-xs font-semibold text-success">{resultado}</p>}
    </div>
  );
}
