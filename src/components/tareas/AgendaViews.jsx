import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DIAS_SEMANA } from '../../lib/constants';
import {
  esMismoDia,
  formatearFechaLarga,
  inicioSemana,
  diasDelMesConRelleno,
  nombreMes,
} from '../../lib/dateUtils';
import TaskCard from './TaskCard';

export function DayView({ dia, onCambiarDia, tasks, onOpen, onToggle, onDelete }) {
  const deEsteDia = tasks
    .filter((t) => esMismoDia(new Date(t.due_date), dia))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const cambiar = (delta) => {
    const nuevo = new Date(dia);
    nuevo.setDate(nuevo.getDate() + delta);
    onCambiarDia(nuevo);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => cambiar(-1)} className="rounded-full p-2 hover:bg-black/5"><ChevronLeft size={20} /></button>
        <p className="text-[13px] font-extrabold capitalize">{formatearFechaLarga(dia)}</p>
        <button onClick={() => cambiar(1)} className="rounded-full p-2 hover:bg-black/5"><ChevronRight size={20} /></button>
      </div>
      {deEsteDia.length === 0 ? (
        <p className="py-10 text-center text-sm text-textSecondary">Sin tareas este día</p>
      ) : (
        deEsteDia.map((t) => (
          <TaskCard key={t.id} task={t} onClick={() => onOpen(t)} onToggle={() => onToggle(t)} onDelete={() => onDelete(t)} />
        ))
      )}
    </div>
  );
}

export function WeekView({ tasks, onOpen, onToggle, onDelete }) {
  const hoy = new Date();
  const lunes = inicioSemana(hoy);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div>
      {dias.map((dia, i) => {
        const esHoy = esMismoDia(dia, hoy);
        const deEsteDia = tasks
          .filter((t) => esMismoDia(new Date(t.due_date), dia))
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        return (
          <div key={i}>
            <div className="mb-1 mt-4 flex items-center gap-2">
              <p className={`text-[13px] font-extrabold ${esHoy ? 'text-primary' : 'text-textPrimary'}`}>
                {DIAS_SEMANA[i]} {dia.getDate()}
              </p>
              {esHoy && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-extrabold text-white">HOY</span>}
              <span className="ml-auto text-[11px] text-textSecondary">{deEsteDia.length} tarea(s)</span>
            </div>
            {deEsteDia.length === 0 ? (
              <p className="pb-2 pl-1 text-[11.5px] text-textSecondary">Sin tareas</p>
            ) : (
              deEsteDia.map((t) => (
                <TaskCard key={t.id} task={t} onClick={() => onOpen(t)} onToggle={() => onToggle(t)} onDelete={() => onDelete(t)} />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

const LETRAS_DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function MonthView({ mes, onCambiarMes, tasks, onOpen, onToggle, onDelete }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const conteo = {};
  for (const t of tasks) {
    const d = new Date(t.due_date);
    if (d.getFullYear() === mes.getFullYear() && d.getMonth() === mes.getMonth()) {
      conteo[d.getDate()] = (conteo[d.getDate()] || 0) + 1;
    }
  }
  const dias = diasDelMesConRelleno(mes);
  const hoy = new Date();
  const tareasDelDia = seleccionado
    ? tasks.filter((t) => esMismoDia(new Date(t.due_date), seleccionado)).sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    : [];

  const cambiarMes = (delta) => {
    onCambiarMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1));
    setSeleccionado(null);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => cambiarMes(-1)} className="rounded-full p-2 hover:bg-black/5"><ChevronLeft size={20} /></button>
        <p className="text-sm font-extrabold capitalize">{nombreMes(mes)}</p>
        <button onClick={() => cambiarMes(1)} className="rounded-full p-2 hover:bg-black/5"><ChevronRight size={20} /></button>
      </div>
      <div className="rounded-md2 bg-white p-3 shadow-card">
        <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[11px] font-bold text-textSecondary">
          {LETRAS_DIA.map((l) => <span key={l}>{l}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dias.map((dia, i) => {
            if (!dia) return <div key={i} />;
            const esHoy = esMismoDia(dia, hoy);
            const esSel = seleccionado && esMismoDia(dia, seleccionado);
            const n = conteo[dia.getDate()] || 0;
            return (
              <button
                key={i}
                onClick={() => setSeleccionado(dia)}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg text-[12.5px] font-semibold transition ${
                  esSel ? 'bg-primary text-white' : esHoy ? 'bg-primarySoft text-primary' : 'text-textPrimary hover:bg-black/5'
                }`}
              >
                {dia.getDate()}
                {n > 0 && <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${esSel ? 'bg-white' : 'bg-primary'}`} />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4">
        {seleccionado ? (
          <>
            <p className="mb-2 text-[13px] font-extrabold capitalize">{formatearFechaLarga(seleccionado)}</p>
            {tareasDelDia.length === 0 ? (
              <p className="py-4 text-sm text-textSecondary">Sin tareas este día</p>
            ) : (
              tareasDelDia.map((t) => (
                <TaskCard key={t.id} task={t} onClick={() => onOpen(t)} onToggle={() => onToggle(t)} onDelete={() => onDelete(t)} />
              ))
            )}
          </>
        ) : (
          <p className="py-6 text-center text-sm text-textSecondary">Toca un día para ver sus tareas</p>
        )}
      </div>
    </div>
  );
}
