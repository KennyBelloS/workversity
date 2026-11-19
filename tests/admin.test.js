import { describe, it, expect } from 'vitest';
import { calcularEstadisticasUsuarios, ordenarPorUltimoIngreso, registrosPorSemana, filtrarUsuarios } from '../src/lib/admin.js';

const AHORA = new Date('2026-10-20T12:00:00Z');
const dia = (n) => new Date(AHORA.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

const USUARIOS = [
  { id: '1', nombre: 'Ana Pérez', correo: 'ana@x.com', created_at: dia(40), ultimo_ingreso: dia(1), total_ingresos: 20 },
  { id: '2', nombre: 'Luis Gómez', correo: 'luis@x.com', created_at: dia(5), ultimo_ingreso: dia(3), total_ingresos: 4 },
  { id: '3', nombre: 'Marta Ruiz', correo: 'marta@x.com', created_at: dia(60), ultimo_ingreso: null, total_ingresos: 0 },
];

describe('estadísticas y utilidades del panel de administrador', () => {
  it('calcula totales, activos y nuevos correctamente', () => {
    const s = calcularEstadisticasUsuarios(USUARIOS, AHORA);
    expect(s.total).toBe(3);
    expect(s.activos7d).toBe(2);
    expect(s.nuevos7d).toBe(1);
    expect(s.nuncaEntraron).toBe(1);
  });

  it('ordena por último ingreso, los que nunca entraron al final', () => {
    const o = ordenarPorUltimoIngreso(USUARIOS);
    expect(o[0].id).toBe('1');
    expect(o[o.length - 1].id).toBe('3');
  });

  it('arma una serie de registros por semana con la longitud pedida', () => {
    const serie = registrosPorSemana(USUARIOS, 8, AHORA);
    expect(serie).toHaveLength(8);
    // Luis (hace 5 días) cae en la última barra; Ana (hace 40) en la de hace ~6 semanas; Marta (60) queda fuera.
    expect(serie[7]).toBe(1);
    expect(serie.reduce((a, b) => a + b, 0)).toBe(2);
  });

  it('filtra por nombre o correo, sin importar tildes ni mayúsculas', () => {
    expect(filtrarUsuarios(USUARIOS, 'perez')).toHaveLength(1);
    expect(filtrarUsuarios(USUARIOS, 'LUIS')).toHaveLength(1);
    expect(filtrarUsuarios(USUARIOS, '')).toHaveLength(3);
    expect(filtrarUsuarios(USUARIOS, 'x.com')).toHaveLength(3);
  });

  it('con una lista vacía no revienta, devuelve ceros', () => {
    const s = calcularEstadisticasUsuarios([], AHORA);
    expect(s).toEqual({ total: 0, activos7d: 0, activos30d: 0, nuevos7d: 0, nuncaEntraron: 0, promedioIngresos: 0 });
  });
});
