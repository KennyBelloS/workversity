import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, Check } from 'lucide-react';
import { BLOCK_TYPES, DIAS_SEMANA, COLORES_SUGERIDOS } from '../../lib/constants';
import Hoja from '../ui/Hoja';
import { Frase, Hueco, Gaveta, Opciones } from '../ui/Frase';
import { RAPIDO } from '../../lib/movimiento';

// ---------------------------------------------------------------------------------------------
// Nuevo bloque de la agenda, escrito como una frase:
//   "Los martes, Cálculo II de 8:00 a 10:00 en B-204."
// Mismos campos de siempre; lo que cambia es que se lee antes de guardarlo.
// ---------------------------------------------------------------------------------------------

const horaAMinutos = (hora) => { const [h, m] = hora.split(':').map(Number); return h * 60 + m; };
const minutosAHoraInput = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const enPalabras = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
};

/**
 * @param {object} [o.inicial] Día y horas con que arranca un bloque NUEVO: lo manda la rejilla
 *   cuando se toca un hueco vacío, para no volver a elegir lo que ya se señaló con el clic.
 */
export default function BlockModal({ bloqueExistente, inicial, onGuardar, onEliminar, onCerrar }) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('clase');
  const [dayOfWeek, setDayOfWeek] = useState(inicial?.day_of_week ?? 1);
  const [horaInicio, setHoraInicio] = useState(() => (inicial ? minutosAHoraInput(inicial.start_minutes) : '08:00'));
  const [horaFin, setHoraFin] = useState(() => (inicial ? minutosAHoraInput(inicial.end_minutes) : '09:00'));
  const [color, setColor] = useState(COLORES_SUGERIDOS[0]);
  const [error, setError] = useState('');
  const [foco, setFoco] = useState(bloqueExistente ? null : 'titulo');

  useEffect(() => {
    if (!bloqueExistente) return;
    setTitle(bloqueExistente.title);
    setLocation(bloqueExistente.location || '');
    setType(bloqueExistente.type);
    setDayOfWeek(bloqueExistente.day_of_week);
    setHoraInicio(minutosAHoraInput(bloqueExistente.start_minutes));
    setHoraFin(minutosAHoraInput(bloqueExistente.end_minutes));
    setColor(bloqueExistente.color_value);
  }, [bloqueExistente]);

  const abrir = (k) => setFoco((f) => (f === k ? null : k));
  const dia = DIAS_SEMANA[dayOfWeek - 1]; // 1 = lunes
  const duracion = Math.max(0, horaAMinutos(horaFin) - horaAMinutos(horaInicio));

  const guardar = () => {
    if (!title.trim()) { setError('Falta el nombre del bloque.'); setFoco('titulo'); return; }
    const inicio = horaAMinutos(horaInicio);
    const fin = horaAMinutos(horaFin);
    if (fin <= inicio) { setError('La hora de fin tiene que ser después del inicio.'); setFoco('horas'); return; }
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
    <Hoja
      abierta
      onCerrar={onCerrar}
      rotulo={bloqueExistente ? 'Editar bloque' : 'Nuevo bloque'}
      titulo={bloqueExistente ? 'Cambia lo que necesites' : 'Dímelo en una frase'}
      ancho="34rem"
      acciones={
        <motion.button type="button" onClick={guardar} whileTap={{ scale: 0.96 }} transition={RAPIDO} className="boton-ppal">
          <Check size={15} strokeWidth={2.2} /> Guardar
        </motion.button>
      }
    >
      <Frase>
        Los{' '}
        <Hueco campo="día" activo={foco === 'dia'} onClick={() => abrir('dia')}>{dia?.toLowerCase()}</Hueco>
        {', '}
        <Hueco campo="nombre" activo={foco === 'titulo'} vacio={!title} color={color} onClick={() => abrir('titulo')}>{title || 'qué'}</Hueco>
        {' de '}
        <Hueco campo="horario" activo={foco === 'horas'} onClick={() => abrir('horas')}>{enPalabras(horaInicio)} a {enPalabras(horaFin)}</Hueco>
        {location ? (
          <>
            {' en '}
            <Hueco campo="lugar" activo={foco === 'lugar'} onClick={() => abrir('lugar')}>{location}</Hueco>
          </>
        ) : (
          <>
            {' '}
            <Hueco campo="lugar" vacio activo={foco === 'lugar'} onClick={() => abrir('lugar')}>(sin lugar)</Hueco>
          </>
        )}.
      </Frase>

      <Frase className="frase--chica mt-3">
        Es{' '}
        <Hueco campo="tipo" activo={foco === 'tipo'} color={color} onClick={() => abrir('tipo')}>{BLOCK_TYPES[type]?.label?.toLowerCase()}</Hueco>
        {duracion > 0 ? ` · dura ${Math.floor(duracion / 60) ? `${Math.floor(duracion / 60)} h ` : ''}${duracion % 60 ? `${duracion % 60} min` : ''}`.trimEnd() : ''}
      </Frase>

      {error && <p className="mt-3 text-t-pie text-danger" role="alert">{error}</p>}

      <Gaveta clave={foco} titulo={{
        titulo: '¿Cómo se llama?',
        dia: '¿Qué día de la semana?',
        horas: '¿A qué horas?',
        lugar: '¿Dónde es?',
        tipo: '¿Qué tipo de bloque es?',
      }[foco] || ''}>
        {foco === 'titulo' && (
          <input
            data-autofoco
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setFoco('horas'); } }}
            placeholder="Cálculo II, Turno tarde, Gimnasio…"
            className="campo-frase"
          />
        )}

        {foco === 'dia' && (
          <Opciones
            aria="Día de la semana" columnas={4} valor={dayOfWeek}
            onElegir={(v) => { setDayOfWeek(v); setFoco(null); }}
            opciones={DIAS_SEMANA.map((d, i) => ({ id: i + 1, titulo: d.slice(0, 3) }))}
          />
        )}

        {foco === 'horas' && (
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="rotulo">Empieza</span>
              <input type="time" value={horaInicio} onChange={(e) => { setHoraInicio(e.target.value); setError(''); }} className="campo-frase mt-1.5" />
            </label>
            <label className="block">
              <span className="rotulo">Termina</span>
              <input type="time" value={horaFin} onChange={(e) => { setHoraFin(e.target.value); setError(''); }} className="campo-frase mt-1.5" />
            </label>
          </div>
        )}

        {foco === 'lugar' && (
          <input
            data-autofoco
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setFoco(null); } }}
            placeholder="B-204, Sede centro, Virtual…"
            className="campo-frase"
          />
        )}

        {foco === 'tipo' && (
          <>
            <Opciones
              aria="Tipo de bloque" columnas={2} valor={type}
              onElegir={(v) => { setType(v); setColor(BLOCK_TYPES[v]?.color || color); }}
              opciones={Object.entries(BLOCK_TYPES).map(([id, info]) => ({ id, titulo: info.label, color: info.color }))}
            />
            <p className="rotulo mb-2 mt-4">Color</p>
            <div className="flex flex-wrap gap-2">
              {COLORES_SUGERIDOS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-offset-[rgb(var(--surfaceAlt))]' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c, '--tw-ring-color': c }}
                />
              ))}
            </div>
          </>
        )}
      </Gaveta>

      {bloqueExistente && (
        <div className="mt-5 flex border-t border-[rgb(var(--linea)/.08)] pt-4">
          <button type="button" onClick={() => onEliminar(bloqueExistente)} className="boton-secundario ml-auto !text-danger">
            <Trash2 size={15} /> Eliminar bloque
          </button>
        </div>
      )}
    </Hoja>
  );
}
