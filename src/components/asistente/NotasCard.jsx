import { useEffect, useId, useMemo, useState } from 'react';
import { marcarSucio } from '../../pwa/bloqueo';
import { Plus, Trash2, GraduationCap, Target, Wand2, Layers, Save, Undo2, Check, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSyncEstado } from '../../hooks/useSyncEstado';
import { listarEvaluaciones, crearEvaluacion, actualizarEvaluacion, eliminarEvaluacion } from '../../services/notas';
import { listarCortes, crearCortes, actualizarCortes } from '../../services/cortes';
import { agruparNotas, calcularCorte, expandirActividades, simular, repartirIgual, autoajustarPesos, parsearNota, resumenItems, nombreParte, ETIQUETA_CORTE, etiquetaMateria, PESOS_POR_DEFECTO, APRUEBA } from '../../lib/notas';

const f2 = (n) => (Math.round(n * 100) / 100).toFixed(2);
const pctNum = (v) => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null; };
const campo = 'w-full rounded-sm2 bg-bg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary';
const PLANTILLAS = [
  { txt: 'Parcial 40 · Talleres 30 (×4) · Quiz 30', filas: [['Parcial', 40], ['Talleres', 30, 4], ['Quiz', 30]] },
  { txt: 'Parcial 40 · Taller 30 · Quiz 30', filas: [['Parcial', 40], ['Taller', 30], ['Quiz', 30]] },
  { txt: 'Parcial 60 · Talleres 40 (×4)', filas: [['Parcial', 60], ['Talleres', 40, 4]] },
  { txt: 'Examen 100', filas: [['Examen', 100]] },
  { txt: '3 partes iguales', filas: null },
];

const base = (ev) => ({ nombre: ev.nombre, porcentaje: String(ev.porcentaje), nota: ev.nota == null ? '' : String(ev.nota), items: (ev.items || []).map((i) => ({ n: i.n, nota: i.nota == null ? '' : String(i.nota) })) });

function Corte({ c: cGuardado, evs, color, meta, tareasDisponibles, onCrear, onPlantilla, onDesdeTarea, onGuardar, onBorrar }) {
  const [borr, setBorr] = useState({});
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);
  const sucio = Object.keys(borr).length > 0;
  const idSucio = useId();
  useEffect(() => { marcarSucio(idSucio, sucio); return () => marcarSucio(idSucio, false); }, [sucio, idSucio]);
  const ver = (ev) => borr[ev.id] || base(ev);
  const editar = (ev, parcial) => { setGuardado(false); setError(''); setBorr((b) => ({ ...b, [ev.id]: { ...(b[ev.id] || base(ev)), ...parcial } })); };
  const editarItem = (ev, k, parcial) => { const v = ver(ev); editar(ev, { items: v.items.map((it, j) => (j === k ? { ...it, ...parcial } : it)) }); };

  const guardar = async () => {
    const cambios = {};
    for (const ev of evs.filter((e) => borr[e.id])) {
      const d = borr[ev.id];
      const p = pctNum(d.porcentaje);
      if (p == null) return setError(`«${d.nombre}»: el porcentaje va de 0 a 100`);
      const items = [];
      for (const it of d.items) {
        const r = parsearNota(it.nota);
        if (r.error) return setError(`«${it.n}»: ${r.error}`);
        items.push({ n: it.n.trim() || 'Parte', nota: r.vacio ? null : r.valor });
      }
      let nota = null;
      if (items.length === 0) {
        const r = parsearNota(d.nota);
        if (r.error) return setError(`«${d.nombre}»: ${r.error}`);
        nota = r.vacio ? null : r.valor;
      }
      // `items` solo se envía si la actividad se desglosa (o dejó de estarlo): así guardar funciona aunque no uses el desglose.
      cambios[ev.id] = { nombre: d.nombre.trim() || 'Actividad', porcentaje: p, nota, ...(items.length > 0 || (ev.items || []).length > 0 ? { items } : {}) };
    }
    await onGuardar(cambios);
    setBorr({}); setError(''); setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };
  const enter = (e) => { if (e.key === 'Enter') { e.preventDefault(); guardar(); } };

  // Vista previa en vivo: los números del corte ya incluyen lo que vas escribiendo, aunque aún no lo hayas guardado.
  const previa = evs.map((ev) => {
    const d = ver(ev);
    return { corte: ev.corte, porcentaje: pctNum(d.porcentaje) ?? Number(ev.porcentaje), nota: parsearNota(d.nota).valor ?? null, items: d.items.map((i) => ({ nota: parsearNota(i.nota).valor ?? null })) };
  });
  const c = sucio ? { ...cGuardado, ...calcularCorte(expandirActividades(previa)) } : cGuardado;
  const est = ETIQUETA_CORTE[c.estado];
  const grande = c.completo ? c.acumulado : c.promedio;
  const n = c.necesariaAprobar;

  return (
    <div className="rounded-md2 border border-black/10 bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold">Corte {c.n} <span className="text-textSecondary">· {c.peso}%</span></p>
          <span className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ backgroundColor: `${est.color}1F`, color: est.color }}>{est.texto}</span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold leading-none" style={{ color: est.color }}>{grande != null ? f2(grande) : '—'}</p>
          <p className="text-[10px] text-textSecondary">{c.completo ? 'nota del corte' : 'promedio actual'}</p>
        </div>
      </div>
      <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, c.pctEvaluado)}%`, backgroundColor: color }} /></div>
      <p className="mb-2 text-[10px] text-textSecondary">{c.pctEvaluado > 0 ? `${f2(c.pctEvaluado).replace(/\.00$/, '')}% calificado · suma ${f2(c.acumulado)} de 5.00 · mínimo para pasar: ${APRUEBA.toFixed(1)}` : 'Aún no hay notas en este corte'}</p>

      <div className="space-y-2">
        {evs.length === 0 && <p className="rounded-sm2 bg-bg py-3 text-center text-[11px] text-textSecondary">Agrega qué vale cada cosa en este corte</p>}
        {evs.map((ev) => {
          const d = ver(ev);
          const tiene = d.items.length > 0;
          const media = tiene ? resumenItems({ items: d.items.map((i) => ({ nota: parsearNota(i.nota).valor ?? null })) }) : null;
          const parte = tiene ? (pctNum(d.porcentaje) ?? 0) / d.items.length : 0;
          return (
            <div key={ev.id} className={`rounded-sm2 p-1.5 ${borr[ev.id] ? 'bg-warningSoft/60 ring-1 ring-warning/40' : ''}`} onKeyDown={enter}>
              <div className="grid grid-cols-[1fr_3.4rem_3.4rem_3.2rem] items-center gap-1.5">
                <input value={d.nombre} onChange={(e) => editar(ev, { nombre: e.target.value })} className={campo} aria-label="Actividad" />
                <input value={d.porcentaje} onChange={(e) => editar(ev, { porcentaje: e.target.value })} inputMode="decimal" className={`${campo} text-center`} aria-label="Porcentaje" />
                {tiene
                  ? <span className="rounded-sm2 bg-bg px-1 py-1.5 text-center text-xs font-extrabold" title="Promedio de las partes calificadas">{media.media != null ? f2(media.media) : '—'}</span>
                  : <input value={d.nota} onChange={(e) => editar(ev, { nota: e.target.value })} inputMode="decimal" placeholder="—" className={`${campo} text-center`} aria-label="Nota" />}
                <span className="flex justify-end gap-1">
                  <button onClick={() => (tiene ? editar(ev, { items: [] }) : editar(ev, { items: [1, 2, 3].map((i) => ({ n: `${nombreParte(d.nombre)} ${i}`, nota: '' })) }))} title={tiene ? 'Volver a una sola nota' : 'Desglosar en partes iguales (talleres, quices…)'} aria-label="Desglosar" className={`rounded p-1 ${tiene ? 'bg-primarySoft text-primary' : 'text-textSecondary hover:text-primary'}`}><Layers size={14} /></button>
                  <button onClick={() => onBorrar(ev.id)} aria-label="Eliminar" className="rounded p-1 text-textSecondary hover:text-danger"><Trash2 size={14} /></button>
                </span>
              </div>

              {tiene && (
                <div className="mt-1.5 ml-2 space-y-1 border-l-2 border-primary/30 pl-2">
                  {d.items.map((it, k) => (
                    <div key={k} className="grid grid-cols-[1fr_3.4rem_1.4rem] items-center gap-1.5">
                      <input value={it.n} onChange={(e) => editarItem(ev, k, { n: e.target.value })} className={campo} aria-label="Parte" />
                      <input value={it.nota} onChange={(e) => editarItem(ev, k, { nota: e.target.value })} inputMode="decimal" placeholder="—" className={`${campo} text-center`} aria-label="Nota de la parte" />
                      <button onClick={() => editar(ev, { items: d.items.filter((_, j) => j !== k) })} aria-label="Quitar parte" className="text-textSecondary hover:text-danger"><X size={13} /></button>
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button onClick={() => editar(ev, { items: [...d.items, { n: `${nombreParte(d.nombre)} ${d.items.length + 1}`, nota: '' }] })} className="flex items-center gap-1 text-[11px] font-bold text-primary"><Plus size={11} /> Agregar {nombreParte(d.nombre).toLowerCase()}</button>
                    <span className="text-[10px] text-textSecondary">{media.calificados}/{media.total} con nota · cada una vale {f2(parte).replace(/\.00$/, '')}% del corte</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button onClick={() => onCrear()} className="flex items-center gap-1 rounded-full bg-primarySoft px-2.5 py-1 text-[11px] font-bold text-primary"><Plus size={12} /> Actividad</button>
        <select value="" onChange={(e) => e.target.value !== '' && onPlantilla(Number(e.target.value))} className="rounded-full bg-bg px-2 py-1 text-[11px] font-bold outline-none" aria-label="Plantilla">
          <option value="">Plantilla…</option>
          {PLANTILLAS.map((p, i) => <option key={p.txt} value={i}>{p.txt}</option>)}
        </select>
        {tareasDisponibles.length > 0 && (
          <select value="" onChange={(e) => e.target.value && onDesdeTarea(e.target.value)} className="max-w-[9rem] rounded-full bg-bg px-2 py-1 text-[11px] font-bold outline-none" aria-label="Desde tareas">
            <option value="">Desde mis tareas…</option>
            {tareasDisponibles.map((t) => <option key={t.id} value={t.title}>{t.title}</option>)}
          </select>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button onClick={guardar} disabled={!sucio} className="flex flex-1 items-center justify-center gap-1.5 rounded-sm2 bg-primary py-2 text-xs font-bold text-white disabled:opacity-40"><Save size={13} /> Guardar corte {c.n}</button>
        {sucio && <button onClick={() => { setBorr({}); setError(''); }} className="flex items-center gap-1 rounded-sm2 border border-black/10 px-3 py-2 text-xs font-bold text-textSecondary"><Undo2 size={13} /> Descartar</button>}
      </div>
      {sucio && !error && <p className="mt-1.5 text-[11px] font-semibold text-warning">● Cambios sin guardar: los números de arriba ya los incluyen. Pulsa «Guardar corte {c.n}» (o Enter)</p>}
      {guardado && <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-success"><Check size={13} /> Guardado</p>}
      {error && <p className="mt-1.5 text-[11px] font-semibold text-danger">{error}</p>}

      {(c.excede || c.sinDefinir > 0) && evs.length > 0 && (
        <p className="mt-2 flex items-start gap-1 text-[11px] font-semibold text-warning"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{c.excede ? `Las actividades suman ${c.pctTotal}% (más del 100% del corte).` : `Falta definir el ${c.sinDefinir}% del corte.`}</p>
      )}
      {!c.completo && c.pctEvaluado > 0 && n != null && (
        <p className="mt-2 rounded-sm2 bg-bg p-2 text-[11px] font-semibold text-textSecondary">
          {n <= 0 ? `Ya aseguraste ${APRUEBA.toFixed(1)} en este corte.` : n > 5 ? `Este corte ya no llega a ${APRUEBA.toFixed(1)}; puedes compensarlo en los otros.` : `Para ganar este corte necesitas ${f2(n)} en el ${f2(c.faltante).replace(/\.00$/, '')}% que falta.`}
          {meta > APRUEBA && c.necesariaEnCorte != null && c.necesariaEnCorte > 0 && c.necesariaEnCorte <= 5 && ` Para tu meta de ${meta.toFixed(1)}: ${f2(c.necesariaEnCorte)}.`}
        </p>
      )}
    </div>
  );
}

export default function NotasCard({ materias, tareas = [] }) {
  const { usuario } = useAuth();
  const { version } = useSyncEstado();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cortes, setCortes] = useState([]);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(() => { try { return Number(localStorage.getItem('workversity:meta-nota')) || 3; } catch { return 3; } });
  const [sel, setSel] = useState(null);
  const [hipotetica, setHipotetica] = useState(3.5);

  const cargar = async () => {
    try { const [e, c] = await Promise.all([listarEvaluaciones(), listarCortes()]); setEvaluaciones(e); setCortes(c); setError(''); }
    catch (err) { setError(err.message || String(err)); }
  };
   
  useEffect(() => { cargar(); }, [version]);
  const cambiarMeta = (v) => { setMeta(v); try { localStorage.setItem('workversity:meta-nota', String(v)); } catch { /* nada */ } };

  const filas = useMemo(() => agruparNotas({ materias, evaluaciones, cortes, meta }), [materias, evaluaciones, cortes, meta]);
  if (filas.length === 0) return <p className="rounded-md2 bg-white py-12 text-center text-sm text-textSecondary shadow-card">Registra tus materias para llevar tus notas.</p>;

  const actual = filas.find((f) => f.materia.id === sel) || filas[0];
  const { materia: g, ids, evals, cfg, pesos, m } = actual;
  const est = etiquetaMateria(m);
  const conProyeccion = filas.filter((f) => f.m.proyectada != null);
  const promedioSemestre = conProyeccion.length ? conProyeccion.reduce((s, f) => s + f.m.proyectada, 0) / conProyeccion.length : null;
  const perdiendo = filas.filter((f) => f.m.ritmo === 'perdiendo' || f.m.estado === 'reprobada' || f.m.estado === 'imposible');

  const guardarPesos = async (nuevos) => {
    const datos = { peso1: nuevos[0], peso2: nuevos[1], peso3: nuevos[2] };
    if (cfg) await actualizarCortes(cfg.id, datos); else await crearCortes({ materia_id: g.id, ...datos }, usuario.id);
    await cargar();
  };
  const crear = async (corte, nombre, pct, items = []) => crearEvaluacion({ materia_id: g.id, corte, nombre, porcentaje: pct, nota: null, items }, usuario.id);
  const agregarUna = async (corte, nombre) => {
    const c = m.cortes[corte - 1];
    await crear(corte, nombre || `Actividad ${evals.filter((e) => Number(e.corte) === corte).length + 1}`, c.sinDefinir > 0 ? c.sinDefinir : 20);
    await cargar();
  };
  const aplicarPlantilla = async (corte, i) => {
    const filasP = PLANTILLAS[i].filas || repartirIgual(3).map((p, k) => [`Parte ${k + 1}`, p]);
    for (const [nombre, pct, cuantas] of filasP) await crear(corte, nombre, pct, cuantas ? Array.from({ length: cuantas }, (_, k) => ({ n: `${nombreParte(nombre)} ${k + 1}`, nota: null })) : []);
    await cargar();
  };
  const guardarCambios = async (mapa) => { for (const [id, cambios] of Object.entries(mapa)) await actualizarEvaluacion(id, cambios); await cargar(); };
  const borrar = async (id) => { await eliminarEvaluacion(id); await cargar(); };
  const colorCorte = ['#5B8DEF', '#8B7FD1', '#E5789C'];
  const pesoInput = (i) => (
    <label key={i} className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold text-textSecondary">Corte {i + 1}
      <input defaultValue={pesos[i]} key={`${g.id}-${i}-${pesos[i]}`} inputMode="decimal" aria-label={`Peso corte ${i + 1}`} className="w-14 rounded-sm2 bg-white px-2 py-1.5 text-center text-xs outline-none focus:ring-2 focus:ring-primary"
        onBlur={(e) => { const v = pctNum(e.target.value); if (v == null || v === pesos[i]) return; const p = [...pesos]; p[i] = v; guardarPesos(p); }} /> %
    </label>
  );
  const tareasDeLaMateria = tareas.filter((t) => ids.has(t.materia_id) && !t.parent_task_id);
  const ritmoTxt = m.ritmo && m.final == null ? (m.ritmo === 'ganando' ? `Vas ganando: tu promedio actual es ${f2(m.promedioActual)}.` : `Vas perdiendo: tu promedio actual es ${f2(m.promedioActual)} (se pasa con ${APRUEBA.toFixed(1)}).`) : '';

  return (
    <div className="space-y-4">
      <div className="rounded-md2 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <GraduationCap size={20} className="mt-0.5 shrink-0 text-primary" />
            <div className="text-xs text-textSecondary">
              <p className="text-sm font-extrabold text-textPrimary">Notas por cortes</p>
              Escala de 0.0 a 5.0: se aprueba desde <b>3.0</b> y se pierde con 2.9 o menos. Puedes escribir <b>3.5</b> o <b>35</b>. Cada corte vale 35% · 35% · 30% (editable).
              {promedioSemestre != null && <p className="mt-1 font-bold text-textPrimary">Promedio proyectado del semestre: {f2(promedioSemestre)}</p>}
            </div>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1 text-[11px] font-bold text-textSecondary"><Target size={12} /> Mi meta (opcional)</p>
            <div className="flex items-center gap-1">
              {[3, 3.5, 4, 4.5].map((v) => <button key={v} onClick={() => cambiarMeta(v)} className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta === v ? 'bg-primary text-white' : 'bg-bg text-textSecondary'}`}>{v.toFixed(1)}</button>)}
            </div>
          </div>
        </div>
        {perdiendo.length > 0 && (
          <p className="mt-3 rounded-sm2 bg-dangerSoft p-2.5 text-xs font-semibold text-danger">⚠️ Vas perdiendo: {perdiendo.map((f) => f.materia.nombre).join(', ')}. Toca la materia para ver cuánto necesitas.</p>
        )}
      </div>
      {error && <p className="rounded-sm2 bg-dangerSoft p-3 text-xs font-semibold text-danger">{error} — ¿ejecutaste el SQL de las notas en Supabase?</p>}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filas.map((f) => {
          const e = etiquetaMateria(f.m);
          const activo = f.materia.id === actual.materia.id;
          return (
            <button key={f.materia.id} onClick={() => setSel(f.materia.id)} className={`shrink-0 rounded-md2 px-3.5 py-2.5 text-left shadow-card transition ${activo ? 'ring-2' : 'bg-white'}`} style={{ backgroundColor: activo ? `${f.materia.color_value}1F` : undefined, '--tw-ring-color': f.materia.color_value }}>
              <p className="flex items-center gap-1.5 text-xs font-extrabold"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: f.materia.color_value }} />{f.materia.nombre}</p>
              <p className="text-[11px] font-bold" style={{ color: e.color }}>{f.m.hayDatos ? `${f2(f.m.final ?? f.m.acumulado)}${f.m.final == null && f.m.proyectada != null ? ` → ${f2(f.m.proyectada)}` : ''} · ${e.texto}` : 'Sin evaluaciones'}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-md2 bg-white p-4 shadow-card" style={{ borderTop: `4px solid ${g.color_value}` }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold">{g.nombre}</p>
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold" style={{ backgroundColor: `${est.color}1F`, color: est.color }}>{est.texto}</span>
          </div>
          <div className="flex gap-5 text-right">
            <div><p className="text-3xl font-extrabold leading-none" style={{ color: est.color }}>{m.hayDatos ? f2(m.final ?? m.acumulado) : '—'}</p><p className="text-[10px] text-textSecondary">{m.final != null ? 'definitiva' : 'acumulado'}</p></div>
            {m.proyectada != null && m.final == null && <div><p className="text-3xl font-extrabold leading-none text-textSecondary">{f2(m.proyectada)}</p><p className="text-[10px] text-textSecondary">proyectada</p></div>}
          </div>
        </div>

        {m.hayDatos && (
          <div className="mt-3 space-y-1.5">
            <p className="rounded-sm2 p-3 text-sm font-semibold" style={{ backgroundColor: `${est.color}14`, color: est.color }}>
              {m.estado === 'aprobada' && `¡Aprobada con ${f2(m.final)}! 🎉`}
              {m.estado === 'reprobada' && `Terminó en ${f2(m.final)}: no llegó a ${APRUEBA.toFixed(1)}, la materia se pierde.`}
              {m.estado === 'asegurada' && `¡Ya aseguraste la materia! Con ${f2(m.acumulado)} acumulado aprobarás aunque saques 0 en lo que falta. 🎉`}
              {m.estado === 'imposible' && `Con ${f2(m.acumulado)} acumulado ya no llegas a ${APRUEBA.toFixed(1)}, ni sacando 5.0 en lo que falta (necesitarías ${f2(m.necesariaAprobar)}). Habla con tu profesor sobre opciones.`}
              {(m.estado === 'ok' || m.estado === 'riesgo') && `${ritmoTxt} Para aprobar necesitas promediar ${f2(m.necesariaAprobar)} en el ${Math.round(m.pendiente * 100)}% de la nota que falta.`}
            </p>
            {meta > APRUEBA && m.necesaria != null && m.necesaria > 0 && m.necesaria <= 5 && <p className="text-xs font-semibold text-textSecondary">🎯 Para tu meta de {meta.toFixed(1)} necesitas promediar {f2(m.necesaria)} en lo que falta.</p>}
            {meta > APRUEBA && m.necesaria != null && m.necesaria > 5 && <p className="text-xs font-semibold text-textSecondary">🎯 Tu meta de {meta.toFixed(1)} ya no es alcanzable; aprobar con {APRUEBA.toFixed(1)} sí depende de ti.</p>}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm2 bg-bg p-3">
          <p className="text-xs font-extrabold">Peso de cada corte</p>
          {[0, 1, 2].map(pesoInput)}
          <span className={`text-xs font-bold ${m.pesosValidos ? 'text-success' : 'text-danger'}`}>= {m.pesosSuman}%</span>
          {!m.pesosValidos && <button onClick={() => guardarPesos(autoajustarPesos(pesos))} className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white">Ajustar al 100%</button>}
          {(pesos[0] !== 35 || pesos[1] !== 35 || pesos[2] !== 30) && <button onClick={() => guardarPesos(PESOS_POR_DEFECTO)} className="text-[11px] font-bold text-textSecondary underline">Volver a 35 · 35 · 30</button>}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {m.cortes.map((c) => (
            <Corte key={c.n} c={c} color={colorCorte[c.n - 1]} meta={meta} evs={evals.filter((e) => Number(e.corte) === c.n)}
              tareasDisponibles={tareasDeLaMateria.filter((t) => !evals.some((e) => e.nombre === t.title))}
              onCrear={() => agregarUna(c.n)} onPlantilla={(i) => aplicarPlantilla(c.n, i)} onDesdeTarea={(titulo) => agregarUna(c.n, titulo)}
              onGuardar={guardarCambios} onBorrar={borrar} />
          ))}
        </div>

        {m.hayDatos && m.pendiente > 0.0001 && (
          <div className="mt-4 rounded-sm2 border border-primary/30 bg-primarySoft/40 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-extrabold"><Wand2 size={13} className="text-primary" /> Simulador: ¿y si en todo lo que falta saco…?</p>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={5} step={0.1} value={hipotetica} onChange={(e) => setHipotetica(Number(e.target.value))} className="flex-1 accent-primary" aria-label="Nota hipotética" />
              <span className="w-10 text-center text-sm font-extrabold">{hipotetica.toFixed(1)}</span>
              <span className="text-sm font-bold">→ definitiva <span style={{ color: simular(m, hipotetica) >= APRUEBA ? '#17C964' : '#E5484D' }}>{f2(simular(m, hipotetica))}</span> {simular(m, hipotetica) >= APRUEBA ? '✓' : '✗'}</span>
            </div>
          </div>
        )}
        <p className="mt-3 text-[11px] text-textSecondary">Nota final = Σ (nota de cada corte × peso del corte). Nota de un corte = Σ (nota de cada actividad × su % dentro del corte). Si una actividad tiene partes (talleres, quices…), todas valen lo mismo y su nota es el promedio.</p>
      </div>
    </div>
  );
}
