import { describe, it, expect } from 'vitest';
import { combinarCategorias, limpiarNombre, resumenAhorro } from '../src/lib/categoriasAhorro.js';

describe('categorías de ahorro', () => {
  it('junta las predeterminadas con las propias ("Otro" al final, sin repetir)', () => {
    const t = combinarCategorias([{ id: '1', nombre: 'Viaje', color: '#f00' }, { id: '2', nombre: 'inversión' }]);
    expect(t.map((c) => c.nombre)).toEqual(['Fondo de emergencia', 'Meta personal', 'Inversión', 'Viaje', 'Otro']);
    expect(t.find((c) => c.nombre === 'Viaje').propia).toBe(true);
  });
  it('limpia nombres', () => {
    expect(limpiarNombre('  viaje   a   cartagena ')).toBe('Viaje a cartagena');
    expect(limpiarNombre('   ')).toBe('');
    expect(limpiarNombre('x'.repeat(50))).toHaveLength(30);
  });
  it('reparte el ahorro y detecta el que no tiene meta', () => {
    const categorias = combinarCategorias([{ id: '1', nombre: 'Viaje' }]);
    const r = resumenAhorro({
      categorias, metas: [{ title: 'Cartagena', categoria_vinculada: 'Viaje' }],
      movimientos: [{ type: 'ahorro', category: 'Viaje', amount: 200000 }, { type: 'ahorro', category: 'Inversión', amount: 100000 }, { type: 'gasto', category: 'Comida', amount: 5000 }, { type: 'ahorro', category: 'Borrada', amount: 1000 }],
    });
    expect(r.total).toBe(301000);
    expect(r.sinMeta.map((f) => f.nombre)).toEqual(['Inversión', 'Borrada']);
    expect(r.filas.find((f) => f.nombre === 'Borrada').huerfana).toBe(true);
  });
});
