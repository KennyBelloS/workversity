// Racha de ENTRAR a la app (distinta de la racha de USO, que mide tareas/Pomodoros
// completados). Esta solo mide días seguidos en que abriste Workversity, sin importar
// si hiciste algo dentro. Se guarda en el dispositivo (no depende del servidor).
import { fechaLocalISO } from './dateUtils';

const CLAVE = 'workversity:racha-entrada';

function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch { return null; }
}
function guardar(datos) {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch { /* nada */ }
}

/**
 * Registra la visita de hoy (una sola vez al día) y devuelve la racha resultante.
 * Si ya se registró hoy, solo devuelve el estado actual sin volver a contar.
 */
export function registrarEntradaDeHoy(ahora = new Date()) {
  const hoy = fechaLocalISO(ahora);
  const datos = leer() || { ultimoDia: null, racha: 0, mejorRacha: 0, totalDias: 0 };
  if (datos.ultimoDia === hoy) return datos;

  const ayer = fechaLocalISO(new Date(ahora.getTime() - 86400000));
  const racha = datos.ultimoDia === ayer ? datos.racha + 1 : 1;
  const nuevo = { ultimoDia: hoy, racha, mejorRacha: Math.max(racha, datos.mejorRacha || 0), totalDias: (datos.totalDias || 0) + 1 };
  guardar(nuevo);
  return nuevo;
}

/** Estado actual sin registrar nada (para mostrarlo en pantalla): si no entraste ayer ni hoy, la racha ya se rompió. */
export function estadoRachaEntrada(ahora = new Date()) {
  const datos = leer() || { ultimoDia: null, racha: 0, mejorRacha: 0, totalDias: 0 };
  const hoy = fechaLocalISO(ahora);
  const ayer = fechaLocalISO(new Date(ahora.getTime() - 86400000));
  const vigente = datos.ultimoDia === hoy || datos.ultimoDia === ayer;
  return { ...datos, racha: vigente ? datos.racha : 0 };
}
