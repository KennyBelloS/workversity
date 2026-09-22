import { describe, it, expect } from 'vitest';
import { armarPrompt, lineasDeRespuesta, recortarParaUrl, PROVEEDORES, PLANTILLAS_PROMPT } from '../src/lib/iaEnfoque.js';
import { normalizarLayout, moverAntesDe, moverPaso, alternarOculto } from '../src/lib/widgets.js';

describe('ayuda de IA', () => {
  it('arma el mensaje con el contexto de la tarea', () => {
    const p = armarPrompt('esquema', { titulo: 'Informe de física', materia: 'Física', dificultad: 'dificil', entrega: '25 sep', documento: 'Borrador…' });
    expect(p).toContain('«Informe de física»');
    expect(p).toContain('Materia: Física.');
    expect(p).toContain('difícil');
    expect(p).toContain('esquema');
    expect(p).toContain('Borrador…');
    expect(p.endsWith('Responde en español.')).toBe(true);
  });
  it('plantillas y proveedores completos', () => {
    expect(PLANTILLAS_PROMPT.length).toBeGreaterThanOrEqual(8);
    expect(PROVEEDORES.find((x) => x.id === 'claude').url('hola mundo')).toBe('https://claude.ai/new?q=hola%20mundo');
    expect(PROVEEDORES.find((x) => x.id === 'gemini').conPrompt).toBe(false);
    expect(recortarParaUrl('x'.repeat(3000)).length).toBeLessThan(1500);
  });
  it('convierte una respuesta de IA en pasos', () => {
    const r = lineasDeRespuesta('## Plan\n1. Leer el enunciado\n2) **Buscar** fuentes\n- Redactar el borrador\n\n• Revisar\nok');
    expect(r).toEqual(['Plan', 'Leer el enunciado', 'Buscar fuentes', 'Redactar el borrador', 'Revisar']);
  });
});

describe('widgets del Dashboard', () => {
  const ids = ['a', 'b', 'c', 'd'];
  it('normaliza lo guardado con los widgets actuales', () => {
    expect(normalizarLayout({ orden: ['c', 'x', 'a'], ocultos: ['b', 'zz'] }, ids)).toEqual({ orden: ['c', 'a', 'b', 'd'], ocultos: ['b'] });
    expect(normalizarLayout(null, ids)).toEqual({ orden: ids, ocultos: [] });
  });
  it('mueve y oculta', () => {
    expect(moverAntesDe(ids, 'd', 'b')).toEqual(['a', 'd', 'b', 'c']);
    expect(moverAntesDe(ids, 'a', 'a')).toEqual(ids);
    expect(moverPaso(ids, [], 'c', -1)).toEqual(['a', 'c', 'b', 'd']);
    expect(moverPaso(ids, [], 'a', -1)).toEqual(ids);
    expect(moverPaso(ids, ['b'], 'c', -1)).toEqual(['c', 'a', 'b', 'd']); // salta el oculto
    expect(alternarOculto(['a'], 'b')).toEqual(['a', 'b']);
    expect(alternarOculto(['a', 'b'], 'a')).toEqual(['b']);
  });
});

import { parseDiapositivas, cargarDiapositivas, puntosDe, htmlPresentacion, TEMAS } from '../src/lib/diapositivas.js';

describe('diapositivas', () => {
  it('convierte una respuesta de IA en diapositivas', () => {
    const d = parseDiapositivas(['Diapositiva 1: Introducción', 'Qué es la energía', 'Por qué importa', 'Diapositiva 2: Tipos de energía', 'Cinética', 'Potencial']);
    expect(d).toHaveLength(2);
    expect(d[0]).toMatchObject({ titulo: 'Introducción', puntos: 'Qué es la energía\nPor qué importa' });
    expect(d[1].titulo).toBe('Tipos de energía');
    expect(parseDiapositivas(['Resumen:', 'Idea uno', 'Idea dos'])[0]).toMatchObject({ titulo: 'Resumen', puntos: 'Idea uno\nIdea dos' });
    expect(parseDiapositivas(['Solo una línea'])).toHaveLength(1);
  });
  it('carga y limpia el contenido guardado', () => {
    expect(cargarDiapositivas('', 'Mi tarea').diapositivas[0].titulo).toBe('Mi tarea');
    expect(cargarDiapositivas('{"tema":"raro","diapositivas":[{"titulo":"A"}]}').tema).toBe('azul');
    expect(puntosDe('- uno\n• dos\n\n tres ')).toEqual(['uno', 'dos', 'tres']);
  });
  it('la presentación en HTML escapa el texto', () => {
    const h = htmlPresentacion([{ titulo: '<script>x</script>', puntos: 'a & b' }], 'claro', 'T');
    expect(h).not.toContain('<script>x</script>');
    expect(h).toContain('a &amp; b');
    expect(h).toContain(TEMAS.claro.bg);
  });
});
