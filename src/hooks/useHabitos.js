import { useCallback, useEffect, useMemo, useState } from 'react';
import { leerTabla } from '../offline/db';
import { useSyncEstado } from './useSyncEstado';
import { calcularHabitos, leerAprender, CLAVE_APRENDER } from '../lib/habitos';

/**
 * Lo que la app ha aprendido de tus hábitos (se calcula en tu dispositivo con la copia local de tus datos).
 * `aprender` indica si la persona quiere que se use lo aprendido en las sugerencias.
 */
export function useHabitos() {
  const { version } = useSyncEstado();
  const [datos, setDatos] = useState(null);
  const [aprender, setAprenderEstado] = useState(leerAprender);
  const [n, setN] = useState(0);

  useEffect(() => {
    let vivo = true;
    Promise.all([leerTabla('tareas'), leerTabla('sesiones_pomodoro'), leerTabla('registros_energia'), leerTabla('materias')]).then(([tareas, sesiones, energia, materias]) => {
      if (vivo) setDatos({ tareas, sesiones, energia, materias });
    });
    return () => { vivo = false; };
  }, [version, n]);

  useEffect(() => {
    const alCambiar = () => setAprenderEstado(leerAprender());
    window.addEventListener('workversity:aprender', alCambiar);
    return () => window.removeEventListener('workversity:aprender', alCambiar);
  }, []);

  const habitos = useMemo(() => (datos ? calcularHabitos(datos) : null), [datos]);
  const setAprender = (v) => {
    try { localStorage.setItem(CLAVE_APRENDER, v ? '1' : '0'); } catch { /* nada */ }
    window.dispatchEvent(new Event('workversity:aprender'));
  };
  const recargar = useCallback(() => setN((x) => x + 1), []);
  return { habitos, aprender, setAprender, recargar };
}
