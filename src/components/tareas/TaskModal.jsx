import { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { School, Briefcase, ImagePlus, Trash2, Split, X, Check, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, PRIORITIES, REMINDER_OPTIONS, RECURRENCIAS } from '../../lib/constants';
import { necesitaMicroTareas } from '../../lib/motorAnalitica';
import { DIFICULTADES, normalizarDificultad, predecirMinutos, formatoMinutos } from '../../lib/tiempos';
import { comprimirImagen } from '../../lib/imagenes';
import { useHabitos } from '../../hooks/useHabitos';
import Hoja from '../ui/Hoja';
import { Frase, Hueco, Gaveta, Opciones } from '../ui/Frase';
import { RAPIDO } from '../../lib/movimiento';

// ---------------------------------------------------------------------------------------------
// Nueva tarea, escrita como una frase.
//
// La tarea se lee en español mientras la armas —"Entregar X de Y el viernes"— y cada dato que
// falta es un hueco que se toca. Al tocarlo, abajo se abre el control de ESA decisión y de
// ninguna otra. Guarda exactamente los mismos campos que antes; lo que cambia es que ya no
// tienes diez cajas abiertas a la vez compitiendo por tu atención.
// ---------------------------------------------------------------------------------------------

const pad = (n) => String(n).padStart(2, '0');
const aInputDatetimeLocal = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** "hoy a las 11:59 p. m.", "el viernes 21", "el 3 de marzo" — como lo diría una persona. */
function fechaEnPalabras(iso) {
  const d = new Date(iso);
  const hoy = new Date();
  const soloDia = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const dias = Math.round((soloDia(d) - soloDia(hoy)) / 86400000);
  const hora = d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  if (dias === 0) return `hoy a las ${hora}`;
  if (dias === 1) return `mañana a las ${hora}`;
  if (dias > 1 && dias < 7) return `el ${d.toLocaleDateString('es-CO', { weekday: 'long' })} a las ${hora}`;
  if (dias === -1) return `ayer (ya pasó)`;
  if (dias < -1) return `el ${d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })} (ya pasó)`;
  return `el ${d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })} a las ${hora}`;
}

/** Atajos de fecha que cubren el 90% de los casos sin abrir el calendario. */
function atajosDeFecha() {
  const base = (dias, h = 23, m = 59) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const viernes = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
    d.setHours(23, 59, 0, 0);
    return d.toISOString();
  };
  return [
    { id: 'hoy', titulo: 'Hoy', nota: 'a las 11:59 p. m.', valor: base(0) },
    { id: 'manana', titulo: 'Mañana', nota: 'a las 11:59 p. m.', valor: base(1) },
    { id: 'viernes', titulo: 'El viernes', nota: 'fin de semana', valor: viernes() },
    { id: 'semana', titulo: 'En una semana', nota: '7 días', valor: base(7) },
  ];
}

export default function TaskModal({ materias = [], historial = { tareas: [], sesiones: [] }, tareaExistente, onGuardar, onEliminar, onCerrar, onDividirEnSubtareas }) {
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
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  // Qué hueco de la frase está abierto. Al abrir una tarea nueva, el título.
  const [foco, setFoco] = useState(tareaExistente ? null : 'titulo');

  const { habitos, aprender } = useHabitos();
  const sugeridoRec = aprender ? habitos?.puntualidad.recordatorioSugerido : null;

  const sugerencia = useMemo(
    () => predecirMinutos({ dificultad, categoria, materia_id: materiaId || null, tareas: historial.tareas, sesiones: historial.sesiones, excluirId: tareaExistente?.id }),
    [dificultad, categoria, materiaId, historial, tareaExistente]
  );
  useEffect(() => { if (!estimadoManual) setMinutosEstimados(String(sugerencia.minutos)); }, [sugerencia.minutos, estimadoManual]);

  // Una materia puede tener varias filas (una por día): se ofrece una sola vez por nombre.
  const gruposMaterias = materias.filter((m, i) => materias.findIndex((x) => x.nombre === m.nombre) === i);
  const idDelGrupo = (id) => {
    const m = materias.find((x) => x.id === id);
    return m ? gruposMaterias.find((g) => g.nombre === m.nombre)?.id || '' : '';
  };

  useEffect(() => {
    if (!tareaExistente) return;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tareaExistente]);

  const materiaElegida = gruposMaterias.find((m) => m.id === materiaId);
  const dif = DIFICULTADES[dificultad];
  const prio = PRIORITIES[prioridad];
  const abrir = (k) => setFoco((f) => (f === k ? null : k));

  const agregarFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await comprimirImagen(file);
    setFotos((f) => [...f, b64]);
    e.target.value = '';
  };

  const guardar = async () => {
    if (!titulo.trim()) { setError('Falta decir qué hay que entregar.'); setFoco('titulo'); return; }
    if (categoria === 'universidad' && gruposMaterias.length > 0 && !materiaId) {
      setError('Falta la materia.'); setFoco('materia'); return;
    }
    setGuardando(true); setError('');
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

  const botonGuardar = (
    <motion.button
      type="button"
      onClick={guardar}
      disabled={guardando}
      whileTap={{ scale: 0.96 }}
      transition={RAPIDO}
      className="boton-ppal"
    >
      <Check size={15} strokeWidth={2.2} />{guardando ? 'Guardando…' : 'Guardar'}
    </motion.button>
  );

  return (
    <Hoja
      abierta
      onCerrar={onCerrar}
      rotulo={tareaExistente ? 'Editar tarea' : 'Nueva tarea'}
      titulo={tareaExistente ? 'Cambia lo que necesites' : 'Dímelo en una frase'}
      acciones={botonGuardar}
      ancho="36rem"
    >
      {/* La frase. Cada hueco abre su propia gaveta abajo. */}
      <Frase>
        Entregar{' '}
        <Hueco campo="título" activo={foco === 'titulo'} vacio={!titulo} onClick={() => abrir('titulo')}>{titulo || 'qué'}</Hueco>
        {categoria === 'universidad' ? (
          <>
            {' de '}
            <Hueco campo="materia" activo={foco === 'materia'} vacio={!materiaElegida} color={materiaElegida?.color_value} onClick={() => abrir('materia')}>{materiaElegida?.nombre || 'qué materia'}</Hueco>
          </>
        ) : (
          <>
            {' '}
            <Hueco campo="categoría" activo={foco === 'categoria'} onClick={() => abrir('categoria')}>del trabajo</Hueco>
          </>
        )}
        {', '}
        <Hueco campo="fecha de entrega" activo={foco === 'fecha'} onClick={() => abrir('fecha')}>{fechaEnPalabras(fechaVencimiento)}</Hueco>.
      </Frase>

      <Frase className="frase--chica mt-3">
        Prioridad{' '}
        <Hueco campo="prioridad" activo={foco === 'prioridad'} color={prio?.color} onClick={() => abrir('prioridad')}>{prio?.label?.toLowerCase()}</Hueco>
        {' · dificultad '}
        <Hueco campo="dificultad" activo={foco === 'dificultad'} color={dif?.color} onClick={() => abrir('dificultad')}>{dif?.label?.toLowerCase()}</Hueco>
        {' · me toma '}
        <Hueco campo="tiempo estimado" activo={foco === 'tiempo'} onClick={() => abrir('tiempo')}>{formatoMinutos(Number(minutosEstimados) || sugerencia.minutos)}</Hueco>
      </Frase>

      {error && <p className="mt-3 text-t-pie text-danger" role="alert">{error}</p>}

      {/* Gavetas: solo una abierta a la vez. */}
      <Gaveta clave={foco} titulo={{
        titulo: '¿Qué hay que entregar?',
        materia: '¿De qué materia?',
        categoria: '¿Universidad o trabajo?',
        fecha: '¿Para cuándo?',
        prioridad: '¿Qué tan importante es?',
        dificultad: '¿Qué tan pesada es?',
        tiempo: '¿Cuánto te va a tomar?',
        mas: 'Lo demás',
      }[foco] || ''}>
        {foco === 'titulo' && (
          <>
            <input
              data-autofoco
              value={titulo}
              onChange={(e) => { setTitulo(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setFoco(categoria === 'universidad' && !materiaId ? 'materia' : 'fecha'); } }}
              placeholder="Guía de integrales por partes"
              className="campo-frase"
            />
            <p className="mt-3 text-t-micro text-textSecondary">Escríbelo como se lo dirías a un compañero. Enter para seguir.</p>
            {necesitaMicroTareas(titulo) && onDividirEnSubtareas && (
              <button type="button" onClick={() => onDividirEnSubtareas(titulo)} className="boton-secundario mt-3 w-full justify-center">
                <Split size={14} /> Suena grande: divídela en pasos
              </button>
            )}
          </>
        )}

        {foco === 'categoria' && (
          <Opciones
            aria="Categoría" columnas={2} valor={categoria}
            onElegir={(v) => { setCategoria(v); setError(''); if (v === 'universidad') setFoco('materia'); }}
            opciones={Object.entries(CATEGORIES).map(([id, info]) => ({
              id, titulo: info.label, color: info.color,
              icono: id === 'universidad' ? <School size={17} strokeWidth={1.8} /> : <Briefcase size={17} strokeWidth={1.8} />,
            }))}
          />
        )}

        {foco === 'materia' && (
          gruposMaterias.length === 0 ? (
            <p className="text-t-pie leading-relaxed text-warning">
              Todavía no tienes materias. Créalas en la sección Materias y van a aparecer aquí.
            </p>
          ) : (
            <>
              <Opciones
                aria="Materia" columnas={2} valor={materiaId}
                onElegir={(v) => { setMateriaId(v); setError(''); setFoco('fecha'); }}
                opciones={gruposMaterias.map((m) => ({ id: m.id, titulo: m.nombre, nota: m.es_virtual ? 'virtual' : m.salon || '', color: m.color_value }))}
              />
              <button type="button" onClick={() => { setCategoria('trabajo'); setMateriaId(''); setFoco('fecha'); }} className="boton-secundario mt-3 w-full justify-center">
                <Briefcase size={14} /> En realidad es del trabajo
              </button>
            </>
          )
        )}

        {foco === 'fecha' && (
          <>
            <Opciones
              aria="Fecha de entrega" columnas={2}
              valor={atajosDeFecha().find((a) => a.valor === fechaVencimiento)?.id}
              onElegir={(id) => { const a = atajosDeFecha().find((x) => x.id === id); if (a) { setFechaVencimiento(a.valor); setFoco(null); } }}
              opciones={atajosDeFecha()}
            />
            <label className="mt-4 block">
              <span className="rotulo">O una fecha exacta</span>
              <input
                type="datetime-local"
                value={aInputDatetimeLocal(fechaVencimiento)}
                onChange={(e) => e.target.value && setFechaVencimiento(new Date(e.target.value).toISOString())}
                className="campo-frase mt-1.5"
              />
            </label>
          </>
        )}

        {foco === 'prioridad' && (
          <Opciones
            aria="Prioridad" valor={prioridad} onElegir={(v) => { setPrioridad(v); setFoco(null); }}
            opciones={Object.entries(PRIORITIES).map(([id, info]) => ({ id, titulo: info.label, color: info.color }))}
          />
        )}

        {foco === 'dificultad' && (
          <>
            <Opciones
              aria="Dificultad" valor={dificultad} onElegir={setDificultad}
              opciones={Object.values(DIFICULTADES).map((d) => ({ id: d.clave, titulo: d.label, color: d.color }))}
            />
            <p className="mt-3 text-t-micro leading-relaxed text-textSecondary">
              Con esto calculo el tiempo. {sugerencia.origen === 'aprendido'
                ? `Lo aprendí de ${sugerencia.muestras} tarea${sugerencia.muestras > 1 ? 's' : ''} tuya${sugerencia.muestras > 1 ? 's' : ''}.`
                : 'Todavía uso una base; va a mejorar cuando termines tareas midiendo el tiempo.'}
            </p>
          </>
        )}

        {foco === 'tiempo' && (
          <>
            <Opciones
              aria="Tiempo estimado" columnas={4} valor={String(minutosEstimados)}
              onElegir={(v) => { setMinutosEstimados(v); setEstimadoManual(true); }}
              opciones={['15', '30', '45', '60', '90', '120', '180', '240'].map((v) => ({ id: v, titulo: formatoMinutos(Number(v)) }))}
            />
            {String(sugerencia.minutos) !== String(minutosEstimados) && (
              <button type="button" onClick={() => { setEstimadoManual(false); setMinutosEstimados(String(sugerencia.minutos)); }} className="boton-secundario mt-3 w-full justify-center">
                Usar lo que sugiero: {formatoMinutos(sugerencia.minutos)}
              </button>
            )}
          </>
        )}

        {foco === 'mas' && (
          <div className="space-y-5">
            <label className="block">
              <span className="rotulo">Notas</span>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Lo que no cabe en el título: qué pide el profe, dónde está el enunciado…"
                className="campo-frase campo-frase--area mt-1.5"
              />
            </label>

            <div>
              <label className="flex items-center justify-between gap-3 py-1">
                <span className="text-t-base">Recordarme antes</span>
                <input type="checkbox" checked={tieneRecordatorio} onChange={(e) => setTieneRecordatorio(e.target.checked)} className="interruptor" />
              </label>
              {tieneRecordatorio && (
                <select value={minutosAntes} onChange={(e) => setMinutosAntes(Number(e.target.value))} aria-label="Cuánto antes" className="campo mt-2">
                  {REMINDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
              {tieneRecordatorio && sugeridoRec && minutosAntes !== sugeridoRec && (
                <button type="button" onClick={() => setMinutosAntes(sugeridoRec)} className="boton-secundario mt-2 w-full justify-center !text-t-micro">
                  Sueles {habitos.puntualidad.perfil === 'ultima-hora' ? 'terminar a última hora' : 'entregar con poco margen'}: mejor {REMINDER_OPTIONS.find((o) => o.value === sugeridoRec)?.label.toLowerCase()}
                </button>
              )}
            </div>

            <div>
              <label className="flex items-center justify-between gap-3 py-1">
                <span className="text-t-base">Se repite</span>
                <input type="checkbox" checked={esRecurrente} onChange={(e) => setEsRecurrente(e.target.checked)} className="interruptor" />
              </label>
              {esRecurrente && (
                <select value={intervaloDias} onChange={(e) => setIntervaloDias(Number(e.target.value))} aria-label="Cada cuánto se repite" className="campo mt-2">
                  {RECURRENCIAS.map((r) => <option key={r.v} value={r.v}>{r.t}</option>)}
                </select>
              )}
            </div>

            <div>
              <span className="rotulo">Fotos y diagramas</span>
              {fotos.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {fotos.map((f, i) => (
                    <div key={i} className="relative shrink-0">
                      <img src={f} alt="" className="h-[84px] w-[84px] rounded-[12px] object-cover" />
                      <button type="button" aria-label="Quitar foto" onClick={() => setFotos((arr) => arr.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 rounded-full bg-black/65 p-1 text-white"><X size={11} /></button>
                    </div>
                  ))}
                </div>
              )}
              <label className="boton-secundario mt-2 w-full cursor-pointer justify-center">
                <ImagePlus size={15} /> Agregar foto
                <input type="file" accept="image/*" className="hidden" onChange={agregarFoto} />
              </label>
            </div>
          </div>
        )}
      </Gaveta>

      {/* Pie: lo secundario y lo peligroso, lejos del flujo normal. */}
      <div className="mt-5 flex items-center gap-2 border-t border-[rgb(var(--linea)/.08)] pt-4">
        <button type="button" onClick={() => abrir('mas')} className={`boton-secundario ${foco === 'mas' ? '!text-primary' : ''}`}>
          <SlidersHorizontal size={14} /> Notas, recordatorio y fotos
        </button>
        {tareaExistente && (
          <button type="button" onClick={() => onEliminar(tareaExistente)} aria-label="Eliminar tarea" className="boton-secundario ml-auto !px-3 !text-danger">
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </Hoja>
  );
}
