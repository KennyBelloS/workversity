import { useState } from 'react';
import { Search, BookOpen, Globe, ExternalLink, Plus, Loader2 } from 'lucide-react';
import { abrirVentanaLateral, abrirEnPestana } from '../../lib/ventana';
import { escaparHtml } from '../../lib/sanitizar';

const SITIOS = [
  ['Google Académico', (q) => `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`],
  ['Wikipedia', (q) => `https://es.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`],
  ['YouTube', (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`],
  ['Khan Academy', () => 'https://es.khanacademy.org/'],
  ['WolframAlpha', (q) => `https://www.wolframalpha.com/input?i=${encodeURIComponent(q)}`],
  ['Google', (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`],
];

const campo = 'min-w-0 flex-1 rounded-sm2 bg-primarySoft/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary';

/** Investigar sin salir de la tarea: Wikipedia, diccionario y navegador. */
export default function PanelInvestigar({ tema, onInsertar }) {
  const [vista, setVista] = useState('wiki');
  const [q, setQ] = useState(tema || '');
  const [resultados, setResultados] = useState([]);
  const [articulo, setArticulo] = useState(null);
  const [palabra, setPalabra] = useState('');
  const [entradas, setEntradas] = useState(null);
  const [url, setUrl] = useState('');
  const [marco, setMarco] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const abrirArticulo = async (titulo) => {
    setCargando(true); setError('');
    try {
      const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo)}`);
      if (!r.ok) throw new Error('no');
      const j = await r.json();
      setArticulo({ titulo: j.title, extracto: j.extract, url: j.content_urls?.desktop?.page || `https://es.wikipedia.org/wiki/${encodeURIComponent(titulo)}`, imagen: j.thumbnail?.source || null });
    } catch { setError('No se pudo abrir el artículo. Revisa tu conexión.'); } finally { setCargando(false); }
  };
  const buscarWiki = async (e) => {
    e?.preventDefault();
    if (!q.trim()) return;
    setCargando(true); setError(''); setArticulo(null);
    try {
      const r = await fetch(`https://es.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=6&namespace=0&format=json&origin=*`);
      const j = await r.json();
      const lista = (j[1] || []).map((t, i) => ({ titulo: t, url: j[3]?.[i] }));
      setResultados(lista);
      if (!lista.length) setError('No encontré resultados. Prueba con otras palabras.');
      else await abrirArticulo(lista[0].titulo);
    } catch { setError('No se pudo buscar. Revisa tu conexión.'); setCargando(false); }
  };
  const buscarPalabra = async (e) => {
    e?.preventDefault();
    if (!palabra.trim()) return;
    setCargando(true); setError(''); setEntradas(null);
    try {
      const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/es/${encodeURIComponent(palabra.trim().toLowerCase())}`);
      if (r.status === 404) { setError('No encontré esa palabra.'); return; }
      setEntradas(await r.json());
    } catch { setError('No se pudo consultar el diccionario. Revisa tu conexión.'); } finally { setCargando(false); }
  };
  const irA = (e) => {
    e.preventDefault();
    const t = url.trim();
    if (!t) return;
    if (/^https?:\/\//i.test(t)) setMarco(t);
    else if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(t)) setMarco(`https://${t}`);
    else { setQ(t); setVista('wiki'); setTimeout(() => buscarWiki(), 0); }
  };

  const tab = (k, texto, Icono) => (
    <button key={k} onClick={() => { setVista(k); setError(''); }} className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm2 px-3 py-2 text-xs font-bold ${vista === k ? 'bg-primary text-white' : 'bg-bg text-textSecondary'}`}><Icono size={14} /> {texto}</button>
  );

  return (
    <div className="flex h-full min-h-[24rem] flex-col gap-3 rounded-md2 bg-white p-4 shadow-card">
      <div className="flex gap-2">{tab('wiki', 'Wikipedia', BookOpen)}{tab('dic', 'Diccionario', Search)}{tab('web', 'Navegador', Globe)}</div>

      {vista === 'wiki' && (
        <>
          <form onSubmit={buscarWiki} className="flex gap-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca un tema…" aria-label="Buscar en Wikipedia" className={campo} /><button className="rounded-sm2 bg-primary px-4 text-sm font-bold text-white">Buscar</button></form>
          {resultados.length > 1 && <div className="flex flex-wrap gap-1.5">{resultados.map((r) => <button key={r.titulo} onClick={() => abrirArticulo(r.titulo)} className="rounded-full bg-bg px-3 py-1 text-[11px] font-bold text-textSecondary hover:text-primary">{r.titulo}</button>)}</div>}
          {articulo && (
            <article className="min-h-0 flex-1 overflow-y-auto rounded-sm2 bg-bg p-3">
              <div className="flex gap-3">
                {articulo.imagen && <img src={articulo.imagen} alt="" className="h-20 w-20 shrink-0 rounded-sm2 object-cover" />}
                <div><h3 className="text-base font-extrabold">{articulo.titulo}</h3><p className="mt-1 text-[13px] leading-relaxed">{articulo.extracto}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => onInsertar(`<h2>${escaparHtml(articulo.titulo)}</h2><p>${escaparHtml(articulo.extracto)}</p><p><i>Fuente: Wikipedia — <a href="${articulo.url}">${escaparHtml(articulo.titulo)}</a></i></p>`)} className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-white"><Plus size={12} /> Insertar en mi documento (con fuente)</button>
                <a href={articulo.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-textSecondary shadow-card"><ExternalLink size={12} /> Leer completo</a>
              </div>
            </article>
          )}
        </>
      )}

      {vista === 'dic' && (
        <>
          <form onSubmit={buscarPalabra} className="flex gap-2"><input value={palabra} onChange={(e) => setPalabra(e.target.value)} placeholder="Una palabra…" aria-label="Buscar en el diccionario" className={campo} /><button className="rounded-sm2 bg-primary px-4 text-sm font-bold text-white">Definir</button></form>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            {entradas?.map((en, i) => (
              <div key={i} className="rounded-sm2 bg-bg p-3">
                <p className="text-sm font-extrabold">{en.word}{en.phonetic ? <span className="ml-2 text-xs font-medium text-textSecondary">{en.phonetic}</span> : null}</p>
                {(en.meanings || []).map((m, j) => (
                  <div key={j} className="mt-1.5"><p className="text-[11px] font-bold text-primary">{m.partOfSpeech}</p>
                    <ol className="list-decimal space-y-0.5 pl-5 text-[13px]">{(m.definitions || []).slice(0, 4).map((d, k) => <li key={k}>{d.definition}{d.example ? <span className="text-textSecondary"> — «{d.example}»</span> : null}</li>)}</ol></div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {vista === 'web' && (
        <>
          <form onSubmit={irA} className="flex gap-2"><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Dirección web (https://…) o un tema" aria-label="Dirección web" className={campo} /><button className="rounded-sm2 bg-primary px-4 text-sm font-bold text-white">Ir</button></form>
          <div className="flex flex-wrap gap-1.5">{SITIOS.map(([n, f]) => <button key={n} onClick={() => abrirVentanaLateral(f(q || tema || ''))} className="rounded-full bg-bg px-3 py-1 text-[11px] font-bold text-textSecondary hover:text-primary" title="Se abre en una ventana al lado">{n} ↗</button>)}</div>
          {marco ? (
            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              <iframe src={marco} title="Navegador" sandbox="allow-scripts allow-forms allow-popups allow-same-origin" referrerPolicy="no-referrer" className="min-h-[18rem] flex-1 rounded-sm2 border border-black/10 bg-white" />
              <p className="flex flex-wrap items-center gap-2 text-[11px] text-textSecondary">¿Se ve en blanco? Muchas páginas no permiten mostrarse aquí.
                <button onClick={() => abrirVentanaLateral(marco)} className="font-bold text-primary">Abrir en ventana lateral</button><button onClick={() => abrirEnPestana(marco)} className="font-bold text-primary">Abrir en pestaña</button></p>
            </div>
          ) : <p className="rounded-sm2 bg-bg p-4 text-center text-xs text-textSecondary">Escribe una dirección. Si la página no se deja incrustar, usa los botones de arriba para abrirla en una ventana al lado de tu trabajo.</p>}
        </>
      )}

      {cargando && <p className="flex items-center gap-2 text-xs text-textSecondary"><Loader2 size={14} className="animate-spin" /> Buscando…</p>}
      {error && <p className="rounded-sm2 bg-dangerSoft p-2.5 text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}
