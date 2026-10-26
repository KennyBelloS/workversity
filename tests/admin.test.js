import { describe, it, expect } from 'vitest';
import { calcularEstadisticasUsuarios, ordenarPorUltimoIngreso } from '../src/lib/admin.js';

const ahora = new Date(2026, 9, 25, 12, 0); // 25 de octubre
const haceDias = (d) => new Date(ahora.getTime() - d * 86400000).toISOString();

describe('calcularEstadisticasUsuarios', () => {
  it('cuenta el total, activos recientes, nuevos y el promedio de ingresos', () => {
    const usuarios = [
      { id: '1', ultimo_ingreso: haceDias(1), total_ingresos: 10, created_at: haceDias(40) },
      { id: '2', ultimo_ingreso: haceDias(5), total_ingresos: 4, created_at: haceDias(3) },
      { id: '3', ultimo_ingreso: haceDias(20), total_ingresos: 2, created_at: haceDias(25) },
      { id: '4', ultimo_ingreso: null, total_ingresos: 0, created_at: haceDias(1) },
    ];
    const r = calcularEstadisticasUsuarios(usuarios, ahora);
    expect(r.total).toBe(4);
    expect(r.activos7d).toBe(2); // usuarios 1 y 2
    expect(r.activos30d).toBe(3); // 1, 2 y 3 (no el que nunca entró)
    expect(r.nuevos7d).toBe(2); // usuarios 2 y 4
    expect(r.nuncaEntraron).toBe(1);
    expect(r.promedioIngresos).toBe(4); // (10+4+2+0)/4 = 4
  });

  it('con cero usuarios no revienta y da todo en 0', () => {
    const r = calcularEstadisticasUsuarios([], ahora);
    expect(r).toEqual({ total: 0, activos7d: 0, activos30d: 0, nuevos7d: 0, promedioIngresos: 0, nuncaEntraron: 0 });
  });
});

describe('ordenarPorUltimoIngreso', () => {
  it('pone primero a quien entró más recientemente, y al final a quien nunca ha entrado', () => {
    const usuarios = [
      { id: 'a', ultimo_ingreso: haceDias(10) },
      { id: 'b', ultimo_ingreso: null },
      { id: 'c', ultimo_ingreso: haceDias(1) },
    ];
    const r = ordenarPorUltimoIngreso(usuarios);
    expect(r.map((u) => u.id)).toEqual(['c', 'a', 'b']);
  });
});
