import { useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, CalendarDays, ListChecks, Clock3, Check, Repeat, ChevronDown, CircleDashed, Timer, CheckCircle2 } from 'lucide-react';
import { STATUS_ORDER, TASK_STATUSES, CATEGORIES } from '../../lib/constants';
import { MateriasCtx } from '../../lib/materiasCtx';
import { estaVencida } from '../../services/tareas';
import { propsPreview } from '../../lib/preview';
import { formatoMinutos } from '../../lib/tiempos';
import { useAuth } from '../../context/AuthContext';
import { idCorto, ordenarColumna, guardarOrden, leerOrden, leerColapso, guardarColapso, LIMITES_WIP } from '../../lib/kanban';

// ---------------------------------------------------------------------------------------------
// Tablero Kanban. Arrastre propio con el puntero (mouse, lápiz o dedo):
//  · la tarjeta se levanta, sigue al puntero y se inclina según la velocidad con que la mueves;
//  · en la columna de destino se abre un hueco donde caerá y las demás tarjetas se apartan;
//  · la columna se tiñe y su contador cambia en vivo ("4/3 · Sobre el límite");
//  · al soltar, la tarjeta vuela a su hueco y se endereza.
// Vista "Estado" (columnas) y "Carriles" (una fila por materia, con las mismas columnas).
//
// Cada estado es un "grupo" (encabezado + tarjetas) que se queda junto en el marcado. En
// computador, los tres grupos se acomodan lado a lado como columnas de siempre; en celular, el
// mismo marcado se apila en una sola columna vertical —nada de scroll horizontal— y cada grupo
// se puede plegar, con su contador siempre visible aunque esté plegado. Es la MISMA información
// y las MISMAS acciones en ambas pantallas; solo cambia cómo se acomodan.
// ---------------------------------------------------------------------------------------------

const ICONO_ESTADO = { pendiente: CircleDashed, enProgreso: Timer, hecha: CheckCircle2 };

const fechaCorta = (iso) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '');
const iniciales = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

function Avatar({ nombre, url, color }) {
  if (url) return <img src={url} alt="" className="h-[22px] w-[22px] rounded-full object-cover ring-2 ring-white" />;
  return (
    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-t-nota font-semibold text-white ring-2 ring-white" style={{ background: color }}>
      {iniciales(nombre)}
    </span>
  );
}

/** Tarjeta, idéntica en estructura a la referencia: ID en mono, etiqueta con punto, título y metadatos. */
function Tarjeta({ t, subtareas, onAbrir, onToggle, levantada = false }) {
  const materias = useContext(MateriasCtx);
  const { perfil } = useAuth();
  const materia = t.materia_id ? materias.get(t.materia_id) : null;
  const etiqueta = materia ? { texto: materia.nombre, color: materia.color_value } : { texto: (CATEGORIES[t.category] || CATEGORIES.universidad).label, color: (CATEGORIES[t.category] || CATEGORIES.universidad).color };
  const vencida = estaVencida(t);
  const hecha = t.status === 'hecha';
  const hechasSub = subtareas.filter((s) => s.status === 'hecha').length;
  return (
    <div
      {...(levantada ? {} : propsPreview('tarea', t.id))}
      onClick={levantada ? undefined : onAbrir}
      className={`kb-tarjeta group ${levantada ? 'kb-tarjeta--levantada' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="kb-tarjeta-meta font-mono tracking-tight text-textSecondary">{idCorto(t.id)}</span>
        <span className="kb-tarjeta-meta flex min-w-0 items-center gap-1.5 text-textSecondary">
          <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: etiqueta.color }} />
          <span className="truncate">{etiqueta.texto}</span>
        </span>
      </div>
      <p className={`kb-tarjeta-t mt-1.5 line-clamp-2 font-medium ${hecha ? 'text-textSecondary line-through decoration-textSecondary/40' : 'text-textPrimary'}`}>{t.title}</p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="kb-tarjeta-meta flex min-w-0 items-center gap-2.5 text-textSecondary">
          <span className={`flex items-center gap-1 ${vencida ? 'text-danger' : ''}`}><CalendarDays size={11} strokeWidth={1.8} /> {fechaCorta(t.due_date)}</span>
          {subtareas.length > 0 && <span className="flex items-center gap-1"><ListChecks size={11} strokeWidth={1.8} /> {hechasSub}/{subtareas.length}</span>}
          {t.estimated_minutes ? <span className="flex items-center gap-1"><Clock3 size={11} strokeWidth={1.8} /> {formatoMinutos(t.estimated_minutes)}</span> : null}
          {t.is_recurring && <Repeat size={11} strokeWidth={1.8} />}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
            className={`kb-check ${hecha ? 'kb-check--hecha' : ''}`}
          >
            <Check size={10} strokeWidth={3} />
          </button>
          <Avatar nombre={perfil?.nombre} url={perfil?.avatar_url} color={etiqueta.color} />
        </div>
      </div>
    </div>
  );
}

/** Anima cada tarjeta desde donde estaba hasta donde quedó (técnica FLIP) cada vez que cambia el orden. */
function useFlip(contenedor, dependencias, soltada) {
  const previas = useRef(new Map());
  useLayoutEffect(() => {
    const raiz = contenedor.current;
    if (!raiz) return;
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const nuevas = new Map();
    raiz.querySelectorAll('[data-kb-id]').forEach((el) => {
      const id = el.dataset.kbId;
      const r = el.getBoundingClientRect();
      nuevas.set(id, r);
      if (reducido) return;
      const s = soltada.current;
      if (s && s.id === id) {
        // La tarjeta que se soltó vuela desde la posición del puntero hasta su hueco.
        el.animate(
          [
            { transform: `translate(${s.rect.left - r.left}px, ${s.rect.top - r.top}px) rotate(${s.rot}deg) scale(1.03)`, boxShadow: '0 22px 40px -18px rgba(0,0,0,.35)' },
            { transform: 'none', boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
          ],
          { duration: 320, easing: 'cubic-bezier(.2,.9,.25,1.15)' },
        );
        soltada.current = null;
        return;
      }
      const p = previas.current.get(id);
      if (p && (Math.abs(p.top - r.top) > 0.5 || Math.abs(p.left - r.left) > 0.5)) {
        el.animate([{ transform: `translate(${p.left - r.left}px, ${p.top - r.top}px)` }, { transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
    previas.current = nuevas;
  }, dependencias); // eslint-disable-line react-hooks/exhaustive-deps
}

export default function KanbanBoard({ tasks, onOpen, onToggle, onMove, onCambiarMateria, onAgregar }) {
  const materias = useContext(MateriasCtx);
  const [vista, setVista] = useState(() => { try { return localStorage.getItem('workversity:kanban-vista') || 'estado'; } catch { return 'estado'; } });
  const [orden, setOrden] = useState(leerOrden);
  const [colapso, setColapso] = useState(leerColapso);
  // Un estado vacío dentro de una materia (vista Carriles) se pliega solo; si la persona lo abre
  // igual para usar el "Agregar tarjeta" de abajo, esa apertura es solo de esa fila —nunca toca
  // la preferencia compartida de "colapso" que aplica a todas las materias por igual—, y no se
  // recuerda entre visitas: la próxima vez que esa fila esté vacía, vuelve a empezar plegada.
  const [vaciosAbiertos, setVaciosAbiertos] = useState(() => new Set());
  const [arrastre, setArrastre] = useState(null); // { id, x, y, ox, oy, w, rot, destino: {estado, carril, indice} }
  const tablero = useRef(null);
  const soltada = useRef(null);

  const principales = useMemo(() => tasks.filter((t) => !t.parent_task_id), [tasks]);
  const subtareasDe = useMemo(() => {
    const m = new Map();
    for (const t of tasks) if (t.parent_task_id) (m.get(t.parent_task_id) || m.set(t.parent_task_id, []).get(t.parent_task_id)).push(t);
    return m;
  }, [tasks]);

  const carriles = useMemo(() => {
    if (vista !== 'carriles') return [{ id: '_', nombre: null }];
    const ids = [...new Set(principales.map((t) => t.materia_id || '_sin'))];
    return ids.map((id) => (id === '_sin' ? { id, nombre: 'Sin materia', color: '#9A9890' } : { id, nombre: materias.get(id)?.nombre || 'Materia', color: materias.get(id)?.color_value || '#9A9890' }))
      .sort((a, b) => (a.id === '_sin') - (b.id === '_sin') || a.nombre.localeCompare(b.nombre));
  }, [vista, principales, materias]);

  const enCelda = (estado, carril) => ordenarColumna(
    principales.filter((t) => t.status === estado && (carril === '_' || (t.materia_id || '_sin') === carril)),
    orden[estado],
  );

  useFlip(tablero, [tasks, orden, vista, arrastre?.destino?.estado, arrastre?.destino?.carril, arrastre?.destino?.indice, arrastre?.id], soltada);

  const cambiarVista = (v) => { setVista(v); try { localStorage.setItem('workversity:kanban-vista', v); } catch { /* nada */ } };

  // Solo tiene efecto visual en la composición apilada de celular (ver CSS); en computador los
  // tres grupos siempre se ven completos, lado a lado.
  const alternarColapso = (estado) => setColapso((c) => {
    const n = new Set(c);
    if (n.has(estado)) n.delete(estado); else n.add(estado);
    guardarColapso(n);
    return n;
  });

  // --- Arrastre -------------------------------------------------------------------------
  const empezar = (t) => (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const inicio = { x: e.clientX, y: e.clientY };
    let activo = false;
    let ultimo = { x: e.clientX, t: performance.now() };
    let rot = 0;
    let destino = null;
    const tactil = e.pointerType === 'touch';
    let espera = tactil ? setTimeout(() => { activo = true; arrancar(inicio.x, inicio.y); }, 260) : null;

    const calcularDestino = (x, y) => {
      const celdas = [...tablero.current.querySelectorAll('[data-kb-celda]')];
      const celda = celdas.find((c) => { const b = c.getBoundingClientRect(); return x >= b.left && x <= b.right && y >= b.top - 30 && y <= b.bottom + 30; })
        || celdas.reduce((mejor, c) => { const b = c.getBoundingClientRect(); const d = Math.abs(x - (b.left + b.width / 2)) + Math.max(0, Math.abs(y - (b.top + b.height / 2)) - b.height / 2); return !mejor || d < mejor.d ? { c, d } : mejor; }, null)?.c;
      if (!celda) return null;
      const tarjetas = [...celda.querySelectorAll('[data-kb-id]')].filter((n) => n.dataset.kbId !== t.id);
      let indice = tarjetas.length;
      for (let i = 0; i < tarjetas.length; i++) { const b = tarjetas[i].getBoundingClientRect(); if (y < b.top + b.height / 2) { indice = i; break; } }
      return { estado: celda.dataset.estado, carril: celda.dataset.carril, indice };
    };
    function arrancar(x, y) {
      document.body.dataset.arrastrando = '1';
      window.dispatchEvent(new Event('workversity:preview-cerrar'));
      destino = calcularDestino(x, y);
      setArrastre({ id: t.id, x, y, ox: inicio.x - r.left, oy: inicio.y - r.top, w: r.width, h: r.height, rot: 0, destino });
      navigator.vibrate?.(8);
    }
    const mover = (ev) => {
      if (!activo) {
        if (tactil) { if (Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y) > 8) { clearTimeout(espera); terminar(); } return; }
        if (Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y) < 5) return;
        activo = true;
        arrancar(ev.clientX, ev.clientY);
      }
      ev.preventDefault();
      const ahora = performance.now();
      const vx = (ev.clientX - ultimo.x) / Math.max(1, ahora - ultimo.t);
      ultimo = { x: ev.clientX, t: ahora };
      // Inclinación proporcional a la velocidad horizontal, con un leve giro de reposo (como en la referencia).
      rot += (Math.max(-7, Math.min(7, vx * 9 + 2.2)) - rot) * 0.25;
      destino = calcularDestino(ev.clientX, ev.clientY) || destino;
      setArrastre((a) => (a ? { ...a, x: ev.clientX, y: ev.clientY, rot, destino } : a));
      // Desplazamiento automático del tablero cuando se acerca al borde.
      const sc = tablero.current?.querySelector('[data-kb-scroll]');
      if (sc) { const b = sc.getBoundingClientRect(); if (ev.clientX > b.right - 50) sc.scrollLeft += 12; else if (ev.clientX < b.left + 50) sc.scrollLeft -= 12; }
    };
    const terminar = () => {
      clearTimeout(espera);
      setTimeout(() => { delete document.body.dataset.arrastrando; }, 450);
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', cancelar);
    };
    const cancelar = () => { terminar(); setArrastre(null); };
    const soltar = (ev) => {
      terminar();
      if (!activo) return;
      const d = destino;
      setArrastre(null);
      if (!d) return;
      soltada.current = { id: t.id, rect: { left: ev.clientX - (inicio.x - r.left), top: ev.clientY - (inicio.y - r.top) }, rot };
      // Orden local dentro de la columna (se recuerda en este dispositivo).
      const ids = enCelda(d.estado, d.carril).map((x) => x.id).filter((id) => id !== t.id);
      ids.splice(d.indice, 0, t.id);
      const resto = (orden[d.estado] || []).filter((id) => !ids.includes(id) && id !== t.id);
      const nuevo = { ...orden, [d.estado]: [...ids, ...resto] };
      setOrden(nuevo);
      guardarOrden(nuevo);
      if (d.estado !== t.status) onMove(t.id, d.estado);
      const carrilNuevo = d.carril === '_' ? undefined : d.carril === '_sin' ? null : d.carril;
      if (carrilNuevo !== undefined && (t.materia_id || null) !== carrilNuevo) onCambiarMateria?.(t.id, carrilNuevo);
    };
    window.addEventListener('pointermove', mover, { passive: false });
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', cancelar);
  };

  const arrastrada = arrastre ? principales.find((t) => t.id === arrastre.id) : null;
  // En la vista "Estado" (un solo carril '_') el contador se anima en vivo mientras se arrastra
  // una tarjeta de una columna a otra. En "Carriles" cada materia tiene su propio contador por
  // estado —nunca el total general— y no se anima en vivo durante el arrastre: ese instante es
  // demasiado breve para justificar la complejidad de seguir a qué materia pertenece el destino.
  const conteo = (estado, carril = '_') => {
    const base = principales.filter((t) => t.status === estado && (carril === '_' || (t.materia_id || '_sin') === carril)).length;
    if (carril !== '_' || !arrastre || !arrastrada) return base;
    let n = base;
    if (arrastrada.status === estado && arrastre.destino?.estado !== estado) n -= 1;
    if (arrastrada.status !== estado && arrastre.destino?.estado === estado) n += 1;
    return n;
  };

  const celda = (estado, carril) => {
    const lista = enCelda(estado, carril).filter((t) => t.id !== arrastre?.id);
    const aqui = arrastre?.destino && arrastre.destino.estado === estado && arrastre.destino.carril === carril;
    const items = lista.map((t) => (
      <div key={t.id} data-kb-id={t.id} onPointerDown={empezar(t)} className="kb-item" style={{ touchAction: 'pan-y' }}>
        <Tarjeta t={t} subtareas={subtareasDe.get(t.id) || []} onAbrir={() => onOpen(t)} onToggle={() => onToggle(t)} />
      </div>
    ));
    if (aqui) items.splice(arrastre.destino.indice, 0, <div key="hueco" className="kb-hueco" style={{ height: arrastre.h }} />);
    return (
      <div data-kb-celda data-estado={estado} data-carril={carril} className={`kb-celda ${aqui ? 'kb-celda--sobre' : ''}`}>
        {items}
        <button type="button" onClick={() => onAgregar?.(estado, carril === '_' || carril === '_sin' ? null : carril)} className="kb-agregar">
          <Plus size={12} strokeWidth={2} /> Agregar tarjeta
        </button>
      </div>
    );
  };

  /** Un estado completo: encabezado (ícono, nombre, contador, plegar) + su celda de tarjetas. */
  const grupo = (estado, carril) => {
    const n = conteo(estado, carril);
    // El límite de trabajo en curso es una política global, no por materia: solo se compara y
    // se muestra en la vista "Estado" (carril '_'), igual que antes de esta composición en grupos.
    const limite = carril === '_' ? LIMITES_WIP[estado] : null;
    const excede = limite && n > limite;
    const Icono = ICONO_ESTADO[estado];
    // En "Carriles" (una materia por fila) un estado sin tarjetas se pliega automáticamente:
    // así cada fila ocupa solo el espacio de lo que de verdad tiene, en vez de repetir 3
    // encabezados vacíos con su botón de "Agregar tarjeta" por cada materia. El botón "+" del
    // encabezado sigue siempre ahí para agregar directo, sin tener que desplegar nada.
    const claveVacio = `${estado}:${carril}`;
    const vacio = carril !== '_' && n === 0;
    const plegado = vacio ? !vaciosAbiertos.has(claveVacio) : colapso.has(estado);
    const alternar = () => {
      if (vacio) {
        setVaciosAbiertos((v) => { const n2 = new Set(v); if (n2.has(claveVacio)) n2.delete(claveVacio); else n2.add(claveVacio); return n2; });
      } else {
        alternarColapso(estado);
      }
    };
    const sobre = arrastre?.destino?.estado === estado && (vista === 'estado' || arrastre.destino.carril === carril);
    return (
      <div
        key={estado}
        data-colapsado={plegado ? '1' : undefined}
        className={`kb-grupo ${sobre ? 'kb-grupo--sobre' : ''}`}
        style={{ '--c': TASK_STATUSES[estado].color }}
      >
        <div className="kb-grupo-cab">
          <button type="button" onClick={alternar} className="kb-grupo-cab-toggle" aria-expanded={!plegado}>
            <span className="kb-grupo-ico"><Icono size={14} strokeWidth={2} /></span>
            <span className="kb-grupo-t">{TASK_STATUSES[estado].label}</span>
            <span className={`kb-grupo-n tabular-nums ${excede ? 'text-warning' : ''}`}>{limite ? `${n}/${limite}` : n}</span>
            {excede && <span className="kb-limite">Sobre el límite</span>}
            <ChevronDown size={14} strokeWidth={2} className="kb-grupo-chev" aria-hidden="true" />
          </button>
          <button type="button" aria-label={`Agregar en ${TASK_STATUSES[estado].label}`} onClick={() => onAgregar?.(estado, null)} className="kb-grupo-add">
            <Plus size={13} strokeWidth={2} />
          </button>
        </div>
        {celda(estado, carril)}
      </div>
    );
  };

  const total = principales.length;

  return (
    <div ref={tablero} className="kb">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4">
        <p className="flex items-baseline gap-2">
          <span className="text-t-medio font-semibold tracking-tight">Tablero</span>
          <span className="text-t-micro text-textSecondary">{total} tarjeta{total === 1 ? '' : 's'}</span>
        </p>
        <div className="kb-segmento" role="tablist">
          {[['estado', 'Estado'], ['carriles', 'Carriles']].map(([v, t]) => (
            <button key={v} role="tab" aria-selected={vista === v} onClick={() => cambiarVista(v)} className={vista === v ? 'activo' : ''}>{t}</button>
          ))}
        </div>
      </div>

      <div data-kb-scroll>
        {carriles.map((c) => (
          <div key={c.id} className={vista === 'carriles' ? 'kb-carril' : ''}>
            {vista === 'carriles' && (
              <p className="flex items-center gap-2 px-1.5 pb-2 pt-1 text-t-micro font-medium">
                <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-t-nota font-semibold text-white" style={{ background: c.color }}>{iniciales(c.nombre)}</span>
                {c.nombre}
                <span className="text-textSecondary">{principales.filter((t) => (t.materia_id || '_sin') === c.id).length}</span>
              </p>
            )}
            <div className="kb-grupos">
              {STATUS_ORDER.map((estado) => grupo(estado, c.id))}
            </div>
          </div>
        ))}
      </div>

      {arrastre && arrastrada && createPortal(
        <div
          className="kb-flotante"
          style={{ width: arrastre.w, transform: `translate(${arrastre.x - arrastre.ox}px, ${arrastre.y - arrastre.oy}px) rotate(${arrastre.rot}deg) scale(1.03)` }}
        >
          <Tarjeta t={arrastrada} subtareas={subtareasDe.get(arrastrada.id) || []} levantada />
        </div>,
        document.body,
      )}
    </div>
  );
}
