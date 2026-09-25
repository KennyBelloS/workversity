import { describe, it, expect, afterEach, vi } from 'vitest';
import { esErrorDeRed, posibleProyectoInalcanzable } from '../src/offline/sync.js';

describe('distinguir "sin internet" de "el proyecto de Supabase no responde"', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('un TypeError de fetch cuenta como error de red', () => {
    expect(esErrorDeRed({ name: 'TypeError', message: 'Failed to fetch' })).toBe(true);
    expect(esErrorDeRed({ status: 503 })).toBe(true);
    expect(esErrorDeRed(null)).toBe(false);
  });

  it('si el navegador dice que SÍ hay internet, el mismo error es "proyecto inalcanzable"', () => {
    vi.stubGlobal('navigator', { onLine: true });
    const err = { name: 'TypeError', message: 'Failed to fetch' };
    expect(esErrorDeRed(err)).toBe(true);
    expect(posibleProyectoInalcanzable(err)).toBe(true);
  });

  it('si el navegador dice que NO hay internet, es de verdad "sin conexión" (no un problema del proyecto)', () => {
    vi.stubGlobal('navigator', { onLine: false });
    const err = { name: 'TypeError', message: 'Failed to fetch' };
    expect(esErrorDeRed(err)).toBe(true);
    expect(posibleProyectoInalcanzable(err)).toBe(false);
  });

  it('sin error, no hay nada que reportar', () => {
    vi.stubGlobal('navigator', { onLine: true });
    expect(posibleProyectoInalcanzable(null)).toBe(false);
  });
});
