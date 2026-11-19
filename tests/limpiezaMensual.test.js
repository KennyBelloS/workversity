import { describe, it, expect } from 'vitest';
import { tareasParaLimpiar, yaSePreguntoEsteMes, guardarPreguntaHecha } from '../src/lib/limpiezaMensual.js';

const AHORA = new Date('2026-10-20T12:00:00Z');

describe('limpieza mensual de tareas hechas', () => {
  it('encuentra solo las tareas hechas de meses anteriores, no las de este mes', () => {
    const tareas = [
      { id: '1', status: 'hecha', completed_at: '2026-09-15T00:00:00Z' }, // mes anterior: sí
      { id: '2', status: 'hecha', completed_at: '2026-10-05T00:00:00Z' }, // este mes: no
      { id: '3', status: 'pendiente', due_date: '2026-09-01T00:00:00Z' }, // no está hecha
      { id: '4', status: 'hecha', completed_at: '2026-08-01T00:00:00Z' }, // mes anterior: sí
    ];
    const r = tareasParaLimpiar(tareas, AHORA);
    expect(r.map((t) => t.id).sort()).toEqual(['1', '4']);
  });

  it('una tarea hecha sin ninguna fecha no revienta (se ignora)', () => {
    expect(tareasParaLimpiar([{ id: '1', status: 'hecha' }], AHORA)).toHaveLength(0);
  });

  it('sin tareas, devuelve una lista vacía', () => {
    expect(tareasParaLimpiar([], AHORA)).toEqual([]);
  });

  it('solo se pregunta una vez por mes', () => {
    let guardado = null;
    const guardar = (v) => { guardado = v; };
    const leer = () => guardado;
    expect(yaSePreguntoEsteMes(AHORA, leer)).toBe(false);
    guardarPreguntaHecha(AHORA, guardar);
    expect(yaSePreguntoEsteMes(AHORA, leer)).toBe(true);
  });

  it('un mes distinto vuelve a preguntar', () => {
    let guardado = '2026-09';
    expect(yaSePreguntoEsteMes(AHORA, () => guardado)).toBe(false);
  });
});
