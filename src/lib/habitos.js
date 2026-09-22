// La app aprende de cómo trabajas (todo se calcula en tu dispositivo con tus propios datos)
// y usa lo aprendido para ajustar sugerencias: planificador, huecos libres, recordatorios y alertas.
import { fechaLocalISO } from './dateUtils';

const H = 3600000;
const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const mediana = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const confianza = (n, media = 4, alta = 8) => (n >= alta ? 'alta' : n >= media ? 'media' : 'baja');
const idxSemana = (d) => (new Date(d).getDay() + 6) % 7;

export const CLAVE_APRENDER = 'workversity:aprender';
export const leerAprender = () => { try { return localStorage.getItem(CLAVE_APRENDER) !== '0'; } catch { return true; } };

export function calcularHabitos({ tareas = [], sesiones = [], energia = [], materias = [] }) {
  const ses = sesiones.filter((s) => s.completada);
  const hechas = tareas.filter((t) => t.status === 'hecha' && t.completed_at);

  // 1) Cuánto tardas de verdad frente a lo que estimas (necesita Pomodoros ligados a la tarea)
  const ratios = [];
  for (const t of tareas.filter((x) => x.status === 'hecha' && x.estimated_minutes > 0)) {
    const real = ses.filter((s) => s.tarea_id === t.id).reduce((a, s) => a + s.duracion_minutos, 0);
    if (real > 0) ratios.push(real / t.estimated_minutes);
  }
  const med = mediana(ratios);
  const factor = ratios.length >= 3 ? Math.min(3, Math.max(0.5, med)) : null;
  const estimacion = { muestras: ratios.length, factor, confianza: confianza(ratios.length, 3, 8) };

  // 2) Tus mejores horas y días (por Pomodoros terminados y tareas completadas)
  const porHora = Array(24).fill(0);
  ses.forEach((s) => { porHora[new Date(s.hora_inicio).getHours()] += s.duracion_minutos; });
  const maxHora = Math.max(...porHora);
  const horasFuertes = ses.length >= 4 ? new Set(porHora.map((m, h) => (m >= maxHora * 0.6 && m > 0 ? h : -1)).filter((h) => h >= 0)) : null;
  const mejorHora = ses.length >= 4 && maxHora > 0 ? porHora.indexOf(maxHora) : null;
  const porDia = DIAS.map(() => ({ hechas: 0, minutos: 0 }));
  hechas.forEach((t) => { porDia[idxSemana(t.completed_at)].hechas += 1; });
  ses.forEach((s) => { porDia[idxSemana(s.hora_inicio)].minutos += s.duracion_minutos; });
  const puntosDia = porDia.map((d) => d.hechas * 2 + d.minutos / 25);
  const mejorDia = hechas.length + ses.length >= 6 && Math.max(...puntosDia) > 0 ? puntosDia.indexOf(Math.max(...puntosDia)) : null;

  // 3) Puntualidad: cuánto antes de la entrega terminas
  const anticipos = hechas.map((t) => (new Date(t.due_date) - new Date(t.completed_at)) / H);
  const medAnt = mediana(anticipos);
  const b = { tarde: 0, ultimaHora: 0, unDia: 0, anticipado: 0, muyAnticipado: 0 };
  anticipos.forEach((h) => { if (h < 0) b.tarde++; else if (h < 6) b.ultimaHora++; else if (h < 24) b.unDia++; else if (h < 72) b.anticipado++; else b.muyAnticipado++; });
  const perfil = anticipos.length < 4 ? null : medAnt < 6 ? 'ultima-hora' : medAnt < 48 ? 'un-dia-antes' : 'anticipado';
  const puntualidad = {
    muestras: anticipos.length, medianaHoras: medAnt, buckets: b, perfil, confianza: confianza(anticipos.length),
    recordatorioSugerido: perfil === 'ultima-hora' ? 1440 : perfil === 'un-dia-antes' ? 180 : perfil === 'anticipado' ? 60 : null,
  };

  // 4) Energía vs. productividad
  const hechasPorFecha = {};
  hechas.forEach((t) => { const k = fechaLocalISO(t.completed_at); hechasPorFecha[k] = (hechasPorFecha[k] || 0) + 1; });
  const alta = energia.filter((e) => e.nivel >= 4).map((e) => hechasPorFecha[e.fecha] || 0);
  const baja = energia.filter((e) => e.nivel <= 2).map((e) => hechasPorFecha[e.fecha] || 0);
  const prom = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const energiaH = alta.length >= 2 && baja.length >= 2 && energia.length >= 6
    ? { dias: energia.length, alta: prom(alta), baja: prom(baja), confianza: confianza(energia.length, 6, 14) } : { dias: energia.length, alta: null, baja: null, confianza: 'baja' };

  // 5) Estudio por materia
  const nombres = [...new Set(materias.map((m) => m.nombre))];
  const porMateria = nombres.map((nombre) => {
    const ids = new Set(materias.filter((m) => m.nombre === nombre).map((m) => m.id));
    const suyas = tareas.filter((t) => ids.has(t.materia_id));
    const idsT = new Set(suyas.map((t) => t.id));
    return {
      nombre, color: materias.find((m) => m.nombre === nombre).color_value,
      minutos: ses.filter((s) => idsT.has(s.tarea_id)).reduce((a, s) => a + s.duracion_minutos, 0),
      hechas: suyas.filter((t) => t.status === 'hecha').length, activas: suyas.filter((t) => t.status !== 'hecha').length,
    };
  });

  // Lo aprendido, en frases (y dónde se usa)
  const aprendizajes = [];
  aprendizajes.push(
    factor
      ? { id: 'estimacion', icono: '⏱️', confianza: estimacion.confianza, listo: true,
          titulo: factor > 1.15 ? `Tardas ~${Math.round((factor - 1) * 100)}% más de lo que estimas` : factor < 0.85 ? `Terminas ~${Math.round((1 - factor) * 100)}% antes de lo estimado` : 'Tus estimaciones de tiempo son bastante buenas',
          detalle: `Basado en ${ratios.length} tareas con Pomodoros.`, aplicado: 'Planificador de entregas y huecos libres (ajusto los minutos).' }
      : { id: 'estimacion', icono: '⏱️', confianza: 'baja', listo: false, titulo: 'Aprendiendo cuánto tardas', detalle: `Necesito ${Math.max(0, 3 - ratios.length)} tareas más con tiempo estimado y Pomodoros ligados a ellas.`, aplicado: 'Planificador y huecos libres.' }
  );
  aprendizajes.push(
    mejorHora != null
      ? { id: 'hora', icono: '🎯', confianza: confianza(ses.length, 4, 12), listo: true, titulo: `Rindes más entre las ${mejorHora}:00 y las ${mejorHora + 1}:00`, detalle: `Basado en ${ses.length} Pomodoros terminados.`, aplicado: 'Huecos libres: llevo tus tareas exigentes a tus mejores horas.' }
      : { id: 'hora', icono: '🎯', confianza: 'baja', listo: false, titulo: 'Aprendiendo tus mejores horas', detalle: `Termina ${Math.max(0, 4 - ses.length)} Pomodoros más.`, aplicado: 'Huecos libres.' }
  );
  aprendizajes.push(
    perfil
      ? { id: 'puntualidad', icono: perfil === 'ultima-hora' ? '🔥' : perfil === 'anticipado' ? '🌱' : '📆', confianza: puntualidad.confianza, listo: true,
          titulo: perfil === 'ultima-hora' ? 'Sueles terminar a última hora' : perfil === 'un-dia-antes' ? 'Sueles terminar el día antes' : 'Sueles adelantarte a la entrega',
          detalle: `Terminas ${medAnt < 0 ? 'después' : `~${Math.round(medAnt)} h antes`} de la fecha (mediana de ${anticipos.length} tareas).`,
          aplicado: 'Recordatorios sugeridos al crear tareas y alertas de "empieza hoy".' }
      : { id: 'puntualidad', icono: '📆', confianza: 'baja', listo: false, titulo: 'Aprendiendo tu ritmo de entrega', detalle: `Completa ${Math.max(0, 4 - anticipos.length)} tareas más (con la app abierta al marcarlas).`, aplicado: 'Recordatorios y alertas.' }
  );
  if (mejorDia != null) aprendizajes.push({ id: 'dia', icono: '📈', confianza: confianza(hechas.length + ses.length, 6, 20), listo: true, titulo: `Tu día más productivo es el ${DIAS[mejorDia]}`, detalle: 'Por tareas completadas y minutos de enfoque.', aplicado: 'Te lo recuerdo en el resumen.' });
  if (energiaH.alta != null) {
    aprendizajes.push({ id: 'energia', icono: '⚡', confianza: energiaH.confianza, listo: true,
      titulo: energiaH.alta > energiaH.baja * 1.3 ? 'Con energía alta completas más tareas' : 'Tu energía casi no cambia lo que completas',
      detalle: `${energiaH.alta.toFixed(1)} tareas/día con energía 4–5 vs ${energiaH.baja.toFixed(1)} con energía 1–2.`, aplicado: 'Plan: en días de poca energía priorizo tareas cortas.' });
  }

  return { estimacion, franjas: { porHora, mejorHora, horasFuertes, sesiones: ses.length }, dias: { porDia, mejorDia, nombres: DIAS }, puntualidad, energia: energiaH, porMateria, aprendizajes, muestrasTotales: hechas.length + ses.length };
}

/** Minutos que probablemente vas a necesitar, ajustados a tu historial (si el aprendizaje está activo). */
export const minutosAjustados = (estimados, habitos, aplicar = true) =>
  aplicar && habitos?.estimacion.factor ? Math.max(5, Math.round((estimados * habitos.estimacion.factor) / 5) * 5) : estimados;
