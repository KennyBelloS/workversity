import { useEffect, useState } from 'react';
import { GraduationCap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEscape } from '../../hooks/useEscape';
import { listarParciales, crearParcial, crearFuente, listarTarjetas, crearTarjeta } from '../../services/parciales';
import { generarTarjetas, combinarTarjetas } from '../../lib/parciales';

/** Envía el contenido de un apunte a un parcial existente o nuevo, y genera tarjetas de una vez. */
export default function UsarParaParcial({ apunte, onCerrar }) {
  const { usuario } = useAuth();
  const nav = useNavigate();
  const [parciales, setParciales] = useState(null);
  const [elegido, setElegido] = useState('__nuevo__');
  const [tituloNuevo, setTituloNuevo] = useState(apunte.titulo || 'Nuevo parcial');
  const [trabajando, setTrabajando] = useState(false);
  const [hecho, setHecho] = useState(null);
  useEscape(onCerrar);

  useEffect(() => { listarParciales().then(setParciales); }, []);

  const confirmar = async () => {
    setTrabajando(true);
    try {
      let parcialId = elegido;
      if (elegido === '__nuevo__') {
        const p = await crearParcial({ titulo: tituloNuevo.trim() || 'Nuevo parcial', materia_id: apunte.materia_id || null, fecha: null }, usuario.id);
        parcialId = p.id;
      }
      await crearFuente({ parcial_id: parcialId, nombre: apunte.titulo || 'Apunte', texto: apunte.contenido }, usuario.id);
      const existentes = (await listarTarjetas()).filter((t) => t.parcial_id === parcialId);
      const nuevas = generarTarjetas(apunte.contenido);
      const aCrear = combinarTarjetas([existentes.map((t) => ({ pregunta: t.pregunta, respuesta: t.respuesta })), nuevas]).filter((g) => !existentes.some((t) => t.pregunta.toLowerCase() === g.pregunta.toLowerCase()));
      for (const t of aCrear) await crearTarjeta({ parcial_id: parcialId, pregunta: t.pregunta, respuesta: t.respuesta }, usuario.id);
      setHecho({ parcialId, n: aCrear.length });
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onCerrar}>
      <div className="w-full max-w-sm rounded-t-lg2 bg-bg p-5 sm:rounded-lg2" onClick={(e) => e.stopPropagation()}>
        {hecho ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Check size={28} className="text-success" />
            <p className="font-bold">¡Listo! Se generaron {hecho.n} tarjeta{hecho.n === 1 ? '' : 's'} nuevas.</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => nav(`/parciales/${hecho.parcialId}?tab=tarjetas`)} className="rounded-sm2 bg-primary px-4 py-2 text-sm font-bold text-white">Ir al parcial</button>
              <button onClick={onCerrar} className="rounded-sm2 px-4 py-2 text-sm font-bold text-textSecondary">Cerrar</button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold"><GraduationCap size={18} /> Usar este apunte para un parcial</h2>
            <p className="mb-4 text-xs text-textSecondary">Se agregará el contenido como fuente y se generarán tarjetas de estudio automáticamente.</p>
            <div className="space-y-2.5">
              <select value={elegido} onChange={(e) => setElegido(e.target.value)} className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none" aria-label="Parcial destino">
                <option value="__nuevo__">➕ Crear un parcial nuevo</option>
                {parciales?.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
              </select>
              {elegido === '__nuevo__' && (
                <input value={tituloNuevo} onChange={(e) => setTituloNuevo(e.target.value)} placeholder="Título del parcial" className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none" aria-label="Título del nuevo parcial" />
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={confirmar} disabled={trabajando || parciales === null} className="flex-1 rounded-sm2 bg-primary py-3 text-sm font-bold text-white disabled:opacity-50">{trabajando ? 'Generando…' : 'Confirmar'}</button>
                <button onClick={onCerrar} className="rounded-sm2 px-4 text-sm font-bold text-textSecondary">Cancelar</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
