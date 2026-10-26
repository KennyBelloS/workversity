import { describe, it, expect, afterEach, vi } from 'vitest';
import { mensajeAmigable } from '../src/lib/erroresAmigables.js';

describe('mensajes de error amigables (nada de jerga técnica en inglés)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('un error de red se convierte en "necesitas conexión"', () => {
    vi.stubGlobal('navigator', { onLine: true });
    const err = { name: 'TypeError', message: 'NetworkError when attempting to fetch resource.' };
    expect(mensajeAmigable(err, 'crear el espacio')).toBe('Para crear el espacio necesitas conexión a internet. Cuando la tengas, intenta de nuevo.');
    expect(mensajeAmigable(err)).toBe('Esto necesita conexión a internet. Cuando la tengas, intenta de nuevo.');
  });

  it('si el navegador está realmente sin señal, también cuenta como error de red', () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(mensajeAmigable(new Error('cualquier cosa'), 'guardar')).toBe('Para guardar necesitas conexión a internet. Cuando la tengas, intenta de nuevo.');
  });

  it('un mensaje claro que ya viene en español se deja tal cual', () => {
    vi.stubGlobal('navigator', { onLine: true });
    expect(mensajeAmigable({ message: 'Ese código no existe o ya no es válido.' }, 'unirte')).toBe('Ese código no existe o ya no es válido.');
  });

  it('un error técnico sin traducir (stack de JS) se cambia por algo genérico, nunca se muestra crudo', () => {
    vi.stubGlobal('navigator', { onLine: true });
    expect(mensajeAmigable({ message: 'Error: something odd happened' }, 'cargar tus metas')).toBe('No se pudo cargar tus metas. Intenta de nuevo.');
    expect(mensajeAmigable({ message: 'at Object.<anonymous> (file.js:10:5)' })).toBe('No se pudo completar la acción. Intenta de nuevo.');
  });

  it('un error crudo de IndexedDB (el que sí se coló antes) también cae al mensaje genérico', () => {
    vi.stubGlobal('navigator', { onLine: true });
    const err = new Error("Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.");
    expect(mensajeAmigable(err, 'cargar la información')).toBe('No se pudo cargar la información. Intenta de nuevo.');
  });
});
