import { useState } from 'react';
import { STATUS_ORDER, TASK_STATUSES } from '../../lib/constants';
import TaskCard from './TaskCard';

export default function KanbanBoard({ tasks, onOpen, onToggle, onDelete, onMove }) {
  const [colDestacada, setColDestacada] = useState(null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUS_ORDER.map((estado) => {
        const info = TASK_STATUSES[estado];
        const tareasColumna = tasks.filter((t) => t.status === estado);
        const resaltado = colDestacada === estado;

        return (
          <div
            key={estado}
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
            className="flex w-[270px] shrink-0 flex-col rounded-md2 p-2.5 transition"
            style={{
              backgroundColor: resaltado ? `${info.color}15` : '#F3F7FC',
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
                  <TaskCard
                    key={t.id}
                    task={t}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', t.id)}
                    onClick={() => onOpen(t)}
                    onToggle={() => onToggle(t)}
                    onDelete={() => onDelete(t)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
