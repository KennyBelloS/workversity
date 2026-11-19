import { describe, it, expect } from 'vitest';
import { idCorto, ordenarColumna, LIMITES_WIP } from '../src/lib/kanban.js';

describe('tablero kanban', () => {
  it('genera un id corto estable a partir del uuid', () => {
    expect(idCorto('4f2a91c0-1111-4111-8111-111111111111')).toBe('WV-4F2A');
    expect(idCorto('4f2a91c0-1111-4111-8111-111111111111')).toBe(idCorto('4f2a91c0-1111-4111-8111-111111111111'));
  });
  it('respeta el orden que se dejó al arrastrar y ubica el resto por fecha', () => {
    const t = [
      { id: 'a', due_date: '2026-11-20' }, { id: 'b', due_date: '2026-11-18' }, { id: 'c', due_date: '2026-11-19' },
    ];
    expect(ordenarColumna(t, ['c']).map((x) => x.id)).toEqual(['c', 'b', 'a']);
    expect(ordenarColumna(t, []).map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });
  it('la columna "En progreso" tiene límite de trabajo en curso', () => {
    expect(LIMITES_WIP.enProgreso).toBe(3);
  });
});
