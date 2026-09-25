// Mapa mental interactivo (manual): nodos que se pueden agregar, mover, editar y borrar,
// conectados entre sí. Modelo de datos simple para poder guardarlo como JSON.
import { palabrasClave, dividirEnOraciones } from './parciales';

const MARGEN = 60;
const acotar = (v) => Math.max(MARGEN, Math.round(v));

let contador = 0;
const idNodo = () => `n${Date.now().toString(36)}${(contador++).toString(36)}`;

export function nodoRaiz(texto = 'Tema central') {
  return [{ id: idNodo(), texto, padreId: null, x: 260, y: 160 }];
}

/** Agrega un nodo hijo cerca de su padre (en un ángulo distinto cada vez, para no encimarse). */
export function agregarNodo(nodos, padreId, texto = 'Nueva idea') {
  const padre = nodos.find((n) => n.id === padreId) || nodos[0];
  const hermanos = nodos.filter((n) => n.padreId === padre.id).length;
  const angulo = (hermanos * 55 - 90) * (Math.PI / 180);
  const nuevo = { id: idNodo(), texto, padreId: padre.id, x: acotar(padre.x + 150 * Math.cos(angulo)), y: acotar(padre.y + 150 * Math.sin(angulo)) };
  return [...nodos, nuevo];
}
export function moverNodo(nodos, id, x, y) {
  return nodos.map((n) => (n.id === id ? { ...n, x: acotar(x), y: acotar(y) } : n));
}
export function renombrarNodo(nodos, id, texto) {
  return nodos.map((n) => (n.id === id ? { ...n, texto } : n));
}
/** Borra un nodo y todo lo que cuelgue de él (sus hijos, nietos…). No deja el mapa sin raíz. */
export function eliminarNodo(nodos, id) {
  const aBorrar = new Set([id]);
  let siguio = true;
  while (siguio) {
    siguio = false;
    for (const n of nodos) if (n.padreId && aBorrar.has(n.padreId) && !aBorrar.has(n.id)) { aBorrar.add(n.id); siguio = true; }
  }
  const restante = nodos.filter((n) => !aBorrar.has(n.id));
  return restante.length > 0 ? restante : nodoRaiz();
}

/** Conexiones a dibujar (una línea de cada nodo a su padre). */
export function aristasDe(nodos) {
  return nodos.filter((n) => n.padreId).map((n) => ({ de: nodos.find((p) => p.id === n.padreId), a: n })).filter((e) => e.de);
}

/**
 * Genera un mapa mental automático a partir de un texto: la raíz es el título,
 * y las ramas son las ideas clave (igual base que el mapa conceptual, pero editable).
 */
export function generarMapaMental(texto, titulo = 'Tema central', max = 8) {
  const oraciones = dividirEnOraciones(texto);
  const raiz = { id: idNodo(), texto: titulo, padreId: null, x: 280, y: 200 };
  const ramas = palabrasClave(texto, max);
  const nodos = [raiz];
  ramas.forEach(({ palabra }, i) => {
    const angulo = (i / ramas.length) * 2 * Math.PI - Math.PI / 2;
    const hijo = { id: idNodo(), texto: palabra.charAt(0).toUpperCase() + palabra.slice(1), padreId: raiz.id, x: acotar(raiz.x + 190 * Math.cos(angulo)), y: acotar(raiz.y + 190 * Math.sin(angulo)) };
    nodos.push(hijo);
    const detalle = oraciones.find((o) => o.toLowerCase().includes(palabra));
    if (detalle) nodos.push({ id: idNodo(), texto: detalle.length > 60 ? detalle.slice(0, 57) + '…' : detalle, padreId: hijo.id, x: acotar(hijo.x + (hijo.x > raiz.x ? 130 : -130)), y: acotar(hijo.y) });
  });
  return nodos;
}

export const esVacio = (nodos) => !nodos || nodos.length === 0 || (nodos.length === 1 && nodos[0].texto === 'Tema central');
