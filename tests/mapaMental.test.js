import { describe, it, expect } from 'vitest';
import { nodoRaiz, agregarNodo, moverNodo, renombrarNodo, eliminarNodo, aristasDe, generarMapaMental, esVacio } from '../src/lib/mapaMental.js';

describe('mapa mental interactivo (manual)', () => {
  it('empieza con un nodo raíz', () => {
    const n = nodoRaiz('Fotosíntesis');
    expect(n).toHaveLength(1);
    expect(n[0].texto).toBe('Fotosíntesis');
    expect(n[0].padreId).toBeNull();
    expect(esVacio(nodoRaiz())).toBe(true);
    expect(esVacio(n)).toBe(false);
  });
  it('agrega nodos hijos sin encimarlos', () => {
    let n = nodoRaiz('Tema');
    n = agregarNodo(n, n[0].id, 'Idea 1');
    n = agregarNodo(n, n[0].id, 'Idea 2');
    expect(n).toHaveLength(3);
    expect(n[1].padreId).toBe(n[0].id);
    expect([n[1].x, n[1].y]).not.toEqual([n[2].x, n[2].y]);
  });
  it('mueve y renombra un nodo', () => {
    let n = nodoRaiz('Tema');
    n = moverNodo(n, n[0].id, 400, 300);
    expect([n[0].x, n[0].y]).toEqual([400, 300]);
    n = renombrarNodo(n, n[0].id, 'Nuevo nombre');
    expect(n[0].texto).toBe('Nuevo nombre');
  });
  it('borrar un nodo borra también a sus hijos (en cascada)', () => {
    let n = nodoRaiz('Tema');
    const raizId = n[0].id;
    n = agregarNodo(n, raizId, 'Rama');
    const ramaId = n[1].id;
    n = agregarNodo(n, ramaId, 'Hoja');
    expect(n).toHaveLength(3);
    n = eliminarNodo(n, ramaId);
    expect(n).toHaveLength(1);
    expect(n[0].id).toBe(raizId);
  });
  it('borrar la raíz deja un mapa nuevo (nunca queda vacío)', () => {
    let n = nodoRaiz('Tema');
    n = eliminarNodo(n, n[0].id);
    expect(n).toHaveLength(1);
  });
  it('las aristas conectan cada nodo con su padre', () => {
    let n = nodoRaiz('Tema');
    n = agregarNodo(n, n[0].id, 'Rama');
    const aristas = aristasDe(n);
    expect(aristas).toHaveLength(1);
    expect(aristas[0].de.id).toBe(n[0].id);
    expect(aristas[0].a.id).toBe(n[1].id);
  });
  it('genera un mapa automático con ramas e ideas de apoyo', () => {
    const texto = 'La mitosis es la división celular. La meiosis reduce los cromosomas a la mitad. El ADN guarda la información genética.';
    const n = generarMapaMental(texto, 'Biología');
    expect(n[0].texto).toBe('Biología');
    expect(n.length).toBeGreaterThan(3);
    expect(aristasDe(n).every((a) => a.a.padreId != null)).toBe(true);
  });
});
