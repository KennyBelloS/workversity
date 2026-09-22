import { useEffect } from 'react';
import { useLogros } from '../../hooks/useLogros';
import { mostrarSnackbar } from '../../lib/snackbar';
import { celebrar } from '../../lib/nativo';

const CLAVE = 'workversity:logros';

/** Avisa cuando desbloqueas un logro (la primera vez solo se anotan los que ya tenías, sin avisar). */
export default function LogrosObservador() {
  const { lista } = useLogros();
  useEffect(() => {
    if (lista.length === 0) return;
    const logrados = lista.filter((l) => l.logrado);
    let guardados = null;
    try { guardados = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch { /* nada */ }
    const nuevos = guardados ? logrados.filter((l) => !guardados.includes(l.id)) : [];
    try { localStorage.setItem(CLAVE, JSON.stringify(logrados.map((l) => l.id))); } catch { /* nada */ }
    if (nuevos.length > 0) {
      mostrarSnackbar({ texto: `🏆 ${nuevos.length === 1 ? 'Logro desbloqueado' : 'Logros desbloqueados'}: ${nuevos.map((l) => `${l.emoji} ${l.titulo}`).join(', ')}`, ms: 6500 });
      celebrar();
    }
  }, [lista]);
  return null;
}
