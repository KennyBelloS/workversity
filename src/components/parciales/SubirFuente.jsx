import { useRef, useState } from 'react';
import { Upload, Camera, ClipboardPaste, Loader2, FileText } from 'lucide-react';
import { extraerTexto, tipoDeArchivo } from '../../lib/extraerTexto';

const ETIQUETA_TIPO = { pdf: 'PDF', word: 'Word', excel: 'Excel', imagen: 'Foto', texto: 'Texto' };

/** Sube una foto, un PDF, un Word, un Excel, o pega texto a mano. Extrae el texto en el propio navegador. */
export default function SubirFuente({ onExtraido }) {
  const archivoRef = useRef(null);
  const camaraRef = useRef(null);
  const [pegando, setPegando] = useState(false);
  const [texto, setTexto] = useState('');
  const [progreso, setProgreso] = useState(null); // { etapa, pct }
  const [error, setError] = useState('');

  const procesar = async (archivo) => {
    setError(''); setProgreso({ etapa: `Leyendo tu ${ETIQUETA_TIPO[tipoDeArchivo(archivo)] || 'archivo'}…`, pct: null });
    try {
      const contenido = await extraerTexto(archivo, (hecho, total) => setProgreso({ etapa: tipoDeArchivo(archivo) === 'imagen' ? 'Reconociendo el texto de la foto…' : `Leyendo página ${hecho} de ${total}…`, pct: total ? Math.round((hecho / total) * 100) : null }));
      onExtraido({ nombre: archivo.name, texto: contenido });
    } catch (e) {
      setError(e.message || 'No se pudo leer ese archivo.');
    } finally {
      setProgreso(null);
    }
  };

  if (progreso) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md2 bg-white p-8 text-center shadow-card">
        <Loader2 size={22} className="animate-spin text-primary" />
        <p className="text-sm font-bold">{progreso.etapa}</p>
        {progreso.pct != null && <div className="h-1.5 w-40 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progreso.pct}%` }} /></div>}
        <p className="text-[11px] text-textSecondary">Esto pasa en tu propio navegador; nada se sube a internet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button onClick={() => archivoRef.current?.click()} className="flex flex-col items-center gap-1.5 rounded-md2 bg-white py-4 text-xs font-bold text-textSecondary shadow-card hover:text-primary"><FileText size={20} /> PDF / Word / Excel</button>
        <button onClick={() => camaraRef.current?.click()} className="flex flex-col items-center gap-1.5 rounded-md2 bg-white py-4 text-xs font-bold text-textSecondary shadow-card hover:text-primary"><Camera size={20} /> Foto de apuntes</button>
        <button onClick={() => setPegando((v) => !v)} className={`flex flex-col items-center gap-1.5 rounded-md2 py-4 text-xs font-bold shadow-card ${pegando ? 'bg-primarySoft text-primary' : 'bg-white text-textSecondary hover:text-primary'}`}><ClipboardPaste size={20} /> Pegar texto</button>
        <button onClick={() => archivoRef.current?.click()} className="hidden sm:flex flex-col items-center gap-1.5 rounded-md2 bg-white py-4 text-xs font-bold text-textSecondary shadow-card hover:text-primary"><Upload size={20} /> Otro archivo</button>
      </div>
      <input ref={archivoRef} type="file" accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md,image/*" className="hidden" onChange={(e) => e.target.files[0] && procesar(e.target.files[0])} aria-label="Subir archivo" />
      <input ref={camaraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files[0] && procesar(e.target.files[0])} aria-label="Tomar foto" />
      {pegando && (
        <div className="space-y-2 rounded-md2 bg-white p-3 shadow-card">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={5} placeholder="Pega aquí tus apuntes o el resumen del tema…" className="w-full rounded-sm2 bg-bg px-3 py-2 text-sm outline-none" aria-label="Texto pegado" />
          <button onClick={() => { if (texto.trim()) { onExtraido({ nombre: 'Texto pegado', texto: texto.trim() }); setTexto(''); setPegando(false); } }} disabled={!texto.trim()} className="rounded-sm2 bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Usar este texto</button>
        </div>
      )}
      {error && <p className="rounded-sm2 bg-dangerSoft p-2.5 text-xs font-semibold text-danger">{error}</p>}
      <p className="text-[11px] text-textSecondary">Admite PDF, Word (.docx), Excel (.xlsx/.csv), fotos de apuntes (con buena luz) y texto pegado.</p>
    </div>
  );
}
