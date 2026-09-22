import { useState, useSyncExternalStore } from 'react';
import { RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { VERSION, FECHA_VERSION } from '../../version';
import { fechaBonita } from '../NovedadesLista';
import { obtenerEstadoPwa, suscribirPwa, buscarActualizacion } from '../../pwa/pwa';

export default function VersionCard() {
  const pwa = useSyncExternalStore(suscribirPwa, obtenerEstadoPwa);
  const [mensaje, setMensaje] = useState('');

  const buscar = async () => {
    setMensaje('');
    const r = await buscarActualizacion();
    if (!r.ok) setMensaje('Las actualizaciones automáticas funcionan en la app compilada o publicada (no en npm run dev).');
    else if (r.sinDatos) setMensaje('No se pudo comprobar ahora. Revisa tu conexión e inténtalo de nuevo.');
    else if (r.hayNueva) setMensaje(`Hay una versión nueva (${r.version}). Se instalará sola en unos segundos.`);
    else setMensaje('✅ Ya tienes la última versión.');
  };

  return (
    <section className="rounded-md2 bg-white p-4 shadow-card">
      <p className="mb-1 flex items-center gap-2 text-sm font-bold"><Sparkles size={16} /> Versión y actualizaciones</p>
      <p className="text-xs text-textSecondary">Workversity <b className="text-textPrimary">{VERSION}</b>{FECHA_VERSION && <> · {fechaBonita(FECHA_VERSION)}</>}</p>
      <p className="mb-3 mt-1 flex items-start gap-1.5 text-xs text-textSecondary"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" /> Se actualiza sola: cuando hay una versión nueva la descarga y la instala, y te muestra qué cambió.</p>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={buscar} disabled={pwa.revisando} className="flex items-center justify-center gap-2 rounded-sm2 border border-primary/30 py-2.5 text-sm font-bold text-primary disabled:opacity-60">
          <RefreshCw size={14} className={pwa.revisando ? 'animate-spin' : ''} /> {pwa.revisando ? 'Buscando…' : 'Buscar actualizaciones'}
        </button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('workversity:novedades', { detail: { modo: 'historial' } }))} className="rounded-sm2 border border-black/10 py-2.5 text-sm font-bold text-textSecondary">Ver novedades</button>
      </div>
      {mensaje && <p className="mt-2 text-xs font-semibold text-textSecondary">{mensaje}</p>}
    </section>
  );
}
