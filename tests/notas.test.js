import { describe, it, expect } from 'vitest';
import { parsearNota, expandirActividades, calcularCorte, calcularMateria, agruparNotas, APRUEBA } from '../src/lib/notas.js';

const ev = (corte, porcentaje, nota, items) => ({ corte, porcentaje, nota, ...(items ? { items } : {}) });

describe('notas (escala 0.0–5.0, se aprueba con 3.0)', () => {
  it('lee notas en varios formatos, incluida la escala 00–50', () => {
    expect(parsearNota('3.5').valor).toBe(3.5);
    expect(parsearNota('3,5').valor).toBe(3.5);
    expect(parsearNota('35').valor).toBe(3.5);
    expect(parsearNota('30').valor).toBe(3);
    expect(parsearNota('50').valor).toBe(5);
    expect(parsearNota('00').valor).toBe(0);
    expect(parsearNota('').vacio).toBe(true);
    ['51', '6', '5.5', 'abc'].forEach((x) => expect(parsearNota(x).error).toBeTruthy());
    expect(APRUEBA).toBe(3);
  });
  it('calcula la nota de un corte', () => {
    const c = calcularCorte([{ porcentaje: 40, nota: 4 }, { porcentaje: 30, nota: 3.5 }, { porcentaje: 30, nota: 5 }]);
    expect(c.acumulado).toBeCloseTo(4.15);
    expect(c.estado).toBe('ganado');
  });
  it('una actividad desglosada en partes iguales (talleres)', () => {
    const partes = expandirActividades([ev(1, 30, null, [{ nota: 4 }, { nota: 2 }, { nota: null }, { nota: null }])]);
    expect(partes).toHaveLength(4);
    expect(partes[0].porcentaje).toBeCloseTo(7.5);
    const c = calcularCorte(partes);
    expect(c.pctEvaluado).toBeCloseTo(15);
    expect(c.promedio).toBeCloseTo(3);
    expect(c.estado).toBe('ganando');
  });
  it('dice si vas perdiendo (por debajo de 3.0) o ganando', () => {
    expect(calcularMateria({ evals: [ev(1, 100, 2.4)] }).ritmo).toBe('perdiendo');
    expect(calcularMateria({ evals: [ev(1, 100, 3.0)] }).ritmo).toBe('ganando');
    expect(calcularCorte([{ porcentaje: 100, nota: 2.9 }]).estado).toBe('perdido');
  });
  it('estados de la materia', () => {
    expect(calcularMateria({ evals: [] }).estado).toBe('sin-datos');
    expect(calcularMateria({ evals: [ev(1, 100, 3), ev(2, 100, 3), ev(3, 100, 3)] }).estado).toBe('aprobada');
    expect(calcularMateria({ evals: [ev(1, 100, 2), ev(2, 100, 2), ev(3, 100, 2.9)] }).estado).toBe('reprobada');
    expect(calcularMateria({ evals: [ev(1, 100, 0.5), ev(2, 100, 0.5), ev(3, 50, null)] }).estado).toBe('imposible');
    const m = calcularMateria({ evals: [ev(1, 40, 4), ev(1, 30, 3.5), ev(1, 30, 5), ev(2, 100, null), ev(3, 100, null)] });
    expect(m.acumulado).toBeCloseTo(1.4525);
    expect(m.necesariaAprobar).toBeCloseTo((3 - 1.4525) / 0.65);
  });
  it('agrupa materias con varios días como una sola', () => {
    const filas = agruparNotas({ materias: [{ id: 'a', nombre: 'Física' }, { id: 'b', nombre: 'Física' }], evaluaciones: [{ materia_id: 'b', corte: 1, porcentaje: 100, nota: 4 }], cortes: [] });
    expect(filas).toHaveLength(1);
    expect(filas[0].m.hayDatos).toBe(true);
  });
});
