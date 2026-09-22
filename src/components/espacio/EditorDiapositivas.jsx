import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Copy, Trash2, ArrowUp, ArrowDown, Play, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TEMAS, nuevaDiapositiva, cargarDiapositivas, parseDiapositivas, puntosDe, htmlPresentacion, htmlImpresion, exportarPptx } from '../../lib/diapositivas';
import { descargarArchivo, imprimirHtml, nombreSeguro } from '../../lib/exportar';
import { ETIQUETA_ESTADO_DOC } from '../../hooks/useDocumento';

function Lamina({ d, tema, grande = false }) {
  const t = TEMAS[tema] || TEMAS.azul;
  return (
    <div className="flex aspect-video w-full flex-col overflow-hidden rounded-md2 shadow-card" style={{ backgroundColor: t.bg, color: t.fg, padding: grande ? '5%' : '6%' }}>
      <p className="font-extrabold leading-tight" style={{ color: t.acento, fontSize: grande ? 'clamp(1.4rem,4.2vw,3.2rem)' : '0.95rem' }}>{d.titulo || 'Título'}</p>
      <ul className="mt-[3%] space-y-[1.5%] overflow-hidden" style={{ fontSize: grande ? 'clamp(1rem,2.5vw,2rem)' : '0.62rem', listStyle: 'disc', paddingLeft: '1.2em' }}>
        {puntosDe(d.puntos).map((p, i) => <li key={i}>{p}</li>)}
      </ul>
    </div>
  );
}

/** Diapositivas tipo PowerPoint: edita, presenta a pantalla completa y exporta a .pptx, .html o PDF. */
export default function EditorDiapositivas({ inicial, onCambio, estado, titulo, registrarAgregar }) {
  const [pres, setPres] = useState(() => cargarDiapositivas(inicial, titulo));
  const [i, setI] = useState(0);
  const [presentando, setPresentando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const presRef = useRef(pres);
  presRef.current = pres;

  const guardar = useCallback((nueva) => { setPres(nueva); onCambio(JSON.stringify(nueva)); }, [onCambio]);
  const actual = pres.diapositivas[Math.min(i, pres.diapositivas.length - 1)];
  const cambiar = (campo, valor) => guardar({ ...pres, diapositivas: pres.diapositivas.map((d, k) => (k === i ? { ...d, [campo]: valor } : d)) });
  const agregar = () => { guardar({ ...pres, diapositivas: [...pres.diapositivas, nuevaDiapositiva()] }); setI(pres.diapositivas.length); };
  const duplicar = () => { const d = pres.diapositivas.slice(); d.splice(i + 1, 0, { ...actual }); guardar({ ...pres, diapositivas: d }); setI(i + 1); };
  const quitar = () => { if (pres.diapositivas.length === 1) return guardar({ ...pres, diapositivas: [nuevaDiapositiva()] }); const d = pres.diapositivas.filter((_, k) => k !== i); guardar({ ...pres, diapositivas: d }); setI(Math.max(0, i - 1)); };
  const mover = (delta) => { const j = i + delta; if (j < 0 || j >= pres.diapositivas.length) return; const d = pres.diapositivas.slice(); [d[i], d[j]] = [d[j], d[i]]; guardar({ ...pres, diapositivas: d }); setI(j); };

  // La IA puede crear diapositivas a partir de una respuesta
  useEffect(() => {
    registrarAgregar?.((lineas) => {
      const nuevas = parseDiapositivas(lineas);
      if (!nuevas.length) return;
      const p = presRef.current;
      const base = p.diapositivas.length === 1 && !p.diapositivas[0].puntos && p.diapositivas[0].titulo === (titulo || 'Mi presentación') ? [] : p.diapositivas;
      guardar({ ...p, diapositivas: [...base, ...nuevas] });
      setI(base.length);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!presentando) return undefined;
    const tecla = (e) => {
      if (e.key === 'Escape') setPresentando(false);
      else if (['ArrowRight', ' ', 'PageDown'].includes(e.key)) { e.preventDefault(); setI((x) => Math.min(presRef.current.diapositivas.length - 1, x + 1)); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [presentando]);

  const nombre = nombreSeguro(titulo);
  const exportar = async (tipo) => {
    if (tipo === 'html') descargarArchivo(`${nombre}.html`, htmlPresentacion(pres.diapositivas, pres.tema, titulo), 'text/html');
    else if (tipo === 'pdf') imprimirHtml(titulo, htmlImpresion(pres.diapositivas, pres.tema));
    else { setExportando(true); try { await exportarPptx(pres.diapositivas, pres.tema, titulo, `${nombre}.pptx`); } finally { setExportando(false); } }
  };
  const boton = 'flex items-center gap-1 rounded-full bg-bg px-2.5 py-1.5 text-[11px] font-bold text-textSecondary hover:text-primary disabled:opacity-40';

  return (
    <div className="flex h-full min-h-[24rem] flex-col rounded-md2 bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-black/5 px-3 py-2">
        <button onClick={agregar} className={boton}><Plus size={13} /> Diapositiva</button>
        <button onClick={duplicar} className={boton}><Copy size={13} /> Duplicar</button>
        <button onClick={() => mover(-1)} disabled={i === 0} aria-label="Subir" className={boton}><ArrowUp size={13} /></button>
        <button onClick={() => mover(1)} disabled={i === pres.diapositivas.length - 1} aria-label="Bajar" className={boton}><ArrowDown size={13} /></button>
        <button onClick={quitar} className={`${boton} hover:!text-danger`}><Trash2 size={13} /></button>
        <select value={pres.tema} onChange={(e) => guardar({ ...pres, tema: e.target.value })} aria-label="Tema" className="rounded-full bg-bg px-2.5 py-1.5 text-[11px] font-bold text-textSecondary outline-none">{Object.entries(TEMAS).map(([k, t]) => <option key={k} value={k}>{t.nombre}</option>)}</select>
        <span className="text-[11px] font-semibold text-textSecondary">{ETIQUETA_ESTADO_DOC[estado] || ''}</span>
        <button onClick={() => setPresentando(true)} className="ml-auto flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-extrabold text-white"><Play size={12} /> Presentar</button>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 md:grid-cols-[9rem_minmax(0,1fr)]">
        <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-y-auto md:overflow-x-visible">
          {pres.diapositivas.map((d, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Diapositiva ${k + 1}`} className={`w-32 shrink-0 rounded-sm2 border-2 p-1 text-left md:w-full ${k === i ? 'border-primary' : 'border-transparent'}`}>
              <Lamina d={d} tema={pres.tema} /><span className="mt-0.5 block text-[10px] font-bold text-textSecondary">{k + 1}</span>
            </button>
          ))}
        </div>
        <div className="min-w-0 space-y-3">
          <input value={actual.titulo} onChange={(e) => cambiar('titulo', e.target.value)} placeholder="Título de la diapositiva" aria-label="Título de la diapositiva" className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-base font-extrabold outline-none focus:ring-2 focus:ring-primary" />
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <textarea value={actual.puntos} onChange={(e) => cambiar('puntos', e.target.value)} rows={7} placeholder={'Una idea por línea:\n- Primera idea\n- Segunda idea'} aria-label="Puntos de la diapositiva" className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <textarea value={actual.notas} onChange={(e) => cambiar('notas', e.target.value)} rows={3} placeholder="Notas del orador (no se ven en pantalla)" aria-label="Notas del orador" className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <Lamina d={actual} tema={pres.tema} grande />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-black/5 px-3 py-2 text-[11px] text-textSecondary">
        <span>{pres.diapositivas.length} diapositiva{pres.diapositivas.length !== 1 ? 's' : ''}</span>
        <span className="ml-auto flex flex-wrap gap-1">
          <button onClick={() => exportar('pptx')} disabled={exportando} className={boton}><Download size={12} /> {exportando ? 'Creando…' : 'PowerPoint (.pptx)'}</button>
          <button onClick={() => exportar('html')} className={boton}><Download size={12} /> .html</button>
          <button onClick={() => exportar('pdf')} className={boton}><Download size={12} /> PDF</button>
        </span>
      </div>

      {presentando && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black" role="dialog" aria-label="Presentación">
          <div className="flex items-center justify-between px-4 py-2 text-xs text-white/70"><span>{i + 1} / {pres.diapositivas.length} · ← → para avanzar · Esc para salir</span><button onClick={() => setPresentando(false)} aria-label="Salir de la presentación" className="rounded-full p-2 hover:bg-white/10"><X size={18} /></button></div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-3" onClick={(e) => setI((x) => (e.clientX > window.innerWidth / 2 ? Math.min(pres.diapositivas.length - 1, x + 1) : Math.max(0, x - 1)))}>
            <div className="w-full max-w-[min(100%,calc((100vh-6rem)*16/9))]"><Lamina d={actual} tema={pres.tema} grande /></div>
          </div>
          {actual.notas && <p className="mx-auto max-w-3xl px-4 pb-4 text-center text-sm text-white/60">{actual.notas}</p>}
          <div className="flex justify-center gap-3 pb-4">
            <button onClick={() => setI((x) => Math.max(0, x - 1))} aria-label="Anterior" className="rounded-full bg-white/10 p-3 text-white"><ChevronLeft /></button>
            <button onClick={() => setI((x) => Math.min(pres.diapositivas.length - 1, x + 1))} aria-label="Siguiente" className="rounded-full bg-white/10 p-3 text-white"><ChevronRight /></button>
          </div>
        </div>
      )}
    </div>
  );
}
