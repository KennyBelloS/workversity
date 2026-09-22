import { useEffect, useState, useMemo } from 'react';
import { useEscape } from '../../hooks/useEscape';
import { X, School, Briefcase, ImagePlus, Trash2, Split } from 'lucide-react';
import { CATEGORIES, PRIORITIES, REMINDER_OPTIONS, RECURRENCIAS } from '../../lib/constants';
import { necesitaMicroTareas } from '../../lib/motorAnalitica';
import { DIFICULTADES, normalizarDificultad, predecirMinutos, formatoMinutos } from '../../lib/tiempos';
import { comprimirImagen } from '../../lib/imagenes';
import { useHabitos } from '../../hooks/useHabitos';

function aInputDatetimeLocal(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TaskModal({ materias = [], historial = { tareas: [], sesiones: [] }, tareaExistente, onGuardar, onEliminar, onCerrar, onDividirEnSubtareas }) {
  useEscape(onCerrar);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('universidad');
  const [prioridad, setPrioridad] = useState('media');
  const [minutosEstimados, setMinutosEstimados] = useState('');
  const [dificultad, setDificultad] = useState('media');
  const [estimadoManual, setEstimadoManual] = useState(false);
  const [fechaVencimiento, setFechaVencimiento] = useState(new Date(Date.now() + 2 * 3600 * 1000).toISOString());
  const [tieneRecordatorio, setTieneRecordatorio] = useState(true);
  const [minutosAntes, setMinutosAntes] = useState(60);
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [intervaloDias, setIntervaloDias] = useState(7);
  const [fotos, setFotos] = useState([]);
  const [materiaId, setMateriaId] = useState('');
  const { habitos, aprender } = useHabitos();
  const sugeridoRec = aprender ? habitos?.puntualidad.recordatorioSugerido : null;
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Tiempo sugerido según la dificultad y lo que la app aprendió de tus tareas anteriores
  const sugerencia = useMemo(
    () => predecirMinutos({ dificultad, categoria: categoria, materia_id: materiaId || null, tareas: historial.tareas, sesiones: historial.sesiones, excluirId: tareaExistente?.id }),
    [dificultad, categoria, materiaId, historial, tareaExistente]
  );
  useEffect(() => { if (!estimadoManual) setMinutosEstimados(String(sugerencia.minutos)); }, [sugerencia.minutos, estimadoManual]);

  // Una materia puede tener varios días (varias filas): se ofrece una sola vez por nombre.
  const gruposMaterias = materias.filter((m, i) => materias.findIndex((x) => x.nombre === m.nombre) === i);
  const idDelGrupo = (id) => {
    const m = materias.find((x) => x.id === id);
    return m ? gruposMaterias.find((g) => g.nombre === m.nombre)?.id || '' : '';
  };

   
  useEffect(() => {
    if (tareaExistente) {
      setMateriaId(idDelGrupo(tareaExistente.materia_id));
      setTitulo(tareaExistente.title);
      setDescripcion(tareaExistente.description || '');
      setCategoria(tareaExistente.category);
      setPrioridad(tareaExistente.priority);
      setFechaVencimiento(tareaExistente.due_date);
      setTieneRecordatorio(tareaExistente.has_reminder);
      setMinutosAntes(tareaExistente.reminder_minutes_before);
      setEsRecurrente(tareaExistente.is_recurring);
      setIntervaloDias(tareaExistente.recurrence_interval_days || 7);
      setFotos(tareaExistente.photo_paths || []);
      setMinutosEstimados(tareaExistente.estimated_minutes ? String(tareaExistente.estimated_minutes) : '');
      setDificultad(normalizarDificultad(tareaExistente.dificultad));
      setEstimadoManual(!!tareaExistente.estimated_minutes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tareaExistente]);

  const agregarFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await comprimirImagen(file);
    setFotos((f) => [...f, b64]);
    e.target.value = '';
  };

  const guardar = async () => {
    if (!titulo.trim()) {
      setError('Escribe un título');
      return;
    }
    if (categoria === 'universidad' && gruposMaterias.length > 0 && !materiaId) {
      setError('Elige la materia de esta tarea universitaria');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await onGuardar({
        ...(tareaExistente || {}),
        title: titulo.trim(),
        description: descripcion.trim(),
        category: categoria,
        materia_id: categoria === 'universidad' ? materiaId || null : null,
        priority: prioridad,
        dificultad,
        due_date: fechaVencimiento,
        has_reminder: tieneRecordatorio,
        reminder_minutes_before: minutosAntes,
        is_recurring: esRecurrente,
        recurrence_interval_days: intervaloDias,
        photo_paths: fotos,
        status: tareaExistente?.status || 'pendiente',
        estimated_minutes: minutosEstimados ? Number(minutosEstimados) : null,
      });
    } catch (err) {
      setError(err?.message || 'No se pudo guardar la tarea.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-lg2 bg-bg sm:rounded-lg2">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-bg px-5 py-4">
          <h2 className="text-lg font-extrabold text-textPrimary">{tareaExistente ? 'Editar tarea' : 'Nueva tarea'}</h2>
          <button onClick={onCerrar} className="rounded-full p-1.5 hover:bg-black/5"><X size={20} /></button>
        </div>

        <div className="space-y-5 px-5 pb-8">
          <section className="space-y-3 rounded-md2 bg-white p-4 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wide text-textSecondary">Detalles</p>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título"
              className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {error && <p className="text-xs font-semibold text-danger">{error}</p>}
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción (opcional)"
              rows={3}
              className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-textSecondary">Dificultad</p>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Dificultad">
                {Object.values(DIFICULTADES).map((d) => (
                  <button key={d.clave} type="button" role="radio" aria-checked={dificultad === d.clave} onClick={() => setDificultad(d.clave)} className="rounded-sm2 border py-2.5 text-xs font-bold transition" style={{ borderColor: dificultad === d.clave ? d.color : 'rgba(120,130,150,0.25)', backgroundColor: dificultad === d.clave ? `${d.color}1F` : 'transparent', color: dificultad === d.clave ? d.color : undefined }}>{d.emoji} {d.label}</button>
                ))}
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-textSecondary">
                <span>≈ <b className="text-textPrimary">{formatoMinutos(sugerencia.minutos)}</b> sugeridos {sugerencia.origen === 'aprendido' ? `(aprendido de ${sugerencia.muestras} tarea${sugerencia.muestras > 1 ? 's' : ''} tuyas)` : '(base; mejora cuando termines tareas midiendo tu tiempo)'}</span>
                {estimadoManual && String(sugerencia.minutos) !== minutosEstimados && <button type="button" onClick={() => { setEstimadoManual(false); setMinutosEstimados(String(sugerencia.minutos)); }} className="font-bold text-primary">Usar sugerido</button>}
              </p>
            </div>
            <input
              type="number"
              min={5}
              step={5}
              value={minutosEstimados}
              onChange={(e) => { setMinutosEstimados(e.target.value); setEstimadoManual(true); }}
              placeholder="Duración estimada en minutos (ej: 120)"
              className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />

            {tareaExistente && !tareaExistente.parent_task_id && necesitaMicroTareas({ ...tareaExistente, estimated_minutes: Number(minutosEstimados) || 0 }) && (
              <button
                onClick={() => onDividirEnSubtareas({ ...tareaExistente, estimated_minutes: Number(minutosEstimados) })}
                className="flex w-full items-center justify-center gap-2 rounded-sm2 border border-dashed border-info/50 py-2.5 text-xs font-bold text-info"
              >
                <Split size={14} /> Es larga — dividir en sub-tareas de ~25 min
              </button>
            )}
          </section>

          <section className="space-y-3 rounded-md2 bg-white p-4 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wide text-textSecondary">Categoría y prioridad</p>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(CATEGORIES).map(([key, info]) => {
                const Icono = key === 'universidad' ? School : Briefcase;
                const sel = categoria === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCategoria(key)}
                    className="flex flex-col items-center gap-1.5 rounded-sm2 border py-3 text-sm font-bold transition"
                    style={{
                      borderColor: sel ? info.color : 'rgba(0,0,0,0.08)',
                      backgroundColor: sel ? `${info.color}1F` : 'transparent',
                      color: sel ? info.color : '#6E7180',
                    }}
                  >
                    <Icono size={18} />
                    {info.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PRIORITIES).map(([key, info]) => {
                const sel = prioridad === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPrioridad(key)}
                    className="rounded-sm2 border py-2.5 text-xs font-bold transition"
                    style={{
                      borderColor: sel ? info.color : 'rgba(0,0,0,0.08)',
                      backgroundColor: sel ? `${info.color}24` : 'transparent',
                      color: sel ? info.color : '#6E7180',
                    }}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </section>

          {categoria === 'universidad' && (
            <section className="space-y-3 rounded-md2 bg-white p-4 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wide text-textSecondary">Materia</p>
              {gruposMaterias.length === 0 ? (
                <p className="rounded-sm2 bg-warningSoft p-3 text-xs font-semibold text-warning">
                  Aún no tienes materias registradas. Agrégalas en la sección Materias para asociarlas a tus tareas universitarias.
                </p>
              ) : (
                <select
                  value={materiaId}
                  onChange={(e) => { setMateriaId(e.target.value); setError(''); }}
                  className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Elige una materia…</option>
                  {gruposMaterias.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre}{m.es_virtual ? ' · Virtual' : ''}</option>
                  ))}
                </select>
              )}
              {error && gruposMaterias.length > 0 && !materiaId && <p className="text-xs font-semibold text-danger">{error}</p>}
            </section>
          )}

          <section className="space-y-3 rounded-md2 bg-white p-4 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wide text-textSecondary">Fecha y recordatorio</p>
            <label className="block text-xs font-semibold text-textSecondary">Vence el</label>
            <input
              type="datetime-local"
              value={aInputDatetimeLocal(fechaVencimiento)}
              onChange={(e) => setFechaVencimiento(new Date(e.target.value).toISOString())}
              className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <label className="flex items-center justify-between py-1">
              <span className="text-sm font-semibold">Recordarme antes</span>
              <input
                type="checkbox"
                checked={tieneRecordatorio}
                onChange={(e) => setTieneRecordatorio(e.target.checked)}
                className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-black/15 transition checked:bg-primary relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition checked:before:translate-x-4"
              />
            </label>
            {tieneRecordatorio && (
              <select
                value={minutosAntes}
                onChange={(e) => setMinutosAntes(Number(e.target.value))}
                className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                {REMINDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
            {tieneRecordatorio && sugeridoRec && minutosAntes !== sugeridoRec && (
              <button type="button" onClick={() => setMinutosAntes(sugeridoRec)} className="w-full rounded-sm2 bg-primarySoft/50 p-2.5 text-left text-[11px] font-semibold text-primary">
                🧠 Sueles {habitos.puntualidad.perfil === 'ultima-hora' ? 'terminar a última hora' : 'entregar con poco margen'}: te sugiero recordar {REMINDER_OPTIONS.find((o) => o.value === sugeridoRec)?.label.toLowerCase()}. <b>Aplicar</b>
              </button>
            )}
            <label className="flex items-center justify-between py-1">
              <span className="text-sm font-semibold">Repetir esta tarea</span>
              <input
                type="checkbox"
                checked={esRecurrente}
                onChange={(e) => setEsRecurrente(e.target.checked)}
                className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-black/15 transition checked:bg-primary relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition checked:before:translate-x-4"
              />
            </label>
            {esRecurrente && (
              <select value={intervaloDias} onChange={(e) => setIntervaloDias(Number(e.target.value))} aria-label="Frecuencia de repetición" className="w-full rounded-sm2 bg-primarySoft/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary">
                {RECURRENCIAS.map((r) => <option key={r.v} value={r.v}>{r.t}</option>)}
              </select>
            )}
          </section>

          <section className="space-y-3 rounded-md2 bg-white p-4 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wide text-textSecondary">Fotos y diagramas (opcional)</p>
            {fotos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {fotos.map((f, i) => (
                  <div key={i} className="relative shrink-0">
                    <img src={f} alt="" className="h-[90px] w-[90px] rounded-sm2 object-cover" />
                    <button
                      onClick={() => setFotos((arr) => arr.filter((_, idx) => idx !== i))}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-sm2 border border-dashed border-primary/50 py-3 text-sm font-semibold text-primary">
              <ImagePlus size={18} />
              Agregar foto o diagrama
              <input type="file" accept="image/*" className="hidden" onChange={agregarFoto} />
            </label>
          </section>

          <div className="flex gap-3 pt-1">
            {tareaExistente && (
              <button
                onClick={() => onEliminar(tareaExistente)}
                className="flex items-center justify-center gap-2 rounded-sm2 border border-danger/30 px-4 py-3.5 text-sm font-bold text-danger"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={guardar}
              disabled={guardando}
              className="flex-1 rounded-sm2 bg-primary py-3.5 text-sm font-bold text-white transition hover:bg-primaryDark disabled:opacity-60"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
