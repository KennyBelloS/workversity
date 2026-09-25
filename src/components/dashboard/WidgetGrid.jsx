import { useEffect, useRef, useState } from 'react';
import { GripVertical, Eye, EyeOff, Settings2, RotateCcw, Check } from 'lucide-react';
import { WIDGETS, leerLayout, guardarLayout, layoutPorDefecto, moverAntesDe, moverPaso, alternarOculto } from '../../lib/widgets';

/**
 * Cuadrícula de widgets del Dashboard: se pueden reordenar arrastrando (o con ↑/↓, más fácil
 * en el celular) y ocultar. El orden se guarda en el dispositivo.
 *
 * El arrastre usa "Pointer Events" (no el drag-and-drop nativo de HTML5, que en los
 * celulares simplemente no funciona): así el mismo código sirve para mouse y para el dedo.
 * `piezas` es { [id]: <elemento/> } con el contenido de cada widget.
 */
export default function WidgetGrid({ piezas }) {
  const [layout, setLayout] = useState(leerLayout);
  const [editando, setEditando] = useState(false);
  const [arrastrandoId, setArrastrandoId] = useState(null);
  const [sobreId, setSobreId] = useState(null);
  const refs = useRef({});

  useEffect(() => { guardarLayout(layout); }, [layout]);

  const { orden, ocultos } = layout;
  const visibles = orden.filter((id) => !ocultos.includes(id) || editando);

  const empezarArrastre = (id) => (e) => {
    if (!editando) return;
    e.preventDefault();
    setArrastrandoId(id);
    let sobreActual = null; // valor "en vivo" durante el arrastre (el estado de React llega con un turno de retraso)
    const mover = (ev) => {
      const punto = 'touches' in ev ? ev.touches[0] : ev;
      if (!punto) return;
      // ¿Sobre cuál otro widget está el dedo/cursor ahora mismo?
      let sobre = null;
      for (const [otroId, el] of Object.entries(refs.current)) {
        if (!el || otroId === id) continue;
        const r = el.getBoundingClientRect();
        if (punto.clientY >= r.top && punto.clientY <= r.bottom) { sobre = otroId; break; }
      }
      sobreActual = sobre;
      setSobreId(sobre);
    };
    const soltar = () => {
      if (sobreActual) setLayout((l) => ({ ...l, orden: moverAntesDe(l.orden, id, sobreActual) }));
      setArrastrandoId(null); setSobreId(null);
      window.removeEventListener('mousemove', mover); window.removeEventListener('mouseup', soltar);
      window.removeEventListener('touchmove', mover); window.removeEventListener('touchend', soltar);
    };
    window.addEventListener('mousemove', mover); window.addEventListener('mouseup', soltar);
    window.addEventListener('touchmove', mover, { passive: false }); window.addEventListener('touchend', soltar);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-extrabold text-textSecondary">{editando ? 'Organiza tu Dashboard' : ' '}</p>
        <button onClick={() => setEditando((v) => !v)} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-card ${editando ? 'bg-primary text-white' : 'bg-white text-textSecondary'}`}>
          {editando ? <Check size={13} /> : <Settings2 size={13} />} {editando ? 'Listo' : 'Personalizar'}
        </button>
      </div>
      {editando && (
        <p className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-sm2 bg-primarySoft/60 p-2.5 text-[11px] font-semibold text-primary">
          <span>Arrastra <GripVertical size={12} className="inline" /> para reordenar (funciona con el dedo también), o usa ↑ ↓. El ojo oculta un widget.</span>
          <button onClick={() => setLayout(layoutPorDefecto())} className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-textSecondary"><RotateCcw size={11} /> Restablecer</button>
        </p>
      )}
      <div className={editando ? 'space-y-3' : 'columns-1 gap-4 lg:columns-2 [&>*]:mb-4 [&>*]:break-inside-avoid'}>
        {visibles.map((id, i) => {
          const meta = WIDGETS.find((w) => w.id === id);
          const oculto = ocultos.includes(id);
          return (
            <div
              key={id}
              ref={(el) => { refs.current[id] = el; }}
              className={editando ? `rounded-md2 bg-white shadow-card transition ${oculto ? 'opacity-40' : ''} ${arrastrandoId === id ? 'opacity-60 ring-2 ring-primary' : ''} ${sobreId === id ? 'ring-2 ring-primary/60' : ''}` : ''}
              style={editando ? { touchAction: arrastrandoId ? 'none' : 'pan-y' } : undefined}
            >
              {editando && (
                <div className="flex items-center justify-between border-b border-black/5 px-3 py-2">
                  <span
                    onMouseDown={empezarArrastre(id)}
                    onTouchStart={empezarArrastre(id)}
                    className="flex flex-1 items-center gap-1.5 text-xs font-bold text-textSecondary"
                  >
                    <GripVertical size={14} className="cursor-grab active:cursor-grabbing" /> {meta?.titulo || id}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setLayout((l) => ({ ...l, orden: moverPaso(l.orden, l.ocultos, id, -1) }))} disabled={i === 0} aria-label="Subir" className="rounded p-1 text-textSecondary disabled:opacity-30">↑</button>
                    <button onClick={() => setLayout((l) => ({ ...l, orden: moverPaso(l.orden, l.ocultos, id, 1) }))} disabled={i === visibles.length - 1} aria-label="Bajar" className="rounded p-1 text-textSecondary disabled:opacity-30">↓</button>
                    <button onClick={() => setLayout((l) => ({ ...l, ocultos: alternarOculto(l.ocultos, id) }))} aria-label={oculto ? 'Mostrar' : 'Ocultar'} className="rounded p-1 text-textSecondary hover:text-primary">{oculto ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                </div>
              )}
              <div className={editando ? 'p-3' : ''}>{piezas[id]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
