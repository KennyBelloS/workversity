import { supabase } from './supabase';
import { mensajeAmigable } from '../lib/erroresAmigables';
import { leerTabla } from '../offline/db';
import { crearMateria, eliminarMateria } from './materias';
import { crearBloque, eliminarBloque } from './horario';

// ---------------------------------------------------------------------------------------------
// Cerrar semestre. El horario de un semestre no sirve para el siguiente, pero tampoco se tira:
// antes de limpiarlo se guarda una foto completa (materias y bloques) que se puede consultar,
// restaurar o, si de verdad ya no la quieres, borrar a mano. Nada se borra solo.
// ---------------------------------------------------------------------------------------------

const faltaTabla = (err) => /does not exist|could not find the table|schema cache|PGRST205|42P01/i.test(`${err?.message || ''} ${err?.code || ''}`);

/** Campos que se guardan de cada fila (sin ids ni user_id: al restaurar se crean nuevos). */
const limpiar = (fila, campos) => Object.fromEntries(campos.map((c) => [c, fila[c]]));
const CAMPOS_MATERIA = ['nombre', 'profesor', 'salon', 'nrc', 'day_of_week', 'start_minutes', 'end_minutes', 'color_value', 'tiene_recordatorio', 'recordatorio_minutos_antes', 'prioridad', 'es_virtual', 'enlace'];
const CAMPOS_BLOQUE = ['title', 'location', 'type', 'day_of_week', 'start_minutes', 'end_minutes', 'color_value'];

/** Cuántas horas de clase por semana tenía ese horario, para mostrarlo en la lista. */
export function horasSemanales(materias = [], bloques = []) {
  const min = [...materias, ...bloques].reduce((s, x) => s + Math.max(0, (x.end_minutes || 0) - (x.start_minutes || 0)), 0);
  return Math.round((min / 60) * 10) / 10;
}

/** Nombre sugerido para el semestre que se está cerrando: "2026-2". */
export function nombreSugerido(fecha = new Date()) {
  return `${fecha.getFullYear()}-${fecha.getMonth() < 6 ? 1 : 2}`;
}

export async function listarSemestres() {
  const { data, error } = await supabase.from('semestres_archivados').select('*').order('archivado', { ascending: false });
  if (error) {
    if (faltaTabla(error)) return { disponible: false, semestres: [] };
    throw new Error(mensajeAmigable(error, 'cargar tus semestres guardados'));
  }
  return { disponible: true, semestres: data || [] };
}

/**
 * Guarda el horario actual como un semestre cerrado y, si `limpiarDespues`, deja el horario
 * vacío para empezar de nuevo. Devuelve el resumen de lo guardado.
 */
export async function cerrarSemestre({ nombre, userId, limpiarDespues = true }) {
  const [materias, bloques] = await Promise.all([leerTabla('materias'), leerTabla('bloques_horario')]);
  if (materias.length === 0 && bloques.length === 0) {
    throw new Error('No hay nada en tu horario para guardar todavía.');
  }

  const datos = {
    materias: materias.map((m) => limpiar(m, CAMPOS_MATERIA)),
    bloques: bloques.map((b) => limpiar(b, CAMPOS_BLOQUE)),
  };
  const resumen = { materias: materias.length, bloques: bloques.length, horas: horasSemanales(materias, bloques) };

  const { error } = await supabase.from('semestres_archivados').insert({ user_id: userId, nombre, datos, resumen });
  if (error) {
    if (faltaTabla(error)) throw new Error('Falta correr el SQL nuevo de la base de datos (Ajustes → Base de datos) para poder guardar semestres.');
    throw new Error(mensajeAmigable(error, 'guardar el semestre'));
  }

  // Solo después de que la copia quedó guardada se limpia el horario de verdad.
  if (limpiarDespues) {
    for (const m of materias) await eliminarMateria(m.id);
    for (const b of bloques) await eliminarBloque(b.id);
  }
  return resumen;
}

/** Vuelve a crear las materias y bloques de un semestre guardado, sumándolos a lo que ya hay. */
export async function restaurarSemestre(semestre, userId) {
  const { materias = [], bloques = [] } = semestre.datos || {};
  for (const m of materias) await crearMateria(m, userId);
  for (const b of bloques) await crearBloque(b, userId);
  return { materias: materias.length, bloques: bloques.length };
}

/** Borra un semestre guardado. Esto sí es definitivo, y solo pasa si la persona lo pide. */
export async function eliminarSemestre(id) {
  const { error } = await supabase.from('semestres_archivados').delete().eq('id', id);
  if (error) throw new Error(mensajeAmigable(error, 'borrar ese semestre'));
}
