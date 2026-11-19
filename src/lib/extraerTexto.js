// Extrae texto de los archivos que la persona sube para preparar un parcial.
// Todo ocurre en el navegador (nada se sube a un servidor externo).

export function tipoDeArchivo(archivo) {
  const n = archivo.name.toLowerCase();
  if (n.endsWith('.pdf') || archivo.type === 'application/pdf') return 'pdf';
  if (n.endsWith('.docx')) return 'word';
  if (n.endsWith('.xlsx') || n.endsWith('.xls') || n.endsWith('.csv')) return 'excel';
  if (archivo.type.startsWith('image/')) return 'imagen';
  if (n.endsWith('.txt') || n.endsWith('.md')) return 'texto';
  return 'desconocido';
}

async function deTexto(archivo) {
  return archivo.text();
}
async function deWord(archivo) {
  const mammoth = await import('mammoth/mammoth.browser');
  const { value } = await mammoth.extractRawText({ arrayBuffer: await archivo.arrayBuffer() });
  return value;
}
async function deExcel(archivo) {
  const XLSX = await import('xlsx');
  const libro = XLSX.read(await archivo.arrayBuffer(), { type: 'array' });
  const soloUnaHoja = libro.SheetNames.length === 1;
  return libro.SheetNames.map((nombre) => {
    const filas = XLSX.utils.sheet_to_json(libro.Sheets[nombre], { header: 1, blankrows: false });
    // Cada fila se vuelve una línea "primera columna: resto de columnas", así el generador de
    // tarjetas la reconoce como una definición (igual que "Término: definición" en un documento).
    const texto = filas.map((fila) => fila.filter((c) => c !== undefined && c !== '').join(': ')).filter(Boolean).join('\n');
    return soloUnaHoja ? texto : `Hoja "${nombre}":\n${texto}`;
  }).join('\n\n');
}
/**
 * Arma el texto de UNA página de PDF respetando sus renglones. Antes se unía todo con espacios y
 * la página quedaba en una sola línea: el índice, los encabezados y los títulos se pegaban a las
 * oraciones, y de ahí salían tarjetas sin sentido. Aquí se usa la posición de cada trozo de texto
 * (pdf.js da su "y" en transform[5]) para saber dónde empieza un renglón nuevo.
 */
export function textoDeItemsPdf(items) {
  let texto = '';
  let anterior = null;
  for (const it of items) {
    if (!it.str && !it.hasEOL) continue;
    const y = it.transform?.[5] ?? 0;
    const x = it.transform?.[4] ?? 0;
    const alto = it.height || Math.abs(it.transform?.[3] || 10);
    if (anterior) {
      const cambioDeRenglon = Math.abs(y - anterior.y) > alto * 0.5;
      if (anterior.finDeLinea || cambioDeRenglon) {
        texto = texto.replace(/[ \t]+$/, '');
        // Un salto grande entre renglones es un párrafo nuevo (línea en blanco).
        texto += cambioDeRenglon && Math.abs(y - anterior.y) > alto * 1.9 ? '\n\n' : '\n';
      } else if (x - anterior.finX > alto * 0.12 && !/\s$/.test(texto) && !/^\s/.test(it.str)) {
        texto += ' ';
      }
    }
    texto += it.str;
    anterior = { y, finX: x + (it.width || 0), finDeLinea: Boolean(it.hasEOL) };
  }
  return texto.replace(/[ \t]{2,}/g, ' ').trim();
}

async function dePdf(archivo, onProgreso) {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;
  const doc = await pdfjs.getDocument({ data: await archivo.arrayBuffer() }).promise;
  const paginas = [];
  for (let i = 1; i <= doc.numPages; i++) {
    onProgreso?.(i, doc.numPages);
    const pagina = await doc.getPage(i);
    const contenido = await pagina.getTextContent();
    paginas.push(textoDeItemsPdf(contenido.items));
  }
  // Las páginas se separan con una línea en blanco: así se pueden reconocer los encabezados y
  // pies que se repiten en cada una.
  return paginas.join('\n\n\n');
}
async function deImagen(archivo, onProgreso) {
  const Tesseract = (await import('tesseract.js')).default;
  const { data } = await Tesseract.recognize(archivo, 'spa+eng', {
    logger: (m) => m.status === 'recognizing text' && onProgreso?.(Math.round((m.progress || 0) * 100), 100),
  });
  return data.text;
}

/**
 * Extrae el texto de un archivo (PDF, Word, Excel, imagen con texto, o texto plano).
 * `onProgreso(hecho, total)` es opcional, útil para PDFs largos o fotos (la lectura de la
 * imagen puede tardar unos segundos: es OCR corriendo en el propio navegador).
 */
export async function extraerTexto(archivo, onProgreso) {
  const tipo = tipoDeArchivo(archivo);
  const texto = await ({ pdf: () => dePdf(archivo, onProgreso), word: deWord, excel: deExcel, imagen: () => deImagen(archivo, onProgreso), texto: deTexto }[tipo]?.(archivo));
  if (texto == null) throw new Error('Ese tipo de archivo no se puede leer todavía. Prueba con PDF, Word (.docx), Excel (.xlsx), una imagen o pegando el texto directamente.');
  // OJO: no se colapsan las líneas en blanco (separan páginas y párrafos; el generador las usa).
  const limpio = texto.replace(/[ \t]+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
  if (!limpio) throw new Error('No se encontró texto en ese archivo. Si es una foto borrosa, prueba con más luz o pega el texto a mano.');
  return limpio;
}
