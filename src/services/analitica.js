import { crearRepositorio } from '../offline/repositorio';
import { actualizarPerfil } from './auth';
import { leerTabla } from '../offline/db';
import { fechaLocalISO } from '../lib/dateUtils';

const DIAS_DE_HISTORIAL_ENERGIA = 60;
const DIAS_DE_HISTORIAL_POMODORO = 90;

const desdeHace = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d;
};

const energia = crearRepositorio({
  tabla: 'registros_energia',
  conflicto: 'user_id,fecha',
  comparar: (a, b) => a.fecha.localeCompare(b.fecha),
  filtroServidor: (q) => q.gte('fecha', fechaLocalISO(desdeHace(DIAS_DE_HISTORIAL_ENERGIA))),
});

const pomodoro = crearRepositorio({
  tabla: 'sesiones_pomodoro',
  comparar: (a, b) => new Date(b.hora_inicio) - new Date(a.hora_inicio),
  filtroServidor: (q) => q.gte('hora_inicio', desdeHace(DIAS_DE_HISTORIAL_POMODORO).toISOString()),
});

// --- Registro de energía diaria ---

export async function obtenerEnergiaHoy() {
  const hoy = fechaLocalISO();
  return (await energia.listar()).find((r) => r.fecha === hoy) || null;
}

export async function registrarEnergiaHoy(userId, nivel) {
  const hoy = fechaLocalISO();
  const existente = (await energia.listar()).find((r) => r.fecha === hoy);
  if (existente) return energia.actualizar(existente.id, { nivel });
  return energia.crear({ fecha: hoy, nivel }, userId);
}

export async function listarEnergiaUltimos(dias = 14) {
  const desde = fechaLocalISO(desdeHace(dias));
  return (await energia.listar()).filter((r) => r.fecha >= desde);
}

// --- Sesiones de Pomodoro ---

export function iniciarSesionPomodoro({ userId, tareaId, tipo, duracionMinutos }) {
  return pomodoro.crear(
    {
      tarea_id: tareaId || null,
      tipo,
      duracion_minutos: duracionMinutos,
      completada: false,
      hora_inicio: new Date().toISOString(),
      hora_fin: null,
    },
    userId
  );
}

export function finalizarSesionPomodoro(id, completada) {
  return pomodoro.actualizar(id, { completada, hora_fin: new Date().toISOString() });
}

export async function listarSesionesRecientes(dias = 14) {
  const desde = desdeHace(dias);
  return (await pomodoro.listar()).filter((s) => new Date(s.hora_inicio) >= desde);
}

export async function minutosContinuosDeHoy() {
  const inicioDeHoy = new Date();
  inicioDeHoy.setHours(0, 0, 0, 0);
  const deHoy = (await pomodoro.listar()).filter((s) => new Date(s.hora_inicio) >= inicioDeHoy);

  // Suma los minutos de sesiones consecutivas (con menos de 15 min de
  // diferencia entre ellas) contando hacia atrás desde la más reciente.
  let total = 0;
  let anterior = null;
  for (const s of deHoy) {
    const inicio = new Date(s.hora_inicio);
    if (anterior && anterior - inicio > 15 * 60000) break;
    total += s.duracion_minutos;
    anterior = inicio;
  }
  return total;
}

// --- Ajustes de bienestar / capacidad (viven en la tabla perfiles) ---

export async function actualizarAjustesBienestar(userId, ajustes) {
  return actualizarPerfil(userId, ajustes);
}

// Lee los puntos del perfil guardado en el dispositivo (no de un valor viejo en pantalla).
export async function sumarPuntos(userId, incremento) {
  const [perfil] = await leerTabla('perfiles');
  const actuales = perfil?.id === userId ? perfil.puntos || 0 : 0;
  return actualizarPerfil(userId, { puntos: actuales + incremento });
}
