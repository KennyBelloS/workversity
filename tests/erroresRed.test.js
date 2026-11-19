import { describe, it, expect } from 'vitest';
import { esErrorDeRed } from '../src/offline/sync';
import { mensajeAmigable } from '../src/lib/erroresAmigables';

describe('cuándo decimos "no hay internet"', () => {
  it('un fallo real de fetch sí cuenta', () => {
    expect(esErrorDeRed(new TypeError('Failed to fetch'))).toBe(true);
    expect(esErrorDeRed(new TypeError('NetworkError when attempting to fetch resource.'))).toBe(true);
    expect(esErrorDeRed(new TypeError('Load failed'))).toBe(true);
  });

  it('un error del propio código NO cuenta, aunque sea TypeError', () => {
    expect(esErrorDeRed(new TypeError("Cannot read properties of undefined (reading 'id')"))).toBe(false);
    expect(esErrorDeRed(new TypeError('x is not a function'))).toBe(false);
  });

  it('y por eso el mensaje deja de culpar a la conexión', () => {
    const msg = mensajeAmigable(new TypeError("Cannot read properties of undefined (reading 'id')"), 'salir del espacio');
    expect(msg).not.toMatch(/internet/i);
    expect(msg).toMatch(/No se pudo salir del espacio/);
  });
});
