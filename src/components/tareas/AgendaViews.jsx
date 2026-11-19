import { useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { DIAS_SEMANA, CATEGORIES } from '../../lib/constants';
import {
  esMismoDia,
  formatearFechaLarga,
  inicioSemana,
  diasDelMesConRelleno,
  nombreMes,
} from '../../lib/dateUtils';
import TaskCard from './TaskCard';

// ---------------------------------------------------------------------------------------------
// Vistas Día / Semana / Mes de Tareas. Comparten identidad con el resto de la app (Tinta, Geist,
// la misma tarjeta que el tablero): antes eran bloques de Tailwind genéricos (fondo blanco fijo,
// sombra de tarjeta plana) que ni siquiera distinguían tema oscuro. El Mes, en particular, adopta
// una composición de cuadrícula limpia: números de día en la esquina, sin casillas pesadas, con
// un punto por cada tarea pendiente de ese día y el rango seleccionado resaltado con un color
// suave — no un bloque sólido — para que se lea como calendario y no como botonera.
// ---------------------------------------------------------------------------------------------

function Vacio({ texto }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-textSecondary">
      <Inbox size={22} strokeWidth={1.6} className="opacity-40" />
      <p className="text-t-pie">{texto}</p>
    </div>
  );
}

function CabeceraNav({ texto, onAnterior, onSiguiente }) {
  return (
    <div className="av-cab">
      <button onClick={onAnterior} aria-label="Anterior" className="av-cab-b"><ChevronLeft size={17} strokeWidth={1.9} /></button>
      <p className="av-cab-t capitalize">{texto}</p>
      <button onClick={onSiguiente} aria-label="Siguiente" className="av-cab-b"><ChevronRight size={17} strokeWidth={1.9} /></button>
    </div>
  );
}

export function DayView({ dia, onCambiarDia, tasks, onOpen, onToggle, onDelete }) {
  const deEsteDia = tasks
    .filter((t) => esMismoDia(new Date(t.due_date), dia))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const hoy = esMismoDia(dia, new Date());
  const pendientes = deEsteDia.filter((t) => t.status !== 'hecha').length;

  const cambiar = (delta) => {
    const nuevo = new Date(dia);
    nuevo.setDate(nuevo.getDate() + delta);
    onCambiarDia(nuevo);
  };

  return (
    <div>
      {/* En celular, el día se abre con su propia portada: la fecha grande primero, la lista
          después — no el mismo encabezado angosto del escritorio encogido. */}
      <div className="dm-hero sm:hidden">
        <div className="dm-hero-fecha">
          <span className="dm-hero-num">{dia.getDate()}</span>
          <span className="dm-hero-mes">{dia.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}</span>
        </div>
        <div className="dm-hero-cuerpo">
          <span className="dm-hero-etq">{hoy ? 'Hoy' : dia.toLocaleDateString('es-CO', { weekday: 'long' })}</span>
          <span className="dm-hero-cuenta">{pendientes === 0 ? 'nada pendiente' : `${pendientes} ${pendientes === 1 ? 'pendiente' : 'pendientes'}`}</span>
        </div>
        <div className="ml-auto flex gap-1">
          <button onClick={() => cambiar(-1)} aria-label="Día anterior" className="av-cab-b"><ChevronLeft size={16} strokeWidth={1.9} /></button>
          <button onClick={() => cambiar(1)} aria-label="Día siguiente" className="av-cab-b"><ChevronRight size={16} strokeWidth={1.9} /></button>
        </div>
      </div>
      <div className="hidden sm:block">
        <CabeceraNav texto={formatearFechaLarga(dia)} onAnterior={() => cambiar(-1)} onSiguiente={() => cambiar(1)} />
      </div>
      {deEsteDia.length === 0 ? (
        <Vacio texto="Sin tareas este día" />
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
    <div className="av-semana">
      {dias.map((dia, i) => {
        const esHoy = esMismoDia(dia, hoy);
        const deEsteDia = tasks
          .filter((t) => esMismoDia(new Date(t.due_date), dia))
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        return (
          <div key={i} className="av-semana-dia">
            <div className="av-semana-cab">
              <span className={`av-semana-t ${esHoy ? 'av-semana-t--hoy' : ''}`}>{DIAS_SEMANA[i]} {dia.getDate()}</span>
              {esHoy && <span className="av-semana-hoy">Hoy</span>}
              <span className="av-semana-n">{deEsteDia.length}</span>
            </div>
            {deEsteDia.length === 0 ? (
              <p className="av-semana-vacio">Sin tareas</p>
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

  // Hasta 3 puntos de color por día (universidad/trabajo), para no convertir la celda en un gráfico.
  const porDia = {};
  for (const t of tasks) {
    const d = new Date(t.due_date);
    if (d.getFullYear() === mes.getFullYear() && d.getMonth() === mes.getMonth()) {
      const clave = d.getDate();
      (porDia[clave] ||= []).push(t);
    }
  }
  const dias = diasDelMesConRelleno(mes);
  while (dias.length % 7 !== 0) dias.push(null);
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
      <CabeceraNav texto={nombreMes(mes)} onAnterior={() => cambiarMes(-1)} onSiguiente={() => cambiarMes(1)} />

      <div className="av-mes">
        <div className="av-mes-dias" role="presentation">
          {LETRAS_DIA.map((l) => <span key={l}>{l}</span>)}
        </div>
        <div className="av-mes-rejilla" role="grid">
          {dias.map((dia, i) => {
            if (!dia) return <div key={i} className="av-mes-c av-mes-c--hueco" aria-hidden="true" />;
            const esHoy = esMismoDia(dia, hoy);
            const esSel = seleccionado && esMismoDia(dia, seleccionado);
            const deEsteDia = porDia[dia.getDate()] || [];
            return (
              <button
                key={i}
                onClick={() => setSeleccionado(dia)}
                aria-pressed={!!esSel}
                aria-label={`${dia.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}${deEsteDia.length ? `, ${deEsteDia.length} tarea(s)` : ''}`}
                className={`av-mes-c ${esSel ? 'av-mes-c--sel' : ''} ${esHoy ? 'av-mes-c--hoy' : ''}`}
              >
                <span className="av-mes-n">{dia.getDate()}</span>
                {deEsteDia.length > 0 && (
                  <span className="av-mes-puntos" aria-hidden="true">
                    {[...new Set(deEsteDia.map((t) => (CATEGORIES[t.category] || CATEGORIES.universidad).color))].slice(0, 3).map((c) => (
                      <span key={c} className="av-mes-punto" style={{ background: c }} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        {seleccionado ? (
          <>
            <p className="av-sel-t capitalize">{formatearFechaLarga(seleccionado)}</p>
            {tareasDelDia.length === 0 ? (
              <Vacio texto="Sin tareas este día" />
            ) : (
              tareasDelDia.map((t) => (
                <TaskCard key={t.id} task={t} onClick={() => onOpen(t)} onToggle={() => onToggle(t)} onDelete={() => onDelete(t)} />
              ))
            )}
          </>
        ) : (
          <Vacio texto="Toca un día para ver sus tareas" />
        )}
      </div>
    </div>
  );
}
