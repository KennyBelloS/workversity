import { useMemo, useState } from 'react';
import { Zap, Calendar, Flag, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { crearTarea } from '../../services/tareas';
import { interpretarCaptura } from '../../lib/captura';
import { formatearFechaHora } from '../../lib/dateUtils';

const PRIORIDAD = { alta: ['Alta', '#E5484D'], media: ['Media', '#F5A524'], baja: ['Baja', '#17C964'] };

/** Escribe una frase y se crea la tarea: "informe de física mañana 5pm !alta". */
export default function CapturaRapida({ materias, onCreada }) {
  const { usuario } = useAuth();
  const [texto, setTexto] = useState('');
  const [materiaSel, setMateriaSel] = useState(null); // null = usar lo detectado
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);

  const p = useMemo(() => (texto.trim() ? interpretarCaptura(texto, { materias, ahora: new Date() }) : null), [texto, materias]);
  const grupos = materias.filter((m, i) => materias.findIndex((x) => x.nombre === m.nombre) === i);
  // El parser puede devolver cualquier fila de la materia: se normaliza a la primera de su nombre.
  const detectada = grupos.find((g) => g.nombre === materias.find((m) => m.id === p?.materiaId)?.nombre)?.id || '';
  const materiaId = materiaSel !== null ? materiaSel : detectada;

  const crear = async (e) => {
    e?.preventDefault();
    if (!p || guardando) return;
    setGuardando(true);
    try {
      await crearTarea(
        {
          title: p.titulo, description: '', category: materiaId ? 'universidad' : 'trabajo', priority: p.prioridad, due_date: p.due.toISOString(),
          has_reminder: true, reminder_minutes_before: 60, photo_paths: [], status: 'pendiente', is_recurring: false, recurrence_interval_days: 7,
          estimated_minutes: null, materia_id: materiaId || null,
        },
        usuario.id
      );
      setTexto('');
      setMateriaSel(null);
      setAviso('✅ Tarea creada');
      setTimeout(() => setAviso(''), 2500);
      onCreada?.();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={crear} className="rounded-md2 bg-white p-3 shadow-card">
      <div className="flex items-center gap-2">
        <Zap size={18} className="shrink-0 text-warning" />
        <input
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setMateriaSel(null); }}
          placeholder="Captura rápida: “informe de física mañana 5pm !alta”"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-textSecondary/70"
        />
        <button type="submit" disabled={!p || guardando} aria-label="Crear tarea" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40">
          <Plus size={17} />
        </button>
      </div>

      {p && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-black/5 pt-2 text-[11px] font-bold">
          <span className="rounded-full bg-primarySoft px-2.5 py-1 text-primary">{p.titulo}</span>
          <span className="flex items-center gap-1 rounded-full bg-infoSoft px-2.5 py-1 text-info"><Calendar size={11} /> {formatearFechaHora(p.due.toISOString())}{p.fechaInferida && ' (sin fecha: pongo mañana)'}</span>
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: `${PRIORIDAD[p.prioridad][1]}1F`, color: PRIORIDAD[p.prioridad][1] }}><Flag size={11} /> {PRIORIDAD[p.prioridad][0]}</span>
          <select value={materiaId} onChange={(e) => setMateriaSel(e.target.value)} className="rounded-full bg-bg px-2.5 py-1 text-[11px] font-bold outline-none">
            <option value="">Trabajo / sin materia</option>
            {grupos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
      )}
      {aviso && <p className="mt-2 text-xs font-bold text-success">{aviso}</p>}
    </form>
  );
}
