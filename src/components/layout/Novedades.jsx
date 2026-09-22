import { useEffect, useState, useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import { RELEASES } from '../../changelog';
import { VERSION, compararVersiones } from '../../version';
import { obtenerEstadoPwa, suscribirPwa } from '../../pwa/pwa';
import { CambiosDeVersion, fechaBonita } from '../NovedadesLista';

const CLAVE_VISTA = 'workversity:version-vista';

/**
 * Reporte de cambios:
 *  • después de una actualización, muestra lo nuevo desde la última versión que viste;
 *  • con el evento 'workversity:novedades' muestra lo que trae la versión pendiente o todo el historial.
 */
export default function Novedades() {
  const pwa = useSyncExternalStore(suscribirPwa, obtenerEstadoPwa);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    let visto = null;
    try { visto = localStorage.getItem(CLAVE_VISTA); } catch { /* nada */ }
    if (!visto) {
      // Primera vez con esta función: un usuario nuevo no ve reporte; uno existente ve lo de la última versión.
      let existente = false;
      try { existente = localStorage.getItem('workversity:tour-visto') === '1'; } catch { /* nada */ }
      if (!existente) { try { localStorage.setItem(CLAVE_VISTA, VERSION); } catch { /* nada */ } return undefined; }
      visto = '1.4.0';
    }
    if (compararVersiones(VERSION, visto) <= 0) return undefined;
    const nuevas = RELEASES.filter((r) => compararVersiones(r.version, visto) > 0 && compararVersiones(r.version, VERSION) <= 0);
    if (nuevas.length === 0) { try { localStorage.setItem(CLAVE_VISTA, VERSION); } catch { /* nada */ } return undefined; }
    const t = setTimeout(() => setModal({ tipo: 'actualizado', titulo: `🎉 Workversity se actualizó a la versión ${VERSION}`, releases: nuevas }), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const abrir = (e) => {
      if (e.detail?.modo === 'pendiente') {
        const r = pwa.versionNueva?.release;
        setModal({ tipo: 'pendiente', titulo: `Novedades de la versión ${pwa.versionNueva?.version || 'nueva'}`, releases: r ? [r] : [], vacio: !r });
      } else setModal({ tipo: 'historial', titulo: 'Historial de versiones', releases: RELEASES });
    };
    window.addEventListener('workversity:novedades', abrir);
    return () => window.removeEventListener('workversity:novedades', abrir);
  }, [pwa.versionNueva]);

  const cerrar = () => {
    if (modal?.tipo === 'actualizado') { try { localStorage.setItem(CLAVE_VISTA, VERSION); } catch { /* nada */ } }
    setModal(null);
  };
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/50 p-3 sm:items-center" role="dialog" aria-label="Novedades" onClick={cerrar}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg2 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-extrabold leading-snug">{modal.titulo}</h2>
          <button onClick={cerrar} aria-label="Cerrar" className="shrink-0 rounded-full p-1.5 hover:bg-black/5"><X size={18} /></button>
        </div>
        {modal.vacio && <p className="mt-3 rounded-sm2 bg-bg p-3 text-sm text-textSecondary">Los detalles se mostrarán cuando termine de instalarse.</p>}
        <div className="mt-3 space-y-5">
          {modal.releases.map((r) => (
            <section key={r.version}>
              <p className="text-sm font-extrabold">Versión {r.version} <span className="text-[11px] font-medium text-textSecondary">· {fechaBonita(r.fecha)}</span></p>
              <p className="mb-2 text-xs text-textSecondary">{r.titulo}</p>
              <CambiosDeVersion release={r} />
            </section>
          ))}
        </div>
        <button onClick={cerrar} className="mt-5 w-full rounded-sm2 bg-primary py-3 text-sm font-bold text-white">Entendido</button>
      </div>
    </div>
  );
}
