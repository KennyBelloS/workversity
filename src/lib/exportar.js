import { escaparHtml } from './sanitizar';

export function descargarArchivo(nombre, contenido, tipo = 'text/plain') {
  const url = URL.createObjectURL(new Blob([contenido], { type: `${tipo};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

export const nombreSeguro = (s) => String(s || 'documento').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'documento';

/** .doc que Word abre normalmente (HTML con el formato de Office). */
export function envolverWord(titulo, html) {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${escaparHtml(titulo)}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.5}h1{font-size:20pt}h2{font-size:16pt}</style></head><body>${html}</body></html>`;
}

/** Abre una vista lista para imprimir o guardar como PDF. */
export function imprimirHtml(titulo, html) {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escaparHtml(titulo)}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:2rem auto;line-height:1.6;padding:0 1rem}h1,h2{font-family:Arial,sans-serif}@media print{body{margin:0}}</style></head><body>${html}</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 400);
  return true;
}
