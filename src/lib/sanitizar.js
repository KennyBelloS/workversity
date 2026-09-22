// Limpia HTML pegado o guardado (quita scripts, estilos, eventos y enlaces peligrosos).
const PROHIBIDAS = 'script,style,iframe,object,embed,link,meta,base,form,input,button,select,textarea,svg,math,video,audio';

export function sanitizarHtml(html) {
  const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html');
  doc.querySelectorAll(PROHIBIDAS).forEach((n) => n.remove());
  doc.body.querySelectorAll('*').forEach((el) => {
    for (const a of [...el.attributes]) {
      const n = a.name.toLowerCase();
      if (n.startsWith('on') || n === 'srcdoc' || n === 'style' || (['href', 'src', 'xlink:href'].includes(n) && /^\s*(javascript|data|vbscript):/i.test(a.value))) el.removeAttribute(a.name);
    }
    if (el.tagName === 'A') { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
  });
  return doc.body.innerHTML;
}

export const textoPlanoDeHtml = (html) => {
  const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html');
  return (doc.body.innerText || doc.body.textContent || '').replace(/\u00a0/g, ' ').trim();
};
export const escaparHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
