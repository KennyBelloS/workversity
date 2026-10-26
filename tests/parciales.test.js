import { describe, it, expect } from 'vitest';
import { dividirEnOraciones, palabrasClave, generarTarjetas, combinarTarjetas, generarPreguntas, calificarTest, actualizarProgresoTarjeta, ordenarParaRepasar, dominioGeneral, consejosEstudio, generarMapaConceptual, generarDiagramaFlujo } from '../src/lib/parciales.js';

const APUNTES = `
La mitosis: proceso de división celular que produce dos células hijas idénticas.
La meiosis es el proceso de división que produce células con la mitad de los cromosomas.
- Cromosoma: estructura que contiene el ADN de la célula.
El ADN es la molécula que guarda la información genética.
La mitosis y la meiosis son procesos fundamentales de la reproducción celular.
`;

describe('preparación de parciales: extracción y tarjetas', () => {
  it('divide el texto en oraciones útiles', () => {
    const o = dividirEnOraciones(APUNTES);
    expect(o.length).toBeGreaterThanOrEqual(4);
    expect(o.every((x) => x.length > 8)).toBe(true);
  });
  it('encuentra palabras clave por frecuencia, sin conectores', () => {
    const p = palabrasClave(APUNTES);
    expect(p.map((x) => x.palabra)).toContain('mitosis');
    expect(p.map((x) => x.palabra)).not.toContain('la');
  });
  it('genera tarjetas a partir de definiciones (dos puntos, "es/son", guion)', () => {
    const t = generarTarjetas(APUNTES);
    expect(t.length).toBeGreaterThanOrEqual(3);
    expect(t.some((x) => /cromosoma/i.test(x.pregunta))).toBe(true);
    expect(t.some((x) => /mitosis/i.test(x.pregunta) && /división celular/i.test(x.respuesta))).toBe(true);
    t.forEach((x) => { expect(x.pregunta.length).toBeGreaterThan(3); expect(x.respuesta.length).toBeGreaterThan(1); });
  });
  it('en el mini test, ninguna pregunta muestra dos opciones con el mismo texto', () => {
    const textoConRepeticion = 'La célula es la unidad básica de la vida.\n' +
      'El núcleo controla la célula.\n' + 'La membrana protege la célula.\n' + 'El citoplasma llena la célula.';
    const t = generarTarjetas(textoConRepeticion, 10);
    const preguntas = generarPreguntas(t);
    for (const p of preguntas) expect(new Set(p.opciones.map((o) => o.toLowerCase())).size).toBe(p.opciones.length);
  });

  it('no repite la misma pregunta dos veces', () => {
    const t = generarTarjetas(APUNTES + APUNTES);
    const preguntas = t.map((x) => x.pregunta.toLowerCase());
    expect(new Set(preguntas).size).toBe(preguntas.length);
  });
  it('combina tarjetas de varias fuentes sin duplicar', () => {
    const a = [{ id: 't1', pregunta: '¿Qué es X?', respuesta: 'Y' }];
    const b = [{ id: 't1', pregunta: '¿Qué es X?', respuesta: 'Y' }, { id: 't2', pregunta: '¿Qué es Z?', respuesta: 'W' }];
    const c = combinarTarjetas([a, b]);
    expect(c).toHaveLength(2);
    expect(c[0].id).toBe('t1');
    expect(c[1].id).toBe('t2');
  });
});

describe('mini test y simulación de parcial', () => {
  const tarjetas = [
    { id: 't1', pregunta: '¿Qué es la mitosis?', respuesta: 'División celular' },
    { id: 't2', pregunta: '¿Qué es la meiosis?', respuesta: 'División con mitad de cromosomas' },
    { id: 't3', pregunta: '¿Qué es un cromosoma?', respuesta: 'Estructura con ADN' },
    { id: 't4', pregunta: '¿Qué es el ADN?', respuesta: 'Molécula con información genética' },
  ];
  it('genera preguntas de opción múltiple con 4 opciones y la correcta incluida', () => {
    const azar = (() => { let i = 0; const s = [0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6]; return () => s[i++ % s.length]; })();
    const preguntas = generarPreguntas(tarjetas, { azar });
    expect(preguntas).toHaveLength(4);
    preguntas.forEach((p) => { expect(p.opciones).toHaveLength(4); expect(p.opciones).toContain(p.correcta); expect(new Set(p.opciones).size).toBe(4); });
  });
  it('respeta cuántas preguntas se piden (simulación más larga)', () => {
    expect(generarPreguntas(tarjetas, { cuantas: 2 })).toHaveLength(2);
  });
  it('sin tarjetas suficientes no genera preguntas', () => {
    expect(generarPreguntas([tarjetas[0]])).toHaveLength(0);
  });
  it('califica el test correctamente', () => {
    const preguntas = [{ id: 't1', pregunta: 'p1', opciones: ['A', 'B'], correcta: 'A' }, { id: 't2', pregunta: 'p2', opciones: ['C', 'D'], correcta: 'D' }];
    const r = calificarTest(preguntas, { t1: 'A', t2: 'C' });
    expect([r.aciertos, r.total, r.porcentaje]).toEqual([1, 2, 50]);
    expect(r.detalle.find((d) => d.id === 't2').correcta).toBe(false);
  });
});

describe('repetición espaciada (tipo Leitner)', () => {
  it('sube el nivel al acertar y lo reinicia al fallar', () => {
    let p = actualizarProgresoTarjeta({}, 't1', true);
    p = actualizarProgresoTarjeta(p, 't1', true);
    expect(p.t1.nivel).toBe(2);
    p = actualizarProgresoTarjeta(p, 't1', false);
    expect(p.t1.nivel).toBe(0);
  });
  it('ordena para repasar: lo nunca visto y lo más fallado primero', () => {
    const tarjetas = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const progreso = { a: { nivel: 3 }, b: { nivel: 0 } };
    const orden = ordenarParaRepasar(tarjetas, progreso).map((t) => t.id);
    expect(orden[0]).toBe('c'); // nunca vista
    expect(orden[orden.length - 1]).toBe('a'); // la que mejor domina, al final
  });
  it('calcula el dominio general en 0-100', () => {
    const tarjetas = [{ id: 'a' }, { id: 'b' }];
    expect(dominioGeneral(tarjetas, {})).toBe(0);
    expect(dominioGeneral(tarjetas, { a: { nivel: 4 }, b: { nivel: 4 } })).toBe(100);
    expect(dominioGeneral(tarjetas, { a: { nivel: 2 } })).toBe(25);
  });
});

describe('consejos de estudio', () => {
  it('cambia según los días restantes', () => {
    expect(consejosEstudio({ diasRestantes: 0 }).find((c) => c.t === 'urgente').x).toMatch(/hoy/i);
    expect(consejosEstudio({ diasRestantes: 1 }).find((c) => c.t === 'urgente')).toBeTruthy();
    expect(consejosEstudio({ diasRestantes: 15 }).find((c) => c.t === 'plan').x).toMatch(/repetición espaciada/i);
    expect(consejosEstudio({ diasRestantes: null }).find((c) => c.t === 'plan').x).toMatch(/fecha/i);
  });
  it('agrega consejo sobre el dominio y las tarjetas difíciles', () => {
    const c = consejosEstudio({ diasRestantes: 5, dominio: 30, tarjetasDificiles: [{ pregunta: '¿Qué es X?' }] });
    expect(c.some((x) => x.t === 'dominio')).toBe(true);
    expect(c.some((x) => x.t === 'difíciles' && x.x.includes('¿Qué es X?'))).toBe(true);
  });
  it('avisa si el último test salió bajo', () => {
    expect(consejosEstudio({ diasRestantes: 5, ultimoPorcentaje: 40 }).some((c) => c.t === 'test')).toBe(true);
    expect(consejosEstudio({ diasRestantes: 5, ultimoPorcentaje: 90 }).some((c) => c.t === 'test')).toBe(false);
  });
});

describe('tarjetas de respaldo: "completa la idea" en vez de una pregunta rara', () => {
  const TEXTO_SIN_PATRONES = 'Durante la Revolución Francesa, muchas ideas de libertad e igualdad se difundieron por toda Europa y cambiaron el curso de la historia moderna. El rey Luis XVI fue guillotinado en enero de 1793 tras ser declarado culpable de traición a la nación.';
  it('la pregunta es el inicio real de la oración y la respuesta es el resto (nunca "¿qué dice el texto sobre...?")', () => {
    const t = generarTarjetas(TEXTO_SIN_PATRONES);
    expect(t).toHaveLength(2);
    t.forEach((x) => {
      expect(x.pregunta).toMatch(/^Completa la idea: ".+…"$/);
      expect(x.pregunta.toLowerCase()).not.toContain('qué dice el texto');
      expect(x.respuesta.length).toBeGreaterThan(5);
    });
    expect(t[0].pregunta).toContain('Durante la Revolución Francesa');
    expect(t[0].respuesta.toLowerCase()).toContain('difundieron');
  });
  it('oraciones muy cortas no se convierten en una tarjeta incoherente (se omiten)', () => {
    const t = generarTarjetas('Ok. Sí. Bien.');
    expect(t).toHaveLength(0);
  });
});

describe('el formato Markdown no se cuela en lo generado', () => {
  const CON_FORMATO = `## Célula
La **mitosis**: proceso de *división* celular que produce dos células hijas idénticas.
La \`meiosis\` es el proceso de división que produce células con la mitad de los cromosomas.
- Cromosoma: estructura que contiene el ADN de la célula.
1. El ADN es la molécula que guarda la información genética.`;
  it('sobrevive a asteriscos vacíos o sin pareja (** sueltos)', () => {
    const t = generarTarjetas('****La mitosis: proceso de división celular que produce dos células.');
    expect(JSON.stringify(t)).not.toMatch(/\*/);
    expect(t.some((x) => /mitosis/i.test(x.pregunta))).toBe(true);
  });

  it('las tarjetas no incluyen símbolos de Markdown', () => {
    const t = generarTarjetas(CON_FORMATO);
    const texto = JSON.stringify(t);
    expect(texto).not.toMatch(/\*\*|##|`/);
    expect(t.some((x) => /mitosis/i.test(x.pregunta))).toBe(true);
  });
  it('las palabras clave y el mapa conceptual tampoco', () => {
    expect(palabrasClave(CON_FORMATO).map((p) => p.palabra)).not.toContain('mitosis**');
    const m = generarMapaConceptual(CON_FORMATO, 'Célula');
    expect(JSON.stringify(m)).not.toMatch(/\*\*|##|`/);
  });
});

describe('mapa conceptual y diagrama de flujo', () => {
  const APUNTES2 = `
La fotosíntesis: proceso por el cual las plantas convierten luz en energía.
La clorofila es el pigmento que capta la luz solar.
El dióxido de carbono entra por los estomas de la hoja.
La glucosa es el resultado final del proceso de fotosíntesis.
`;
  it('genera un mapa conceptual con el tema en el centro y relaciones término→definición reales', () => {
    const m = generarMapaConceptual(APUNTES2, 'Fotosíntesis');
    expect(m.centro).toBe('Fotosíntesis');
    expect(m.ramas.length).toBeGreaterThan(2);
    expect(m.ramas.every((r) => r.palabra.length > 0 && r.detalle.length > 0)).toBe(true);
    const clorofila = m.ramas.find((r) => /clorofila/i.test(r.palabra));
    expect(clorofila).toBeTruthy();
    expect(clorofila.detalle.toLowerCase()).toContain('pigmento');
    expect(clorofila.relacion).toBe('es');
  });
  it('sin relaciones claras, usa las palabras más repetidas como respaldo', () => {
    const m = generarMapaConceptual('gato perro gato pájaro gato perro pez gato.', 'Animales');
    expect(m.ramas.some((r) => /gato/i.test(r.palabra))).toBe(true);
  });
  it('arma un diagrama de flujo a partir de pasos numerados', () => {
    const texto = '1. Reunir los materiales\n2. Mezclar los reactivos\n3. Calentar la mezcla\n4. Anotar los resultados';
    const d = generarDiagramaFlujo(texto);
    expect(d.map((p) => p.n)).toEqual([1, 2, 3, 4]);
    expect(d[1].texto).toMatch(/mezclar/i);
  });
  it('sin pistas de secuencia, no inventa un flujo falso (mejor avisar que forzar)', () => {
    // APUNTES2 son puras definiciones, no un proceso paso a paso: forzarlo en un diagrama
    // de flujo no ayudaría a "analizar" nada, así que debe devolver una lista vacía.
    const d = generarDiagramaFlujo(APUNTES2);
    expect(d).toEqual([]);
  });
  it('con palabras de secuencia ("primero", "luego", "finalmente") arma los pasos igual', () => {
    const texto = 'Primero se reúnen los reactivos en el laboratorio. Luego se calienta la mezcla a 80 grados. Finalmente se deja enfriar y se anota el resultado.';
    const d = generarDiagramaFlujo(texto);
    expect(d.map((p) => p.n)).toEqual([1, 2, 3]);
    expect(d[0].texto.toLowerCase()).not.toMatch(/^primero/);
    expect(d[1].texto.toLowerCase()).toContain('calienta');
  });
});

describe('cobertura completa: una tarjeta por cada idea del texto', () => {
  const APUNTES_LARGOS = `
La fotosíntesis es el proceso por el cual las plantas convierten luz en energía.
La clorofila permite captar la luz solar en las hojas.
El dióxido de carbono entra por los estomas de la hoja.
La glucosa es el resultado final del proceso de fotosíntesis.
El oxígeno se libera como producto secundario de la fotosíntesis.
Las raíces absorben el agua necesaria para la fotosíntesis.
El sol proporciona la energía que impulsa todo el proceso.
Sin luz suficiente, la planta reduce su producción de glucosa.
Las plantas acuáticas también realizan fotosíntesis bajo el agua.
`;
  it('genera al menos una tarjeta por cada oración con contenido (no solo por las palabras más repetidas)', () => {
    const oraciones = dividirEnOraciones(APUNTES_LARGOS);
    const t = generarTarjetas(APUNTES_LARGOS);
    expect(t.length).toBeGreaterThanOrEqual(oraciones.length - 1); // como mucho una se pierde por dedupe
    // cada respuesta debe verse reflejada en alguna oración original
    for (const tarjeta of t) expect(oraciones.some((o) => o.toLowerCase().includes(tarjeta.respuesta.toLowerCase().slice(0, 15)))).toBe(true);
  });
  it('sin límite (max) por defecto: no se queda corto con textos largos', () => {
    const textoMuyLargo = Array.from({ length: 30 }, (_, i) => `El concepto número ${i} se define como una idea distinta número ${i} del tema.`).join('\n');
    expect(generarTarjetas(textoMuyLargo).length).toBeGreaterThan(20);
  });
  it('el parámetro max sigue funcionando cuando se necesita limitar', () => {
    expect(generarTarjetas(APUNTES_LARGOS, 3).length).toBeLessThanOrEqual(3);
  });
});

describe('generarTarjetas no convierte en "tarjeta" cualquier oración con dos puntos o un verbo suelto', () => {
  it('ignora anotaciones del tipo "Nota:", "Ejemplo:", "Ver página X:" como si fueran una definición', () => {
    const texto = 'Nota: revisar la página 5 para más detalles. Ejemplo: el caso visto en clase la semana pasada. La mitosis: proceso de división celular que produce dos células hijas idénticas.';
    const t = generarTarjetas(texto);
    const preguntas = t.map((x) => x.pregunta.toLowerCase());
    expect(preguntas.some((p) => p.includes('¿qué es nota?'))).toBe(false);
    expect(preguntas.some((p) => p.includes('¿qué es ejemplo?'))).toBe(false);
    expect(preguntas.some((p) => p.includes('mitosis'))).toBe(true); // la definición real sí se conserva
  });

  it('no convierte una oración narrativa con un verbo débil ("entra por", "tiene") en una pregunta de "¿Qué es...?"', () => {
    const texto = 'El profesor entra por la puerta principal todos los días antes de las siete. El estudiante tiene que entregar el trabajo antes del viernes para que cuente en la nota final.';
    const t = generarTarjetas(texto);
    const preguntas = t.map((x) => x.pregunta.toLowerCase());
    expect(preguntas.some((p) => p.startsWith('¿qué es el profesor'))).toBe(false);
    expect(preguntas.some((p) => p.startsWith('¿qué es el estudiante'))).toBe(false);
  });

  it('sigue reconociendo definiciones reales con los verbos fuertes que sí se mantienen', () => {
    const texto = 'La fotosíntesis es el proceso mediante el cual las plantas producen su alimento. El ADN se define como la molécula que guarda la información genética.';
    const t = generarTarjetas(texto);
    const preguntas = t.map((x) => x.pregunta.toLowerCase());
    expect(preguntas.some((p) => p.includes('fotosíntesis'))).toBe(true);
    expect(preguntas.some((p) => p.includes('adn'))).toBe(true);
  });

  it('un término demasiado largo (una frase, no un concepto) no se vuelve pregunta de "¿Qué es...?"', () => {
    const texto = 'Cuando el estudiante termina de revisar todos los apuntes de la clase anterior: puede continuar con el siguiente tema del curso.';
    const t = generarTarjetas(texto);
    const preguntas = t.map((x) => x.pregunta.toLowerCase());
    expect(preguntas.some((p) => p.startsWith('¿qué es cuando el estudiante'))).toBe(false);
  });
});
