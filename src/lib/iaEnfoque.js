// Ayuda de IA (ChatGPT, Claude, Gemini…): arma el mensaje con el contexto de la tarea y convierte la respuesta en pasos.
// Estos servicios NO permiten mostrarse dentro de otra página, así que se abren en una ventana al lado.

export const PROVEEDORES = [
  { id: 'chatgpt', nombre: 'ChatGPT', emoji: '💬', color: '#10A37F', url: (p) => `https://chatgpt.com/?q=${encodeURIComponent(p)}`, conPrompt: true },
  { id: 'claude', nombre: 'Claude', emoji: '🧡', color: '#D97757', url: (p) => `https://claude.ai/new?q=${encodeURIComponent(p)}`, conPrompt: true },
  { id: 'gemini', nombre: 'Gemini', emoji: '✨', color: '#4285F4', url: () => 'https://gemini.google.com/app', conPrompt: false },
  { id: 'perplexity', nombre: 'Perplexity', emoji: '🔎', color: '#20808D', url: (p) => `https://www.perplexity.ai/search?q=${encodeURIComponent(p)}`, conPrompt: true },
  { id: 'copilot', nombre: 'Copilot', emoji: '🪁', color: '#7A5AF8', url: () => 'https://copilot.microsoft.com/', conPrompt: false },
];

export const PLANTILLAS_PROMPT = [
  { id: 'explicar', titulo: '🧠 Explícame el tema', cuerpo: 'Explícame este tema de forma clara y con ejemplos sencillos, como si fuera la primera vez que lo veo. Termina con 3 ideas clave.' },
  { id: 'esquema', titulo: '🗂️ Hazme un esquema', cuerpo: 'Hazme un esquema con la estructura ideal para este trabajo (apartados y una línea sobre qué va en cada uno).' },
  { id: 'plan', titulo: '✅ Plan paso a paso', cuerpo: 'Divide esta tarea en pasos concretos y ordenados, con el tiempo aproximado de cada uno. Responde como lista numerada.' },
  { id: 'revisar', titulo: '📝 Revisa y mejora mi texto', cuerpo: 'Revisa mi texto: ortografía, claridad y coherencia. Dime qué mejorar y ofréceme una versión corregida.' },
  { id: 'practica', titulo: '🎯 Preguntas de práctica', cuerpo: 'Hazme 8 preguntas de práctica (de fáciles a difíciles) sobre este tema y dame las respuestas al final.' },
  { id: 'resumir', titulo: '📄 Resume esto', cuerpo: 'Resume el siguiente contenido en 5 puntos, señalando lo más importante para estudiar.' },
  { id: 'presentacion', titulo: '📊 Ideas para la presentación', cuerpo: 'Propón una presentación de 8 diapositivas: título y 3 viñetas por diapositiva.' },
  { id: 'ideas', titulo: '💡 Lluvia de ideas', cuerpo: 'Dame 10 ideas originales y viables para abordar esta tarea.' },
];

export const DIFICULTAD_TEXTO = { facil: 'fácil', media: 'de dificultad media', dificil: 'difícil' };

/** Mensaje completo, con el contexto de la tarea. */
export function armarPrompt(plantillaId, ctx = {}) {
  const p = PLANTILLAS_PROMPT.find((x) => x.id === plantillaId) || PLANTILLAS_PROMPT[0];
  const partes = [`Estoy trabajando en esta tarea: «${ctx.titulo || 'sin título'}».`];
  if (ctx.materia) partes.push(`Materia: ${ctx.materia}.`);
  if (ctx.descripcion) partes.push(`Detalles: ${ctx.descripcion}`);
  if (ctx.dificultad) partes.push(`La considero ${DIFICULTAD_TEXTO[ctx.dificultad] || ctx.dificultad}.`);
  if (ctx.entrega) partes.push(`Fecha de entrega: ${ctx.entrega}.`);
  partes.push('', p.cuerpo);
  if (ctx.documento && ctx.documento.trim()) partes.push('', '--- Mi texto / notas ---', ctx.documento.trim().slice(0, 3000));
  partes.push('', 'Responde en español.');
  return partes.join('\n');
}

/** Para las páginas que reciben el mensaje en el enlace: se recorta para no pasarse del límite. */
export const recortarParaUrl = (prompt, max = 1500) => (prompt.length <= max ? prompt : `${prompt.slice(0, max - 40).trimEnd()}\n[…texto recortado: pega el resto]`);

/** Convierte una respuesta (viñetas, numeración, títulos markdown) en una lista de líneas limpias. */
export function lineasDeRespuesta(texto, max = 30) {
  return String(texto || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•·]+|\d+[.)]|#{1,6})\s*/, '').replace(/\*\*|__|`/g, '').trim())
    .filter((l) => l.length > 2)
    .slice(0, max);
}
