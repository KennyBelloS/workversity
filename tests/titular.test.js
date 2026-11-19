import { describe, it, expect } from 'vitest';
import { horasDe, titularDelDia } from '../src/lib/titular';

describe('cómo se dice el tiempo en el titular', () => {
  it('nunca deja un número colgando sin unidad', () => {
    for (const m of [1, 45, 59, 60, 61, 90, 125, 150, 480, 505]) {
      expect(horasDe(m)).toMatch(/(min|h|media)$/);
    }
  });

  it('dice las medias horas como se dicen', () => {
    expect(horasDe(90)).toBe('1 h y media');
    expect(horasDe(150)).toBe('2 h y media');
  });

  it('las horas exactas van sin minutos', () => {
    expect(horasDe(60)).toBe('1 h');
    expect(horasDe(480)).toBe('8 h');
  });

  it('y los minutos sueltos sí llevan su unidad', () => {
    expect(horasDe(125)).toBe('2 h 05 min');
    expect(horasDe(45)).toBe('45 min');
  });
});

describe('qué titular sale según el día', () => {
  it('lo atrasado manda sobre todo lo demás', () => {
    const t = titularDelDia({ vencidas: 3, hoyEntregas: 2, minutosOcupados: 480, bloques: 3 });
    expect(t.resaltado).toBe('3 entregas atrasadas');
  });

  it('si no hay atrasos, mandan las entregas de hoy', () => {
    expect(titularDelDia({ hoyEntregas: 1, minutosOcupados: 0 }).resaltado).toBe('1 entrega');
  });

  it('un día ocupado sin entregas habla de horas', () => {
    const t = titularDelDia({ minutosOcupados: 150, bloques: 2 });
    expect(t.resaltado).toBe('2 h y media');
    expect(`${t.titular} ${t.resaltado} ${t.bajada}`).not.toMatch(/\d\.$/);
  });

  it('y un día vacío lo dice sin inventar datos', () => {
    expect(titularDelDia({}).resaltado).toBe('despejado');
  });
});
