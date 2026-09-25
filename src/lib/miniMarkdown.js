// Formato ligero para los apuntes: negrita, cursiva, código, títulos y listas.
// Sin librerías externas; escapa el HTML primero para que sea seguro de mostrar.
export function escaparHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Convierte el texto del apunte a HTML seguro, con un formato sencillo tipo Markdown. */
export function renderizarApunte(texto) {
  const lineas = escaparHtml(texto).split('\n');
  const html = [];
  let listaAbierta = null; // 'ul' | 'ol' | null
  const cerrarLista = () => { if (listaAbierta) { html.push(`</${listaAbierta}>`); listaAbierta = null; } };
  const enLinea = (s) => s
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<i>$1</i>')
    .replace(/`(.+?)`/g, '<code>$1</code>');

  for (const linea of lineas) {
    const l = linea.trim();
    if (!l) { cerrarLista(); html.push('<br/>'); continue; }
    let m = l.match(/^(#{1,3})\s+(.*)$/);
    if (m) { cerrarLista(); html.push(`<h${m[1].length}>${enLinea(m[2])}</h${m[1].length}>`); continue; }
    m = l.match(/^[-*]\s+(.*)$/);
    if (m) { if (listaAbierta !== 'ul') { cerrarLista(); html.push('<ul>'); listaAbierta = 'ul'; } html.push(`<li>${enLinea(m[1])}</li>`); continue; }
    m = l.match(/^\d+[.)]\s+(.*)$/);
    if (m) { if (listaAbierta !== 'ol') { cerrarLista(); html.push('<ol>'); listaAbierta = 'ol'; } html.push(`<li>${enLinea(m[1])}</li>`); continue; }
    cerrarLista();
    html.push(`<p>${enLinea(l)}</p>`);
  }
  cerrarLista();
  return html.join('');
}

/** Envuelve (o quita) una marca alrededor del texto seleccionado de un <textarea>. */
export function alternarMarca(texto, inicio, fin, marca) {
  const seleccion = texto.slice(inicio, fin);
  const antes = texto.slice(Math.max(0, inicio - marca.length), inicio);
  const despues = texto.slice(fin, fin + marca.length);
  if (antes === marca && despues === marca) {
    return { texto: texto.slice(0, inicio - marca.length) + seleccion + texto.slice(fin + marca.length), inicio: inicio - marca.length, fin: fin - marca.length };
  }
  return { texto: texto.slice(0, inicio) + marca + seleccion + marca + texto.slice(fin), inicio: inicio + marca.length, fin: fin + marca.length };
}

/** Antepone un prefijo (p. ej. "- ") a la línea donde está el cursor. */
export function anteponerEnLinea(texto, cursor, prefijo) {
  const inicioLinea = texto.lastIndexOf('\n', cursor - 1) + 1;
  const yaLoTiene = texto.slice(inicioLinea, inicioLinea + prefijo.length) === prefijo;
  const nuevo = yaLoTiene
    ? texto.slice(0, inicioLinea) + texto.slice(inicioLinea + prefijo.length)
    : texto.slice(0, inicioLinea) + prefijo + texto.slice(inicioLinea);
  return { texto: nuevo, cursor: cursor + (yaLoTiene ? -prefijo.length : prefijo.length) };
}

export const contarPalabras = (texto) => (String(texto || '').trim().match(/\S+/g) || []).length;
