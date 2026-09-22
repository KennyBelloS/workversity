import { useCallback, useEffect, useState } from 'react';
import { leerTabla } from '../offline/db';
import { useSyncEstado } from './useSyncEstado';
import { contextoLogros, evaluarLogros } from '../lib/logros';
import { totalRevisiones } from '../lib/revision';

/** Logros calculados con la copia local de tus datos (instantáneo y sin internet). */
export function useLogros() {
  const { version } = useSyncEstado();
  const [lista, setLista] = useState([]);

  const recalcular = useCallback(async () => {
    const [tareas, sesiones, materias, evaluaciones, cortes, movimientos, metas, categoriasPropias, avances] = await Promise.all(
      ['tareas', 'sesiones_pomodoro', 'materias', 'evaluaciones', 'cortes_notas', 'movimientos', 'metas', 'categorias_ahorro', 'avances_meta'].map(leerTabla)
    );
    const instalada = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setLista(evaluarLogros(contextoLogros({ tareas, sesiones, materias, evaluaciones, cortes, movimientos, metas, avances, categoriasPropias, revisiones: totalRevisiones(), instalada })));
  }, []);

  useEffect(() => { recalcular(); }, [version, recalcular]);
  useEffect(() => {
    const t = setInterval(recalcular, 60000);
    const alCelebrar = () => setTimeout(recalcular, 700);
    window.addEventListener('workversity:celebrar', alCelebrar);
    return () => { clearInterval(t); window.removeEventListener('workversity:celebrar', alCelebrar); };
  }, [recalcular]);

  return { lista, recalcular };
}
