import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { RELEASES } from '../src/changelog.js';
import { compararVersiones } from '../src/version.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

describe('versiones y reporte de cambios', () => {
  it('package.json coincide con la versión más nueva del changelog (si no, el aviso de actualización falla)', () => {
    expect(pkg.version).toBe(RELEASES[0].version);
  });
  it('las versiones van de la más nueva a la más vieja y no se repiten', () => {
    for (let i = 1; i < RELEASES.length; i++) expect(compararVersiones(RELEASES[i - 1].version, RELEASES[i].version)).toBeGreaterThan(0);
  });
  it('cada versión trae fecha, título y cambios válidos', () => {
    for (const r of RELEASES) {
      expect(r.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.titulo.length).toBeGreaterThan(3);
      expect(r.cambios.length).toBeGreaterThan(0);
      r.cambios.forEach((c) => { expect(['nuevo', 'mejora', 'arreglo']).toContain(c.t); expect(c.x.length).toBeGreaterThan(5); });
    }
  });
  it('compara versiones con números de varias cifras', () => {
    expect(compararVersiones('1.10.0', '1.9.2')).toBeGreaterThan(0);
    expect(compararVersiones('1.5.1', '1.5.1')).toBe(0);
    expect(compararVersiones('1.5.0', '1.5.1')).toBeLessThan(0);
  });
});
