import { useRef, useState } from 'react';
import { STATUS_ORDER, TASK_STATUSES } from '../../lib/constants';
import TaskCard from './TaskCard';

export default function KanbanBoard({ tasks, onOpen, onToggle, onDelete, onMove }) {
  const [colDestacada, setColDestacada] = useState(null);
  const [arrastrandoId, setArrastrandoId] = useState(null);
  const refsColumna = useRef({});

  // El arrastre nativo de HTML5 (dataTransfer) no funciona en pantallas táctiles, así que se
  // usa también un arrastre por toque/mouse en paralelo: en desktop sigue sirviendo el nativo
  // (más fluido), y en el celular funciona igual con el dedo gracias a este mecanismo.
  const empezarArrastreTactil = (id) => (e) => {
    if (!('touches' in e)) return; // el mouse ya lo cubre el drag nativo de HTML5
    setArrastrandoId(id);
    let sobre = null;
    const mover = (ev) => {
      const punto = ev.touches?.[0];
      if (!punto) return;
      sobre = null;
      for (const [estado, el] of Object.entries(refsColumna.current)) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (punto.clientX >= r.left && punto.clientX <= r.right && punto.clientY >= r.top && punto.clientY <= r.bottom) { sobre = estado; break; }
      }
      setColDestacada(sobre);
    };
    const soltar = () => {
      if (sobre) onMove(id, sobre);
      setArrastrandoId(null); setColDestacada(null);
      window.removeEventListener('touchmove', mover); window.removeEventListener('touchend', soltar);
    };
    window.addEventListener('touchmove', mover, { passive: false });
    window.addEventListener('touchend', soltar);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUS_ORDER.map((estado) => {
        const info = TASK_STATUSES[estado];
        const tareasColumna = tasks.filter((t) => t.status === estado);
        const resaltado = colDestacada === estado;

        return (
          <div
            key={estado}
            ref={(el) => { refsColumna.current[estado] = el; }}
            onDragOver={(e) => {
              e.preventDefault();
              setColDestacada(estado);
            }}
            onDragLeave={() => setColDestacada((c) => (c === estado ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain');
              setColDestacada(null);
              if (id) onMove(id, estado);
            }}
            className="flex w-[270px] min-w-[270px] flex-1 shrink-0 flex-col rounded-md2 p-2.5 transition lg:max-w-[400px]"
            style={{
              backgroundColor: resaltado ? `${info.color}15` : 'rgb(var(--bg))',
              border: `1.4px solid ${resaltado ? info.color : 'transparent'}`,
            }}
          >
            <div className="flex items-center gap-2 px-1 py-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: info.color }} />
              <span className="text-[13.5px] font-extrabold">{info.label}</span>
              <span className="text-xs text-textSecondary">{tareasColumna.length}</span>
            </div>
            <div className="mt-1.5 min-h-[80px] flex-1">
              {tareasColumna.length === 0 ? (
                <p className="px-2 py-6 text-center text-[11.5px] text-textSecondary/70">Arrastra tarjetas aquí</p>
              ) : (
                tareasColumna.map((t) => (
                  <div key={t.id} className={arrastrandoId === t.id ? 'opacity-50' : ''} onTouchStart={empezarArrastreTactil(t.id)} style={{ touchAction: arrastrandoId ? 'none' : 'pan-y' }}>
                    <TaskCard
                      task={t}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}
                      onClick={() => onOpen(t)}
                      onToggle={() => onToggle(t)}
                      onDelete={() => onDelete(t)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
