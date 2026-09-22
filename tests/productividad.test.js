import { describe, it, expect } from 'vitest';
import { calcularRacha, recomendarAhora, clasificarEisenhower } from '../src/lib/productividad.js';
import { calcularHuecos, asignarAHuecos } from '../src/lib/huecos.js';

const lunes = new Date(2026, 8, 21, 10, 0);
const dia = (n) => new Date(2026, 8, 21 - n, 12).toISOString();
const hecha = (n) => ({ status: 'hecha', completed_at: dia(n) });
const T = (id, prio, horas, extra = {}) => ({ id, title: id, status: 'pendiente', priority: prio, due_date: new Date(lunes.getTime() + horas * 3600000).toISOString(), ...extra });

describe('racha', () => {
  it('cuenta días seguidos y no se pierde hasta que termina el día', () => {
    expect(calcularRacha([hecha(0), hecha(1), hecha(2)], [], lunes)).toBe(3);
    expect(calcularRacha([hecha(1), hecha(2)], [], lunes)).toBe(2);
    expect(calcularRacha([hecha(2), hecha(3)], [], lunes)).toBe(0);
    expect(calcularRacha([hecha(1)], [{ completada: true, hora_inicio: dia(0) }, { completada: true, hora_inicio: dia(2) }], lunes)).toBe(3);
  });
});
describe('qué hacer ahora', () => {
  it('ordena por urgencia y prioridad', () => {
    const r = recomendarAhora([T('lejana', 'baja', 200), T('vencida', 'media', -5), T('hoy-alta', 'alta', 5), T('mañana', 'media', 30)], { ahora: lunes, n: 3 });
    expect(r.map((x) => x.tarea.id)).toEqual(['vencida', 'hoy-alta', 'mañana']);
  });
  it('matriz de Eisenhower', () => {
    const q = clasificarEisenhower([T('a', 'alta', 10), T('b', 'alta', 200), T('c', 'baja', 5), T('d', 'baja', 300)], lunes);
    expect([q.hacerYa[0].id, q.planificar[0].id, q.rapidas[0].id, q.despues[0].id]).toEqual(['a', 'b', 'c', 'd']);
  });
});
describe('huecos libres', () => {
  const t = (h, m) => new Date(2026, 8, 21, h, m);
  it('encuentra huecos de 45+ min y propone tareas', () => {
    const eventos = [{ origen: 'materia', inicio: t(10, 0), fin: t(12, 0) }, { origen: 'bloque', inicio: t(14, 0), fin: t(18, 0) }, { origen: 'tarea', inicio: t(11, 0), fin: t(11, 30) }];
    const hs = calcularHuecos(eventos, { ahora: new Date(2026, 8, 21, 9, 30) });
    expect(hs.map((h) => [h.inicio.getHours(), h.minutos])).toEqual([[12, 120], [18, 180]]);
    const plan = asignarAHuecos(hs, [{ id: 'a', estimated_minutes: 60 }, { id: 'b', estimated_minutes: 90 }, { id: 'c' }]);
    expect(plan).toHaveLength(3);
  });
});
