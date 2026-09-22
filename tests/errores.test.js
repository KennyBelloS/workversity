import { describe, it, expect } from 'vitest';
import { esErrorDeEsquema, textoErrorDeEsquema } from '../src/offline/errores.js';

describe('base de datos desactualizada', () => {
  const columna = { code: 'PGRST204', message: "Could not find the 'enlace_virtual' column of 'materias' in the schema cache" };
  it('reconoce columnas y tablas que faltan y dice cuál', () => {
    expect(esErrorDeEsquema(columna)).toBe(true);
    expect(esErrorDeEsquema({ code: '42703', message: 'column "x" does not exist' })).toBe(true);
    expect(esErrorDeEsquema({ code: 'PGRST205', message: "Could not find the table 'public.avances_meta' in the schema cache" })).toBe(true);
    expect(textoErrorDeEsquema(columna)).toContain('la columna «enlace_virtual» de «materias»');
    expect(textoErrorDeEsquema({ message: "Could not find the table 'public.cortes_notas' in the schema cache" })).toContain('la tabla «cortes_notas»');
  });
  it('no confunde otros errores', () => {
    expect(esErrorDeEsquema({ code: '23503', message: 'violates foreign key constraint' })).toBe(false);
    expect(esErrorDeEsquema({ code: '42501', message: 'new row violates row-level security policy' })).toBe(false);
    expect(esErrorDeEsquema(null)).toBe(false);
  });
});
