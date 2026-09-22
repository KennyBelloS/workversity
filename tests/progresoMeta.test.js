import { describe, it, expect } from 'vitest';
import { estadoProgreso, pasoRapido, fmtNum, PLANTILLAS_PROGRESO, UNIDADES } from '../src/lib/progresoMeta.js';
import { combinarCategorias } from '../src/lib/categoriasAhorro.js';

const ahora = new Date(2026, 8, 21, 12, 0);
const dia = (atras, cantidad) => ({ cantidad, fecha: new Date(2026, 8, 21 - atras, 12).toISOString() });
const libro = (extra = {}) => ({ id: 'l1', title: 'Cien años de soledad', unidad: 'páginas', target_amount: 400, fecha_limite: '2026-10-01', ...extra });

describe('metas de progreso (leer un libro…)', () => {
  it('suma avances, calcula porcentaje y lo que falta', () => {
    const e = estadoProgreso({ meta: libro(), avances: [dia(2, 40), dia(1, 60), dia(0, 25)], ahora });
    expect(e.total).toBe(125);
    expect(e.faltante).toBe(275);
    expect(e.pct).toBeCloseTo(125 / 400);
    expect(e.hecho).toBe(false);
  });
  it('estima la fecha de fin con tu ritmo y lo compara con lo que necesitas por día', () => {
    // El plazo incluye el último día completo (11 días hasta el 1-oct); llevas 100 en la semana → 14.3/día; faltan 300 → necesitas 27.3/día → atrasado
    const atras = estadoProgreso({ meta: libro(), avances: [dia(3, 100)], ahora });
    expect(atras.ritmoReciente).toBeCloseTo(100 / 7);
    expect(atras.necesarioPorDia).toBeCloseTo(300 / 11);
    expect(atras.estado).toBe('atrasado');
    expect(atras.fechaEstimada > new Date(2026, 9, 1)).toBe(true);
    // 350 en la semana → 50/día; faltan 50 → necesitas 5/día → adelantado
    const ade = estadoProgreso({ meta: libro(), avances: [dia(2, 200), dia(1, 150)], ahora });
    expect(ade.estado).toBe('adelantado');
  });
  it('meta terminada, sin fecha, sin datos y plazo vencido', () => {
    expect(estadoProgreso({ meta: libro(), avances: [dia(1, 250), dia(0, 150)], ahora }).hecho).toBe(true);
    expect(estadoProgreso({ meta: libro({ fecha_limite: null }), avances: [dia(0, 10)], ahora }).estado).toBe('sin-fecha');
    expect(estadoProgreso({ meta: libro(), avances: [], ahora }).estado).toBe('sin-datos');
    expect(estadoProgreso({ meta: libro({ fecha_limite: '2026-09-10' }), avances: [dia(0, 10)], ahora }).estado).toBe('vencida');
  });
  it('racha de días con avance y días sin avanzar', () => {
    expect(estadoProgreso({ meta: libro(), avances: [dia(0, 5), dia(1, 5), dia(2, 5)], ahora }).racha).toBe(3);
    const e = estadoProgreso({ meta: libro(), avances: [dia(5, 5)], ahora });
    expect(e.racha).toBe(0);
    expect(e.diasSinAvance).toBe(5);
    expect(e.ultimos).toHaveLength(14);
  });
  it('pasos rápidos, formato y plantillas', () => {
    expect(pasoRapido('páginas')).toBe(10);
    expect(pasoRapido('capítulos')).toBe(1);
    expect(pasoRapido('otra')).toBe(1);
    expect(fmtNum(12.34)).toBe('12,3');
    PLANTILLAS_PROGRESO.forEach((p) => expect(UNIDADES).toContain(p.unidad));
  });
  it('categorías separadas por tipo (dinero / progreso)', () => {
    const propias = [{ id: '1', nombre: 'Viaje' }, { id: '2', nombre: 'Novelas', tipo: 'progreso' }];
    expect(combinarCategorias(propias, 'ahorro').map((c) => c.nombre)).toContain('Viaje');
    expect(combinarCategorias(propias, 'ahorro').map((c) => c.nombre)).not.toContain('Novelas');
    const prog = combinarCategorias(propias, 'progreso').map((c) => c.nombre);
    expect(prog).toEqual(['Lectura', 'Estudio', 'Salud y deporte', 'Hábitos', 'Proyecto personal', 'Novelas', 'Otro']);
  });
});
