import { useState } from 'react';
import { Users2, Plus, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';
import { codigoValido } from '../../lib/espacios';

export default function CrearOUnirse({ onCrear, onUnirse, error }) {
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);

  const crear = async () => { if (!nombre.trim()) return; setCargando(true); await onCrear(nombre.trim()); setCargando(false); };
  const unirse = async () => { if (!codigoValido(codigo)) return; setCargando(true); await onUnirse(codigo); setCargando(false); };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex flex-col items-center gap-2 rounded-md2 bg-white p-6 text-center shadow-card">
        <Users2 size={30} className="text-primary" />
        <p className="text-lg font-extrabold">Comparte tu agenda con alguien</p>
        <p className="text-sm text-textSecondary">Crea un espacio para tu pareja, tus compañeros de piso o tu grupo de estudio: pidan horarios, vean lo que ya está agendado y comparen sus puntos.</p>
      </div>

      <div className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold"><Plus size={16} /> Crear un espacio nuevo</p>
        <div className="flex gap-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Ana y Luis" className="flex-1 rounded-sm2 bg-bg px-3 py-2.5 text-sm outline-none" aria-label="Nombre del espacio" />
          <button onClick={crear} disabled={!nombre.trim() || cargando} className="rounded-sm2 bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Crear</button>
        </div>
        <p className="mt-2 text-[11px] text-textSecondary">Quedarás como <b>admin</b>: acceso total, sin restricciones.</p>
      </div>

      <div className="rounded-md2 bg-white p-4 shadow-card">
        <p className="mb-2 flex items-center gap-2 text-sm font-bold"><KeyRound size={16} /> Unirme con un código</p>
        <div className="flex gap-2">
          <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="Ej: AB12CD" maxLength={10} className="flex-1 rounded-sm2 bg-bg px-3 py-2.5 text-sm uppercase tracking-widest outline-none" aria-label="Código de invitación" />
          <button onClick={unirse} disabled={!codigoValido(codigo) || cargando} className="rounded-sm2 bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Unirme</button>
        </div>
        <p className="mt-2 text-[11px] text-textSecondary">Pide el código a quien te invitó. Quedarás como <b>miembro</b>: mismo acceso, pensado para el día a día.</p>
      </div>

      {error && <p className="rounded-sm2 bg-dangerSoft p-3 text-center text-sm font-semibold text-danger">{error}</p>}

      <div className="grid grid-cols-2 gap-2 text-[11px] text-textSecondary">
        <p className="flex items-center gap-1.5 rounded-sm2 bg-white p-2.5 shadow-card"><ShieldCheck size={14} className="text-primary" /> Admin: acceso total al espacio.</p>
        <p className="flex items-center gap-1.5 rounded-sm2 bg-white p-2.5 shadow-card"><UserCheck size={14} className="text-primary" /> Miembro: mismo acceso, día a día.</p>
      </div>
    </div>
  );
}
