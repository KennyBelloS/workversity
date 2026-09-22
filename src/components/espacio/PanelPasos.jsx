import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { crearTarea, eliminarTarea, completarTarea } from '../../services/tareas';

export const datosPaso = (tarea, title) => ({
  title, description: '', category: tarea.category, materia_id: tarea.materia_id || null, priority: tarea.priority, dificultad: tarea.dificultad || 'media',
  due_date: tarea.due_date, has_reminder: false, reminder_minutes_before: 60, photo_paths: [], status: 'pendiente', is_recurring: false, recurrence_interval_days: 7, estimated_minutes: null, parent_task_id: tarea.id,
});

/** Lista de pasos (sub-tareas) de la tarea. */
export default function PanelPasos({ tarea, pasos, usuarioId, onCambio }) {
  const [nuevo, setNuevo] = useState('');
  const hechos = pasos.filter((p) => p.status === 'hecha').length;

  const agregar = async () => { const t = nuevo.trim(); if (!t) return; setNuevo(''); await crearTarea(datosPaso(tarea, t), usuarioId); onCambio(); };

  return (
    <section className="rounded-md2 bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-extrabold">Pasos</p>
        {pasos.length > 0 && <span className="text-[11px] font-bold text-textSecondary">{hechos}/{pasos.length}</span>}
      </div>
      {pasos.length > 0 && <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-success transition-all" style={{ width: `${(hechos / pasos.length) * 100}%` }} /></div>}
      <ul className="space-y-1.5">
        {pasos.map((p) => (
          <li key={p.id} className="flex items-center gap-2 rounded-sm2 bg-bg px-2.5 py-2">
            <button onClick={async () => { await completarTarea(p, usuarioId); onCambio(); }} aria-label={p.status === 'hecha' ? 'Reabrir paso' : 'Completar paso'} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${p.status === 'hecha' ? 'border-success bg-success' : 'border-textSecondary/40'}`}>{p.status === 'hecha' && <Check size={11} className="text-white" />}</button>
            <span className={`min-w-0 flex-1 text-[13px] ${p.status === 'hecha' ? 'text-textSecondary line-through' : ''}`}>{p.title}</span>
            <button onClick={async () => { await eliminarTarea(p.id); onCambio(); }} aria-label="Quitar paso" className="text-textSecondary hover:text-danger"><Trash2 size={13} /></button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregar()} placeholder="Agregar un paso…" aria-label="Nuevo paso" className="min-w-0 flex-1 rounded-sm2 bg-primarySoft/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
        <button onClick={agregar} aria-label="Agregar paso" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white"><Plus size={16} /></button>
      </div>
    </section>
  );
}
