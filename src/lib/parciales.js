// Preparación de parciales: tarjetas, mini test, simulación de examen y consejos de estudio.
// Todo se genera con reglas claras, no con una IA externa —así funciona sin conexión y sin
// depender de un servicio de pago— y siempre es editable.
//
// El orden importa, y es lo que hace que las preguntas tengan sentido:
//   1. limpiarTextoFuente: quita lo que NO es contenido (índices con puntos guía, encabezados y
//      pies de página repetidos, números de página, títulos de sección pegados a los párrafos).
//   2. dividirEnOraciones: solo deja oraciones completas y legibles.
//   3. generarTarjetas: definiciones reales ("X es…", "X: …") y, para el resto de oraciones,
//      tarjetas de completar donde se oculta UN término clave del tema (no media oración).

// --- Palabras -------------------------------------------------------------------------------
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
  v = v.normalize('NFD').replace(/[̀-ͯ]/g, '');
  cacheStem.set(palabra, v);
  return v;
}
const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

const CONECTORES = new Set('el la los las un una unos unas de del al a en y o u e ni que como para por con sin sobre entre desde hasta hacia según durante mediante tras este esta estos estas ese esa esos esas aquel aquella su sus mi mis tu tus nuestro nuestra se le les lo cual cuales quien quienes cuando donde es son fue fueron ser estar está están era eran no sí más menos también pero porque si ya solo sólo muy tan tanto cada otro otra otros otras'.split(' '));

// Palabras demasiado generales para ser "el término" de una pregunta: aparecen en cualquier
// texto y ocultarlas no evalúa nada del tema ("Completa: … de _____ manera…").
const GENERICAS = new Set(sinTildes(`manera forma parte partes través ejemplo ejemplos general generales siguiente siguientes
  importante importantes tiene tienen tener puede pueden poder debe deben deber hace hacen hacer
  sirve sirven permite permiten existen existe siempre nunca algunos algunas mismo misma mismos mismas
  todos todas cualquier mayor menor mejor peor nuevo nueva nuevos nuevas cierto cierta grado tipo tipos
  momento momentos cosas cosa caso casos vez veces todo toda primero primera segundo segunda tercero
  tercera último última cuanto cuánto tiempo bien bastante tarde temprano sencillo sencilla fácil difícil
  distinto distinta distintos distintas diferente diferentes claro claros clara claras modo calcular
  considerando según desde hasta también además entonces mientras aunque porque cuales donde cuando
  pesos mañana semana semanas anterior anteriores posterior posteriores comunes común únicamente`).split(/\s+/));

// --- 1. Limpieza del texto fuente -------------------------------------------------------------

/** Solo el énfasis Markdown (negrita, cursiva, código, títulos #): conserva el resto. */
function quitarEnfasis(texto) {
  return String(texto || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/(\*\*\*|___)(.*?)\1/g, '$2')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\*{1,}|`+/g, '');
}

/** Quita el formato Markdown y los marcadores de lista/numeración del inicio de cada línea. */
export function quitarMarcado(texto) {
  return quitarEnfasis(texto)
    .replace(/^\s{0,3}[-*+•▪◦●]\s+/gm, '')
    .replace(/^\s{0,3}\d+(?:[.\s]+\d+){0,4}[.)]?\s+(?=\S)/gm, '');
}

// Puntos guía de un índice ("Introducción ........ 3") o rayas/guiones bajos de relleno.
const PUNTOS_GUIA = /(?:\s?[.·…_]\s?){4,}\s*\d{0,4}/g;
const LINEA_DE_PAGINA = /^(?:p[aá]g(?:ina)?\.?\s*)?\d{1,4}(?:\s*(?:de|\/)\s*\d{1,4})?$/i;
const SECCION = /^\d+(?:\.\d+){0,5}\.?$/; // "6", "6.3.4", "2.1."

const contarLetras = (s) => (s.match(/[a-záéíóúüñ]/gi) || []).length;
const proporcionLetras = (s) => { const sinEspacios = s.replace(/\s/g, ''); return sinEspacios ? contarLetras(s) / sinEspacios.length : 0; };

/** Quita prefijos/sufijos que se repiten en la mayoría de las páginas (encabezados y pies). */
function quitarRepetidosPorPagina(paginas) {
  if (paginas.length < 3) return paginas;
  const normal = (palabras) => palabras.map((w) => sinTildes(w.toLowerCase()).replace(/\d+/g, '#')).join(' ');
  const umbral = Math.max(3, Math.ceil(paginas.length * 0.5));
  // Se parte solo por espacios: los saltos de línea (marcados como ' \n ') se conservan como palabra propia.
  let partes = paginas.map((p) => p.split(/[ \t]+/).filter(Boolean));
  for (const lado of ['inicio', 'fin']) {
    for (let k = 30; k >= 3; k--) {
      const conteo = new Map();
      for (const pal of partes) {
        if (pal.length <= k) continue;
        const trozo = lado === 'inicio' ? pal.slice(0, k) : pal.slice(-k);
        const clave = normal(trozo);
        conteo.set(clave, (conteo.get(clave) || 0) + 1);
      }
      const repetidos = [...conteo.entries()].filter(([, n]) => n >= umbral).map(([c]) => c);
      if (repetidos.length === 0) continue;
      const rep = new Set(repetidos);
      partes = partes.map((pal) => {
        if (pal.length <= k) return pal;
        const trozo = lado === 'inicio' ? pal.slice(0, k) : pal.slice(-k);
        if (!rep.has(normal(trozo))) return pal;
        return lado === 'inicio' ? pal.slice(k) : pal.slice(0, -k);
      });
      break;
    }
  }
  return partes.map((p) => p.join(' '));
}

/** Una línea que es un título (no una oración): numerada, en MAYÚSCULAS, o corta y sin punto final. */
function esTitulo(linea, siguiente = '') {
  const l = linea.trim();
  const palabras = l.split(/\s+/);
  if (palabras.length > 12 || /[.!?;:]$/.test(l)) return false;
  if (/^\d+(?:\.\d+)*\.?\s+\S/.test(l)) return true;
  const letras = l.replace(/[^a-záéíóúüñ]/gi, '');
  if (letras.length >= 4 && letras === letras.toUpperCase()) return true;
  return palabras.length <= 7 && /^[A-ZÁÉÍÓÚÑ¿¡]/.test(siguiente.trim());
}

/**
 * Deja solo el contenido de estudio: sin índice, sin encabezados ni pies de página, sin números de
 * página, con los títulos separados de los párrafos y las líneas cortadas por el PDF vueltas a unir.
 * Funciona igual con texto pegado a mano, con Word y con PDF (tanto el de una línea por renglón
 * como el de "toda la página en una línea" que guardaban las fuentes viejas).
 */
export function limpiarTextoFuente(texto) {
  let t = quitarEnfasis(String(texto || '')).replace(/\r/g, '').replace(/\u00a0/g, ' ');

  // Encabezados y pies: se detectan por página. Las páginas vienen separadas por una línea en
  // blanco; en las fuentes viejas cada página quedó en UNA sola línea larguísima.
  const bloques = t.split(/\n\s*\n/);
  const lineasTodas = t.split('\n').filter((l) => l.trim());
  const unaLineaPorPagina = bloques.length < 3 && lineasTodas.length >= 3 && lineasTodas.every((l) => l.split(/\s+/).length > 25 || l.split(/\s+/).length < 4);
  if (unaLineaPorPagina) t = quitarRepetidosPorPagina(lineasTodas).join('\n\n');
  else t = quitarRepetidosPorPagina(bloques.map((b) => b.replace(/\n/g, ' \n '))).join('\n\n').replace(/ \n /g, '\n');
  // Líneas cortas idénticas que se repiten 3+ veces (encabezado/pie en su propia línea).
  const conteoLineas = new Map();
  for (const l of t.split('\n')) { const k = sinTildes(l.trim().toLowerCase()).replace(/\d+/g, '#'); if (k && k.split(/\s+/).length <= 12 && !/[.!?]$/.test(k)) conteoLineas.set(k, (conteoLineas.get(k) || 0) + 1); }
  t = t.split('\n').filter((l) => (conteoLineas.get(sinTildes(l.trim().toLowerCase()).replace(/\d+/g, '#')) || 0) < 3).join('\n');

  const lineas = [];
  for (const cruda of t.split('\n')) {
    let l = cruda.replace(/[ \t]+/g, ' ').trim();
    if (LINEA_DE_PAGINA.test(l)) l = '';
    // Índice: todo lo que va antes de unos puntos guía es un título del índice; solo se conserva
    // lo que viene después del último (en las fuentes viejas, el resto de la página).
    if (PUNTOS_GUIA.test(l)) {
      PUNTOS_GUIA.lastIndex = 0;
      const trozos = l.split(PUNTOS_GUIA);
      l = trozos[trozos.length - 1].trim();
    }
    PUNTOS_GUIA.lastIndex = 0;
    if (!l) { lineas.push(''); continue; }
    // Números de sección en medio del texto (fuentes viejas): se cortan en línea aparte para que
    // el título no quede pegado a la oración siguiente.
    l = l.replace(/\s+(?=\d+(?:\.\d+)+\.?\s+[A-ZÁÉÍÓÚÑ])/g, '\n').replace(/(?<=[.!?])\s+(?=\d{1,2}\.?\s+[A-ZÁÉÍÓÚÑ])/g, '\n');
    for (const parte of l.split('\n')) lineas.push(parte.trim());
  }

  // Reunir líneas cortadas por el PDF: se une con la anterior si esta no termina en punto y
  // ninguna de las dos es un título ni una viñeta.
  const salida = [];
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    if (!l) { salida.push(''); continue; }
    const vineta = /^[-•▪◦●*]\s/.test(l);
    const titulo = !vineta && esTitulo(l, lineas.slice(i + 1).find((x) => x) || '');
    const prev = salida[salida.length - 1];
    const prevAbierta = prev && !/[.!?:;]$/.test(prev) && !prev.startsWith('§');
    if (titulo) { salida.push(`§${l}`); continue; }
    if (vineta) {
      // La viñeta se une a la línea que la introduce ("Ventajas…:"), aunque haya una línea en blanco entre ambas.
      let j = salida.length - 1;
      while (j >= 0 && salida[j] === '') j--;
      const intro = salida[j];
      if (intro && !intro.startsWith('§') && (/:$/.test(intro) || intro.includes(' • '))) {
        salida.length = j + 1;
        salida[j] = `${intro} • ${l.replace(/^[-•▪◦●*]\s+/, '')}`;
        continue;
      }
    }
    // Dos líneas seguidas tipo "Término: definición" (diapositivas, Excel) son ideas distintas.
    const esDefinicion = (x) => /^[^:]{2,60}:\s+\S/.test(x);
    const separadas = esDefinicion(l) || (prev && esDefinicion(prev) && /^[A-ZÁÉÍÓÚÑ]/.test(l));
    if (prevAbierta && !vineta && /^[a-záéíóúñ(0-9"“]/.test(l)) salida[salida.length - 1] = `${prev} ${l}`;
    else if (prevAbierta && !vineta && !separadas && prev.split(/\s+/).length >= 8) salida[salida.length - 1] = `${prev} ${l}`;
    else salida.push(l);
  }
  return salida
    .filter((l) => !l.startsWith('§')) // los títulos no son contenido para preguntar
    .map((l) => l.replace(/^[-•▪◦●*]\s+/, '').replace(/\s+[▪◦●]\s+/g, ' • ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// --- 2. Oraciones ---------------------------------------------------------------------------

/** Si la oración arranca con "2.1 Título de la sección La oración real…", quita el título. */
function quitarTituloPegado(oracion) {
  const m = oracion.match(/^\d+(?:\.\d+)*\.?\s+(.*)$/);
  if (!m) return oracion;
  const palabras = m[1].split(/\s+/);
  for (let i = 2; i < Math.min(palabras.length, 13); i++) {
    const w = palabras[i];
    if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(w)) return palabras.slice(i).join(' ');
  }
  return '';
}

/** En las fuentes viejas una tabla quedaba pegada a la oración siguiente ("150 150 5 Riesgo y
 * sensibilidad El análisis…"): si la oración está llena de números, se rescata desde el título. */
function rescatarDeTabla(o) {
  const filaDeNumeros = /(?:-?\d[\d.,]*\s+){4,}/.test(o);
  if (!o || (proporcionLetras(o) >= 0.75 && !filaDeNumeros)) return o;
  const marcas = [...o.matchAll(/(?:^|\s)(\d{1,2}(?:\.\d+)*\.?\s+)(?=[A-ZÁÉÍÓÚÑ][a-záéíóúñ])/g)];
  if (marcas.length === 0) return o;
  const ultima = marcas[marcas.length - 1];
  return quitarTituloPegado(o.slice(ultima.index).trim());
}

function oracionUtil(o) {
  const palabras = o.split(/\s+/);
  if (palabras.length < 6 || palabras.length > 60) return false;
  if (!/^[A-ZÁÉÍÓÚÑ¿¡"“(]/.test(o)) return false; // un fragmento cortado arranca en minúscula
  if (proporcionLetras(o) < 0.75) return false; // tablas, fórmulas, filas de números
  // Portadas, títulos y restos sin punto final no son oraciones… salvo una definición con dos
  // puntos ("VPN: diferencia entre…"), que en diapositivas y en Excel casi nunca lleva punto.
  const definicionSinPunto = /^[^:]{2,60}:\s+\S/.test(o);
  if (!/[.!?…]["”)]?$/.test(o) && !definicionSinPunto) return false;
  if (/^(nota|ojo|recuerda|recuerde|ver|véase|ejercicio|tarea|fuente|tomado de|imagen|figura|tabla|cuadro)\b/i.test(o)) return false;
  const mayus = palabras.filter((w) => w.length > 3 && w === w.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(w)).length;
  if (mayus / palabras.length > 0.4) return false; // títulos en mayúsculas
  return true;
}

export function dividirEnOraciones(texto) {
  return limpiarTextoFuente(texto)
    .split(/\n+/)
    .flatMap((linea) => linea.split(/(?<=[.!?])\s+(?=[¿¡"“(]?[A-ZÁÉÍÓÚÑ])/))
    .map((s) => rescatarDeTabla(quitarTituloPegado(s.trim())).replace(/\s+/g, ' ').trim())
    .filter(oracionUtil);
}

/** Palabras clave por frecuencia (ignora conectores y números). Agrupa variaciones de una
 * misma palabra ("célula"/"células") y muestra la forma más común. */
export function palabrasClave(texto, max = 12) {
  const porLexema = new Map();
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
const conPunto = (s) => (/[.!?…)]$/.test(s) ? s : `${s}.`);
/** "La TIR" → "la TIR"; "VPN" → "VPN" (no se toca una sigla ni un nombre propio en medio). */
const minusInicial = (s) => (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);

// --- 3. Definiciones ------------------------------------------------------------------------

// Cómo se pregunta según el verbo que introduce la definición.
const VERBOS = [
  { re: 'se define como', pregunta: (t) => `¿Cómo se define ${t}?` },
  { re: 'se refiere a', pregunta: (t) => `¿A qué se refiere ${t}?` },
  { re: 'consisten? en', pregunta: (t) => `¿En qué consiste ${t}?` },
  { re: 'se encargan? de', pregunta: (t) => `¿De qué se encarga ${t}?` },
  { re: 'significan?', pregunta: (t) => `¿Qué significa ${t}?` },
  { re: 'representan?', pregunta: (t) => `¿Qué representa ${t}?` },
  { re: 'corresponden? a', pregunta: (t) => `¿A qué corresponde ${t}?` },
  { re: 'son', pregunta: (t) => `¿Qué son ${t}?` },
  { re: 'es', pregunta: (t) => `¿Qué es ${t}?` },
];
const RE_VERBO = new RegExp(`^(.{2,70}?)\\s+(${VERBOS.map((v) => v.re).join('|')})\\s+(.+)$`, 'i');

// Un "término" nunca empieza con estas palabras: son el inicio de una condición o una
// anotación, no de un concepto ("Si el VPN es mayor…", "Nota: revisar…", "Cuando la TIR…").
const NO_INICIA_TERMINO = new Set(sinTildes(`si cuando porque aunque como para por que donde mientras ya pero sin con en de a
  hay esto eso esta este estos estas ello nota ejemplo ejemplos ver ojo importante recuerda recuerde tip pagina pag
  figura fig paso pasos ejercicio actividad tarea resumen conclusion fuente referencia advertencia aviso capitulo
  unidad seccion anexo tema punto fase etapa parte tabla grafico cuadro objetivo objetivos según luego despues
  entonces asi tambien ademas finalmente primero segundo tercero otro otra otros otras cada todo toda todos todas
  muchos muchas algunos algunas`).split(/\s+/));
// Si el término ya trae un verbo conjugado, es una oración entera, no un concepto ("La TIR tiene limitaciones").
const VERBO_EN_TERMINO = /\b(es|son|está|están|fue|fueron|tiene|tienen|hay|puede|pueden|debe|deben|hace|hacen|se|permite|permiten|genera|generan|sirve|sirven|ayuda|ayudan|incluye|incluyen|entra|entran|comienza|comienzan|era|eran|ser)\b/i;
// "X es una de las causas…", "X es mayor que…": describen una cualidad, no definen X.
const NO_ES_DEFINICION = /^(una?|uno) de\b|^(el|la|lo) (más|menos|mejor|peor|mayor|menor)\b|^(más|menos|mayor|menor|igual|fácil|difícil|importante|necesari[oa]|posible|clave|fundamental|útil|común|mejor|peor|cero|positiv[oa]|negativ[oa])\b/i;

function terminoValido(termino) {
  const t = termino.trim().replace(/[,;]$/, '');
  if (!t || !/^[A-ZÁÉÍÓÚÑa-záéíóúñ]/.test(t)) return false;
  const palabras = t.split(/\s+/);
  if (palabras.length > 8) return false;
  if (NO_INICIA_TERMINO.has(sinTildes(palabras[0].toLowerCase().replace(/[^a-záéíóúñ]/g, '')))) return false;
  if (VERBO_EN_TERMINO.test(t)) return false;
  if (proporcionLetras(t) < 0.7) return false;
  return true;
}

/** Relaciones "término → definición" reales del texto (las comparten tarjetas y mapa conceptual). */
function extraerRelaciones(oraciones) {
  const relaciones = [];
  const vistos = new Set();
  for (const oracion of oraciones) {
    let rel = null;
    const lista = oracion.match(/^((?:las?\s+|los\s+)?(ventajas|desventajas|características|tipos|clases|elementos|funciones|objetivos|pasos|etapas|fases|componentes|causas|consecuencias|beneficios|limitaciones|principios|requisitos)\b[^:•]{0,70}):\s*•?\s*(.+)$/i);
    if (lista && /•|;/.test(lista[3])) {
      const items = lista[3].split(/\s*[•;]\s*/).map((x) => x.replace(/[.\s]+$/, '').trim()).filter((x) => x.split(/\s+/).length >= 2);
      if (items.length >= 2) {
        const nucleo = lista[1].replace(/^(las?|los)\s+/i, '').trim();
        const articulo = /^(tipos|elementos|objetivos|pasos|componentes|beneficios|principios|requisitos)/i.test(nucleo) ? 'los' : 'las';
        rel = { termino: nucleo, relacion: 'incluye', definicion: items.map((x) => mayuscInicial(x)).join(' · '), pregunta: () => `¿Cuáles son ${articulo} ${minusInicial(nucleo)}?` };
      }
    }
    const dosPuntos = rel ? null : oracion.match(/^([^:]{2,60}):\s+(.{12,})$/);
    if (dosPuntos && dosPuntos[1].split(/\s+/).length <= 5 && terminoValido(dosPuntos[1]) && !dosPuntos[2].includes('•')) {
      rel = { termino: dosPuntos[1].trim(), relacion: 'es', definicion: dosPuntos[2].trim(), pregunta: VERBOS.find((v) => v.re === 'es').pregunta };
    } else if (!rel) {
      const m = oracion.match(RE_VERBO);
      if (m && terminoValido(m[1]) && !NO_ES_DEFINICION.test(m[3]) && m[3].split(/\s+/).length >= 4) {
        const verbo = VERBOS.find((v) => new RegExp(`^${v.re}$`, 'i').test(m[2]));
        // "X significa que…" → la respuesta empieza en lo que de verdad dice, sin el "que".
        const definicion = /^signific/i.test(m[2]) ? m[3].trim().replace(/^que\s+/i, '') : m[3].trim();
        rel = { termino: m[1].trim(), relacion: m[2].toLowerCase(), definicion, pregunta: verbo.pregunta };
      }
    }
    if (!rel) continue;
    const clave = sinTildes(rel.termino.toLowerCase());
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    relaciones.push({ ...rel, oracion });
  }
  return relaciones;
}

// --- 4. Términos clave (para las tarjetas de completar) -------------------------------------

/** El "vocabulario del tema": conceptos definidos, siglas y frases propias que se repiten.
 * Los conceptos definidos pesan más que una palabra que solo se repite mucho ("proyecto"). */
function terminosDelTema(oraciones, relaciones) {
  const terminos = new Map(); // clave sin tildes → { forma, puntos, sigla }
  const sumar = (forma, puntos, sigla = false) => {
    const clave = sigla ? forma : sinTildes(forma.toLowerCase());
    const actual = terminos.get(clave);
    terminos.set(clave, { forma: actual?.forma || forma, puntos: (actual?.puntos || 0) + puntos, sigla });
  };
  for (const r of relaciones) {
    if (r.relacion === 'incluye') continue;
    const sinArticulo = r.termino.replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, '').replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (sinArticulo.split(/\s+/).length <= 5 && !/^[a-záéíóúñ]+(ar|er|ir)\b/i.test(sinArticulo)) sumar(minusInicial(sinArticulo), 10);
  }
  const texto = oraciones.join(' ');
  // Siglas reales: en mayúsculas, sin tildes (VPN, TIR, WACC) y que no sean una palabra común.
  for (const m of texto.matchAll(/(\()?\b([A-ZÑ]{2,6})\b(\))?/g)) {
    const sigla = m[2];
    if (CONECTORES.has(sigla.toLowerCase())) continue;
    sumar(sigla, m[1] && m[3] ? 8 : 3, true);
  }
  // Frases de concepto que se repiten: "costo de capital", "flujos de caja", "tasa de descuento".
  const frases = new Map();
  for (const m of texto.toLowerCase().matchAll(/\b([a-záéíóúñ]{4,})\s+(de|del)\s+([a-záéíóúñ]{4,})\b/g)) {
    if (CONECTORES.has(m[1]) || CONECTORES.has(m[3]) || GENERICAS.has(sinTildes(m[1])) || GENERICAS.has(sinTildes(m[3]))) continue;
    frases.set(m[0], (frases.get(m[0]) || 0) + 1);
  }
  for (const [f, n] of frases) if (n >= 2) sumar(f, 4 + n);
  const frecuencia = new Map();
  for (const w of texto.toLowerCase().match(/[a-záéíóúñ]{6,}/g) || []) {
    if (CONECTORES.has(w) || GENERICAS.has(sinTildes(w))) continue;
    frecuencia.set(w, (frecuencia.get(w) || 0) + 1);
  }
  for (const [w, n] of frecuencia) if (n >= 2) sumar(w, Math.min(n, 4));
  return [...terminos.values()].sort((a, b) => b.puntos - a.puntos || b.forma.length - a.forma.length);
}

const escaparRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const reTermino = ({ forma, sigla }) => new RegExp(`(?<![\\wáéíóúñÁÉÍÓÚÑ])${escaparRegex(forma)}(?![\\wáéíóúñÁÉÍÓÚÑ])`, sigla ? 'g' : 'gi');

// Oraciones que solo se entienden con la anterior ("Este análisis…", "Es un criterio…"): sin
// ese contexto, ocultarles una palabra deja una pregunta que nadie podría responder.
const DEPENDE_DE_ANTERIOR = /^(este|esta|estos|estas|esto|ese|esa|esos|esas|eso|dicho|dicha|tal|tales|por eso|por ello|por lo tanto|por tanto|así|además|también|sin embargo|no obstante|es|son|fue|era|se trata|lo anterior|en este|en esta|de este|de esta|ello)\b/i;

/** Tarjeta de completar: se oculta el término clave más importante de la oración. */
function tarjetaCompletar(oracion, terminos, usos) {
  if (DEPENDE_DE_ANTERIOR.test(oracion)) return null;
  const presentes = terminos.filter((t) => reTermino(t).test(oracion));
  for (const termino of presentes) {
    const { forma } = termino;
    if ((usos.get(forma) || 0) >= 2) continue; // que no todas las tarjetas pregunten lo mismo
    // Si hay un término más largo que lo contiene ("costo de capital" ⊃ "capital"), se pregunta ese.
    if (presentes.some((o) => o !== termino && o.forma.length > forma.length && sinTildes(o.forma.toLowerCase()).includes(sinTildes(forma.toLowerCase())))) continue;
    const re = reTermino(termino);
    const coincidencias = [...oracion.matchAll(re)];
    const conHueco = oracion.replace(re, '_____');
    const restantes = conHueco.replace(/_____/g, '').split(/\s+/).filter((w) => /[a-záéíóúñ]/i.test(w));
    if (restantes.length < 5) continue; // sin suficiente contexto, la pregunta sería una adivinanza
    usos.set(forma, (usos.get(forma) || 0) + 1);
    return { pregunta: `Completa: "${conPunto(conHueco)}"`, respuesta: coincidencias[0][0] };
  }
  return null;
}

/**
 * Genera tarjetas pregunta/respuesta a partir de texto (apuntes, un PDF, una diapositiva…):
 *  - Definiciones reales: "¿Qué es…?", "¿En qué consiste…?", "¿Qué significa…?" según el verbo.
 *  - Para las demás oraciones con contenido: "Completa" ocultando un término clave del tema
 *    (respuesta corta y verificable, no media oración).
 * Nunca usa índices, encabezados, números de página ni títulos de sección.
 * `max` limita cuántas se devuelven (por defecto, todas las que valgan la pena).
 */
export function generarTarjetas(texto, max = Infinity) {
  const oraciones = dividirEnOraciones(texto);
  const relaciones = extraerRelaciones(oraciones);
  const terminos = terminosDelTema(oraciones, relaciones);
  const tarjetas = [];
  const vistos = new Set();
  const agregar = (pregunta, respuesta) => {
    const clave = sinTildes(pregunta.toLowerCase());
    if (!pregunta || !respuesta || vistos.has(clave) || tarjetas.length >= max) return;
    vistos.add(clave);
    tarjetas.push({ id: `t${tarjetas.length + 1}`, pregunta, respuesta });
  };

  for (const r of relaciones) agregar(r.pregunta(minusInicial(r.termino)), mayuscInicial(conPunto(r.definicion)));

  const usadas = new Set(relaciones.map((r) => r.oracion));
  const usos = new Map();
  for (const oracion of oraciones) {
    if (usadas.has(oracion)) continue;
    const t = tarjetaCompletar(oracion, terminos, usos);
    if (t) agregar(t.pregunta, t.respuesta);
  }
  return tarjetas;
}

/** ¿La tarjeta la armó el generador? (para poder regenerarlas sin tocar las escritas a mano). */
export function esTarjetaAutomatica(pregunta) {
  return /^(¿(Cuáles son|Qué es|Qué son|Cómo se define|A qué se refiere|En qué consiste|De qué se encarga|Qué significa|Qué representa|A qué corresponde)\s.+\?|Completa(?: la idea)?:\s)/.test(String(pregunta || '').trim());
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

// Para que las opciones del test sean creíbles, los distractores salen de tarjetas del MISMO tipo:
// un término se compara con otros términos (y una sigla con otras siglas); una definición, con
// otras definiciones. Mezclarlos delata la respuesta correcta sin necesidad de saber nada.
const tipoDeTarjeta = (t) => {
  if (/^¿Cuáles son/.test(t.pregunta)) return 'lista';
  if (/^Completa/.test(t.pregunta)) return /^[A-ZÁÉÍÓÚÑ]{2,6}$/.test(t.respuesta.trim()) ? 'sigla' : 'termino';
  return 'definicion';
};

/** Preguntas de opción múltiple a partir de las tarjetas (la correcta + 3 distractores). */
export function generarPreguntas(tarjetas, { cuantas = tarjetas.length, azar = Math.random } = {}) {
  if (tarjetas.length < 2) return [];
  return mezclar(tarjetas, azar).slice(0, cuantas).map((t) => {
    const tipo = tipoDeTarjeta(t);
    const usadas = new Set([t.respuesta.toLowerCase()]);
    const distractores = [];
    // Respaldo cuando no alcanza el mismo tipo: respuestas cortas con cortas, largas con largas.
    // Si ni así hay 3 creíbles, esa pregunta no se hace (mejor una menos que una regalada).
    const AFINES = { sigla: ['termino'], termino: ['sigla'], definicion: ['lista'], lista: ['definicion'] };
    const mismoTipo = tarjetas.filter((x) => x.id !== t.id && tipoDeTarjeta(x) === tipo);
    const afines = tarjetas.filter((x) => x.id !== t.id && AFINES[tipo].includes(tipoDeTarjeta(x)));
    for (const grupo of [mismoTipo, afines]) {
      for (const otra of mezclar(grupo, azar)) {
        if (distractores.length >= 3) break;
        if (usadas.has(otra.respuesta.toLowerCase())) continue;
        usadas.add(otra.respuesta.toLowerCase());
        distractores.push(otra.respuesta);
      }
    }
    if (distractores.length < 3) return null;
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
  const oraciones = dividirEnOraciones(texto);
  const relaciones = extraerRelaciones(oraciones).slice(0, max);
  if (relaciones.length >= 3) {
    return { centro: titulo, ramas: relaciones.map((r) => ({ palabra: mayuscInicial(r.termino), relacion: r.relacion, detalle: mayuscInicial(r.definicion) })) };
  }
  // Respaldo para texto sin definiciones claras (p. ej. una lista suelta de datos).
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

