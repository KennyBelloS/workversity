import { useEffect, useState } from 'react';
import { Trash2, X, CalendarCheck } from 'lucide-react';
import { useEscape } from '../../hooks/useEscape';
import { listarTareas, eliminarTarea } from '../../services/tareas';
import { tareasParaLimpiar, yaSePreguntoEsteMes, guardarPreguntaHecha } from '../../lib/limpiezaMensual';
import { mostrarSnackbar } from '../../lib/snackbar';
import { mensajeAmigable } from '../../lib/erroresAmigables';

/** Una vez al mes, si quedan tareas "hechas" de meses anteriores, pregunta si se quieren
 * borrar — nunca borra nada sin que la persona confirme. */
export default function LimpiezaMensual() {
  const [candidatas, setCandidatas] = useState(null); // null = aún no se sabe
  const [borrando, setBorrando] = useState(false);
  useEscape(() => candidatas && setCandidatas(null));

  useEffect(() => {
    if (yaSePreguntoEsteMes()) return;
    listarTareas()
      .then((tareas) => {
        const c = tareasParaLimpiar(tareas);
        if (c.length > 0) setCandidatas(c);
        else guardarPreguntaHecha(); // nada que limpiar: no preguntar de nuevo hasta el próximo mes
      })
      .catch(() => {});
  }, []);

  const cerrar = (dejarlas) => {
    guardarPreguntaHecha();
    setCandidatas(null);
    if (dejarlas) mostrarSnackbar({ texto: 'Listo, las dejamos como están.' });
  };

  const eliminar = async () => {
    setBorrando(true);
    try {
      for (const t of candidatas) await eliminarTarea(t.id);
      mostrarSnackbar({ texto: `Se eliminaron ${candidatas.length} tarea${candidatas.length > 1 ? 's' : ''} de meses anteriores.` });
      guardarPreguntaHecha();
      setCandidatas(null);
    } catch (err) {
      mostrarSnackbar({ texto: mensajeAmigable(err, 'eliminar esas tareas') });
    } finally {
      setBorrando(false);
    }
  };

  if (!candidatas) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center" onClick={() => cerrar(true)}>
      <div className="w-full max-w-sm rounded-lg2 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-primary"><CalendarCheck size={22} /></div>
          <button onClick={() => cerrar(true)} aria-label="Cerrar" className="rounded-full p-1 text-textSecondary hover:bg-black/5"><X size={18} /></button>
        </div>
        <p className="text-base font-extrabold text-textPrimary">Limpieza del mes</p>
        <p className="mt-1.5 text-sm text-textSecondary">
          Tienes <b className="text-textPrimary">{candidatas.length} tarea{candidatas.length > 1 ? 's' : ''}</b> marcada{candidatas.length > 1 ? 's' : ''} como hecha{candidatas.length > 1 ? 's' : ''} de mes{candidatas.length > 1 ? 'es' : ''} anteriores. ¿Quieres eliminarlas para mantener tu lista limpia?
        </p>
        <p className="mt-2 text-xs text-textSecondary">Esto no afecta las tareas de este mes, solo las de meses ya cerrados.</p>
        <div className="mt-5 flex gap-2">
          <button onClick={() => cerrar(true)} className="flex-1 rounded-sm2 bg-primarySoft/60 py-2.5 text-sm font-bold text-textPrimary">Dejarlas</button>
          <button onClick={eliminar} disabled={borrando} className="flex flex-1 items-center justify-center gap-1.5 rounded-sm2 bg-danger py-2.5 text-sm font-bold text-white disabled:opacity-60">
            <Trash2 size={15} /> {borrando ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
