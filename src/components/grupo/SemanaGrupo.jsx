import { useMemo, useState } from 'react';
import { Users2, CalendarPlus, MapPin, Clock } from 'lucide-react';
import { semanaDelGrupo, huecosDelGrupo, hhmm, DIAS_CORTOS, iniciales, nombreDeMiembro, alcanceDe } from '../../lib/espacios';

// ---------------------------------------------------------------------------------------------
// La semana del grupo. Cada bloque lleva encima de quién es: inicial, nombre y color de la
// persona. Las reuniones se ven distinto (fondo lleno) y dicen con quién son.
// En pantalla ancha, siete columnas; en celular, un día a la vez con su línea de tiempo.
// ---------------------------------------------------------------------------------------------

const HORA_INI = 6 * 60;
const HORA_FIN = 23 * 60;
const ALTO = 54; // píxeles por hora

function Persona({ nombre, color, inicial, tam = 20 }) {
  return (
    <span className="sg-persona" title={nombre}>
      <span className="sg-inicial" style={{ '--c': color, width: tam, height: tam }}>{inicial}</span>
      <span className="truncate">{nombre}</span>
    </span>
  );
}

function Bloque({ b, compacto }) {
  const alto = Math.max(compacto ? 40 : 30, ((b.fin - b.inicio) / 60) * ALTO);
  const arriba = ((b.inicio - HORA_INI) / 60) * ALTO;
  return (
    <div
      className={`sg-bloque ${b.esReunion ? 'sg-bloque--reunion' : ''}`}
      style={{ '--c': b.color, top: compacto ? undefined : arriba, height: compacto ? undefined : alto }}
    >
      <span className="sg-bloque-dueno">
        <span className="sg-inicial sg-inicial--chico" style={{ '--c': b.color }}>{b.iniciales}</span>
        <span className="truncate">{b.persona}</span>
      </span>
      <span className="sg-bloque-titulo">{b.titulo}</span>
      <span className="sg-bloque-meta">
        <Clock size={10} strokeWidth={2} />{hhmm(b.inicio)}–{hhmm(b.fin)}
        {b.lugar && <><MapPin size={10} strokeWidth={2} className="ml-1" />{b.lugar}</>}
      </span>
      {b.esReunion && b.con?.length > 0 && (
        <span className="sg-bloque-con">Reunión con {b.con.map((c) => c.persona.split(' ')[0]).join(', ')}</span>
      )}
    </div>
  );
}

export default function SemanaGrupo({
  miembros, perfiles, horarios, reuniones, disponible, miUserId, compartido, actualizado, onProponer,
}) {
  const hoy = (new Date().getDay() + 6) % 7;
  const [dia, setDia] = useState(hoy);
  const [soloYo, setSoloYo] = useState(null); // user_id filtrado

  const dias = useMemo(() => semanaDelGrupo({ horarios, reuniones, miembros, perfiles }), [horarios, reuniones, miembros, perfiles]);
  const filtrados = useMemo(() => dias.map((d) => (soloYo ? d.filter((b) => b.personaId === soloYo) : d)), [dias, soloYo]);
  const huecos = useMemo(() => huecosDelGrupo(dias[dia] || []), [dias, dia]);
  const quienComparte = new Set(horarios.map((h) => h.user_id));
  const alcancePorPersona = Object.fromEntries(horarios.map((h) => [h.user_id, h.alcance || 'todo']));

  return (
    <section className="sg">
      <header className="sg-cabecera">
        <div>
          <p className="rotulo">La semana del grupo</p>
          <p className="mt-1.5 text-t-micro text-textSecondary">
            {quienComparte.size === 0
              ? 'Nadie ha compartido su horario todavía.'
              : `${quienComparte.size} de ${miembros.length} compartieron su semana. Cada bloque dice de quién es.`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {onProponer && <button onClick={onProponer} className="sg-accion sg-accion--fuerte"><CalendarPlus size={14} strokeWidth={1.9} /> Proponer reunión</button>}
        </div>
      </header>

      {!disponible && (
        <p className="sg-aviso">Para compartir horarios falta ejecutar el SQL nuevo de la base de datos (Ajustes → Base de datos, o <code>supabase/schema.sql</code>).</p>
      )}
      {compartido && actualizado && (
        <p className="mt-2 text-t-nota text-textSecondary">Tu horario se compartió el {new Date(actualizado).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}. Vuelve a compartirlo si cambiaste algo.</p>
      )}

      {/* Quién es quién: la leyenda manda en toda la vista. */}
      <div className="sg-gente">
        {miembros.map((m) => {
          const nombre = nombreDeMiembro(m, perfiles);
          const activo = soloYo === m.user_id;
          return (
            <button
              key={m.user_id}
              onClick={() => setSoloYo(activo ? null : m.user_id)}
              aria-pressed={activo}
              className={`sg-chip ${activo ? 'sg-chip--activo' : ''} ${quienComparte.has(m.user_id) ? '' : 'sg-chip--sin'}`}
              style={{ '--c': m.color }}
            >
              <Persona nombre={nombre + (m.user_id === miUserId ? ' (tú)' : '')} color={m.color} inicial={iniciales(nombre)} />
              <span className="sg-chip-nota">
                {quienComparte.has(m.user_id) ? alcanceDe(alcancePorPersona[m.user_id]).nota : 'sin compartir'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Celular: un día a la vez. */}
      <div className="sg-dias" role="tablist" aria-label="Día de la semana">
        {DIAS_CORTOS.map((d, i) => (
          <button key={d} role="tab" aria-selected={dia === i} onClick={() => setDia(i)} className={`sg-dia ${dia === i ? 'sg-dia--activo' : ''}`}>
            <span>{d}</span>
            <span className="sg-dia-puntos">
              {[...new Set(filtrados[i].map((b) => b.color))].slice(0, 4).map((c) => <i key={c} style={{ background: c }} />)}
            </span>
          </button>
        ))}
      </div>

      <div className="sg-lista">
        {filtrados[dia].length === 0
          ? <p className="py-8 text-center text-t-micro text-textSecondary">Nadie tiene nada ese día.</p>
          : filtrados[dia].map((b) => <Bloque key={b.id} b={b} compacto />)}
        {filtrados[dia].length > 0 && huecos.length > 0 && (
          <p className="sg-huecos"><Users2 size={12} strokeWidth={1.9} /> Todos libres: {huecos.slice(0, 3).map((h) => `${hhmm(h.inicio)}–${hhmm(h.fin)}`).join(' · ')}</p>
        )}
      </div>

      {/* Pantalla ancha: la semana completa, con la hora a la izquierda. */}
      <div className="sg-rejilla">
        <div className="sg-horas">
          {Array.from({ length: (HORA_FIN - HORA_INI) / 60 }, (_, i) => (
            <span key={i} style={{ height: ALTO }}>{hhmm(HORA_INI + i * 60)}</span>
          ))}
        </div>
        {DIAS_CORTOS.map((d, i) => (
          <div key={d} className={`sg-columna ${i === hoy ? 'sg-columna--hoy' : ''}`}>
            <p className="sg-columna-nombre">{d}</p>
            <div className="sg-columna-pista" style={{ height: ((HORA_FIN - HORA_INI) / 60) * ALTO }}>
              {Array.from({ length: (HORA_FIN - HORA_INI) / 60 }, (_, k) => <span key={k} className="sg-raya" style={{ top: k * ALTO }} />)}
              {filtrados[i].map((b) => <Bloque key={b.id} b={b} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
