import { useEffect, useState } from 'react';
import { useEscape } from '../../hooks/useEscape';
import { X, Trash2 } from 'lucide-react';
import { BLOCK_TYPES, DIAS_SEMANA, COLORES_SUGERIDOS } from '../../lib/constants';

function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}
function minutosAHoraInput(min) {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default function BlockModal({ bloqueExistente, onGuardar, onEliminar, onCerrar }) {
  useEscape(onCerrar);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('clase');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('09:00');
  const [color, setColor] = useState(COLORES_SUGERIDOS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bloqueExistente) {
      setTitle(bloqueExistente.title);
      setLocation(bloqueExistente.location || '');
      setType(bloqueExistente.type);
      setDayOfWeek(bloqueExistente.day_of_week);
      setHoraInicio(minutosAHoraInput(bloqueExistente.start_minutes));
      setHoraFin(minutosAHoraInput(bloqueExistente.end_minutes));
      setColor(bloqueExistente.color_value);
    }
  }, [bloqueExistente]);

  const guardar = () => {
    if (!title.trim()) return setError('Escribe un nombre');
    const inicio = horaAMinutos(horaInicio);
    const fin = horaAMinutos(horaFin);
    if (fin <= inicio) return setError('La hora de fin debe ser después del inicio');

    onGuardar({
      ...(bloqueExistente || {}),
      title: title.trim(),
      location: location.trim(),
      type,
      day_of_week: dayOfWeek,
      start_minutes: inicio,
      end_minutes: fin,
      color_value: color,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-lg2 bg-bg sm:rounded-lg2">
        <div className="sticky top-0 flex items-center justify-between bg-bg px-5 py-4">
          <h2 className="text-lg font-extrabold">{bloqueExistente ? 'Editar bloque' : 'Nuevo bloque'}</h2>
          <button onClick={onCerrar} className="rounded-full p-1.5 hover:bg-black/5"><X size={20} /></button>
        </div>

        <div className="space-y-4 px-5 pb-8">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre (ej: Cálculo II, Turno tarde)"
            className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Lugar (opcional)"
            className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-xs font-semibold text-danger">{error}</p>}

          <div className="grid grid-cols-4 gap-2">
            {Object.entries(BLOCK_TYPES).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className="rounded-sm2 border py-2 text-[11px] font-bold"
                style={{
                  borderColor: type === key ? info.color : 'rgba(0,0,0,0.08)',
                  backgroundColor: type === key ? `${info.color}1F` : 'transparent',
                  color: type === key ? info.color : '#6E7180',
                }}
              >
                {info.label}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-textSecondary">Día</p>
            <div className="flex flex-wrap gap-1.5">
              {DIAS_SEMANA.map((d, i) => (
                <button
                  key={d}
                  onClick={() => setDayOfWeek(i + 1)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${dayOfWeek === i + 1 ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold text-textSecondary">Empieza</p>
              <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="w-full rounded-sm2 bg-white px-3 py-2.5 text-sm shadow-card outline-none" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs font-semibold text-textSecondary">Termina</p>
              <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="w-full rounded-sm2 bg-white px-3 py-2.5 text-sm shadow-card outline-none" />
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-textSecondary">Color</p>
            <div className="flex gap-2">
              {COLORES_SUGERIDOS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full"
                  style={{ backgroundColor: c, outline: color === c ? `2.5px solid ${c}` : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            {bloqueExistente && (
              <button onClick={() => onEliminar(bloqueExistente)} className="flex items-center justify-center gap-2 rounded-sm2 border border-danger/30 px-4 py-3.5 text-sm font-bold text-danger">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={guardar} className="flex-1 rounded-sm2 bg-primary py-3.5 text-sm font-bold text-white hover:bg-primaryDark">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
