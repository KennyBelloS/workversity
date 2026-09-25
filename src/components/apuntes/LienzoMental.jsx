import { useRef, useState } from 'react';
import { Plus, Trash2, Sparkles, RotateCcw } from 'lucide-react';
import { nodoRaiz, agregarNodo, moverNodo, renombrarNodo, eliminarNodo, aristasDe, generarMapaMental, esVacio } from '../../lib/mapaMental';

const COLORES = ['#5B8DEF', '#8B7FD1', '#17C964', '#F5A524', '#E5789C', '#7FD1C3'];
const colorDe = (id) => COLORES[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORES.length];

/** Mapa mental que se arma a mano: agrega nodos, arrástralos, tócalos para renombrarlos. */
export default function LienzoMental({ nodos, onCambiar, texto, titulo }) {
  const lienzo = nodos && nodos.length > 0 ? nodos : nodoRaiz(titulo || 'Tema central');
  const [seleccionado, setSeleccionado] = useState(lienzo[0]?.id || null);
  const [editando, setEditando] = useState(null);
  const arrastre = useRef(null);
  const contenedorRef = useRef(null);

  const empezarArrastre = (e, id) => {
    e.preventDefault();
    setSeleccionado(id);
    const nodo = lienzo.find((n) => n.id === id);
    const punto = 'touches' in e ? e.touches[0] : e;
    arrastre.current = { id, dx: punto.clientX - nodo.x, dy: punto.clientY - nodo.y };
    const mover = (ev) => {
      const p = 'touches' in ev ? ev.touches[0] : ev;
      const rect = contenedorRef.current?.getBoundingClientRect();
      const x = p.clientX - rect.left - arrastre.current.dx + (contenedorRef.current?.scrollLeft || 0);
      const y = p.clientY - rect.top - arrastre.current.dy + (contenedorRef.current?.scrollTop || 0);
      onCambiar(moverNodo(lienzo, id, Math.max(20, x), Math.max(20, y)));
    };
    const soltar = () => { arrastre.current = null; window.removeEventListener('mousemove', mover); window.removeEventListener('mouseup', soltar); window.removeEventListener('touchmove', mover); window.removeEventListener('touchend', soltar); };
    window.addEventListener('mousemove', mover); window.addEventListener('mouseup', soltar);
    window.addEventListener('touchmove', mover, { passive: false }); window.addEventListener('touchend', soltar);
  };

  const agregar = () => onCambiar(agregarNodo(lienzo, seleccionado || lienzo[0].id, 'Nueva idea'));
  const borrar = (id) => { onCambiar(eliminarNodo(lienzo, id)); if (seleccionado === id) setSeleccionado(null); };
  const autogenerar = () => {
    if (esVacio(lienzo) || window.confirm('Esto reemplaza el mapa mental actual por uno generado de tus fuentes. ¿Continuar?')) onCambiar(generarMapaMental(texto, titulo));
  };

  const ancho = Math.max(600, ...lienzo.map((n) => n.x + 160));
  const alto = Math.max(400, ...lienzo.map((n) => n.y + 100));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button onClick={agregar} className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white"><Plus size={13} /> Agregar idea</button>
        {texto && <button onClick={autogenerar} className="flex items-center gap-1.5 rounded-full border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary"><Sparkles size={13} /> Generar de mis apuntes</button>}
        <button onClick={() => onCambiar(nodoRaiz(titulo || 'Tema central'))} className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold text-textSecondary"><RotateCcw size={13} /> Reiniciar</button>
      </div>
      <div ref={contenedorRef} className="relative h-[420px] overflow-auto rounded-md2 bg-white shadow-card" style={{ touchAction: seleccionado ? 'none' : 'auto' }}>
        <div className="relative" style={{ width: ancho, height: alto }}>
          <svg width={ancho} height={alto} className="pointer-events-none absolute inset-0">
            {aristasDe(lienzo).map(({ de, a }) => <line key={a.id} x1={de.x} y1={de.y} x2={a.x} y2={a.y} stroke="#5B8DEF" strokeOpacity="0.4" strokeWidth="2" />)}
          </svg>
          {lienzo.map((n) => (
            <div
              key={n.id}
              onMouseDown={(e) => empezarArrastre(e, n.id)}
              onTouchStart={(e) => empezarArrastre(e, n.id)}
              onClick={() => setSeleccionado(n.id)}
              className="absolute flex max-w-[150px] -translate-x-1/2 -translate-y-1/2 cursor-grab select-none items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-white shadow-md active:cursor-grabbing"
              style={{ left: n.x, top: n.y, backgroundColor: colorDe(n.id), outline: seleccionado === n.id ? '3px solid rgba(0,0,0,0.15)' : 'none' }}
            >
              {editando === n.id ? (
                <input autoFocus defaultValue={n.texto} onBlur={(e) => { onCambiar(renombrarNodo(lienzo, n.id, e.target.value || n.texto)); setEditando(null); }} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} onClick={(e) => e.stopPropagation()} className="w-24 rounded bg-white/90 px-1 text-textPrimary outline-none" />
              ) : (
                <span onDoubleClick={(e) => { e.stopPropagation(); setEditando(n.id); }} className="truncate">{n.texto}</span>
              )}
              {n.padreId && <button onClick={(e) => { e.stopPropagation(); borrar(n.id); }} aria-label={`Eliminar ${n.texto}`} className="shrink-0 opacity-70 hover:opacity-100"><Trash2 size={11} /></button>}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-textSecondary">Arrastra un nodo para moverlo, doble toque para renombrarlo. El primer nodo es el tema central.</p>
    </div>
  );
}
