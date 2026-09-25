import { describe, it, expect } from 'vitest';
import { generarMapaMental, agregarNodo, moverNodo, nodoRaiz } from '../src/lib/mapaMental.js';

describe('el mapa mental no genera nodos fuera del lienzo', () => {
  it('generarMapaMental: todas las coordenadas son válidas (sin negativos)', () => {
    const texto = 'La mitosis produce células. La meiosis reduce cromosomas. El núcleo controla la célula. La membrana protege la célula. El citoplasma llena la célula.';
    const nodos = generarMapaMental(texto, 'Biología');
    expect(nodos.length).toBeGreaterThan(3);
    nodos.forEach((n) => { expect(n.x).toBeGreaterThanOrEqual(60); expect(n.y).toBeGreaterThanOrEqual(60); });
  });
  it('agregarNodo y moverNodo también respetan el margen mínimo', () => {
    let nodos = nodoRaiz('Tema');
    nodos = agregarNodo(nodos, nodos[0].id, 'Idea');
    nodos.forEach((n) => expect(n.x).toBeGreaterThanOrEqual(60));
    nodos = moverNodo(nodos, nodos[1].id, -500, -500);
    expect(nodos[1].x).toBe(60);
    expect(nodos[1].y).toBe(60);
  });
});
