// Ayudas para trabajos universitarios: plan de entrega por etapas, estructuras, referencias APA y contador de texto.

export const TIPOS_TRABAJO = {
  ensayo: {
    label: 'Ensayo', emoji: '✍️',
    etapas: [
      { nombre: 'Investigar y reunir fuentes', fraccion: 0.2, peso: 25 },
      { nombre: 'Esquema y tesis', fraccion: 0.35, peso: 10 },
      { nombre: 'Primer borrador', fraccion: 0.65, peso: 35 },
      { nombre: 'Revisar, citar y corregir', fraccion: 0.85, peso: 20 },
      { nombre: 'Lectura final y entrega', fraccion: 0.95, peso: 10 },
    ],
    estructura: ['Título', 'Introducción: contexto, pregunta y tesis', 'Argumento 1 (idea + evidencia + análisis)', 'Argumento 2', 'Contraargumento y respuesta', 'Conclusión: retoma la tesis y cierra', 'Referencias (APA 7)'],
    checklist: ['La tesis se entiende en una frase', 'Cada párrafo tiene una sola idea', 'Todas las citas tienen su referencia', 'Ortografía y puntuación revisadas', 'Cumple extensión y formato pedidos'],
  },
  informe: {
    label: 'Informe / trabajo escrito', emoji: '📄',
    etapas: [
      { nombre: 'Entender el enunciado y la rúbrica', fraccion: 0.1, peso: 5 },
      { nombre: 'Recolectar información / datos', fraccion: 0.3, peso: 25 },
      { nombre: 'Redactar el cuerpo', fraccion: 0.6, peso: 40 },
      { nombre: 'Tablas, gráficos, conclusiones', fraccion: 0.8, peso: 15 },
      { nombre: 'Revisión, portada y entrega', fraccion: 0.95, peso: 15 },
    ],
    estructura: ['Portada (título, autores, materia, fecha)', 'Resumen', 'Introducción y objetivos', 'Marco teórico', 'Metodología', 'Resultados y análisis', 'Conclusiones', 'Referencias', 'Anexos'],
    checklist: ['Sigue la rúbrica punto por punto', 'Figuras y tablas numeradas y citadas en el texto', 'Portada y numeración de páginas', 'Referencias en APA 7', 'Se guarda en el formato pedido (PDF/Word)'],
  },
  presentacion: {
    label: 'Presentación / exposición', emoji: '🎤',
    etapas: [
      { nombre: 'Definir mensaje y tiempo disponible', fraccion: 0.15, peso: 10 },
      { nombre: 'Armar las diapositivas', fraccion: 0.5, peso: 40 },
      { nombre: 'Preparar guion y ejemplos', fraccion: 0.7, peso: 20 },
      { nombre: 'Ensayar en voz alta', fraccion: 0.88, peso: 25 },
      { nombre: 'Prueba técnica y entrega', fraccion: 0.96, peso: 5 },
    ],
    estructura: ['Portada', 'Agenda / objetivo', 'Problema o contexto', 'Desarrollo (1 idea por diapositiva)', 'Datos o ejemplos clave', 'Conclusión', 'Preguntas', 'Referencias'],
    checklist: ['Máximo ~1 minuto por diapositiva', 'Poco texto, más imágenes/datos', 'Ensayado con cronómetro', 'Archivo abierto y probado en otro equipo', 'Plan B si falla el internet'],
  },
  proyecto: {
    label: 'Proyecto de programación', emoji: '💻',
    etapas: [
      { nombre: 'Análisis de requisitos', fraccion: 0.12, peso: 10 },
      { nombre: 'Diseño (diagramas / modelo de datos)', fraccion: 0.3, peso: 15 },
      { nombre: 'Implementar funciones principales', fraccion: 0.6, peso: 40 },
      { nombre: 'Pruebas y corrección de errores', fraccion: 0.82, peso: 20 },
      { nombre: 'Documentación y entrega', fraccion: 0.95, peso: 15 },
    ],
    estructura: ['README (qué hace y cómo se ejecuta)', 'Requisitos y decisiones de diseño', 'Estructura de carpetas', 'Casos de prueba', 'Manual de uso / capturas', 'Repositorio limpio (sin claves)'],
    checklist: ['Corre desde cero en otro equipo', 'Commits claros', 'Sin contraseñas ni .env en el repositorio', 'Casos de prueba principales pasan', 'Documentación mínima escrita'],
  },
  examen: {
    label: 'Estudio para examen', emoji: '🧠',
    etapas: [
      { nombre: 'Reunir temario, apuntes y guías', fraccion: 0.1, peso: 10 },
      { nombre: 'Primera pasada: entender cada tema', fraccion: 0.4, peso: 35 },
      { nombre: 'Resumen / fichas y ejercicios', fraccion: 0.65, peso: 30 },
      { nombre: 'Simulacro con tiempo real', fraccion: 0.85, peso: 20 },
      { nombre: 'Repaso ligero y descanso', fraccion: 0.95, peso: 5 },
    ],
    estructura: ['Lista de temas y su peso en la nota', 'Fórmulas / conceptos clave', 'Errores frecuentes', 'Ejercicios resueltos', 'Preguntas que podría hacer el profesor'],
    checklist: ['Temas difíciles estudiados primero', 'Al menos un simulacro con cronómetro', 'Sueño suficiente la noche anterior', 'Materiales y calculadora listos'],
  },
  taller: {
    label: 'Taller / guía de ejercicios', emoji: '📝',
    etapas: [
      { nombre: 'Leer todo y separar por dificultad', fraccion: 0.15, peso: 10 },
      { nombre: 'Resolver lo fácil', fraccion: 0.45, peso: 35 },
      { nombre: 'Resolver lo difícil', fraccion: 0.75, peso: 40 },
      { nombre: 'Revisar y pasar en limpio', fraccion: 0.95, peso: 15 },
    ],
    estructura: ['Enunciado de cada punto', 'Procedimiento paso a paso', 'Resultado destacado', 'Dudas para preguntar al profesor'],
    checklist: ['Todos los puntos respondidos', 'Procedimientos visibles, no solo resultados', 'Unidades y resultados revisados', 'Nombre y materia en la hoja'],
  },
};

const redondear5 = (n) => Math.max(5, Math.round(n / 5) * 5);

/** Reparte las etapas entre ahora y la fecha de entrega. Nunca deja una etapa después de la entrega. */
export function planificarEntrega({ tipo, ahora = new Date(), vence, minutosTotales = 240 }) {
  const plantilla = TIPOS_TRABAJO[tipo];
  const ventana = new Date(vence) - ahora;
  if (!plantilla || ventana <= 0) return [];
  const ajustar = ventana >= 12 * 3600000; // con poco tiempo no se "acomoda" el horario
  let anterior = ahora.getTime();
  return plantilla.etapas.map((e, i) => {
    let t = new Date(ahora.getTime() + ventana * e.fraccion);
    if (ajustar) {
      if (t.getHours() < 8) t.setHours(8, 0, 0, 0);
      else if (t.getHours() >= 22) t.setHours(21, 0, 0, 0);
      else t.setMinutes(0, 0, 0);
    }
    if (t.getTime() <= anterior) t = new Date(anterior + 30 * 60000);
    if (t.getTime() >= new Date(vence).getTime()) t = new Date(new Date(vence).getTime() - (plantilla.etapas.length - i) * 5 * 60000);
    anterior = t.getTime();
    return { nombre: e.nombre, due: t, minutos: redondear5((minutosTotales * e.peso) / 100) };
  });
}

// ---------------- Referencias APA 7 ----------------
const iniciales = (nombres) =>
  nombres.trim().split(/\s+/).filter(Boolean).map((p) => p.split('-').map((x) => `${x.charAt(0).toUpperCase()}.`).join('-')).join(' ');

export function formatearAutores(texto = '') {
  const lista = texto.split(/;|\n/).map((a) => a.trim()).filter(Boolean).map((a) => {
    if (!a.includes(',')) return a; // organización o nombre ya formateado
    const [apellido, nombres] = a.split(/,(.+)/);
    return `${apellido.trim()}, ${iniciales(nombres || '')}`.replace(/,\s*$/, '');
  });
  if (lista.length === 0) return '';
  if (lista.length === 1) return lista[0];
  if (lista.length === 2) return `${lista[0]} & ${lista[1]}`;
  return `${lista.slice(0, -1).join(', ')}, & ${lista[lista.length - 1]}`;
}

const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** @returns {{texto:string, html:string}} */
export function referenciaAPA(tipo, c) {
  const aut = formatearAutores(c.autores);
  const autPunto = aut && !aut.endsWith('.') ? `${aut}.` : aut;
  const anio = c.anio?.trim() || 's. f.';
  const fecha = c.fecha?.trim() ? `${anio}, ${c.fecha.trim()}` : anio;
  const doi = c.doi?.trim() ? (c.doi.trim().startsWith('http') ? c.doi.trim() : `https://doi.org/${c.doi.trim()}`) : c.url?.trim() || '';
  const partes = []; // [texto, cursiva?]
  const p = (t, i = false) => t && partes.push([t, i]);

  if (tipo === 'libro') {
    if (aut) { p(`${autPunto} (${anio}). `); p(c.titulo, true); } else { p(c.titulo, true); p(`. (${anio}).`); }
    if (c.edicion?.trim()) p(` (${c.edicion.trim()} ed.)`);
    p('.'); if (c.editorial?.trim()) p(` ${c.editorial.trim()}.`);
    if (doi) p(` ${doi}`);
  } else if (tipo === 'articulo') {
    p(aut ? `${autPunto} (${anio}). ${c.titulo}. ` : `${c.titulo}. (${anio}). `);
    p(`${c.revista || ''}${c.volumen ? `, ${c.volumen}` : ''}`, true);
    if (c.numero?.trim()) p(`(${c.numero.trim()})`);
    if (c.paginas?.trim()) p(`, ${c.paginas.trim()}`);
    p('.'); if (doi) p(` ${doi}`);
  } else {
    if (aut) { p(`${autPunto} (${fecha}). `); p(c.titulo, true); } else { p(c.titulo, true); p(`. (${fecha}).`); }
    p('.'); if (c.sitio?.trim()) p(` ${c.sitio.trim()}.`);
    if (doi) p(` ${doi}`);
  }
  const texto = partes.map(([t]) => t).join('').replace(/\.\./g, '.').replace(/\.\s*\.$/, '.');
  const html = partes.map(([t, i]) => (i ? `<i>${escHtml(t)}</i>` : escHtml(t))).join('').replace(/\.\./g, '.');
  return { texto, html };
}

// ---------------- Estadísticas de texto ----------------
export function estadisticasTexto(texto) {
  const limpio = texto.trim();
  const palabras = limpio ? limpio.split(/\s+/).length : 0;
  return {
    palabras,
    caracteres: texto.length,
    sinEspacios: texto.replace(/\s/g, '').length,
    oraciones: limpio ? (limpio.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []).length : 0,
    lecturaMin: Math.max(palabras ? 1 : 0, Math.round(palabras / 200)),
    exposicionMin: Math.max(palabras ? 1 : 0, Math.round(palabras / 130)),
  };
}
