import { useRef, useState } from 'react';
import { Bold, Italic, Code, Heading, List, ListOrdered, Eye, EyeOff } from 'lucide-react';
import { renderizarApunte, alternarMarca, anteponerEnLinea, contarPalabras } from '../../lib/miniMarkdown';

const BOTONES = [
  { icono: Bold, etiqueta: 'Negrita', accion: (t, i, f) => alternarMarca(t, i, f, '**') },
  { icono: Italic, etiqueta: 'Cursiva', accion: (t, i, f) => alternarMarca(t, i, f, '*') },
  { icono: Code, etiqueta: 'Código', accion: (t, i, f) => alternarMarca(t, i, f, '`') },
  { icono: Heading, etiqueta: 'Título', accion: (t, i) => { const r = anteponerEnLinea(t, i, '## '); return { texto: r.texto, inicio: r.cursor, fin: r.cursor }; } },
  { icono: List, etiqueta: 'Lista', accion: (t, i) => { const r = anteponerEnLinea(t, i, '- '); return { texto: r.texto, inicio: r.cursor, fin: r.cursor }; } },
  { icono: ListOrdered, etiqueta: 'Lista numerada', accion: (t, i) => { const r = anteponerEnLinea(t, i, '1. '); return { texto: r.texto, inicio: r.cursor, fin: r.cursor }; } },
];

/** Editor de apuntes: negrita/cursiva/títulos/listas con botones, y una vista previa formateada. */
export default function EditorApunte({ contenido, onCambiar }) {
  const areaRef = useRef(null);
  const [vistaPrevia, setVistaPrevia] = useState(false);

  const aplicar = (accion) => {
    const el = areaRef.current;
    if (!el) return;
    const r = accion(contenido, el.selectionStart, el.selectionEnd);
    onCambiar(r.texto);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(r.inicio, r.fin); });
  };

  return (
    <div className="rounded-md2 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-black/5 px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {BOTONES.map(({ icono: Icono, etiqueta, accion }) => (
            <button key={etiqueta} type="button" onClick={() => aplicar(accion)} aria-label={etiqueta} title={etiqueta} disabled={vistaPrevia} className="rounded-sm2 p-2 text-textSecondary hover:bg-bg hover:text-primary disabled:opacity-30">
              <Icono size={15} />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setVistaPrevia((v) => !v)} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-textSecondary hover:text-primary">
          {vistaPrevia ? <EyeOff size={13} /> : <Eye size={13} />} {vistaPrevia ? 'Editar' : 'Vista previa'}
        </button>
      </div>
      {vistaPrevia ? (
        <div className="min-h-[320px] px-4 py-3 text-sm leading-relaxed [&_code]:rounded [&_code]:bg-bg [&_code]:px-1 [&_h1]:text-lg [&_h1]:font-extrabold [&_h2]:text-base [&_h2]:font-extrabold [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: contenido.trim() ? renderizarApunte(contenido) : '<p class="text-textSecondary">Nada que mostrar todavía.</p>' }} />
      ) : (
        <textarea ref={areaRef} value={contenido} onChange={(e) => onCambiar(e.target.value)} placeholder="Escribe aquí… usa **negrita**, *cursiva*, # títulos y - listas." rows={14} className="w-full resize-y bg-white px-4 py-3 text-sm leading-relaxed text-textPrimary outline-none" aria-label="Contenido del apunte" />
      )}
      <p className="border-t border-black/5 px-4 py-1.5 text-right text-[11px] text-textSecondary">{contarPalabras(contenido)} palabras</p>
    </div>
  );
}
