import { describe, it, expect } from 'vitest';
import { DIFICULTADES, predecirMinutos, tiempoRealDeTarea, muestrasDeTiempo, tablaAprendizaje, precisionDeEstimaciones, formatoMinutos } from '../src/lib/tiempos.js';

const ahora = new Date(2026, 8, 21, 12);
const hecha = (id, dificultad, real, extra = {}) => ({ id, status: 'hecha', dificultad, tiempo_real_minutos: real, completed_at: new Date(2026, 8, 10).toISOString(), category: 'universidad', ...extra });

describe('tiempos que aprende la app', () => {
  it('sin historial usa la base de cada dificultad', () => {
    expect(predecirMinutos({ dificultad: 'facil', ahora })).toMatchObject({ minutos: 30, origen: 'base', muestras: 0 });
    expect(predecirMinutos({ dificultad: 'media', ahora }).minutos).toBe(60);
    expect(predecirMinutos({ dificultad: 'dificil', ahora }).minutos).toBe(120);
    expect(predecirMinutos({ dificultad: 'inventada', ahora }).minutos).toBe(60); // dificultad desconocida = media
    expect(DIFICULTADES.media.base).toBe(60);
  });
  it('se acerca a lo que de verdad tardas', () => {
    const tareas = [hecha('a', 'media', 30), hecha('b', 'media', 30), hecha('c', 'media', 30), hecha('d', 'media', 30)];
    const p = predecirMinutos({ dificultad: 'media', tareas, ahora });
    expect(p.origen).toBe('aprendido');
    expect(p.aprendido).toBe(30);
    expect(p.minutos).toBeLessThan(45);   // ya no es 60
    expect(p.minutos).toBeGreaterThanOrEqual(30);
    // con más datos, más confianza
    const mas = predecirMinutos({ dificultad: 'media', tareas: [...tareas, ...Array.from({ length: 10 }, (_, i) => hecha(`x${i}`, 'media', 30))], ahora });
    expect(mas.confianza).toBeGreaterThan(p.confianza);
    expect(mas.minutos).toBeLessThan(p.minutos + 1);
  });
  it('cada dificultad aprende por separado y lo de la misma materia pesa más', () => {
    const tareas = [hecha('a', 'facil', 10), hecha('b', 'facil', 10), hecha('c', 'media', 90)];
    expect(predecirMinutos({ dificultad: 'facil', tareas, ahora }).minutos).toBeLessThan(30);
    expect(predecirMinutos({ dificultad: 'dificil', tareas, ahora }).origen).toBe('base');
    const conMateria = [hecha('a', 'media', 30, { materia_id: 'm1' }), hecha('b', 'media', 30, { materia_id: 'm1' }), hecha('c', 'media', 120, { materia_id: 'm2' }), hecha('d', 'media', 120, { materia_id: 'm2' })];
    const m1 = predecirMinutos({ dificultad: 'media', materia_id: 'm1', tareas: conMateria, ahora });
    const m2 = predecirMinutos({ dificultad: 'media', materia_id: 'm2', tareas: conMateria, ahora });
    expect(m1.minutos).toBeLessThan(m2.minutos);
  });
  it('ignora tareas sin tiempo medido y valores absurdos', () => {
    expect(muestrasDeTiempo([hecha('a', 'media', 2), { id: 'b', status: 'pendiente', tiempo_real_minutos: 90 }], [], ahora)).toHaveLength(0);
    const p = predecirMinutos({ dificultad: 'media', tareas: [hecha('a', 'media', 5000), hecha('b', 'media', 5000)], ahora });
    expect(p.aprendido).toBeLessThanOrEqual(240); // se acota a 4 veces la base
  });
  it('junta el tiempo del espacio de trabajo y de los Pomodoros sin duplicar', () => {
    const t = { id: 't1', tiempo_real_minutos: 40 };
    expect(tiempoRealDeTarea(t, [{ tarea_id: 't1', completada: true, duracion_minutos: 25 }])).toBe(40);
    expect(tiempoRealDeTarea(t, [{ tarea_id: 't1', completada: true, duracion_minutos: 25 }, { tarea_id: 't1', completada: true, duracion_minutos: 25 }])).toBe(50);
    expect(tiempoRealDeTarea({ id: 't2' }, [{ tarea_id: 't1', completada: true, duracion_minutos: 25 }])).toBe(0);
  });
  it('resume lo aprendido y qué tan buenas son tus estimaciones', () => {
    const tareas = [hecha('a', 'media', 30, { estimated_minutes: 60 }), hecha('b', 'media', 36, { estimated_minutes: 60 })];
    const tabla = tablaAprendizaje(tareas, [], ahora);
    expect(tabla.map((x) => x.clave)).toEqual(['facil', 'media', 'dificil']);
    expect(tabla[1].muestras).toBe(2);
    expect(precisionDeEstimaciones(tareas, [], ahora).texto).toContain('más rápido');
    expect(precisionDeEstimaciones([hecha('a', 'media', 30, { estimated_minutes: 60 })], [], ahora)).toBeNull();
    expect([formatoMinutos(45), formatoMinutos(90), formatoMinutos(120)]).toEqual(['45 min', '1 h 30 min', '2 h']);
  });
});
