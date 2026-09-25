// Preparación de parciales: tarjetas, mini test, simulación de examen y consejos de estudio.
// Todo se genera con reglas claras (frecuencia de palabras, patrones "X es Y"…), no con una IA
// externa —así funciona sin conexión y sin depender de un servicio de pago— y siempre es editable.

// Para agrupar variaciones de una misma palabra ("célula"/"células", "producir"/"produce") se
// recortan las terminaciones más comunes del español (plurales, verbos, sustantivos en
// -ción/-mente…). No es tan fino como una librería de PLN completa, pero es liviano, no
// depende de nada externo (cero riesgo de que un import se rompa) y funciona igual en
// cualquier navegador o sistema operativo.
const cacheStem = new Map();
const SUFIJOS_ES = [
  'aciones', 'amiento', 'imiento', 'mente', 'ciones', 'idades', 'idad', 'ación', 'sión',
  'ando', 'iendo', 'aron', 'ieron', 'aban', 'ían', 'aba', 'ía', 'ado', 'ada', 'ados', 'adas',
  'ido', 'ida', 'idos', 'idas', 'ar', 'er', 'ir', 'es', 's',
];
function stemEs(palabraCruda) {
  const palabra = palabraCruda.toLowerCase();
  let v = cacheStem.get(palabra);
  if (v !== undefined) return v;
  v = palabra;
  for (const suf of SUFIJOS_ES) {
    if (v.length - suf.length >= 4 && v.endsWith(suf)) { v = v.slice(0, -suf.length); break; }
  }
  v = v.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // quita tildes, para que "célula" y "celula" agrupen igual
  cacheStem.set(palabra, v);
  return v;
}

const CONECTORES = new Set('el la los las un una unos unas de del al a en y o u que como para por con sin sobre entre desde hasta hacia según durante mediante tras este esta estos estas ese esa esos esas su sus mi mis tu tus se le les lo lo cual cuales cual quien quienes cuando donde su es son fue fueron ser estar está están era eran no sí más menos también pero porque si ya solo muy tan tanto cada otro otra otros otras'.split(' '));

/** Solo el énfasis en línea (negrita, cursiva, código, títulos) — conserva los marcadores de
 * lista/numeración, que "generarDiagramaFlujo" todavía necesita para detectar pasos. */
function quitarEnfasis(texto) {
  return String(texto || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/(\*\*\*|___)(.*?)\1/g, '$2')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    // Marcadores sueltos que quedaron sin su pareja (p. ej. un "**" al que le falta el cierre):
    // ya no aportan nada útil, así que se retiran en vez de dejarlos colados en el texto.
    .replace(/\*{1,}|`+/g, '');
}
/** Quita el formato Markdown de los apuntes (**negrita**, *cursiva*, `código`, # títulos, - listas)
 * antes de buscar conceptos: si no se limpia, símbolos como "**" terminan colándose en las
 * preguntas y los mapas generados. */
export function quitarMarcado(texto) {
  return quitarEnfasis(texto)
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    .replace(/^\s{0,3}\d+[.)]\s+/gm, '');
}

export function dividirEnOraciones(texto) {
  return quitarMarcado(texto)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.;:!?])\s+(?=[A-ZÁÉÍÓÚÑ0-9])|\s+(?=[-•*]\s)|\n+/)
    .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
    .filter((s) => s.length > 8);
}

/** Palabras clave por frecuencia (ignora conectores y números sueltos). Cuenta juntas las
 * variaciones de una misma palabra ("célula"/"células") recortando sus terminaciones,
 * y muestra la forma más común de cada una (no un lexema artificial). */
export function palabrasClave(texto, max = 12) {
  const porLexema = new Map(); // lexema -> { veces, formas: Map(forma -> veces) }
  for (const palabra of quitarMarcado(texto).toLowerCase().match(/[a-záéíóúñ]{4,}/g) || []) {
    if (CONECTORES.has(palabra)) continue;
    const lexema = stemEs(palabra);
    const entrada = porLexema.get(lexema) || { veces: 0, formas: new Map() };
    entrada.veces += 1;
    entrada.formas.set(palabra, (entrada.formas.get(palabra) || 0) + 1);
    porLexema.set(lexema, entrada);
  }
  return [...porLexema.entries()]
    .sort((a, b) => b[1].veces - a[1].veces || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([, { veces, formas }]) => ({ palabra: [...formas.entries()].sort((a, b) => b[1] - a[1])[0][0], veces }));
}

const mayuscInicial = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Busca en cada oración una relación "término → definición" (con dos puntos, con un verbo
 * como "es/tiene/produce…", o con guion). Es la pieza compartida entre las tarjetas de
 * estudio y el mapa conceptual, para que ambos muestren exactamente el mismo conocimiento.
 */
function extraerRelaciones(texto) {
  const relaciones = [];
  const vistos = new Set();
  const reVerbo = new RegExp(`^(.{3,60}?)\\s+(${VERBOS_DEFINITORIOS})\\s+(.{5,220})$`, 'i');
  for (const oracion of dividirEnOraciones(texto)) {
    let m = oracion.match(/^[-•*]?\s*([^:–]{3,60}):\s*(.{3,220})$/);
    if (m) { relaciones.push({ termino: m[1].trim(), relacion: 'es', definicion: m[2].trim(), oracion }); continue; }
    m = oracion.match(reVerbo);
    if (m) { relaciones.push({ termino: m[1].trim(), relacion: m[2].toLowerCase(), definicion: m[3].trim(), oracion }); continue; }
    m = oracion.match(/^(.{3,60}?)\s*[-–]\s*(.{5,220})$/);
    if (m) { relaciones.push({ termino: m[1].trim(), relacion: 'es', definicion: m[2].trim(), oracion }); continue; }
  }
  return relaciones.filter((r) => { const k = r.termino.toLowerCase(); if (vistos.has(k)) return false; vistos.add(k); return true; });
}

/**
 * Genera tarjetas pregunta/respuesta a partir de texto (apuntes, un PDF, una diapositiva…).
 * Reconoce: "Término: definición", "Término es/son definición", líneas con guion,
 * y como respaldo usa la oración más relevante de cada palabra clave.
 */
const VERBOS_DEFINITORIOS = 'es|son|significa[n]?|se define como|se refiere a|produce[n]?|contiene[n]?|tiene[n]?|permite[n]?|genera[n]?|reduce[n]?|guarda[n]?|convierte[n]?|incluye[n]?|forma[n]?|compone[n]?|requiere[n]?|necesita[n]?|ayuda[n]? a|sirve[n]? para|consiste[n] en|se encarga[n]? de|representa[n]?|corresponde[n]? a|entra[n]? por|actúa[n]? como|funciona[n]? como';

/**
 * Para una oración que no encaja en ningún patrón de definición, se arma una tarjeta de
 * "completar la idea": la pregunta es el principio de la oración tal cual está escrita, y la
 * respuesta es el resto — así siempre es coherente (es la oración real, no una adivinanza
 * sobre "de qué habla"), y funciona como una técnica de estudio real (huecos para completar).
 */
function partirEnMitad(oracion) {
  const palabras = oracion.replace(/[.,;:]$/, '').split(/\s+/);
  if (palabras.length < 5) return null; // muy corta para partirla con sentido
  const corte = Math.max(3, Math.min(palabras.length - 2, Math.round(palabras.length * 0.45)));
  return { inicio: palabras.slice(0, corte).join(' '), resto: palabras.slice(corte).join(' ') };
}

/**
 * Genera tarjetas pregunta/respuesta a partir de texto (apuntes, un PDF, una diapositiva…).
 * Busca dar cobertura a CADA idea del texto (no solo a las más frecuentes): reconoce
 * "Término: definición", muchas formas de "Término es/tiene/produce/permite… definición",
 * líneas con guion, y para lo que no encaje en ningún patrón, arma una tarjeta de "completa
 * la idea" con la oración misma (nunca inventa una pregunta rara sobre "de qué habla").
 * `max` limita cuántas se devuelven como máximo (por defecto, todas las que encuentre).
 */
export function generarTarjetas(texto, max = Infinity) {
  const tarjetas = [];
  const vistos = new Set();
  const agregar = (pregunta, respuesta) => {
    const clave = pregunta.toLowerCase();
    if (!pregunta || !respuesta || respuesta.length < 2 || vistos.has(clave)) return false;
    vistos.add(clave);
    tarjetas.push({ id: `t${tarjetas.length + 1}`, pregunta: mayuscInicial(pregunta.trim()), respuesta: mayuscInicial(respuesta.trim()) });
    return true;
  };

  const relaciones = extraerRelaciones(texto);
  const conPatron = new Set(relaciones.map((r) => r.oracion));
  for (const r of relaciones) {
    if (tarjetas.length >= max) break;
    agregar(`¿Qué es ${r.termino}?`, r.definicion);
  }

  // Cada oración que no encajó en un patrón todavía es una idea del texto: se convierte en
  // una tarjeta de "completa la idea" con su propio contenido (cobertura completa del tema).
  for (const oracion of dividirEnOraciones(texto)) {
    if (tarjetas.length >= max) break;
    if (conPatron.has(oracion) || oracion.length < 20) continue;
    const partido = partirEnMitad(oracion);
    if (!partido) continue;
    agregar(`Completa la idea: "${partido.inicio}…"`, partido.resto);
  }
  return tarjetas;
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
const MARCADOR_PASO = /^\s*(?:paso\s*)?(\d{1,2})[.)]\s*(.+)$/i;

/**
 * Mapa conceptual: el tema en el centro y, alrededor, cada término con su definición real
 * (la misma relación "término → definición" que arman las tarjetas, para que el mapa
 * muestre relaciones de verdad y no solo palabras sueltas por frecuencia).
 * Si el texto no tiene definiciones reconocibles, usa las palabras más repetidas como respaldo.
 */
export function generarMapaConceptual(texto, titulo = 'Tema', max = 9) {
  const relaciones = extraerRelaciones(texto).slice(0, max);
  if (relaciones.length >= 3) {
    return { centro: titulo, ramas: relaciones.map((r) => ({ palabra: mayuscInicial(r.termino), relacion: r.relacion, detalle: mayuscInicial(r.definicion) })) };
  }
  // Respaldo para texto sin definiciones claras (p. ej. una lista suelta de datos).
  const oraciones = dividirEnOraciones(texto);
  const ramas = palabrasClave(texto, max).map(({ palabra }) => ({
    palabra: mayuscInicial(palabra), relacion: 'se relaciona con',
    detalle: mayuscInicial(oraciones.find((o) => o.toLowerCase().includes(palabra)) || ''),
  }));
  return { centro: titulo, ramas };
}

const PISTAS_SECUENCIA = /^(primero|para empezar|en primer lugar|segundo|tercero|luego|después|despues|a continuación|a continuacion|posteriormente|entonces|seguidamente|finalmente|por último|por ultimo|al final)\b/i;

/**
 * Diagrama de flujo: solo tiene sentido si el texto describe pasos en orden. Si ya vienen
 * numerados ("1.", "Paso 2"…) o con palabras de secuencia ("primero", "luego", "finalmente"…),
 * arma los pasos con eso. Si no encuentra ninguna pista de secuencia, no inventa un flujo
 * falso a partir de definiciones sueltas (eso no ayuda a analizar nada): avisa que este texto
 * no parece describir un proceso y sugiere el mapa conceptual en su lugar.
 */
export function generarDiagramaFlujo(texto, max = 10) {
  const lineas = quitarEnfasis(texto).split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const numerados = lineas.map((l) => l.match(MARCADOR_PASO)).filter(Boolean).sort((a, b) => Number(a[1]) - Number(b[1]));
  if (numerados.length >= 2) return numerados.slice(0, max).map((m, i) => ({ n: i + 1, texto: mayuscInicial(m[2].trim()) }));

  const oraciones = dividirEnOraciones(texto);
  const conPista = oraciones.filter((o) => PISTAS_SECUENCIA.test(o.trim()));
  if (conPista.length >= 2) return conPista.slice(0, max).map((o, i) => ({ n: i + 1, texto: mayuscInicial(o.replace(PISTAS_SECUENCIA, '').replace(/^[,:]\s*/, '').trim()) }));

  return [];
}

