import { describe, it, expect } from 'vitest';
import { debeSugerirRevision, claveSemana, reprogramar, datosRevision } from '../src/lib/revision.js';

describe('revisión semanal', () => {
  it('se sugiere de viernes a domingo, una vez por semana', () => {
    const vie = new Date(2026, 8, 25, 18); const mie = new Date(2026, 8, 23, 18); const dom = new Date(2026, 8, 27, 18);
    expect(debeSugerirRevision(vie, null)).toBe(true);
    expect(debeSugerirRevision(dom, null)).toBe(true);
    expect(debeSugerirRevision(mie, null)).toBe(false);
    expect(debeSugerirRevision(vie, claveSemana(vie))).toBe(false);
    expect(claveSemana(vie)).toBe(claveSemana(dom)); // viernes y domingo son de la misma semana
  });
  it('reprograma conservando la hora', () => {
    const ahora = new Date(2026, 8, 25, 18, 0);
    const d = new Date(reprogramar({ due_date: new Date(2026, 8, 20, 9, 30).toISOString() }, 1, ahora));
    expect([d.getDate(), d.getHours(), d.getMinutes()]).toEqual([26, 9, 30]);
    const s = new Date(reprogramar({ due_date: new Date(2026, 8, 20, 23, 59).toISOString() }, 7, ahora));
    expect(s.getDate()).toBe(2);
    expect(s > ahora).toBe(true);
  });
  it('separa vencidas y próximas', () => {
    const ahora = new Date(2026, 8, 25, 12);
    const T = (id, h, st = 'pendiente') => ({ id, status: st, due_date: new Date(ahora.getTime() + h * 3600000).toISOString() });
    const r = datosRevision({ ahora, tareas: [T('v', -5), T('p', 30), T('lejos', 400), T('hecha', -2, 'hecha')] });
    expect(r.vencidas.map((t) => t.id)).toEqual(['v']);
    expect(r.proximas.map((t) => t.id)).toEqual(['p']);
  });
});
