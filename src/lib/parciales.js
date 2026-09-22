// Preparación de parciales: tarjetas, mini test, simulación de examen y consejos de estudio.
// Todo se genera con reglas claras (frecuencia de palabras, patrones "X es Y"…), no con una IA
// externa —así funciona sin conexión y sin depender de un servicio de pago— y siempre es editable.

const CONECTORES = new Set('el la los las un una unos unas de del al a en y o u que como para por con sin sobre entre desde hasta hacia según durante mediante tras este esta estos estas ese esa esos esas su sus mi mis tu tus se le les lo lo cual cuales cual quien quienes cuando donde su es son fue fueron ser estar está están era eran no sí más menos también pero porque si ya solo muy tan tanto cada otro otra otros otras'.split(' '));

export function dividirEnOraciones(texto) {
  return String(texto || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.;:!?])\s+(?=[A-ZÁÉÍÓÚÑ0-9])|\s+(?=[-•*]\s)|\n+/)
    .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
    .filter((s) => s.length > 8);
}

/** Palabras clave por frecuencia (ignora conectores y números sueltos). */
export function palabrasClave(texto, max = 12) {
  const cuentas = new Map();
  for (const palabra of String(texto || '').toLowerCase().match(/[a-záéíóúñ]{4,}/g) || []) {
    if (CONECTORES.has(palabra)) continue;
    cuentas.set(palabra, (cuentas.get(palabra) || 0) + 1);
  }
  return [...cuentas.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max).map(([palabra, veces]) => ({ palabra, veces }));
}

const mayuscInicial = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Genera tarjetas pregunta/respuesta a partir de texto (apuntes, un PDF, una diapositiva…).
 * Reconoce: "Término: definición", "Término es/son definición", líneas con guion,
 * y como respaldo usa la oración más relevante de cada palabra clave.
 */
export function generarTarjetas(texto, max = 20) {
  const tarjetas = [];
  const vistos = new Set();
  const agregar = (pregunta, respuesta) => {
    const clave = pregunta.toLowerCase();
    if (!pregunta || !respuesta || respuesta.length < 2 || vistos.has(clave)) return;
    vistos.add(clave);
    tarjetas.push({ id: `t${tarjetas.length + 1}`, pregunta: mayuscInicial(pregunta.trim()), respuesta: mayuscInicial(respuesta.trim()) });
  };

  for (const linea of dividirEnOraciones(texto)) {
    let m = linea.match(/^[-•*]?\s*([^:–]{3,60}):\s*(.{3,220})$/);
    if (m) { agregar(`¿Qué es ${m[1].trim()}?`, m[2]); continue; }
    m = linea.match(/^(.{3,60}?)\s+(?:es|son|significa[n]?|se define como)\s+(.{5,220})$/i);
    if (m) { agregar(`¿Qué es ${m[1].trim()}?`, m[2]); continue; }
    m = linea.match(/^(.{3,60}?)\s*[-–]\s*(.{5,220})$/);
    if (m) { agregar(`¿Qué es ${m[1].trim()}?`, m[2]); continue; }
  }

  if (tarjetas.length < max) {
    const oraciones = dividirEnOraciones(texto);
    const oracionesUsadas = new Set(tarjetas.map((t) => t.respuesta.toLowerCase()));
    for (const { palabra } of palabrasClave(texto, max * 3)) {
      if (tarjetas.length >= max) break;
      // Cada tarjeta debe tener una respuesta distinta: si la mejor oración de esta palabra
      // ya la usó otra tarjeta, no sirve como pregunta de opción múltiple (se verían dos
      // respuestas idénticas), así que se ignora esa palabra.
      const oracion = oraciones.find((o) => o.toLowerCase().includes(palabra) && !oracionesUsadas.has(o.toLowerCase()));
      if (oracion) { agregar(`¿Qué relación tiene "${palabra}" con el tema?`, oracion); oracionesUsadas.add(oracion.toLowerCase()); }
    }
  }
  return tarjetas.slice(0, max);
}

/** Une tarjetas generadas de varias fuentes con las que la persona escribió a mano, sin duplicar. */
export function combinarTarjetas(listas) {
  const vistos = new Set();
  const resultado = [];
  for (const lista of listas) {
    for (const t of lista) {
      const clave = t.pregunta.trim().toLowerCase();
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      resultado.push({ ...t, id: `t${resultado.length + 1}` });
    }
  }
  return resultado;
}

function mezclar(arr, azar = Math.random) {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  return c;
}

/** Preguntas de opción múltiple a partir de las tarjetas (la respuesta correcta + 3 distractores de otras tarjetas). */
export function generarPreguntas(tarjetas, { cuantas = tarjetas.length, azar = Math.random } = {}) {
  if (tarjetas.length < 2) return [];
  return mezclar(tarjetas, azar).slice(0, cuantas).map((t) => {
    // Nunca se repite el texto de una opción dentro de la misma pregunta (se vería como dos
    // respuestas idénticas): se descartan las tarjetas cuya respuesta ya está en uso.
    const usadas = new Set([t.respuesta.toLowerCase()]);
    const distractores = [];
    for (const otra of mezclar(tarjetas.filter((x) => x.id !== t.id), azar)) {
      if (distractores.length >= 3) break;
      if (usadas.has(otra.respuesta.toLowerCase())) continue;
      usadas.add(otra.respuesta.toLowerCase());
      distractores.push(otra.respuesta);
    }
    if (distractores.length < 3) return null; // no hay suficientes respuestas distintas para armar 4 opciones
    return { id: t.id, pregunta: t.pregunta, opciones: mezclar([t.respuesta, ...distractores], azar), correcta: t.respuesta };
  }).filter(Boolean);
}

/** Corrige un test: [{id, elegida}] contra las preguntas. */
export function calificarTest(preguntas, respuestas) {
  const detalle = preguntas.map((p) => ({ id: p.id, correcta: respuestas[p.id] === p.correcta, esperada: p.correcta, elegida: respuestas[p.id] || null }));
  const aciertos = detalle.filter((d) => d.correcta).length;
  return { aciertos, total: preguntas.length, porcentaje: preguntas.length ? Math.round((aciertos / preguntas.length) * 100) : 0, detalle };
}

/** Sistema tipo Leitner simple: una tarjeta "difícil" vuelve a salir antes que una que ya dominas. */
export function actualizarProgresoTarjeta(progreso, tarjetaId, acertaste) {
  const actual = progreso[tarjetaId]?.nivel || 0;
  const nivel = acertaste ? Math.min(4, actual + 1) : 0;
  return { ...progreso, [tarjetaId]: { nivel, vistoEl: new Date().toISOString(), racha: acertaste ? (progreso[tarjetaId]?.racha || 0) + 1 : 0 } };
}
/** Ordena las tarjetas para repasar: primero las que nunca has visto o fallaste más. */
export function ordenarParaRepasar(tarjetas, progreso) {
  return [...tarjetas].sort((a, b) => (progreso[a.id]?.nivel ?? -1) - (progreso[b.id]?.nivel ?? -1));
}
export function dominioGeneral(tarjetas, progreso) {
  if (tarjetas.length === 0) return 0;
  const suma = tarjetas.reduce((s, t) => s + (progreso[t.id]?.nivel ?? 0), 0);
  return Math.round((suma / (tarjetas.length * 4)) * 100);
}

/** Consejos de estudio según cuánto falta para el parcial y cómo te ha ido en los tests. */
export function consejosEstudio({ diasRestantes, dominio, tarjetasDificiles = [], ultimoPorcentaje = null }) {
  const consejos = [];
  if (diasRestantes == null) {
    consejos.push({ t: 'plan', x: 'Ponle una fecha a tu parcial para que te diga cómo repartir el estudio.' });
  } else if (diasRestantes <= 0) {
    consejos.push({ t: 'urgente', x: 'Es hoy: haz una simulación cronometrada y repasa solo las tarjetas que fallas.' });
  } else if (diasRestantes === 1) {
    consejos.push({ t: 'urgente', x: 'Mañana es el parcial: prioriza repasar las tarjetas difíciles y duerme bien, ayuda más que trasnochar.' });
  } else if (diasRestantes <= 3) {
    consejos.push({ t: 'plan', x: `Quedan ${diasRestantes} días: haz una simulación completa y repasa por las mañanas, que es cuando mejor se fija la memoria.` });
  } else if (diasRestantes <= 7) {
    consejos.push({ t: 'plan', x: `Con ${diasRestantes} días por delante, repasa las tarjetas en sesiones cortas (15-20 min) en vez de una sola larga.` });
  } else {
    consejos.push({ t: 'plan', x: 'Aún te queda tiempo: usa la repetición espaciada — repasa hoy, en 2 días y en una semana, en vez de todo junto al final.' });
  }
  if (dominio != null) {
    if (dominio < 40) consejos.push({ t: 'dominio', x: 'Vas empezando: enfócate en entender los conceptos antes de memorizar (vuelve a leer la fuente de las tarjetas que más fallas).' });
    else if (dominio < 75) consejos.push({ t: 'dominio', x: 'Vas por buen camino: alterna tarjetas con mini tests para que la memoria se active de dos formas distintas.' });
    else consejos.push({ t: 'dominio', x: '¡Buen dominio! Haz una simulación completa para medir tiempos, y repasa solo lo que aún falla.' });
  }
  if (tarjetasDificiles.length > 0) consejos.push({ t: 'difíciles', x: `Repite estas primero: ${tarjetasDificiles.slice(0, 3).map((t) => t.pregunta).join(' · ')}` });
  if (ultimoPorcentaje != null && ultimoPorcentaje < 60) consejos.push({ t: 'test', x: 'Tu último test estuvo bajo el 60%: en vez de leer más, practica explicando cada respuesta en voz alta (técnica Feynman).' });
  consejos.push({ t: 'general', x: 'La técnica Pomodoro (25 min de estudio + 5 de descanso) funciona bien para sesiones de repaso.' });
  return consejos;
}

// --- Mapa conceptual y diagrama de flujo (esquemas visuales, no una IA: se generan por reglas) ---

/** Mapa conceptual radial: un centro (el tema) y ramas con las ideas clave y su explicación. */
export function generarMapaConceptual(texto, titulo = 'Tema', max = 8) {
  const oraciones = dividirEnOraciones(texto);
  const ramas = palabrasClave(texto, max).map(({ palabra }) => ({
    palabra: mayuscInicial(palabra),
    detalle: oraciones.find((o) => o.toLowerCase().includes(palabra)) || '',
  }));
  return { centro: titulo, ramas };
}

const MARCADOR_PASO = /^\s*(?:paso\s*)?(\d{1,2})[.)]\s*(.+)$/i;

/** Diagrama de flujo: pasos en orden. Si el texto ya numera pasos, los usa; si no, toma las primeras oraciones. */
export function generarDiagramaFlujo(texto, max = 8) {
  const lineas = String(texto || '').split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const numerados = lineas.map((l) => l.match(MARCADOR_PASO)).filter(Boolean).sort((a, b) => Number(a[1]) - Number(b[1]));
  const pasos = (numerados.length >= 2 ? numerados.map((m) => m[2]) : dividirEnOraciones(texto)).slice(0, max);
  return pasos.map((texto, i) => ({ n: i + 1, texto: mayuscInicial(texto.trim()) }));
}
