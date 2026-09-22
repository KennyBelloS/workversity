import { describe, it, expect } from 'vitest';
import { cuentaAtras, colorUrgencia, fraccionTiempo, sugerirHueco, proximasSesiones } from '../src/lib/preview.js';

const H = 3600000;
const ahora = new Date(2026, 8, 21, 9, 0); // lunes 9:00
const materias = [{ id: 'm1', nombre: 'Cálculo II', day_of_week: 1, start_minutes: 10 * 60, end_minutes: 12 * 60, color_value: '#5B8DEF' }, { id: 'm2', nombre: 'Cálculo II', day_of_week: 3, start_minutes: 8 * 60, end_minutes: 10 * 60, color_value: '#5B8DEF' }];

describe('vista previa dinámica', () => {
  it('cuenta regresiva legible', () => {
    expect(cuentaAtras(2 * 86400000 + 4 * H).texto).toBe('2 d 4 h');
    expect(cuentaAtras(3 * H + 12 * 60000).texto).toBe('3 h 12 min');
    expect(cuentaAtras(12 * 60000 + 5000).texto).toBe('12:05');
    expect(cuentaAtras(-5000).vencida).toBe(true);
  });
  it('color según urgencia', () => {
    expect(colorUrgencia(1 * H)).toBe('#E5484D');
    expect(colorUrgencia(10 * H)).toBe('#F5A524');
    expect(colorUrgencia(48 * H)).toBe('#3E7BFA');
    expect(colorUrgencia(200 * H)).toBe('#17C964');
    expect(colorUrgencia(-1, true)).toBe('#17C964');
  });
  it('fracción del tiempo transcurrido', () => {
    const t = { created_at: new Date(2026, 8, 20, 9).toISOString(), due_date: new Date(2026, 8, 22, 9).toISOString() };
    expect(fraccionTiempo(t, ahora)).toBeCloseTo(0.5);
    expect(fraccionTiempo({ due_date: new Date(2026, 8, 22, 9).toISOString() }, new Date(2027, 0, 1))).toBe(1);
  });
  it('próximas sesiones de una materia (junta todos sus días)', () => {
    const s = proximasSesiones({ ahora, materias, nombre: 'Cálculo II', n: 3 });
    expect(s.map((e) => [e.inicio.getDay(), e.inicio.getHours()])).toEqual([[1, 10], [3, 8], [1, 10]]);
  });
  it('sugiere un hueco libre antes de la entrega', () => {
    const tarea = { id: 't', status: 'pendiente', estimated_minutes: 60, due_date: new Date(2026, 8, 23, 20).toISOString() };
    const h = sugerirHueco(tarea, { ahora, materias });
    expect(h.cuando).toBe('hoy');
    expect(h.inicio >= ahora && h.fin > h.inicio && h.fin <= new Date(2026, 8, 21, 10)).toBe(true); // 9:00–10:00, antes de la clase de las 10
    expect(sugerirHueco({ ...tarea, status: 'hecha' }, { ahora, materias })).toBeNull();
    expect(sugerirHueco({ ...tarea, due_date: new Date(2026, 8, 21, 8).toISOString() }, { ahora, materias })).toBeNull();
  });
});
