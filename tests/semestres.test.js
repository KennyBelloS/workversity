import { describe, it, expect } from 'vitest';
import { horasSemanales, nombreSugerido } from '../src/services/semestres';

describe('cerrar semestre', () => {
  it('suma las horas semanales de materias y bloques', () => {
    const materias = [{ start_minutes: 480, end_minutes: 600 }, { start_minutes: 600, end_minutes: 720 }];
    const bloques = [{ start_minutes: 900, end_minutes: 1200 }];
    expect(horasSemanales(materias, bloques)).toBe(9);
  });

  it('ignora bloques con horas al revés o incompletos', () => {
    expect(horasSemanales([{ start_minutes: 600, end_minutes: 500 }], [{}])).toBe(0);
  });

  it('sugiere el semestre según el mes', () => {
    expect(nombreSugerido(new Date(2026, 1, 10))).toBe('2026-1');
    expect(nombreSugerido(new Date(2026, 8, 10))).toBe('2026-2');
  });
});
