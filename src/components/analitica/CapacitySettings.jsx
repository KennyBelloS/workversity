import { useState } from 'react';
import { ShieldAlert, Settings2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { actualizarAjustesBienestar } from '../../services/analitica';

export default function CapacitySettings() {
  const { usuario, perfil, refrescarPerfil } = useAuth();
  const [capacidad, setCapacidad] = useState(perfil?.capacidad_maxima_horas ?? 8);
  const [horaLimite, setHoraLimite] = useState(perfil?.hora_limite_sin_tareas ?? '20:00');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      await actualizarAjustesBienestar(usuario.id, {
        capacidad_maxima_horas: Number(capacidad),
        hora_limite_sin_tareas: horaLimite,
      });
      await refrescarPerfil();
    } finally {
      setGuardando(false);
    }
  };

  const alternarSupervivencia = async () => {
    await actualizarAjustesBienestar(usuario.id, { modo_supervivencia: !perfil?.modo_supervivencia });
    await refrescarPerfil();
  };

  return (
    <div className="rounded-md2 bg-white p-4 shadow-card">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold"><Settings2 size={16} /> Tus límites reales</p>

      <label className="mb-1 block text-xs font-semibold text-textSecondary">Capacidad máxima diaria (horas)</label>
      <input
        type="number"
        min={1}
        max={16}
        value={capacidad}
        onChange={(e) => setCapacidad(e.target.value)}
        className="mb-3 w-full rounded-sm2 bg-primarySoft/60 px-3 py-2 text-sm outline-none"
      />

      <label className="mb-1 block text-xs font-semibold text-textSecondary">Sin tareas después de</label>
      <input
        type="time"
        value={horaLimite}
        onChange={(e) => setHoraLimite(e.target.value)}
        className="mb-3 w-full rounded-sm2 bg-primarySoft/60 px-3 py-2 text-sm outline-none"
      />

      <button onClick={guardar} disabled={guardando} className="w-full rounded-sm2 bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {guardando ? 'Guardando…' : 'Guardar límites'}
      </button>

      <div className="mt-4 border-t border-black/5 pt-4">
        <button
          onClick={alternarSupervivencia}
          className={`flex w-full items-center justify-center gap-2 rounded-sm2 py-3 text-sm font-bold transition ${
            perfil?.modo_supervivencia ? 'bg-danger text-white' : 'bg-dangerSoft text-danger'
          }`}
        >
          <ShieldAlert size={16} />
          {perfil?.modo_supervivencia ? 'Desactivar Modo Supervivencia' : 'Activar Modo Supervivencia'}
        </button>
        <p className="mt-1.5 text-[11px] text-textSecondary">
          Para semanas de parciales o crisis: oculta lo opcional y deja solo lo estrictamente necesario en Tareas.
        </p>
      </div>
    </div>
  );
}
