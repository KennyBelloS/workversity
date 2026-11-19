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
  it('un encabezado de esquema numerado ("6.3.4 Definir alcance:") no se convierte en un término absurdo', () => {
    const t = generarTarjetas('6.3.4 Definir alcance: Qué entra y qué no entra en el proyecto.');
    expect(t.some((x) => /qué es 6/i.test(x.pregunta))).toBe(false);
  });
  it('una nota al margen ("Nota: revisar la página 5") no genera "¿Qué es Nota?"', () => {
    const t = generarTarjetas('Nota: revisar la página 5 para más detalles del tema.');
    expect(t.some((x) => /qué es nota/i.test(x.pregunta))).toBe(false);
  });
  it('una oración narrativa con verbo débil ("entra por la puerta") no se toma como definición', () => {
    const t = generarTarjetas('El profesor entra por la puerta todos los días a las 8 am en punto.');
    expect(t.some((x) => /qué es el profesor/i.test(x.pregunta))).toBe(false);
  });
  it('una definición real con verbo fuerte ("se define como") sigue funcionando', () => {
    const t = generarTarjetas('La fotosíntesis se define como el proceso que convierte luz en energía química.');
    expect(t.some((x) => x.pregunta === '¿Cómo se define la fotosíntesis?' && /convierte luz/.test(x.respuesta))).toBe(true);
  });
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

describe('tarjetas de completar: se oculta un término clave, nunca media oración', () => {
  const TEXTO = 'La Revolución Francesa difundió por Europa las ideas de libertad e igualdad entre los ciudadanos. ' +
    'Durante la Revolución Francesa el rey Luis XVI fue guillotinado en enero de 1793 tras ser declarado culpable de traición.';
  it('la respuesta es un término corto que está en la oración, y la pregunta es la oración completa con el hueco', () => {
    const t = generarTarjetas(TEXTO);
    expect(t.length).toBeGreaterThanOrEqual(1);
    t.forEach((x) => {
      expect(x.pregunta).toMatch(/^Completa: ".*_____.*"$/);
      expect(x.respuesta.split(/\s+/).length).toBeLessThanOrEqual(5);
      expect(TEXTO.toLowerCase()).toContain(x.respuesta.toLowerCase());
      expect(x.pregunta).not.toMatch(/Completa la idea/);
    });
  });
  it('oraciones muy cortas no se convierten en una tarjeta incoherente (se omiten)', () => {
    expect(generarTarjetas('Ok. Sí. Bien.')).toHaveLength(0);
  });
  it('no oculta palabras vacías ni generales ("de", "manera", "parte")', () => {
    const t = generarTarjetas('La fotosíntesis es el proceso de las plantas para producir glucosa con luz. La fotosíntesis ocurre de manera continua en la parte verde de la hoja.');
    t.filter((x) => x.pregunta.startsWith('Completa')).forEach((x) => expect(['de', 'manera', 'parte', 'la']).not.toContain(x.respuesta.toLowerCase()));
  });
  it('no arma huecos con oraciones que dependen de la anterior ("Este análisis…", "Es un criterio…")', () => {
    const t = generarTarjetas('El análisis financiero estudia la rentabilidad de la empresa. Este análisis compara los beneficios esperados con los costos del proyecto. Es un criterio sencillo pero ignora los flujos posteriores del proyecto.');
    expect(t.some((x) => /Este _____|^Completa: "Es un/.test(x.pregunta))).toBe(false);
  });
});

describe('PDF real de un curso: índice, encabezados y títulos no se cuelan', () => {
  // Así quedaba una página de PDF en las fuentes viejas: todo en un solo renglón.
  const PAGINAS = [
    'GUÍA DE ESTUDIO — Unidad 3 Página 1 Facultad de Economía CONTENIDO 1 Introducción ............ 3 2.1 Interés simple y compuesto ............ 4 6.3.4 Definir alcance ............ 6 BE ............ 7',
    'GUÍA DE ESTUDIO — Unidad 3 Página 2 Facultad de Economía 3.1 Valor presente neto El valor presente neto (VPN) es la diferencia entre el valor presente de los flujos de caja y la inversión inicial. Un proyecto se acepta cuando la TIR supera el costo de capital.',
    'GUÍA DE ESTUDIO — Unidad 3 Página 3 Facultad de Economía 6.3.4 Definir alcance Definir el alcance consiste en establecer qué entra y qué no entra en el proyecto. Nota: revisar el ejercicio 4 del libro guía.',
    'GUÍA DE ESTUDIO — Unidad 3 Página 4 Facultad de Economía Ventajas del período de recuperación: • Es fácil de calcular y de explicar. • Da una idea de la liquidez del proyecto. La tasa interna de retorno (TIR) es la tasa de descuento que hace que el VPN sea igual a cero.',
  ].join('\n');
  const t = generarTarjetas(PAGINAS);
  const todo = JSON.stringify(t);
  it('ninguna tarjeta trae puntos guía de índice, números de página ni el encabezado repetido', () => {
    expect(todo).not.toMatch(/\.{4,}/);
    expect(todo).not.toMatch(/Página \d/);
    expect(todo).not.toMatch(/GUÍA DE ESTUDIO/);
    expect(todo).not.toMatch(/"BE/);
  });
  it('ninguna pregunta arranca con un número de sección ni con una nota al margen', () => {
    t.forEach((x) => { expect(x.pregunta).not.toMatch(/(^|[¿"])\d/); expect(x.pregunta).not.toMatch(/nota/i); });
  });
  it('arma las definiciones reales, con el verbo correcto en la pregunta', () => {
    expect(t.find((x) => x.pregunta === '¿Qué es el valor presente neto (VPN)?')?.respuesta).toMatch(/^La diferencia entre/);
    expect(t.find((x) => x.pregunta === '¿En qué consiste definir el alcance?')?.respuesta).toMatch(/qué entra y qué no entra/);
    expect(t.find((x) => x.pregunta === '¿Cuáles son las ventajas del período de recuperación?')?.respuesta).toMatch(/fácil de calcular.*liquidez/);
  });
  it('los huecos ocultan conceptos del tema (siglas o frases como "costo de capital")', () => {
    const huecos = t.filter((x) => x.pregunta.startsWith('Completa')).map((x) => x.respuesta);
    expect(huecos.length).toBeGreaterThan(0);
    huecos.forEach((r) => expect(['TIR', 'VPN', 'costo de capital', 'flujos de caja', 'tasa de descuento', 'proyecto', 'inversión inicial']).toContain(r));
  });
  it('en el mini test, una sigla compite con otras siglas (no con frases largas que delatan la respuesta)', () => {
    const preguntas = generarPreguntas(t);
    for (const p of preguntas.filter((q) => /^[A-Z]{2,6}$/.test(q.correcta))) {
      expect(p.opciones.every((o) => o.split(/\s+/).length <= 5)).toBe(true);
    }
    for (const p of preguntas.filter((q) => q.pregunta.startsWith('¿Qué es'))) {
      expect(p.opciones.every((o) => o.split(/\s+/).length >= 4)).toBe(true);
    }
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

describe('calidad antes que cantidad', () => {
  const APUNTES_LARGOS = `
La fotosíntesis es el proceso por el cual las plantas convierten luz en energía.
La clorofila es el pigmento que permite captar la luz solar en las hojas.
El dióxido de carbono entra por los estomas de la hoja durante la fotosíntesis.
La glucosa es el resultado final del proceso de fotosíntesis.
El oxígeno se libera como producto secundario de la fotosíntesis.
Las raíces absorben el agua necesaria para la fotosíntesis.
`;
  it('cada respuesta sale del texto original (nada inventado)', () => {
    const t = generarTarjetas(APUNTES_LARGOS);
    expect(t.length).toBeGreaterThanOrEqual(4);
    const fuente = APUNTES_LARGOS.toLowerCase();
    for (const tarjeta of t) expect(fuente).toContain(tarjeta.respuesta.toLowerCase().replace(/\.$/, '').slice(0, 20));
  });
  it('un texto largo de definiciones produce una tarjeta por definición', () => {
    const textoMuyLargo = Array.from({ length: 30 }, (_, i) => `El concepto número ${i} se define como una idea distinta número ${i} del tema.`).join('\n');
    expect(generarTarjetas(textoMuyLargo).length).toBeGreaterThan(20);
  });
  it('el parámetro max sigue funcionando cuando se necesita limitar', () => {
    expect(generarTarjetas(APUNTES_LARGOS, 3).length).toBeLessThanOrEqual(3);
  });
});
