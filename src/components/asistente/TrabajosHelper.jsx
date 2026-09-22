import { useEffect, useMemo, useState } from 'react';
import { ListChecks, BookMarked, Type, Copy, Check, Trash2, Wand2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { crearTarea } from '../../services/tareas';
import { TIPOS_TRABAJO, planificarEntrega, referenciaAPA, estadisticasTexto } from '../../lib/trabajos';
import { formatearFechaHora } from '../../lib/dateUtils';
import { useHabitos } from '../../hooks/useHabitos';
import { minutosAjustados } from '../../lib/habitos';

const CLAVE_REFS = 'workversity:referencias';
const campo = 'w-full rounded-sm2 bg-primarySoft/60 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary';

async function copiarRico(html, texto) {
  try {
    if (window.ClipboardItem) {
      await navigator.clipboard.write([new window.ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([texto], { type: 'text/plain' }) })]);
      return;
    }
  } catch { /* se intenta texto plano */ }
  await navigator.clipboard.writeText(texto);
}

function Seccion({ icono: Icono, titulo, sub, children }) {
  return (
    <section className="rounded-md2 bg-white p-4 shadow-card">
      <p className="flex items-center gap-2 text-sm font-extrabold"><Icono size={16} className="text-primary" /> {titulo}</p>
      {sub && <p className="mb-3 text-xs text-textSecondary">{sub}</p>}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------- Planificador de entrega
function Planificador({ tareas }) {
  const { usuario } = useAuth();
  const candidatas = tareas.filter((t) => t.status !== 'hecha' && !t.parent_task_id && new Date(t.due_date) > new Date());
  const [tareaId, setTareaId] = useState('');
  const [tipo, setTipo] = useState('ensayo');
  const [manual, setManual] = useState(null);
  const { habitos, aprender } = useHabitos();
  const [mensaje, setMensaje] = useState('');
  const tarea = candidatas.find((t) => t.id === tareaId);
  const estimados = tarea?.estimated_minutes || 240;
  const sugeridos = minutosAjustados(estimados, habitos, aprender);
  const minutos = manual ?? sugeridos;
  const plan = useMemo(() => (tarea ? planificarEntrega({ tipo, vence: tarea.due_date, minutosTotales: Number(minutos) || 240 }) : []), [tarea, tipo, minutos]);
  const yaTiene = tarea && tareas.some((t) => t.parent_task_id === tarea.id);

  const crear = async () => {
    for (const e of plan) {
      await crearTarea(
        {
          title: `${e.nombre} — ${tarea.title}`, description: '', category: tarea.category, materia_id: tarea.materia_id || null, priority: tarea.priority,
          due_date: e.due.toISOString(), has_reminder: true, reminder_minutes_before: 60, photo_paths: [], status: 'pendiente', is_recurring: false,
          recurrence_interval_days: 7, estimated_minutes: e.minutos, parent_task_id: tarea.id,
        },
        usuario.id
      );
    }
    setMensaje(`✅ Se crearon ${plan.length} sub-tareas. Las verás en Tareas y en tu agenda, con sus recordatorios.`);
  };

  return (
    <Seccion icono={Wand2} titulo="Planificador de entregas" sub="Elige un trabajo grande y lo divido en etapas con fechas, para no dejarlo todo para el último día.">
      {candidatas.length === 0 ? (
        <p className="rounded-sm2 bg-bg py-6 text-center text-xs text-textSecondary">Crea primero una tarea con fecha de entrega futura.</p>
      ) : (
        <div className="space-y-3">
          <select value={tareaId} onChange={(e) => { setTareaId(e.target.value); setMensaje(''); setManual(null); }} className={campo}>
            <option value="">Elige la tarea a planificar…</option>
            {candidatas.map((t) => <option key={t.id} value={t.id}>{t.title} · {formatearFechaHora(t.due_date)}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={campo}>
              {Object.entries(TIPOS_TRABAJO).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
            </select>
            <input type="number" min={30} step={30} value={minutos} onChange={(e) => setManual(e.target.value)} className={campo} placeholder="Minutos totales" title="Minutos totales de trabajo" />
          </div>
          {tarea && sugeridos !== estimados && manual == null && (
            <p className="rounded-sm2 bg-primarySoft/50 p-2 text-[11px] font-semibold text-primary">🧠 Tu estimado era {estimados} min; por lo que tardas normalmente (×{habitos.estimacion.factor.toFixed(2)}) planifico {sugeridos} min.</p>
          )}
          {tarea && (
            <>
              {yaTiene && <p className="rounded-sm2 bg-warningSoft p-2.5 text-xs font-semibold text-warning">Esta tarea ya tiene sub-tareas; crear el plan añadirá más.</p>}
              <div className="space-y-1.5">
                {plan.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-sm2 bg-bg p-2.5 text-xs">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-extrabold text-primary">{i + 1}</span>
                    <span className="min-w-0 flex-1 font-bold">{e.nombre}</span>
                    <span className="shrink-0 text-right text-textSecondary">{formatearFechaHora(e.due.toISOString())}<br />~{e.minutos} min</span>
                  </div>
                ))}
              </div>
              <button onClick={crear} disabled={plan.length === 0 || !!mensaje} className="w-full rounded-sm2 bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50">Crear estas sub-tareas</button>
              {mensaje && <p className="text-xs font-semibold text-success">{mensaje}</p>}
            </>
          )}
        </div>
      )}
    </Seccion>
  );
}

// ---------------------------------------------------------------- Estructura y checklist
function Estructura() {
  const [tipo, setTipo] = useState('ensayo');
  const [marcados, setMarcados] = useState({});
  const [copiado, setCopiado] = useState(false);
  const t = TIPOS_TRABAJO[tipo];
  const copiar = async () => {
    await navigator.clipboard.writeText(t.estructura.map((x, i) => `${i + 1}. ${x}`).join('\n'));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };
  return (
    <Seccion icono={ListChecks} titulo="Estructura y lista de revisión" sub="Una guía para no olvidar nada antes de entregar.">
      <select value={tipo} onChange={(e) => { setTipo(e.target.value); setMarcados({}); }} className={`${campo} mb-3`}>
        {Object.entries(TIPOS_TRABAJO).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
      </select>
      <div className="mb-1 flex items-center justify-between"><p className="text-xs font-extrabold">Estructura sugerida</p>
        <button onClick={copiar} className="flex items-center gap-1 text-[11px] font-bold text-primary">{copiado ? <Check size={12} /> : <Copy size={12} />} {copiado ? 'Copiada' : 'Copiar'}</button></div>
      <ol className="mb-4 list-decimal space-y-1 pl-5 text-xs">{t.estructura.map((x) => <li key={x}>{x}</li>)}</ol>
      <p className="mb-1 text-xs font-extrabold">Antes de entregar <span className="font-medium text-textSecondary">({Object.values(marcados).filter(Boolean).length}/{t.checklist.length})</span></p>
      <div className="space-y-1.5">
        {t.checklist.map((x) => (
          <label key={x} className="flex cursor-pointer items-start gap-2 rounded-sm2 bg-bg p-2 text-xs">
            <input type="checkbox" checked={!!marcados[x]} onChange={(e) => setMarcados((m) => ({ ...m, [x]: e.target.checked }))} className="mt-0.5 accent-primary" />
            <span className={marcados[x] ? 'text-textSecondary line-through' : ''}>{x}</span>
          </label>
        ))}
      </div>
    </Seccion>
  );
}

// ---------------------------------------------------------------- Referencias APA
const VACIO = { autores: '', anio: '', titulo: '', editorial: '', edicion: '', revista: '', volumen: '', numero: '', paginas: '', doi: '', sitio: '', fecha: '', url: '' };

function Referencias() {
  const [tipo, setTipo] = useState('libro');
  const [c, setC] = useState(VACIO);
  const [lista, setLista] = useState(() => { try { return JSON.parse(localStorage.getItem(CLAVE_REFS) || '[]'); } catch { return []; } });
  const [copiado, setCopiado] = useState('');
  const set = (k) => (e) => setC((x) => ({ ...x, [k]: e.target.value }));
  const ref = c.titulo.trim() ? referenciaAPA(tipo, c) : null;

  useEffect(() => { try { localStorage.setItem(CLAVE_REFS, JSON.stringify(lista)); } catch { /* nada */ } }, [lista]);

  const marcar = (k) => { setCopiado(k); setTimeout(() => setCopiado(''), 1800); };
  const copiarUna = async () => { await copiarRico(ref.html, ref.texto); marcar('una'); };
  const guardar = () => { setLista((l) => [...l, ref]); setC(VACIO); };
  const copiarTodas = async () => {
    const orden = [...lista].sort((a, b) => a.texto.localeCompare(b.texto, 'es'));
    await copiarRico(orden.map((r) => `<p style="padding-left:2em;text-indent:-2em">${r.html}</p>`).join(''), orden.map((r) => r.texto).join('\n\n'));
    marcar('todas');
  };

  return (
    <Seccion icono={BookMarked} titulo="Generador de referencias APA 7" sub="Llena los datos y copia la referencia (con cursivas). Guarda varias y cópialas juntas, ordenadas.">
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {[['libro', 'Libro'], ['articulo', 'Artículo'], ['web', 'Página web']].map(([k, t]) => (
          <button key={k} onClick={() => setTipo(k)} className={`rounded-sm2 py-2 text-xs font-bold ${tipo === k ? 'bg-primary text-white' : 'bg-bg text-textSecondary'}`}>{t}</button>
        ))}
      </div>
      <div className="space-y-2">
        <input value={c.autores} onChange={set('autores')} placeholder="Autores: Apellido, Nombre; Apellido, Nombre" className={campo} />
        <div className="grid grid-cols-2 gap-2">
          <input value={c.anio} onChange={set('anio')} placeholder="Año (vacío = s. f.)" className={campo} />
          {tipo === 'web' && <input value={c.fecha} onChange={set('fecha')} placeholder="Día y mes (ej. 5 de mayo)" className={campo} />}
          {tipo === 'libro' && <input value={c.edicion} onChange={set('edicion')} placeholder="Edición (ej. 2.ª)" className={campo} />}
          {tipo === 'articulo' && <input value={c.revista} onChange={set('revista')} placeholder="Nombre de la revista" className={campo} />}
        </div>
        <input value={c.titulo} onChange={set('titulo')} placeholder="Título" className={campo} />
        {tipo === 'libro' && <input value={c.editorial} onChange={set('editorial')} placeholder="Editorial" className={campo} />}
        {tipo === 'articulo' && (
          <div className="grid grid-cols-3 gap-2">
            <input value={c.volumen} onChange={set('volumen')} placeholder="Volumen" className={campo} />
            <input value={c.numero} onChange={set('numero')} placeholder="Número" className={campo} />
            <input value={c.paginas} onChange={set('paginas')} placeholder="Páginas" className={campo} />
          </div>
        )}
        {tipo === 'web' && <input value={c.sitio} onChange={set('sitio')} placeholder="Nombre del sitio web" className={campo} />}
        <input value={tipo === 'articulo' ? c.doi : c.url} onChange={set(tipo === 'articulo' ? 'doi' : 'url')} placeholder={tipo === 'articulo' ? 'DOI o enlace' : 'Enlace (opcional en libros)'} className={campo} />
      </div>

      {ref && (
        <div className="mt-3 rounded-sm2 border border-primary/30 bg-primarySoft/40 p-3">
          <p className="text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: ref.html }} />
          <div className="mt-2 flex gap-2">
            <button onClick={copiarUna} className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-white">{copiado === 'una' ? <Check size={12} /> : <Copy size={12} />} {copiado === 'una' ? 'Copiada' : 'Copiar'}</button>
            <button onClick={guardar} className="rounded-full border border-primary/40 px-3 py-1.5 text-[11px] font-bold text-primary">Guardar en mi lista</button>
          </div>
        </div>
      )}

      {lista.length > 0 && (
        <div className="mt-4 border-t border-black/5 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-extrabold">Mi lista ({lista.length})</p>
            <button onClick={copiarTodas} className="flex items-center gap-1 text-[11px] font-bold text-primary">{copiado === 'todas' ? <Check size={12} /> : <Copy size={12} />} {copiado === 'todas' ? 'Copiadas' : 'Copiar todas (A-Z)'}</button>
          </div>
          <ul className="space-y-1.5">
            {lista.map((r, i) => (
              <li key={i} className="flex items-start gap-2 rounded-sm2 bg-bg p-2 text-[11px] leading-relaxed">
                <span className="min-w-0 flex-1" dangerouslySetInnerHTML={{ __html: r.html }} />
                <button onClick={() => setLista((l) => l.filter((_, k) => k !== i))} aria-label="Quitar" className="shrink-0 text-textSecondary hover:text-danger"><Trash2 size={13} /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Seccion>
  );
}

// ---------------------------------------------------------------- Contador de texto
function Contador() {
  const [texto, setTexto] = useState('');
  const [meta, setMeta] = useState('');
  const e = estadisticasTexto(texto);
  const pct = meta ? Math.min(100, Math.round((e.palabras / Number(meta)) * 100)) : null;
  const dato = (v, t) => (<div className="rounded-sm2 bg-bg px-2 py-2 text-center"><p className="text-base font-extrabold">{v}</p><p className="text-[10px] text-textSecondary">{t}</p></div>);
  return (
    <Seccion icono={Type} titulo="Contador y tiempo de exposición" sub="Pega tu texto: cuenta palabras y te dice cuánto tardas en leerlo o exponerlo.">
      <textarea value={texto} onChange={(ev) => setTexto(ev.target.value)} rows={5} placeholder="Pega o escribe aquí tu texto…" className={campo} />
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {dato(e.palabras, 'palabras')}{dato(e.caracteres, 'caracteres')}{dato(e.sinEspacios, 'sin espacios')}
        {dato(e.oraciones, 'oraciones')}{dato(`${e.lecturaMin} min`, 'lectura')}{dato(`${e.exposicionMin} min`, 'exposición')}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input type="number" min={0} value={meta} onChange={(ev) => setMeta(ev.target.value)} placeholder="Meta de palabras (opcional)" className={`${campo} max-w-[14rem]`} />
        {pct != null && (<div className="flex-1"><div className="h-2 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div><p className="mt-0.5 text-[10px] text-textSecondary">{pct}% de la meta</p></div>)}
      </div>
    </Seccion>
  );
}

export default function TrabajosHelper({ tareas }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4"><Planificador tareas={tareas} /><Estructura /></div>
      <div className="space-y-4"><Referencias /><Contador /></div>
    </div>
  );
}
