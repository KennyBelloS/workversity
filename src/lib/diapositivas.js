// Diapositivas (tipo PowerPoint): temas, conversión de texto a diapositivas y exportación.
import { escaparHtml } from './sanitizar';

export const TEMAS = {
  azul: { nombre: 'Azul', bg: '#1E3A8A', fg: '#FFFFFF', acento: '#93C5FD' },
  claro: { nombre: 'Claro', bg: '#FFFFFF', fg: '#0F172A', acento: '#3E7BFA' },
  verde: { nombre: 'Verde', bg: '#065F46', fg: '#FFFFFF', acento: '#6EE7B7' },
  noche: { nombre: 'Noche', bg: '#111827', fg: '#F9FAFB', acento: '#A78BFA' },
  atardecer: { nombre: 'Atardecer', bg: '#9A3412', fg: '#FFFFFF', acento: '#FDBA74' },
};

export const nuevaDiapositiva = (titulo = '') => ({ titulo, puntos: '', notas: '' });
export const puntosDe = (texto) => String(texto || '').split(/\r?\n/).map((l) => l.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean);

export function cargarDiapositivas(json, tituloTarea) {
  try {
    const d = JSON.parse(json);
    if (Array.isArray(d.diapositivas) && d.diapositivas.length) return { tema: d.tema in TEMAS ? d.tema : 'azul', diapositivas: d.diapositivas.map((s) => ({ titulo: s.titulo || '', puntos: s.puntos || '', notas: s.notas || '' })) };
  } catch { /* nueva presentación */ }
  return { tema: 'azul', diapositivas: [nuevaDiapositiva(tituloTarea || 'Mi presentación')] };
}

/**
 * Convierte las líneas de una respuesta de IA en diapositivas.
 * "Diapositiva 2: Título" (o una línea que termina en «:») abre una diapositiva; lo demás son viñetas.
 */
export function parseDiapositivas(lineas) {
  const out = [];
  let actual = null;
  for (const l of lineas) {
    const m = /^diapositiva\s*\d*\s*[:.\-–—]?\s*(.*)$/i.exec(l);
    if (m || /:$/.test(l)) {
      actual = nuevaDiapositiva((m ? m[1] : l.replace(/:$/, '')).replace(/[«»"*]/g, '').trim() || `Diapositiva ${out.length + 1}`);
      out.push(actual);
    } else {
      if (!actual) { actual = nuevaDiapositiva(l); out.push(actual); continue; }
      actual.puntos += (actual.puntos ? '\n' : '') + l;
    }
  }
  return out;
}

export function htmlPresentacion(diapos, temaClave, titulo) {
  const t = TEMAS[temaClave] || TEMAS.azul;
  const secciones = diapos.map((d) => `<section><h1>${escaparHtml(d.titulo)}</h1><ul>${puntosDe(d.puntos).map((p) => `<li>${escaparHtml(p)}</li>`).join('')}</ul></section>`).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escaparHtml(titulo)}</title><style>
*{box-sizing:border-box}body{margin:0;background:#000;color:${t.fg};font-family:Arial,sans-serif}section{display:none;min-height:100vh;padding:6vw;background:${t.bg}}section.on{display:block}
h1{font-size:5vw;margin:0 0 3vw;color:${t.acento}}li{font-size:3vw;margin:1.2vw 0}small{position:fixed;right:16px;bottom:10px;opacity:.6}
</style></head><body>${secciones}<small id="n"></small><script>
var s=[].slice.call(document.querySelectorAll('section')),i=0;function m(){s.forEach(function(x,k){x.className=k==i?'on':''});document.getElementById('n').textContent=(i+1)+' / '+s.length}
document.addEventListener('keydown',function(e){if(['ArrowRight',' ','PageDown'].indexOf(e.key)>-1)i=Math.min(s.length-1,i+1);if(['ArrowLeft','PageUp'].indexOf(e.key)>-1)i=Math.max(0,i-1);m()});
document.addEventListener('click',function(e){i=e.clientX>innerWidth/2?Math.min(s.length-1,i+1):Math.max(0,i-1);m()});m();</script></body></html>`;
}

/** Una diapositiva por página, lista para imprimir o guardar como PDF. */
export function htmlImpresion(diapos, temaClave) {
  const t = TEMAS[temaClave] || TEMAS.azul;
  return diapos.map((d) => `<div style="page-break-after:always;background:${t.bg};color:${t.fg};padding:48px;min-height:520px;border-radius:12px;margin-bottom:16px"><h1 style="color:${t.acento};margin:0 0 24px">${escaparHtml(d.titulo)}</h1><ul style="font-size:22px;line-height:1.6">${puntosDe(d.puntos).map((p) => `<li>${escaparHtml(p)}</li>`).join('')}</ul></div>`).join('');
}

/** .pptx real (se carga la librería solo al exportar). */
export async function exportarPptx(diapos, temaClave, titulo, nombreArchivo) {
  const t = TEMAS[temaClave] || TEMAS.azul;
  const limpio = (c) => c.replace('#', '');
  const { default: PptxGenJS } = await import('pptxgenjs');
  const p = new PptxGenJS();
  p.layout = 'LAYOUT_16x9';
  p.title = titulo;
  diapos.forEach((d) => {
    const s = p.addSlide();
    s.background = { color: limpio(t.bg) };
    s.addText(d.titulo || ' ', { x: 0.6, y: 0.4, w: 8.8, h: 1.1, fontSize: 32, bold: true, color: limpio(t.acento), fontFace: 'Calibri' });
    const pts = puntosDe(d.puntos);
    if (pts.length) s.addText(pts.map((x) => ({ text: x, options: { bullet: true, breakLine: true } })), { x: 0.8, y: 1.7, w: 8.4, h: 3.5, fontSize: 20, color: limpio(t.fg), fontFace: 'Calibri', valign: 'top' });
    if (d.notas) s.addNotes(d.notas);
  });
  await p.writeFile({ fileName: nombreArchivo });
}
