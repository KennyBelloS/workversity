import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, Check } from 'lucide-react';
import { TRANSACTION_TYPES, CATEGORIAS_GASTO, CATEGORIAS_INGRESO, CATEGORIAS_AHORRO, currencyFormat } from '../../lib/constants';
import { fechaLocalISO } from '../../lib/dateUtils';
import { useCategoriasAhorro } from '../../hooks/useCategoriasAhorro';
import { listarMetas } from '../../services/finanzas';
import SelectorCategoriaAhorro from '../metas/SelectorCategoriaAhorro';
import Hoja from '../ui/Hoja';
import { Frase, Hueco, Gaveta, Opciones } from '../ui/Frase';
import { RAPIDO } from '../../lib/movimiento';

// ---------------------------------------------------------------------------------------------
// Nuevo movimiento, escrito como una frase:
//   "Gasté $ 25.000 en Comida el martes 18."
// El verbo cambia con el tipo (gasté / recibí / guardé), que es lo que hace que suene a algo
// que una persona diría y no a un formulario de banco.
// ---------------------------------------------------------------------------------------------

const CATEGORIAS_POR_TIPO = { gasto: CATEGORIAS_GASTO, ingreso: CATEGORIAS_INGRESO, ahorro: CATEGORIAS_AHORRO };
const VERBO = { gasto: 'Gasté', ingreso: 'Recibí', ahorro: 'Guardé' };
const PREPOSICION = { gasto: 'en', ingreso: 'de', ahorro: 'para' };

/** "hoy", "ayer", "el martes 18" — como lo diría una persona. */
function fechaEnPalabras(yyyymmdd) {
  const d = new Date(`${yyyymmdd}T12:00:00`);
  const hoy = new Date();
  const soloDia = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const dias = Math.round((soloDia(d) - soloDia(hoy)) / 86400000);
  if (dias === 0) return 'hoy';
  if (dias === -1) return 'ayer';
  if (dias === 1) return 'mañana';
  if (dias < 0 && dias > -7) return `el ${d.toLocaleDateString('es-CO', { weekday: 'long' })} pasado`;
  return `el ${d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}`;
}

export default function TransactionModal({ movExistente, onGuardar, onEliminar, onCerrar }) {
  const [type, setType] = useState('gasto');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIAS_GASTO[0]);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(fechaLocalISO());
  const [error, setError] = useState('');
  const [foco, setFoco] = useState(movExistente ? null : 'monto');
  const cat = useCategoriasAhorro();
  const [metas, setMetas] = useState([]);
  useEffect(() => { listarMetas().then(setMetas).catch(() => {}); }, []);

  useEffect(() => {
    if (!movExistente) return;
    setType(movExistente.type);
    setAmount(String(movExistente.amount));
    setCategory(movExistente.category);
    setNote(movExistente.note || '');
    setDate(fechaLocalISO(movExistente.date));
  }, [movExistente]);

  const abrir = (k) => setFoco((f) => (f === k ? null : k));
  const cambiarTipo = (t) => {
    setType(t);
    setCategory(t === 'ahorro' ? cat.todas[0]?.nombre || CATEGORIAS_AHORRO[0] : CATEGORIAS_POR_TIPO[t][0]);
  };
  const info = TRANSACTION_TYPES[type];
  const monto = Number(amount);
  const metasDestino = metas.filter((m) => m.categoria_vinculada === category);

  const guardar = () => {
    if (!monto || monto <= 0) { setError('Falta el monto.'); setFoco('monto'); return; }
    onGuardar({
      ...(movExistente || {}),
      type,
      amount: monto,
      category,
      note: note.trim(),
      // Mediodía local: evita que el día se corra por la zona horaria.
      date: new Date(`${date}T12:00:00`).toISOString(),
    });
  };

  return (
    <Hoja
      abierta
      onCerrar={onCerrar}
      rotulo={movExistente ? 'Editar movimiento' : 'Nuevo movimiento'}
      titulo={movExistente ? 'Cambia lo que necesites' : 'Dímelo en una frase'}
      ancho="34rem"
      acciones={
        <motion.button type="button" onClick={guardar} whileTap={{ scale: 0.96 }} transition={RAPIDO} className="boton-ppal">
          <Check size={15} strokeWidth={2.2} /> Guardar
        </motion.button>
      }
    >
      <Frase>
        <Hueco campo="tipo de movimiento" activo={foco === 'tipo'} color={info?.color} onClick={() => abrir('tipo')}>{VERBO[type]}</Hueco>
        {' '}
        <Hueco campo="monto" activo={foco === 'monto'} vacio={!monto} color={info?.color} onClick={() => abrir('monto')}>
          {monto ? currencyFormat.format(monto) : 'cuánto'}
        </Hueco>
        {` ${PREPOSICION[type]} `}
        <Hueco campo="categoría" activo={foco === 'categoria'} onClick={() => abrir('categoria')}>{category}</Hueco>
        {' '}
        <Hueco campo="fecha" activo={foco === 'fecha'} onClick={() => abrir('fecha')}>{fechaEnPalabras(date)}</Hueco>.
      </Frase>

      {note && (
        <Frase className="frase--chica mt-2">
          <Hueco campo="nota" activo={foco === 'nota'} onClick={() => abrir('nota')}>{note}</Hueco>
        </Frase>
      )}

      {error && <p className="mt-3 text-t-pie text-danger" role="alert">{error}</p>}
      {type === 'ahorro' && metasDestino.length > 0 && (
        <p className="mt-3 text-t-pie text-success">Esto suma a: {metasDestino.map((m) => m.title).join(' · ')}</p>
      )}

      <Gaveta clave={foco} titulo={{
        tipo: '¿Qué clase de movimiento es?',
        monto: '¿De cuánto?',
        categoria: type === 'ahorro' ? '¿A dónde va este ahorro?' : '¿De qué categoría?',
        fecha: '¿Cuándo fue?',
        nota: 'Nota',
      }[foco] || ''}>
        {foco === 'tipo' && (
          <Opciones
            aria="Tipo de movimiento" valor={type} onElegir={(v) => { cambiarTipo(v); setFoco('monto'); }}
            opciones={Object.entries(TRANSACTION_TYPES).map(([id, i]) => ({ id, titulo: i.label, color: i.color }))}
          />
        )}

        {foco === 'monto' && (
          <>
            <input
              data-autofoco
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setFoco('categoria'); } }}
              placeholder="25000"
              className="campo-frase !text-2xl"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {[5000, 10000, 20000, 50000].map((v) => (
                <button key={v} type="button" onClick={() => setAmount(String(v))} className="boton-secundario !py-1.5 !text-t-micro">
                  {currencyFormat.format(v)}
                </button>
              ))}
            </div>
          </>
        )}

        {foco === 'categoria' && (
          type === 'ahorro' ? (
            <>
              <SelectorCategoriaAhorro value={category} onChange={setCategory} cat={cat} />
              <p className="mt-2 text-t-micro text-textSecondary">
                {metasDestino.length > 0
                  ? `Cuenta para: ${metasDestino.map((m) => m.title).join(' · ')}`
                  : 'Ninguna meta usa esta categoría todavía. Puedes crear una en Metas.'}
              </p>
            </>
          ) : (
            <Opciones
              aria="Categoría" columnas={3} valor={category}
              onElegir={(v) => { setCategory(v); setFoco(null); }}
              opciones={CATEGORIAS_POR_TIPO[type].map((c) => ({ id: c, titulo: c }))}
            />
          )
        )}

        {foco === 'fecha' && (
          <>
            <Opciones
              aria="Fecha" columnas={3} valor={date}
              onElegir={(v) => { setDate(v); setFoco(null); }}
              opciones={[0, -1, -2].map((d) => {
                const x = new Date(); x.setDate(x.getDate() + d);
                return { id: fechaLocalISO(x), titulo: d === 0 ? 'Hoy' : d === -1 ? 'Ayer' : 'Antier' };
              })}
            />
            <label className="mt-4 block">
              <span className="rotulo">O una fecha exacta</span>
              <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="campo-frase mt-1.5" />
            </label>
          </>
        )}

        {foco === 'nota' && (
          <input
            data-autofoco
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setFoco(null); } }}
            placeholder="Almuerzo con Laura, recarga del bus…"
            className="campo-frase"
          />
        )}
      </Gaveta>

      <div className="mt-5 flex items-center gap-2 border-t border-[rgb(var(--linea)/.08)] pt-4">
        {!note && (
          <button type="button" onClick={() => abrir('nota')} className={`boton-secundario ${foco === 'nota' ? '!text-primary' : ''}`}>
            Agregar una nota
          </button>
        )}
        {movExistente && (
          <button type="button" onClick={() => onEliminar(movExistente)} aria-label="Eliminar movimiento" className="boton-secundario ml-auto !px-3 !text-danger">
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </Hoja>
  );
}
