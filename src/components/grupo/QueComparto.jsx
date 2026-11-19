import { useState } from 'react';
import { Share2, EyeOff, Lock, CheckCircle2, CalendarPlus, ListChecks, Users2, CalendarRange } from 'lucide-react';
import PilaIsometrica from '../decoracion/PilaIsometrica';
import { ALCANCES, alcanceDe } from '../../lib/espacios';

// ---------------------------------------------------------------------------------------------
// "Qué comparto": antes era un botón de sí o no. Ahora se elige el alcance sobre una pila de
// capas en 3D — la capa elegida se enciende y las demás se apagan — y debajo se dice en palabras
// exactamente qué va a ver el grupo y qué no. El filtro se aplica antes de subir nada.
// ---------------------------------------------------------------------------------------------

const ICONOS = {
  citas: <CalendarPlus size={26} strokeWidth={1.6} />,
  tareas: <ListChecks size={26} strokeWidth={1.6} />,
  reuniones: <Users2 size={26} strokeWidth={1.6} />,
  todo: <CalendarRange size={26} strokeWidth={1.6} />,
};

/** Lo que el grupo va a ver y lo que no, dicho sin rodeos. */
const VISIBLE = {
  citas: { ve: ['Tu nombre y color en el grupo', 'Que pueden proponerte una reunión'], noVe: ['Tus clases', 'Tus turnos de trabajo', 'Tus entregas', 'Tus reuniones'] },
  tareas: { ve: ['La fecha y hora de tus entregas', 'El nombre de cada entrega'], noVe: ['Tus clases', 'Tus turnos de trabajo', 'Tus reuniones'] },
  reuniones: { ve: ['Tus reuniones y eventos', 'La hora y el lugar de cada una'], noVe: ['Tus clases', 'Tus turnos de trabajo', 'Tus entregas'] },
  todo: { ve: ['Tus clases con salón', 'Tus turnos de trabajo', 'Tus reuniones y eventos', 'Tus entregas'], noVe: ['El contenido de tus apuntes', 'Tus notas y tus finanzas'] },
};

export default function QueComparto({ alcance, compartido, actualizado, ocupado, disponible, onCompartir, onRetirar }) {
  const [eleccion, setEleccion] = useState(alcance || 'todo');
  const info = alcanceDe(eleccion);
  const cambio = compartido && eleccion !== alcance;
  const visible = VISIBLE[eleccion] || VISIBLE.todo;

  return (
    <section className="ficha">
      <div className="ficha-cabecera">
        <span className="rotulo"><Lock size={12} className="mr-1 inline" /> Qué comparto con el grupo</span>
        {compartido && <span className="franja-acc">compartiendo · {alcanceDe(alcance).titulo.toLowerCase()}</span>}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div>
          <PilaIsometrica
            capas={ALCANCES.map((x) => ({ id: x.id, titulo: x.titulo, nota: x.nota, icono: ICONOS[x.id] }))}
            activa={eleccion}
            onElegir={setEleccion}
            separacion={34}
            etiquetas={false}
          />
          <div className="mt-1 space-y-0.5" role="radiogroup" aria-label="Qué comparto">
            {ALCANCES.map((x, k) => (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={eleccion === x.id}
                onClick={() => setEleccion(x.id)}
                className={`qc-op ${eleccion === x.id ? 'qc-op--activa' : ''}`}
              >
                <span className="qc-op-n">{String(k + 1).padStart(2, '0')}</span>
                <span className="min-w-0">
                  <span className="qc-op-t block">{x.titulo}</span>
                  <span className="qc-op-p block">{x.nota}</span>
                </span>
                <CheckCircle2 size={15} className="qc-op-marca" />
              </button>
            ))}
          </div>
        </div>

        <div className="qc-detalle">
          <p className="text-t-base leading-relaxed text-textSecondary">{info.detalle}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="rotulo mb-2" style={{ '--punto': 'rgb(var(--success))' }}>El grupo ve</p>
              <ul className="space-y-1">
                {visible.ve.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-t-pie text-textSecondary">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" />{t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="rotulo mb-2" style={{ '--punto': 'rgb(var(--textSecondary))' }}>No ve</p>
              <ul className="space-y-1">
                {visible.noVe.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-t-pie text-textSecondary">
                    <EyeOff size={13} className="mt-0.5 shrink-0 opacity-50" />{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => onCompartir(eleccion)}
              disabled={ocupado || !disponible || (compartido && !cambio)}
              className="boton-ppal"
            >
              <Share2 size={15} strokeWidth={1.9} />
              {cambio ? 'Guardar el cambio' : compartido ? 'Compartiendo' : 'Empezar a compartir'}
            </button>
            {compartido && <button onClick={onRetirar} disabled={ocupado} className="boton-secundario"><EyeOff size={15} strokeWidth={1.9} /> Dejar de compartir</button>}
          </div>

          {compartido && actualizado && (
            <p className="mt-2.5 font-mono text-t-nota text-textSecondary">
              Publicado el {new Date(actualizado).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })} · vuelve a guardarlo si cambiaste tu semana
            </p>
          )}
          {!disponible && (
            <p className="mt-2.5 text-t-nota text-warning">Falta correr el SQL nuevo de la base de datos (Ajustes → Base de datos) para poder compartir.</p>
          )}
        </div>
      </div>
    </section>
  );
}
