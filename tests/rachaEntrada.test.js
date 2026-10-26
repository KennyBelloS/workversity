import { describe, it, expect, beforeEach } from 'vitest';
import { registrarEntradaDeHoy, estadoRachaEntrada } from '../src/lib/rachaEntrada.js';

if (typeof localStorage === 'undefined') {
  const mapa = new Map();
  globalThis.localStorage = { getItem: (k) => (mapa.has(k) ? mapa.get(k) : null), setItem: (k, v) => mapa.set(k, String(v)), removeItem: (k) => mapa.delete(k), clear: () => mapa.clear() };
}
beforeEach(() => localStorage.clear());

const dia = (n, h = 10) => new Date(2026, 8, 21 + n, h);

describe('racha de entrar a la app (día a día, sin importar si usaste algo)', () => {
  it('el primer día empieza en 1', () => {
    expect(registrarEntradaDeHoy(dia(0)).racha).toBe(1);
  });
  it('entrar varias veces el mismo día no duplica la racha', () => {
    registrarEntradaDeHoy(dia(0, 8));
    const r = registrarEntradaDeHoy(dia(0, 20));
    expect(r.racha).toBe(1);
  });
  it('entrar en días consecutivos suma la racha', () => {
    registrarEntradaDeHoy(dia(0));
    registrarEntradaDeHoy(dia(1));
    const r = registrarEntradaDeHoy(dia(2));
    expect(r.racha).toBe(3);
    expect(r.totalDias).toBe(3);
  });
  it('faltar un día reinicia la racha a 1 (no a 0)', () => {
    registrarEntradaDeHoy(dia(0));
    registrarEntradaDeHoy(dia(1));
    const r = registrarEntradaDeHoy(dia(5)); // saltó varios días
    expect(r.racha).toBe(1);
  });
  it('guarda la mejor racha histórica', () => {
    registrarEntradaDeHoy(dia(0)); registrarEntradaDeHoy(dia(1)); registrarEntradaDeHoy(dia(2));
    registrarEntradaDeHoy(dia(10)); // se rompe
    const r = registrarEntradaDeHoy(dia(11));
    expect(r.racha).toBe(2);
    expect(r.mejorRacha).toBe(3);
  });
  it('estadoRachaEntrada: sigue vigente si entraste hoy o ayer, se apaga si no', () => {
    registrarEntradaDeHoy(dia(0)); registrarEntradaDeHoy(dia(1));
    expect(estadoRachaEntrada(dia(1, 23)).racha).toBe(2);
    expect(estadoRachaEntrada(dia(2, 8)).racha).toBe(2); // "hoy" es un día después, ayer sí entró
    expect(estadoRachaEntrada(dia(3, 8)).racha).toBe(0); // ya pasaron 2 días sin entrar
  });
});
