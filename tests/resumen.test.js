import { describe, it, expect } from 'vitest';
import { rangoPeriodo, calcularResumen } from '../src/lib/resumen.js';

const lunes = new Date(2026, 8, 21, 10, 0);
const mk = (id, st, dueH, comp, mid) => ({ id, title: id, status: st, priority: 'media', due_date: new Date(lunes.getTime() + dueH * 3600000).toISOString(), completed_at: comp, materia_id: mid });

describe('resumen semanal', () => {
  it('calcula completadas, vencidas, cumplimiento, enfoque y dinero', () => {
    const r = calcularResumen({
      rango: rangoPeriodo('semana', 0, lunes), rangoPrevio: rangoPeriodo('semana', -1, lunes), ahora: lunes,
      tareas: [mk('a', 'hecha', -20, new Date(2026, 8, 21, 8).toISOString(), 'm1'), mk('b', 'hecha', 40, new Date(2026, 8, 22, 9).toISOString(), 'm1'), mk('c', 'pendiente', -5, null, 'm2'), mk('d', 'pendiente', 60, null, 'm2'), mk('e', 'hecha', -200, new Date(2026, 8, 15, 9).toISOString(), 'm1')],
      sesiones: [{ completada: true, hora_inicio: new Date(2026, 8, 21, 9).toISOString(), duracion_minutos: 50 }],
      movimientos: [{ type: 'ingreso', amount: 1000000, date: new Date(2026, 8, 22).toISOString(), category: 'Salario' }, { type: 'gasto', amount: 200000, date: new Date(2026, 8, 22).toISOString(), category: 'Comida' }],
      materias: [{ id: 'm1', nombre: 'Física', day_of_week: 1, color_value: '#f00' }, { id: 'm2', nombre: 'Cálculo', day_of_week: 2, color_value: '#0f0' }], bloques: [],
    });
    expect([r.hechas, r.vencidas, r.porVencer, r.cumplimiento, r.minutosEnfoque, r.hechasPrevio]).toEqual([2, 1, 1, 50, 50, 1]);
    expect([r.ingresos, r.gastos, r.clases]).toEqual([1000000, 200000, 2]);
    expect(r.filas.find((f) => f.nombre === 'Física').progreso).toBe(100);
    expect(r.insights.length).toBeGreaterThan(2);
  });
});
