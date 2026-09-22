import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import RecorridoAnimado from './RecorridoAnimado';

const CLAVE = 'workversity:tour-visto';

/** Recorrido de bienvenida: se muestra una sola vez la primera vez que entras. */
export default function BienvenidaTour() {
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    let visto = true;
    try { visto = localStorage.getItem(CLAVE) === '1'; } catch { /* nada */ }
    if (visto) return undefined;
    const t = setTimeout(() => setAbierto(true), 900);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener('workversity:tour', abrir);
    return () => window.removeEventListener('workversity:tour', abrir);
  }, []);

  const cerrar = () => { try { localStorage.setItem(CLAVE, '1'); } catch { /* nada */ } setAbierto(false); };
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-3 sm:items-center" role="dialog" aria-label="Bienvenida">
      <div className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-lg2 bg-bg p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-sm font-extrabold">👋 Bienvenido a Workversity</p>
          <button onClick={cerrar} className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-textSecondary shadow-card"><X size={13} /> Saltar</button>
        </div>
        <RecorridoAnimado compacto onFin={cerrar} />
        <p className="mt-2 text-center text-[11px] text-textSecondary">Puedes volver a verlo cuando quieras en “Cómo se usa”.</p>
      </div>
    </div>
  );
}
