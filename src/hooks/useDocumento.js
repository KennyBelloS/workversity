import { useCallback, useEffect, useRef, useState } from 'react';
import { crearDocumento, actualizarDocumento } from '../services/documentos';

/**
 * Un documento de la tarea (texto, hoja, diapositivas o notas) con guardado automático.
 * Se crea en la base de datos solo cuando escribes por primera vez.
 */
export function useDocumento({ tareaId, tipo, docs, usuarioId, titulo = '' }) {
  const existente = docs.find((d) => d.tarea_id === tareaId && d.tipo === tipo);
  const [inicial] = useState(existente?.contenido || '');
  const idRef = useRef(existente?.id || null);
  const pendiente = useRef(null);
  const temporizador = useRef(null);
  const [estado, setEstado] = useState('');

  const guardarAhora = useCallback(async () => {
    clearTimeout(temporizador.current);
    if (pendiente.current == null) return;
    const contenido = pendiente.current;
    pendiente.current = null;
    setEstado('guardando');
    try {
      if (idRef.current) await actualizarDocumento(idRef.current, { contenido });
      else { const fila = await crearDocumento({ tarea_id: tareaId, tipo, titulo, contenido }, usuarioId); idRef.current = fila.id; }
      setEstado('guardado');
    } catch { setEstado('error'); }
  }, [tareaId, tipo, titulo, usuarioId]);

  const cambiar = useCallback((contenido) => {
    pendiente.current = contenido;
    setEstado('editando');
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(guardarAhora, 900);
  }, [guardarAhora]);

  useEffect(() => {
    const alSalir = () => { guardarAhora(); };
    window.addEventListener('pagehide', alSalir);
    document.addEventListener('visibilitychange', alSalir);
    return () => { window.removeEventListener('pagehide', alSalir); document.removeEventListener('visibilitychange', alSalir); guardarAhora(); };
  }, [guardarAhora]);

  return { inicial, cambiar, estado, guardarAhora };
}

export const ETIQUETA_ESTADO_DOC = { editando: 'Escribiendo…', guardando: 'Guardando…', guardado: '✓ Guardado', error: 'No se pudo guardar' };
