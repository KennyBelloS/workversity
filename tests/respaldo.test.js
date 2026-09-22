import { describe, it, expect } from 'vitest';
import { crearRespaldo, prepararRestauracion, FORMATO } from '../src/lib/respaldo.js';

let n = 0;
const nuevoId = () => `nuevo-${++n}`;
const tablas = {
  materias: [{ id: 'm1', user_id: 'A', nombre: 'Física' }],
  tareas: [{ id: 't2', user_id: 'A', parent_task_id: 't1', materia_id: 'm1', title: 'Sub' }, { id: 't1', user_id: 'A', materia_id: 'm1', title: 'Padre' }],
  evaluaciones: [{ id: 'e1', user_id: 'A', materia_id: 'm1', nombre: 'Parcial', porcentaje: 100, nota: 4 }],
  movimientos: [{ id: 'x1', user_id: 'A', type: 'gasto', amount: 10 }],
};

describe('copia de seguridad', () => {
  it('misma cuenta: conserva los ids (restaurar dos veces no duplica)', () => {
    const r = prepararRestauracion({ respaldo: crearRespaldo({ usuarioId: 'A', version: '1', tablas }), usuarioId: 'A', nuevoId });
    expect(r.ok && !r.remapeado).toBe(true);
    expect(r.operaciones.find((o) => o.tabla === 'tareas' && o.fila.title === 'Sub').fila.id).toBe('t2');
    expect(r.operaciones.every((o) => !('user_id' in o.fila))).toBe(true);
  });
  it('otra cuenta: ids nuevos y referencias ajustadas; padres antes que hijos', () => {
    const r = prepararRestauracion({ respaldo: crearRespaldo({ usuarioId: 'A', version: '1', tablas }), usuarioId: 'B', nuevoId });
    expect(r.remapeado).toBe(true);
    const ops = r.operaciones;
    const mat = ops.find((o) => o.tabla === 'materias').fila;
    const padre = ops.find((o) => o.fila.title === 'Padre').fila;
    const hijo = ops.find((o) => o.fila.title === 'Sub').fila;
    expect(mat.id).not.toBe('m1');
    expect(padre.materia_id).toBe(mat.id);
    expect(hijo.parent_task_id).toBe(padre.id);
    expect(ops.indexOf(ops.find((o) => o.fila.title === 'Padre'))).toBeLessThan(ops.indexOf(ops.find((o) => o.fila.title === 'Sub')));
    expect(ops.find((o) => o.tabla === 'evaluaciones').fila.materia_id).toBe(mat.id);
  });
  it('copia antigua: conserva ids que ya existen aquí y renueva los demás', () => {
    const r = prepararRestauracion({ respaldo: tablas, usuarioId: 'B', idsExistentes: new Set(['m1']), nuevoId });
    expect(r.operaciones.find((o) => o.tabla === 'materias').fila.id).toBe('m1');
    expect(r.operaciones.find((o) => o.tabla === 'movimientos').fila.id).not.toBe('x1');
  });
  it('rechaza archivos que no son una copia', () => {
    expect(prepararRestauracion({ respaldo: { hola: 1 }, usuarioId: 'A', nuevoId }).ok).toBe(false);
    expect(prepararRestauracion({ respaldo: null, usuarioId: 'A', nuevoId }).ok).toBe(false);
    expect(FORMATO).toBe('workversity-respaldo');
  });
});

describe('copia de seguridad: metas de progreso', () => {
  it('los avances siguen a su meta aunque cambie de cuenta', () => {
    const tablas = { metas: [{ id: 'g1', user_id: 'A', title: 'Leer', tipo: 'progreso' }], avances_meta: [{ id: 'a1', user_id: 'A', meta_id: 'g1', cantidad: 10 }] };
    let k = 0;
    const r = prepararRestauracion({ respaldo: crearRespaldo({ usuarioId: 'A', version: '1', tablas }), usuarioId: 'B', nuevoId: () => `n${++k}` });
    const meta = r.operaciones.find((o) => o.tabla === 'metas').fila;
    const avance = r.operaciones.find((o) => o.tabla === 'avances_meta').fila;
    expect(meta.id).not.toBe('g1');
    expect(avance.meta_id).toBe(meta.id);
    expect(r.operaciones.findIndex((o) => o.tabla === 'metas')).toBeLessThan(r.operaciones.findIndex((o) => o.tabla === 'avances_meta'));
  });
});
