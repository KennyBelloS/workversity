import { useEffect, useMemo, useState } from 'react';
import { useEscape } from '../hooks/useEscape';
import { Plus, Target, Trash2, PiggyBank, AlertTriangle, Tags, BookOpen, Sprout, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSyncEstado } from '../hooks/useSyncEstado';
import { useCategoriasAhorro } from '../hooks/useCategoriasAhorro';
import ErrorCarga from '../components/ErrorCarga';
import SelectorCategoriaAhorro, { CrearCategoriaForm } from '../components/metas/SelectorCategoriaAhorro';
import { listarMetas, crearMeta, actualizarMeta, eliminarMeta, listarMovimientos, crearMovimiento } from '../services/finanzas';
import { listarAvances, crearAvance, eliminarAvance } from '../services/avances';
import { supabase } from '../services/supabase';
import { esErrorDeRed } from '../offline/sync';
import { currencyFormat, COLORES_SUGERIDOS } from '../lib/constants';
import { resumenAhorro } from '../lib/categoriasAhorro';
import { UNIDADES, PLANTILLAS_PROGRESO, COLOR_CATEGORIA_PROGRESO, ETIQUETA_PROGRESO, estadoProgreso, pasoRapido, fmtNum } from '../lib/progresoMeta';
import { formatearFechaCorta, fechaLocalISO } from '../lib/dateUtils';
import { mostrarSnackbar } from '../lib/snackbar';
import { celebrar } from '../lib/nativo';

const campo = 'w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none';
const esProgreso = (m) => m.tipo === 'progreso';
const fechaLarga = (d) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });

// ---------------------------------------------------------------- Nueva meta / editar meta
function GoalModal({ metaExistente, metas, catAhorro, catProgreso, soportaProgreso, avances, onGuardar, onEliminar, onEliminarAvance, onCerrar }) {
  useEscape(onCerrar);
  const [tipo, setTipo] = useState(metaExistente ? (esProgreso(metaExistente) ? 'progreso' : 'ahorro') : 'ahorro');
  const cat = tipo === 'progreso' ? catProgreso : catAhorro;
  const [title, setTitle] = useState(metaExistente?.title || '');
  const [targetAmount, setTargetAmount] = useState(metaExistente ? String(metaExistente.target_amount) : '');
  const [categoria, setCategoria] = useState(metaExistente?.categoria_vinculada || catAhorro.todas[0]?.nombre || 'Meta personal');
  const [fechaLimite, setFechaLimite] = useState(metaExistente?.fecha_limite || '');
  const [color, setColor] = useState(metaExistente?.color_value || COLORES_SUGERIDOS[0]);
  const [unidad, setUnidad] = useState(metaExistente?.unidad && UNIDADES.includes(metaExistente.unidad) ? metaExistente.unidad : metaExistente?.unidad ? 'otra' : 'páginas');
  const [unidadOtra, setUnidadOtra] = useState(metaExistente?.unidad && !UNIDADES.includes(metaExistente.unidad) ? metaExistente.unidad : '');
  const [yaLlevo, setYaLlevo] = useState('');
  const [error, setError] = useState('');

  const cambiarTipo = (t) => {
    setTipo(t);
    setError('');
    setCategoria((t === 'progreso' ? catProgreso : catAhorro).todas[0]?.nombre || '');
  };
  const aplicarPlantilla = (p) => {
    setTitle(p.titulo); setUnidad(p.unidad); setTargetAmount(String(p.meta)); setCategoria(p.categoria);
    setColor(COLOR_CATEGORIA_PROGRESO[p.categoria] || COLORES_SUGERIDOS[0]);
  };

  const comparte = tipo === 'ahorro' ? metas.find((m) => !esProgreso(m) && m.categoria_vinculada === categoria && m.id !== metaExistente?.id) : null;
  const historial = metaExistente && esProgreso(metaExistente) ? avances.filter((a) => a.meta_id === metaExistente.id).slice(0, 8) : [];
  const unidadFinal = unidad === 'otra' ? unidadOtra.trim() : unidad;

  const guardar = () => {
    const monto = Number(targetAmount);
    if (!title.trim()) return setError('Escribe un título');
    if (!monto || monto <= 0) return setError(tipo === 'progreso' ? 'Escribe cuánto quieres lograr (por ejemplo 300)' : 'Escribe un monto meta válido');
    if (tipo === 'progreso' && !unidadFinal) return setError('Escribe en qué se mide (páginas, horas…)');
    const base = { title: title.trim(), target_amount: monto, categoria_vinculada: categoria, fecha_limite: fechaLimite || null, color_value: color };
    if (tipo === 'progreso') Object.assign(base, { tipo: 'progreso', unidad: unidadFinal });
    onGuardar({ ...(metaExistente || {}), ...base }, tipo === 'progreso' && !metaExistente ? Number(yaLlevo) || 0 : 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-lg2 bg-bg p-5 sm:rounded-lg2">
        <h2 className="mb-3 text-lg font-extrabold">{metaExistente ? 'Editar meta' : 'Nueva meta'}</h2>

        {!metaExistente && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            {[['ahorro', '💰 Ahorro', 'Dinero para algo'], ['progreso', '📖 Progreso', 'Leer, estudiar, ejercicio…']].map(([k, t, s]) => {
              const bloqueado = k === 'progreso' && !soportaProgreso;
              return (
                <button key={k} type="button" disabled={bloqueado} onClick={() => cambiarTipo(k)} className={`rounded-sm2 border p-3 text-left transition disabled:opacity-50 ${tipo === k ? 'border-primary bg-primarySoft' : 'border-black/10 bg-white'}`}>
                  <span className="block text-sm font-extrabold">{t}</span><span className="text-[11px] text-textSecondary">{bloqueado ? 'Falta ejecutar el SQL (ver manual)' : s}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-3">
          {tipo === 'progreso' && !metaExistente && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-textSecondary">Empieza con una idea</p>
              <div className="flex flex-wrap gap-1.5">{PLANTILLAS_PROGRESO.map((p) => <button key={p.titulo} type="button" onClick={() => aplicarPlantilla(p)} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-card">{p.emoji} {p.titulo}</button>)}</div>
            </div>
          )}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tipo === 'progreso' ? 'Ej: Leer «Cien años de soledad»' : 'Ej: Viaje a Cartagena'} className={campo} aria-label="Título de la meta" />
          {error && <p className="text-xs font-semibold text-danger">{error}</p>}

          {tipo === 'progreso' ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" inputMode="decimal" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="Cuánto (ej: 417)" className={campo} aria-label="Cantidad a lograr" />
                <select value={unidad} onChange={(e) => setUnidad(e.target.value)} className={campo} aria-label="Unidad">
                  {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}<option value="otra">otra…</option>
                </select>
              </div>
              {unidad === 'otra' && <input value={unidadOtra} onChange={(e) => setUnidadOtra(e.target.value)} placeholder="Unidad (ej: problemas, canciones)" className={campo} aria-label="Otra unidad" />}
              {!metaExistente && <input type="number" inputMode="decimal" value={yaLlevo} onChange={(e) => setYaLlevo(e.target.value)} placeholder={`Ya llevo… (opcional, en ${unidadFinal || 'unidades'})`} className={campo} aria-label="Ya llevo" />}
            </>
          ) : (
            <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="Monto meta" className={campo} aria-label="Monto meta" />
          )}

          <div>
            <p className="mb-1 text-xs font-semibold text-textSecondary">{tipo === 'progreso' ? 'Categoría' : '¿A qué categoría va el dinero de esta meta?'}</p>
            <SelectorCategoriaAhorro value={categoria} onChange={setCategoria} cat={cat} />
            {comparte && <p className="mt-1.5 flex items-start gap-1 text-[11px] font-semibold text-warning"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> La meta «{comparte.title}» ya usa esta categoría: el dinero contará para las dos. Crea una categoría nueva si quieres separarlo.</p>}
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold text-textSecondary">Fecha límite {tipo === 'progreso' ? '(con ella calculo cuánto necesitas por día)' : '(opcional)'}</p>
            <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} className={campo} aria-label="Fecha límite" />
          </div>
          <div className="flex gap-2">
            {COLORES_SUGERIDOS.map((c) => <button key={c} onClick={() => setColor(c)} className="h-8 w-8 rounded-full" style={{ backgroundColor: c, outline: color === c ? `2.5px solid ${c}` : 'none', outlineOffset: 2 }} />)}
          </div>

          {historial.length > 0 && (
            <div className="rounded-sm2 bg-white p-3 shadow-card">
              <p className="mb-2 text-xs font-extrabold">Últimos avances</p>
              <ul className="space-y-1">
                {historial.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-xs">
                    <span className="w-14 shrink-0 text-textSecondary">{formatearFechaCorta(a.fecha)}</span>
                    <b>+{fmtNum(a.cantidad)} {metaExistente.unidad}</b>
                    <span className="min-w-0 flex-1 truncate text-textSecondary">{a.nota}</span>
                    <button onClick={() => onEliminarAvance(a.id)} aria-label="Quitar avance" className="text-textSecondary hover:text-danger"><X size={13} /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {metaExistente && <button onClick={() => onEliminar(metaExistente)} className="flex items-center justify-center gap-2 rounded-sm2 border border-danger/30 px-4 py-3.5 text-sm font-bold text-danger"><Trash2 size={16} /></button>}
            <button onClick={guardar} className="flex-1 rounded-sm2 bg-primary py-3.5 text-sm font-bold text-white hover:bg-primaryDark">Guardar</button>
            <button onClick={onCerrar} className="rounded-sm2 px-4 text-sm font-bold text-textSecondary">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Aportar dinero
function AporteModal({ meta, onGuardar, onCerrar }) {
  useEscape(onCerrar);
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(fechaLocalISO());
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const guardar = () => {
    const m = Number(monto);
    if (!m || m <= 0) return setError('Escribe un monto válido');
    onGuardar({ type: 'ahorro', amount: m, category: meta.categoria_vinculada, note: nota.trim() || `Aporte a ${meta.title}`, date: new Date(`${fecha}T12:00:00`).toISOString() });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onCerrar}>
      <div className="w-full max-w-sm rounded-t-lg2 bg-bg p-5 sm:rounded-lg2" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-extrabold">Aportar a «{meta.title}»</h2>
        <p className="mb-3 mt-0.5 text-xs text-textSecondary">Va a la categoría <b style={{ color: meta.color_value }}>{meta.categoria_vinculada}</b>.</p>
        <div className="space-y-3">
          <input type="number" inputMode="decimal" autoFocus value={monto} onChange={(e) => { setMonto(e.target.value); setError(''); }} placeholder="Monto" aria-label="Monto del aporte" className={`${campo} text-lg font-bold`} />
          {error && <p className="text-xs font-semibold text-danger">{error}</p>}
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} aria-label="Fecha" />
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional)" className={campo} />
          <div className="flex gap-3">
            <button onClick={guardar} className="flex-1 rounded-sm2 bg-primary py-3 text-sm font-bold text-white">Guardar aporte</button>
            <button onClick={onCerrar} className="rounded-sm2 px-4 text-sm font-bold text-textSecondary">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Registrar avance (leer, estudiar…)
function AvanceModal({ meta, estado, onGuardar, onCerrar }) {
  useEscape(onCerrar);
  const paso = pasoRapido(meta.unidad);
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(fechaLocalISO());
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const n = Number(cantidad) || 0;
  const nuevoTotal = estado.total + n;
  const guardar = () => {
    if (!n || n <= 0) return setError('Escribe cuánto avanzaste');
    onGuardar({ cantidad: n, nota: nota.trim(), fecha: new Date(`${fecha}T12:00:00`).toISOString() });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onCerrar}>
      <div className="w-full max-w-sm rounded-t-lg2 bg-bg p-5 sm:rounded-lg2" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-extrabold">Registrar avance</h2>
        <p className="mb-3 mt-0.5 text-xs text-textSecondary">«{meta.title}» · llevas {fmtNum(estado.total)} de {fmtNum(estado.objetivo)} {meta.unidad}</p>
        <div className="space-y-3">
          <input type="number" inputMode="decimal" autoFocus value={cantidad} onChange={(e) => { setCantidad(e.target.value); setError(''); }} placeholder={`¿Cuántas ${meta.unidad}?`} aria-label="Cantidad del avance" className={`${campo} text-lg font-bold`} />
          <div className="flex gap-2">{[paso, paso * 2, paso * 5].map((q) => <button key={q} type="button" onClick={() => setCantidad(String(q))} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-card">{q}</button>)}</div>
          {error && <p className="text-xs font-semibold text-danger">{error}</p>}
          {n > 0 && <p className="rounded-sm2 bg-primarySoft/60 p-2.5 text-xs font-semibold text-primary">Quedarás en {fmtNum(Math.min(nuevoTotal, estado.objetivo))} de {fmtNum(estado.objetivo)} ({Math.round(Math.min(nuevoTotal / estado.objetivo, 1) * 100)}%){nuevoTotal >= estado.objetivo ? ' — ¡la terminas! 🎉' : ''}</p>}
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} aria-label="Fecha" />
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional): ¿qué leíste, qué aprendiste?" className={campo} />
          <div className="flex gap-3">
            <button onClick={guardar} className="flex-1 rounded-sm2 bg-primary py-3 text-sm font-bold text-white">Guardar avance</button>
            <button onClick={onCerrar} className="rounded-sm2 px-4 text-sm font-bold text-textSecondary">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Paneles de categorías
function DestinoDelAhorro({ resumen, cat }) {
  const [creando, setCreando] = useState(false);
  const borrar = async (f) => { if (window.confirm(`¿Eliminar la categoría «${f.nombre}»? No tiene dinero ni metas.`)) await cat.eliminar(f.id); };
  return (
    <section className="mb-5 rounded-md2 bg-white p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-extrabold"><Tags size={16} className="text-primary" /> ¿A dónde va tu ahorro?</p>
          <p className="text-xs text-textSecondary">Total ahorrado: <b className="text-textPrimary">{currencyFormat.format(resumen.total)}</b></p>
        </div>
        {cat.disponible && !creando && <button onClick={() => setCreando(true)} className="flex items-center gap-1 rounded-full bg-primarySoft px-3 py-1.5 text-xs font-bold text-primary"><Plus size={13} /> Nueva categoría</button>}
      </div>
      {creando && <div className="mb-3"><CrearCategoriaForm cat={cat} onCreada={() => setCreando(false)} onCancelar={() => setCreando(false)} /></div>}
      {!cat.disponible && <p className="mb-3 rounded-sm2 bg-warningSoft p-2.5 text-xs font-semibold text-warning">Para crear categorías propias falta ejecutar el SQL de categorías (ver el manual).</p>}
      {resumen.total > 0 && (
        <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-bg" role="img" aria-label="Distribución del ahorro por categoría">
          {resumen.filas.filter((f) => f.total > 0).map((f) => <span key={f.nombre} title={f.nombre} style={{ width: `${(f.total / resumen.total) * 100}%`, backgroundColor: f.color }} />)}
        </div>
      )}
      <div className="space-y-1.5">
        {resumen.filas.map((f) => {
          const libre = f.propia && f.total === 0 && f.metas.length === 0;
          return (
            <div key={f.nombre} className="flex items-center gap-3 rounded-sm2 bg-bg p-2.5">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: f.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{f.nombre}{f.propia && <span className="ml-1 text-[10px] text-textSecondary">★ tuya</span>}{f.huerfana && <span className="ml-1 text-[10px] text-textSecondary">(ya no existe)</span>}</span>
                <span className="block truncate text-[11px] text-textSecondary">{f.metas.length > 0 ? `🎯 ${f.metas.map((m) => m.title).join(' · ')}` : f.total > 0 ? '⚠️ Sin meta vinculada' : 'Aún sin ahorros ni metas'}</span>
              </span>
              <span className="text-right"><span className="block text-sm font-extrabold">{currencyFormat.format(f.total)}</span>{resumen.total > 0 && f.total > 0 && <span className="text-[10px] text-textSecondary">{Math.round((f.total / resumen.total) * 100)}%</span>}</span>
              {f.propia && <button onClick={() => borrar(f)} disabled={!libre} aria-label={`Eliminar ${f.nombre}`} title={libre ? 'Eliminar categoría' : 'Está en uso: tiene ahorros o metas'} className="shrink-0 rounded p-1 text-textSecondary hover:text-danger disabled:opacity-30"><Trash2 size={14} /></button>}
            </div>
          );
        })}
      </div>
      {resumen.sinMeta.length > 0 && <p className="mt-3 flex items-start gap-1.5 text-[11px] font-semibold text-warning"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> Tienes {currencyFormat.format(resumen.sinMeta.reduce((s, f) => s + f.total, 0))} ahorrados en categorías sin meta ({resumen.sinMeta.map((f) => f.nombre).join(', ')}). Crea una meta para darles un propósito.</p>}
    </section>
  );
}

function PanelProgreso({ cat, metasP, estados }) {
  const [creando, setCreando] = useState(false);
  const filas = cat.todas.map((c) => {
    const suyas = metasP.filter((m) => m.categoria_vinculada === c.nombre);
    const es = suyas.map((m) => estados.get(m.id));
    return { ...c, metas: suyas, hechas: es.filter((e) => e?.hecho).length, pct: es.length ? es.reduce((s, e) => s + (e?.pct || 0), 0) / es.length : 0 };
  }).filter((f) => f.metas.length > 0 || f.propia);
  const borrar = async (f) => { if (window.confirm(`¿Eliminar la categoría «${f.nombre}»?`)) await cat.eliminar(f.id); };
  return (
    <section className="mb-5 rounded-md2 bg-white p-4 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div><p className="flex items-center gap-2 text-sm font-extrabold"><Sprout size={16} className="text-primary" /> Tus metas de progreso por categoría</p>
          <p className="text-xs text-textSecondary">{metasP.length} meta{metasP.length !== 1 ? 's' : ''} · {metasP.filter((m) => estados.get(m.id)?.hecho).length} terminada{metasP.filter((m) => estados.get(m.id)?.hecho).length !== 1 ? 's' : ''}</p></div>
        {cat.disponible && !creando && <button onClick={() => setCreando(true)} className="flex items-center gap-1 rounded-full bg-primarySoft px-3 py-1.5 text-xs font-bold text-primary"><Plus size={13} /> Nueva categoría</button>}
      </div>
      {creando && <div className="mb-3"><CrearCategoriaForm cat={cat} onCreada={() => setCreando(false)} onCancelar={() => setCreando(false)} /></div>}
      {filas.length === 0 ? <p className="rounded-sm2 bg-bg py-6 text-center text-xs text-textSecondary">Crea una meta de progreso (por ejemplo, leer un libro) y aparecerá aquí.</p> : (
        <div className="space-y-1.5">
          {filas.map((f) => (
            <div key={f.nombre} className="flex items-center gap-3 rounded-sm2 bg-bg p-2.5">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: f.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{f.nombre}{f.propia && <span className="ml-1 text-[10px] text-textSecondary">★ tuya</span>}</span>
                <span className="block truncate text-[11px] text-textSecondary">{f.metas.length > 0 ? f.metas.map((m) => m.title).join(' · ') : 'Aún sin metas'}</span>
              </span>
              {f.metas.length > 0 && <span className="w-24 shrink-0"><span className="block h-1.5 overflow-hidden rounded-full bg-white"><span className="block h-full rounded-full" style={{ width: `${f.pct * 100}%`, backgroundColor: f.color }} /></span><span className="text-[10px] text-textSecondary">{Math.round(f.pct * 100)}% · {f.hechas}/{f.metas.length}</span></span>}
              {f.propia && <button onClick={() => borrar(f)} disabled={f.metas.length > 0} aria-label={`Eliminar ${f.nombre}`} title={f.metas.length ? 'Está en uso' : 'Eliminar categoría'} className="shrink-0 rounded p-1 text-textSecondary hover:text-danger disabled:opacity-30"><Trash2 size={14} /></button>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- Tarjetas
function MiniActividad({ dias, color }) {
  const max = Math.max(1, ...dias.map((d) => d.cantidad));
  return (
    <div className="mt-2 flex h-8 items-end gap-[3px]" role="img" aria-label="Avances de los últimos 14 días">
      {dias.map((d, i) => <span key={d.fecha} title={`${d.fecha}: ${fmtNum(d.cantidad)}`} className="flex-1 rounded-sm" style={{ height: `${Math.max(d.cantidad ? 14 : 5, (d.cantidad / max) * 100)}%`, backgroundColor: d.cantidad ? color : 'rgba(120,130,150,0.25)', opacity: d.cantidad ? 0.5 + (i / dias.length) * 0.5 : 1 }} />)}
    </div>
  );
}

function TarjetaProgreso({ meta, e, categoria, onEditar, onAvance, onRapido }) {
  const et = ETIQUETA_PROGRESO[e.estado];
  const paso = pasoRapido(meta.unidad);
  let linea;
  if (e.hecho) linea = '🎉 ¡Meta cumplida!';
  else if (e.estado === 'vencida') linea = `El plazo terminó; te faltaron ${fmtNum(e.faltante)} ${meta.unidad}.`;
  else if (e.ritmo > 0) linea = `A tu ritmo (≈${fmtNum(e.ritmo)} ${meta.unidad}/día) terminas el ${fechaLarga(e.fechaEstimada)}.`;
  else if (e.necesarioPorDia) linea = `Necesitas ≈${fmtNum(e.necesarioPorDia)} ${meta.unidad}/día para llegar a tiempo.`;
  else linea = 'Registra tu primer avance para calcular tu ritmo.';
  return (
    <div className="rounded-md2 bg-white p-4 shadow-card transition hover:shadow-md">
      <button onClick={onEditar} className="block w-full text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate font-bold text-textPrimary">{meta.title}</p>
          <span className="shrink-0 text-sm font-extrabold" style={{ color: meta.color_value }}>{Math.round(e.pct * 100)}%</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${categoria?.color || '#8B93A7'}22`, color: categoria?.color || '#8B93A7' }}><BookOpen size={10} /> {meta.categoria_vinculada}</span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ backgroundColor: `${et.color}1F`, color: et.color }}>{et.texto}</span>
          {e.racha > 1 && <span className="text-[10px] font-bold text-warning">🔥 {e.racha} días</span>}
        </div>
        {meta.fecha_limite && <p className="mt-1 text-[11px] text-textSecondary">Antes del {formatearFechaCorta(meta.fecha_limite)}{e.diasRestantes > 0 ? ` · quedan ${e.diasRestantes} días` : ''}</p>}
        <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${e.pct * 100}%`, backgroundColor: meta.color_value }} /></div>
        <p className="mt-1.5 text-xs font-semibold">{fmtNum(e.total)} <span className="font-normal text-textSecondary">de {fmtNum(e.objetivo)} {meta.unidad}</span></p>
        <p className="mt-1 text-[11px] text-textSecondary">{linea}</p>
        <MiniActividad dias={e.ultimos} color={meta.color_value} />
      </button>
      {!e.hecho && (
        <div className="mt-3 flex gap-2">
          <button onClick={onRapido} className="rounded-sm2 bg-primarySoft px-3 py-2 text-xs font-extrabold text-primary" aria-label={`Sumar ${paso} ${meta.unidad}`}>+{fmtNum(paso)}</button>
          <button onClick={onAvance} className="flex flex-1 items-center justify-center gap-1.5 rounded-sm2 border border-primary/30 py-2 text-xs font-bold text-primary"><Sprout size={14} /> Registrar avance</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Página
export default function Metas() {
  const { usuario } = useAuth();
  const catAhorro = useCategoriasAhorro('ahorro');
  const catProgreso = useCategoriasAhorro('progreso');
  const [metas, setMetas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [avances, setAvances] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [aportando, setAportando] = useState(null);
  const [avanzando, setAvanzando] = useState(null);
  const [soportaProgreso, setSoportaProgreso] = useState(true);
  const [error, setError] = useState('');
  const { version } = useSyncEstado();

  const cargar = async () => {
    try {
      const [m, mov, av] = await Promise.all([listarMetas(), listarMovimientos(), listarAvances()]);
      setMetas(m); setMovimientos(mov); setAvances(av.lista); setError('');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setCargando(false);
    }
  };
   
  useEffect(() => { cargar(); }, [version]);

  // ¿Ya se ejecutó el SQL de las metas de progreso? Si no, se avisa en vez de fallar en silencio.
  useEffect(() => {
    let vivo = true;
    (async () => {
      if (navigator.onLine === false) return;
      try {
        const a = await supabase.from('metas').select('tipo,unidad').limit(1);
        const b = await supabase.from('avances_meta').select('id').limit(1);
        const fallo = a.error || b.error;
        if (vivo && fallo && !esErrorDeRed(fallo)) setSoportaProgreso(false);
      } catch { /* sin conexión: se asume que sí */ }
    })();
    return () => { vivo = false; };
  }, []);

  const metasAhorro = useMemo(() => metas.filter((m) => !esProgreso(m)), [metas]);
  const metasProg = useMemo(() => metas.filter(esProgreso), [metas]);
  const resumen = useMemo(() => resumenAhorro({ categorias: catAhorro.todas, movimientos, metas: metasAhorro }), [catAhorro.todas, movimientos, metasAhorro]);
  const estados = useMemo(() => new Map(metasProg.map((m) => [m.id, estadoProgreso({ meta: m, avances: avances.filter((a) => a.meta_id === m.id), ahora: new Date() })])), [metasProg, avances]);
  const progresoAhorro = (meta) => movimientos.filter((m) => m.type === 'ahorro' && m.category === meta.categoria_vinculada).reduce((s, m) => s + Number(m.amount), 0);

  const guardar = async (meta, yaLlevo) => {
    if (meta.id) {
       
      const { id, user_id, created_at, ...cambios } = meta;
      await actualizarMeta(id, cambios);
    } else {
      const nueva = await crearMeta(meta, usuario.id);
      if (yaLlevo > 0) await crearAvance({ meta_id: nueva.id, cantidad: yaLlevo, nota: 'Avance inicial', fecha: new Date().toISOString() }, usuario.id);
    }
    await cargar(); setModalAbierto(false); setEditando(null);
  };
  const eliminar = async (meta) => { await eliminarMeta(meta.id); await cargar(); setModalAbierto(false); setEditando(null); };
  const aportar = async (mov) => { await crearMovimiento(mov, usuario.id); await cargar(); setAportando(null); };

  const registrar = async (meta, datos) => {
    const antes = estados.get(meta.id);
    const fila = await crearAvance({ meta_id: meta.id, cantidad: datos.cantidad, nota: datos.nota || '', fecha: datos.fecha || new Date().toISOString() }, usuario.id);
    await cargar();
    setAvanzando(null);
    const termina = antes && !antes.hecho && antes.total + datos.cantidad >= antes.objetivo;
    if (termina) { celebrar(); mostrarSnackbar({ texto: `🎉 ¡Terminaste «${meta.title}»!`, ms: 6000 }); return; }
    mostrarSnackbar({ texto: `+${fmtNum(datos.cantidad)} ${meta.unidad} en «${meta.title}»`, etiqueta: 'Deshacer', onAccion: async () => { await eliminarAvance(fila.id); await cargar(); } });
  };
  const quitarAvance = async (id) => { await eliminarAvance(id); await cargar(); };

  if (cargando) return <p className="py-10 text-center text-sm text-textSecondary">Cargando…</p>;

  const visibles = metas.filter((m) => filtro === 'todas' || (filtro === 'progreso') === esProgreso(m));
  const chip = (k, t) => <button key={k} onClick={() => setFiltro(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${filtro === k ? 'bg-primary text-white' : 'bg-white text-textSecondary shadow-card'}`}>{t}</button>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-textSecondary">Ahorra con propósito y avanza en lo que te importa: leer un libro, un curso, ejercicio…</p>
        <button onClick={() => { setEditando(null); setModalAbierto(true); }} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primaryDark"><Plus size={18} /> Nueva meta</button>
      </div>

      <ErrorCarga mensaje={error} />

      <div className="mb-4 flex flex-wrap gap-2">
        {chip('todas', `Todas (${metas.length})`)}{chip('ahorro', `💰 Ahorro (${metasAhorro.length})`)}{chip('progreso', `📖 Progreso (${metasProg.length})`)}
      </div>

      {filtro === 'progreso' ? <PanelProgreso cat={catProgreso} metasP={metasProg} estados={estados} /> : <DestinoDelAhorro resumen={resumen} cat={catAhorro} />}
      {!soportaProgreso && <p className="mb-4 rounded-sm2 bg-warningSoft p-3 text-xs font-semibold text-warning">Para usar metas de progreso (leer, estudiar…) falta ejecutar el SQL nuevo de <code>supabase/schema.sql</code> (ver el manual).</p>}

      {visibles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md2 bg-white py-16 shadow-card">
          <Target size={32} className="text-textSecondary/40" />
          <p className="text-sm text-textSecondary">{filtro === 'progreso' ? 'Crea una meta de progreso: por ejemplo, leer un libro' : 'Crea una meta para empezar con propósito'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((meta) => {
            if (esProgreso(meta)) {
              const e = estados.get(meta.id);
              return <TarjetaProgreso key={meta.id} meta={meta} e={e} categoria={catProgreso.todas.find((c) => c.nombre === meta.categoria_vinculada)} onEditar={() => { setEditando(meta); setModalAbierto(true); }} onAvance={() => setAvanzando(meta)} onRapido={() => registrar(meta, { cantidad: pasoRapido(meta.unidad) })} />;
            }
            const progreso = progresoAhorro(meta);
            const porcentaje = Math.min(progreso / Number(meta.target_amount), 1);
            const c = catAhorro.todas.find((x) => x.nombre === meta.categoria_vinculada);
            return (
              <div key={meta.id} className="rounded-md2 bg-white p-4 shadow-card transition hover:shadow-md">
                <button onClick={() => { setEditando(meta); setModalAbierto(true); }} className="block w-full text-left">
                  <div className="flex items-center justify-between"><p className="font-bold text-textPrimary">{meta.title}</p><span className="text-sm font-extrabold" style={{ color: meta.color_value }}>{Math.round(porcentaje * 100)}%</span></div>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${c?.color || '#8B93A7'}22`, color: c?.color || '#8B93A7' }}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c?.color || '#8B93A7' }} /> {meta.categoria_vinculada}</span>
                  {meta.fecha_limite && <p className="mt-1 text-[11px] text-textSecondary">Antes del {formatearFechaCorta(meta.fecha_limite)}</p>}
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full" style={{ width: `${porcentaje * 100}%`, backgroundColor: meta.color_value }} /></div>
                  <p className="mt-2 text-xs text-textSecondary">{currencyFormat.format(progreso)} de {currencyFormat.format(meta.target_amount)}</p>
                </button>
                <button onClick={() => setAportando(meta)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-sm2 border border-primary/30 py-2 text-xs font-bold text-primary"><PiggyBank size={14} /> Aportar</button>
              </div>
            );
          })}
        </div>
      )}

      {modalAbierto && <GoalModal metaExistente={editando} metas={metas} catAhorro={catAhorro} catProgreso={catProgreso} soportaProgreso={soportaProgreso} avances={avances} onGuardar={guardar} onEliminar={eliminar} onEliminarAvance={quitarAvance} onCerrar={() => { setModalAbierto(false); setEditando(null); }} />}
      {aportando && <AporteModal meta={aportando} onGuardar={aportar} onCerrar={() => setAportando(null)} />}
      {avanzando && <AvanceModal meta={avanzando} estado={estados.get(avanzando.id)} onGuardar={(d) => registrar(avanzando, d)} onCerrar={() => setAvanzando(null)} />}
    </div>
  );
}
