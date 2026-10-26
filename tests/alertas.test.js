import { describe, it, expect } from 'vitest';
import { calcularAlertas } from '../src/lib/alertas.js';
import { estadoPresupuesto } from '../src/lib/presupuesto.js';

const ahora = new Date(2026, 8, 21, 10, 0);
const T = (id, prio, horas, extra = {}) => ({ id, title: id, status: 'pendiente', priority: prio, due_date: new Date(ahora.getTime() + horas * 3600000).toISOString(), ...extra });

describe('alertas de la campana', () => {
  it('vencidas, próximas y clases', () => {
    const al = calcularAlertas({ ahora, tareas: [T('v', 'media', -3), T('pronto', 'alta', 2), T('x', 'baja', 100), T('h', 'baja', 30, { status: 'hecha' })], materias: [{ id: 'm1', nombre: 'Cálculo II', day_of_week: 1, start_minutes: 11 * 60, end_minutes: 12 * 60 + 30, color_value: '#5B8DEF' }] });
    expect(al.filter((a) => a.tipo === 'vencida')).toHaveLength(1);
    expect(al.some((a) => a.tipo === 'pronto')).toBe(true);
    expect(al.some((a) => a.id.startsWith('e:'))).toBe(true);
    expect(al[0].tipo).toBe('vencida');
  });
  it('avisa del presupuesto y sugiere la revisión semanal', () => {
    const presupuesto = estadoPresupuesto({ ahora, presupuestos: [{ mes: '2026-09', amount: 1000000 }], movimientos: [{ type: 'gasto', amount: 850000, date: new Date(2026, 8, 5).toISOString() }] });
    const al = calcularAlertas({ ahora, presupuesto, sugerirRevision: true });
    expect(al.find((a) => a.tipo === 'presupuesto').titulo).toContain('85%');
    expect(al.some((a) => a.tipo === 'revision')).toBe(true);
  });
});

describe('presupuesto', () => {
  const p = [{ mes: '2026-09', amount: 1000000 }];
  const g = (n, dia = 5) => [{ type: 'gasto', amount: n, date: new Date(2026, 8, dia).toISOString() }];
  it('niveles ok / ritmo / aviso / excedido', () => {
    expect(estadoPresupuesto({ ahora, presupuestos: p, movimientos: g(200000) }).nivel).toBe('ok');
    expect(estadoPresupuesto({ ahora, presupuestos: p, movimientos: g(850000) }).nivel).toBe('aviso');
    expect(estadoPresupuesto({ ahora, presupuestos: p, movimientos: g(1050000) }).nivel).toBe('excedido');
    expect(estadoPresupuesto({ ahora: new Date(2026, 8, 10), presupuestos: p, movimientos: g(600000) }).nivel).toBe('ritmo');
  });
  it('sin presupuesto no hay estado', () => {
    expect(estadoPresupuesto({ ahora, presupuestos: [], movimientos: [] })).toBeNull();
  });
});

describe('alertas de metas de progreso', () => {
  it('avisa si vas atrasado o llevas días sin avanzar', () => {
    const meta = { id: 'l1', title: 'Leer', unidad: 'páginas' };
    const al = calcularAlertas({ ahora, metasProgreso: [
      { meta, e: { hecho: false, estado: 'atrasado', necesarioPorDia: 30, ritmo: 10, total: 50, diasSinAvance: 1 } },
      { meta: { ...meta, id: 'l2', title: 'Curso' }, e: { hecho: false, estado: 'a-tiempo', total: 5, diasSinAvance: 4 } },
      { meta: { ...meta, id: 'l3', title: 'Listo' }, e: { hecho: true } },
    ] });
    expect(al.filter((a) => a.tipo === 'meta').map((a) => a.titulo)).toEqual(['Vas atrasado con «Leer»', 'Hace 4 días que no avanzas en «Curso»']);
  });
});

describe('todas las tareas vencidas se avisan, sin límite (así lo pidió el usuario)', () => {
  it('con más de 5 vencidas, se muestran las 8, no un resumen de "3 más"', () => {
    const ahora = new Date(2026, 8, 21, 10, 0);
    const T = (id, horas) => ({ id, title: id, status: 'pendiente', priority: 'media', due_date: new Date(ahora.getTime() + horas * 3600000).toISOString() });
    const tareas = Array.from({ length: 8 }, (_, i) => T(`t${i}`, -1 - i));
    const al = calcularAlertas({ ahora, tareas }).filter((a) => a.tipo === 'vencida');
    expect(al).toHaveLength(8);
    expect(al.some((a) => a.titulo.includes('más'))).toBe(false);
  });
});
