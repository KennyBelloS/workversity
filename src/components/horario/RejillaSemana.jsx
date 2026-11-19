import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Video, MapPin, ChevronDown, Layers, X } from 'lucide-react';
import { DIAS_SEMANA } from '../../lib/constants';
import { minutosAHora } from '../../lib/dateUtils';
import { previewDeEvento } from '../../lib/preview';
import { sumarDias, mismoDia, agruparChoques, TIPOS_AGENDA } from '../../lib/agenda';
import { SUAVE, NATURAL, sinMovimiento } from '../../lib/movimiento';
import { ICONO_TIPO } from './iconosTipo';

// ---------------------------------------------------------------------------------------------
// Rejilla de la semana — SOLO computador. Tercera versión.
//
// Las dos primeras eran, en el fondo, el mismo calendario administrativo de siempre (como el de
// Google o Outlook) con mejor acabado encima. Esta versión cambia la composición, no solo el
// estilo:
//  • La altura de cada hora se adapta al rango real de la semana (menos horas visibles = filas
//    más generosas), así la pantalla nunca se ve ni absurdamente larga ni vacía.
//  • Cuando dos o más cosas chocan de verdad, ya no se reparten en carriles angostos: se agrupan
//    en una sola tarjeta "+N más" que abre el detalle completo de cada una. Ningún evento pierde
//    ancho ni legibilidad por culpa de otro.
//  • Casi no quedan líneas: el espacio en blanco separa los días, no un borde.
//  • La columna de "hoy" y el indicador de la hora actual llevan el único acento de marca de la
//    pantalla — el resto del color lo ponen las categorías.
// ---------------------------------------------------------------------------------------------

const PASO_MIN = 30; // granularidad del hueco creable, en minutos
const PX_HORA_MIN = 64;
const PX_HORA_MAX = 108;
const ALTO_OBJETIVO = 780; // alto de rejilla al que apuntamos antes de aplicar los límites

export default function RejillaSemana({ inicioSemana, eventos, onAbrir, onNuevo }) {
  const [ahora, setAhora] = useState(new Date());
  const [guia, setGuia] = useState(null); // { dia, minutos } bajo el cursor, ya ajustado al paso
  const [entDiaAbierto, setEntDiaAbierto] = useState(null);
  const [grupoAbierto, setGrupoAbierto] = useState(null); // { dia, grupo, rect }
  const quieto = sinMovimiento();

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!grupoAbierto) return undefined;
    const cerrar = (e) => { if (e.key === 'Escape') setGrupoAbierto(null); };
    window.addEventListener('keydown', cerrar);
    return () => window.removeEventListener('keydown', cerrar);
  }, [grupoAbierto]);

  // Las tareas son un vencimiento, no un bloque de tiempo: casi todas caen a las 11:59 p. m. y
  // estiraban la rejilla hasta medianoche con media pantalla vacía. Van arriba, en una fila de
  // entregas por día —como la fila de "todo el día" de cualquier calendario—, y la rejilla
  // queda solo para lo que de verdad ocupa horas.
  const { bloques, entregas } = useMemo(() => ({
    bloques: eventos.filter((e) => e.origen !== 'tarea'),
    entregas: eventos.filter((e) => e.origen === 'tarea'),
  }), [eventos]);

  // El rango se ajusta a lo que haya, con 7:00–21:00 como mínimo decente.
  const { desde, hasta, horas } = useMemo(() => {
    let d = 7;
    let h = 21;
    for (const e of bloques) {
      d = Math.min(d, e.inicio.getHours());
      h = Math.max(h, e.fin.getHours() + (e.fin.getMinutes() > 0 ? 1 : 0));
    }
    h = Math.min(24, Math.max(h, d + 6));
    const lista = [];
    for (let x = d; x < h; x++) lista.push(x);
    return { desde: d, hasta: h, horas: lista };
  }, [bloques]);

  // Menos horas visibles → filas más generosas; más horas → filas más ajustadas, sin pasar de
  // los límites de legibilidad. Así ni un día corto se ve vacío, ni uno largo ocupa kilómetros.
  const PX_HORA = useMemo(() => {
    const rango = Math.max(1, hasta - desde);
    return Math.max(PX_HORA_MIN, Math.min(PX_HORA_MAX, Math.round(ALTO_OBJETIVO / rango)));
  }, [desde, hasta]);

  const hayEntregas = entregas.length > 0;
  const alto = (hasta - desde) * PX_HORA;
  const aPx = (fecha) => (fecha.getHours() * 60 + fecha.getMinutes() - desde * 60) * (PX_HORA / 60);
  const enPantalla = ahora.getHours() >= desde && ahora.getHours() < hasta;
  const altoMinimo = Math.max(40, Math.round(PX_HORA * 0.62));

  /** Ajusta una posición Y dentro de la columna al minuto del día más cercano (paso de 30 min). */
  const minutosDesdeY = (y) => {
    const crudo = desde * 60 + (y / PX_HORA) * 60;
    return Math.max(desde * 60, Math.min(hasta * 60 - PASO_MIN, Math.round(crudo / PASO_MIN) * PASO_MIN));
  };

  const abrirGrupo = (e, dia, grupo) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setGrupoAbierto({ dia, grupo, rect });
  };

  return (
    <div className="rj">
      <div className="rj-cab">
        <span className="rj-cab-hueco" />
        {DIAS_SEMANA.map((nombre, i) => {
          const fecha = sumarDias(inicioSemana, i);
          const esHoy = mismoDia(fecha, ahora);
          const cuantos = eventos.filter((e) => e.dia === i).length;
          return (
            <div key={nombre} className="rj-dia" data-hoy={esHoy ? '1' : undefined}>
              <span className="rj-dia-n">{nombre.slice(0, 3)}</span>
              <span className="rj-dia-d">{fecha.getDate()}</span>
              <span className="rj-dia-c">{cuantos > 0 ? `${cuantos} ${cuantos === 1 ? 'cosa' : 'cosas'}` : 'libre'}</span>
            </div>
          );
        })}

        {/* Fila de entregas: un conteo por día que se expande con las tareas de ese día. */}
        {hayEntregas && (
          <>
            <span className="rj-ent-r">Entregas</span>
            {DIAS_SEMANA.map((nombre, i) => {
              const delDia = entregas.filter((e) => e.dia === i);
              const abierto = entDiaAbierto === i;
              if (delDia.length === 0) return <div key={`ent-${nombre}`} className="rj-ent" />;
              return (
                <div key={`ent-${nombre}`} className="rj-ent">
                  <button
                    type="button"
                    onClick={() => setEntDiaAbierto(abierto ? null : i)}
                    aria-expanded={abierto}
                    className={`rj-ent-b ${abierto ? 'rj-ent-b--abierto' : ''}`}
                    style={{ '--c': delDia[0].color }}
                  >
                    <span className="rj-ent-pt" aria-hidden="true" />
                    {delDia.length} {delDia.length === 1 ? 'entrega' : 'entregas'}
                    <ChevronDown size={11} strokeWidth={2.2} />
                  </button>
                  <AnimatePresence initial={false}>
                    {abierto && (
                      <motion.div
                        initial={quieto ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        animate={quieto ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                        exit={quieto ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={NATURAL}
                        className="rj-ent-lista"
                      >
                        {delDia.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => onAbrir(e)}
                            {...previewDeEvento(e)}
                            className={`rj-chip ${e.hecha ? 'rj-chip--hecha' : ''}`}
                            style={{ '--c': e.color }}
                          >
                            <Check size={10} strokeWidth={2.6} />
                            <span className="rj-chip-t">{e.titulo}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="rj-cuerpo">
        <div className="rj-horas" style={{ height: alto }}>
          {horas.map((h) => (
            <span key={h} className="rj-hora" data-fuerte={h % 3 === 0 ? '1' : undefined} style={{ top: (h - desde) * PX_HORA }}>
              {minutosAHora(h * 60)}
            </span>
          ))}
          {enPantalla && (
            <span className="rj-ahora-t" style={{ top: aPx(ahora) }}>
              {`${ahora.getHours() % 12 || 12}:${String(ahora.getMinutes()).padStart(2, '0')}`}
            </span>
          )}
        </div>

        {DIAS_SEMANA.map((nombre, i) => {
          const fecha = sumarDias(inicioSemana, i);
          const esHoy = mismoDia(fecha, ahora);
          const gruposDia = agruparChoques(bloques.filter((e) => e.dia === i));
          const guiaAqui = guia?.dia === i;
          return (
            <div
              key={nombre}
              className="rj-col"
              data-hoy={esHoy ? '1' : undefined}
              style={{ height: alto }}
              onMouseMove={onNuevo ? (ev) => {
                const y = ev.clientY - ev.currentTarget.getBoundingClientRect().top;
                setGuia({ dia: i, minutos: minutosDesdeY(y) });
              } : undefined}
              onMouseLeave={() => setGuia(null)}
              onClick={onNuevo ? () => {
                if (!guiaAqui) return;
                onNuevo(i + 1, guia.minutos);
              } : undefined}
            >
              {horas.map((h) => (
                <div key={h} className="rj-celda" data-fuerte={h % 3 === 0 ? '1' : undefined} style={{ top: (h - desde) * PX_HORA }} />
              ))}

              {onNuevo && guiaAqui && (
                <div className="rj-guia" style={{ top: (guia.minutos - desde * 60) * (PX_HORA / 60) }}>
                  <span className="rj-guia-t">+ {minutosAHora(guia.minutos)}</span>
                </div>
              )}

              {gruposDia.map((grupo) => {
                const top = Math.max(0, aPx(grupo.inicio));
                const h = Math.max((grupo.fin - grupo.inicio) / 60000 * (PX_HORA / 60), altoMinimo);

                if (grupo.eventos.length === 1) {
                  const e = grupo.eventos[0];
                  const Icono = ICONO_TIPO[e.tipo];
                  const esTarea = e.origen === 'tarea';
                  const comodo = h >= 58;
                  return (
                    <motion.button
                      key={e.id}
                      layout={quieto ? false : 'position'}
                      transition={SUAVE}
                      onClick={(ev) => { ev.stopPropagation(); onAbrir(e); }}
                      {...previewDeEvento(e)}
                      title={`${e.titulo}${e.detalle ? ' · ' + e.detalle : ''}`}
                      className={`rj-ev ${esTarea ? 'rj-ev--tarea' : ''} ${e.hecha ? 'rj-ev--hecha' : ''}`}
                      style={{ top, height: h, '--c': e.color }}
                    >
                      <span className="rj-ev-acento" aria-hidden="true" />
                      <span className="rj-ev-cuerpo">
                        <span className="rj-ev-t">
                          <Icono size={11} strokeWidth={2.3} className="rj-ev-micro shrink-0" aria-hidden="true" />
                          {e.virtual && <Video size={10} strokeWidth={2.4} className="shrink-0" />}
                          <span className="truncate">{e.titulo}</span>
                        </span>
                        {comodo && (
                          <span className="rj-ev-d">
                            {`${minutosAHora(e.inicio.getHours() * 60 + e.inicio.getMinutes())} – ${minutosAHora(e.fin.getHours() * 60 + e.fin.getMinutes())}`}
                          </span>
                        )}
                        {comodo && h >= 82 && e.detalle && (
                          <span className="rj-ev-l"><MapPin size={9} strokeWidth={2.2} /> <span className="truncate">{e.detalle}</span></span>
                        )}
                      </span>
                    </motion.button>
                  );
                }

                // Dos o más cosas chocan de verdad: una sola tarjeta "+N más" en vez de carriles
                // angostos. Nada se pierde — el detalle completo de cada una vive en el panel
                // que abre esta tarjeta.
                const colores = [...new Set(grupo.eventos.map((e) => e.color))].slice(0, 3);
                return (
                  <motion.button
                    key={`grp-${grupo.inicio.getTime()}`}
                    layout={quieto ? false : 'position'}
                    transition={SUAVE}
                    onClick={(ev) => abrirGrupo(ev, i, grupo)}
                    aria-haspopup="dialog"
                    className="rj-grp"
                    style={{ top, height: h }}
                  >
                    <span className="rj-grp-barras" aria-hidden="true">
                      {colores.map((c, k) => <i key={k} style={{ background: c }} />)}
                    </span>
                    <span className="rj-grp-cuerpo">
                      <span className="rj-grp-t">
                        <Layers size={11} strokeWidth={2.2} />
                        {grupo.eventos.length} cosas a la vez
                      </span>
                      <span className="rj-grp-d">
                        {`${minutosAHora(grupo.inicio.getHours() * 60 + grupo.inicio.getMinutes())} – ${minutosAHora(grupo.fin.getHours() * 60 + grupo.fin.getMinutes())}`}
                      </span>
                    </span>
                  </motion.button>
                );
              })}

              {esHoy && enPantalla && (
                <div className="rj-ahora" style={{ top: aPx(ahora) }} aria-hidden="true"><i /></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detalle de un choque: cada evento conserva su hora, su categoría y su acción propia. */}
      <AnimatePresence>
        {grupoAbierto && (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar"
              className="rj-grp-velo"
              onClick={() => setGrupoAbierto(null)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            />
            <motion.div
              role="dialog"
              aria-label="Eventos de este horario"
              className="rj-grp-pop"
              style={{
                top: Math.min(grupoAbierto.rect.bottom + 8, window.innerHeight - 280),
                left: Math.min(grupoAbierto.rect.left, window.innerWidth - 320),
              }}
              initial={quieto ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6 }}
              animate={quieto ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={quieto ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 }}
              transition={SUAVE}
            >
              <div className="rj-grp-pop-cab">
                <span>{grupoAbierto.grupo.eventos.length} cosas a la vez</span>
                <button type="button" onClick={() => setGrupoAbierto(null)} aria-label="Cerrar"><X size={14} /></button>
              </div>
              {grupoAbierto.grupo.eventos.map((e) => {
                const Icono = ICONO_TIPO[e.tipo];
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => { onAbrir(e); setGrupoAbierto(null); }}
                    {...previewDeEvento(e)}
                    className={`rj-grp-item ${e.hecha ? 'rj-grp-item--hecha' : ''}`}
                    style={{ '--c': e.color }}
                  >
                    <span className="rj-grp-item-ico" aria-hidden="true"><Icono size={13} strokeWidth={2.2} /></span>
                    <span className="rj-grp-item-cuerpo">
                      <span className="rj-grp-item-cab">
                        <span className="rj-grp-item-t">{e.titulo}</span>
                        <span className="rj-grp-item-tag">{TIPOS_AGENDA[e.tipo]?.label}</span>
                      </span>
                      <span className="rj-grp-item-d">
                        {minutosAHora(e.inicio.getHours() * 60 + e.inicio.getMinutes())} – {minutosAHora(e.fin.getHours() * 60 + e.fin.getMinutes())}
                        {e.detalle ? ` · ${e.detalle}` : ''}
                      </span>
                    </span>
                    {e.origen === 'tarea' && <Check size={13} strokeWidth={2.6} className="rj-grp-item-check" aria-hidden="true" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
