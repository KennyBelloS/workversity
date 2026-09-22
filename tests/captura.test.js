import { describe, it, expect } from 'vitest';
import { interpretarCaptura } from '../src/lib/captura.js';

const lunes = new Date(2026, 8, 21, 10, 0); // lunes 21-sep-2026, 10:00
const mats = [{ id: 'm1', nombre: 'Física Mecánica' }, { id: 'm2', nombre: 'Cálculo II' }, { id: 'm3', nombre: 'Programación Web' }];

describe('captura rápida en lenguaje natural', () => {
  it('entiende fecha, hora, prioridad y materia', () => {
    const r = interpretarCaptura('entregar informe de física mañana 5pm !alta', { materias: mats, ahora: lunes });
    expect(r.titulo).toBe('Entregar informe de física');
    expect(r.prioridad).toBe('alta');
    expect(r.materiaId).toBe('m1');
    expect(r.due.getDate()).toBe(22);
    expect(r.due.getHours()).toBe(17);
  });
  it('días de la semana y "8 de la noche"', () => {
    const r = interpretarCaptura('taller cálculo el viernes a las 8 de la noche', { materias: mats, ahora: lunes });
    expect(r.due.getDay()).toBe(5);
    expect(r.due.getHours()).toBe(20);
    expect(r.materiaId).toBe('m2');
  });
  it('fechas numéricas y categoría trabajo', () => {
    const r = interpretarCaptura('preparar reunión con el cliente 25/09 10:30', { materias: mats, ahora: lunes });
    expect([r.due.getMonth(), r.due.getDate(), r.due.getHours(), r.due.getMinutes()]).toEqual([8, 25, 10, 30]);
    expect(r.categoria).toBe('trabajo');
  });
  it('sin fecha usa mañana y lo avisa', () => {
    const r = interpretarCaptura('comprar libro', { ahora: lunes });
    expect(r.fechaInferida).toBe(true);
    expect(r.titulo).toBe('Comprar libro');
  });
  it('"el 3 de octubre" y prioridad baja', () => {
    const r = interpretarCaptura('ensayo el 3 de octubre !baja', { materias: mats, ahora: lunes });
    expect([r.due.getMonth(), r.due.getDate(), r.prioridad, r.titulo]).toEqual([9, 3, 'baja', 'Ensayo']);
  });
});
