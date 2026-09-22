import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Clock, MapPin, Video, User, Hash, CalendarPlus, ArrowRight, Repeat, Timer, Lightbulb, ExternalLink, CalendarClock, GraduationCap, ListChecks } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEscape } from '../../hooks/useEscape';
import { leerTabla } from '../../offline/db';
import { notificarCambioLocal } from '../../offline/sync';
import { completarTarea, actualizarTarea } from '../../services/tareas';
import { PRIORITIES, DIAS_SEMANA, etiquetaRecurrencia } from '../../lib/constants';
import { formatearFechaHora, minutosAHora } from '../../lib/dateUtils';
import { agruparNotas, etiquetaMateria } from '../../lib/notas';
import { reprogramar } from '../../lib/revision';
import { cuentaAtras, colorUrgencia, fraccionTiempo, proximasSesiones, sugerirHueco } from '../../lib/preview';
import { enlaceGoogle } from '../../../supabase/functions/_shared/ics.js';
import AnilloTiempo from './AnilloTiempo';

const TABLAS = ['tareas', 'materias', 'bloques_horario', 'evaluaciones', 'cortes_notas'];
const hora = (f) => minutosAHora(f.getHours() * 60 + f.getMinutes());
const diaHora = (f, ahora) => {
  const mismo = f.toDateString() === ahora.toDateString();
  const man = new Date(ahora); man.setDate(man.getDate() + 1);
  return `${mismo ? 'Hoy' : f.toDateString() === man.toDateString() ? 'Mañana' : f.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })} · ${hora(f)}`;
};
const Fila = ({ icono: Icono, children }) => <p className="flex items-start gap-2 text-xs"><Icono size={13} className="mt-0.5 shrink-0 text-textSecondary" /><span className="min-w-0">{children}</span></p>;

// ------------------------------------------------------------------ Tarea
function PreviewTarea({ tarea, datos, ahora, acciones }) {
  const due = new Date(tarea.due_date);
  const ms = due - ahora;
  const hecha = tarea.status === 'hecha';
  const color = colorUrgencia(ms, hecha);
  const cd = cuentaAtras(ms);
  const prioridad = PRIORITIES[tarea.priority];
  const materia = datos.materias.find((m) => m.id === tarea.materia_id);
  const subs = datos.tareas.filter((t) => t.parent_task_id === tarea.id);
  const subsOk = subs.filter((s) => s.status === 'hecha').length;
  const minuto = Math.floor(ahora.getTime() / 60000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hueco = useMemo(() => sugerirHueco(tarea, { ahora, materias: datos.materias, bloques: datos.bloques }), [tarea, datos, minuto]);
  const fila = materia ? agruparNotas({ materias: datos.materias, evaluaciones: datos.evaluaciones, cortes: datos.cortes, meta: 3 }).find((f) => f.materia.nombre === materia.nombre) : null;
  const sesion = materia ? proximasSesiones({ ahora, materias: datos.materias, nombre: materia.nombre, n: 1 })[0] : null;
  const holgura = tarea.estimated_minutes && !hecha && ms > 0 ? ms / 60000 / tarea.estimated_minutes : null;
  const fotos = (tarea.photo_paths || []).slice(0, 3);
  const etiquetaNota = fila?.m.hayDatos ? etiquetaMateria(fila.m) : null;

  return (
    <div>
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AnilloTiempo fraccion={hecha ? 1 : fraccionTiempo(tarea, ahora)} color={color}>{hecha ? '✅' : tarea.priority === 'alta' ? '🔥' : tarea.priority === 'media' ? '⏰' : '🌿'}</AnilloTiempo>
          <div className="min-w-0 flex-1">
            <p className={`text-[15px] font-extrabold leading-snug ${hecha ? 'text-textSecondary line-through' : ''}`}>{tarea.title}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {materia && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${materia.color_value}22`, color: materia.color_value }}>{materia.nombre}</span>}
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${prioridad.color}1F`, color: prioridad.color }}>{prioridad.label}</span>
              {tarea.is_recurring && <span className="flex items-center gap-1 rounded-full bg-infoSoft px-2 py-0.5 text-[10px] font-bold text-info"><Repeat size={10} /> {etiquetaRecurrencia(tarea.recurrence_interval_days)}</span>}
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-sm2 px-3 py-2.5" style={{ backgroundColor: `${color}14` }}>
          <p className="text-[11px] font-bold" style={{ color }}>{hecha ? 'Completada' : cd.vencida ? 'Venció hace' : 'Faltan'}</p>
          <p className="text-2xl font-extrabold tabular-nums leading-tight" style={{ color }}>{hecha ? (tarea.completed_at ? formatearFechaHora(tarea.completed_at) : '¡Lista!') : cd.texto}</p>
          <p className="text-[11px] text-textSecondary">Entrega: {formatearFechaHora(tarea.due_date)}</p>
        </div>

        <div className="mt-3 space-y-1.5">
          {tarea.description && <p className="line-clamp-2 text-xs text-textSecondary">{tarea.description}</p>}
          {tarea.estimated_minutes > 0 && <Fila icono={Timer}>Necesitas ~{tarea.estimated_minutes} min de trabajo{holgura != null && <b className={holgura < 5 ? ' text-danger' : holgura < 20 ? ' text-warning' : ' text-success'}> · {holgura < 5 ? 'tiempo ajustado ⚠️' : holgura < 20 ? 'tiempo suficiente' : 'vas holgado'}</b>}</Fila>}
          {hueco && <Fila icono={Lightbulb}>Te sugiero hacerla <b>{hueco.cuando} de {hora(hueco.inicio)} a {hora(hueco.fin)}</b> (hueco libre en tu agenda)</Fila>}
          {sesion && <Fila icono={CalendarClock}>Próxima clase de {materia.nombre}: <b>{diaHora(sesion.inicio, ahora)}</b></Fila>}
          {etiquetaNota && <Fila icono={GraduationCap}>Tu nota en {materia.nombre}: <b style={{ color: etiquetaNota.color }}>{(fila.m.final ?? fila.m.promedioActual ?? fila.m.acumulado).toFixed(2)} · {etiquetaNota.texto}</b></Fila>}
        </div>

        {subs.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] font-bold"><span className="flex items-center gap-1"><ListChecks size={12} /> Sub-tareas</span><span className="text-textSecondary">{subsOk}/{subs.length}</span></div>
            <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${(subsOk / subs.length) * 100}%` }} /></div>
            <ul className="space-y-0.5">{subs.slice(0, 4).map((s) => <li key={s.id} className={`truncate text-[11px] ${s.status === 'hecha' ? 'text-textSecondary line-through' : ''}`}>{s.status === 'hecha' ? '✓' : '○'} {s.title}</li>)}</ul>
          </div>
        )}
        {fotos.length > 0 && <div className="mt-3 flex gap-1.5">{fotos.map((f, i) => <img key={i} src={f} alt="" className="h-14 w-14 rounded-sm2 object-cover" />)}</div>}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {!hecha && <button onClick={acciones.completar} className="flex items-center justify-center gap-1.5 rounded-sm2 bg-success py-2 text-xs font-extrabold text-white"><Check size={14} /> Completar</button>}
          {!hecha && <button onClick={acciones.posponer} className="rounded-sm2 border border-black/10 py-2 text-xs font-bold text-textSecondary">Posponer 1 día</button>}
          <button onClick={acciones.abrir} className="flex items-center justify-center gap-1.5 rounded-sm2 border border-primary/30 py-2 text-xs font-bold text-primary">Abrir <ArrowRight size={13} /></button>
          {!hecha && <button onClick={acciones.enfoque} className="rounded-sm2 border border-black/10 py-2 text-xs font-bold text-textSecondary">⏱️ Enfocarme</button>}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Clase o bloque (trabajo, reunión…)
function PreviewClase({ item, esBloque, datos, ahora, acciones }) {
  const color = item.color_value || '#5B8DEF';
  const nombre = esBloque ? item.title : item.nombre;
  const filasDeLaMateria = esBloque ? [] : datos.materias.filter((m) => m.nombre === nombre);
  const ids = new Set(filasDeLaMateria.map((m) => m.id));
  const proximas = proximasSesiones({ ahora, materias: datos.materias, bloques: datos.bloques, nombre: esBloque ? null : nombre, bloqueId: esBloque ? item.id : null, n: 3 });
  const actual = proximas[0];
  const enCurso = actual && actual.inicio <= ahora && ahora < actual.fin;
  const avance = enCurso ? (ahora - actual.inicio) / (actual.fin - actual.inicio) : 0;
  const pendientes = esBloque ? [] : datos.tareas.filter((t) => ids.has(t.materia_id) && t.status !== 'hecha').sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 3);
  const fila = esBloque ? null : agruparNotas({ materias: datos.materias, evaluaciones: datos.evaluaciones, cortes: datos.cortes, meta: 3 }).find((f) => f.materia.nombre === nombre);
  const etiquetaNota = fila?.m.hayDatos ? etiquetaMateria(fila.m) : null;
  const virtual = !esBloque && item.es_virtual;
  const emoji = esBloque ? (item.type === 'reunion' ? '🤝' : item.type === 'trabajo' ? '💼' : '📌') : virtual ? '💻' : '📚';
  const horario = esBloque ? `${DIAS_SEMANA[item.day_of_week - 1]} ${minutosAHora(item.start_minutes)} – ${minutosAHora(item.end_minutes)}` : filasDeLaMateria.map((m) => `${DIAS_SEMANA[m.day_of_week - 1].slice(0, 3)} ${minutosAHora(m.start_minutes)}–${minutosAHora(m.end_minutes)}`).join(' · ');
  const lugar = esBloque ? item.location : virtual ? '' : item.salon;

  return (
    <div>
      <div className="px-4 pb-3 pt-4 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
        <div className="flex items-start gap-3">
          <span className="text-3xl anim-float">{emoji}</span>
          <div className="min-w-0"><p className="text-base font-extrabold leading-snug">{nombre}</p><p className="text-[11px] font-semibold opacity-90">{esBloque ? 'Evento semanal' : virtual ? 'Clase virtual' : 'Clase presencial'}{actual ? ` · ${diaHora(actual.inicio, ahora)}` : ''}</p></div>
        </div>
        {actual && (
          <div className="mt-3">
            <p className="text-[11px] font-bold opacity-90">{enCurso ? '🔴 En curso · termina en' : 'Empieza en'}</p>
            <p className="text-3xl font-extrabold tabular-nums leading-none">{cuentaAtras(enCurso ? actual.fin - ahora : actual.inicio - ahora).texto}</p>
            {enCurso && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/30"><div className="h-full rounded-full bg-white transition-all duration-1000" style={{ width: `${avance * 100}%` }} /></div>}
          </div>
        )}
      </div>

      <div className="space-y-1.5 p-4">
        <Fila icono={Clock}><b>{horario}</b></Fila>
        {lugar && <Fila icono={MapPin}>{lugar}</Fila>}
        {virtual && <Fila icono={Video}>{item.enlace_virtual ? <a href={item.enlace_virtual} target="_blank" rel="noreferrer" className="break-all font-bold text-primary underline">{item.enlace_virtual}</a> : 'Sin enlace guardado (edítala en Materias)'}</Fila>}
        {!esBloque && item.profesor && <Fila icono={User}>{item.profesor}</Fila>}
        {!esBloque && item.nrc && <Fila icono={Hash}>NRC {item.nrc}</Fila>}
        {etiquetaNota && <Fila icono={GraduationCap}>Tu nota: <b style={{ color: etiquetaNota.color }}>{(fila.m.final ?? fila.m.promedioActual ?? fila.m.acumulado).toFixed(2)} · {etiquetaNota.texto}</b></Fila>}

        {proximas.length > 1 && (
          <div className="pt-1.5">
            <p className="mb-1 text-[11px] font-extrabold">Próximas sesiones</p>
            <ol className="relative space-y-1 border-l-2 pl-3" style={{ borderColor: `${color}55` }}>
              {proximas.map((s, i) => <li key={s.id + i} className="text-[11px]"><span className="absolute -left-[5px] mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{diaHora(s.inicio, ahora)}</li>)}
            </ol>
          </div>
        )}
        {pendientes.length > 0 && (
          <div className="pt-1.5">
            <p className="mb-1 text-[11px] font-extrabold">Tareas pendientes de esta materia</p>
            <ul className="space-y-1">{pendientes.map((t) => { const c = cuentaAtras(new Date(t.due_date) - ahora); return <li key={t.id} className="flex items-center justify-between gap-2 rounded-sm2 bg-bg px-2.5 py-1.5 text-[11px]"><span className="truncate font-semibold">{t.title}</span><span className="shrink-0 font-bold tabular-nums" style={{ color: colorUrgencia(new Date(t.due_date) - ahora) }}>{c.vencida ? 'vencida' : c.texto}</span></li>; })}</ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-3">
          {virtual && item.enlace_virtual && <a href={item.enlace_virtual} target="_blank" rel="noreferrer" className="col-span-2 flex items-center justify-center gap-1.5 rounded-sm2 bg-primary py-2.5 text-xs font-extrabold text-white"><Video size={14} /> Unirme a la clase <ExternalLink size={12} /></a>}
          <button onClick={acciones.agenda} className="flex items-center justify-center gap-1.5 rounded-sm2 border border-primary/30 py-2 text-xs font-bold text-primary"><CalendarClock size={14} /> Ver agenda</button>
          {actual && <a href={enlaceGoogle({ titulo: `${emoji} ${nombre}`, inicio: actual.inicio, fin: actual.fin, lugar: lugar || (virtual ? 'Virtual' : ''), detalle: item.profesor ? `Profesor: ${item.profesor}` : '', semanas: 16 })} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-sm2 border border-black/10 py-2 text-xs font-bold text-textSecondary"><CalendarPlus size={14} /> Google Calendar</a>}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Contenedor (globo en escritorio, hoja en celular)
function posicionar(rect, ancho = 340, alto = 460) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const m = 12;
  let left = rect.right + 10;
  let top = rect.top;
  if (left + ancho > vw - m) left = rect.left - ancho - 10;
  if (left < m) { // no cabe a los lados: debajo o encima del elemento
    left = Math.min(Math.max(rect.left, m), vw - ancho - m);
    top = rect.bottom + 8;
    if (top + alto > vh - m) top = rect.top - alto - 8;
  }
  return { left, top: Math.min(Math.max(top, m), Math.max(m, vh - alto - m)) };
}

export default function PreviewHost() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [estado, setEstado] = useState(null);
  const [datos, setDatos] = useState(null);
  const [ahora, setAhora] = useState(new Date());
  const [pos, setPos] = useState(null);
  const caja = useRef(null);
  const salir = useRef(null);
  const cerrar = () => { clearTimeout(salir.current); setEstado(null); };
  useEscape(() => estado && cerrar());

  useEffect(() => {
    const abrir = (e) => { clearTimeout(salir.current); setEstado(e.detail); setPos(e.detail.rect ? posicionar(e.detail.rect) : null); };
    const pedirSalir = () => { clearTimeout(salir.current); salir.current = setTimeout(() => setEstado((s) => (s && s.modo === 'hover' ? null : s)), 240); };
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target)) cerrar(); };
    const alScroll = (e) => { if (caja.current && caja.current.contains(e.target)) return; setEstado((s) => (s && s.modo === 'hover' ? null : s)); };
    window.addEventListener('workversity:preview', abrir);
    window.addEventListener('workversity:preview-salir', pedirSalir);
    window.addEventListener('workversity:preview-cerrar', cerrar);
    document.addEventListener('mousedown', fuera);
    document.addEventListener('dragstart', cerrar);
    window.addEventListener('scroll', alScroll, true);
    return () => {
      window.removeEventListener('workversity:preview', abrir); window.removeEventListener('workversity:preview-salir', pedirSalir); window.removeEventListener('workversity:preview-cerrar', cerrar);
      document.removeEventListener('mousedown', fuera); document.removeEventListener('dragstart', cerrar); window.removeEventListener('scroll', alScroll, true); clearTimeout(salir.current);
    };
  }, []);

  useEffect(() => {
    if (!estado) { setDatos(null); return undefined; }
    let vivo = true;
    Promise.all(TABLAS.map(leerTabla)).then(([tareas, materias, bloques, evaluaciones, cortes]) => vivo && setDatos({ tareas, materias, bloques, evaluaciones, cortes }));
    setAhora(new Date());
    const t = setInterval(() => setAhora(new Date()), 1000); // cuenta regresiva en vivo
    return () => { vivo = false; clearInterval(t); };
  }, [estado]);

  useLayoutEffect(() => { // ajusta la posición con la altura real
    if (!caja.current || !estado?.rect || estado.modo !== 'hover') return;
    const h = caja.current.offsetHeight;
    setPos((p) => (p ? posicionar(estado.rect, 340, h) : p));
  }, [datos, estado]);

  if (!estado || !datos) return null;
  const item = estado.tipo === 'tarea' ? datos.tareas.find((t) => t.id === estado.id) : estado.tipo === 'clase' ? datos.materias.find((m) => m.id === estado.id) : datos.bloques.find((b) => b.id === estado.id);
  if (!item) return null;

  const cambiaron = () => { notificarCambioLocal(); cerrar(); };
  const acciones = {
    completar: async () => { await completarTarea(item, usuario.id, 'hecha'); cambiaron(); },
    posponer: async () => { await actualizarTarea(item.id, { due_date: reprogramar(item, 1, new Date()) }); cambiaron(); },
    abrir: () => { cerrar(); navigate(`/tareas?ver=${item.id}`); },
    enfoque: () => { cerrar(); navigate('/analitica?tab=enfoque'); },
    agenda: () => { cerrar(); navigate('/horario'); },
  };
  const contenido = estado.tipo === 'tarea'
    ? <PreviewTarea tarea={item} datos={datos} ahora={ahora} acciones={acciones} />
    : <PreviewClase item={item} esBloque={estado.tipo === 'bloque'} datos={datos} ahora={ahora} acciones={acciones} />;

  if (estado.modo === 'hoja' || !pos) {
    return (
      <div className="fixed inset-0 z-[68] flex items-end justify-center bg-black/40" onClick={cerrar} role="dialog" aria-label="Vista previa">
        <div ref={caja} data-preview="hoja" className="anim-slide max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-lg2 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 z-10 flex justify-center bg-white/80 pb-1 pt-2 backdrop-blur"><span className="h-1 w-10 rounded-full bg-black/15" /></div>
          <button onClick={cerrar} aria-label="Cerrar" className="absolute right-3 top-3 z-20 rounded-full bg-black/10 p-1.5 text-textPrimary"><X size={15} /></button>
          {contenido}
        </div>
      </div>
    );
  }
  return (
    <div ref={caja} data-preview="hover" className="anim-slide fixed z-[68] w-[340px] max-w-[calc(100vw-24px)] overflow-y-auto rounded-lg2 border border-black/10 bg-white shadow-2xl" style={{ left: pos.left, top: pos.top, maxHeight: 'calc(100vh - 24px)' }}
      onMouseEnter={() => clearTimeout(salir.current)} onMouseLeave={() => { clearTimeout(salir.current); salir.current = setTimeout(cerrar, 240); }}>
      {contenido}
    </div>
  );
}
