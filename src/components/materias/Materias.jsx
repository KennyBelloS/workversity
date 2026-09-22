import { useEffect, useState } from 'react';
import { propsPreview } from '../../lib/preview';
import { useEscape } from '../../hooks/useEscape';
import { X, Trash2, User, MapPin, Hash, Video } from 'lucide-react';
import { DIAS_SEMANA, COLORES_SUGERIDOS, PRIORITIES } from '../../lib/constants';
import { minutosAHora } from '../../lib/dateUtils';

export function MateriaCard({ materia, onClick }) {
  const vp = propsPreview('clase', materia.id);
  const prioridad = PRIORITIES[materia.prioridad];
  return (
    <button
      onClick={onClick}
      {...vp}
      className="w-full rounded-md2 bg-white p-4 text-left shadow-card transition hover:shadow-md"
      style={{ borderLeft: `4px solid ${materia.color_value}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-textPrimary">{materia.nombre}</p>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${prioridad.color}1F`, color: prioridad.color }}>
          {prioridad.label}
        </span>
      </div>
      <p className="mt-1 text-xs font-semibold text-textSecondary">
        {DIAS_SEMANA[materia.day_of_week - 1]} · {minutosAHora(materia.start_minutes)} – {minutosAHora(materia.end_minutes)}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-textSecondary">
        {materia.profesor && <span className="flex items-center gap-1"><User size={12} />{materia.profesor}</span>}
        {materia.es_virtual && <span className="flex items-center gap-1 font-bold text-info"><Video size={12} />Virtual</span>}
        {materia.salon && <span className="flex items-center gap-1"><MapPin size={12} />{materia.salon}</span>}
        {materia.nrc && <span className="flex items-center gap-1"><Hash size={12} />{materia.nrc}</span>}
      </div>
    </button>
  );
}

function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}
function minutosAHoraInput(min) {
  return `${Math.floor(min / 60).toString().padStart(2, '0')}:${(min % 60).toString().padStart(2, '0')}`;
}

export function MateriaModal({ materiaExistente, onGuardar, onEliminar, onCerrar }) {
  useEscape(onCerrar);
  const [nombre, setNombre] = useState('');
  const [profesor, setProfesor] = useState('');
  const [salon, setSalon] = useState('');
  const [nrc, setNrc] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('09:00');
  const [color, setColor] = useState(COLORES_SUGERIDOS[0]);
  const [prioridad, setPrioridad] = useState('media');
  const [tieneRecordatorio, setTieneRecordatorio] = useState(true);
  const [esVirtual, setEsVirtual] = useState(false);
  const [enlace, setEnlace] = useState('');
  const [minutosAntes, setMinutosAntes] = useState(60);
  const [error, setError] = useState('');

  useEffect(() => {
    if (materiaExistente) {
      setNombre(materiaExistente.nombre);
      setProfesor(materiaExistente.profesor || '');
      setSalon(materiaExistente.salon || '');
      setNrc(materiaExistente.nrc || '');
      setDayOfWeek(materiaExistente.day_of_week);
      setHoraInicio(minutosAHoraInput(materiaExistente.start_minutes));
      setHoraFin(minutosAHoraInput(materiaExistente.end_minutes));
      setColor(materiaExistente.color_value);
      setPrioridad(materiaExistente.prioridad);
      setTieneRecordatorio(materiaExistente.tiene_recordatorio);
      setEsVirtual(!!materiaExistente.es_virtual);
      setEnlace(materiaExistente.enlace_virtual || '');
      setMinutosAntes(materiaExistente.recordatorio_minutos_antes || 60);
    }
  }, [materiaExistente]);

  const guardar = () => {
    if (!nombre.trim()) return setError('Escribe el nombre de la materia');
    const inicio = horaAMinutos(horaInicio);
    const fin = horaAMinutos(horaFin);
    if (fin <= inicio) return setError('La hora de fin debe ser después del inicio');

    onGuardar({
      ...(materiaExistente || {}),
      nombre: nombre.trim(),
      profesor: profesor.trim(),
      salon: esVirtual ? '' : salon.trim(),
      es_virtual: esVirtual,
      enlace_virtual: esVirtual ? enlace.trim() : '',
      nrc: nrc.trim(),
      day_of_week: dayOfWeek,
      start_minutes: inicio,
      end_minutes: fin,
      color_value: color,
      prioridad,
      tiene_recordatorio: tieneRecordatorio,
      recordatorio_minutos_antes: minutosAntes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-lg2 bg-bg sm:rounded-lg2">
        <div className="sticky top-0 flex items-center justify-between bg-bg px-5 py-4">
          <h2 className="text-lg font-extrabold">{materiaExistente ? 'Editar materia' : 'Nueva materia'}</h2>
          <button onClick={onCerrar} className="rounded-full p-1.5 hover:bg-black/5"><X size={20} /></button>
        </div>

        <div className="space-y-3 px-5 pb-8">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la materia" className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none focus:ring-2 focus:ring-primary" />
          {error && <p className="text-xs font-semibold text-danger">{error}</p>}
          <input value={profesor} onChange={(e) => setProfesor(e.target.value)} placeholder="Profesor (opcional)" className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none" />
          <label className="flex items-center justify-between rounded-sm2 bg-white px-4 py-3 shadow-card">
            <span className="flex items-center gap-2 text-sm font-semibold"><Video size={16} className="text-info" /> Materia virtual</span>
            <input
              type="checkbox"
              checked={esVirtual}
              onChange={(e) => setEsVirtual(e.target.checked)}
              className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-black/15 transition checked:bg-primary relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition checked:before:translate-x-4"
            />
          </label>
          {esVirtual ? (
            <div className="flex gap-3">
              <input value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="Enlace de la clase (Meet, Zoom, Teams…)" className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none" />
              <input value={nrc} onChange={(e) => setNrc(e.target.value)} placeholder="NRC" className="w-28 rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none" />
            </div>
          ) : (
            <div className="flex gap-3">
              <input value={salon} onChange={(e) => setSalon(e.target.value)} placeholder="Salón" className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none" />
              <input value={nrc} onChange={(e) => setNrc(e.target.value)} placeholder="NRC" className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none" />
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold text-textSecondary">Día</p>
            <div className="flex flex-wrap gap-1.5">
              {DIAS_SEMANA.map((d, i) => (
                <button key={d} onClick={() => setDayOfWeek(i + 1)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${dayOfWeek === i + 1 ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}>
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
            <p className="mb-1.5 text-xs font-semibold text-textSecondary">Prioridad</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PRIORITIES).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setPrioridad(key)}
                  className="rounded-sm2 border py-2.5 text-xs font-bold"
                  style={{ borderColor: prioridad === key ? info.color : 'rgba(0,0,0,0.08)', backgroundColor: prioridad === key ? `${info.color}24` : 'transparent', color: prioridad === key ? info.color : '#6E7180' }}
                >
                  {info.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-textSecondary">Color</p>
            <div className="flex gap-2">
              {COLORES_SUGERIDOS.map((c) => (
                <button key={c} onClick={() => setColor(c)} className="h-8 w-8 rounded-full" style={{ backgroundColor: c, outline: color === c ? `2.5px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between rounded-sm2 bg-white px-4 py-3 shadow-card">
            <span className="text-sm font-semibold">Recordarme antes de esta clase</span>
            <input
              type="checkbox"
              checked={tieneRecordatorio}
              onChange={(e) => setTieneRecordatorio(e.target.checked)}
              className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-black/15 transition checked:bg-primary relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition checked:before:translate-x-4"
            />
          </label>
          {tieneRecordatorio && (
            <select value={minutosAntes} onChange={(e) => setMinutosAntes(Number(e.target.value))} className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none">
              {[[15, '15 minutos antes'], [30, '30 minutos antes'], [60, '1 hora antes'], [120, '2 horas antes'], [1440, '1 día antes']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          )}

          <div className="flex gap-3 pt-1">
            {materiaExistente && (
              <button onClick={() => onEliminar(materiaExistente)} className="flex items-center justify-center gap-2 rounded-sm2 border border-danger/30 px-4 py-3.5 text-sm font-bold text-danger">
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
