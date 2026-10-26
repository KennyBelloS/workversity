// Convierte lo que ya calculamos (mapa conceptual, diagrama de flujo) al lenguaje de Mermaid,
// una librería real y muy usada para dibujar diagramas — así el mapa y el diagrama se ven como
// diagramas de verdad (con flechas, cajas y una jerarquía clara), no como tarjetas decorativas.

/** Mermaid usa comillas dobles para envolver etiquetas: hay que escapar comillas y saltos de línea. */
function etiqueta(texto) {
  const limpio = String(texto || '').replace(/"/g, "'").replace(/[\n\r]+/g, ' ').trim();
  return `"${limpio.length > 90 ? limpio.slice(0, 87) + '…' : limpio}"`;
}
/** Un id de nodo válido para Mermaid: solo letras/números. */
const idNodo = (prefijo, i) => `${prefijo}${i}`;

/** Mapa conceptual → sintaxis "flowchart" de Mermaid: el tema en el centro, conectado a cada
 * término, y cada término conectado a su definición. Mismo estilo de cajas y flechas que el
 * diagrama de flujo (se ve más limpio y legible que el "mindmap" nativo de Mermaid). */
export function mapaConceptualAMermaid(mapa) {
  if (!mapa || mapa.ramas.length === 0) return null;
  const lineas = ['flowchart TD', `  centro[${etiqueta(mapa.centro)}]`, '  style centro fill:#5B8DEF,color:#fff,stroke:#5B8DEF'];
  mapa.ramas.forEach((r, i) => {
    lineas.push(`  ${idNodo('t', i)}(${etiqueta(r.palabra)})`);
    lineas.push(`  centro --- ${idNodo('t', i)}`);
    if (r.detalle) {
      lineas.push(`  ${idNodo('d', i)}[${etiqueta(r.detalle)}]`);
      lineas.push(`  ${idNodo('t', i)} --> ${idNodo('d', i)}`);
    }
  });
  return lineas.join('\n');
}

/** Diagrama de flujo → sintaxis "flowchart" de Mermaid, de arriba hacia abajo. */
export function diagramaFlujoAMermaid(pasos) {
  if (!pasos || pasos.length === 0) return null;
  const lineas = ['flowchart TD'];
  pasos.forEach((p, i) => {
    lineas.push(`  ${idNodo('p', i)}(${etiqueta(p.texto)})`);
    if (i > 0) lineas.push(`  ${idNodo('p', i - 1)} --> ${idNodo('p', i)}`);
  });
  return lineas.join('\n');
}
