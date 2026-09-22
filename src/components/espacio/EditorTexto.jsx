import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Pilcrow, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link2, Eraser, Undo2, Redo2, Download, Printer, Copy } from 'lucide-react';
import { sanitizarHtml, textoPlanoDeHtml } from '../../lib/sanitizar';
import { descargarArchivo, envolverWord, imprimirHtml, nombreSeguro } from '../../lib/exportar';
import { ETIQUETA_ESTADO_DOC } from '../../hooks/useDocumento';

const B = ({ icono: Icono, titulo, onClick }) => (
  <button type="button" title={titulo} aria-label={titulo} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className="rounded-md p-2 text-textSecondary hover:bg-black/5 hover:text-textPrimary"><Icono size={16} /></button>
);

/** Editor de texto tipo Word: formato, listas, enlaces y exportación a .doc, .html o PDF. */
export default function EditorTexto({ inicial, onCambio, estado, titulo, registrarInsertar }) {
  const ref = useRef(null);
  const [palabras, setPalabras] = useState(0);

  const contar = () => setPalabras((ref.current?.innerText || '').trim().split(/\s+/).filter(Boolean).length);
  const emitir = () => { onCambio(ref.current.innerHTML); contar(); };
  const cmd = (c, v = null) => { ref.current.focus(); document.execCommand(c, false, v); emitir(); };

  useEffect(() => {
    ref.current.innerHTML = sanitizarHtml(inicial);
    contar();
    registrarInsertar?.((html) => { ref.current.focus(); document.execCommand('insertHTML', false, sanitizarHtml(html)); emitir(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enlace = () => { const url = window.prompt('Dirección del enlace (https://…)'); if (url) cmd('createLink', /^https?:\/\//i.test(url) ? url : `https://${url}`); };
  const html = () => ref.current.innerHTML;
  const nombre = nombreSeguro(titulo);

  return (
    <div className="flex h-full min-h-[24rem] flex-col rounded-md2 bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-black/5 px-2 py-1.5">
        <B icono={Undo2} titulo="Deshacer" onClick={() => cmd('undo')} /><B icono={Redo2} titulo="Rehacer" onClick={() => cmd('redo')} />
        <span className="mx-1 h-5 w-px bg-black/10" />
        <B icono={Bold} titulo="Negrita" onClick={() => cmd('bold')} /><B icono={Italic} titulo="Cursiva" onClick={() => cmd('italic')} /><B icono={Underline} titulo="Subrayado" onClick={() => cmd('underline')} /><B icono={Strikethrough} titulo="Tachado" onClick={() => cmd('strikeThrough')} />
        <span className="mx-1 h-5 w-px bg-black/10" />
        <B icono={Heading1} titulo="Título" onClick={() => cmd('formatBlock', 'h1')} /><B icono={Heading2} titulo="Subtítulo" onClick={() => cmd('formatBlock', 'h2')} /><B icono={Pilcrow} titulo="Párrafo" onClick={() => cmd('formatBlock', 'p')} />
        <span className="mx-1 h-5 w-px bg-black/10" />
        <B icono={List} titulo="Viñetas" onClick={() => cmd('insertUnorderedList')} /><B icono={ListOrdered} titulo="Numeración" onClick={() => cmd('insertOrderedList')} />
        <B icono={AlignLeft} titulo="Izquierda" onClick={() => cmd('justifyLeft')} /><B icono={AlignCenter} titulo="Centrar" onClick={() => cmd('justifyCenter')} /><B icono={AlignRight} titulo="Derecha" onClick={() => cmd('justifyRight')} />
        <B icono={Link2} titulo="Enlace" onClick={enlace} /><B icono={Eraser} titulo="Quitar formato" onClick={() => cmd('removeFormat')} />
      </div>

      <div
        ref={ref} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Documento de texto"
        onInput={emitir}
        onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}
        className="editor-texto min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[15px]"
        data-placeholder="Empieza a escribir aquí…"
      />

      <div className="flex flex-wrap items-center gap-2 border-t border-black/5 px-3 py-2 text-[11px] text-textSecondary">
        <span>{palabras} palabra{palabras !== 1 ? 's' : ''} · ≈ {Math.max(palabras ? 1 : 0, Math.round(palabras / 200))} min de lectura</span>
        <span className="font-semibold">{ETIQUETA_ESTADO_DOC[estado] || ''}</span>
        <span className="ml-auto flex flex-wrap gap-1">
          <button onClick={() => descargarArchivo(`${nombre}.doc`, envolverWord(titulo, html()), 'application/msword')} className="flex items-center gap-1 rounded-full bg-bg px-2.5 py-1 font-bold"><Download size={12} /> Word (.doc)</button>
          <button onClick={() => descargarArchivo(`${nombre}.html`, `<!doctype html><meta charset="utf-8"><title>${titulo}</title>${html()}`, 'text/html')} className="flex items-center gap-1 rounded-full bg-bg px-2.5 py-1 font-bold"><Download size={12} /> .html</button>
          <button onClick={() => imprimirHtml(titulo, html())} className="flex items-center gap-1 rounded-full bg-bg px-2.5 py-1 font-bold"><Printer size={12} /> PDF</button>
          <button onClick={() => navigator.clipboard.writeText(textoPlanoDeHtml(html()))} className="flex items-center gap-1 rounded-full bg-bg px-2.5 py-1 font-bold"><Copy size={12} /> Copiar</button>
        </span>
      </div>
    </div>
  );
}
