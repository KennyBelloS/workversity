import { describe, it, expect, beforeEach } from 'vitest';
import { LOGROS, contextoLogros, evaluarLogros } from '../src/lib/logros.js';
import { registrarEntradaDeHoy } from '../src/lib/rachaEntrada.js';

if (typeof localStorage === 'undefined') {
  const mapa = new Map();
  globalThis.localStorage = { getItem: (k) => (mapa.has(k) ? mapa.get(k) : null), setItem: (k, v) => mapa.set(k, String(v)), removeItem: (k) => mapa.delete(k), clear: () => mapa.clear() };
}
beforeEach(() => localStorage.clear());

const ahora = new Date(2026, 8, 21, 12, 0);
const iso = (d, h = 12) => new Date(2026, 8, d, h).toISOString();

describe('logros', () => {
  it('los ids son únicos', () => {
    expect(new Set(LOGROS.map((l) => l.id)).size).toBe(LOGROS.length);
  });
  it('se calculan a partir de los datos', () => {
    const tareas = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, status: 'hecha', due_date: iso(25), completed_at: iso(21 - (i % 3), 9) }));
    const ctx = contextoLogros({
      tareas, sesiones: [{ completada: true, duracion_minutos: 25, hora_inicio: iso(21) }],
      materias: [{ id: 'm1', nombre: 'A' }, { id: 'm2', nombre: 'B' }, { id: 'm3', nombre: 'C' }],
      evaluaciones: [{ materia_id: 'm1', corte: 1, porcentaje: 100, nota: 4.5 }],
      movimientos: [{ type: 'ahorro', category: 'Viaje', amount: 500000 }], metas: [{ target_amount: 400000, categoria_vinculada: 'Viaje' }],
      categoriasPropias: [{ nombre: 'Viaje' }], revisiones: 1, instalada: true, ahora,
    });
    const l = Object.fromEntries(evaluarLogros(ctx).map((x) => [x.id, x]));
    ['primera-tarea', 'diez-tareas', 'puntual', 'racha-3', 'primer-pomodoro', 'tres-materias', 'primera-nota', 'corte-ganado', 'primer-ahorro', 'meta-cumplida', 'categoria-propia', 'revision-1', 'app-instalada'].forEach((id) => expect(l[id].logrado, id).toBe(true));
    ['cincuenta-tareas', 'racha-7', 'revision-4', 'diez-pomodoros'].forEach((id) => expect(l[id].logrado, id).toBe(false));
    expect(l['cincuenta-tareas'].actual).toBe(10);
  });
  it('sin datos no hay logros', () => {
    expect(evaluarLogros(contextoLogros({})).some((l) => l.logrado)).toBe(false);
  });
});

describe('logros de metas de progreso', () => {
  it('primer avance y meta terminada', () => {
    const metas = [{ id: 'l1', tipo: 'progreso', target_amount: 100, unidad: 'páginas' }];
    const avances = [{ meta_id: 'l1', cantidad: 100, fecha: new Date(2026, 8, 20, 12).toISOString() }];
    const l = Object.fromEntries(evaluarLogros(contextoLogros({ metas, avances, ahora })).map((x) => [x.id, x]));
    expect(l['primer-avance'].logrado).toBe(true);
    expect(l['meta-lectura'].logrado).toBe(true);
    expect(l['meta-cumplida'].logrado).toBe(false); // una meta de progreso no cuenta como meta de ahorro
    expect(l['constancia-30'].logrado).toBe(false);
  });
});

describe('logro de racha de entrada (independiente de la racha de uso)', () => {
  it('se desbloquea a los 7 días seguidos entrando, sin necesidad de completar tareas', () => {
    for (let d = 0; d < 7; d++) registrarEntradaDeHoy(new Date(2026, 8, 21 + d, 10));
    const ctx = contextoLogros({ ahora: new Date(2026, 8, 27, 10) });
    const l = Object.fromEntries(evaluarLogros(ctx).map((x) => [x.id, x]));
    expect(l['entrada-7'].logrado).toBe(true);
    expect(l['entrada-30'].logrado).toBe(false);
    // y no depende de la racha de uso (tareas/pomodoros), que sigue en 0
    expect(l['racha-3'].logrado).toBe(false);
  });
});
