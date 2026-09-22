import { useEffect, useRef, useState } from 'react';
import { GripVertical, Eye, EyeOff, Settings2, RotateCcw, Check } from 'lucide-react';
import { WIDGETS, leerLayout, guardarLayout, layoutPorDefecto, moverAntesDe, moverPaso, alternarOculto } from '../../lib/widgets';

/**
 * Cuadrícula de widgets del Dashboard: se pueden reordenar arrastrando (o con ↑/↓, más fácil
 * en el celular) y ocultar. El orden se guarda en el dispositivo.
 * `piezas` es { [id]: <elemento/> } con el contenido de cada widget.
 */
export default function WidgetGrid({ piezas }) {
  const [layout, setLayout] = useState(leerLayout);
  const [editando, setEditando] = useState(false);
  const arrastrando = useRef(null);

  useEffect(() => { guardarLayout(layout); }, [layout]);

  const { orden, ocultos } = layout;
  const visibles = orden.filter((id) => !ocultos.includes(id) || editando);

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
          <span>Arrastra <GripVertical size={12} className="inline" /> para reordenar, o usa ↑ ↓. El ojo oculta un widget.</span>
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
              draggable={editando}
              onDragStart={() => { arrastrando.current = id; }}
              onDragOver={(e) => editando && e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (arrastrando.current && arrastrando.current !== id) setLayout((l) => ({ ...l, orden: moverAntesDe(l.orden, arrastrando.current, id) })); arrastrando.current = null; }}
              className={editando ? `rounded-md2 bg-white shadow-card ${oculto ? 'opacity-40' : ''}` : ''}
            >
              {editando && (
                <div className="flex items-center justify-between border-b border-black/5 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-textSecondary"><GripVertical size={14} className="cursor-grab" /> {meta?.titulo || id}</span>
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
