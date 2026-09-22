// Cálculo de notas por cortes (escala 0–5).
// Cada materia tiene 3 cortes con un peso sobre la nota final (por defecto 35 / 35 / 30).
// Dentro de cada corte, las actividades valen un % del corte (deben sumar 100%).

export const PESOS_POR_DEFECTO = [35, 35, 30];
export const NOTA_MAX = 5;
export const APRUEBA = 3.0; // desde 3.0 se aprueba; por debajo (de 2.9 hacia atrás) se pierde
const EPS = 0.0001;

/**
 * Lee una nota escrita por la persona. Escala 0.0–5.0.
 * Acepta "3.5", "3,5", "4" y también décimas de dos cifras: "35" → 3.5, "00" → 0, "50" → 5.0.
 * @returns {{vacio?:true, valor?:number, error?:string}}
 */
export function parsearNota(texto) {
  const t = String(texto ?? '').trim().replace(',', '.');
  if (t === '') return { vacio: true };
  if (/^\d{2}$/.test(t)) {
    const n = Number(t) / 10;
    return n <= NOTA_MAX ? { valor: n } : { error: 'La nota va de 0.0 a 5.0 (por ejemplo 3.5 o 35)' };
  }
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > NOTA_MAX) return { error: 'La nota va de 0.0 a 5.0 (por ejemplo 3.5 o 35)' };
  return { valor: n };
}

/**
 * Una actividad puede desglosarse en partes iguales (p. ej. "Talleres": Taller 1, Taller 2…).
 * Para calcular, cada parte cuenta como una actividad más pequeña.
 */
export function expandirActividades(evals) {
  return evals.flatMap((e) => {
    const items = Array.isArray(e.items) ? e.items : [];
    if (items.length === 0) return [{ corte: e.corte, porcentaje: Number(e.porcentaje), nota: e.nota == null ? null : Number(e.nota) }];
    const parte = Number(e.porcentaje) / items.length;
    return items.map((it) => ({ corte: e.corte, porcentaje: parte, nota: it.nota == null ? null : Number(it.nota) }));
  });
}

/** Resumen de una actividad desglosada: cuántas partes hay, cuántas ya tienen nota y su promedio. */
export function resumenItems(e) {
  const items = Array.isArray(e.items) ? e.items : [];
  const con = items.filter((i) => i.nota != null);
  return { total: items.length, calificados: con.length, media: con.length ? con.reduce((s, i) => s + Number(i.nota), 0) / con.length : null };
}

/** "Talleres" → "Taller", "Quices" → "Quice" (para nombrar las partes) */
export function nombreParte(nombre) {
  const n = String(nombre || '').trim();
  if (!n) return 'Parte';
  return n.replace(/(es|s)$/i, (m) => (/^es$/i.test(m) && /[^aeiou]es$/i.test(n) && !/[cz]es$/i.test(n) ? '' : /^es$/i.test(m) ? 'e' : '')) || n;
}
const suma = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

/** actividades: [{ porcentaje, nota|null }] de UN corte */
export function calcularCorte(actividades) {
  const conNota = actividades.filter((a) => a.nota != null);
  const pctTotal = suma(actividades, (a) => Number(a.porcentaje));
  const pctEvaluado = suma(conNota, (a) => Number(a.porcentaje));
  const acumulado = suma(conNota, (a) => (Number(a.nota) * Number(a.porcentaje)) / 100); // puntos del corte (0–5) ya ganados
  const faltante = Math.max(0, 100 - pctEvaluado); // incluye lo aún no definido
  return {
    pctTotal, pctEvaluado, faltante, acumulado,
    promedio: pctEvaluado > 0 ? acumulado / (pctEvaluado / 100) : null, // promedio de lo ya calificado
    sinDefinir: Math.max(0, 100 - pctTotal), excede: pctTotal > 100 + EPS,
    completo: faltante <= EPS,
    // promedio que necesitas en lo que falta DEL CORTE para que el corte llegue a 3.0
    necesariaAprobar: faltante > EPS ? (APRUEBA - acumulado) / (faltante / 100) : null,
    // ¿voy ganando o perdiendo este corte?
    estado:
      pctEvaluado <= EPS ? 'sin-datos'
      : faltante <= EPS ? (acumulado >= APRUEBA - EPS ? 'ganado' : 'perdido')
      : acumulado / (pctEvaluado / 100) >= APRUEBA - EPS ? 'ganando' : 'perdiendo',
  };
}

/**
 * @param {{evals: {corte:number, porcentaje:number, nota:number|null}[], pesos?: number[], meta?: number}} o
 */
export function calcularMateria({ evals, pesos = PESOS_POR_DEFECTO, meta = 3 }) {
  const actividades = expandirActividades(evals);
  const cortes = [1, 2, 3].map((n) => {
    const c = calcularCorte(actividades.filter((e) => Number(e.corte) === n));
    const peso = Number(pesos[n - 1]);
    return {
      n, peso, ...c,
      aporte: (c.acumulado * peso) / 100, // puntos que este corte ya suma a la nota final
      pendienteFinal: (peso / 100) * (c.faltante / 100), // fracción de la nota final que aún se puede ganar aquí
      // promedio que necesitas en lo que falta DEL CORTE para que el corte llegue a la meta
      necesariaEnCorte: c.faltante > 0 ? (meta - c.acumulado) / (c.faltante / 100) : null,
    };
  });

  const acumulado = suma(cortes, (c) => c.aporte);
  const pendiente = suma(cortes, (c) => c.pendienteFinal);
  const evaluado = 1 - pendiente;
  const pesosSuman = suma(cortes, (c) => c.peso);
  const hayDatos = evals.length > 0;
  const necesaria = pendiente > EPS ? (meta - acumulado) / pendiente : null; // para tu meta personal
  const necesariaAprobar = pendiente > EPS ? (APRUEBA - acumulado) / pendiente : null; // para no perder (3.0)
  const promedioActual = evaluado > EPS ? acumulado / evaluado : null;
  const proyectada = promedioActual != null ? acumulado + pendiente * promedioActual : null;

  // El estado siempre se mide contra 3.0 (aprobar). La meta personal es aparte.
  let estado;
  if (!hayDatos) estado = 'sin-datos';
  else if (pendiente <= EPS) estado = acumulado >= APRUEBA - EPS ? 'aprobada' : 'reprobada';
  else if (necesariaAprobar <= 0) estado = 'asegurada';
  else if (necesariaAprobar > NOTA_MAX + EPS) estado = 'imposible';
  else if (necesariaAprobar > 4.2) estado = 'riesgo';
  else estado = 'ok';
  const ritmo = promedioActual == null ? null : promedioActual >= APRUEBA - EPS ? 'ganando' : 'perdiendo';

  return {
    cortes, acumulado, pendiente, evaluado, necesaria, necesariaAprobar, promedioActual, proyectada, estado, ritmo, hayDatos,
    final: pendiente <= EPS && hayDatos ? acumulado : null,
    pesosSuman, pesosValidos: Math.abs(pesosSuman - 100) < EPS,
  };
}

/** ¿Qué definitiva tendría si en todo lo que falta saco `nota`? */
export const simular = (m, nota) => m.acumulado + m.pendiente * nota;

/** Reparte el % de un corte en partes iguales (para crear varias actividades de una vez). */
export function repartirIgual(n) {
  const base = Math.floor((100 / n) * 100) / 100;
  const lista = Array(n).fill(base);
  lista[n - 1] = Math.round((100 - base * (n - 1)) * 100) / 100;
  return lista;
}

/** Ajusta el último peso para que la suma vuelva a ser 100. */
export function autoajustarPesos(pesos) {
  const [a, b] = pesos;
  return [a, b, Math.max(0, Math.round((100 - a - b) * 100) / 100)];
}

export const ETIQUETA_ESTADO = {
  'sin-datos': { texto: 'Sin evaluaciones', color: '#6E7180' },
  aprobada: { texto: 'Aprobada', color: '#17C964' },
  reprobada: { texto: 'Perdida', color: '#E5484D' },
  asegurada: { texto: 'Aprobación asegurada', color: '#17C964' },
  imposible: { texto: 'Ya no alcanza 3.0', color: '#E5484D' },
  riesgo: { texto: 'En riesgo', color: '#F5A524' },
  ok: { texto: 'En camino', color: '#3E7BFA' },
};

export const ETIQUETA_CORTE = {
  'sin-datos': { texto: 'Sin notas', color: '#6E7180' },
  ganado: { texto: 'Corte ganado', color: '#17C964' },
  perdido: { texto: 'Corte perdido', color: '#E5484D' },
  ganando: { texto: 'Vas ganando', color: '#17C964' },
  perdiendo: { texto: 'Vas perdiendo', color: '#E5484D' },
};

/** Une materias, evaluaciones y pesos: una fila por materia (las materias con varios días cuentan una sola vez). */
export function agruparNotas({ materias, evaluaciones, cortes, meta = 3 }) {
  const grupos = materias.filter((m, i) => materias.findIndex((x) => x.nombre === m.nombre) === i);
  return grupos.map((g) => {
    const ids = new Set(materias.filter((x) => x.nombre === g.nombre).map((x) => x.id));
    const evals = evaluaciones.filter((e) => ids.has(e.materia_id));
    const cfg = cortes.find((c) => ids.has(c.materia_id));
    const pesos = cfg ? [cfg.peso1, cfg.peso2, cfg.peso3].map(Number) : PESOS_POR_DEFECTO;
    return { materia: g, ids, evals, cfg, pesos, m: calcularMateria({ evals, pesos, meta }) };
  });
}

export function leerMetaNota() {
  try {
    const v = Number(localStorage.getItem('workversity:meta-nota'));
    return v >= 1 && v <= 5 ? v : 3;
  } catch {
    return 3;
  }
}

/** Etiqueta para una materia: "Vas ganando / Vas perdiendo" mientras no termina; el resultado cuando ya terminó. */
export function etiquetaMateria(m) {
  if (m.final == null && m.hayDatos && (m.estado === 'ok' || m.estado === 'riesgo') && m.ritmo === 'perdiendo') return { texto: 'Vas perdiendo', color: '#E5484D' };
  if (m.final == null && m.hayDatos && m.estado === 'ok' && m.ritmo === 'ganando') return { texto: 'Vas ganando', color: '#17C964' };
  return ETIQUETA_ESTADO[m.estado];
}
