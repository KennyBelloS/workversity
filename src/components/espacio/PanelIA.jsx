import { useMemo, useState } from 'react';
import { ExternalLink, Copy, Check, ListChecks, FileText, Presentation, Info } from 'lucide-react';
import { PROVEEDORES, PLANTILLAS_PROMPT, armarPrompt, recortarParaUrl, lineasDeRespuesta } from '../../lib/iaEnfoque';
import { abrirVentanaLateral, abrirEnPestana } from '../../lib/ventana';
import { escaparHtml } from '../../lib/sanitizar';

/**
 * Ayuda de IA: arma el mensaje con el contexto de la tarea y abre ChatGPT, Claude, Gemini… en una ventana al lado.
 * (Esas páginas no permiten mostrarse dentro de otras, por eso no se incrustan.)
 */
export default function PanelIA({ ctx, textoDocumento, onInsertar, onCrearPasos, onCrearDiapositivas }) {
  const [plantilla, setPlantilla] = useState('explicar');
  const [conDocumento, setConDocumento] = useState(false);
  const [editado, setEditado] = useState(null);
  const [copiado, setCopiado] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [aviso, setAviso] = useState('');

  const base = useMemo(() => armarPrompt(plantilla, { ...ctx, documento: conDocumento ? textoDocumento : '' }), [plantilla, ctx, conDocumento, textoDocumento]);
  const prompt = editado ?? base;
  const cambiarPlantilla = (id) => { setPlantilla(id); setEditado(null); };

  const copiar = async (clave = 'msg') => { try { await navigator.clipboard.writeText(prompt); setCopiado(clave); setTimeout(() => setCopiado(''), 2200); } catch { /* nada */ } };
  const abrir = async (p, lateral = true) => {
    if (!p.conPrompt) { await copiar(p.id); setAviso(`Mensaje copiado: pégalo en ${p.nombre} con Ctrl + V.`); setTimeout(() => setAviso(''), 5000); }
    const url = p.url(recortarParaUrl(prompt));
    (lateral ? abrirVentanaLateral : abrirEnPestana)(url);
  };
  const lineas = lineasDeRespuesta(respuesta);

  return (
    <div className="flex h-full min-h-[24rem] flex-col gap-3 overflow-y-auto rounded-md2 bg-white p-4 shadow-card">
      <p className="flex items-start gap-2 rounded-sm2 bg-primarySoft/50 p-3 text-[11.5px] leading-snug text-textSecondary">
        <Info size={14} className="mt-0.5 shrink-0 text-primary" />
        <span>ChatGPT, Claude y Gemini <b>no permiten mostrarse dentro de otras páginas</b>, así que se abren en una ventana al lado de tu trabajo, con el mensaje ya preparado con los datos de esta tarea.</span>
      </p>

      <div>
        <p className="mb-1.5 text-xs font-extrabold">1. ¿Qué necesitas?</p>
        <div className="flex flex-wrap gap-1.5">
          {PLANTILLAS_PROMPT.map((p) => <button key={p.id} onClick={() => cambiarPlantilla(p.id)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${plantilla === p.id ? 'bg-primary text-white' : 'bg-bg text-textSecondary'}`}>{p.titulo}</button>)}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between"><p className="text-xs font-extrabold">2. Revisa el mensaje</p>
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-textSecondary"><input type="checkbox" checked={conDocumento} onChange={(e) => { setConDocumento(e.target.checked); setEditado(null); }} className="accent-primary" /> Incluir mi documento</label></div>
        <textarea value={prompt} onChange={(e) => setEditado(e.target.value)} rows={6} aria-label="Mensaje para la IA" className="w-full rounded-sm2 bg-primarySoft/60 px-3 py-2.5 text-[12.5px] leading-relaxed outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-extrabold">3. Ábrela al lado</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROVEEDORES.map((p) => (
            <div key={p.id} className="flex overflow-hidden rounded-sm2 border border-black/10">
              <button onClick={() => abrir(p, true)} className="flex min-w-0 flex-1 items-center gap-1.5 px-2.5 py-2 text-left text-xs font-bold hover:bg-black/5" style={{ color: p.color }}><span>{p.emoji}</span><span className="truncate">{p.nombre}</span></button>
              <button onClick={() => abrir(p, false)} aria-label={`Abrir ${p.nombre} en una pestaña`} title="Abrir en una pestaña" className="border-l border-black/10 px-2 text-textSecondary hover:bg-black/5"><ExternalLink size={12} /></button>
            </div>
          ))}
        </div>
        <button onClick={() => copiar()} className="mt-2 flex items-center gap-1.5 rounded-full bg-bg px-3 py-1.5 text-[11px] font-bold text-textSecondary">{copiado === 'msg' ? <Check size={12} /> : <Copy size={12} />} {copiado === 'msg' ? 'Copiado' : 'Copiar el mensaje'}</button>
        {aviso && <p className="mt-2 text-xs font-semibold text-success">{aviso}</p>}
      </div>

      <div className="border-t border-black/5 pt-3">
        <p className="mb-1.5 text-xs font-extrabold">4. Trae la respuesta a tu trabajo</p>
        <textarea value={respuesta} onChange={(e) => setRespuesta(e.target.value)} rows={4} placeholder="Pega aquí la respuesta de la IA…" aria-label="Respuesta de la IA" className="w-full rounded-sm2 bg-primarySoft/60 px-3 py-2.5 text-[12.5px] outline-none focus:ring-2 focus:ring-primary" />
        <div className="mt-2 flex flex-wrap gap-2">
          <button disabled={!respuesta.trim()} onClick={() => { onInsertar(respuesta.split(/\n{2,}/).map((p) => `<p>${escaparHtml(p).replace(/\n/g, '<br>')}</p>`).join('')); setRespuesta(''); }} className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-40"><FileText size={12} /> Insertar en mi documento</button>
          <button disabled={lineas.length === 0} onClick={() => { onCrearPasos(lineas); setRespuesta(''); }} className="flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 text-[11px] font-bold text-primary disabled:opacity-40"><ListChecks size={12} /> Convertir en pasos ({lineas.length})</button>
          <button disabled={lineas.length === 0} onClick={() => { onCrearDiapositivas(lineas); setRespuesta(''); }} className="flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1.5 text-[11px] font-bold text-primary disabled:opacity-40"><Presentation size={12} /> Crear diapositivas</button>
        </div>
      </div>
    </div>
  );
}
