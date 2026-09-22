import { celebrar, vibrar } from '../lib/nativo';
import { crearRepositorio } from '../offline/repositorio';

const repo = crearRepositorio({
  tabla: 'tareas',
  comparar: (a, b) => new Date(a.due_date) - new Date(b.due_date),
  campoPadre: 'parent_task_id',
});

export const listarTareas = () => repo.listar();
export const crearTarea = (tarea, userId) => repo.crear(tarea, userId);
export const actualizarTarea = (id, cambios) => repo.actualizar(id, cambios);
export const eliminarTarea = (id) => repo.eliminar(id);

export function estaVencida(tarea) {
  return tarea.status !== 'hecha' && new Date(tarea.due_date) < new Date();
}

// Si la tarea es recurrente, al completarla se crea la siguiente repetición.
export async function crearSiguienteRepeticion(tarea, userId) {
  if (!tarea.is_recurring) return null;
  const siguiente = new Date(tarea.due_date);
  siguiente.setDate(siguiente.getDate() + (tarea.recurrence_interval_days || 7));
  return crearTarea(
    {
      title: tarea.title,
      description: tarea.description || '',
      category: tarea.category,
      priority: tarea.priority,
      due_date: siguiente.toISOString(),
      has_reminder: tarea.has_reminder,
      reminder_minutes_before: tarea.reminder_minutes_before,
      photo_paths: tarea.photo_paths || [],
      status: 'pendiente',
      is_recurring: true,
      recurrence_interval_days: tarea.recurrence_interval_days || 7,
      estimated_minutes: tarea.estimated_minutes ?? null,
    },
    userId
  );
}

// Cambia el estado de una tarea. Al completarla guarda cuándo (para los resúmenes y la racha)
// y, si es recurrente, crea la siguiente repetición.
export async function completarTarea(tarea, userId, nuevoEstado) {
  const estado = nuevoEstado || (tarea.status === 'hecha' ? 'pendiente' : 'hecha');
  await repo.actualizar(tarea.id, { status: estado, completed_at: estado === 'hecha' ? new Date().toISOString() : null });
  if (estado === 'hecha' && tarea.status !== 'hecha') {
    await crearSiguienteRepeticion(tarea, userId);
    celebrar();
    vibrar(25);
  }
}
