import { useMemo, useRef, useState } from 'react';
import { Plus, Sigma, Download, Eraser } from 'lucide-react';
import { crearEvaluador, formatoValor, nombreCelda, colNombre, aCSV, aHTMLTabla, pegarTabulado, MAX_FILAS, MAX_COLUMNAS, FUNCIONES } from '../../lib/hoja';
import { descargarArchivo, nombreSeguro } from '../../lib/exportar';
import { ETIQUETA_ESTADO_DOC } from '../../hooks/useDocumento';

const cargar = (json) => {
  try { const h = JSON.parse(json); return { celdas: h.celdas || {}, filas: Math.min(MAX_FILAS, h.filas || 25), columnas: Math.min(MAX_COLUMNAS, h.columnas || 8) }; } catch { return { celdas: {}, filas: 25, columnas: 8 }; }
};

/** Hoja de cálculo tipo Excel: fórmulas (=SUMA, =PROMEDIO, =SI…), teclado, pegar desde Excel y exportar. */
export default function EditorHoja({ inicial, onCambio, estado, titulo }) {
  const [hoja, setHoja] = useState(() => cargar(inicial));
  const [sel, setSel] = useState({ col: 0, fila: 0 });
  const [edicion, setEdicion] = useState(null);
  const [origen, setOrigen] = useState('celda');
  const cont = useRef(null);
  const ev = useMemo(() => crearEvaluador(hoja.celdas), [hoja.celdas]);
  const ref = nombreCelda(sel.col, sel.fila);
  const crudo = hoja.celdas[ref] ?? '';

  const guardar = (nueva) => { setHoja(nueva); onCambio(JSON.stringify(nueva)); };
  const poner = (r, valor) => { const celdas = { ...hoja.celdas }; if (valor === '') delete celdas[r]; else celdas[r] = valor; guardar({ ...hoja, celdas }); };
  const mover = (dc, df) => setSel((s) => ({ col: Math.max(0, Math.min(hoja.columnas - 1, s.col + dc)), fila: Math.max(0, Math.min(hoja.filas - 1, s.fila + df)) }));
  const comprometer = (dc = 0, df = 1) => { if (edicion !== null) poner(ref, edicion); setEdicion(null); mover(dc, df); cont.current?.focus(); };
  const empezar = (texto) => { setOrigen('celda'); setEdicion(texto); };

  const alTeclado = (e) => {
    if (edicion !== null) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); mover(0, 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mover(0, -1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1, 0); }
    else if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) { e.preventDefault(); mover(1, 0); }
    else if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); mover(-1, 0); }
    else if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); empezar(crudo); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); poner(ref, ''); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); empezar(e.key); }
  };
  const alPegar = (e) => {
    const t = e.clipboardData.getData('text/plain');
    if (edicion !== null || !/[\t\n]/.test(t)) return;
    e.preventDefault();
    guardar({ ...hoja, celdas: pegarTabulado(hoja.celdas, t, sel.col, sel.fila) });
  };

  const sumaAutomatica = () => {
    let f = sel.fila - 1;
    while (f >= 0 && typeof ev.valor(nombreCelda(sel.col, f)) === 'number') f--;
    if (f < sel.fila - 1) { poner(ref, `=SUMA(${nombreCelda(sel.col, f + 1)}:${nombreCelda(sel.col, sel.fila - 1)})`); return; }
    let c = sel.col - 1;
    while (c >= 0 && typeof ev.valor(nombreCelda(c, sel.fila)) === 'number') c--;
    if (c < sel.col - 1) poner(ref, `=SUMA(${nombreCelda(c + 1, sel.fila)}:${nombreCelda(sel.col - 1, sel.fila)})`);
  };
  const nombre = nombreSeguro(titulo);
  const boton = 'flex items-center gap-1 rounded-full bg-bg px-2.5 py-1.5 text-[11px] font-bold text-textSecondary hover:text-primary';

  return (
    <div className="flex h-full min-h-[24rem] flex-col rounded-md2 bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-black/5 px-3 py-2">
        <button onClick={sumaAutomatica} className={boton} title="Suma lo de arriba (o de la izquierda)"><Sigma size={13} /> Suma automática</button>
        <select aria-label="Insertar función" value="" onChange={(e) => { if (e.target.value) { empezar(`=${e.target.value}(`); } }} className="rounded-full bg-bg px-2.5 py-1.5 text-[11px] font-bold text-textSecondary outline-none">
          <option value="">ƒx Funciones</option>{FUNCIONES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <button onClick={() => guardar({ ...hoja, filas: Math.min(MAX_FILAS, hoja.filas + 5) })} className={boton}><Plus size={13} /> 5 filas</button>
        <button onClick={() => guardar({ ...hoja, columnas: Math.min(MAX_COLUMNAS, hoja.columnas + 1) })} className={boton}><Plus size={13} /> Columna</button>
        <button onClick={() => poner(ref, '')} className={boton}><Eraser size={13} /> Borrar celda</button>
        <span className="ml-auto text-[11px] font-semibold text-textSecondary">{ETIQUETA_ESTADO_DOC[estado] || ''}</span>
      </div>

      <div className="flex items-center gap-2 border-b border-black/5 px-3 py-1.5">
        <span className="w-10 shrink-0 rounded bg-bg px-1.5 py-1 text-center text-[11px] font-extrabold">{ref}</span>
        <span className="text-sm font-bold text-textSecondary">ƒx</span>
        <input
          value={edicion ?? crudo} aria-label="Barra de fórmulas"
          onFocus={() => { if (edicion === null) { setOrigen('barra'); setEdicion(crudo); } }}
          onChange={(e) => { setOrigen('barra'); setEdicion(e.target.value); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); comprometer(); } if (e.key === 'Escape') { setEdicion(null); cont.current?.focus(); } }}
          onBlur={() => { if (origen === 'barra' && edicion !== null) { poner(ref, edicion); setEdicion(null); } }}
          placeholder="Escribe un valor o una fórmula, por ejemplo =SUMA(A1:A5)" className="min-w-0 flex-1 rounded bg-transparent px-2 py-1 text-sm outline-none focus:bg-primarySoft/50"
        />
      </div>

      <div ref={cont} tabIndex={0} onKeyDown={alTeclado} onPaste={alPegar} role="grid" aria-label="Hoja de cálculo" className="min-h-0 flex-1 overflow-auto outline-none">
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 h-7 w-10 border-b border-r border-black/10 bg-bg" />
              {Array.from({ length: hoja.columnas }, (_, c) => <th key={c} className={`sticky top-0 z-10 h-7 min-w-[6.5rem] border-b border-r border-black/10 bg-bg text-[11px] font-extrabold ${c === sel.col ? 'text-primary' : 'text-textSecondary'}`}>{colNombre(c)}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: hoja.filas }, (_, f) => (
              <tr key={f}>
                <th className={`sticky left-0 z-10 h-7 border-b border-r border-black/10 bg-bg text-[11px] font-extrabold ${f === sel.fila ? 'text-primary' : 'text-textSecondary'}`}>{f + 1}</th>
                {Array.from({ length: hoja.columnas }, (_, c) => {
                  const r = nombreCelda(c, f);
                  const v = ev.valor(r);
                  const texto = formatoValor(v);
                  const activa = c === sel.col && f === sel.fila;
                  const error = typeof texto === 'string' && texto.startsWith('#') && typeof v === 'object' && v !== null;
                  return (
                    <td key={c} role="gridcell" aria-selected={activa} onClick={() => { setSel({ col: c, fila: f }); if (edicion !== null && !(activa)) { poner(ref, edicion); setEdicion(null); } cont.current?.focus(); }} onDoubleClick={() => empezar(hoja.celdas[r] ?? '')}
                      className={`relative h-7 min-w-[6.5rem] max-w-[14rem] cursor-cell truncate border-b border-r border-black/10 px-2 ${typeof v === 'number' ? 'text-right tabular-nums' : ''} ${error ? 'font-bold text-danger' : ''} ${activa ? 'z-[5] outline outline-2 -outline-offset-1 outline-primary' : ''}`}>
                      {activa && edicion !== null && origen === 'celda'
                        ? <input autoFocus value={edicion} onChange={(e) => setEdicion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); comprometer(0, 1); } else if (e.key === 'Tab') { e.preventDefault(); comprometer(e.shiftKey ? -1 : 1, 0); } else if (e.key === 'Escape') { setEdicion(null); cont.current?.focus(); } }} aria-label={`Celda ${r}`} className="absolute inset-0 w-full bg-white px-2 text-sm outline-none" />
                        : (activa && edicion !== null ? edicion : texto)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-black/5 px-3 py-2 text-[11px] text-textSecondary">
        <span>Escribe sobre una celda · Enter/Tab para moverte · pega desde Excel</span>
        <span className="ml-auto flex gap-1">
          <button onClick={() => descargarArchivo(`${nombre}.csv`, `\ufeff${aCSV(hoja.celdas, hoja.filas, hoja.columnas)}`, 'text/csv')} className={boton}><Download size={12} /> CSV</button>
          <button onClick={() => descargarArchivo(`${nombre}.xls`, `<html><head><meta charset="utf-8"></head><body>${aHTMLTabla(hoja.celdas, hoja.filas, hoja.columnas)}</body></html>`, 'application/vnd.ms-excel')} className={boton}><Download size={12} /> Excel (.xls)</button>
        </span>
      </div>
    </div>
  );
}
