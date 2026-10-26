import { describe, it, expect } from 'vitest';
import { mapaConceptualAMermaid, diagramaFlujoAMermaid } from '../src/lib/mermaidTexto.js';

describe('convertir a sintaxis de Mermaid', () => {
  it('mapa conceptual: nodo central conectado a cada término, y cada término a su detalle', () => {
    const mapa = { centro: 'Biología', ramas: [{ palabra: 'Mitosis', relacion: 'es', detalle: 'División celular' }, { palabra: 'ADN', relacion: 'es', detalle: '' }] };
    const s = mapaConceptualAMermaid(mapa);
    expect(s.split('\n')[0]).toBe('flowchart TD');
    expect(s).toContain('centro["Biología"]');
    expect(s).toContain('"Mitosis"');
    expect(s).toContain('centro --- t0');
    expect(s).toContain('t0 --> d0');
    expect(s).toContain('"División celular"');
    expect(s).not.toContain('d1'); // "ADN" sin detalle no genera un nodo hijo vacío
  });
  it('sin ramas, no genera nada (evita un diagrama vacío raro)', () => {
    expect(mapaConceptualAMermaid({ centro: 'X', ramas: [] })).toBeNull();
    expect(mapaConceptualAMermaid(null)).toBeNull();
  });
  it('escapa comillas dobles para no romper la sintaxis', () => {
    const mapa = { centro: 'Tema', ramas: [{ palabra: 'Cita "famosa"', relacion: 'es', detalle: 'Dice "así"' }] };
    const s = mapaConceptualAMermaid(mapa);
    expect(s).not.toMatch(/\["[^"]*"[^"]*"[^"]*"\]/); // no quedan comillas dobles sin escapar dentro de una etiqueta
    expect(s).toContain("Cita 'famosa'");
  });

  it('diagrama de flujo: un nodo por paso, conectados en orden con flechas', () => {
    const s = diagramaFlujoAMermaid([{ n: 1, texto: 'Mezclar' }, { n: 2, texto: 'Hornear' }, { n: 3, texto: 'Enfriar' }]);
    expect(s.split('\n')[0]).toBe('flowchart TD');
    expect(s).toContain('"Mezclar"');
    expect(s).toContain('p0 --> p1');
    expect(s).toContain('p1 --> p2');
  });
  it('sin pasos, no genera nada', () => {
    expect(diagramaFlujoAMermaid([])).toBeNull();
  });
});
