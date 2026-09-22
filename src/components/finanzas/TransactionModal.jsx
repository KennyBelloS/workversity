import { useEffect, useState } from 'react';
import { useEscape } from '../../hooks/useEscape';
import { X, Trash2 } from 'lucide-react';
import { TRANSACTION_TYPES, CATEGORIAS_GASTO, CATEGORIAS_INGRESO, CATEGORIAS_AHORRO } from '../../lib/constants';
import { fechaLocalISO } from '../../lib/dateUtils';
import { useCategoriasAhorro } from '../../hooks/useCategoriasAhorro';
import { listarMetas } from '../../services/finanzas';
import SelectorCategoriaAhorro from '../metas/SelectorCategoriaAhorro';

const CATEGORIAS_POR_TIPO = {
  gasto: CATEGORIAS_GASTO,
  ingreso: CATEGORIAS_INGRESO,
  ahorro: CATEGORIAS_AHORRO,
};

export default function TransactionModal({ movExistente, onGuardar, onEliminar, onCerrar }) {
  useEscape(onCerrar);
  const [type, setType] = useState('gasto');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIAS_GASTO[0]);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(fechaLocalISO());
  const [error, setError] = useState('');
  const cat = useCategoriasAhorro();
  const [metas, setMetas] = useState([]);
  useEffect(() => { listarMetas().then(setMetas).catch(() => {}); }, []);

  useEffect(() => {
    if (movExistente) {
      setType(movExistente.type);
      setAmount(String(movExistente.amount));
      setCategory(movExistente.category);
      setNote(movExistente.note || '');
      setDate(fechaLocalISO(movExistente.date));
    }
  }, [movExistente]);

  const cambiarTipo = (t) => {
    setType(t);
    setCategory(t === 'ahorro' ? cat.todas[0]?.nombre || CATEGORIAS_AHORRO[0] : CATEGORIAS_POR_TIPO[t][0]);
  };

  const guardar = () => {
    const monto = Number(amount);
    if (!monto || monto <= 0) return setError('Escribe un monto válido');
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-lg2 bg-bg sm:rounded-lg2">
        <div className="sticky top-0 flex items-center justify-between bg-bg px-5 py-4">
          <h2 className="text-lg font-extrabold">{movExistente ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>
          <button onClick={onCerrar} className="rounded-full p-1.5 hover:bg-black/5"><X size={20} /></button>
        </div>

        <div className="space-y-3 px-5 pb-8">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(TRANSACTION_TYPES).map(([key, info]) => (
              <button
                key={key}
                onClick={() => cambiarTipo(key)}
                className="rounded-sm2 border py-2.5 text-xs font-bold"
                style={{ borderColor: type === key ? info.color : 'rgba(0,0,0,0.08)', backgroundColor: type === key ? `${info.color}24` : 'transparent', color: type === key ? info.color : '#6E7180' }}
              >
                {info.label}
              </button>
            ))}
          </div>

          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Monto"
            className="w-full rounded-sm2 bg-white px-4 py-3 text-lg font-bold shadow-card outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-xs font-semibold text-danger">{error}</p>}

          {type === 'ahorro' ? (
            <div>
              <p className="mb-1 text-xs font-semibold text-textSecondary">¿A dónde va este ahorro?</p>
              <SelectorCategoriaAhorro value={category} onChange={setCategory} cat={cat} />
              {(() => {
                const destino = metas.filter((m) => m.categoria_vinculada === category);
                return destino.length > 0
                  ? <p className="mt-1.5 text-[11px] font-semibold text-success">🎯 Cuenta para: {destino.map((m) => m.title).join(' · ')}</p>
                  : <p className="mt-1.5 text-[11px] font-semibold text-textSecondary">Ninguna meta usa esta categoría todavía (puedes crear una en Metas).</p>;
              })()}
            </div>
          ) : (
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none">
              {CATEGORIAS_POR_TIPO[type].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none" />

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota (opcional)"
            rows={2}
            className="w-full rounded-sm2 bg-white px-4 py-3 text-sm shadow-card outline-none"
          />

          <div className="flex gap-3 pt-1">
            {movExistente && (
              <button onClick={() => onEliminar(movExistente)} className="flex items-center justify-center gap-2 rounded-sm2 border border-danger/30 px-4 py-3.5 text-sm font-bold text-danger">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={guardar} className="flex-1 rounded-sm2 bg-primary py-3.5 text-sm font-bold text-white hover:bg-primaryDark">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
