import { describe, it, expect } from 'vitest';
import { crearEvaluador, formatoValor, evaluarTodo, aCSV, aHTMLTabla, pegarTabulado, colNombre, colIndice, parseRef } from '../src/lib/hoja.js';

const v = (celdas, ref) => formatoValor(crearEvaluador(celdas).valor(ref));

describe('hoja de cálculo', () => {
  it('nombres de columnas y referencias', () => {
    expect([colNombre(0), colNombre(25), colNombre(26)]).toEqual(['A', 'Z', 'AA']);
    expect(colIndice('AB')).toBe(27);
    expect(parseRef('$C$12')).toEqual({ col: 2, fila: 11 });
    expect(parseRef('1A')).toBeNull();
  });
  it('números, texto y porcentajes', () => {
    const c = { A1: '10', A2: '2,5', A3: 'hola', A4: '50%' };
    expect([v(c, 'A1'), v(c, 'A2'), v(c, 'A3'), v(c, 'A4'), v(c, 'Z9')]).toEqual(['10', '2.5', 'hola', '0.5', '']);
  });
  it('operaciones con precedencia y paréntesis', () => {
    const c = { A1: '=2+3*4', A2: '=(2+3)*4', A3: '=2^3^2', A4: '=-A1+10', A5: '=10/4', A6: '="Hola "&"mundo"' };
    expect([v(c, 'A1'), v(c, 'A2'), v(c, 'A3'), v(c, 'A4'), v(c, 'A5'), v(c, 'A6')]).toEqual(['14', '20', '512', '-4', '2.5', 'Hola mundo']);
  });
  it('funciones con rangos, en español y en inglés', () => {
    const c = { A1: '4', A2: '3.5', A3: '5', A4: 'texto', B1: '=SUMA(A1:A4)', B2: '=PROMEDIO(A1:A3)', B3: '=MAX(A1:A3)', B4: '=MIN(A1:A3)', B5: '=CONTAR(A1:A4)', B6: '=SUM(A1:A2;10)', B7: '=REDONDEAR(B2;1)', B8: '=SI(B1>10;"alto";"bajo")' };
    expect([v(c, 'B1'), v(c, 'B2'), v(c, 'B3'), v(c, 'B4'), v(c, 'B5'), v(c, 'B6'), v(c, 'B7'), v(c, 'B8')]).toEqual(['12.5', '4.16666667', '5', '3.5', '3', '17.5', '4.2', 'alto']);
  });
  it('errores claros que se propagan', () => {
    const c = { A1: '=1/0', A2: '=A1+1', A3: '=A3', A4: '=B1+B2', B1: '1', B2: 'x', A5: '=NOEXISTE(1)', A6: '=1+', A7: '=SUMA(A1:A2)' };
    expect([v(c, 'A1'), v(c, 'A2'), v(c, 'A3'), v(c, 'A4'), v(c, 'A5'), v(c, 'A6'), v(c, 'A7')]).toEqual(['#DIV/0!', '#DIV/0!', '#CICLO!', '#VALOR!', '#NOMBRE?', '#ERROR!', '#DIV/0!']);
  });
  it('un ciclo entre dos celdas se detecta', () => {
    expect(v({ A1: '=B1', B1: '=A1' }, 'A1')).toBe('#CICLO!');
  });
  it('no ejecuta código: solo entiende fórmulas de la hoja', () => {
    expect(v({ A1: '=alert(1)' }, 'A1')).toBe('#NOMBRE?');
    expect(['#ERROR!', '#NOMBRE?']).toContain(v({ A1: '=constructor.constructor("return 1")()' }, 'A1'));
    expect(v({ A1: '=1;2' }, 'A1')).toBe('#ERROR!');
  });
  it('exporta a CSV y a tabla HTML con los valores calculados', () => {
    const c = { A1: 'Nota', B1: '=2*2', A2: 'Con, coma', B2: '3' };
    expect(aCSV(c, 5, 3)).toBe('Nota,4,\n"Con, coma",3,');
    expect(aHTMLTabla(c, 5, 2)).toContain('<td>4</td>');
    expect(evaluarTodo(c).B1).toBe('4');
  });
  it('pega datos copiados de Excel (tabulaciones)', () => {
    const r = pegarTabulado({ A1: 'viejo' }, 'a\tb\n1\t2\n', 0, 0);
    expect([r.A1, r.B1, r.A2, r.B2]).toEqual(['a', 'b', '1', '2']);
  });
});
