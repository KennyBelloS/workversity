// Motor de la hoja de cálculo (tipo Excel): celdas, fórmulas y exportación. Sin eval: analizador propio y seguro.

export const MAX_FILAS = 200;
export const MAX_COLUMNAS = 26;

export function colNombre(i) {
  let s = '';
  let n = i + 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
export const colIndice = (letras) => letras.toUpperCase().split('').reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0) - 1;
export const nombreCelda = (col, fila) => `${colNombre(col)}${fila + 1}`;
export function parseRef(ref) {
  const m = /^\$?([A-Za-z]{1,2})\$?(\d{1,3})$/.exec(String(ref).trim());
  return m ? { col: colIndice(m[1]), fila: Number(m[2]) - 1 } : null;
}

class ErrHoja extends Error { constructor(codigo) { super(codigo); this.codigo = codigo; } }

function tokenizar(src) {
  const t = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '"') {
      const fin = src.indexOf('"', i + 1);
      if (fin < 0) throw new ErrHoja('#ERROR!');
      t.push({ t: 'str', v: src.slice(i + 1, fin) });
      i = fin + 1;
      continue;
    }
    const resto = src.slice(i);
    let m;
    if ((m = /^\d+(\.\d+)?/.exec(resto))) { t.push({ t: 'num', v: Number(m[0]) }); i += m[0].length; continue; }
    if ((m = /^[A-Za-zÁÉÍÓÚÑáéíóúñ_.]{2,}(?=\()/.exec(resto))) { t.push({ t: 'fn', v: m[0].toUpperCase() }); i += m[0].length; continue; }
    if ((m = /^\$?[A-Za-z]{1,2}\$?\d{1,3}(?![A-Za-z0-9])/.exec(resto))) { t.push({ t: 'ref', v: m[0].replace(/\$/g, '').toUpperCase() }); i += m[0].length; continue; }
    if ((m = /^(<=|>=|<>|[=<>+\-*/^&(),;:])/.exec(resto))) { t.push({ t: 'op', v: m[0] }); i += m[0].length; continue; }
    throw new ErrHoja('#ERROR!');
  }
  return t;
}

const ALIAS = { SUMA: 'SUM', PROMEDIO: 'AVERAGE', CONTAR: 'COUNT', REDONDEAR: 'ROUND', RAIZ: 'SQRT', SI: 'IF', POTENCIA: 'POWER', MAXIMO: 'MAX', MÁXIMO: 'MAX', MINIMO: 'MIN', MÍNIMO: 'MIN' };
export const FUNCIONES = ['SUMA', 'PROMEDIO', 'MAX', 'MIN', 'CONTAR', 'REDONDEAR', 'ABS', 'RAIZ', 'SI', 'POTENCIA'];

export function crearEvaluador(celdas) {
  const memo = new Map();
  const enProceso = new Set();

  function valor(ref) {
    if (memo.has(ref)) return memo.get(ref);
    if (enProceso.has(ref)) return new ErrHoja('#CICLO!');
    enProceso.add(ref);
    let r;
    try { r = calcular(ref); } catch (e) { r = e instanceof ErrHoja ? e : new ErrHoja('#ERROR!'); }
    enProceso.delete(ref);
    memo.set(ref, r);
    return r;
  }

  function calcular(ref) {
    const raw = celdas[ref];
    if (raw == null || String(raw).trim() === '') return null;
    const s = String(raw);
    if (s.startsWith('=')) return evaluarFormula(s.slice(1));
    const limpio = s.trim().replace(/\s/g, '');
    if (/^-?\d+([.,]\d+)?$/.test(limpio)) return Number(limpio.replace(',', '.'));
    if (/^-?\d+([.,]\d+)?%$/.test(limpio)) return Number(limpio.slice(0, -1).replace(',', '.')) / 100;
    return s;
  }

  const dato = (ref) => { const v = valor(ref); if (v instanceof ErrHoja) throw v; return v; };
  const num = (v) => { if (v == null) return 0; if (typeof v === 'number') return v; throw new ErrHoja('#VALOR!'); };

  function rango(a, b) {
    const A = parseRef(a); const B = parseRef(b);
    if (!A || !B) throw new ErrHoja('#REF!');
    const out = [];
    for (let f = Math.min(A.fila, B.fila); f <= Math.max(A.fila, B.fila); f++) for (let c = Math.min(A.col, B.col); c <= Math.max(A.col, B.col); c++) out.push(dato(nombreCelda(c, f)));
    return out;
  }

  function evaluarFormula(src) {
    const tk = tokenizar(src);
    let p = 0;
    const ver = () => tk[p];
    const esOp = (...ops) => ver() && ver().t === 'op' && ops.includes(ver().v);
    const tomar = () => tk[p++];

    function comparacion() {
      let a = suma();
      while (esOp('=', '<', '>', '<=', '>=', '<>')) {
        const op = tomar().v; const b = suma();
        const x = a ?? 0; const y = b ?? 0;
        a = (op === '=' ? x === y : op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : op === '>=' ? x >= y : x !== y) ? 1 : 0;
      }
      return a;
    }
    function suma() {
      let a = producto();
      while (esOp('+', '-', '&')) {
        const op = tomar().v; const b = producto();
        a = op === '&' ? `${a ?? ''}${b ?? ''}` : op === '+' ? num(a) + num(b) : num(a) - num(b);
      }
      return a;
    }
    function producto() {
      let a = potencia();
      while (esOp('*', '/')) {
        const op = tomar().v; const b = potencia();
        if (op === '*') a = num(a) * num(b);
        else { if (num(b) === 0) throw new ErrHoja('#DIV/0!'); a = num(a) / num(b); }
      }
      return a;
    }
    function potencia() {
      const base = unario();
      if (esOp('^')) { tomar(); return Math.pow(num(base), num(potencia())); }
      return base;
    }
    function unario() {
      if (esOp('-')) { tomar(); return -num(unario()); }
      if (esOp('+')) { tomar(); return num(unario()); }
      return primario();
    }
    function primario() {
      const t = tomar();
      if (!t) throw new ErrHoja('#ERROR!');
      if (t.t === 'num' || t.t === 'str') return t.v;
      if (t.t === 'ref') {
        if (esOp(':')) { tomar(); const fin = tomar(); if (!fin || fin.t !== 'ref') throw new ErrHoja('#REF!'); return rango(t.v, fin.v); }
        return dato(t.v);
      }
      if (t.t === 'op' && t.v === '(') { const v = comparacion(); if (!esOp(')')) throw new ErrHoja('#ERROR!'); tomar(); return v; }
      if (t.t === 'fn') {
        tomar(); // "("
        const args = [];
        if (!esOp(')')) {
          args.push(comparacion());
          while (esOp(',', ';')) { tomar(); args.push(comparacion()); }
        }
        if (!esOp(')')) throw new ErrHoja('#ERROR!');
        tomar();
        return funcion(ALIAS[t.v] || t.v, args);
      }
      throw new ErrHoja('#ERROR!');
    }

    const numeros = (args) => args.flat().filter((v) => typeof v === 'number');
    function funcion(nombre, args) {
      const n = numeros(args);
      switch (nombre) {
        case 'SUM': return n.reduce((a, b) => a + b, 0);
        case 'AVERAGE': if (!n.length) throw new ErrHoja('#DIV/0!'); return n.reduce((a, b) => a + b, 0) / n.length;
        case 'MIN': return n.length ? Math.min(...n) : 0;
        case 'MAX': return n.length ? Math.max(...n) : 0;
        case 'COUNT': return n.length;
        case 'ABS': return Math.abs(num(args[0]));
        case 'SQRT': if (num(args[0]) < 0) throw new ErrHoja('#NUM!'); return Math.sqrt(num(args[0]));
        case 'POWER': return Math.pow(num(args[0]), num(args[1]));
        case 'ROUND': { const d = args[1] == null ? 0 : num(args[1]); const f = 10 ** d; return Math.round(num(args[0]) * f) / f; }
        case 'IF': return num(args[0]) ? (args[1] ?? 0) : (args[2] ?? 0);
        default: throw new ErrHoja('#NOMBRE?');
      }
    }

    const resultado = comparacion();
    if (p < tk.length) throw new ErrHoja('#ERROR!');
    return Array.isArray(resultado) ? (() => { throw new ErrHoja('#VALOR!'); })() : resultado;
  }

  return { valor };
}

/** Valor listo para mostrar: números redondeados, errores con su código. */
export function formatoValor(v) {
  if (v == null) return '';
  if (v instanceof ErrHoja) return v.codigo;
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e8) / 1e8);
  return String(v);
}

export function evaluarTodo(celdas) {
  const ev = crearEvaluador(celdas);
  const out = {};
  for (const ref of Object.keys(celdas)) out[ref] = formatoValor(ev.valor(ref));
  return out;
}

export function aCSV(celdas, filas, columnas) {
  const ev = crearEvaluador(celdas);
  const esc = (s) => (/[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lineas = [];
  for (let f = 0; f < filas; f++) {
    const fila = [];
    for (let c = 0; c < columnas; c++) fila.push(esc(formatoValor(ev.valor(nombreCelda(c, f)))));
    lineas.push(fila.join(','));
  }
  while (lineas.length && lineas[lineas.length - 1].replace(/,/g, '') === '') lineas.pop(); // quita filas vacías del final
  return lineas.join('\n');
}

/** Tabla HTML: Excel la abre como hoja de cálculo (.xls). */
export function aHTMLTabla(celdas, filas, columnas) {
  const ev = crearEvaluador(celdas);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let html = '<table border="1">';
  for (let f = 0; f < filas; f++) {
    let fila = '';
    let hay = false;
    for (let c = 0; c < columnas; c++) { const v = formatoValor(ev.valor(nombreCelda(c, f))); if (v !== '') hay = true; fila += `<td>${esc(v)}</td>`; }
    if (hay) html += `<tr>${fila}</tr>`;
  }
  return `${html}</table>`;
}

/** Pega texto copiado de Excel/Sheets (tabulaciones) a partir de una celda. */
export function pegarTabulado(celdas, texto, colInicio, filaInicio) {
  const nuevas = { ...celdas };
  texto.replace(/\r/g, '').split('\n').filter((l, i, a) => l !== '' || i < a.length - 1).forEach((linea, df) => {
    linea.split('\t').forEach((valorCelda, dc) => {
      const c = colInicio + dc; const f = filaInicio + df;
      if (c < MAX_COLUMNAS && f < MAX_FILAS) { if (valorCelda === '') delete nuevas[nombreCelda(c, f)]; else nuevas[nombreCelda(c, f)] = valorCelda; }
    });
  });
  return nuevas;
}
