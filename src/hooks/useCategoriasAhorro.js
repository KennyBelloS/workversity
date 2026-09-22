import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSyncEstado } from './useSyncEstado';
import { listarCategoriasAhorro, crearCategoriaAhorro, eliminarCategoriaAhorro } from '../services/categoriasAhorro';
import { combinarCategorias, limpiarNombre } from '../lib/categoriasAhorro';
import { CATEGORIAS_PROGRESO_BASE } from '../lib/progresoMeta';
import { CATEGORIAS_AHORRO } from '../lib/constants';

/** Categorías de ahorro (predeterminadas + propias) y funciones para crear y borrar las propias. */
export function useCategoriasAhorro(tipo = 'ahorro') {
  const { usuario } = useAuth();
  const { version } = useSyncEstado();
  const [estado, setEstado] = useState({ propias: [], disponible: true, cargando: true });

  const cargar = useCallback(async () => {
    try {
      const r = await listarCategoriasAhorro();
      setEstado({ propias: r.lista, disponible: r.disponible, cargando: false });
    } catch {
      setEstado((e) => ({ ...e, cargando: false }));
    }
  }, []);
  useEffect(() => { cargar(); }, [version, cargar]);

  const todas = useMemo(() => combinarCategorias(estado.propias, tipo), [estado.propias, tipo]);

  const crear = async (nombreCrudo, color) => {
    const nombre = limpiarNombre(nombreCrudo);
    if (!nombre) return { ok: false, error: 'Escribe un nombre' };
    // El nombre debe ser único entre todas las categorías (dinero y progreso).
    const usados = [...CATEGORIAS_AHORRO, ...CATEGORIAS_PROGRESO_BASE, ...estado.propias.map((p) => p.nombre)];
    if (usados.some((n) => n.toLowerCase() === nombre.toLowerCase())) return { ok: false, error: 'Esa categoría ya existe' };
    try {
      await crearCategoriaAhorro({ nombre, color, ...(tipo === 'progreso' ? { tipo: 'progreso' } : {}) }, usuario.id);
      await cargar();
      return { ok: true, nombre };
    } catch (e) {
      return { ok: false, error: e?.message || 'No se pudo crear' };
    }
  };
  const eliminar = async (id) => { await eliminarCategoriaAhorro(id); await cargar(); };

  return { ...estado, todas, crear, eliminar, recargar: cargar };
}
