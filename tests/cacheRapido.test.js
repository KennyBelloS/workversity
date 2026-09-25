import { describe, it, expect, beforeEach } from 'vitest';
import { leerCacheRapida, guardarCacheRapida, traerConCacheRapida } from '../src/lib/cacheRapido.js';

// El entorno de pruebas es Node puro (sin navegador): se simula localStorage con un mapa.
if (typeof localStorage === 'undefined') {
  const mapa = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mapa.has(k) ? mapa.get(k) : null),
    setItem: (k, v) => mapa.set(k, String(v)),
    removeItem: (k) => mapa.delete(k),
    clear: () => mapa.clear(),
  };
}

beforeEach(() => localStorage.clear());

describe('caché rápida (mostrar lo de antes al instante)', () => {
  it('guarda y lee', () => {
    expect(leerCacheRapida('x')).toBeNull();
    guardarCacheRapida('x', { a: 1 });
    expect(leerCacheRapida('x')).toEqual({ a: 1 });
  });
  it('si la red responde a tiempo, entrega y guarda lo fresco', async () => {
    const r = await traerConCacheRapida('espacios', async () => ({ n: 2 }), { tiempoLimiteMs: 200 });
    expect(r).toEqual({ datos: { n: 2 }, deCache: false, fresco: true });
    expect(leerCacheRapida('espacios')).toEqual({ n: 2 });
  });
  it('si la red tarda demasiado pero hay algo guardado, muestra lo guardado en vez de colgarse', async () => {
    guardarCacheRapida('lento', { n: 1 });
    const lenta = () => new Promise((res) => setTimeout(() => res({ n: 9 }), 5000));
    const r = await traerConCacheRapida('lento', lenta, { tiempoLimiteMs: 50 });
    expect(r).toEqual({ datos: { n: 1 }, deCache: true, fresco: false });
  });
  it('llama a onRapido de inmediato con lo guardado, sin esperar la red', async () => {
    guardarCacheRapida('y', { v: 'antiguo' });
    const vistos = [];
    const lenta = () => new Promise((res) => setTimeout(() => res({ v: 'nuevo' }), 30));
    await traerConCacheRapida('y', lenta, { onRapido: (d) => vistos.push(d), tiempoLimiteMs: 200 });
    expect(vistos).toEqual([{ v: 'antiguo' }]);
  });
  it('sin nada guardado y la red falla, lanza un error claro', async () => {
    const falla = () => Promise.reject(new Error('sin red'));
    await expect(traerConCacheRapida('nueva', falla, { tiempoLimiteMs: 50 })).rejects.toThrow(/No se pudo cargar/);
  });
});
