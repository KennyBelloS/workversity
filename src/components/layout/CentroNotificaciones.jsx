import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Bell, X, ArrowRight, Check, Sparkles, CalendarClock, Wallet, Target, GraduationCap, RotateCcw, Lightbulb, ClipboardList, BellRing } from 'lucide-react';
import { leerTabla } from '../../offline/db';
import { useSyncEstado } from '../../hooks/useSyncEstado';
import { useAuth } from '../../context/AuthContext';
import { calcularAlertas } from '../../lib/alertas';
import { estadoPresupuesto } from '../../lib/presupuesto';
import { debeSugerirRevision, leerUltimaRevision } from '../../lib/revision';
import { actualizarInsignia, vibrar } from '../../lib/nativo';
import { estadoProgreso } from '../../lib/progresoMeta';
import { agruparNotas, leerMetaNota } from '../../lib/notas';
import { calcularHabitos, leerAprender } from '../../lib/habitos';
import { completarTarea } from '../../services/tareas';
import { mensajeAmigable } from '../../lib/erroresAmigables';
import { mostrarSnackbar } from '../../lib/snackbar';
import { formatoMinutos } from '../../lib/tiempos';

// ---------------------------------------------------------------------------------------------
// Centro de notificaciones (réplica de la referencia "Studio HQ", adaptada a Workversity):
//  1. Llega un aviso: un trazo punteado vuela hasta la campana y aparece el globo rojo.
//  2. Al tocar la campana, la campana SE CONVIERTE en la tarjeta (se expande desde ella).
//  3. La tarjeta revisa el aviso (vista previa con escaneo → sello de "listo").
//  4. "Desliza para…": se arrastra la perilla, el riel se llena y queda "Hecha" / "Abierto".
//  5. La tarjeta se recoge de vuelta en la campana y, en el Dashboard, aparece la fila del
//     aviso resuelto empujando lo demás hacia abajo.
// ---------------------------------------------------------------------------------------------

const CLAVE = 'workversity:alertas-vistas';
const leerVistas = () => { try { return new Set(JSON.parse(localStorage.getItem(CLAVE) || '[]')); } catch { return new Set(); } };

const TIPOS = {
  vencida: { icono: ClipboardList, remitente: 'Tarea vencida', accion: 'Desliza para marcar como hecha', hecho: 'Hecha' },
  pronto: { icono: ClipboardList, remitente: 'Entrega próxima', accion: 'Desliza para marcar como hecha', hecho: 'Hecha' },
  habito: { icono: Lightbulb, remitente: 'Sugerencia', accion: 'Desliza para marcar como hecha', hecho: 'Hecha' },
  evento: { icono: CalendarClock, remitente: 'Agenda', accion: 'Desliza para abrir la agenda', hecho: 'Abriendo' },
  consejo: { icono: Lightbulb, remitente: 'Asistente', accion: 'Desliza para ver el plan', hecho: 'Abriendo' },
  nota: { icono: GraduationCap, remitente: 'Notas', accion: 'Desliza para ver tus cortes', hecho: 'Abriendo' },
  presupuesto: { icono: Wallet, remitente: 'Finanzas', accion: 'Desliza para revisar', hecho: 'Abriendo' },
  meta: { icono: Target, remitente: 'Metas', accion: 'Desliza para registrar avance', hecho: 'Abriendo' },
  revision: { icono: RotateCcw, remitente: 'Revisión semanal', accion: 'Desliza para empezar', hecho: 'Abriendo' },
};

/** Las "revisiones" que la tarjeta hace antes de dejarte actuar (texto del paso 3). */
function revisiones(alerta, tarea, subtareas) {
  if (tarea) {
    const hechas = subtareas.filter((s) => s.status === 'hecha').length;
    const n = subtareas.length ? `${hechas} de ${subtareas.length} subtareas` : 'sin subtareas pendientes';
    return { revisando: 'Revisando subtareas, tiempo y prioridad', listo: `Todo listo · ${n}` };
  }
  const textos = {
    evento: ['Revisando tu agenda de hoy', 'Sin choques · enlace y lugar verificados'],
    presupuesto: ['Revisando movimientos del mes', 'Listo · proyección calculada'],
    nota: ['Revisando cortes y porcentajes', 'Listo · nota necesaria calculada'],
    meta: ['Revisando tu ritmo de avance', 'Listo · meta diaria recalculada'],
    revision: ['Revisando lo pendiente de la semana', 'Listo · semana lista para cerrar'],
    consejo: ['Revisando las próximas 48 horas', 'Listo · plan sugerido preparado'],
  }[alerta.tipo] || ['Revisando el aviso', 'Listo'];
  return { revisando: textos[0], listo: textos[1] };
}

/** Perilla "desliza para…". Se puede arrastrar o, con teclado, activar con Enter / espacio. */
function Deslizador({ texto, textoHecho, onCompletar, habilitado }) {
  const riel = useRef(null);
  const [x, setX] = useState(0);
  const [estado, setEstado] = useState('libre'); // libre | arrastrando | hecho
  const maxRef = useRef(1);

  const completar = () => { setEstado('hecho'); setX(maxRef.current); vibrar(18); onCompletar(); };
  const alPresionar = (e) => {
    if (!habilitado || estado === 'hecho') return;
    const r = riel.current.getBoundingClientRect();
    const tam = 40;
    maxRef.current = r.width - tam - 8;
    const inicio = e.clientX - x;
    setEstado('arrastrando');
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const mover = (ev) => setX(Math.max(0, Math.min(maxRef.current, ev.clientX - inicio)));
    const soltar = (ev) => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      const final = Math.max(0, Math.min(maxRef.current, ev.clientX - inicio));
      if (final >= maxRef.current * 0.82) completar();
      else { setEstado('libre'); setX(0); }
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  };
  const progreso = maxRef.current ? x / maxRef.current : 0;
  const hecho = estado === 'hecho';
  return (
    <div ref={riel} className={`nt-riel ${hecho ? 'nt-riel--hecho' : ''} ${!habilitado ? 'nt-riel--espera' : ''}`}>
      <div className="nt-relleno" style={{ width: hecho ? '100%' : `${x + 44}px`, opacity: hecho ? 1 : Math.min(1, progreso * 2.2), transition: estado === 'arrastrando' ? 'none' : undefined }} />
      <span className="nt-riel-texto" style={{ opacity: hecho ? 0 : 1 - progreso * 1.4 }}>{texto}</span>
      <span className="nt-riel-hecho" style={{ opacity: hecho ? 1 : 0 }}>{textoHecho}</span>
      <button
        type="button"
        aria-label={texto}
        disabled={!habilitado || hecho}
        onPointerDown={alPresionar}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && habilitado && !hecho) { e.preventDefault(); completar(); } }}
        className={`nt-perilla ${estado === 'arrastrando' ? 'nt-perilla--viva' : ''}`}
        style={{ transform: `translateX(${x}px)`, transition: estado === 'arrastrando' ? 'none' : undefined }}
      >
        {hecho ? <Check size={16} strokeWidth={2.6} /> : estado === 'arrastrando' ? <span className="nt-yema" /> : <ArrowRight size={16} strokeWidth={2} />}
      </button>
    </div>
  );
}

/** Vista previa: documento sobre trama de puntos con un barrido de escaneo; luego, sello de listo. */
function VistaPrevia({ listo, color }) {
  return (
    <div className={`nt-previa ${listo ? 'nt-previa--lista' : ''}`}>
      <div className="nt-trama" aria-hidden="true" />
      <div className="nt-doc" aria-hidden="true">
        <span className="nt-doc-titulo" style={{ background: listo ? color : undefined }} />
        <span className="nt-doc-linea" style={{ width: '82%' }} />
        <span className="nt-doc-linea" style={{ width: '68%' }} />
        <span className="nt-doc-linea" style={{ width: '74%' }} />
        <span className="nt-doc-bloque" />
        <span className="nt-doc-linea" style={{ width: '58%' }} />
        {!listo && <span className="nt-barrido" />}
      </div>
      {listo && (
        <div className="nt-sello" aria-hidden="true">
          <svg viewBox="0 0 100 100" className="nt-sello-anillo"><circle cx="50" cy="50" r="46" fill="none" strokeWidth="1.6" strokeDasharray="3 5" /></svg>
          <span className="nt-sello-disco" style={{ background: color }}><Check size={22} strokeWidth={3} /></span>
        </div>
      )}
    </div>
  );
}

export default function CentroNotificaciones() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { version } = useSyncEstado();
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [datos, setDatos] = useState({ tareas: [], materias: [], bloques: [], evaluaciones: [], cortes: [], sesiones: [], energia: [], movimientos: [], presupuestos: [], metas: [], avances: [] });
  const [ahora, setAhora] = useState(new Date());
  const [vistas, setVistas] = useState(leerVistas);
  const [elegidaId, setElegidaId] = useState(null);
  const [fase, setFase] = useState('revisando'); // revisando | listo | hecho
  const [trazo, setTrazo] = useState(0); // contador: cada cambio dispara el trazo hacia la campana
  const [globo, setGlobo] = useState(false);
  const campana = useRef(null);
  const panel = useRef(null);
  const previasNuevas = useRef(null);

  const cargar = useCallback(async () => {
    const [tareas, materias, bloques, evaluaciones, cortes, sesiones, energia, movimientos, presupuestos, metas, avances] = await Promise.all(['tareas', 'materias', 'bloques_horario', 'evaluaciones', 'cortes_notas', 'sesiones_pomodoro', 'registros_energia', 'movimientos', 'presupuestos_mensuales', 'metas', 'avances_meta'].map((t) => leerTabla(t)));
    setDatos({ tareas, materias, bloques, evaluaciones, cortes, sesiones, energia, movimientos, presupuestos, metas, avances });
    setAhora(new Date());
  }, []);
  useEffect(() => { cargar(); }, [version, cargar]);
  useEffect(() => { const t = setInterval(cargar, 60000); return () => clearInterval(t); }, [cargar]);

  const alertas = useMemo(
    () => calcularAlertas({ ahora, tareas: datos.tareas, materias: datos.materias, bloques: datos.bloques, notas: agruparNotas({ materias: datos.materias, evaluaciones: datos.evaluaciones, cortes: datos.cortes, meta: leerMetaNota() }), habitos: leerAprender() ? calcularHabitos({ tareas: datos.tareas, sesiones: datos.sesiones, energia: datos.energia, materias: datos.materias }) : null, presupuesto: estadoPresupuesto({ ahora, movimientos: datos.movimientos, presupuestos: datos.presupuestos }), sugerirRevision: debeSugerirRevision(ahora, leerUltimaRevision()), metasProgreso: datos.metas.filter((m) => m.tipo === 'progreso').map((m) => ({ meta: m, e: estadoProgreso({ meta: m, avances: datos.avances.filter((a) => a.meta_id === m.id), ahora }) })) }),
    [ahora, datos],
  );
  const nuevas = alertas.filter((a) => !vistas.has(a.id));

  // Llegan avisos nuevos → trazo punteado hacia la campana y luego el globo.
  useEffect(() => {
    const n = nuevas.length;
    if (previasNuevas.current === null) {
      previasNuevas.current = n;
      if (n > 0) { const t = setTimeout(() => setTrazo((v) => v + 1), 1400); return () => clearTimeout(t); }
      return undefined;
    }
    if (n > previasNuevas.current) setTrazo((v) => v + 1);
    if (n === 0) setGlobo(false);
    previasNuevas.current = n;
    return undefined;
  }, [nuevas.length]);
  useEffect(() => {
    if (!trazo) return undefined;
    setGlobo(false);
    const t = setTimeout(() => setGlobo(true), 780);
    return () => clearTimeout(t);
  }, [trazo]);

  useEffect(() => {
    const fin = new Date(ahora); fin.setHours(23, 59, 59, 999);
    actualizarInsignia(datos.tareas.filter((t) => t.status !== 'hecha' && new Date(t.due_date) <= fin).length);
  }, [datos, ahora]);

  const guardarVistas = (ids) => {
    const todas = new Set([...vistas, ...ids]);
    setVistas(todas);
    try { localStorage.setItem(CLAVE, JSON.stringify([...todas].slice(-300))); } catch { /* nada */ }
  };

  const elegida = alertas.find((a) => a.id === elegidaId) || nuevas.find((a) => a.tareaId) || nuevas[0] || alertas[0] || null;
  const tarea = elegida?.tareaId ? datos.tareas.find((t) => t.id === elegida.tareaId) : null;
  const subtareas = tarea ? datos.tareas.filter((t) => t.parent_task_id === tarea.id) : [];
  const materia = tarea?.materia_id ? datos.materias.find((m) => m.id === tarea.materia_id) : null;
  const otras = alertas.filter((a) => a.id !== elegida?.id);

  // Cada vez que se abre o se cambia de aviso: primero revisa, luego queda listo.
  useEffect(() => {
    if (!abierto || !elegida) return undefined;
    setFase('revisando');
    const t = setTimeout(() => setFase('listo'), 1700);
    return () => clearTimeout(t);
  }, [abierto, elegida?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Posición de la campana (para que la tarjeta nazca exactamente de ella).
  const [origen, setOrigen] = useState({ x: 0, y: 0 });
  useLayoutEffect(() => {
    if (!abierto || !campana.current || !panel.current) return;
    const b = campana.current.getBoundingClientRect();
    const p = panel.current.getBoundingClientRect();
    setOrigen({ x: b.left + b.width / 2 - p.left, y: b.top + b.height / 2 - p.top });
  }, [abierto]);

  const cerrar = useCallback(() => {
    setCerrando(true);
    setTimeout(() => { setAbierto(false); setCerrando(false); setElegidaId(null); }, 430);
  }, []);
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (panel.current && !panel.current.contains(e.target) && !campana.current.contains(e.target)) cerrar(); };
    const esc = (e) => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', esc); };
  }, [abierto, cerrar]);

  const actuar = async () => {
    if (!elegida) return;
    setFase('hecho');
    guardarVistas([elegida.id]);
    const info = TIPOS[elegida.tipo] || TIPOS.consejo;
    try {
      if (tarea && tarea.status !== 'hecha') {
        await completarTarea(tarea, usuario.id, 'hecha');
        window.dispatchEvent(new CustomEvent('workversity:aviso-resuelto', { detail: { titulo: tarea.title, detalle: `Hecha · ${new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}`, etiqueta: materia?.nombre || (tarea.category === 'trabajo' ? 'Trabajo' : 'Universidad'), color: materia?.color_value } }));
        setTimeout(cerrar, 1100);
      } else {
        window.dispatchEvent(new CustomEvent('workversity:aviso-resuelto', { detail: { titulo: elegida.titulo, detalle: `${info.remitente} · revisado`, etiqueta: info.remitente } }));
        setTimeout(() => { cerrar(); navigate(elegida.url); }, 750);
      }
    } catch (err) {
      mostrarSnackbar({ texto: mensajeAmigable(err, 'completar la tarea') });
      setFase('listo');
    }
  };

  const permiso = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  const info = elegida ? (TIPOS[elegida.tipo] || TIPOS.consejo) : null;
  const IconoTipo = info?.icono || Bell;
  const color = materia?.color_value || 'rgb(var(--coral))';
  const textos = elegida ? revisiones(elegida, tarea, subtareas) : null;
  const titulo = tarea ? tarea.title : elegida?.titulo.replace(/^(Vencida|Vence en [^:]+|Ahora|Empieza hoy): /, '');
  const meta = tarea
    ? [tarea.priority === 'alta' ? 'Prioridad alta' : tarea.priority === 'baja' ? 'Prioridad baja' : 'Prioridad media', tarea.estimated_minutes ? formatoMinutos(tarea.estimated_minutes) : null, `Vence ${new Date(tarea.due_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '')}`].filter(Boolean)
    : [elegida?.detalle].filter(Boolean);
  const cuando = elegida?.titulo.match(/^(Vence en [^:]+|Vencida|Ahora)/)?.[0] || 'ahora';

  return (
    <div className="relative">
      <button
        ref={campana}
        onClick={() => (abierto ? cerrar() : setAbierto(true))}
        aria-label={`Notificaciones${nuevas.length ? `: ${nuevas.length} nuevas` : ''}`}
        aria-expanded={abierto}
        className={`nt-campana ${abierto ? 'nt-campana--abierta' : ''}`}
      >
        <Bell size={18} strokeWidth={1.8} className={trazo ? 'nt-timbre' : ''} key={trazo} />
        {nuevas.length > 0 && globo && <span className="nt-globo" key={`g${trazo}`}>{nuevas.length > 9 ? '9+' : nuevas.length}</span>}
        {trazo > 0 && (
          <svg key={`t${trazo}`} className="nt-trazo" viewBox="0 0 120 60" aria-hidden="true">
            <path d="M4 6 C 40 2, 78 10, 104 40" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="0.1 6" pathLength="100" />
            <path d="M96 34 L105 42 L107 30" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="nt-trazo-punta" />
          </svg>
        )}
      </button>

      {abierto && createPortal(
        <div
          ref={panel}
          role="dialog"
          aria-label="Notificaciones"
          className={`nt-panel ${cerrando ? 'nt-panel--cerrando' : ''}`}
          style={{ '--ox': `${origen.x}px`, '--oy': `${origen.y}px` }}
        >
          {!elegida ? (
            <div className="nt-vacio">
              <span className="nt-avatar" style={{ background: 'rgb(var(--success))' }}><Check size={16} strokeWidth={2.4} /></span>
              <p className="mt-4 text-t-grande font-semibold tracking-tight">Todo al día.</p>
              <p className="mt-1 text-t-pie text-textSecondary">No hay nada urgente ni próximo. Te avisamos aquí cuando llegue algo.</p>
            </div>
          ) : (
            <div className="nt-tarjeta" key={elegida.id}>
              <div className="nt-cabecera nt-entra" style={{ '--i': 0 }}>
                <span className="nt-avatar" style={{ background: tarea ? color : 'rgb(var(--coral))' }}><IconoTipo size={15} strokeWidth={2} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-t-pie font-semibold">{materia?.nombre || info.remitente}</span>
                  <span className="block truncate text-t-micro text-textSecondary">{tarea ? info.remitente : 'Aviso'} · {cuando.toLowerCase()}</span>
                </span>
                <button onClick={cerrar} aria-label="Cerrar" className="nt-cerrar"><X size={14} strokeWidth={2} /></button>
              </div>
              <p className="nt-titulo nt-entra" style={{ '--i': 1 }}>{titulo}</p>
              <p className="nt-meta nt-entra" style={{ '--i': 2 }}>{meta.map((m, i) => <span key={m}>{i > 0 && <span className="mx-1.5 opacity-50">·</span>}{m}</span>)}</p>
              <div className="nt-entra" style={{ '--i': 3 }}><VistaPrevia listo={fase !== 'revisando'} color={tarea ? color : 'rgb(var(--coral))'} /></div>
              <p className="nt-estado nt-entra" style={{ '--i': 4 }}>
                {fase === 'revisando'
                  ? <><Sparkles size={13} className="text-coral" /> <span className="nt-brillo">{textos.revisando}</span></>
                  : fase === 'listo'
                    ? <><span className="nt-ok"><Check size={10} strokeWidth={3} /></span> {textos.listo}</>
                    : <><span className="nt-ok"><Check size={10} strokeWidth={3} /></span> {tarea ? 'Listo · tu progreso se actualizó' : 'Listo · abriendo'}</>}
              </p>
              <div className="nt-entra" style={{ '--i': 5 }}>
                <Deslizador key={elegida.id} texto={tarea && tarea.status !== 'hecha' ? info.accion : TIPOS[elegida.tipo === 'vencida' || elegida.tipo === 'pronto' ? 'evento' : elegida.tipo]?.accion || 'Desliza para abrir'} textoHecho={tarea ? info.hecho : 'Abriendo'} habilitado={fase === 'listo'} onCompletar={actuar} />
              </div>

              {otras.length > 0 && (
                <div className="nt-otras nt-entra" style={{ '--i': 6 }}>
                  <p className="mb-1.5 text-t-micro text-textSecondary">Otras {otras.length} notificaci{otras.length === 1 ? 'ón' : 'ones'}</p>
                  <ul>
                    {otras.slice(0, 5).map((a) => (
                      <li key={a.id}>
                        <button onClick={() => setElegidaId(a.id)} className={`nt-fila ${vistas.has(a.id) ? 'opacity-60' : ''}`}>
                          <span className="nt-punto" style={{ background: a.nivel === 'alta' ? 'rgb(var(--coral))' : a.nivel === 'media' ? 'rgb(var(--warning))' : 'rgb(var(--primary))' }} />
                          <span className="min-w-0 flex-1 truncate">{a.titulo}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {permiso !== 'granted' && permiso !== 'unsupported' && (
                <button onClick={() => { cerrar(); navigate('/configuracion'); }} className="nt-permiso nt-entra" style={{ '--i': 7 }}>
                  <BellRing size={13} /> Activa los avisos para recibirlos con la app cerrada
                </button>
              )}
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
