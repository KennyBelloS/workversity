import { describe, it, expect } from 'vitest';
import { formatearAutores, referenciaAPA, planificarEntrega, estadisticasTexto } from '../src/lib/trabajos.js';

describe('referencias APA 7', () => {
  it('formatea autores', () => {
    expect(formatearAutores('García Márquez, Gabriel José')).toBe('García Márquez, G. J.');
    expect(formatearAutores('Pérez, Ana; Ríos, Luis')).toBe('Pérez, A. & Ríos, L.');
    expect(formatearAutores('Pérez, Ana; Ríos, Luis; Gómez, Marta')).toBe('Pérez, A., Ríos, L., & Gómez, M.');
  });
  it('libro, artículo y web', () => {
    expect(referenciaAPA('libro', { autores: 'García Márquez, Gabriel', anio: '1967', titulo: 'Cien años de soledad', editorial: 'Sudamericana' }).texto)
      .toBe('García Márquez, G. (1967). Cien años de soledad. Sudamericana.');
    expect(referenciaAPA('articulo', { autores: 'Pérez, Ana', anio: '2021', titulo: 'Aprendizaje activo', revista: 'Revista de Educación', volumen: '12', numero: '3', paginas: '45-60', doi: '10.1234/abc' }).texto)
      .toBe('Pérez, A. (2021). Aprendizaje activo. Revista de Educación, 12(3), 45-60. https://doi.org/10.1234/abc');
    expect(referenciaAPA('web', { titulo: 'Guía rápida', sitio: 'Sitio', url: 'https://x.co' }).texto).toBe('Guía rápida. (s. f.). Sitio. https://x.co');
  });
});

describe('planificador de entregas', () => {
  const ahora = new Date(2026, 8, 21, 10, 0);
  it('reparte etapas en orden y antes de la entrega', () => {
    const vence = new Date(ahora.getTime() + 6 * 86400000);
    const plan = planificarEntrega({ tipo: 'ensayo', ahora, vence, minutosTotales: 300 });
    expect(plan).toHaveLength(5);
    plan.forEach((e, i) => { expect(e.due > ahora && e.due < vence).toBe(true); if (i) expect(e.due > plan[i - 1].due).toBe(true); });
  });
  it('con poco tiempo también respeta el orden', () => {
    const vence = new Date(ahora.getTime() + 3 * 3600000);
    const plan = planificarEntrega({ tipo: 'taller', ahora, vence });
    plan.forEach((e, i) => { expect(e.due < vence).toBe(true); if (i) expect(e.due > plan[i - 1].due).toBe(true); });
  });
  it('cuenta palabras y tiempos', () => {
    const e = estadisticasTexto('Hola mundo. Esto es una prueba de texto para medir.');
    expect([e.palabras, e.oraciones]).toEqual([10, 2]);
  });
});
