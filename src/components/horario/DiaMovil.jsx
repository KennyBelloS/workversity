import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Video, MapPin, Plus, Coffee } from 'lucide-react';
import { DIAS_SEMANA } from '../../lib/constants';
import { minutosAHora } from '../../lib/dateUtils';
import { previewDeEvento } from '../../lib/preview';
import { sumarDias, mismoDia, TIPOS_AGENDA, textoDuracion } from '../../lib/agenda';
import { enFila, hijoDeFila, RAPIDO, sinMovimiento } from '../../lib/movimiento';
import { ICONO_TIPO } from './iconosTipo';

// ---------------------------------------------------------------------------------------------
// El día en el celular — SOLO celular. Tercera versión.
//
// Ya no es la rejilla de escritorio encogida ni una línea de tiempo con horas diminutas a la
// izquierda —eso se seguía sintiendo a página web adaptada—. Ahora cada cosa del día es una
// tarjeta ancha y completa: la hora vive adentro de la tarjeta, junto al tipo y el ícono, no en
// una columna aparte que le resta ancho al título. Crear algo nuevo ya no depende de encontrar
// el botón dentro del día vacío: hay un botón flotante, como en una app nativa.
// ---------------------------------------------------------------------------------------------

const HUECO_MINIMO = 45; // minutos: por debajo de esto no vale la pena nombrarlo
const UMBRAL_DESLIZAR = 56; // px: a partir de aquí el gesto cuenta como "cambiar de día"

/** Arma la lista de la pantalla: eventos, ratos libres entre ellos y la marca de "ahora". */
function renglones(eventos, ahora, esHoy) {
  const orden = [...eventos].sort((a, b) => a.inicio - b.inicio);
  const fuera = [];
  for (let i = 0; i < orden.length; i++) {
    const e = orden[i];
    if (esHoy && e.inicio > ahora && !fuera.some((r) => r.clase === 'ahora')) {
      const antes = orden[i - 1];
      if (!antes || antes.fin <= ahora) fuera.push({ clase: 'ahora', id: 'ahora' });
    }
    fuera.push({ clase: 'ev', id: e.id, e });
    const sig = orden[i + 1];
    if (sig && e.origen !== 'tarea') {
      const libre = (sig.inicio - e.fin) / 60000;
      if (libre >= HUECO_MINIMO) fuera.push({ clase: 'libre', id: `libre-${e.id}`, ms: sig.inicio - e.fin });
    }
  }
  if (esHoy && !fuera.some((r) => r.clase === 'ahora')) fuera.push({ clase: 'ahora', id: 'ahora' });
  return fuera;
}

/** Hora sugerida para "algo nuevo" en este día: justo después de lo último, o 8 a. m. si está vacío. */
function horaSugerida(delDia) {
  if (!delDia.length) return 8 * 60;
  const finMax = Math.max(...delDia.map((e) => e.fin.getHours() * 60 + e.fin.getMinutes()));
  return Math.min(Math.ceil(finMax / 30) * 30, 21 * 60);
}

export default function DiaMovil({ inicioSemana, eventos, dia, onDia, onDesplazar, onAbrir, onToggleTarea, onNuevo }) {
  const [ahora, setAhora] = useState(new Date());
  const quieto = sinMovimiento();
  const tira = useRef(null);
  const toque = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Al cambiar de día, deja el día elegido a la vista dentro de la tira.
  useEffect(() => {
    const nodo = tira.current?.querySelector('[data-sel="1"]');
    nodo?.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  }, [dia, quieto]);

  // Deslizar horizontal sobre el cuerpo del día: cambia de día. Vertical se deja pasar para
  // que el scroll de la página siga funcionando con normalidad.
  const alEmpezar = useCallback((e) => {
    if (e.touches.length !== 1) return;
    toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const alTerminar = useCallback((e) => {
    const t0 = toque.current;
    toque.current = null;
    if (!t0 || !onDesplazar) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - t0.x;
    const dy = t.clientY - t0.y;
    if (Math.abs(dx) < UMBRAL_DESLIZAR || Math.abs(dy) > 60) return;
    onDesplazar(dx < 0 ? 1 : -1);
  }, [onDesplazar]);

  const fecha = sumarDias(inicioSemana, dia);
  const esHoy = mismoDia(fecha, ahora);
  const delDia = useMemo(() => eventos.filter((e) => e.dia === dia), [eventos, dia]);
  const lista = useMemo(() => renglones(delDia, ahora, esHoy), [delDia, ahora, esHoy]);

  return (
    <div className="dm">
      <div className="dm-tira" ref={tira}>
        {DIAS_SEMANA.map((nombre, i) => {
          const f = sumarDias(inicioSemana, i);
          const sel = dia === i;
          const hoy = mismoDia(f, ahora);
          const cuantos = eventos.filter((e) => e.dia === i).length;
          return (
            <button
              key={nombre}
              type="button"
              data-sel={sel ? '1' : undefined}
              aria-current={sel ? 'date' : undefined}
              aria-label={`${nombre} ${f.getDate()}, ${cuantos} cosas`}
              onClick={() => onDia(i)}
              className={`dm-pil ${sel ? 'dm-pil--sel' : ''} ${hoy ? 'dm-pil--hoy' : ''}`}
            >
              <span className="dm-pil-n">{nombre.slice(0, 3)}</span>
              <span className="dm-pil-d">{f.getDate()}</span>
              <span className="dm-pil-carga" data-nivel={Math.min(cuantos, 4)} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="dm-hero">
        <div className="dm-hero-fecha">
          <span className="dm-hero-num">{fecha.getDate()}</span>
          <span className="dm-hero-mes">{fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}</span>
        </div>
        <div className="dm-hero-cuerpo">
          <span className="dm-hero-etq">{esHoy ? 'Hoy' : DIAS_SEMANA[dia]}</span>
          <span className="dm-hero-cuenta">{delDia.length} {delDia.length === 1 ? 'cosa' : 'cosas'} agendadas</span>
        </div>
      </div>

      <div onTouchStart={alEmpezar} onTouchEnd={alTerminar}>
        {delDia.length === 0 ? (
          <div className="dm-vacio">
            <Coffee size={22} strokeWidth={1.6} />
            <p className="dm-vacio-t">{esHoy ? 'Hoy no tienes nada agendado' : 'Nada agendado este día'}</p>
          </div>
        ) : (
          <motion.ol
            className="dm-linea"
            initial={quieto ? false : 'initial'}
            animate="animate"
            variants={quieto ? undefined : enFila(0.045)}
          >
            {lista.map((r) => {
              if (r.clase === 'libre') {
                return (
                  <motion.li key={r.id} variants={quieto ? undefined : hijoDeFila} className="dm-libre">
                    <Coffee size={12} strokeWidth={2} />
                    <span>{textoDuracion(r.ms)} libres</span>
                  </motion.li>
                );
              }
              if (r.clase === 'ahora') {
                return (
                  <motion.li key={r.id} variants={quieto ? undefined : hijoDeFila} className="dm-ahora">
                    <span className="dm-ahora-l" aria-hidden="true"><i /></span>
                    <span className="dm-ahora-t">
                      ahora · {`${ahora.getHours() % 12 || 12}:${String(ahora.getMinutes()).padStart(2, '0')}`}
                    </span>
                  </motion.li>
                );
              }
              const e = r.e;
              const esTarea = e.origen === 'tarea';
              const Icono = ICONO_TIPO[e.tipo];
              return (
                <motion.li key={r.id} variants={quieto ? undefined : hijoDeFila} className="dm-fila">
                  <span className={`dm-unidad ${e.hecha ? 'dm-unidad--hecha' : ''}`}>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.985 }}
                      transition={RAPIDO}
                      onClick={() => onAbrir(e)}
                      {...previewDeEvento(e)}
                      className={`dm-tarj ${esTarea ? 'dm-tarj--tarea' : ''}`}
                      style={{ '--c': e.color }}
                    >
                      <span className="dm-tarj-cab">
                        <span className="dm-tarj-ico" aria-hidden="true"><Icono size={15} strokeWidth={2.2} /></span>
                        <span className="dm-tarj-tipo">
                          {TIPOS_AGENDA[e.tipo]?.uno}
                          {e.virtual && <Video size={10} strokeWidth={2.4} />}
                        </span>
                        <span className="dm-tarj-hora">
                          {minutosAHora(e.inicio.getHours() * 60 + e.inicio.getMinutes())}
                          {!esTarea && ` – ${minutosAHora(e.fin.getHours() * 60 + e.fin.getMinutes())}`}
                        </span>
                      </span>
                      <span className="dm-tarj-t">{e.titulo}</span>
                      {e.detalle && <span className="dm-tarj-d"><MapPin size={10} strokeWidth={2.2} /> {e.detalle}</span>}
                    </motion.button>
                    {esTarea && onToggleTarea && (
                      <button
                        type="button"
                        onClick={() => onToggleTarea(e.ref)}
                        aria-label={e.hecha ? 'Marcar como pendiente' : 'Completar tarea'}
                        aria-pressed={!!e.hecha}
                        className={`dm-check ${e.hecha ? 'dm-check--si' : ''}`}
                      >
                        <Check size={15} strokeWidth={2.8} />
                      </button>
                    )}
                  </span>
                </motion.li>
              );
            })}
          </motion.ol>
        )}
      </div>

      {onNuevo && (
        <motion.button
          type="button"
          onClick={() => onNuevo(dia + 1, horaSugerida(delDia))}
          whileTap={{ scale: 0.92 }}
          transition={RAPIDO}
          aria-label="Agregar algo este día"
          className="dm-fab"
        >
          <Plus size={22} strokeWidth={2.4} />
        </motion.button>
      )}
    </div>
  );
}
